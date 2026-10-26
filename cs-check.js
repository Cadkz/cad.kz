(() => {
  // src/domain/catalogKinds.mjs
  var COLLECTIONS = [
    {
      key: "aec",
      match: /architecture engineering & construction collection|aec collection/i,
      short: "AEC Collection",
      lead: "\u041D\u0430\u0431\u043E\u0440 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C Autodesk \u0434\u043B\u044F \u0430\u0440\u0445\u0438\u0442\u0435\u043A\u0442\u043E\u0440\u043E\u0432, \u043A\u043E\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440\u043E\u0432 \u0438 \u0438\u043D\u0436\u0435\u043D\u0435\u0440\u043E\u0432 \u043F\u043E \u043E\u0434\u043D\u043E\u0439 \u043F\u043E\u0434\u043F\u0438\u0441\u043A\u0435.",
      benefit: "\u041F\u043E \u043E\u0446\u0435\u043D\u043A\u0435 Autodesk, \u043A\u043E\u043B\u043B\u0435\u043A\u0446\u0438\u044F \u043E\u0431\u044B\u0447\u043D\u043E \u0432\u044B\u0433\u043E\u0434\u043D\u0435\u0435, \u0435\u0441\u043B\u0438 \u043D\u0443\u0436\u043D\u044B \u0445\u043E\u0442\u044F \u0431\u044B \u0434\u0432\u0435-\u0442\u0440\u0438 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u044B \u0438\u0437 \u043D\u0430\u0431\u043E\u0440\u0430 \u2014 \u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440, Revit \u0438 AutoCAD.",
      contents: [
        { name: "Revit", title: "Revit" },
        { name: "AutoCAD \u0441\u043E \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u043C\u0438 \u043D\u0430\u0431\u043E\u0440\u0430\u043C\u0438", title: "AutoCAD" },
        { name: "Civil 3D", title: "Civil 3D" },
        { name: "Navisworks Manage", title: "Navisworks" },
        { name: "InfraWorks", title: "InfraWorks" },
        { name: "Advance Steel", title: "Advance Steel" },
        { name: "Robot Structural Analysis Professional" },
        { name: "3ds Max", title: "3ds Max" },
        { name: "ReCap Pro", title: "ReCap Pro" },
        { name: "Fabrication CADmep" },
        { name: "Forma \u2014 \u043A\u043E\u043D\u0446\u0435\u043F\u0446\u0438\u044F \u0437\u0434\u0430\u043D\u0438\u044F \u0438 \u0443\u0447\u0430\u0441\u0442\u043A\u0430" },
        { name: "Insight \u2014 \u044D\u043D\u0435\u0440\u0433\u043E\u0430\u043D\u0430\u043B\u0438\u0437" },
        { name: "Autodesk Rendering" }
      ]
    },
    {
      key: "pdmc",
      match: /product design & manufacturing collection/i,
      short: "PDM Collection",
      lead: "\u041D\u0430\u0431\u043E\u0440 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C Autodesk \u0434\u043B\u044F \u043C\u0430\u0448\u0438\u043D\u043E\u0441\u0442\u0440\u043E\u0435\u043D\u0438\u044F: \u043F\u0440\u043E\u0435\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435, \u0440\u0430\u0441\u0447\u0451\u0442, \u0427\u041F\u0423 \u0438 \u0434\u0430\u043D\u043D\u044B\u0435 \u0438\u0437\u0434\u0435\u043B\u0438\u044F.",
      benefit: "\u041F\u043E \u043E\u0446\u0435\u043D\u043A\u0435 Autodesk, \u043A\u043E\u043B\u043B\u0435\u043A\u0446\u0438\u044F \u043E\u0431\u044B\u0447\u043D\u043E \u0432\u044B\u0433\u043E\u0434\u043D\u0435\u0435, \u0435\u0441\u043B\u0438 \u043D\u0443\u0436\u043D\u044B \u0445\u043E\u0442\u044F \u0431\u044B \u0434\u0432\u0435-\u0442\u0440\u0438 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u044B \u0438\u0437 \u043D\u0430\u0431\u043E\u0440\u0430; \u043A\u0440\u043E\u043C\u0435 Inventor \u0438 AutoCAD \u0432 \u043D\u0435\u0451 \u0432\u0445\u043E\u0434\u044F\u0442 CAM, Nastran \u0438 Vault.",
      contents: [
        { name: "Inventor Professional", title: "Inventor Professional" },
        { name: "AutoCAD \u0441\u043E \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u043C\u0438 \u043D\u0430\u0431\u043E\u0440\u0430\u043C\u0438", title: "AutoCAD" },
        { name: "Fusion", title: "Fusion 360 Team" },
        { name: "Inventor CAM" },
        { name: "Inventor Nastran" },
        { name: "Inventor Tolerance Analysis" },
        { name: "Inventor Nesting" },
        { name: "Factory Design Utilities" },
        { name: "Vault Basic", title: "Vault" },
        { name: "Navisworks Manage", title: "Navisworks" },
        { name: "3ds Max", title: "3ds Max" },
        { name: "ReCap Pro", title: "ReCap Pro" }
      ]
    },
    {
      key: "me",
      match: /media & entertainment collection/i,
      short: "M&E Collection",
      lead: "\u041D\u0430\u0431\u043E\u0440 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C Autodesk \u0434\u043B\u044F 3D-\u0433\u0440\u0430\u0444\u0438\u043A\u0438, \u0430\u043D\u0438\u043C\u0430\u0446\u0438\u0438 \u0438 \u0432\u0438\u0437\u0443\u0430\u043B\u044C\u043D\u044B\u0445 \u044D\u0444\u0444\u0435\u043A\u0442\u043E\u0432.",
      benefit: "\u041F\u043E \u043E\u0446\u0435\u043D\u043A\u0435 Autodesk, \u043A\u043E\u043B\u043B\u0435\u043A\u0446\u0438\u044F \u043E\u0431\u044B\u0447\u043D\u043E \u0432\u044B\u0433\u043E\u0434\u043D\u0435\u0435, \u0435\u0441\u043B\u0438 \u043D\u0443\u0436\u043D\u044B \u0445\u043E\u0442\u044F \u0431\u044B \u0434\u0432\u0435-\u0442\u0440\u0438 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u044B \u0438\u0437 \u043D\u0430\u0431\u043E\u0440\u0430 \u2014 \u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440, Maya \u0438 3ds Max.",
      contents: [
        { name: "Maya", title: "Maya" },
        { name: "3ds Max", title: "3ds Max" },
        { name: "Arnold", title: "Arnold" },
        { name: "MotionBuilder", title: "MotionBuilder" },
        { name: "Mudbox" },
        { name: "Bifrost \u0434\u043B\u044F Maya" },
        { name: "Golaem" },
        { name: "ReCap Pro", title: "ReCap Pro" }
      ]
    },
    {
      key: "lt-suite",
      match: /lt комплект|lt suite/i,
      short: "AutoCAD + Revit LT",
      lead: "\u0414\u0432\u0435 \u043E\u0431\u043B\u0435\u0433\u0447\u0451\u043D\u043D\u044B\u0435 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u044B Autodesk \u043E\u0434\u043D\u043E\u0439 \u043F\u043E\u0434\u043F\u0438\u0441\u043A\u043E\u0439: \u0447\u0435\u0440\u0442\u0435\u0436\u0438 \u0438 \u043F\u0440\u043E\u0441\u0442\u043E\u0435 BIM-\u043C\u043E\u0434\u0435\u043B\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435.",
      benefit: "\u041E\u0434\u043D\u0430 \u043F\u043E\u0434\u043F\u0438\u0441\u043A\u0430 \u0432\u043C\u0435\u0441\u0442\u043E \u0434\u0432\u0443\u0445: \u0443\u0434\u043E\u0431\u043D\u043E, \u043A\u043E\u0433\u0434\u0430 \u043D\u0443\u0436\u043D\u044B \u0438 \u0447\u0435\u0440\u0442\u0435\u0436\u0438, \u0438 \u043C\u043E\u0434\u0435\u043B\u044C \u0437\u0434\u0430\u043D\u0438\u044F.",
      contents: [{ name: "AutoCAD LT" }, { name: "Revit LT" }]
    }
  ];
  function collectionOf(title) {
    return COLLECTIONS.find((entry) => entry.match.test(title ?? "")) ?? null;
  }
  var TYPE_KINDS = {
    scanners: "3D-\u0441\u043A\u0430\u043D\u0435\u0440",
    plotters: "\u041F\u043B\u043E\u0442\u0442\u0435\u0440",
    consumables: "\u0420\u0430\u0441\u0445\u043E\u0434\u043D\u044B\u0439 \u043C\u0430\u0442\u0435\u0440\u0438\u0430\u043B",
    "wide-scanners": "\u0428\u0438\u0440\u043E\u043A\u043E\u0444\u043E\u0440\u043C\u0430\u0442\u043D\u044B\u0439 \u0441\u043A\u0430\u043D\u0435\u0440",
    workstations: "\u0420\u0430\u0431\u043E\u0447\u0430\u044F \u0441\u0442\u0430\u043D\u0446\u0438\u044F",
    training: "\u041A\u0443\u0440\u0441",
    consulting: "\u0423\u0441\u043B\u0443\u0433\u0430"
  };
  var TITLE_KINDS = [
    [/^курс|онлайн[- ]курс|очный курс/i, "\u041A\u0443\u0440\u0441"],
    [/подписка на обновлен|upg с предыдущих|обновлени/i, "\u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435"],
    [/нормативн|сметно|РСНБ/i, "\u041D\u043E\u0440\u043C\u0430\u0442\u0438\u0432\u043D\u0430\u044F \u0431\u0430\u0437\u0430"],
    [/ключ аппаратной|ключ-носитель/i, "\u041A\u043B\u044E\u0447 \u0437\u0430\u0449\u0438\u0442\u044B"],
    [/(^|\s)(блок|модуль)\s|extension/i, "\u041C\u043E\u0434\u0443\u043B\u044C"],
    [/(^|\s)комплект[.\s]/i, "\u041A\u043E\u043C\u043F\u043B\u0435\u043A\u0442"]
  ];
  function typeKind(item) {
    const type = [...item.types ?? []].reverse().find((slug) => TYPE_KINDS[slug]);
    if (type) return TYPE_KINDS[type];
    return item.group === "service" ? "\u0423\u0441\u043B\u0443\u0433\u0430" : "\u041E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u0435";
  }
  function catalogKind(item) {
    if (item.group === "hardware" || item.group === "service") return typeKind(item);
    const title = item.title ?? "";
    const collection = collectionOf(title);
    if (collection) return collection.key === "lt-suite" ? "\u041A\u043E\u043C\u043F\u043B\u0435\u043A\u0442" : "\u041A\u043E\u043B\u043B\u0435\u043A\u0446\u0438\u044F";
    if (item.scope === "family") return "\u041B\u0438\u043D\u0435\u0439\u043A\u0430";
    return TITLE_KINDS.find(([pattern]) => pattern.test(title))?.[1] ?? "\u041F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0430";
  }
  function shortTitle(title) {
    const collection = collectionOf(title);
    if (collection) return collection.short;
    return (title ?? "").replace(/^программный комплекс\s+/i, "").replace(/^программа\s+/i, "").replace(/^графическая станция\s+/i, "").replace(/\s*\(.*?\)\s*/g, " ").replace(/\s+v\.\s*[\d.]+$/i, "").replace(/\s+-\s+/g, "-").replace(/\s+/g, " ").trim();
  }

  // src/domain/priority.mjs
  var TOP_BASE = 10;
  var tier = (rank) => rank >= TOP_BASE ? TOP_BASE : rank;
  function compareInSection(section = null, pins = []) {
    const pinIndex = (item) => {
      const index = item.vendor == null ? -1 : pins.indexOf(item.vendor);
      return index === -1 ? pins.length : index;
    };
    return (a, b) => tier(b.rank) - tier(a.rank) || pinIndex(a) - pinIndex(b) || b.rank - a.rank || (section == null ? 0 : Number(b.main === section) - Number(a.main === section)) || a.title.localeCompare(b.title, "ru", { numeric: true });
  }

  // src/domain/catalogFeatureValues.mjs
  function featureValue(category, key, value) {
    if (category === "plotters" && key === "rolls") {
      if (value === "1+1 \u043E\u043F\u0446\u0438\u044F" || value === "1+1") return "2";
      const numbers = value.match(/\d+/g)?.map(Number) ?? [];
      return numbers.length ? String(Math.max(...numbers)) : value;
    }
    if (key === "resolution") return value.replace(/\s*[x×]\s*/g, " \xD7 ");
    return value;
  }
  function featureLabel(category, key, value) {
    return category === "plotters" && key === "rolls" ? `${value} ${value === "6" ? "\u0440\u0443\u043B\u043E\u043D\u043E\u0432" : "\u0440\u0443\u043B\u043E\u043D\u0430"}` : value;
  }
  function featureDefinition(category, filter) {
    const values = [
      ...new Set(filter.values.map((value) => featureValue(category, filter.key, value)))
    ];
    if (["width", "rolls", "accuracy", "resolution"].includes(filter.key)) {
      const numbers = (value) => (value.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => Number(n.replace(",", ".")));
      values.sort((a, b) => {
        const [x, y] = [numbers(a), numbers(b)];
        for (let i = 0; i < Math.max(x.length, y.length); i++)
          if ((x[i] ?? Infinity) !== (y[i] ?? Infinity))
            return (x[i] ?? Infinity) - (y[i] ?? Infinity);
        return 0;
      });
    }
    if (filter.key === "object_size") {
      const order = ["XS", "S", "M", "L", "XL", "XXL"];
      values.sort((a, b) => order.indexOf(a.split(" ")[0]) - order.indexOf(b.split(" ")[0]));
    }
    return {
      ...filter,
      label: category === "plotters" && filter.key === "rolls" ? "\u0420\u0443\u043B\u043E\u043D\u044B: \u043C\u0430\u043A\u0441\u0438\u043C\u0443\u043C \u0441 \u043E\u043F\u0446\u0438\u044F\u043C\u0438" : filter.label,
      values
    };
  }

  // src/domain/catalogTree.mjs
  function compareInLine(a, b) {
    const order = (item) => item.lineOrder ?? Number.MAX_SAFE_INTEGER;
    return order(a) - order(b) || b.rank - a.rank || a.title.localeCompare(b.title, "ru", { numeric: true });
  }

  // src/domain/equipmentFacets.json
  var equipmentFacets_default = [
    {
      category: "plotters",
      filters: [
        {
          key: "format",
          label: "\u041C\u0430\u043A\u0441\u0438\u043C\u0430\u043B\u044C\u043D\u044B\u0439 \u0444\u043E\u0440\u043C\u0430\u0442 \u043F\u0435\u0447\u0430\u0442\u0438",
          type: "one",
          values: ["A0 (36\u2033, 914 \u043C\u043C)", "A0+ (42\u201344\u2033)"]
        },
        {
          key: "technology",
          label: "\u0422\u0435\u0445\u043D\u043E\u043B\u043E\u0433\u0438\u044F \u043F\u0435\u0447\u0430\u0442\u0438",
          type: "one",
          values: [
            "\u0421\u0442\u0440\u0443\u0439\u043D\u0430\u044F \u043F\u0438\u0433\u043C\u0435\u043D\u0442\u043D\u0430\u044F",
            "\u0422\u0432\u0435\u0440\u0434\u043E\u0447\u0435\u0440\u043D\u0438\u043B\u044C\u043D\u0430\u044F CrystalPoint",
            "\u0421\u0432\u0435\u0442\u043E\u0434\u0438\u043E\u0434\u043D\u0430\u044F (LED) \u0442\u043E\u043D\u0435\u0440\u043D\u0430\u044F"
          ]
        },
        {
          key: "color",
          label: "\u0426\u0432\u0435\u0442 \u043F\u0435\u0447\u0430\u0442\u0438",
          type: "one",
          values: ["\u0426\u0432\u0435\u0442\u043D\u0430\u044F", "\u041C\u043E\u043D\u043E\u0445\u0440\u043E\u043C\u043D\u0430\u044F"]
        },
        {
          key: "resolution",
          label: "\u0420\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u0435 \u043F\u0435\u0447\u0430\u0442\u0438, dpi",
          type: "one",
          values: ["2400 \xD7 1200", "600 \xD7 1200", "600 \xD7 600"]
        },
        {
          key: "speed",
          label: "\u0421\u043A\u043E\u0440\u043E\u0441\u0442\u044C \u043F\u0435\u0447\u0430\u0442\u0438, \u043C\u0430\u043A\u0441.",
          type: "one",
          values: ["3\u20134 \u043B\u0438\u0441\u0442\u0430 A1 \u0432 \u043C\u0438\u043D\u0443\u0442\u0443", "6 \u043B\u0438\u0441\u0442\u043E\u0432 A1 \u0432 \u043C\u0438\u043D\u0443\u0442\u0443", "8\u201310 \u043B\u0438\u0441\u0442\u043E\u0432 A1 \u0432 \u043C\u0438\u043D\u0443\u0442\u0443"]
        },
        {
          key: "rolls",
          label: "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u0440\u0443\u043B\u043E\u043D\u043E\u0432",
          type: "one",
          values: ["2", "1+1 \u043E\u043F\u0446\u0438\u044F", "\u0434\u043E 6", "\u0434\u043E 4", "4 \u0438\u043B\u0438 6", "4"]
        },
        {
          key: "purpose",
          label: "\u041D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435",
          type: "many",
          values: ["\u0421\u0410\u041F\u0420/\u0413\u0418\u0421", "\u0411\u043E\u043B\u044C\u0448\u0438\u0435 \u043E\u0431\u044A\u0451\u043C\u044B", "\u041F\u043E\u0441\u0442\u0435\u0440\u044B"]
        }
      ]
    },
    {
      category: "consumables",
      filters: [
        {
          key: "type",
          label: "\u0422\u0438\u043F \u0440\u0430\u0441\u0445\u043E\u0434\u043D\u0438\u043A\u0430",
          type: "one",
          values: ["\u0422\u043E\u043D\u0435\u0440/TonerPearls", "\u041A\u0430\u0440\u0442\u0440\u0438\u0434\u0436/\u0440\u0430\u0441\u0445\u043E\u0434\u043D\u0438\u043A"]
        },
        {
          key: "color",
          label: "\u0426\u0432\u0435\u0442",
          type: "one",
          values: ["\u0427\u0451\u0440\u043D\u044B\u0439", "\u0413\u043E\u043B\u0443\u0431\u043E\u0439", "\u041F\u0443\u0440\u043F\u0443\u0440\u043D\u044B\u0439", "\u0416\u0451\u043B\u0442\u044B\u0439"]
        },
        {
          key: "compatible",
          label: "\u0421\u043E\u0432\u043C\u0435\u0441\u0442\u0438\u043C\u0430\u044F \u043C\u043E\u0434\u0435\u043B\u044C",
          type: "many",
          values: [
            "colorWAVE T60",
            "colorWAVE T65",
            "colorWAVE 3500",
            "colorWAVE 3600",
            "ColorWave 700",
            "ColorWave 650"
          ]
        },
        {
          key: "generation",
          label: "\u041F\u043E\u043A\u043E\u043B\u0435\u043D\u0438\u0435",
          type: "one",
          values: ["T-\u0441\u0435\u0440\u0438\u044F", "ColorWave 700", "ColorWave 650"]
        }
      ]
    },
    {
      category: "wide-scanners",
      filters: [
        {
          key: "format",
          label: "\u041C\u0430\u043A\u0441\u0438\u043C\u0430\u043B\u044C\u043D\u044B\u0439 \u0444\u043E\u0440\u043C\u0430\u0442 \u0441\u043A\u0430\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F",
          type: "one",
          values: ["A3", "A2", "A0 (36\u2033)", "A0+ (44\u201348\u2033)", "\u0434\u043E 1,5 \u043C (60\u2033)"]
        },
        {
          key: "form",
          label: "\u041A\u043E\u043D\u0441\u0442\u0440\u0443\u043A\u0446\u0438\u044F",
          type: "one",
          values: ["\u041F\u0440\u043E\u0442\u044F\u0436\u043D\u044B\u0439", "\u0411\u0435\u0441\u043A\u043E\u043D\u0442\u0430\u043A\u0442\u043D\u044B\u0439 ART", "\u041F\u043B\u0430\u043D\u0448\u0435\u0442\u043D\u044B\u0439"]
        },
        {
          key: "resolution",
          label: "\u0420\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u0435 \u0441\u043A\u0430\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F, dpi",
          type: "one",
          values: ["600 \xD7 600", "1200 \xD7 600", "1200 \xD7 1200"]
        },
        {
          key: "speed",
          label: "\u0421\u043A\u043E\u0440\u043E\u0441\u0442\u044C \u0441\u043A\u0430\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F",
          type: "one",
          values: [
            "\u0434\u043E 8 \u0434\u044E\u0439\u043C\u043E\u0432 \u0432 \u0441\u0435\u043A\u0443\u043D\u0434\u0443",
            "\u0434\u043E 10 \u0434\u044E\u0439\u043C\u043E\u0432 \u0432 \u0441\u0435\u043A\u0443\u043D\u0434\u0443",
            "\u0434\u043E 15 \u0434\u044E\u0439\u043C\u043E\u0432 \u0432 \u0441\u0435\u043A\u0443\u043D\u0434\u0443",
            "\u041A\u0430\u0434\u0440 \u0437\u0430 3\u20134 \u0441\u0435\u043A\u0443\u043D\u0434\u044B"
          ]
        },
        {
          key: "depth",
          label: "\u0426\u0432\u0435\u0442\u043D\u043E\u0441\u0442\u044C \u0441\u043A\u0430\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F, \u0431\u0438\u0442",
          type: "one",
          values: ["36 \u0431\u0438\u0442", "48 \u0431\u0438\u0442"]
        },
        {
          key: "sensor",
          label: "\u0422\u0435\u0445\u043D\u043E\u043B\u043E\u0433\u0438\u044F \u0441\u0435\u043D\u0441\u043E\u0440\u0430",
          type: "one",
          values: ["CIS", "CCD"]
        },
        {
          key: "pc",
          label: "\u0412\u0441\u0442\u0440\u043E\u0435\u043D\u043D\u044B\u0439 \u041F\u041A",
          type: "one",
          values: ["\u0412\u0441\u0442\u0440\u043E\u0435\u043D\u043D\u044B\u0439"]
        },
        {
          key: "printer_pair",
          label: "\u0418\u043D\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u044F \u0441 \u043F\u043B\u043E\u0442\u0442\u0435\u0440\u043E\u043C",
          type: "one",
          values: ["\u0411\u0435\u0437 \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0439 \u043A\u043E\u043C\u043F\u043B\u0435\u043A\u0442\u0430\u0446\u0438\u0438", "Canon TX"]
        }
      ]
    },
    {
      category: "3d-scanners",
      filters: [
        {
          key: "object_size",
          label: "\u0420\u0430\u0437\u043C\u0435\u0440 \u043E\u0431\u044A\u0435\u043A\u0442\u0430",
          type: "many",
          values: [
            "XL (>200 \u0441\u043C)",
            "XXL (\u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u0430)",
            "L (50\u2013200 \u0441\u043C)",
            "M (20\u201350 \u0441\u043C)",
            "S (5\u201320 \u0441\u043C)",
            "XS (<5 \u0441\u043C)"
          ]
        },
        {
          key: "accuracy",
          label: "\u0422\u043E\u0447\u043D\u043E\u0441\u0442\u044C",
          type: "one",
          values: ["\xB110 \u043C\u043C", "1,9 \u043C\u043C \u043D\u0430 10 \u043C", "0,1 \u043C\u043C", "0,02 \u043C\u043C", "0,05 \u043C\u043C", "0,005 \u043C\u043C"]
        },
        {
          key: "mode",
          label: "\u0418\u0441\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u0435",
          type: "one",
          values: ["\u041C\u043E\u0431\u0438\u043B\u044C\u043D\u044B\u0439 SLAM", "\u041D\u0430\u0437\u0435\u043C\u043D\u044B\u0439 LiDAR", "\u0420\u0443\u0447\u043D\u043E\u0439", "\u041D\u0430\u0441\u0442\u043E\u043B\u044C\u043D\u044B\u0439", "\u0424\u043E\u0442\u043E\u0433\u0440\u0430\u043C\u043C\u0435\u0442\u0440\u0438\u044F"]
        },
        {
          key: "wireless",
          label: "\u0420\u0430\u0431\u043E\u0442\u0430 \u0431\u0435\u0437 \u043F\u0440\u043E\u0432\u043E\u0434\u0430",
          type: "one",
          values: ["\u0414\u0430", "\u041D\u0435\u0442"]
        },
        {
          key: "technology",
          label: "\u0422\u0435\u0445\u043D\u043E\u043B\u043E\u0433\u0438\u044F",
          type: "one",
          values: ["SLAM LiDAR", "LiDAR", "\u0421\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0439 \u0441\u0432\u0435\u0442", "\u041B\u0430\u0437\u0435\u0440", "\u0424\u043E\u0442\u043E\u0433\u0440\u0430\u043C\u043C\u0435\u0442\u0440\u0438\u044F"]
        },
        {
          key: "purpose",
          label: "\u041D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435",
          type: "many",
          values: [
            "\u0410\u0440\u0445\u0438\u0442\u0435\u043A\u0442\u0443\u0440\u0430 \u0438 \u0437\u0434\u0430\u043D\u0438\u044F",
            "\u041A\u043E\u043D\u0442\u0440\u043E\u043B\u044C \u043A\u0430\u0447\u0435\u0441\u0442\u0432\u0430",
            "\u0420\u0435\u0432\u0435\u0440\u0441-\u0438\u043D\u0436\u0438\u043D\u0438\u0440\u0438\u043D\u0433",
            "\u041C\u0435\u0434\u0438\u0446\u0438\u043D\u0430",
            "\u041A\u0443\u043B\u044C\u0442\u0443\u0440\u043D\u043E\u0435 \u043D\u0430\u0441\u043B\u0435\u0434\u0438\u0435"
          ]
        }
      ]
    },
    {
      category: "software",
      filters: [
        {
          key: "license",
          label: "\u0422\u0438\u043F \u043B\u0438\u0446\u0435\u043D\u0437\u0438\u0438",
          type: "one",
          values: ["\u041F\u043E\u0434\u043F\u0438\u0441\u043A\u0430", "\u0411\u0435\u0441\u0441\u0440\u043E\u0447\u043D\u0430\u044F/\u043F\u043E \u043A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u0438"]
        },
        {
          key: "term",
          label: "\u0421\u0440\u043E\u043A \u043B\u0438\u0446\u0435\u043D\u0437\u0438\u0438",
          type: "one",
          values: ["1 \u0438\u043B\u0438 3 \u0433\u043E\u0434\u0430", "\u0417\u0430\u0432\u0438\u0441\u0438\u0442 \u043E\u0442 \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0430"]
        },
        {
          key: "deployment",
          label: "\u0420\u0430\u0437\u043C\u0435\u0449\u0435\u043D\u0438\u0435",
          type: "one",
          values: ["\u041B\u043E\u043A\u0430\u043B\u044C\u043D\u0430\u044F", "\u041E\u0431\u043B\u0430\u0447\u043D\u0430\u044F"]
        },
        {
          key: "edition",
          label: "\u0420\u0435\u0434\u0430\u043A\u0446\u0438\u044F / \u043A\u043E\u043C\u043F\u043B\u0435\u043A\u0442\u0430\u0446\u0438\u044F",
          type: "one",
          values: ["\u041A\u043E\u043B\u043B\u0435\u043A\u0446\u0438\u044F", "\u041F\u043E\u043B\u043D\u0430\u044F", "LT", "\u041F\u0430\u043A\u0435\u0442/\u043C\u043E\u0434\u0443\u043B\u0438", "\u041E\u0431\u043B\u0430\u043A\u043E"]
        },
        {
          key: "purpose",
          label: "\u0417\u0430\u0434\u0430\u0447\u0438",
          type: "many",
          values: [
            "\u0421\u0410\u041F\u0420",
            "BIM",
            "\u041E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0430 3D-\u0441\u043A\u0430\u043D\u043E\u0432",
            "3D-\u043C\u043E\u0434\u0435\u043B\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435",
            "\u0418\u043D\u0436\u0435\u043D\u0435\u0440\u043D\u044B\u0435 \u0440\u0430\u0441\u0447\u0451\u0442\u044B",
            "\u0413\u0435\u043E\u0442\u0435\u0445\u043D\u0438\u043A\u0430",
            "\u0421\u043C\u0435\u0442\u044B",
            "\u0420\u0435\u0432\u0435\u0440\u0441-\u0438\u043D\u0436\u0438\u043D\u0438\u0440\u0438\u043D\u0433",
            "\u0421\u043E\u0432\u043C\u0435\u0441\u0442\u043D\u0430\u044F \u0440\u0430\u0431\u043E\u0442\u0430"
          ]
        }
      ]
    }
  ];

  // src/lib/catalogFilter.ts
  var POPULAR = "popular";
  var emptyFilter = {
    group: null,
    direction: null,
    type: null,
    vendors: [],
    line: null,
    tasks: [],
    features: {},
    page: 1
  };
  var groups = ["software", "hardware", "service"];
  var views = [POPULAR, ...groups];
  var catalogFeatures = equipmentFacets_default.map((category) => ({
    ...category,
    filters: category.filters.map((filter) => featureDefinition(category.category, filter))
  }));
  var vendorView = (state) => state.vendors.length === 1;
  function visible(item, state, ignore) {
    const tasksOn = state.tasks.length > 0 || ignore === "tasks";
    const featuresOn = Object.values(state.features ?? {}).some((values) => values.length) || ignore?.startsWith("feature:");
    switch (item.scope) {
      case "family":
        return !vendorView(state) && !featuresOn;
      case "detail":
        return vendorView(state) || tasksOn || featuresOn;
      case "task":
        return tasksOn;
      default:
        return true;
    }
  }
  function matches(item, state, ignore) {
    if (!visible(item, state, ignore)) return false;
    if (item.group === "service" && state.group !== "service") return false;
    if (ignore !== "group" && state.group && item.group !== state.group) return false;
    if (ignore !== "direction" && state.direction && !item.directions.includes(state.direction))
      return false;
    if (ignore !== "type" && state.type && !item.types.includes(state.type)) return false;
    if (ignore !== "vendors" && state.vendors.length && !state.vendors.includes(item.vendor ?? ""))
      return false;
    if (ignore !== "line" && state.line && item.line !== (state.line === "other" ? null : state.line))
      return false;
    if (ignore !== "tasks" && state.tasks.length && !item.tasks.some((t) => state.tasks.includes(t)))
      return false;
    const category = featureCategory(state);
    for (const filter of category?.filters ?? []) {
      const key = `${category?.category}.${filter.key}`;
      const selected = state.features?.[key] ?? [];
      if (ignore === `feature:${key}` || !selected.length) continue;
      if (item.research?.category !== category?.category || !selected.some(
        (value) => item.research?.filters[filter.key]?.some(
          (raw) => featureValue(category?.category, filter.key, raw) === value
        )
      ))
        return false;
    }
    return true;
  }
  function featureCategory(state) {
    const category = state.type === "scanners" ? "3d-scanners" : state.type;
    if (!category || category === "software") return void 0;
    return catalogFeatures.find((entry) => entry.category === category);
  }
  function featureOptions(items, state) {
    const category = featureCategory(state);
    return (category?.filters ?? []).map((filter) => {
      const key = `${category?.category}.${filter.key}`;
      const selected = state.features?.[key] ?? [];
      const scope = items.filter(
        (item) => item.research?.category === category?.category && matches(item, state, `feature:${key}`)
      );
      const options = filter.values.map((value) => ({
        value,
        label: featureLabel(category?.category, filter.key, value),
        count: scope.filter(
          (item) => item.research?.filters[filter.key]?.some(
            (raw) => featureValue(category?.category, filter.key, raw) === value
          )
        ).length
      })).filter((option) => option.count > 0 || selected.includes(option.value));
      return {
        key,
        label: filter.label,
        options: !selected.length && options.length === 1 && options[0]?.count === scope.length ? [] : options
      };
    }).filter((group) => group.options.length);
  }
  function countBy(items, values) {
    const counts = /* @__PURE__ */ new Map();
    for (const item of items)
      for (const value of new Set(values(item)))
        if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
    return counts;
  }
  var byLabel = (a, b) => a.label.localeCompare(b.label, "ru");
  var TOP_SALES_RANK = 10;
  function vendorOrder(items, pins) {
    const first = /* @__PURE__ */ new Map();
    items.forEach((item, index) => {
      if (item.vendor && item.rank >= TOP_SALES_RANK && !first.has(item.vendor))
        first.set(item.vendor, index);
    });
    const place = (option) => {
      const pin = pins.indexOf(option.value);
      if (pin !== -1) return pin;
      const top = first.get(option.value);
      return top == null ? Number.MAX_SAFE_INTEGER : pins.length + top;
    };
    return (a, b) => place(a) - place(b) || byLabel(a, b);
  }
  function facetOptions(items, facets, state) {
    const scope = (key) => items.filter((item) => matches(item, state, key));
    const groupCounts = countBy(items, (item) => [item.group]);
    const navigation = items.filter((item) => matches(item, { ...emptyFilter, group: state.group }));
    const directionCounts = countBy(navigation, (item) => item.directions);
    const typeCounts = countBy(navigation, (item) => item.types);
    const vendorCounts = countBy(scope("vendors"), (item) => [item.vendor]);
    const taskCounts = countBy(scope("tasks"), (item) => item.tasks);
    const section = state.type ?? state.direction;
    const pins = facets.find((facet) => facet.slug === section)?.pins ?? [];
    const fromFacets = (list, counts, selected) => list.map((facet) => ({
      value: facet.slug,
      label: facet.title,
      count: counts.get(facet.slug) ?? 0
    })).filter((option) => option.count > 0 || option.value === selected);
    const fromCounts = (counts, selected, order = byLabel) => [.../* @__PURE__ */ new Set([...counts.keys(), ...selected])].map((value) => ({ value, label: value, count: counts.get(value) ?? 0 })).sort(order);
    const typeGroup = state.group === "service" ? "service" : "hardware";
    const typeSelected = parentType(facets, state.type);
    const taskList = fromCounts(taskCounts, state.tasks);
    const shown = items.filter((item) => matches(item, state)).length;
    const narrows = state.tasks.length > 0 || taskList.some((option) => option.count !== shown);
    return {
      features: featureOptions(items, state),
      groups: groups.filter((group) => (groupCounts.get(group) ?? 0) > 0),
      // Как в меню «Каталог»: направление — раздел программ, тип — оборудования или услуг; открыт
      // один — другой список не показываем.
      directions: (state.group === null || state.group === "software") && !state.type ? fromFacets(
        facets.filter((f) => f.isDirection),
        directionCounts,
        state.direction
      ) : [],
      typeGroup,
      types: state.group === "software" || state.group === POPULAR || state.direction ? [] : fromFacets(
        facets.filter((f) => !f.isDirection && !f.parent && f.group === typeGroup),
        typeCounts,
        typeSelected
      ),
      typeSelected,
      // У услуг список производителей не нужен: там один CAD.kz (аудит 21.10.2026, К5).
      vendors: state.group === "service" ? [] : fromCounts(vendorCounts, state.vendors, vendorOrder(items, pins)),
      // Задачи раскрываются после выбора направления или типа: так фильтр остаётся коротким.
      tasks: (state.direction || state.type) && narrows ? taskList : []
    };
  }
  function parentType(facets, type) {
    if (!type) return null;
    return facets.find((facet) => facet.slug === type)?.parent ?? type;
  }
  function groupedResults(items, state, lines) {
    if (!vendorView(state)) return null;
    const list = items.filter((item) => matches(item, state));
    const own = lines.filter((line) => line.vendor === state.vendors[0]).sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, "ru"));
    const groups2 = own.map((line) => ({
      key: line.id,
      title: line.title,
      href: line.familyHref,
      items: list.filter((item) => item.line === line.id).sort(compareInLine)
    })).filter((group) => group.items.length > 0);
    const known = new Set(groups2.map((group) => group.key));
    const rest = list.filter((item) => item.line == null || !known.has(item.line));
    if (rest.length)
      groups2.push({
        key: "other",
        title: groups2.length ? "\u0414\u0440\u0443\u0433\u0438\u0435 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u044B" : "",
        href: null,
        items: rest.sort(compareInLine)
      });
    if (groups2.length === 1 && groups2[0]) groups2[0] = { ...groups2[0], title: "" };
    return groups2;
  }
  var DIRECTION_ALIASES = { cad: "arch" };
  function fromParams(params) {
    const one = (key) => {
      const value = params[key];
      return (Array.isArray(value) ? value[0] : value) || null;
    };
    const many = (key) => {
      const value = params[key];
      return (Array.isArray(value) ? value : value ? [value] : []).filter(Boolean);
    };
    const group = one("group");
    const page = Number(one("page"));
    const features = {};
    const category = featureCategory({ type: one("type") });
    for (const filter of category?.filters ?? []) {
      const key = `${category?.category}.${filter.key}`;
      const selected = [
        ...new Set(
          many(`spec.${key}`).map((value) => featureValue(category?.category, filter.key, value))
        )
      ].filter((value) => filter.values.includes(value));
      if (selected.length) features[key] = selected;
    }
    return {
      group: views.includes(group) ? group : null,
      direction: (() => {
        const direction = one("direction");
        return direction ? DIRECTION_ALIASES[direction] ?? direction : null;
      })(),
      type: one("type"),
      vendors: many("vendor"),
      line: one("line"),
      tasks: many("task"),
      features,
      page: Number.isInteger(page) && page > 0 ? page : 1
    };
  }
  function fromSearch(search) {
    const query = new URLSearchParams(search);
    const params = {};
    for (const key of new Set(query.keys())) params[key] = query.getAll(key);
    return fromParams(params);
  }

  // src/lib/plural.ts
  function positions(n) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return `${n} \u043F\u043E\u0437\u0438\u0446\u0438\u044F`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} \u043F\u043E\u0437\u0438\u0446\u0438\u0438`;
    return `${n} \u043F\u043E\u0437\u0438\u0446\u0438\u0439`;
  }

  // src/lib/catalogShelves.ts
  var EXAMPLES = 3;
  var MINOR_KINDS = /* @__PURE__ */ new Set(["\u0420\u0430\u0441\u0445\u043E\u0434\u043D\u044B\u0439 \u043C\u0430\u0442\u0435\u0440\u0438\u0430\u043B", "\u041A\u043B\u044E\u0447 \u0437\u0430\u0449\u0438\u0442\u044B", "\u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435"]);
  var sectionState = (facet) => facet.isDirection ? { ...emptyFilter, group: "software", direction: facet.slug } : { ...emptyFilter, group: facet.group, type: facet.slug };
  function sectionItems(items, facets, state) {
    const section = state.type ?? state.direction;
    const pins = facets.find((facet) => facet.slug === section)?.pins ?? [];
    return items.filter((item) => matches(item, state)).sort(compareInSection(section, pins));
  }
  function landingShelves(items, facets) {
    const tile = (facet) => {
      const list = sectionItems(items, facets, sectionState(facet));
      const main = list.filter((item) => !MINOR_KINDS.has(catalogKind(item)));
      const examples = [
        ...new Set((main.length ? main : list).map((i) => shortTitle(i.title)))
      ].slice(0, EXAMPLES);
      return {
        slug: facet.slug,
        title: facet.title,
        summary: facet.summary ?? null,
        icon: facet.icon ?? null,
        group: facet.group,
        isDirection: facet.isDirection,
        count: list.length,
        examples
      };
    };
    const of = (group, directions) => facets.filter((f) => f.group === group && f.isDirection === directions && !f.parent).map(tile).filter((entry) => entry.count > 0);
    return {
      software: of("software", true),
      hardware: of("hardware", false),
      service: of("service", false)
    };
  }
  function sectionShelves(items, facets, state) {
    const list = sectionItems(items, facets, state);
    const children = state.type ? facets.filter((facet) => facet.parent === state.type) : [];
    if (children.length) {
      return children.map((child) => ({
        key: child.slug,
        title: child.title,
        pick: { type: child.slug },
        items: list.filter((item) => item.types.includes(child.slug))
      })).filter((shelf) => shelf.items.length > 0);
    }
    const order = facetOptions(items, facets, state).vendors.map((option) => option.value);
    const shelves = order.map((vendor) => ({
      key: vendor,
      title: vendor,
      pick: { vendors: [vendor] },
      items: list.filter((item) => item.vendor === vendor)
    })).filter((shelf) => shelf.items.length > 0);
    const rest = list.filter((item) => !item.vendor);
    if (rest.length) shelves.push({ key: "other", title: "", pick: {}, items: rest });
    return shelves;
  }
  var INCLUDES_SHOWN = 3;
  function cardInfo(item, items) {
    const kind = catalogKind(item);
    const collection = collectionOf(item.title);
    if (collection)
      return {
        kind,
        includes: {
          names: collection.contents.slice(0, INCLUDES_SHOWN).map((entry) => entry.name),
          total: collection.contents.length
        }
      };
    if (item.scope === "family" && item.line) {
      const members = items.filter(
        (other) => other.line === item.line && other.scope !== "family" && other.id !== item.id
      );
      const names = [...new Set(members.map((member) => shortTitle(member.title)))];
      return {
        kind,
        includes: names.length ? { names: names.slice(0, INCLUDES_SHOWN), total: names.length } : null
      };
    }
    return { kind, includes: null };
  }
  function collectionContents(title, items) {
    const collection = collectionOf(title);
    if (!collection) return null;
    const byTitle = new Map(
      items.filter((item) => item.scope === "all").map((item) => [item.title.toLowerCase(), item.href])
    );
    return {
      lead: collection.lead,
      benefit: collection.benefit,
      contents: collection.contents.map((entry) => ({
        name: entry.name,
        href: "title" in entry && entry.title && byTitle.get(entry.title.toLowerCase()) || null
      }))
    };
  }
  function popularEntries(popular, items, facets) {
    const listed = items.filter((item) => item.scope === "all" || item.scope === "family");
    const byHref = new Map(listed.map((item) => [item.href, item]));
    return popular.flatMap((card, index) => {
      const found = byHref.get(card.href);
      if (found) return [{ item: found, info: cardInfo(found, items), note: null }];
      const [path, query = ""] = card.href.split("?");
      const members = path === "/catalog" ? sectionItems(items, facets, fromSearch(query)) : listed.filter((item) => item.title.toLowerCase().includes(card.title.toLowerCase()));
      const [first] = members;
      if (!first) return [];
      const names = [...new Set(members.map((item) => shortTitle(item.title)))];
      const vendors = new Set(members.map((item) => item.vendor));
      const vendor = vendors.size === 1 ? first.vendor : null;
      return [
        {
          item: {
            ...first,
            id: -1e6 - index,
            href: card.href,
            title: card.title,
            vendor,
            manufacturer: vendor,
            picture: card.picture ?? first.picture,
            summary: names.slice(0, INCLUDES_SHOWN).join(", ") + (names.length > INCLUDES_SHOWN ? "\u2026" : ""),
            priceFrom: null,
            offersCount: 0,
            cartOfferId: null,
            badge: null,
            lifecycle: null
          },
          info: { kind: "\u041F\u043E\u0434\u0431\u043E\u0440\u043A\u0430", includes: null },
          note: positions(members.length)
        }
      ];
    });
  }
  function childChips(items, facets, head, state) {
    const children = facets.filter(
      (entry) => entry.parent === head.slug && sectionItems(items, facets, { ...state, type: entry.slug, vendors: [] }).length > 0
    );
    if (children.length < 2) return [];
    return [
      { key: "all", label: "\u0412\u0441\u0435", selected: state.type === head.slug, pick: { type: head.slug } },
      ...children.map((child) => ({
        key: child.slug,
        label: child.title,
        selected: state.type === child.slug,
        pick: { type: child.slug }
      }))
    ];
  }
  function vendorChips(items, facets, state) {
    const all = sectionShelves(items, facets, { ...state, vendors: [], tasks: [], features: {} });
    const named = all.filter((shelf) => shelf.title);
    if (named.length < 2) return [];
    return [
      { key: "all", label: "\u0412\u0441\u0435", selected: !state.vendors.length, pick: { vendors: [] } },
      ...named.map((shelf) => ({
        key: shelf.key,
        label: shelf.title,
        selected: state.vendors.includes(shelf.key),
        pick: shelf.pick
      }))
    ];
  }
  function sectionView(items, facets, lines, state) {
    const facet = facets.find((entry) => entry.slug === (state.type ?? state.direction));
    const head = facet?.parent && facets.find((entry) => entry.slug === facet.parent) || facet;
    const sub = head ? childChips(items, facets, head, state) : [];
    const chips = sub.length ? sub : vendorChips(items, facets, state);
    const narrowed = state.tasks.length > 0 || Object.values(state.features).some((values) => values.length);
    const flat = narrowed ? sectionItems(items, facets, state) : null;
    const groups2 = !flat && state.vendors.length === 1 ? groupedResults(items, state, lines) : null;
    const shelves = flat || groups2 ? [] : sectionShelves(items, facets, state);
    const count = (list) => list.reduce((sum, g) => sum + g.items.length, 0);
    return {
      head: head ?? null,
      chipsAre: sub.length ? "\u041F\u043E\u0434\u0440\u0430\u0437\u0434\u0435\u043B" : "\u041F\u0440\u043E\u0438\u0437\u0432\u043E\u0434\u0438\u0442\u0435\u043B\u044C",
      chips,
      flat,
      groups: groups2,
      shelves,
      total: flat?.length ?? (groups2 ? count(groups2) : count(shelves))
    };
  }

  // ../../../tmp/claude-0/bundle/entry.ts
  globalThis.CS = { catalogKind, shortTitle, landingShelves, popularEntries, sectionView, cardInfo, collectionContents, fromSearch };
})();
