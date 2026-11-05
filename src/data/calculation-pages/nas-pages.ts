import { calculateFileTransferTime } from '@/lib/file-transfer';
import {
  NasTransferPageData,
  NasSizeTransferRow,
  NearbyLink,
} from './types';

function unwrap<T>(res: { success: true; data: T } | { success: false; error: string }): T {
  if (!res.success) {
    throw new Error(res.error);
  }
  return res.data;
}

interface NasDef {
  slug: string;
  interfaceLabel: string;
  nominalSpeedGbps: number;
  nominalSpeedMBs: number;
  planningEfficiencyPercent: number;
  storageBottleneckWarnings: string[];
}

const NAS_DEFS: NasDef[] = [
  {
    slug: '1gbe',
    interfaceLabel: '1GbE (Gigabit Ethernet)',
    nominalSpeedGbps: 1,
    nominalSpeedMBs: 125,
    planningEfficiencyPercent: 85,
    storageBottleneckWarnings: [
      '1GbE saturation: 1 Gbps provides a raw line ceiling of 125 MB/s and delivers roughly 106 to 112 MB/s in real-world SMB/NFS file transfers after TCP and protocol overhead.',
      'Storage compatibility: Almost any standard SATA SSD (500 MB/s) or modern 3.5-inch hard drive array easily saturates a 1GbE connection, making the 1 Gbps network interface the primary bottleneck.',
      'Jumbo frames impact: Enabling 9K Jumbo Frames on Gigabit LAN reduces packet overhead marginally (typically 2-4%), but provides less relative gain than on 10GbE networks.',
    ],
  },
  {
    slug: '2-5gbe',
    interfaceLabel: '2.5GbE (Multi-Gigabit Ethernet)',
    nominalSpeedGbps: 2.5,
    nominalSpeedMBs: 312.5,
    planningEfficiencyPercent: 85,
    storageBottleneckWarnings: [
      '2.5GbE throughput: 2.5 Gbps raises the network ceiling to 312.5 MB/s, sustaining approximately 265 MB/s of real-world file transfer speed at 85% planning efficiency.',
      'Mechanical HDD limitation: A single mechanical hard drive typically writes at 140 to 200 MB/s. Writing to a single mechanical disk will bottle the transfer at the drive, preventing full 2.5GbE network saturation unless writing to an SSD cache or multi-drive RAID array.',
      'Cabling compatibility: 2.5GbE operates reliably over existing standard Cat 5e and Cat 6 copper network cables up to 100 meters, making it a cost-effective upgrade over Gigabit Ethernet.',
    ],
  },
  {
    slug: '10gbe',
    interfaceLabel: '10GbE (10-Gigabit Ethernet)',
    nominalSpeedGbps: 10,
    nominalSpeedMBs: 1250,
    planningEfficiencyPercent: 85,
    storageBottleneckWarnings: [
      '10GbE line capacity: 10 Gbps provides a massive 1,250 MB/s theoretical bandwidth ceiling, sustaining over 1,060 MB/s at 85% planning throughput.',
      'SATA SSD bottleneck: Standard SATA III SSDs max out around 550 MB/s. To actually saturate a 10GbE network link, both the source PC and target NAS must use NVMe PCIe SSDs or wide multi-drive RAID arrays (e.g., 6+ disk RAID 0/5/10).',
      'Network overhead & CPU load: 10GbE file transfers over SMB require substantial system CPU interrupts and benefit heavily from RDMA (SMB Direct), 9K Jumbo Frames, and Cat 6A or optical SFP+ cabling.',
    ],
  },
];

const NAS_SIZES: { label: string; sizeGb: number }[] = [
  { label: '100 GB', sizeGb: 100 },
  { label: '500 GB', sizeGb: 500 },
  { label: '1 TB', sizeGb: 1000 },
  { label: '2 TB', sizeGb: 2000 },
];

