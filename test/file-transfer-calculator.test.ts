import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateFileTransferTime,
  calculateBottleneckAnalysis,
  calculateRequiredInterfaceSpeed,
  speedToBytesPerSec,
  bytesPerSecToSpeed,
  parseFileTransferUrlState,
  serializeFileTransferUrlState,
  DEFAULT_FILE_TRANSFER_STATE,
} from '../src/lib/file-transfer';

describe('File Transfer Bottleneck Calculation Engine', () => {
  // ==========================================
  // MODE A — Transfer Time
  // ==========================================
  describe('Mode A: Transfer Time Calculations', () => {
    it('FT-A1: Mode A baseline with default parameters (100 GB, 500 MB/s, 1 Gbps, 300 MB/s, 85% eff)', () => {
      // 100 GB = 100,000,000,000 bytes
      // Source: 500 MB/s = 500,000,000 B/s
      // Interface: 1 Gbps = 1,000,000,000 bps = 125,000,000 B/s (Bottleneck)
      // Destination: 300 MB/s = 300,000,000 B/s
      // Effective: 125,000,000 * 0.85 = 106,250,000 B/s (106.25 MB/s = 850 Mbps)
      // Total payload seconds: 100,000,000,000 / 106,250,000 = 941.17647... s
      // 941.176s = 15 minutes 41 seconds
      const res = calculateFileTransferTime({
        dataSize: 100,
        dataSizeUnit: 'GB',
        sourceSpeed: 500,
        sourceSpeedUnit: 'MB/s',
        interfaceSpeed: 1,
        interfaceSpeedUnit: 'Gbps',
        destinationSpeed: 300,
        destinationSpeedUnit: 'MB/s',
        planningEfficiencyPercent: 85,
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.strictEqual(res.data.bottleneckStage, 'interface');
        assert.strictEqual(res.data.bottleneckStageLabel, 'Interface / Network');
        assert.ok(Math.abs(res.data.totalSeconds - 941.176) < 0.01);
        assert.strictEqual(res.data.formattedDuration, '15 minutes 41 seconds');
        assert.strictEqual(res.data.formattedDurationShort, '15m 41s');
        assert.strictEqual(res.data.rawBottleneckMBs, 125);
        assert.strictEqual(res.data.effectiveMBs, 106.25);
        assert.strictEqual(res.data.effectiveMbps, 850);
        // Stage headroom checks
        assert.strictEqual(res.data.stages.interface.isBottleneck, true);
        assert.strictEqual(res.data.stages.interface.headroomPercent, 0);
        assert.strictEqual(res.data.stages.destination.headroomPercent, 140); // (300 - 125) / 125 = 140%
        assert.strictEqual(res.data.stages.source.headroomPercent, 300); // (500 - 125) / 125 = 300%
      }
    });

    it('FT-A2: Source bottleneck scenario (Source 100 MB/s HDD, Interface 10 Gbps, Dest 3000 MB/s NVMe)', () => {
      // Source: 100 MB/s = 100,000,000 B/s (Bottleneck)
      // Interface: 10 Gbps = 1,250,000,000 B/s
      // Dest: 3000 MB/s = 3,000,000,000 B/s
      // Data: 50 GB at 100% eff -> 50,000,000,000 / 100,000,000 = 500 seconds = 8m 20s
      const res = calculateFileTransferTime({
        dataSize: 50,
        dataSizeUnit: 'GB',
        sourceSpeed: 100,
        sourceSpeedUnit: 'MB/s',
        interfaceSpeed: 10,
        interfaceSpeedUnit: 'Gbps',
        destinationSpeed: 3000,
        destinationSpeedUnit: 'MB/s',
        planningEfficiencyPercent: 100,
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.strictEqual(res.data.bottleneckStage, 'source');
        assert.strictEqual(res.data.bottleneckStageLabel, 'Source Read');
        assert.strictEqual(res.data.totalSeconds, 500);
        assert.strictEqual(res.data.formattedDurationShort, '8m 20s');
        assert.strictEqual(res.data.rawBottleneckMBs, 100);
        assert.strictEqual(res.data.stages.source.isBottleneck, true);
        assert.strictEqual(res.data.stages.interface.isBottleneck, false);
      }
    });

    it('FT-A3: Destination bottleneck scenario (Source 7000 MB/s NVMe, Interface 40 Gbps TB4, Dest 180 MB/s HDD)', () => {
      // Source: 7000 MB/s
      // Interface: 40 Gbps = 5,000 MB/s
      // Dest: 180 MB/s (Bottleneck)
      // Data: 180 GB at 100% eff -> 180,000,000,000 / 180,000,000 = 1000 seconds = 16m 40s
      const res = calculateFileTransferTime({
        dataSize: 180,
        dataSizeUnit: 'GB',
        sourceSpeed: 7000,
        sourceSpeedUnit: 'MB/s',
        interfaceSpeed: 40,
        interfaceSpeedUnit: 'Gbps',
        destinationSpeed: 180,
        destinationSpeedUnit: 'MB/s',
        planningEfficiencyPercent: 100,
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.strictEqual(res.data.bottleneckStage, 'destination');
        assert.strictEqual(res.data.bottleneckStageLabel, 'Destination Write');
        assert.strictEqual(res.data.totalSeconds, 1000);
        assert.strictEqual(res.data.formattedDurationShort, '16m 40s');
        assert.strictEqual(res.data.rawBottleneckMBs, 180);
      }
    });

    it('FT-A4: Balanced / Tie scenario (Source 500 MB/s, Interface 4 Gbps [500 MB/s], Dest 500 MB/s)', () => {
      // 4 Gbps = 4,000,000,000 bps / 8 = 500,000,000 B/s = 500 MB/s
      // All 3 stages match exactly -> Tie
      const res = calculateFileTransferTime({
        dataSize: 50,
        dataSizeUnit: 'GB',
        sourceSpeed: 500,
        sourceSpeedUnit: 'MB/s',
        interfaceSpeed: 4,
        interfaceSpeedUnit: 'Gbps',
        destinationSpeed: 500,
        destinationSpeedUnit: 'MB/s',
        planningEfficiencyPercent: 100,
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.strictEqual(res.data.bottleneckStage, 'tie');
        assert.ok(res.data.bottleneckStageLabel.includes('Balanced'));
        assert.strictEqual(res.data.rawBottleneckMBs, 500);
      }
    });

    it('FT-A5: Small-file overhead impacts total duration (10,000 files, 0.01s overhead = 100s added)', () => {
      // 10 GB at 100 MB/s (100% eff) = 100s payload
      // 10,000 files * 0.01s = 100s overhead
      // Total = 200s
      const res = calculateFileTransferTime({
        dataSize: 10,
        dataSizeUnit: 'GB',
        sourceSpeed: 500,
        sourceSpeedUnit: 'MB/s',
        interfaceSpeed: 800,
        interfaceSpeedUnit: 'Mbps', // 100 MB/s
        destinationSpeed: 500,
        destinationSpeedUnit: 'MB/s',
        planningEfficiencyPercent: 100,
        fileCount: 10000,
        perFileOverheadSeconds: 0.01,
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.strictEqual(res.data.payloadSeconds, 100);
        assert.strictEqual(res.data.overheadSeconds, 100);
        assert.strictEqual(res.data.totalSeconds, 200);
        assert.strictEqual(res.data.formattedDurationShort, '3m 20s');
      }
    });

    it('FT-A6: Decimal vs Binary file size conversions', () => {
      // 1 GiB = 1,073,741,824 bytes
      // At 100 MB/s (100,000,000 B/s), payload seconds = 10.73741824 s
      const res = calculateFileTransferTime({
        dataSize: 1,
        dataSizeUnit: 'GiB',
        sourceSpeed: 500,
        sourceSpeedUnit: 'MB/s',
        interfaceSpeed: 100,
        interfaceSpeedUnit: 'MB/s',
        destinationSpeed: 500,
        destinationSpeedUnit: 'MB/s',
        planningEfficiencyPercent: 100,
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.ok(Math.abs(res.data.totalSeconds - 10.737) < 0.01);
      }
    });

    it('FT-A7: Unit conversions for speeds (speedToBytesPerSec and bytesPerSecToSpeed)', () => {
      // 1 Gbps = 125,000,000 B/s
      assert.strictEqual(speedToBytesPerSec(1, 'Gbps'), 125_000_000);
      // 480 Mbps = 60,000,000 B/s
      assert.strictEqual(speedToBytesPerSec(480, 'Mbps'), 60_000_000);
      // 1 GB/s = 1,000,000,000 B/s
      assert.strictEqual(speedToBytesPerSec(1, 'GB/s'), 1_000_000_000);
      // Roundtrip
      assert.strictEqual(bytesPerSecToSpeed(125_000_000, 'Gbps'), 1);
    });

    it('FT-A8: Planning efficiency variations (100% vs 85% vs 50%)', () => {
      const getDuration = (eff: number) => {
        const res = calculateFileTransferTime({
          dataSize: 10,
          dataSizeUnit: 'GB',
          sourceSpeed: 500,
          sourceSpeedUnit: 'MB/s',
          interfaceSpeed: 100,
          interfaceSpeedUnit: 'MB/s',
          destinationSpeed: 500,
          destinationSpeedUnit: 'MB/s',
          planningEfficiencyPercent: eff,
        });
        assert.strictEqual(res.success, true);
        return (res as any).data.totalSeconds;
      };

      const t100 = getDuration(100); // 100s
      const t85 = getDuration(85);   // ~117.65s
      const t50 = getDuration(50);   // 200s

      assert.strictEqual(t100, 100);
      assert.ok(Math.abs(t85 - 117.647) < 0.01);
      assert.strictEqual(t50, 200);
    });

    it('FT-A9: Invalid input handling (negative sizes, 0 speeds, invalid efficiency)', () => {
      const resBadSize = calculateFileTransferTime({
        dataSize: -5,
        dataSizeUnit: 'GB',
        sourceSpeed: 500,
        sourceSpeedUnit: 'MB/s',
        interfaceSpeed: 1,
        interfaceSpeedUnit: 'Gbps',
        destinationSpeed: 300,
        destinationSpeedUnit: 'MB/s',
      });
      assert.strictEqual(resBadSize.success, false);

      const resBadSpeed = calculateFileTransferTime({
        dataSize: 10,
        dataSizeUnit: 'GB',
        sourceSpeed: 0,
        sourceSpeedUnit: 'MB/s',
        interfaceSpeed: 1,
        interfaceSpeedUnit: 'Gbps',
        destinationSpeed: 300,
        destinationSpeedUnit: 'MB/s',
      });
      assert.strictEqual(resBadSpeed.success, false);

      const resBadEff = calculateFileTransferTime({
        dataSize: 10,
        dataSizeUnit: 'GB',
        sourceSpeed: 500,
        sourceSpeedUnit: 'MB/s',
        interfaceSpeed: 1,
        interfaceSpeedUnit: 'Gbps',
        destinationSpeed: 300,
        destinationSpeedUnit: 'MB/s',
        planningEfficiencyPercent: 120,
      });
      assert.strictEqual(resBadEff.success, false);
    });
  });

  // ==========================================
  // MODE B — Bottleneck Analysis
  // ==========================================
  describe('Mode B: Bottleneck Analysis', () => {
    it('FT-B1: Mode B bottleneck analysis produces accurate headrooms and throughputs', () => {
      // Source 500 MB/s, Interface 1 Gbps (125 MB/s), Dest 300 MB/s at 85% eff
      const res = calculateBottleneckAnalysis({
        sourceSpeed: 500,
        sourceSpeedUnit: 'MB/s',
        interfaceSpeed: 1,
        interfaceSpeedUnit: 'Gbps',
        destinationSpeed: 300,
        destinationSpeedUnit: 'MB/s',
        planningEfficiencyPercent: 85,
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.strictEqual(res.data.bottleneckStage, 'interface');
        assert.strictEqual(res.data.rawBottleneckMBs, 125);
        assert.strictEqual(res.data.effectiveMBs, 106.25);
        assert.strictEqual(res.data.efficiencyPercent, 85);
        assert.strictEqual(res.data.stages.interface.isBottleneck, true);
        assert.strictEqual(res.data.stages.source.isBottleneck, false);
        assert.strictEqual(res.data.stages.destination.isBottleneck, false);
        assert.strictEqual(res.data.stages.source.headroomMBs, 375);
        assert.strictEqual(res.data.stages.destination.headroomMBs, 175);
      }
    });

    it('FT-B2: Mode B handles ties cleanly', () => {
      const res = calculateBottleneckAnalysis({
        sourceSpeed: 200,
        sourceSpeedUnit: 'MB/s',
        interfaceSpeed: 1.6,
        interfaceSpeedUnit: 'Gbps', // 200 MB/s
        destinationSpeed: 500,
        destinationSpeedUnit: 'MB/s',
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.strictEqual(res.data.bottleneckStage, 'tie');
        assert.strictEqual(res.data.stages.source.isBottleneck, true);
        assert.strictEqual(res.data.stages.interface.isBottleneck, true);
        assert.strictEqual(res.data.stages.destination.isBottleneck, false);
      }
    });
  });

  // ==========================================
  // MODE C — Required Interface Speed
  // ==========================================
  describe('Mode C: Required Interface Speed', () => {
    it('FT-C1: Mode C required interface speed calculation for feasible target window', () => {
      // Data: 100 GB in 15 minutes (900 seconds)
      // Required effective bytes/s: 100,000,000,000 / 900 = 111,111,111.11 B/s (111.11 MB/s)
      // At 85% efficiency:
      // Required raw interface: 111,111,111.11 / 0.85 = 130,718,954.25 B/s = 1.04575 Gbps
      // Source is 500 MB/s, Dest is 300 MB/s
      // Storage ceiling = min(500, 300) = 300 MB/s = 300,000,000 B/s
      // Max feasible effective = 300,000,000 * 0.85 = 255,000,000 B/s (255 MB/s)
      // 111.11 MB/s <= 255 MB/s -> Feasible!
      const res = calculateRequiredInterfaceSpeed({
        dataSize: 100,
        dataSizeUnit: 'GB',
        targetDurationSeconds: 900,
        sourceSpeed: 500,
        sourceSpeedUnit: 'MB/s',
        destinationSpeed: 300,
        destinationSpeedUnit: 'MB/s',
        targetSpeedUnit: 'Gbps',
        planningEfficiencyPercent: 85,
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.strictEqual(res.data.isFeasible, true);
        assert.ok(Math.abs(res.data.requiredRawInterfaceGbps - 1.0457) < 0.01);
        assert.ok(res.data.requiredRawInterfaceSpeedFormatted.includes('1.05 Gbps'));
        assert.strictEqual(res.data.storageCeilingMBs, 300);
        assert.strictEqual(res.data.storageCeilingStage, 'destination');
      }
    });

    it('FT-C2: Mode C unfeasible target window (required speed > storage ceiling) marks isFeasible: false', () => {
      // 100 GB in 100 seconds = 1,000 MB/s effective needed
      // Source is 500 MB/s, Dest is 300 MB/s -> Storage ceiling 300 MB/s raw (255 MB/s effective)
      // 1,000 MB/s > 255 MB/s -> Impossible regardless of interface speed!
      const res = calculateRequiredInterfaceSpeed({
        dataSize: 100,
        dataSizeUnit: 'GB',
        targetDurationSeconds: 100,
        sourceSpeed: 500,
        sourceSpeedUnit: 'MB/s',
        destinationSpeed: 300,
        destinationSpeedUnit: 'MB/s',
        planningEfficiencyPercent: 85,
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.strictEqual(res.data.isFeasible, false);
        assert.strictEqual(res.data.storageCeilingStage, 'destination');
        assert.ok(res.data.decisionNote.includes('Not feasible'));
      }
    });

    it('FT-C3: Mode C with small file overhead reducing usable window', () => {
      // Target deadline: 200 seconds
      // 10,000 files * 0.01s = 100 seconds overhead
      // Usable window = 200 - 100 = 100 seconds
      // Data: 10 GB in 100 seconds = 100 MB/s effective
      const res = calculateRequiredInterfaceSpeed({
        dataSize: 10,
        dataSizeUnit: 'GB',
        targetDurationSeconds: 200,
        sourceSpeed: 500,
        sourceSpeedUnit: 'MB/s',
        destinationSpeed: 500,
        destinationSpeedUnit: 'MB/s',
        targetSpeedUnit: 'Mbps',
        planningEfficiencyPercent: 100,
        fileCount: 10000,
        perFileOverheadSeconds: 0.01,
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.strictEqual(res.data.usableWindowSeconds, 100);
        assert.strictEqual(res.data.overheadSeconds, 100);
        assert.strictEqual(res.data.requiredEffectiveMBs, 100);
        assert.ok(res.data.requiredRawInterfaceSpeedFormatted.includes('800 Mbps'));
      }
    });
  });

  // ==========================================
  // URL STATE & SERIALIZATION
  // ==========================================
  describe('URL State Serialization & Deserialization', () => {
    it('FT-Q1: URL state serialization and deserialization roundtrip', () => {
      const customState = {
        mode: 'bottleneck' as const,
        dataSize: 250,
        dataSizeUnit: 'GB' as const,
        sourceSpeed: 7000,
        sourceSpeedUnit: 'MB/s' as const,
        interfaceSpeed: 10,
        interfaceSpeedUnit: 'Gbps' as const,
        destSpeed: 180,
        destSpeedUnit: 'MB/s' as const,
        efficiency: 90,
        fileCount: 500,
        overhead: 0.02,
        targetDuration: 30,
        targetDurationUnit: 'minutes' as const,
      };

      const qs = serializeFileTransferUrlState(customState);
      const params = new URLSearchParams(qs.replace('?', ''));
      const parsed = parseFileTransferUrlState(params);

      assert.strictEqual(parsed.mode, customState.mode);
      assert.strictEqual(parsed.dataSize, customState.dataSize);
      assert.strictEqual(parsed.dataSizeUnit, customState.dataSizeUnit);
      assert.strictEqual(parsed.sourceSpeed, customState.sourceSpeed);
      assert.strictEqual(parsed.sourceSpeedUnit, customState.sourceSpeedUnit);
      assert.strictEqual(parsed.interfaceSpeed, customState.interfaceSpeed);
      assert.strictEqual(parsed.interfaceSpeedUnit, customState.interfaceSpeedUnit);
      assert.strictEqual(parsed.destSpeed, customState.destSpeed);
      assert.strictEqual(parsed.destSpeedUnit, customState.destSpeedUnit);
      assert.strictEqual(parsed.efficiency, customState.efficiency);
      assert.strictEqual(parsed.fileCount, customState.fileCount);
      assert.strictEqual(parsed.overhead, customState.overhead);
    });

    it('FT-Q2: URL state fallback handling on invalid / partial params', () => {
      const params = new URLSearchParams('mode=garbage&size=-50&source=abc&eff=999');
      const parsed = parseFileTransferUrlState(params);

      assert.strictEqual(parsed.mode, DEFAULT_FILE_TRANSFER_STATE.mode);
      assert.strictEqual(parsed.dataSize, DEFAULT_FILE_TRANSFER_STATE.dataSize);
      assert.strictEqual(parsed.sourceSpeed, DEFAULT_FILE_TRANSFER_STATE.sourceSpeed);
      assert.strictEqual(parsed.efficiency, DEFAULT_FILE_TRANSFER_STATE.efficiency);
    });
  });

  // ==========================================
  // EXTREME BOUNDARIES
  // ==========================================
  describe('Extreme Boundaries', () => {
    it('FT-E1: Extreme boundary test (very large data e.g. 100 TB, high speeds e.g. 80 Gbps)', () => {
      const res = calculateFileTransferTime({
        dataSize: 100,
        dataSizeUnit: 'TB',
        sourceSpeed: 7000,
        sourceSpeedUnit: 'MB/s',
        interfaceSpeed: 80,
        interfaceSpeedUnit: 'Gbps', // 10,000 MB/s
        destinationSpeed: 5000,
        destinationSpeedUnit: 'MB/s', // Bottleneck: 5,000 MB/s
        planningEfficiencyPercent: 90,
      });

      assert.strictEqual(res.success, true);
      if (res.success) {
        assert.strictEqual(res.data.bottleneckStage, 'destination');
        assert.strictEqual(res.data.rawBottleneckMBs, 5000);
        // Effective = 5000 * 0.9 = 4,500 MB/s
        // 100,000,000 MB / 4500 MB/s = 22222.22s = 6h 10m 22s
        assert.ok(Math.abs(res.data.totalSeconds - 22222.22) < 0.1);
      }
    });
  });
});
