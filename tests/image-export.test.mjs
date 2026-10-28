import test from 'node:test';
import assert from 'node:assert/strict';
import { deliverImageFile } from '../src/lib/image-export.ts';

test('uses the native share path when the image file is shareable', async () => {
  const events = [];
  const result = await deliverImageFile(
    { name: 'story.png', type: 'image/png' },
    {
      canShareFiles: () => true,
      shareFiles: async (files) => { events.push(files[0].name); },
      downloadFile: () => { events.push('download'); },
    },
  );

  assert.equal(result, 'shared');
  assert.deepEqual(events, ['story.png']);
});

test('falls back to a download when native file sharing is unavailable', async () => {
  const events = [];
  const result = await deliverImageFile(
    { name: 'story.png', type: 'image/png' },
    {
      canShareFiles: () => false,
      shareFiles: async () => { events.push('share'); },
      downloadFile: (file) => { events.push(file.name); },
    },
  );

  assert.equal(result, 'downloaded');
  assert.deepEqual(events, ['story.png']);
});
