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

// Design system colors matching the DailyM website tokens
const COLORS = {
  primary: [142, 193, 59] as [number, number, number],       // Lime Green #8ec13b
  darkBg: [9, 9, 11] as [number, number, number],            // Deep Black #09090b
  surface: [16, 16, 18] as [number, number, number],         // Surface #101012
  surfaceAlt: [22, 22, 25] as [number, number, number],      // Alternate #161619
  border: [39, 39, 42] as [number, number, number],          // Subtle border #27272a
  borderSubtle: [28, 28, 30] as [number, number, number],
  textWhite: [255, 255, 255] as [number, number, number],    // Crisp White
  textMuted: [161, 161, 170] as [number, number, number],    // Zinc-400
  textSubtle: [113, 113, 122] as [number, number, number],   // Zinc-500
  gain: [52, 211, 153] as [number, number, number],          // Emerald #34d399
  loss: [251, 113, 133] as [number, number, number],         // Rose #fb7185
  blue: [129, 140, 248] as [number, number, number],         // Indigo #818cf8
};

function paintDailyMBackground(doc: jsPDF) {
  doc.setFillColor(...COLORS.darkBg);
  doc.rect(0, 0, 210, 297, 'F');
}

/**
 * Fits text safely within maxW by scaling font size down if necessary
 */
function drawSafeText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxW: number,
  defaultSize: number,
  align: 'left' | 'center' | 'right' = 'left'
) {
  let size = defaultSize;
  doc.setFontSize(size);
  while (doc.getTextWidth(text) > maxW && size > 6) {
    size -= 0.5;
    doc.setFontSize(size);
  }
  doc.text(text, x, y, { align });
}

/**
 * Clean, Executive-level DailyM Brand Header (No boxy AI container)
 */
function drawDailyMHeader(
  doc: jsPDF,
  reportTitle: string,
  categoryName: string,
  userName: string,
  dateRangeStr: string,
  startY = 14
): number {
  const marginX = 14;
  const contentW = 182;

  // Waveform Mark: 4 lime green vertical bars
  const iconX = marginX;
  const iconY = startY;
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(iconX, iconY + 2.5, 1.2, 5, 0.6, 0.6, 'F');
  doc.roundedRect(iconX + 2.4, iconY, 1.2, 10, 0.6, 0.6, 'F');
  doc.roundedRect(iconX + 4.8, iconY + 1.5, 1.2, 7, 0.6, 0.6, 'F');
  doc.roundedRect(iconX + 7.2, iconY + 3.5, 1.2, 3, 0.6, 0.6, 'F');

  // DailyM Logo Text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.textWhite);
  doc.text('Daily', iconX + 11, iconY + 7);
  const dailyW = doc.getTextWidth('Daily');
  doc.setTextColor(...COLORS.primary);
  doc.text('M', iconX + 11 + dailyW, iconY + 7);

  // Category Tag
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.primary);
  doc.text(`·  ${tr(categoryName.toUpperCase())}`, iconX + 11 + dailyW + 6, iconY + 7);

  // Right-aligned Metadata (User, Date)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textMuted);
  doc.text(tr(`Kullanici: ${userName}`), marginX + contentW, iconY + 4, { align: 'right' });
  doc.text(tr(`Tarih: ${dateRangeStr}`), marginX + contentW, iconY + 8.5, { align: 'right' });

  // Main Report Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.textWhite);
  doc.text(tr(reportTitle), marginX, startY + 18);

  // Clean separator rule with lime green accent segment
  const ruleY = startY + 22;
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(marginX, ruleY, marginX + contentW, ruleY);

  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.8);
  doc.line(marginX, ruleY, marginX + 24, ruleY);

  return ruleY + 6;
}

/**
 * Typographic section heading (Clean icon dot + Title + count badge)
 */
