import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { MbpsConverter } from '@/components/converter/MbpsConverter';
import { getCanonicalUrl } from '@/config/site';
import styles from '../page.module.css';

const title = 'Mbps to MB/s Converter — Megabits to Megabytes per Second';
const description =
  'Convert Mbps to MB/s instantly, or convert MB/s back to Mbps. 100 Mbps equals 12.5 MB/s using 8 bits per byte.';
const canonical = getCanonicalUrl('/mbps-to-mbs');

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

export default function MbpsConverterPage() {
  return (
    <main className={styles.pageContainer}>
      <header className={styles.headerSection}>
        <h1 className={styles.title}>Mbps to MB/s Converter</h1>
        <p className={styles.description}>
          Convert megabits per second (Mbps) to megabytes per second (MB/s), or convert back in the other direction. 1 byte equals 8 bits, so 100 Mbps equals 12.5 MB/s.
        </p>
      </header>

      <MbpsConverter />

      <section className={styles.supportingSection} aria-labelledby="how-it-works-heading">
        <h2 id="how-it-works-heading" className={styles.supportingTitle}>
          How Mbps to MB/s conversion works
        </h2>
        <div className={styles.prose}>
          <p>
            The mathematical formula for converting between megabits and megabytes per second is:
          </p>
          <div>
            <div className={styles.formulaBox}>
              MB/s = Mbps ÷ 8 &nbsp;&nbsp;|&nbsp;&nbsp; Mbps = MB/s × 8
            </div>
          </div>
          <p>
            Mbps (megabits per second) measures digital data transmission speed in bits, whereas MB/s (megabytes per second) measures data transfer in bytes. Because 1 byte equals 8 bits, divide megabits by 8 to obtain megabytes per second, or multiply megabytes by 8 to convert back to megabits.
          </p>
          <p>
            <strong>Capitalization matters:</strong> A lowercase &ldquo;b&rdquo; indicates bits (Mbps), while an uppercase &ldquo;B&rdquo; indicates bytes (MB/s). Internet service providers typically advertise connection speeds in Mbps, while operating systems and download tools often display transfer rates in MB/s.
          </p>
          <p>
            <strong>Unit conversion vs. real-world throughput:</strong> This converter calculates exact mathematical unit equivalence only and does not predict your actual download or upload throughput. Real-world transfer speeds can be lower due to remote server constraints, Wi-Fi interference, network congestion, or protocol overhead.
          </p>
          <p>
            <strong>MB/s vs. MiB/s:</strong> MB/s is not the same unit as MiB/s. Both Mbps and MB/s use standard decimal (SI) multipliers (1 MB = 1,000,000 bytes, 1 Mb = 1,000,000 bits), whereas binary IEC units like mebibytes (MiB) use powers of two (1 MiB = 1,048,576 bytes).
          </p>
        </div>

        <nav className={styles.relatedTools} aria-label="Related tools">
          <span>Need to calculate transfer duration or required speed?</span>
          <Link href="/" className={styles.relatedLink}>
            Download Time Calculator
          </Link>
          <span style={{ color: 'var(--border-strong)', margin: '0 0.5rem' }}>·</span>
          <Link href="/upload-time-calculator" className={styles.relatedLink}>
            Upload Time Calculator
          </Link>
          <span style={{ color: 'var(--border-strong)', margin: '0 0.5rem' }}>·</span>
          <Link href="/file-transfer-time-calculator" className={styles.relatedLink}>
            File Transfer Time Calculator
          </Link>
        </nav>
      </section>
    </main>
  );
}
