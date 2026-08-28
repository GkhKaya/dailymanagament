import { HealthDataDTO } from '@/models/DashboardTypes';
import pica from 'pica';

const BASE_WIDTH = 1080;
const BASE_HEIGHT = 1920;
// 2x Retina scaling for ultra-sharp, crisp rendering
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

export async function downloadHealthStory(data: HealthDataDTO) {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Hikaye görseli oluşturulamadı.');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Apply 2x Retina scale
  ctx.scale(SCALE, SCALE);

  // ── 1. SITE-MATCHED PURE DEEP BLACK BACKGROUND (#09090b) ──
  ctx.fillStyle = '#09090b';
  ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

  // Subtle studio lighting vignette (very soft, high-end)
  const topGlow = ctx.createRadialGradient(540, 0, 0, 540, 0, 700);
  topGlow.addColorStop(0, 'rgba(142, 193, 59, 0.07)'); // Subtle Lime Glow
  topGlow.addColorStop(1, 'rgba(9, 9, 11, 0)');
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, 0, BASE_WIDTH, 800);

  const pad = 56;
  const contentWidth = BASE_WIDTH - pad * 2;

  // ── 2. BRAND LOGO HEADER & DATE ──
  let curY = 76;

  // DailyM Waveform Icon (3 vertical rounded bars in Lime Green #8ec13b)
  const iconX = pad;
  const iconY = curY;
  ctx.fillStyle = '#8ec13b';

  // Bar 1
  drawRoundedRect(ctx, iconX, iconY + 8, 4, 16, 2);
  ctx.fill();
  // Bar 2 (tall center)
  drawRoundedRect(ctx, iconX + 8, iconY + 2, 4, 28, 2);
  ctx.fill();
  // Bar 3
  drawRoundedRect(ctx, iconX + 16, iconY + 6, 4, 20, 2);
  ctx.fill();
  // Bar 4 (connector dot)
  drawRoundedRect(ctx, iconX + 24, iconY + 11, 4, 10, 2);
  ctx.fill();

  // DailyM Logo Text
  ctx.font = '800 28px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Daily', iconX + 36, curY + 24);
  const dailyWidth = ctx.measureText('Daily').width;
  ctx.fillStyle = '#8ec13b';
  ctx.fillText('M', iconX + 36 + dailyWidth, curY + 24);

  // Date on Right
  ctx.textAlign = 'right';
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '500 20px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const dateFormatted = formatTurkishDate(data.date || new Date().toISOString());
  ctx.fillText(dateFormatted, BASE_WIDTH - pad, curY + 24);
  ctx.textAlign = 'left';

  curY += 72;

  // ── 3. MAIN SECTION HEADLINE ("Bugünkü Beslenme") ──
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 44px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Bugünkü Beslenme', pad, curY);

  curY += 36;

  // ── 4. HERO 3 METRIC CARDS (ALINAN | YAKILAN | NET) - EXACT SITE MATCH ──
  const heroCardHeight = 210;
  const colWidth = (contentWidth - 24) / 3;

  const consumed = data.consumedCalories || 0;
  const burned = data.burnedCalories || 0;
  const net = consumed - burned;

  // Helper for drawing site-identical matte glass card
  const drawSiteCard = (
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    labelColor: string,
    valueNum: number | string,
    unitText: string,
    subText: string,
    subTextColor = '#a1a1aa',
    valueColor = '#ffffff'
  ) => {
    // Card Background (#141414 / #1c1c1e)
    ctx.fillStyle = '#141414';
    drawRoundedRect(ctx, x, y, w, h, 20);
    ctx.fill();

    // Border (#27272a / subtle outline)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Top Label
    ctx.fillStyle = labelColor;
    ctx.font = '700 15px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(label.toUpperCase(), x + 24, y + 38);

    // Main Metric Value
    ctx.fillStyle = valueColor;
    ctx.font = '800 46px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(String(valueNum), x + 24, y + 104);

    // Unit
    const valW = ctx.measureText(String(valueNum)).width;
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '500 18px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(unitText, x + 24 + valW + 8, y + 104);

    // Subtext (e.g. Alınabilecek: 1888)
    ctx.fillStyle = subTextColor;
    ctx.font = '400 16px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(subText, x + 24, y + 158);
  };

  // Card 1: ALINAN (Label: #8ec13b, Value: White)
  drawSiteCard(
    pad,
    curY,
    colWidth,
    heroCardHeight,
    'ALINAN',
    '#8ec13b',
    consumed.toLocaleString('tr-TR'),
    'kcal',
    `Alınabilecek: ${(data.targetCalories || 2000).toLocaleString('tr-TR')}`
  );

  // Card 2: YAKILAN (Label: #a1a1aa, Value: White)
  const exerciseCount = (data.exercises || []).length;
  drawSiteCard(
    pad + colWidth + 12,
    curY,
    colWidth,
    heroCardHeight,
    'YAKILAN',
    '#a1a1aa',
    burned.toLocaleString('tr-TR'),
    'kcal',
    exerciseCount > 0 ? `${exerciseCount} Egzersiz Kayıtlı` : 'Egzersiz & BMR'
  );

  // Card 3: NET (Label: #a1a1aa, Value: #8ec13b or White)
  const netSub = net > 0 ? '▲ Kalori Fazlası' : net < 0 ? '▼ Kalori Açığı' : '● Tam Dengede';
  drawSiteCard(
    pad + (colWidth + 12) * 2,
    curY,
    colWidth,
    heroCardHeight,
    'NET',
    '#a1a1aa',
    `${net > 0 ? '+' : ''}${net.toLocaleString('tr-TR')}`,
    'kcal',
    netSub,
    '#8ec13b',
    '#8ec13b'
  );

  curY += heroCardHeight + 28;

  // ── 5. MACROS & HEALTH STRIP (1-TO-1 MATCH WITH SITE MACRO BAR) ──
  const macroCardH = 150;
  ctx.fillStyle = '#141414';
  drawRoundedRect(ctx, pad, curY, contentWidth, macroCardH, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.stroke();

  const totalGrams = (data.protein || 0) + (data.carbs || 0) + (data.fat || 0) || 1;
  const pPct = Math.round(((data.protein || 0) / totalGrams) * 100);
  const cPct = Math.round(((data.carbs || 0) / totalGrams) * 100);
  const fPct = Math.round(((data.fat || 0) / totalGrams) * 100);

  // Draw each Macro block
  const drawMacroBlock = (
    mx: number,
    label: string,
    labelColor: string,
    grams: number,
    pct?: number
  ) => {
    // Label
    ctx.fillStyle = labelColor;
    ctx.font = '700 14px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(label, mx, curY + 42);

    // Value & Pct
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 32px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`${grams}g`, mx, curY + 92);

    if (pct !== undefined) {
      const gW = ctx.measureText(`${grams}g`).width;
      ctx.fillStyle = '#a1a1aa';
      ctx.font = '500 16px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`${pct}%`, mx + gW + 8, curY + 92);
    }
  };

  // 1. KARB (Label: #8ec13b)
  drawMacroBlock(pad + 24, 'KARB', '#8ec13b', data.carbs || 0, cPct);

  // 2. PROTEİN (Label: #ffffff)
  drawMacroBlock(pad + 170, 'PROTEİN', '#ffffff', data.protein || 0, pPct);

  // 3. YAĞ (Label: #a1a1aa)
  drawMacroBlock(pad + 330, 'YAĞ', '#a1a1aa', data.fat || 0, fPct);

  // 4. ŞEKER (Label: #f472b6)
  drawMacroBlock(pad + 470, 'ŞEKER', '#f472b6', data.sugar || 0);

  // Vertical Divider Line 1
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad + 600, curY + 24);
  ctx.lineTo(pad + 600, curY + macroCardH - 24);
  ctx.stroke();

  // 5. UYKU (Label & Value: #818cf8)
  const sleepMins = data.sleepMinutes || 0;
  const sleepHours = Math.floor(sleepMins / 60);
  const sleepRemainder = sleepMins % 60;
  ctx.fillStyle = '#818cf8';
  ctx.font = '700 14px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('UYKU', pad + 624, curY + 42);

  if (sleepMins > 0) {
    ctx.fillStyle = '#818cf8';
    ctx.font = '800 32px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`${sleepHours}s ${sleepRemainder}d`, pad + 624, curY + 92);
  } else {
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '600 20px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('Veri Yok', pad + 624, curY + 90);
  }

  // Vertical Divider Line 2
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad + 780, curY + 24);
  ctx.lineTo(pad + 780, curY + macroCardH - 24);
  ctx.stroke();

  // 6. KİLO (Label & Value: #34d399)
  ctx.fillStyle = '#34d399';
  ctx.font = '700 14px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('KİLO', pad + 804, curY + 42);

  if (data.currentWeight) {
    ctx.fillStyle = '#34d399';
    ctx.font = '800 32px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`${data.currentWeight}`, pad + 804, curY + 92);
    const kW = ctx.measureText(`${data.currentWeight}`).width;
    ctx.font = '600 18px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('kg', pad + 804 + kW + 6, curY + 92);
  } else {
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '600 20px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('Veri Yok', pad + 804, curY + 90);
  }

  curY += macroCardH + 34;

  // ── 6. "ÖĞÜN DETAYLARI" SECTION (EXACT SITE MATCH) ──
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '700 15px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('ÖĞÜN DETAYLARI', pad, curY);

  const mealCount = (data.meals || []).length;
  ctx.textAlign = 'right';
  ctx.fillStyle = '#8ec13b';
  ctx.font = '700 15px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`${mealCount} Öğün Kaydedildi`, BASE_WIDTH - pad, curY);
  ctx.textAlign = 'left';

  curY += 20;

  const meals = (data.meals && data.meals.length > 0) ? data.meals.slice(0, 4) : [];

  if (meals.length === 0) {
    const emptyH = 140;
    ctx.fillStyle = '#141414';
    drawRoundedRect(ctx, pad, curY, contentWidth, emptyH, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '500 20px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Bu gün için henüz öğün kaydı girilmedi.', BASE_WIDTH / 2, curY + 76);
    ctx.textAlign = 'left';
    curY += emptyH + 20;
  } else {
    for (const meal of meals) {
      const mealCardH = 136;

      // Card Background (#141414)
      ctx.fillStyle = '#141414';
      drawRoundedRect(ctx, pad, curY, contentWidth, mealCardH, 20);
      ctx.fill();

      // Subtle Border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Left Vertical Green Accent
      ctx.fillStyle = '#8ec13b';
      drawRoundedRect(ctx, pad + 16, curY + 22, 4, mealCardH - 44, 2);
      ctx.fill();

      // Meal Type Title
      const typeLabel =
        meal.type === 'breakfast'
          ? 'KAHVALTI'
          : meal.type === 'lunch'
          ? 'ÖĞLE YEMEĞİ'
          : meal.type === 'dinner'
          ? 'AKŞAM YEMEĞİ'
          : 'ARA ÖĞÜN';

      ctx.fillStyle = '#8ec13b';
      ctx.font = '800 18px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(typeLabel, pad + 32, curY + 42);

      // Calorie on the Right
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 26px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`${(meal.calories || 0).toLocaleString('tr-TR')}`, BASE_WIDTH - pad - 22, curY + 42);

      ctx.fillStyle = '#a1a1aa';
      ctx.font = '600 15px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('kcal', BASE_WIDTH - pad - 22, curY + 64);
      ctx.textAlign = 'left';

      // Meal Foods Description (Clean wrapped text with no orphan characters)
      ctx.fillStyle = '#d4d4d8';
      ctx.font = '400 17px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

      let foodText = '';
      if (meal.foods && meal.foods.length > 0) {
        foodText = meal.foods
          .map((f) => `${f.name}${f.amount ? ` (${f.amount})` : ''}`)
          .join(' · ');
      } else {
        foodText = meal.foodName || 'Kayıtlı yiyecek';
      }

      wrapCleanText(ctx, foodText, pad + 32, curY + 82, contentWidth - 170, 24, 2);

      curY += mealCardH + 16;
    }
  }

  curY += 12;

  // ── 7. DAILY GOAL & FITNESS ACTIVITY CARD (PERFECT BOTTOM PROPORTION) ──
  const bottomCardH = 160;
  ctx.fillStyle = '#141414';
  drawRoundedRect(ctx, pad, curY, contentWidth, bottomCardH, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Title
  ctx.fillStyle = '#8ec13b';
  ctx.font = '700 14px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('GÜNLÜK HEDEF VE AKTİVİTE DURUMU', pad + 24, curY + 36);

  const bColW = (contentWidth - 48) / 3;

  // 1. Hedef Kalori Oranı
  const targetCal = data.targetCalories || 2000;
  const adherencePct = Math.round((consumed / targetCal) * 100);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 28px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`%${adherencePct}`, pad + 24, curY + 82);
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '500 15px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('🎯 Hedef Tamamlanma', pad + 24, curY + 110);
  ctx.fillStyle = '#71717a';
  ctx.font = '400 13px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`${consumed} / ${targetCal} kcal`, pad + 24, curY + 132);

  // 2. Egzersiz Süresi
  const exMins = data.exerciseMinutes || 0;
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 28px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(exMins > 0 ? `${exMins} dk` : '0 dk', pad + 24 + bColW, curY + 82);
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '500 15px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('🏃 Aktif Egzersiz', pad + 24 + bColW, curY + 110);
  ctx.fillStyle = '#71717a';
  ctx.font = '400 13px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(exMins > 0 ? `${(data.exercises || []).length} Aktivite Yapıldı` : 'Dinlenme Günü', pad + 24 + bColW, curY + 132);

  // 3. Beslenme Dengesi
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 28px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(net <= 0 ? 'Açık' : 'Fazlalık', pad + 24 + bColW * 2, curY + 82);
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '500 15px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('⚖️ Enerji Dengesi', pad + 24 + bColW * 2, curY + 110);
  ctx.fillStyle = '#71717a';
  ctx.font = '400 13px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(net <= 0 ? `${Math.abs(net)} kcal açık` : `+${net} kcal fazlalık`, pad + 24 + bColW * 2, curY + 132);

  // ── 8. FOOTER BRANDING ──
  const footerY = BASE_HEIGHT - 74;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, footerY - 20);
  ctx.lineTo(BASE_WIDTH - pad, footerY - 20);
  ctx.stroke();

  // Left hashtags in lime green
  ctx.fillStyle = '#8ec13b';
  ctx.font = '700 17px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('#dailym  #sağlıklıbeslenme  #günlüktakip', pad, footerY + 14);

  // Right signature
  ctx.textAlign = 'right';
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '500 17px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('DailyM · Kişisel Sağlık ve Beslenme Takibi', BASE_WIDTH - pad, footerY + 14);
  ctx.textAlign = 'left';

  // ── 9. DOWNSAMPLE WITH PICA & DOWNLOAD IMAGE ──
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = BASE_WIDTH;
  outputCanvas.height = BASE_HEIGHT;

  await pica().resize(canvas, outputCanvas, { quality: 3 });

  const link = document.createElement('a');
  const dateStr = (data.date || new Date().toISOString()).slice(0, 10);
  link.download = `dailym-beslenme-${dateStr}.png`;
  link.href = outputCanvas.toDataURL('image/png');
  link.click();
}
