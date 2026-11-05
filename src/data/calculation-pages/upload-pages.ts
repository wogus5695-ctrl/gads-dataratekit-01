import { calculateUploadTime, calculateRequiredUploadSpeed } from '@/lib/upload';
import { UploadPageData, UploadTimeRow, RequiredUploadSpeedRow, NearbyLink } from './types';

function unwrap<T>(res: { success: true; data: T } | { success: false; error: string }): T {
  if (!res.success) {
    throw new Error(res.error);
  }
  return res.data;
}

interface UploadScenarioDef {
  slug: string;
  sizeGb: number;
  sizeFormatted: string;
  typicalUse: string;
  practicalConsiderations: string[];
}

const UPLOAD_DEFS: UploadScenarioDef[] = [
  {
    slug: '10gb',
    sizeGb: 10,
    sizeFormatted: '10 GB',
    typicalUse: '4K YouTube video uploads, raw photo shoot archives, and remote cloud backup syncs',
    practicalConsiderations: [
      'On typical asymmetric cable broadband with 20 Mbps upstream, uploading 10 GB takes about 1 hour 6 minutes at 100% saturation, or 1h 23m when reserving 20% bandwidth for household stability.',
      'Symmetric fiber connections (100 Mbps upload) finish 10 GB in just 13 to 16 minutes.',
      'Unthrottled uploads can saturate upstream buffers (bufferbloat), creating latency spikes for gaming and video calls.',
    ],
  },
  {
    slug: '20gb',
    sizeGb: 20,
    sizeFormatted: '20 GB',
    typicalUse: 'multi-part YouTube 4K uploads, professional drone footage batches, RAW photography client galleries, and software build artifacts',
    practicalConsiderations: [
      'On a standard 20 Mbps residential cable upload line, uploading 20 GB takes roughly 2 hours 13 minutes at full theoretical line rate, or approx. 2h 54m with 15% bandwidth reserved.',
      'At 10 Mbps upstream (common on entry broadband plans), 20 GB requires nearly 4.5 hours, occupying significant network capacity.',
      'Upgrading to symmetric fiber broadband (100 Mbps upload) reduces 20 GB upload duration to approximately 26 minutes.',
    ],
  },
  {
    slug: '50gb',
    sizeGb: 50,
    sizeFormatted: '50 GB',
    typicalUse: 'multi-camera event video footage, large cloud project archives, virtual machine disk exports, and creative agency asset handoffs',
    practicalConsiderations: [
      'At 20 Mbps upstream, 50 GB requires nearly 5.5 to 7 hours of continuous transmission.',
      'This payload fits comfortably within an overnight 8-hour window on a 20 Mbps connection, but requires reserving 20-30% bandwidth if uploading during business hours.',
      'Symmetric Gigabit fiber (1 Gbps upload) finishes 50 GB in under 8 minutes.',
    ],
  },
  {
    slug: '100gb',
    sizeGb: 100,
    sizeFormatted: '100 GB',
    typicalUse: 'full local workstation backups to cloud providers (Backblaze, Google Drive, AWS S3), uncompressed raw video dailies, and production database snapshots',
    practicalConsiderations: [
      'On common 20 Mbps upstream connections, uploading 100 GB takes over 11 hours (or ~14 hours with reserved capacity), exceeding a standard 8-hour overnight window.',
      'To finish 100 GB within an 8-hour overnight backup window, an upstream rate of at least 35 to 40 Mbps is required.',
      'Cloud storage ingestion rate limits (HTTP PUT chunk caps) may throttle single-stream uploads to 50-100 Mbps even on Gigabit fiber.',
    ],
  },
  {
    slug: '500gb',
    sizeGb: 500,
    sizeFormatted: '500 GB',
    typicalUse: 'large initial NAS cloud backup syncs, complete creative project asset archives, enterprise server VM snapshots, and multi-track audio/video masters',
    practicalConsiderations: [
      'Uploading 500 GB over a 20 Mbps asymmetric cable connection requires approximately 55.5 hours (over 2.3 continuous days), or nearly 70 hours with network reserve.',
      'On 100 Mbps symmetric fiber, 500 GB completes in roughly 11 hours 6 minutes, making overnight or weekend batch windows realistic.',
      'Gigabit fiber (1 Gbps upstream) compresses 500 GB to approximately 1 hour 6 minutes at full line saturation.',
      'Sustained multi-day uploads risk residential ISP throttling or automated session resets; using pause/resume capable protocols (e.g., rsync, AWS S3 multipart upload) is strongly recommended.',
    ],
  },
  {
    slug: '1tb',
    sizeGb: 1000,
    sizeFormatted: '1 TB',
    typicalUse: 'initial cloud backup seeding, offsite disaster recovery mirroring, entire storage drive migrations, and post-production studio archives',
    practicalConsiderations: [
      'At 20 Mbps upload, transferring 1 TB takes more than 4.5 continuous days (111 to 138 hours).',
      'At 100 Mbps upstream, 1 TB still requires over 22 to 27 hours of uninterrupted transmission.',
      'Even on 1 Gbps symmetric fiber, uploading 1 TB takes roughly 2 hours 13 minutes at full throughput.',
      'Many cloud providers impose daily ingestion limits (e.g. Google Drive 750 GB/day upload limit), requiring multi-day staged batch uploads.',
    ],
  },
  {
    slug: '2tb',
    sizeGb: 2000,
    sizeFormatted: '2 TB',
    typicalUse: 'complete drive mirror seeding, enterprise disaster recovery archives, massive historical video libraries, and multi-terabyte database migrations',
    practicalConsiderations: [
      'Uploading 2 TB over an asymmetric 20 Mbps cable plan takes over 9 days of continuous transmission (approx. 222 hours dedicated, or ~280 hours with 15% reserve).',
      'Even on 100 Mbps fiber upload, 2 TB requires nearly 44.5 hours (almost 2 full days of nonstop transfer).',
      'On Gigabit symmetric fiber (1 Gbps), 2 TB completes in approximately 4 hours 26 minutes.',
      'Daily cloud provider ingest throttles (such as Google Drive 750 GB/day ceiling) will force a 2 TB upload to be spread across a minimum of 3 consecutive days regardless of line speed.',
    ],
  },
];