function drawSectionHeading(
  doc: jsPDF,
  x: number,
  y: number,
  title: string,
  badgeText?: string
): number {
  // Lime accent dot
  doc.setFillColor(...COLORS.primary);
  doc.circle(x + 1.5, y - 1.2, 1.2, 'F');

  // Title text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...COLORS.textWhite);
  doc.text(tr(title.toUpperCase()), x + 5, y);

  // Optional count/badge text
  if (badgeText) {
    const titleW = doc.getTextWidth(tr(title.toUpperCase()));
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(`(${tr(badgeText)})`, x + 5 + titleW + 3, y);
  }

  return y + 4;
}

/**
 * Clean Unified Summary Strip (Divided columns inside a single elegant container)
 */
function drawSummaryStrip(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  columns: Array<{
    label: string;
    value: string;
    subtext?: string;
    labelColor?: [number, number, number];
    valueColor?: [number, number, number];
    subtextColor?: [number, number, number];
  }>
): number {
  // Single subtle background banner
  doc.setFillColor(...COLORS.surface);
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(x, y, w, h, 2, 2, 'FD');

  const colW = w / columns.length;

  columns.forEach((col, idx) => {
    const colX = x + idx * colW;
    const paddingX = 5;
    const maxTextW = colW - paddingX * 2;

    // Draw vertical column divider (except first column)
    if (idx > 0) {
      doc.setDrawColor(...COLORS.borderSubtle);
      doc.setLineWidth(0.25);
      doc.line(colX, y + 3, colX, y + h - 3);
    }

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...(col.labelColor || COLORS.textMuted));
    doc.text(tr(col.label.toUpperCase()), colX + paddingX, y + 5.5);

    // Value
    doc.setFont('helvetica', 'bold');
    drawSafeText(
      doc,
      tr(col.value),
      colX + paddingX,
      y + (col.subtext ? 11.5 : 12),
      maxTextW,
      10,
      'left'
    );

    // Subtext (comfortably positioned inside box with 4.5mm bottom margin)
    if (col.subtext) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...(col.subtextColor || COLORS.textSubtle));
      drawSafeText(
        doc,
        tr(col.subtext),
        colX + paddingX,
        y + 16.5,
        maxTextW,
        6.5,
        'left'
      );
    }
  });

  return y + h + 6;
}

/**
 * Standard table styling matching DailyM dark UI
 */
const TABLE_STYLES = {
  theme: 'plain' as const,
  styles: {
    fontSize: 7.5,
    cellPadding: { top: 2.2, bottom: 2.2, left: 3, right: 3 },
    font: 'helvetica',
    textColor: COLORS.textWhite,
    fillColor: COLORS.surface,
    lineColor: COLORS.borderSubtle,
    lineWidth: 0.15,
  },
  headStyles: {
    fillColor: [24, 24, 28] as [number, number, number],
    textColor: COLORS.textWhite,
    fontStyle: 'bold' as const,
    fontSize: 7.5,
    lineColor: COLORS.primary,
    lineWidth: { bottom: 0.6 },
  },
  alternateRowStyles: {
    fillColor: [13, 13, 15] as [number, number, number],
  },
};

/**
 * Page footers with branding & pagination
 */
function addDailyMPDFDecorations(doc: jsPDF, reportTitle: string) {
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.2);
    doc.line(14, 286, 196, 286);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text('#dailym  #kisisel-yonetim', 14, 291);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.textMuted);
    doc.text(tr(`Sayfa ${i} / ${pageCount}`), 105, 291, { align: 'center' });

    doc.text(tr(reportTitle), 196, 291, { align: 'right' });
  }
}

// ─────────────────────────────────────────────────────────────────
// PDF 1: Daily Health Report (1 Page)
// ─────────────────────────────────────────────────────────────────
export function generateDailyPDF(userName: string, day: ExportDayData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  renderDayPage(doc, userName, day, 1, 1, 'GUNLUK BESLENME VE SAGLIK RAPORU');
  addDailyMPDFDecorations(doc, 'DailyM Gunluk Beslenme Raporu');
  doc.save(`Beslenme_Raporu_${day.date}.pdf`);
}

