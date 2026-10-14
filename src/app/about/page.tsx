import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getCanonicalUrl } from '@/config/site';
import styles from '../info.module.css';

const title = 'About DataRateKit';
const description =
  'Learn about DataRateKit: browser-based utility tools built for accurate download, upload, file transfer calculations, and bandwidth unit conversions.';
const canonical = getCanonicalUrl('/about');

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

export default function AboutPage() {
  return (
    <main className={styles.contentContainer}>
      <header className={styles.headerSection}>
        <h1 className={styles.title}>About DataRateKit</h1>
        <div className={styles.lastUpdated}>Precision Tools for Digital Data Transfers</div>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Our Mission</h2>
        <div className={styles.prose}>
          <p>
            DataRateKit was created to provide straightforward, lightning-fast, and mathematically accurate calculation utilities for anyone working with digital data transfers and network bandwidth.
          </p>
          <p>
            Whether you are downloading a video game update, uploading 4K video footage to cloud storage, copying massive datasets across external solid-state drives (SSDs), or converting between telecom megabits (Mbps) and operating system megabytes (MB/s), DataRateKit delivers instant clarity without paywalls, sign-ups, or invasive tracking.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>What We Provide</h2>
        <div className={styles.prose}>
          <p>
            Our core utility suite is engineered to address distinct real-world transfer scenarios:
          </p>
          <ul>
            <li>
              <strong>Download Time Calculator:</strong> Compute how long files take to download over broadband internet connections, or find the speed required to finish within a deadline.
            </li>
            <li>
              <strong>Upload Time Calculator:</strong> Tailored specifically for asymmetric internet connections where upstream bandwidth is significantly lower than downstream speeds.
            </li>
            <li>
              <strong>File Transfer Time Calculator:</strong> Designed for local storage interfaces (NVMe SSD, HDD, USB 3.0/4.0, Gigabit LAN, and NAS) using sustained byte-rate throughput (MB/s).
            </li>
            <li>
              <strong>Mbps ↔ MB/s Converter:</strong> An instant, bidirectional speed converter clarifying the fundamental 8-to-1 ratio between telecom bits and file-system bytes.
            </li>
          </ul>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Calculation Principles and Transparency</h2>
        <div className={styles.prose}>
          <p>
            We believe transparent formulas build user trust. All our calculation models are openly explained alongside each tool:
          </p>
          <ul>
            <li>
              <strong>Exact Unit Mathematics:</strong> 1 byte is strictly calculated as 8 bits. Standard decimal units (KB, MB, GB, TB) use powers of 10 (1,000 multiplier), while binary units (KiB, MiB, GiB, TiB) use powers of 2 (1,024 multiplier).
            </li>
            <li>
              <strong>Theoretical vs. Real-World Efficiency:</strong> Digital communications rarely operate at 100% wire capacity. We provide an optional real-world overhead toggle (90% throughput) to reflect TCP/IP packet framing, Wi-Fi interference, and server latency.
            </li>
          </ul>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Built for Privacy and Speed</h2>
        <div className={styles.prose}>
          <p>
            DataRateKit does not require you to create an account, register an email address, or install browser extensions. Calculations run client-side in your browser, and all tools are fully responsive across mobile phones, tablets, and desktop workstations.
          </p>
          <p>
            Have feedback, noticed a bug, or want to suggest an improvement? Feel free to reach out via our{' '}
            <Link href="/contact">Contact Page</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
