# ТЗ для исследования: каталог CAD.kz — фильтры, описания и характеристики

Ты — исследователь и технический редактор каталога. Компания CAD.kz (Казахстан, Астана) продаёт инженерное ПО и оборудование: широкоформатные плоттеры Canon, широкоформатные сканеры WideTEK, 3D-сканеры Artec, программы Autodesk, SCAD Office, ЛИРА-FEM, GEO5, АВС. Мы делаем новый сайт. Сейчас в карточках товаров беспорядок: где-то описания устарели, где-то их нет, характеристик почти нет, фильтров по характеристикам нет.

Нужно сделать три вещи:
1. Посмотреть, как устроены каталоги у производителей и крупных продавцов, и предложить для каждой категории наших товаров структуру фильтров.
2. Для каждого нашего товара из списка ниже написать актуальное описание и собрать подробные характеристики с официальных источников.
3. Для каждого товара коротко объяснить, чем он отличается от соседних моделей. Это будет знать наш ИИ-консультант, чтобы отвечать на вопросы вроде «чем plotWAVE T55 отличается от T75».

## Где искать

- Только официальные и проверяемые источники: canon.ru, canon-europe.com, cpp.canon (Canon Production Printing, бывшая Océ), imageaccess.de и widetek.com, artec3d.com, autodesk.com, scadsoft.com, liraland.com, lira-soft.com, finesoftware.eu (GEO5), abccenter.kz (АВС). Для структуры каталога можно смотреть и крупных продавцов этих производителей.
- Нужны данные на сегодня. Если модель снята с производства или её заменила новая, так и напиши и назови замену.
- Если характеристику не удалось подтвердить, не придумывай её. Оставь пусто и отметь в поле `unsure`.
- Тексты пиши своими словами, не копируй абзацы с сайтов производителей. Цифры и названия технологий переноси точно.
- Язык — русский. Названия моделей и технологий — как у производителя (imagePROGRAF, colorWAVE, plotWAVE, CrystalPoint, LUCIA PRO и т. д.).

## Часть 1. Структура фильтров по категориям

Посмотри, как сортируют и фильтруют каталог Canon (плоттеры и МФУ для САПР и ГИС), Image Access / WideTEK, Artec 3D, Autodesk, а также 2–3 крупных продавца в России или Казахстане. Для каждой категории ниже предложи фильтры.

Наш фильтр динамический: показываются только те значения, которые есть у товаров в выбранной категории. Поэтому нужен короткий список фильтров, которые реально разделяют наши модели. 4–6 фильтров на категорию, не больше.

Категории:
- **Широкоформатные плоттеры.** Ожидаем: максимальная ширина печати (дюймы и мм, формат A1/A0/шире), технология печати (струйная, LED/тонерная, CrystalPoint и т. д.), цветная или монохромная, число рулонов, встроенный сканер (МФУ или нет), назначение (САПР/ГИС, постеры, большие объёмы). Подтверди или поправь.
- **Комплектующие и расходные материалы** для плоттеров: тип (картридж, тонер, печатающая головка, бумага), цвет, совместимые модели.
- **Широкоформатные сканеры.** Ширина сканирования, тип (протяжный, планшетный, книжный, для искусства), CIS или CCD, оптическое разрешение, встроенный ПК, работа в паре с плоттером.
- **3D-сканеры.** Размер объектов (мелкие детали, средние, крупные, очень крупные), точность, разрешение, ручной или стационарный, беспроводной или нет, технология (структурированный свет, лазер, фотограмметрия), назначение (реверс-инжиниринг, контроль качества, медицина, культурное наследие).
- **Программы (САПР, BIM, расчёт).** Тип лицензии (подписка или бессрочная), срок, локальная или сетевая, редакция или комплектация, назначение.

