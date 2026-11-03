/**
 * File Transfer Bottleneck Calculation Engine
 *
 * Evaluates the full transfer pipeline:
 * Source Read Speed -> Interface / Network Speed -> Destination Write Speed.
 *
 * Implements:
 * 1. Mode A: Transfer Duration with bottleneck detection and optional small-file overhead.
 * 2. Mode B: Bottleneck Analysis and stage headroom evaluation.
 * 3. Mode C: Required Interface Speed with storage ceiling feasibility checking.
 */

import {
  FileTransferResult,
  CalculateFileTransferTimeParams,
  FileTransferTimeOutput,
  CalculateBottleneckAnalysisParams,
  BottleneckAnalysisOutput,
  CalculateRequiredInterfaceSpeedParams,
  RequiredInterfaceSpeedOutput,
  TransferStage,
  StageSpeedInfo,
  SpeedUnit,
  FileSizeUnit,
} from './types';
import { fileSizeToBytes, bytesToFileSize, speedToBps, bpsToSpeed } from '@/lib/transfer/units';
import { formatDuration, formatNumber } from '@/lib/transfer/format';

const EPSILON = 1e-4;

/**
 * Converts a speed value in any SpeedUnit directly into Bytes per Second.
 * 1 Byte = 8 bits. Standard Decimal SI multipliers (1 KB = 1000 B, 1 Mbps = 125,000 B/s).
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

function isNonNegativeFinite(val: unknown): val is number {
  return typeof val === 'number' && Number.isFinite(val) && val >= 0;
}

/**
 * Evaluates the 3 stages, determines the minimum bottleneck, and computes headroom.
 */
function analyzeStages(
  sourceSpeed: number,
  sourceSpeedUnit: SpeedUnit,
  interfaceSpeed: number,
  interfaceSpeedUnit: SpeedUnit,
  destinationSpeed: number,
  destinationSpeedUnit: SpeedUnit
): {
  rawBottleneckBytesPerSec: number;
  bottleneckStage: TransferStage;
  bottleneckStageLabel: string;
  stages: {
    source: StageSpeedInfo;
    interface: StageSpeedInfo;
    destination: StageSpeedInfo;
  };
} {
  const sourceBps = speedToBytesPerSec(sourceSpeed, sourceSpeedUnit);
  const interfaceBps = speedToBytesPerSec(interfaceSpeed, interfaceSpeedUnit);
  const destBps = speedToBytesPerSec(destinationSpeed, destinationSpeedUnit);

  const rawBottleneck = Math.min(sourceBps, interfaceBps, destBps);

  // Check for ties within EPSILON
  const sourceIsMin = Math.abs(sourceBps - rawBottleneck) < EPSILON;
  const interfaceIsMin = Math.abs(interfaceBps - rawBottleneck) < EPSILON;
  const destIsMin = Math.abs(destBps - rawBottleneck) < EPSILON;

  let bottleneckStage: TransferStage = 'interface';
  let bottleneckStageLabel = 'Interface';

  const minCount = (sourceIsMin ? 1 : 0) + (interfaceIsMin ? 1 : 0) + (destIsMin ? 1 : 0);

  if (minCount > 1) {
    bottleneckStage = 'tie';
    const tiedStages: string[] = [];
    if (sourceIsMin) tiedStages.push('Source');
    if (interfaceIsMin) tiedStages.push('Interface');
    if (destIsMin) tiedStages.push('Destination');
    bottleneckStageLabel = `Balanced (${tiedStages.join(' & ')})`;
  } else if (sourceIsMin) {
    bottleneckStage = 'source';
    bottleneckStageLabel = 'Source Read';
  } else if (destIsMin) {
    bottleneckStage = 'destination';
    bottleneckStageLabel = 'Destination Write';
  } else {
    bottleneckStage = 'interface';
    bottleneckStageLabel = 'Interface / Network';
  }

  function makeInfo(
    stage: 'source' | 'interface' | 'destination',
    label: string,
    enteredSpeed: number,
    enteredUnit: SpeedUnit,
    speedBps: number,
    isMin: boolean
  ): StageSpeedInfo {
    const headroomBytes = Math.max(0, speedBps - rawBottleneck);
    const headroomPct = rawBottleneck > 0 ? (headroomBytes / rawBottleneck) * 100 : 0;
    return {
      stage,
      label,
      enteredSpeed,
      enteredUnit,
      speedBytesPerSec: speedBps,
      speedMBs: speedBps / 1e6,
      speedMbps: (speedBps * 8) / 1e6,
      isBottleneck: isMin,
      headroomBytesPerSec: headroomBytes,
      headroomMBs: headroomBytes / 1e6,
      headroomPercent: headroomPct,
    };
  }

  return {
    rawBottleneckBytesPerSec: rawBottleneck,
    bottleneckStage,
    bottleneckStageLabel,
    stages: {
      source: makeInfo('source', 'Source Read', sourceSpeed, sourceSpeedUnit, sourceBps, sourceIsMin),
      interface: makeInfo('interface', 'Interface / Network', interfaceSpeed, interfaceSpeedUnit, interfaceBps, interfaceIsMin),
      destination: makeInfo('destination', 'Destination Write', destinationSpeed, destinationSpeedUnit, destBps, destIsMin),
    },
  };
}

