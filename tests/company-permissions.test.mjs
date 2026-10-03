import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canDeleteCompany,
  canManageCompanyFinance,
  canManageCompanyMembers,
  filterCompanyTransactions,
} from '../src/lib/company-permissions.ts';

test('only the owner can manage members and delete a company', () => {
  assert.equal(canManageCompanyMembers('owner'), true);
  assert.equal(canManageCompanyMembers('admin'), false);
  assert.equal(canDeleteCompany('owner'), true);
  assert.equal(canDeleteCompany('admin'), false);
});

test('owners and admins can manage company finance', () => {
  assert.equal(canManageCompanyFinance('owner'), true);
  assert.equal(canManageCompanyFinance('admin'), true);
  assert.equal(canManageCompanyFinance(null), false);
});

test('filters transactions to the selected calendar month', () => {
  const transactions = [
    { id: 'september', date: '2026-09-30T10:00:00.000Z' },
    { id: 'october', date: '2026-10-02T10:00:00.000Z' },
  ];

  assert.deepEqual(
    filterCompanyTransactions(transactions, 'month', new Date('2026-10-15T12:00:00.000Z')).map((item) => item.id),
    ['october'],
  );
});
