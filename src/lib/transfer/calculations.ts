import {
  FileSizeUnit,
  SpeedUnit,
  CalculationResult,
  TransferTimeOutput,
  RequiredSpeedOutput,
  TransferableSizeOutput,
} from './types';
import {
  fileSizeToBytes,
  bytesToFileSize,
  speedToBps,
  bpsToSpeed,
} from './units';
import { validatePositiveNumber, validateEfficiency } from './validation';
import { formatDuration, formatNumber } from './format';

export interface CalculateTimeParams {
  fileSize: unknown;
  fileSizeUnit: FileSizeUnit;
  speed: unknown;
  speedUnit: SpeedUnit;
  efficiencyPercent?: unknown;
}

export interface CalculateRequiredSpeedParams {
  fileSize: unknown;
  fileSizeUnit: FileSizeUnit;
  durationSeconds: unknown;
  targetSpeedUnit?: SpeedUnit;
  efficiencyPercent?: unknown;
}

export interface CalculateTransferableSizeParams {
  speed: unknown;
  speedUnit: SpeedUnit;
  durationSeconds: unknown;
  targetSizeUnit?: FileSizeUnit;
  efficiencyPercent?: unknown;
}

/**
 * MODE A: Calculate Transfer Time given File Size & Transfer Speed
 */
export function calculateTransferTime(
  params: CalculateTimeParams
): CalculationResult<TransferTimeOutput> {
  const sizeValidation = validatePositiveNumber(params.fileSize, 'File size');
  if (!sizeValidation.isValid) {
    return { success: false, error: sizeValidation.error!, field: 'fileSize' };
  }

  const speedValidation = validatePositiveNumber(params.speed, 'Transfer speed');
  if (!speedValidation.isValid) {
    return { success: false, error: speedValidation.error!, field: 'speed' };
  }

  const effValidation = validateEfficiency(params.efficiencyPercent, 100);
  if (!effValidation.isValid) {
    return { success: false, error: effValidation.error!, field: 'efficiencyPercent' };
  }

  const efficiency = effValidation.value;
  const isTheoretical = efficiency === 100;

  // File size -> Bytes -> Bits
  const totalBytes = fileSizeToBytes(sizeValidation.value, params.fileSizeUnit);
  const totalBits = totalBytes * 8;

  // Nominal speed -> Effective speed based on real-world efficiency
  const nominalSpeedBps = speedToBps(speedValidation.value, params.speedUnit);
  const effectiveSpeedBps = nominalSpeedBps * (efficiency / 100);

  if (effectiveSpeedBps <= 0) {
    return {
      success: false,
      error: 'Effective transfer speed must be greater than zero.',
      field: 'speed',
    };
  }

  const seconds = totalBits / effectiveSpeedBps;
  const duration = formatDuration(seconds);

  return {
    success: true,
    data: {
      seconds,
      duration,
      effectiveSpeedBps,
      totalBytes,
      totalBits,
    },
    efficiencyPercent: efficiency,
    isTheoretical,
  };
}

/**
 * MODE B: Calculate Required Speed given File Size & Target Time
 */
export function calculateRequiredSpeed(
  params: CalculateRequiredSpeedParams
): CalculationResult<RequiredSpeedOutput> {
  const sizeValidation = validatePositiveNumber(params.fileSize, 'File size');
  if (!sizeValidation.isValid) {
    return { success: false, error: sizeValidation.error!, field: 'fileSize' };
  }

  const timeValidation = validatePositiveNumber(params.durationSeconds, 'Target time');
  if (!timeValidation.isValid) {
    return { success: false, error: timeValidation.error!, field: 'durationSeconds' };
  }

  const effValidation = validateEfficiency(params.efficiencyPercent, 100);
  if (!effValidation.isValid) {
    return { success: false, error: effValidation.error!, field: 'efficiencyPercent' };
  }

  const efficiency = effValidation.value;
  const isTheoretical = efficiency === 100;
  const targetUnit = params.targetSpeedUnit || 'Mbps';

  const totalBytes = fileSizeToBytes(sizeValidation.value, params.fileSizeUnit);
  const totalBits = totalBytes * 8;
  const seconds = timeValidation.value;

  // Effective bits per second required
  const effectiveBps = totalBits / seconds;
  // Account for overhead/efficiency: need higher nominal speed if efficiency < 100%
  const nominalBps = effectiveBps / (efficiency / 100);

  const convertedSpeed = bpsToSpeed(nominalBps, targetUnit);

  return {
    success: true,
    data: {
      speedBps: nominalBps,
      value: convertedSpeed,
      unit: targetUnit,
      formatted: `${formatNumber(convertedSpeed)} ${targetUnit}`,
    },
    efficiencyPercent: efficiency,
    isTheoretical,
  };
}

/**
 * MODE C: Calculate Transferable Size given Speed & Available Duration
 */
export function calculateTransferableSize(
  params: CalculateTransferableSizeParams
): CalculationResult<TransferableSizeOutput> {
  const speedValidation = validatePositiveNumber(params.speed, 'Transfer speed');
  if (!speedValidation.isValid) {
    return { success: false, error: speedValidation.error!, field: 'speed' };
  }

  const timeValidation = validatePositiveNumber(params.durationSeconds, 'Available time');
  if (!timeValidation.isValid) {
    return { success: false, error: timeValidation.error!, field: 'durationSeconds' };
  }

  const effValidation = validateEfficiency(params.efficiencyPercent, 100);
  if (!effValidation.isValid) {
    return { success: false, error: effValidation.error!, field: 'efficiencyPercent' };
  }

  const efficiency = effValidation.value;
  const isTheoretical = efficiency === 100;
  const targetUnit = params.targetSizeUnit || 'GB';

  const nominalSpeedBps = speedToBps(speedValidation.value, params.speedUnit);
  const effectiveSpeedBps = nominalSpeedBps * (efficiency / 100);
  const seconds = timeValidation.value;

  const totalBits = effectiveSpeedBps * seconds;
  const totalBytes = totalBits / 8;

  const convertedSize = bytesToFileSize(totalBytes, targetUnit);

  return {
    success: true,
    data: {
      bytes: totalBytes,
      value: convertedSize,
      unit: targetUnit,
      formatted: `${formatNumber(convertedSize)} ${targetUnit}`,
    },
    efficiencyPercent: efficiency,
    isTheoretical,
  };
}
