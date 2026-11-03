import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getCanonicalUrl } from '@/config/site';
import styles from '../info.module.css';

const title = 'About DataRateKit';
const description =
  'Learn how DataRateKit builds practical calculators for data transfer, bandwidth, storage, video bitrate, unit conversion, and internet data usage.';
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
        <div className={styles.lastUpdated}>Precision Tools for Digital Data Transfers & Network Planning</div>
      </header>

      {/* 1. Identity */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>What is DataRateKit?</h2>
        <div className={styles.prose}>
          <p>
            DataRateKit is an open, browser-based suite of calculation utilities engineered for digital data transfers, network bandwidth planning, storage interface bottlenecks, and data volume estimation.
          </p>
          <p>
            The platform provides transparent mathematical modeling for scenarios ranging from home broadband downloads and cloud uploads to multi-gigabit storage transfers and video bitrate planning. All utilities execute locally in the browser, requiring no user accounts, browser extensions, or private data registration.
          </p>
        </div>
      </section>

      {/* 2. Why DataRateKit Exists */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Why DataRateKit Exists</h2>
        <div className={styles.prose}>
          <p>
            Digital data transfers rarely match theoretical formulas in everyday practice. Users routinely encounter practical hurdles:
          </p>
          <ul>
            <li>
              <strong>Unit confusion:</strong> Internet service providers quote speeds in megabits per second (Mbps), while operating systems and download clients display transfer progress in megabytes per second (MB/s).
            </li>
            <li>
              <strong>Nominal line vs. effective throughput:</strong> A headline broadband speed does not account for transport protocol framing, Wi-Fi variance, or packet retransmission overhead.
            </li>
            <li>
              <strong>Remote delivery constraints:</strong> High-speed connections cannot accelerate transfers when remote content delivery networks (CDNs) or origin mirrors cap outbound throughput per connection.
            </li>
            <li>
              <strong>Asymmetric link saturation:</strong> Uncontrolled file uploads saturate limited upstream bandwidth, degrading latency and responsiveness for concurrent household or office traffic.
            </li>
            <li>
              <strong>Storage hardware bottlenecks:</strong> Fast NVMe drives or multi-gigabit local networks are frequently constrained by the slowest link in the transfer path, such as mechanical drive write speeds.
            </li>
            <li>
              <strong>Capacity planning:</strong> Video creators and mobile users need reliable methods to forecast recording durations and manage monthly ISP data caps before encountering overage fees.
            </li>
          </ul>
          <p>
            DataRateKit was built to make these transfer constraints, protocol behaviors, and bottleneck relationships visible and actionable rather than presenting an oversimplified single number.
          </p>
        </div>
      </section>

      {/* 3. Current Toolkit */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Current Utility Suite</h2>
        <div className={styles.prose}>
          <p>
            DataRateKit currently operates six independent calculation utilities, each engineered around a distinct transfer domain:
          </p>
          <ul>
            <li>
              <strong><Link href="/">Download Time Calculator</Link>:</strong> Plans downstream internet transfers by modeling nominal connection speed, available bandwidth share, and optional remote server or CDN delivery caps. It identifies whether your connection or the remote host limits throughput, contrasts theoretical line rates with conservative planning assumptions, and calculates required connection speeds for deadlines.
            </li>
            <li>
              <strong><Link href="/upload-time-calculator">Upload Time Calculator</Link>:</strong> Tailored for upstream bandwidth planning on asymmetric connections. It evaluates upload durations while incorporating user-defined reserved bandwidth to protect interactive traffic, accounts for per-file batch setup overhead, and calculates maximum uploadable data volumes within backup windows.
            </li>
            <li>
              <strong><Link href="/file-transfer-time-calculator">File Transfer Time Calculator</Link>:</strong> Evaluates end-to-end data transfers across a three-stage hardware pipeline: source drive read, interface or network bus, and destination drive write. It diagnoses the active limiting stage, quantifies unused headroom across non-bottleneck components, and factors in small-file metadata penalties.
            </li>
            <li>
              <strong><Link href="/mbps-to-mbs">Mbps to MB/s Converter</Link>:</strong> A bidirectional transfer rate converter that clarifies the fundamental 8-to-1 ratio between telecommunications bits and filesystem bytes. It provides instant conversions across standard decimal rates and distinguishes between decimal SI megabytes and binary IEC mebibytes.
            </li>
            <li>
              <strong><Link href="/video-file-size-calculator">Video File Size Calculator</Link>:</strong> Estimates digital video and audio storage volumes from runtime and bitrate parameters across three modes: total file size calculation, required video bitrate estimation for target storage limits, and maximum recording duration forecasting for memory cards.
            </li>
            <li>
              <strong><Link href="/data-usage-calculator">Internet Data Usage Calculator</Link>:</strong> Aggregates daily and monthly data consumption across multiple simultaneous online activities and active household devices. It tracks plan utilization against ISP monthly data caps, calculates remaining safety buffers, and incorporates officially verified provider streaming benchmarks.
            </li>
          </ul>
        </div>
      </section>

      {/* 4. Calculation Principles */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Calculation Principles & Methodology</h2>
        <div className={styles.prose}>
          <p>
            Our calculation engines adhere to strict mathematical principles to maintain consistency and clarity across all tools:
          </p>
          <ul>
            <li>
              <strong>Exact Unit Mathematics:</strong> Exactly 8 bits constitute 1 byte. Decimal SI units (KB, MB, GB, TB) strictly employ powers of 10 ($1,000$ multiplier), while binary IEC units (KiB, MiB, GiB, TiB) strictly employ powers of 2 ($1,024$ multiplier).
            </li>
            <li>
              <strong>Nominal vs. Planning Throughput:</strong> We distinguish theoretical line ceilings (100% nominal connection speed) from realistic planning estimates. Adjustable assumptions—such as an optional 90% planning efficiency—model real-world protocol overhead without masquerading as empirical lab measurements.
            </li>
            <li>
              <strong>Multi-Stage Bottleneck Analysis:</strong> End-to-end transfer throughput is fundamentally governed by the slowest link in the active transmission chain, whether that bottleneck resides in local storage, interface cabling, or remote host delivery policies.
            </li>
            <li>
              <strong>Deterministic Results:</strong> Calculations are strictly deterministic outcomes of user-supplied inputs and selected planning assumptions, providing predictable baselines for technical planning.
            </li>
          </ul>
        </div>
      </section>

      {/* 5. Transparency & Limitations */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Transparency & Limitations</h2>
        <div className={styles.prose}>
          <p>
            To avoid misunderstandings regarding calculator capabilities, we explicitly separate what DataRateKit does from what it does not do:
          </p>
          <div className={styles.callout}>
            <strong>What DataRateKit Does:</strong>
            <ul>
              <li>Calculates mathematical durations, rates, and storage volumes from user-provided inputs.</li>
              <li>Models multi-stage bottleneck and bandwidth-sharing relationships.</li>
              <li>Enforces rigorous, explicit unit conversion standards.</li>
              <li>Enables comparison between theoretical limits and conservative planning scenarios.</li>
            </ul>
          </div>
          <div className={styles.callout}>
            <strong>What DataRateKit Does Not Do:</strong>
            <ul>
              <li>Does not run automated speed tests or actively probe user network connections.</li>
              <li>Does not monitor live internet traffic, route congestion, or remote CDN server health.</li>
              <li>Does not benchmark physical solid-state drives or hard disk hardware directly.</li>
              <li>Does not warrant ISP service levels or guarantee actual real-world transfer durations.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 6. Privacy & Architecture */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Privacy & Client-Side Architecture</h2>
        <div className={styles.prose}>
          <p>
            Calculator computations are performed locally within your browser using client-side JavaScript. DataRateKit requires no user account registration and does not maintain an application database of your calculation inputs, file sizes, or transfer results.
          </p>
          <p>
            When utilizing state-sharing features, your selected parameters are serialized directly into URL query strings. If you choose to bookmark or share a calculation URL, those parameters form part of the requested web address. For complete details on hosting infrastructure and technical log data, please review our <Link href="/privacy">Privacy Policy</Link>.
          </p>
        </div>
      </section>

      {/* 7. Feedback & Corrections */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Feedback & Error Reporting</h2>
        <div className={styles.prose}>
          <p>
            We prioritize mathematical accuracy and technical clarity. If you observe a calculation discrepancy, unit conversion error, or ambiguous planning assumption in any of our tools, we encourage you to submit technical feedback through our <Link href="/contact">Contact Page</Link>.
          </p>
        </div>
      </section>

      {/* 8. Platform Purpose */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Platform Purpose</h2>
        <div className={styles.prose}>
          <p>
            DataRateKit is maintained as a focused technical utility platform dedicated to making digital data transfers, bandwidth allocation, and storage capacities understandable and predictable. Review our <Link href="/terms">Terms of Use</Link> for information on acceptable use and liability terms.
          </p>
        </div>
      </section>
    </main>
  );
}
