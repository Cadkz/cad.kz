"""Автоматический аудит сайта CAD.kz: страницы × ширины, консоль, сеть, прокрутка, рамка,
SEO, доступность (axe), скорость, ссылки. Результат — JSON-файл, сводку печатает summary.py.

Запуск (нужны Python Playwright и axe-core, в проект их не ставим):
  npm install --prefix /tmp/axe axe-core@4.11.0
  AXE=/tmp/axe/node_modules/axe-core/axe.min.js python3 scripts/audit/site_audit.py http://localhost:3000 audit.json
Страницы — список PAGES ниже (под демоданные; на другой базе поправить адреса).
"""
import json, os, sys, urllib.request, urllib.error
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:3000'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'audit.json'
WIDTHS = [1440, 1200, 960, 640, 390]
PAGES = [
    '/', '/?group=software#catalog', '/?direction=arch#catalog', '/news', '/news?kind=promotion',
    '/articles', '/news/revit-2027', '/news/promo-artec-leo', '/news/choose-3d-scanner',
    '/catalog/autodesk/autocad/', '/products/scad-office', '/products/canon-tm-300',
    '/products/revit-course', '/products/bulk-1', '/cart', '/checkout', '/about',
    '/about/howto', '/about/requisites', '/contacts', '/nonexistent-page',
]
AXE = open(os.environ.get('AXE', 'node_modules/axe-core/axe.min.js')).read()

LAYOUT_JS = r"""
() => {
  const de = document.documentElement
  const r = (el) => el ? el.getBoundingClientRect() : null
  const header = document.querySelector('header')
  const bar = header && header.querySelector('div')
  const footer = document.querySelector('footer')
  const fbar = footer && footer.querySelector('[class*="container"], div')
  const logo = document.querySelector('header a')
  // Самые широкие элементы, вылезающие за экран.
  const over = []
  for (const el of document.querySelectorAll('body *')) {
    const b = el.getBoundingClientRect()
    if (b.width && (b.right > de.clientWidth + 1 || b.left < -1)) {
      const s = getComputedStyle(el)
      if (s.position === 'fixed' || s.visibility === 'hidden') continue
      let p = el.parentElement, clipped = false
      while (p && p !== document.body) { const ps = getComputedStyle(p); if (ps.overflowX !== 'visible' || ps.overflow === 'hidden') { clipped = true; break } p = p.parentElement }
      if (!clipped) over.push((el.className && el.className.toString().slice(0,60)) || el.tagName)
    }
  }
  const h = [...document.querySelectorAll('h1,h2')].map(e => ({tag: e.tagName, size: parseFloat(getComputedStyle(e).fontSize), text: e.textContent.trim().slice(0,50)}))
  const imgs = [...document.images]
  const tapSmall = window.innerWidth < 640 ? [...document.querySelectorAll('a,button,input,select')].filter(e => { const b = e.getBoundingClientRect(); const s=getComputedStyle(e); return b.width>0 && b.height>0 && s.visibility!=='hidden' && (b.height < 24 || b.width < 24) && !e.closest('p,li,dd,td,[class*="body"],[class*="prose"]') }).map(e => (e.getAttribute('aria-label')||e.textContent||e.tagName).trim().slice(0,30)) : []
  return {
    scrollW: de.scrollWidth, clientW: de.clientWidth,
    overflowEls: [...new Set(over)].slice(0, 8),
    headerBar: r(bar) && {left: Math.round(r(bar).left), width: r(bar).width},
    logoLeft: logo && Math.round(r(logo).left),
    mainLefts: [...document.querySelectorAll('main [class*="container"], main > div > [class*="container"]')].slice(0,6).map(e => [Math.round(e.getBoundingClientRect().left), e.getBoundingClientRect().width, e.className.toString().slice(0,40)]),
    footerLeft: fbar && Math.round(r(fbar).left),
    headings: h,
    h1count: document.querySelectorAll('h1').length,
    title: document.title, desc: document.querySelector('meta[name=description]')?.content || null,
    canonical: document.querySelector('link[rel=canonical]')?.href || null,
    ogImage: document.querySelector('meta[property="og:image"]')?.content || null,
    lang: de.lang,
    imgNoAlt: imgs.filter(i => !i.hasAttribute('alt')).map(i => i.src.slice(-60)),
    imgBroken: imgs.filter(i => i.complete && i.naturalWidth === 0 && i.src).map(i => i.src.slice(-80)),
    imgNoSize: imgs.filter(i => !i.getAttribute('width') && !i.closest('[style*="position"]') && getComputedStyle(i).position !== 'absolute').map(i => i.src.slice(-60)).slice(0,5),
    tapSmall: [...new Set(tapSmall)].slice(0, 10),
    links: [...document.querySelectorAll('a[href]')].map(a => a.href),
    domCount: document.querySelectorAll('*').length,
  }
}
"""

