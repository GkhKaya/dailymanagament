import { HealthDataDTO } from '@/models/DashboardTypes';

const BASE_WIDTH = 1080;
const BASE_HEIGHT = 1920;
// 2x Retina scale for ultra-crisp, razor-sharp Instagram Story resolution
const SCALE = 2;
const WIDTH = BASE_WIDTH * SCALE;
const HEIGHT = BASE_HEIGHT * SCALE;

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function cleanFoodText(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .replace(/,\s*,/g, ',')
    .replace(/\s*·\s*/g, ' · ')
    .replace(/\s*\.\s*$/, '')
    .trim();
}

function wrapCleanText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 2
) {
  const cleaned = cleanFoodText(text);
  const words = cleaned.split(' ');
  let line = '';
  let lineCount = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (word === '·' && line === '') continue; // Skip orphaned separator
    const testLine = line ? `${line} ${word}` : word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && line) {
      ctx.fillText(line.replace(/\s*·\s*$/, '').trim(), x, y + lineCount * lineHeight);
      lineCount++;
      line = word === '·' ? '' : word;
      if (lineCount >= maxLines - 1) {
        // Last line: append remaining text or ellipsis
        const remaining = words.slice(i).join(' ');
        let truncated = remaining;
        while (ctx.measureText(`${truncated}...`).width > maxWidth && truncated.length > 0) {
          truncated = truncated.slice(0, -1).trim();
        }
        ctx.fillText(truncated ? `${truncated}...` : remaining, x, y + lineCount * lineHeight);
        return;
      }
    } else {
      line = testLine;
    }
  }

  if (line) {
    ctx.fillText(line.replace(/\s*·\s*$/, '').trim(), x, y + lineCount * lineHeight);
  }
}

function formatTurkishDate(dateStr: string): string {
  try {
    const d = new Date(dateStr.length === 10 ? `${dateStr}T00:00:00` : dateStr);
    return d.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
    });
  } catch {
    return dateStr;
  }
}

