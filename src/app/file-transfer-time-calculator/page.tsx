import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { FileTransferCalculator } from '@/components/calculator/FileTransferCalculator';
import { getCanonicalUrl } from '@/config/site';
import styles from '../page.module.css';

const title = 'File Transfer Time Calculator — Estimate File Copy Time';
const description =
  'Calculate how long it takes to transfer files from their size and sustained transfer speed across storage, USB, Ethernet, or NAS connections.';
const canonical = getCanonicalUrl('/file-transfer-time-calculator');

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

export default function FileTransferCalculatorPage() {
  return (
    <main className={styles.pageContainer}>
      <header className={styles.headerSection}>
        <h1 className={styles.title}>File Transfer Time Calculator</h1>
        <p className={styles.description}>
          Calculate how long it will take to copy or transfer files based on the total data size and transfer speed.
        </p>
      </header>

      <FileTransferCalculator />

      <section className={styles.supportingSection} aria-labelledby="how-it-works-heading">
        <h2 id="how-it-works-heading" className={styles.supportingTitle}>
          How the file transfer time calculation works
        </h2>
        <div className={styles.prose}>
          <p>
            The mathematical formula to estimate transfer duration is:
          </p>
          <div>
            <div className={styles.formulaBox}>
              Transfer time = File size ÷ Sustained transfer speed
            </div>
          </div>
          <p>
            A transfer cannot sustain a higher rate than its slowest component. Source storage, destination storage, and the connection can all limit the final copy speed.
          </p>
          <p>
            Nominal interface rates are link ceilings, not guaranteed file-copy speeds. If you entered a measured sustained copy rate, keep the adjustment at 100%. If you entered a nominal interface rate, lower it only as a planning adjustment.
          </p>
        </div>

        <nav className={styles.relatedTools} aria-label="Related tools">
          <span>Need other calculations or unit conversions?</span>
          <Link href="/" className={styles.relatedLink}>
            Download Time Calculator
          </Link>
          <span style={{ color: 'var(--border-strong)', margin: '0 0.5rem' }}>·</span>
          <Link href="/upload-time-calculator" className={styles.relatedLink}>
            Upload Time Calculator
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
