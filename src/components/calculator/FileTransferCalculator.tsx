'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  FileTransferMode,
  FileSizeUnit,
  SpeedUnit,
  TimeUnit,
  calculateFileTransferTime,
  calculateBottleneckAnalysis,
  calculateRequiredInterfaceSpeed,
  parseFileTransferUrlState,
  serializeFileTransferUrlState,
  DEFAULT_FILE_TRANSFER_STATE,
} from '@/lib/file-transfer';
import styles from './FileTransferCalculator.module.css';

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

const EFFICIENCY_PRESETS = [100, 95, 90, 85, 80, 70] as const;

interface DevicePreset {
  name: string;
  speed: string;
  unit: SpeedUnit;
}

const SOURCE_STORAGE_PRESETS: DevicePreset[] = [
  { name: 'NVMe SSD PCIe 4.0 (Typical ~7,000 MB/s)', speed: '7000', unit: 'MB/s' },
  { name: 'NVMe SSD PCIe 3.0 (Typical ~3,500 MB/s)', speed: '3500', unit: 'MB/s' },
  { name: 'SATA III SSD (Typical ~500 MB/s)', speed: '500', unit: 'MB/s' },
  { name: 'Fast 7200 RPM HDD (Typical ~200 MB/s)', speed: '200', unit: 'MB/s' },
  { name: 'External USB 3.0 HDD (Typical ~120 MB/s)', speed: '120', unit: 'MB/s' },
  { name: 'SD Card UHS-II (Typical ~250 MB/s)', speed: '250', unit: 'MB/s' },
  { name: 'SD Card UHS-I (Typical ~90 MB/s)', speed: '90', unit: 'MB/s' },
];

const INTERFACE_PRESETS: DevicePreset[] = [
  { name: '10GbE Network (10 Gbps nominal ceiling)', speed: '10', unit: 'Gbps' },
  { name: '2.5GbE Network (2.5 Gbps nominal ceiling)', speed: '2.5', unit: 'Gbps' },
  { name: 'Gigabit Ethernet (1 Gbps nominal ceiling)', speed: '1', unit: 'Gbps' },
  { name: 'Wi-Fi 6 (80MHz MIMO ~1.2 Gbps link ceiling)', speed: '1.2', unit: 'Gbps' },
  { name: 'Thunderbolt 4 / 3 (40 Gbps bus ceiling)', speed: '40', unit: 'Gbps' },
  { name: 'USB 3.2 Gen 2 (10 Gbps bus ceiling)', speed: '10', unit: 'Gbps' },
  { name: 'USB 3.0 / 3.2 Gen 1 (5 Gbps bus ceiling)', speed: '5', unit: 'Gbps' },
  { name: 'USB 2.0 (480 Mbps bus ceiling)', speed: '480', unit: 'Mbps' },
];

