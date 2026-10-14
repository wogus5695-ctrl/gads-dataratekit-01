import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getCanonicalUrl } from '@/config/site';
import styles from '../info.module.css';

const title = 'Terms of Use';
const description =
  'DataRateKit Terms of Use: Informational calculation purpose, mathematical estimates disclaimer, and acceptable use guidelines.';
const canonical = getCanonicalUrl('/terms');

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

export default function TermsPage() {
  return (
    <main className={styles.contentContainer}>
      <header className={styles.headerSection}>
        <h1 className={styles.title}>Terms of Use</h1>
        <div className={styles.lastUpdated}>Effective Date: October 2026</div>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>1. Acceptance of Terms</h2>
        <div className={styles.prose}>
          <p>
            By accessing or using DataRateKit (the &ldquo;Site&rdquo;), you agree to be bound by these Terms of Use. If you do not agree with any part of these terms, you should discontinue use of the Site.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>2. Informational and Planning Purposes Only</h2>
        <div className={styles.prose}>
          <p>
            DataRateKit provides online calculation utilities for estimating file download durations, upload times, storage transfer rates, and bandwidth unit equivalences.
          </p>
          <p>
            The calculations, estimates, and data provided on this Site are intended strictly for general informational, educational, and planning purposes. They do not constitute guaranteed service levels or professional network engineering warranties.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>3. Calculation Limitations and Performance Disclaimer</h2>
        <div className={styles.prose}>
          <p>
            While our mathematical models use standardized digital conversion ratios (such as 8 bits per byte and established decimal/binary unit prefixes), actual real-world transfer times will routinely deviate from theoretical mathematical formulas.
          </p>
          <p>
            Factors that introduce real-world transfer variance include, but are not limited to:
          </p>
          <ul>
            <li>Remote server bandwidth throttling and concurrent connection limits.</li>
            <li>Transport layer protocol overheads (such as TCP handshakes, window scaling, packet loss, and retransmissions).</li>
            <li>Local network conditions, Wi-Fi channel congestion, router bufferbloat, and ISP peering bottlenecks.</li>
            <li>Storage write cache saturation (e.g., SLC cache exhaustion on QLC SSDs), disk fragmentation, and file-system metadata overheads.</li>
            <li>Transferring numerous small files (high random I/O latency) versus single continuous sequential files.</li>
          </ul>
          <p>
            DataRateKit makes no representations or warranties that your real-world data transfers will match the theoretical or 90% planning estimates calculated by our tools.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>4. Acceptable Use</h2>
        <div className={styles.prose}>
          <p>
            You agree to use DataRateKit only for lawful purposes. You must not attempt to disrupt the operation of the Site, launch automated denial-of-service attacks, scrape content at excessive request rates, or bypass technical infrastructure safeguards.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>5. Intellectual Property</h2>
        <div className={styles.prose}>
          <p>
            The design, layout, branding, logos, and custom software code comprising DataRateKit are protected by copyright and intellectual property laws. You may not reproduce, clone, or redistribute the Site&rsquo;s interface or source code without prior written consent.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>6. Third-Party Links and Advertising</h2>
        <div className={styles.prose}>
          <p>
            The Site may contain links to external third-party websites or display third-party advertisements served by networks such as Google AdSense. DataRateKit does not endorse, control, or assume responsibility for the content, privacy policies, or practices of any third-party websites or services.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>7. Modifications to the Service and Terms</h2>
        <div className={styles.prose}>
          <p>
            We reserve the right to modify, update, or discontinue any feature, calculator, or content on the Site at any time without notice. Continued use of the Site after revisions to these Terms constitutes acceptance of the modified Terms.
          </p>
          <p>
            Questions regarding these Terms can be directed to our team via our{' '}
            <Link href="/contact">Contact Page</Link> or by email at{' '}
            <a href="mailto:wogus5695@gmail.com">wogus5695@gmail.com</a>.
          </p>
        </div>
      </section>
    </main>
  );
}
