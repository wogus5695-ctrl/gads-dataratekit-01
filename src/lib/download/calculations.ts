/**
 * Download Path Planning Calculation Engine
 *
 * Implements:
 * 1. Mode A: Download Time with path planning (nominal line rate, bandwidth share, optional remote server cap, planning efficiency)
 * 2. Mode B: Download Bottleneck Analysis (identifying line vs share vs server constraints)
 * 3. Mode C: Required Connection Speed with feasibility check against remote delivery caps
 */

import {
  DownloadResult,
  CalculateDownloadTimeParams,
  DownloadTimeOutput,
  CalculateDownloadBottleneckParams,
  DownloadBottleneckOutput,
  CalculateRequiredDownloadSpeedParams,
  RequiredDownloadSpeedOutput,
  DownloadLimitingFactor,
  SpeedUnit,
} from './types';
import { fileSizeToBytes, speedToBps, bpsToSpeed } from '@/lib/transfer/units';
import { formatDuration, formatNumber } from '@/lib/transfer/format';

const EPSILON = 1e-4;

/**
 * Converts a speed value in any SpeedUnit directly into Bytes per Second.
 * 1 Byte = 8 bits.
 */
export function speedToBytesPerSec(speed: number, unit: SpeedUnit): number {
  const bps = speedToBps(speed, unit);
  return bps / 8;
}

/**
 * Converts Bytes per Second back into a specified SpeedUnit.
 */
export function bytesPerSecToSpeed(bytesPerSec: number, targetUnit: SpeedUnit): number {
  const bps = bytesPerSec * 8;
  return bpsToSpeed(bps, targetUnit);
}

function isPositiveFinite(val: unknown): val is number {
  return typeof val === 'number' && Number.isFinite(val) && val > 0;
}

/**
 * MODE A: Calculate Download Duration
 */
