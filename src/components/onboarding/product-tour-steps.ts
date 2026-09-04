export type ProductTourMode = "overview" | "health" | "finance" | "stocks" | "stocks-analysis";

export type ProductTourStep = {
  title: string;
  text: string;
  target: string;
  mode: ProductTourMode;
};

export const productTourSteps: ProductTourStep[] = [
  // ── 1. ANA SAYFA / GENEL BAKIŞ ──
  {
    title: "Genel Bakış Ekranı",
    text: "Günün sağlık, beslenme, kalori ve cüzdan özetini bu ana panelde tek bakışta görürsün. Üst menüden dilediğin zaman sekmeler arasında geçiş yapabilirsin.",
    target: "nav-overview",
    mode: "overview"
  },
  {
    title: "Manuel Besin Ekleme",
    text: "Yediklerini kaydetmek için buradaki + butonuna bas. Binlerce gıdadan ara, gramaj veya porsiyonunu gir; kalori ve makroların (protein, karb, yağ) anında hesaplansın.",
    target: "health-add-meal",
    mode: "overview"
  },
  {
    title: "Fotoğrafla AI Besin Analizi",
    text: "Tabağındaki yemeği veya paketli ürünün besin tablosunu kameranla çek ya da galeriden yükle. Yapay zeka fotoğrafı saniyeler içinde analiz edip öğününü otomatik doldurur.",
    target: "health-ai-meal",
    mode: "overview"
  },
  {
    title: "Gelir & Gider Kaydı",
    text: "Cüzdanına harcama veya gelir eklemek için bu butonu kullan. Tutar, kategori ve ilgili hesabını seçerek nakit akışını ve anlık net bakiyeni daima güncel tut.",
    target: "finance-add-transaction",
    mode: "overview"
  },
  {
    title: "Hızlı Ekle Menüsü (+)",
    text: "Ekranın altındaki bu + butonundan sayfadan ayrılmadan dilediğin an hızlıca öğün, egzersiz, gelir veya gider ekleyebilirsin.",
    target: "quick-add",
    mode: "overview"
  },

  // ── 2. BESLENME & SAĞLIK SAYFASI ──
  {
    title: "Beslenme & Sağlık Takibi",
    text: "Sağlık bölümünde günlük kalori bütçeni, su takibini, bazal metabolizmanı (BMR) ve geçmiş günlerin beslenme kayıtlarını yönetebilirsin.",
    target: "nav-health",
    mode: "health"
  },
  {
    title: "Beslenme & Hikaye Raporu İndir",
    text: "Günlük veya tarih aralıklı beslenme karneni resmi PDF raporu olarak indirebilir; yanındaki butonla Instagram hikaye formatında estetik bir özet görseli alabilirsin.",
    target: "health-pdf-btn",
    mode: "health"
  },
  {
    title: "Detaylı Sağlık Analizi",
    text: "Haftalık ve aylık kalori eğilimlerini, makro dengeni (protein/karb/yağ) ve uyku verilerini derinlemesine grafiklerle incelemek için Detaylı Analiz ikonuna tıkla.",
    target: "health-analysis-btn",
    mode: "health"
  },

  // ── 3. CÜZDAN & FİNANS SAYFASI ──
  {
    title: "Cüzdan & Bütçe Yönetimi",
    text: "Banka hesaplarını, nakit cüzdanlarını, kredi kartlarını, kategorilerini, borç/alacaklarını ve yinelenen aboneliklerini buradan yönet.",
    target: "nav-finance",
    mode: "finance"
  },
  {
    title: "Finans Raporunu PDF Olarak İndir",
    text: "Tüm finansal hareketlerini, gelir-gider dökümünü ve hesap bakiyelerini tarih bazlı profesyonel bir PDF raporu olarak dışa aktar.",
    target: "finance-pdf-btn",
    mode: "finance"
  },
  {
    title: "Detaylı Finans Analizi",
    text: "Kategori bazlı harcama dağılımı (pasta grafiği), aylık gelir/gider dengesi ve nakit akışı eğilimlerini görmek için Detaylı Finans Analizi'ne tıkla.",
    target: "finance-analysis-btn",
    mode: "finance"
  },

  // ── 4. BORSA & YATIRIM PORTFÖYÜ ──
  {
    title: "Borsa & Yatırım Portföyü",
    text: "Yatırımlarını profesyonelce takip et! Toplam portföy değerin, yatırdığın anapara, potansiyel kâr/zararın ve tamamlanan satışlardan elde edilen gerçekleşen kârın tek ekranda hesaplanır.",
    target: "stocks-summary",
    mode: "stocks"
  },
  {
    title: "Hisse & Fon Alış Emri Gir",
    text: "Yeni bir hisse veya yatırım fonu aldığında Alış Emri Gir'e dokun. Kodunu, lot miktarını ve alış fiyatını yaz. Kademeli alışlarında ortalama maliyet sistem tarafından otomatik hesaplanır.",
    target: "stocks-buy",
    mode: "stocks"
  },
  {
    title: "Satış Emri Gir & Kâr/Zarar Hesapla",
    text: "Portföyündeki bir varlığı sattığında Satış Yap butonunu kullan. Sattığın lot ve fiyatı girdiğinde, alış maliyetine göre net gerçekleşen kâr/zarar anında hesaplanır ve kaydedilir.",
    target: "stocks-sell",
    mode: "stocks"
  },
  {
    title: "Hisse Düzenleme & Emir Geçmişi",
    text: "Portföy sekmesinde her hissenin güncel fiyatını tek tıkla güncelleyebilir, geçmiş alış/satış emirlerini inceleyip düzenleyebilir ve gerçekleşen kâr/zarar geçmişini filtreleyebilirsin.",
    target: "stocks-tabs",
    mode: "stocks"
  },
  {
    title: "Borsa Portföy PDF Raporu",
    text: "Açık pozisyonlarını, ağırlıklarını, maliyetlerini ve tamamlanmış al-sat işlemlerini tarih aralıklı kapsamlı bir PDF portföy raporu olarak indirebilirsin.",
    target: "stocks-pdf-btn",
    mode: "stocks"
  },
  {
    title: "Detaylı Borsa Analizine Giriş",
    text: "Portföyünün derinlemesine analizi için bu butona tıkla! Varlık dağılımı pasta grafiği, hisse bazlı k/z performansı ve al-sat başarı oranı (Win Rate) analizine geç.",
    target: "stocks-analysis-btn",
    mode: "stocks"
  },
  {
    title: "Detaylı Borsa Analiz Paneli",
    text: "Burada portföyündeki varlıkların yüzdelik ağırlıklarını, en çok kazandıran/kaybettiren hisseleri, al-sat kazanma oranını ve gerçekleşen k/z zaman çizelgesini görsel grafiklerle takip edebilirsin.",
    target: "stocks-analysis-view",
    mode: "stocks-analysis"
  },

  // ── 5. PROFİL & AYARLAR ──
  {
    title: "Profil & Kişisel Ayarlar",
    text: "Profilinden kalori hedeflerini, boy/kilo bilgilerini, antrenman programını (egzersizlerin nasıl yapıldığını gösteren videolarıyla birlikte) ve namaz bildirimlerini yönetebilirsin.",
    target: "profile",
    mode: "overview"
  }
];
