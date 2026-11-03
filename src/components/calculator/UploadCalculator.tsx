'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  UploadCalculationMode,
  FileSizeUnit,
  SpeedUnit,
  TimeUnit,
  calculateUploadTime,
  calculateRequiredUploadSpeed,
  calculateUploadCapacity,
  parseUploadUrlState,
  serializeUploadUrlState,
  DEFAULT_UPLOAD_STATE,
} from '@/lib/upload';
import styles from './UploadCalculator.module.css';

const DECIMAL_FILE_UNITS: FileSizeUnit[] = ['KB', 'MB', 'GB', 'TB'];
const BINARY_FILE_UNITS: FileSizeUnit[] = ['KiB', 'MiB', 'GiB', 'TiB'];
const BIT_SPEED_UNITS: SpeedUnit[] = ['Kbps', 'Mbps', 'Gbps'];
const BYTE_SPEED_UNITS: SpeedUnit[] = ['KB/s', 'MB/s', 'GB/s'];

const TIME_UNIT_MULTIPLIERS: Record<TimeUnit, number> = {
  seconds: 1,
  minutes: 60,
  hours: 3600,
  days: 86400,
};

const EFFICIENCY_PRESETS = [100, 95, 90, 85, 80] as const;
const RESERVE_PRESETS = [0, 10, 20, 30] as const;

