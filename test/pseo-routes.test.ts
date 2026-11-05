import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PSEO_CANONICAL_ROUTES,
  DOWNLOAD_PAGES,
  UPLOAD_PAGES,
  FILE_TRANSFER_PAGES,
  VIDEO_PAGES,
  getDownloadPageData,
  getUploadPageData,
  getFileTransferPageData,
  getVideoPageData,
} from '../src/data/calculation-pages';
import { INDEXABLE_ROUTES } from '../src/config/site';

test('Programmatic SEO Answer Pilot — Registry & Route Coverage', async (t) => {
  await t.test('1. Exact 12 pilot routes exist in registry', () => {
    assert.equal(PSEO_CANONICAL_ROUTES.length, 12, 'Must have exactly 12 pilot routes');
    assert.deepEqual(PSEO_CANONICAL_ROUTES, [
      '/download-time/10gb',
      '/download-time/50gb',
      '/download-time/100gb',
      '/download-time/1tb',
      '/upload-time/10gb',
      '/upload-time/50gb',
      '/upload-time/100gb',
      '/upload-time/1tb',
      '/file-transfer-time/100gb',
      '/file-transfer-time/1tb',
      '/video-file-size/10-minutes',
      '/video-file-size/1-hour',
    ]);
  });

  await t.test('2. Total indexable canonical routes in site.ts is exactly 23', () => {
    assert.equal(INDEXABLE_ROUTES.length, 23, 'Sitemap canonical URLs must total exactly 23');
    for (const route of PSEO_CANONICAL_ROUTES) {
      assert.ok((INDEXABLE_ROUTES as readonly string[]).includes(route), `Route ${route} must be included in INDEXABLE_ROUTES`);
    }
  });

  await t.test('3. Download time cluster generates 4 valid scenarios and rejects unknown slugs', () => {
    assert.equal(DOWNLOAD_PAGES.length, 4);
    const validSlugs = ['10gb', '50gb', '100gb', '1tb'];

    for (const slug of validSlugs) {
      const data = getDownloadPageData(slug);
      assert.ok(data !== null, `Expected valid data for ${slug}`);
      assert.ok(data.title.includes(data.sizeFormatted));
      assert.ok(data.h1.includes(data.sizeFormatted));
      assert.ok(data.directAnswerSummary.length > 50);
      assert.equal(data.comparisonRows.length, 8, 'Should have 8 comparison broadband speeds');
      assert.equal(data.requiredSpeedRows.length, 5, 'Should have 5 target deadlines');
      assert.equal(data.nearbyPages.length, 3, 'Should link to the other 3 download pages');
      assert.ok(data.calculatorQuery.startsWith('?mode=time&size='));
    }

    // Rejection of unknown parameters
    assert.equal(getDownloadPageData('20gb'), null);
    assert.equal(getDownloadPageData('random-string'), null);
    assert.equal(getDownloadPageData(''), null);
  });

  await t.test('4. Upload time cluster generates 4 valid scenarios and rejects unknown slugs', () => {
    assert.equal(UPLOAD_PAGES.length, 4);
    const validSlugs = ['10gb', '50gb', '100gb', '1tb'];

    for (const slug of validSlugs) {
      const data = getUploadPageData(slug);
      assert.ok(data !== null, `Expected valid data for ${slug}`);
      assert.ok(data.title.includes(data.sizeFormatted));
      assert.ok(data.h1.includes(data.sizeFormatted));
      assert.ok(data.directAnswerSummary.length > 50);
      assert.equal(data.comparisonRows.length, 8, 'Should have 8 upstream speed comparison tiers');
      assert.equal(data.requiredSpeedRows.length, 6, 'Should have 6 target deadlines');
      assert.equal(data.nearbyPages.length, 3, 'Should link to the other 3 upload pages');
      assert.ok(data.calculatorQuery.startsWith('?mode=time&size='));
    }

    // Rejection of unknown parameters
    assert.equal(getUploadPageData('500mb'), null);
    assert.equal(getUploadPageData('test'), null);
  });

  await t.test('5. File transfer time cluster generates 2 valid scenarios and rejects unknown slugs', () => {
    assert.equal(FILE_TRANSFER_PAGES.length, 2);
    const validSlugs = ['100gb', '1tb'];

    for (const slug of validSlugs) {
      const data = getFileTransferPageData(slug);
      assert.ok(data !== null, `Expected valid data for ${slug}`);
      assert.ok(data.title.includes(data.sizeFormatted));
      assert.ok(data.h1.includes(data.sizeFormatted));
      assert.ok(data.directAnswerSummary.length > 50);
      assert.equal(data.scenarios.length, 6, 'Should have 6 real hardware pipeline scenarios');
      assert.equal(data.requiredInterfaceRows.length, 5, 'Should have 5 target deadlines');
      assert.equal(data.nearbyPages.length, 1, 'Should link to the other file transfer page');
      assert.ok(data.calculatorQuery.startsWith('?mode=time&size='));
    }

    // Rejection of unknown parameters
    assert.equal(getFileTransferPageData('10gb'), null);
    assert.equal(getFileTransferPageData('unknown'), null);
  });

  await t.test('6. Video file size cluster generates 2 valid scenarios and rejects unknown slugs', () => {
    assert.equal(VIDEO_PAGES.length, 2);
    const validSlugs = ['10-minutes', '1-hour'];

    for (const slug of validSlugs) {
      const data = getVideoPageData(slug);
      assert.ok(data !== null, `Expected valid data for ${slug}`);
      assert.ok(data.title.includes(data.durationLabel));
      assert.ok(data.h1.includes(data.durationLabel));
      assert.ok(data.directAnswerSummary.length > 50);
      assert.equal(data.bitrateRows.length, 7, 'Should have 7 bitrate tiers from 720p to 4K 100M');
      assert.equal(data.storageBudgetRows.length, 5, 'Should have 5 storage limit targets');
      assert.equal(data.nearbyPages.length, 1, 'Should link to the other video page');
      assert.ok(data.calculatorQuery.startsWith('?mode=find-size&video='));
    }

    // Rejection of unknown parameters
    assert.equal(getVideoPageData('30-minutes'), null);
    assert.equal(getVideoPageData('10-hours'), null);
  });

  await t.test('7. Deterministic calculations check for 100 GB @ 100 Mbps broadband', () => {
    const data100gb = getDownloadPageData('100gb')!;
    const row100mbps = data100gb.comparisonRows.find((r) => r.speedLabel === '100 Mbps');
    assert.ok(row100mbps, 'Must contain 100 Mbps row');
    // 100 GB = 800,000 Mb. At 100 Mbps = 8,000s = 2h 13m 20s.
    // At 90% planning efficiency: 800,000 / 90 = 8,888.88s = 2h 28m 9s.
    assert.equal(row100mbps.theoreticalDuration, '2h 13m 20s');
    assert.equal(row100mbps.planningDuration, '2h 28m 9s');
    assert.equal(row100mbps.effectiveMBs, '11.25 MB/s');
  });

  await t.test('8. Page-level titles do not contain duplicate DataRateKit branding suffix', () => {
    const allPages = [
      ...DOWNLOAD_PAGES,
      ...UPLOAD_PAGES,
      ...FILE_TRANSFER_PAGES,
      ...VIDEO_PAGES,
    ];
    assert.equal(allPages.length, 12);
    for (const page of allPages) {
      assert.ok(
        !page.title.includes('DataRateKit'),
        `Page-level title for ${page.slug} should not contain 'DataRateKit' (root layout template appends it): "${page.title}"`
      );
    }
  });
});
