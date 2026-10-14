import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { DownloadCalculator } from '@/components/calculator/DownloadCalculator';
import { getCanonicalUrl } from '@/config/site';
import styles from './page.module.css';

const title = 'Download Time Calculator — Estimate File Download Time';
const description =
  'Calculate how long a file will take to download from its size and connection speed. Supports common file-size and transfer-speed units.';
const canonical = getCanonicalUrl('/');

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

export default function DownloadCalculatorPage() {
  return (
    <main className={styles.pageContainer}>
      <header className={styles.headerSection}>
        <h1 className={styles.title}>Download Time Calculator</h1>
        <p className={styles.description}>
          Calculate how long a file will take to download based on its size and your connection speed.
        </p>
      </header>

      <Suspense
        fallback={
          <div className={styles.fallbackLoader} aria-busy="true">
            Loading calculator...
          </div>
        }
      >
        <DownloadCalculator />
      </Suspense>

      <section className={styles.supportingSection} aria-labelledby="how-it-works-heading">
        <h2 id="how-it-works-heading" className={styles.supportingTitle}>
          How the download time calculation works
        </h2>
        <div className={styles.prose}>
          <p>
            The mathematical formula to determine theoretical download duration is:
          </p>
          <div>
            <div className={styles.formulaBox}>
              Download time = File size in bits ÷ Download speed in bits per second
            </div>
          </div>
          <p>
            Internet service providers (ISPs) advertise connection speeds in bits per second (e.g., 100 Mbps),
            whereas operating systems report file sizes in bytes (e.g., 100 GB). Because 8 bits equal 1 byte,
            a 100 Mbps broadband connection transfers up to 12.5 MB/s under ideal conditions.
          </p>
          <p>
            <strong>Theoretical vs. Practical Estimates:</strong> Theoretical calculations assume
            100% link efficiency. In practice, actual throughput can be lower due to network traffic,
            Wi-Fi interference, protocol overhead, and remote server limits. The 90% throughput option
            is provided as a practical planning assumption rather than a guarantee.
          </p>
        </div>

        <nav className={styles.relatedTools} aria-label="Related tools">
          <span>Need other calculations or unit conversions?</span>
          <Link href="/upload-time-calculator" className={styles.relatedLink}>
            Upload Time Calculator
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
