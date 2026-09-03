import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ExportDayData, ExportWeekSummary, FinanceExportData, StocksExportData } from '@/actions/export';

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

// Colors palette matching the DailyM website theme tokens
const COLORS = {
  primary: [142, 193, 59] as [number, number, number],       // Lime Green #8ec13b
  primaryDark: [121, 170, 50] as [number, number, number],
  darkBg: [9, 9, 11] as [number, number, number],            // Deep Black #09090b
  cardBg: [20, 20, 22] as [number, number, number],          // Card Surface #141414
  cardBgAlt: [28, 28, 30] as [number, number, number],       // Alternate row #1c1c1e
  border: [39, 39, 42] as [number, number, number],          // Subtle border #27272a
  borderLight: [63, 63, 70] as [number, number, number],     // Zinc-700
  textWhite: [255, 255, 255] as [number, number, number],    // White
  textMuted: [161, 161, 170] as [number, number, number],    // Zinc-400
  textSubtle: [113, 113, 122] as [number, number, number],   // Zinc-500
  gain: [52, 211, 153] as [number, number, number],          // Emerald #34d399
  loss: [251, 113, 133] as [number, number, number],         // Rose #fb7185
  blue: [129, 140, 248] as [number, number, number],         // Indigo/Blue #818cf8
  breakfast: [59, 130, 246] as [number, number, number],     // Blue
  lunch: [245, 158, 11] as [number, number, number],         // Amber
  dinner: [16, 185, 129] as [number, number, number],        // Emerald
  snack: [168, 85, 247] as [number, number, number],         // Purple
};

function paintDailyMBackground(doc: jsPDF) {
  doc.setFillColor(...COLORS.darkBg);
  doc.rect(0, 0, 210, 297, 'F');
}

/**
 * Draws the signature DailyM Brand Header Banner on any page
 */
function drawDailyMBrandHeader(
  doc: jsPDF,
  title: string,
  categoryBadge: string,
  userName: string,
  dateRangeStr: string,
  startY = 12
) {
  const marginX = 14;
  const headerW = 182;
  const headerH = 22;

  // Background card
  doc.setFillColor(...COLORS.cardBg);
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(marginX, startY, headerW, headerH, 2.5, 2.5, 'FD');

  // Bottom lime accent line
  doc.setFillColor(...COLORS.primary);
  doc.rect(marginX, startY + headerH - 1, headerW, 1, 'F');

  // Equalizer waveform icon (4 vertical bars in lime green)
  const iconX = marginX + 5;
  const iconY = startY + 5.5;
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(iconX, iconY + 2.5, 1.2, 5, 0.6, 0.6, 'F');
  doc.roundedRect(iconX + 2.4, iconY, 1.2, 10, 0.6, 0.6, 'F');
  doc.roundedRect(iconX + 4.8, iconY + 1.5, 1.2, 7, 0.6, 0.6, 'F');
  doc.roundedRect(iconX + 7.2, iconY + 3.5, 1.2, 3, 0.6, 0.6, 'F');

  // DailyM text logo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.textWhite);
  doc.text('Daily', iconX + 11, iconY + 7);
  const dailyW = doc.getTextWidth('Daily');
  doc.setTextColor(...COLORS.primary);
  doc.text('M', iconX + 11 + dailyW, iconY + 7);

  // Category Pill below logo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.primary);
  doc.text(tr(categoryBadge.toUpperCase()), iconX + 11, iconY + 11.5);

  // Center / Main Report Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.textWhite);
  doc.text(tr(title), marginX + 48, startY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.textMuted);
  doc.text(tr(`Kullanici: ${userName}`), marginX + 48, startY + 15);

  // Right Metadata (Date & Generation time)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.textMuted);
  doc.text(tr(`Tarih: ${dateRangeStr}`), marginX + headerW - 5, startY + 10, { align: 'right' });
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.textSubtle);
  doc.text(tr(`DailyM PDF Rapor Servisi`), marginX + headerW - 5, startY + 15, { align: 'right' });

  return startY + headerH + 6;
}

/**
 * Draws a sleek site-matching metric card
 */
