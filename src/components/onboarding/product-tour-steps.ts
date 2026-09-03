export type ProductTourMode = "overview" | "health" | "finance" | "stocks";

export type ProductTourStep = {
  title: string;
  text: string;
  target: string;
  mode: ProductTourMode;
};

export const productTourSteps: ProductTourStep[] = [
  { title: "Genel bakış", text: "Günün sağlık, cüzdan ve yatırım özetini burada tek ekranda görürsün. İstediğin alana dokunarak detayına geçebilirsin.", target: "nav-overview", mode: "overview" },
  { title: "Öğünlerini ekle", text: "Her yediğini buradan kaydet. İstersen besini ve miktarı kendin gir, istersen fotoğrafla AI ekleme seçeneğini kullan.", target: "health-add-meal", mode: "health" },
  { title: "Gelir ve gider kaydı", text: "Gelirini, giderini, hesabını ve kategorini sen girersin. DailyM bu kayıtlarla bütçe ve net durumunu hesaplar.", target: "finance-add-transaction", mode: "finance" },
  { title: "Hisse veya fon alışını kaydet", text: "Alış Emri Gir'e dokun; hissenin veya fonun kodunu ve adını sen girersin. Alış fiyatını ve lotunu eklediğinde portföyün hesaplanır.", target: "stocks-buy", mode: "stocks" },
  { title: "Satışı sen işlersin", text: "Satış Yap ile sattığın hisse/fonu, lotunu ve satış fiyatını kaydet. Gerçekleşen kâr/zararı alış kayıtlarına göre DailyM hesaplar.", target: "stocks-sell", mode: "stocks" },
  { title: "Kişisel ayarların", text: "Profilde hedeflerini, hesap ayarlarını ve namaz vakti bildirimlerini yönetebilirsin.", target: "profile", mode: "overview" },
  { title: "Hızlı ekleme", text: "Bu + menüsünden öğün, egzersiz, gelir ve gideri bulunduğun ekrandan ayrılmadan hızlıca ekleyebilirsin.", target: "quick-add", mode: "overview" },
];
