/**
 * URL State Serialization and Deserialization for File Transfer Bottleneck Calculator
 *
 * Encodes multi-stage transfer planning parameters cleanly into URL search parameters
 * and recovers state safely with robust fallbacks on corrupted or extreme inputs.
 */

import {
  FileTransferMode,
  FileSizeUnit,
  SpeedUnit,
  TimeUnit,
} from './types';

export interface FileTransferCalculatorState {
  mode: FileTransferMode;
  dataSize: number;
  dataSizeUnit: FileSizeUnit;
  sourceSpeed: number;
  sourceSpeedUnit: SpeedUnit;
  interfaceSpeed: number;
  interfaceSpeedUnit: SpeedUnit;
  destSpeed: number;
  destSpeedUnit: SpeedUnit;
  efficiency: number;
  fileCount: number;
  overhead: number;
  targetDuration: number;
  targetDurationUnit: TimeUnit;
}

export const DEFAULT_FILE_TRANSFER_STATE: FileTransferCalculatorState = {
  mode: 'transfer-time',
  dataSize: 100,
  dataSizeUnit: 'GB',
  sourceSpeed: 500,
  sourceSpeedUnit: 'MB/s',
  interfaceSpeed: 1,
  interfaceSpeedUnit: 'Gbps',
  destSpeed: 300,
  destSpeedUnit: 'MB/s',
  efficiency: 85,
  fileCount: 1,
  overhead: 0,
  targetDuration: 15,
  targetDurationUnit: 'minutes',
};

const VALID_MODES: Record<string, FileTransferMode> = {
  time: 'transfer-time',
  'transfer-time': 'transfer-time',
  bottleneck: 'bottleneck',
  'bottleneck-analysis': 'bottleneck',
  speed: 'required-interface',
  interface: 'required-interface',
  'required-interface': 'required-interface',
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
 * Parses search parameters into validated FileTransferCalculatorState.
 */
export function parseFileTransferUrlState(params: URLSearchParams): FileTransferCalculatorState {
  const result: FileTransferCalculatorState = { ...DEFAULT_FILE_TRANSFER_STATE };

  // 1. Mode
  const modeParam = params.get('mode');
  if (modeParam && VALID_MODES[modeParam]) {
    result.mode = VALID_MODES[modeParam];
  }

  // 2. Data Size & Unit
  const sizeParam = params.get('size');
  if (sizeParam) {
    const val = parseFloat(sizeParam);
    if (Number.isFinite(val) && val > 0) {
      result.dataSize = val;
    }
  }
  const sizeUnitParam = params.get('sizeUnit');
  if (sizeUnitParam && VALID_FILE_UNITS.has(sizeUnitParam)) {
    result.dataSizeUnit = sizeUnitParam as FileSizeUnit;
  }

  // 3. Source Speed & Unit
  const sourceParam = params.get('source');
  if (sourceParam) {
    const val = parseFloat(sourceParam);
    if (Number.isFinite(val) && val > 0) {
      result.sourceSpeed = val;
    }
  }
  const sourceUnitParam = params.get('sourceUnit');
  if (sourceUnitParam && VALID_SPEED_UNITS.has(sourceUnitParam)) {
    result.sourceSpeedUnit = sourceUnitParam as SpeedUnit;
  }

  // 4. Interface Speed & Unit
  const ifaceParam = params.get('interface');
  if (ifaceParam) {
    const val = parseFloat(ifaceParam);
    if (Number.isFinite(val) && val > 0) {
      result.interfaceSpeed = val;
    }
  }
  const ifaceUnitParam = params.get('interfaceUnit');
  if (ifaceUnitParam && VALID_SPEED_UNITS.has(ifaceUnitParam)) {
    result.interfaceSpeedUnit = ifaceUnitParam as SpeedUnit;
  }

  // 5. Destination Speed & Unit
  const destParam = params.get('dest');
  if (destParam) {
    const val = parseFloat(destParam);
    if (Number.isFinite(val) && val > 0) {
      result.destSpeed = val;
    }
  }
  const destUnitParam = params.get('destUnit');
  if (destUnitParam && VALID_SPEED_UNITS.has(destUnitParam)) {
    result.destSpeedUnit = destUnitParam as SpeedUnit;
  }

  // 6. Efficiency
  const effParam = params.get('eff');
  if (effParam) {
    const val = parseFloat(effParam);
    if (Number.isFinite(val) && val >= 1 && val <= 100) {
      result.efficiency = val;
    }
  }

  // 7. File Count
  const filesParam = params.get('files');
  if (filesParam) {
    const val = parseInt(filesParam, 10);
    if (Number.isFinite(val) && val >= 1 && val <= 10_000_000) {
      result.fileCount = val;
    }
  }

  // 8. Overhead
  const overheadParam = params.get('overhead');
  if (overheadParam) {
    const val = parseFloat(overheadParam);
    if (Number.isFinite(val) && val >= 0 && val <= 60) {
      result.overhead = val;
    }
  }

  // 9. Target Duration & Unit
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
 * Serializes FileTransferCalculatorState into a query parameter string.
 * Omits parameters matching defaults to keep URLs clean.
 */
export function serializeFileTransferUrlState(state: FileTransferCalculatorState): string {
  const params = new URLSearchParams();

  if (state.mode !== DEFAULT_FILE_TRANSFER_STATE.mode) {
    params.set('mode', state.mode);
  }

  if (state.dataSize !== DEFAULT_FILE_TRANSFER_STATE.dataSize) {
    params.set('size', String(state.dataSize));
  }
  if (state.dataSizeUnit !== DEFAULT_FILE_TRANSFER_STATE.dataSizeUnit) {
    params.set('sizeUnit', state.dataSizeUnit);
  }

  if (state.sourceSpeed !== DEFAULT_FILE_TRANSFER_STATE.sourceSpeed) {
    params.set('source', String(state.sourceSpeed));
  }
  if (state.sourceSpeedUnit !== DEFAULT_FILE_TRANSFER_STATE.sourceSpeedUnit) {
    params.set('sourceUnit', state.sourceSpeedUnit);
  }

  if (state.interfaceSpeed !== DEFAULT_FILE_TRANSFER_STATE.interfaceSpeed) {
    params.set('interface', String(state.interfaceSpeed));
  }
  if (state.interfaceSpeedUnit !== DEFAULT_FILE_TRANSFER_STATE.interfaceSpeedUnit) {
    params.set('interfaceUnit', state.interfaceSpeedUnit);
  }

  if (state.destSpeed !== DEFAULT_FILE_TRANSFER_STATE.destSpeed) {
    params.set('dest', String(state.destSpeed));
  }
  if (state.destSpeedUnit !== DEFAULT_FILE_TRANSFER_STATE.destSpeedUnit) {
    params.set('destUnit', state.destSpeedUnit);
  }

  if (state.efficiency !== DEFAULT_FILE_TRANSFER_STATE.efficiency) {
    params.set('eff', String(state.efficiency));
  }

  if (state.fileCount !== DEFAULT_FILE_TRANSFER_STATE.fileCount) {
    params.set('files', String(state.fileCount));
  }

  if (state.overhead !== DEFAULT_FILE_TRANSFER_STATE.overhead) {
    params.set('overhead', String(state.overhead));
  }

  if (state.mode === 'required-interface') {
    if (state.targetDuration !== DEFAULT_FILE_TRANSFER_STATE.targetDuration) {
      params.set('time', String(state.targetDuration));
    }
    if (state.targetDurationUnit !== DEFAULT_FILE_TRANSFER_STATE.targetDurationUnit) {
      params.set('timeUnit', state.targetDurationUnit);
    }
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}