/**
 * MODE A: Calculate File Transfer Time
 */
export function calculateFileTransferTime(
  params: CalculateFileTransferTimeParams
): FileTransferResult<FileTransferTimeOutput> {
  const {
    dataSize,
    dataSizeUnit,
    sourceSpeed,
    sourceSpeedUnit,
    interfaceSpeed,
    interfaceSpeedUnit,
    destinationSpeed,
    destinationSpeedUnit,
    planningEfficiencyPercent = 85,
    fileCount = 1,
    perFileOverheadSeconds = 0,
  } = params;

  if (!isPositiveFinite(dataSize)) {
    return { success: false, error: 'Data size must be a positive number greater than zero.' };
  }
  if (!isPositiveFinite(sourceSpeed)) {
    return { success: false, error: 'Source read speed must be a positive number greater than zero.' };
  }
  if (!isPositiveFinite(interfaceSpeed)) {
    return { success: false, error: 'Interface speed must be a positive number greater than zero.' };
  }
  if (!isPositiveFinite(destinationSpeed)) {
    return { success: false, error: 'Destination write speed must be a positive number greater than zero.' };
  }
  if (!Number.isFinite(planningEfficiencyPercent) || planningEfficiencyPercent < 1 || planningEfficiencyPercent > 100) {
    return { success: false, error: 'Planning efficiency must be between 1% and 100%.' };
  }
  if (!Number.isFinite(fileCount) || fileCount < 1) {
    return { success: false, error: 'File count must be an integer of 1 or greater.' };
  }
  if (!isNonNegativeFinite(perFileOverheadSeconds)) {
    return { success: false, error: 'Per-file overhead must be a non-negative number.' };
  }

  const analysis = analyzeStages(
    sourceSpeed,
    sourceSpeedUnit,
    interfaceSpeed,
    interfaceSpeedUnit,
    destinationSpeed,
    destinationSpeedUnit
  );

  const payloadBytes = fileSizeToBytes(dataSize, dataSizeUnit);
  const efficiencyRatio = planningEfficiencyPercent / 100;
  const effectiveBytesPerSec = analysis.rawBottleneckBytesPerSec * efficiencyRatio;

  if (effectiveBytesPerSec <= 0) {
    return { success: false, error: 'Effective transfer throughput must be greater than zero.' };
  }

  const payloadSeconds = payloadBytes / effectiveBytesPerSec;
  const overheadSeconds = Math.floor(fileCount) * perFileOverheadSeconds;
  const totalSeconds = payloadSeconds + overheadSeconds;

  const totalDur = formatDuration(totalSeconds);
  const payloadDur = formatDuration(payloadSeconds);
  const overheadDur = formatDuration(overheadSeconds);

  const effectiveMBs = effectiveBytesPerSec / 1e6;
  const effectiveMbps = (effectiveBytesPerSec * 8) / 1e6;
  const effectiveThroughputFormatted = `${formatNumber(effectiveMBs, 2)} MB/s (${formatNumber(effectiveMbps, 2)} Mbps)`;

  const rawBottleneckMBs = analysis.rawBottleneckBytesPerSec / 1e6;
  const rawBottleneckMbps = (analysis.rawBottleneckBytesPerSec * 8) / 1e6;

  const dataPerHourBytes = effectiveBytesPerSec * 3600;
  const dataPerHourFormatted = `${formatNumber(bytesToFileSize(dataPerHourBytes, 'GB'), 2)} GB/hr`;

  let decisionNote = `Transfer throughput is capped by ${analysis.bottleneckStageLabel} at ${formatNumber(rawBottleneckMBs, 2)} MB/s raw.`;
  if (planningEfficiencyPercent < 100) {
    decisionNote += ` At ${planningEfficiencyPercent}% planning efficiency, sustained throughput is ${effectiveThroughputFormatted}.`;
  }
  if (overheadSeconds > 0) {
    decisionNote += ` Small-file workload overhead adds ${overheadDur.formattedShort} across ${fileCount} files.`;
  }

  return {
    success: true,
    data: {
      totalSeconds,
      formattedDuration: totalDur.formatted,
      formattedDurationShort: totalDur.formattedShort,
      bottleneckStage: analysis.bottleneckStage,
      bottleneckStageLabel: analysis.bottleneckStageLabel,
      rawBottleneckBytesPerSec: analysis.rawBottleneckBytesPerSec,
      rawBottleneckMBs,
      rawBottleneckMbps,
      effectiveBytesPerSec,
      effectiveMBs,
      effectiveMbps,
      effectiveThroughputFormatted,
      payloadSeconds,
      formattedPayloadDuration: payloadDur.formatted,
      overheadSeconds,
      formattedOverheadDuration: overheadDur.formatted,
      dataPerHourBytes,
      dataPerHourFormatted,
      stages: analysis.stages,
      decisionNote,
    },
  };
}

