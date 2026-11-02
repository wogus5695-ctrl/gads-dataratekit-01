import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateVideoFileSize,
  calculateRequiredVideoBitrate,
  calculateMaximumDuration,
  bitrateToBps,
  bpsToBitrate,
  parseDurationToSeconds,
} from '../src/lib/video/calculations';
import {
  parseVideoCalculatorState,
  serializeVideoCalculatorState,
  DEFAULT_VIDEO_STATE,
} from '../src/lib/video/url-state';

describe('Video File Size & Bitrate Calculator Engine', () => {
  // Test 1: File size calculation
  it('calculates file size correctly for 20 Mbps video + 320 kbps audio over 1 hour', () => {
    // 20 Mbps = 20,000,000 bps
    // 320 kbps = 320,000 bps
    // Total = 20,320,000 bps
    // 1 hour = 3600s
    // Total bits = 73,152,000,000 bits
    // Total bytes = 9,144,000,000 bytes = exactly 9.144 GB (decimal)
    const res = calculateVideoFileSize({
      videoBitrate: 20,
      videoBitrateUnit: 'Mbps',
      audioBitrate: 320,
      audioBitrateUnit: 'kbps',
      durationSeconds: 3600,
      targetSizeUnit: 'GB',
    });

    assert.strictEqual(res.success, true);
    if (!res.success) return;

    assert.strictEqual(res.data.totalBitrateBps, 20_320_000);
    assert.strictEqual(res.data.fileSizeBytes, 9_144_000_000);
    assert.strictEqual(res.data.fileSizeValue, 9.144);
    assert.strictEqual(res.data.fileSizeUnit, 'GB');
    assert.strictEqual(res.data.fileSizeFormatted, '9.144 GB');
    // MB per minute: 9,144,000,000 / 60 / 1,000,000 = 152.4 MB/min
    assert.strictEqual(res.data.mbPerMinute, 152.4);
    // GB per hour: 9.144 GB/hr
    assert.strictEqual(res.data.gbPerHour, 9.144);
  });

  // Test 2: Required video bitrate
  it('calculates required video bitrate correctly for 10 GB in 1 hour with 320 kbps audio', () => {
    // 10 GB = 10,000,000,000 bytes = 80,000,000,000 bits
    // 1 hour = 3600s
    // Total target bitrate = 80,000,000,000 / 3600 = 22,222,222.222... bps
    // Audio bitrate = 320,000 bps
    // Required video bitrate = 22,222,222.222... - 320,000 = 21,902,222.222... bps
    // In Mbps: ~21.902 Mbps
    const res = calculateRequiredVideoBitrate({
      targetFileSize: 10,
      targetFileSizeUnit: 'GB',
      durationSeconds: 3600,
      audioBitrate: 320,
      audioBitrateUnit: 'kbps',
      targetBitrateUnit: 'Mbps',
    });

    assert.strictEqual(res.success, true);
    if (!res.success) return;

    assert.ok(Math.abs(res.data.requiredVideoBitrateValue - 21.902222) < 0.001);
    assert.strictEqual(res.data.requiredVideoBitrateUnit, 'Mbps');
  });

  // Test 3: Maximum duration
  it('calculates maximum recording duration correctly for 64 GB storage at 20.32 Mbps total bitrate', () => {
    // 64 GB = 64,000,000,000 bytes = 512,000,000,000 bits
    // Total bitrate = 20,320,000 bps
    // Duration = 512,000,000,000 / 20,320,000 = 25,196.85 seconds
    // 25,196.85 seconds = 6 hours 59 minutes 57 seconds
    const res = calculateMaximumDuration({
      availableStorage: 64,
      availableStorageUnit: 'GB',
      videoBitrate: 20,
      videoBitrateUnit: 'Mbps',
      audioBitrate: 320,
      audioBitrateUnit: 'kbps',
    });

    assert.strictEqual(res.success, true);
    if (!res.success) return;

    assert.ok(Math.abs(res.data.durationSeconds - 25196.85) < 0.1);
    assert.strictEqual(res.data.duration.hours, 6);
    assert.strictEqual(res.data.duration.minutes, 59);
    assert.strictEqual(res.data.duration.seconds, 57);
  });

  // Test 3b: Specific Worked Example for 128 GB / 100 Mbps / 256 kbps
  it('calculates maximum duration accurately for 128 GB storage at 100 Mbps video + 256 kbps audio', () => {
    // 128 GB = 128,000,000,000 bytes = 1,024,000,000,000 bits
    // 100 Mbps = 100,000,000 bps
    // 256 kbps = 256,000 bps
    // Combined = 100,256,000 bps
    // Duration = 1,024,000,000,000 / 100,256,000 = 10,213.8525... seconds
    // Math.round(10213.8525) = 10214 seconds
    // 10214 / 3600 = 2 hours (7200s), rem 3014
    // 3014 / 60 = 50 minutes (3000s), rem 14 seconds
    // -> 2 hours 50 minutes 14 seconds (short: 2h 50m 14s)
    const res = calculateMaximumDuration({
      availableStorage: 128,
      availableStorageUnit: 'GB',
      videoBitrate: 100,
      videoBitrateUnit: 'Mbps',
      audioBitrate: 256,
      audioBitrateUnit: 'kbps',
    });

    assert.strictEqual(res.success, true);
    if (!res.success) return;

    assert.ok(Math.abs(res.data.durationSeconds - 10213.8525) < 0.01);
    assert.strictEqual(res.data.duration.hours, 2);
    assert.strictEqual(res.data.duration.minutes, 50);
    assert.strictEqual(res.data.duration.seconds, 14);
    assert.strictEqual(res.data.duration.formatted, '2 hours 50 minutes 14 seconds');
    assert.strictEqual(res.data.duration.formattedShort, '2h 50m 14s');
  });

  // Test 4: Audio bitrate subtraction
  it('deducts audio bitrate properly so higher audio bitrate leaves less for video', () => {
    const res128 = calculateRequiredVideoBitrate({
      targetFileSize: 1,
      targetFileSizeUnit: 'GB',
      durationSeconds: 1800, // 30 mins
      audioBitrate: 128,
      audioBitrateUnit: 'kbps',
      targetBitrateUnit: 'kbps',
    });

    const res320 = calculateRequiredVideoBitrate({
      targetFileSize: 1,
      targetFileSizeUnit: 'GB',
      durationSeconds: 1800,
      audioBitrate: 320,
      audioBitrateUnit: 'kbps',
      targetBitrateUnit: 'kbps',
    });

    assert.strictEqual(res128.success, true);
    assert.strictEqual(res320.success, true);
    if (!res128.success || !res320.success) return;

    // Difference between video bitrates should be exactly 320 - 128 = 192 kbps
    const diff = res128.data.requiredVideoBitrateValue - res320.data.requiredVideoBitrateValue;
    assert.ok(Math.abs(diff - 192) < 0.001);
  });

  // Test 5: kbps <-> Mbps conversion
  it('converts between kbps, Mbps, and Gbps accurately', () => {
    assert.strictEqual(bitrateToBps(1000, 'kbps'), 1_000_000);
    assert.strictEqual(bitrateToBps(1, 'Mbps'), 1_000_000);
    assert.strictEqual(bitrateToBps(1, 'Gbps'), 1_000_000_000);

    assert.strictEqual(bpsToBitrate(1_000_000, 'Mbps'), 1);
    assert.strictEqual(bpsToBitrate(1_000_000, 'kbps'), 1000);
    assert.strictEqual(bpsToBitrate(1_000_000_000, 'Gbps'), 1);
  });

  // Test 6: Decimal file-size unit conversion
  it('supports decimal file size units (MB, GB, TB)', () => {
    const resMB = calculateVideoFileSize({
      videoBitrate: 8,
      videoBitrateUnit: 'Mbps',
      audioBitrate: 0,
      audioBitrateUnit: 'kbps',
      durationSeconds: 100, // 800 Mbits = 100 MB
      targetSizeUnit: 'MB',
    });
    assert.strictEqual(resMB.success, true);
    if (!resMB.success) return;
    assert.strictEqual(resMB.data.fileSizeValue, 100);

    const resTB = calculateVideoFileSize({
      videoBitrate: 8000,
      videoBitrateUnit: 'Mbps',
      audioBitrate: 0,
      audioBitrateUnit: 'kbps',
      durationSeconds: 1000, // 8,000,000 Mbits = 1 TB
      targetSizeUnit: 'TB',
    });
    assert.strictEqual(resTB.success, true);
    if (!resTB.success) return;
    assert.strictEqual(resTB.data.fileSizeValue, 1);
  });

  // Test 7: Binary file-size unit conversion (MiB, GiB, TiB)
  it('supports binary IEC file size units (MiB, GiB, TiB) and compares accurately against decimal units', () => {
    // 9,144,000,000 bytes
    // in MiB: 9,144,000,000 / 1,048,576 ≈ 8720.366 MiB
    // in GiB: 9,144,000,000 / 1,073,741,824 ≈ 8.51598 GiB
    // in TiB: 9,144,000,000 / 1,099,511,627,776 ≈ 0.008316 TiB
    const resGiB = calculateVideoFileSize({
      videoBitrate: 20,
      videoBitrateUnit: 'Mbps',
      audioBitrate: 320,
      audioBitrateUnit: 'kbps',
      durationSeconds: 3600,
      targetSizeUnit: 'GiB',
    });

    assert.strictEqual(resGiB.success, true);
    if (!resGiB.success) return;
    assert.ok(Math.abs(resGiB.data.fileSizeValue - 8.51598) < 0.001);
    assert.strictEqual(resGiB.data.fileSizeUnit, 'GiB');

    const resMiB = calculateVideoFileSize({
      videoBitrate: 20,
      videoBitrateUnit: 'Mbps',
      audioBitrate: 320,
      audioBitrateUnit: 'kbps',
      durationSeconds: 3600,
      targetSizeUnit: 'MiB',
    });
    assert.strictEqual(resMiB.success, true);
    if (!resMiB.success) return;
    // 9,144,000,000 / 1,048,576 = 8720.3979... MiB
    assert.ok(Math.abs(resMiB.data.fileSizeValue - 8720.398) < 0.01);
    assert.strictEqual(resMiB.data.fileSizeUnit, 'MiB');

    const resTiB = calculateVideoFileSize({
      videoBitrate: 20,
      videoBitrateUnit: 'Mbps',
      audioBitrate: 320,
      audioBitrateUnit: 'kbps',
      durationSeconds: 3600,
      targetSizeUnit: 'TiB',
    });
    assert.strictEqual(resTiB.success, true);
    if (!resTiB.success) return;
    assert.ok(Math.abs(resTiB.data.fileSizeValue - 0.008316) < 0.0001);
    assert.strictEqual(resTiB.data.fileSizeUnit, 'TiB');
  });

  // Test 8: Zero / negative input validation
  it('rejects negative or invalid duration and bitrate inputs', () => {
    const resNegBitrate = calculateVideoFileSize({
      videoBitrate: -5,
      videoBitrateUnit: 'Mbps',
      audioBitrate: 320,
      audioBitrateUnit: 'kbps',
      durationSeconds: 3600,
    });
    assert.strictEqual(resNegBitrate.success, false);

    const resZeroDuration = calculateVideoFileSize({
      videoBitrate: 20,
      videoBitrateUnit: 'Mbps',
      audioBitrate: 320,
      audioBitrateUnit: 'kbps',
      durationSeconds: 0,
    });
    assert.strictEqual(resZeroDuration.success, false);

    const resNaN = calculateVideoFileSize({
      videoBitrate: 'invalid',
      videoBitrateUnit: 'Mbps',
      audioBitrate: 320,
      audioBitrateUnit: 'kbps',
      durationSeconds: 3600,
    });
    assert.strictEqual(resNaN.success, false);

    // Invalid target file size
    const resNegTarget = calculateRequiredVideoBitrate({
      targetFileSize: -10,
      targetFileSizeUnit: 'GB',
      durationSeconds: 3600,
      audioBitrate: 320,
      audioBitrateUnit: 'kbps',
    });
    assert.strictEqual(resNegTarget.success, false);

    // Invalid available storage
    const resNegStorage = calculateMaximumDuration({
      availableStorage: 0,
      availableStorageUnit: 'GB',
      videoBitrate: 20,
      videoBitrateUnit: 'Mbps',
      audioBitrate: 320,
      audioBitrateUnit: 'kbps',
    });
    assert.strictEqual(resNegStorage.success, false);
  });

  // Test 9: Invalid required bitrate case (audio exceeds target size)
  it('returns a validation error when audio bitrate exceeds the target file capacity', () => {
    // 1 MB over 1 hour = 8,000,000 bits / 3600s = ~2.22 kbps
    // If audio bitrate is 320 kbps, audio alone requires ~144 MB!
    const res = calculateRequiredVideoBitrate({
      targetFileSize: 1,
      targetFileSizeUnit: 'MB',
      durationSeconds: 3600,
      audioBitrate: 320,
      audioBitrateUnit: 'kbps',
      targetBitrateUnit: 'Mbps',
    });

    assert.strictEqual(res.success, false);
    if (res.success) return;
    assert.ok(res.error.includes('Audio bitrate exceeds'));
    assert.strictEqual(res.field, 'audioBitrate');
  });

  // Test 10: Round-trip sanity check
  it('completes a round-trip calculation: Size -> Required Bitrate matches original Bitrate', () => {
    const originalVideoMbps = 25;
    const audioKbps = 256;
    const durationSeconds = 1800; // 30 minutes

    // Step 1: Calculate size
    const sizeRes = calculateVideoFileSize({
      videoBitrate: originalVideoMbps,
      videoBitrateUnit: 'Mbps',
      audioBitrate: audioKbps,
      audioBitrateUnit: 'kbps',
      durationSeconds,
      targetSizeUnit: 'GB',
    });

    assert.strictEqual(sizeRes.success, true);
    if (!sizeRes.success) return;

    // Step 2: Use resulting size to calculate required bitrate
    const bitrateRes = calculateRequiredVideoBitrate({
      targetFileSize: sizeRes.data.fileSizeValue,
      targetFileSizeUnit: 'GB',
      durationSeconds,
      audioBitrate: audioKbps,
      audioBitrateUnit: 'kbps',
      targetBitrateUnit: 'Mbps',
    });

    assert.strictEqual(bitrateRes.success, true);
    if (!bitrateRes.success) return;

    // The required video bitrate should match original within floating point tolerance
    assert.ok(Math.abs(bitrateRes.data.requiredVideoBitrateValue - originalVideoMbps) < 0.0001);
  });

  // Test 11: Duration parser helper
  it('parses hours, minutes, seconds into total seconds safely', () => {
    const p1 = parseDurationToSeconds(1, 30, 0);
    assert.strictEqual(p1.isValid, true);
    assert.strictEqual(p1.totalSeconds, 5400);

    const pZero = parseDurationToSeconds(0, 0, 0);
    assert.strictEqual(pZero.isValid, false);

    const pNeg = parseDurationToSeconds(-1, 0, 0);
    assert.strictEqual(pNeg.isValid, false);
  });

  // Test 12: URL State serialization & deserialization
  it('serializes and deserializes video state cleanly', () => {
    const serialized = serializeVideoCalculatorState({
      mode: 'find-size',
      videoBitrate: 50,
      videoBitrateUnit: 'Mbps',
      audioBitrate: 192,
      audioBitrateUnit: 'kbps',
      hours: 2,
      minutes: 15,
      seconds: 30,
      outputSizeUnit: 'GB',
    });

    const params = new URLSearchParams(serialized);
    const parsed = parseVideoCalculatorState(params);

    assert.strictEqual(parsed.mode, 'find-size');
    assert.strictEqual(parsed.videoBitrate, 50);
    assert.strictEqual(parsed.videoBitrateUnit, 'Mbps');
    assert.strictEqual(parsed.audioBitrate, 192);
    assert.strictEqual(parsed.audioBitrateUnit, 'kbps');
    assert.strictEqual(parsed.hours, 2);
    assert.strictEqual(parsed.minutes, 15);
    assert.strictEqual(parsed.seconds, 30);
  });
});
