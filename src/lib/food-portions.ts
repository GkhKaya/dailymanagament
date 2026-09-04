export interface FoodPortionOption {
  name: string;
  gram_weight: number;
  label?: string;
  isRawGram?: boolean;
}

export interface PortionFoodInput {
  name: string;
  unit_type?: string;
  portions?: Array<{ name: string; gram_weight: number; label?: string }>;
}

export function detectFoodCategory(rawName: string): string {
  const n = (rawName || '').toLowerCase().trim();

  // 1. Meats, Poultry, Seafood
  if (
    /(tavu[kğ]|hindi|biftek|antrikot|bonfile|pirzola|kıyma|köfte|kofte|somon|ton bal|balı[kğ]|hamsi|levrek|çipura|karides|et\b|dana|kuzu|ciğer|ciger|döner|doner|şiş\b|kebap|salam|sosis|sucuk|pastırma|nugget|schnitzel)/.test(n)
  ) {
    return 'meat';
  }

  // 2. Eggs
  if (/(yumurta|omlet|menemen)/.test(n)) {
    return 'egg';
  }

  // 3. Soups
  if (/(çorba|corba|ezogelin|tarhana|yayla çor|kelle paça|mercimek çor|paça|işkembe)/.test(n)) {
    return 'soup';
  }

  // 4. Oils, Sauces, Spreads, Honey, Jam
  if (
    /(zeytinyağ|tereyağ|sıvı yağ|fıstı[kğ] ezmesi|fındı[kğ] ezmesi|nutella|kakaolu fındık|bal\b|reçel|recel|pekmez|tahin|salça|salca|mayonez|ketçap|ketcap|hardal|sos\b|sirke|nar ekşisi)/.test(n)
  ) {
    return 'oil_spread';
  }

  // 5. Liquid drinks, Milk, Kefir, Ayran
  if (
    /(süt\b|sut\b|ayran|kefir|su\b|limonata|meyve suyu|kola\b|çay\b|cay\b|kahve|espresso|latte|smoothie|shake|protein tozu)/.test(n)
  ) {
    return 'beverage';
  }

  // 6. Yogurt
  if (/(yoğurt|yogurt|cacık|cacik|labne)/.test(n)) {
    return 'yogurt';
  }

  // 7. Cheese
  if (/(peynir|kaşar|kasar|lor\b|tulum|parmesan|çökelek|mozzarella|cheddar)/.test(n)) {
    return 'cheese';
  }

  // 8. Breads, Pastries, Bakery
  if (
    /(ekme[kğ]|tost|toast|dilim\b|lavaş|lavas|pide|simit|poğaça|pogaca|börek|borek|kruvasan|sandviç|sandvic|dürüm|durum|gözleme|bazlama|yufka)/.test(n)
  ) {
    return 'bread';
  }

  // 9. Grains, Rice, Pasta, Legumes, Flour
  if (
    /(pirinç|pirinc|bulgur|makarna|yulaf|mercimek|nohut|kuru fasulye|fasulye|barbunya|kinoa|un\b|irmik|spagetti|erişte|müsli|musli|granola)/.test(n)
  ) {
    return 'grain';
  }

  // 10. Nuts and Seeds
  if (
    /(ceviz|badem|fındık|findik|fıstık|fistik|kaju|leblebi|çekirdek|cekirdek|chia|keten tohumu|kabak çekirdeği)/.test(n)
  ) {
    return 'nut';
  }

  // 11. Fruits
  if (
    /(elma|armut|muz\b|portakal|mandalina|çilek|cilek|karpuz|kavun|şeftali|seftali|üzüm|uzum|erik|kiraz|vişne|incir|avokado|hurma|kayısı|ananas)/.test(n)
  ) {
    return 'fruit';
  }

  // 12. Vegetables and Salads
  if (
    /(domates|salatalık|salatalik|biber|marul|roka|ıspanak|ispanak|brokoli|karnabahar|kabak|patlıcan|patlican|patates|havuç|havuc|salata|pırasa|enginar|bamya|kereviz)/.test(n)
  ) {
    return 'vegetable';
  }

  // 13. Sweets, Snacks, Chocolate
  if (
    /(çikolata|cikolata|bisküvi|biskuvi|gofret|kek\b|pasta\b|kurabiye|tatlı|tatli|dondurma|baklava|lokum|cips|kraker)/.test(n)
  ) {
    return 'sweet';
  }

  return 'general';
}