/**
 * MODE B: Bottleneck Analysis
 */
export function calculateBottleneckAnalysis(
  params: CalculateBottleneckAnalysisParams
): FileTransferResult<BottleneckAnalysisOutput> {
  const {
    sourceSpeed,
    sourceSpeedUnit,
    interfaceSpeed,
    interfaceSpeedUnit,
    destinationSpeed,
    destinationSpeedUnit,
    planningEfficiencyPercent = 85,
  } = params;

  if (!isPositiveFinite(sourceSpeed)) {
    return { success: false, error: 'Source read speed must be a positive number greater than zero.' };
  }
  if (!isPositiveFinite(interfaceSpeed)) {
    return { success: false, error: 'Interface speed must be a positive number greater than zero.' };
  }
  if (!isPositiveFinite(destinationSpeed)) {
    return { success: false, error: 'Destination write speed must be a positive number greater than zero.' };
  }
  if (!Number.isFinite(planningEfficiencyPercent) || planningEfficiencyPercent < 1 || planningEfficiencyPercent > 100) {
    return { success: false, error: 'Planning efficiency must be between 1% and 100%.' };
  }

  const analysis = analyzeStages(
    sourceSpeed,
    sourceSpeedUnit,
    interfaceSpeed,
    interfaceSpeedUnit,
    destinationSpeed,
    destinationSpeedUnit
  );

  const rawBottleneckMBs = analysis.rawBottleneckBytesPerSec / 1e6;
  const rawBottleneckMbps = (analysis.rawBottleneckBytesPerSec * 8) / 1e6;

  const efficiencyRatio = planningEfficiencyPercent / 100;
  const effectiveBytes = analysis.rawBottleneckBytesPerSec * efficiencyRatio;
  const effectiveMBs = effectiveBytes / 1e6;
  const effectiveMbps = (effectiveBytes * 8) / 1e6;

  let decisionNote = `The limiting stage is ${analysis.bottleneckStageLabel} at ${formatNumber(rawBottleneckMBs, 2)} MB/s (${formatNumber(rawBottleneckMbps, 2)} Mbps).`;
  if (analysis.bottleneckStage === 'interface') {
    decisionNote += ` Upgrading the connection link would yield faster transfers until storage write speed (${formatNumber(analysis.stages.destination.speedMBs, 2)} MB/s) becomes the next ceiling.`;
  } else if (analysis.bottleneckStage === 'destination') {
    decisionNote += ` Destination drive write throughput restricts performance; a faster network or source drive will not reduce transfer times.`;
  } else if (analysis.bottleneckStage === 'source') {
    decisionNote += ` Source drive read throughput restricts performance; the link and destination have unused headroom.`;
  }

  return {
    success: true,
    data: {
      bottleneckStage: analysis.bottleneckStage,
      bottleneckStageLabel: analysis.bottleneckStageLabel,
      rawBottleneckMBs,
      rawBottleneckMbps,
      effectiveMBs,
      effectiveMbps,
      efficiencyPercent: planningEfficiencyPercent,
      stages: analysis.stages,
      decisionNote,
    },
  };
}

/**
 * MODE C: Required Interface Speed
 */
