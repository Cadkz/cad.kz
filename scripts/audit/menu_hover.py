"""Сценарий наведения на «Каталог» в шапке: сдвиг строки, размер мегаменю, прокрутка вбок, уход мыши.
Запуск: python3 scripts/audit/menu_hover.py http://localhost:3000
Норма: сдвиг 0 px, прокрутки вбок нет, низ мегаменю < высоты экрана, по пути вниз в меню оно
не закрывается, после ухода мыши на поиск — закрывается."""
import sys
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:3000'
OPEN = "() => document.getElementById('nav-catalog') !== null"
SHIFT = "() => document.querySelector('header input[type=search]').getBoundingClientRect().left"
OVERFLOW = "() => document.documentElement.scrollWidth - document.documentElement.clientWidth"
SIZE = """() => { const m = document.getElementById('nav-catalog'); if (!m) return null;
  const r = m.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), vh: innerHeight } }"""

with sync_playwright() as p:
    br = p.chromium.launch()
    for width, height in [(1440, 900), (1200, 800), (960, 700), (1440, 700)]:
        pg = br.new_page(viewport={'width': width, 'height': height})
        pg.goto(BASE + '/news', wait_until='networkidle')
        cat = pg.get_by_role('button', name='Каталог').bounding_box()
        before = pg.evaluate(SHIFT)
        pg.mouse.move(cat['x'] + 10, cat['y'] + cat['height'] / 2)
        pg.wait_for_timeout(400)
        opened = pg.evaluate(OPEN)
        shift = round(pg.evaluate(SHIFT) - before, 1)
        overflow = pg.evaluate(OVERFLOW)
        size = pg.evaluate(SIZE)
        # Вниз в мегаменю: по дороге через промежуток меню не закрывается.
        pg.mouse.move(cat['x'] + 10, cat['y'] + cat['height'] + 60, steps=12)
        pg.wait_for_timeout(400)
        still = pg.evaluate(OPEN)
        # Мышь ушла на поле поиска выше меню — через 200 мс меню закрывается.
        field = pg.locator('header input[type=search]').bounding_box()
        pg.mouse.move(field['x'] + field['width'] - 20, field['y'] + 10, steps=6)
        pg.wait_for_timeout(500)
        closed = not pg.evaluate(OPEN)
        print(f'{width}x{height}: открылось {opened}; сдвиг {shift} px; вбок {overflow} px; '
              f'мегаменю {size}; в меню открыто {still}; ушёл — закрыто {closed}')
        pg.close()
    br.close()
