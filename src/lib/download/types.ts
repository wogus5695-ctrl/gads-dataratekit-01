/**
 * Download Path Planning Calculator — Type Definitions
 *
 * Models an internet download path:
 * Internet Connection Rate -> Bandwidth Share -> Optional Remote Server/CDN Cap -> Planning Efficiency
 * -> Effective Download Throughput & Estimated Duration.
 */

export type DownloadMode = 'download-time' | 'bottleneck' | 'required-speed';

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

export type DownloadLimitingFactor =
  | 'connection'
  | 'bandwidth-share'
  | 'server-cap'
  | 'balanced';

export interface DownloadCalculationSuccess<T> {
  success: true;
  data: T;
}

export interface DownloadCalculationFailure {
  success: false;
  error: string;
}

export type DownloadResult<T> =
  | DownloadCalculationSuccess<T>
  | DownloadCalculationFailure;

/**
 * MODE A: Calculate Download Duration
 */
export interface CalculateDownloadTimeParams {
  fileSize: number;
  fileSizeUnit: FileSizeUnit;
  connectionSpeed: number;
  connectionSpeedUnit: SpeedUnit;
  availableBandwidthPercent?: number; // default 100 (1..100)
  serverCapEnabled?: boolean; // default false
  serverCapSpeed?: number;
  serverCapSpeedUnit?: SpeedUnit;
  planningEfficiencyPercent?: number; // default 90 (1..100)
}

export interface DownloadTimeOutput {
  // Estimated / Planning-adjusted duration
  totalSeconds: number;
  formattedDuration: string;
  formattedDurationShort: string;

  // Theoretical connection-limit duration (100% nominal connection speed)
  theoreticalSeconds: number;
  formattedTheoreticalDuration: string;
  formattedTheoreticalDurationShort: string;

  // Throughput
  effectiveBytesPerSec: number;
  effectiveMBs: number;
  effectiveMbps: number;
  effectiveThroughputFormatted: string;

  // Equivalent MB/s for direct understanding
  equivalentMBsFormatted: string;

  // Path metrics
  nominalConnectionBytesPerSec: number;
  availableConnectionBytesPerSec: number;
  pathCeilingBytesPerSec: number;
  serverCapBytesPerSec: number | null;

  // Active constraint
  limitingFactor: DownloadLimitingFactor;
  limitingFactorLabel: string;
  decisionNote: string;
}

/**
 * MODE B: Download Path Bottleneck Analysis
 */
export interface CalculateDownloadBottleneckParams {
  connectionSpeed: number;
  connectionSpeedUnit: SpeedUnit;
  availableBandwidthPercent?: number; // default 100
  serverCapEnabled?: boolean; // default false
  serverCapSpeed?: number;
  serverCapSpeedUnit?: SpeedUnit;
  planningEfficiencyPercent?: number; // default 90
}

export interface DownloadBottleneckOutput {
  nominalConnectionMbps: number;
  nominalConnectionMBs: number;
  availableConnectionMbps: number;
  availableConnectionMBs: number;
  availableBandwidthPercent: number;

  serverCapEnabled: boolean;
  serverCapMbps: number | null;
  serverCapMBs: number | null;

  pathCeilingMbps: number;
  pathCeilingMBs: number;

  effectiveThroughputMbps: number;
  effectiveThroughputMBs: number;
  planningEfficiencyPercent: number;

  limitingFactor: DownloadLimitingFactor;
  limitingFactorLabel: string;
  limitingFactorExplanation: string;

  // Headroom
  connectionHeadroomPercent: number;
  serverHeadroomPercent: number | null;
  decisionNote: string;
}

/**
 * MODE C: Required Connection Speed
 */
export interface CalculateRequiredDownloadSpeedParams {
  fileSize: number;
  fileSizeUnit: FileSizeUnit;
  targetDurationSeconds: number;
  availableBandwidthPercent?: number; // default 100
  serverCapEnabled?: boolean; // default false
  serverCapSpeed?: number;
  serverCapSpeedUnit?: SpeedUnit;
  planningEfficiencyPercent?: number; // default 90
  targetSpeedUnit?: SpeedUnit; // default 'Mbps'
}

export interface RequiredDownloadSpeedOutput {
  isFeasible: boolean;
  requiredEffectiveBytesPerSec: number;
  requiredEffectiveMBs: number;
  requiredEffectiveMbps: number;
  requiredEffectiveFormatted: string;

  requiredNominalConnectionBytesPerSec: number;
  requiredNominalConnectionSpeed: number;
  requiredNominalConnectionFormatted: string;

  serverCapEnabled: boolean;
  serverCapMBs: number | null;
  maxFeasibleEffectiveMBs: number | null;

  decisionNote: string;
}