function drawMetricCard(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  subtext: string,
  labelColor = COLORS.textMuted,
  valueColor = COLORS.textWhite,
  subtextColor = COLORS.textSubtle
) {
  // Card base
  doc.setFillColor(...COLORS.cardBg);
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(x, y, w, h, 2, 2, 'FD');

  // Label
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...labelColor);
  doc.text(tr(label.toUpperCase()), x + 3.5, y + 5);

  // Value
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...valueColor);
  doc.text(tr(value), x + 3.5, y + 11.5);

  // Subtext
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...subtextColor);
  doc.text(tr(subtext), x + 3.5, y + 16.5);
}

/**
 * Draws a section header with left accent bar
 */
function drawSectionHeader(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  title: string,
  badgeText?: string
) {
  const h = 7;
  doc.setFillColor(...COLORS.cardBg);
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(x, y, w, h, 1.5, 1.5, 'FD');

  // Left vertical lime accent
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(x + 1.2, y + 1.2, 1.5, h - 2.4, 0.6, 0.6, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textWhite);
  doc.text(tr(title), x + 5, y + 4.7);

  if (badgeText) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(tr(badgeText), x + w - 4, y + 4.7, { align: 'right' });
  }

  return y + h + 3;
}

/**
 * Adds page footers and numbers across all pages of a document
 */
function addDailyMPDFDecorations(doc: jsPDF, reportTitle: string) {
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    // Footer separator line
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.25);
    doc.line(14, 285, 196, 285);

    // Left hashtag branding
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text('#dailym  #kisisel-yonetim', 14, 290);

    // Center page indicator
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(tr(`Sayfa ${i} / ${pageCount}`), 105, 290, { align: 'center' });

    // Right report title
    doc.text(tr(reportTitle), 196, 290, { align: 'right' });
  }
}

// Standard table styles matching DailyM design
const TABLE_STYLES = {
  theme: 'plain' as const,
  styles: {
    fontSize: 7.5,
    cellPadding: { top: 2, bottom: 2, left: 2.5, right: 2.5 },
    font: 'helvetica',
    textColor: COLORS.textWhite,
    fillColor: COLORS.cardBg,
    lineColor: COLORS.border,
    lineWidth: 0.2,
  },
  headStyles: {
    fillColor: [24, 24, 28] as [number, number, number],
    textColor: COLORS.textWhite,
    fontStyle: 'bold' as const,
    fontSize: 7.5,
    lineColor: COLORS.primary,
    lineWidth: { bottom: 0.5 },
  },
  alternateRowStyles: {
    fillColor: [16, 16, 18] as [number, number, number],
  },
};

/**
 * PDF 1: Daily Report (1 Page)
 */
export function generateDailyPDF(userName: string, day: ExportDayData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  renderDayPage(doc, userName, day, 1, 1, 'GUNLUK BESLENME VE SAGLIK RAPORU');
  addDailyMPDFDecorations(doc, 'DailyM Gunluk Beslenme Raporu');
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
    const headerTitle = `HAFTALIK BESLENME RAPORU (${startDateStr} - ${endDateStr})`;
    renderDayPage(doc, userName, day, index + 1, totalPages, headerTitle);
  });
  addDailyMPDFDecorations(doc, 'DailyM Haftalik Beslenme Raporu');
  doc.save(`Haftalik_Beslenme_Raporu_${days[0]?.date || 'hafta'}.pdf`);
}

export function generateDateRangePDF(userName: string, startDateStr: string, endDateStr: string, days: ExportDayData[]) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  days.forEach((day, index) => {
    if (index > 0) doc.addPage();
    renderDayPage(doc, userName, day, index + 1, days.length, `BESLENME RAPORU (${startDateStr} - ${endDateStr})`);
  });
  addDailyMPDFDecorations(doc, 'DailyM Tarih Araligi Raporu');
  doc.save(`Beslenme_Raporu_${days[0]?.date || 'tarih_araligi'}_${days[days.length - 1]?.date || ''}.pdf`);
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
  addDailyMPDFDecorations(doc, `DailyM Aylik Ozet (${monthName})`);
  doc.save(`Aylik_Beslenme_Ozeti_${tr(monthName).replace(/\s+/g, '_')}.pdf`);
}

/**
 * PDF 4: Finance Report
 */
