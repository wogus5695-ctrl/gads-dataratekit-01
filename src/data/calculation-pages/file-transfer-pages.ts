import { calculateFileTransferTime, calculateRequiredInterfaceSpeed } from '@/lib/file-transfer';
import { FileTransferPageData, FileTransferScenarioRow, RequiredInterfaceRow, NearbyLink } from './types';

function unwrap<T>(res: { success: true; data: T } | { success: false; error: string }): T {
  if (!res.success) {
    throw new Error(res.error);
  }
  return res.data;
}

interface FileTransferScenarioDef {
  slug: string;
  sizeGb: number;
  sizeFormatted: string;
  typicalWorkload: string;
  practicalConsiderations: string[];
}

const FILE_TRANSFER_DEFS: FileTransferScenarioDef[] = [
  {
    slug: '100gb',
    sizeGb: 100,
    sizeFormatted: '100 GB',
    typicalWorkload: 'game folder migrations between SSDs, 4K video project archives, and complete virtual machine exports',
    practicalConsiderations: [
      'Over Gigabit LAN (1 Gbps), transferring 100 GB takes approximately 15 minutes 41 seconds at 85% planning efficiency (bottlenecked purely by the 1 GbE cable/switch limit).',
      'Between internal NVMe PCIe 4.0 SSDs, the same 100 GB finishes in about 23 seconds (sustained at ~4,250 MB/s).',
      'If transferring tens of thousands of small source files (e.g. node_modules, codebases), filesystem directory table metadata overhead can double total transfer time compared to a single archive file.',
      'Sustained write cache exhaustion: QLC or entry-level TLC SSDs may drop to 80-120 MB/s once their internal SLC cache fills after 30-50 GB of continuous writing.',
    ],
  },
  {
    slug: '1tb',
    sizeGb: 1000,
    sizeFormatted: '1 TB',
    typicalWorkload: 'complete system drive backups, workstation mass migrations, NAS storage array rebuilds, and studio raw footage ingest',
    practicalConsiderations: [
      'Over standard Gigabit Ethernet (1 Gbps), transferring 1 TB takes roughly 2 hours 36 minutes sustained at ~106 MB/s effective.',
      'Upgrading network infrastructure to 2.5GbE drops transfer time to under 1 hour (~1h 2m), while 10GbE compresses it to under 25 minutes depending on destination drive array speed.',
      'From a traditional 5400/7200 RPM mechanical HDD (~120 MB/s), transferring 1 TB takes approximately 2 hours 43 minutes regardless of whether your network is 10GbE or Thunderbolt.',
      'Thermal throttling: sustained multi-terabyte writes generate substantial heat; uncooled M.2 NVMe drives will throttle write speeds significantly after a few minutes.',
    ],
  },
];