export function downloadHealthStory(data: HealthDataDTO) {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Hikaye görseli oluşturulamadı.');

  // Enable top-tier crisp rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Apply 2x Retina scale so all coordinates are based on 1080x1920
  ctx.scale(SCALE, SCALE);

  // ── 1. OBSIDIAN CARBON DARK BACKGROUND ──
  const bg = ctx.createLinearGradient(0, 0, 0, BASE_HEIGHT);
  bg.addColorStop(0, '#030609');
  bg.addColorStop(0.25, '#060b10');
  bg.addColorStop(0.6, '#04080c');
  bg.addColorStop(1, '#020305');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

  // ── 2. VIBRANT ATMOSPHERIC TURQUOISE GLOW ORBS ──
  const drawGlow = (x: number, y: number, radius: number, colorInner: string, colorOuter = 'rgba(0,0,0,0)') => {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, colorInner);
    gradient.addColorStop(1, colorOuter);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  };

  drawGlow(920, 160, 480, 'rgba(20, 241, 217, 0.18)');
  drawGlow(100, 680, 420, 'rgba(6, 214, 196, 0.12)');
  drawGlow(980, 1350, 450, 'rgba(45, 212, 191, 0.14)');
  drawGlow(200, 1820, 460, 'rgba(20, 241, 217, 0.16)');

  // Futuristic ambient circles
  ctx.strokeStyle = 'rgba(20, 241, 217, 0.08)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(920, 160, 320, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(150, 1800, 360, 0, Math.PI * 2);
  ctx.stroke();

  const pad = 56;
  const contentWidth = BASE_WIDTH - pad * 2;

  // ── 3. HEADER SECTION ──
  let curY = 76;

  // Top Pill Brand Badge
  ctx.fillStyle = 'rgba(20, 241, 217, 0.10)';
  drawRoundedRect(ctx, pad, curY, 216, 44, 22);
  ctx.fill();
  ctx.strokeStyle = 'rgba(20, 241, 217, 0.40)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Turquoise Glowing Dot
  ctx.fillStyle = '#14f1d9';
  ctx.beginPath();
  ctx.arc(pad + 22, curY + 22, 5.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#14f1d9';
  ctx.font = '700 18px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('DAILYM HEALTH', pad + 38, curY + 28);

  // Date on Right
  ctx.textAlign = 'right';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 20px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const dateFormatted = formatTurkishDate(data.date || new Date().toISOString());
  ctx.fillText(dateFormatted, BASE_WIDTH - pad, curY + 28);
  ctx.textAlign = 'left';

  // Keep the headline clearly below the brand badge/date row.
  curY += 92;

  // Main Headline
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 42px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('GÜNLÜK BESLENME VE SAĞLIK', pad, curY);

  curY += 34;

  // ── 4. HERO 3-CARD TRIO (ALINAN | NET DENGE | YAKILAN) ──
  const heroCardHeight = 195;
  const colWidth = (contentWidth - 24) / 3;

  const consumed = data.consumedCalories || 0;
  const burned = data.burnedCalories || 0;
  const net = consumed - burned;
  const netSign = net > 0 ? '+' : '';

  const drawHeroCard = (
    x: number,
    y: number,
    w: number,
    h: number,
    title: string,
    value: string,
    unit: string,
    badgeText: string,
    isHighlight = false,
    badgeBg = 'rgba(20, 241, 217, 0.12)',
    badgeColor = '#14f1d9'
  ) => {
    // Glass Surface
    ctx.fillStyle = isHighlight ? 'rgba(7, 26, 32, 0.90)' : 'rgba(10, 18, 26, 0.80)';
    drawRoundedRect(ctx, x, y, w, h, 24);
    ctx.fill();

    // Glow Border
    ctx.strokeStyle = isHighlight ? 'rgba(20, 241, 217, 0.60)' : 'rgba(255, 255, 255, 0.09)';
    ctx.lineWidth = isHighlight ? 2 : 1;
    ctx.stroke();

    // Title
    ctx.fillStyle = isHighlight ? '#14f1d9' : '#94a3b8';
    ctx.font = '700 16px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(title, x + 20, y + 36);

    // Value
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 44px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(value, x + 20, y + 98);

    // Unit
    ctx.fillStyle = isHighlight ? '#14f1d9' : '#64748b';
    ctx.font = '600 17px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(unit, x + 20, y + 128);

    // Badge / Subtext Box
    const badgeW = w - 40;
    ctx.fillStyle = badgeBg;
    drawRoundedRect(ctx, x + 20, y + 146, badgeW, 30, 15);
    ctx.fill();

    ctx.fillStyle = badgeColor;
    ctx.font = '700 13px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(badgeText, x + 20 + badgeW / 2, y + 166);
    ctx.textAlign = 'left';
  };

  // Card 1: Alınan
  drawHeroCard(
    pad,
    curY,
    colWidth,
    heroCardHeight,
    'ALINAN',
    consumed.toLocaleString('tr-TR'),
    'kcal',
    `Hedef: ${(data.targetCalories || 2000).toLocaleString('tr-TR')}`,
    false,
    'rgba(255, 255, 255, 0.06)',
    '#cbd5e1'
  );

  // Card 2: Net Denge (HIGHLIGHT TURQUOISE)
  const isSurplus = net > 0;
  const isDeficit = net < 0;
  const netLabel = isSurplus ? '▲ Kalori Fazlası' : isDeficit ? '▼ Kalori Açığı' : '● Tam Dengede';
  drawHeroCard(
    pad + colWidth + 12,
    curY,
    colWidth,
    heroCardHeight,
    'NET DENGE',
    `${netSign}${net.toLocaleString('tr-TR')}`,
    'kcal fark',
    netLabel,
    true,
    isSurplus ? 'rgba(20, 241, 217, 0.18)' : 'rgba(56, 189, 248, 0.18)',
    isSurplus ? '#14f1d9' : '#38bdf8'
  );

  // Card 3: Yakılan
  drawHeroCard(
    pad + (colWidth + 12) * 2,
    curY,
    colWidth,
    heroCardHeight,
    'YAKILAN',
    burned.toLocaleString('tr-TR'),
    'kcal',
    'Egzersiz & BMR',
    false,
    'rgba(255, 255, 255, 0.06)',
    '#cbd5e1'
  );

  curY += heroCardHeight + 24;

  // ── 5. MAKRO BESİN DAĞILIMI DASHBOARD ──
  const macroHeight = 188;
  ctx.fillStyle = 'rgba(9, 16, 24, 0.85)';
  drawRoundedRect(ctx, pad, curY, contentWidth, macroHeight, 26);
  ctx.fill();
  ctx.strokeStyle = 'rgba(20, 241, 217, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Title Row
  ctx.fillStyle = '#14f1d9';
  ctx.font = '800 18px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('MAKRO BESİN DAĞILIMI', pad + 24, curY + 36);

  const totalGrams = (data.protein || 0) + (data.carbs || 0) + (data.fat || 0) || 1;
  const pPct = Math.round(((data.protein || 0) / totalGrams) * 100);
  const cPct = Math.round(((data.carbs || 0) / totalGrams) * 100);
  const fPct = Math.round(((data.fat || 0) / totalGrams) * 100);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 16px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`Toplam Makro: ${Math.round(totalGrams)}g`, BASE_WIDTH - pad - 24, curY + 36);
  ctx.textAlign = 'left';

  // 3 Macro Progress Bars
  const mColW = (contentWidth - 48) / 3;

  const drawMacroItem = (
    mx: number,
    label: string,
    grams: number,
    pct: number,
    color1: string,
    color2: string
  ) => {
    // Grams
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 30px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`${grams}g`, mx, curY + 86);

    // Label & Percentage
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 16px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`${label} · %${pct}`, mx, curY + 114);

    // Progress Bar Track
    const trackW = mColW - 20;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    drawRoundedRect(ctx, mx, curY + 132, trackW, 14, 7);
    ctx.fill();

    // Active Bar
    const barW = Math.max(12, Math.min(trackW, (trackW * pct) / 100));
    const grad = ctx.createLinearGradient(mx, 0, mx + barW, 0);
    grad.addColorStop(0, color1);
    grad.addColorStop(1, color2);
    ctx.fillStyle = grad;
    drawRoundedRect(ctx, mx, curY + 132, barW, 14, 7);
    ctx.fill();
  };

  // Protein (Neon Emerald -> Turquoise)
  drawMacroItem(pad + 24, 'Protein', data.protein || 0, pPct, '#06d6a0', '#14f1d9');

  // Karbonhidrat (Vibrant Cyan -> Electric Blue)
  drawMacroItem(pad + 24 + mColW, 'Karbonhidrat', data.carbs || 0, cPct, '#00f2fe', '#38bdf8');

  // Yağ (Teal -> Mint)
  drawMacroItem(pad + 24 + mColW * 2, 'Yağ', data.fat || 0, fPct, '#2dd4bf', '#14b8a6');

  curY += macroHeight + 28;

  // ── 6. "BUGÜN NE YEDİM?" MEALS TIMELINE ──
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 24px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('BUGÜN NE YEDİM?', pad, curY);

  const mealCount = (data.meals || []).length;
  ctx.textAlign = 'right';
  ctx.fillStyle = '#14f1d9';
  ctx.font = '700 16px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`${mealCount} Öğün Kaydedildi`, BASE_WIDTH - pad, curY);
  ctx.textAlign = 'left';

  curY += 20;

  const meals = (data.meals && data.meals.length > 0) ? data.meals.slice(0, 4) : [];

  if (meals.length === 0) {
    const emptyH = 130;
    ctx.fillStyle = 'rgba(9, 16, 24, 0.65)';
    drawRoundedRect(ctx, pad, curY, contentWidth, emptyH, 22);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '500 20px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Bu gün için henüz öğün kaydı girilmedi.', BASE_WIDTH / 2, curY + 72);
    ctx.textAlign = 'left';
    curY += emptyH + 20;
  } else {
    for (const meal of meals) {
      const mealCardH = 132;

      // Card Body
      ctx.fillStyle = 'rgba(8, 15, 22, 0.88)';
      drawRoundedRect(ctx, pad, curY, contentWidth, mealCardH, 22);
      ctx.fill();

      // Subtle Border
      ctx.strokeStyle = 'rgba(20, 241, 217, 0.22)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Left Vertical Turquoise Accent Pill
      ctx.fillStyle = '#14f1d9';
      drawRoundedRect(ctx, pad + 16, curY + 20, 4.5, mealCardH - 40, 2.25);
      ctx.fill();

      // Meal Type Title & Icon
      const typeLabel =
        meal.type === 'breakfast'
          ? 'KAHVALTI'
          : meal.type === 'lunch'
          ? 'ÖĞLE YEMEĞİ'
          : meal.type === 'dinner'
          ? 'AKŞAM YEMEĞİ'
          : 'ARA ÖĞÜN';

      ctx.fillStyle = '#14f1d9';
      ctx.font = '800 20px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(typeLabel, pad + 32, curY + 40);

      // Calorie Badge on the Right
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 26px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`${(meal.calories || 0).toLocaleString('tr-TR')}`, BASE_WIDTH - pad - 22, curY + 40);

      ctx.fillStyle = '#14f1d9';
      ctx.font = '700 14px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('kcal', BASE_WIDTH - pad - 22, curY + 62);
      ctx.textAlign = 'left';

      // Meal Foods Description (Clean wrapped text with no orphan characters)
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '400 18px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

      let foodText = '';
      if (meal.foods && meal.foods.length > 0) {
        foodText = meal.foods
          .map((f) => `${f.name}${f.amount ? ` (${f.amount})` : ''}`)
          .join(' · ');
      } else {
        foodText = meal.foodName || 'Kayıtlı yiyecek';
      }

      wrapCleanText(ctx, foodText, pad + 32, curY + 80, contentWidth - 170, 24, 2);

      curY += mealCardH + 14;
    }
  }

  curY += 10;

  // ── 7. AKTİVİTE, UYKU & DİNLENME DASHBOARD (FILLS THE BOTTOM NICELY) ──
  const activityCardH = 175;
  ctx.fillStyle = 'rgba(9, 16, 24, 0.85)';
  drawRoundedRect(ctx, pad, curY, contentWidth, activityCardH, 26);
  ctx.fill();
  ctx.strokeStyle = 'rgba(20, 241, 217, 0.22)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Activity Header
  ctx.fillStyle = '#14f1d9';
  ctx.font = '800 18px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('GÜNLÜK AKTİVİTE & DİNLENME', pad + 24, curY + 36);

  const actColW = (contentWidth - 48) / 3;

  // 1. Egzersiz
  const exerciseMins = data.exerciseMinutes || 0;
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 28px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(exerciseMins > 0 ? `${exerciseMins} dk` : '0 dk', pad + 24, curY + 86);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 16px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('🏃 Egzersiz Süresi', pad + 24, curY + 116);
  ctx.fillStyle = '#64748b';
  ctx.font = '400 14px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(exerciseMins > 0 ? 'Aktif Egzersiz' : 'Dinlenme Günü', pad + 24, curY + 142);

  // 2. Uyku
  const sleepMins = data.sleepMinutes || 0;
  const sleepHours = Math.floor(sleepMins / 60);
  const sleepRemainder = sleepMins % 60;
  const sleepStr = sleepMins > 0 ? `${sleepHours}s ${sleepRemainder > 0 ? `${sleepRemainder}dk` : ''}` : '-';

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 28px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(sleepStr, pad + 24 + actColW, curY + 86);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 16px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('🌙 Uyku Süresi', pad + 24 + actColW, curY + 116);
  ctx.fillStyle = '#64748b';
  ctx.font = '400 14px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(sleepMins >= 420 ? 'Verimli Dinlenme' : sleepMins > 0 ? 'Kısa Uyku' : 'Kayıt Yok', pad + 24 + actColW, curY + 142);

  // 3. Güncel Kilo veya Hedef Uyum
  const currentWeight = data.currentWeight;
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 28px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(currentWeight ? `${currentWeight} kg` : '%100', pad + 24 + actColW * 2, curY + 86);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 16px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(currentWeight ? '⚖️ Güncel Kilo' : '🎯 Hedef Uyumu', pad + 24 + actColW * 2, curY + 116);
  ctx.fillStyle = '#64748b';
  ctx.font = '400 14px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(currentWeight ? 'Vücut Ağırlığı' : 'Günlük Takip', pad + 24 + actColW * 2, curY + 142);

  // ── 8. FOOTER BRANDING & STORY HASHTAGS ──
  const footerY = BASE_HEIGHT - 80;

  // Thin Neon Turquoise Separator
  ctx.strokeStyle = 'rgba(20, 241, 217, 0.20)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(pad, footerY - 24);
  ctx.lineTo(BASE_WIDTH - pad, footerY - 24);
  ctx.stroke();

  // Left Hashtags
  ctx.fillStyle = '#14f1d9';
  ctx.font = '700 18px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('#dailym  #sağlıklıbeslenme  #fitnesstakibi', pad, footerY + 14);

  // Right Motto
  ctx.textAlign = 'right';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 18px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('DailyM ile her gün daha iyiye.', BASE_WIDTH - pad, footerY + 14);
  ctx.textAlign = 'left';

  // ── 9. TRIGGER DOWNLOAD ──
  const link = document.createElement('a');
  const dateStr = (data.date || new Date().toISOString()).slice(0, 10);
  link.download = `dailym-beslenme-${dateStr}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
