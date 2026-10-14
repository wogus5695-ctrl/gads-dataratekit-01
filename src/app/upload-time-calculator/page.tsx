import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { UploadCalculator } from '@/components/calculator/UploadCalculator';
import { getCanonicalUrl } from '@/config/site';
import styles from '../page.module.css';

const title = 'Upload Time Calculator — Estimate File Upload Time';
const description =
  'Calculate how long a file will take to upload from its size and upload speed. Estimate upload duration and required transfer speed.';
const canonical = getCanonicalUrl('/upload-time-calculator');

export const metadata: Metadata = {
  title,
  description,
  alternates: canonical ? { canonical } : undefined,
  openGraph: {
    title,
    description,
    url: canonical,
  },
};

export default function UploadCalculatorPage() {
  return (
    <main className={styles.pageContainer}>
      <header className={styles.headerSection}>
        <h1 className={styles.title}>Upload Time Calculator</h1>
        <p className={styles.description}>
          Calculate how long a file will take to upload based on its size and your upload speed.
        </p>
      </header>

      <Suspense
        fallback={
          <div className={styles.fallbackLoader} aria-busy="true">
            Loading calculator...
          </div>
        }
      >
        <UploadCalculator />
      </Suspense>

      <section className={styles.supportingSection} aria-labelledby="how-it-works-heading">
        <h2 id="how-it-works-heading" className={styles.supportingTitle}>
          How the upload time calculation works
        </h2>
        <div className={styles.prose}>
          <p>
            The mathematical formula to determine theoretical upload duration is:
          </p>
          <div>
            <div className={styles.formulaBox}>
              Upload time = File size in bits ÷ Upload speed in bits per second
            </div>
          </div>
          <p>
            On asymmetric internet connections, upload speeds can be lower than download speeds.
            When estimating cloud backups, video uploads, or large file transfers, use your actual
            upload rate rather than your download speed.
          </p>
          <p>
            <strong>Theoretical vs. Practical Estimates:</strong> Theoretical calculations assume
            100% link efficiency. Actual upload throughput can be lower because of Wi-Fi conditions,
            network congestion, protocol overhead, and remote service limits. The 90% throughput
            option is a planning assumption, not a guarantee.
          </p>
        </div>

        <nav className={styles.relatedTools} aria-label="Related tools">
          <span>Need other calculations or unit conversions?</span>
          <Link href="/" className={styles.relatedLink}>
            Download Time Calculator
          </Link>
          <span style={{ color: 'var(--border-strong)', margin: '0 0.5rem' }}>·</span>
          <Link href="/file-transfer-time-calculator" className={styles.relatedLink}>
            File Transfer Time Calculator
          </Link>
          <span style={{ color: 'var(--border-strong)', margin: '0 0.5rem' }}>·</span>
          <Link href="/mbps-to-mbs" className={styles.relatedLink}>
            Mbps to MB/s Converter
          </Link>
        </nav>
      </section>
    </main>
  );
}