export function generateFinancePDF(userName: string, data: FinanceExportData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  paintDailyMBackground(doc);
  const marginX = 14;

  let currentY = drawDailyMBrandHeader(
    doc,
    'FINANSAL DURUM VE ISLEM RAPORU',
    'DAILYM FINANCE',
    userName,
    `${data.startDate} - ${data.endDate}`
  );

  // 4 Metric Summary Cards
  const cardW = (182 - 9) / 4;
  const net = data.income - data.expense;

  drawMetricCard(
    doc,
    marginX,
    currentY,
    cardW,
    19,
    'TOPLAM GELIR',
    `+${data.income.toLocaleString('tr-TR')} TL`,
    'Donem Gelirleri',
    COLORS.gain,
    COLORS.gain
  );
  drawMetricCard(
    doc,
    marginX + cardW + 3,
    currentY,
    cardW,
    19,
    'TOPLAM GIDER',
    `-${data.expense.toLocaleString('tr-TR')} TL`,
    'Donem Harcamalari',
    COLORS.textMuted,
    COLORS.textWhite
  );
  drawMetricCard(
    doc,
    marginX + (cardW + 3) * 2,
    currentY,
    cardW,
    19,
    'NET DURUM',
    `${net >= 0 ? '+' : ''}${net.toLocaleString('tr-TR')} TL`,
    net >= 0 ? 'Net Arti Bakiye' : 'Net Butce Acigi',
    net >= 0 ? COLORS.primary : COLORS.loss,
    net >= 0 ? COLORS.primary : COLORS.loss
  );
  drawMetricCard(
    doc,
    marginX + (cardW + 3) * 3,
    currentY,
    cardW,
    19,
    'ISLEM SAYISI',
    `${data.transactions.length}`,
    'Filtrelenmis Hareket',
    COLORS.textMuted,
    COLORS.textWhite
  );

  currentY += 25;

  // Transactions Table Section
  currentY = drawSectionHeader(
    doc,
    marginX,
    currentY,
    182,
    'ISLEM GECMISI',
    `${data.transactions.length} Kayit`
  );

  // Sort transactions newest to oldest
  const sortedTransactions = [...data.transactions].sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    if (isNaN(timeA) || isNaN(timeB)) return 0;
    return timeB - timeA;
  });

  autoTable(doc, {
    ...TABLE_STYLES,
    startY: currentY,
    head: [[tr('Tarih'), tr('Aciklama'), tr('Hesap'), tr('Kategori'), tr('Tur'), tr('Tutar')]],
    body: sortedTransactions.map(item => [
      tr(item.date),
      tr(item.description),
      tr(item.accountName),
      tr(item.categoryName),
      item.type === 'income' ? 'Gelir' : item.type === 'expense' ? 'Gider' : 'Transfer',
      `${item.type === 'income' ? '+' : item.type === 'expense' ? '-' : ''}${item.amount.toLocaleString('tr-TR')} TL`
    ]),
    margin: { left: marginX, right: marginX, bottom: 18 },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 50 },
      2: { cellWidth: 32 },
      3: { cellWidth: 28 },
      4: { cellWidth: 20 },
      5: { cellWidth: 26, halign: 'right', fontStyle: 'bold' }
    },
    didParseCell: (dataCell) => {
      if (dataCell.section === 'body' && dataCell.column.index === 5) {
        const text = String(dataCell.cell.raw || '');
        if (text.startsWith('+')) {
          dataCell.cell.styles.textColor = COLORS.gain;
        } else if (text.startsWith('-')) {
          dataCell.cell.styles.textColor = COLORS.textWhite;
        }
      }
    }
  });

  addDailyMPDFDecorations(doc, 'DailyM Finans Raporu');
  doc.save(`Finans_Raporu_${data.startDate.replaceAll('.', '-')}_${data.endDate.replaceAll('.', '-')}.pdf`);
}

/**
 * PDF 5: Stocks & Portfolio Report
 */