Для каждой категории дай:
- список фильтров по порядку показа: ключ латиницей, название по-русски, тип (`one` — один вариант, `many` — несколько, `range` — диапазон), значения по порядку;
- порядок товаров в каталоге: сначала флагманы и самые мощные модели, потом младшие;
- 1–2 предложения, почему такая структура.

## Часть 2. Карточка каждого товара

Для каждого товара из списка нужно:
- **summary** — 1–2 предложения для карточки в каталоге: что это и для кого;
- **overview** — общий текст на странице товара, 2–4 коротких абзаца: назначение, главное преимущество, для каких задач и объёмов;
- **sections** — раскрывающиеся блоки под общим текстом, 3–6 штук, например «Технология печати», «Скорость и производительность», «Работа с бумагой», «Программы и подключение», «Что в комплекте», «Для каких деталей подходит». Внутри — короткий текст или список;
- **specs** — подробные характеристики для таблицы в раскрывающемся списке: группа, название, значение, единица. Сколько есть у производителя: 15–40 строк для оборудования, меньше для программ;
- **filters** — значения этого товара для фильтров из части 1 (ключи те же);
- **compare** — 2–4 предложения: чем отличается от ближайших моделей у нас в списке (старше, младше, соседние). Например, у T50 и T75 одна технология, но у T75 больше рулонов и выше скорость. Писать конкретно, с цифрами;
- **status** — актуальная модель, снята с производства (с заменой) или не удалось проверить;
- **sources** — ссылки, откуда взяты данные.

Особые требования:
- **3D-сканеры Artec:** обязательно какого размера объекты сканирует (от и до, в мм или см), точность, разрешение, рабочая дистанция, поле зрения, вес. В compare прямо скажи, какой сканер для мелких деталей, какой для средних, какой для крупных объектов.
- **Сканеры WideTEK:** ширина, протяжный или планшетный, максимальная толщина оригинала, скорость, разрешение. Объясни, чем отличаются 36 и 36CL, 48 и 48CL, 44 и 48, что такое ART-версия, чем 36CL для плоттеров отличается от обычного 36CL.
- **Плоттеры Canon:** ширина, технология, число рулонов, скорость (листов A1 в минуту или м²/ч), встроенный сканер, объём памяти и диска, лотки и укладчики. Объясни разницу внутри линеек: TX-3200, TX-4100, TX-4200; TZ-30000 и TZ-32000; colorWAVE T60 и T65; plotWAVE T30/T35, T50/T55, T75; PlotWave 7500.
- **Расходные материалы:** с какими моделями совместимы, объём или ресурс, если указан.
- **Программы:** актуальная версия на сегодня, что нового в последней версии (коротко), системные требования кратко, какие бывают редакции и лицензии. У SCAD Office и ЛИРА-FEM — из каких модулей и пакетов состоит комплекс. У AutoCAD — что входит в отраслевые наборы. У LT комплекта (AutoCAD LT + Revit LT) — чем он ограничен по сравнению с полными версиями. У AEC Collection — что входит в коллекцию.

## Формат ответа

1. Короткий отчёт: структура фильтров по категориям и что важного нашёл (снятые модели, замены, расхождения с нашими названиями).
2. **Один файл JSON для скачивания** (сделай его кодом) со всеми данными. Строго такая схема, ключи латиницей, тексты по-русски:

```json
{
  "checked": "2026-10-23",
  "categories": [
    {
      "category": "plotters",
      "filters": [
        { "key": "width", "label": "Ширина печати", "type": "one",
          "values": ["24\" (A1)", "36\" (A0)", "44\""] }
      ],
      "order": ["imageprograf_tz_32000", "imageprograf_tz_30000"],
      "why": "…"
    }
  ],
  "products": [
    {
      "slug": "plotwave_t75",
      "title": "plotWAVE T75",
      "status": "current",
      "replacedBy": null,
      "summary": "…",
      "overview": ["абзац 1", "абзац 2"],
      "sections": [
        { "title": "Технология печати", "text": "…", "bullets": ["…"] }
      ],
      "specs": [
        { "group": "Печать", "name": "Технология", "value": "LED, тонер", "unit": null }
      ],
      "filters": { "width": "36\" (A0)", "technology": "LED/тонер", "rolls": "4" },
      "compare": "…",
      "unsure": ["что не удалось подтвердить"],
      "sources": ["https://…"]
    }
  ]
}
```

