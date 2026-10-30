// @ts-check
// Короткие описания для карточек каталога (просьба владельца 27.10.2026): одна мысль — для чего
// товар, без повтора названия и без обрыва на полуслове, до ~70 знаков (две строки в карточке).
// Ключ — slug товара, у семейств — `family:<slug линейки>`. Пробная ветка redesign/catalog-cards:
// при слиянии тексты переносятся разовой настройкой в поле товара «Коротко для карточки»
// в админке, этот файл остаётся только запасом для товаров с пустым полем.

/** @type {Record<string, string>} */
export const CARD_TEXTS = {
  // Artec 3D: сканеры
  artec_neo: 'Беспроводной сканер: маркеры, геометрия и текстура в одном проекте',
  artec_point_ii: 'Лазерный сканер для контроля качества с точностью до 0,02 мм',
  artec_spider_ii: 'Сканер мелких деталей со сложной геометрией, форма и цвет',
  artec_ray_ii: 'LiDAR-сканер на штативе для зданий и крупных объектов, до 130 м',
  artec_point: 'Метрологический лазерный сканер прошлого поколения, заменён Point II',
  artec_micro_ii: 'Настольный автоматический сканер для ювелирки, стоматологии и мелких деталей',
  artec_leo: 'Беспроводной сканер с экраном: видно результат прямо во время съёмки',
  artec_jet: 'Мобильный LiDAR-сканер со SLAM для зданий, тоннелей и инфраструктуры',
  artec_eva_lite: 'Упрощённая Eva без цвета, снята с производства',
  artec_eva: 'Ручной сканер средних объектов: точная форма и цвет',
  artec_studio_19: 'Обработка сканов, реверс-инжиниринг и контроль геометрии',
  artec_cloud: 'Облако для хранения сканов и совместной работы с ними',
  within_medical: 'Проектирование ортезов и протезов по 3D-сканам пациента',

  // Canon: плоттеры и печатные системы
  imageprograf_tx_4300: 'Цветной плоттер A0+ (44"), два рулона, A1 за 17 секунд',
  imageprograf_tx_3300: 'Цветной плоттер A0 (36"), два рулона, A1 за 17 секунд',
  imageprograf_tx_4200: 'Цветной плоттер A0+ (44") для чертежей, CAD и ГИС',
  imageprograf_tx_4100: 'Плоттер A0+ (44") прошлого поколения для чертежей и карт',
  imageprograf_tx_3200: 'Пятицветный плоттер A0 (36") для чертежей и карт',
  imageprograf_tz_32000: 'Быстрый плоттер A0 (36") для больших тиражей чертежей',
  imageprograf_tz_30000: 'Производительный плоттер A0 (36") прошлого поколения',
  plotwave_t75: 'Ч/б система для больших тиражей чертежей до A0',
  plotwave_t50_t55: 'Ч/б система для средних тиражей чертежей до A0',
  plotwave_t30_35: 'Компактная ч/б система для чертежей до A0',
  plotwave_7500: 'Ч/б система прошлого поколения для очень больших тиражей',
  canon_colorwave_t65: 'Цветная система для тиражей чертежей, карт и плакатов, с МФУ',
  canon_colorwave_t60: 'Цветная система для тиражей чертежей, карт и плакатов',
  toner_canon_6692c004aa_colorwave_t60_toner_bk: 'Чёрный тонер для colorWAVE T60 и T65',
  toner_canon_6692c003aa_colorwave_t60_toner_y_6692c004aa: 'Жёлтый тонер для colorWAVE T60 и T65',
  toner_canon_6692c002aa_colorwave_t60_toner_m: 'Пурпурный тонер для colorWAVE T60 и T65',
  toner_canon_6692c001aa_colorwave_t60_toner_c: 'Голубой тонер для colorWAVE T60 и T65',
  kartridzh_oc_colorwave_700_yellow: 'Жёлтый оригинальный картридж для Océ ColorWave 700',
  kartridzh_oc_colorwave_700_magenta: 'Пурпурный оригинальный картридж для Océ ColorWave 700',
  kartridzh_oc_colorwave_700_cyan: 'Голубой оригинальный картридж для Océ ColorWave 700',
  kartridzh_oc_colorwave_700_black: 'Чёрный оригинальный картридж для Océ ColorWave 700',
  kartridzh_oc_colorwave_650_yellow: 'Жёлтый оригинальный картридж для Océ ColorWave 650',
  kartridzh_oc_colorwave_650_magenta: 'Пурпурный оригинальный картридж для Océ ColorWave 650',
  kartridzh_oc_colorwave_650_cyan: 'Голубой оригинальный картридж для Océ ColorWave 650',
  kartridzh_oc_colorwave_650_black: 'Чёрный оригинальный картридж для Océ ColorWave 650',

  // WideTEK: сканеры
  widetek_48cl_shirokoformatnyy_skaner_48_1220_mm_so_vstroennym_pk_scanwizard_bez_napolnoy_stoyki:
    'Сканер чертежей и карт шириной 48" (1220 мм) со встроенным ПК',
  widetek_48_shirokoformatnyy_skaner_48_1220_mm_so_vstroennym_pk_scanwizard_bez_napolnoy_stoyki:
    'Сканер чертежей и карт шириной 48" (1220 мм) со встроенным ПК',
  widetek_44_shirokoformatnyy_skaner_44_1118_mm_v_komplekte_podstavka_22_touch_bsw_scanwizard_fc_warra:
    'Сканер чертежей и карт шириной 44" (1118 мм) на подставке',
  widetek_36cl_skaner_dlya_canon_tx_3_4000_ipf_pro_tx_komplekt_krepleniya_pro_21_touch_printwizard_lfp:
    'Сканер на плоттер Canon TX: вместе получается широкоформатное МФУ',
  widetek_36art_fine_art_scanner_36_vstroennyy_pk_15_touch_motorizovannyy_transportirovochnyy_stol:
    'Бесконтактная оцифровка картин и графики для музеев и архивов',
  widetek_24f_dina2_ploskiy_skaner_cis_24_x_18_610_x_457_mm_so_vstroennym_pk:
    'Планшетный сканер A2 для документов, графики и образцов',
  shirokoformatnyy_skaner_widetek_60cl_s_shirinoy_60_1524_mm_podstavkoy_21_touch_bsw_scanwizard_fc_war:
    'Сканер чертежей и карт шириной 60" (1524 мм) на подставке',
  shirokoformatnyy_skaner_widetek_36cl_s_shirinoy_36_915_mm_so_vstroennym_pk_scanwizard_bez_napolnoy_s:
    'Сканер чертежей и карт шириной 36" (915 мм) со встроенным ПК',
  shirokoformatnyy_skaner_widetek_36_s_shirinoy_36_915_mm_v_komplekte_podstavka_22_touch_bsw_scanwizar:
    'Сканер чертежей и карт шириной 36" (915 мм) на подставке',
  planshetnyy_skaner_widetek_25: 'Планшетный сканер A2+ для документов, графики и образцов',
  planshetnyy_skaner_widetek_12_s_shirinoy_12_3_x_18_5_v_komplekte_vklyuchaya_nozhnoy_pereklyuchatel_b:
    'Компактный планшетный сканер A3+ для книг и документов',

  // Графические станции
  iridium_lt_line: 'Рабочая станция начального уровня для САПР и смет',
  graphic_station_iridium_line_plus: 'Мощная станция для сводных BIM-моделей и больших проектов',
  graphic_station_iridium_line: 'Рабочая станция для САПР, 3D-моделирования и визуализации',
  graficheskaya_stantsiya_iridium_line_demo:
    'Демонстрационная станция Iridium Line по сниженной цене',

  // Autodesk
  autocad: 'Точные 2D-чертежи и 3D-модели для любых проектных разделов',
  'autodesk-revit': 'BIM-проектирование зданий в единой модели для всех разделов',
  civil_3d: 'Проектирование дорог, генплана и наружных сетей',
  inventor_professional: '3D-проектирование деталей, сборок и чертежей для производства',
  navisworks: 'Сводная модель и поиск коллизий между разделами проекта',
  navisworks_simulate: 'Сводная модель, 4D-график стройки и объёмы, без поиска коллизий',
  '3ds_max': 'Визуализация и анимация для архитектуры и дизайна',
  'architecture_engineering_construction_collection-1107088405':
    'AutoCAD, Revit, Civil 3D, Navisworks и другие программы одним пакетом',
  product_design_manufacturing_collection:
    'Inventor, AutoCAD и программы для производства одним пакетом',
  media_entertainment_collection_ic: '3ds Max, Maya и Arnold одним пакетом для графики и анимации',
  autocad_revit_lt_suite: 'AutoCAD LT и Revit LT одной подпиской: 2D-чертежи и BIM',
  fusion_360_team: '3D-модель, расчёт и подготовка изделия к производству в облаке',
  fusion_360_cloud: 'Облачная Fusion для проектирования и производства',
  fusion_360_with_powershape: 'Fusion вместе с PowerShape: сложные поверхности и пресс-формы',
  fusion_360_with_powermill: 'Fusion вместе с PowerMill: программы для 5-осевых станков',
  fusion_360_with_powerinspect: 'Fusion вместе с PowerInspect: контроль деталей по модели',
  fusion_360_with_netfabb: 'Fusion вместе с Netfabb: подготовка к 3D-печати металлом',
  fusion_360_with_feature: 'Fusion с дополнительными функциями по подписке',
  fusion_360_with_cloud_credits: 'Облачные кредиты Fusion для расчётов и генеративного дизайна',
  fusion_360_nesting_fabrication: 'Раскрой листового материала и подготовка к резке',
  fusion_360_manage: 'Управление изделиями и процессами (PLM) в облаке',
  fusion_360_machining_extension: 'Расширенная обработка на станках с ЧПУ в Fusion',
  fusion_360_generative_design_extension:
    'Генеративный дизайн: Fusion сам предложит лёгкую конструкцию',
  fusion_360_additive_build_extension: 'Подготовка заданий для промышленной 3D-печати',
  vred: 'Реалистичная визуализация автомобилей и изделий',
  vault: 'Хранение и версии проектных данных Inventor и AutoCAD',
  vault_plm: 'Vault и облачный PLM: данные изделия от проекта до производства',
  upchain: 'Облачное управление данными изделия с подрядчиками',
  takeoff_cloud: 'Подсчёт объёмов по 2D-чертежам и моделям в облаке',
  recap_pro: '3D-модель по облакам точек и фотографиям',
  point_layout: 'Разбивка точек на стройплощадке по модели и обратно',
  premium_sub: 'Расширенная подписка Autodesk с отчётами и единым входом',
  netfabb: 'Подготовка моделей к промышленной 3D-печати',
  motionbuilder: 'Анимация персонажей и захват движения',
  moldflow: 'Расчёт литья пластмасс под давлением',
  maya: '3D-анимация, моделирование и визуальные эффекты',
  infraworks: 'Концепция инфраструктуры на 3D-модели местности',
  flare: 'Композитинг и эффекты для видео в связке с Flame',
  flame_assist: 'Дополнительное рабочее место для команды на Flame',
  flame: 'Визуальные эффекты и финальная обработка видео',
  fabrication_camduct: 'Раскрой и изготовление воздуховодов',
  cfd_cloud: 'Расчёт потоков и теплообмена в облаке',
  autodesk_cfd: 'Расчёт потоков жидкости, газа и теплообмена',
  camplete: 'Проверка и симуляция программ для станков с ЧПУ',
  build: 'Управление стройкой: задачи, замечания и документы',
  bim_collaborate_pro: 'Совместная работа над моделями Revit и Civil 3D в облаке',
  bim_collaborate: 'Координация моделей и поиск коллизий в облаке',
  bim_360_docs: 'Облачная среда общих данных проекта, бывш. Autodesk Docs',
  forma_site_design: 'Анализ участка: инсоляция, ветер, шум и варианты застройки',
  forma_building_design: 'Концепция здания: объём, этажи и квартиры до модели в Revit',
  bim_360_build: 'Стройконтроль, замечания и документы в облаке',
  assemble: 'Объёмы и стоимость по моделям Revit в облаке',
  arnold_5: 'Фотореалистичный рендеринг для 3ds Max и Maya',
  alias: 'Промышленный дизайн и поверхности класса А',
  advance_steel: 'Металлоконструкции: 3D-модель, узлы и чертежи КМД',

  // АВС, сметы
  the_software_package_avs_4: 'Сметы по нормативам Казахстана',
  avs_tssp_tsifrovaya_spetsifikatsiya_proekta:
    'Спецификации материалов и ведомости объёмов из проекта',
  avs_rekompozitor: 'Пересчёт и перекомпоновка смет АВС',
  avs_pir: 'Сметы на проектно-изыскательские работы',
  avs_akkord: 'Учёт выполнения работ и актов по сметам АВС',
  svidetelstvo_rsnb_respubliki_kazakhstan_respublikanskaya_smetno_normativnaya_baza:
    'Право пользоваться сметно-нормативной базой РК',
  srd_2024_smetno_normativnaya_baza: 'Нормативы на ремонт и содержание дорог РК',
  onv_reo_estimated_regulatory_framework: 'Сметные нормативы для ремонта энергооборудования',

  // Расчёт конструкций и геотехника
  scad_v23: 'Расчёт и проверка строительных конструкций методом КЭ',
  lira_sapr: 'Расчёт и проектирование зданий и сооружений методом КЭ',
  geo5: 'Фундаменты, подпорные стены, котлованы и устойчивость откосов',
  the_foundation: 'Расчёт фундаментов и конструкций, работающих в грунте',
  plita: 'Расчёт железобетонных плит с рёбрами, утолщениями и отверстиями',
  base: 'Набор общестроительных расчётов по блокам',
  base_blok_spetsialnykh_raschetov: 'Теплотехника ограждений и другие специальные расчёты',
  base_blok_raschetov_arkhitektora: 'Освещённость, инсоляция и расчёты для архитектора',
  base_blok_rascheta_ram_i_elementov_karkasa: 'Рамы, балки и колонны каркаса',
  base_blok_rascheta_plit_i_balok_na_uprugom_osnovanii: 'Плиты и балки на упругом основании',
  base_blok_rascheta_fundamentov: 'Ленточные и столбчатые фундаменты, подпорные стены',
  prilozhenie_baseec: 'Расчёты конструкций по нормам Eurocode',
  fin_ec: 'Расчёт рам и проектирование элементов по Еврокодам',
  truss4: 'Деревянные фермы на металлических пластинах: от расчёта до цеха',
  truss4_dopolnitelnoe_rabochee_mesto: 'Ещё одно рабочее место TRUSS4',

  // CSoft, НТП и другие
  tdms_farvater: 'Документооборот и электронный архив проектной организации',
  cadlib_model_i_arkhiv_v_1: 'Сводная 3D-модель объекта и архив документации',
  model_studio_cs_vodosnabzhenie_i_kanalizatsiya: '3D-проектирование водопровода и канализации',
  model_studio_cs_truboprovody_v_2: '3D-проектирование технологических трубопроводов',
  model_studio_cs_tekhnologicheskie_skhemy_v_1: 'Технологические схемы с базой оборудования',
  model_studio_cs_stroitelnye_resheniya_v_1: 'Строительные конструкции промышленных объектов в 3D',
  model_studio_cs_otoplenie_i_ventilyatsiya: '3D-проектирование отопления и вентиляции',
  model_studio_cs_otkrytye_raspredelitelnye_ustroystva_v_2:
    'Открытые распределительные устройства подстанций в 3D',
  model_studio_cs_ops: 'Пожарная и охранная сигнализация в 3D',
  model_studio_cs_molniezashchita_v_2: 'Расчёт и проектирование молниезащиты',
  model_studio_cs_lep_v_2: 'Проектирование воздушных линий электропередачи',
  model_studio_cs_komponovshchik_shchitov_v_1: 'Компоновка шкафов и щитов в 3D',
  model_studio_cs_kabelnoe_khozyaystvo_v_1: 'Кабельные трассы, лотки и журналы',
  model_studio_cs_genplan: 'Генплан промышленного объекта в 3D',
  model_studio_cs_enterprise_license: 'Одна лицензия на все программы Model Studio CS',
  model_studio_cs_elektrika: 'Силовое электрооборудование и освещение в 3D',
  model_studio_cs_electrical_schematic: 'Принципиальные, структурные и монтажные электросхемы',

  // MagiCAD
  magicad_ventilyatsiya_dlya_revit: 'Вентиляция в Revit с базой реального оборудования',
  magicad_ventilyatsiya: 'Вентиляция в AutoCAD с базой реального оборудования',
  magicad_truboprovody_dlya_revit: 'Отопление и водоснабжение в Revit с расчётом',
  magicad_truboprovody: 'Отопление и водоснабжение в AutoCAD с расчётом',
  magicad_sprinklery_dlya_revit: 'Спринклерное пожаротушение в Revit с расчётом',
  magicad_sprinklery: 'Спринклерное пожаротушение в AutoCAD с расчётом',
  magicad_skhemy_dlya_revit: 'Принципиальные схемы инженерных систем в Revit',
  magicad_skhemy: 'Принципиальные схемы инженерных систем в AutoCAD',
  magicad_pomeshchenie: 'Теплопотери и нагрузки по помещениям',
  magicad_opory_i_podveski_dlya_revit: 'Опоры и подвески для сетей в Revit',
  magicad_object_enabler: 'Бесплатный просмотр объектов MagiCAD в AutoCAD',
  magicad_elektrosnabzhenie_dlya_revit: 'Электроснабжение и освещение в Revit',
  magicad_elektrosnabzhenie: 'Электроснабжение и освещение в AutoCAD',
  magicad_elektricheskie_tsepi: 'Расчёт электрических цепей и щитов',
  magicad_aksonometriya_dlya_revit: 'Аксонометрические схемы трубопроводов в Revit',

  // АРС (сантехнические расчёты)
  ars_windows_interfeys_lokalnyy: 'Все расчёты АРС в окнах Windows, локальная лицензия',
  programmnoe_obespechenie_ars_windows_interfeys_upg_s_predydushchikh_versiy_s_3_go_po_5_yy_god:
    'Переход на Windows-версию АРС со старой версии',
  'programmnoe_obespechenie_ars_santekhnicheskie_raschety_polnyy_komplekt_moduley_upg_s_predydushchikh_-1203045269':
    'Обновление всех модулей АРС со старой версии, сетевая лицензия',
  programmnoe_obespechenie_ars_santekhnicheskie_raschety_polnyy_komplekt_moduley_upg_s_predydushchikh_:
    'Обновление всех модулей АРС со старой версии, локальная лицензия',
  programmnoe_obespechenie_ars_santekhnicheskie_raschety_polnyy_komplekt_moduley_setevoy:
    'Все сантехнические расчёты АРС, сетевая лицензия',
  programmnoe_obespechenie_ars_santekhnicheskie_raschety_polnyy_komplekt_moduley_lokalnyy:
    'Все сантехнические расчёты АРС, локальная лицензия',
  programmnoe_obespechenie_ars_santekhnicheskie_raschety_polnyy_komplekt_moduley_godovaya_litsenziya:
    'Все сантехнические расчёты АРС на год',
  programmnoe_obespechenie_ars_raschet_vodosnabzheniya_zdaniya_upg_s_predydushchikh_versiy_s_3_go_po_5:
    'Обновление модуля водоснабжения здания со старой версии',
  programmnoe_obespechenie_ars_raschet_vodosnabzheniya_zdaniya:
    'Гидравлический расчёт водопровода здания',
  programmnoe_obespechenie_ars_raschet_ventilyatsii_upg_s_predydushchikh_versiy_s_3_go_po_5_yy_god:
    'Обновление модуля вентиляции со старой версии',
  programmnoe_obespechenie_ars_raschet_ventilyatsii: 'Аэродинамический расчёт систем вентиляции',
  programmnoe_obespechenie_ars_raschet_teplovykh_setey_upg_s_predydushchikh_versiy_s_3_go_po_5_yy_god:
    'Обновление модуля тепловых сетей со старой версии',
  programmnoe_obespechenie_ars_raschet_teplovykh_setey: 'Гидравлический расчёт тепловых сетей',
  programmnoe_obespechenie_ars_raschet_temperaturnogo_polya_upg_s_predydushchikh_versiy_s_3_go_po_5_yy:
    'Обновление модуля температурного поля со старой версии',
  programmnoe_obespechenie_ars_raschet_temperaturnogo_polya:
    'Температурное поле ограждающих конструкций',
  programmnoe_obespechenie_ars_raschet_proizvolnykh_truboprovodov_upg_s_predydushchikh_versiy_s_3_go_p:
    'Обновление модуля трубопроводов со старой версии',
  programmnoe_obespechenie_ars_raschet_proizvolnykh_truboprovodov:
    'Гидравлика трубопроводов любой схемы',
  programmnoe_obespechenie_ars_raschet_otopleniya_upg_s_predydushchikh_versiy_s_3_go_po_5_yy_god:
    'Обновление модуля отопления со старой версии',
  programmnoe_obespechenie_ars_raschet_otopleniya: 'Гидравлический расчёт систем отопления',
  programmnoe_obespechenie_ars_raschet_gazosnabzheniya_zdaniya_upg_s_predydushchikh_versiy_s_3_go_po_5:
    'Обновление модуля газоснабжения со старой версии',
  programmnoe_obespechenie_ars_raschet_gazosnabzheniya_zdaniya:
    'Расчёт внутреннего газопровода здания',
  programmnoe_obespechenie_ars_ps_win_setevoy_na_6_9_litsenziy:
    'Все расчёты АРС для команды из 6–9 мест',
  programmnoe_obespechenie_ars_ps_win_setevoy_na_4_5_litsenziy:
    'Все расчёты АРС для команды из 4–5 мест',
  programmnoe_obespechenie_ars_ps_win_setevoy_na_2_3_litsenzii:
    'Все расчёты АРС для команды из 2–3 мест',
  programmnoe_obespechenie_ars_ps_win_setevoy_na_10_i_bolee_litsenziy:
    'Все расчёты АРС для команды от 10 мест',
  programmnoe_obespechenie_ars_ps_win_6_9_litsenziy_upg_s_predydushchikh_versiy_s_3_go_po_5_yy_god_set:
    'Обновление АРС-ПС на 6–9 мест со старой версии',
  programmnoe_obespechenie_ars_ps_win_4_5_litsenziy_upg_s_predydushchikh_versiy_s_3_go_po_5_yy_god_set:
    'Обновление АРС-ПС на 4–5 мест со старой версии',
  programmnoe_obespechenie_ars_ps_win_2_3_litsenzii_upg_s_predydushchikh_versiy_s_3_go_po_5_yy_god_set:
    'Обновление АРС-ПС на 2–3 места со старой версии',
  programmnoe_obespechenie_ars_ps_win_10_i_bolee_litsenziy_upg_s_predydushchikh_versiy_s_3_go_po_5_yy_:
    'Обновление АРС-ПС от 10 мест со старой версии',
  programmnoe_obespechenie_ars_paroprovody_i_kondensatory_upg_s_predydushchikh_versiy_s_3_go_po_5_yy_g:
    'Обновление модуля паропроводов со старой версии',
  programmnoe_obespechenie_ars_paroprovody_i_kondensatory:
    'Расчёт паропроводов и конденсатопроводов',
  programmnoe_obespechenie_ars_obemy_i_spetsifikatsii_upg_s_predydushchikh_versiy_s_3_go_po_5_yy_god:
    'Обновление модуля спецификаций со старой версии',
  programmnoe_obespechenie_ars_obemy_i_spetsifikatsii:
    'Объёмы работ и спецификации по расчётам АРС',
  programmnoe_obespechenie_ars_inzhenernye_vychisleniya:
    'Инженерный калькулятор и справочные расчёты',
  programmnoe_obespechenie_ars_energeticheskie_raschety_zdaniya_upg_s_predydushchikh_versiy_s_3_go_po_:
    'Обновление модуля энергорасчётов со старой версии',
  programmnoe_obespechenie_ars_energeticheskie_raschety_zdaniya:
    'Энергопаспорт и теплопотери здания',
  klyuch_apparatnoy_zashchity_setevoy_dlya_programmnogo_obespecheniya_ars:
    'USB-ключ для сетевой лицензии АРС',
  klyuch_apparatnoy_zashchity_lokalnyy_dlya_programmnogo_obespecheniya_ars:
    'USB-ключ для локальной лицензии АРС',
  programma_privyazki_k_materialnomu_nositelyu:
    'USB-ключ, чтобы переносить лицензию между компьютерами',

  // Курсы
  raschet_konstruktsiy_zdaniy_po_sisteme_evrokodov_en_1992_1993_s_primeneniem_kompleksa_autodesk_robot:
    'Расчёт зданий по Еврокодам EN 1992–1993 в Robot Structural Analysis',
  onlayn_kurs_model_studio_cs_truboprovody:
    'Онлайн: 3D-проектирование трубопроводов в Model Studio CS',
  onlayn_kurs_civil_3d_proektirovanie_naruzhnykh_inzhenernykh_setey:
    'Онлайн: наружный водопровод и канализация в Civil 3D',
  'onlayn_kurs_civil_3d_genplan-1370029699': 'Онлайн: генплан и вертикальная планировка в Civil 3D',
  onlayn_kurs_autodesk_civil_3d_zheleznye_dorogi:
    'Онлайн: проектирование железных дорог в Civil 3D',
  onlayn_kurs_autodesk_civil_3d_inzhenerno_geodezicheskie_i_geologicheskie_izyskaniya:
    'Онлайн: обработка изысканий и рельеф в Civil 3D',
  ochnyy_kurs_raschet_po_normam_sp_rk_en_v_pk_lira_fem_prodvinutyy_uroven:
    'Очно: сложные расчёты по СП РК EN в ЛИРА-FEM',
  kurs_vizualizatsiya_v_3ds_max_v_ray_s_ispolzovaniem_unreal_engine_5:
    'Визуализация интерьеров и зданий: 3ds Max, V-Ray и Unreal Engine',
  kurs_raschet_v_pk_lira_fem_soglasno_evronormam_sp_rk_en_s_nulya:
    'С нуля: расчёт по СП РК EN в ЛИРА-FEM от эксперта из Казахстана',
  kurs_civil_3d_proektirovanie_avtomobilnykh_dorog:
    'BIM-модель дороги: профили, поперечники и объёмы',
  kurs_civil_3d_inzhenernaya_geodeziya_i_geologiya: 'Обработка геодезии и геологии в Civil 3D',
  kurs_bim_menedzhment_nachalnyy_uroven: 'Основы BIM-менеджмента и внедрения BIM в компании',
  kurs_autodesk_subassembly_composer_zheleznye_dorogi_uglublennyy_kurs:
    'Свои конструкции железнодорожного пути в Subassembly Composer',
  kurs_autodesk_revit_arkhitekturnye_interery: 'Раздел АИ в Revit: от модели до документации',
  kurs_autodesk_civil_3d_zheleznye_dorogi_uglublennyy_kurs:
    'Углублённо: железные дороги в Civil 3D и Dynamo',
  autodesk_revit_mep_slabotochnye_seti: 'Слаботочные сети в Revit по технологии BIM',
  autodesk_advance_steel_bazovyy_kurs: 'Основы: модели металлоконструкций в Advance Steel',

  // Услуги
  CAD_consulting: 'Аудит и настройка проектных процессов под ваши задачи',
  720: 'Обучение сотрудников у сертифицированных инструкторов',
  1443: 'BIM под ключ: стандарты, шаблоны, обучение и сопровождение',

  // Семейства (страница линейки)
  'family:kompas-libraries': 'Стандартные изделия, материалы и справочники конструктора',
  'family:pdplayer': 'Просмотр и сборка последовательностей кадров',
  'family:vrscans': 'Отсканированные материалы для реалистичного V-Ray',
  'family:v-ray': 'Визуализация V-Ray и облачный рендеринг, на месяц или год',
  'family:chaos-education': 'Учебные лицензии V-Ray для студентов и классов',
  'family:ntp-databases': 'Базы данных НТП: оборудование, материалы, текущий проект',
  'family:predklapan': 'Подбор и расчёт предохранительных клапанов',
  'family:izolyatsiya': 'Расчёт тепловой изоляции трубопроводов и оборудования',
  'family:gidrosistema': 'Гидравлика и теплотехника трубопроводов, гидроудар',
  'family:passat': 'Прочность сосудов, колонн, теплообменников и штуцеров',
  'family:start': 'Прочность и жёсткость трубопроводов, остаточный ресурс',
  'family:ntp-revit': 'СТАРТ, Изоляция и Гидросистема прямо в Revit',
  'family:cs-energuide': 'Сетевые лицензии CS EnerGuide',
  'family:cs-gisengine': 'ГИС-платформа для карт и данных на MapGuide',
  'family:stdmanagercs': 'Справочник стандартов и нормативов предприятия',
  'family:poligonsoft': 'Моделирование литья и поиск дефектов отливки',
  'family:technologics': 'Управление инженерными данными и производством',
  'family:tdms': 'Электронный архив и документооборот проектной организации',
  'family:mechanics': 'Машиностроение и оборудование в AutoCAD и Inventor',
  'family:geonics': 'Изыскания, генплан и инженерная подготовка территории',
  'family:rasterdesk-spotlight': 'Правка сканов чертежей и векторизация',
  'family:spds': 'Оформление чертежей по СПДС в AutoCAD и nanoCAD',
  'family:project-studio-cs': 'Архитектура, конструкции и фундаменты в AutoCAD',
  'family:automatics': 'Проектирование автоматизации и КИП',
  'family:energycs': 'Режимы сетей, потери и токи короткого замыкания',
  'family:electrics': 'Электросхемы, оборудование и кабельные журналы',
  'family:espri': 'Небольшие расчёты ЛИРА-FEM по одному: сечения, прогибы, нагрузки',
  'family:monomakh-sapr': 'Расчёт и армирование многоэтажных железобетонных зданий',
  'family:sapfir': 'Архитектурная модель и железобетон для ЛИРА-FEM',
  'family:scad-satellites': 'Проверка элементов, нагрузки и сечения отдельными программами',
}