export function generateStocksPDF(userName: string, data: StocksExportData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  paintDailyMBackground(doc);
  const marginX = 14;

  let currentY = drawDailyMBrandHeader(
    doc,
    'BORSA VE PORTFOY RAPORU',
    'DAILYM STOCKS',
    userName,
    `${data.startDate} - ${data.endDate}`
  );

  // 4 Top Metric Cards
  const cardW = (182 - 9) / 4;
  drawMetricCard(
    doc,
    marginX,
    currentY,
    cardW,
    19,
    'PORTFOY DEGERI',
    `${data.totals.totalCurrentValue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL`,
    `Maliyet: ${data.totals.totalInvestedCost.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL`,
    COLORS.primary,
    COLORS.textWhite
  );
  drawMetricCard(
    doc,
    marginX + cardW + 3,
    currentY,
    cardW,
    19,
    'POTANSIYEL K/Z',
    `${data.totals.totalUnrealizedPnl >= 0 ? '+' : ''}${data.totals.totalUnrealizedPnl.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL`,
    `Getiri: %${data.totals.totalUnrealizedPnlPercent.toFixed(1)}`,
    data.totals.totalUnrealizedPnl >= 0 ? COLORS.gain : COLORS.loss,
    data.totals.totalUnrealizedPnl >= 0 ? COLORS.gain : COLORS.loss
  );
  drawMetricCard(
    doc,
    marginX + (cardW + 3) * 2,
    currentY,
    cardW,
    19,
    'GERCEKLESEN K/Z',
    `${data.totals.totalRealizedPnl >= 0 ? '+' : ''}${data.totals.totalRealizedPnl.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL`,
    `Oran: %${data.totals.totalRealizedPnlPercent.toFixed(1)}`,
    data.totals.totalRealizedPnl >= 0 ? COLORS.gain : COLORS.loss,
    data.totals.totalRealizedPnl >= 0 ? COLORS.gain : COLORS.loss
  );
  drawMetricCard(
    doc,
    marginX + (cardW + 3) * 3,
    currentY,
    cardW,
    19,
    'KAZANMA ORANI',
    `%${data.totals.winRate.toFixed(1)}`,
    `${data.totals.winningTradesCount} Kar / ${data.totals.losingTradesCount} Zarar`,
    COLORS.textMuted,
    COLORS.textWhite
  );

  currentY += 24;

  // Table 1: Open Positions
  currentY = drawSectionHeader(
    doc,
    marginX,
    currentY,
    182,
    'ACIK PORTFOY POZISYONLARI',
    `${data.positions.length} Varlik`
  );

  if (data.positions.length === 0) {
    doc.setTextColor(...COLORS.textMuted);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text(tr('Portfoyde acik hisse veya fon pozisyonu bulunmuyor.'), marginX + 4, currentY + 4);
    currentY += 10;
  } else {
    autoTable(doc, {
      ...TABLE_STYLES,
      startY: currentY,
      head: [[tr('Sembol'), tr('Sirket / Tanim'), tr('Tur'), tr('Lot'), tr('Ort. Maliyet'), tr('Top. Maliyet'), tr('Guncel Fiyat'), tr('Potansiyel K/Z')]],
      body: data.positions.map(p => [
        tr(p.symbol),
        tr(p.name || '-'),
        p.assetType === 'fund' ? 'FON' : 'HISSE',
        p.total_lots.toLocaleString('tr-TR'),
        `${p.average_cost.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`,
        `${p.total_cost.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`,
        p.current_price ? `${p.current_price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL` : '-',
        p.unrealized_pnl !== undefined ? `${p.unrealized_pnl >= 0 ? '+' : ''}${p.unrealized_pnl.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL (%${(p.unrealized_pnl_percent || 0).toFixed(1)})` : '-'
      ]),
      margin: { left: marginX, right: marginX, bottom: 18 },
      columnStyles: {
        0: { cellWidth: 18, fontStyle: 'bold' },
        1: { cellWidth: 38 },
        2: { cellWidth: 14 },
        3: { cellWidth: 16, halign: 'right' },
        4: { cellWidth: 24, halign: 'right' },
        5: { cellWidth: 24, halign: 'right' },
        6: { cellWidth: 22, halign: 'right' },
        7: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
      },
      didParseCell: (dataCell) => {
        if (dataCell.section === 'body' && dataCell.column.index === 7) {
          const text = String(dataCell.cell.raw || '');
          dataCell.cell.styles.textColor = text.startsWith('+') ? COLORS.gain : text.startsWith('-') ? COLORS.loss : COLORS.textWhite;
        }
      }
    });
    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Check if new page is needed before Table 2
  if (currentY > 215) {
    doc.addPage();
    paintDailyMBackground(doc);
    currentY = 14;
  }

  // Table 2: Realized Trades (Closed Profits/Losses)
  // Ensure STRICT DESCENDING ORDER (newest sale first, down to oldest sale)
  const sortedRealizedTrades = [...data.realizedTrades].sort((a, b) => {
    const timeDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (!isNaN(timeDiff) && timeDiff !== 0) return timeDiff;
    return 0;
  });

  currentY = drawSectionHeader(
    doc,
    marginX,
    currentY,
    182,
    'GERCEKLESEN KAR / ZARAR ISLEMLERI',
    `${sortedRealizedTrades.length} Satis Kaydi`
  );

  if (sortedRealizedTrades.length === 0) {
    doc.setTextColor(...COLORS.textMuted);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text(tr('Secilen tarih araliginda gerceklesen satis kaydi bulunmuyor.'), marginX + 4, currentY + 4);
    currentY += 10;
  } else {
    autoTable(doc, {
      ...TABLE_STYLES,
      startY: currentY,
      head: [[tr('Tarih'), tr('Sembol'), tr('Tur'), tr('Satilan Lot'), tr('Alis Maliyeti'), tr('Satis Fiyati'), tr('Toplam Tutar'), tr('Net Kar/Zarar')]],
      body: sortedRealizedTrades.map(t => [
        tr(`${t.date} (${t.holding_days ?? 0}g)`),
        tr(t.symbol),
        t.assetType === 'fund' ? 'FON' : 'HISSE',
        t.lots.toLocaleString('tr-TR'),
        `${(t.cost_basis || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`,
        `${t.price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`,
        `${t.total_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`,
        `${(t.realized_pnl || 0) >= 0 ? '+' : ''}${(t.realized_pnl || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL (%${(t.realized_pnl_percent || 0).toFixed(1)})`
      ]),
      margin: { left: marginX, right: marginX, bottom: 18 },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 18, fontStyle: 'bold' },
        2: { cellWidth: 14 },
        3: { cellWidth: 18, halign: 'right' },
        4: { cellWidth: 24, halign: 'right' },
        5: { cellWidth: 24, halign: 'right' },
        6: { cellWidth: 28, halign: 'right' },
        7: { cellWidth: 34, halign: 'right', fontStyle: 'bold' },
      },
      didParseCell: (dataCell) => {
        if (dataCell.section === 'body' && dataCell.column.index === 7) {
          const text = String(dataCell.cell.raw || '');
          dataCell.cell.styles.textColor = text.startsWith('+') ? COLORS.gain : text.startsWith('-') ? COLORS.loss : COLORS.textWhite;
        }
      }
    });
    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Check if new page is needed before Table 3
  if (currentY > 215) {
    doc.addPage();
    paintDailyMBackground(doc);
    currentY = 14;
  }

  // Table 3: Order Book (All Trades)
  // Ensure STRICT DESCENDING ORDER (newest trade first)
  const sortedAllTrades = [...data.allTrades].sort((a, b) => {
    const timeDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (!isNaN(timeDiff) && timeDiff !== 0) return timeDiff;
    return 0;
  });

  currentY = drawSectionHeader(
    doc,
    marginX,
    currentY,
    182,
    'EMIR DEFTERI VE ISLEM GECMISI',
    `${sortedAllTrades.length} Islem`
  );

  if (sortedAllTrades.length === 0) {
    doc.setTextColor(...COLORS.textMuted);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text(tr('Secilen tarih araliginda emir kaydi bulunmuyor.'), marginX + 4, currentY + 4);
    currentY += 10;
  } else {
    autoTable(doc, {
      ...TABLE_STYLES,
      startY: currentY,
      head: [[tr('Tarih'), tr('Sembol'), tr('Islem'), tr('Tur'), tr('Lot'), tr('Birim Fiyat'), tr('Toplam Tutar'), tr('Not')]],
      body: sortedAllTrades.map(t => [
        tr(t.date),
        tr(t.symbol),
        t.type === 'buy' ? 'ALIS' : 'SATIS',
        t.assetType === 'fund' ? 'FON' : 'HISSE',
        t.lots.toLocaleString('tr-TR'),
        `${t.price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`,
        `${t.total_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`,
        tr(t.notes || '-')
      ]),
      margin: { left: marginX, right: marginX, bottom: 18 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 18, fontStyle: 'bold' },
        2: { cellWidth: 16, fontStyle: 'bold' },
        3: { cellWidth: 14 },
        4: { cellWidth: 16, halign: 'right' },
        5: { cellWidth: 24, halign: 'right' },
        6: { cellWidth: 26, halign: 'right' },
        7: { cellWidth: 48 },
      },
      didParseCell: (dataCell) => {
        if (dataCell.section === 'body' && dataCell.column.index === 2) {
          const text = String(dataCell.cell.raw || '');
          dataCell.cell.styles.textColor = text === 'ALIS' ? COLORS.primary : COLORS.loss;
        }
      }
    });
  }

  addDailyMPDFDecorations(doc, 'DailyM Borsa & Portfoy Raporu');
  doc.save(`Borsa_Portfoy_Raporu_${data.startDate.replaceAll('.', '-')}_${data.endDate.replaceAll('.', '-')}.pdf`);
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
  paintDailyMBackground(doc);
  const marginX = 14;

  let currentY = drawDailyMBrandHeader(
    doc,
    titleHeader,
    'DAILYM HEALTH',
    userName,
    day.dateFormatted
  );

  // 3 Hero Metric Cards
  const cardW = (182 - 6) / 3;
  const netCals = day.totals.calories_consumed - day.totals.total_burned;

  drawMetricCard(
    doc,
    marginX,
    currentY,
    cardW,
    19,
    'ALINAN KALORI',
    `${day.totals.calories_consumed.toLocaleString('tr-TR')} kcal`,
    'Gunluk Alinan',
    COLORS.primary,
    COLORS.textWhite
  );
  drawMetricCard(
    doc,
    marginX + cardW + 3,
    currentY,
    cardW,
    19,
    'YAKILAN KALORI',
    `${day.totals.total_burned.toLocaleString('tr-TR')} kcal`,
    `BMR: ${day.totals.calories_burned_bmr || 0} kcal`,
    COLORS.textMuted,
    COLORS.textWhite
  );
  drawMetricCard(
    doc,
    marginX + (cardW + 3) * 2,
    currentY,
    cardW,
    19,
    'NET DENGE',
    `${netCals > 0 ? '+' : ''}${netCals.toLocaleString('tr-TR')} kcal`,
    netCals > 0 ? '▲ Kalori Fazlasi' : '▼ Kalori Acigi',
    netCals > 0 ? COLORS.primary : COLORS.blue,
    netCals > 0 ? COLORS.primary : COLORS.blue
  );

  currentY += 23;

  // Macro & Health Strip (Matching the site's exact horizontal strip)
  const macroW = (182 - 9) / 4;
  drawMetricCard(
    doc,
    marginX,
    currentY,
    macroW,
    15,
    'PROTEIN',
    `${day.totals.protein_g}g`,
    'Gunluk Makro',
    COLORS.textWhite,
    COLORS.textWhite
  );
  drawMetricCard(
    doc,
    marginX + macroW + 3,
    currentY,
    macroW,
    15,
    'KARBONHIDRAT',
    `${day.totals.carbs_g}g`,
    'Gunluk Makro',
    COLORS.primary,
    COLORS.textWhite
  );
  drawMetricCard(
    doc,
    marginX + (macroW + 3) * 2,
    currentY,
    macroW,
    15,
    'YAG',
    `${day.totals.fat_g}g`,
    'Gunluk Makro',
    COLORS.textMuted,
    COLORS.textWhite
  );
  const sleepHrs = day.sleep.duration_minutes ? (day.sleep.duration_minutes / 60).toFixed(1) : '0';
  drawMetricCard(
    doc,
    marginX + (macroW + 3) * 3,
    currentY,
    macroW,
    15,
    'UYKU',
    `${sleepHrs} saat`,
    'Dinlenme',
    COLORS.blue,
    COLORS.blue
  );

  currentY += 19;

  // Meals Section
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
      currentY = drawSectionHeader(doc, marginX, currentY, 182, section.title);

      const tableData = section.items.map(f => [
        tr(f.name),
        tr(f.amount),
        `${f.calories} kcal`,
        `${f.protein}g`,
        `${f.carbs}g`,
        `${f.fat}g`
      ]);

      autoTable(doc, {
        ...TABLE_STYLES,
        startY: currentY,
        head: [[tr('Besin Urunu'), tr('Miktar'), tr('Kalori'), tr('Protein'), tr('Karb'), tr('Yag')]],
        body: tableData,
        margin: { left: marginX, right: marginX, bottom: 18 },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 36 },
          2: { cellWidth: 22, halign: 'right' },
          3: { cellWidth: 18, halign: 'right' },
          4: { cellWidth: 18, halign: 'right' },
          5: { cellWidth: 18, halign: 'right' },
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 4;
    }
  });

  if (!hasFood) {
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(tr('Bu gun icin kaydedilmis ogun kaydi bulunmamaktadir.'), marginX + 4, currentY + 4);
    currentY += 8;
  }

  // Section: Burned Calories & Activities
  currentY = drawSectionHeader(doc, marginX, currentY, 182, 'Yakilan Kalori & Aktivite Detaylari (BMR / Uyku / Egzersiz)');

  const burnedRows = [];
  burnedRows.push([
    tr('Bazal Metabolizma Hizi (BMR)'),
    tr('24 Saatlik Dinlenme Tuketimi'),
    `${day.totals.calories_burned_bmr > 0 ? day.totals.calories_burned_bmr : '-'} kcal`
  ]);

  burnedRows.push([
    tr('Uyku Harcamasi'),
    tr(`${sleepHrs} saat uyku (BMR dahilinde)`),
    `${day.totals.calories_burned_sleep > 0 ? day.totals.calories_burned_sleep : '-'} kcal`
  ]);

  day.exercises.forEach(ex => {
    burnedRows.push([
      tr(ex.name),
      tr(`${ex.duration_minutes} dk`),
      `${ex.calories_burned} kcal`
    ]);
  });

  autoTable(doc, {
    ...TABLE_STYLES,
    startY: currentY,
    head: [[tr('Aktivite / Kaynak'), tr('Sure / Detay'), tr('Yakilan Kalori')]],
    body: burnedRows,
    margin: { left: marginX, right: marginX, bottom: 18 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 62 },
      2: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }
    }
  });
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
  paintDailyMBackground(doc);
  const marginX = 14;

  let currentY = drawDailyMBrandHeader(
    doc,
    `AYLIK BESLENME OZETI - ${week.weekName.toUpperCase()} (${monthName.toUpperCase()})`,
    'DAILYM HEALTH',
    userName,
    `${week.startDate} - ${week.endDate}`
  );

  // 4 Summary Metric Cards
  const cardW = (182 - 9) / 4;
  drawMetricCard(
    doc,
    marginX,
    currentY,
    cardW,
    19,
    'HAFTALIK ALINAN',
    `${week.totals.calories_consumed.toLocaleString('tr-TR')} kcal`,
    `Ort: ${week.dailyAverages.calories_consumed} kcal/gun`,
    COLORS.primary,
    COLORS.textWhite
  );
  drawMetricCard(
    doc,
    marginX + cardW + 3,
    currentY,
    cardW,
    19,
    'HAFTALIK YAKILAN',
    `${week.totals.calories_burned.toLocaleString('tr-TR')} kcal`,
    `Ort: ${week.dailyAverages.calories_burned} kcal/gun`,
    COLORS.textMuted,
    COLORS.textWhite
  );
  drawMetricCard(
    doc,
    marginX + (cardW + 3) * 2,
    currentY,
    cardW,
    19,
    'TOPLAM PROTEIN',
    `${week.totals.protein_g}g`,
    `Ort: ${week.dailyAverages.protein_g}g/gun`,
    COLORS.textWhite,
    COLORS.textWhite
  );
  drawMetricCard(
    doc,
    marginX + (cardW + 3) * 3,
    currentY,
    cardW,
    19,
    'TOPLAM KARB & YAG',
    `K:${week.totals.carbs_g}g`,
    `Y:${week.totals.fat_g}g`,
    COLORS.textMuted,
    COLORS.textWhite
  );

  currentY += 25;

  // Table: Day by Day Breakdown for this week
  currentY = drawSectionHeader(
    doc,
    marginX,
    currentY,
    182,
    `${week.weekName} Gunluk Kalori ve Makro Tablosu`
  );

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
    ...TABLE_STYLES,
    startY: currentY,
    head: [[tr('Gun'), tr('Alinan'), tr('Yakilan'), tr('Net Denge'), tr('Protein'), tr('Karb'), tr('Yag')]],
    body: tableBody,
    margin: { left: marginX, right: marginX, bottom: 18 },
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: 24, halign: 'right' },
      2: { cellWidth: 24, halign: 'right' },
      3: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 26, halign: 'right' },
    },
    didParseCell: (dataCell) => {
      if (dataCell.section === 'body' && dataCell.column.index === 3) {
        const text = String(dataCell.cell.raw || '');
        dataCell.cell.styles.textColor = text.startsWith('+') ? COLORS.gain : text.startsWith('-') ? COLORS.loss : COLORS.textWhite;
      }
    }
  });
}
