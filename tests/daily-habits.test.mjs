import test from 'node:test';
import assert from 'node:assert/strict';

function calculateStreak(completedDates, refDateStr) {
  if (!completedDates || completedDates.length === 0) return 0;

  const [y, m, d] = refDateStr.split('-').map(Number);
  const dateCursor = new Date(y, m - 1, d);

  const isDoneToday = completedDates.includes(refDateStr);
  if (!isDoneToday) {
    // If not completed today, check if yesterday was completed to keep streak alive
    dateCursor.setDate(dateCursor.getDate() - 1);
  }

  let streak = 0;
  while (true) {
    const key = `${dateCursor.getFullYear()}-${String(dateCursor.getMonth() + 1).padStart(2, '0')}-${String(dateCursor.getDate()).padStart(2, '0')}`;
    if (completedDates.includes(key)) {
      streak++;
      dateCursor.setDate(dateCursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

test('calculateStreak returns 0 when no dates are completed', () => {
  assert.equal(calculateStreak([], '2026-09-16'), 0);
  assert.equal(calculateStreak(null, '2026-09-16'), 0);
});

test('calculateStreak counts consecutive completed days correctly', () => {
  const dates = ['2026-09-16', '2026-09-15', '2026-09-14'];
  assert.equal(calculateStreak(dates, '2026-09-16'), 3);
});

test('calculateStreak preserves active streak if completed yesterday but not yet today', () => {
  const dates = ['2026-09-15', '2026-09-14', '2026-09-13'];
  // Today is 2026-09-16, not done today yet, but done yesterday -> streak is 3
  assert.equal(calculateStreak(dates, '2026-09-16'), 3);
});

test('calculateStreak breaks when a day was missed in between', () => {
  // Missed 2026-09-14
  const dates = ['2026-09-16', '2026-09-15', '2026-09-13'];
  assert.equal(calculateStreak(dates, '2026-09-16'), 2);
});

test('toggle completion toggles date in completed_dates array', () => {
  let completedDates = ['2026-09-15'];
  const targetDate = '2026-09-16';

  // Toggle on
  if (!completedDates.includes(targetDate)) {
    completedDates = [...completedDates, targetDate];
  }
  assert.ok(completedDates.includes('2026-09-16'));

  // Toggle off
  if (completedDates.includes(targetDate)) {
    completedDates = completedDates.filter(d => d !== targetDate);
  }
  assert.equal(completedDates.includes('2026-09-16'), false);
  assert.equal(completedDates.includes('2026-09-15'), true);
});

test('validates custom task title is not empty and trims whitespace', () => {
  const sanitizeTitle = (t) => t ? t.trim() : '';
  assert.equal(sanitizeTitle('  Vitamin D3 + K2  '), 'Vitamin D3 + K2');
  assert.equal(sanitizeTitle('   '), '');
  assert.equal(sanitizeTitle(null), '');
});
