import { HealthDataDTO } from '@/models/DashboardTypes';
import pica from 'pica';
import { translateBatch } from '@/lib/translation-service';

// Standard Instagram/WhatsApp Story Resolution (9:16)
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

// Clean user-specific or raw text artifacts
function cleanFoodText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\b(g[oö]khan\s*raw|g[oö]khan|raw)\b/gi, '')
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

function formatEnglishDate(dateStr: string): string {
  try {
    const d = new Date(dateStr.length === 10 ? `${dateStr}T00:00:00` : dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export async function downloadHealthStory(data: HealthDataDTO, lang: 'tr' | 'en' = 'tr') {
  const isEn = lang === 'en';

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

  // Subtle studio lighting vignette from top
  const topGlow = ctx.createRadialGradient(540, 0, 0, 540, 0, 800);
  topGlow.addColorStop(0, 'rgba(142, 193, 59, 0.08)'); // Subtle Lime Glow
  topGlow.addColorStop(1, 'rgba(9, 9, 11, 0)');
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, 0, BASE_WIDTH, 900);

  const pad = 56;
  const contentWidth = BASE_WIDTH - pad * 2;

  // ── 2. INSTAGRAM SAFE ZONE: START AT 190PX FROM TOP ──
  // Top 190px is reserved for Story progress bars, user avatar, and close button.
  let curY = 190;

  // DailyM Waveform Icon (Lime Green #8ec13b)
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
  ctx.font = '500 19px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const rawDate = data.date || new Date().toISOString();
  const dateFormatted = isEn ? formatEnglishDate(rawDate) : formatTurkishDate(rawDate);
  ctx.fillText(dateFormatted, BASE_WIDTH - pad, curY + 24);
  ctx.textAlign = 'left';

  curY += 68;

  // ── 3. MAIN SECTION HEADLINE ──
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 42px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(isEn ? "Today's Nutrition" : 'Bugünkü Beslenme', pad, curY);

  curY += 34;

  // ── 4. HERO 3 METRIC CARDS (ALINAN | YAKILAN | NET) ──
  const heroCardHeight = 195;
  const colWidth = (contentWidth - 24) / 3;

  const consumed = data.consumedCalories || 0;
  const burned = data.burnedCalories || 0;
  const net = consumed - burned;

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
    // Card Background (#141414)
    ctx.fillStyle = '#141414';
    drawRoundedRect(ctx, x, y, w, h, 20);
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Top Label
    ctx.fillStyle = labelColor;
    ctx.font = '700 14px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(label.toUpperCase(), x + 22, y + 36);

    // Main Metric Value
    ctx.fillStyle = valueColor;
    ctx.font = '900 38px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const valStr = typeof valueNum === 'number' ? valueNum.toLocaleString(isEn ? 'en-US' : 'tr-TR') : valueNum;
    ctx.fillText(valStr, x + 22, y + 88);

    // Unit Tag
    const valWidth = ctx.measureText(valStr).width;
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '500 16px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(unitText, x + 22 + valWidth + 6, y + 88);

    // Bottom Subtext
    ctx.fillStyle = subTextColor;
    ctx.font = '500 14px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(subText, x + 22, y + 154);
  };

  // Card 1: CONSUMED
  drawSiteCard(
    pad,
    curY,
    colWidth,
    heroCardHeight,
    isEn ? 'CONSUMED' : 'ALINAN',
    '#8ec13b',
    consumed,
    'kcal',
    data.targetCalories
      ? `${isEn ? 'Target' : 'Hedef'}: ${data.targetCalories} kcal`
      : (isEn ? 'Calorie Intake' : 'Alınan Kalori'),
    '#a1a1aa'
  );

  // Card 2: BURNED
  drawSiteCard(
    pad + colWidth + 12,
    curY,
    colWidth,
    heroCardHeight,
    isEn ? 'BURNED' : 'YAKILAN',
    '#f97316',
    burned,
    'kcal',
    (data as any).targetBurned
      ? `${isEn ? 'Target' : 'Hedef'}: ${(data as any).targetBurned} kcal`
      : (isEn ? 'Burned Today' : 'Yakılan Kalori'),
    '#a1a1aa'
  );

  // Card 3: NET
  const isDeficit = net <= 0;
  drawSiteCard(
    pad + (colWidth + 12) * 2,
    curY,
    colWidth,
    heroCardHeight,
    isEn ? 'NET' : 'NET',
    isDeficit ? '#34d399' : '#f43f5e',
    net > 0 ? `+${net}` : net,
    'kcal',
    isEn
      ? (isDeficit ? 'Calorie Deficit' : 'Calorie Surplus')
      : (isDeficit ? 'Kalori Açığı' : 'Kalori Fazlası'),
    isDeficit ? '#34d399' : '#f43f5e',
    isDeficit ? '#34d399' : '#ffffff'
  );

  curY += heroCardHeight + 20;

  // ── 5. MACROS & WEIGHT CARD ──
  const macroCardH = 135;
  ctx.fillStyle = '#141414';
  drawRoundedRect(ctx, pad, curY, contentWidth, macroCardH, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.stroke();

  const totalMacroGrams = (data.carbs || 0) + (data.protein || 0) + (data.fat || 0);
  const cPct = totalMacroGrams > 0 ? Math.round(((data.carbs || 0) / totalMacroGrams) * 100) : 0;
  const pPct = totalMacroGrams > 0 ? Math.round(((data.protein || 0) / totalMacroGrams) * 100) : 0;
  const fPct = totalMacroGrams > 0 ? Math.round(((data.fat || 0) / totalMacroGrams) * 100) : 0;

  const drawMacroBlock = (
    x: number,
    label: string,
    labelColor: string,
    grams: number,
    pct?: number
  ) => {
    ctx.fillStyle = labelColor;
    ctx.font = '700 13px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(label, x, curY + 36);

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 28px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`${Math.round(grams)}`, x, curY + 76);

    const valWidth = ctx.measureText(`${Math.round(grams)}`).width;
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '600 15px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('g', x + valWidth + 4, curY + 76);

    if (pct !== undefined) {
      ctx.fillStyle = '#71717a';
      ctx.font = '600 14px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`%${pct}`, x, curY + 104);
    }
  };

  drawMacroBlock(pad + 24, isEn ? 'CARBS' : 'KARB', '#8ec13b', data.carbs || 0, cPct);
  drawMacroBlock(pad + 175, isEn ? 'PROTEIN' : 'PROTEİN', '#ffffff', data.protein || 0, pPct);
  drawMacroBlock(pad + 335, isEn ? 'FAT' : 'YAĞ', '#a1a1aa', data.fat || 0, fPct);
  drawMacroBlock(pad + 485, isEn ? 'SUGAR' : 'ŞEKER', '#f472b6', data.sugar || 0);

  // Vertical separator before Weight
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad + 750, curY + 24);
  ctx.lineTo(pad + 750, curY + macroCardH - 24);
  ctx.stroke();

  // Weight
  ctx.fillStyle = '#34d399';
  ctx.font = '700 13px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(isEn ? 'WEIGHT' : 'KİLO', pad + 780, curY + 36);

  if (data.currentWeight) {
    ctx.fillStyle = '#34d399';
    ctx.font = '800 28px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`${data.currentWeight}`, pad + 780, curY + 76);
    const kW = ctx.measureText(`${data.currentWeight}`).width;
    ctx.font = '600 16px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('kg', pad + 780 + kW + 4, curY + 76);
  } else {
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '600 18px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(isEn ? 'No Data' : 'Veri Yok', pad + 780, curY + 76);
  }

  curY += macroCardH + 24;

  // ── 6. MEAL DETAILS SECTION ──
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '700 14px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(isEn ? 'MEALS & NUTRITION' : 'ÖĞÜNLER VE BESLENME', pad, curY);

  const mealCount = (data.meals || []).length;
  ctx.textAlign = 'right';
  ctx.fillStyle = '#8ec13b';
  ctx.font = '700 14px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(isEn ? `${mealCount} Meals Logged` : `${mealCount} Öğün Kaydedildi`, BASE_WIDTH - pad, curY);
  ctx.textAlign = 'left';

  curY += 16;

  const meals = (data.meals && data.meals.length > 0) ? data.meals.slice(0, 4) : [];

  if (meals.length === 0) {
    const emptyH = 120;
    ctx.fillStyle = '#141414';
    drawRoundedRect(ctx, pad, curY, contentWidth, emptyH, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '500 18px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isEn ? 'No meal logged for this day yet.' : 'Bu gün için henüz öğün kaydı girilmedi.', BASE_WIDTH / 2, curY + 68);
    ctx.textAlign = 'left';
    curY += emptyH + 16;
  } else {
    for (const meal of meals) {
      const mealCardH = 122;

      // Card Background (#141414)
      ctx.fillStyle = '#141414';
      drawRoundedRect(ctx, pad, curY, contentWidth, mealCardH, 20);
      ctx.fill();

      // Border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Left Vertical Green Accent
      ctx.fillStyle = '#8ec13b';
      drawRoundedRect(ctx, pad + 16, curY + 20, 4, mealCardH - 40, 2);
      ctx.fill();

      // Meal Type Title
      let typeLabel = '';
      if (meal.type === 'breakfast') typeLabel = isEn ? 'BREAKFAST' : 'KAHVALTI';
      else if (meal.type === 'lunch') typeLabel = isEn ? 'LUNCH' : 'ÖĞLE YEMEĞİ';
      else if (meal.type === 'dinner') typeLabel = isEn ? 'DINNER' : 'AKŞAM YEMEĞİ';
      else typeLabel = isEn ? 'SNACKS' : 'ARA ÖĞÜN';

      ctx.fillStyle = '#8ec13b';
      ctx.font = '800 17px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(typeLabel, pad + 32, curY + 38);

      // Calorie on Right
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 24px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`${(meal.calories || 0).toLocaleString(isEn ? 'en-US' : 'tr-TR')}`, BASE_WIDTH - pad - 22, curY + 38);

      ctx.fillStyle = '#a1a1aa';
      ctx.font = '600 14px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('kcal', BASE_WIDTH - pad - 22, curY + 58);
      ctx.textAlign = 'left';

      // Meal Foods Description (Filtered and Translated)
      ctx.fillStyle = '#d4d4d8';
      ctx.font = '400 16px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

      let foodText = '';
      if (meal.foods && meal.foods.length > 0) {
        foodText = meal.foods
          .map((f) => {
            const rawName = isEn ? ((f as any).name_en || (f as any).nameEn || f.name) : f.name;
            const cleanName = cleanFoodText(rawName);
            return `${cleanName}${f.amount ? ` (${f.amount})` : ''}`;
          })
          .filter(t => t.trim().length > 0)
          .join(' · ');
      } else {
        const rawName = isEn ? ((meal as any).foodNameEn || (meal as any).food_name_en || meal.foodName) : meal.foodName;
        foodText = cleanFoodText(rawName || (isEn ? 'Logged meal' : 'Kayıtlı yiyecek'));
      }

      wrapCleanText(ctx, foodText, pad + 32, curY + 76, contentWidth - 170, 22, 2);

      curY += mealCardH + 14;
    }
  }

  curY += 10;

  // ── 7. DAILY GOAL & FITNESS ACTIVITY CARD ──
  const bottomCardH = 150;
  ctx.fillStyle = '#141414';
  drawRoundedRect(ctx, pad, curY, contentWidth, bottomCardH, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Title
  ctx.fillStyle = '#8ec13b';
  ctx.font = '700 13px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(isEn ? 'DAILY GOAL & FITNESS STATUS' : 'GÜNLÜK HEDEF VE AKTİVİTE DURUMU', pad + 24, curY + 32);

  const bColW = (contentWidth - 48) / 3;

  // 1. Hedef Kalori Oranı
  const targetCal = data.targetCalories || 2000;
  const adherencePct = Math.round((consumed / targetCal) * 100);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 26px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`%${adherencePct}`, pad + 24, curY + 76);
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '600 14px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(isEn ? 'Goal Progress' : 'Hedef Tamamlanma', pad + 24, curY + 102);
  ctx.fillStyle = '#71717a';
  ctx.font = '400 13px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`${consumed} / ${targetCal} kcal`, pad + 24, curY + 124);

  // 2. Egzersiz Süresi
  const exMins = data.exerciseMinutes || 0;
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 26px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(exMins > 0 ? `${exMins} ${isEn ? 'min' : 'dk'}` : `0 ${isEn ? 'min' : 'dk'}`, pad + 24 + bColW, curY + 76);
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '600 14px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(isEn ? 'Active Workout' : 'Aktif Egzersiz', pad + 24 + bColW, curY + 102);
  ctx.fillStyle = '#71717a';
  ctx.font = '400 13px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(
    exMins > 0
      ? (isEn ? `${(data.exercises || []).length} Activities Done` : `${(data.exercises || []).length} Aktivite Yapıldı`)
      : (isEn ? 'Rest Day' : 'Dinlenme Günü'),
    pad + 24 + bColW,
    curY + 124
  );

  // 3. Beslenme Dengesi
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 26px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(
    net <= 0 ? (isEn ? 'Deficit' : 'Açık') : (isEn ? 'Surplus' : 'Fazlalık'),
    pad + 24 + bColW * 2,
    curY + 76
  );
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '600 14px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(isEn ? 'Energy Balance' : 'Enerji Dengesi', pad + 24 + bColW * 2, curY + 102);
  ctx.fillStyle = '#71717a';
  ctx.font = '400 13px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(
    net <= 0
      ? (isEn ? `${Math.abs(net)} kcal deficit` : `${Math.abs(net)} kcal açık`)
      : (isEn ? `+${net} kcal surplus` : `+${net} kcal fazlalık`),
    pad + 24 + bColW * 2,
    curY + 124
  );

  // ── 8. FOOTER BRANDING (SAFE FROM INSTAGRAM BOTTOM CHAT BAR) ──
  const footerY = BASE_HEIGHT - 170;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, footerY - 18);
  ctx.lineTo(BASE_WIDTH - pad, footerY - 18);
  ctx.stroke();

  // Left hashtags in lime green
  ctx.fillStyle = '#8ec13b';
  ctx.font = '700 16px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(
    isEn ? '#dailym  #healthylifestyle  #nutrition  #dailytracking' : '#dailym  #sağlıklıbeslenme  #günlüktakip',
    pad,
    footerY + 14
  );

  // Right signature
  ctx.textAlign = 'right';
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '500 16px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(
    isEn ? 'DailyM · Personal Health & Nutrition Tracker' : 'DailyM · Kişisel Sağlık ve Beslenme Takibi',
    BASE_WIDTH - pad,
    footerY + 14
  );
  ctx.textAlign = 'left';

  // ── 9. RESAMPLE TO 1080x1920 WITH PICA & DOWNLOAD IMAGE ──
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = BASE_WIDTH;
  outputCanvas.height = BASE_HEIGHT;

  await pica().resize(canvas, outputCanvas, { quality: 3 });

  const link = document.createElement('a');
  const dateStr = (data.date || new Date().toISOString()).slice(0, 10);
  link.download = isEn ? `dailym-nutrition-${dateStr}-story.png` : `dailym-beslenme-${dateStr}-story.png`;
  link.href = outputCanvas.toDataURL('image/png');
  link.click();
}
