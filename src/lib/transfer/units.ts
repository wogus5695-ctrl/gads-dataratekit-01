import {
  FileSizeUnit,
  SpeedUnit,
  DecimalFileSizeUnit,
  BinaryFileSizeUnit,
  BitSpeedUnit,
  ByteSpeedUnit,
} from './types';

// Precise byte multipliers for File Size
export const FILE_SIZE_MULTIPLIERS: Record<FileSizeUnit, number> = {
  // Decimal Units (SI, base 10)
  KB: 1_000,
  MB: 1_000_000,
  GB: 1_000_000_000,
  TB: 1_000_000_000_000,

  // Binary Units (IEC, base 2)
  KiB: 1_024,
  MiB: 1_048_576,
  GiB: 1_073_741_824,
  TiB: 1_099_511_627_776,
};

// Bits per second multipliers for Speed Units (8 bits = 1 byte)
export const SPEED_TO_BPS_MULTIPLIERS: Record<SpeedUnit, number> = {
  // Bit-based speeds (Telecommunications / ISP ratings)
  Kbps: 1_000,
  Mbps: 1_000_000,
  Gbps: 1_000_000_000,

  // Byte-based speeds (File transfer rates, OS download speeds)
  'KB/s': 1_000 * 8, // 8,000 bps
  'MB/s': 1_000_000 * 8, // 8,000,000 bps
  'GB/s': 1_000_000_000 * 8, // 8,000,000,000 bps
};

export const DECIMAL_FILE_UNITS: DecimalFileSizeUnit[] = ['KB', 'MB', 'GB', 'TB'];
export const BINARY_FILE_UNITS: BinaryFileSizeUnit[] = ['KiB', 'MiB', 'GiB', 'TiB'];
export const BIT_SPEED_UNITS: BitSpeedUnit[] = ['Kbps', 'Mbps', 'Gbps'];
export const BYTE_SPEED_UNITS: ByteSpeedUnit[] = ['KB/s', 'MB/s', 'GB/s'];

export function isFileSizeUnit(val: string): val is FileSizeUnit {
  return val in FILE_SIZE_MULTIPLIERS;
}

export function isSpeedUnit(val: string): val is SpeedUnit {
  return val in SPEED_TO_BPS_MULTIPLIERS;
}

/**
 * Converts any supported file size to total bytes
 */
export function fileSizeToBytes(value: number, unit: FileSizeUnit): number {
  const multiplier = FILE_SIZE_MULTIPLIERS[unit];
  if (!multiplier) {
    throw new Error(`Unsupported file size unit: ${unit}`);
  }
  return value * multiplier;
}

/**
 * Converts total bytes to a specific target file size unit
 */
export function bytesToFileSize(bytes: number, targetUnit: FileSizeUnit): number {
  const multiplier = FILE_SIZE_MULTIPLIERS[targetUnit];
  if (!multiplier) {
    throw new Error(`Unsupported file size unit: ${targetUnit}`);
  }
  return bytes / multiplier;
}

/**
 * Converts any speed to raw bits per second (bps)
 */
export function speedToBps(value: number, unit: SpeedUnit): number {
  const multiplier = SPEED_TO_BPS_MULTIPLIERS[unit];
  if (!multiplier) {
    throw new Error(`Unsupported speed unit: ${unit}`);
  }
  return value * multiplier;
}

/**
 * Converts raw bits per second (bps) to a specific target speed unit
 */
export function bpsToSpeed(bps: number, targetUnit: SpeedUnit): number {
  const multiplier = SPEED_TO_BPS_MULTIPLIERS[targetUnit];
  if (!multiplier) {
    throw new Error(`Unsupported speed unit: ${targetUnit}`);
  }
  return bps / multiplier;
}
