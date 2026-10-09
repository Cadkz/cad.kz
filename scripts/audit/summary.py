"""Короткая сводка по файлу site_audit.py: python3 scripts/audit/summary.py audit.json"""
import collections, json, sys

d = json.load(open(sys.argv[1]))
R = d['results']
axe = collections.Counter(v['id'] for r in R for v in (r.get('axe') or []))
print('прогонов', len(R))
print('ошибки консоли', [(r['path'], r['width'], r['console'] + r['pageerrors']) for r in R
                          if (r['console'] or r['pageerrors']) and r['status'] != 404])
print('горизонтальная прокрутка', [(r['path'], r['width'], r['overflowEls']) for r in R if r['scrollW'] > r['clientW']])
print('CLS > 0.1', [(r['path'], r['width'], r['vitals']['cls']) for r in R if r['vitals']['cls'] > 0.1])
print('LCP > 2500 на 390', [(r['path'], r['vitals']['lcp']) for r in R if r['width'] == 390 and r['vitals']['lcp'] > 2500])
print('доступность (axe)', dict(axe))
print('без canonical', sorted({r['path'] for r in R if not r['canonical']}))
print('без og:image', sorted({r['path'] for r in R if not r['ogImage']}))
print('битые ссылки', [u for u, s in d['links'].items() if s != 200])