// ─────────────────────────────────────────────────────────────────
// PDF 2: Weekly Health Report (7 Pages)
// ─────────────────────────────────────────────────────────────────
export function generateWeeklyPDF(userName: string, startDateStr: string, endDateStr: string, days: ExportDayData[]) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const totalPages = days.length;
  days.forEach((day, index) => {
    if (index > 0) doc.addPage();
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

// ─────────────────────────────────────────────────────────────────
// PDF 3: Monthly Health Summary
// ─────────────────────────────────────────────────────────────────
export function generateMonthlyPDF(userName: string, monthName: string, weeks: ExportWeekSummary[]) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const totalPages = weeks.length;
  weeks.forEach((week, index) => {
    if (index > 0) doc.addPage();
    renderWeekPage(doc, userName, monthName, week, index + 1, totalPages);
  });
  addDailyMPDFDecorations(doc, `DailyM Aylik Ozet (${monthName})`);
  doc.save(`Aylik_Beslenme_Ozeti_${tr(monthName).replace(/\s+/g, '_')}.pdf`);
}

// ─────────────────────────────────────────────────────────────────
// PDF 4: Finance Report
// ─────────────────────────────────────────────────────────────────
export function generateFinancePDF(userName: string, data: FinanceExportData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  paintDailyMBackground(doc);
  const marginX = 14;
  const contentW = 182;

  let currentY = drawDailyMHeader(
    doc,
    'Finansal Durum ve Islem Raporu',
    'Cuzdan & Finans',
    userName,
    `${data.startDate} - ${data.endDate}`
  );

  // Single Elegant Summary Strip
  const net = data.income - data.expense;
  currentY = drawSummaryStrip(doc, marginX, currentY, contentW, 22, [
    {
      label: 'Toplam Gelir',
      value: `+${data.income.toLocaleString('tr-TR')} TL`,
      subtext: 'Donem Gelirleri',
      labelColor: COLORS.gain,
      valueColor: COLORS.gain,
    },
    {
      label: 'Toplam Gider',
      value: `-${data.expense.toLocaleString('tr-TR')} TL`,
      subtext: 'Donem Harcamalari',
      labelColor: COLORS.textMuted,
      valueColor: COLORS.textWhite,
    },
    {
      label: 'Net Durum',
      value: `${net >= 0 ? '+' : ''}${net.toLocaleString('tr-TR')} TL`,
      subtext: net >= 0 ? 'Net Arti Bakiye' : 'Net Butce Acigi',
      labelColor: net >= 0 ? COLORS.primary : COLORS.loss,
      valueColor: net >= 0 ? COLORS.primary : COLORS.loss,
    },
    {
      label: 'Islem Sayisi',
      value: `${data.transactions.length} Islem`,
      subtext: 'Filtrelenmis Kayit',
      labelColor: COLORS.textMuted,
      valueColor: COLORS.textWhite,
    },
  ]);

  // Section Heading
  currentY = drawSectionHeading(doc, marginX, currentY, 'Islem Gecmisi', `${data.transactions.length} Kayit`);

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

// ─────────────────────────────────────────────────────────────────
// PDF 5: Stocks & Portfolio Report
// ─────────────────────────────────────────────────────────────────
export function generateStocksPDF(userName: string, data: StocksExportData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  paintDailyMBackground(doc);
  const marginX = 14;
  const contentW = 182;

  let currentY = drawDailyMHeader(
    doc,
    'Borsa ve Portfoy Raporu',
    'Borsa & Yatirim',
    userName,
    `${data.startDate} - ${data.endDate}`
  );

  // Single Elegant Summary Strip
  currentY = drawSummaryStrip(doc, marginX, currentY, contentW, 22, [
    {
      label: 'Portfoy Degeri',
      value: `${data.totals.totalCurrentValue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL`,
      subtext: `Maliyet: ${data.totals.totalInvestedCost.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL`,
      labelColor: COLORS.primary,
      valueColor: COLORS.textWhite,
    },
    {
      label: 'Potansiyel K/Z',
      value: `${data.totals.totalUnrealizedPnl >= 0 ? '+' : ''}${data.totals.totalUnrealizedPnl.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL`,
      subtext: `Getiri: %${data.totals.totalUnrealizedPnlPercent.toFixed(1)}`,
      labelColor: data.totals.totalUnrealizedPnl >= 0 ? COLORS.gain : COLORS.loss,
      valueColor: data.totals.totalUnrealizedPnl >= 0 ? COLORS.gain : COLORS.loss,
    },
    {
      label: 'Gerceklesen K/Z',
      value: `${data.totals.totalRealizedPnl >= 0 ? '+' : ''}${data.totals.totalRealizedPnl.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL`,
      subtext: `Oran: %${data.totals.totalRealizedPnlPercent.toFixed(1)}`,
      labelColor: data.totals.totalRealizedPnl >= 0 ? COLORS.gain : COLORS.loss,
      valueColor: data.totals.totalRealizedPnl >= 0 ? COLORS.gain : COLORS.loss,
    },
    {
      label: 'Kazanma Orani',
      value: `%${data.totals.winRate.toFixed(1)}`,
      subtext: `${data.totals.winningTradesCount} Kar / ${data.totals.losingTradesCount} Zarar`,
      labelColor: COLORS.textMuted,
      valueColor: COLORS.textWhite,
    },
  ]);

  // ── Table 1: Open Positions ──
  currentY = drawSectionHeading(doc, marginX, currentY, 'Acik Portfoy Pozisyonlari', `${data.positions.length} Varlik`);

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

  // ── Table 2: Realized Trades (Closed Profits/Losses) ──
  // STRICT DESCENDING ORDER (newest sale first, down to oldest sale)
  const sortedRealizedTrades = [...data.realizedTrades].sort((a, b) => {
    const timeDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (!isNaN(timeDiff) && timeDiff !== 0) return timeDiff;
    return 0;
  });

  currentY = drawSectionHeading(doc, marginX, currentY, 'Gerceklesen Kar / Zarar Islemleri', `${sortedRealizedTrades.length} Satis Kaydi`);

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

  // ── Table 3: Order Book (All Trades) ──
  // STRICT DESCENDING ORDER (newest trade first)
  const sortedAllTrades = [...data.allTrades].sort((a, b) => {
    const timeDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (!isNaN(timeDiff) && timeDiff !== 0) return timeDiff;
    return 0;
  });

  currentY = drawSectionHeading(doc, marginX, currentY, 'Emir Defteri ve Islem Gecmisi', `${sortedAllTrades.length} Islem`);

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

// ─────────────────────────────────────────────────────────────────
// Page Renderer: Day Page (Daily & Weekly Health PDF)
// ─────────────────────────────────────────────────────────────────
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
  const contentW = 182;

  let currentY = drawDailyMHeader(
    doc,
    titleHeader,
    'Beslenme & Saglik',
    userName,
    day.dateFormatted
  );

  // Calorie & Balance Summary Strip
  const netCals = day.totals.calories_consumed - day.totals.total_burned;
  const sleepHrs = day.sleep.duration_minutes ? (day.sleep.duration_minutes / 60).toFixed(1) : '0';

  // 1. Calorie Balance Strip (3 Columns)
  currentY = drawSummaryStrip(doc, marginX, currentY, contentW, 21, [
    {
      label: 'Alinan Kalori',
      value: `${day.totals.calories_consumed.toLocaleString('tr-TR')} kcal`,
      subtext: 'Besin Enerjisi',
      labelColor: COLORS.primary,
      valueColor: COLORS.textWhite,
    },
    {
      label: 'Yakilan Kalori',
      value: `${day.totals.total_burned.toLocaleString('tr-TR')} kcal`,
      subtext: `BMR: ${day.totals.calories_burned_bmr || 0} kcal`,
      labelColor: COLORS.textMuted,
      valueColor: COLORS.textWhite,
    },
    {
      label: 'Net Denge',
      value: `${netCals > 0 ? '+' : ''}${netCals.toLocaleString('tr-TR')} kcal`,
      subtext: netCals > 0 ? '▲ Kalori Fazlasi' : '▼ Kalori Acigi',
      labelColor: netCals > 0 ? COLORS.primary : COLORS.blue,
      valueColor: netCals > 0 ? COLORS.primary : COLORS.blue,
    },
  ]);

  // 2. Macros & Sleep Strip (4 Columns, matching site layout 1-to-1)
  currentY = drawSummaryStrip(doc, marginX, currentY, contentW, 16, [
    {
      label: 'Karbonhidrat',
      value: `${day.totals.carbs_g}g`,
      labelColor: COLORS.primary,
      valueColor: COLORS.textWhite,
    },
    {
      label: 'Protein',
      value: `${day.totals.protein_g}g`,
      labelColor: COLORS.textWhite,
      valueColor: COLORS.textWhite,
    },
    {
      label: 'Yag',
      value: `${day.totals.fat_g}g`,
      labelColor: COLORS.textMuted,
      valueColor: COLORS.textWhite,
    },
    {
      label: 'Uyku',
      value: `${sleepHrs} saat`,
      labelColor: COLORS.blue,
      valueColor: COLORS.blue,
    },
  ]);

  // Meals Section
  const mealSections = [
    { title: 'Kahvalti', items: day.meals.breakfast },
    { title: 'Ogle Yemegi', items: day.meals.lunch },
    { title: 'Aksam Yemegi', items: day.meals.dinner },
    { title: 'Ara Ogunler / Atistirmalik', items: day.meals.snack },
  ];

  let hasFood = false;

  mealSections.forEach(section => {
    if (section.items && section.items.length > 0) {
      hasFood = true;
      currentY = drawSectionHeading(doc, marginX, currentY, section.title, `${section.items.length} Kalem`);

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

      currentY = (doc as any).lastAutoTable.finalY + 5;
    }
  });

  if (!hasFood) {
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(tr('Bu gun icin kaydedilmis ogun kaydi bulunmamaktadir.'), marginX + 4, currentY + 4);
    currentY += 8;
  }

  // Section: Burned Calories & Activities
  currentY = drawSectionHeading(doc, marginX, currentY, 'Yakilan Kalori & Aktivite Detaylari');

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

// ─────────────────────────────────────────────────────────────────
// Page Renderer: Week Page (Monthly Health PDF)
// ─────────────────────────────────────────────────────────────────
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
  const contentW = 182;

  let currentY = drawDailyMHeader(
    doc,
    `Aylik Ozet - ${week.weekName} (${monthName})`,
    'Beslenme & Saglik',
    userName,
    `${week.startDate} - ${week.endDate}`
  );

  // Single Elegant Summary Strip
  currentY = drawSummaryStrip(doc, marginX, currentY, contentW, 22, [
    {
      label: 'Haftalik Alinan',
      value: `${week.totals.calories_consumed.toLocaleString('tr-TR')} kcal`,
      subtext: `Ort: ${week.dailyAverages.calories_consumed} kcal/gun`,
      labelColor: COLORS.primary,
      valueColor: COLORS.textWhite,
    },
    {
      label: 'Haftalik Yakilan',
      value: `${week.totals.calories_burned.toLocaleString('tr-TR')} kcal`,
      subtext: `Ort: ${week.dailyAverages.calories_burned} kcal/gun`,
      labelColor: COLORS.textMuted,
      valueColor: COLORS.textWhite,
    },
    {
      label: 'Toplam Protein',
      value: `${week.totals.protein_g}g`,
      subtext: `Ort: ${week.dailyAverages.protein_g}g/gun`,
      labelColor: COLORS.textWhite,
      valueColor: COLORS.textWhite,
    },
    {
      label: 'Toplam Karb & Yag',
      value: `K:${week.totals.carbs_g}g`,
      subtext: `Y:${week.totals.fat_g}g`,
      labelColor: COLORS.textMuted,
      valueColor: COLORS.textWhite,
    },
  ]);

  // Day by day table
  currentY = drawSectionHeading(doc, marginX, currentY, `${week.weekName} Gunluk Kalori ve Makro Tablosu`);

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
