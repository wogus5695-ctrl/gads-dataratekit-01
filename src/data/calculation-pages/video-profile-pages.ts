import { calculateVideoFileSize, calculateMaximumDuration } from '@/lib/video';
import {
  VideoProfilePageData,
  VideoProfileDurationRow,
  VideoStorageCardRow,
  NearbyLink,
} from './types';

function unwrap<T>(res: { success: true; data: T } | { success: false; error: string }): T {
  if (!res.success) {
    throw new Error(res.error);
  }
  return res.data;
}

interface ProfileDef {
  slug: string;
  profileName: string;
  resolution: string;
  frameRate: string;
  videoBitrateMbps: number;
  upperVideoBitrateMbps?: number;
  isRange: boolean;
  audioBitrateKbps: number;
  h1: string;
  title: string;
  metaDescription: string;
  practicalConsiderations: string[];
}

const PROFILE_DEFS: ProfileDef[] = [
  {
    slug: '720p-per-hour',
    profileName: '720p Standard (HD)',
    resolution: '1280×720',
    frameRate: '24–30 fps',
    videoBitrateMbps: 5,
    isRange: false,
    audioBitrateKbps: 384,
    h1: '720p Video File Size per Hour',
    title: '720p Video File Size per Hour — Bitrate Reference',
    metaDescription: 'How large is 1 hour of 720p video? Review file size estimates at 5 Mbps reference video bitrate, 10 to 120-minute runtimes, and memory card storage capacity.',
    practicalConsiderations: [
      'Resolution vs. Bitrate Reality: A 720p video at 5 Mbps produces the exact same file size as a 1080p stream at 5 Mbps; resolution dictates pixel dimensions, not byte count.',
      'Compression Efficiency: 5 Mbps provides generous headroom for 720p content, yielding sharp web streams, crisp video call recordings, and lightweight video archives.',
      'Bandwidth Economy: 720p at 5 Mbps is ideal for cellular uploading or constrained broadband connections where upstream speeds are capped below 10 Mbps.',
    ],
  },
  {
    slug: '1080p-per-hour',
    profileName: '1080p Standard (Full HD)',
    resolution: '1920×1080',
    frameRate: '24–30 fps',
    videoBitrateMbps: 8,
    isRange: false,
    audioBitrateKbps: 384,
    h1: '1080p Video File Size per Hour',
    title: '1080p Video File Size per Hour — Bitrate Reference',
    metaDescription: 'How large is 1 hour of 1080p video? Calculate storage requirements at standard 8 Mbps reference bitrate across runtimes from 10 minutes to 2 hours.',
    practicalConsiderations: [
      'Standard Web Benchmark: 8 Mbps represents the widely adopted SDR delivery target for 1080p standard frame rate web video platforms like YouTube and Vimeo.',
      'Storage Footprint: At 8 Mbps video + 384 kbps audio, one hour consumes approximately 3.77 GB, fitting just inside the legacy FAT32 4 GB single-file boundary.',
      'Codec Considerations: Encoded with H.264, 8 Mbps provides balanced fidelity. Modern HEVC (H.265) or AV1 codecs can achieve visually indistinguishable quality at 4 to 5 Mbps.',
    ],
  },
  {
    slug: '1080p-60fps-per-hour',
    profileName: '1080p 60fps (High Frame Rate)',
    resolution: '1920×1080',
    frameRate: '60 fps',
    videoBitrateMbps: 12,
    isRange: false,
    audioBitrateKbps: 384,
    h1: '1080p 60fps Video File Size per Hour',
    title: '1080p 60fps Video File Size per Hour — Bitrate Reference',
    metaDescription: 'Calculate 1080p 60fps video file size per hour at 12 Mbps reference bitrate. Compare 10m to 2h recording storage and memory card hours.',
    practicalConsiderations: [
      'Frame Rate Overhead: Doubling the frame rate from 30 fps to 60 fps requires approximately 50% higher bitrate (12 Mbps vs 8 Mbps) to avoid compression macroblocking during rapid motion.',
      'Gaming & Sports Capture: 1080p 60fps is the baseline for live video game streaming, esports recording, and high-motion action camera ingest.',
      'FAT32 File Splitting: Consuming ~5.57 GB per hour, 1080p 60fps recordings will automatically split into 4 GB chunks after roughly 43 minutes on FAT32 media.',
    ],
  },
  {
    slug: '1440p-per-hour',
    profileName: '1440p 2K (QHD)',
    resolution: '2560×1440',
    frameRate: '24–30 fps',
    videoBitrateMbps: 16,
    isRange: false,
    audioBitrateKbps: 384,
    h1: '1440p Video File Size per Hour',
    title: '1440p Video File Size per Hour — Bitrate Reference',
    metaDescription: 'How big is a 1-hour 1440p 2K video? Review file size estimates at 16 Mbps reference bitrate, storage rates per minute, and memory card capacity.',
    practicalConsiderations: [
      'Intermediate Resolution: 1440p contains 78% more pixels than 1080p, demanding ~16 Mbps for standard SDR web video delivery.',
      'Storage Ceiling: Consuming ~7.37 GB per hour, continuous recording quickly accumulates data; a 128 GB memory card accommodates roughly 17 hours of 1440p footage.',
      'PC Monitor Standard: 1440p is heavily favored by PC gaming content creators looking for higher pixel density than 1080p without the severe storage penalty of full 4K.',
    ],
  },
  {
    slug: '4k-per-hour',
    profileName: '4K UHD Standard Frame Rate',
    resolution: '3840×2160',
    frameRate: '24–30 fps',
    videoBitrateMbps: 35,
    upperVideoBitrateMbps: 45,
    isRange: true,
    audioBitrateKbps: 384,
    h1: '4K Video File Size per Hour',
    title: '4K Video File Size per Hour — Bitrate Range Guide',
    metaDescription: 'How large is 1 hour of 4K video? Compare standard 35 to 45 Mbps reference bitrate ranges, storage requirements from 10 minutes to 2 hours, and SD card limits.',
    practicalConsiderations: [
      'Reference Bitrate Range: 4K 24-30 fps SDR is commonly encoded between 35 Mbps (efficient web streaming) and 45 Mbps (higher-bitrate web master), producing 15.9 to 20.4 GB per hour.',
      'Pixel Density Demands: 4K contains over 8.29 million pixels per frame (4× 1080p); bitrates below 30 Mbps can introduce visible color banding and artifacting in complex textures.',
      'Hardware Requirements: Editing 1 hour of 4K requires fast NVMe scratch disks or high-speed USB 3.2 SSDs capable of sustaining multi-hundred MB/s preview scrubbing.',
    ],
  },
  {
    slug: '4k-60fps-per-hour',
    profileName: '4K UHD 60fps (Action / High Frame Rate)',
    resolution: '3840×2160',
    frameRate: '60 fps',
    videoBitrateMbps: 53,
    upperVideoBitrateMbps: 68,
    isRange: true,
    audioBitrateKbps: 384,
    h1: '4K 60fps Video File Size per Hour',
    title: '4K 60fps Video File Size per Hour — Bitrate Range Guide',
    metaDescription: 'Calculate 4K 60fps video file size per hour across the 53 to 68 Mbps reference bitrate range. Review memory card limits and storage rates per minute.',
    practicalConsiderations: [
      'High-Throughput Action Standard: Action cameras (GoPro, DJI) and modern mirrorless bodies recording 4K 60fps typically operate between 53 Mbps and 68 Mbps in standard SDR modes.',
      'Massive Storage Volume: One hour consumes between 24.0 GB and 30.8 GB; a full day of multi-camera shooting easily generates hundreds of gigabytes.',
      'SD Card Speed Class: Sustaining 53–68 Mbps video stream recording demands at least a V30 (Video Speed Class 30 MB/s continuous write) rated microSD or SDXC card.',
    ],
  },
];

