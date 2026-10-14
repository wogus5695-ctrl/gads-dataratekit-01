'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CalculationMode,
  FileSizeUnit,
  SpeedUnit,
  DECIMAL_FILE_UNITS,
  BINARY_FILE_UNITS,
  BIT_SPEED_UNITS,
  BYTE_SPEED_UNITS,
  calculateTransferTime,
  calculateRequiredSpeed,
  calculateTransferableSize,
  convertSpeed,
  formatNumber,
  parseCalculatorState,
  serializeCalculatorState,
  validatePositiveNumber,
} from '@/lib/transfer';
import styles from './DownloadCalculator.module.css';

const UI_LOCALE = 'en-US';

type TimeUnit = 'seconds' | 'minutes' | 'hours' | 'days';

const TIME_UNIT_MULTIPLIERS: Record<TimeUnit, number> = {
  seconds: 1,
  minutes: 60,
  hours: 3600,
  days: 86400,
};

const EFFICIENCY_PRESETS = [100, 95, 90, 85, 80] as const;

export function UploadCalculator() {
  const searchParams = useSearchParams();

  // Mode state
  const [mode, setMode] = useState<CalculationMode>('find-time');

  // Input states (Upload default speed: 20 Mbps)
  const [sizeInput, setSizeInput] = useState<string>('100');
  const [sizeUnit, setSizeUnit] = useState<FileSizeUnit>('GB');

  const [speedInput, setSpeedInput] = useState<string>('20');
  const [speedUnit, setSpeedUnit] = useState<SpeedUnit>('Mbps');

  const [timeInput, setTimeInput] = useState<string>('2');
  const [timeUnit, setTimeUnit] = useState<TimeUnit>('hours');

  const [targetSpeedUnit, setTargetSpeedUnit] = useState<SpeedUnit>('Mbps');
  const [targetSizeUnit, setTargetSizeUnit] = useState<FileSizeUnit>('GB');

  // Efficiency / Throughput assumption (default: 90%)
  const [efficiency, setEfficiency] = useState<number>(90);

  // Client hydration detection (for local finish time)
  const [isMounted, setIsMounted] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Restore state from URL search params on mount
  useEffect(() => {
    setIsMounted(true);
    if (!searchParams || Array.from(searchParams.keys()).length === 0) return;

    const parsed = parseCalculatorState(searchParams);
    setMode(parsed.mode);
    setSizeInput(parsed.fileSize.toString());
    setSizeUnit(parsed.fileSizeUnit);
    setSpeedInput(parsed.speed.toString());
    setSpeedUnit(parsed.speedUnit);

    // If efficiency was explicitly in searchParams, respect it, otherwise default to 90
    if (searchParams.has('efficiency')) {
      setEfficiency(parsed.efficiencyPercent);
    } else {
      setEfficiency(90);
    }

    if (searchParams.has('time')) {
      const sec = parsed.durationSeconds;
      if (sec >= 86400 && sec % 86400 === 0) {
        setTimeInput((sec / 86400).toString());
        setTimeUnit('days');
      } else if (sec >= 3600 && sec % 3600 === 0) {
        setTimeInput((sec / 3600).toString());
        setTimeUnit('hours');
      } else if (sec >= 60 && sec % 60 === 0) {
        setTimeInput((sec / 60).toString());
        setTimeUnit('minutes');
      } else {
        setTimeInput(sec.toString());
        setTimeUnit('seconds');
      }
    }
  }, [searchParams]);

  // Validations
  const sizeValidation = useMemo(
    () => validatePositiveNumber(sizeInput, 'File size'),
    [sizeInput]
  );
  const speedValidation = useMemo(
    () => validatePositiveNumber(speedInput, 'Upload speed'),
    [speedInput]
  );
  const timeValidation = useMemo(
    () => validatePositiveNumber(timeInput, 'Time'),
    [timeInput]
  );

  // Mode 1: Find Time Calculation
  const timeCalculation = useMemo(() => {
    if (!sizeValidation.isValid || !speedValidation.isValid) {
      return null;
    }

    // Theoretical minimum at 100% (PRIMARY)
    const theoretical = calculateTransferTime({
      fileSize: sizeValidation.value,
      fileSizeUnit: sizeUnit,
      speed: speedValidation.value,
      speedUnit,
      efficiencyPercent: 100,
    });

    // Practical estimate at chosen efficiency (SECONDARY)
    const estimated = calculateTransferTime({
      fileSize: sizeValidation.value,
      fileSizeUnit: sizeUnit,
      speed: speedValidation.value,
      speedUnit,
      efficiencyPercent: efficiency,
    });

    // Equivalent byte rate (e.g. 20 Mbps -> 2.5 MB/s)
    const equivalentRate = convertSpeed(speedValidation.value, speedUnit, 'MB/s');

    // Effective speed in original speed unit
    const effectiveSpeedValue = speedValidation.value * (efficiency / 100);

    return {
      theoretical,
      estimated,
      equivalentRate,
      effectiveSpeedValue,
    };
  }, [sizeValidation, speedValidation, sizeUnit, speedUnit, efficiency]);

  // Estimated Finish Time calculation (local browser time, based on practical duration)
  const finishTimeString = useMemo(() => {
    if (!isMounted || !timeCalculation?.estimated.success) return null;
    const seconds = timeCalculation.estimated.data.seconds;
    const finishDate = new Date(Date.now() + seconds * 1000);
    return new Intl.DateTimeFormat(UI_LOCALE, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(finishDate);
  }, [isMounted, timeCalculation]);

  // Mode 2: Find Required Upload Speed Calculation
  const requiredSpeedCalculation = useMemo(() => {
    if (!sizeValidation.isValid || !timeValidation.isValid) {
      return null;
    }

    const totalSeconds = timeValidation.value * TIME_UNIT_MULTIPLIERS[timeUnit];

    // Theoretical speed at 100% (PRIMARY)
    const theoretical = calculateRequiredSpeed({
      fileSize: sizeValidation.value,
      fileSizeUnit: sizeUnit,
      durationSeconds: totalSeconds,
      targetSpeedUnit,
      efficiencyPercent: 100,
    });

    // Estimated speed needed at chosen efficiency (SECONDARY)
    const estimated = calculateRequiredSpeed({
      fileSize: sizeValidation.value,
      fileSizeUnit: sizeUnit,
      durationSeconds: totalSeconds,
      targetSpeedUnit,
      efficiencyPercent: efficiency,
    });

    return { theoretical, estimated, totalSeconds };
  }, [sizeValidation, timeValidation, sizeUnit, timeUnit, targetSpeedUnit, efficiency]);

  // Mode 3: Find Uploadable Size Calculation
  const uploadableSizeCalculation = useMemo(() => {
    if (!speedValidation.isValid || !timeValidation.isValid) {
      return null;
    }

    const totalSeconds = timeValidation.value * TIME_UNIT_MULTIPLIERS[timeUnit];

    // Theoretical size at 100% (PRIMARY)
    const theoretical = calculateTransferableSize({
      speed: speedValidation.value,
      speedUnit,
      durationSeconds: totalSeconds,
      targetSizeUnit,
      efficiencyPercent: 100,
    });

    // Estimated size transferable at chosen efficiency (SECONDARY)
    const estimated = calculateTransferableSize({
      speed: speedValidation.value,
      speedUnit,
      durationSeconds: totalSeconds,
      targetSizeUnit,
      efficiencyPercent: efficiency,
    });

    return { theoretical, estimated, totalSeconds };
  }, [speedValidation, timeValidation, speedUnit, timeUnit, targetSizeUnit, efficiency]);

  // Reset to default Upload state
  const handleReset = useCallback(() => {
    setMode('find-time');
    setSizeInput('100');
    setSizeUnit('GB');
    setSpeedInput('20');
    setSpeedUnit('Mbps');
    setTimeInput('2');
    setTimeUnit('hours');
    setTargetSpeedUnit('Mbps');
    setTargetSizeUnit('GB');
    setEfficiency(90);
    setCopyFeedback(null);
  }, []);

  // Copy shareable link for Upload tool
  const handleCopyLink = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const totalSeconds = timeValidation.isValid
      ? timeValidation.value * TIME_UNIT_MULTIPLIERS[timeUnit]
      : 7200;

    const query = serializeCalculatorState({
      mode,
      fileSize: sizeValidation.isValid ? sizeValidation.value : 100,
      fileSizeUnit: sizeUnit,
      speed: speedValidation.isValid ? speedValidation.value : 20,
      speedUnit,
      durationSeconds: totalSeconds,
      efficiencyPercent: efficiency,
    });

    const shareUrl = `${window.location.origin}${window.location.pathname}?${query}`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setCopyFeedback('Link copied!');
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopyFeedback('Link copied!');
      }
    } catch {
      setCopyFeedback('Unable to copy');
    }

    setTimeout(() => {
      setCopyFeedback(null);
    }, 2500);
  }, [
    mode,
    sizeValidation,
    sizeUnit,
    speedValidation,
    speedUnit,
    timeValidation,
    timeUnit,
    efficiency,
  ]);

  return (
    <div className={styles.calculatorContainer} aria-label="Upload Time Calculator Tool">
      {/* Mode Switcher / Segmented Control */}
      <div className={styles.modeSelectorRow}>
        <span className={styles.modeSelectorLabel} id="mode-selector-label">
          Calculate
        </span>
        <div
          className={styles.tabList}
          role="tablist"
          aria-labelledby="mode-selector-label"
        >
          <button
            type="button"
            role="tab"
            id="tab-find-time"
            aria-selected={mode === 'find-time'}
            aria-controls="calculator-panel"
            className={`${styles.tabButton} ${
              mode === 'find-time' ? styles.tabButtonActive : ''
            }`}
            onClick={() => setMode('find-time')}
          >
            Time
          </button>
          <button
            type="button"
            role="tab"
            id="tab-find-speed"
            aria-selected={mode === 'find-speed'}
            aria-controls="calculator-panel"
            className={`${styles.tabButton} ${
              mode === 'find-speed' ? styles.tabButtonActive : ''
            }`}
            onClick={() => setMode('find-speed')}
          >
            Required speed
          </button>
          <button
            type="button"
            role="tab"
            id="tab-find-size"
            aria-selected={mode === 'find-size'}
            aria-controls="calculator-panel"
            className={`${styles.tabButton} ${
              mode === 'find-size' ? styles.tabButtonActive : ''
            }`}
            onClick={() => setMode('find-size')}
          >
            File size
          </button>
        </div>
      </div>

      {/* Main Form Fields */}
      <div id="calculator-panel" role="tabpanel" aria-labelledby={`tab-${mode}`}>
        <div className={`${styles.formGrid} ${styles.formGridTwoCol}`}>
          {/* File Size Input (Used in Mode 1 & Mode 2) */}
          {(mode === 'find-time' || mode === 'find-speed') && (
            <div className={styles.fieldGroup}>
              <label htmlFor="file-size-input" className={styles.label}>
                File Size
              </label>
              <div
                className={`${styles.inputRow} ${
                  !sizeValidation.isValid ? styles.inputRowError : ''
                }`}
              >
                <input
                  id="file-size-input"
                  type="text"
                  inputMode="decimal"
                  value={sizeInput}
                  onChange={(e) => setSizeInput(e.target.value)}
                  placeholder="e.g. 100"
                  aria-invalid={!sizeValidation.isValid}
                  aria-describedby={!sizeValidation.isValid ? 'size-error' : undefined}
                  className={styles.numberInput}
                />
                <select
                  id="file-size-unit"
                  value={sizeUnit}
                  onChange={(e) => setSizeUnit(e.target.value as FileSizeUnit)}
                  aria-label="File size unit"
                  className={styles.unitSelect}
                >
                  <optgroup label="Standard (Decimal)">
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
              {!sizeValidation.isValid && (
                <span id="size-error" className={styles.errorMessage}>
                  {sizeValidation.error}
                </span>
              )}
            </div>
          )}

          {/* Upload Speed Input (Used in Mode 1 & Mode 3) */}
          {(mode === 'find-time' || mode === 'find-size') && (
            <div className={styles.fieldGroup}>
              <label htmlFor="upload-speed-input" className={styles.label}>
                Upload Speed
              </label>
              <div
                className={`${styles.inputRow} ${
                  !speedValidation.isValid ? styles.inputRowError : ''
                }`}
              >
                <input
                  id="upload-speed-input"
                  type="text"
                  inputMode="decimal"
                  value={speedInput}
                  onChange={(e) => setSpeedInput(e.target.value)}
                  placeholder="e.g. 20"
                  aria-invalid={!speedValidation.isValid}
                  aria-describedby={
                    !speedValidation.isValid
                      ? 'speed-error'
                      : 'upload-speed-helper'
                  }
                  className={styles.numberInput}
                />
                <select
                  id="upload-speed-unit"
                  value={speedUnit}
                  onChange={(e) => setSpeedUnit(e.target.value as SpeedUnit)}
                  aria-label="Upload speed unit"
                  className={styles.unitSelect}
                >
                  <optgroup label="ISP / Telecom (Bits)">
                    {BIT_SPEED_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Transfer Rate (Bytes)">
                    {BYTE_SPEED_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
              {!speedValidation.isValid ? (
                <span id="speed-error" className={styles.errorMessage}>
                  {speedValidation.error}
                </span>
              ) : (
                <span id="upload-speed-helper" className={styles.helperText}>
                  Use the upload speed from your internet connection or speed test, not the download speed.
                </span>
              )}
            </div>
          )}

          {/* Time Duration Input (Used in Mode 2 & Mode 3) */}
          {(mode === 'find-speed' || mode === 'find-size') && (
            <div className={styles.fieldGroup}>
              <label htmlFor="time-duration-input" className={styles.label}>
                {mode === 'find-speed' ? 'Desired Upload Time' : 'Available Time'}
              </label>
              <div
                className={`${styles.inputRow} ${
                  !timeValidation.isValid ? styles.inputRowError : ''
                }`}
              >
                <input
                  id="time-duration-input"
                  type="text"
                  inputMode="decimal"
                  value={timeInput}
                  onChange={(e) => setTimeInput(e.target.value)}
                  placeholder="e.g. 2"
                  aria-invalid={!timeValidation.isValid}
                  aria-describedby={!timeValidation.isValid ? 'time-error' : undefined}
                  className={styles.numberInput}
                />
                <select
                  id="time-duration-unit"
                  value={timeUnit}
                  onChange={(e) => setTimeUnit(e.target.value as TimeUnit)}
                  aria-label="Time duration unit"
                  className={styles.unitSelect}
                >
                  <option value="seconds">seconds</option>
                  <option value="minutes">minutes</option>
                  <option value="hours">hours</option>
                  <option value="days">days</option>
                </select>
              </div>
              {!timeValidation.isValid && (
                <span id="time-error" className={styles.errorMessage}>
                  {timeValidation.error}
                </span>
              )}
            </div>
          )}

          {/* Target Speed Unit (Mode 2 only) */}
          {mode === 'find-speed' && (
            <div className={styles.fieldGroup}>
              <label htmlFor="target-speed-unit" className={styles.label}>
                Result Speed Unit
              </label>
              <div className={styles.inputRow}>
                <select
                  id="target-speed-unit"
                  value={targetSpeedUnit}
                  onChange={(e) => setTargetSpeedUnit(e.target.value as SpeedUnit)}
                  className={styles.unitSelect}
                  style={{ width: '100%', borderLeft: 'none' }}
                >
                  <optgroup label="Bits">
                    {BIT_SPEED_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Bytes">
                    {BYTE_SPEED_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>
          )}

          {/* Target Size Unit (Mode 3 only) */}
          {mode === 'find-size' && (
            <div className={styles.fieldGroup}>
              <label htmlFor="target-size-unit" className={styles.label}>
                Result Size Unit
              </label>
              <div className={styles.inputRow}>
                <select
                  id="target-size-unit"
                  value={targetSizeUnit}
                  onChange={(e) => setTargetSizeUnit(e.target.value as FileSizeUnit)}
                  className={styles.unitSelect}
                  style={{ width: '100%', borderLeft: 'none' }}
                >
                  <optgroup label="Standard (Decimal)">
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
          )}
        </div>

        {/* Progressive Disclosure: Estimate / Throughput Settings */}
        <details className={styles.estimateDisclosure}>
          <summary className={styles.estimateSummary}>
            Estimate settings · {efficiency}% throughput
            <span className={styles.disclosureIndicator} aria-hidden="true">
              ▾
            </span>
          </summary>
          <div className={styles.estimateBody}>
            <div
              className={styles.throughputPills}
              role="group"
              aria-label="Throughput percentage options"
            >
              {EFFICIENCY_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={efficiency === p}
                  className={`${styles.pillButton} ${
                    efficiency === p ? styles.pillButtonActive : ''
                  }`}
                  onClick={() => setEfficiency(p)}
                >
                  {p === 100 ? '100% (Theoretical)' : `${p}%`}
                </button>
              ))}
            </div>
            <p className={styles.throughputHelp}>
              90% is used as a practical planning assumption, not a guarantee. Actual upload
              speeds can vary because of Wi-Fi conditions, network congestion, protocol overhead,
              and remote service limits.
              {mode === 'find-time' && timeCalculation && (
                <> (Effective speed: {formatNumber(timeCalculation.effectiveSpeedValue)} {speedUnit})</>
              )}
            </p>
          </div>
        </details>

        {/* Results Area — High-Scanning Visual Hierarchy */}
        <div className={styles.resultCard} aria-live="polite" aria-atomic="true">
          {/* MODE 1 RESULTS */}
          {mode === 'find-time' && (
            <>
              {timeCalculation &&
              timeCalculation.theoretical.success &&
              timeCalculation.estimated.success ? (
                <>
                  {/* PRIMARY RESULT: Theoretical minimum at entered nominal speed */}
                  <div className={styles.primaryResultBlock}>
                    <div className={styles.primaryResultHeader}>
                      <span className={styles.primaryResultLabel}>Upload Time</span>
                    </div>
                    <div className={styles.primaryResultValue}>
                      {timeCalculation.theoretical.data.duration.formatted}
                    </div>
                    <div className={styles.primaryResultCaption}>
                      At {speedInput} {speedUnit}
                    </div>
                  </div>

                  {/* SECONDARY RESULT: Practical estimate at selected throughput */}
                  {efficiency !== 100 && (
                    <div className={styles.secondaryResultBlock}>
                      <span className={styles.secondaryResultLabel}>
                        Practical estimate · {efficiency}% throughput:
                      </span>
                      <span className={styles.secondaryResultValue}>
                        {timeCalculation.estimated.data.duration.formatted}
                      </span>
                    </div>
                  )}

                  {/* Simplified Supporting Metrics */}
                  <div className={styles.supportingMetricsRow}>
                    <div className={styles.supportingMetricItem}>
                      <span className={styles.metricKey}>Equivalent rate:</span>
                      <span className={styles.metricVal}>
                        {timeCalculation.equivalentRate.success
                          ? timeCalculation.equivalentRate.data.formatted
                          : '—'}
                      </span>
                    </div>
                    <div className={styles.supportingMetricItem}>
                      <span className={styles.metricKey}>Finish time (local):</span>
                      <span className={styles.metricVal}>
                        {finishTimeString || '—'}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.9375rem',
                    padding: '0.5rem 0',
                  }}
                >
                  Please enter a valid file size and upload speed to calculate upload time.
                </div>
              )}
            </>
          )}

          {/* MODE 2 RESULTS */}
          {mode === 'find-speed' && (
            <>
              {requiredSpeedCalculation &&
              requiredSpeedCalculation.theoretical.success &&
              requiredSpeedCalculation.estimated.success ? (
                <>
                  {/* PRIMARY RESULT: Theoretical minimum speed at 100% */}
                  <div className={styles.primaryResultBlock}>
                    <div className={styles.primaryResultHeader}>
                      <span className={styles.primaryResultLabel}>Required Upload Speed</span>
                    </div>
                    <div className={styles.primaryResultValue}>
                      {requiredSpeedCalculation.theoretical.data.formatted}
                    </div>
                    <div className={styles.primaryResultCaption}>
                      At 100% throughput
                    </div>
                  </div>

                  {/* SECONDARY RESULT: Practical estimate */}
                  {efficiency !== 100 && (
                    <div className={styles.secondaryResultBlock}>
                      <span className={styles.secondaryResultLabel}>
                        Practical estimate · {efficiency}% throughput:
                      </span>
                      <span className={styles.secondaryResultValue}>
                        {requiredSpeedCalculation.estimated.data.formatted}
                      </span>
                    </div>
                  )}

                  {/* Supporting Metrics */}
                  <div className={styles.supportingMetricsRow}>
                    <div className={styles.supportingMetricItem}>
                      <span className={styles.metricKey}>Target duration:</span>
                      <span className={styles.metricVal}>
                        {timeInput} {timeUnit}
                      </span>
                    </div>
                    <div className={styles.supportingMetricItem}>
                      <span className={styles.metricKey}>File size:</span>
                      <span className={styles.metricVal}>
                        {sizeInput} {sizeUnit}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.9375rem',
                    padding: '0.5rem 0',
                  }}
                >
                  Please enter a valid file size and desired duration to calculate required upload speed.
                </div>
              )}
            </>
          )}

          {/* MODE 3 RESULTS */}
          {mode === 'find-size' && (
            <>
              {uploadableSizeCalculation &&
              uploadableSizeCalculation.theoretical.success &&
              uploadableSizeCalculation.estimated.success ? (
                <>
                  {/* PRIMARY RESULT: Theoretical maximum size at 100% */}
                  <div className={styles.primaryResultBlock}>
                    <div className={styles.primaryResultHeader}>
                      <span className={styles.primaryResultLabel}>Uploadable File Size</span>
                    </div>
                    <div className={styles.primaryResultValue}>
                      {uploadableSizeCalculation.theoretical.data.formatted}
                    </div>
                    <div className={styles.primaryResultCaption}>
                      At 100% throughput
                    </div>
                  </div>

                  {/* SECONDARY RESULT: Practical estimate */}
                  {efficiency !== 100 && (
                    <div className={styles.secondaryResultBlock}>
                      <span className={styles.secondaryResultLabel}>
                        Practical estimate · {efficiency}% throughput:
                      </span>
                      <span className={styles.secondaryResultValue}>
                        {uploadableSizeCalculation.estimated.data.formatted}
                      </span>
                    </div>
                  )}

                  {/* Supporting Metrics */}
                  <div className={styles.supportingMetricsRow}>
                    <div className={styles.supportingMetricItem}>
                      <span className={styles.metricKey}>Available time:</span>
                      <span className={styles.metricVal}>
                        {timeInput} {timeUnit}
                      </span>
                    </div>
                    <div className={styles.supportingMetricItem}>
                      <span className={styles.metricKey}>Upload speed:</span>
                      <span className={styles.metricVal}>
                        {speedInput} {speedUnit}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.9375rem',
                    padding: '0.5rem 0',
                  }}
                >
                  Please enter a valid speed and duration to calculate uploadable size.
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Controls (Reset & Copy Link) */}
        <div className={styles.actionsRow}>
          <button
            type="button"
            onClick={handleReset}
            className={`${styles.actionButton} ${styles.resetButton}`}
            title="Reset to default calculator values"
          >
            Reset
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {copyFeedback && <span className={styles.copiedNotice}>{copyFeedback}</span>}
            <button
              type="button"
              onClick={handleCopyLink}
              className={styles.actionButton}
              title="Copy link to current calculation settings"
            >
              Copy link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
