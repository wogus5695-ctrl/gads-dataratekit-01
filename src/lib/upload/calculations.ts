/**
 * Upload Planning Calculation Engine
 *
 * Implements dedicated mathematical models for:
 * 1. Mode A: Upload Time with planning throughput factor, reserved bandwidth, and batch overhead.
 * 2. Mode B: Minimum required upstream speed under designated planning assumptions.
 * 3. Mode C: Estimated uploadable data capacity across a work or overnight window.
 */

import {
  UploadCalculationResult,
  CalculateUploadTimeParams,
  UploadTimeOutput,
  CalculateRequiredUploadSpeedParams,
  RequiredUploadSpeedOutput,
  CalculateUploadCapacityParams,
  UploadCapacityOutput,
} from './types';
import {
  fileSizeToBytes,
  bytesToFileSize,
  speedToBps,
  bpsToSpeed,
} from '@/lib/transfer/units';
import { formatDuration, formatNumber } from '@/lib/transfer/format';

/**
 * Validates a positive numeric value (> 0).
 */
function isPositiveFinite(val: unknown): val is number {
  return typeof val === 'number' && Number.isFinite(val) && val > 0;
}

/**
 * Validates a non-negative numeric value (>= 0).
 */
function isNonNegativeFinite(val: unknown): val is number {
  return typeof val === 'number' && Number.isFinite(val) && val >= 0;
}

/**
 * MODE A: Calculate Upload Duration
 *
 * Formula:
 * availableUploadBps = nominalBps * (throughputFactor / 100) * (1 - reservedBandwidth / 100)
 * payloadSeconds = payloadBits / availableUploadBps
 * overheadSeconds = fileCount * perFileOverheadSeconds
 * totalSeconds = payloadSeconds + overheadSeconds
 */
export function calculateUploadTime(
  params: CalculateUploadTimeParams
): UploadCalculationResult<UploadTimeOutput> {
  const {
    fileSize,
    fileSizeUnit,
    speed,
    speedUnit,
    throughputFactorPercent,
    efficiencyPercent,
    reservedBandwidthPercent = 0,
    fileCount = 1,
    perFileOverheadSeconds = 0,
  } = params;

  const factor = throughputFactorPercent ?? efficiencyPercent ?? 100;

  if (!isPositiveFinite(fileSize)) {
    return { success: false, error: 'File size must be a positive number greater than zero.' };
  }
  if (!isPositiveFinite(speed)) {
    return { success: false, error: 'Upload speed must be a positive number greater than zero.' };
  }
  if (!Number.isFinite(factor) || factor < 1 || factor > 100) {
    return { success: false, error: 'Throughput factor must be between 1% and 100%.' };
  }
  if (!Number.isFinite(reservedBandwidthPercent) || reservedBandwidthPercent < 0 || reservedBandwidthPercent >= 100) {
    return { success: false, error: 'Reserved bandwidth must be between 0% and 99%.' };
  }
  if (!Number.isFinite(fileCount) || fileCount < 1) {
    return { success: false, error: 'File count must be an integer of 1 or greater.' };
  }
  if (!isNonNegativeFinite(perFileOverheadSeconds)) {
    return { success: false, error: 'Per-file overhead must be a non-negative number.' };
  }

  const payloadBytes = fileSizeToBytes(fileSize, fileSizeUnit);
  const payloadBits = payloadBytes * 8;
  const nominalBps = speedToBps(speed, speedUnit);

  const factorRatio = factor / 100;
  const availableRatio = 1 - reservedBandwidthPercent / 100;
  const effectiveBps = nominalBps * factorRatio * availableRatio;
  const reservedBps = nominalBps * factorRatio * (reservedBandwidthPercent / 100);

  if (effectiveBps <= 0) {
    return { success: false, error: 'Available upload bandwidth must be greater than zero.' };
  }

  const payloadSeconds = payloadBits / effectiveBps;
  const overheadSeconds = Math.floor(fileCount) * perFileOverheadSeconds;
  const totalSeconds = payloadSeconds + overheadSeconds;

  // Format durations
  const totalDur = formatDuration(totalSeconds);
  const payloadDur = formatDuration(payloadSeconds);
  const overheadDur = formatDuration(overheadSeconds);

  // Data per hour
  const dataPerHourBytes = (effectiveBps / 8) * 3600;
  const dataPerHourFormatted = `${formatNumber(bytesToFileSize(dataPerHourBytes, 'GB'), 2)} GB/hr`;

  // Effective speed formatted in Mbps and MB/s
  const effectiveMbps = bpsToSpeed(effectiveBps, 'Mbps');
  const effectiveMBs = bpsToSpeed(effectiveBps, 'MB/s');
  const effectiveSpeedFormatted = `${formatNumber(effectiveMbps, 2)} Mbps (${formatNumber(effectiveMBs, 2)} MB/s)`;

  const nominalMbps = bpsToSpeed(nominalBps, 'Mbps');
  const nominalSpeedFormatted = `${formatNumber(nominalMbps, 2)} Mbps`;

  const reservedMbps = bpsToSpeed(reservedBps, 'Mbps');
  const reservedSpeedFormatted = `${formatNumber(reservedMbps, 2)} Mbps (${reservedBandwidthPercent}%)`;

  let decisionNote = `At ${effectiveSpeedFormatted} planned throughput, estimated upload time is ${totalDur.formattedShort}.`;
  if (reservedBandwidthPercent > 0) {
    decisionNote += ` ${reservedSpeedFormatted} is unallocated to reserve capacity for other concurrent network tasks.`;
  }
  if (overheadSeconds > 0) {
    decisionNote += ` Modeling ${overheadDur.formattedShort} of cumulative setup overhead across ${fileCount} files.`;
  }

  return {
    success: true,
    data: {
      totalSeconds,
      formattedDuration: totalDur.formatted,
      formattedDurationShort: totalDur.formattedShort,
      payloadSeconds,
      formattedPayloadDuration: payloadDur.formatted,
      overheadSeconds,
      formattedOverheadDuration: overheadDur.formatted,
      nominalSpeedBps: nominalBps,
      nominalSpeedFormatted,
      effectiveSpeedBps: effectiveBps,
      effectiveSpeedFormatted,
      reservedSpeedBps: reservedBps,
      reservedSpeedFormatted,
      dataPerHourBytes,
      dataPerHourFormatted,
      decisionNote,
    },
  };
}

