import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPrayerNotifications, normalizeProviderTimes, normalizeDiyanetTimes, findDiyanetDistrict, getPrayerNotificationKey } from '../src/lib/prayer-times.ts';
test('creates two notifications for every prayer', () => { const base = new Date('2026-08-10T10:00:00+03:00'); const rows = buildPrayerNotifications({ imsak: base, ogle: base, ikindi: base, aksam: base, yatsi: base }); assert.equal(rows.length, 10); assert.equal(rows[0].scheduled_at.getTime() - base.getTime(), 900000); assert.equal(rows[1].scheduled_at.getTime() - base.getTime(), 3600000); });
test('normalizes provider time fields', () => { const value = normalizeProviderTimes('2026-08-10', { Imsak: '04:00 (TRT)', Dhuhr: '13:00', Asr: '17:00', Maghrib: '20:00', Isha: '22:00' }); assert.equal(value.ogle.getHours(), 13); assert.equal(value.yatsi.getMinutes(), 0); });
test('normalizes Diyanet times without shifting local clock', () => { const value = normalizeDiyanetTimes('2026-08-10', { imsak: '04:25', ogle: '13:11', ikindi: '17:00', aksam: '20:10', yatsi: '21:40' }); assert.equal(value.ogle.getUTCHours(), 10); assert.equal(value.ogle.getUTCMinutes(), 11); });
test('finds a district from the provider district list', () => { assert.equal(findDiyanetDistrict([{ _id: '9689', name: 'KÜTAHYA' }], 'Kütahya')?._id, '9689'); });
test('keeps notification records unique per prayer and delay', () => { assert.notEqual(getPrayerNotificationKey('day1', 'aksam', 'after_1h'), getPrayerNotificationKey('day1', 'yatsi', 'after_1h')); });
