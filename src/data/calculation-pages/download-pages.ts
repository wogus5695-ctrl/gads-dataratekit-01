import { calculateDownloadTime, calculateRequiredDownloadSpeed } from '@/lib/download';
import { DownloadPageData, DownloadTimeRow, RequiredDownloadSpeedRow, NearbyLink } from './types';

function unwrap<T>(res: { success: true; data: T } | { success: false; error: string }): T {
  if (!res.success) {
    throw new Error(res.error);
  }
  return res.data;
}

interface DownloadScenarioDef {
  slug: string;
  sizeGb: number;
  sizeFormatted: string;
  typicalUse: string;
  practicalConsiderations: string[];
}

const DOWNLOAD_DEFS: DownloadScenarioDef[] = [
  {
    slug: '10gb',
    sizeGb: 10,
    sizeFormatted: '10 GB',
    typicalUse: 'typical HD movies, software SDKs, small game patches, and system ISO images',
    practicalConsiderations: [
      'At 100 Mbps broadband, a 10 GB file finishes in under 15 minutes (approx. 14m 49s at 90% efficiency).',
      'Remote origin throttling rarely caps 10 GB downloads compared to 100 GB+ files, making full line saturation likely.',
      'Wi-Fi packet retransmissions can extend download duration by 10-25% on 2.4 GHz connections.',
    ],
  },
  {
    slug: '50gb',
    sizeGb: 50,
    sizeFormatted: '50 GB',
    typicalUse: 'standard AAA modern games, 4K film downloads, and full PC operating system backup images',
    practicalConsiderations: [
      'On a 100 Mbps connection, 50 GB takes roughly 1 hour 14 minutes at 90% planning efficiency.',
      'Gigabit connections (1 Gbps) compress this to under 8 minutes, provided the remote game server or CDN delivers at full speed.',
      'Shared home bandwidth becomes a noticeable bottleneck: background 4K video streams can reduce available download speed by 20-30 Mbps.',
    ],
  },
  {
    slug: '100gb',
    sizeGb: 100,
    sizeFormatted: '100 GB',
    typicalUse: 'massive modern AAA video games (e.g. Baldur’s Gate 3, Call of Duty), 4K video editing media packs, and large virtual machine disks',
    practicalConsiderations: [
      'At 100 Mbps, downloading 100 GB takes nearly 2.5 hours (2h 28m at 90% planning efficiency).',
      'Upgrading to 500 Mbps drops download time to approximately 30 minutes, while Gigabit finishes in under 15 minutes.',
      'Commercial game client delivery servers (Steam, Battle.net, PlayStation Network) often cap outbound single-client speeds between 30 MB/s and 70 MB/s during peak release windows.',
    ],
  },
  {
    slug: '1tb',
    sizeGb: 1000, // 1 TB = 1,000 GB decimal
    sizeFormatted: '1 TB',
    typicalUse: 'complete drive clones, massive raw video archives, enterprise database migrations, and extensive personal media libraries',
    practicalConsiderations: [
      'A full 1 TB download takes over 24 hours (approx. 24h 41m) on a standard 100 Mbps connection.',
      'Even on Gigabit broadband (1 Gbps), transferring 1 TB requires approximately 2 hours 28 minutes at 90% sustained planning throughput.',
      'ISP monthly data caps (commonly 1.2 TB) can be almost completely exhausted by a single 1 TB download.',
      'Local drive write cache exhaustion: sustained multi-hour writes may cause consumer SSDs to drop from 500 MB/s to sub-100 MB/s once SLC cache is exhausted.',
    ],
  },
];

const COMPARISON_SPEEDS: { label: string; speed: number; unit: 'Mbps' | 'Gbps' }[] = [
  { label: '25 Mbps', speed: 25, unit: 'Mbps' },
  { label: '50 Mbps', speed: 50, unit: 'Mbps' },
  { label: '100 Mbps', speed: 100, unit: 'Mbps' },
  { label: '200 Mbps', speed: 200, unit: 'Mbps' },
  { label: '300 Mbps', speed: 300, unit: 'Mbps' },
  { label: '500 Mbps', speed: 500, unit: 'Mbps' },
  { label: '1 Gbps', speed: 1, unit: 'Gbps' },
  { label: '2.5 Gbps', speed: 2.5, unit: 'Gbps' },
];

const TARGET_DEADLINES: { label: string; seconds: number }[] = [
  { label: '15 Minutes', seconds: 900 },
  { label: '30 Minutes', seconds: 1800 },
  { label: '1 Hour', seconds: 3600 },
  { label: '2 Hours', seconds: 7200 },
  { label: '8 Hours', seconds: 28800 },
];

