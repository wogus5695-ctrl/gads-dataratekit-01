import {
  FileSizeUnit,
  FormattedDuration,
  CalculationResult,
} from '@/lib/transfer/types';

export type VideoCalculationMode = 'find-size' | 'find-bitrate' | 'find-duration';

export type BitrateUnit = 'kbps' | 'Mbps' | 'Gbps';

export interface CalculateVideoFileSizeParams {
  videoBitrate: unknown;
  videoBitrateUnit: BitrateUnit;
  audioBitrate: unknown;
  audioBitrateUnit: BitrateUnit;
  durationSeconds: unknown;
  targetSizeUnit?: FileSizeUnit;
}

export interface VideoFileSizeOutput {
  fileSizeBytes: number;
  fileSizeFormatted: string;
  fileSizeValue: number;
  fileSizeUnit: FileSizeUnit;
  totalBitrateBps: number;
  totalBitrateFormatted: string;
  videoBitrateBps: number;
  audioBitrateBps: number;
  durationSeconds: number;
  mbPerMinute: number;
  gbPerHour: number;
}

export interface CalculateRequiredVideoBitrateParams {
  targetFileSize: unknown;
  targetFileSizeUnit: FileSizeUnit;
  durationSeconds: unknown;
  audioBitrate: unknown;
  audioBitrateUnit: BitrateUnit;
  targetBitrateUnit?: BitrateUnit;
}

export interface RequiredVideoBitrateOutput {
  requiredVideoBitrateBps: number;
  requiredVideoBitrateValue: number;
  requiredVideoBitrateUnit: BitrateUnit;
  requiredVideoBitrateFormatted: string;
  totalBitrateBps: number;
  totalBitrateValue: number;
  totalBitrateUnit: BitrateUnit;
  totalBitrateFormatted: string;
  audioBitrateBps: number;
  targetFileSizeBytes: number;
  durationSeconds: number;
}

export interface CalculateMaximumDurationParams {
  availableStorage: unknown;
  availableStorageUnit: FileSizeUnit;
  videoBitrate: unknown;
  videoBitrateUnit: BitrateUnit;
  audioBitrate: unknown;
  audioBitrateUnit: BitrateUnit;
}

export interface MaximumDurationOutput {
  durationSeconds: number;
  duration: FormattedDuration;
  totalBitrateBps: number;
  totalBitrateFormatted: string;
  availableStorageBytes: number;
  mbPerMinute: number;
  gbPerHour: number;
}

export interface VideoCalculatorState {
  mode: VideoCalculationMode;
  videoBitrate: number;
  videoBitrateUnit: BitrateUnit;
  audioBitrate: number;
  audioBitrateUnit: BitrateUnit;
  hours: number;
  minutes: number;
  seconds: number;
  targetFileSize: number;
  targetFileSizeUnit: FileSizeUnit;
  availableStorage: number;
  availableStorageUnit: FileSizeUnit;
  outputSizeUnit: FileSizeUnit;
  outputBitrateUnit: BitrateUnit;
}
