import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateTransferTime,
  calculateRequiredSpeed,
  calculateTransferableSize,
  convertSpeed,
  mbpsToMBs,
  mbsToMbps,
  fileSizeToBytes,
  bytesToFileSize,
  formatDuration,
  formatNumber,
  parseCalculatorState,
  serializeCalculatorState,
} from '../src/lib/transfer/index';
import {
  parseConverterState,
  serializeConverterState,
} from '../src/components/converter/converter-url-state';

describe('Global Data Transfer Utility - Calculation Core', () => {
  describe('Required Test Cases (A - F)', () => {
    it('Test A: 100 GB at 100 Mbps -> 8,000 seconds = 2h 13m 20s', () => {
      const result = calculateTransferTime({
        fileSize: 100,
        fileSizeUnit: 'GB',
        speed: 100,
        speedUnit: 'Mbps',
        efficiencyPercent: 100,
      });

      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.seconds, 8000);
        assert.strictEqual(result.data.duration.hours, 2);
        assert.strictEqual(result.data.duration.minutes, 13);
        assert.strictEqual(result.data.duration.seconds, 20);
        assert.strictEqual(result.data.duration.formatted, '2 hours 13 minutes 20 seconds');
        assert.strictEqual(result.data.duration.formattedShort, '2h 13m 20s');
      }
    });

    it('Test B: 1 GB at 1 Gbps -> 8 seconds (Decimal)', () => {
      const result = calculateTransferTime({
        fileSize: 1,
        fileSizeUnit: 'GB',
        speed: 1,
        speedUnit: 'Gbps',
        efficiencyPercent: 100,
      });

      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.seconds, 8);
        assert.strictEqual(result.data.duration.formatted, '8 seconds');
        assert.strictEqual(result.data.duration.formattedShort, '8s');
      }
    });

    it('Test C: 100 Mbps -> 12.5 MB/s', () => {
      const direct = mbpsToMBs(100);
      assert.strictEqual(direct, 12.5);

      const converted = convertSpeed(100, 'Mbps', 'MB/s');
      assert.strictEqual(converted.success, true);
      if (converted.success) {
        assert.strictEqual(converted.data.toValue, 12.5);
        assert.strictEqual(converted.data.formatted, '12.5 MB/s');
      }
    });

    it('Test D: 12.5 MB/s -> 100 Mbps', () => {
      const direct = mbsToMbps(12.5);
      assert.strictEqual(direct, 100);

      const converted = convertSpeed(12.5, 'MB/s', 'Mbps');
      assert.strictEqual(converted.success, true);
      if (converted.success) {
        assert.strictEqual(converted.data.toValue, 100);
        assert.strictEqual(converted.data.formatted, '100 Mbps');
      }
    });

    it('Test E: 100 GB, Desired time: 2 hours -> ~111.111 Mbps theoretical', () => {
      const durationSeconds = 2 * 3600; // 7,200 seconds
      const result = calculateRequiredSpeed({
        fileSize: 100,
        fileSizeUnit: 'GB',
        durationSeconds,
        targetSpeedUnit: 'Mbps',
        efficiencyPercent: 100,
      });

      assert.strictEqual(result.success, true);
      if (result.success) {
        const expectedSpeed = (800_000_000_000 / 7200) / 1_000_000; // ~111.111111 Mbps
        assert.ok(Math.abs(result.data.value - expectedSpeed) < 1e-6);
        assert.strictEqual(result.data.formatted, '111.111 Mbps');
      }
    });

    it('Test F: 100 Mbps, 2 hours -> 90 GB theoretical decimal', () => {
      const durationSeconds = 2 * 3600; // 7,200 seconds
      const result = calculateTransferableSize({
        speed: 100,
        speedUnit: 'Mbps',
        durationSeconds,
        targetSizeUnit: 'GB',
        efficiencyPercent: 100,
      });

      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.value, 90);
        assert.strictEqual(result.data.formatted, '90 GB');
      }
    });
  });

  describe('Upload Tool Functional Test Cases (U1 - U5)', () => {
    it('Test U1: 100 GB at 20 Mbps (100%) -> 40,000s = 11h 6m 40s', () => {
      const result = calculateTransferTime({
        fileSize: 100,
        fileSizeUnit: 'GB',
        speed: 20,
        speedUnit: 'Mbps',
        efficiencyPercent: 100,
      });

      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.seconds, 40000);
        assert.strictEqual(result.data.duration.hours, 11);
        assert.strictEqual(result.data.duration.minutes, 6);
        assert.strictEqual(result.data.duration.seconds, 40);
        assert.strictEqual(result.data.duration.formatted, '11 hours 6 minutes 40 seconds');
      }
    });

    it('Test U2: 100 GB at 20 Mbps (90%) -> ~44,444.44s = 12h 20m 44s', () => {
      const result = calculateTransferTime({
        fileSize: 100,
        fileSizeUnit: 'GB',
        speed: 20,
        speedUnit: 'Mbps',
        efficiencyPercent: 90,
      });

      assert.strictEqual(result.success, true);
      if (result.success) {
        const expectedSeconds = 800_000_000_000 / (20_000_000 * 0.9);
        assert.ok(Math.abs(result.data.seconds - expectedSeconds) < 1e-6);
        assert.strictEqual(result.data.duration.hours, 12);
        assert.strictEqual(result.data.duration.minutes, 20);
        assert.strictEqual(result.data.duration.seconds, 44);
        assert.strictEqual(result.data.duration.formatted, '12 hours 20 minutes 44 seconds');
      }
    });

    it('Test U3: 100 GB, Desired time: 2 hours -> ~111.111 Mbps at 100%', () => {
      const result = calculateRequiredSpeed({
        fileSize: 100,
        fileSizeUnit: 'GB',
        durationSeconds: 7200,
        targetSpeedUnit: 'Mbps',
        efficiencyPercent: 100,
      });

      assert.strictEqual(result.success, true);
      if (result.success) {
        const expectedSpeed = (800_000_000_000 / 7200) / 1_000_000;
        assert.ok(Math.abs(result.data.value - expectedSpeed) < 1e-6);
        assert.strictEqual(result.data.formatted, '111.111 Mbps');
      }
    });

    it('Test U4: 20 Mbps, 2 hours -> 18 GB uploadable size at 100%', () => {
      const result = calculateTransferableSize({
        speed: 20,
        speedUnit: 'Mbps',
        durationSeconds: 7200,
        targetSizeUnit: 'GB',
        efficiencyPercent: 100,
      });

      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.value, 18);
        assert.strictEqual(result.data.formatted, '18 GB');
      }
    });

    it('Test U5: 20 Mbps, 2 hours, 90% -> 16.2 GB uploadable size', () => {
      const result = calculateTransferableSize({
        speed: 20,
        speedUnit: 'Mbps',
        durationSeconds: 7200,
        targetSizeUnit: 'GB',
        efficiencyPercent: 90,
      });

      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.value, 16.2);
        assert.strictEqual(result.data.formatted, '16.2 GB');
      }
    });
  });

  describe('Decimal vs Binary Unit Rules', () => {
    it('distinguishes GB (1,000,000,000 bytes) and GiB (1,073,741,824 bytes)', () => {
      const gbBytes = fileSizeToBytes(1, 'GB');
      const gibBytes = fileSizeToBytes(1, 'GiB');

      assert.strictEqual(gbBytes, 1_000_000_000);
      assert.strictEqual(gibBytes, 1_073_741_824);
      assert.notStrictEqual(gbBytes, gibBytes);
    });

    it('distinguishes TB and TiB', () => {
      const tbBytes = fileSizeToBytes(1, 'TB');
      const tibBytes = fileSizeToBytes(1, 'TiB');

      assert.strictEqual(tbBytes, 1_000_000_000_000);
      assert.strictEqual(tibBytes, 1_099_511_627_776);
    });
  });

  describe('Real-World Efficiency Overhead', () => {
    it('calculates 90% efficiency correctly for 100 Mbps', () => {
      const result = calculateTransferTime({
        fileSize: 100,
        fileSizeUnit: 'GB',
        speed: 100,
        speedUnit: 'Mbps',
        efficiencyPercent: 90,
      });

      assert.strictEqual(result.success, true);
      if (result.success) {
        // Effective speed is 90 Mbps = 90,000,000 bps
        // 800,000,000,000 / 90,000,000 = 8,888.888... seconds
        assert.strictEqual(result.data.effectiveSpeedBps, 90_000_000);
        const expectedSeconds = 800_000_000_000 / 90_000_000;
        assert.ok(Math.abs(result.data.seconds - expectedSeconds) < 1e-6);
        assert.strictEqual(result.data.duration.hours, 2);
        assert.strictEqual(result.data.duration.minutes, 28);
        assert.strictEqual(result.data.duration.seconds, 9);
      }
    });
  });

  describe('Formatting & Pluralization', () => {
    it('formats singular and plural units accurately', () => {
      assert.strictEqual(formatDuration(59).formatted, '59 seconds');
      assert.strictEqual(formatDuration(90).formatted, '1 minute 30 seconds');
      assert.strictEqual(formatDuration(3661).formatted, '1 hour 1 minute 1 second');
      assert.strictEqual(formatDuration(100_000).formatted, '1 day 3 hours 46 minutes 40 seconds');
    });

    it('formats float numbers cleanly without floating point inaccuracies', () => {
      assert.strictEqual(formatNumber(12.4999999997, 2), '12.5');
      assert.strictEqual(formatNumber(12.5), '12.5');
      assert.strictEqual(formatNumber(1000), '1,000');
    });
  });

  describe('Input Validation & Resilience', () => {
    it('handles negative, zero, NaN, empty strings gracefully without crashing', () => {
      const negativeResult = calculateTransferTime({
        fileSize: -50,
        fileSizeUnit: 'GB',
        speed: 100,
        speedUnit: 'Mbps',
      });
      assert.strictEqual(negativeResult.success, false);

      const nanResult = calculateTransferTime({
        fileSize: 'abc',
        fileSizeUnit: 'GB',
        speed: 100,
        speedUnit: 'Mbps',
      });
      assert.strictEqual(nanResult.success, false);

      const zeroResult = calculateTransferTime({
        fileSize: 0,
        fileSizeUnit: 'GB',
        speed: 100,
        speedUnit: 'Mbps',
      });
      assert.strictEqual(zeroResult.success, false);
    });
  });

  describe('URL State Serialization & Deserialization', () => {
    it('restores state from query parameters accurately', () => {
      const parsed = parseCalculatorState(
        new URLSearchParams('size=100&sizeUnit=GB&speed=100&speedUnit=Mbps&efficiency=90')
      );
      assert.strictEqual(parsed.fileSize, 100);
      assert.strictEqual(parsed.fileSizeUnit, 'GB');
      assert.strictEqual(parsed.speed, 100);
      assert.strictEqual(parsed.speedUnit, 'Mbps');
      assert.strictEqual(parsed.efficiencyPercent, 90);
    });

    it('falls back safely when query parameters are corrupted', () => {
      const parsed = parseCalculatorState(
        new URLSearchParams('size=invalid&sizeUnit=XYZ&speed=-10')
      );
      assert.strictEqual(parsed.fileSize, 100); // default
      assert.strictEqual(parsed.fileSizeUnit, 'GB'); // default
      assert.strictEqual(parsed.speed, 100); // default
    });

    it('serializes state to query string cleanly', () => {
      const query = serializeCalculatorState({
        fileSize: 50,
        fileSizeUnit: 'GB',
        speed: 500,
        speedUnit: 'Mbps',
      });
      assert.strictEqual(query, 'size=50&sizeUnit=GB&speed=500&speedUnit=Mbps');
    });
  });

  describe('File Transfer Functional Test Cases (FT1 - FT5)', () => {
    it('Test FT1: 100 GB at 100 MB/s (100%) -> 1,000s = 16m 40s', () => {
      const result = calculateTransferTime({
        fileSize: 100,
        fileSizeUnit: 'GB',
        speed: 100,
        speedUnit: 'MB/s',
        efficiencyPercent: 100,
      });

      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.seconds, 1000);
        assert.strictEqual(result.data.duration.minutes, 16);
        assert.strictEqual(result.data.duration.seconds, 40);
        assert.strictEqual(result.data.duration.formatted, '16 minutes 40 seconds');
      }
    });

    it('Test FT2: 100 GB at 100 MB/s (90%) -> ~1,111.111s = 18m 31s', () => {
      const result = calculateTransferTime({
        fileSize: 100,
        fileSizeUnit: 'GB',
        speed: 100,
        speedUnit: 'MB/s',
        efficiencyPercent: 90,
      });

      assert.strictEqual(result.success, true);
      if (result.success) {
        const expectedSeconds = 1000 / 0.9; // 1,111.111...
        assert.ok(Math.abs(result.data.seconds - expectedSeconds) < 0.01);
        assert.strictEqual(result.data.duration.minutes, 18);
        assert.strictEqual(result.data.duration.seconds, 31);
        assert.strictEqual(result.data.duration.formatted, '18 minutes 31 seconds');
      }
    });

    it('Test FT3: 100 GB, Desired time: 10 minutes -> 166.666... MB/s (100%)', () => {
      const durationSeconds = 10 * 60; // 600 seconds
      const result = calculateRequiredSpeed({
        fileSize: 100,
        fileSizeUnit: 'GB',
        durationSeconds,
        targetSpeedUnit: 'MB/s',
        efficiencyPercent: 100,
      });

      assert.strictEqual(result.success, true);
      if (result.success) {
        const expectedSpeed = (100_000_000_000 / 600) / 1_000_000; // 166.666... MB/s
        assert.ok(Math.abs(result.data.value - expectedSpeed) < 1e-6);
        assert.strictEqual(result.data.formatted, '166.667 MB/s');
      }
    });

    it('Test FT4: 100 MB/s, 10 minutes -> 60 GB transferable file size (100%)', () => {
      const durationSeconds = 10 * 60; // 600 seconds
      const result = calculateTransferableSize({
        speed: 100,
        speedUnit: 'MB/s',
        durationSeconds,
        targetSizeUnit: 'GB',
        efficiencyPercent: 100,
      });

      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.value, 60);
        assert.strictEqual(result.data.formatted, '60 GB');
      }
    });

    it('Test FT5: 100 MB/s -> Equivalent 800 Mbps', () => {
      const converted = convertSpeed(100, 'MB/s', 'Mbps');
      assert.strictEqual(converted.success, true);
      if (converted.success) {
        assert.strictEqual(converted.data.toValue, 800);
        assert.strictEqual(converted.data.formatted, '800 Mbps');
      }
    });
  });

  describe('Speed Converter Functional Test Cases (CV1 - CV7)', () => {
    it('Test CV1: 100 Mbps -> 12.5 MB/s', () => {
      const result = convertSpeed(100, 'Mbps', 'MB/s');
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.toValue, 12.5);
        assert.strictEqual(result.data.formatted, '12.5 MB/s');
      }
      assert.strictEqual(mbpsToMBs(100), 12.5);
    });

    it('Test CV2: 12.5 MB/s -> 100 Mbps', () => {
      const result = convertSpeed(12.5, 'MB/s', 'Mbps');
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.toValue, 100);
        assert.strictEqual(result.data.formatted, '100 Mbps');
      }
      assert.strictEqual(mbsToMbps(12.5), 100);
    });

    it('Test CV3: 1 Mbps -> 0.125 MB/s', () => {
      const result = convertSpeed(1, 'Mbps', 'MB/s');
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.toValue, 0.125);
        assert.strictEqual(result.data.formatted, '0.125 MB/s');
      }
      assert.strictEqual(mbpsToMBs(1), 0.125);
    });

    it('Test CV4: 1 MB/s -> 8 Mbps', () => {
      const result = convertSpeed(1, 'MB/s', 'Mbps');
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.toValue, 8);
        assert.strictEqual(result.data.formatted, '8 Mbps');
      }
      assert.strictEqual(mbsToMbps(1), 8);
    });

    it('Test CV5: 1000 Mbps -> 125 MB/s', () => {
      const result = convertSpeed(1000, 'Mbps', 'MB/s');
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.toValue, 125);
        assert.strictEqual(result.data.formatted, '125 MB/s');
      }
      assert.strictEqual(mbpsToMBs(1000), 125);
    });

    it('Test CV6: 0 Mbps -> 0 MB/s', () => {
      const result = convertSpeed(0, 'Mbps', 'MB/s');
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.toValue, 0);
        assert.strictEqual(result.data.formatted, '0 MB/s');
      }
      assert.strictEqual(mbpsToMBs(0), 0);
    });

    it('Test CV7: negative input -> rejected with validation error', () => {
      const result = convertSpeed(-10, 'Mbps', 'MB/s');
      assert.strictEqual(result.success, false);
      if (!result.success) {
        assert.ok(result.error.toLowerCase().includes('cannot be negative') || result.error.toLowerCase().includes('invalid'));
      }
    });
  });

  describe('Converter URL State Tests', () => {
    it('restores state with value=500&from=mbps', () => {
      const parsed = parseConverterState(new URLSearchParams('value=500&from=mbps'));
      assert.strictEqual(parsed.value, 500);
      assert.strictEqual(parsed.from, 'mbps');
    });

    it('restores state with value=25&from=mbs', () => {
      const parsed = parseConverterState(new URLSearchParams('value=25&from=mbs'));
      assert.strictEqual(parsed.value, 25);
      assert.strictEqual(parsed.from, 'mbs');
    });

    it('falls back safely when value is invalid or malformed', () => {
      const parsed = parseConverterState(new URLSearchParams('value=abc&from=mbps'));
      assert.strictEqual(parsed.value, 100);
      assert.strictEqual(parsed.from, 'mbps');
    });

    it('falls back safely when from parameter is random', () => {
      const parsed = parseConverterState(new URLSearchParams('from=random'));
      assert.strictEqual(parsed.value, 100);
      assert.strictEqual(parsed.from, 'mbps');
    });

    it('serializes converter state cleanly', () => {
      const query = serializeConverterState({ value: 500, from: 'mbps' });
      assert.strictEqual(query, 'value=500&from=mbps');
    });
  });
});