function UploadUrlSync({
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

export function UploadCalculator() {
  // Mode state
  const [mode, setMode] = useState<UploadCalculationMode>(DEFAULT_UPLOAD_STATE.mode);

  // Input states (strings for natural typing)
  const [sizeInput, setSizeInput] = useState<string>(DEFAULT_UPLOAD_STATE.fileSize.toString());
  const [sizeUnit, setSizeUnit] = useState<FileSizeUnit>(DEFAULT_UPLOAD_STATE.fileSizeUnit);

  const [speedInput, setSpeedInput] = useState<string>(DEFAULT_UPLOAD_STATE.speed.toString());
  const [speedUnit, setSpeedUnit] = useState<SpeedUnit>(DEFAULT_UPLOAD_STATE.speedUnit);

  const [efficiency, setEfficiency] = useState<number>(DEFAULT_UPLOAD_STATE.efficiency);
  const [reservedBandwidth, setReservedBandwidth] = useState<number>(DEFAULT_UPLOAD_STATE.reservedBandwidth);

  const [fileCountInput, setFileCountInput] = useState<string>(DEFAULT_UPLOAD_STATE.fileCount.toString());
  const [overheadInput, setOverheadInput] = useState<string>(DEFAULT_UPLOAD_STATE.perFileOverhead.toString());

  const [windowInput, setWindowInput] = useState<string>(DEFAULT_UPLOAD_STATE.windowDuration.toString());
  const [windowUnit, setWindowUnit] = useState<TimeUnit>(DEFAULT_UPLOAD_STATE.windowDurationUnit);

  const [targetSpeedUnit, setTargetSpeedUnit] = useState<SpeedUnit>('Mbps');
  const [targetSizeUnit, setTargetSizeUnit] = useState<FileSizeUnit>('GB');

  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Restore state from URL search params on client mount
  const handleUrlSync = useCallback((params: ReturnType<typeof useSearchParams>) => {
    if (!params || Array.from(params.keys()).length === 0) return;

    const parsed = parseUploadUrlState(params);
    setMode(parsed.mode);
    setSizeInput(parsed.fileSize.toString());
    setSizeUnit(parsed.fileSizeUnit);
    setSpeedInput(parsed.speed.toString());
    setSpeedUnit(parsed.speedUnit);
    setEfficiency(parsed.efficiency);
    setReservedBandwidth(parsed.reservedBandwidth);
    setFileCountInput(parsed.fileCount.toString());
    setOverheadInput(parsed.perFileOverhead.toString());
    setWindowInput(parsed.windowDuration.toString());
    setWindowUnit(parsed.windowDurationUnit);
  }, []);

  // Parse numeric inputs safely
  const numericSize = parseFloat(sizeInput);
  const numericSpeed = parseFloat(speedInput);
  const numericWindow = parseFloat(windowInput);
  const numericFiles = Math.max(1, parseInt(fileCountInput, 10) || 1);
  const numericOverhead = Math.max(0, parseFloat(overheadInput) || 0);

  const windowSeconds = Number.isFinite(numericWindow) && numericWindow > 0
    ? numericWindow * TIME_UNIT_MULTIPLIERS[windowUnit]
    : 0;

  // Execute calculations based on active mode
  const modeAResult = useMemo(() => {
    if (mode !== 'upload-time') return null;
    return calculateUploadTime({
      fileSize: numericSize,
      fileSizeUnit: sizeUnit,
      speed: numericSpeed,
      speedUnit: speedUnit,
      efficiencyPercent: efficiency,
      reservedBandwidthPercent: reservedBandwidth,
      fileCount: numericFiles,
      perFileOverheadSeconds: numericOverhead,
    });
  }, [mode, numericSize, sizeUnit, numericSpeed, speedUnit, efficiency, reservedBandwidth, numericFiles, numericOverhead]);

  const modeBResult = useMemo(() => {
    if (mode !== 'required-speed') return null;
    return calculateRequiredUploadSpeed({
      fileSize: numericSize,
      fileSizeUnit: sizeUnit,
      windowDurationSeconds: windowSeconds,
      targetSpeedUnit,
      efficiencyPercent: efficiency,
      reservedBandwidthPercent: reservedBandwidth,
      fileCount: numericFiles,
      perFileOverheadSeconds: numericOverhead,
    });
  }, [mode, numericSize, sizeUnit, windowSeconds, targetSpeedUnit, efficiency, reservedBandwidth, numericFiles, numericOverhead]);

  const modeCResult = useMemo(() => {
    if (mode !== 'window-capacity') return null;
    return calculateUploadCapacity({
      speed: numericSpeed,
      speedUnit: speedUnit,
      windowDurationSeconds: windowSeconds,
      targetSizeUnit,
      efficiencyPercent: efficiency,
      reservedBandwidthPercent: reservedBandwidth,
      setupReserveSeconds: numericFiles > 1 ? numericFiles * numericOverhead : 0,
    });
  }, [mode, numericSpeed, speedUnit, windowSeconds, targetSizeUnit, efficiency, reservedBandwidth, numericFiles, numericOverhead]);

  // Share handler
  const handleShare = useCallback(() => {
    const query = serializeUploadUrlState({
      mode,
      fileSize: Number.isFinite(numericSize) ? numericSize : DEFAULT_UPLOAD_STATE.fileSize,
      fileSizeUnit: sizeUnit,
      speed: Number.isFinite(numericSpeed) ? numericSpeed : DEFAULT_UPLOAD_STATE.speed,
      speedUnit,
      efficiency,
      reservedBandwidth,
      fileCount: numericFiles,
      perFileOverhead: numericOverhead,
      windowDuration: Number.isFinite(numericWindow) ? numericWindow : DEFAULT_UPLOAD_STATE.windowDuration,
      windowDurationUnit: windowUnit,
    });

    const shareUrl = `${window.location.origin}/upload-time-calculator${query}`;
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        setCopyFeedback('Link copied!');
        setTimeout(() => setCopyFeedback(null), 2500);
      })
      .catch(() => {
        setCopyFeedback('Failed to copy');
        setTimeout(() => setCopyFeedback(null), 2500);
      });
  }, [mode, numericSize, sizeUnit, numericSpeed, speedUnit, efficiency, reservedBandwidth, numericFiles, numericOverhead, numericWindow, windowUnit]);

  return (
    <div className={styles.calculatorCard}>
      {/* URL Synchronization */}
      <Suspense fallback={null}>
        <UploadUrlSync onSync={handleUrlSync} />
      </Suspense>

      {/* Mode Switcher */}
      <div className={styles.modeSelectorRow}>
        <span className={styles.modeLabel}>Calculation Mode</span>
        <div className={styles.segmentedControl} role="tablist" aria-label="Upload calculation modes">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'upload-time'}
            className={`${styles.segmentBtn} ${mode === 'upload-time' ? styles.segmentBtnActive : ''}`}
            onClick={() => setMode('upload-time')}
          >
            Upload Time
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'required-speed'}
            className={`${styles.segmentBtn} ${mode === 'required-speed' ? styles.segmentBtnActive : ''}`}
            onClick={() => setMode('required-speed')}
          >
            Required Upstream Speed
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'window-capacity'}
            className={`${styles.segmentBtn} ${mode === 'window-capacity' ? styles.segmentBtnActive : ''}`}
            onClick={() => setMode('window-capacity')}
          >
            Upload Window Capacity
          </button>
        </div>
      </div>

      {/* Primary Input Grid */}
      <div className={styles.inputGrid}>
        {/* File Size (Modes A & B) */}
        {mode !== 'window-capacity' && (
          <div className={styles.fieldGroup}>
            <label htmlFor="upload-size-input" className={styles.fieldLabel}>
              Total Data / File Size
            </label>
            <div className={styles.inputWithUnit}>
              <input
                id="upload-size-input"
                type="number"
                min="0"
                step="any"
                className={styles.textInput}
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                placeholder="10"
              />
              <select
                className={styles.unitSelect}
                aria-label="File size unit"
                value={sizeUnit}
                onChange={(e) => setSizeUnit(e.target.value as FileSizeUnit)}
              >
                <optgroup label="Decimal (Standard)">
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

        {/* Upload Speed (Modes A & C) */}
        {mode !== 'required-speed' && (
          <div className={styles.fieldGroup}>
            <label htmlFor="upload-speed-input" className={styles.fieldLabel}>
              Upstream Speed (ISP or Tested)
            </label>
            <div className={styles.inputWithUnit}>
              <input
                id="upload-speed-input"
                type="number"
                min="0"
                step="any"
                className={styles.textInput}
                value={speedInput}
                onChange={(e) => setSpeedInput(e.target.value)}
                placeholder="20"
              />
              <select
                className={styles.unitSelect}
                aria-label="Upload speed unit"
                value={speedUnit}
                onChange={(e) => setSpeedUnit(e.target.value as SpeedUnit)}
              >
                <optgroup label="Telecom (Bits)">
                  {BIT_SPEED_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Byte Rate">
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

        {/* Window Duration (Modes B & C) */}
        {mode !== 'upload-time' && (
          <div className={styles.fieldGroup}>
            <label htmlFor="upload-window-input" className={styles.fieldLabel}>
              {mode === 'required-speed' ? 'Target Upload Deadline' : 'Available Upload Window'}
            </label>
            <div className={styles.inputWithUnit}>
              <input
                id="upload-window-input"
                type="number"
                min="0"
                step="any"
                className={styles.textInput}
                value={windowInput}
                onChange={(e) => setWindowInput(e.target.value)}
                placeholder="2"
              />
              <select
                className={styles.unitSelect}
                aria-label="Window time unit"
                value={windowUnit}
                onChange={(e) => setWindowUnit(e.target.value as TimeUnit)}
              >
                <option value="seconds">seconds</option>
                <option value="minutes">minutes</option>
                <option value="hours">hours</option>
                <option value="days">days</option>
              </select>
            </div>
          </div>
        )}

        {/* Target Speed Unit for Mode B */}
        {mode === 'required-speed' && (
          <div className={styles.fieldGroup}>
            <label htmlFor="target-speed-select" className={styles.fieldLabel}>
              Speed Output Unit
            </label>
            <div className={styles.inputWithUnit}>
              <select
                id="target-speed-select"
                className={styles.textInput}
                style={{ cursor: 'pointer' }}
                value={targetSpeedUnit}
                onChange={(e) => setTargetSpeedUnit(e.target.value as SpeedUnit)}
              >
                {BIT_SPEED_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
                {BYTE_SPEED_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Target Size Unit for Mode C */}
        {mode === 'window-capacity' && (
          <div className={styles.fieldGroup}>
            <label htmlFor="target-size-select" className={styles.fieldLabel}>
              Capacity Output Unit
            </label>
            <div className={styles.inputWithUnit}>
              <select
                id="target-size-select"
                className={styles.textInput}
                style={{ cursor: 'pointer' }}
                value={targetSizeUnit}
                onChange={(e) => setTargetSizeUnit(e.target.value as FileSizeUnit)}
              >
                {DECIMAL_FILE_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
                {BINARY_FILE_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Upstream Planning Parameters Section */}
      <section className={styles.planningSection} aria-label="Upstream planning parameters">
        <div className={styles.planningTitle}>
          <span>Upstream Bandwidth &amp; Batch Planning</span>
          <span className={styles.planningBadge}>Traffic Control</span>
        </div>

        <div className={styles.planningGrid}>
          {/* Reserved Bandwidth */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              Reserved Bandwidth ({reservedBandwidth}%)
            </label>
            <div className={styles.presetGroup}>
              {RESERVE_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`${styles.presetBtn} ${reservedBandwidth === p ? styles.presetBtnActive : ''}`}
                  onClick={() => setReservedBandwidth(p)}
                >
                  {p === 0 ? '0% (Max)' : `${p}%`}
                </button>
              ))}
            </div>
            <span className={styles.fieldHint}>
              Optionally exclude an upstream percentage from the calculation to model capacity reserved for other concurrent household or office traffic.
            </span>
          </div>

          {/* Planning Throughput Factor */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              Planning Throughput Factor ({efficiency}%)
            </label>
            <div className={styles.presetGroup}>
              {EFFICIENCY_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`${styles.presetBtn} ${efficiency === p ? styles.presetBtnActive : ''}`}
                  onClick={() => setEfficiency(p)}
                >
                  {p}%
                </button>
              ))}
            </div>
            <span className={styles.fieldHint}>
              Use 100% to calculate from the full entered rate. Lower values model a reduced sustained-throughput scenario; they are planning assumptions, not universal network-efficiency constants.
            </span>
          </div>

          {/* Multi-file batch count */}
          {mode !== 'window-capacity' && (
            <div className={styles.fieldGroup}>
              <label htmlFor="file-count-input" className={styles.fieldLabel}>
                File Count (Batch Upload)
              </label>
              <div className={styles.inputWithUnit}>
                <input
                  id="file-count-input"
                  type="number"
                  min="1"
                  step="1"
                  className={styles.textInput}
                  value={fileCountInput}
                  onChange={(e) => setFileCountInput(e.target.value)}
                  placeholder="1"
                />
              </div>
              <span className={styles.fieldHint}>
                Sets number of independent files in the batch.
              </span>
            </div>
          )}

          {/* Per-file setup overhead */}
          {mode !== 'window-capacity' && (
            <div className={styles.fieldGroup}>
              <label htmlFor="file-overhead-input" className={styles.fieldLabel}>
                Estimated Per-File Setup Overhead (sec)
              </label>
              <div className={styles.inputWithUnit}>
                <input
                  id="file-overhead-input"
                  type="number"
                  min="0"
                  step="0.5"
                  className={styles.textInput}
                  value={overheadInput}
                  onChange={(e) => setOverheadInput(e.target.value)}
                  placeholder="0"
                />
              </div>
              <span className={styles.fieldHint}>
                Optional planning input to model per-file setup or processing time when you have a measured or assumed value.
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Calculation Results Card */}
      {mode === 'upload-time' && modeAResult && (
        <>
          {modeAResult.success ? (
            <div className={styles.resultCard}>
              <div className={styles.resultHeader}>
                <span className={styles.resultTitle}>Estimated Upload Time</span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Total Duration
                </span>
              </div>
              <div className={styles.primaryResult}>
                {modeAResult.data.formattedDuration}
              </div>

              <div className={styles.decisionBanner}>
                {modeAResult.data.decisionNote}
              </div>

              <div className={styles.secondaryGrid}>
                <div className={styles.metricBox}>
                  <div className={styles.metricLabel}>Effective Upstream Speed</div>
                  <div className={styles.metricValue}>{modeAResult.data.effectiveSpeedFormatted}</div>
                </div>
                <div className={styles.metricBox}>
                  <div className={styles.metricLabel}>Reserved Bandwidth</div>
                  <div className={styles.metricValue}>{modeAResult.data.reservedSpeedFormatted}</div>
                </div>
                <div className={styles.metricBox}>
                  <div className={styles.metricLabel}>Data Throughput Rate</div>
                  <div className={styles.metricValue}>{modeAResult.data.dataPerHourFormatted}</div>
                </div>
                <div className={styles.metricBox}>
                  <div className={styles.metricLabel}>Pure Payload Transfer</div>
                  <div className={styles.metricValue}>{modeAResult.data.formattedPayloadDuration}</div>
                </div>
                {modeAResult.data.overheadSeconds > 0 && (
                  <div className={styles.metricBox}>
                    <div className={styles.metricLabel}>Batch File Overhead</div>
                    <div className={styles.metricValue}>{modeAResult.data.formattedOverheadDuration}</div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.errorAlert} role="alert">
              {modeAResult.error}
            </div>
          )}
        </>
      )}

      {mode === 'required-speed' && modeBResult && (
        <>
          {modeBResult.success ? (
            <div className={styles.resultCard}>
              <div className={styles.resultHeader}>
                <span className={styles.resultTitle}>Required Upload Rate</span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Under Current Planning Inputs
                </span>
              </div>
              <div className={styles.primaryResult}>
                {modeBResult.data.requiredNominalSpeedFormatted}
              </div>

              <div className={styles.decisionBanner}>
                {modeBResult.data.decisionNote}
              </div>

              <div className={styles.secondaryGrid}>
                <div className={styles.metricBox}>
                  <div className={styles.metricLabel}>Required Effective Speed</div>
                  <div className={styles.metricValue}>{modeBResult.data.requiredEffectiveSpeedFormatted}</div>
                </div>
                <div className={styles.metricBox}>
                  <div className={styles.metricLabel}>Usable Upload Window</div>
                  <div className={styles.metricValue}>{modeBResult.data.usableWindowFormatted}</div>
                </div>
                <div className={styles.metricBox}>
                  <div className={styles.metricLabel}>Batch Setup Overhead</div>
                  <div className={styles.metricValue}>{modeBResult.data.formattedOverheadDuration}</div>
                </div>
                <div className={styles.metricBox}>
                  <div className={styles.metricLabel}>Reserved Bandwidth Safety</div>
                  <div className={styles.metricValue}>{modeBResult.data.reservedBandwidthPercent}%</div>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.errorAlert} role="alert">
              {modeBResult.error}
            </div>
          )}
        </>
      )}

      {mode === 'window-capacity' && modeCResult && (
        <>
          {modeCResult.success ? (
            <div className={styles.resultCard}>
              <div className={styles.resultHeader}>
                <span className={styles.resultTitle}>Estimated Uploadable Data</span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  In This Window
                </span>
              </div>
              <div className={styles.primaryResult}>
                {modeCResult.data.maximumPayloadFormatted}
              </div>

              <div className={styles.decisionBanner}>
                {modeCResult.data.decisionNote}
              </div>

              <div className={styles.secondaryGrid}>
                <div className={styles.metricBox}>
                  <div className={styles.metricLabel}>Effective Upstream Speed</div>
                  <div className={styles.metricValue}>{modeCResult.data.effectiveSpeedFormatted}</div>
                </div>
                <div className={styles.metricBox}>
                  <div className={styles.metricLabel}>Transfer Rate per Hour</div>
                  <div className={styles.metricValue}>{modeCResult.data.dataPerHourFormatted}</div>
                </div>
                <div className={styles.metricBox}>
                  <div className={styles.metricLabel}>Usable Upload Window</div>
                  <div className={styles.metricValue}>{modeCResult.data.usableWindowFormatted}</div>
                </div>
                <div className={styles.metricBox}>
                  <div className={styles.metricLabel}>Reserved Bandwidth Buffer</div>
                  <div className={styles.metricValue}>{modeCResult.data.reservedSpeedFormatted}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.errorAlert} role="alert">
              {modeCResult.error}
            </div>
          )}
        </>
      )}

      {/* Share / Deep Link Actions */}
      <div className={styles.actionsRow}>
        {copyFeedback && <span className={styles.feedbackBadge}>{copyFeedback}</span>}
        <button
          type="button"
          onClick={handleShare}
          className={styles.shareBtn}
          title="Copy shareable link with current upload parameters"
        >
          <span>Share Parameters</span>
        </button>
      </div>
    </div>
  );
}
