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
  parseCalculatorState,
  serializeCalculatorState,
  validatePositiveNumber,
} from '@/lib/transfer';
import styles from './DownloadCalculator.module.css';

type TimeUnit = 'seconds' | 'minutes' | 'hours' | 'days';

const TIME_UNIT_MULTIPLIERS: Record<TimeUnit, number> = {
  seconds: 1,
  minutes: 60,
  hours: 3600,
  days: 86400,
};

const EFFICIENCY_PRESETS = [100, 95, 90, 85, 80] as const;

interface InterfacePreset {
  name: string;
  speed: string;
  unit: SpeedUnit;
}

const COMMON_INTERFACE_PRESETS: InterfacePreset[] = [
  { name: 'Gigabit Ethernet', speed: '1', unit: 'Gbps' },
  { name: '2.5 Gigabit Ethernet', speed: '2.5', unit: 'Gbps' },
  { name: '10 Gigabit Ethernet', speed: '10', unit: 'Gbps' },
  { name: 'USB 2.0', speed: '480', unit: 'Mbps' },
  { name: 'USB 5Gbps', speed: '5', unit: 'Gbps' },
  { name: 'USB 10Gbps', speed: '10', unit: 'Gbps' },
  { name: 'USB 20Gbps', speed: '20', unit: 'Gbps' },
  { name: 'Thunderbolt 4', speed: '40', unit: 'Gbps' },
  { name: 'Thunderbolt 5', speed: '80', unit: 'Gbps' },
];