export function getDownloadPageData(slug: string): DownloadPageData | null {
  const def = DOWNLOAD_DEFS.find((d) => d.slug === slug);
  if (!def) return null;

  // Comparison Rows using @/lib/download
  const comparisonRows: DownloadTimeRow[] = COMPARISON_SPEEDS.map((s) => {
    const res = calculateDownloadTime({
      fileSize: def.sizeGb,
      fileSizeUnit: 'GB',
      connectionSpeed: s.speed,
      connectionSpeedUnit: s.unit,
      availableBandwidthPercent: 100,
      serverCapEnabled: false,
      serverCapSpeed: 0,
      serverCapSpeedUnit: 'MB/s',
      planningEfficiencyPercent: 90,
    });

    const data = unwrap(res);
    return {
      speedLabel: s.label,
      speedMbps: s.unit === 'Gbps' ? s.speed * 1000 : s.speed,
      theoreticalDuration: data.formattedTheoreticalDurationShort,
      planningDuration: data.formattedDurationShort,
      effectiveMBs: data.equivalentMBsFormatted,
    };
  });

  // Required Speed Rows using @/lib/download
  const requiredSpeedRows: RequiredDownloadSpeedRow[] = TARGET_DEADLINES.map((d) => {
    const res = calculateRequiredDownloadSpeed({
      fileSize: def.sizeGb,
      fileSizeUnit: 'GB',
      targetDurationSeconds: d.seconds,
      availableBandwidthPercent: 100,
      serverCapEnabled: false,
      serverCapSpeed: 0,
      serverCapSpeedUnit: 'MB/s',
      planningEfficiencyPercent: 90,
      targetSpeedUnit: 'Mbps',
    });

    const data = unwrap(res);
    return {
      deadlineLabel: d.label,
      targetSeconds: d.seconds,
      requiredEffectiveMBs: `${data.requiredEffectiveMBs.toFixed(2)} MB/s`,
      requiredInternetPlanMbps: `${data.requiredNominalConnectionSpeed.toFixed(1)} Mbps`,
      isFeasible: data.isFeasible,
    };
  });

  // Default baseline for direct answer: 100 Mbps @ 90% planning efficiency
  const defaultBaseline = unwrap(calculateDownloadTime({
    fileSize: def.sizeGb,
    fileSizeUnit: 'GB',
    connectionSpeed: 100,
    connectionSpeedUnit: 'Mbps',
    availableBandwidthPercent: 100,
    serverCapEnabled: false,
    serverCapSpeed: 0,
    serverCapSpeedUnit: 'MB/s',
    planningEfficiencyPercent: 90,
  }));

  // Nearby links (all other download pilot pages)
  const nearbyPages: NearbyLink[] = DOWNLOAD_DEFS.filter((d) => d.slug !== slug).map((d) => ({
    slug: d.slug,
    label: `${d.sizeFormatted} Download Time`,
    href: `/download-time/${d.slug}`,
    description: `Calculate download duration for ${d.sizeFormatted} across home broadband plans.`,
  }));

  const calculatorQuery = `?mode=time&size=${def.sizeGb}&sUnit=GB&speed=100&unit=Mbps&eff=90`;

  return {
    slug: def.slug,
    sizeGb: def.sizeGb,
    sizeFormatted: def.sizeFormatted,
    title: `How Long Does ${def.sizeFormatted} Take to Download? Speed Comparison | DataRateKit`,
    metaDescription: `Find out how long ${def.sizeFormatted} takes to download at 25 Mbps, 50 Mbps, 100 Mbps, 500 Mbps, and 1 Gbps, plus required speeds for target deadlines.`,
    h1: `How Long Does ${def.sizeFormatted} Take to Download?`,
    directAnswerSummary: `On a standard 100 Mbps broadband connection, downloading ${def.sizeFormatted} takes approximately ${defaultBaseline.formattedDurationShort} at 90% planning efficiency (${defaultBaseline.formattedTheoreticalDurationShort} theoretical). At 1 Gbps Gigabit speed, it takes roughly ${comparisonRows.find((r) => r.speedLabel === '1 Gbps')?.planningDuration || 'under 15 minutes'}.`,
    defaultSpeedLabel: '100 Mbps',
    defaultPlanningDuration: defaultBaseline.formattedDuration,
    defaultTheoreticalDuration: defaultBaseline.formattedTheoreticalDuration,
    defaultEffectiveSpeed: defaultBaseline.equivalentMBsFormatted,
    contextNotes: [
      `A ${def.sizeFormatted} payload represents ${def.typicalUse}.`,
      ...def.practicalConsiderations,
    ],
    comparisonRows,
    requiredSpeedRows,
    calculatorQuery,
    nearbyPages,
  };
}

export const DOWNLOAD_PAGES: DownloadPageData[] = DOWNLOAD_DEFS.map((d) => getDownloadPageData(d.slug)!);
