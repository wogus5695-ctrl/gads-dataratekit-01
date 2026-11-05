import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PSEO_CANONICAL_ROUTES,
  DOWNLOAD_PAGES,
  UPLOAD_PAGES,
  FILE_TRANSFER_PAGES,
  VIDEO_PAGES,
  DOWNLOAD_SPEED_PAGES,
  NAS_PAGES,
  FILE_TRANSFER_SCENARIOS,
  VIDEO_PROFILE_PAGES,
  getDownloadPageData,
  getDownloadSpeedPageData,
  getUploadPageData,
  getFileTransferPageData,
  getFileTransferScenarioData,
  getNasPageData,
  getVideoPageData,
  getVideoProfilePageData,
} from '../src/data/calculation-pages';
import { INDEXABLE_ROUTES } from '../src/config/site';

test('Programmatic SEO — 34-Page Registry & Route Coverage', async (t) => {
  await t.test('1. Exact 34 programmatic routes exist in master registry', () => {
    assert.equal(PSEO_CANONICAL_ROUTES.length, 34, 'Must have exactly 34 programmatic routes (12 pilot + 22 batch 2)');
    assert.deepEqual(PSEO_CANONICAL_ROUTES, [
      '/download-time/5gb',
      '/download-time/10gb',
      '/download-time/20gb',
      '/download-time/50gb',
      '/download-time/100gb',
      '/download-time/500gb',
      '/download-time/1tb',
      '/download-speed/50mbps',
      '/download-speed/100mbps',
      '/download-speed/300mbps',
      '/download-speed/500mbps',
      '/download-speed/1gbps',
      '/upload-time/10gb',
      '/upload-time/20gb',
      '/upload-time/50gb',
      '/upload-time/100gb',
      '/upload-time/500gb',
      '/upload-time/1tb',
      '/upload-time/2tb',
      '/nas-transfer-time/1gbe',
      '/nas-transfer-time/2-5gbe',
      '/nas-transfer-time/10gbe',
      '/file-transfer-time/100gb',
      '/file-transfer-time/1tb',
      '/file-transfer-time/ssd-to-hdd',
      '/file-transfer-time/ssd-to-ssd',
      '/video-file-size/10-minutes',
      '/video-file-size/1-hour',
      '/video-file-size/720p-per-hour',
      '/video-file-size/1080p-per-hour',
      '/video-file-size/1080p-60fps-per-hour',
      '/video-file-size/1440p-per-hour',
      '/video-file-size/4k-per-hour',
      '/video-file-size/4k-60fps-per-hour',
    ]);
  });

  await t.test('2. Total indexable canonical routes in site.ts is exactly 45', () => {
    assert.equal(INDEXABLE_ROUTES.length, 45, 'Sitemap canonical URLs must total exactly 45 (11 core + 34 pSEO)');
    for (const route of PSEO_CANONICAL_ROUTES) {
      assert.ok((INDEXABLE_ROUTES as readonly string[]).includes(route), `Route ${route} must be included in INDEXABLE_ROUTES`);
    }
  });

  await t.test('3. Download time cluster generates 7 valid scenarios and rejects unknown slugs', () => {
    assert.equal(DOWNLOAD_PAGES.length, 7);
    const validSlugs = ['5gb', '10gb', '20gb', '50gb', '100gb', '500gb', '1tb'];

    for (const slug of validSlugs) {
      const data = getDownloadPageData(slug);
      assert.ok(data !== null, `Expected valid data for ${slug}`);
      assert.ok(data.title.includes(data.sizeFormatted));
      assert.ok(data.h1.includes(data.sizeFormatted));
      assert.ok(data.directAnswerSummary.length > 50);
      assert.equal(data.comparisonRows.length, 8, 'Should have 8 comparison broadband speeds');
      assert.equal(data.requiredSpeedRows.length, 5, 'Should have 5 target deadlines');
      assert.ok(data.calculatorQuery.startsWith('?mode=time&size='));
    }

    // Rejection of unknown parameters
    assert.equal(getDownloadPageData('25gb'), null);
    assert.equal(getDownloadPageData('random-string'), null);
    assert.equal(getDownloadPageData(''), null);
  });

  await t.test('4. Download speed cluster generates 5 valid scenarios and rejects unknown speeds', () => {
    assert.equal(DOWNLOAD_SPEED_PAGES.length, 5);
    const validSpeeds = ['50mbps', '100mbps', '300mbps', '500mbps', '1gbps'];

    for (const slug of validSpeeds) {
      const data = getDownloadSpeedPageData(slug);
      assert.ok(data !== null, `Expected valid data for ${slug}`);
      assert.ok(data.title.includes(data.speedFormatted));
      assert.ok(data.h1.includes(data.speedFormatted));
      assert.ok(data.directAnswerSummary.length > 50);
      assert.equal(data.fileSizeRows.length, 8, 'Should have 8 common download payload sizes');
      assert.equal(data.timeWindowRows.length, 4, 'Should have 4 time-window capacity entries');
      assert.ok(data.calculatorQuery.startsWith('?mode=time&speed='));
    }

    // Rejection of unknown parameters
    assert.equal(getDownloadSpeedPageData('77mbps'), null);
    assert.equal(getDownloadSpeedPageData('2gbps'), null);
  });

  await t.test('5. Upload time cluster generates 7 valid scenarios and rejects unknown slugs', () => {
    assert.equal(UPLOAD_PAGES.length, 7);
    const validSlugs = ['10gb', '20gb', '50gb', '100gb', '500gb', '1tb', '2tb'];

    for (const slug of validSlugs) {
      const data = getUploadPageData(slug);
      assert.ok(data !== null, `Expected valid data for ${slug}`);
      assert.ok(data.title.includes(data.sizeFormatted));
      assert.ok(data.h1.includes(data.sizeFormatted));
      assert.ok(data.directAnswerSummary.length > 50);
      assert.equal(data.comparisonRows.length, 8, 'Should have 8 upstream speed comparison tiers');
      assert.equal(data.requiredSpeedRows.length, 6, 'Should have 6 target deadlines');
      assert.ok(data.calculatorQuery.startsWith('?mode=time&size='));
    }

    // Rejection of unknown parameters
    assert.equal(getUploadPageData('500mb'), null);
    assert.equal(getUploadPageData('test'), null);
  });

  await t.test('6. NAS transfer cluster generates 3 valid interfaces and rejects unknown speeds', () => {
    assert.equal(NAS_PAGES.length, 3);
    const validSpeeds = ['1gbe', '2-5gbe', '10gbe'];

    for (const slug of validSpeeds) {
      const data = getNasPageData(slug);
      assert.ok(data !== null, `Expected valid data for ${slug}`);
      assert.ok(data.title.includes(data.displaySpeed));
      assert.ok(data.h1.includes(data.displaySpeed));
      assert.ok(!data.title.includes('1GBE') && !data.title.includes('2.5GBE') && !data.title.includes('10GBE'));
      assert.ok(data.directAnswerSummary.length > 50);
      assert.equal(data.sizeRows.length, 4, 'Should have 4 transfer payload sizes');
      assert.equal(data.storageBottleneckWarnings.length, 3, 'Should have 3 storage bottleneck warnings');
      assert.ok(data.calculatorQuery.includes('eff=85'));
    }

    // Rejection of unknown parameters
    assert.equal(getNasPageData('5gbe'), null);
    assert.equal(getNasPageData('40gbe'), null);
  });

  await t.test('7. File transfer scenarios generate valid data and reject unapproved slugs', () => {
    assert.equal(FILE_TRANSFER_SCENARIOS.length, 2);
    for (const slug of FILE_TRANSFER_SCENARIOS) {
      const data = getFileTransferScenarioData(slug);
      assert.ok(data !== null, `Expected valid data for ${slug}`);
      assert.ok(data.title.includes(data.scenarioType === 'ssd-to-hdd' ? 'SSD to HDD' : 'SSD to SSD'));
      assert.ok(data.h1.includes(data.scenarioType === 'ssd-to-hdd' ? 'SSD to HDD' : 'SSD to SSD'));
      assert.equal(data.hardwareRows.length, 3, 'Should have 3 hardware pipelines');
      assert.equal(data.sizeRows.length, 4, 'Should have 4 size rows');
      assert.ok(data.calculatorQuery.startsWith('?mode=time&size='));
    }

    // Rejection of unknown scenarios
    assert.equal(getFileTransferScenarioData('nvme-to-cloud'), null);
    assert.equal(getFileTransferScenarioData('100gb'), null); // Handled by size data
  });

  await t.test('8. Video profile cluster generates 6 valid profiles with 4K range handling', () => {
    assert.equal(VIDEO_PROFILE_PAGES.length, 6);
    const validSlugs = [
      '720p-per-hour',
      '1080p-per-hour',
      '1080p-60fps-per-hour',
      '1440p-per-hour',
      '4k-per-hour',
      '4k-60fps-per-hour',
    ];

    for (const slug of validSlugs) {
      const data = getVideoProfilePageData(slug);
      assert.ok(data !== null, `Expected valid data for ${slug}`);
      assert.ok(data.title.includes(data.profileName.split(' ')[0]));
      assert.ok(data.h1.includes(data.profileName.split(' ')[0]));
      assert.equal(data.durationRows.length, 4, 'Should have 4 duration rows');
      assert.equal(data.storageCapacityRows.length, 4, 'Should have 4 storage card rows');
      assert.ok(data.calculatorQuery.startsWith('?mode=find-size&video='));
      assert.ok(data.referenceDisclaimer.includes('Reference Profile Notice'));

      // Check 4K range handling
      if (slug === '4k-per-hour' || slug === '4k-60fps-per-hour') {
        assert.equal(data.isRange, true, `${slug} must be marked as range`);
        assert.ok(data.upperVideoBitrateMbps, `${slug} must have upper video bitrate`);
        assert.ok(data.durationRows[0].upperFileSize, `${slug} must calculate upper file size`);
      } else {
        assert.equal(data.isRange, false, `${slug} should not be marked as range`);
      }
    }

    // Rejection of unknown parameters
    assert.equal(getVideoProfilePageData('8k-per-hour'), null);
    assert.equal(getVideoProfilePageData('360p-per-hour'), null);
  });

  await t.test('9. Page-level titles do not contain duplicate DataRateKit branding suffix', () => {
    const allTitles = [
      ...DOWNLOAD_PAGES.map((p) => p.title),
      ...DOWNLOAD_SPEED_PAGES.map((p) => p.title),
      ...UPLOAD_PAGES.map((p) => p.title),
      ...FILE_TRANSFER_PAGES.map((p) => p.title),
      ...FILE_TRANSFER_SCENARIOS.map((s) => getFileTransferScenarioData(s)!.title),
      ...NAS_PAGES.map((p) => p.title),
      ...VIDEO_PAGES.map((p) => p.title),
      ...VIDEO_PROFILE_PAGES.map((p) => p.title),
    ];
    assert.equal(allTitles.length, 34);
    for (const title of allTitles) {
      assert.ok(
        !title.includes('DataRateKit'),
        `Page title "${title}" should not contain 'DataRateKit' (root layout template appends it)`
      );
    }
  });
});