const COMPARISON_SPEEDS: { label: string; speed: number; unit: 'Mbps' | 'Gbps' }[] = [
  { label: '5 Mbps', speed: 5, unit: 'Mbps' },
  { label: '10 Mbps', speed: 10, unit: 'Mbps' },
  { label: '20 Mbps', speed: 20, unit: 'Mbps' },
  { label: '50 Mbps', speed: 50, unit: 'Mbps' },
  { label: '100 Mbps', speed: 100, unit: 'Mbps' },
  { label: '200 Mbps', speed: 200, unit: 'Mbps' },
  { label: '500 Mbps', speed: 500, unit: 'Mbps' },
  { label: '1 Gbps', speed: 1, unit: 'Gbps' },
];

const TARGET_DEADLINES: { label: string; seconds: number }[] = [
  { label: '30 Minutes', seconds: 1800 },
  { label: '1 Hour', seconds: 3600 },
  { label: '2 Hours', seconds: 7200 },
  { label: '4 Hours', seconds: 14400 },
  { label: '8 Hours (Overnight)', seconds: 28800 },
  { label: '24 Hours (Full Day)', seconds: 86400 },
];

export function getUploadPageData(slug: string): UploadPageData | null {
  const def = UPLOAD_DEFS.find((d) => d.slug === slug);
  if (!def) return null;

  // Comparison Rows using @/lib/upload
  const comparisonRows: UploadTimeRow[] = COMPARISON_SPEEDS.map((s) => {
    // Pure payload at 100% nominal
    const pureRes = unwrap(calculateUploadTime({
      fileSize: def.sizeGb,
      fileSizeUnit: 'GB',
      speed: s.speed,
      speedUnit: s.unit,
      throughputFactorPercent: 100,
      reservedBandwidthPercent: 0,
      fileCount: 1,
      perFileOverheadSeconds: 0,
    }));

    // Planned duration with 20% reserved bandwidth for network responsiveness
    const plannedRes = unwrap(calculateUploadTime({
      fileSize: def.sizeGb,
      fileSizeUnit: 'GB',
      speed: s.speed,
      speedUnit: s.unit,
      throughputFactorPercent: 90,
      reservedBandwidthPercent: 20,
      fileCount: 1,
      perFileOverheadSeconds: 0,
    }));

    return {
      speedLabel: s.label,
      speedMbps: s.unit === 'Gbps' ? s.speed * 1000 : s.speed,
      purePayloadDuration: pureRes.formattedDurationShort,
      plannedDurationWithReserve: plannedRes.formattedDurationShort,
      effectiveThroughput: plannedRes.effectiveSpeedFormatted,
    };
  });

  // Required Speed Rows using @/lib/upload
  const requiredSpeedRows: RequiredUploadSpeedRow[] = TARGET_DEADLINES.map((d) => {
    const res = calculateRequiredUploadSpeed({
      fileSize: def.sizeGb,
      fileSizeUnit: 'GB',
      windowDurationSeconds: d.seconds,
      targetSpeedUnit: 'Mbps',
      throughputFactorPercent: 90,
      reservedBandwidthPercent: 15,
      fileCount: 1,
      perFileOverheadSeconds: 0,
    });

    if (!res.success || !res.data) {
      return {
        deadlineLabel: d.label,
        targetSeconds: d.seconds,
        requiredEffectiveSpeed: 'N/A',
        requiredNominalSpeed: 'N/A',
        isFeasible: false,
      };
    }

    const data = res.data;
    return {
      deadlineLabel: d.label,
      targetSeconds: d.seconds,
      requiredEffectiveSpeed: data.requiredEffectiveSpeedFormatted,
      requiredNominalSpeed: data.requiredNominalSpeedFormatted,
      isFeasible: true,
    };
  });

  // Default baseline for direct answer: 20 Mbps upstream (common cable broadband)
  const defaultBaseline = unwrap(calculateUploadTime({
    fileSize: def.sizeGb,
    fileSizeUnit: 'GB',
    speed: 20,
    speedUnit: 'Mbps',
    throughputFactorPercent: 90,
    reservedBandwidthPercent: 15,
    fileCount: 1,
    perFileOverheadSeconds: 0,
  }));

  const pureBaseline = unwrap(calculateUploadTime({
    fileSize: def.sizeGb,
    fileSizeUnit: 'GB',
    speed: 20,
    speedUnit: 'Mbps',
    throughputFactorPercent: 100,
    reservedBandwidthPercent: 0,
    fileCount: 1,
    perFileOverheadSeconds: 0,
  }));

  // Nearby links (all other upload pilot pages)
  const nearbyPages: NearbyLink[] = UPLOAD_DEFS.filter((d) => d.slug !== slug).map((d) => ({
    slug: d.slug,
    label: `${d.sizeFormatted} Upload Time`,
    href: `/upload-time/${d.slug}`,
    description: `Estimate upstream duration for ${d.sizeFormatted} across asymmetric broadband speeds.`,
  }));

  const calculatorQuery = `?mode=time&size=${def.sizeGb}&sUnit=GB&speed=20&unit=Mbps&eff=90&reserve=15`;

  return {
    slug: def.slug,
    sizeGb: def.sizeGb,
    sizeFormatted: def.sizeFormatted,
    title: `How Long Does ${def.sizeFormatted} Take to Upload? Speed & Duration Guide`,
    metaDescription: `Calculate upload duration for ${def.sizeFormatted} at 5 Mbps, 10 Mbps, 20 Mbps, 100 Mbps, and 1 Gbps with bandwidth reserve planning and deadline calculations.`,
    h1: `How Long Does ${def.sizeFormatted} Take to Upload?`,
    directAnswerSummary: `On a typical 20 Mbps home cable upstream connection, uploading ${def.sizeFormatted} takes approximately ${defaultBaseline.formattedDurationShort} with 15% bandwidth reserved for network responsiveness (${pureBaseline.formattedDurationShort} at 100% dedicated line rate). On 100 Mbps fiber upload, it takes roughly ${comparisonRows.find((r) => r.speedLabel === '100 Mbps')?.plannedDurationWithReserve || 'under 20 minutes'}.`,
    defaultSpeedLabel: '20 Mbps',
    defaultPlannedDuration: defaultBaseline.formattedDuration,
    defaultPayloadDuration: pureBaseline.formattedDuration,
    defaultEffectiveSpeed: defaultBaseline.effectiveSpeedFormatted,
    contextNotes: [
      `A ${def.sizeFormatted} payload typically represents ${def.typicalUse}.`,
      ...def.practicalConsiderations,
    ],
    comparisonRows,
    requiredSpeedRows,
    calculatorQuery,
    nearbyPages,
  };
}

export const UPLOAD_PAGES: UploadPageData[] = UPLOAD_DEFS.map((d) => getUploadPageData(d.slug)!);
