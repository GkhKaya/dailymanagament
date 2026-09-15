import test from 'node:test';
import assert from 'node:assert/strict';

test('validates workout note date format (YYYY-MM-DD)', () => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  assert.ok(dateRegex.test('2026-09-15'));
  assert.ok(dateRegex.test('2025-01-01'));
  assert.equal(dateRegex.test('15-09-2026'), false);
  assert.equal(dateRegex.test('2026/09/15'), false);
  assert.equal(dateRegex.test('invalid'), false);
});

test('generates short excerpt for note header (max 80 chars + ellipsis)', () => {
  const generateExcerpt = (content) => {
    if (!content) return '';
    return content.length > 80 ? content.slice(0, 80) + '...' : content;
  };

  const shortText = 'Bench press 90kg 3x5 rahat yapıldı.';
  assert.equal(generateExcerpt(shortText), shortText);

  const longText = 'Bugün göğüs ve arka kol antrenmanı yapıldı. Isınma setlerinden sonra 90kg bench press ile 3 set 5 tekrar başarıyla tamamlandı. Son sette omuz hafif zorlandı.';
  const excerpt = generateExcerpt(longText);
  assert.ok(excerpt.length <= 83);
  assert.ok(excerpt.endsWith('...'));
});

test('formats workout note date label accurately for Turkish locale', () => {
  const formatDateLabel = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(dateObj);
  };

  const formatted = formatDateLabel('2026-09-15');
  assert.ok(formatted.includes('15'));
  assert.ok(formatted.includes('Eylül'));
  assert.ok(formatted.includes('2026'));
});

test('lazy load behavior: separates lightweight header from full detail', () => {
  const fullNoteRecord = {
    _id: 'note_123',
    user_id: 'user_abc',
    date: '2026-09-15',
    title: 'Ağır Bacak Günü',
    content: 'Squat: 120kg 5x5 yapıldı.\nLeg press: 200kg 3x10.\nCalf raise: 80kg 4x15.\nSon derece yüksek enerji vardı.',
    created_at: new Date('2026-09-15T10:00:00Z'),
    updated_at: new Date('2026-09-15T11:00:00Z')
  };

  // Header representation (sent when Notlar tab opens, without heavy body)
  const header = {
    id: fullNoteRecord._id,
    date: fullNoteRecord.date,
    title: fullNoteRecord.title,
    excerpt: fullNoteRecord.content.slice(0, 50) + '...',
    updated_at: fullNoteRecord.updated_at.toISOString()
  };

  assert.equal(header.date, '2026-09-15');
  assert.equal(header.title, 'Ağır Bacak Günü');
  assert.ok(header.excerpt.length < fullNoteRecord.content.length);

  // Detail representation (fetched ONLY when user clicks that day's toggle)
  const detail = {
    id: fullNoteRecord._id,
    date: fullNoteRecord.date,
    title: fullNoteRecord.title,
    content: fullNoteRecord.content,
    updated_at: fullNoteRecord.updated_at.toISOString()
  };

  assert.equal(detail.content, fullNoteRecord.content);
  assert.ok(detail.content.includes('Squat: 120kg 5x5 yapıldı.'));
});