/**
 * MODE B: Calculate Minimum Required Upload Speed
 *
 * Formula:
 * usableWindowSeconds = targetWindowSeconds - (fileCount * perFileOverheadSeconds)
 * requiredEffectiveBps = payloadBits / usableWindowSeconds
 * requiredNominalBps = requiredEffectiveBps / (throughputFactor / 100) / (1 - reservedBandwidth / 100)
 */
export function calculateRequiredUploadSpeed(
  params: CalculateRequiredUploadSpeedParams
): UploadCalculationResult<RequiredUploadSpeedOutput> {
  const {
    fileSize,
    fileSizeUnit,
    windowDurationSeconds,
    targetSpeedUnit = 'Mbps',
    throughputFactorPercent,
    efficiencyPercent,
    reservedBandwidthPercent = 0,
    fileCount = 1,
    perFileOverheadSeconds = 0,
  } = params;

  const factor = throughputFactorPercent ?? efficiencyPercent ?? 100;

  if (!isPositiveFinite(fileSize)) {
    return { success: false, error: 'File size must be a positive number greater than zero.' };
  }
  if (!isPositiveFinite(windowDurationSeconds)) {
    return { success: false, error: 'Upload window must be a positive duration greater than zero.' };
  }
  if (!Number.isFinite(factor) || factor < 1 || factor > 100) {
    return { success: false, error: 'Throughput factor must be between 1% and 100%.' };
  }
  if (!Number.isFinite(reservedBandwidthPercent) || reservedBandwidthPercent < 0 || reservedBandwidthPercent >= 100) {
    return { success: false, error: 'Reserved bandwidth must be between 0% and 99%.' };
  }
  if (!Number.isFinite(fileCount) || fileCount < 1) {
    return { success: false, error: 'File count must be an integer of 1 or greater.' };
  }
  if (!isNonNegativeFinite(perFileOverheadSeconds)) {
    return { success: false, error: 'Per-file overhead must be a non-negative number.' };
  }

  const overheadSeconds = Math.floor(fileCount) * perFileOverheadSeconds;
  const usableWindowSeconds = windowDurationSeconds - overheadSeconds;

  if (usableWindowSeconds <= 0) {
    return {
      success: false,
      error: `Target upload window (${formatDuration(windowDurationSeconds).formattedShort}) is shorter than file batch overhead (${formatDuration(overheadSeconds).formattedShort}). Increase the time window or decrease per-file overhead.`,
    };
  }

  const payloadBytes = fileSizeToBytes(fileSize, fileSizeUnit);
  const payloadBits = payloadBytes * 8;

  const requiredEffectiveBps = payloadBits / usableWindowSeconds;
  const factorRatio = factor / 100;
  const availableRatio = 1 - reservedBandwidthPercent / 100;
  const requiredNominalBps = requiredEffectiveBps / factorRatio / availableRatio;

  const requiredNominalFormatted = `${formatNumber(bpsToSpeed(requiredNominalBps, targetSpeedUnit), 2)} ${targetSpeedUnit}`;
  const requiredEffectiveFormatted = `${formatNumber(bpsToSpeed(requiredEffectiveBps, targetSpeedUnit), 2)} ${targetSpeedUnit}`;
  const usableWindowFormatted = formatDuration(usableWindowSeconds).formatted;
  const overheadFormatted = formatDuration(overheadSeconds).formatted;

  let decisionNote = `Under these planning assumptions, completing the upload within ${formatDuration(windowDurationSeconds).formattedShort} requires an entered nominal rate of ${requiredNominalFormatted}.`;
  if (reservedBandwidthPercent > 0) {
    decisionNote += ` Factoring in a ${reservedBandwidthPercent}% reserved allocation and ${factor}% throughput factor, effective throughput is ${requiredEffectiveFormatted}.`;
  }

  return {
    success: true,
    data: {
      requiredNominalSpeed: bpsToSpeed(requiredNominalBps, targetSpeedUnit),
      requiredNominalSpeedFormatted: requiredNominalFormatted,
      requiredEffectiveSpeed: bpsToSpeed(requiredEffectiveBps, targetSpeedUnit),
      requiredEffectiveSpeedFormatted: requiredEffectiveFormatted,
      usableWindowSeconds,
      usableWindowFormatted,
      overheadSeconds,
      formattedOverheadDuration: overheadFormatted,
      reservedBandwidthPercent,
      decisionNote,
    },
  };
}