const DURATIONS = [
  { label: '10 Minutes', seconds: 600 },
  { label: '30 Minutes', seconds: 1800 },
  { label: '60 Minutes (1 Hour)', seconds: 3600 },
  { label: '120 Minutes (2 Hours)', seconds: 7200 },
];

const STORAGE_CARDS = [
  { label: '64 GB SD Card', usableGb: 58 },
  { label: '128 GB SD Card', usableGb: 116 },
  { label: '256 GB SD Card', usableGb: 232 },
  { label: '512 GB SD Card', usableGb: 465 },
];

export function getVideoProfilePageData(slug: string): VideoProfilePageData | null {
  const def = PROFILE_DEFS.find((d) => d.slug === slug);
  if (!def) return null;

  // Calculate duration rows using @/lib/video
  const durationRows: VideoProfileDurationRow[] = DURATIONS.map((dur) => {
    const lowerRes = unwrap(
      calculateVideoFileSize({
        videoBitrate: def.videoBitrateMbps,
        videoBitrateUnit: 'Mbps',
        audioBitrate: def.audioBitrateKbps,
        audioBitrateUnit: 'kbps',
        durationSeconds: dur.seconds,
        targetSizeUnit: 'GB',
      })
    );

    let upperFileSize: string | undefined = undefined;
    if (def.isRange && def.upperVideoBitrateMbps) {
      const upperRes = unwrap(
        calculateVideoFileSize({
          videoBitrate: def.upperVideoBitrateMbps,
          videoBitrateUnit: 'Mbps',
          audioBitrate: def.audioBitrateKbps,
          audioBitrateUnit: 'kbps',
          durationSeconds: dur.seconds,
          targetSizeUnit: 'GB',
        })
      );
      upperFileSize = upperRes.fileSizeFormatted;
    }

    const mbPerMin = ((lowerRes.fileSizeBytes / dur.seconds) * 60) / 1e6;

    return {
      durationLabel: dur.label,
      durationSeconds: dur.seconds,
      calculatedFileSize: lowerRes.fileSizeFormatted,
      upperFileSize,
      storageRateFormatted: `${mbPerMin.toFixed(1)} MB/min`,
    };
  });

  // Calculate storage card capacity using @/lib/video
  const storageCapacityRows: VideoStorageCardRow[] = STORAGE_CARDS.map((card) => {
    const res = unwrap(
      calculateMaximumDuration({
        availableStorage: card.usableGb,
        availableStorageUnit: 'GB',
        videoBitrate: def.videoBitrateMbps,
        videoBitrateUnit: 'Mbps',
        audioBitrate: def.audioBitrateKbps,
        audioBitrateUnit: 'kbps',
      })
    );

    const hours = res.durationSeconds / 3600;

    return {
      cardLabel: card.label,
      usableCapacityGb: card.usableGb,
      maxRecordingHours: `${hours.toFixed(1)} Hours (${res.duration.formatted})`,
      notes: `Based on ~${card.usableGb} GB formatted filesystem space at ${def.videoBitrateMbps} Mbps video.`,
    };
  });

  const oneHourRow = durationRows.find((r) => r.durationSeconds === 3600)!;

  let directAnswerSummary = '';
  if (def.isRange && def.upperVideoBitrateMbps) {
    directAnswerSummary = `Using standard SDR reference encoding bitrates of ${def.videoBitrateMbps} to ${def.upperVideoBitrateMbps} Mbps video (plus ${def.audioBitrateKbps} kbps stereo audio), 1 hour of ${def.profileName} video consumes approximately ${oneHourRow.calculatedFileSize} to ${oneHourRow.upperFileSize} (${oneHourRow.storageRateFormatted} storage rate). Exact file size is determined by actual encoding bitrate, not resolution alone.`;
  } else {
    directAnswerSummary = `Using the standard SDR reference bitrate of ${def.videoBitrateMbps} Mbps video (plus ${def.audioBitrateKbps} kbps stereo audio), 1 hour of ${def.profileName} video consumes approximately ${oneHourRow.calculatedFileSize} (${oneHourRow.storageRateFormatted} storage rate). Exact file size is determined by actual encoding bitrate, not resolution alone.`;
  }

  const nearbyPages: NearbyLink[] = PROFILE_DEFS.filter((d) => d.slug !== slug).map((d) => ({
    slug: d.slug,
    label: d.title.split(' — ')[0],
    href: `/video-file-size/${d.slug}`,
    description: `Review 1-hour file size estimates and memory card capacity for ${d.profileName}.`,
  }));

  const calculatorQuery = `?mode=find-size&video=${def.videoBitrateMbps}&vUnit=Mbps&audio=${def.audioBitrateKbps}&aUnit=kbps&h=1&m=0&s=0`;

  const totalBitrateFormatted = def.isRange && def.upperVideoBitrateMbps
    ? `${(def.videoBitrateMbps + def.audioBitrateKbps / 1000).toFixed(2)}–${(def.upperVideoBitrateMbps + def.audioBitrateKbps / 1000).toFixed(2)} Mbps`
    : `${(def.videoBitrateMbps + def.audioBitrateKbps / 1000).toFixed(2)} Mbps`;

  return {
    slug: def.slug,
    profileName: def.profileName,
    resolution: def.resolution,
    frameRate: def.frameRate,
    videoBitrateMbps: def.videoBitrateMbps,
    upperVideoBitrateMbps: def.upperVideoBitrateMbps,
    isRange: def.isRange,
    audioBitrateKbps: def.audioBitrateKbps,
    totalBitrateFormatted,
    title: def.title,
    metaDescription: def.metaDescription,
    h1: def.h1,
    directAnswerSummary,
    referenceDisclaimer: 'Reference Profile Notice: Resolution and frame rate specify image geometry, not data volume. These calculations represent recognized SDR streaming and recording reference profiles; custom camera bitrates or heavy intra-frame codecs will alter final file sizes proportionally.',
    durationRows,
    storageCapacityRows,
    practicalConsiderations: def.practicalConsiderations,
    calculatorQuery,
    nearbyPages,
  };
}

export const VIDEO_PROFILE_PAGES: VideoProfilePageData[] = PROFILE_DEFS.map(
  (d) => getVideoProfilePageData(d.slug)!
);