/** Своё короткое описание товара или семейства из списка выше, если есть. */
/** @param {string | null | undefined} key */
export function ownCardText(key) {
  return (key && CARD_TEXTS[key]) || null
}

/** Предел фразы карточки: две-три строки, дальше — до ближайшей границы части фразы. */
const PHRASE_LIMIT = 100

/**
 * Одна законченная фраза из описания товара: без «Название — », первое предложение; длинное —
 * до последней запятой, точки с запятой или тире перед пределом. Никогда не обрывает слово
 * и не ставит «…» (просьба владельца 27.10.2026).
 * @param {string | null | undefined} summary
 * @param {string} title
 */
export function summaryPhrase(summary, title) {
  if (!summary) return null
  const text = summary.replace(/\s+/g, ' ').trim()
  const dash = text.search(/ [—–-] /)
  return phrase(dash > 0 && dash <= title.length + 24 ? text.slice(dash + 3) : text)
}

/** @param {string} text */
function phrase(text) {
  let result = (text.split(/(?<=[.!?])\s/)[0] ?? text).replace(/[.!?]$/, '')
  if (result.length > PHRASE_LIMIT) {
    const head = result.slice(0, PHRASE_LIMIT)
    const cut = Math.max(head.lastIndexOf(', '), head.lastIndexOf('; '), head.lastIndexOf(' — '))
    if (cut >= 30) result = result.slice(0, cut)
  }
  result = result.trim()
  return result ? result.charAt(0).toUpperCase() + result.slice(1) : null
}

/**
 * Название и фраза карточки по одному правилу для всех карточек каталога (просьба владельца
 * 27.10.2026: единая система). Название — до тире: «АРБАТ - экспертиза и расчёт…» → «АРБАТ»,
 * пояснение после тире становится фразой. Фраза: своя из списка → пояснение из названия →
 * первая фраза описания → запасная (`fallback`). Текст не обрезается.
 * @param {{ title: string, own?: string | null, summary?: string | null, fallback: string }} input
 */
export function cardInfo({ title, own, summary, fallback }) {
  const match = /^(.{2,40}?)\s+[-–—]\s+(.{3,})$/.exec(title)
  const name = match?.[1] ?? title
  const note = match?.[2] ? phrase(match[2]) : null
  return { title: name, text: own || note || summaryPhrase(summary, name) || fallback }
}