export function calculateDownloadTime(
  params: CalculateDownloadTimeParams
): DownloadResult<DownloadTimeOutput> {
  const {
    fileSize,
    fileSizeUnit,
    connectionSpeed,
    connectionSpeedUnit,
    availableBandwidthPercent = 100,
    serverCapEnabled = false,
    serverCapSpeed,
    serverCapSpeedUnit = 'MB/s',
    planningEfficiencyPercent = 90,
  } = params;

  if (!isPositiveFinite(fileSize)) {
    return { success: false, error: 'File size must be a positive number.' };
  }
  if (!isPositiveFinite(connectionSpeed)) {
    return { success: false, error: 'Internet connection speed must be a positive number.' };
  }
  if (
    !Number.isFinite(availableBandwidthPercent) ||
    availableBandwidthPercent < 1 ||
    availableBandwidthPercent > 100
  ) {
    return {
      success: false,
      error: 'Available bandwidth percentage must be between 1% and 100%.',
    };
  }
  if (
    !Number.isFinite(planningEfficiencyPercent) ||
    planningEfficiencyPercent < 1 ||
    planningEfficiencyPercent > 100
  ) {
    return {
      success: false,
      error: 'Planning efficiency must be between 1% and 100%.',
    };
  }

  if (serverCapEnabled) {
    if (!isPositiveFinite(serverCapSpeed)) {
      return {
        success: false,
        error: 'When enabled, remote server delivery cap must be a positive number.',
      };
    }
  }

  const fileSizeBytes = fileSizeToBytes(fileSize, fileSizeUnit);
  const nominalConnectionBytes = speedToBytesPerSec(connectionSpeed, connectionSpeedUnit);
  const bandwidthShareRatio = availableBandwidthPercent / 100;
  const availableConnectionBytes = nominalConnectionBytes * bandwidthShareRatio;

  let serverCapBytes: number | null = null;
  let pathCeilingBytes = availableConnectionBytes;
  let limitingFactor: DownloadLimitingFactor = 'connection';
  let limitingFactorLabel = 'Internet Connection Rate';

  if (serverCapEnabled && isPositiveFinite(serverCapSpeed)) {
    serverCapBytes = speedToBytesPerSec(serverCapSpeed, serverCapSpeedUnit);
    if (serverCapBytes < availableConnectionBytes - EPSILON) {
      pathCeilingBytes = serverCapBytes;
      limitingFactor = 'server-cap';
      limitingFactorLabel = 'Remote Server / CDN Delivery Cap';
    } else if (Math.abs(serverCapBytes - availableConnectionBytes) <= EPSILON) {
      pathCeilingBytes = serverCapBytes;
      limitingFactor = 'balanced';
      limitingFactorLabel = 'Balanced (Connection & Server Cap match)';
    } else {
      pathCeilingBytes = availableConnectionBytes;
      if (availableBandwidthPercent < 100) {
        limitingFactor = 'bandwidth-share';
        limitingFactorLabel = `Local Bandwidth Share (${availableBandwidthPercent}% allocated)`;
      } else {
        limitingFactor = 'connection';
        limitingFactorLabel = 'Internet Connection Rate';
      }
    }
  } else {
    if (availableBandwidthPercent < 100) {
      limitingFactor = 'bandwidth-share';
      limitingFactorLabel = `Local Bandwidth Share (${availableBandwidthPercent}% allocated)`;
    } else {
      limitingFactor = 'connection';
      limitingFactorLabel = 'Internet Connection Rate';
    }
  }

  const efficiencyRatio = planningEfficiencyPercent / 100;
  const effectiveBytesPerSec = pathCeilingBytes * efficiencyRatio;

  // Durations
  const totalSeconds = fileSizeBytes / effectiveBytesPerSec;
  const theoreticalSeconds = fileSizeBytes / nominalConnectionBytes;

  const effectiveMBs = effectiveBytesPerSec / 1e6;
  const effectiveMbps = (effectiveBytesPerSec * 8) / 1e6;

  let decisionNote = '';
  if (limitingFactor === 'server-cap') {
    decisionNote = `The remote server delivery cap (${formatNumber(serverCapBytes! / 1e6, 2)} MB/s) limits download speed below your ${availableBandwidthPercent}% available connection capacity (${formatNumber(availableConnectionBytes / 1e6, 2)} MB/s).`;
  } else if (limitingFactor === 'bandwidth-share') {
    decisionNote = `Download throughput is limited by allocating ${availableBandwidthPercent}% of your ${formatNumber(connectionSpeed, 2)} ${connectionSpeedUnit} line (${formatNumber(availableConnectionBytes / 1e6, 2)} MB/s available) to reserve bandwidth for other devices or tasks.`;
  } else {
    decisionNote = `Download throughput is primarily limited by your ${formatNumber(connectionSpeed, 2)} ${connectionSpeedUnit} downstream line capacity, delivering an estimated ${formatNumber(effectiveMBs, 2)} MB/s at ${planningEfficiencyPercent}% planning efficiency.`;
  }

  return {
    success: true,
    data: {
      totalSeconds,
      formattedDuration: formatDuration(totalSeconds).formatted,
      formattedDurationShort: formatDuration(totalSeconds).formattedShort,
      theoreticalSeconds,
      formattedTheoreticalDuration: formatDuration(theoreticalSeconds).formatted,
      formattedTheoreticalDurationShort: formatDuration(theoreticalSeconds).formattedShort,
      effectiveBytesPerSec,
      effectiveMBs,
      effectiveMbps,
      effectiveThroughputFormatted: `${formatNumber(effectiveMbps, 2)} Mbps (${formatNumber(effectiveMBs, 2)} MB/s)`,
      equivalentMBsFormatted: `${formatNumber(effectiveMBs, 2)} MB/s`,
      nominalConnectionBytesPerSec: nominalConnectionBytes,
      availableConnectionBytesPerSec: availableConnectionBytes,
      pathCeilingBytesPerSec: pathCeilingBytes,
      serverCapBytesPerSec: serverCapBytes,
      limitingFactor,
      limitingFactorLabel,
      decisionNote,
    },
  };
}

/**
 * MODE B: Download Path Bottleneck Analysis
 */