`category` — одно из: `plotters`, `consumables`, `wide-scanners`, `3d-scanners`, `software`. `status` — `current`, `discontinued` или `unknown`. `slug` бери из списка ниже без изменений: по нему мы загрузим данные в каталог.

Если всё не помещается в один ответ, делай частями по категориям, но в той же схеме, чтобы файлы можно было склеить.

## Наши товары

Формат: категория | производитель | название у нас | slug. Названия у нас иногда устаревшие или неточные: если модель на самом деле называется иначе, напиши правильное название в `title`, а в отчёте отметь расхождение.

### Широкоформатные плоттеры (Canon)
- plotters | Canon | imagePROGRAF TZ-32000 | imageprograf_tz_32000
- plotters | Canon | imagePROGRAF TZ-30000 | imageprograf_tz_30000
- plotters | Canon | imagePROGRAF TX-4200 | imageprograf_tx_4200
- plotters | Canon | imagePROGRAF TX-4100 | imageprograf_tx_4100
- plotters | Canon | imagePROGRAF TX-3200 | imageprograf_tx_3200
- plotters | Canon | Canon colorWAVE T65 | canon_colorwave_t65
- plotters | Canon | Canon colorWAVE T60 | canon_colorwave_t60
- plotters | Canon | PlotWave 7500 | plotwave_7500
- plotters | Canon | plotWAVE T75 | plotwave_t75
- plotters | Canon | plotWAVE T50/T55 | plotwave_t50_t55
- plotters | Canon | plotWAVE T30/35 | plotwave_t30_35

### Комплектующие и расходные материалы (Canon / Océ)
- consumables | Canon | Тонер Canon 6692C004AA colorWAVE T60 Toner BK | toner_canon_6692c004aa_colorwave_t60_toner_bk
- consumables | Canon | Тонер Canon 6692C001AA colorWAVE T60 Toner C | toner_canon_6692c001aa_colorwave_t60_toner_c
- consumables | Canon | Тонер Canon 6692C002AA colorWAVE T60 Toner M | toner_canon_6692c002aa_colorwave_t60_toner_m
- consumables | Canon | Тонер Canon 6692C003AA colorWAVE T60 Toner Y | toner_canon_6692c003aa_colorwave_t60_toner_y_6692c004aa
- consumables | Canon | Картридж Océ ColorWave 700 Black | kartridzh_oc_colorwave_700_black
- consumables | Canon | Картридж Océ ColorWave 700 Cyan | kartridzh_oc_colorwave_700_cyan
- consumables | Canon | Картридж Océ ColorWave 700 Magenta | kartridzh_oc_colorwave_700_magenta
- consumables | Canon | Картридж Océ ColorWave 700 Yellow | kartridzh_oc_colorwave_700_yellow
- consumables | Canon | Картридж Océ ColorWave 650 Black | kartridzh_oc_colorwave_650_black
- consumables | Canon | Картридж Océ ColorWave 650 Cyan | kartridzh_oc_colorwave_650_cyan
- consumables | Canon | Картридж Océ ColorWave 650 Magenta | kartridzh_oc_colorwave_650_magenta
- consumables | Canon | Картридж Océ ColorWave 650 Yellow | kartridzh_oc_colorwave_650_yellow