const PRESET_SCENARIOS = [
  {
    name: 'Internal NVMe PCIe 4.0 to NVMe PCIe 4.0',
    sourceDrive: 'NVMe Gen 4 (7,000 MB/s)',
    interfaceBus: 'PCIe 4.0 Bus (40 Gbps)',
    destinationDrive: 'NVMe Gen 4 Write (5,000 MB/s)',
    sourceSpeed: 7000,
    sourceUnit: 'MB/s' as const,
    interfaceSpeed: 40,
    interfaceUnit: 'Gbps' as const,
    destSpeed: 5000,
    destUnit: 'MB/s' as const,
  },
  {
    name: 'Internal NVMe to External USB 3.2 SSD',
    sourceDrive: 'NVMe Gen 3 (3,500 MB/s)',
    interfaceBus: 'USB 3.2 Gen 2 (10 Gbps)',
    destinationDrive: 'Portable SSD (950 MB/s)',
    sourceSpeed: 3500,
    sourceUnit: 'MB/s' as const,
    interfaceSpeed: 10,
    interfaceUnit: 'Gbps' as const,
    destSpeed: 950,
    destUnit: 'MB/s' as const,
  },
  {
    name: 'External USB 3.0 HDD to Internal NVMe SSD',
    sourceDrive: 'External 2.5" HDD (120 MB/s)',
    interfaceBus: 'USB 3.0 (5 Gbps)',
    destinationDrive: 'NVMe Gen 3 (3,000 MB/s)',
    sourceSpeed: 120,
    sourceUnit: 'MB/s' as const,
    interfaceSpeed: 5,
    interfaceUnit: 'Gbps' as const,
    destSpeed: 3000,
    destUnit: 'MB/s' as const,
  },
  {
    name: 'PC to Gigabit Ethernet NAS (1 GbE)',
    sourceDrive: 'SATA SSD (500 MB/s)',
    interfaceBus: '1 Gbps Gigabit LAN',
    destinationDrive: 'NAS RAID 5 (350 MB/s)',
    sourceSpeed: 500,
    sourceUnit: 'MB/s' as const,
    interfaceSpeed: 1,
    interfaceUnit: 'Gbps' as const,
    destSpeed: 350,
    destUnit: 'MB/s' as const,
  },
  {
    name: 'PC to 2.5GbE Multi-Gigabit NAS',
    sourceDrive: 'SATA SSD (500 MB/s)',
    interfaceBus: '2.5 Gbps Network',
    destinationDrive: 'NAS RAID 5 (350 MB/s)',
    sourceSpeed: 500,
    sourceUnit: 'MB/s' as const,
    interfaceSpeed: 2.5,
    interfaceUnit: 'Gbps' as const,
    destSpeed: 350,
    destUnit: 'MB/s' as const,
  },
  {
    name: 'PC to 10GbE High-Speed NAS',
    sourceDrive: 'NVMe SSD (3,500 MB/s)',
    interfaceBus: '10 Gbps Network',
    destinationDrive: 'Fast NAS Array (750 MB/s)',
    sourceSpeed: 3500,
    sourceUnit: 'MB/s' as const,
    interfaceSpeed: 10,
    interfaceUnit: 'Gbps' as const,
    destSpeed: 750,
    destUnit: 'MB/s' as const,
  },
];

const TARGET_DEADLINES = [
  { label: '5 Minutes', seconds: 300 },
  { label: '15 Minutes', seconds: 900 },
  { label: '30 Minutes', seconds: 1800 },
  { label: '1 Hour', seconds: 3600 },
  { label: '2 Hours', seconds: 7200 },
];

