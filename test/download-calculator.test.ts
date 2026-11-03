import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDownloadTime,
  calculateDownloadBottleneck,
  calculateRequiredDownloadSpeed,
  parseDownloadUrlState,
  serializeDownloadUrlState,
  DEFAULT_DOWNLOAD_STATE,
  speedToBytesPerSec,
  bytesPerSecToSpeed,
} from '../src/lib/download';

describe('Download Path Planning Calculation Engine', () => {
  // ==========================================
  // MODE A — Download Time
  // ==========================================
  describe('Mode A: Download Time Calculations', () => {
    it('1. calculates baseline duration accurately with 90% planning efficiency default (100 GB @ 100 Mbps)', () => {
      // 100 GB = 100,000,000,000 bytes = 800,000,000,000 bits
      // Nominal speed: 100 Mbps = 100,000,000 bps = 12,500,000 B/s
      // Theoretical time: 800,000,000,000 / 100,000,000 = 8,000 seconds = 2h 13m 20s
      // Available bandwidth: 100% -> 12,500,000 B/s
      // Planning efficiency: 90% -> effective = 12,500,000 * 0.9 = 11,250,000 B/s (11.25 MB/s = 90 Mbps)
      // Total planning seconds: 100,000,000,000 / 11,250,000 = 8,888.888... seconds = 2h 28m 8s
      const res = calculateDownloadTime({
        fileSize: 100,
        fileSizeUnit: 'GB',
        connectionSpeed: 100,
        connectionSpeedUnit: 'Mbps',
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.ok(Math.abs(res.data.totalSeconds - 8888.888) < 0.01);
        assert.strictEqual(res.data.formattedDuration, '2 hours 28 minutes 9 seconds');
        assert.strictEqual(res.data.formattedDurationShort, '2h 28m 9s');
        assert.strictEqual(res.data.theoreticalSeconds, 8000);
        assert.strictEqual(res.data.formattedTheoreticalDuration, '2 hours 13 minutes 20 seconds');
        assert.strictEqual(res.data.formattedTheoreticalDurationShort, '2h 13m 20s');
        assert.strictEqual(res.data.effectiveMBs, 11.25);
        assert.strictEqual(res.data.effectiveMbps, 90);
        assert.strictEqual(res.data.limitingFactor, 'connection');
        assert.strictEqual(res.data.limitingFactorLabel, 'Internet Connection Rate');
      }
    });

    it('2. calculates 100% theoretical result when planning efficiency is set to 100%', () => {
      const res = calculateDownloadTime({
        fileSize: 100,
        fileSizeUnit: 'GB',
        connectionSpeed: 100,
        connectionSpeedUnit: 'Mbps',
        planningEfficiencyPercent: 100,
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.strictEqual(res.data.totalSeconds, 8000);
        assert.strictEqual(res.data.theoreticalSeconds, 8000);
        assert.strictEqual(res.data.effectiveMBs, 12.5);
      }
    });

    it('3. adjusts duration based on custom efficiency (80% efficiency)', () => {
      // 100 Mbps * 0.8 = 80 Mbps = 10 MB/s
      // 100,000,000,000 / 10,000,000 = 10,000 seconds = 2h 46m 40s
      const res = calculateDownloadTime({
        fileSize: 100,
        fileSizeUnit: 'GB',
        connectionSpeed: 100,
        connectionSpeedUnit: 'Mbps',
        planningEfficiencyPercent: 80,
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.strictEqual(res.data.totalSeconds, 10000);
        assert.strictEqual(res.data.effectiveMBs, 10);
        assert.strictEqual(res.data.effectiveMbps, 80);
      }
    });

    it('4. factors in available bandwidth share (50% allocated to download)', () => {
      // 100 Mbps line, 50% share = 50 Mbps available
      // 90% planning efficiency -> effective 45 Mbps = 5.625 MB/s
      // 100,000,000,000 / 5,625,000 = 17,777.77... seconds
      const res = calculateDownloadTime({
        fileSize: 100,
        fileSizeUnit: 'GB',
        connectionSpeed: 100,
        connectionSpeedUnit: 'Mbps',
        availableBandwidthPercent: 50,
        planningEfficiencyPercent: 90,
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.strictEqual(res.data.limitingFactor, 'bandwidth-share');
        assert.strictEqual(res.data.effectiveMbps, 45);
        assert.strictEqual(res.data.effectiveMBs, 5.625);
        assert.ok(Math.abs(res.data.totalSeconds - 17777.777) < 0.01);
      }
    });

    it('5. remote server cap becomes bottleneck when slower than connection', () => {
      // 100 Mbps connection = 12.5 MB/s
      // Server cap enabled: 5 MB/s (slower than 12.5 MB/s)
      // Path ceiling = 5 MB/s
      // At 100% efficiency: 10 GB / 5 MB/s = 2,000 seconds
      const res = calculateDownloadTime({
        fileSize: 10,
        fileSizeUnit: 'GB',
        connectionSpeed: 100,
        connectionSpeedUnit: 'Mbps',
        serverCapEnabled: true,
        serverCapSpeed: 5,
        serverCapSpeedUnit: 'MB/s',
        planningEfficiencyPercent: 100,
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.strictEqual(res.data.limitingFactor, 'server-cap');
        assert.strictEqual(res.data.limitingFactorLabel, 'Remote Server / CDN Delivery Cap');
        assert.strictEqual(res.data.totalSeconds, 2000);
        assert.strictEqual(res.data.effectiveMBs, 5);
        assert.ok(res.data.decisionNote.includes('remote server delivery cap'));
      }
    });

    it('6. connection remains bottleneck when faster than remote server cap', () => {
      // 100 Mbps connection = 12.5 MB/s
      // Server cap enabled: 50 MB/s (faster than 12.5 MB/s)
      // Path ceiling = 12.5 MB/s
      const res = calculateDownloadTime({
        fileSize: 10,
        fileSizeUnit: 'GB',
        connectionSpeed: 100,
        connectionSpeedUnit: 'Mbps',
        serverCapEnabled: true,
        serverCapSpeed: 50,
        serverCapSpeedUnit: 'MB/s',
        planningEfficiencyPercent: 100,
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.strictEqual(res.data.limitingFactor, 'connection');
        assert.strictEqual(res.data.effectiveMBs, 12.5);
      }
    });

    it('7. converts units accurately (binary IEC GiB and Gbps)', () => {
      // 1 GiB = 1,073,741,824 bytes
      // 1 Gbps = 125,000,000 B/s
      // At 100% eff: 1,073,741,824 / 125,000,000 = 8.589934592 s
      const res = calculateDownloadTime({
        fileSize: 1,
        fileSizeUnit: 'GiB',
        connectionSpeed: 1,
        connectionSpeedUnit: 'Gbps',
        planningEfficiencyPercent: 100,
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.ok(Math.abs(res.data.totalSeconds - 8.5899) < 0.01);
      }
    });
  });

  // ==========================================
  // MODE B — Download Bottleneck
  // ==========================================
  describe('Mode B: Download Bottleneck Analysis', () => {
    it('8. identifies connection as limiting factor when server cap is not enabled', () => {
      const res = calculateDownloadBottleneck({
        connectionSpeed: 300,
        connectionSpeedUnit: 'Mbps',
        availableBandwidthPercent: 100,
        planningEfficiencyPercent: 90,
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.strictEqual(res.data.limitingFactor, 'connection');
        assert.strictEqual(res.data.nominalConnectionMbps, 300);
        assert.strictEqual(res.data.effectiveThroughputMbps, 270);
      }
    });

    it('9. identifies server cap bottleneck and calculates connection headroom', () => {
      // Connection: 1 Gbps = 1,000 Mbps = 125 MB/s
      // Server cap: 25 MB/s = 200 Mbps
      // Path ceiling = 25 MB/s
      // Connection headroom: (125 - 25) / 25 = 400%
      const res = calculateDownloadBottleneck({
        connectionSpeed: 1,
        connectionSpeedUnit: 'Gbps',
        serverCapEnabled: true,
        serverCapSpeed: 25,
        serverCapSpeedUnit: 'MB/s',
        planningEfficiencyPercent: 90,
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.strictEqual(res.data.limitingFactor, 'server-cap');
        assert.strictEqual(res.data.pathCeilingMBs, 25);
        assert.strictEqual(res.data.connectionHeadroomPercent, 400);
        assert.ok(res.data.decisionNote.includes('Upgrading your broadband speed will not accelerate'));
      }
    });

    it('10. identifies bandwidth share reduction when partial share is allocated', () => {
      const res = calculateDownloadBottleneck({
        connectionSpeed: 100,
        connectionSpeedUnit: 'Mbps',
        availableBandwidthPercent: 75,
        planningEfficiencyPercent: 90,
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.strictEqual(res.data.limitingFactor, 'bandwidth-share');
        assert.strictEqual(res.data.availableConnectionMbps, 75);
      }
    });

    it('11. handles disabled server cap cleanly', () => {
      const res = calculateDownloadBottleneck({
        connectionSpeed: 500,
        connectionSpeedUnit: 'Mbps',
        serverCapEnabled: false,
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.strictEqual(res.data.serverCapEnabled, false);
        assert.strictEqual(res.data.serverCapMbps, null);
      }
    });
  });

  // ==========================================
  // MODE C — Required Connection Speed
  // ==========================================
  describe('Mode C: Required Connection Speed', () => {
    it('12. calculates required nominal speed for a deadline (100 GB in 2 hours @ 90% eff)', () => {
      // 100 GB in 2 hours (7,200 seconds)
      // Required effective bytes/s: 100,000,000,000 / 7,200 = 13,888,888.88... B/s (13.888 MB/s = 111.111 Mbps)
      // At 90% efficiency: path ceiling needed = 13,888,888.88 / 0.9 = 15,432,098.76 B/s = 123.456 Mbps
      const res = calculateRequiredDownloadSpeed({
        fileSize: 100,
        fileSizeUnit: 'GB',
        targetDurationSeconds: 7200,
        availableBandwidthPercent: 100,
        planningEfficiencyPercent: 90,
        targetSpeedUnit: 'Mbps',
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.strictEqual(res.data.isFeasible, true);
        assert.ok(Math.abs(res.data.requiredNominalConnectionSpeed - 123.456) < 0.01);
        assert.ok(res.data.requiredNominalConnectionFormatted.includes('123.46 Mbps'));
      }
    });

    it('13. scales required speed upward when bandwidth share is reduced (50% share)', () => {
      // 100 GB in 7,200s at 100% eff: 13.888 MB/s needed = 111.111 Mbps
      // At 50% share: nominal connection needed = 111.111 / 0.5 = 222.222 Mbps
      const res = calculateRequiredDownloadSpeed({
        fileSize: 100,
        fileSizeUnit: 'GB',
        targetDurationSeconds: 7200,
        availableBandwidthPercent: 50,
        planningEfficiencyPercent: 100,
        targetSpeedUnit: 'Mbps',
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.strictEqual(res.data.isFeasible, true);
        assert.ok(Math.abs(res.data.requiredNominalConnectionSpeed - 222.222) < 0.01);
      }
    });

    it('14. marks target unfeasible when required throughput exceeds server cap', () => {
      // 100 GB in 1,000 seconds = 100 MB/s effective needed
      // Remote server cap is 20 MB/s -> max feasible effective is 18 MB/s at 90% eff
      // 100 MB/s > 18 MB/s -> Impossible regardless of connection speed!
      const res = calculateRequiredDownloadSpeed({
        fileSize: 100,
        fileSizeUnit: 'GB',
        targetDurationSeconds: 1000,
        serverCapEnabled: true,
        serverCapSpeed: 20,
        serverCapSpeedUnit: 'MB/s',
        planningEfficiencyPercent: 90,
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.strictEqual(res.data.isFeasible, false);
        assert.strictEqual(res.data.serverCapMBs, 20);
        assert.strictEqual(res.data.maxFeasibleEffectiveMBs, 18);
        assert.ok(res.data.decisionNote.includes('Target not feasible under current server cap'));
      }
    });

    it('15. marks target feasible when server cap is higher than required speed', () => {
      // 10 GB in 3,600s = 2.77 MB/s needed
      // Server cap is 20 MB/s -> Feasible!
      const res = calculateRequiredDownloadSpeed({
        fileSize: 10,
        fileSizeUnit: 'GB',
        targetDurationSeconds: 3600,
        serverCapEnabled: true,
        serverCapSpeed: 20,
        serverCapSpeedUnit: 'MB/s',
        planningEfficiencyPercent: 100,
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.strictEqual(res.data.isFeasible, true);
      }
    });
  });

  // ==========================================
  // URL STATE & SERIALIZATION
  // ==========================================
  describe('URL State Serialization & Deserialization', () => {
    it('16. completes round-trip serialization and deserialization', () => {
      const state = {
        mode: 'bottleneck' as const,
        fileSize: 250,
        fileSizeUnit: 'GB' as const,
        speed: 500,
        speedUnit: 'Mbps' as const,
        bandwidthShare: 80,
        planningEfficiency: 85,
        serverCapEnabled: true,
        serverCap: 30,
        serverCapUnit: 'MB/s' as const,
        targetDuration: 45,
        targetDurationUnit: 'minutes' as const,
      };

      const qs = serializeDownloadUrlState(state);
      const params = new URLSearchParams(qs.replace('?', ''));
      const parsed = parseDownloadUrlState(params);

      assert.strictEqual(parsed.mode, state.mode);
      assert.strictEqual(parsed.speed, state.speed);
      assert.strictEqual(parsed.speedUnit, state.speedUnit);
      assert.strictEqual(parsed.bandwidthShare, state.bandwidthShare);
      assert.strictEqual(parsed.planningEfficiency, state.planningEfficiency);
      assert.strictEqual(parsed.serverCapEnabled, state.serverCapEnabled);
      assert.strictEqual(parsed.serverCap, state.serverCap);
      assert.strictEqual(parsed.serverCapUnit, state.serverCapUnit);
    });

    it('17. falls back safely on corrupted or missing query parameters', () => {
      const params = new URLSearchParams('mode=invalid&size=-50&share=9999&eff=abc');
      const parsed = parseDownloadUrlState(params);

      assert.strictEqual(parsed.mode, DEFAULT_DOWNLOAD_STATE.mode);
      assert.strictEqual(parsed.fileSize, DEFAULT_DOWNLOAD_STATE.fileSize);
      assert.strictEqual(parsed.bandwidthShare, DEFAULT_DOWNLOAD_STATE.bandwidthShare);
      assert.strictEqual(parsed.planningEfficiency, DEFAULT_DOWNLOAD_STATE.planningEfficiency);
    });
  });

  // ==========================================
  // EXTREME BOUNDARIES & VALIDATION
  // ==========================================
  describe('Extreme Boundaries & Validation', () => {
    it('18. handles very large datasets (10 TB) accurately', () => {
      // 10 TB = 10,000,000,000,000 bytes
      // At 1 Gbps (125 MB/s) at 100% eff: 80,000s = 22h 13m 20s
      const res = calculateDownloadTime({
        fileSize: 10,
        fileSizeUnit: 'TB',
        connectionSpeed: 1,
        connectionSpeedUnit: 'Gbps',
        planningEfficiencyPercent: 100,
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.strictEqual(res.data.totalSeconds, 80000);
      }
    });

    it('19. handles ultra high-speed connections (10 Gbps) accurately', () => {
      // 100 GB at 10 Gbps (1,250 MB/s) at 100% eff: 80 seconds
      const res = calculateDownloadTime({
        fileSize: 100,
        fileSizeUnit: 'GB',
        connectionSpeed: 10,
        connectionSpeedUnit: 'Gbps',
        planningEfficiencyPercent: 100,
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.strictEqual(res.data.totalSeconds, 80);
        assert.strictEqual(res.data.effectiveMBs, 1250);
      }
    });

    it('20. rejects invalid numerical inputs with descriptive errors', () => {
      const resNegativeSize = calculateDownloadTime({
        fileSize: -10,
        fileSizeUnit: 'GB',
        connectionSpeed: 100,
        connectionSpeedUnit: 'Mbps',
      });
      assert.strictEqual(resNegativeSize.success, false);

      const resZeroSpeed = calculateDownloadTime({
        fileSize: 10,
        fileSizeUnit: 'GB',
        connectionSpeed: 0,
        connectionSpeedUnit: 'Mbps',
      });
      assert.strictEqual(resZeroSpeed.success, false);

      const resBadEfficiency = calculateDownloadTime({
        fileSize: 10,
        fileSizeUnit: 'GB',
        connectionSpeed: 100,
        connectionSpeedUnit: 'Mbps',
        planningEfficiencyPercent: 150,
      });
      assert.strictEqual(resBadEfficiency.success, false);
    });

    it('21. helper speedToBytesPerSec and bytesPerSecToSpeed roundtrip', () => {
      assert.strictEqual(speedToBytesPerSec(100, 'Mbps'), 12_500_000);
      assert.strictEqual(bytesPerSecToSpeed(12_500_000, 'Mbps'), 100);
    });
  });
});
