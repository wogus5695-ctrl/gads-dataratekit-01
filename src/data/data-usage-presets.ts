import { DataUsagePreset } from '@/lib/data-usage/types';

/**
 * Official Verified Data Usage Presets
 *
 * Strict policy:
 * - Only includes verified official provider documentation (TYPE A: official-usage or TYPE B: official-bitrate).
 * - Excludes third-party estimates, blog claims, and recommended network bandwidth metrics.
 */
export const VERIFIED_DATA_USAGE_PRESETS: DataUsagePreset[] = [
  // -------------------------------------------------------------------------
  // Netflix (Official Data Usage Documentation)
  // Source: Netflix Help Center - "How to control how much data Netflix uses"
  // -------------------------------------------------------------------------
  {
    id: 'netflix-low',
    label: 'Netflix — Low (Basic quality, up to 0.3 GB/hr)',
    provider: 'Netflix',
    category: 'video',
    rateValue: 0.3,
    rateUnit: 'GB/hr',
    sourceType: 'official-usage',
    sourceName: 'Netflix Help Center: How to control how much data Netflix uses',
    sourceUrl: 'https://help.netflix.com/en/node/87',
    lastVerified: '2026-11-02',
    notes: 'Upper-bound planning estimate based on selected Netflix Low video quality setting.',
  },
  {
    id: 'netflix-medium',
    label: 'Netflix — Medium (Standard quality, up to 0.7 GB/hr)',
    provider: 'Netflix',
    category: 'video',
    rateValue: 0.7,
    rateUnit: 'GB/hr',
    sourceType: 'official-usage',
    sourceName: 'Netflix Help Center: How to control how much data Netflix uses',
    sourceUrl: 'https://help.netflix.com/en/node/87',
    lastVerified: '2026-11-02',
    notes: 'Upper-bound planning estimate based on selected Netflix Medium video quality setting.',
  },
  {
    id: 'netflix-high-sd',
    label: 'Netflix — High (Standard Definition, up to 1 GB/hr)',
    provider: 'Netflix',
    category: 'video',
    rateValue: 1.0,
    rateUnit: 'GB/hr',
    sourceType: 'official-usage',
    sourceName: 'Netflix Help Center: How to control how much data Netflix uses',
    sourceUrl: 'https://help.netflix.com/en/node/87',
    lastVerified: '2026-11-02',
    notes: 'Upper-bound planning estimate for SD video playback under the High data usage setting.',
  },
  {
    id: 'netflix-high-hd',
    label: 'Netflix — High (High Definition, up to 3 GB/hr)',
    provider: 'Netflix',
    category: 'video',
    rateValue: 3.0,
    rateUnit: 'GB/hr',
    sourceType: 'official-usage',
    sourceName: 'Netflix Help Center: How to control how much data Netflix uses',
    sourceUrl: 'https://help.netflix.com/en/node/87',
    lastVerified: '2026-11-02',
    notes: 'Upper-bound planning estimate for 720p/1080p HD playback under the High data usage setting.',
  },
  {
    id: 'netflix-high-4k',
    label: 'Netflix — High (Ultra HD 4K, up to 7 GB/hr)',
    provider: 'Netflix',
    category: 'video',
    rateValue: 7.0,
    rateUnit: 'GB/hr',
    sourceType: 'official-usage',
    sourceName: 'Netflix Help Center: How to control how much data Netflix uses',
    sourceUrl: 'https://help.netflix.com/en/node/87',
    lastVerified: '2026-11-02',
    notes: 'Upper-bound planning estimate for 4K UHD video playback under the High data usage setting.',
  },

  // -------------------------------------------------------------------------
  // Spotify (Official Audio Quality Documentation)
  // Source: Spotify Support - "Audio quality"
  // -------------------------------------------------------------------------
  {
    id: 'spotify-low',
    label: 'Spotify — Low (App streaming, approx. 24 kbps)',
    provider: 'Spotify',
    category: 'audio',
    rateValue: 24,
    rateUnit: 'kbps',
    sourceType: 'official-bitrate',
    sourceName: 'Spotify Support: Audio quality',
    sourceUrl: 'https://support.spotify.com/article/audio-quality/',
    lastVerified: '2026-11-02',
    notes: 'Official stream bitrate approximation for Spotify mobile/desktop app Low quality setting (HE-AACv2).',
  },
  {
    id: 'spotify-normal',
    label: 'Spotify — Normal (App streaming, approx. 96 kbps)',
    provider: 'Spotify',
    category: 'audio',
    rateValue: 96,
    rateUnit: 'kbps',
    sourceType: 'official-bitrate',
    sourceName: 'Spotify Support: Audio quality',
    sourceUrl: 'https://support.spotify.com/article/audio-quality/',
    lastVerified: '2026-11-02',
    notes: 'Official stream bitrate approximation for Spotify Normal quality setting (Ogg Vorbis / AAC).',
  },
  {
    id: 'spotify-high',
    label: 'Spotify — High (App streaming, approx. 160 kbps)',
    provider: 'Spotify',
    category: 'audio',
    rateValue: 160,
    rateUnit: 'kbps',
    sourceType: 'official-bitrate',
    sourceName: 'Spotify Support: Audio quality',
    sourceUrl: 'https://support.spotify.com/article/audio-quality/',
    lastVerified: '2026-11-02',
    notes: 'Official stream bitrate approximation for Spotify High quality setting (Ogg Vorbis / AAC).',
  },
  {
    id: 'spotify-very-high',
    label: 'Spotify — Very High (Premium, approx. 320 kbps)',
    provider: 'Spotify',
    category: 'audio',
    rateValue: 320,
    rateUnit: 'kbps',
    sourceType: 'official-bitrate',
    sourceName: 'Spotify Support: Audio quality',
    sourceUrl: 'https://support.spotify.com/article/audio-quality/',
    lastVerified: '2026-11-02',
    notes: 'Official stream bitrate approximation for Spotify Premium Very High quality setting (Ogg Vorbis / AAC). Requires an active Premium subscription.',
  },

  // -------------------------------------------------------------------------
  // YouTube Music (Official Audio Quality Documentation)
  // Source: YouTube Music Help - "Audio quality on YouTube Music"
  // -------------------------------------------------------------------------
  {
    id: 'ytmusic-low',
    label: 'YouTube Music — Low (Upper bound 48 kbps)',
    provider: 'YouTube Music',
    category: 'audio',
    rateValue: 48,
    rateUnit: 'kbps',
    sourceType: 'official-bitrate',
    sourceName: 'YouTube Music Help: Audio quality',
    sourceUrl: 'https://support.google.com/youtubemusic/answer/9076559',
    lastVerified: '2026-11-02',
    notes: 'Official upper-bound bitrate specification for Low audio quality (AAC & Opus).',
  },
  {
    id: 'ytmusic-normal',
    label: 'YouTube Music — Normal (Upper bound 128 kbps)',
    provider: 'YouTube Music',
    category: 'audio',
    rateValue: 128,
    rateUnit: 'kbps',
    sourceType: 'official-bitrate',
    sourceName: 'YouTube Music Help: Audio quality',
    sourceUrl: 'https://support.google.com/youtubemusic/answer/9076559',
    lastVerified: '2026-11-02',
    notes: 'Official upper-bound bitrate specification for Normal audio quality (AAC & Opus).',
  },
  {
    id: 'ytmusic-high',
    label: 'YouTube Music — High (Premium, upper bound 256 kbps)',
    provider: 'YouTube Music',
    category: 'audio',
    rateValue: 256,
    rateUnit: 'kbps',
    sourceType: 'official-bitrate',
    sourceName: 'YouTube Music Help: Audio quality',
    sourceUrl: 'https://support.google.com/youtubemusic/answer/9076559',
    lastVerified: '2026-11-02',
    notes: 'Official upper-bound bitrate specification for High audio quality (AAC & Opus). High quality is exclusively available to YouTube Music Premium members.',
  },
];

export function getPresetById(id: string): DataUsagePreset | undefined {
  return VERIFIED_DATA_USAGE_PRESETS.find((p) => p.id === id);
}
