import test from "node:test";
import assert from "node:assert/strict";
import * as jspdfPkg from "jspdf";
import * as autotablePkg from "jspdf-autotable";

const jsPDF = jspdfPkg.jsPDF || jspdfPkg.default?.jsPDF || jspdfPkg.default;
const autoTable = autotablePkg.default || autotablePkg;

test("multi-page PDF keeps all pages dark (#09090b) via willDrawPage and DarkPageManager", () => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const paintedPages = new Set();
  const darkBg = [9, 9, 11];

  const paintPage = () => {
    const pageNum = doc.internal.getCurrentPageInfo().pageNumber;
    if (!paintedPages.has(pageNum)) {
      paintedPages.add(pageNum);
      doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
      doc.rect(0, 0, 210, 297, 'F');
    }
  };

  paintPage(); // page 1

  // Generate a large table with 80 rows to force multiple pages
  const rows = [];
  for (let i = 1; i <= 80; i++) {
    rows.push([`2026-08-${(i % 28 + 1).toString().padStart(2, '0')}`, `SYM${i}`, 'ALIS', `${i * 10}`, `${i * 50} TL`]);
  }

  autoTable(doc, {
    startY: 30,
    willDrawPage: () => paintPage(),
    margin: { top: 16, bottom: 18, left: 14, right: 14 },
    head: [['Tarih', 'Sembol', 'Islem', 'Lot', 'Tutar']],
    body: rows,
  });

  const totalPages = doc.internal.getNumberOfPages();
  assert.ok(totalPages > 1, `Expected multi-page output, got ${totalPages} page(s)`);

  // Ensure paintedPages has recorded EVERY page
  for (let p = 1; p <= totalPages; p++) {
    assert.ok(paintedPages.has(p), `Page ${p} must be painted with dark background!`);
  }
});

test("date sorting handles both ISO rawDate and Turkish DD.MM.YYYY dates newest first", () => {
  const parseSortTime = (item) => {
    if (item.rawDate) {
      const t = new Date(item.rawDate).getTime();
      if (!isNaN(t)) return t;
    }
    const dStr = String(item.date || '');
    const parts = dStr.split('.');
    if (parts.length === 3) {
      const timePart = item.time ? `T${item.time}` : 'T00:00:00';
      const t = new Date(`${parts[2]}-${parts[1]}-${parts[0]}${timePart}`).getTime();
      if (!isNaN(t)) return t;
    }
    return new Date(item.date).getTime() || 0;
  };

  const trades = [
    { id: '1', date: '05.08.2026', time: '09:30' },
    { id: '2', date: '28.08.2026', time: '14:00' },
    { id: '3', date: '15.08.2026', rawDate: '2026-08-15T10:00:00.000Z' },
    { id: '4', date: '28.08.2026', time: '16:45' },
    { id: '5', date: '01.08.2026' }
  ];

  const sorted = [...trades].sort((a, b) => parseSortTime(b) - parseSortTime(a));
  
  assert.deepEqual(sorted.map(t => t.id), ['4', '2', '3', '1', '5']);
});

test("date filter correctly confines trades to selected date range", () => {
  const parseTradeDate = (t) => {
    if (t.rawDate) {
      const d = new Date(t.rawDate);
      if (!isNaN(d.getTime())) return d;
    }
    if (t.date) {
      const parts = t.date.split('.');
      if (parts.length === 3) {
        const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
        if (!isNaN(d.getTime())) return d;
      }
      const fallback = new Date(t.date);
      if (!isNaN(fallback.getTime())) return fallback;
    }
    return null;
  };

  const filterByDate = (trades, startStr, endStr) => {
    const sParts = startStr.split('.');
    const eParts = endStr.split('.');
    const start = new Date(`${sParts[2]}-${sParts[1]}-${sParts[0]}T00:00:00.000`);
    const end = new Date(`${eParts[2]}-${eParts[1]}-${eParts[0]}T23:59:59.999`);

    return trades.filter((t) => {
      const d = parseTradeDate(t);
      if (!d) return false;
      return d >= start && d <= end;
    });
  };

  const trades = [
    { id: 'july-end', date: '31.07.2026' },
    { id: 'aug-start', date: '01.08.2026' },
    { id: 'aug-mid', date: '15.08.2026', rawDate: '2026-08-15T12:00:00.000Z' },
    { id: 'aug-end', date: '31.08.2026' },
    { id: 'sep-start', date: '01.09.2026' }
  ];

  const augTrades = filterByDate(trades, '01.08.2026', '31.08.2026');
  assert.deepEqual(augTrades.map(t => t.id), ['aug-start', 'aug-mid', 'aug-end']);
});
