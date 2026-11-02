import {
  BitrateUnit,
  CalculateVideoFileSizeParams,
  VideoFileSizeOutput,
  CalculateRequiredVideoBitrateParams,
  RequiredVideoBitrateOutput,
  CalculateMaximumDurationParams,
  MaximumDurationOutput,
} from './types';
import { CalculationResult } from '@/lib/transfer/types';
import { fileSizeToBytes, bytesToFileSize } from '@/lib/transfer/units';
import { validatePositiveNumber } from '@/lib/transfer/validation';
import { formatDuration, formatNumber } from '@/lib/transfer/format';

export const BITRATE_MULTIPLIERS: Record<BitrateUnit, number> = {
  kbps: 1_000,
  Mbps: 1_000_000,
  Gbps: 1_000_000_000,
};

export const BITRATE_UNITS: BitrateUnit[] = ['kbps', 'Mbps', 'Gbps'];

export function isBitrateUnit(val: string): val is BitrateUnit {
  return val in BITRATE_MULTIPLIERS;
}

export function bitrateToBps(value: number, unit: BitrateUnit): number {
  const mult = BITRATE_MULTIPLIERS[unit];
  if (!mult) {
    throw new Error(`Unsupported bitrate unit: ${unit}`);
  }
  return value * mult;
}

export function bpsToBitrate(bps: number, unit: BitrateUnit): number {
  const mult = BITRATE_MULTIPLIERS[unit];
  if (!mult) {
    throw new Error(`Unsupported bitrate unit: ${unit}`);
  }
  return bps / mult;
}

export function parseDurationToSeconds(
  hours: unknown,
  minutes: unknown,
  seconds: unknown
): { isValid: boolean; totalSeconds: number; error?: string } {
  const hVal = validatePositiveNumber(hours, 'Hours', true);
  if (!hVal.isValid) {
    return { isValid: false, totalSeconds: 0, error: hVal.error };
  }

  const mVal = validatePositiveNumber(minutes, 'Minutes', true);
  if (!mVal.isValid) {
    return { isValid: false, totalSeconds: 0, error: mVal.error };
  }

  const sVal = validatePositiveNumber(seconds, 'Seconds', true);
  if (!sVal.isValid) {
    return { isValid: false, totalSeconds: 0, error: sVal.error };
  }

  const total = hVal.value * 3600 + mVal.value * 60 + sVal.value;
  if (total <= 0) {
    return {
      isValid: false,
      totalSeconds: 0,
      error: 'Duration must be greater than zero seconds.',
    };
  }

  return { isValid: true, totalSeconds: total };
}

/**
 * MODE A: Calculate File Size from Video Bitrate, Audio Bitrate, and Duration
 */
export function calculateVideoFileSize(
  params: CalculateVideoFileSizeParams
): CalculationResult<VideoFileSizeOutput> {
  const videoVal = validatePositiveNumber(params.videoBitrate, 'Video bitrate', true);
  if (!videoVal.isValid) {
    return { success: false, error: videoVal.error!, field: 'videoBitrate' };
  }

  const audioVal = validatePositiveNumber(params.audioBitrate, 'Audio bitrate', true);
  if (!audioVal.isValid) {
    return { success: false, error: audioVal.error!, field: 'audioBitrate' };
  }

  const durationVal = validatePositiveNumber(params.durationSeconds, 'Duration');
  if (!durationVal.isValid) {
    return { success: false, error: durationVal.error!, field: 'durationSeconds' };
  }

  const videoBps = bitrateToBps(videoVal.value, params.videoBitrateUnit);
  const audioBps = bitrateToBps(audioVal.value, params.audioBitrateUnit);
  const totalBitrateBps = videoBps + audioBps;

  if (totalBitrateBps <= 0) {
    return {
      success: false,
      error: 'Combined bitrate must be greater than zero.',
      field: 'videoBitrate',
    };
  }

  const durationSeconds = durationVal.value;
  const totalBits = totalBitrateBps * durationSeconds;
  const totalBytes = totalBits / 8;

  const targetUnit = params.targetSizeUnit || 'GB';
  const fileSizeValue = bytesToFileSize(totalBytes, targetUnit);

  const mbPerMinute = (totalBytes / durationSeconds) * 60 / 1_000_000;
  const gbPerHour = (totalBytes / durationSeconds) * 3600 / 1_000_000_000;

  const totalBitrateMbps = bpsToBitrate(totalBitrateBps, 'Mbps');

  return {
    success: true,
    data: {
      fileSizeBytes: totalBytes,
      fileSizeValue,
      fileSizeUnit: targetUnit,
      fileSizeFormatted: `${formatNumber(fileSizeValue)} ${targetUnit}`,
      totalBitrateBps,
      totalBitrateFormatted: `${formatNumber(totalBitrateMbps)} Mbps`,
      videoBitrateBps: videoBps,
      audioBitrateBps: audioBps,
      durationSeconds,
      mbPerMinute,
      gbPerHour,
    },
    efficiencyPercent: 100,
    isTheoretical: true,
  };
}

