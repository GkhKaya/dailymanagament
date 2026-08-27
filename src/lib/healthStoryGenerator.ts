import { HealthDataDTO } from '@/models/DashboardTypes';

const WIDTH = 1080;
const HEIGHT = 1920;

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 3) {
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
    } else line = next;
  }
  if (lines < maxLines && line) ctx.fillText(line, x, y + lines * lineHeight);
  return Math.min(lines + 1, maxLines);
}

export function downloadHealthStory(data: HealthDataDTO) {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Hikaye görseli oluşturulamadı.');

  const bg = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  bg.addColorStop(0, '#062f36');
  bg.addColorStop(0.52, '#087f83');
  bg.addColorStop(1, '#13b8a6');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath(); ctx.arc(920, 180, 260, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(80, 1740, 330, 0, Math.PI * 2); ctx.fill();

  const pad = 72;
  ctx.fillStyle = '#d9fffa';
  ctx.font = '700 34px Arial';
  ctx.fillText('gokhan.raw', pad, 112);
  ctx.font = '500 22px Arial';
  ctx.fillStyle = 'rgba(217,255,250,0.72)';
  ctx.fillText('GÜNLÜK BESLENME ÖZETİ', pad, 154);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 64px Arial';
  ctx.fillText(data.consumedCalories.toLocaleString('tr-TR'), pad, 270);
  ctx.font = '400 25px Arial';
  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.fillText('kcal alındı', pad, 310);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 48px Arial';
  ctx.fillText(data.burnedCalories.toLocaleString('tr-TR'), WIDTH - pad, 270);
  ctx.font = '400 25px Arial';
  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.fillText('kcal yakıldı', WIDTH - pad, 310);
  ctx.textAlign = 'left';

  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  roundedRect(ctx, pad, 365, WIDTH - pad * 2, 150, 28);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 27px Arial';
  ctx.fillText('NET DENGE', pad + 32, 414);
  ctx.font = '700 58px Arial';
  ctx.fillText(`${data.consumedCalories - data.burnedCalories > 0 ? '+' : ''}${(data.consumedCalories - data.burnedCalories).toLocaleString('tr-TR')} kcal`, pad + 32, 475);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 28px Arial';
  ctx.fillText('BUGÜN NE YEDİM?', pad, 610);
  let y = 660;
  const meals = data.meals.length ? data.meals : [];
  for (const meal of meals.slice(0, 5)) {
    const cardHeight = 150;
    ctx.fillStyle = 'rgba(255,255,255,0.94)';
    roundedRect(ctx, pad, y, WIDTH - pad * 2, cardHeight, 24);
    ctx.fillStyle = '#075e65';
    ctx.font = '700 27px Arial';
    ctx.fillText(meal.type === 'breakfast' ? 'KAHVALTI' : meal.type === 'lunch' ? 'ÖĞLE' : meal.type === 'dinner' ? 'AKŞAM' : 'ARA ÖĞÜN', pad + 28, y + 42);
    ctx.textAlign = 'right';
    ctx.font = '700 27px Arial';
    ctx.fillText(`${meal.calories} kcal`, WIDTH - pad - 28, y + 42);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#285e63';
    ctx.font = '400 22px Arial';
    const foodText = meal.foods?.map(food => food.name).join(' · ') || meal.foodName || 'Kayıt yok';
    wrapText(ctx, foodText, pad + 28, y + 83, WIDTH - pad * 2 - 56, 28, 2);
    y += cardHeight + 20;
  }

  const macroY = Math.min(y + 25, 1510);
  ctx.fillStyle = 'rgba(0,45,52,0.34)';
  roundedRect(ctx, pad, macroY, WIDTH - pad * 2, 170, 26);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 26px Arial';
  ctx.fillText('MAKRO DAĞILIMI', pad + 30, macroY + 42);
  ctx.font = '600 25px Arial';
  ctx.fillText(`Protein  ${data.protein || 0}g`, pad + 30, macroY + 98);
  ctx.fillText(`Karb.  ${data.carbs || 0}g`, pad + 350, macroY + 98);
  ctx.fillText(`Yağ  ${data.fat || 0}g`, pad + 650, macroY + 98);
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.font = '400 21px Arial';
  ctx.fillText(`#gokhanraw  #beslenme  #fitnesstakibi`, pad, 1815);
  ctx.textAlign = 'right';
  ctx.fillText('Bugün kendin için ne yaptın?', WIDTH - pad, 1815);
  ctx.textAlign = 'left';

  const link = document.createElement('a');
  link.download = `gokhan-raw-beslenme-${data.date.slice(0, 10)}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