### Широкоформатные сканеры (WideTEK, производитель Image Access)
- wide-scanners | WideTEK | WideTEK 60CL | shirokoformatnyy_skaner_widetek_60cl_s_shirinoy_60_1524_mm_podstavkoy_21_touch_bsw_scanwizard_fc_war
- wide-scanners | WideTEK | WideTEK 48CL | widetek_48cl_shirokoformatnyy_skaner_48_1220_mm_so_vstroennym_pk_scanwizard_bez_napolnoy_stoyki
- wide-scanners | WideTEK | WideTEK 48 | widetek_48_shirokoformatnyy_skaner_48_1220_mm_so_vstroennym_pk_scanwizard_bez_napolnoy_stoyki
- wide-scanners | WideTEK | WideTEK 44 | widetek_44_shirokoformatnyy_skaner_44_1118_mm_v_komplekte_podstavka_22_touch_bsw_scanwizard_fc_warra
- wide-scanners | WideTEK | WideTEK 36ART Fine Art Scanner | widetek_36art_fine_art_scanner_36_vstroennyy_pk_15_touch_motorizovannyy_transportirovochnyy_stol
- wide-scanners | WideTEK | WideTEK 36CL | shirokoformatnyy_skaner_widetek_36cl_s_shirinoy_36_915_mm_so_vstroennym_pk_scanwizard_bez_napolnoy_s
- wide-scanners | WideTEK | WideTEK 36CL, сканер для плоттеров Canon TX | widetek_36cl_skaner_dlya_canon_tx_3_4000_ipf_pro_tx_komplekt_krepleniya_pro_21_touch_printwizard_lfp
- wide-scanners | WideTEK | WideTEK 36 | shirokoformatnyy_skaner_widetek_36_s_shirinoy_36_915_mm_v_komplekte_podstavka_22_touch_bsw_scanwizar
- wide-scanners | WideTEK | WideTEK 25 | planshetnyy_skaner_widetek_25
- wide-scanners | WideTEK | WideTEK 24F | widetek_24f_dina2_ploskiy_skaner_cis_24_x_18_610_x_457_mm_so_vstroennym_pk
- wide-scanners | WideTEK | WideTEK 12 | planshetnyy_skaner_widetek_12_s_shirinoy_12_3_x_18_5_v_komplekte_vklyuchaya_nozhnoy_pereklyuchatel_b

### 3D-сканеры (Artec 3D)
- 3d-scanners | Artec 3D | Artec Leo | artec_leo
- 3d-scanners | Artec 3D | Artec Eva | artec_eva
- 3d-scanners | Artec 3D | Artec Eva Lite | artec_eva_lite
- 3d-scanners | Artec 3D | Artec Spider II | artec_spider_ii
- 3d-scanners | Artec 3D | Artec Micro II | artec_micro_ii
- 3d-scanners | Artec 3D | Artec Point | artec_point
- 3d-scanners | Artec 3D | Artec Ray II | artec_ray_ii
- 3d-scanners | Artec 3D | Artec Jet | artec_jet
- 3d-scanners | Artec 3D | Метрологический набор Artec | metrologicheskiy_nabor_artec

### Программы
- software | Artec 3D | Artec Studio (у нас указана версия 20) | artec_studio_19
- software | Artec 3D | Artec Cloud | artec_cloud
- software | Autodesk | ReCap Pro | recap_pro
- software | Autodesk | AutoCAD | autocad
- software | Autodesk | LT комплект: AutoCAD LT + Revit LT (AutoCAD Revit LT Suite) | autocad_revit_lt_suite
- software | Autodesk | Revit | autodesk-revit
- software | Autodesk | Architecture, Engineering & Construction Collection | architecture_engineering_construction_collection-1107088405
- software | SCAD Soft | SCAD Office (у нас указана версия 25.1) | scad_v23
- software | ЛИРА-FEM | ЛИРА-FEM (ЛИРА САПР) | lira_sapr
- software | Fine Software | GEO5 | geo5
- software | АВС | Программный комплекс АВС-KZ (АВС-4) | the_software_package_avs_4

Рабочие станции Iridium Line собирает сама компания, их исследовать не нужно.
