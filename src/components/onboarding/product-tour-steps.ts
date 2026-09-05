export type ProductTourMode = "overview" | "health" | "finance" | "stocks" | "stocks-analysis";

export type ProductTourStep = {
  title: string;
  titleEn?: string;
  text: string;
  textEn?: string;
  target: string;
  mode: ProductTourMode;
};

export const productTourSteps: ProductTourStep[] = [
  // ── 1. ANA SAYFA / GENEL BAKIŞ ──
  {
    title: "Genel Bakış Ekranı",
    titleEn: "Overview Dashboard",
    text: "Günün sağlık, beslenme, kalori ve cüzdan özetini bu ana panelde tek bakışta görürsün. Üst menüden dilediğin zaman sekmeler arasında geçiş yapabilirsin.",
    textEn: "See your daily health, nutrition, calorie, and financial summary at a glance. Easily switch between sections using the top navigation bar.",
    target: "nav-overview",
    mode: "overview"
  },
  {
    title: "Manuel Besin Ekleme",
    titleEn: "Manual Food Logging",
    text: "Yediklerini kaydetmek için buradaki + butonuna bas. Binlerce gıdadan ara, gramaj veya porsiyonunu gir; kalori ve makroların (protein, karb, yağ) anında hesaplansın.",
    textEn: "Click + to log what you ate. Search through thousands of foods, enter grams or portions, and calories and macros (protein, carbs, fat) will be calculated instantly.",
    target: "health-add-meal",
    mode: "overview"
  },
  {
    title: "Fotoğrafla AI Besin Analizi",
    titleEn: "AI Photo Food Analysis",
    text: "Tabağındaki yemeği veya paketli ürünün besin tablosunu kameranla çek ya da galeriden yükle. Yapay zeka fotoğrafı saniyeler içinde analiz edip öğününü otomatik doldurur.",
    textEn: "Take a photo of your plate or packaged food label, or upload from your gallery. AI analyzes your food in seconds and logs it automatically.",
    target: "health-ai-meal",
    mode: "overview"
  },
  {
    title: "Gelir & Gider Kaydı",
    titleEn: "Income & Expense Logging",
    text: "Cüzdanına harcama veya gelir eklemek için bu butonu kullan. Tutar, kategori ve ilgili hesabını seçerek nakit akışını ve anlık net bakiyeni daima güncel tut.",
    textEn: "Record expenses or income with this button. Select amount, category, and account to keep your cash flow and net balance up to date.",
    target: "finance-add-transaction",
    mode: "overview"
  },
  {
    title: "Hızlı Ekle Menüsü (+)",
    titleEn: "Quick Add Menu (+)",
    text: "Ekranın altındaki bu + butonundan sayfadan ayrılmadan dilediğin an hızlıca öğün, egzersiz, gelir veya gider ekleyebilirsin.",
    textEn: "Quickly add meals, workouts, income, or expenses anytime without leaving the page using this floating button.",
    target: "quick-add",
    mode: "overview"
  },

  // ── 2. BESLENME & SAĞLIK SAYFASI ──
  {
    title: "Beslenme & Sağlık Takibi",
    titleEn: "Nutrition & Health Tracking",
    text: "Sağlık bölümünde günlük kalori bütçeni, su takibini, bazal metabolizmanı (BMR) ve geçmiş günlerin beslenme kayıtlarını yönetebilirsin.",
    textEn: "Manage your daily calorie budget, water intake, basal metabolic rate (BMR), and past logs in the Health section.",
    target: "nav-health",
    mode: "health"
  },
  {
    title: "Beslenme & Hikaye Raporu İndir",
    titleEn: "Download Nutrition & Story Report",
    text: "Günlük veya tarih aralıklı beslenme karneni resmi PDF raporu olarak indirebilir; yanındaki butonla Instagram hikaye formatında estetik bir özet görseli alabilirsin.",
    textEn: "Download comprehensive PDF nutrition reports or export an aesthetic summary image ready for Instagram stories.",
    target: "health-pdf-btn",
    mode: "health"
  },
  {
    title: "Detaylı Sağlık Analizi",
    titleEn: "Detailed Health Analysis",
    text: "Haftalık ve aylık kalori eğilimlerini, makro dengeni (protein/karb/yağ) ve uyku verilerini derinlemesine grafiklerle incelemek için Detaylı Analiz ikonuna tıkla.",
    textEn: "Click Detailed Analysis to explore weekly/monthly calorie trends, macro balances, and sleep metrics with rich interactive charts.",
    target: "health-analysis-btn",
    mode: "health"
  },

  // ── 3. CÜZDAN & FİNANS SAYFASI ──
  {
    title: "Cüzdan & Bütçe Yönetimi",
    titleEn: "Wallet & Budget Management",
    text: "Banka hesaplarını, nakit cüzdanlarını, kredi kartlarını, kategorilerini, borç/alacaklarını ve yinelenen aboneliklerini buradan yönet.",
    textEn: "Manage your bank accounts, cash wallets, credit cards, categories, debts, and recurring subscriptions from here.",
    target: "nav-finance",
    mode: "finance"
  },
  {
    title: "Finans Raporunu PDF Olarak İndir",
    titleEn: "Download Financial PDF Report",
    text: "Tüm finansal hareketlerini, gelir-gider dökümünü ve hesap bakiyelerini tarih bazlı profesyonel bir PDF raporu olarak dışa aktar.",
    textEn: "Export your transaction history, income vs expense breakdowns, and balances as a professional PDF report.",
    target: "finance-pdf-btn",
    mode: "finance"
  },
  {
    title: "Detaylı Finans Analizi",
    titleEn: "Detailed Financial Analysis",
    text: "Kategori bazlı harcama dağılımı (pasta grafiği), aylık gelir/gider dengesi ve nakit akışı eğilimlerini görmek için Detaylı Finans Analizi'ne tıkla.",
    textEn: "Click Detailed Financial Analysis to view category breakdown pie charts, monthly cash flow balances, and spending trends.",
    target: "finance-analysis-btn",
    mode: "finance"
  },

  // ── 4. BORSA & YATIRIM PORTFÖYÜ ──
  {
    title: "Borsa & Yatırım Portföyü",
    titleEn: "Stocks & Investment Portfolio",
    text: "Yatırımlarını profesyonelce takip et! Toplam portföy değerin, yatırdığın anapara, potansiyel kâr/zararın ve tamamlanan satışlardan elde edilen gerçekleşen kârın tek ekranda hesaplanır.",
    textEn: "Track your investments professionally! Total portfolio value, invested capital, unrealized P&L, and realized gains from sales are calculated in real time.",
    target: "stocks-summary",
    mode: "stocks"
  },
  {
    title: "Hisse & Fon Alış Emri Gir",
    titleEn: "Add Buy Order (Stock/Fund)",
    text: "Yeni bir hisse veya yatırım fonu aldığında Alış Emri Gir'e dokun. Kodunu, lot miktarını ve alış fiyatını yaz. Kademeli alışlarında ortalama maliyet sistem tarafından otomatik hesaplanır.",
    textEn: "Click Add Buy Order when purchasing a stock or fund. Enter symbol, lot amount, and price. Average cost basis is automatically calculated.",
    target: "stocks-buy",
    mode: "stocks"
  },
  {
    title: "Satış Emri Gir & Kâr/Zarar Hesapla",
    titleEn: "Sell Order & Realized P&L",
    text: "Portföyündeki bir varlığı sattığında Satış Yap butonunu kullan. Sattığın lot ve fiyatı girdiğinde, alış maliyetine göre net gerçekleşen kâr/zarar anında hesaplanır ve kaydedilir.",
    textEn: "Use the Sell button when selling assets. When you enter lots and price, your net realized profit or loss is calculated automatically against cost basis.",
    target: "stocks-sell",
    mode: "stocks"
  },
  {
    title: "Hisse Düzenleme & Emir Geçmişi",
    titleEn: "Stock Editing & Order History",
    text: "Portföy sekmesinde her hissenin güncel fiyatını tek tıkla güncelleyebilir, geçmiş alış/satış emirlerini inceleyip düzenleyebilir ve gerçekleşen kâr/zarar geçmişini filtreleyebilirsin.",
    textEn: "Update stock prices with one click, inspect and edit order history, and filter your realized gain/loss ledger.",
    target: "stocks-tabs",
    mode: "stocks"
  },
  {
    title: "Borsa Portföy PDF Raporu",
    titleEn: "Portfolio PDF Report",
    text: "Açık pozisyonlarını, ağırlıklarını, maliyetlerini ve tamamlanmış al-sat işlemlerini tarih aralıklı kapsamlı bir PDF portföy raporu olarak indirebilirsin.",
    textEn: "Download a comprehensive portfolio PDF report containing your open positions, asset allocations, costs, and trades.",
    target: "stocks-pdf-btn",
    mode: "stocks"
  },
  {
    title: "Detaylı Borsa Analizine Giriş",
    titleEn: "Detailed Stocks Analysis",
    text: "Portföyünün derinlemesine analizi için bu butona tıkla! Varlık dağılımı pasta grafiği, hisse bazlı k/z performansı ve al-sat başarı oranı (Win Rate) analizine geç.",
    textEn: "Click to enter in-depth stock analytics! View asset allocation charts, symbol performance, and win-rate statistics.",
    target: "stocks-analysis-btn",
    mode: "stocks"
  },
  {
    title: "Detaylı Borsa Analiz Paneli",
    titleEn: "Stocks Analysis Dashboard",
    text: "Burada portföyündeki varlıkların yüzdelik ağırlıklarını, en çok kazandıran/kaybettiren hisseleri, al-sat kazanma oranını ve gerçekleşen k/z zaman çizelgesini görsel grafiklerle takip edebilirsin.",
    textEn: "Explore asset weighting percentages, top winning and losing stocks, win rates, and your realized P&L timeline.",
    target: "stocks-analysis-view",
    mode: "stocks-analysis"
  },

  // ── 5. PROFİL & AYARLAR ──
  {
    title: "Profil & Kişisel Ayarlar",
    titleEn: "Profile & Personal Settings",
    text: "Profilinden kalori hedeflerini, boy/kilo bilgilerini ve antrenman programını (egzersizlerin nasıl yapıldığını gösteren videolarıyla birlikte) yönetebilirsin.",
    textEn: "From your profile, configure calorie goals, body measurements, and customized workout plans with exercise demo videos.",
    target: "profile",
    mode: "overview"
  }
];
