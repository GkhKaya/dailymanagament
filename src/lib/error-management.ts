/**
 * DailyM Merkezi Hata Yönetimi (Error Management) Modülü
 *
 * Kullanıcıya ASLA ham API JSON'ları, 404/500 kodları, stack trace veya
 * sağlayıcı (Gemini, Mongo vb.) teknik hata dökümleri gösterilmez.
 * Tüm hatalar bu modül üzerinden geçirilerek kullanıcı dostu, sakin ve
 * anlaşılır Türkçe mesajlara dönüştürülür.
 */

export function toUserFacingError(error: unknown, fallbackMessage = 'İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.'): string {
  if (!error) return fallbackMessage;

  let rawMessage = '';

  if (typeof error === 'string') {
    rawMessage = error;
  } else if (error instanceof Error) {
    rawMessage = error.message;
  } else if (typeof error === 'object') {
    try {
      const obj = error as Record<string, any>;
      if (obj.error) {
        if (typeof obj.error === 'string') {
          rawMessage = obj.error;
        } else if (typeof obj.error.message === 'string') {
          rawMessage = obj.error.message;
        }
      } else if (typeof obj.message === 'string') {
        rawMessage = obj.message;
      } else {
        rawMessage = JSON.stringify(error);
      }
    } catch {
      rawMessage = '';
    }
  }

  const trimmed = rawMessage.trim();

  // 1. Eğer mesaj zaten temiz, anlaşılır bir kullanıcı uyarısı ise (Bizim validator'larımız)
  const isCustomUserValidation = [
    'Besin adı boş bırakılamaz',
    'için geçerli bir miktar',
    'için kalori değeri',
    'Geçersiz öğün türü',
    'Kaydedilecek besin bulunamadı',
    'Öğünde en az bir besin',
    'Tutar, hesap ve kategori',
    'Kaynak ve hedef hesap',
    'Kaynak hesapta yeterli bakiye',
    'Komut boş veya fazla uzun',
    'Lütfen geçerli bir'
  ].some(phrase => trimmed.includes(phrase));

  if (isCustomUserValidation) {
    return trimmed;
  }

  const lower = trimmed.toLowerCase();

  // 2. Ham JSON veya API Hata Nesneleri (örn: {"error":{"code":404...}})
  const hasRawJson = trimmed.startsWith('{') || trimmed.includes('"error"') || trimmed.includes('"code"');
  
  // 3. Model Bulunamadı / Model Güncellemesi (404, not_found, no longer available)
  if (lower.includes('not_found') || lower.includes('no longer available') || lower.includes('404') || lower.includes('models/')) {
    return 'Yapay zeka asistanı modeli güncelleniyor. Lütfen birkaç saniye sonra tekrar deneyin.';
  }

  // 4. Kota / Hız Limiti (429, quota, rate limit, resource exhausted)
  if (lower.includes('429') || lower.includes('quota') || lower.includes('rate limit') || lower.includes('resource_exhausted')) {
    return 'Asistan şu anda yoğun istek alıyor. Lütfen kısa bir süre bekleyip tekrar deneyin.';
  }

  // 5. İnternet / Bağlantı / Zaman Aşımı (timeout, fetch failed, network, econnrefused, enotfound)
  if (
    lower.includes('fetch failed') ||
    lower.includes('network') ||
    lower.includes('timeout') ||
    lower.includes('timed out') ||
    lower.includes('econnrefused') ||
    lower.includes('enotfound')
  ) {
    return 'Bağlantı sağlanamadı. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.';
  }

  // 6. Veritabanı Hataları (mongo, connection, timeout, duplicate key)
  if (lower.includes('mongo') || lower.includes('buffering timed out') || lower.includes('e11000')) {
    return 'Veritabanı ile iletişim kurulamadı. Lütfen tekrar deneyin.';
  }

  // 7. Mikrofon / Ses Tanıma Hataları
  if (lower.includes('not-allowed') || lower.includes('permission denied')) {
    return 'Mikrofon izni verilmedi. Ayarlardan izin verebilir veya komutunuzu yazarak iletebilirsiniz.';
  }
  if (lower.includes('no-speech') || lower.includes('ses anlaşılamadı')) {
    return 'Ses algılanamadı. Lütfen mikrofona biraz daha yakın konuşarak tekrar deneyin.';
  }

  // 8. Komut Anlaşılamadı
  if (lower.includes('anlaşılamadı') || lower.includes('komut') || lower.includes('boş yanıt')) {
    return 'Komutunuz tam anlaşılamadı. Lütfen ne yediğinizi (Örn: "2 yumurta ve 1 dilim ekmek yedim") şeklinde belirtin.';
  }

  // 9. Eğer mesaj teknik terimler, kodlar veya JSON içeriyorsa kesinlikle filtrele
  if (hasRawJson || lower.includes('syntaxerror') || lower.includes('typeerror') || lower.includes('internal server error')) {
    return 'Asistan isteğinizi işlerken bir aksaklık oluştu. Lütfen tekrar deneyin.';
  }

  // 10. Son çare: Eğer mesaj 100 karakterden kısaysa ve anlaşılır görünüyorsa göster, değilse fallback dön
  if (trimmed.length > 0 && trimmed.length < 120 && !trimmed.includes('{') && !trimmed.includes('at ') && !trimmed.includes('/')) {
    return trimmed;
  }

  return fallbackMessage;
}

export function formatActionError(error: unknown, fallbackMessage?: string) {
  return {
    success: false as const,
    error: toUserFacingError(error, fallbackMessage)
  };
}
