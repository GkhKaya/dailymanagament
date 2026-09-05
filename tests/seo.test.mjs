import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getBaseUrl, buildAlternateLanguages, getFaqItems, getWebsiteAndSoftwareJsonLd, getBreadcrumbJsonLd } from '../src/lib/seo-helpers.ts';

test('1. SEO helpers - URL and Alternates resolution', () => {
  const baseUrl = getBaseUrl();
  assert.ok(baseUrl.startsWith('http'), 'Base URL must start with http or https');
  assert.equal(baseUrl.endsWith('/'), false, 'Base URL must not end with trailing slash');

  const homeAlternates = buildAlternateLanguages('/');
  assert.equal(homeAlternates.canonical, `${baseUrl}/`);
  assert.equal(homeAlternates.languages['tr-TR'], `${baseUrl}/?lang=tr`);
  assert.equal(homeAlternates.languages['en-US'], `${baseUrl}/?lang=en`);
  assert.equal(homeAlternates.languages['x-default'], `${baseUrl}/`);

  const registerAlternates = buildAlternateLanguages('/register');
  assert.equal(registerAlternates.canonical, `${baseUrl}/register`);
  assert.equal(registerAlternates.languages['tr-TR'], `${baseUrl}/register?lang=tr`);
  assert.equal(registerAlternates.languages['en-US'], `${baseUrl}/register?lang=en`);
  assert.equal(registerAlternates.languages['x-default'], `${baseUrl}/register`);
});

test('2. Schema.org JSON-LD generation (WebSite, WebApplication, Organization, FAQPage)', () => {
  // Turkish schemas
  const trSchemas = getWebsiteAndSoftwareJsonLd('tr');
  assert.equal(Array.isArray(trSchemas), true);
  assert.equal(trSchemas.length, 4);

  const [trWebSite, trSoftware, trOrg, trFaq] = trSchemas;
  assert.equal(trWebSite['@type'], 'WebSite');
  assert.equal(trWebSite.name, 'DailyM');
  assert.ok(trWebSite.inLanguage.includes('tr-TR'));

  assert.equal(trSoftware['@type'], 'WebApplication');
  assert.equal(trSoftware.applicationCategory, 'HealthApplication, FinanceApplication');
  assert.ok(trSoftware.featureList.length >= 4);

  assert.equal(trOrg['@type'], 'Organization');
  assert.equal(trOrg.name, 'DailyM');

  assert.equal(trFaq['@type'], 'FAQPage');
  assert.ok(trFaq.mainEntity.length >= 5);
  assert.ok(trFaq.mainEntity[0].name.includes('DailyM'));

  // English schemas
  const enSchemas = getWebsiteAndSoftwareJsonLd('en');
  const [enWebSite, enSoftware, , enFaq] = enSchemas;
  assert.ok(enWebSite.description.includes('Smart Personal Management'));
  assert.ok(enSoftware.description.includes('calorie tracking'));
  assert.equal(enFaq.mainEntity[0].name, 'What is DailyM and how does it work?');
});

test('3. Schema.org BreadcrumbList generation', () => {
  const breadcrumbs = getBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Register', url: '/register' },
  ]);

  assert.equal(breadcrumbs['@type'], 'BreadcrumbList');
  assert.equal(breadcrumbs.itemListElement.length, 2);
  assert.equal(breadcrumbs.itemListElement[0].position, 1);
  assert.equal(breadcrumbs.itemListElement[0].name, 'Home');
  assert.equal(breadcrumbs.itemListElement[1].position, 2);
  assert.equal(breadcrumbs.itemListElement[1].name, 'Register');
});

test('4. Robots.ts and Sitemap.ts file integrity', () => {
  const robotsContent = fs.readFileSync(path.resolve('src/app/robots.ts'), 'utf8');
  assert.ok(robotsContent.includes("userAgent: '*'"));
  assert.ok(robotsContent.includes("disallow: ["));
  assert.ok(robotsContent.includes("'/dashboard'"));
  assert.ok(robotsContent.includes("'/profile'"));
  assert.ok(robotsContent.includes("'/api/'"));
  assert.ok(robotsContent.includes("sitemap:"));

  const sitemapContent = fs.readFileSync(path.resolve('src/app/sitemap.ts'), 'utf8');
  assert.ok(sitemapContent.includes("url: `${baseUrl}/`"));
  assert.ok(sitemapContent.includes("url: `${baseUrl}/register`"));
  assert.ok(sitemapContent.includes("url: `${baseUrl}/forgot-password`"));
  assert.ok(sitemapContent.includes("'tr-TR':"));
  assert.ok(sitemapContent.includes("'en-US':"));
});
