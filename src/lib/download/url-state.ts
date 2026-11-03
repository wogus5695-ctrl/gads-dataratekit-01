/**
 * URL State Serialization and Deserialization for Download Path Planning Calculator
 *
 * Encodes download planning parameters into URL search parameters cleanly
 * and restores state safely with robust fallbacks on corrupted or extreme inputs.
 */

import {
  DownloadMode,
  FileSizeUnit,
  SpeedUnit,
  TimeUnit,
} from './types';

export interface DownloadCalculatorState {
  mode: DownloadMode;
  fileSize: number;
  fileSizeUnit: FileSizeUnit;
  speed: number;
  speedUnit: SpeedUnit;
  bandwidthShare: number;
  planningEfficiency: number;
  serverCapEnabled: boolean;
  serverCap: number;
  serverCapUnit: SpeedUnit;
  targetDuration: number;
  targetDurationUnit: TimeUnit;
}

export const DEFAULT_DOWNLOAD_STATE: DownloadCalculatorState = {
  mode: 'download-time',
  fileSize: 100,
  fileSizeUnit: 'GB',
  speed: 100,
  speedUnit: 'Mbps',
  bandwidthShare: 100,
  planningEfficiency: 90,
  serverCapEnabled: false,
  serverCap: 25,
  serverCapUnit: 'MB/s',
  targetDuration: 2,
  targetDurationUnit: 'hours',
};

const VALID_MODES: Record<string, DownloadMode> = {
  time: 'download-time',
  'download-time': 'download-time',
  bottleneck: 'bottleneck',
  'download-bottleneck': 'bottleneck',
  speed: 'required-speed',
  'required-speed': 'required-speed',
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
 * Parses search parameters into validated DownloadCalculatorState.
 */
export function parseDownloadUrlState(params: URLSearchParams): DownloadCalculatorState {
  const result: DownloadCalculatorState = { ...DEFAULT_DOWNLOAD_STATE };

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

  // 3. Internet Speed & Unit
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

  // 4. Bandwidth Share (%)
  const shareParam = params.get('share');
  if (shareParam) {
    const val = parseFloat(shareParam);
    if (Number.isFinite(val) && val >= 1 && val <= 100) {
      result.bandwidthShare = val;
    }
  }

  // 5. Planning Efficiency (%)
  const effParam = params.get('eff');
  if (effParam) {
    const val = parseFloat(effParam);
    if (Number.isFinite(val) && val >= 1 && val <= 100) {
      result.planningEfficiency = val;
    }
  }

  // 6. Server Cap
  const serverCapEnabledParam = params.get('serverCapEnabled');
  if (serverCapEnabledParam === '1' || serverCapEnabledParam === 'true') {
    result.serverCapEnabled = true;
  }
  const serverCapParam = params.get('serverCap');
  if (serverCapParam) {
    const val = parseFloat(serverCapParam);
    if (Number.isFinite(val) && val > 0) {
      result.serverCap = val;
    }
  }
  const serverCapUnitParam = params.get('serverCapUnit');
  if (serverCapUnitParam && VALID_SPEED_UNITS.has(serverCapUnitParam)) {
    result.serverCapUnit = serverCapUnitParam as SpeedUnit;
  }

  // 7. Target Duration & Unit (for Mode C)
  const timeParam = params.get('time');
  if (timeParam) {
    const val = parseFloat(timeParam);
    if (Number.isFinite(val) && val > 0) {
      result.targetDuration = val;
    }
  }
  const timeUnitParam = params.get('timeUnit');
  if (timeUnitParam && VALID_TIME_UNITS.has(timeUnitParam)) {
    result.targetDurationUnit = timeUnitParam as TimeUnit;
  }

  return result;
}

/**
 * Serializes DownloadCalculatorState into a clean query string.
 * Omits parameters matching defaults to keep URLs compact.
 */
export function serializeDownloadUrlState(state: DownloadCalculatorState): string {
  const params = new URLSearchParams();

  if (state.mode !== DEFAULT_DOWNLOAD_STATE.mode) {
    params.set('mode', state.mode);
  }

  if (state.mode !== 'bottleneck') {
    if (state.fileSize !== DEFAULT_DOWNLOAD_STATE.fileSize) {
      params.set('size', String(state.fileSize));
    }
    if (state.fileSizeUnit !== DEFAULT_DOWNLOAD_STATE.fileSizeUnit) {
      params.set('sizeUnit', state.fileSizeUnit);
    }
  }

  if (state.mode !== 'required-speed') {
    if (state.speed !== DEFAULT_DOWNLOAD_STATE.speed) {
      params.set('speed', String(state.speed));
    }
    if (state.speedUnit !== DEFAULT_DOWNLOAD_STATE.speedUnit) {
      params.set('speedUnit', state.speedUnit);
    }
  }

  if (state.bandwidthShare !== DEFAULT_DOWNLOAD_STATE.bandwidthShare) {
    params.set('share', String(state.bandwidthShare));
  }

  if (state.planningEfficiency !== DEFAULT_DOWNLOAD_STATE.planningEfficiency) {
    params.set('eff', String(state.planningEfficiency));
  }

  if (state.serverCapEnabled) {
    params.set('serverCapEnabled', '1');
    if (state.serverCap !== DEFAULT_DOWNLOAD_STATE.serverCap) {
      params.set('serverCap', String(state.serverCap));
    }
    if (state.serverCapUnit !== DEFAULT_DOWNLOAD_STATE.serverCapUnit) {
      params.set('serverCapUnit', state.serverCapUnit);
    }
  }

  if (state.mode === 'required-speed') {
    if (state.targetDuration !== DEFAULT_DOWNLOAD_STATE.targetDuration) {
      params.set('time', String(state.targetDuration));
    }
    if (state.targetDurationUnit !== DEFAULT_DOWNLOAD_STATE.targetDurationUnit) {
      params.set('timeUnit', state.targetDurationUnit);
    }
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}
