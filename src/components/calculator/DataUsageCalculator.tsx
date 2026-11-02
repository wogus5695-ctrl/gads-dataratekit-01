'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ActivityItem,
  BillingPeriodOption,
  DataUsageRateUnit,
  calculateDataUsage,
  DATA_USAGE_RATE_UNITS,
  DEFAULT_DATA_USAGE_STATE,
  serializeDataUsageState,
  parseDataUsageState,
} from '@/lib/data-usage';
import {
  VERIFIED_DATA_USAGE_PRESETS,
  getPresetById,
} from '@/data/data-usage-presets';
import { formatNumber } from '@/lib/transfer/format';
import styles from './DataUsageCalculator.module.css';

function UrlSync({
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

const MAX_ACTIVITIES = 8;

export function DataUsageCalculator() {
  const [activities, setActivities] = useState<ActivityItem[]>(
    DEFAULT_DATA_USAGE_STATE.activities
  );
  const [billingPeriodOption, setBillingPeriodOption] = useState<BillingPeriodOption>(
    DEFAULT_DATA_USAGE_STATE.billingPeriodOption
  );
  const [customBillingDays, setCustomBillingDays] = useState<number>(
    DEFAULT_DATA_USAGE_STATE.customBillingDays
  );
  const [enableDataCap, setEnableDataCap] = useState<boolean>(
    DEFAULT_DATA_USAGE_STATE.enableDataCap
  );
  const [dataCapValue, setDataCapValue] = useState<number>(
    DEFAULT_DATA_USAGE_STATE.dataCapValue
  );
  const [dataCapUnit, setDataCapUnit] = useState<'GB' | 'TB'>(
    DEFAULT_DATA_USAGE_STATE.dataCapUnit
  );

  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Restore state from URL search params on client mount
  const handleUrlSync = useCallback((params: ReturnType<typeof useSearchParams>) => {
    if (!params || Array.from(params.keys()).length === 0) return;

    const parsed = parseDataUsageState(params);
    setActivities(parsed.activities);
    setBillingPeriodOption(parsed.billingPeriodOption);
    setCustomBillingDays(parsed.customBillingDays);
    setEnableDataCap(parsed.enableDataCap);
    setDataCapValue(parsed.dataCapValue);
    setDataCapUnit(parsed.dataCapUnit);
  }, []);

  // Real-time calculation output
  const calculationResult = useMemo(() => {
    return calculateDataUsage({
      activities,
      billingPeriodOption,
      customBillingDays,
      enableDataCap,
      dataCapValue,
      dataCapUnit,
    });
  }, [
    activities,
    billingPeriodOption,
    customBillingDays,
    enableDataCap,
    dataCapValue,
    dataCapUnit,
  ]);

  // Activity handlers
  const handleAddActivity = () => {
    if (activities.length >= MAX_ACTIVITIES) return;
    const newId = `act-${Date.now()}`;
    setActivities([
      ...activities,
      {
        id: newId,
        name: `Custom Activity ${activities.length + 1}`,
        rateValue: 5,
        rateUnit: 'Mbps',
        hoursPerDay: 1,
        minutesPerDay: 0,
        devices: 1,
      },
    ]);
  };

  const handleDuplicateActivity = (id: string) => {
    if (activities.length >= MAX_ACTIVITIES) return;
    const target = activities.find((a) => a.id === id);
    if (!target) return;

    const dupId = `act-${Date.now()}`;
    const newAct: ActivityItem = {
      ...target,
      id: dupId,
      name: `${target.name} (Copy)`,
    };
    setActivities([...activities, newAct]);
  };

  const handleRemoveActivity = (id: string) => {
    if (activities.length <= 1) return; // Keep at least one activity
    setActivities(activities.filter((a) => a.id !== id));
  };

  const handleUpdateActivity = (id: string, updates: Partial<ActivityItem>) => {
    setActivities(
      activities.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
  };

  const handlePresetSelect = (id: string, presetId: string) => {
    if (presetId === 'custom') {
      handleUpdateActivity(id, { presetId: undefined });
      return;
    }

    const preset = getPresetById(presetId);
    if (!preset) return;

    handleUpdateActivity(id, {
      presetId: preset.id,
      name: preset.label.split('(')[0].trim(),
      rateValue: preset.rateValue,
      rateUnit: preset.rateUnit,
    });
  };

  // Copy shareable link
  const handleCopyLink = () => {
    if (typeof window === 'undefined') return;

    const query = serializeDataUsageState({
      activities,
      billingPeriodOption,
      customBillingDays,
      enableDataCap,
      dataCapValue,
      dataCapUnit,
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
    setActivities(DEFAULT_DATA_USAGE_STATE.activities);
    setBillingPeriodOption(DEFAULT_DATA_USAGE_STATE.billingPeriodOption);
    setCustomBillingDays(DEFAULT_DATA_USAGE_STATE.customBillingDays);
    setEnableDataCap(DEFAULT_DATA_USAGE_STATE.enableDataCap);
    setDataCapValue(DEFAULT_DATA_USAGE_STATE.dataCapValue);
    setDataCapUnit(DEFAULT_DATA_USAGE_STATE.dataCapUnit);
    setCopyFeedback(null);

    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  return (
    <div className={styles.calculatorContainer} aria-label="Internet Data Usage Calculator">
      <React.Suspense fallback={null}>
        <UrlSync onSync={handleUrlSync} />
      </React.Suspense>

      {/* Top Config: Planning Period */}
      <div className={styles.topConfigBar}>
        <div className={styles.periodGroup}>
          <span className={styles.periodLabel}>Planning Period:</span>
          <div className={styles.periodTabs} role="tablist" aria-label="Billing cycle days">
            {[28, 30, 31].map((days) => (
              <button
                key={days}
                type="button"
                role="tab"
                aria-selected={billingPeriodOption === days}
                className={`${styles.periodBtn} ${
                  billingPeriodOption === days ? styles.periodBtnActive : ''
                }`}
                onClick={() => setBillingPeriodOption(days as BillingPeriodOption)}
              >
                {days} Days
              </button>
            ))}
            <button
              type="button"
              role="tab"
              aria-selected={billingPeriodOption === 'custom'}
              className={`${styles.periodBtn} ${
                billingPeriodOption === 'custom' ? styles.periodBtnActive : ''
              }`}
              onClick={() => setBillingPeriodOption('custom')}
            >
              Custom
            </button>
          </div>
          {billingPeriodOption === 'custom' && (
            <input
              type="number"
              aria-label="Custom days in planning cycle"
              className={styles.customDaysInput}
              min="1"
              max="365"
              value={customBillingDays}
              onChange={(e) => setCustomBillingDays(parseInt(e.target.value, 10) || 30)}
            />
          )}
        </div>
      </div>

      {/* Activities Stack */}
      <div className={styles.activitiesSection}>
        {activities.map((act, index) => {
          const actOutput = calculationResult.activityResults[index];
          const preset = act.presetId ? getPresetById(act.presetId) : undefined;

          return (
            <div key={act.id} className={styles.activityCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>
                  Activity #{index + 1}: {act.name}
                </span>
                <div className={styles.cardActions}>
                  {activities.length < MAX_ACTIVITIES && (
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => handleDuplicateActivity(act.id)}
                      title="Duplicate activity"
                      aria-label={`Duplicate ${act.name}`}
                    >
                      Duplicate
                    </button>
                  )}
                  {activities.length > 1 && (
                    <button
                      type="button"
                      className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                      onClick={() => handleRemoveActivity(act.id)}
                      title="Remove activity"
                      aria-label={`Remove ${act.name}`}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Input Grid */}
              <div className={styles.cardGrid}>
                {/* Activity Name / Preset selector */}
                <div className={styles.fieldCol}>
                  <label htmlFor={`preset-select-${act.id}`} className={styles.fieldLabel}>
                    Preset or Activity Type
                  </label>
                  <select
                    id={`preset-select-${act.id}`}
                    className={styles.textInput}
                    style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}
                    value={act.presetId || 'custom'}
                    onChange={(e) => handlePresetSelect(act.id, e.target.value)}
                  >
                    <option value="custom">Custom Activity (Manual Rate)</option>
                    <optgroup label="Netflix (Official Usage)">
                      {VERIFIED_DATA_USAGE_PRESETS.filter((p) => p.provider === 'Netflix').map(
                        (p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        )
                      )}
                    </optgroup>
                    <optgroup label="Spotify (Official Bitrate)">
                      {VERIFIED_DATA_USAGE_PRESETS.filter((p) => p.provider === 'Spotify').map(
                        (p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        )
                      )}
                    </optgroup>
                    <optgroup label="YouTube Music (Official Bitrate)">
                      {VERIFIED_DATA_USAGE_PRESETS.filter(
                        (p) => p.provider === 'YouTube Music'
                      ).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Rate & Unit */}
                <div className={styles.fieldCol}>
                  <label htmlFor={`rate-input-${act.id}`} className={styles.fieldLabel}>
                    Data Transfer Rate
                  </label>
                  <div className={styles.inputGroup}>
                    <input
                      id={`rate-input-${act.id}`}
                      type="number"
                      step="any"
                      min="0"
                      className={styles.numberInput}
                      value={String(act.rateValue)}
                      onChange={(e) =>
                        handleUpdateActivity(act.id, {
                          rateValue: e.target.value,
                          presetId: undefined, // Customizing rate detaches from preset
                        })
                      }
                      placeholder="5"
                    />
                    <select
                      aria-label="Rate unit"
                      className={styles.selectInput}
                      value={act.rateUnit}
                      onChange={(e) =>
                        handleUpdateActivity(act.id, {
                          rateUnit: e.target.value as DataUsageRateUnit,
                          presetId: undefined,
                        })
                      }
                    >
                      {DATA_USAGE_RATE_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Duration */}
                <div className={styles.fieldCol}>
                  <label className={styles.fieldLabel}>Daily Duration</label>
                  <div className={styles.durationGrid}>
                    <div className={styles.durationField}>
                      <input
                        aria-label="Hours per day"
                        type="number"
                        min="0"
                        max="24"
                        value={String(act.hoursPerDay)}
                        onChange={(e) =>
                          handleUpdateActivity(act.id, { hoursPerDay: e.target.value })
                        }
                      />
                      <span className={styles.durationSuffix}>hr</span>
                    </div>
                    <div className={styles.durationField}>
                      <input
                        aria-label="Minutes per day"
                        type="number"
                        min="0"
                        max="59"
                        value={String(act.minutesPerDay)}
                        onChange={(e) =>
                          handleUpdateActivity(act.id, { minutesPerDay: e.target.value })
                        }
                      />
                      <span className={styles.durationSuffix}>min</span>
                    </div>
                  </div>
                </div>

                {/* Devices */}
                <div className={styles.fieldCol}>
                  <label htmlFor={`devices-${act.id}`} className={styles.fieldLabel}>
                    Active Devices
                  </label>
                  <div className={styles.devicesField}>
                    <button
                      type="button"
                      className={styles.devicesBtn}
                      onClick={() => {
                        const cur = parseInt(String(act.devices), 10) || 1;
                        if (cur > 1) handleUpdateActivity(act.id, { devices: cur - 1 });
                      }}
                      aria-label="Decrease device count"
                    >
                      −
                    </button>
                    <input
                      id={`devices-${act.id}`}
                      type="number"
                      min="1"
                      className={styles.devicesInput}
                      value={String(act.devices)}
                      onChange={(e) =>
                        handleUpdateActivity(act.id, {
                          devices: Math.max(1, parseInt(e.target.value, 10) || 1),
                        })
                      }
                    />
                    <button
                      type="button"
                      className={styles.devicesBtn}
                      onClick={() => {
                        const cur = parseInt(String(act.devices), 10) || 1;
                        handleUpdateActivity(act.id, { devices: cur + 1 });
                      }}
                      aria-label="Increase device count"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Official Source Transparency Badge */}
              {preset && (
                <div className={styles.sourceBadge}>
                  <div className={styles.sourceBadgeTop}>
                    <span className={styles.sourceTag}>
                      {preset.sourceType === 'official-usage'
                        ? 'Official Usage Specification'
                        : 'Official Bitrate Specification'}
                    </span>
                    <span>Verified: {preset.lastVerified}</span>
                  </div>
                  <div>
                    Source:{' '}
                    <a
                      href={preset.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.sourceLink}
                    >
                      {preset.sourceName}
                    </a>
                  </div>
                  {preset.notes && <div>{preset.notes}</div>}
                </div>
              )}
            </div>
          );
        })}

        {/* Add Activity Action */}
        {activities.length < MAX_ACTIVITIES ? (
          <div className={styles.addActivityRow}>
            <button
              type="button"
              className={styles.addBtn}
              onClick={handleAddActivity}
            >
              + Add Another Activity
            </button>
          </div>
        ) : (
          <div className={styles.maxNotice}>
            Maximum of {MAX_ACTIVITIES} activities reached for planning.
          </div>
        )}
      </div>

      {/* Optional Data Cap Toggle */}
      <div className={styles.dataCapSection}>
        <label className={styles.capToggleRow}>
          <input
            type="checkbox"
            className={styles.capCheckbox}
            checked={enableDataCap}
            onChange={(e) => setEnableDataCap(e.target.checked)}
          />
          <span className={styles.capToggleLabel}>
            Evaluate against a Data Plan / Monthly Data Cap
          </span>
        </label>

        {enableDataCap && (
          <div className={styles.capInputsRow}>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <input
                aria-label="Monthly data cap limit"
                type="number"
                min="0"
                step="any"
                className={styles.numberInput}
                value={String(dataCapValue)}
                onChange={(e) => setDataCapValue(parseFloat(e.target.value) || 0)}
                placeholder="1000"
              />
              <select
                aria-label="Data cap unit"
                className={styles.selectInput}
                value={dataCapUnit}
                onChange={(e) => setDataCapUnit(e.target.value as 'GB' | 'TB')}
              >
                <option value="GB">GB</option>
                <option value="TB">TB</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results Section */}
      <div className={styles.resultsSection}>
        <div className={styles.primaryResultBlock}>
          <div className={styles.primaryResultHeader}>
            Estimated {calculationResult.billingDays}-Day Period Usage
          </div>
          <div className={styles.primaryResultValue}>
            {calculationResult.totalBillingFormatted}
          </div>
          <div className={styles.primaryResultCaption}>
            Combined total across {activities.length} active{' '}
            {activities.length === 1 ? 'activity' : 'activities'} over a{' '}
            {calculationResult.billingDays}-day planning period
          </div>
        </div>

        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Daily Internet Usage</div>
            <div className={styles.metricValue}>
              {calculationResult.totalDailyFormatted} / day
            </div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Weekly Internet Usage (7 Days)</div>
            <div className={styles.metricValue}>
              {calculationResult.totalWeeklyFormatted} / week
            </div>
          </div>
        </div>

        {/* Data Cap Analysis Block */}
        {calculationResult.capResult && (
          <div className={styles.capResultCard}>
            <div className={styles.capHeaderRow}>
              <span className={styles.capCardTitle}>
                Data Cap Allowance ({calculationResult.capResult.capFormatted})
              </span>
              <span
                className={`${styles.capBadge} ${
                  calculationResult.capResult.isOverPlan
                    ? styles.capBadgeOver
                    : styles.capBadgeNormal
                }`}
              >
                {calculationResult.capResult.isOverPlan
                  ? `Over plan by ${calculationResult.capResult.overPlanFormatted}`
                  : `${formatNumber(calculationResult.capResult.utilizationPercent, 1)}% Used`}
              </span>
            </div>

            <div className={styles.progressBarContainer}>
              <div
                className={`${styles.progressBar} ${
                  calculationResult.capResult.isOverPlan ? styles.progressBarOver : ''
                }`}
                style={{
                  width: `${Math.min(100, calculationResult.capResult.utilizationPercent)}%`,
                }}
              />
            </div>

            <div className={styles.capProjectionNotes}>
              {calculationResult.capResult.isOverPlan ? (
                <span>
                  Usage exceeds current plan allowance by{' '}
                  <strong>{calculationResult.capResult.overPlanFormatted}</strong> under
                  these daily durations.
                </span>
              ) : (
                <span>
                  Remaining data buffer:{' '}
                  <strong>
                    {formatNumber(
                      calculationResult.capResult.remainingBytes / 1_000_000_000,
                      2
                    )}{' '}
                    GB
                  </strong>
                  . Projected time until cap:{' '}
                  <strong>{calculationResult.capResult.daysUntilCapFormatted}</strong>.
                </span>
              )}
              <br />
              <em>
                Planning projection assumes consistent daily usage patterns throughout the cycle.
              </em>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className={styles.actionsRow}>
        <button
          type="button"
          onClick={handleCopyLink}
          className={styles.actionButton}
          aria-label="Copy shareable link with current activities"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
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
          aria-label="Reset calculator to default activities"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
