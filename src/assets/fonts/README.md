# Шрифты для PDF

Golos Text Regular и SemiBold в TTF — для PDF «Характеристики оборудования» (`src/lib/specSheet.ts`).
Сайт берёт шрифт из `public/fonts` (woff2 по алфавитам); для PDF нужен цельный статический TTF:
кириллица, казахские буквы, латиница и знак тенге в одном файле.

Источник: пакет npm `@expo-google-fonts/golos-text` 0.4.2 (те же файлы, что в Google Fonts).
Лицензия — SIL Open Font License 1.1, текст в `OFL.txt`.
