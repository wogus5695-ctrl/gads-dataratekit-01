import { calculateVideoFileSize, calculateRequiredVideoBitrate } from '@/lib/video';
import { VideoPageData, VideoBitrateRow, TargetStorageRow, NearbyLink } from './types';

function unwrap<T>(res: { success: true; data: T } | { success: false; error: string }): T {
  if (!res.success) {
    throw new Error(res.error);
  }
  return res.data;
}

interface VideoScenarioDef {
  slug: string;
  durationLabel: string;
  durationSeconds: number;
  audioBitrateKbps: number;
  typicalWorkload: string;
  practicalConsiderations: string[];
}

const VIDEO_DEFS: VideoScenarioDef[] = [
  {
    slug: '10-minutes',
    durationLabel: '10 Minutes',
    durationSeconds: 600,
    audioBitrateKbps: 192,
    typicalWorkload: 'short YouTube tutorials, presentation recordings, social media clips, and drone aerial takes',
    practicalConsiderations: [
      'At 1080p standard web streaming (5 Mbps video + 192 kbps audio), a 10-minute video produces approximately 389 MB.',
      'Recording in 4K at 50 Mbps on an action camera or drone results in roughly 3.76 GB for 10 minutes.',
      'FAT32 single-file limit (4 GB): 4K recordings exceeding 53 Mbps will automatically split into multiple files on FAT32-formatted SD cards before reaching 10 minutes.',
      'Bitrate mathematics calculates raw container size; perceived quality is dictated by the compression efficiency of modern codecs (e.g., AV1 and HEVC achieve higher quality than H.264 at identical bitrates).',
    ],
  },
  {
    slug: '1-hour',
    durationLabel: '1 Hour',
    durationSeconds: 3600,
    audioBitrateKbps: 320,
    typicalWorkload: 'podcast video recordings, webinars, live stream archives, conference keynotes, and documentary interviews',
    practicalConsiderations: [
      'At standard 1080p streaming bitrate (5 Mbps video + 320 kbps audio), a 1-hour recording generates roughly 2.39 GB.',
      'In high-quality 4K broadcast recording (50 Mbps), 1 hour of video consumes approximately 22.64 GB of storage.',
      'ProRes and high-bitrate mirrorless recording (100-150 Mbps) requires 45 to 68 GB per hour, demanding high-speed V60 or V90 SDXC memory cards.',
      'Variable Bitrate (VBR) vs Constant Bitrate (CBR): Static talking-head scenes may consume 30-40% less storage than high-motion gaming or sports footage at the same target bitrate profile.',
    ],
  },
];

const BITRATE_TIERS = [
  { label: '720p 30fps (Web Stream / Video Call)', videoMbps: 2 },
  { label: '1080p 30fps (Standard Web Video / YouTube)', videoMbps: 5 },
  { label: '1080p 60fps (High Quality / Gaming Capture)', videoMbps: 10 },
  { label: '4K 30fps (Standard Web Streaming)', videoMbps: 20 },
  { label: '4K 60fps (High Quality Drone / Action Cam)', videoMbps: 50 },
  { label: '4K ProRes / High-Bitrate Mirrorless Ingest', videoMbps: 100 },
  { label: 'Cinema All-Intra 4K Master Recording', videoMbps: 150 },
];

const STORAGE_LIMITS = [
  { label: '500 MB Budget', targetSize: 500, unit: 'MB' as const },
  { label: '1 GB Storage Limit', targetSize: 1, unit: 'GB' as const },
  { label: '4 GB (FAT32 Card Limit)', targetSize: 4, unit: 'GB' as const },
  { label: '16 GB Card Allocation', targetSize: 16, unit: 'GB' as const },
  { label: '64 GB SD Card Allocation', targetSize: 64, unit: 'GB' as const },
];

