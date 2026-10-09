"""Сценарий наведения на главное меню: сдвиг пунктов, мигание, размер мегаменю, прокрутка.
Запуск: python3 scripts/audit/menu_hover.py http://localhost:3000
Норма: сдвиг 0 px, одно переключение по пути, стоя в промежутке — «Каталог», низ мегаменю < высоты экрана."""
import sys
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:3000'
STATE = """() => { const n = document.querySelector('nav[aria-label="Основное меню"]');
  const b = [...n.querySelectorAll('button')].map(x => [x.textContent.trim(), x.getAttribute('aria-expanded')]);
  return { navLeft: n.getBoundingClientRect().left, open: b.filter(x => x[1] === 'true').map(x => x[0]).join(',') || '-' } }"""

with sync_playwright() as p:
    br = p.chromium.launch()
    for width, height in [(1440, 900), (1200, 800), (960, 700), (1440, 700)]:
        pg = br.new_page(viewport={'width': width, 'height': height})
        pg.goto(BASE + '/news', wait_until='networkidle')
        nav = pg.locator('nav[aria-label="Основное меню"]')
        cat = nav.get_by_role('button', name='Каталог').bounding_box()
        news = nav.get_by_role('button', name='Новости').bounding_box()
        y = cat['y'] + cat['height'] / 2
        before = pg.evaluate(STATE)
        pg.mouse.move(cat['x'] + 10, y)
        pg.wait_for_timeout(300)
        opened = pg.evaluate(STATE)
        # Проводим мышь медленно от «Каталога» к «Новостям» по 1 px, считаем переключения.
        changes, last, x = [], opened['open'], cat['x'] + cat['width'] - 6
        while x < news['x'] + 10:
            pg.mouse.move(x, y)
            pg.wait_for_timeout(40)
            s = pg.evaluate(STATE)
            if s['open'] != last:
                changes.append((round(x), s['open'], s['navLeft']))
                last = s['open']
            x += 1
        # Стоим неподвижно в промежутке: меню не должно переключаться само.
        gap_x = (cat['x'] + cat['width'] + news['x']) / 2
        pg.mouse.move(cat['x'] + 10, y); pg.wait_for_timeout(300)
        pg.mouse.move(gap_x, y)
        idle = []
        for _ in range(20):
            pg.wait_for_timeout(50)
            idle.append(pg.evaluate(STATE)['open'])
        # Размер мегаменю.
        pg.mouse.move(cat['x'] + 10, y); pg.wait_for_timeout(400)
        mm = pg.evaluate("""() => { const m = document.getElementById('nav-catalog'); if (!m) return null;
          const r = m.getBoundingClientRect(); const sc = [...m.querySelectorAll('*')].some(e => e.scrollHeight > e.clientHeight + 2 && /(auto|scroll)/.test(getComputedStyle(e).overflowY));
          return { top: Math.round(r.top), bottom: Math.round(r.bottom), vh: innerHeight, links: m.querySelectorAll('a').length, scrollable: sc } }""")
        # Переход с «Каталога» вниз в мегаменю: оно не должно закрыться по дороге.
        pg.mouse.move(cat['x'] + 10, cat['y'] + cat['height'] + 40, steps=12)
        pg.wait_for_timeout(400)
        still = pg.evaluate(STATE)['open']
        print(f'{width}x{height}: сдвиг ряда при открытии {round(opened["navLeft"] - before["navLeft"], 1)} px; '
              f'переключений по пути {len(changes)} {changes[:6]}; '
              f'в промежутке стоя: {sorted(set(idle))}; мегаменю {mm}; после спуска в меню открыто: {still}')
        pg.close()
    br.close()