export function getFileTransferPageData(slug: string): FileTransferPageData | null {
  const def = FILE_TRANSFER_DEFS.find((d) => d.slug === slug);
  if (!def) return null;

  // Run calculation engine for all 6 hardware pipelines at 85% planning efficiency
  const scenarios: FileTransferScenarioRow[] = PRESET_SCENARIOS.map((sc) => {
    const res = unwrap(calculateFileTransferTime({
      dataSize: def.sizeGb,
      dataSizeUnit: 'GB',
      sourceSpeed: sc.sourceSpeed,
      sourceSpeedUnit: sc.sourceUnit,
      interfaceSpeed: sc.interfaceSpeed,
      interfaceSpeedUnit: sc.interfaceUnit,
      destinationSpeed: sc.destSpeed,
      destinationSpeedUnit: sc.destUnit,
      planningEfficiencyPercent: 85,
      fileCount: 1,
      perFileOverheadSeconds: 0,
    }));

    return {
      scenarioName: sc.name,
      sourceDrive: sc.sourceDrive,
      interfaceBus: sc.interfaceBus,
      destinationDrive: sc.destinationDrive,
      bottleneckStage: res.bottleneckStageLabel,
      sustainedThroughput: res.effectiveThroughputFormatted,
      transferDuration: res.formattedDurationShort,
    };
  });

  // Calculate required interface speed across standard targets (assuming SSD to SSD)
  const requiredInterfaceRows: RequiredInterfaceRow[] = TARGET_DEADLINES.map((d) => {
    const res = calculateRequiredInterfaceSpeed({
      dataSize: def.sizeGb,
      dataSizeUnit: 'GB',
      targetDurationSeconds: d.seconds,
      sourceSpeed: 3500,
      sourceSpeedUnit: 'MB/s',
      destinationSpeed: 1000,
      destinationSpeedUnit: 'MB/s',
      targetSpeedUnit: 'Gbps',
      planningEfficiencyPercent: 85,
    });

    if (!res.success || !res.data) {
      return {
        deadlineLabel: d.label,
        targetSeconds: d.seconds,
        requiredInterfaceSpeed: 'N/A',
        isFeasible: false,
        notes: 'Target window is too short for physical hardware limits.',
      };
    }

    const data = res.data;
    return {
      deadlineLabel: d.label,
      targetSeconds: d.seconds,
      requiredInterfaceSpeed: data.requiredRawInterfaceSpeedFormatted,
      isFeasible: data.isFeasible,
      notes: data.isFeasible
        ? `Requires at least ${data.requiredRawInterfaceSpeedFormatted} interface bandwidth.`
        : `Destination write ceiling (${data.storageCeilingMBs} MB/s) prevents completing within ${d.label}.`,
    };
  });

  // Baseline scenario for immediate direct answer: PC to Gigabit Ethernet NAS (1 GbE)
  const baseline = scenarios.find((s) => s.scenarioName.includes('Gigabit Ethernet')) || scenarios[3];

  const nearbyPages: NearbyLink[] = FILE_TRANSFER_DEFS.filter((d) => d.slug !== slug).map((d) => ({
    slug: d.slug,
    label: `${d.sizeFormatted} File Transfer Time`,
    href: `/file-transfer-time/${d.slug}`,
    description: `Evaluate multi-stage transfer bottlenecks and duration for ${d.sizeFormatted} across SSD, USB, and NAS.`,
  }));

  const calculatorQuery = `?mode=time&size=${def.sizeGb}&sUnit=GB&source=500&sUnitSpeed=MB%2Fs&interface=1&iUnit=Gbps&dest=350&dUnit=MB%2Fs&eff=85`;

  return {
    slug: def.slug,
    sizeGb: def.sizeGb,
    sizeFormatted: def.sizeFormatted,
    title: `How Long Does It Take to Transfer ${def.sizeFormatted}? SSD, USB & LAN Guide`,
    metaDescription: `Compare ${def.sizeFormatted} transfer times across NVMe SSDs, USB 3.0 drives, 1GbE, 2.5GbE, and 10GbE NAS connections with 3-stage bottleneck diagnosis.`,
    h1: `How Long Does It Take to Transfer ${def.sizeFormatted}?`,
    directAnswerSummary: `Transferring ${def.sizeFormatted} over standard Gigabit Ethernet (1 Gbps) takes approximately ${baseline.transferDuration} at 85% planning efficiency (${baseline.sustainedThroughput}), limited by the 1 Gbps network bus. Between internal NVMe PCIe 4.0 SSDs, the transfer completes in just ${scenarios[0].transferDuration}.`,
    baselineScenarioName: baseline.scenarioName,
    baselineDuration: baseline.transferDuration,
    baselineThroughput: baseline.sustainedThroughput,
    baselineBottleneck: baseline.bottleneckStage,
    contextNotes: [
      `A ${def.sizeFormatted} transfer workload typically represents ${def.typicalWorkload}.`,
      ...def.practicalConsiderations,
    ],
    scenarios,
    requiredInterfaceRows,
    calculatorQuery,
    nearbyPages,
  };
}

export const FILE_TRANSFER_PAGES: FileTransferPageData[] = FILE_TRANSFER_DEFS.map((d) => getFileTransferPageData(d.slug)!);