/**
 * MODE C: Calculate Maximum Upload Capacity in Window
 *
 * Formula:
 * usableWindowSeconds = uploadWindowSeconds - setupReserveSeconds
 * availableBps = nominalBps * (throughputFactor / 100) * (1 - reservedBandwidth / 100)
 * maximumPayloadBits = availableBps * usableWindowSeconds
 */
export function calculateUploadCapacity(
  params: CalculateUploadCapacityParams
): UploadCalculationResult<UploadCapacityOutput> {
  const {
    speed,
    speedUnit,
    windowDurationSeconds,
    targetSizeUnit = 'GB',
    throughputFactorPercent,
    efficiencyPercent,
    reservedBandwidthPercent = 0,
    setupReserveSeconds = 0,
  } = params;

  const factor = throughputFactorPercent ?? efficiencyPercent ?? 100;

  if (!isPositiveFinite(speed)) {
    return { success: false, error: 'Upload speed must be a positive number greater than zero.' };
  }
  if (!isPositiveFinite(windowDurationSeconds)) {
    return { success: false, error: 'Upload window must be a positive duration greater than zero.' };
  }
  if (!Number.isFinite(factor) || factor < 1 || factor > 100) {
    return { success: false, error: 'Throughput factor must be between 1% and 100%.' };
  }
  if (!Number.isFinite(reservedBandwidthPercent) || reservedBandwidthPercent < 0 || reservedBandwidthPercent >= 100) {
    return { success: false, error: 'Reserved bandwidth must be between 0% and 99%.' };
  }
  if (!isNonNegativeFinite(setupReserveSeconds)) {
    return { success: false, error: 'Setup reserve must be a non-negative number.' };
  }

  const usableWindowSeconds = Math.max(0, windowDurationSeconds - setupReserveSeconds);
  const nominalBps = speedToBps(speed, speedUnit);
  const factorRatio = factor / 100;
  const availableRatio = 1 - reservedBandwidthPercent / 100;
  const effectiveBps = nominalBps * factorRatio * availableRatio;
  const reservedBps = nominalBps * factorRatio * (reservedBandwidthPercent / 100);

  const maximumPayloadBits = effectiveBps * usableWindowSeconds;
  const maximumPayloadBytes = maximumPayloadBits / 8;

  const targetSizeValue = bytesToFileSize(maximumPayloadBytes, targetSizeUnit);
  const maximumPayloadFormatted = `${formatNumber(targetSizeValue, 2)} ${targetSizeUnit}`;

  const effectiveMbps = bpsToSpeed(effectiveBps, 'Mbps');
  const effectiveMBs = bpsToSpeed(effectiveBps, 'MB/s');
  const effectiveSpeedFormatted = `${formatNumber(effectiveMbps, 2)} Mbps (${formatNumber(effectiveMBs, 2)} MB/s)`;

  const reservedMbps = bpsToSpeed(reservedBps, 'Mbps');
  const reservedSpeedFormatted = `${formatNumber(reservedMbps, 2)} Mbps (${reservedBandwidthPercent}%)`;

  const dataPerHourBytes = (effectiveBps / 8) * 3600;
  const dataPerHourFormatted = `${formatNumber(bytesToFileSize(dataPerHourBytes, 'GB'), 2)} GB/hr`;

  const usableWindowFormatted = formatDuration(usableWindowSeconds).formatted;

  let decisionNote = `Within a ${formatDuration(windowDurationSeconds).formattedShort} window, estimated uploadable payload is ${maximumPayloadFormatted} at ${effectiveSpeedFormatted} planned throughput.`;
  if (reservedBandwidthPercent > 0) {
    decisionNote += ` ${reservedSpeedFormatted} is kept unallocated for other network tasks.`;
  }

  return {
    success: true,
    data: {
      maximumPayloadBytes,
      maximumPayloadFormatted,
      effectiveSpeedBps: effectiveBps,
      effectiveSpeedFormatted,
      dataPerHourBytes,
      dataPerHourFormatted,
      usableWindowSeconds,
      usableWindowFormatted,
      reservedSpeedBps: reservedBps,
      reservedSpeedFormatted,
      decisionNote,
    },
  };
}