const DESTINATION_STORAGE_PRESETS: DevicePreset[] = [
  { name: 'NVMe SSD PCIe 4.0 (Typical ~5,000 MB/s)', speed: '5000', unit: 'MB/s' },
  { name: 'NVMe SSD PCIe 3.0 (Typical ~3,000 MB/s)', speed: '3000', unit: 'MB/s' },
  { name: 'SATA III SSD (Typical ~500 MB/s)', speed: '500', unit: 'MB/s' },
  { name: 'NAS RAID 5 (4x HDD example ~350 MB/s)', speed: '350', unit: 'MB/s' },
  { name: 'Fast 7200 RPM HDD (Typical ~180 MB/s)', speed: '180', unit: 'MB/s' },
  { name: '5400 RPM Backup HDD (Typical ~100 MB/s)', speed: '100', unit: 'MB/s' },
  { name: 'External USB HDD (Typical ~110 MB/s)', speed: '110', unit: 'MB/s' },
  { name: 'MicroSD Card V30 (Min sustained 30 MB/s)', speed: '30', unit: 'MB/s' },
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
  const [mode, setMode] = useState<FileTransferMode>(DEFAULT_FILE_TRANSFER_STATE.mode);

  // Path speed inputs
  const [sourceSpeedInput, setSourceSpeedInput] = useState<string>(
    DEFAULT_FILE_TRANSFER_STATE.sourceSpeed.toString()
  );
  const [sourceSpeedUnit, setSourceSpeedUnit] = useState<SpeedUnit>(
    DEFAULT_FILE_TRANSFER_STATE.sourceSpeedUnit
  );

  const [interfaceSpeedInput, setInterfaceSpeedInput] = useState<string>(
    DEFAULT_FILE_TRANSFER_STATE.interfaceSpeed.toString()
  );
  const [interfaceSpeedUnit, setInterfaceSpeedUnit] = useState<SpeedUnit>(
    DEFAULT_FILE_TRANSFER_STATE.interfaceSpeedUnit
  );

  const [destSpeedInput, setDestSpeedInput] = useState<string>(
    DEFAULT_FILE_TRANSFER_STATE.destSpeed.toString()
  );
  const [destSpeedUnit, setDestSpeedUnit] = useState<SpeedUnit>(
    DEFAULT_FILE_TRANSFER_STATE.destSpeedUnit
  );

  // Data & Planning inputs
  const [dataSizeInput, setDataSizeInput] = useState<string>(
    DEFAULT_FILE_TRANSFER_STATE.dataSize.toString()
  );
  const [dataSizeUnit, setDataSizeUnit] = useState<FileSizeUnit>(
    DEFAULT_FILE_TRANSFER_STATE.dataSizeUnit
  );

  const [efficiency, setEfficiency] = useState<number>(DEFAULT_FILE_TRANSFER_STATE.efficiency);

  // Optional batch / small-file overhead
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [fileCountInput, setFileCountInput] = useState<string>(
    DEFAULT_FILE_TRANSFER_STATE.fileCount.toString()
  );
  const [overheadInput, setOverheadInput] = useState<string>(
    DEFAULT_FILE_TRANSFER_STATE.overhead.toString()
  );

  // Mode C target window inputs
  const [targetDurationInput, setTargetDurationInput] = useState<string>(
    DEFAULT_FILE_TRANSFER_STATE.targetDuration.toString()
  );
  const [targetDurationUnit, setTargetDurationUnit] = useState<TimeUnit>(
    DEFAULT_FILE_TRANSFER_STATE.targetDurationUnit
  );
  const [targetSpeedUnit, setTargetSpeedUnit] = useState<SpeedUnit>('Gbps');

  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Restore state from URL search params on client mount
  const handleUrlSync = useCallback((params: ReturnType<typeof useSearchParams>) => {
    if (!params || Array.from(params.keys()).length === 0) return;

    const parsed = parseFileTransferUrlState(params);
    setMode(parsed.mode);
    setDataSizeInput(parsed.dataSize.toString());
    setDataSizeUnit(parsed.dataSizeUnit);
    setSourceSpeedInput(parsed.sourceSpeed.toString());
    setSourceSpeedUnit(parsed.sourceSpeedUnit);
    setInterfaceSpeedInput(parsed.interfaceSpeed.toString());
    setInterfaceSpeedUnit(parsed.interfaceSpeedUnit);
    setDestSpeedInput(parsed.destSpeed.toString());
    setDestSpeedUnit(parsed.destSpeedUnit);
    setEfficiency(parsed.efficiency);
    setFileCountInput(parsed.fileCount.toString());
    setOverheadInput(parsed.overhead.toString());
    setTargetDurationInput(parsed.targetDuration.toString());
    setTargetDurationUnit(parsed.targetDurationUnit);

    if (parsed.fileCount > 1 || parsed.overhead > 0) {
      setShowAdvanced(true);
    }
  }, []);

  // Parse numeric values safely
  const numericDataSize = parseFloat(dataSizeInput);
  const numericSourceSpeed = parseFloat(sourceSpeedInput);
  const numericInterfaceSpeed = parseFloat(interfaceSpeedInput);
  const numericDestSpeed = parseFloat(destSpeedInput);
  const numericFiles = Math.max(1, parseInt(fileCountInput, 10) || 1);
  const numericOverhead = Math.max(0, parseFloat(overheadInput) || 0);

  const numericTargetDuration = parseFloat(targetDurationInput);
  const targetDurationSeconds =
    Number.isFinite(numericTargetDuration) && numericTargetDuration > 0
      ? numericTargetDuration * TIME_UNIT_MULTIPLIERS[targetDurationUnit]
      : 0;

  // Mode A: Transfer Time
  const modeAResult = useMemo(() => {
    if (mode !== 'transfer-time') return null;
    return calculateFileTransferTime({
      dataSize: numericDataSize,
      dataSizeUnit,
      sourceSpeed: numericSourceSpeed,
      sourceSpeedUnit,
      interfaceSpeed: numericInterfaceSpeed,
      interfaceSpeedUnit,
      destinationSpeed: numericDestSpeed,
      destinationSpeedUnit: destSpeedUnit,
      planningEfficiencyPercent: efficiency,
      fileCount: numericFiles,
      perFileOverheadSeconds: numericOverhead,
    });
  }, [
    mode,
    numericDataSize,
    dataSizeUnit,
    numericSourceSpeed,
    sourceSpeedUnit,
    numericInterfaceSpeed,
    interfaceSpeedUnit,
    numericDestSpeed,
    destSpeedUnit,
    efficiency,
    numericFiles,
    numericOverhead,
  ]);

  // Mode B: Bottleneck Analysis
  const modeBResult = useMemo(() => {
    if (mode !== 'bottleneck') return null;
    return calculateBottleneckAnalysis({
      sourceSpeed: numericSourceSpeed,
      sourceSpeedUnit,
      interfaceSpeed: numericInterfaceSpeed,
      interfaceSpeedUnit,
      destinationSpeed: numericDestSpeed,
      destinationSpeedUnit: destSpeedUnit,
      planningEfficiencyPercent: efficiency,
    });
  }, [
    mode,
    numericSourceSpeed,
    sourceSpeedUnit,
    numericInterfaceSpeed,
    interfaceSpeedUnit,
    numericDestSpeed,
    destSpeedUnit,
    efficiency,
  ]);

  // Mode C: Required Interface Speed
  const modeCResult = useMemo(() => {
    if (mode !== 'required-interface') return null;
    return calculateRequiredInterfaceSpeed({
      dataSize: numericDataSize,
      dataSizeUnit,
      targetDurationSeconds,
      sourceSpeed: numericSourceSpeed,
      sourceSpeedUnit,
      destinationSpeed: numericDestSpeed,
      destinationSpeedUnit: destSpeedUnit,
      targetSpeedUnit,
      planningEfficiencyPercent: efficiency,
      fileCount: numericFiles,
      perFileOverheadSeconds: numericOverhead,
    });
  }, [
    mode,
    numericDataSize,
    dataSizeUnit,
    targetDurationSeconds,
    numericSourceSpeed,
    sourceSpeedUnit,
    numericDestSpeed,
    destSpeedUnit,
    targetSpeedUnit,
    efficiency,
    numericFiles,
    numericOverhead,
  ]);

  // Active bottleneck detection across modes
  const activeBottleneck = useMemo<'source' | 'interface' | 'destination' | 'tie' | null>(() => {
    if (modeAResult?.success) return modeAResult.data.bottleneckStage;
    if (modeBResult?.success) return modeBResult.data.bottleneckStage;
    if (modeCResult?.success) {
      if (!modeCResult.data.isFeasible) {
        return modeCResult.data.storageCeilingStage === 'source' ? 'source' : 'destination';
      }
      return 'interface';
    }
    return null;
  }, [modeAResult, modeBResult, modeCResult]);

  // Copy shareable link
  const handleCopyLink = useCallback(() => {
    const currentState = {
      mode,
      dataSize: Number.isFinite(numericDataSize) && numericDataSize > 0 ? numericDataSize : DEFAULT_FILE_TRANSFER_STATE.dataSize,
      dataSizeUnit,
      sourceSpeed: Number.isFinite(numericSourceSpeed) && numericSourceSpeed > 0 ? numericSourceSpeed : DEFAULT_FILE_TRANSFER_STATE.sourceSpeed,
      sourceSpeedUnit,
      interfaceSpeed: Number.isFinite(numericInterfaceSpeed) && numericInterfaceSpeed > 0 ? numericInterfaceSpeed : DEFAULT_FILE_TRANSFER_STATE.interfaceSpeed,
      interfaceSpeedUnit,
      destSpeed: Number.isFinite(numericDestSpeed) && numericDestSpeed > 0 ? numericDestSpeed : DEFAULT_FILE_TRANSFER_STATE.destSpeed,
      destSpeedUnit,
      efficiency,
      fileCount: numericFiles,
      overhead: numericOverhead,
      targetDuration: Number.isFinite(numericTargetDuration) && numericTargetDuration > 0 ? numericTargetDuration : DEFAULT_FILE_TRANSFER_STATE.targetDuration,
      targetDurationUnit,
    };

    const qs = serializeFileTransferUrlState(currentState);
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
    numericDataSize,
    dataSizeUnit,
    numericSourceSpeed,
    sourceSpeedUnit,
    numericInterfaceSpeed,
    interfaceSpeedUnit,
    numericDestSpeed,
    destSpeedUnit,
    efficiency,
    numericFiles,
    numericOverhead,
    numericTargetDuration,
    targetDurationUnit,
  ]);

  const handleReset = useCallback(() => {
    setMode(DEFAULT_FILE_TRANSFER_STATE.mode);
    setDataSizeInput(DEFAULT_FILE_TRANSFER_STATE.dataSize.toString());
    setDataSizeUnit(DEFAULT_FILE_TRANSFER_STATE.dataSizeUnit);
    setSourceSpeedInput(DEFAULT_FILE_TRANSFER_STATE.sourceSpeed.toString());
    setSourceSpeedUnit(DEFAULT_FILE_TRANSFER_STATE.sourceSpeedUnit);
    setInterfaceSpeedInput(DEFAULT_FILE_TRANSFER_STATE.interfaceSpeed.toString());
    setInterfaceSpeedUnit(DEFAULT_FILE_TRANSFER_STATE.interfaceSpeedUnit);
    setDestSpeedInput(DEFAULT_FILE_TRANSFER_STATE.destSpeed.toString());
    setDestSpeedUnit(DEFAULT_FILE_TRANSFER_STATE.destSpeedUnit);
    setEfficiency(DEFAULT_FILE_TRANSFER_STATE.efficiency);
    setFileCountInput(DEFAULT_FILE_TRANSFER_STATE.fileCount.toString());
    setOverheadInput(DEFAULT_FILE_TRANSFER_STATE.overhead.toString());
    setTargetDurationInput(DEFAULT_FILE_TRANSFER_STATE.targetDuration.toString());
    setTargetDurationUnit(DEFAULT_FILE_TRANSFER_STATE.targetDurationUnit);
    setShowAdvanced(false);
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  return (
    <div className={styles.calculatorCard}>
      <Suspense fallback={null}>
        <FileTransferUrlSync onSync={handleUrlSync} />
      </Suspense>

      {/* Mode Selector */}
      <div className={styles.modeSelectorRow}>
        <span className={styles.modeLabel}>Calculation Mode</span>
        <div className={styles.segmentedControl} role="tablist" aria-label="Calculation Mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'transfer-time'}
            className={`${styles.segmentBtn} ${mode === 'transfer-time' ? styles.segmentBtnActive : ''}`}
            onClick={() => setMode('transfer-time')}
          >
            Transfer Time
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'bottleneck'}
            className={`${styles.segmentBtn} ${mode === 'bottleneck' ? styles.segmentBtnActive : ''}`}
            onClick={() => setMode('bottleneck')}
          >
            Bottleneck Analysis
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'required-interface'}
            className={`${styles.segmentBtn} ${mode === 'required-interface' ? styles.segmentBtnActive : ''}`}
            onClick={() => setMode('required-interface')}
          >
            Required Interface Speed
          </button>
        </div>
      </div>

      {/* 3-Stage Pipeline Grid (Source -> Interface -> Destination) */}
      <div className={styles.pipelineSection}>
        <div className={styles.pipelineHeader}>
          <span className={styles.pipelineTitle}>
            Transfer Path Pipeline
            <span className={styles.pipelineBadge}>3-Stage End-to-End</span>
          </span>
          <span className={styles.fieldHint}>
            Throughput is capped by the slowest stage
          </span>
        </div>

        <div className={styles.pipelineGrid}>
          {/* Stage 1: Source Storage */}
          <div
            className={`${styles.stageCard} ${
              activeBottleneck === 'source' || activeBottleneck === 'tie'
                ? styles.stageCardBottleneck
                : ''
            }`}
          >
            <div className={styles.stageHeader}>
              <div className={styles.stageTitleGroup}>
                <span className={styles.stageName}>1. Source Read</span>
                <span className={styles.stageDesc}>Internal / local drive reading speed</span>
              </div>
              {activeBottleneck === 'source' && (
                <span className={`${styles.stageTag} ${styles.stageTagBottleneck}`}>
                  Bottleneck
                </span>
              )}
            </div>

            <select
              className={styles.presetSelect}
              aria-label="Source storage preset"
              onChange={(e) => {
                const preset = SOURCE_STORAGE_PRESETS.find((p) => p.name === e.target.value);
                if (preset) {
                  setSourceSpeedInput(preset.speed);
                  setSourceSpeedUnit(preset.unit);
                }
              }}
              defaultValue=""
            >
              <option value="" disabled>
                Select Example Storage Preset...
              </option>
              {SOURCE_STORAGE_PRESETS.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>

            <div className={styles.inputGroup}>
              <input
                type="number"
                min="0.001"
                step="any"
                className={styles.inputNumber}
                value={sourceSpeedInput}
                onChange={(e) => setSourceSpeedInput(e.target.value)}
                placeholder="500"
                aria-label="Source read speed"
              />
              <select
                className={styles.unitSelect}
                value={sourceSpeedUnit}
                onChange={(e) => setSourceSpeedUnit(e.target.value as SpeedUnit)}
                aria-label="Source read speed unit"
              >
                <optgroup label="Megabytes & Gigabytes">
                  {BYTE_SPEED_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Bits (Mbps / Gbps)">
                  {BIT_SPEED_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* Stage 2: Interface / Network */}
          <div
            className={`${styles.stageCard} ${
              activeBottleneck === 'interface' || activeBottleneck === 'tie'
                ? styles.stageCardBottleneck
                : ''
            }`}
          >
            <div className={styles.stageHeader}>
              <div className={styles.stageTitleGroup}>
                <span className={styles.stageName}>2. Interface / Bus</span>
                <span className={styles.stageDesc}>LAN, USB, Thunderbolt or bus rate</span>
              </div>
              {activeBottleneck === 'interface' && (
                <span className={`${styles.stageTag} ${styles.stageTagBottleneck}`}>
                  Bottleneck
                </span>
              )}
            </div>

            {mode === 'required-interface' ? (
              <div style={{ padding: '0.5rem 0', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                <em>Calculated automatically based on your deadline window below.</em>
              </div>
            ) : (
              <>
                <select
                  className={styles.presetSelect}
                  aria-label="Interface preset"
                  onChange={(e) => {
                    const preset = INTERFACE_PRESETS.find((p) => p.name === e.target.value);
                    if (preset) {
                      setInterfaceSpeedInput(preset.speed);
                      setInterfaceSpeedUnit(preset.unit);
                    }
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select Interface / Link Ceiling...
                  </option>
                  {INTERFACE_PRESETS.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>

                <div className={styles.inputGroup}>
                  <input
                    type="number"
                    min="0.001"
                    step="any"
                    className={styles.inputNumber}
                    value={interfaceSpeedInput}
                    onChange={(e) => setInterfaceSpeedInput(e.target.value)}
                    placeholder="1"
                    aria-label="Interface speed"
                  />
                  <select
                    className={styles.unitSelect}
                    value={interfaceSpeedUnit}
                    onChange={(e) => setInterfaceSpeedUnit(e.target.value as SpeedUnit)}
                    aria-label="Interface speed unit"
                  >
                    <optgroup label="Bits (Gbps / Mbps)">
                      {BIT_SPEED_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Bytes (MB/s / GB/s)">
                      {BYTE_SPEED_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Stage 3: Destination Storage */}
          <div
            className={`${styles.stageCard} ${
              activeBottleneck === 'destination' || activeBottleneck === 'tie'
                ? styles.stageCardBottleneck
                : ''
            }`}
          >
            <div className={styles.stageHeader}>
              <div className={styles.stageTitleGroup}>
                <span className={styles.stageName}>3. Destination Write</span>
                <span className={styles.stageDesc}>Target drive / NAS write speed</span>
              </div>
              {activeBottleneck === 'destination' && (
                <span className={`${styles.stageTag} ${styles.stageTagBottleneck}`}>
                  Bottleneck
                </span>
              )}
            </div>

            <select
              className={styles.presetSelect}
              aria-label="Destination storage preset"
              onChange={(e) => {
                const preset = DESTINATION_STORAGE_PRESETS.find((p) => p.name === e.target.value);
                if (preset) {
                  setDestSpeedInput(preset.speed);
                  setDestSpeedUnit(preset.unit);
                }
              }}
              defaultValue=""
            >
              <option value="" disabled>
                Select Example Storage Preset...
              </option>
              {DESTINATION_STORAGE_PRESETS.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>

            <div className={styles.inputGroup}>
              <input
                type="number"
                min="0.001"
                step="any"
                className={styles.inputNumber}
                value={destSpeedInput}
                onChange={(e) => setDestSpeedInput(e.target.value)}
                placeholder="300"
                aria-label="Destination write speed"
              />
              <select
                className={styles.unitSelect}
                value={destSpeedUnit}
                onChange={(e) => setDestSpeedUnit(e.target.value as SpeedUnit)}
                aria-label="Destination write speed unit"
              >
                <optgroup label="Megabytes & Gigabytes">
                  {BYTE_SPEED_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Bits (Mbps / Gbps)">
                  {BIT_SPEED_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Inputs Grid */}
      <div className={styles.secondaryGrid}>
        {/* Data Size (Modes A & C) */}
        {mode !== 'bottleneck' && (
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Total Data Size</label>
            <div className={styles.inputGroup}>
              <input
                type="number"
                min="0.001"
                step="any"
                className={styles.inputNumber}
                value={dataSizeInput}
                onChange={(e) => setDataSizeInput(e.target.value)}
                placeholder="100"
                aria-label="Data size"
              />
              <select
                className={styles.unitSelect}
                value={dataSizeUnit}
                onChange={(e) => setDataSizeUnit(e.target.value as FileSizeUnit)}
                aria-label="Data size unit"
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

        {/* Target Deadline (Mode C) */}
        {mode === 'required-interface' && (
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Target Transfer Deadline</label>
            <div className={styles.inputGroup}>
              <input
                type="number"
                min="0.1"
                step="any"
                className={styles.inputNumber}
                value={targetDurationInput}
                onChange={(e) => setTargetDurationInput(e.target.value)}
                placeholder="15"
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

        {/* Planning Efficiency */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            Planning Efficiency: {efficiency}%
          </label>
          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
            {EFFICIENCY_PRESETS.map((eff) => (
              <button
                key={eff}
                type="button"
                className={`${styles.actionBtn} ${efficiency === eff ? styles.segmentBtnActive : ''}`}
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                onClick={() => setEfficiency(eff)}
              >
                {eff}%
              </button>
            ))}
          </div>
          <span className={styles.fieldHint}>
            Planning efficiency applies an adjustable allowance for protocol, filesystem, device, and thermal overhead. It is an editable assumption, not a guaranteed rate.
          </span>
        </div>
      </div>

      {/* Advanced File Batch Options Toggle */}
      {mode !== 'bottleneck' && (
        <>
          <button
            type="button"
            className={styles.advancedToggle}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? '▼ Hide Small-File Batch Planning' : '► Add Small-File Batch Overhead (Optional)'}
          </button>

          {showAdvanced && (
            <div className={styles.advancedBox}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>File Count</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className={styles.inputNumber}
                  value={fileCountInput}
                  onChange={(e) => setFileCountInput(e.target.value)}
                  placeholder="1"
                  aria-label="File count"
                />
                <span className={styles.fieldHint}>Total files in this batch transfer</span>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Per-File Overhead (Seconds)</label>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  className={styles.inputNumber}
                  value={overheadInput}
                  onChange={(e) => setOverheadInput(e.target.value)}
                  placeholder="0.005"
                  aria-label="Per-file overhead seconds"
                />
                <span className={styles.fieldHint}>
                  Optional planning assumption for metadata and I/O latency across multi-file batches. Actual per-file latency varies by filesystem, OS, and drive.
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {/* RESULT CARDS */}

      {/* Mode A: Transfer Time Output */}
      {mode === 'transfer-time' && modeAResult && (
        <div className={styles.resultCard}>
          {modeAResult.success ? (
            <>
              <div className={styles.resultPrimary}>
                <span className={styles.resultLabel}>Estimated Transfer Duration</span>
                <span className={styles.resultValue}>{modeAResult.data.formattedDuration}</span>
                <span className={styles.resultSubtitle}>
                  Primary Bottleneck: <strong>{modeAResult.data.bottleneckStageLabel}</strong> (
                  {modeAResult.data.rawBottleneckMBs.toFixed(2)} MB/s raw limit)
                </span>
              </div>

              <div className={styles.resultGrid}>
                <div className={styles.metricBox}>
                  <span className={styles.metricLabel}>Effective Throughput</span>
                  <span className={styles.metricValue}>
                    {modeAResult.data.effectiveThroughputFormatted}
                  </span>
                </div>
                <div className={styles.metricBox}>
                  <span className={styles.metricLabel}>Data Per Hour</span>
                  <span className={styles.metricValue}>
                    {modeAResult.data.dataPerHourFormatted}
                  </span>
                </div>
                <div className={styles.metricBox}>
                  <span className={styles.metricLabel}>Pure Data Time</span>
                  <span className={styles.metricValue}>
                    {modeAResult.data.formattedPayloadDuration}
                  </span>
                </div>
                {modeAResult.data.overheadSeconds > 0 && (
                  <div className={styles.metricBox}>
                    <span className={styles.metricLabel}>Batch Metadata Time</span>
                    <span className={styles.metricValue}>
                      {modeAResult.data.formattedOverheadDuration}
                    </span>
                  </div>
                )}
              </div>

              {/* Headroom details */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                  fontSize: '0.8125rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <div>
                  <strong>Source Headroom:</strong>{' '}
                  {modeAResult.data.stages.source.headroomPercent.toFixed(0)}% (
                  +{modeAResult.data.stages.source.headroomMBs.toFixed(1)} MB/s)
                </div>
                <div>
                  <strong>Interface Headroom:</strong>{' '}
                  {modeAResult.data.stages.interface.headroomPercent.toFixed(0)}% (
                  +{modeAResult.data.stages.interface.headroomMBs.toFixed(1)} MB/s)
                </div>
                <div>
                  <strong>Destination Headroom:</strong>{' '}
                  {modeAResult.data.stages.destination.headroomPercent.toFixed(0)}% (
                  +{modeAResult.data.stages.destination.headroomMBs.toFixed(1)} MB/s)
                </div>
              </div>

              <div className={styles.decisionNote}>{modeAResult.data.decisionNote}</div>
            </>
          ) : (
            <div className={`${styles.decisionNote} ${styles.warningNote}`}>
              {modeAResult.error}
            </div>
          )}
        </div>
      )}

      {/* Mode B: Bottleneck Analysis Output */}
      {mode === 'bottleneck' && modeBResult && (
        <div className={styles.resultCard}>
          {modeBResult.success ? (
            <>
              <div className={styles.resultPrimary}>
                <span className={styles.resultLabel}>Pipeline Bottleneck</span>
                <span className={styles.resultValue}>{modeBResult.data.bottleneckStageLabel}</span>
                <span className={styles.resultSubtitle}>
                  Max Sustainable Effective Throughput: <strong>{modeBResult.data.effectiveMBs.toFixed(2)} MB/s</strong> (
                  {modeBResult.data.effectiveMbps.toFixed(1)} Mbps) at {modeBResult.data.efficiencyPercent}% efficiency
                </span>
              </div>

              <div className={styles.resultGrid}>
                <div className={styles.metricBox}>
                  <span className={styles.metricLabel}>1. Source Read</span>
                  <span className={styles.metricValue}>
                    {modeBResult.data.stages.source.speedMBs.toFixed(1)} MB/s
                  </span>
                  <span className={styles.fieldHint}>
                    {modeBResult.data.stages.source.isBottleneck
                      ? 'Limiting stage'
                      : `+${modeBResult.data.stages.source.headroomPercent.toFixed(0)}% headroom`}
                  </span>
                </div>
                <div className={styles.metricBox}>
                  <span className={styles.metricLabel}>2. Interface / Bus</span>
                  <span className={styles.metricValue}>
                    {modeBResult.data.stages.interface.speedMBs.toFixed(1)} MB/s
                  </span>
                  <span className={styles.fieldHint}>
                    {modeBResult.data.stages.interface.isBottleneck
                      ? 'Limiting stage'
                      : `+${modeBResult.data.stages.interface.headroomPercent.toFixed(0)}% headroom`}
                  </span>
                </div>
                <div className={styles.metricBox}>
                  <span className={styles.metricLabel}>3. Destination Write</span>
                  <span className={styles.metricValue}>
                    {modeBResult.data.stages.destination.speedMBs.toFixed(1)} MB/s
                  </span>
                  <span className={styles.fieldHint}>
                    {modeBResult.data.stages.destination.isBottleneck
                      ? 'Limiting stage'
                      : `+${modeBResult.data.stages.destination.headroomPercent.toFixed(0)}% headroom`}
                  </span>
                </div>
              </div>

              <div className={styles.decisionNote}>{modeBResult.data.decisionNote}</div>
            </>
          ) : (
            <div className={`${styles.decisionNote} ${styles.warningNote}`}>
              {modeBResult.error}
            </div>
          )}
        </div>
      )}

      {/* Mode C: Required Interface Speed Output */}
      {mode === 'required-interface' && modeCResult && (
        <div className={styles.resultCard}>
          {modeCResult.success ? (
            <>
              <div className={styles.resultPrimary}>
                <span className={styles.resultLabel}>Required Interface Speed</span>
                <span className={styles.resultValue}>
                  {modeCResult.data.requiredRawInterfaceSpeedFormatted}
                </span>
                <span className={styles.resultSubtitle}>
                  Effective throughput needed: <strong>{modeCResult.data.requiredEffectiveSpeedFormatted}</strong>
                </span>
              </div>

              <div className={styles.resultGrid}>
                <div className={styles.metricBox}>
                  <span className={styles.metricLabel}>Feasibility</span>
                  <span
                    className={styles.metricValue}
                    style={{
                      color: modeCResult.data.isFeasible ? 'var(--brand-primary)' : '#dc2626',
                    }}
                  >
                    {modeCResult.data.isFeasible ? 'Achievable' : 'Hard Storage Limit'}
                  </span>
                </div>
                <div className={styles.metricBox}>
                  <span className={styles.metricLabel}>Storage Ceiling</span>
                  <span className={styles.metricValue}>
                    {modeCResult.data.storageCeilingMBs.toFixed(1)} MB/s raw
                  </span>
                </div>
                <div className={styles.metricBox}>
                  <span className={styles.metricLabel}>Net Transfer Window</span>
                  <span className={styles.metricValue}>
                    {modeCResult.data.usableWindowFormatted}
                  </span>
                </div>
                {modeCResult.data.overheadSeconds > 0 && (
                  <div className={styles.metricBox}>
                    <span className={styles.metricLabel}>Batch Metadata Loss</span>
                    <span className={styles.metricValue}>
                      {modeCResult.data.overheadSeconds.toFixed(1)}s
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
        <button type="button" className={styles.actionBtn} onClick={handleReset}>
          Reset Defaults
        </button>
        <button type="button" className={styles.actionBtn} onClick={handleCopyLink}>
          {copyFeedback || 'Share Transfer Link'}
        </button>
      </div>
    </div>
  );
}
