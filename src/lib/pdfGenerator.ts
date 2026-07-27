import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ExportDayData, ExportWeekSummary } from '@/actions/export';

// Helper to replace Turkish characters for jsPDF default Helvetica font compatibility
function tr(text: string | number | undefined | null): string {
  if (text === undefined || text === null) return '';
  const str = String(text);
  const map: Record<string, string> = {
    'ç': 'c', 'Ç': 'C',
    'ğ': 'g', 'Ğ': 'G',
    'ı': 'i', 'İ': 'I',
    'ö': 'o', 'Ö': 'O',
    'ş': 's', 'Ş': 'S',
    'ü': 'u', 'Ü': 'U'
  };
  return str.replace(/[çÇğĞıİöÖşŞüÜ]/g, match => map[match] || match);
}

// Colors palette for PDF
const COLORS = {
  primary: [16, 185, 129] as [number, number, number], // Emerald green #10B981
  darkBg: [24, 24, 38] as [number, number, number],
  headerBg: [30, 41, 59] as [number, number, number], // Slate 800
  headerText: [255, 255, 255] as [number, number, number],
  textDark: [15, 23, 42] as [number, number, number], // Slate 900
  textMuted: [100, 116, 139] as [number, number, number], // Slate 500
  lightBg: [248, 250, 252] as [number, number, number], // Slate 50
  border: [226, 232, 240] as [number, number, number], // Slate 200
  breakfast: [59, 130, 246] as [number, number, number], // Blue
  lunch: [245, 158, 11] as [number, number, number], // Amber
  dinner: [16, 185, 129] as [number, number, number], // Emerald
  snack: [168, 85, 247] as [number, number, number], // Purple
};

/**
 * PDF 1: Daily Report (1 Page)
 */
export function generateDailyPDF(userName: string, day: ExportDayData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  renderDayPage(doc, userName, day, 1, 1, 'GUNLUK BESLENME VE SAGLIK RAPORU');

  doc.save(`Beslenme_Raporu_${day.date}.pdf`);
}

/**
 * PDF 2: Weekly Report (7 Pages - 1 Page Per Day)
 */
export function generateWeeklyPDF(userName: string, startDateStr: string, endDateStr: string, days: ExportDayData[]) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const totalPages = days.length;
  days.forEach((day, index) => {
    if (index > 0) {
      doc.addPage();
    }
    const headerTitle = `HAFTALIK RAPOR (${startDateStr} - ${endDateStr})`;
    renderDayPage(doc, userName, day, index + 1, totalPages, headerTitle);
  });

  doc.save(`Haftalik_Beslenme_Raporu_${days[0]?.date || 'hafta'}.pdf`);
}

/**
 * PDF 3: Monthly Report (4 Pages - 1 Page Per Week Summary)
 */
export function generateMonthlyPDF(userName: string, monthName: string, weeks: ExportWeekSummary[]) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const totalPages = weeks.length;
  weeks.forEach((week, index) => {
    if (index > 0) {
      doc.addPage();
    }
    renderWeekPage(doc, userName, monthName, week, index + 1, totalPages);
  });

  doc.save(`Aylik_Beslenme_Ozeti_${tr(monthName).replace(/\s+/g, '_')}.pdf`);
}

/**
 * Render a Single Day Page (Used for Daily and Weekly PDF)
 */
