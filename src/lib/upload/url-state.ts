/**
 * URL State Serialization and Deserialization for Upload Calculator
 *
 * Encodes upload planning parameters cleanly into URL search parameters
 * and recovers state safely with robust fallbacks on corrupted or extreme inputs.
 */

import {
  UploadCalculationMode,
  FileSizeUnit,
  SpeedUnit,
  TimeUnit,
} from './types';

export interface UploadCalculatorState {
  mode: UploadCalculationMode;
  fileSize: number;
  fileSizeUnit: FileSizeUnit;
  speed: number;
  speedUnit: SpeedUnit;
  efficiency: number;
  reservedBandwidth: number;
  fileCount: number;
  perFileOverhead: number;
  windowDuration: number;
  windowDurationUnit: TimeUnit;
}

export const DEFAULT_UPLOAD_STATE: UploadCalculatorState = {
  mode: 'upload-time',
  fileSize: 10,
  fileSizeUnit: 'GB',
  speed: 20,
  speedUnit: 'Mbps',
  efficiency: 100,
  reservedBandwidth: 0,
  fileCount: 1,
  perFileOverhead: 0,
  windowDuration: 2,
  windowDurationUnit: 'hours',
};

const VALID_MODES: Record<string, UploadCalculationMode> = {
  time: 'upload-time',
  'upload-time': 'upload-time',
  speed: 'required-speed',
  'required-speed': 'required-speed',
  capacity: 'window-capacity',
  'window-capacity': 'window-capacity',
};

const VALID_FILE_UNITS: Set<string> = new Set([
  'KB', 'MB', 'GB', 'TB', 'KiB', 'MiB', 'GiB', 'TiB',
]);

const VALID_SPEED_UNITS: Set<string> = new Set([
  'Kbps', 'Mbps', 'Gbps', 'KB/s', 'MB/s', 'GB/s',
]);

const VALID_TIME_UNITS: Set<string> = new Set([
  'seconds', 'minutes', 'hours', 'days',
]);

/**
 * Parses search parameters into validated UploadCalculatorState.
 */
export function parseUploadUrlState(params: URLSearchParams): UploadCalculatorState {
  const result: UploadCalculatorState = { ...DEFAULT_UPLOAD_STATE };

  // 1. Mode
  const modeParam = params.get('mode');
  if (modeParam && VALID_MODES[modeParam]) {
    result.mode = VALID_MODES[modeParam];
  }

  // 2. File Size & Unit
  const sizeParam = params.get('size');
  if (sizeParam) {
    const val = parseFloat(sizeParam);
    if (Number.isFinite(val) && val > 0) {
      result.fileSize = val;
    }
  }
  const sizeUnitParam = params.get('sizeUnit');
  if (sizeUnitParam && VALID_FILE_UNITS.has(sizeUnitParam)) {
    result.fileSizeUnit = sizeUnitParam as FileSizeUnit;
  }

  // 3. Upload Speed & Unit
  const speedParam = params.get('speed');
  if (speedParam) {
    const val = parseFloat(speedParam);
    if (Number.isFinite(val) && val > 0) {
      result.speed = val;
    }
  }
  const speedUnitParam = params.get('speedUnit');
  if (speedUnitParam && VALID_SPEED_UNITS.has(speedUnitParam)) {
    result.speedUnit = speedUnitParam as SpeedUnit;
  }

  // 4. Efficiency
  const effParam = params.get('efficiency');
  if (effParam) {
    const val = parseFloat(effParam);
    if (Number.isFinite(val) && val >= 1 && val <= 100) {
      result.efficiency = val;
    }
  }

  // 5. Reserved Bandwidth
  const resParam = params.get('reserve');
  if (resParam) {
    const val = parseFloat(resParam);
    if (Number.isFinite(val) && val >= 0 && val < 100) {
      result.reservedBandwidth = val;
    }
  }

  // 6. File Count
  const filesParam = params.get('files');
  if (filesParam) {
    const val = parseInt(filesParam, 10);
    if (Number.isFinite(val) && val >= 1 && val <= 100000) {
      result.fileCount = val;
    }
  }

  // 7. Per-file Overhead
  const overheadParam = params.get('overhead');
  if (overheadParam) {
    const val = parseFloat(overheadParam);
    if (Number.isFinite(val) && val >= 0 && val <= 600) {
      result.perFileOverhead = val;
    }
  }

  // 8. Window Duration & Unit
  const timeParam = params.get('time');
  if (timeParam) {
    const val = parseFloat(timeParam);
    if (Number.isFinite(val) && val > 0) {
      result.windowDuration = val;
    }
  }
  const timeUnitParam = params.get('timeUnit');
  if (timeUnitParam && VALID_TIME_UNITS.has(timeUnitParam)) {
    result.windowDurationUnit = timeUnitParam as TimeUnit;
  }

  return result;
}

/**
 * Serializes UploadCalculatorState into a clean query string.
 * Omits default values to keep URLs minimal and clean.
 */
export function serializeUploadUrlState(state: UploadCalculatorState): string {
  const params = new URLSearchParams();

  // Mode short mapping
  if (state.mode === 'required-speed') {
    params.set('mode', 'speed');
  } else if (state.mode === 'window-capacity') {
    params.set('mode', 'capacity');
  }

  if (state.mode !== 'window-capacity') {
    params.set('size', state.fileSize.toString());
    params.set('sizeUnit', state.fileSizeUnit);
  }

  if (state.mode !== 'required-speed') {
    params.set('speed', state.speed.toString());
    params.set('speedUnit', state.speedUnit);
  }

  if (state.mode !== 'upload-time') {
    params.set('time', state.windowDuration.toString());
    params.set('timeUnit', state.windowDurationUnit);
  }

  if (state.efficiency !== DEFAULT_UPLOAD_STATE.efficiency) {
    params.set('efficiency', state.efficiency.toString());
  }

  if (state.reservedBandwidth !== DEFAULT_UPLOAD_STATE.reservedBandwidth) {
    params.set('reserve', state.reservedBandwidth.toString());
  }

  if (state.fileCount !== DEFAULT_UPLOAD_STATE.fileCount) {
    params.set('files', state.fileCount.toString());
  }

  if (state.perFileOverhead !== DEFAULT_UPLOAD_STATE.perFileOverhead) {
    params.set('overhead', state.perFileOverhead.toString());
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}
