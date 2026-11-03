/**
 * Upload Planning Calculator — Type Definitions
 *
 * Dedicated domain types for upstream bandwidth, reserved overhead,
 * multi-file setup latency, and upload window capacity planning.
 */

export type UploadCalculationMode = 'upload-time' | 'required-speed' | 'window-capacity';

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

export interface UploadCalculationSuccess<T> {
  success: true;
  data: T;
}

export interface UploadCalculationFailure {
  success: false;
  error: string;
}

export type UploadCalculationResult<T> = UploadCalculationSuccess<T> | UploadCalculationFailure;

/**
 * MODE A: Calculate Upload Duration given File Size & Upstream Speed
 */
export interface CalculateUploadTimeParams {
  fileSize: number;
  fileSizeUnit: FileSizeUnit;
  speed: number;
  speedUnit: SpeedUnit;
  throughputFactorPercent?: number; // default 100 (1..100)
  efficiencyPercent?: number; // legacy alias for throughputFactorPercent
  reservedBandwidthPercent?: number; // default 0 (0..95)
  fileCount?: number; // default 1 (>= 1)
  perFileOverheadSeconds?: number; // default 0 (>= 0)
}

export interface UploadTimeOutput {
  // Primary
  totalSeconds: number;
  formattedDuration: string;
  formattedDurationShort: string;

  // Secondary
  payloadSeconds: number;
  formattedPayloadDuration: string;
  overheadSeconds: number;
  formattedOverheadDuration: string;
  nominalSpeedBps: number;
  nominalSpeedFormatted: string;
  effectiveSpeedBps: number;
  effectiveSpeedFormatted: string;
  reservedSpeedBps: number;
  reservedSpeedFormatted: string;
  dataPerHourBytes: number;
  dataPerHourFormatted: string;
  decisionNote: string;
}

/**
 * MODE B: Calculate Minimum Required Upload Speed to finish in a Window
 */
export interface CalculateRequiredUploadSpeedParams {
  fileSize: number;
  fileSizeUnit: FileSizeUnit;
  windowDurationSeconds: number;
  targetSpeedUnit?: SpeedUnit;
  throughputFactorPercent?: number; // default 100
  efficiencyPercent?: number; // legacy alias
  reservedBandwidthPercent?: number; // default 0
  fileCount?: number; // default 1
  perFileOverheadSeconds?: number; // default 0
}

export interface RequiredUploadSpeedOutput {
  // Primary
  requiredNominalSpeed: number;
  requiredNominalSpeedFormatted: string;

  // Secondary
  requiredEffectiveSpeed: number;
  requiredEffectiveSpeedFormatted: string;
  usableWindowSeconds: number;
  usableWindowFormatted: string;
  overheadSeconds: number;
  formattedOverheadDuration: string;
  reservedBandwidthPercent: number;
  decisionNote: string;
}

/**
 * MODE C: Calculate Maximum Uploadable Data within a Window
 */
export interface CalculateUploadCapacityParams {
  speed: number;
  speedUnit: SpeedUnit;
  windowDurationSeconds: number;
  targetSizeUnit?: FileSizeUnit;
  throughputFactorPercent?: number; // default 100
  efficiencyPercent?: number; // legacy alias
  reservedBandwidthPercent?: number; // default 0
  setupReserveSeconds?: number; // default 0
}

export interface UploadCapacityOutput {
  // Primary
  maximumPayloadBytes: number;
  maximumPayloadFormatted: string;

  // Secondary
  effectiveSpeedBps: number;
  effectiveSpeedFormatted: string;
  dataPerHourBytes: number;
  dataPerHourFormatted: string;
  usableWindowSeconds: number;
  usableWindowFormatted: string;
  reservedSpeedBps: number;
  reservedSpeedFormatted: string;
  decisionNote: string;
}