/**
 * MODE B: Calculate Required Video Bitrate from Target File Size, Duration, and Audio Bitrate
 */
export function calculateRequiredVideoBitrate(
  params: CalculateRequiredVideoBitrateParams
): CalculationResult<RequiredVideoBitrateOutput> {
  const sizeVal = validatePositiveNumber(params.targetFileSize, 'Target file size');
  if (!sizeVal.isValid) {
    return { success: false, error: sizeVal.error!, field: 'targetFileSize' };
  }

  const durationVal = validatePositiveNumber(params.durationSeconds, 'Duration');
  if (!durationVal.isValid) {
    return { success: false, error: durationVal.error!, field: 'durationSeconds' };
  }

  const audioVal = validatePositiveNumber(params.audioBitrate, 'Audio bitrate', true);
  if (!audioVal.isValid) {
    return { success: false, error: audioVal.error!, field: 'audioBitrate' };
  }

  const targetFileSizeBytes = fileSizeToBytes(sizeVal.value, params.targetFileSizeUnit);
  const targetTotalBits = targetFileSizeBytes * 8;
  const durationSeconds = durationVal.value;

  const targetTotalBitrateBps = targetTotalBits / durationSeconds;
  const audioBps = bitrateToBps(audioVal.value, params.audioBitrateUnit);

  const requiredVideoBps = targetTotalBitrateBps - audioBps;

  if (requiredVideoBps <= 0) {
    return {
      success: false,
      error: 'Audio bitrate exceeds or equals target file capacity for this duration. Increase target file size, reduce duration, or lower audio bitrate.',
      field: 'audioBitrate',
    };
  }

  const targetUnit = params.targetBitrateUnit || 'Mbps';
  const videoBitrateValue = bpsToBitrate(requiredVideoBps, targetUnit);
  const totalBitrateValue = bpsToBitrate(targetTotalBitrateBps, targetUnit);

  return {
    success: true,
    data: {
      requiredVideoBitrateBps: requiredVideoBps,
      requiredVideoBitrateValue: videoBitrateValue,
      requiredVideoBitrateUnit: targetUnit,
      requiredVideoBitrateFormatted: `${formatNumber(videoBitrateValue)} ${targetUnit}`,
      totalBitrateBps: targetTotalBitrateBps,
      totalBitrateValue: totalBitrateValue,
      totalBitrateUnit: targetUnit,
      totalBitrateFormatted: `${formatNumber(totalBitrateValue)} ${targetUnit}`,
      audioBitrateBps: audioBps,
      targetFileSizeBytes,
      durationSeconds,
    },
    efficiencyPercent: 100,
    isTheoretical: true,
  };
}

/**
 * MODE C: Calculate Maximum Recording Duration from Available Storage, Video Bitrate, and Audio Bitrate
 */
export function calculateMaximumDuration(
  params: CalculateMaximumDurationParams
): CalculationResult<MaximumDurationOutput> {
  const storageVal = validatePositiveNumber(params.availableStorage, 'Available storage');
  if (!storageVal.isValid) {
    return { success: false, error: storageVal.error!, field: 'availableStorage' };
  }

  const videoVal = validatePositiveNumber(params.videoBitrate, 'Video bitrate', true);
  if (!videoVal.isValid) {
    return { success: false, error: videoVal.error!, field: 'videoBitrate' };
  }

  const audioVal = validatePositiveNumber(params.audioBitrate, 'Audio bitrate', true);
  if (!audioVal.isValid) {
    return { success: false, error: audioVal.error!, field: 'audioBitrate' };
  }

  const availableStorageBytes = fileSizeToBytes(storageVal.value, params.availableStorageUnit);
  const availableBits = availableStorageBytes * 8;

  const videoBps = bitrateToBps(videoVal.value, params.videoBitrateUnit);
  const audioBps = bitrateToBps(audioVal.value, params.audioBitrateUnit);
  const totalBitrateBps = videoBps + audioBps;

  if (totalBitrateBps <= 0) {
    return {
      success: false,
      error: 'Combined bitrate must be greater than zero.',
      field: 'videoBitrate',
    };
  }

  const durationSeconds = availableBits / totalBitrateBps;
  const duration = formatDuration(durationSeconds);

  const mbPerMinute = (availableStorageBytes / durationSeconds) * 60 / 1_000_000;
  const gbPerHour = (availableStorageBytes / durationSeconds) * 3600 / 1_000_000_000;

  const totalBitrateMbps = bpsToBitrate(totalBitrateBps, 'Mbps');

  return {
    success: true,
    data: {
      durationSeconds,
      duration,
      totalBitrateBps,
      totalBitrateFormatted: `${formatNumber(totalBitrateMbps)} Mbps`,
      availableStorageBytes,
      mbPerMinute,
      gbPerHour,
    },
    efficiencyPercent: 100,
    isTheoretical: true,
  };
}
