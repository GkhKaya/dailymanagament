import { HealthDataDTO } from '@/models/DashboardTypes';

const WIDTH = 1080;
const HEIGHT = 1920;

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 2
) {
  const words = text.split(' ');
  let line = '';
  let lines = 0;
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      ctx.fillText(line, x, y + lines * lineHeight);
      lines += 1;
      line = word;
      if (lines === maxLines - 1) break;
    } else {
      line = next;
    }
  }
  if (lines < maxLines && line) {
    ctx.fillText(line, x, y + lines * lineHeight);
  }
}

function formatTurkishDate(dateStr: string): string {
  try {
    const d = new Date(dateStr.length === 10 ? `${dateStr}T00:00:00` : dateStr);
    return d.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long'
    });
  } catch {
    return dateStr;
  }
}

export function downloadHealthStory(data: HealthDataDTO) {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Hikaye görseli oluşturulamadı.');

  // ── 1. ULTRA-DEEP OLED DARK BACKGROUND ──
  const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  bg.addColorStop(0, '#04070a');
  bg.addColorStop(0.3, '#070c12');
  bg.addColorStop(0.7, '#05090e');
  bg.addColorStop(1, '#020406');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // ── 2. ATMOSPHERIC TURQUOISE GLOW ORBS & MESH ──
  const drawGlow = (x: number, y: number, radius: number, colorInner: string, colorOuter = 'rgba(0,0,0,0)') => {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, colorInner);
    gradient.addColorStop(1, colorOuter);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  };

  // Vivid Turquoise & Deep Cyan glow accents
  drawGlow(900, 150, 420, 'rgba(6, 214, 196, 0.16)');
  drawGlow(120, 750, 380, 'rgba(20, 241, 217, 0.10)');
  drawGlow(950, 1400, 450, 'rgba(45, 212, 191, 0.12)');
  drawGlow(200, 1850, 400, 'rgba(6, 214, 196, 0.14)');

  // Subtle aesthetic background geometric circles
  ctx.strokeStyle = 'rgba(20, 241, 217, 0.07)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(900, 150, 280, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(100, 1800, 320, 0, Math.PI * 2);
  ctx.stroke();

  // Subtle grid dot effect in header
  ctx.fillStyle = 'rgba(20, 241, 217, 0.12)';
  for (let gx = 0; gx < 6; gx++) {
    for (let gy = 0; gy < 3; gy++) {
      ctx.beginPath();
      ctx.arc(WIDTH - 120 + gx * 14, 80 + gy * 14, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const pad = 64;
  const contentWidth = WIDTH - pad * 2;

  // ── 3. TOP BRANDING & DATE HEADER ──
  let curY = 90;

  // Brand Pill Badge
  ctx.fillStyle = 'rgba(20, 241, 217, 0.09)';
  roundedRect(ctx, pad, curY, 210, 48, 24);
  ctx.fill();
  ctx.strokeStyle = 'rgba(20, 241, 217, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Turquoise pulsating dot
  ctx.fillStyle = '#14f1d9';
  ctx.beginPath();
  ctx.arc(pad + 24, curY + 24, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#14f1d9';
  ctx.font = '700 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('DAILYM HEALTH', pad + 42, curY + 31);

  // Date on the right
  ctx.textAlign = 'right';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const dateFormatted = formatTurkishDate(data.date || new Date().toISOString());
  ctx.fillText(dateFormatted, WIDTH - pad, curY + 32);
  ctx.textAlign = 'left';

  curY += 78;

  // Main Section Headline
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 46px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('GÜNLÜK BESLENME ÖZETİ', pad, curY);

  curY += 38;

  // ── 4. HERO METRICS BAR: ALINAN | NET DENGE | YAKILAN ──
  const heroCardHeight = 220;
  const colWidth = (contentWidth - 28) / 3;

  // Function to render a metric card
  const drawHeroCard = (
    x: number,
    y: number,
    w: number,
    h: number,
    title: string,
    value: string,
    unit: string,
    subtext: string,
    isHighlight = false,
    highlightColor = '#14f1d9'
  ) => {
    // Card Background
    ctx.fillStyle = isHighlight ? 'rgba(8, 28, 34, 0.85)' : 'rgba(11, 19, 27, 0.75)';
    roundedRect(ctx, x, y, w, h, 28);
    ctx.fill();

    // Border
    ctx.strokeStyle = isHighlight ? 'rgba(20, 241, 217, 0.45)' : 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = isHighlight ? 2 : 1;
    ctx.stroke();

    // Inner Glow if highlight
    if (isHighlight) {
      ctx.fillStyle = 'rgba(20, 241, 217, 0.08)';
      roundedRect(ctx, x + 4, y + 4, w - 8, 36, 18);
      ctx.fill();
    }

    // Title
    ctx.fillStyle = isHighlight ? highlightColor : '#94a3b8';
    ctx.font = '700 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(title, x + 24, y + 42);

    // Value
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(value, x + 24, y + 115);

    // Unit
    ctx.fillStyle = isHighlight ? highlightColor : '#64748b';
    ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(unit, x + 24, y + 150);

    // Subtext Pill / Line
    ctx.fillStyle = '#94a3b8';
    ctx.font = '400 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(subtext, x + 24, y + 188);
  };

  const consumed = data.consumedCalories || 0;
  const burned = data.burnedCalories || 0;
  const net = consumed - burned;
  const netSign = net > 0 ? '+' : '';

  // 1. Alınan
  drawHeroCard(
    pad,
    curY,
    colWidth,
    heroCardHeight,
    'ALINAN',
    consumed.toLocaleString('tr-TR'),
    'kcal',
    `Hedef: ${(data.targetCalories || 2000).toLocaleString('tr-TR')} kcal`
  );

  // 2. Net Denge (HIGHLIGHTED TURQUOISE CARD)
  drawHeroCard(
    pad + colWidth + 14,
    curY,
    colWidth,
    heroCardHeight,
    'NET DENGE',
    `${netSign}${net.toLocaleString('tr-TR')}`,
    'kcal fark',
    net > 0 ? '▲ Kalori Fazlası' : net < 0 ? '▼ Kalori Açığı' : '● Dengede',
    true,
    '#14f1d9'
  );

  // 3. Yakılan
  drawHeroCard(
    pad + (colWidth + 14) * 2,
    curY,
    colWidth,
    heroCardHeight,
    'YAKILAN',
    burned.toLocaleString('tr-TR'),
    'kcal',
    `Egzersiz & BMR`
  );

  curY += heroCardHeight + 30;

  // ── 5. MAKRO BESİN DAĞILIMI (TURQUOISE HIGHLIGHTED PROGRESS BARS) ──
  const macroCardHeight = 210;
  ctx.fillStyle = 'rgba(10, 18, 26, 0.85)';
  roundedRect(ctx, pad, curY, contentWidth, macroCardHeight, 28);
  ctx.fill();
  ctx.strokeStyle = 'rgba(20, 241, 217, 0.22)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Macro Title & Ratio
  ctx.fillStyle = '#14f1d9';
  ctx.font = '800 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('MAKRO BESİN DAĞILIMI', pad + 28, curY + 42);

  const totalGrams = (data.protein || 0) + (data.carbs || 0) + (data.fat || 0) || 1;
  const pPct = Math.round(((data.protein || 0) / totalGrams) * 100);
  const cPct = Math.round(((data.carbs || 0) / totalGrams) * 100);
  const fPct = Math.round(((data.fat || 0) / totalGrams) * 100);

  // 3 Macro Columns inside the Card
  const macroColW = (contentWidth - 56) / 3;

  const drawMacroCol = (
    mx: number,
    label: string,
    grams: number,
    pct: number,
    barColor1: string,
    barColor2: string
  ) => {
    // Label & Gram
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`${grams}g`, mx, curY + 104);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`${label} · %${pct}`, mx, curY + 134);

    // Track Background
    const trackW = macroColW - 24;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
    roundedRect(ctx, mx, curY + 152, trackW, 14, 7);
    ctx.fill();

    // Active Bar Gradient
    const barW = Math.max(10, Math.min(trackW, (trackW * pct) / 100));
    const barGrad = ctx.createLinearGradient(mx, 0, mx + barW, 0);
    barGrad.addColorStop(0, barColor1);
    barGrad.addColorStop(1, barColor2);
    ctx.fillStyle = barGrad;
    roundedRect(ctx, mx, curY + 152, barW, 14, 7);
    ctx.fill();
  };

  // Protein (Turquoise Neon)
  drawMacroCol(pad + 28, 'Protein', data.protein || 0, pPct, '#06d6a0', '#14f1d9');

  // Karbonhidrat (Vibrant Cyan)
  drawMacroCol(pad + 28 + macroColW, 'Karbonhidrat', data.carbs || 0, cPct, '#00f2fe', '#4facfe');

  // Yağ (Teal / Amber)
  drawMacroCol(pad + 28 + macroColW * 2, 'Yağ', data.fat || 0, fPct, '#2dd4bf', '#0d9488');

  curY += macroCardHeight + 36;

  // ── 6. "BUGÜN NE YEDİM?" MEALS TIMELINE ──
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('BUGÜN NE YEDİM?', pad, curY);

  ctx.fillStyle = '#14f1d9';
  ctx.font = '600 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${(data.meals || []).length} Öğün Kaydedildi`, WIDTH - pad, curY);
  ctx.textAlign = 'left';

  curY += 24;

  const meals = (data.meals && data.meals.length > 0) ? data.meals.slice(0, 4) : [];

  if (meals.length === 0) {
    // Empty state card
    const emptyH = 160;
    ctx.fillStyle = 'rgba(10, 18, 26, 0.6)';
    roundedRect(ctx, pad, curY, contentWidth, emptyH, 24);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '500 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Bu gün için henüz öğün kaydı girilmedi.', WIDTH / 2, curY + 90);
    ctx.textAlign = 'left';
    curY += emptyH + 24;
  } else {
    for (const meal of meals) {
      const mealCardH = 146;

      // Card Background
      ctx.fillStyle = 'rgba(8, 16, 24, 0.85)';
      roundedRect(ctx, pad, curY, contentWidth, mealCardH, 24);
      ctx.fill();

      // Card Border with subtle Turquoise Glow
      ctx.strokeStyle = 'rgba(20, 241, 217, 0.20)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Left Accent Vertical Pill
      ctx.fillStyle = '#14f1d9';
      roundedRect(ctx, pad + 16, curY + 22, 5, mealCardH - 44, 2.5);
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

      ctx.fillStyle = '#14f1d9';
      ctx.font = '800 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(typeLabel, pad + 34, curY + 44);

      // Calorie Badge on the Right
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`${(meal.calories || 0).toLocaleString('tr-TR')}`, WIDTH - pad - 24, curY + 44);

      ctx.fillStyle = '#14f1d9';
      ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('kcal', WIDTH - pad - 24, curY + 68);
      ctx.textAlign = 'left';

      // Meal Food Names / Content Description
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '400 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

      let foodText = '';
      if (meal.foods && meal.foods.length > 0) {
        foodText = meal.foods.map((f) => `${f.name}${f.amount ? ` (${f.amount})` : ''}`).join('  ·  ');
      } else {
        foodText = meal.foodName || 'Kayıtlı yiyecek';
      }

      wrapText(ctx, foodText, pad + 34, curY + 86, contentWidth - 180, 26, 2);

      curY += mealCardH + 16;
    }
  }

  // ── 7. FOOTER MOTIVATION & HASHTAGS ──
  const footerY = HEIGHT - 110;

  // Subtle separator line
  ctx.strokeStyle = 'rgba(20, 241, 217, 0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, footerY - 24);
  ctx.lineTo(WIDTH - pad, footerY - 24);
  ctx.stroke();

  // Left hashtags
  ctx.fillStyle = '#14f1d9';
  ctx.font = '700 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('#dailym  #sağlıklıbeslenme  #fitnesstakibi', pad, footerY + 12);

  // Right brand signature
  ctx.textAlign = 'right';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('DailyM ile her gün daha iyiye.', WIDTH - pad, footerY + 12);
  ctx.textAlign = 'left';

  // Trigger Download
  const link = document.createElement('a');
  const dateStr = (data.date || new Date().toISOString()).slice(0, 10);
  link.download = `dailym-beslenme-${dateStr}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
