import { calculateFileTransferTime } from '@/lib/file-transfer';
import {
  FileTransferScenarioPageData,
  ScenarioHardwareRow,
  ScenarioSizeComparisonRow,
  NearbyLink,
} from './types';

function unwrap<T>(res: { success: true; data: T } | { success: false; error: string }): T {
  if (!res.success) {
    throw new Error(res.error);
  }
  return res.data;
}

export function getFileTransferScenarioData(slug: string): FileTransferScenarioPageData | null {
  if (slug === 'ssd-to-hdd') {
    // 3 distinct hardware pipelines representing SSD to HDD transfers
    const pipelines = [
      {
        name: 'Internal SATA SSD to 3.5" Desktop HDD',
        sourceRead: 'SATA SSD (500 MB/s)',
        interfaceBus: 'SATA III (6 Gbps)',
        destWrite: 'Fast 3.5" HDD (180 MB/s)',
        sSpeed: 500,
        iSpeed: 6,
        iUnit: 'Gbps' as const,
        dSpeed: 180,
      },
      {
        name: 'NVMe SSD to External USB 3.0 Portable HDD',
        sourceRead: 'NVMe SSD (3,500 MB/s)',
        interfaceBus: 'USB 3.0 (5 Gbps)',
        destWrite: '2.5" Portable HDD (120 MB/s)',
        sSpeed: 3500,
        iSpeed: 5,
        iUnit: 'Gbps' as const,
        dSpeed: 120,
      },
      {
        name: 'NVMe SSD to Shingled (SMR) Archive HDD',
        sourceRead: 'NVMe SSD (3,500 MB/s)',
        interfaceBus: 'SATA III (6 Gbps)',
        destWrite: 'SMR HDD Write (80 MB/s)',
        sSpeed: 3500,
        iSpeed: 6,
        iUnit: 'Gbps' as const,
        dSpeed: 80,
      },
    ];

    const hardwareRows: ScenarioHardwareRow[] = pipelines.map((p) => {
      const res100g = unwrap(
        calculateFileTransferTime({
          dataSize: 100,
          dataSizeUnit: 'GB',
          sourceSpeed: p.sSpeed,
          sourceSpeedUnit: 'MB/s',
          interfaceSpeed: p.iSpeed,
          interfaceSpeedUnit: p.iUnit,
          destinationSpeed: p.dSpeed,
          destinationSpeedUnit: 'MB/s',
          planningEfficiencyPercent: 85,
        })
      );

      const res1t = unwrap(
        calculateFileTransferTime({
          dataSize: 1000,
          dataSizeUnit: 'GB',
          sourceSpeed: p.sSpeed,
          sourceSpeedUnit: 'MB/s',
          interfaceSpeed: p.iSpeed,
          interfaceSpeedUnit: p.iUnit,
          destinationSpeed: p.dSpeed,
          destinationSpeedUnit: 'MB/s',
          planningEfficiencyPercent: 85,
        })
      );

      return {
        scenarioName: p.name,
        sourceRead: p.sourceRead,
        interfaceBus: p.interfaceBus,
        destinationWrite: p.destWrite,
        limitingBottleneck: res100g.bottleneckStageLabel,
        effectiveMBs: res100g.effectiveThroughputFormatted,
        transferDuration100GB: res100g.formattedDurationShort,
        transferDuration1TB: res1t.formattedDurationShort,
      };
    });

    const sizes = [
      { label: '100 GB', sizeGb: 100 },
      { label: '500 GB', sizeGb: 500 },
      { label: '1 TB', sizeGb: 1000 },
      { label: '2 TB', sizeGb: 2000 },
    ];

    const sizeRows: ScenarioSizeComparisonRow[] = sizes.map((s) => {
      // standard: 180 MB/s HDD
      const standard = unwrap(
        calculateFileTransferTime({
          dataSize: s.sizeGb,
          dataSizeUnit: 'GB',
          sourceSpeed: 500,
          sourceSpeedUnit: 'MB/s',
          interfaceSpeed: 6,
          interfaceSpeedUnit: 'Gbps',
          destinationSpeed: 180,
          destinationSpeedUnit: 'MB/s',
          planningEfficiencyPercent: 85,
        })
      );

      // worst-case: 80 MB/s SMR HDD
      const worst = unwrap(
        calculateFileTransferTime({
          dataSize: s.sizeGb,
          dataSizeUnit: 'GB',
          sourceSpeed: 500,
          sourceSpeedUnit: 'MB/s',
          interfaceSpeed: 6,
          interfaceSpeedUnit: 'Gbps',
          destinationSpeed: 80,
          destinationSpeedUnit: 'MB/s',
          planningEfficiencyPercent: 85,
        })
      );

      // optimal fast CMR drive: 240 MB/s HDD
      const optimal = unwrap(
        calculateFileTransferTime({
          dataSize: s.sizeGb,
          dataSizeUnit: 'GB',
          sourceSpeed: 500,
          sourceSpeedUnit: 'MB/s',
          interfaceSpeed: 6,
          interfaceSpeedUnit: 'Gbps',
          destinationSpeed: 240,
          destinationSpeedUnit: 'MB/s',
          planningEfficiencyPercent: 85,
        })
      );

      return {
        sizeLabel: s.label,
        sizeGb: s.sizeGb,
        standardDuration: standard.formattedDurationShort,
        worstCaseDuration: worst.formattedDurationShort,
        optimalDuration: optimal.formattedDurationShort,
      };
    });

    const nearbyPages: NearbyLink[] = [
      {
        slug: 'ssd-to-ssd',
        label: 'SSD to SSD Transfer Time',
        href: '/file-transfer-time/ssd-to-ssd',
        description: 'Compare transfer speeds between SATA, NVMe, and portable external SSDs.',
      },
      {
        slug: '100gb',
        label: '100 GB File Transfer Time',
        href: '/file-transfer-time/100gb',
        description: 'Examine 100 GB hardware bottleneck benchmarks across storage devices.',
      },
      {
        slug: '1tb',
        label: '1 TB File Transfer Time',
        href: '/file-transfer-time/1tb',
        description: 'Calculate 1 TB backup durations across USB, internal SATA, and NAS.',
      },
    ];

    return {
      slug: 'ssd-to-hdd',
      scenarioTitle: 'SSD to HDD File Transfer',
      scenarioType: 'ssd-to-hdd',
      title: 'SSD to HDD Transfer Time & Bottleneck Guide',
      metaDescription: 'How long does an SSD to HDD file transfer take? Compare transfer durations for 100 GB to 2 TB across mechanical drive write ceilings and USB vs SATA interfaces.',
      h1: 'How Long Does an SSD to HDD File Transfer Take?',
      directAnswerSummary: 'In an SSD to HDD transfer, the destination mechanical hard drive is virtually always the primary bottleneck. Even though your source SSD can read at 500 to 3,500+ MB/s, standard 3.5" desktop HDDs sustain roughly 140 to 200 MB/s write speeds (~120 to 170 MB/s at 85% planning efficiency). Consequently, 100 GB takes approximately 10m 54s, and 1 TB takes roughly 1h 48m 59s.',
      baselineExplanation: [
        'Destination Write Bottleneck: Solid state drives read data drastically faster than mechanical platters can physically write magnetic tracks.',
        'SMR vs CMR Platters: Shingled Magnetic Recording (SMR) drives slow down to 40-80 MB/s once their internal write cache fills during large continuous transfers (100GB+).',
        'USB Interface Overhead: External USB enclosures add protocol translation delays, further reducing mechanical drive throughput by 10% to 15%.',
        'Preset Notice: Speeds below reflect representative hardware planning models, not guaranteed benchmarks.',
      ],
      hardwareRows,
      sizeRows,
      calculatorQuery: '?mode=time&size=100&sUnit=GB&source=500&sUnitSpeed=MB%2Fs&interface=6&iUnit=Gbps&dest=180&dUnit=MB%2Fs&eff=85',
      nearbyPages,
    };
  }

  if (slug === 'ssd-to-ssd') {
    // 3 distinct SSD-to-SSD hardware pipelines
    const pipelines = [
      {
        name: 'Internal SATA SSD to Internal SATA SSD',
        sourceRead: 'SATA III SSD (500 MB/s)',
        interfaceBus: 'SATA III Bus (6 Gbps)',
        destWrite: 'SATA III SSD (450 MB/s)',
        sSpeed: 500,
        iSpeed: 6,
        iUnit: 'Gbps' as const,
        dSpeed: 450,
      },
      {
        name: 'Internal NVMe to External USB 3.2 Gen 2 SSD',
        sourceRead: 'NVMe Gen 3 (3,500 MB/s)',
        interfaceBus: 'USB 3.2 Gen 2 (10 Gbps)',
        destWrite: 'Portable SSD (950 MB/s)',
        sSpeed: 3500,
        iSpeed: 10,
        iUnit: 'Gbps' as const,
        dSpeed: 950,
      },
      {
        name: 'Gen4 NVMe to Gen4 NVMe (High-Speed PCIe)',
        sourceRead: 'PCIe 4.0 NVMe (7,000 MB/s)',
        interfaceBus: 'PCIe 4.0 Bus (40 Gbps)',
        destWrite: 'PCIe 4.0 NVMe (5,000 MB/s)',
        sSpeed: 7000,
        iSpeed: 40,
        iUnit: 'Gbps' as const,
        dSpeed: 5000,
      },
    ];

    const hardwareRows: ScenarioHardwareRow[] = pipelines.map((p) => {
      const res100g = unwrap(
        calculateFileTransferTime({
          dataSize: 100,
          dataSizeUnit: 'GB',
          sourceSpeed: p.sSpeed,
          sourceSpeedUnit: 'MB/s',
          interfaceSpeed: p.iSpeed,
          interfaceSpeedUnit: p.iUnit,
          destinationSpeed: p.dSpeed,
          destinationSpeedUnit: 'MB/s',
          planningEfficiencyPercent: 85,
        })
      );

      const res1t = unwrap(
        calculateFileTransferTime({
          dataSize: 1000,
          dataSizeUnit: 'GB',
          sourceSpeed: p.sSpeed,
          sourceSpeedUnit: 'MB/s',
          interfaceSpeed: p.iSpeed,
          interfaceSpeedUnit: p.iUnit,
          destinationSpeed: p.dSpeed,
          destinationSpeedUnit: 'MB/s',
          planningEfficiencyPercent: 85,
        })
      );

      return {
        scenarioName: p.name,
        sourceRead: p.sourceRead,
        interfaceBus: p.interfaceBus,
        destinationWrite: p.destWrite,
        limitingBottleneck: res100g.bottleneckStageLabel,
        effectiveMBs: res100g.effectiveThroughputFormatted,
        transferDuration100GB: res100g.formattedDurationShort,
        transferDuration1TB: res1t.formattedDurationShort,
      };
    });

    const sizes = [
      { label: '100 GB', sizeGb: 100 },
      { label: '500 GB', sizeGb: 500 },
      { label: '1 TB', sizeGb: 1000 },
      { label: '2 TB', sizeGb: 2000 },
    ];

    const sizeRows: ScenarioSizeComparisonRow[] = sizes.map((s) => {
      // SATA to SATA (~382.5 MB/s effective)
      const sata = unwrap(
        calculateFileTransferTime({
          dataSize: s.sizeGb,
          dataSizeUnit: 'GB',
          sourceSpeed: 500,
          sourceSpeedUnit: 'MB/s',
          interfaceSpeed: 6,
          interfaceSpeedUnit: 'Gbps',
          destinationSpeed: 450,
          destinationSpeedUnit: 'MB/s',
          planningEfficiencyPercent: 85,
        })
      );

      // USB 3.2 External SSD (~807.5 MB/s effective)
      const usbExternal = unwrap(
        calculateFileTransferTime({
          dataSize: s.sizeGb,
          dataSizeUnit: 'GB',
          sourceSpeed: 3500,
          sourceSpeedUnit: 'MB/s',
          interfaceSpeed: 10,
          interfaceSpeedUnit: 'Gbps',
          destinationSpeed: 950,
          destinationSpeedUnit: 'MB/s',
          planningEfficiencyPercent: 85,
        })
      );

      // Dual Gen4 NVMe (~4,250 MB/s effective)
      const dualNvme = unwrap(
        calculateFileTransferTime({
          dataSize: s.sizeGb,
          dataSizeUnit: 'GB',
          sourceSpeed: 7000,
          sourceSpeedUnit: 'MB/s',
          interfaceSpeed: 40,
          interfaceSpeedUnit: 'Gbps',
          destinationSpeed: 5000,
          destinationSpeedUnit: 'MB/s',
          planningEfficiencyPercent: 85,
        })
      );

      return {
        sizeLabel: s.label,
        sizeGb: s.sizeGb,
        standardDuration: usbExternal.formattedDurationShort,
        worstCaseDuration: sata.formattedDurationShort,
        optimalDuration: dualNvme.formattedDurationShort,
      };
    });

    const nearbyPages: NearbyLink[] = [
      {
        slug: 'ssd-to-hdd',
        label: 'SSD to HDD Transfer Time',
        href: '/file-transfer-time/ssd-to-hdd',
        description: 'Diagnose mechanical drive bottlenecks when offloading SSD data.',
      },
      {
        slug: '100gb',
        label: '100 GB File Transfer Time',
        href: '/file-transfer-time/100gb',
        description: 'Examine 100 GB hardware bottleneck benchmarks across storage devices.',
      },
      {
        slug: '1tb',
        label: '1 TB File Transfer Time',
        href: '/file-transfer-time/1tb',
        description: 'Calculate 1 TB backup durations across USB, internal SATA, and NAS.',
      },
    ];

    return {
      slug: 'ssd-to-ssd',
      scenarioTitle: 'SSD to SSD File Transfer',
      scenarioType: 'ssd-to-ssd',
      title: 'SSD to SSD Transfer Time & Speed Comparison Guide',
      metaDescription: 'How long does an SSD to SSD transfer take? Compare SATA III, USB 3.2 portable SSD, and high-speed PCIe 4.0 NVMe transfer rates for 100 GB to 2 TB.',
      h1: 'How Long Does an SSD to SSD File Transfer Take?',
      directAnswerSummary: 'SSD to SSD transfers are dictated by the slowest link between the source drive read, interface bus, and target drive write. Between internal SATA SSDs (capped at ~450 MB/s write), 100 GB takes approximately 4m 21s. Moving to a portable USB 3.2 Gen 2 SSD drops 100 GB to roughly 2m 4s, while dual internal PCIe 4.0 NVMe drives transfer 100 GB in under 24 seconds.',
      baselineExplanation: [
        'Interface Bus Limits: USB 3.0 (5 Gbps) caps SSDs at ~425 MB/s, while USB 3.2 Gen 2 (10 Gbps) permits up to ~950 MB/s throughput.',
        'SLC Cache Exhaustion: Consumer DRAM-less SSDs write fast initially, but multi-hundred gigabyte transfers can fill the dynamic SLC write buffer, dropping write rates by 50% or more.',
        'PCIe Multi-Lane Direct Paths: Internal M.2 NVMe drives transfer over motherboard PCIe lanes without USB controller overhead, achieving multi-gigabyte-per-second transfers.',
        'Preset Notice: Speeds below reflect representative hardware planning models, not guaranteed benchmarks.',
      ],
      hardwareRows,
      sizeRows,
      calculatorQuery: '?mode=time&size=100&sUnit=GB&source=3500&sUnitSpeed=MB%2Fs&interface=10&iUnit=Gbps&dest=950&dUnit=MB%2Fs&eff=85',
      nearbyPages,
    };
  }

  return null;
}

export const FILE_TRANSFER_SCENARIOS = ['ssd-to-hdd', 'ssd-to-ssd'] as const;