export function getVideoPageData(slug: string): VideoPageData | null {
  const def = VIDEO_DEFS.find((d) => d.slug === slug);
  if (!def) return null;

  // Comparison Rows using @/lib/video
  const bitrateRows: VideoBitrateRow[] = BITRATE_TIERS.map((tier) => {
    const res = unwrap(calculateVideoFileSize({
      videoBitrate: tier.videoMbps,
      videoBitrateUnit: 'Mbps',
      audioBitrate: def.audioBitrateKbps,
      audioBitrateUnit: 'kbps',
      durationSeconds: def.durationSeconds,
      targetSizeUnit: 'GB',
    }));

    const mbPerMin = ((res.fileSizeBytes / def.durationSeconds) * 60) / 1e6;

    return {
      useCaseLabel: tier.label,
      videoBitrateMbps: tier.videoMbps,
      audioBitrateKbps: def.audioBitrateKbps,
      totalBitrateMbps: res.totalBitrateFormatted,
      calculatedFileSize: res.fileSizeFormatted,
      storagePerMinute: `${mbPerMin.toFixed(1)} MB/min`,
    };
  });

  // Storage Budget Rows (Reverse bitrate calculation using @/lib/video)
  const storageBudgetRows: TargetStorageRow[] = STORAGE_LIMITS.map((limit) => {
    const res = calculateRequiredVideoBitrate({
      targetFileSize: limit.targetSize,
      targetFileSizeUnit: limit.unit,
      durationSeconds: def.durationSeconds,
      audioBitrate: def.audioBitrateKbps,
      audioBitrateUnit: 'kbps',
      targetBitrateUnit: 'Mbps',
    });

    if (!res.success || !res.data) {
      return {
        storageLimitLabel: limit.label,
        maxAllowableVideoBitrate: 'N/A',
        isFeasible: false,
        recommendation: `Audio bitrate (${def.audioBitrateKbps} kbps) alone exceeds or approaches this storage ceiling over ${def.durationLabel}.`,
      };
    }

    const data = res.data;
    return {
      storageLimitLabel: limit.label,
      maxAllowableVideoBitrate: data.requiredVideoBitrateFormatted,
      isFeasible: true,
      recommendation: `To fit within ${limit.label}, cap video encoding bitrate at ${data.requiredVideoBitrateFormatted}.`,
    };
  });

  // Baseline scenario: 1080p Standard Web Video (5 Mbps)
  const baseline = bitrateRows[1];

  const nearbyPages: NearbyLink[] = VIDEO_DEFS.filter((d) => d.slug !== slug).map((d) => ({
    slug: d.slug,
    label: `${d.durationLabel} Video File Size`,
    href: `/video-file-size/${d.slug}`,
    description: `Estimate video file sizes across bitrates and resolutions for ${d.durationLabel} runtimes.`,
  }));

  const calculatorQuery = `?mode=find-size&video=5&vUnit=Mbps&audio=${def.audioBitrateKbps}&aUnit=kbps&h=${Math.floor(def.durationSeconds / 3600)}&m=${Math.floor((def.durationSeconds % 3600) / 60)}&s=0`;

  return {
    slug: def.slug,
    durationLabel: def.durationLabel,
    durationSeconds: def.durationSeconds,
    audioBitrateKbps: def.audioBitrateKbps,
    title: `How Large is a ${def.durationLabel} Video? Bitrate & Size Guide | DataRateKit`,
    metaDescription: `Compare ${def.durationLabel} video file sizes from 720p (2 Mbps) to 4K (50-100 Mbps) with reverse bitrate storage budgets and memory card requirements.`,
    h1: `How Large is a ${def.durationLabel} Video File?`,
    directAnswerSummary: `A ${def.durationLabel} video recorded at standard 1080p web bitrate (5 Mbps video + ${def.audioBitrateKbps} kbps audio) is approximately ${baseline.calculatedFileSize} (${baseline.storagePerMinute}). In high-quality 4K at 50 Mbps, the same duration consumes ${bitrateRows[4].calculatedFileSize}.`,
    baselineUseCase: baseline.useCaseLabel,
    baselineFileSize: baseline.calculatedFileSize,
    baselineTotalBitrate: baseline.totalBitrateMbps,
    contextNotes: [
      `A ${def.durationLabel} recording session commonly covers ${def.typicalWorkload}.`,
      ...def.practicalConsiderations,
    ],
    bitrateRows,
    storageBudgetRows,
    calculatorQuery,
    nearbyPages,
  };
}

export const VIDEO_PAGES: VideoPageData[] = VIDEO_DEFS.map((d) => getVideoPageData(d.slug)!);
