"""Скан Artec -> GLB для «Примеров сканов» (28.10.2026): гладкие нормали, до 4 млн треугольников.

Использование: python3 -I scripts/artec-scan-model.py <вход .obj/.ply/.stl> <выход-raw.glb> 4000000
затем: npx @gltf-transform/cli@4 draco <выход-raw.glb> public/models/scans/<id>.glb --method edgebreaker
  --quantize-position 14 --quantize-normal 10 --encode-speed 0 --decode-speed 5
Сетка центрируется и масштабируется: самый длинный размер = 1 м. Нужны trimesh, fast-simplification.
"""
import sys
import time

import numpy as np
import trimesh

src, dst, limit = sys.argv[1], sys.argv[2], int(sys.argv[3])
t = time.time()


def load_binary_ply(path):
    # Большие PLY Artec (10 млн треугольников) trimesh не переваривает в 7 ГБ памяти — читаем сами.
    with open(path, 'rb') as fh:
        nv = nf = 0
        while True:
            line = fh.readline().decode('ascii').strip()
            if line.startswith('element vertex'):
                nv = int(line.split()[-1])
            elif line.startswith('element face'):
                nf = int(line.split()[-1])
            elif line == 'end_header':
                break
        verts = np.fromfile(fh, dtype='<f4', count=nv * 3).reshape(-1, 3)
        faces = np.fromfile(fh, dtype=[('n', 'u1'), ('i', '<i4', 3)], count=nf)
    assert (faces['n'] == 3).all()
    return trimesh.Trimesh(verts, faces['i'].astype(np.int64), process=False)


with open(src, 'rb') as probe:
    head = probe.read(300)
if src.lower().endswith('.ply') and b'binary_little_endian' in head and b'property float x' in head and b'vertex_indices' in head and b'property float nx' not in head:
    mesh = load_binary_ply(src)
else:
    mesh = trimesh.load(src, force='mesh', process=False, skip_materials=True)
mesh.merge_vertices()
mesh.update_faces(mesh.nondegenerate_faces())
mesh.remove_unreferenced_vertices()
print('загружено', len(mesh.vertices), 'вершин', len(mesh.faces), 'треугольников', f'{time.time()-t:.0f} с')

if len(mesh.faces) > limit:
    import fast_simplification

    v, f = fast_simplification.simplify(
        mesh.vertices.astype(np.float32), mesh.faces, target_reduction=1 - limit / len(mesh.faces)
    )
    mesh = trimesh.Trimesh(v, f, process=False)
    mesh.merge_vertices()
    print('упрощено до', len(mesh.faces))

lo, hi = mesh.bounds
mesh.apply_translation(-(lo + hi) / 2)
mesh.apply_scale(1 / float((hi - lo).max()))
# Гладкие нормали по вершинам: без них каждый треугольник светится плоской гранью.
normals = mesh.vertex_normals.astype(np.float32)
out = trimesh.Trimesh(mesh.vertices.astype(np.float32), mesh.faces, vertex_normals=normals, process=False)
# Один светло-серый материал, как у прежних файлов: читается на тёмно-синем фоне.
material = trimesh.visual.material.PBRMaterial(
    baseColorFactor=[128, 138, 150, 255], roughnessFactor=0.6, metallicFactor=0.15
)
out.visual = trimesh.visual.TextureVisuals(material=material)
out.export(dst, include_normals=True)
print('готово', dst, f'{time.time()-t:.0f} с')
