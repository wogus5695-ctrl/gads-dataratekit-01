import { VideoCalculationMode, BitrateUnit, VideoCalculatorState } from './types';
import { isBitrateUnit } from './calculations';
import { isFileSizeUnit } from '@/lib/transfer/units';
import { FileSizeUnit } from '@/lib/transfer/types';

export const DEFAULT_VIDEO_STATE: VideoCalculatorState = {
  mode: 'find-size',
  videoBitrate: 20,
  videoBitrateUnit: 'Mbps',
  audioBitrate: 320,
  audioBitrateUnit: 'kbps',
  hours: 1,
  minutes: 0,
  seconds: 0,
  targetFileSize: 10,
  targetFileSizeUnit: 'GB',
  availableStorage: 64,
  availableStorageUnit: 'GB',
  outputSizeUnit: 'GB',
  outputBitrateUnit: 'Mbps',
};

export function parseVideoCalculatorState(
  params: URLSearchParams | { get: (key: string) => string | null }
): VideoCalculatorState {
  const state: VideoCalculatorState = { ...DEFAULT_VIDEO_STATE };

  const modeParam = params.get('mode');
  if (modeParam === 'bitrate') {
    state.mode = 'find-bitrate';
  } else if (modeParam === 'duration') {
    state.mode = 'find-duration';
  } else {
    state.mode = 'find-size';
  }

  // Video bitrate
  const video = params.get('video');
  if (video) {
    const num = parseFloat(video);
    if (!Number.isNaN(num) && num >= 0 && Number.isFinite(num)) {
      state.videoBitrate = num;
    }
  }

  const vUnit = params.get('vUnit');
  if (vUnit && isBitrateUnit(vUnit)) {
    state.videoBitrateUnit = vUnit;
  }

  // Audio bitrate
  const audio = params.get('audio');
  if (audio) {
    const num = parseFloat(audio);
    if (!Number.isNaN(num) && num >= 0 && Number.isFinite(num)) {
      state.audioBitrate = num;
    }
  }

  const aUnit = params.get('aUnit');
  if (aUnit && isBitrateUnit(aUnit)) {
    state.audioBitrateUnit = aUnit;
  }

  // Duration
  const h = params.get('h');
  if (h) {
    const num = parseFloat(h);
    if (!Number.isNaN(num) && num >= 0 && Number.isFinite(num)) {
      state.hours = num;
    }
  }

  const m = params.get('m');
  if (m) {
    const num = parseFloat(m);
    if (!Number.isNaN(num) && num >= 0 && Number.isFinite(num)) {
      state.minutes = num;
    }
  }

  const s = params.get('s');
  if (s) {
    const num = parseFloat(s);
    if (!Number.isNaN(num) && num >= 0 && Number.isFinite(num)) {
      state.seconds = num;
    }
  }

  // Target file size (for find-bitrate)
  const size = params.get('size');
  if (size) {
    const num = parseFloat(size);
    if (!Number.isNaN(num) && num > 0 && Number.isFinite(num)) {
      state.targetFileSize = num;
    }
  }

  const sUnit = params.get('sUnit');
  if (sUnit && isFileSizeUnit(sUnit)) {
    state.targetFileSizeUnit = sUnit;
  }

  // Available storage (for find-duration)
  const storage = params.get('storage');
  if (storage) {
    const num = parseFloat(storage);
    if (!Number.isNaN(num) && num > 0 && Number.isFinite(num)) {
      state.availableStorage = num;
    }
  }

  const stUnit = params.get('stUnit');
  if (stUnit && isFileSizeUnit(stUnit)) {
    state.availableStorageUnit = stUnit;
  }

  // Output unit preferences
  const outSizeUnit = params.get('outSizeUnit');
  if (outSizeUnit && isFileSizeUnit(outSizeUnit)) {
    state.outputSizeUnit = outSizeUnit;
  }

  const outBitrateUnit = params.get('outBitrateUnit');
  if (outBitrateUnit && isBitrateUnit(outBitrateUnit)) {
    state.outputBitrateUnit = outBitrateUnit;
  }

  return state;
}

export function serializeVideoCalculatorState(state: Partial<VideoCalculatorState>): string {
  const params = new URLSearchParams();

  if (state.mode === 'find-bitrate') {
    params.set('mode', 'bitrate');
    if (state.targetFileSize !== undefined) params.set('size', state.targetFileSize.toString());
    if (state.targetFileSizeUnit) params.set('sUnit', state.targetFileSizeUnit);
    if (state.hours !== undefined) params.set('h', state.hours.toString());
    if (state.minutes !== undefined) params.set('m', state.minutes.toString());
    if (state.seconds !== undefined) params.set('s', state.seconds.toString());
    if (state.audioBitrate !== undefined) params.set('audio', state.audioBitrate.toString());
    if (state.audioBitrateUnit) params.set('aUnit', state.audioBitrateUnit);
    if (state.outputBitrateUnit) params.set('outBitrateUnit', state.outputBitrateUnit);
  } else if (state.mode === 'find-duration') {
    params.set('mode', 'duration');
    if (state.availableStorage !== undefined) params.set('storage', state.availableStorage.toString());
    if (state.availableStorageUnit) params.set('stUnit', state.availableStorageUnit);
    if (state.videoBitrate !== undefined) params.set('video', state.videoBitrate.toString());
    if (state.videoBitrateUnit) params.set('vUnit', state.videoBitrateUnit);
    if (state.audioBitrate !== undefined) params.set('audio', state.audioBitrate.toString());
    if (state.audioBitrateUnit) params.set('aUnit', state.audioBitrateUnit);
  } else {
    // find-size
    if (state.videoBitrate !== undefined) params.set('video', state.videoBitrate.toString());
    if (state.videoBitrateUnit) params.set('vUnit', state.videoBitrateUnit);
    if (state.audioBitrate !== undefined) params.set('audio', state.audioBitrate.toString());
    if (state.audioBitrateUnit) params.set('aUnit', state.audioBitrateUnit);
    if (state.hours !== undefined) params.set('h', state.hours.toString());
    if (state.minutes !== undefined) params.set('m', state.minutes.toString());
    if (state.seconds !== undefined) params.set('s', state.seconds.toString());
    if (state.outputSizeUnit) params.set('outSizeUnit', state.outputSizeUnit);
  }

  return params.toString();
}
