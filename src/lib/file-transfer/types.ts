/**
 * File Transfer Bottleneck Calculator — Type Definitions
 *
 * Models a complete data path: Source Read -> Interface/Network -> Destination Write.
 * Identifies the limiting bottleneck stage, evaluates headroom, and calculates realistic
 * transfer durations and required interface speeds.
 */

export type FileTransferMode = 'transfer-time' | 'bottleneck' | 'required-interface';

export type TransferStage = 'source' | 'interface' | 'destination' | 'tie';

export type FileSizeUnit =
  | 'KB'
  | 'MB'
  | 'GB'
  | 'TB'
  | 'KiB'
  | 'MiB'
  | 'GiB'
  | 'TiB';

export type SpeedUnit =
  | 'Kbps'
  | 'Mbps'
  | 'Gbps'
  | 'KB/s'
  | 'MB/s'
  | 'GB/s';

export type TimeUnit = 'seconds' | 'minutes' | 'hours' | 'days';

export interface StageSpeedInfo {
  stage: 'source' | 'interface' | 'destination';
  label: string;
  enteredSpeed: number;
  enteredUnit: SpeedUnit;
  speedBytesPerSec: number;
  speedMBs: number;
  speedMbps: number;
  isBottleneck: boolean;
  headroomBytesPerSec: number;
  headroomMBs: number;
  headroomPercent: number; // percentage above bottleneck throughput
}

export interface FileTransferCalculationSuccess<T> {
  success: true;
  data: T;
}

export interface FileTransferCalculationFailure {
  success: false;
  error: string;
}

export type FileTransferResult<T> =
  | FileTransferCalculationSuccess<T>
  | FileTransferCalculationFailure;

/**
 * MODE A: Calculate Transfer Duration given Path Speeds & Data Size
 */
export interface CalculateFileTransferTimeParams {
  dataSize: number;
  dataSizeUnit: FileSizeUnit;
  sourceSpeed: number;
  sourceSpeedUnit: SpeedUnit;
  interfaceSpeed: number;
  interfaceSpeedUnit: SpeedUnit;
  destinationSpeed: number;
  destinationSpeedUnit: SpeedUnit;
  planningEfficiencyPercent?: number; // default 85 (1..100)
  fileCount?: number; // default 1 (>= 1)
  perFileOverheadSeconds?: number; // default 0 (>= 0)
}

export interface FileTransferTimeOutput {
  // Primary
  totalSeconds: number;
  formattedDuration: string;
  formattedDurationShort: string;

  // Bottleneck
  bottleneckStage: TransferStage;
  bottleneckStageLabel: string;
  rawBottleneckBytesPerSec: number;
  rawBottleneckMBs: number;
  rawBottleneckMbps: number;

  // Throughput
  effectiveBytesPerSec: number;
  effectiveMBs: number;
  effectiveMbps: number;
  effectiveThroughputFormatted: string;

  // Timings
  payloadSeconds: number;
  formattedPayloadDuration: string;
  overheadSeconds: number;
  formattedOverheadDuration: string;
  dataPerHourBytes: number;
  dataPerHourFormatted: string;

  // Stages
  stages: {
    source: StageSpeedInfo;
    interface: StageSpeedInfo;
    destination: StageSpeedInfo;
  };

  decisionNote: string;
}

/**
 * MODE B: Bottleneck Analysis across Transfer Stages
 */
export interface CalculateBottleneckAnalysisParams {
  sourceSpeed: number;
  sourceSpeedUnit: SpeedUnit;
  interfaceSpeed: number;
  interfaceSpeedUnit: SpeedUnit;
  destinationSpeed: number;
  destinationSpeedUnit: SpeedUnit;
  planningEfficiencyPercent?: number; // default 85
}

export interface BottleneckAnalysisOutput {
  bottleneckStage: TransferStage;
  bottleneckStageLabel: string;
  rawBottleneckMBs: number;
  rawBottleneckMbps: number;
  effectiveMBs: number;
  effectiveMbps: number;
  efficiencyPercent: number;
  stages: {
    source: StageSpeedInfo;
    interface: StageSpeedInfo;
    destination: StageSpeedInfo;
  };
  decisionNote: string;
}

/**
 * MODE C: Required Interface Speed to meet a Target Time Window
 */
export interface CalculateRequiredInterfaceSpeedParams {
  dataSize: number;
  dataSizeUnit: FileSizeUnit;
  targetDurationSeconds: number;
  sourceSpeed: number;
  sourceSpeedUnit: SpeedUnit;
  destinationSpeed: number;
  destinationSpeedUnit: SpeedUnit;
  targetSpeedUnit?: SpeedUnit; // default 'Gbps'
  planningEfficiencyPercent?: number; // default 85
  fileCount?: number; // default 1
  perFileOverheadSeconds?: number; // default 0
}

export interface RequiredInterfaceSpeedOutput {
  isFeasible: boolean;
  requiredEffectiveBytesPerSec: number;
  requiredEffectiveMBs: number;
  requiredEffectiveSpeedFormatted: string;
  requiredRawInterfaceBytesPerSec: number;
  requiredRawInterfaceSpeedFormatted: string;
  requiredRawInterfaceGbps: number;
  requiredRawInterfaceMBs: number;
  storageCeilingBytesPerSec: number;
  storageCeilingMBs: number;
  storageCeilingStage: 'source' | 'destination' | 'none';
  usableWindowSeconds: number;
  usableWindowFormatted: string;
  overheadSeconds: number;
  decisionNote: string;
}
