import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateUploadTime,
  calculateRequiredUploadSpeed,
  calculateUploadCapacity,
  parseUploadUrlState,
  serializeUploadUrlState,
  DEFAULT_UPLOAD_STATE,
} from '../src/lib/upload';

describe('Upload Planning Calculation Engine', () => {
  // ==========================================
  // MODE A — Upload Time
  // ==========================================
  describe('Mode A: Upload Time Calculations', () => {
    it('1. calculates basic upload duration accurately with 100% factor default (10 GB at 20 Mbps)', () => {
      // 10 GB = 10,000,000,000 bytes = 80,000,000,000 bits
      // 20 Mbps = 20,000,000 bps
      // 80,000,000,000 / 20,000,000 = 4,000 seconds = 1h 6m 40s
      const res = calculateUploadTime({
        fileSize: 10,
        fileSizeUnit: 'GB',
        speed: 20,
        speedUnit: 'Mbps',
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.strictEqual(res.data.totalSeconds, 4000);
        assert.strictEqual(res.data.formattedDuration, '1 hour 6 minutes 40 seconds');
        assert.strictEqual(res.data.formattedDurationShort, '1h 6m 40s');
        assert.strictEqual(res.data.payloadSeconds, 4000);
        assert.strictEqual(res.data.overheadSeconds, 0);
      }
    });

    it('2. adjusts duration based on efficiency (10 GB at 20 Mbps, 90% efficiency)', () => {
      // 20 Mbps * 0.9 = 18 Mbps
      // 80,000,000,000 / 18,000,000 = 4444.4444... seconds
      const res = calculateUploadTime({
        fileSize: 10,
        fileSizeUnit: 'GB',
        speed: 20,
        speedUnit: 'Mbps',
        efficiencyPercent: 90,
        reservedBandwidthPercent: 0,
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.ok(Math.abs(res.data.totalSeconds - 4444.444) < 0.01);
        assert.strictEqual(res.data.formattedDuration, '1 hour 14 minutes 4 seconds');
        assert.ok(res.data.effectiveSpeedFormatted.includes('18 Mbps'));
      }
    });

    it('3. factors in reserved bandwidth (20% reserved reduces available speed to 80%)', () => {
      // 20 Mbps * 100% eff * (1 - 0.20) = 16 Mbps
      // 80,000,000,000 / 16,000,000 = 5,000 seconds = 1h 23m 20s
      const res = calculateUploadTime({
        fileSize: 10,
        fileSizeUnit: 'GB',
        speed: 20,
        speedUnit: 'Mbps',
        efficiencyPercent: 100,
        reservedBandwidthPercent: 20,
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.strictEqual(res.data.totalSeconds, 5000);
        assert.strictEqual(res.data.formattedDuration, '1 hour 23 minutes 20 seconds');
        assert.ok(res.data.reservedSpeedFormatted.includes('4 Mbps'));
        assert.ok(res.data.effectiveSpeedFormatted.includes('16 Mbps'));
      }
    });

    it('4. accounts for multi-file batch setup overhead', () => {
      // 10 GB at 20 Mbps (100% eff) = 4,000s payload
      // 100 files with 2 seconds per file overhead = 200s overhead
      // Total = 4,200s = 1h 10m
      const res = calculateUploadTime({
        fileSize: 10,
        fileSizeUnit: 'GB',
        speed: 20,
        speedUnit: 'Mbps',
        efficiencyPercent: 100,
        reservedBandwidthPercent: 0,
        fileCount: 100,
        perFileOverheadSeconds: 2,
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.strictEqual(res.data.payloadSeconds, 4000);
        assert.strictEqual(res.data.overheadSeconds, 200);
        assert.strictEqual(res.data.totalSeconds, 4200);
        assert.strictEqual(res.data.formattedDuration, '1 hour 10 minutes');
        assert.strictEqual(res.data.formattedOverheadDuration, '3 minutes 20 seconds');
      }
    });

    it('5. combines efficiency + reserve + multi-file overhead accurately', () => {
      // 10 GB, 20 Mbps, 90% eff, 20% reserve -> available = 20 * 0.9 * 0.8 = 14.4 Mbps = 1,800,000 bytes/sec
      // 10,000,000,000 / 1,800,000 = 5555.5555...s payload
      // 50 files * 3s = 150s overhead
      // Total = 5705.5555...s = 1h 35m 6s
      const res = calculateUploadTime({
        fileSize: 10,
        fileSizeUnit: 'GB',
        speed: 20,
        speedUnit: 'Mbps',
        efficiencyPercent: 90,
        reservedBandwidthPercent: 20,
        fileCount: 50,
        perFileOverheadSeconds: 3,
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.strictEqual(res.data.overheadSeconds, 150);
        assert.ok(Math.abs(res.data.payloadSeconds - 5555.555) < 0.01);
        assert.strictEqual(res.data.formattedDuration, '1 hour 35 minutes 6 seconds');
      }
    });
  });

  // ==========================================
  // MODE B — Required Upload Speed
  // ==========================================
  describe('Mode B: Required Upload Speed Calculations', () => {
    it('6. calculates required nominal speed for a given deadline (10 GB in 4,000s, 100% eff)', () => {
      // 10 GB = 80,000,000,000 bits. 80,000,000,000 / 4000s = 20,000,000 bps = 20 Mbps
      const res = calculateRequiredUploadSpeed({
        fileSize: 10,
        fileSizeUnit: 'GB',
        windowDurationSeconds: 4000,
        efficiencyPercent: 100,
        reservedBandwidthPercent: 0,
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.strictEqual(res.data.requiredNominalSpeed, 20);
        assert.strictEqual(res.data.requiredNominalSpeedFormatted, '20 Mbps');
        assert.strictEqual(res.data.requiredEffectiveSpeed, 20);
      }
    });

    it('7. returns descriptive error when deadline is shorter than batch overhead', () => {
      // Window = 60s, but 100 files * 1s = 100s overhead -> unusable window (-40s)
      const res = calculateRequiredUploadSpeed({
        fileSize: 10,
        fileSizeUnit: 'GB',
        windowDurationSeconds: 60,
        fileCount: 100,
        perFileOverheadSeconds: 1,
      });

      assert.strictEqual(res.success, false);
      if (!res.success) {
        assert.ok(res.error.includes('shorter than file batch overhead'));
      }
    });

    it('8. scales required speed upward when bandwidth is reserved', () => {
      // 10 GB in 4,000s at 100% eff -> effective = 20 Mbps
      // If 50% bandwidth is reserved, nominal line must be 40 Mbps
      const res = calculateRequiredUploadSpeed({
        fileSize: 10,
        fileSizeUnit: 'GB',
        windowDurationSeconds: 4000,
        efficiencyPercent: 100,
        reservedBandwidthPercent: 50,
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.strictEqual(res.data.requiredEffectiveSpeed, 20);
        assert.strictEqual(res.data.requiredNominalSpeed, 40);
        assert.strictEqual(res.data.requiredNominalSpeedFormatted, '40 Mbps');
      }
    });

    it('9. adjusts required speed upward for protocol efficiency', () => {
      // 10 GB in 4,000s -> effective 20 Mbps
      // Efficiency 80% -> nominal = 20 / 0.8 = 25 Mbps
      const res = calculateRequiredUploadSpeed({
        fileSize: 10,
        fileSizeUnit: 'GB',
        windowDurationSeconds: 4000,
        efficiencyPercent: 80,
        reservedBandwidthPercent: 0,
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.strictEqual(res.data.requiredEffectiveSpeed, 20);
        assert.strictEqual(res.data.requiredNominalSpeed, 25);
      }
    });
  });

  // ==========================================
  // MODE C — Upload Window Capacity
  // ==========================================
  describe('Mode C: Upload Window Capacity Calculations', () => {
    it('10. calculates maximum uploadable data in a time window (20 Mbps for 2 hours, 100% eff)', () => {
      // 20 Mbps = 2,500,000 bytes/sec
      // 2 hours = 7,200 seconds
      // 2,500,000 * 7,200 = 18,000,000,000 bytes = 18 GB decimal
      const res = calculateUploadCapacity({
        speed: 20,
        speedUnit: 'Mbps',
        windowDurationSeconds: 7200,
        targetSizeUnit: 'GB',
        efficiencyPercent: 100,
        reservedBandwidthPercent: 0,
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.strictEqual(res.data.maximumPayloadBytes, 18000000000);
        assert.strictEqual(res.data.maximumPayloadFormatted, '18 GB');
        assert.strictEqual(res.data.dataPerHourFormatted, '9 GB/hr');
      }
    });

    it('11. reduces capacity proportionally with reserved bandwidth', () => {
      // 20 Mbps for 2 hours (18 GB max at 100%). With 25% reserve -> 18 * 0.75 = 13.5 GB
      const res = calculateUploadCapacity({
        speed: 20,
        speedUnit: 'Mbps',
        windowDurationSeconds: 7200,
        targetSizeUnit: 'GB',
        efficiencyPercent: 100,
        reservedBandwidthPercent: 25,
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.strictEqual(res.data.maximumPayloadFormatted, '13.5 GB');
      }
    });

    it('12. scales capacity with efficiency ratio', () => {
      // 20 Mbps for 2 hours, 90% eff -> 18 * 0.9 = 16.2 GB
      const res = calculateUploadCapacity({
        speed: 20,
        speedUnit: 'Mbps',
        windowDurationSeconds: 7200,
        targetSizeUnit: 'GB',
        efficiencyPercent: 90,
        reservedBandwidthPercent: 0,
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.strictEqual(res.data.maximumPayloadFormatted, '16.2 GB');
      }
    });

    it('13. deducts setup / connection reserve from usable upload window', () => {
      // 20 Mbps (2.5 MB/s) for 7,200s minus 1,200s setup reserve = 6,000s usable
      // 2.5 MB/s * 6000s = 15,000,000,000 bytes = 15 GB
      const res = calculateUploadCapacity({
        speed: 20,
        speedUnit: 'Mbps',
        windowDurationSeconds: 7200,
        targetSizeUnit: 'GB',
        efficiencyPercent: 100,
        reservedBandwidthPercent: 0,
        setupReserveSeconds: 1200,
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.strictEqual(res.data.usableWindowSeconds, 6000);
        assert.strictEqual(res.data.maximumPayloadFormatted, '15 GB');
      }
    });
  });

  // ==========================================
  // Validation & Edge Cases
  // ==========================================
  describe('Input Validation & Resilience', () => {
    it('14. rejects negative or NaN values gracefully', () => {
      const resA = calculateUploadTime({
        fileSize: -10,
        fileSizeUnit: 'GB',
        speed: 20,
        speedUnit: 'Mbps',
      });
      assert.strictEqual(resA.success, false);

      const resB = calculateRequiredUploadSpeed({
        fileSize: 10,
        fileSizeUnit: 'GB',
        windowDurationSeconds: -50,
      });
      assert.strictEqual(resB.success, false);
    });

    it('15. rejects zero size or zero speed', () => {
      const res = calculateUploadTime({
        fileSize: 0,
        fileSizeUnit: 'GB',
        speed: 20,
        speedUnit: 'Mbps',
      });
      assert.strictEqual(res.success, false);
    });

    it('16. supports binary IEC units (GiB, MiB) accurately', () => {
      // 1 GiB = 1,073,741,824 bytes = 8,589,934,592 bits
      // 20 Mbps = 20,000,000 bps
      // 8,589,934,592 / 20,000,000 = 429.4967... seconds
      const res = calculateUploadTime({
        fileSize: 1,
        fileSizeUnit: 'GiB',
        speed: 20,
        speedUnit: 'Mbps',
        efficiencyPercent: 100,
      });
      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.ok(Math.abs(res.data.totalSeconds - 429.4967) < 0.01);
      }
    });

    it('17. rejects reserved bandwidth >= 100%', () => {
      const res = calculateUploadTime({
        fileSize: 10,
        fileSizeUnit: 'GB',
        speed: 20,
        speedUnit: 'Mbps',
        reservedBandwidthPercent: 100,
      });
      assert.strictEqual(res.success, false);
      if (!res.success) {
        assert.ok(res.error.includes('between 0% and 99%'));
      }
    });

    it('18. enforces efficiency bounds (1% to 100%)', () => {
      const resLow = calculateUploadTime({
        fileSize: 10,
        fileSizeUnit: 'GB',
        speed: 20,
        speedUnit: 'Mbps',
        efficiencyPercent: 0,
      });
      assert.strictEqual(resLow.success, false);

      const resHigh = calculateUploadTime({
        fileSize: 10,
        fileSizeUnit: 'GB',
        speed: 20,
        speedUnit: 'Mbps',
        efficiencyPercent: 120,
      });
      assert.strictEqual(resHigh.success, false);
    });

    it('19. falls back safely on malformed URL search params', () => {
      const malformedParams = new URLSearchParams('mode=garbage&size=-999&speed=invalid&reserve=150');
      const parsed = parseUploadUrlState(malformedParams);

      assert.strictEqual(parsed.mode, DEFAULT_UPLOAD_STATE.mode);
      assert.strictEqual(parsed.fileSize, DEFAULT_UPLOAD_STATE.fileSize);
      assert.strictEqual(parsed.speed, DEFAULT_UPLOAD_STATE.speed);
      assert.strictEqual(parsed.reservedBandwidth, DEFAULT_UPLOAD_STATE.reservedBandwidth);
    });
  });

  // ==========================================
  // URL State
  // ==========================================
  describe('URL State Serialization & Deserialization', () => {
    it('20. completes clean round-trip serialization', () => {
      const customState = {
        mode: 'required-speed' as const,
        fileSize: 50,
        fileSizeUnit: 'GB' as const,
        speed: 20,
        speedUnit: 'Mbps' as const,
        efficiency: 85,
        reservedBandwidth: 15,
        fileCount: 10,
        perFileOverhead: 2,
        windowDuration: 4,
        windowDurationUnit: 'hours' as const,
      };

      const query = serializeUploadUrlState(customState);
      const params = new URLSearchParams(query.replace('?', ''));
      const parsed = parseUploadUrlState(params);

      assert.strictEqual(parsed.mode, 'required-speed');
      assert.strictEqual(parsed.fileSize, 50);
      assert.strictEqual(parsed.fileSizeUnit, 'GB');
      assert.strictEqual(parsed.efficiency, 85);
      assert.strictEqual(parsed.reservedBandwidth, 15);
      assert.strictEqual(parsed.fileCount, 10);
      assert.strictEqual(parsed.perFileOverhead, 2);
      assert.strictEqual(parsed.windowDuration, 4);
      assert.strictEqual(parsed.windowDurationUnit, 'hours');
    });

    it('21. recovers accurately from partial parameters without corrupting defaults', () => {
      const partialParams = new URLSearchParams('mode=capacity&speed=50&time=8');
      const parsed = parseUploadUrlState(partialParams);

      assert.strictEqual(parsed.mode, 'window-capacity');
      assert.strictEqual(parsed.speed, 50);
      assert.strictEqual(parsed.windowDuration, 8);
      assert.strictEqual(parsed.efficiency, DEFAULT_UPLOAD_STATE.efficiency);
      assert.strictEqual(parsed.reservedBandwidth, DEFAULT_UPLOAD_STATE.reservedBandwidth);
    });
  });
});
