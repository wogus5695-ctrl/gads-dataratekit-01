'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  DownloadMode,
  FileSizeUnit,
  SpeedUnit,
  TimeUnit,
  calculateDownloadTime,
  calculateDownloadBottleneck,
  calculateRequiredDownloadSpeed,
  parseDownloadUrlState,
  serializeDownloadUrlState,
  DEFAULT_DOWNLOAD_STATE,
} from '@/lib/download';
import styles from './DownloadCalculator.module.css';

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
const BANDWIDTH_SHARE_PRESETS = [100, 90, 75, 50] as const;

function DownloadUrlSync({
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

export function DownloadCalculator() {
  // Mode state
  const [mode, setMode] = useState<DownloadMode>(DEFAULT_DOWNLOAD_STATE.mode);

  // Input states (strings for natural typing & deletion)
  const [sizeInput, setSizeInput] = useState<string>(DEFAULT_DOWNLOAD_STATE.fileSize.toString());
  const [sizeUnit, setSizeUnit] = useState<FileSizeUnit>(DEFAULT_DOWNLOAD_STATE.fileSizeUnit);

  const [speedInput, setSpeedInput] = useState<string>(DEFAULT_DOWNLOAD_STATE.speed.toString());
  const [speedUnit, setSpeedUnit] = useState<SpeedUnit>(DEFAULT_DOWNLOAD_STATE.speedUnit);

  const [bandwidthShare, setBandwidthShare] = useState<number>(DEFAULT_DOWNLOAD_STATE.bandwidthShare);
  const [planningEfficiency, setPlanningEfficiency] = useState<number>(DEFAULT_DOWNLOAD_STATE.planningEfficiency);

  // Optional Remote Server / CDN delivery cap
  const [serverCapEnabled, setServerCapEnabled] = useState<boolean>(DEFAULT_DOWNLOAD_STATE.serverCapEnabled);
  const [serverCapInput, setServerCapInput] = useState<string>(DEFAULT_DOWNLOAD_STATE.serverCap.toString());
  const [serverCapUnit, setServerCapUnit] = useState<SpeedUnit>(DEFAULT_DOWNLOAD_STATE.serverCapUnit);

  // Mode C target window inputs
  const [targetDurationInput, setTargetDurationInput] = useState<string>(
    DEFAULT_DOWNLOAD_STATE.targetDuration.toString()
  );
  const [targetDurationUnit, setTargetDurationUnit] = useState<TimeUnit>(
    DEFAULT_DOWNLOAD_STATE.targetDurationUnit
  );
  const [targetSpeedUnit, setTargetSpeedUnit] = useState<SpeedUnit>('Mbps');

  // Hydration state for client-only finish time
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Restore state from URL search params on client mount
  const handleUrlSync = useCallback((params: ReturnType<typeof useSearchParams>) => {
    if (!params || Array.from(params.keys()).length === 0) return;

    const parsed = parseDownloadUrlState(params);
    setMode(parsed.mode);
    setSizeInput(parsed.fileSize.toString());
    setSizeUnit(parsed.fileSizeUnit);
    setSpeedInput(parsed.speed.toString());
    setSpeedUnit(parsed.speedUnit);
    setBandwidthShare(parsed.bandwidthShare);
    setPlanningEfficiency(parsed.planningEfficiency);
    setServerCapEnabled(parsed.serverCapEnabled);
    setServerCapInput(parsed.serverCap.toString());
    setServerCapUnit(parsed.serverCapUnit);
    setTargetDurationInput(parsed.targetDuration.toString());
    setTargetDurationUnit(parsed.targetDurationUnit);
  }, []);

  // Parse numeric values safely
  const numericSize = parseFloat(sizeInput);
  const numericSpeed = parseFloat(speedInput);
  const numericServerCap = parseFloat(serverCapInput);
  const numericTargetDuration = parseFloat(targetDurationInput);

  const targetDurationSeconds =
    Number.isFinite(numericTargetDuration) && numericTargetDuration > 0
      ? numericTargetDuration * TIME_UNIT_MULTIPLIERS[targetDurationUnit]
      : 0;

  // Execute calculations based on active mode
  const modeAResult = useMemo(() => {
    if (mode !== 'download-time') return null;
    return calculateDownloadTime({
      fileSize: numericSize,
      fileSizeUnit: sizeUnit,
      connectionSpeed: numericSpeed,
      connectionSpeedUnit: speedUnit,
      availableBandwidthPercent: bandwidthShare,
      serverCapEnabled,
      serverCapSpeed: numericServerCap,
      serverCapSpeedUnit: serverCapUnit,
      planningEfficiencyPercent: planningEfficiency,
    });
  }, [
    mode,
    numericSize,
    sizeUnit,
    numericSpeed,
    speedUnit,
    bandwidthShare,
    serverCapEnabled,
    numericServerCap,
    serverCapUnit,
    planningEfficiency,
  ]);

  const modeBResult = useMemo(() => {
    if (mode !== 'bottleneck') return null;
    return calculateDownloadBottleneck({
      connectionSpeed: numericSpeed,
      connectionSpeedUnit: speedUnit,
      availableBandwidthPercent: bandwidthShare,
      serverCapEnabled,
      serverCapSpeed: numericServerCap,
      serverCapSpeedUnit: serverCapUnit,
      planningEfficiencyPercent: planningEfficiency,
    });
  }, [
    mode,
    numericSpeed,
    speedUnit,
    bandwidthShare,
    serverCapEnabled,
    numericServerCap,
    serverCapUnit,
    planningEfficiency,
  ]);

  const modeCResult = useMemo(() => {
    if (mode !== 'required-speed') return null;
    return calculateRequiredDownloadSpeed({
      fileSize: numericSize,
      fileSizeUnit: sizeUnit,
      targetDurationSeconds,
      availableBandwidthPercent: bandwidthShare,
      serverCapEnabled,
      serverCapSpeed: numericServerCap,
      serverCapSpeedUnit: serverCapUnit,
      planningEfficiencyPercent: planningEfficiency,
      targetSpeedUnit,
    });
  }, [
    mode,
    numericSize,
    sizeUnit,
    targetDurationSeconds,
    bandwidthShare,
    serverCapEnabled,
    numericServerCap,
    serverCapUnit,
    planningEfficiency,
    targetSpeedUnit,
  ]);

  // Formatted local finish time for Mode A
  const estimatedFinishTime = useMemo(() => {
    if (!isMounted || !modeAResult?.success) return null;
    const now = new Date();
    const finishDate = new Date(now.getTime() + modeAResult.data.totalSeconds * 1000);
    return finishDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [isMounted, modeAResult]);

  // Copy shareable link
  const handleCopyLink = useCallback(() => {
    const currentState = {
      mode,
      fileSize: Number.isFinite(numericSize) && numericSize > 0 ? numericSize : DEFAULT_DOWNLOAD_STATE.fileSize,
      fileSizeUnit: sizeUnit,
      speed: Number.isFinite(numericSpeed) && numericSpeed > 0 ? numericSpeed : DEFAULT_DOWNLOAD_STATE.speed,
      speedUnit: speedUnit,
      bandwidthShare,
      planningEfficiency,
      serverCapEnabled,
      serverCap: Number.isFinite(numericServerCap) && numericServerCap > 0 ? numericServerCap : DEFAULT_DOWNLOAD_STATE.serverCap,
      serverCapUnit,
      targetDuration: Number.isFinite(numericTargetDuration) && numericTargetDuration > 0 ? numericTargetDuration : DEFAULT_DOWNLOAD_STATE.targetDuration,
      targetDurationUnit,
    };

    const qs = serializeDownloadUrlState(currentState);
    const url = `${window.location.origin}${window.location.pathname}${qs}`;

    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopyFeedback('Link copied!');
        setTimeout(() => setCopyFeedback(null), 2500);
      })
      .catch(() => {
        setCopyFeedback('Failed to copy');
        setTimeout(() => setCopyFeedback(null), 2500);
      });
  }, [
    mode,
    numericSize,
    sizeUnit,
    numericSpeed,
    speedUnit,
    bandwidthShare,
    planningEfficiency,
    serverCapEnabled,
    numericServerCap,
    serverCapUnit,
    numericTargetDuration,
    targetDurationUnit,
  ]);

  const handleReset = useCallback(() => {
    setMode(DEFAULT_DOWNLOAD_STATE.mode);
    setSizeInput(DEFAULT_DOWNLOAD_STATE.fileSize.toString());
    setSizeUnit(DEFAULT_DOWNLOAD_STATE.fileSizeUnit);
    setSpeedInput(DEFAULT_DOWNLOAD_STATE.speed.toString());
    setSpeedUnit(DEFAULT_DOWNLOAD_STATE.speedUnit);
    setBandwidthShare(DEFAULT_DOWNLOAD_STATE.bandwidthShare);
    setPlanningEfficiency(DEFAULT_DOWNLOAD_STATE.planningEfficiency);
    setServerCapEnabled(DEFAULT_DOWNLOAD_STATE.serverCapEnabled);
    setServerCapInput(DEFAULT_DOWNLOAD_STATE.serverCap.toString());
    setServerCapUnit(DEFAULT_DOWNLOAD_STATE.serverCapUnit);
    setTargetDurationInput(DEFAULT_DOWNLOAD_STATE.targetDuration.toString());
    setTargetDurationUnit(DEFAULT_DOWNLOAD_STATE.targetDurationUnit);
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  return (
    <div className={styles.calculatorContainer}>
      <Suspense fallback={null}>
        <DownloadUrlSync onSync={handleUrlSync} />
      </Suspense>

      {/* Mode Switcher */}
      <div className={styles.modeSelectorRow}>
        <span className={styles.modeSelectorLabel}>Calculation Mode</span>
        <div className={styles.tabList} role="tablist" aria-label="Calculation Mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'download-time'}
            className={`${styles.tabButton} ${mode === 'download-time' ? styles.tabButtonActive : ''}`}
            onClick={() => setMode('download-time')}
          >
            Download Time
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'bottleneck'}
            className={`${styles.tabButton} ${mode === 'bottleneck' ? styles.tabButtonActive : ''}`}
            onClick={() => setMode('bottleneck')}
          >
            Download Bottleneck
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'required-speed'}
            className={`${styles.tabButton} ${mode === 'required-speed' ? styles.tabButtonActive : ''}`}
            onClick={() => setMode('required-speed')}
          >
            Required Connection Speed
          </button>
        </div>
      </div>

      {/* Primary Input Grid */}
      <div className={`${styles.formGrid} ${mode !== 'bottleneck' ? styles.formGridTwoCol : ''}`}>
        {/* File Size Input (Modes A & C) */}
        {mode !== 'bottleneck' && (
          <div className={styles.fieldGroup}>
            <label className={styles.label}>File Size</label>
            <div className={styles.inputRow}>
              <input
                type="number"
                min="0.001"
                step="any"
                className={styles.numberInput}
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                placeholder="100"
                aria-label="File size"
              />
              <select
                className={styles.unitSelect}
                value={sizeUnit}
                onChange={(e) => setSizeUnit(e.target.value as FileSizeUnit)}
                aria-label="File size unit"
              >
                <optgroup label="Decimal (1000)">
                  {DECIMAL_FILE_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Binary (1024)">
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

        {/* Internet Connection Speed (Modes A & B) */}
        {mode !== 'required-speed' && (
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Internet Download Speed</label>
            <div className={styles.inputRow}>
              <input
                type="number"
                min="0.001"
                step="any"
                className={styles.numberInput}
                value={speedInput}
                onChange={(e) => setSpeedInput(e.target.value)}
                placeholder="100"
                aria-label="Internet connection speed"
              />
              <select
                className={styles.unitSelect}
                value={speedUnit}
                onChange={(e) => setSpeedUnit(e.target.value as SpeedUnit)}
                aria-label="Internet speed unit"
              >
                <optgroup label="Broadband / Bit Rate">
                  {BIT_SPEED_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="File Rate / Bytes">
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

        {/* Target Deadline (Mode C) */}
        {mode === 'required-speed' && (
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Target Completion Time</label>
            <div className={styles.inputRow}>
              <input
                type="number"
                min="0.1"
                step="any"
                className={styles.numberInput}
                value={targetDurationInput}
                onChange={(e) => setTargetDurationInput(e.target.value)}
                placeholder="2"
                aria-label="Target duration"
              />
              <select
                className={styles.unitSelect}
                value={targetDurationUnit}
                onChange={(e) => setTargetDurationUnit(e.target.value as TimeUnit)}
                aria-label="Target duration unit"
              >
                <option value="seconds">seconds</option>
                <option value="minutes">minutes</option>
                <option value="hours">hours</option>
                <option value="days">days</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Path Planning Assumptions Section */}
      <details className={styles.estimateDisclosure} open>
        <summary className={styles.estimateSummary}>
          <span>Internet Path Planning Assumptions</span>
          <span className={styles.disclosureIndicator}>▼</span>
        </summary>

        <div className={styles.estimateBody}>
          {/* Bandwidth Share */}
          <div style={{ marginBottom: '1rem' }}>
            <label className={styles.label} style={{ fontSize: '0.8125rem' }}>
              Bandwidth available to this download: {bandwidthShare}%
            </label>
            <div className={styles.throughputPills}>
              {BANDWIDTH_SHARE_PRESETS.map((pct) => (
                <button
                  key={pct}
                  type="button"
                  className={`${styles.pillButton} ${bandwidthShare === pct ? styles.pillButtonActive : ''}`}
                  onClick={() => setBandwidthShare(pct)}
                >
                  {pct}% {pct === 100 ? '(Full Line)' : ''}
                </button>
              ))}
            </div>
            <span className={styles.throughputHelp}>
              Allocate a partial bandwidth share if other household devices, video streaming, or background tasks share your connection.
            </span>
          </div>

          {/* Planning Efficiency */}
          <div style={{ marginBottom: '1rem' }}>
            <label className={styles.label} style={{ fontSize: '0.8125rem' }}>
              Planning Efficiency: {planningEfficiency}%
            </label>
            <div className={styles.throughputPills}>
              {EFFICIENCY_PRESETS.map((eff) => (
                <button
                  key={eff}
                  type="button"
                  className={`${styles.pillButton} ${planningEfficiency === eff ? styles.pillButtonActive : ''}`}
                  onClick={() => setPlanningEfficiency(eff)}
                >
                  {eff}% {eff === 90 ? '(Default Plan)' : ''}
                </button>
              ))}
            </div>
            <span className={styles.throughputHelp}>
              Accounts for TCP/IP packet framing, Wi-Fi variance, and transport overhead. This is an adjustable planning assumption, not a measured guarantee.
            </span>
          </div>

          {/* Optional Remote Server / CDN Delivery Cap */}
          <div>
            <label className={styles.toggleRow}>
              <input
                type="checkbox"
                className={styles.toggleCheckbox}
                checked={serverCapEnabled}
                onChange={(e) => setServerCapEnabled(e.target.checked)}
              />
              <span>Specify remote server / CDN delivery cap (optional)</span>
            </label>

            {serverCapEnabled && (
              <div style={{ marginTop: '0.75rem', maxWidth: '320px' }}>
                <div className={styles.inputRow}>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    className={styles.numberInput}
                    value={serverCapInput}
                    onChange={(e) => setServerCapInput(e.target.value)}
                    placeholder="25"
                    aria-label="Server delivery cap"
                  />
                  <select
                    className={styles.unitSelect}
                    value={serverCapUnit}
                    onChange={(e) => setServerCapUnit(e.target.value as SpeedUnit)}
                    aria-label="Server delivery cap unit"
                  >
                    <optgroup label="Bytes (MB/s)">
                      {BYTE_SPEED_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Bits (Mbps)">
                      {BIT_SPEED_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                <span className={styles.throughputHelp}>
                  The calculator cannot know a remote server&apos;s real delivery limit. Enable this only if you have a measured or known cap you want to include in the estimate.
                </span>
              </div>
            )}
          </div>
        </div>
      </details>

      {/* RESULTS DISPLAY */}

      {/* Mode A: Download Time Result */}
      {mode === 'download-time' && modeAResult && (
        <div className={styles.resultCard}>
          {modeAResult.success ? (
            <>
              <div className={styles.primaryResultBlock}>
                <div className={styles.primaryResultHeader}>
                  <span className={styles.primaryResultLabel}>Estimated Download Time</span>
                  {modeAResult.data.limitingFactor === 'server-cap' && (
                    <span className={`${styles.badge} ${styles.badgeHighlight}`}>Server Capped</span>
                  )}
                </div>
                <div className={styles.primaryResultValue}>
                  {modeAResult.data.formattedDuration}
                </div>
                <div className={styles.primaryResultCaption}>
                  Active constraint: <strong>{modeAResult.data.limitingFactorLabel}</strong>
                  {estimatedFinishTime && ` · Estimated finish around ${estimatedFinishTime}`}
                </div>
              </div>

              {/* Theoretical vs Planning Comparison */}
              <div className={styles.secondaryResultBlock}>
                <span className={styles.secondaryResultLabel}>
                  Theoretical connection-limit time (100% nominal line):
                </span>
                <span className={styles.secondaryResultValue}>
                  {modeAResult.data.formattedTheoreticalDuration}
                </span>
              </div>

              {/* Metrics Grid */}
              <div className={styles.metricGrid}>
                <div className={styles.metricBox}>
                  <span className={styles.metricBoxLabel}>Effective Throughput</span>
                  <span className={styles.metricBoxValue}>
                    {modeAResult.data.effectiveMBs.toFixed(2)} MB/s
                  </span>
                </div>
                <div className={styles.metricBox}>
                  <span className={styles.metricBoxLabel}>Broadband Equivalent</span>
                  <span className={styles.metricBoxValue}>
                    {modeAResult.data.effectiveMbps.toFixed(1)} Mbps
                  </span>
                </div>
                <div className={styles.metricBox}>
                  <span className={styles.metricBoxLabel}>Available Line Share</span>
                  <span className={styles.metricBoxValue}>
                    {(modeAResult.data.availableConnectionBytesPerSec * 8 / 1e6).toFixed(1)} Mbps ({bandwidthShare}%)
                  </span>
                </div>
                {modeAResult.data.serverCapBytesPerSec !== null && (
                  <div className={styles.metricBox}>
                    <span className={styles.metricBoxLabel}>Remote Server Cap</span>
                    <span className={styles.metricBoxValue}>
                      {(modeAResult.data.serverCapBytesPerSec / 1e6).toFixed(1)} MB/s
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.decisionNote}>
                {modeAResult.data.decisionNote}
              </div>
            </>
          ) : (
            <div className={`${styles.decisionNote} ${styles.warningNote}`}>
              {modeAResult.error}
            </div>
          )}
        </div>
      )}

      {/* Mode B: Bottleneck Analysis Result */}
      {mode === 'bottleneck' && modeBResult && (
        <div className={styles.resultCard}>
          {modeBResult.success ? (
            <>
              <div className={styles.primaryResultBlock}>
                <div className={styles.primaryResultHeader}>
                  <span className={styles.primaryResultLabel}>Path Bottleneck Analysis</span>
                  <span className={`${styles.badge} ${styles.badgeHighlight}`}>
                    {modeBResult.data.limitingFactorLabel}
                  </span>
                </div>
                <div className={styles.primaryResultValue}>
                  {modeBResult.data.effectiveThroughputMBs.toFixed(2)} MB/s
                </div>
                <div className={styles.primaryResultCaption}>
                  Max sustainable effective throughput ({modeBResult.data.effectiveThroughputMbps.toFixed(1)} Mbps) at {modeBResult.data.planningEfficiencyPercent}% efficiency
                </div>
              </div>

              <div className={styles.metricGrid}>
                <div className={styles.metricBox}>
                  <span className={styles.metricBoxLabel}>Nominal Line Rate</span>
                  <span className={styles.metricBoxValue}>
                    {modeBResult.data.nominalConnectionMbps.toFixed(1)} Mbps
                  </span>
                </div>
                <div className={styles.metricBox}>
                  <span className={styles.metricBoxLabel}>Bandwidth Share</span>
                  <span className={styles.metricBoxValue}>
                    {modeBResult.data.availableConnectionMbps.toFixed(1)} Mbps ({modeBResult.data.availableBandwidthPercent}%)
                  </span>
                </div>
                <div className={styles.metricBox}>
                  <span className={styles.metricBoxLabel}>Server / CDN Cap</span>
                  <span className={styles.metricBoxValue}>
                    {modeBResult.data.serverCapMBs !== null
                      ? `${modeBResult.data.serverCapMBs.toFixed(1)} MB/s`
                      : 'Disabled'}
                  </span>
                </div>
                {modeBResult.data.connectionHeadroomPercent > 0 && (
                  <div className={styles.metricBox}>
                    <span className={styles.metricBoxLabel}>Unused Line Headroom</span>
                    <span className={styles.metricBoxValue}>
                      +{modeBResult.data.connectionHeadroomPercent.toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.decisionNote}>
                {modeBResult.data.decisionNote}
              </div>
            </>
          ) : (
            <div className={`${styles.decisionNote} ${styles.warningNote}`}>
              {modeBResult.error}
            </div>
          )}
        </div>
      )}

      {/* Mode C: Required Connection Speed Result */}
      {mode === 'required-speed' && modeCResult && (
        <div className={styles.resultCard}>
          {modeCResult.success ? (
            <>
              <div className={styles.primaryResultBlock}>
                <div className={styles.primaryResultHeader}>
                  <span className={styles.primaryResultLabel}>Required Connection Speed</span>
                  <span
                    className={`${styles.badge} ${
                      modeCResult.data.isFeasible ? styles.badgeSuccess : styles.badgeHighlight
                    }`}
                  >
                    {modeCResult.data.isFeasible ? 'Achievable Plan' : 'Server Cap Limited'}
                  </span>
                </div>
                <div className={styles.primaryResultValue}>
                  {modeCResult.data.requiredNominalConnectionFormatted}
                </div>
                <div className={styles.primaryResultCaption}>
                  Required effective throughput: <strong>{modeCResult.data.requiredEffectiveFormatted}</strong>
                </div>
              </div>

              <div className={styles.metricGrid}>
                <div className={styles.metricBox}>
                  <span className={styles.metricBoxLabel}>Bandwidth Allocation</span>
                  <span className={styles.metricBoxValue}>
                    {bandwidthShare}%
                  </span>
                </div>
                <div className={styles.metricBox}>
                  <span className={styles.metricBoxLabel}>Target Time Window</span>
                  <span className={styles.metricBoxValue}>
                    {numericTargetDuration} {targetDurationUnit}
                  </span>
                </div>
                {modeCResult.data.serverCapEnabled && (
                  <div className={styles.metricBox}>
                    <span className={styles.metricBoxLabel}>Server Cap Ceiling</span>
                    <span className={styles.metricBoxValue}>
                      {modeCResult.data.maxFeasibleEffectiveMBs?.toFixed(1)} MB/s eff
                    </span>
                  </div>
                )}
              </div>

              <div
                className={`${styles.decisionNote} ${
                  !modeCResult.data.isFeasible ? styles.warningNote : ''
                }`}
              >
                {modeCResult.data.decisionNote}
              </div>
            </>
          ) : (
            <div className={`${styles.decisionNote} ${styles.warningNote}`}>
              {modeCResult.error}
            </div>
          )}
        </div>
      )}

      {/* Actions Row */}
      <div className={styles.actionsRow}>
        <button type="button" className={`${styles.actionButton} ${styles.resetButton}`} onClick={handleReset}>
          Reset Defaults
        </button>
        <button type="button" className={styles.actionButton} onClick={handleCopyLink}>
          {copyFeedback || 'Share Download Link'}
        </button>
      </div>
    </div>
  );
}