export function calculateDownloadBottleneck(
  params: CalculateDownloadBottleneckParams
): DownloadResult<DownloadBottleneckOutput> {
  const {
    connectionSpeed,
    connectionSpeedUnit,
    availableBandwidthPercent = 100,
    serverCapEnabled = false,
    serverCapSpeed,
    serverCapSpeedUnit = 'MB/s',
    planningEfficiencyPercent = 90,
  } = params;

  if (!isPositiveFinite(connectionSpeed)) {
    return { success: false, error: 'Internet connection speed must be a positive number.' };
  }
  if (
    !Number.isFinite(availableBandwidthPercent) ||
    availableBandwidthPercent < 1 ||
    availableBandwidthPercent > 100
  ) {
    return {
      success: false,
      error: 'Available bandwidth percentage must be between 1% and 100%.',
    };
  }
  if (
    !Number.isFinite(planningEfficiencyPercent) ||
    planningEfficiencyPercent < 1 ||
    planningEfficiencyPercent > 100
  ) {
    return {
      success: false,
      error: 'Planning efficiency must be between 1% and 100%.',
    };
  }

  if (serverCapEnabled) {
    if (!isPositiveFinite(serverCapSpeed)) {
      return {
        success: false,
        error: 'When enabled, remote server delivery cap must be a positive number.',
      };
    }
  }

  const nominalConnectionBytes = speedToBytesPerSec(connectionSpeed, connectionSpeedUnit);
  const bandwidthShareRatio = availableBandwidthPercent / 100;
  const availableConnectionBytes = nominalConnectionBytes * bandwidthShareRatio;

  let serverCapBytes: number | null = null;
  let pathCeilingBytes = availableConnectionBytes;
  let limitingFactor: DownloadLimitingFactor = 'connection';
  let limitingFactorLabel = 'Internet Connection Rate';
  let limitingFactorExplanation = '';

  if (serverCapEnabled && isPositiveFinite(serverCapSpeed)) {
    serverCapBytes = speedToBytesPerSec(serverCapSpeed, serverCapSpeedUnit);
    if (serverCapBytes < availableConnectionBytes - EPSILON) {
      pathCeilingBytes = serverCapBytes;
      limitingFactor = 'server-cap';
      limitingFactorLabel = 'Remote Server / CDN Delivery Cap';
      limitingFactorExplanation =
        'The remote host or content distribution network delivers data slower than your available downstream connection bandwidth.';
    } else if (Math.abs(serverCapBytes - availableConnectionBytes) <= EPSILON) {
      pathCeilingBytes = serverCapBytes;
      limitingFactor = 'balanced';
      limitingFactorLabel = 'Balanced Ceiling';
      limitingFactorExplanation =
        'Your available connection bandwidth and the remote server delivery rate are matched.';
    } else {
      pathCeilingBytes = availableConnectionBytes;
      if (availableBandwidthPercent < 100) {
        limitingFactor = 'bandwidth-share';
        limitingFactorLabel = `Bandwidth Share (${availableBandwidthPercent}%)`;
        limitingFactorExplanation =
          'Your total connection is faster, but allocating a partial share restricts the throughput available to this download.';
      } else {
        limitingFactor = 'connection';
        limitingFactorLabel = 'Internet Connection Rate';
        limitingFactorExplanation =
          'Your downstream broadband speed limits the maximum data transfer rate.';
      }
    }
  } else {
    if (availableBandwidthPercent < 100) {
      limitingFactor = 'bandwidth-share';
      limitingFactorLabel = `Bandwidth Share (${availableBandwidthPercent}%)`;
      limitingFactorExplanation =
        'Allocating a partial bandwidth share restricts throughput below your maximum line rate.';
    } else {
      limitingFactor = 'connection';
      limitingFactorLabel = 'Internet Connection Rate';
      limitingFactorExplanation =
        'Your internet connection capacity is the primary constraint on throughput.';
    }
  }

  const efficiencyRatio = planningEfficiencyPercent / 100;
  const effectiveThroughputBytes = pathCeilingBytes * efficiencyRatio;

  // Headroom
  let connectionHeadroomPercent = 0;
  if (pathCeilingBytes < availableConnectionBytes) {
    connectionHeadroomPercent =
      ((availableConnectionBytes - pathCeilingBytes) / pathCeilingBytes) * 100;
  }

  let serverHeadroomPercent: number | null = null;
  if (serverCapBytes !== null && serverCapBytes > pathCeilingBytes) {
    serverHeadroomPercent = ((serverCapBytes - pathCeilingBytes) / pathCeilingBytes) * 100;
  }

  const nominalConnectionMbps = (nominalConnectionBytes * 8) / 1e6;
  const nominalConnectionMBs = nominalConnectionBytes / 1e6;
  const availableConnectionMbps = (availableConnectionBytes * 8) / 1e6;
  const availableConnectionMBs = availableConnectionBytes / 1e6;
  const serverCapMbps = serverCapBytes !== null ? (serverCapBytes * 8) / 1e6 : null;
  const serverCapMBs = serverCapBytes !== null ? serverCapBytes / 1e6 : null;
  const pathCeilingMbps = (pathCeilingBytes * 8) / 1e6;
  const pathCeilingMBs = pathCeilingBytes / 1e6;
  const effectiveThroughputMbps = (effectiveThroughputBytes * 8) / 1e6;
  const effectiveThroughputMBs = effectiveThroughputBytes / 1e6;

  let decisionNote = '';
  if (limitingFactor === 'server-cap') {
    decisionNote = `Upgrading your broadband speed will not accelerate this download because the remote server or CDN caps delivery to ${formatNumber(serverCapMBs!, 2)} MB/s (${formatNumber(serverCapMbps!, 2)} Mbps).`;
  } else if (limitingFactor === 'bandwidth-share') {
    decisionNote = `Increasing available bandwidth share from ${availableBandwidthPercent}% to 100% would increase available line rate by ${formatNumber(((100 - availableBandwidthPercent) / availableBandwidthPercent) * 100, 0)}%.`;
  } else {
    decisionNote = `Your connection is the limiting stage. At ${planningEfficiencyPercent}% planning efficiency, expect approximately ${formatNumber(effectiveThroughputMBs, 2)} MB/s sustained from a ${formatNumber(nominalConnectionMbps, 2)} Mbps connection.`;
  }

  return {
    success: true,
    data: {
      nominalConnectionMbps,
      nominalConnectionMBs,
      availableConnectionMbps,
      availableConnectionMBs,
      availableBandwidthPercent,
      serverCapEnabled,
      serverCapMbps,
      serverCapMBs,
      pathCeilingMbps,
      pathCeilingMBs,
      effectiveThroughputMbps,
      effectiveThroughputMBs,
      planningEfficiencyPercent,
      limitingFactor,
      limitingFactorLabel,
      limitingFactorExplanation,
      connectionHeadroomPercent,
      serverHeadroomPercent,
      decisionNote,
    },
  };
}

