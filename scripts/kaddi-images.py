"""Обработка поз Кадди из исходников ChatGPT (правила — docs/DESIGN.md, «Иконки и изображения»).

Запуск: python3 scripts/kaddi-images.py <папка с исходниками>
Нужны Pillow, numpy, scipy. Исходники 1254 × 1254 с прозрачным фоном: kaddi-<поза>.png
и, если есть, kaddi-<поза>-closed.png (те же контуры, глаза закрыты).

Что делает с каждой позой из POSES:
1. Убирает мелкий мусор: оставляет фигуру (непрозрачность > 40, куски от 150 px)
   и её сглаженный край в 4 px вокруг, остальное — прозрачное.
2. Обрезает по фигуре с полем 12 px и уменьшает вдвое (с учётом прозрачности, без светлой каймы).
3. Слой моргания: из картинки с закрытыми глазами берутся только места, где она отличается
   от открытой (глаза, у некоторых поз и брови), по прямоугольникам с растушёвкой 10 px.
4. mirror: отражает позу (смотрит влево — для места справа от текста), надпись на жилете
   переносится незеркальной.
5. Голову для шапки чата (kaddi-head) вырезает из neutral квадратом 256 px.

Готовые файлы — public/images/mascot/kaddi-<поза>.png и kaddi-<поза>-blink.png.
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as nd

OUT = Path(__file__).resolve().parent.parent / 'public' / 'images' / 'mascot'

# поза: отражать ли (True — смотрит влево, стоит справа от текста)
POSES = {
    'neutral': False,
    'search': True,
    'think': False,
    'laptop': False,
    'greeting': False,
    # 13.10.2026: буханка (Кадди-консультант в углу) и её «машет лапой», недовольный (часто
    # дёргают чат), в нитках (запутались в комплектациях), играет с клубком (в запасе).
    'loaf': False,
    'loaf-wave': False,
    'grumpy': False,
    'tangled': False,
    'yarn': False,
}

MARGIN = 12  # поле вокруг фигуры в исходных px
FEATHER = 20  # растушёвка слоя глаз в исходных px = 10 px в готовой картинке
EYE_PAD = 6  # запас вокруг найденного отличия глаз
HEAD = 256  # сторона головы для чата


def load(path: Path) -> np.ndarray:
    return np.array(Image.open(path).convert('RGBA')).astype(np.float32)


def figure_mask(rgba: np.ndarray) -> np.ndarray:
    """Где фигура: плотные куски от 150 px и сглаженный край в 4 px вокруг них."""
    solid = rgba[:, :, 3] > 40
    labels, count = nd.label(solid, structure=np.ones((3, 3)))
    sizes = nd.sum(solid, labels, range(1, count + 1))
    keep = np.isin(labels, [i + 1 for i, s in enumerate(sizes) if s >= 150])
    return nd.binary_dilation(keep, iterations=4)


def eye_mask(opened: np.ndarray, closed: np.ndarray, mask: np.ndarray) -> np.ndarray:
    """Прямоугольники, где закрытые глаза отличаются от открытых, с растушёвкой."""
    both = (opened[:, :, 3] > 200) & (closed[:, :, 3] > 200) & mask
    diff = (np.abs(opened[:, :, :3] - closed[:, :, :3]).max(2) > 60) & both
    diff = nd.binary_opening(diff, iterations=2)
    labels, count = nd.label(nd.binary_dilation(diff, iterations=8))
    sizes = nd.sum(diff, labels, range(1, count + 1))
    h, w = diff.shape
    rects = np.zeros((h, w), bool)
    for size, box in zip(sizes, nd.find_objects(labels)):
        if size < 300:
            continue
        y0, y1 = max(box[0].start - EYE_PAD, 0), min(box[0].stop + EYE_PAD, h)
        x0, x1 = max(box[1].start - EYE_PAD, 0), min(box[1].stop + EYE_PAD, w)
        rects[y0:y1, x0:x1] = True
    # 1 внутри прямоугольников, дальше линейно до 0 на расстоянии FEATHER
    dist = nd.distance_transform_edt(~rects)
    return np.clip(1 - dist / FEATHER, 0, 1)


def clean(rgba: np.ndarray, mask: np.ndarray) -> np.ndarray:
    out = rgba.copy()
    out[:, :, 3] *= mask
    return out


def halve(rgba: np.ndarray) -> Image.Image:
    """Уменьшить вдвое с учётом прозрачности (без светлой каймы по краю)."""
    a = rgba[:, :, 3:4] / 255
    pre = np.concatenate([rgba[:, :, :3] * a, rgba[:, :, 3:4]], axis=2)
    h, w = pre.shape[:2]
    small = np.stack(
        [
            np.array(
                Image.fromarray(pre[:, :, i].astype(np.float32), mode='F').resize(
                    (w // 2, h // 2), Image.Resampling.LANCZOS
                )
            )
            for i in range(4)
        ],
        axis=2,
    )
    alpha = np.clip(small[:, :, 3], 0, 255)
    safe = np.where(alpha > 0, alpha / 255, 1)
    rgb = np.clip(small[:, :, :3] / safe[:, :, None], 0, 255)
    rgb[alpha <= 0.5] = 0
    return Image.fromarray(np.dstack([rgb, alpha]).round().astype(np.uint8), 'RGBA')


def vest_text_box(rgba: np.ndarray) -> tuple[int, int, int, int]:
    """Надпись и знак на жилете: светлые пиксели, со всех сторон окружённые тёмно-синим."""
    r, g, b, a = (rgba[:, :, i] for i in range(4))
    navy = (a > 200) & (b > r + 25) & (r < 90) & (b < 170)
    navy_share = nd.uniform_filter(navy.astype(np.float32), size=41)
    light = (a > 200) & (np.minimum(np.minimum(r, g), b) > 150) & (navy_share > 0.55)
    labels, count = nd.label(nd.binary_dilation(light, iterations=10))
    sizes = nd.sum(light, labels, range(1, count + 1))
    biggest = int(np.argmax(sizes)) + 1
    ys, xs = np.nonzero(labels == biggest)
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def mirror(rgba: np.ndarray, extra: list[np.ndarray]) -> tuple[np.ndarray, list[np.ndarray]]:
    """Отразить картинку; надпись на жилете вернуть незеркальной (с растушёвкой края заплатки)."""
    x0, y0, x1, y1 = vest_text_box(rgba)
    pad = 6
    x0, y0, x1, y1 = x0 - pad, y0 - pad, x1 + pad, y1 + pad
    w = rgba.shape[1]
    flipped = rgba[:, ::-1].copy()
    patch = rgba[y0:y1, x0:x1]
    nx0 = w - x1
    ph, pw = patch.shape[:2]
    inner = np.zeros((ph, pw), bool)
    inner[pad:-pad, pad:-pad] = True
    weight = np.clip(1 - nd.distance_transform_edt(~inner) / pad, 0, 1)[:, :, None]
    region = flipped[y0:y1, nx0 : nx0 + pw]
    flipped[y0:y1, nx0 : nx0 + pw] = patch * weight + region * (1 - weight)
    print(f'    надпись на жилете: {x0},{y0}–{x1},{y1}')
    return flipped, [e[:, ::-1].copy() for e in extra]


def crop_box(mask: np.ndarray) -> tuple[int, int, int, int]:
    ys, xs = np.nonzero(mask)
    h, w = mask.shape
    x0, y0 = max(xs.min() - MARGIN, 0), max(ys.min() - MARGIN, 0)
    x1, y1 = min(xs.max() + 1 + MARGIN, w), min(ys.max() + 1 + MARGIN, h)
    # чётные размеры, чтобы уменьшение вдвое было точным
    return x0, y0, x1 - (x1 - x0) % 2, y1 - (y1 - y0) % 2


def save(img: Image.Image, name: str) -> None:
    path = OUT / name
    img.save(path, optimize=True)
    print(f'    {name}: {img.width} × {img.height}, {path.stat().st_size // 1024} КБ')


def head(full: np.ndarray, blink: np.ndarray, eyes: np.ndarray) -> None:
    """Голова для шапки чата: квадрат по глазам, как прежняя kaddi-head (глаза на 56 % высоты)."""
    ys, xs = np.nonzero(eyes > 0.99)
    side = int(round((xs.max() - xs.min()) / 0.73))
    cx, cy = (xs.max() + xs.min()) / 2, (ys.max() + ys.min()) / 2
    x0, y0 = int(round(cx - side / 2)), int(round(cy - 0.56 * side))
    box = (x0, y0, x0 + side, y0 + side)
    for arr, name in ((full, 'kaddi-head.png'), (blink, 'kaddi-head-blink.png')):
        img = halve(arr)  # уменьшение с учётом прозрачности, затем до 256
        small = (box[0] // 2, box[1] // 2, (box[0] + side) // 2, (box[1] + side) // 2)
        save(img.crop(small).resize((HEAD, HEAD), Image.Resampling.LANCZOS), name)


def process(src: Path, pose: str, flip: bool) -> None:
    print(pose)
    opened = load(src / f'kaddi-{pose}.png')
    closed_path = src / f'kaddi-{pose}-closed.png'
    mask = figure_mask(opened)
    opened = clean(opened, mask)
    blink = None
    if closed_path.exists():
        closed = load(closed_path)
        eyes = eye_mask(opened, closed, mask)
        blink = clean(closed, mask)
        blink[:, :, 3] *= eyes
    if flip:
        opened, rest = mirror(opened, [blink] if blink is not None else [])
        mask = mask[:, ::-1]
        blink = rest[0] if rest else None
    x0, y0, x1, y1 = crop_box(mask)
    save(halve(opened[y0:y1, x0:x1]), f'kaddi-{pose}.png')
    if blink is not None:
        save(halve(blink[y0:y1, x0:x1]), f'kaddi-{pose}-blink.png')
    if pose == 'neutral' and blink is not None:
        head(opened, blink, eyes)


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit('Укажите папку с исходниками: python3 scripts/kaddi-images.py <папка>')
    src = Path(sys.argv[1])
    for pose, flip in POSES.items():
        if (src / f'kaddi-{pose}.png').exists():
            process(src, pose, flip)


if __name__ == '__main__':
    main()
