import { calculateDownloadTime } from '@/lib/download';
import {
  DownloadSpeedPageData,
  DownloadSpeedFileSizeRow,
  TimeWindowCapacityRow,
  NearbyLink,
} from './types';

function unwrap<T>(res: { success: true; data: T } | { success: false; error: string }): T {
  if (!res.success) {
    throw new Error(res.error);
  }
  return res.data;
}

interface SpeedDef {
  slug: string;
  speed: number;
  unit: 'Mbps' | 'Gbps';
  speedFormatted: string;
  speedMbps: number;
  nominalMBs: number;
  planningEfficiencyPercent: number;
  thresholdObservations: string[];
}

const SPEED_DEFS: SpeedDef[] = [
  {
    slug: '50mbps',
    speed: 50,
    unit: 'Mbps',
    speedFormatted: '50 Mbps',
    speedMbps: 50,
    nominalMBs: 6.25,
    planningEfficiencyPercent: 90,
    thresholdObservations: [
      'A 50 Mbps connection delivers approximately 5.63 MB/s of usable sustained throughput at 90% planning efficiency.',
      'Small to mid-sized files (1 GB to 10 GB) complete comfortably in 2 to 30 minutes, making everyday browsing and HD video streaming smooth.',
      'Large modern video games (100 GB) or disk images require nearly 5 hours (approx. 4h 56m) at 50 Mbps, making overnight scheduling necessary.',
      'Concurrent household usage: If someone streams a 4K video (20-25 Mbps) or takes video calls, available download bandwidth can drop to 25 Mbps, doubling remaining download times.',
    ],
  },
  {
    slug: '100mbps',
    speed: 100,
    unit: 'Mbps',
    speedFormatted: '100 Mbps',
    speedMbps: 100,
    nominalMBs: 12.5,
    planningEfficiencyPercent: 90,
    thresholdObservations: [
      'At 100 Mbps, sustained download throughput reaches roughly 11.25 MB/s at 90% planning efficiency (12.5 MB/s theoretical line rate).',
      'Milestone milestones: 10 GB downloads in under 15 minutes (14m 49s), 100 GB completes in nearly 2.5 hours (2h 28m 9s), while 1 TB requires over 24 hours (24h 41m).',
      '100 Mbps represents standard entry-level fiber or mid-tier cable broadband, providing enough throughput for simultaneous gaming and 4K streaming.',
      'Wi-Fi interference on 2.4 GHz bands often limits real-world throughput below 70 Mbps; using 5 GHz Wi-Fi or wired Ethernet ensures full 100 Mbps line utilization.',
    ],
  },
  {
    slug: '300mbps',
    speed: 300,
    unit: 'Mbps',
    speedFormatted: '300 Mbps',
    speedMbps: 300,
    nominalMBs: 37.5,
    planningEfficiencyPercent: 90,
    thresholdObservations: [
      'A 300 Mbps tier provides approximately 33.75 MB/s of sustained planning throughput (37.5 MB/s theoretical).',
      'Large payload threshold: 50 GB modern games finish in just under 25 minutes, and 100 GB installs in approximately 49 minutes 23 seconds.',
      'At this speed, remote content distribution networks (Steam, Epic, PlayStation, Apple) may occasionally become the bottleneck if their regional edge servers throttle single-connection streams below 30 MB/s.',
      'Household resilience: Multiple active 4K streams and remote desktop sessions can run simultaneously without noticeably extending background downloads.',
    ],
  },
  {
    slug: '500mbps',
    speed: 500,
    unit: 'Mbps',
    speedFormatted: '500 Mbps',
    speedMbps: 500,
    nominalMBs: 62.5,
    planningEfficiencyPercent: 90,
    thresholdObservations: [
      '500 Mbps delivers approximately 56.25 MB/s of usable sustained data rate (62.5 MB/s theoretical line rate).',
      'Massive 100 GB game packages download in under 30 minutes (approx. 29m 38s), representing a substantial time saving over 100 Mbps lines.',
      'Hardware requirements: Ensuring router CPU capacity and Gigabit switch ports is critical; older 100 Mbps Fast Ethernet cables will cap speed at 100 Mbps.',
      'Sustained high-speed writes: Writing at 56+ MB/s places modest write load on older mechanical HDDs, but modern SATA and NVMe SSDs easily absorb this stream.',
    ],
  },
  {
    slug: '1gbps',
    speed: 1,
    unit: 'Gbps',
    speedFormatted: '1 Gbps',
    speedMbps: 1000,
    nominalMBs: 125,
    planningEfficiencyPercent: 90,
    thresholdObservations: [
      'Gigabit broadband provides 1,000 Mbps of raw bandwidth, converting to a nominal 125 MB/s line rate and roughly 112.5 MB/s sustained planning throughput.',
      'Speed milestones: A 10 GB payload downloads in under 1.5 minutes (1m 29s), 100 GB finishes in under 15 minutes (14m 49s), and an entire 1 TB archive transfers in roughly 2h 28m.',
      'Server-side delivery caps: Very few public web servers or CDN endpoints deliver 125 MB/s to a single download thread; multi-connection download managers or peer-assisted platforms are typically needed to saturate Gigabit lines.',
      'Local hardware bottlenecks: Sustained multi-gigabit downloads can cause entry-level DRAM-less SSDs to drop write speeds once their SLC write cache fills up.',
    ],
  },
];

