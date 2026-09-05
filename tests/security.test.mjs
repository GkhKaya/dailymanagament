import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

test('1. next.config.ts enforces security headers and disables production source maps', async () => {
  const content = fs.readFileSync(path.join(rootDir, 'next.config.ts'), 'utf-8');

  // Verify source map protection (DevTools source code access prevention)
  assert.match(content, /productionBrowserSourceMaps:\s*false/);

  // Verify framework hiding
  assert.match(content, /poweredByHeader:\s*false/);

  // Verify compiler console stripping in production
  assert.match(content, /removeConsole:/);

  // Verify essential OWASP security headers
  assert.match(content, /"X-Frame-Options",\s*value:\s*"DENY"/);
  assert.match(content, /"X-Content-Type-Options",\s*value:\s*"nosniff"/);
  assert.match(content, /"Strict-Transport-Security"/);
  assert.match(content, /"Content-Security-Policy",\s*value:\s*"frame-ancestors 'none';"/);
  assert.match(content, /"Permissions-Policy"/);
  assert.match(content, /"Referrer-Policy",\s*value:\s*"strict-origin-when-cross-origin"/);
});

test('2. DevToolsShield component exists and protects against inspect and shortcuts', () => {
  const shieldPath = path.join(rootDir, 'src/components/security/DevToolsShield.tsx');
  assert.ok(fs.existsSync(shieldPath), 'DevToolsShield.tsx must exist');

  const content = fs.readFileSync(shieldPath, 'utf-8');
  assert.match(content, /contextmenu/);
  assert.match(content, /F12/);
  assert.match(content, /Ctrl\+Shift\+I|Cmd\+Option\+I|keyCode === 73/);
  assert.match(content, /Ctrl\+Shift\+J|Cmd\+Option\+J|keyCode === 74/);
  assert.match(content, /Ctrl\+U|Cmd\+Option\+U|keyCode === 85/);
});

test('3. Root layout includes DevToolsShield', () => {
  const layoutContent = fs.readFileSync(path.join(rootDir, 'src/app/layout.tsx'), 'utf-8');
  assert.match(layoutContent, /<DevToolsShield\s*\/>/);
});

test('4. API routes enforce session authentication (anti-scraping / anti-abuse)', () => {
  const ocrContent = fs.readFileSync(path.join(rootDir, 'src/app/api/food/ocr/route.ts'), 'utf-8');
  assert.match(ocrContent, /auth\.api\.getSession/);
  assert.match(ocrContent, /status:\s*401/);

  const photoContent = fs.readFileSync(path.join(rootDir, 'src/app/api/food/analyze-photo/route.ts'), 'utf-8');
  assert.match(photoContent, /auth\.api\.getSession/);
  assert.match(photoContent, /status:\s*401/);

  const geminiContent = fs.readFileSync(path.join(rootDir, 'src/app/api/food/gemini/route.ts'), 'utf-8');
  assert.match(geminiContent, /auth\.api\.getSession/);
  assert.match(geminiContent, /status:\s*401/);

  const manualContent = fs.readFileSync(path.join(rootDir, 'src/app/api/food/manual/route.ts'), 'utf-8');
  assert.match(manualContent, /auth\.api\.getSession/);
  assert.match(manualContent, /status:\s*401/);

  const cronContent = fs.readFileSync(path.join(rootDir, 'src/app/api/cron/prayer-notifications/route.ts'), 'utf-8');
  assert.match(cronContent, /cronSecret/);
  assert.match(cronContent, /!cronSecret/);
});

test('5. Dashboard page requires server-side session authentication', () => {
  const dashboardContent = fs.readFileSync(path.join(rootDir, 'src/app/dashboard/page.tsx'), 'utf-8');
  assert.match(dashboardContent, /auth\.api\.getSession/);
  assert.match(dashboardContent, /redirect\('\/'\)/);
});

test('6. Auth rate limit and password policies are tightened', () => {
  const authContent = fs.readFileSync(path.join(rootDir, 'src/lib/auth.ts'), 'utf-8');
  assert.match(authContent, /max:\s*30/);
  assert.match(authContent, /minPasswordLength:\s*8/);
  assert.match(authContent, /httpOnly:\s*true/);
});

test('7. Translation service sanitizes inputs against ReDoS/NoSQL regex injection', () => {
  const transContent = fs.readFileSync(path.join(rootDir, 'src/lib/translation-service.ts'), 'utf-8');
  assert.match(transContent, /replace\(\/\[\.\*\+\?\^\$\{\}\(\)\|\[\\\]\\\\\]\/g/);
});
