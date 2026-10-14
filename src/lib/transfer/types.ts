/**
 * Core type definitions for Global Data Transfer Utility
 */

export type DecimalFileSizeUnit = 'KB' | 'MB' | 'GB' | 'TB';
export type BinaryFileSizeUnit = 'KiB' | 'MiB' | 'GiB' | 'TiB';
export type FileSizeUnit = DecimalFileSizeUnit | BinaryFileSizeUnit;

export type BitSpeedUnit = 'Kbps' | 'Mbps' | 'Gbps';
export type ByteSpeedUnit = 'KB/s' | 'MB/s' | 'GB/s';
export type SpeedUnit = BitSpeedUnit | ByteSpeedUnit;

export type CalculationMode =
  | 'find-time'   // MODE A: File Size + Transfer Speed -> Transfer Time
  | 'find-speed'  // MODE B: File Size + Desired Completion Time -> Required Speed
  | 'find-size';  // MODE C: Transfer Speed + Available Time -> Transferable Size

export type ToolType = 'download' | 'upload' | 'file-transfer' | 'converter';

export interface FormattedDuration {
  rawSeconds: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
  formattedShort: string;
}

export interface CalculationSuccessResult<T> {
  success: true;
  data: T;
  efficiencyPercent: number;
  isTheoretical: boolean;
  warnings?: string[];
}

export interface CalculationErrorResult {
  success: false;
  error: string;
  field?: string;
}

export type CalculationResult<T> = CalculationSuccessResult<T> | CalculationErrorResult;

export interface TransferTimeOutput {
  seconds: number;
  duration: FormattedDuration;
  effectiveSpeedBps: number;
  totalBytes: number;
  totalBits: number;
}

export interface RequiredSpeedOutput {
  speedBps: number;
  value: number;
  unit: SpeedUnit;
  formatted: string;
}

export interface TransferableSizeOutput {
  bytes: number;
  value: number;
  unit: FileSizeUnit;
  formatted: string;
}

export interface SpeedConversionOutput {
  fromValue: number;
  fromUnit: SpeedUnit;
  toValue: number;
  toUnit: SpeedUnit;
  formatted: string;
}

export interface CalculatorUrlParams {
  size?: string;
  sizeUnit?: string;
  speed?: string;
  speedUnit?: string;
  time?: string;
  mode?: string;
  efficiency?: string;
}