/**
 * MODE C: Required Connection Speed
 */
export function calculateRequiredDownloadSpeed(
  params: CalculateRequiredDownloadSpeedParams
): DownloadResult<RequiredDownloadSpeedOutput> {
  const {
    fileSize,
    fileSizeUnit,
    targetDurationSeconds,
    availableBandwidthPercent = 100,
    serverCapEnabled = false,
    serverCapSpeed,
    serverCapSpeedUnit = 'MB/s',
    planningEfficiencyPercent = 90,
    targetSpeedUnit = 'Mbps',
  } = params;

  if (!isPositiveFinite(fileSize)) {
    return { success: false, error: 'File size must be a positive number.' };
  }
  if (!isPositiveFinite(targetDurationSeconds)) {
    return { success: false, error: 'Target completion time must be a positive duration.' };
  }
  if (
    !Number.isFinite(availableBandwidthPercent) ||
    availableBandwidthPercent < 1 ||
    availableBandwidthPercent > 100
  ) {
    return {
      success: false,
      error: 'Available bandwidth percentage must be between 1% and 100%.',
    };
  }
  if (
    !Number.isFinite(planningEfficiencyPercent) ||
    planningEfficiencyPercent < 1 ||
    planningEfficiencyPercent > 100
  ) {
    return {
      success: false,
      error: 'Planning efficiency must be between 1% and 100%.',
    };
  }

  if (serverCapEnabled) {
    if (!isPositiveFinite(serverCapSpeed)) {
      return {
        success: false,
        error: 'When enabled, remote server delivery cap must be a positive number.',
      };
    }
  }

  const fileSizeBytes = fileSizeToBytes(fileSize, fileSizeUnit);
  const requiredEffectiveBytesPerSec = fileSizeBytes / targetDurationSeconds;
  const requiredEffectiveMBs = requiredEffectiveBytesPerSec / 1e6;
  const requiredEffectiveMbps = (requiredEffectiveBytesPerSec * 8) / 1e6;

  const efficiencyRatio = planningEfficiencyPercent / 100;
  const bandwidthShareRatio = availableBandwidthPercent / 100;

  let isFeasible = true;
  let serverCapBytes: number | null = null;
  let serverCapMBs: number | null = null;
  let maxFeasibleEffectiveMBs: number | null = null;
  let decisionNote = '';

  if (serverCapEnabled && isPositiveFinite(serverCapSpeed)) {
    serverCapBytes = speedToBytesPerSec(serverCapSpeed, serverCapSpeedUnit);
    serverCapMBs = serverCapBytes / 1e6;
    const maxFeasibleEffectiveBytes = serverCapBytes * efficiencyRatio;
    maxFeasibleEffectiveMBs = maxFeasibleEffectiveBytes / 1e6;

    if (requiredEffectiveBytesPerSec > maxFeasibleEffectiveBytes + EPSILON) {
      isFeasible = false;
      decisionNote = `Target not feasible under current server cap. The remote server delivery cap of ${formatNumber(serverCapMBs, 2)} MB/s restricts effective throughput to ${formatNumber(maxFeasibleEffectiveMBs, 2)} MB/s at ${planningEfficiencyPercent}% efficiency, but ${formatNumber(requiredEffectiveMBs, 2)} MB/s is required to complete in ${formatDuration(targetDurationSeconds).formattedShort}.`;
    }
  }

  // Required path ceiling: requiredEffectiveBytesPerSec / efficiencyRatio
  const requiredPathCeilingBytes = requiredEffectiveBytesPerSec / efficiencyRatio;
  // Required nominal line: requiredPathCeilingBytes / bandwidthShareRatio
  const requiredNominalConnectionBytes = requiredPathCeilingBytes / bandwidthShareRatio;

  const requiredNominalConnectionSpeed = bytesPerSecToSpeed(
    requiredNominalConnectionBytes,
    targetSpeedUnit
  );

  const requiredNominalFormatted = `${formatNumber(requiredNominalConnectionSpeed, 2)} ${targetSpeedUnit}`;
  const requiredEffectiveFormatted = `${formatNumber(requiredEffectiveMbps, 2)} Mbps (${formatNumber(requiredEffectiveMBs, 2)} MB/s)`;

  if (isFeasible) {
    decisionNote = `Feasible. To complete ${formatNumber(fileSize, 2)} ${fileSizeUnit} in ${formatDuration(targetDurationSeconds).formattedShort} at ${availableBandwidthPercent}% bandwidth allocation and ${planningEfficiencyPercent}% efficiency, an internet plan of at least ${requiredNominalFormatted} is required.`;
  }

  return {
    success: true,
    data: {
      isFeasible,
      requiredEffectiveBytesPerSec,
      requiredEffectiveMBs,
      requiredEffectiveMbps,
      requiredEffectiveFormatted,
      requiredNominalConnectionBytesPerSec: requiredNominalConnectionBytes,
      requiredNominalConnectionSpeed,
      requiredNominalConnectionFormatted: requiredNominalFormatted,
      serverCapEnabled,
      serverCapMBs,
      maxFeasibleEffectiveMBs,
      decisionNote,
    },
  };
}
