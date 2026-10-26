# Запуск на локальной демобазе после demo:setup и scripts/audit/bulk-products.mjs.
# Нужен установленный в среде Python Playwright и Chromium; зависимости проекта не меняются.
# CATALOG_TEST_URL=http://localhost:3000 python tests/catalogNavigation.browser.py
import os
import json
from playwright.sync_api import sync_playwright
BASE=os.environ.get('CATALOG_TEST_URL','http://localhost:3000')
CARD='a[class*="CatalogEntry"][class*="card"]'
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1440,'height':1000},device_scale_factor=1,reduced_motion='reduce')
    errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    report=[]
    for width in [1440,1200,960,640,390]:
        page.set_viewport_size({'width':width,'height':1000})
        page.goto(BASE+'/catalog?group=software',wait_until='networkidle',timeout=120000)
        page.wait_for_timeout(500)
        layout=page.evaluate('''() => { const main=document.querySelector('main h1').getBoundingClientRect(); const header=document.querySelector('header').getBoundingClientRect(); const frame=document.querySelector('main').firstElementChild.getBoundingClientRect(); const footer=document.querySelector('footer [class*="Container"]').getBoundingClientRect(); return {width:innerWidth, scroll:document.documentElement.scrollWidth, mainX:main.x, frameX:frame.x,frameWidth:frame.width,footerX:footer.x}; }''')
        assert layout['width']==layout['scroll'],layout
        expected=max((width-1200)/2,32 if width>=640 else 20)
        assert layout['mainX']==expected,layout
        assert layout['frameWidth']==min(1200,width-2*(32 if width>=640 else 20)),layout
        assert page.locator('header [class*="Container"]').first.bounding_box()['x']==expected
        # В существующем подвале до 640 px предусмотрено дополнительное поле 12 px.
        assert page.locator('footer [class*="Container"]').first.bounding_box()['x']==expected+(12 if width<640 else 0)
        page.screenshot(path=f'/tmp/catalog-{width}.png',full_page=True)
        main_cards=page.locator('main').locator(CARD).evaluate_all('(els)=>els.map(e=>e.getAttribute("href"))')
        assert len(main_cards)>0
        if width>=960:
            page.get_by_role('button',name='Каталог',exact=True).hover()
            menu=page.locator('#nav-catalog')
            menu.get_by_role('tab',name='Программы',exact=True).click()
            page.wait_for_timeout(500)
            menu_cards=menu.locator(CARD).evaluate_all('(els)=>els.map(e=>e.getAttribute("href"))')
            assert menu_cards==main_cards[:6],(menu_cards,main_cards[:6])
            menu.get_by_label('Направление',exact=True).select_option('arch')
            assert menu.locator(CARD).count()>0
            page.wait_for_timeout(500)
            page.screenshot(path=f'/tmp/menu-{width}.png',full_page=True)
            assert page.evaluate('document.documentElement.scrollWidth === innerWidth')
            page.keyboard.press('Escape')
            assert page.get_by_role('button',name='Каталог',exact=True).get_attribute('aria-expanded')=='false'
        else:
            page.get_by_role('button',name='Открыть меню',exact=True).click()
            menu=page.get_by_role('dialog')
            menu.locator('summary',has_text='Программы').first.click()
            page.wait_for_timeout(300)
            # Скрытые популярные тоже в DOM: берём раскрытую группу.
            opened=menu.locator('details[open]').first
            menu_cards=opened.locator(CARD).evaluate_all('(els)=>els.map(e=>e.getAttribute("href"))')
            assert menu_cards==main_cards[:6],(menu_cards,main_cards[:6])
            page.wait_for_timeout(500)
            page.screenshot(path=f'/tmp/menu-{width}.png',full_page=True)
            assert page.evaluate('document.documentElement.scrollWidth === innerWidth')
            page.keyboard.press('Escape')
        report.append(layout)
    # История шагов каталога.
    page.set_viewport_size({'width':1440,'height':1000})
    page.goto(BASE+'/catalog?group=software',wait_until='networkidle')
    side=page.get_by_role('region',name='Фильтр каталога')
    side.get_by_label('Направление',exact=True).select_option('arch')
    first=page.url
    side.get_by_label('Autodesk',exact=True).check()
    second=page.url
    assert first!=second
    page.go_back(wait_until='domcontentloaded')
    page.wait_for_timeout(200)
    assert page.url==first
    assert not side.get_by_label('Autodesk',exact=True).is_checked()
    page.go_forward(wait_until='domcontentloaded')
    page.wait_for_timeout(200)
    assert page.url==second,(page.url,second)
    assert side.get_by_label('Autodesk',exact=True).is_checked()
    link=page.locator('main').locator(CARD).first
    target=link.get_attribute('href')
    link.click()
    page.wait_for_url('**'+target,timeout=60000)
    page.wait_for_load_state('networkidle')
    page.go_back(wait_until='networkidle')
    assert page.url==second,(page.url,second)
    assert side.get_by_label('Autodesk',exact=True).is_checked()
    assert not errors,errors
    print(json.dumps({'layout':report,'history':'passed','menuParity':'passed','errors':errors},ensure_ascii=False))
    browser.close()
