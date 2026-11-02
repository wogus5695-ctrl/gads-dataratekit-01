'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  VideoCalculationMode,
  BitrateUnit,
  calculateVideoFileSize,
  calculateRequiredVideoBitrate,
  calculateMaximumDuration,
  parseDurationToSeconds,
  BITRATE_UNITS,
  parseVideoCalculatorState,
  serializeVideoCalculatorState,
  DEFAULT_VIDEO_STATE,
} from '@/lib/video';
import {
  DECIMAL_FILE_UNITS,
  BINARY_FILE_UNITS,
} from '@/lib/transfer/units';
import { FileSizeUnit } from '@/lib/transfer/types';
import { formatNumber } from '@/lib/transfer/format';
import styles from './VideoCalculator.module.css';

function VideoUrlSync({
  onSync,
}: {
  onSync: (params: ReturnType<typeof useSearchParams>) => void;
}) {
  const searchParams = useSearchParams();
  useEffect(() => {
    onSync(searchParams);
  }, [searchParams, onSync]);
  return null;
}

export function VideoCalculator() {
  const [mode, setMode] = useState<VideoCalculationMode>('find-size');

  // Mode A & C inputs
  const [videoBitrate, setVideoBitrate] = useState<string>('20');
  const [videoBitrateUnit, setVideoBitrateUnit] = useState<BitrateUnit>('Mbps');

  // Shared audio input
  const [audioBitrate, setAudioBitrate] = useState<string>('320');
  const [audioBitrateUnit, setAudioBitrateUnit] = useState<BitrateUnit>('kbps');

  // Duration inputs (H / M / S)
  const [hours, setHours] = useState<string>('1');
  const [minutes, setMinutes] = useState<string>('0');
  const [seconds, setSeconds] = useState<string>('0');

  // Mode B inputs (Target file size)
  const [targetFileSize, setTargetFileSize] = useState<string>('10');
  const [targetFileSizeUnit, setTargetFileSizeUnit] = useState<FileSizeUnit>('GB');

  // Mode C inputs (Available storage)
  const [availableStorage, setAvailableStorage] = useState<string>('64');
  const [availableStorageUnit, setAvailableStorageUnit] = useState<FileSizeUnit>('GB');

  // Output preferences
  const [outputSizeUnit, setOutputSizeUnit] = useState<FileSizeUnit>('GB');
  const [outputBitrateUnit, setOutputBitrateUnit] = useState<BitrateUnit>('Mbps');

  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Restore state from URL search params on client mount
  const handleUrlSync = useCallback((params: ReturnType<typeof useSearchParams>) => {
    if (!params || Array.from(params.keys()).length === 0) return;

    const parsed = parseVideoCalculatorState(params);
    setMode(parsed.mode);
    setVideoBitrate(parsed.videoBitrate.toString());
    setVideoBitrateUnit(parsed.videoBitrateUnit);
    setAudioBitrate(parsed.audioBitrate.toString());
    setAudioBitrateUnit(parsed.audioBitrateUnit);
    setHours(parsed.hours.toString());
    setMinutes(parsed.minutes.toString());
    setSeconds(parsed.seconds.toString());
    setTargetFileSize(parsed.targetFileSize.toString());
    setTargetFileSizeUnit(parsed.targetFileSizeUnit);
    setAvailableStorage(parsed.availableStorage.toString());
    setAvailableStorageUnit(parsed.availableStorageUnit);
    setOutputSizeUnit(parsed.outputSizeUnit);
    setOutputBitrateUnit(parsed.outputBitrateUnit);
  }, []);

  // Duration parsing & validation
  const durationValidation = useMemo(
    () => parseDurationToSeconds(hours, minutes, seconds),
    [hours, minutes, seconds]
  );

  // Calculation execution
  const sizeResult = useMemo(() => {
    if (mode !== 'find-size') return null;
    return calculateVideoFileSize({
      videoBitrate,
      videoBitrateUnit,
      audioBitrate,
      audioBitrateUnit,
      durationSeconds: durationValidation.totalSeconds,
      targetSizeUnit: outputSizeUnit,
    });
  }, [mode, videoBitrate, videoBitrateUnit, audioBitrate, audioBitrateUnit, durationValidation, outputSizeUnit]);

  const bitrateResult = useMemo(() => {
    if (mode !== 'find-bitrate') return null;
    return calculateRequiredVideoBitrate({
      targetFileSize,
      targetFileSizeUnit,
      durationSeconds: durationValidation.totalSeconds,
      audioBitrate,
      audioBitrateUnit,
      targetBitrateUnit: outputBitrateUnit,
    });
  }, [mode, targetFileSize, targetFileSizeUnit, durationValidation, audioBitrate, audioBitrateUnit, outputBitrateUnit]);

  const durationResult = useMemo(() => {
    if (mode !== 'find-duration') return null;
    return calculateMaximumDuration({
      availableStorage,
      availableStorageUnit,
      videoBitrate,
      videoBitrateUnit,
      audioBitrate,
      audioBitrateUnit,
    });
  }, [mode, availableStorage, availableStorageUnit, videoBitrate, videoBitrateUnit, audioBitrate, audioBitrateUnit]);

  // Copy shareable link
  const handleCopyLink = () => {
    if (typeof window === 'undefined') return;

    const query = serializeVideoCalculatorState({
      mode,
      videoBitrate: parseFloat(videoBitrate) || 0,
      videoBitrateUnit,
      audioBitrate: parseFloat(audioBitrate) || 0,
      audioBitrateUnit,
      hours: parseFloat(hours) || 0,
      minutes: parseFloat(minutes) || 0,
      seconds: parseFloat(seconds) || 0,
      targetFileSize: parseFloat(targetFileSize) || 0,
      targetFileSizeUnit,
      availableStorage: parseFloat(availableStorage) || 0,
      availableStorageUnit,
      outputSizeUnit,
      outputBitrateUnit,
    });

    const shareUrl = `${window.location.origin}${window.location.pathname}?${query}`;
    navigator.clipboard.writeText(shareUrl).then(
      () => {
        setCopyFeedback('Link copied to clipboard!');
        setTimeout(() => setCopyFeedback(null), 3000);
      },
      () => {
        setCopyFeedback('Failed to copy link');
        setTimeout(() => setCopyFeedback(null), 3000);
      }
    );
  };

  // Reset to neutral defaults
  const handleReset = () => {
    setMode(DEFAULT_VIDEO_STATE.mode);
    setVideoBitrate(DEFAULT_VIDEO_STATE.videoBitrate.toString());
    setVideoBitrateUnit(DEFAULT_VIDEO_STATE.videoBitrateUnit);
    setAudioBitrate(DEFAULT_VIDEO_STATE.audioBitrate.toString());
    setAudioBitrateUnit(DEFAULT_VIDEO_STATE.audioBitrateUnit);
    setHours(DEFAULT_VIDEO_STATE.hours.toString());
    setMinutes(DEFAULT_VIDEO_STATE.minutes.toString());
    setSeconds(DEFAULT_VIDEO_STATE.seconds.toString());
    setTargetFileSize(DEFAULT_VIDEO_STATE.targetFileSize.toString());
    setTargetFileSizeUnit(DEFAULT_VIDEO_STATE.targetFileSizeUnit);
    setAvailableStorage(DEFAULT_VIDEO_STATE.availableStorage.toString());
    setAvailableStorageUnit(DEFAULT_VIDEO_STATE.availableStorageUnit);
    setOutputSizeUnit(DEFAULT_VIDEO_STATE.outputSizeUnit);
    setOutputBitrateUnit(DEFAULT_VIDEO_STATE.outputBitrateUnit);
    setCopyFeedback(null);

    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  return (
    <div className={styles.calculatorContainer} aria-label="Video File Size and Bitrate Calculator">
      <React.Suspense fallback={null}>
        <VideoUrlSync onSync={handleUrlSync} />
      </React.Suspense>

      {/* Mode Switcher */}
      <div className={styles.modeSelectorRow}>
        <span id="video-mode-label" className={styles.modeSelectorLabel}>
          Calculation Mode
        </span>
        <div className={styles.tabList} role="tablist" aria-labelledby="video-mode-label">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'find-size'}
            className={`${styles.tabButton} ${mode === 'find-size' ? styles.tabButtonActive : ''}`}
            onClick={() => setMode('find-size')}
          >
            File Size
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'find-bitrate'}
            className={`${styles.tabButton} ${mode === 'find-bitrate' ? styles.tabButtonActive : ''}`}
            onClick={() => setMode('find-bitrate')}
          >
            Required Bitrate
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'find-duration'}
            className={`${styles.tabButton} ${mode === 'find-duration' ? styles.tabButtonActive : ''}`}
            onClick={() => setMode('find-duration')}
          >
            Max Duration
          </button>
        </div>
      </div>

      {/* Form Fields */}
      <div className={styles.formGrid}>
        {/* MODE A: File Size */}
        {mode === 'find-size' && (
          <div className={`${styles.formGrid} ${styles.formGridTwoCol}`}>
            <div className={styles.fieldGroup}>
              <label htmlFor="video-bitrate-input" className={styles.label}>
                <span>Video Bitrate</span>
              </label>
              <div className={styles.inputRow}>
                <input
                  id="video-bitrate-input"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  className={styles.numberInput}
                  value={videoBitrate}
                  onChange={(e) => setVideoBitrate(e.target.value)}
                  placeholder="20"
                />
                <select
                  aria-label="Video bitrate unit"
                  className={styles.unitSelect}
                  value={videoBitrateUnit}
                  onChange={(e) => setVideoBitrateUnit(e.target.value as BitrateUnit)}
                >
                  {BITRATE_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="audio-bitrate-input" className={styles.label}>
                <span>Audio Bitrate</span>
              </label>
              <div className={styles.inputRow}>
                <input
                  id="audio-bitrate-input"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  className={styles.numberInput}
                  value={audioBitrate}
                  onChange={(e) => setAudioBitrate(e.target.value)}
                  placeholder="320"
                />
                <select
                  aria-label="Audio bitrate unit"
                  className={styles.unitSelect}
                  value={audioBitrateUnit}
                  onChange={(e) => setAudioBitrateUnit(e.target.value as BitrateUnit)}
                >
                  {BITRATE_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.fieldGroup} style={{ gridColumn: '1 / -1' }}>
              <label className={styles.label}>
                <span>Duration (Hours / Minutes / Seconds)</span>
              </label>
              <div className={styles.durationGrid}>
                <div className={styles.durationField}>
                  <input
                    aria-label="Hours"
                    type="number"
                    min="0"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                  />
                  <span className={styles.durationSuffix}>h</span>
                </div>
                <div className={styles.durationField}>
                  <input
                    aria-label="Minutes"
                    type="number"
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                  />
                  <span className={styles.durationSuffix}>m</span>
                </div>
                <div className={styles.durationField}>
                  <input
                    aria-label="Seconds"
                    type="number"
                    min="0"
                    max="59"
                    value={seconds}
                    onChange={(e) => setSeconds(e.target.value)}
                  />
                  <span className={styles.durationSuffix}>s</span>
                </div>
              </div>
              {!durationValidation.isValid && (
                <div className={styles.errorMessage}>{durationValidation.error}</div>
              )}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="output-size-unit" className={styles.label}>
                <span>Output Unit</span>
              </label>
              <div className={styles.inputRow}>
                <select
                  id="output-size-unit"
                  className={styles.unitSelect}
                  style={{ width: '100%', borderLeft: 'none', borderTopLeftRadius: 'var(--radius-md)', borderBottomLeftRadius: 'var(--radius-md)' }}
                  value={outputSizeUnit}
                  onChange={(e) => setOutputSizeUnit(e.target.value as FileSizeUnit)}
                >
                  <optgroup label="Decimal (SI)">
                    {DECIMAL_FILE_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u} (Decimal)
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Binary (IEC)">
                    {BINARY_FILE_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u} (Binary)
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* MODE B: Required Bitrate */}
        {mode === 'find-bitrate' && (
          <div className={`${styles.formGrid} ${styles.formGridTwoCol}`}>
            <div className={styles.fieldGroup}>
              <label htmlFor="target-size-input" className={styles.label}>
                <span>Target File Size</span>
              </label>
              <div className={styles.inputRow}>
                <input
                  id="target-size-input"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  className={styles.numberInput}
                  value={targetFileSize}
                  onChange={(e) => setTargetFileSize(e.target.value)}
                  placeholder="10"
                />
                <select
                  aria-label="Target file size unit"
                  className={styles.unitSelect}
                  value={targetFileSizeUnit}
                  onChange={(e) => setTargetFileSizeUnit(e.target.value as FileSizeUnit)}
                >
                  <optgroup label="Decimal (SI)">
                    {DECIMAL_FILE_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Binary (IEC)">
                    {BINARY_FILE_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="audio-bitrate-input-b" className={styles.label}>
                <span>Audio Bitrate (Deducted)</span>
              </label>
              <div className={styles.inputRow}>
                <input
                  id="audio-bitrate-input-b"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  className={styles.numberInput}
                  value={audioBitrate}
                  onChange={(e) => setAudioBitrate(e.target.value)}
                  placeholder="320"
                />
                <select
                  aria-label="Audio bitrate unit"
                  className={styles.unitSelect}
                  value={audioBitrateUnit}
                  onChange={(e) => setAudioBitrateUnit(e.target.value as BitrateUnit)}
                >
                  {BITRATE_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.fieldGroup} style={{ gridColumn: '1 / -1' }}>
              <label className={styles.label}>
                <span>Duration (Hours / Minutes / Seconds)</span>
              </label>
              <div className={styles.durationGrid}>
                <div className={styles.durationField}>
                  <input
                    aria-label="Hours"
                    type="number"
                    min="0"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                  />
                  <span className={styles.durationSuffix}>h</span>
                </div>
                <div className={styles.durationField}>
                  <input
                    aria-label="Minutes"
                    type="number"
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                  />
                  <span className={styles.durationSuffix}>m</span>
                </div>
                <div className={styles.durationField}>
                  <input
                    aria-label="Seconds"
                    type="number"
                    min="0"
                    max="59"
                    value={seconds}
                    onChange={(e) => setSeconds(e.target.value)}
                  />
                  <span className={styles.durationSuffix}>s</span>
                </div>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="output-bitrate-unit" className={styles.label}>
                <span>Output Bitrate Unit</span>
              </label>
              <div className={styles.inputRow}>
                <select
                  id="output-bitrate-unit"
                  className={styles.unitSelect}
                  style={{ width: '100%', borderLeft: 'none', borderTopLeftRadius: 'var(--radius-md)', borderBottomLeftRadius: 'var(--radius-md)' }}
                  value={outputBitrateUnit}
                  onChange={(e) => setOutputBitrateUnit(e.target.value as BitrateUnit)}
                >
                  {BITRATE_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* MODE C: Maximum Duration */}
        {mode === 'find-duration' && (
          <div className={`${styles.formGrid} ${styles.formGridTwoCol}`}>
            <div className={styles.fieldGroup}>
              <label htmlFor="available-storage-input" className={styles.label}>
                <span>Available Storage Space</span>
              </label>
              <div className={styles.inputRow}>
                <input
                  id="available-storage-input"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  className={styles.numberInput}
                  value={availableStorage}
                  onChange={(e) => setAvailableStorage(e.target.value)}
                  placeholder="64"
                />
                <select
                  aria-label="Storage unit"
                  className={styles.unitSelect}
                  value={availableStorageUnit}
                  onChange={(e) => setAvailableStorageUnit(e.target.value as FileSizeUnit)}
                >
                  <optgroup label="Decimal (SI)">
                    {DECIMAL_FILE_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Binary (IEC)">
                    {BINARY_FILE_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="video-bitrate-input-c" className={styles.label}>
                <span>Video Bitrate</span>
              </label>
              <div className={styles.inputRow}>
                <input
                  id="video-bitrate-input-c"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  className={styles.numberInput}
                  value={videoBitrate}
                  onChange={(e) => setVideoBitrate(e.target.value)}
                  placeholder="20"
                />
                <select
                  aria-label="Video bitrate unit"
                  className={styles.unitSelect}
                  value={videoBitrateUnit}
                  onChange={(e) => setVideoBitrateUnit(e.target.value as BitrateUnit)}
                >
                  {BITRATE_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="audio-bitrate-input-c" className={styles.label}>
                <span>Audio Bitrate</span>
              </label>
              <div className={styles.inputRow}>
                <input
                  id="audio-bitrate-input-c"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  className={styles.numberInput}
                  value={audioBitrate}
                  onChange={(e) => setAudioBitrate(e.target.value)}
                  placeholder="320"
                />
                <select
                  aria-label="Audio bitrate unit"
                  className={styles.unitSelect}
                  value={audioBitrateUnit}
                  onChange={(e) => setAudioBitrateUnit(e.target.value as BitrateUnit)}
                >
                  {BITRATE_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Area */}
      {mode === 'find-size' && (
        <div className={styles.resultCard}>
          {sizeResult && sizeResult.success ? (
            <>
              <div className={styles.primaryResultBlock}>
                <div className={styles.primaryResultHeader}>
                  <span className={styles.primaryResultLabel}>Estimated File Size</span>
                </div>
                <div className={styles.primaryResultValue}>
                  {sizeResult.data.fileSizeFormatted}
                </div>
                <div className={styles.primaryResultCaption}>
                  Based on {videoBitrate} {videoBitrateUnit} video + {audioBitrate} {audioBitrateUnit} audio over {hours}h {minutes}m {seconds}s
                </div>
              </div>

              <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                  <div className={styles.metricLabel}>Total Combined Bitrate</div>
                  <div className={styles.metricValue}>{sizeResult.data.totalBitrateFormatted}</div>
                </div>
                <div className={styles.metricCard}>
                  <div className={styles.metricLabel}>Data Rate per Minute</div>
                  <div className={styles.metricValue}>{formatNumber(sizeResult.data.mbPerMinute, 2)} MB/min</div>
                </div>
                <div className={styles.metricCard}>
                  <div className={styles.metricLabel}>Data Rate per Hour</div>
                  <div className={styles.metricValue}>{formatNumber(sizeResult.data.gbPerHour, 3)} GB/hr</div>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.errorMessage}>
              {sizeResult?.error || 'Please enter valid bitrate and duration values.'}
            </div>
          )}
        </div>
      )}

      {mode === 'find-bitrate' && (
        <div className={styles.resultCard}>
          {bitrateResult && bitrateResult.success ? (
            <>
              <div className={styles.primaryResultBlock}>
                <div className={styles.primaryResultHeader}>
                  <span className={styles.primaryResultLabel}>Required Video Bitrate</span>
                </div>
                <div className={styles.primaryResultValue}>
                  {bitrateResult.data.requiredVideoBitrateFormatted}
                </div>
                <div className={styles.primaryResultCaption}>
                  After deducting {audioBitrate} {audioBitrateUnit} audio to fit {targetFileSize} {targetFileSizeUnit}
                </div>
              </div>

              <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                  <div className={styles.metricLabel}>Total Allowable Bitrate</div>
                  <div className={styles.metricValue}>{bitrateResult.data.totalBitrateFormatted}</div>
                </div>
                <div className={styles.metricCard}>
                  <div className={styles.metricLabel}>Audio Track Allocation</div>
                  <div className={styles.metricValue}>{audioBitrate} {audioBitrateUnit}</div>
                </div>
                <div className={styles.metricCard}>
                  <div className={styles.metricLabel}>Target Capacity</div>
                  <div className={styles.metricValue}>{targetFileSize} {targetFileSizeUnit}</div>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.errorMessage}>
              {bitrateResult?.error || 'Please enter valid target size and duration values.'}
            </div>
          )}
        </div>
      )}

      {mode === 'find-duration' && (
        <div className={styles.resultCard}>
          {durationResult && durationResult.success ? (
            <>
              <div className={styles.primaryResultBlock}>
                <div className={styles.primaryResultHeader}>
                  <span className={styles.primaryResultLabel}>Maximum Recording Duration</span>
                </div>
                <div className={styles.primaryResultValue}>
                  {durationResult.data.duration.formatted}
                </div>
                <div className={styles.primaryResultCaption}>
                  Estimated recording capacity for {availableStorage} {availableStorageUnit} of storage
                </div>
              </div>

              <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                  <div className={styles.metricLabel}>Total Combined Bitrate</div>
                  <div className={styles.metricValue}>{durationResult.data.totalBitrateFormatted}</div>
                </div>
                <div className={styles.metricCard}>
                  <div className={styles.metricLabel}>Storage Usage per Minute</div>
                  <div className={styles.metricValue}>{formatNumber(durationResult.data.mbPerMinute, 2)} MB/min</div>
                </div>
                <div className={styles.metricCard}>
                  <div className={styles.metricLabel}>Storage Usage per Hour</div>
                  <div className={styles.metricValue}>{formatNumber(durationResult.data.gbPerHour, 3)} GB/hr</div>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.errorMessage}>
              {durationResult?.error || 'Please enter valid storage and bitrate values.'}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className={styles.actionsRow}>
        <button
          type="button"
          onClick={handleCopyLink}
          className={styles.actionButton}
          aria-label="Copy shareable link with current inputs"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </svg>
          <span>Copy link</span>
        </button>

        {copyFeedback && <span className={styles.copiedNotice}>{copyFeedback}</span>}

        <button
          type="button"
          onClick={handleReset}
          className={`${styles.actionButton} ${styles.resetButton}`}
          aria-label="Reset calculator to default values"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