const COMPARISON_FILE_SIZES: { label: string; sizeGb: number }[] = [
  { label: '1 GB', sizeGb: 1 },
  { label: '5 GB', sizeGb: 5 },
  { label: '10 GB', sizeGb: 10 },
  { label: '20 GB', sizeGb: 20 },
  { label: '50 GB', sizeGb: 50 },
  { label: '100 GB', sizeGb: 100 },
  { label: '500 GB', sizeGb: 500 },
  { label: '1 TB', sizeGb: 1000 },
];

const TIME_WINDOWS: { label: string; seconds: number }[] = [
  { label: '15 Minutes', seconds: 900 },
  { label: '30 Minutes', seconds: 1800 },
  { label: '1 Hour', seconds: 3600 },
  { label: '8 Hours (Overnight)', seconds: 28800 },
];

export function getDownloadSpeedPageData(slug: string): DownloadSpeedPageData | null {
  const def = SPEED_DEFS.find((d) => d.slug === slug);
  if (!def) return null;

  // Comparison file size rows using @/lib/download
  const fileSizeRows: DownloadSpeedFileSizeRow[] = COMPARISON_FILE_SIZES.map((sizeItem) => {
    const res = unwrap(
      calculateDownloadTime({
        fileSize: sizeItem.sizeGb,
        fileSizeUnit: 'GB',
        connectionSpeed: def.speed,
        connectionSpeedUnit: def.unit,
        availableBandwidthPercent: 100,
        serverCapEnabled: false,
        serverCapSpeed: 0,
        serverCapSpeedUnit: 'MB/s',
        planningEfficiencyPercent: def.planningEfficiencyPercent,
      })
    );

    return {
      fileSizeLabel: sizeItem.label,
      sizeGb: sizeItem.sizeGb,
      theoreticalDuration: res.formattedTheoreticalDurationShort,
      planningDuration: res.formattedDurationShort,
      transferSpeedMBs: res.equivalentMBsFormatted,
    };
  });

  // Time window capacity calculations: Bytes = Speed(bps) * Seconds / 8, in Decimal GB (1e9)
  const timeWindowRows: TimeWindowCapacityRow[] = TIME_WINDOWS.map((win) => {
    const theoreticalBytes = ((def.speedMbps * 1e6) / 8) * win.seconds;
    const planningBytes = theoreticalBytes * (def.planningEfficiencyPercent / 100);

    const theoreticalGb = theoreticalBytes / 1e9;
    const planningGb = planningBytes / 1e9;

    const formatGb = (gb: number): string => {
      if (gb >= 1000) {
        return `${(gb / 1000).toFixed(2)} TB (${gb.toFixed(0)} GB)`;
      }
      return `${gb >= 10 ? gb.toFixed(1) : gb.toFixed(2)} GB`;
    };

    return {
      windowLabel: win.label,
      windowSeconds: win.seconds,
      theoreticalCapacityGb: formatGb(theoreticalGb),
      planningCapacityGb: formatGb(planningGb),
    };
  });

  // 100 GB baseline for direct answer
  const baseline100gb = fileSizeRows.find((r) => r.sizeGb === 100)!;
  const baseline10gb = fileSizeRows.find((r) => r.sizeGb === 10)!;

  const nearbyPages: NearbyLink[] = SPEED_DEFS.filter((d) => d.slug !== slug).map((d) => ({
    slug: d.slug,
    label: `${d.speedFormatted} Download Times`,
    href: `/download-speed/${d.slug}`,
    description: `Examine download duration across file sizes and time-window capacities at ${d.speedFormatted}.`,
  }));

  const calculatorQuery = `?mode=time&speed=${def.speed}&unit=${def.unit}&eff=90`;

  return {
    slug: def.slug,
    speedMbps: def.speedMbps,
    speedFormatted: def.speedFormatted,
    nominalMBs: `${def.nominalMBs.toFixed(2)} MB/s`,
    effectivePlanningMBs: `${(def.nominalMBs * (def.planningEfficiencyPercent / 100)).toFixed(2)} MB/s`,
    title: `${def.speedFormatted} Download Times by File Size — Speed & Duration Guide`,
    metaDescription: `How long do downloads take at ${def.speedFormatted}? Review download durations for 1 GB to 1 TB, nominal MB/s transfer rates, and time-window capacities.`,
    h1: `${def.speedFormatted} Download Times by File Size`,
    directAnswerSummary: `At ${def.speedFormatted}, nominal download throughput is ${def.nominalMBs.toFixed(2)} MB/s (approx. ${(def.nominalMBs * 0.9).toFixed(2)} MB/s at 90% planning efficiency). A 10 GB file finishes in ${baseline10gb.planningDuration}, while a 100 GB download takes approximately ${baseline100gb.planningDuration} (${baseline100gb.theoreticalDuration} theoretical).`,
    thresholdObservations: def.thresholdObservations,
    fileSizeRows,
    timeWindowRows,
    calculatorQuery,
    nearbyPages,
  };
}

export const DOWNLOAD_SPEED_PAGES: DownloadSpeedPageData[] = SPEED_DEFS.map(
  (d) => getDownloadSpeedPageData(d.slug)!
);
