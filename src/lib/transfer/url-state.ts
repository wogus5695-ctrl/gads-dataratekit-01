import {
  FileSizeUnit,
  SpeedUnit,
  CalculationMode,
  CalculatorUrlParams,
} from './types';
import { isFileSizeUnit, isSpeedUnit } from './units';
import { validatePositiveNumber, validateEfficiency } from './validation';

export interface CalculatorState {
  mode: CalculationMode;
  fileSize: number;
  fileSizeUnit: FileSizeUnit;
  speed: number;
  speedUnit: SpeedUnit;
  durationSeconds: number;
  efficiencyPercent: number;
}

export const DEFAULT_CALCULATOR_STATE: CalculatorState = {
  mode: 'find-time',
  fileSize: 100,
  fileSizeUnit: 'GB',
  speed: 100,
  speedUnit: 'Mbps',
  durationSeconds: 7200, // 2 hours
  efficiencyPercent: 100,
};

/**
 * Safely parse URL search parameters into a valid CalculatorState.
 * Prevents NaN, malformed units, or malicious/unexpected inputs from crashing the app.
 */
export function parseCalculatorState(
  params: URLSearchParams | Record<string, string | string[] | undefined>
): CalculatorState {
  const getParam = (key: string): string | undefined => {
    if (params instanceof URLSearchParams) {
      return params.get(key) ?? undefined;
    }
    const val = params[key];
    if (Array.isArray(val)) return val[0];
    return val;
  };

  const state: CalculatorState = { ...DEFAULT_CALCULATOR_STATE };

  // Mode validation
  const rawMode = getParam('mode');
  if (rawMode === 'find-time' || rawMode === 'find-speed' || rawMode === 'find-size') {
    state.mode = rawMode;
  }

  // File size validation
  const rawSize = getParam('size');
  if (rawSize !== undefined) {
    const val = validatePositiveNumber(rawSize, 'Size', false);
    if (val.isValid) {
      state.fileSize = val.value;
    }
  }

  const rawSizeUnit = getParam('sizeUnit');
  if (rawSizeUnit && isFileSizeUnit(rawSizeUnit)) {
    state.fileSizeUnit = rawSizeUnit;
  }

  // Speed validation
  const rawSpeed = getParam('speed');
  if (rawSpeed !== undefined) {
    const val = validatePositiveNumber(rawSpeed, 'Speed', false);
    if (val.isValid) {
      state.speed = val.value;
    }
  }

  const rawSpeedUnit = getParam('speedUnit');
  if (rawSpeedUnit && isSpeedUnit(rawSpeedUnit)) {
    state.speedUnit = rawSpeedUnit;
  }

  // Duration validation
  const rawTime = getParam('time');
  if (rawTime !== undefined) {
    const val = validatePositiveNumber(rawTime, 'Time', false);
    if (val.isValid) {
      state.durationSeconds = val.value;
    }
  }

  // Efficiency validation
  const rawEfficiency = getParam('efficiency');
  if (rawEfficiency !== undefined) {
    const val = validateEfficiency(rawEfficiency, 100);
    if (val.isValid) {
      state.efficiencyPercent = val.value;
    }
  }

  return state;
}

/**
 * Serialize CalculatorState to URL query parameters string
 */
export function serializeCalculatorState(
  state: Partial<CalculatorState>
): string {
  const params = new URLSearchParams();

  if (state.mode && state.mode !== DEFAULT_CALCULATOR_STATE.mode) {
    params.set('mode', state.mode);
  }
  if (state.fileSize !== undefined) {
    params.set('size', state.fileSize.toString());
  }
  if (state.fileSizeUnit) {
    params.set('sizeUnit', state.fileSizeUnit);
  }
  if (state.speed !== undefined) {
    params.set('speed', state.speed.toString());
  }
  if (state.speedUnit) {
    params.set('speedUnit', state.speedUnit);
  }
  if (state.durationSeconds !== undefined && state.mode !== 'find-time') {
    params.set('time', state.durationSeconds.toString());
  }
  if (state.efficiencyPercent !== undefined && state.efficiencyPercent !== 100) {
    params.set('efficiency', state.efficiencyPercent.toString());
  }

  return params.toString();
}