export function getNasPageData(slug: string): NasTransferPageData | null {
  const def = NAS_DEFS.find((d) => d.slug === slug);
  if (!def) return null;

  const planningThroughputMBs = def.nominalSpeedMBs * (def.planningEfficiencyPercent / 100);

  // Model size transfers assuming fast storage endpoints (source 3,500 MB/s, destination 1,500 MB/s)
  // so the network interface remains the limiting stage
  const sizeRows: NasSizeTransferRow[] = NAS_SIZES.map((item) => {
    const res = unwrap(
      calculateFileTransferTime({
        dataSize: item.sizeGb,
        dataSizeUnit: 'GB',
        sourceSpeed: 3500,
        sourceSpeedUnit: 'MB/s',
        interfaceSpeed: def.nominalSpeedGbps,
        interfaceSpeedUnit: 'Gbps',
        destinationSpeed: 1500,
        destinationSpeedUnit: 'MB/s',
        planningEfficiencyPercent: def.planningEfficiencyPercent,
        fileCount: 1,
        perFileOverheadSeconds: 0,
      })
    );

    return {
      dataSizeLabel: item.label,
      sizeGb: item.sizeGb,
      interfaceNominalMBs: `${def.nominalSpeedMBs.toFixed(1)} MB/s`,
      planningThroughputMBs: `${planningThroughputMBs.toFixed(1)} MB/s`,
      estimatedDuration: res.formattedDurationShort,
      bottleneckStage: res.bottleneckStageLabel,
    };
  });

  const baseline1tb = sizeRows.find((r) => r.sizeGb === 1000)!;
  const baseline100gb = sizeRows.find((r) => r.sizeGb === 100)!;

  const SPEED_LABELS: Record<string, string> = {
    '1gbe': '1GbE',
    '2-5gbe': '2.5GbE',
    '10gbe': '10GbE',
  };
  const displaySpeed = SPEED_LABELS[def.slug] || def.slug;

  const nearbyPages: NearbyLink[] = NAS_DEFS.filter((d) => d.slug !== slug).map((d) => ({
    slug: d.slug,
    label: `NAS Transfer Time Over ${SPEED_LABELS[d.slug] || d.slug}`,
    href: `/nas-transfer-time/${d.slug}`,
    description: `Evaluate multi-stage transfer bottlenecks and duration across ${d.interfaceLabel}.`,
  }));

  const calculatorQuery = `?mode=time&interface=${def.nominalSpeedGbps}&iUnit=Gbps&eff=${def.planningEfficiencyPercent}`;

  return {
    slug: def.slug,
    displaySpeed,
    interfaceLabel: def.interfaceLabel,
    nominalSpeedGbps: def.nominalSpeedGbps,
    nominalSpeedMBs: def.nominalSpeedMBs,
    planningEfficiencyPercent: def.planningEfficiencyPercent,
    planningThroughputMBs,
    title: `NAS Transfer Time Over ${displaySpeed} — Network & Speed Guide`,
    metaDescription: `How long does a NAS file transfer take over ${def.interfaceLabel}? Compare transfer durations for 100 GB to 2 TB, nominal vs usable MB/s throughput, and storage bottlenecks.`,
    h1: `How Long Does a NAS Transfer Take Over ${displaySpeed}?`,
    directAnswerSummary: `Over ${def.interfaceLabel}, the nominal interface bandwidth ceiling is ${def.nominalSpeedMBs.toFixed(1)} MB/s, delivering approximately ${planningThroughputMBs.toFixed(1)} MB/s of sustained throughput at ${def.planningEfficiencyPercent}% planning efficiency. Transferring 100 GB takes roughly ${baseline100gb.estimatedDuration}, while 1 TB transfers in approximately ${baseline1tb.estimatedDuration}, assuming local drives do not bottleneck the network.`,
    modelingPrinciples: [
      `Nominal Line Rate: ${def.nominalSpeedGbps} Gbps translates mathematically to ${(def.nominalSpeedGbps * 125).toFixed(1)} MB/s.`,
      `Protocol Overhead: Ethernet frame framing, IP routing headers, and SMB/NFS packet acknowledgments typically consume 10% to 15% of raw line rate.`,
      `Storage Endpoint Dependency: Calculations assume fast storage endpoints to isolate the network bus; if your source drive or NAS disk array writes slower than ${planningThroughputMBs.toFixed(1)} MB/s, the transfer will drop to the storage drive's write speed.`,
    ],
    sizeRows,
    storageBottleneckWarnings: def.storageBottleneckWarnings,
    calculatorQuery,
    nearbyPages,
  };
}

export const NAS_PAGES: NasTransferPageData[] = NAS_DEFS.map((d) => getNasPageData(d.slug)!);
