import { SpeedUnit, CalculationResult, SpeedConversionOutput } from './types';
import { speedToBps, bpsToSpeed } from './units';
import { validatePositiveNumber } from './validation';
import { formatNumber } from './format';

/**
 * Convert Mbps to MB/s directly (1 byte = 8 bits)
 * 100 Mbps -> 12.5 MB/s
 */
export function mbpsToMBs(mbps: number): number {
  return mbps / 8;
}

/**
 * Convert MB/s to Mbps directly (1 byte = 8 bits)
 * 12.5 MB/s -> 100 Mbps
 */
export function mbsToMbps(mbs: number): number {
  return mbs * 8;
}

/**
 * Bidirectional speed converter between any supported speed units
 */
export function convertSpeed(
  value: unknown,
  fromUnit: SpeedUnit,
  toUnit: SpeedUnit
): CalculationResult<SpeedConversionOutput> {
  const validation = validatePositiveNumber(value, 'Speed', true);
  if (!validation.isValid) {
    return {
      success: false,
      error: validation.error || 'Invalid speed value',
      field: 'value',
    };
  }

  const rawValue = validation.value;
  let targetValue: number;

  if (fromUnit === toUnit) {
    targetValue = rawValue;
  } else if (fromUnit === 'Mbps' && toUnit === 'MB/s') {
    targetValue = mbpsToMBs(rawValue);
  } else if (fromUnit === 'MB/s' && toUnit === 'Mbps') {
    targetValue = mbsToMbps(rawValue);
  } else {
    const bps = speedToBps(rawValue, fromUnit);
    targetValue = bpsToSpeed(bps, toUnit);
  }

  return {
    success: true,
    data: {
      fromValue: rawValue,
      fromUnit,
      toValue: targetValue,
      toUnit,
      formatted: `${formatNumber(targetValue)} ${toUnit}`,
    },
    efficiencyPercent: 100,
    isTheoretical: true,
  };
}