function renderDayPage(
  doc: jsPDF,
  userName: string,
  day: ExportDayData,
  pageNum: number,
  totalPages: number,
  titleHeader: string
) {
  const marginX = 14;
  let currentY = 14;

  // Header Banner
  doc.setFillColor(...COLORS.headerBg);
  doc.rect(marginX, currentY, 182, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(tr(titleHeader), marginX + 6, currentY + 9);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(tr(`Kullanici: ${userName}  |  Tarih: ${day.dateFormatted}`), marginX + 6, currentY + 16);

  currentY += 28;

  // Meal Tables (Kahvalti, Ogle, Aksam, Ara Ogun)
  const mealSections = [
    { title: 'Kahvalti', items: day.meals.breakfast, color: COLORS.breakfast },
    { title: 'Ogle Yemegi', items: day.meals.lunch, color: COLORS.lunch },
    { title: 'Aksam Yemegi', items: day.meals.dinner, color: COLORS.dinner },
    { title: 'Ara Ogunler / Atistirmalik', items: day.meals.snack, color: COLORS.snack },
  ];

  let hasFood = false;

  mealSections.forEach(section => {
    if (section.items && section.items.length > 0) {
      hasFood = true;
      doc.setFillColor(...section.color);
      doc.rect(marginX, currentY, 182, 6, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(tr(section.title), marginX + 4, currentY + 4.5);
      currentY += 7;

      const tableData = section.items.map(f => [
        tr(f.name),
        tr(f.amount),
        `${f.calories} kcal`,
        `${f.protein}g`,
        `${f.carbs}g`,
        `${f.sugar || 0}g`,
        `${f.fat}g`
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [[tr('Besin Urunu'), tr('Miktar'), tr('Kalori'), tr('Protein'), tr('Karb'), tr('Seker'), tr('Yag')]],
        body: tableData,
        theme: 'striped',
        margin: { left: marginX, right: marginX },
        styles: { fontSize: 8, cellPadding: 2, font: 'helvetica' },
        headStyles: { fillStyle: 'F', fillColor: [241, 245, 249], textColor: COLORS.textDark, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 62 },
          1: { cellWidth: 32 },
          2: { cellWidth: 20, halign: 'right' },
          3: { cellWidth: 17, halign: 'right' },
          4: { cellWidth: 17, halign: 'right' },
          5: { cellWidth: 17, halign: 'right' },
          6: { cellWidth: 17, halign: 'right' },
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 4;
    }
  });

  if (!hasFood) {
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(tr('Bu gun icin kaydedilmis ogun kaydi bulunmamaktadir.'), marginX, currentY + 4);
    currentY += 10;
  }

  // Section: Burned Calories & Activities
  doc.setFillColor(...COLORS.headerBg);
  doc.rect(marginX, currentY, 182, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(tr('Yakilan Kalori & Aktivite Detaylari (BMR / Uyku / Egzersiz)'), marginX + 4, currentY + 4.5);
  currentY += 7;

  const burnedRows = [];

  // BMR
  burnedRows.push([
    tr('Bazal Metabolizma Hizi (BMR)'),
    tr('24 Saatlik Dinlenme Tuketimi'),
    `${day.totals.calories_burned_bmr > 0 ? day.totals.calories_burned_bmr : '-'} kcal`
  ]);

  // Sleep
  const sleepHrs = day.sleep.duration_minutes ? (day.sleep.duration_minutes / 60).toFixed(1) : '0';
  burnedRows.push([
    tr('Uyku Harcamasi'),
    tr(`${sleepHrs} saat uyku (BMR dahilinde)`),
    `${day.sleep.calories_burned} kcal`
  ]);

  // Exercises
  if (day.exercises && day.exercises.length > 0) {
    day.exercises.forEach(ex => {
      burnedRows.push([
        tr(`Egzersiz: ${ex.name}`),
        tr(`${ex.duration_minutes} dakika`),
        `${ex.calories_burned} kcal`
      ]);
    });
  } else {
    burnedRows.push([
      tr('Egzersiz Kaydi'),
      tr('Egzersiz girilmedi'),
      '0 kcal'
    ]);
  }

  autoTable(doc, {
    startY: currentY,
    head: [[tr('Aktivite / Kategori'), tr('Sure / Aciklama'), tr('Yakilan Kalori')]],
    body: burnedRows,
    theme: 'plain',
    margin: { left: marginX, right: marginX },
    styles: { fontSize: 8, cellPadding: 2, font: 'helvetica' },
    headStyles: { fillColor: [241, 245, 249], textColor: COLORS.textDark, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 65 },
      2: { cellWidth: 37, halign: 'right' }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // Summary Card / Totals
  doc.setFillColor(...COLORS.lightBg);
  doc.setDrawColor(...COLORS.border);
  doc.rect(marginX, currentY, 182, 24, 'FD');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.textDark);
  doc.text(tr('GUNLUK NET OZET VE MAKRO DAĞILIMI'), marginX + 4, currentY + 6);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(tr(`Alinan Kalori: ${day.totals.calories_consumed} kcal`), marginX + 4, currentY + 12);
  doc.text(tr(`Toplam Yakilan: ${day.totals.total_burned} kcal`), marginX + 60, currentY + 12);
  const netCals = day.totals.calories_consumed - day.totals.total_burned;
  doc.setFont('helvetica', 'bold');
  doc.text(tr(`Net Kalori Denge: ${netCals > 0 ? '+' : ''}${netCals} kcal`), marginX + 120, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.text(tr(`Protein: ${day.totals.protein_g}g  |  Karb: ${day.totals.carbs_g}g  |  Seker: ${day.totals.sugar_g || 0}g  |  Yag: ${day.totals.fat_g}g`), marginX + 4, currentY + 19);

  // Footer / Page Number
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textMuted);
  doc.text(tr(`Sayfa ${pageNum} / ${totalPages}`), 105, 290, { align: 'center' });
}

/**
 * Render a Single Week Summary Page (Used for Monthly PDF - 4 Weeks = 4 Pages)
 */
function renderWeekPage(
  doc: jsPDF,
  userName: string,
  monthName: string,
  week: ExportWeekSummary,
  pageNum: number,
  totalPages: number
) {
  const marginX = 14;
  let currentY = 14;

  // Header Banner
  doc.setFillColor(...COLORS.headerBg);
  doc.rect(marginX, currentY, 182, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(tr(`AYLIK OZET - ${week.weekName.toUpperCase()} (${monthName.toUpperCase()})`), marginX + 6, currentY + 9);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(tr(`Kullanici: ${userName}  |  Tarih Araligi: ${week.startDate} - ${week.endDate}`), marginX + 6, currentY + 16);

  currentY += 28;

  // Weekly Overview Cards
  doc.setFillColor(...COLORS.lightBg);
  doc.setDrawColor(...COLORS.border);
  doc.rect(marginX, currentY, 88, 28, 'FD');
  doc.rect(marginX + 94, currentY, 88, 28, 'FD');

  // Card 1: Totals
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.textDark);
  doc.text(tr('HAFTALIK TOPLAM DEGERLER'), marginX + 4, currentY + 7);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(tr(`Alinan Toplam Kalori: ${week.totals.calories_consumed} kcal`), marginX + 4, currentY + 13);
  doc.text(tr(`Yakilan Toplam Kalori: ${week.totals.calories_burned} kcal`), marginX + 4, currentY + 18);
  doc.text(tr(`Makrolar: P:${week.totals.protein_g}g | K:${week.totals.carbs_g}g | Y:${week.totals.fat_g}g`), marginX + 4, currentY + 23);

  // Card 2: Daily Averages
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(tr('GUNLUK ORTALAMALAR'), marginX + 98, currentY + 7);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(tr(`Ort. Alinan Kalori: ${week.dailyAverages.calories_consumed} kcal/gun`), marginX + 98, currentY + 13);
  doc.text(tr(`Ort. Yakilan Kalori: ${week.dailyAverages.calories_burned} kcal/gun`), marginX + 98, currentY + 18);
  doc.text(tr(`Ort. Makrolar: P:${week.dailyAverages.protein_g}g | K:${week.dailyAverages.carbs_g}g | Y:${week.dailyAverages.fat_g}g`), marginX + 98, currentY + 23);

  currentY += 34;

  // Table: Day by Day Breakdown for this week
  doc.setFillColor(...COLORS.headerBg);
  doc.rect(marginX, currentY, 182, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(tr(`${week.weekName} Gunluk Kalori ve Makro Tablosu`), marginX + 4, currentY + 4.5);
  currentY += 7;

  const tableBody = week.days.map(d => [
    tr(d.dayName),
    `${d.consumed} kcal`,
    `${d.burned} kcal`,
    `${d.consumed - d.burned > 0 ? '+' : ''}${d.consumed - d.burned} kcal`,
    `${d.protein}g`,
    `${d.carbs}g`,
    `${d.fat}g`
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [[tr('Gun'), tr('Alinan'), tr('Yakilan'), tr('Net Denge'), tr('Protein'), tr('Karb'), tr('Yag')]],
    body: tableBody,
    theme: 'striped',
    margin: { left: marginX, right: marginX },
    styles: { fontSize: 8.5, cellPadding: 3, font: 'helvetica' },
    headStyles: { fillColor: [241, 245, 249], textColor: COLORS.textDark, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 24, halign: 'right' },
      2: { cellWidth: 24, halign: 'right' },
      3: { cellWidth: 26, halign: 'right' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 24, halign: 'right' },
    }
  });

  // Footer / Page Number
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textMuted);
  doc.text(tr(`Sayfa ${pageNum} / ${totalPages}`), 105, 290, { align: 'center' });
}