export function calculateRequiredInterfaceSpeed(
  params: CalculateRequiredInterfaceSpeedParams
): FileTransferResult<RequiredInterfaceSpeedOutput> {
  const {
    dataSize,
    dataSizeUnit,
    targetDurationSeconds,
    sourceSpeed,
    sourceSpeedUnit,
    destinationSpeed,
    destinationSpeedUnit,
    targetSpeedUnit = 'Gbps',
    planningEfficiencyPercent = 85,
    fileCount = 1,
    perFileOverheadSeconds = 0,
  } = params;

  if (!isPositiveFinite(dataSize)) {
    return { success: false, error: 'Data size must be a positive number greater than zero.' };
  }
  if (!isPositiveFinite(targetDurationSeconds)) {
    return { success: false, error: 'Target duration must be a positive duration greater than zero.' };
  }
  if (!isPositiveFinite(sourceSpeed)) {
    return { success: false, error: 'Source read speed must be a positive number greater than zero.' };
  }
  if (!isPositiveFinite(destinationSpeed)) {
    return { success: false, error: 'Destination write speed must be a positive number greater than zero.' };
  }
  if (!Number.isFinite(planningEfficiencyPercent) || planningEfficiencyPercent < 1 || planningEfficiencyPercent > 100) {
    return { success: false, error: 'Planning efficiency must be between 1% and 100%.' };
  }

  const overheadSeconds = Math.floor(fileCount) * (perFileOverheadSeconds || 0);
  const usableWindowSeconds = targetDurationSeconds - overheadSeconds;

  if (usableWindowSeconds <= 0) {
    return {
      success: false,
      error: `Target transfer window (${formatDuration(targetDurationSeconds).formattedShort}) is shorter than file batch setup overhead (${formatDuration(overheadSeconds).formattedShort}). Increase target duration or reduce per-file overhead.`,
    };
  }

  const payloadBytes = fileSizeToBytes(dataSize, dataSizeUnit);
  const requiredEffectiveBytesPerSec = payloadBytes / usableWindowSeconds;
  const efficiencyRatio = planningEfficiencyPercent / 100;
  const requiredRawInterfaceBytesPerSec = requiredEffectiveBytesPerSec / efficiencyRatio;

  const sourceBps = speedToBytesPerSec(sourceSpeed, sourceSpeedUnit);
  const destBps = speedToBytesPerSec(destinationSpeed, destinationSpeedUnit);
  const storageCeilingBytes = Math.min(sourceBps, destBps);
  const storageCeilingMBs = storageCeilingBytes / 1e6;

  let storageCeilingStage: 'source' | 'destination' | 'none' = 'none';
  if (sourceBps < destBps) {
    storageCeilingStage = 'source';
  } else if (destBps < sourceBps) {
    storageCeilingStage = 'destination';
  }

  // Storage path ceiling after planning efficiency
  const maxFeasibleEffectiveBytes = storageCeilingBytes * efficiencyRatio;
  const isFeasible = requiredEffectiveBytesPerSec <= maxFeasibleEffectiveBytes;

  const requiredEffectiveMBs = requiredEffectiveBytesPerSec / 1e6;
  const requiredRawInterfaceMBs = requiredRawInterfaceBytesPerSec / 1e6;
  const requiredRawInterfaceGbps = (requiredRawInterfaceBytesPerSec * 8) / 1e9;

  const rawSpeedTargetVal = bytesPerSecToSpeed(requiredRawInterfaceBytesPerSec, targetSpeedUnit);
  const requiredRawInterfaceFormatted = `${formatNumber(rawSpeedTargetVal, 2)} ${targetSpeedUnit}`;
  const requiredEffectiveFormatted = `${formatNumber(requiredEffectiveMBs, 2)} MB/s`;

  let decisionNote = '';
  if (!isFeasible) {
    const limitingLabel = storageCeilingStage === 'source' ? 'Source read speed' : 'Destination write speed';
    decisionNote = `Not feasible under current storage limits. ${limitingLabel} (${formatNumber(storageCeilingMBs, 2)} MB/s raw) caps effective throughput to ${formatNumber(maxFeasibleEffectiveBytes / 1e6, 2)} MB/s at ${planningEfficiencyPercent}% efficiency, but ${requiredEffectiveFormatted} is needed.`;
  } else {
    decisionNote = `Feasible. To complete ${formatNumber(dataSize, 2)} ${dataSizeUnit} in ${formatDuration(targetDurationSeconds).formattedShort}, an interface of at least ${requiredRawInterfaceFormatted} raw is required at ${planningEfficiencyPercent}% efficiency.`;
  }

  return {
    success: true,
    data: {
      isFeasible,
      requiredEffectiveBytesPerSec,
      requiredEffectiveMBs,
      requiredEffectiveSpeedFormatted: requiredEffectiveFormatted,
      requiredRawInterfaceBytesPerSec,
      requiredRawInterfaceSpeedFormatted: requiredRawInterfaceFormatted,
      requiredRawInterfaceGbps,
      requiredRawInterfaceMBs,
      storageCeilingBytesPerSec: storageCeilingBytes,
      storageCeilingMBs,
      storageCeilingStage,
      usableWindowSeconds,
      usableWindowFormatted: formatDuration(usableWindowSeconds).formatted,
      overheadSeconds,
      decisionNote,
    },
  };
}
