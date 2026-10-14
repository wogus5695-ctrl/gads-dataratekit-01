'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  mbpsToMBs,
  mbsToMbps,
  validatePositiveNumber,
  formatNumber,
} from '@/lib/transfer';
import {
  parseConverterState,
  serializeConverterState,
} from './converter-url-state';
import styles from './MbpsConverter.module.css';

const COMMON_CONVERSIONS = [
  { mbps: 10, mbs: 1.25 },
  { mbps: 50, mbs: 6.25 },
  { mbps: 100, mbs: 12.5 },
  { mbps: 300, mbs: 37.5 },
  { mbps: 500, mbs: 62.5 },
  { mbps: 1000, mbs: 125 },
] as const;

export function MbpsConverter() {
  const searchParams = useSearchParams();

  // Direction source indicates which field was last typed by user
  const [source, setSource] = useState<'mbps' | 'mbs'>('mbps');
  const [mbpsInput, setMbpsInput] = useState<string>('100');
  const [mbsInput, setMbsInput] = useState<string>('12.5');

  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Restore state from URL search params on mount
  useEffect(() => {
    if (!searchParams || Array.from(searchParams.keys()).length === 0) return;

    const parsed = parseConverterState(searchParams);
    if (parsed.from === 'mbs') {
      setSource('mbs');
      setMbsInput(parsed.value.toString());
      setMbpsInput(formatNumber(mbsToMbps(parsed.value), 6));
    } else {
      setSource('mbps');
      setMbpsInput(parsed.value.toString());
      setMbsInput(formatNumber(mbpsToMBs(parsed.value), 6));
    }
  }, [searchParams]);

  // Validations
  const mbpsValidation = useMemo(
    () => validatePositiveNumber(mbpsInput, 'Mbps', true),
    [mbpsInput]
  );

  const mbsValidation = useMemo(
    () => validatePositiveNumber(mbsInput, 'MB/s', true),
    [mbsInput]
  );

  // Handle typing in Mbps field
  const handleMbpsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSource('mbps');
    setMbpsInput(val);

    const valValidation = validatePositiveNumber(val, 'Mbps', true);
    if (valValidation.isValid) {
      setMbsInput(formatNumber(mbpsToMBs(valValidation.value), 6));
    }
  };

  // Handle typing in MB/s field
  const handleMbsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSource('mbs');
    setMbsInput(val);

    const valValidation = validatePositiveNumber(val, 'MB/s', true);
    if (valValidation.isValid) {
      setMbpsInput(formatNumber(mbsToMbps(valValidation.value), 6));
    }
  };

  // Set preset conversion value
  const handleSelectPreset = (mbpsVal: number) => {
    setSource('mbps');
    setMbpsInput(mbpsVal.toString());
    setMbsInput(formatNumber(mbpsToMBs(mbpsVal), 6));
  };

  // Reset to default
  const handleReset = useCallback(() => {
    setSource('mbps');
    setMbpsInput('100');
    setMbsInput('12.5');
    setCopyFeedback(null);
  }, []);

  // Formatted conversion relation string
  const relationString = useMemo(() => {
    const isBothValid = mbpsValidation.isValid && mbsValidation.isValid;
    if (!isBothValid) return null;

    if (source === 'mbs') {
      return `${mbsInput} MB/s = ${mbpsInput} Mbps`;
    }
    return `${mbpsInput} Mbps = ${mbsInput} MB/s`;
  }, [source, mbpsInput, mbsInput, mbpsValidation.isValid, mbsValidation.isValid]);

  // Copy result text (e.g. "100 Mbps = 12.5 MB/s")
  const handleCopyResult = async () => {
    if (!relationString || typeof window === 'undefined') return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(relationString);
        setCopyFeedback('Result copied!');
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = relationString;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopyFeedback('Result copied!');
      }
    } catch {
      setCopyFeedback('Unable to copy');
    }

    setTimeout(() => {
      setCopyFeedback(null);
    }, 2500);
  };

  // Copy shareable link
  const handleCopyLink = async () => {
    if (typeof window === 'undefined') return;

    const activeValue = source === 'mbs'
      ? (mbsValidation.isValid ? mbsValidation.value : 12.5)
      : (mbpsValidation.isValid ? mbpsValidation.value : 100);

    const query = serializeConverterState({
      value: activeValue,
      from: source,
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
  };

  return (
    <>
      <div className={styles.converterContainer} aria-label="Mbps to MB/s Converter">
        <form onSubmit={(e) => e.preventDefault()} noValidate>
          <div className={styles.bidirectionalHelp}>
            Edit either field — the other updates instantly.
          </div>

          <div className={styles.converterGrid}>
            {/* Mbps Field */}
            <div className={styles.converterField}>
              <div className={styles.fieldHeader}>
                <label htmlFor="mbps-input" className={styles.fullLabel}>
                  Megabits per second
                </label>
                <span className={styles.unitHint}>b = bits</span>
              </div>
              <div
                className={`${styles.inputWrapper} ${
                  !mbpsValidation.isValid ? styles.inputWrapperError : ''
                }`}
              >
                <input
                  id="mbps-input"
                  type="text"
                  inputMode="decimal"
                  value={mbpsInput}
                  onChange={handleMbpsChange}
                  placeholder="e.g. 100"
                  aria-invalid={!mbpsValidation.isValid}
                  aria-describedby={!mbpsValidation.isValid ? 'mbps-error' : undefined}
                  className={styles.numberInput}
                />
                <span className={styles.unitBadge} aria-hidden="true">
                  Mbps
                </span>
              </div>
              {!mbpsValidation.isValid && (
                <span id="mbps-error" className={styles.errorMessage} role="alert">
                  {mbpsValidation.error}
                </span>
              )}
            </div>

            {/* Visual bidirectional indicator */}
            <div className={styles.arrowDivider} aria-hidden="true">
              <span className={styles.arrowDesktop}>⇄</span>
              <span className={styles.arrowMobile}>↕</span>
            </div>

            {/* MB/s Field */}
            <div className={styles.converterField}>
              <div className={styles.fieldHeader}>
                <label htmlFor="mbs-input" className={styles.fullLabel}>
                  Megabytes per second
                </label>
                <span className={styles.unitHint}>B = bytes</span>
              </div>
              <div
                className={`${styles.inputWrapper} ${
                  !mbsValidation.isValid ? styles.inputWrapperError : ''
                }`}
              >
                <input
                  id="mbs-input"
                  type="text"
                  inputMode="decimal"
                  value={mbsInput}
                  onChange={handleMbsChange}
                  placeholder="e.g. 12.5"
                  aria-invalid={!mbsValidation.isValid}
                  aria-describedby={!mbsValidation.isValid ? 'mbs-error' : undefined}
                  className={styles.numberInput}
                />
                <span className={styles.unitBadge} aria-hidden="true">
                  MB/s
                </span>
              </div>
              {!mbsValidation.isValid && (
                <span id="mbs-error" className={styles.errorMessage} role="alert">
                  {mbsValidation.error}
                </span>
              )}
            </div>
          </div>

          {/* Relation Display Banner */}
          <div className={styles.relationBanner} aria-live="polite" aria-atomic="true">
            {relationString ? (
              <>
                <div className={styles.relationText}>{relationString}</div>
                <div className={styles.relationFormula}>Exact conversion: 1 byte = 8 bits</div>
              </>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Please enter a valid positive speed value.
              </div>
            )}
          </div>

          {/* Actions Row */}
          <div className={styles.actionsRow}>
            <button
              type="button"
              className={`${styles.actionButton} ${styles.resetButton}`}
              onClick={handleReset}
              title="Reset converter to 100 Mbps = 12.5 MB/s"
            >
              Reset
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {copyFeedback && (
                <span className={styles.statusNotice} role="status">
                  {copyFeedback}
                </span>
              )}
              {relationString && (
                <button
                  type="button"
                  className={styles.actionButton}
                  onClick={handleCopyResult}
                  title="Copy result text to clipboard"
                >
                  Copy result
                </button>
              )}
              <button
                type="button"
                className={styles.actionButton}
                onClick={handleCopyLink}
                title="Copy shareable link to current values"
              >
                Copy link
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Common Mbps to MB/s Conversions Reference Table */}
      <section
        className={styles.commonReferenceCard}
        aria-labelledby="common-conversions-heading"
      >
        <h2 id="common-conversions-heading" className={styles.referenceTitle}>
          Common Mbps to MB/s conversions
        </h2>
        <p className={styles.referenceSubtitle}>
          Select a rate below to set the converter:
        </p>
        <div className={styles.referenceGrid} role="list">
          {COMMON_CONVERSIONS.map((item) => (
            <button
              key={item.mbps}
              type="button"
              className={styles.referenceRow}
              onClick={() => handleSelectPreset(item.mbps)}
              title={`Convert ${item.mbps} Mbps to ${item.mbs} MB/s`}
            >
              <span className={styles.referenceLeft}>{item.mbps} Mbps</span>
              <span className={styles.referenceEquals}>=</span>
              <span className={styles.referenceRight}>{item.mbs} MB/s</span>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