function FileTransferUrlSync({
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

export function FileTransferCalculator() {
  // Mode state
  const [mode, setMode] = useState<CalculationMode>('find-time');

  // Input states (File Transfer default: 100 GB, 100 MB/s, 10 minutes)
  const [sizeInput, setSizeInput] = useState<string>('100');
  const [sizeUnit, setSizeUnit] = useState<FileSizeUnit>('GB');

  const [speedInput, setSpeedInput] = useState<string>('100');
  const [speedUnit, setSpeedUnit] = useState<SpeedUnit>('MB/s');

  const [timeInput, setTimeInput] = useState<string>('10');
  const [timeUnit, setTimeUnit] = useState<TimeUnit>('minutes');

  const [targetSpeedUnit, setTargetSpeedUnit] = useState<SpeedUnit>('MB/s');
  const [targetSizeUnit, setTargetSizeUnit] = useState<FileSizeUnit>('GB');

  // Efficiency / Throughput adjustment (default: 100% for file transfer)
  const [efficiency, setEfficiency] = useState<number>(100);

  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Restore state from URL search params on client mount
  const handleUrlSync = useCallback((params: ReturnType<typeof useSearchParams>) => {
    if (!params || Array.from(params.keys()).length === 0) return;

    const parsed = parseCalculatorState(params);
    setMode(parsed.mode);
    setSizeInput(parsed.fileSize.toString());
    setSizeUnit(parsed.fileSizeUnit);
    setSpeedInput(parsed.speed.toString());
    setSpeedUnit(parsed.speedUnit);

    // If efficiency was explicitly in searchParams, respect it, otherwise default to 100
    if (params.has('efficiency')) {
      setEfficiency(parsed.efficiencyPercent);
    } else {
      setEfficiency(100);
    }

    if (params.has('time')) {
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
  }, []);

  // Validations
  const sizeValidation = useMemo(
    () => validatePositiveNumber(sizeInput, 'File size'),
    [sizeInput]
  );
  const speedValidation = useMemo(
    () => validatePositiveNumber(speedInput, 'Transfer speed'),
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

    // Theoretical / direct at 100% (PRIMARY)
    const theoretical = calculateTransferTime({
      fileSize: sizeValidation.value,
      fileSizeUnit: sizeUnit,
      speed: speedValidation.value,
      speedUnit,
      efficiencyPercent: 100,
    });

    // Adjusted estimate at chosen percentage (SECONDARY)
    const estimated = calculateTransferTime({
      fileSize: sizeValidation.value,
      fileSizeUnit: sizeUnit,
      speed: speedValidation.value,
      speedUnit,
      efficiencyPercent: efficiency,
    });

    // Equivalent rate conversion
    // If entered speed is in Bytes (MB/s, etc.), convert to bits (Mbps)
    // If entered speed is in Bits (Mbps, etc.), convert to bytes (MB/s)
    const isByteUnit = (BYTE_SPEED_UNITS as readonly string[]).includes(speedUnit);
    const targetEquivUnit: SpeedUnit = isByteUnit ? 'Mbps' : 'MB/s';
    const equivalentRate = convertSpeed(speedValidation.value, speedUnit, targetEquivUnit);

    // Data per hour at entered sustained speed (100%): 3600 seconds
    const dataPerHour = calculateTransferableSize({
      speed: speedValidation.value,
      speedUnit,
      durationSeconds: 3600,
      targetSizeUnit: sizeUnit,
      efficiencyPercent: 100,
    });

    return {
      theoretical,
      estimated,
      equivalentRate,
      dataPerHour,
    };
  }, [sizeValidation, speedValidation, sizeUnit, speedUnit, efficiency]);

  // Mode 2: Find Required Transfer Speed Calculation
  const requiredSpeedCalculation = useMemo(() => {
    if (!sizeValidation.isValid || !timeValidation.isValid) {
      return null;
    }

    const totalSeconds = timeValidation.value * TIME_UNIT_MULTIPLIERS[timeUnit];

    const theoretical = calculateRequiredSpeed({
      fileSize: sizeValidation.value,
      fileSizeUnit: sizeUnit,
      durationSeconds: totalSeconds,
      targetSpeedUnit,
      efficiencyPercent: 100,
    });

    const estimated = calculateRequiredSpeed({
      fileSize: sizeValidation.value,
      fileSizeUnit: sizeUnit,
      durationSeconds: totalSeconds,
      targetSpeedUnit,
      efficiencyPercent: efficiency,
    });

    return { theoretical, estimated, totalSeconds };
  }, [sizeValidation, timeValidation, sizeUnit, timeUnit, targetSpeedUnit, efficiency]);

  // Mode 3: Find Transferable File Size Calculation
  const transferableSizeCalculation = useMemo(() => {
    if (!speedValidation.isValid || !timeValidation.isValid) {
      return null;
    }

    const totalSeconds = timeValidation.value * TIME_UNIT_MULTIPLIERS[timeUnit];

    const theoretical = calculateTransferableSize({
      speed: speedValidation.value,
      speedUnit,
      durationSeconds: totalSeconds,
      targetSizeUnit,
      efficiencyPercent: 100,
    });

    const estimated = calculateTransferableSize({
      speed: speedValidation.value,
      speedUnit,
      durationSeconds: totalSeconds,
      targetSizeUnit,
      efficiencyPercent: efficiency,
    });

    return { theoretical, estimated, totalSeconds };
  }, [speedValidation, timeValidation, speedUnit, timeUnit, targetSizeUnit, efficiency]);

  // Reset to default File Transfer state
  const handleReset = useCallback(() => {
    setMode('find-time');
    setSizeInput('100');
    setSizeUnit('GB');
    setSpeedInput('100');
    setSpeedUnit('MB/s');
    setTimeInput('10');
    setTimeUnit('minutes');
    setTargetSpeedUnit('MB/s');
    setTargetSizeUnit('GB');
    setEfficiency(100);
    setCopyFeedback(null);
  }, []);

  // Copy shareable link for File Transfer tool
  const handleCopyLink = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const totalSeconds = timeValidation.isValid
      ? timeValidation.value * TIME_UNIT_MULTIPLIERS[timeUnit]
      : 600;

    const query = serializeCalculatorState({
      mode,
      fileSize: sizeValidation.isValid ? sizeValidation.value : 100,
      fileSizeUnit: sizeUnit,
      speed: speedValidation.isValid ? speedValidation.value : 100,
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

  const handleApplyPreset = (preset: InterfacePreset) => {
    setSpeedInput(preset.speed);
    setSpeedUnit(preset.unit);
  };

  return (
    <div className={styles.calculatorContainer} aria-label="File Transfer Time Calculator Tool">
      <React.Suspense fallback={null}>
        <FileTransferUrlSync onSync={handleUrlSync} />
      </React.Suspense>
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
            aria-selected={mode === 'find-time'}
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
            aria-selected={mode === 'find-speed'}
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
            aria-selected={mode === 'find-size'}
            className={`${styles.tabButton} ${
              mode === 'find-size' ? styles.tabButtonActive : ''
            }`}
            onClick={() => setMode('find-size')}
          >
            File size
          </button>
        </div>
      </div>

      {/* Main Input Form */}
      <form onSubmit={(e) => e.preventDefault()} noValidate>
        <div className={`${styles.formGrid} ${styles.formGridTwoCol}`}>
          {/* File Size Field (Modes 1 and 2) */}
          {mode !== 'find-size' && (
            <div className={styles.fieldGroup}>
              <label htmlFor="file-size-input" className={styles.label}>
                <span>File Size</span>
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
                <span id="size-error" className={styles.errorMessage} role="alert">
                  {sizeValidation.error}
                </span>
              )}
            </div>
          )}

          {/* Transfer Speed Field (Modes 1 and 3) */}
          {mode !== 'find-speed' && (
            <div className={styles.fieldGroup}>
              <label htmlFor="transfer-speed-input" className={styles.label}>
                <span>Transfer Speed</span>
              </label>
              <div
                className={`${styles.inputRow} ${
                  !speedValidation.isValid ? styles.inputRowError : ''
                }`}
              >
                <input
                  id="transfer-speed-input"
                  type="text"
                  inputMode="decimal"
                  value={speedInput}
                  onChange={(e) => setSpeedInput(e.target.value)}
                  placeholder="e.g. 100"
                  aria-invalid={!speedValidation.isValid}
                  aria-describedby={
                    !speedValidation.isValid
                      ? 'speed-error'
                      : 'speed-helper'
                  }
                  className={styles.numberInput}
                />
                <select
                  value={speedUnit}
                  onChange={(e) => setSpeedUnit(e.target.value as SpeedUnit)}
                  aria-label="Transfer speed unit"
                  className={styles.unitSelect}
                >
                  <optgroup label="Bytes">
                    {BYTE_SPEED_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Bits">
                    {BIT_SPEED_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
              {!speedValidation.isValid ? (
                <span id="speed-error" className={styles.errorMessage} role="alert">
                  {speedValidation.error}
                </span>
              ) : (
                <span id="speed-helper" className={styles.helperText}>
                  Use the sustained copy speed you actually see during a transfer. If one device or link is slower, use that slower rate.
                </span>
              )}
            </div>
          )}

          {/* Time Duration Field (Modes 2 and 3) */}
          {mode !== 'find-time' && (
            <div className={styles.fieldGroup}>
              <label htmlFor="time-duration-input" className={styles.label}>
                <span>{mode === 'find-speed' ? 'Desired Transfer Time' : 'Available Time'}</span>
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
                  placeholder="e.g. 10"
                  aria-invalid={!timeValidation.isValid}
                  aria-describedby={!timeValidation.isValid ? 'time-error' : undefined}
                  className={styles.numberInput}
                />
                <select
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
                <span id="time-error" className={styles.errorMessage} role="alert">
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
                  <optgroup label="Bytes">
                    {BYTE_SPEED_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Bits">
                    {BIT_SPEED_UNITS.map((u) => (
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

        {/* Optional Common Interface Presets Disclosure (Mode 1 and 3) */}
        {mode !== 'find-speed' && (
          <details className={styles.estimateDisclosure}>
            <summary className={styles.estimateSummary}>
              Common interface rates
              <span className={styles.disclosureIndicator} aria-hidden="true">
                ▾
              </span>
            </summary>
            <div className={styles.estimateBody}>
              <div
                className={styles.throughputPills}
                role="group"
                aria-label="Common interface presets"
              >
                {COMMON_INTERFACE_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    className={styles.pillButton}
                    onClick={() => handleApplyPreset(preset)}
                  >
                    <span>{preset.name}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '0.25rem' }}>
                      ({preset.speed} {preset.unit})
                    </span>
                  </button>
                ))}
              </div>
              <p className={styles.throughputHelp}>
                Interface rates are nominal link limits. Actual file-copy speed may be lower because of the source, destination, protocol, cable, or other bottlenecks.
              </p>
            </div>
          </details>
        )}

        {/* Progressive Disclosure: Estimate Settings / Throughput Adjustment */}
        <details className={styles.estimateDisclosure}>
          <summary className={styles.estimateSummary}>
            Estimate settings · {efficiency}% of entered speed
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
                  {p === 100 ? '100% (Direct)' : `${p}%`}
                </button>
              ))}
            </div>
            <p className={styles.throughputHelp}>
              Keep this at 100% if you entered a measured sustained copy speed. If you entered a nominal interface rate, you can reduce the percentage for planning.
            </p>
          </div>
        </details>

        {/* Results Area */}
        <div className={styles.resultCard} aria-live="polite" aria-atomic="true">
          {/* MODE 1 RESULTS */}
          {mode === 'find-time' && (
            <>
              {timeCalculation &&
              timeCalculation.theoretical.success &&
              timeCalculation.estimated.success ? (
                <>
                  {/* PRIMARY RESULT: 100% of entered transfer speed */}
                  <div className={styles.primaryResultBlock}>
                    <div className={styles.primaryResultHeader}>
                      <span className={styles.primaryResultLabel}>File Transfer Time</span>
                    </div>
                    <div className={styles.primaryResultValue}>
                      {timeCalculation.theoretical.data.duration.formatted}
                    </div>
                    <div className={styles.primaryResultCaption}>
                      At {speedInput} {speedUnit}
                    </div>
                  </div>

                  {/* SECONDARY RESULT: Adjusted estimate (only when efficiency !== 100) */}
                  {efficiency !== 100 && (
                    <div className={styles.secondaryResultBlock}>
                      <span className={styles.secondaryResultLabel}>
                        Adjusted estimate · {efficiency}% of entered speed:
                      </span>
                      <span className={styles.secondaryResultValue}>
                        {timeCalculation.estimated.data.duration.formatted}
                      </span>
                    </div>
                  )}

                  {/* Supporting Metrics */}
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
                      <span className={styles.metricKey}>Data per hour:</span>
                      <span className={styles.metricVal}>
                        {timeCalculation.dataPerHour.success
                          ? `${timeCalculation.dataPerHour.data.formatted}/hour`
                          : '—'}
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
                  Please enter a valid file size and transfer speed to calculate transfer time.
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
                  {/* PRIMARY RESULT */}
                  <div className={styles.primaryResultBlock}>
                    <div className={styles.primaryResultHeader}>
                      <span className={styles.primaryResultLabel}>Required Transfer Speed</span>
                    </div>
                    <div className={styles.primaryResultValue}>
                      {requiredSpeedCalculation.theoretical.data.formatted}
                    </div>
                    <div className={styles.primaryResultCaption}>
                      At 100% throughput
                    </div>
                  </div>

                  {/* SECONDARY RESULT */}
                  {efficiency !== 100 && (
                    <div className={styles.secondaryResultBlock}>
                      <span className={styles.secondaryResultLabel}>
                        Adjusted estimate · {efficiency}% of entered speed:
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
                  Please enter a valid file size and desired duration to calculate required transfer speed.
                </div>
              )}
            </>
          )}

          {/* MODE 3 RESULTS */}
          {mode === 'find-size' && (
            <>
              {transferableSizeCalculation &&
              transferableSizeCalculation.theoretical.success &&
              transferableSizeCalculation.estimated.success ? (
                <>
                  {/* PRIMARY RESULT */}
                  <div className={styles.primaryResultBlock}>
                    <div className={styles.primaryResultHeader}>
                      <span className={styles.primaryResultLabel}>Transferable File Size</span>
                    </div>
                    <div className={styles.primaryResultValue}>
                      {transferableSizeCalculation.theoretical.data.formatted}
                    </div>
                    <div className={styles.primaryResultCaption}>
                      At 100% throughput
                    </div>
                  </div>

                  {/* SECONDARY RESULT */}
                  {efficiency !== 100 && (
                    <div className={styles.secondaryResultBlock}>
                      <span className={styles.secondaryResultLabel}>
                        Adjusted estimate · {efficiency}% of entered speed:
                      </span>
                      <span className={styles.secondaryResultValue}>
                        {transferableSizeCalculation.estimated.data.formatted}
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
                      <span className={styles.metricKey}>Transfer speed:</span>
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
                  Please enter a valid transfer speed and available time to calculate transferable file size.
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions Row */}
        <div className={styles.actionsRow}>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.resetButton}`}
            onClick={handleReset}
            aria-label="Reset calculator to default values"
          >
            Reset
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {copyFeedback && (
              <span className={styles.copiedNotice} role="status">
                {copyFeedback}
              </span>
            )}
            <button
              type="button"
              className={styles.actionButton}
              onClick={handleCopyLink}
              title="Copy link to current calculation settings"
              aria-label="Copy shareable link with current calculator parameters"
            >
              Copy link
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