VITALS_INIT = r"""
window.__lcp = 0; window.__cls = 0;
new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lcp = e.startTime }).observe({type: 'largest-contentful-paint', buffered: true});
new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value }).observe({type: 'layout-shift', buffered: true});
"""

results = []
all_links = set()
with sync_playwright() as p:
    browser = p.chromium.launch()
    for width in WIDTHS:
        ctx = browser.new_context(viewport={'width': width, 'height': 900 if width >= 960 else 800},
                                  device_scale_factor=1, is_mobile=width < 640, has_touch=width < 640)
        ctx.add_init_script(VITALS_INIT)
        page = ctx.new_page()
        for path in PAGES:
            console, failed, pageerrors = [], [], []
            page.on('console', lambda m, c=console: m.type in ('error', 'warning') and c.append(f'{m.type}: {m.text[:200]}'))
            page.on('pageerror', lambda e, c=pageerrors: c.append(str(e)[:200]))
            page.on('response', lambda r, c=failed: r.status >= 400 and c.append(f'{r.status} {r.url[-90:]}'))
            if width == 390:
                cdp = ctx.new_cdp_session(page)
                cdp.send('Emulation.setCPUThrottlingRate', {'rate': 4})
                cdp.send('Network.emulateNetworkConditions', {'offline': False, 'latency': 150, 'downloadThroughput': 200000, 'uploadThroughput': 750e3 / 8})
            try:
                resp = page.goto(BASE + path, wait_until='load', timeout=60000)
                status = resp.status if resp else None
            except Exception as e:
                results.append({'path': path, 'width': width, 'error': str(e)[:200]}); continue
            page.wait_for_timeout(800)
            # Прокрутка до конца — ленивые картинки и сдвиги.
            page.evaluate('async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)) } scrollTo(0, 0) }')
            page.wait_for_timeout(300)
            info = page.evaluate(LAYOUT_JS)
            vit = page.evaluate('({lcp: Math.round(window.__lcp), cls: +window.__cls.toFixed(3)})')
            perf = page.evaluate("""() => { const n = performance.getEntriesByType('navigation')[0]; const res = performance.getEntriesByType('resource');
                const js = res.filter(r => r.initiatorType === 'script' || r.name.endsWith('.js'));
                return {ttfb: Math.round(n.responseStart), dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd), htmlKB: Math.round(n.encodedBodySize/1024), jsKB: Math.round(js.reduce((s, r) => s + r.encodedBodySize, 0)/1024), jsCount: js.length,
                imgKB: Math.round(res.filter(r=>r.initiatorType==='img').reduce((s,r)=>s+r.encodedBodySize,0)/1024)} }""")
            axe = None
            if width in (1440, 390):
                page.evaluate(AXE)
                axe = page.evaluate("""async () => { const r = await axe.run(document, {resultTypes: ['violations']});
                    return r.violations.map(v => ({id: v.id, impact: v.impact, n: v.nodes.length, help: v.help, sample: v.nodes.slice(0,3).map(n => n.target.join(' ') + ' :: ' + (n.failureSummary||'').slice(0,160))})) }""")
            if width == 390:
                cdp.send('Emulation.setCPUThrottlingRate', {'rate': 1})
                cdp.send('Network.emulateNetworkConditions', {'offline': False, 'latency': 0, 'downloadThroughput': -1, 'uploadThroughput': -1})
            all_links.update(info.pop('links'))
            results.append({'path': path, 'width': width, 'status': status, 'console': console, 'pageerrors': pageerrors,
                            'failed': failed, 'vitals': vit, 'perf': perf, 'axe': axe, **info})
            page.close(); page = ctx.new_page()
        ctx.close()
    browser.close()

# Проверка всех внутренних ссылок.
links = {}
internal = sorted({l.split('#')[0] for l in all_links if l.startswith(BASE)})
external = sorted({l for l in all_links if not l.startswith(BASE)})

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k): return None
opener = urllib.request.build_opener(NoRedirect)
for url in internal:
    try:
        r = opener.open(urllib.request.Request(url, method='GET'), timeout=30); links[url] = r.status
    except urllib.error.HTTPError as e:
        links[url] = f'{e.code} -> {e.headers.get("location")}' if e.code in (301, 302, 307, 308) else e.code
    except Exception as e:
        links[url] = str(e)[:80]
json.dump({'results': results, 'links': links, 'external': external}, open(OUT, 'w'), ensure_ascii=False, indent=1)
print('pages', len(results), 'internal links', len(internal), 'external', len(external))