export function getSmartPortionOptions(food: PortionFoodInput): FoodPortionOption[] {
  const options: FoodPortionOption[] = [];
  const addedNames = new Set<string>();

  const addOpt = (opt: FoodPortionOption) => {
    const key = opt.name.toLowerCase().trim();
    if (!addedNames.has(key)) {
      addedNames.add(key);
      options.push(opt);
    }
  };

  // 1. Food specific predefined portions from database (TÜRKOMP, verified brands, manual custom portions)
  if (food.portions && food.portions.length > 0) {
    for (const p of food.portions) {
      addOpt({ name: p.name, gram_weight: p.gram_weight, label: p.label });
    }
  }

  // 2. Always include Standard Gram Options
  addOpt({ name: '100 Gram (Standart)', gram_weight: 100, isRawGram: true });

  // 3. Category-specific realistic portions
  const cat = detectFoodCategory(food.name);

  switch (cat) {
    case 'meat':
      if (/(köfte|kofte|sucuk|sosis|nugget)/.test(food.name.toLowerCase())) {
        addOpt({ name: '1 Adet / Dilim (35g)', gram_weight: 35 });
        addOpt({ name: '1 Porsiyon (150g)', gram_weight: 150 });
        addOpt({ name: '1 Porsiyon (200g)', gram_weight: 200 });
      } else {
        addOpt({ name: '1 Porsiyon (150g)', gram_weight: 150 });
        addOpt({ name: '1 Porsiyon (200g)', gram_weight: 200 });
        addOpt({ name: '1 Parça / Fileto (130g)', gram_weight: 130 });
        addOpt({ name: '1 Avuç İçi (100g)', gram_weight: 100 });
      }
      break;

    case 'egg':
      addOpt({ name: '1 Adet (M Boy - 50g)', gram_weight: 50 });
      addOpt({ name: '1 Adet (L Boy - 60g)', gram_weight: 60 });
      addOpt({ name: '2 Adet (100g)', gram_weight: 100 });
      addOpt({ name: '1 Porsiyon (120g)', gram_weight: 120 });
      break;

    case 'soup':
      addOpt({ name: '1 Kase (250g)', gram_weight: 250 });
      addOpt({ name: '1 Küçük Kase (180g)', gram_weight: 180 });
      addOpt({ name: '1 Büyük Tabak / Porsiyon (300g)', gram_weight: 300 });
      addOpt({ name: '1 Kepçe (150g)', gram_weight: 150 });
      break;

    case 'oil_spread':
      addOpt({ name: '1 Yemek Kaşığı (15g)', gram_weight: 15 });
      addOpt({ name: '1 Tatlı Kaşığı (8g)', gram_weight: 8 });
      addOpt({ name: '1 Çay Kaşığı (4g)', gram_weight: 4 });
      addOpt({ name: '1 Porsiyon (20g)', gram_weight: 20 });
      break;

    case 'beverage':
      addOpt({ name: '1 Su Bardağı (200g)', gram_weight: 200 });
      addOpt({ name: '1 Çay Bardağı (100g)', gram_weight: 100 });
      addOpt({ name: '1 Büyük Kupa (300g)', gram_weight: 300 });
      addOpt({ name: '1 Şişe / Kutu (330g)', gram_weight: 330 });
      break;

    case 'yogurt':
      addOpt({ name: '1 Kase (200g)', gram_weight: 200 });
      addOpt({ name: '1 Küçük Kase (150g)', gram_weight: 150 });
      addOpt({ name: '1 Su Bardağı (200g)', gram_weight: 200 });
      addOpt({ name: '1 Tepeleme Yemek Kaşığı (50g)', gram_weight: 50 });
      addOpt({ name: '1 Yemek Kaşığı (30g)', gram_weight: 30 });
      break;

    case 'cheese':
      addOpt({ name: '1 Dilim / Kibrit Kutusu (30g)', gram_weight: 30 });
      addOpt({ name: '2 Dilim (60g)', gram_weight: 60 });
      addOpt({ name: '1 Porsiyon (50g)', gram_weight: 50 });
      addOpt({ name: '1 Yemek Kaşığı (Rende/Lor - 20g)', gram_weight: 20 });
      break;

    case 'bread':
      addOpt({ name: '1 Standart Dilim (35g)', gram_weight: 35 });
      addOpt({ name: '1 İnce Dilim (25g)', gram_weight: 25 });
      addOpt({ name: '1 Kalın Dilim (50g)', gram_weight: 50 });
      addOpt({ name: '1 Adet / Tam (100g)', gram_weight: 100 });
      addOpt({ name: 'Yarım Adet (50g)', gram_weight: 50 });
      addOpt({ name: '1 Porsiyon (80g)', gram_weight: 80 });
      break;

    case 'grain':
      addOpt({ name: '1 Porsiyon (Pişmiş 200g)', gram_weight: 200 });
      addOpt({ name: '1 Su Bardağı (Pişmiş 180g)', gram_weight: 180 });
      addOpt({ name: '1 Su Bardağı (Çiğ 150g)', gram_weight: 150 });
      addOpt({ name: '1 Çay Bardağı (Çiğ 80g)', gram_weight: 80 });
      addOpt({ name: '1 Kase (Pişmiş 200g)', gram_weight: 200 });
      addOpt({ name: '4 Yemek Kaşığı (Pişmiş 100g)', gram_weight: 100 });
      break;

    case 'nut':
      addOpt({ name: '1 Avuç (30g)', gram_weight: 30 });
      addOpt({ name: '1 Porsiyon (30g)', gram_weight: 30 });
      addOpt({ name: '1 Çay Bardağı (70g)', gram_weight: 70 });
      addOpt({ name: '1 Yemek Kaşığı (15g)', gram_weight: 15 });
      if (food.name.toLowerCase().includes('ceviz')) {
        addOpt({ name: '1 Adet Ceviz İçi (5g)', gram_weight: 5 });
      } else {
        addOpt({ name: '10 Adet (12g)', gram_weight: 12 });
      }
      break;

    case 'fruit':
      addOpt({ name: '1 Adet (Orta Boy - 150g)', gram_weight: 150 });
      addOpt({ name: '1 Adet (Küçük Boy - 100g)', gram_weight: 100 });
      addOpt({ name: '1 Adet (Büyük Boy - 200g)', gram_weight: 200 });
      addOpt({ name: '1 Porsiyon (150g)', gram_weight: 150 });
      addOpt({ name: '1 Kase (Doğranmış - 180g)', gram_weight: 180 });
      if (/(karpuz|kavun)/.test(food.name.toLowerCase())) {
        addOpt({ name: '1 Dilim (150g)', gram_weight: 150 });
      }
      break;

    case 'vegetable':
      addOpt({ name: '1 Porsiyon (150g)', gram_weight: 150 });
      addOpt({ name: '1 Tabak / Kase (200g)', gram_weight: 200 });
      addOpt({ name: '1 Adet (Orta Boy - 120g)', gram_weight: 120 });
      addOpt({ name: '4 Yemek Kaşığı (120g)', gram_weight: 120 });
      break;

    case 'sweet':
      addOpt({ name: '1 Porsiyon (80g)', gram_weight: 80 });
      addOpt({ name: '1 Dilim (100g)', gram_weight: 100 });
      addOpt({ name: '1 Adet / Paket (45g)', gram_weight: 45 });
      addOpt({ name: '2 Kare / Parça (15g)', gram_weight: 15 });
      break;

    default:
      addOpt({ name: '1 Porsiyon (200g)', gram_weight: 200 });
      addOpt({ name: 'Yarım Porsiyon (100g)', gram_weight: 100 });
      addOpt({ name: '1 Tabak (250g)', gram_weight: 250 });
      break;
  }

  // 4. Custom gram input is always at the end
  addOpt({ name: '1 Gram (Özel Gramaj)', gram_weight: 1, isRawGram: true });

  return options;
}
