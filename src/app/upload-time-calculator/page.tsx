import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { UploadCalculator } from '@/components/calculator/UploadCalculator';
import {
  calculateUploadTime,
  calculateUploadCapacity,
  SpeedUnit,
} from '@/lib/upload';
import { getCanonicalUrl } from '@/config/site';
import styles from '../page.module.css';

const title = 'Free Upload Time Calculator — Speed & Duration';
const description =
  'Wondering how long your upload will take? Enter file size and upload speed to estimate the time needed for videos, backups, and large file transfers.';
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

interface UpstreamTier {
  speed: number;
  unit: SpeedUnit;
  label: string;
  context: string;
}

const UPSTREAM_BENCHMARK_TIERS: UpstreamTier[] = [
  { speed: 5, unit: 'Mbps', label: '5 Mbps', context: 'Basic DSL / Mobile Hotspot' },
  { speed: 10, unit: 'Mbps', label: '10 Mbps', context: 'Standard Cable Broadband' },
  { speed: 20, unit: 'Mbps', label: '20 Mbps', context: 'Fast Cable / Mid-tier' },
  { speed: 50, unit: 'Mbps', label: '50 Mbps', context: 'High-speed Cable / Entry Fiber' },
  { speed: 100, unit: 'Mbps', label: '100 Mbps', context: 'Symmetric Gigabit / Fiber Tier' },
];

function getUploadPlanningBenchmarkRows() {
  return UPSTREAM_BENCHMARK_TIERS.map((tier) => {
    // 10 GB file at 100% throughput factor, 0% reserve (Baseline)
    const fullRes = calculateUploadTime({
      fileSize: 10,
      fileSizeUnit: 'GB',
      speed: tier.speed,
      speedUnit: tier.unit,
      throughputFactorPercent: 100,
      reservedBandwidthPercent: 0,
    });

    // 10 GB file with 20% reserved (Example planning scenario)
    const reserveRes = calculateUploadTime({
      fileSize: 10,
      fileSizeUnit: 'GB',
      speed: tier.speed,
      speedUnit: tier.unit,
      throughputFactorPercent: 100,
      reservedBandwidthPercent: 20,
    });

    // 8-hour overnight window capacity at 100% throughput factor
    const capRes = calculateUploadCapacity({
      speed: tier.speed,
      speedUnit: tier.unit,
      windowDurationSeconds: 8 * 3600,
      targetSizeUnit: 'GB',
      throughputFactorPercent: 100,
      reservedBandwidthPercent: 0,
    });

    return {
      label: tier.label,
      context: tier.context,
      time10GB: fullRes.success ? fullRes.data.formattedDurationShort : '—',
      time10GBReserved: reserveRes.success ? reserveRes.data.formattedDurationShort : '—',
      cap8Hr: capRes.success ? capRes.data.maximumPayloadFormatted : '—',
    };
  });
}

export default function UploadCalculatorPage() {
  const benchmarkRows = getUploadPlanningBenchmarkRows();

  return (
    <main className={styles.pageContainer}>
      <header className={styles.headerSection}>
        <h1 className={styles.title}>Upload Time Calculator</h1>
        <p className={styles.description}>
          Plan upstream file transfers with precision. Calculate realistic upload durations, find the minimum connection speed needed for deadlines, or budget how much data can upload within an overnight backup window.
        </p>
      </header>

      {/* Main Interactive Upload Calculator Component */}
      <UploadCalculator />

      {/* 1. Planning Around Upstream Bandwidth */}
      <section className={styles.contentSection} aria-labelledby="upstream-planning-heading">
        <h2 id="upstream-planning-heading" className={styles.supportingTitle}>
          Planning Around Upstream Bandwidth
        </h2>
        <div className={styles.prose}>
          <p>
            Unlike downstream connections, upstream bandwidth is frequently the most constrained link in consumer and small office networks. Most residential cable and DSL plans are deliberately asymmetric, providing 100 Mbps or 300 Mbps downstream but only 10 Mbps to 20 Mbps upstream.
          </p>
          <p>
            When an upload consumes all available upstream capacity, other devices sharing the connection may experience increased latency or stalled downloads, as downstream TCP packets require reverse acknowledgment signals (TCP ACKs). To help model these situations, this calculator lets you define an optional planning throughput factor and unallocated bandwidth reserve:
          </p>
          <div>
            <div className={styles.formulaBox}>
              Available Upstream Rate = Entered Rate × Planning Throughput Factor × (1 − Reserved Bandwidth %)
            </div>
          </div>
          <div>
            <div className={styles.formulaBox}>
              Total Upload Time = (Data Size in Bits ÷ Available Upstream Rate) + (File Count × Estimated Per-File Setup Overhead)
            </div>
          </div>
        </div>
      </section>

      {/* 2. Upstream Throughput and Window Benchmark */}
      <section className={styles.contentSection} aria-labelledby="benchmark-heading">
        <h2 id="benchmark-heading" className={styles.supportingTitle}>
          Upstream Throughput &amp; Window Benchmarks
        </h2>
        <div className={styles.prose}>
          <p>
            The table below illustrates theoretical upload durations and window capacities across standard upstream connection tiers. The baseline reflects the full entered rate (100% throughput factor, 0% reserve), while the second column provides an example planning scenario with 20% bandwidth unallocated for other network tasks:
          </p>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.benchmarkTable}>
            <thead>
              <tr>
                <th scope="col">Upstream Tier</th>
                <th scope="col">Typical Connection</th>
                <th scope="col">10 GB (Full Rate Baseline)</th>
                <th scope="col">10 GB (Example: 20% Reserved)</th>
                <th scope="col">8-Hour Window Capacity</th>
              </tr>
            </thead>
            <tbody>
              {benchmarkRows.map((row) => (
                <tr key={row.label}>
                  <td className={styles.speedCell}>{row.label}</td>
                  <td>{row.context}</td>
                  <td>{row.time10GB}</td>
                  <td>{row.time10GBReserved}</td>
                  <td><strong>{row.cap8Hr}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.prose}>
          <p className={styles.benchmarkFootnote}>
            * Projections are mathematical calculations from the entered rates. 10 GB is calculated as 10,000,000,000 bytes. The 20% reserved column represents an illustrative planning assumption, not a technical recommendation. Actual throughput can vary depending on server routing, protocol framing, and local Wi-Fi stability.
          </p>
        </div>
      </section>

      {/* 3. Can Your Upload Finish Inside Your Available Window? */}
      <section className={styles.contentSection} aria-labelledby="upload-window-heading">
        <h2 id="upload-window-heading" className={styles.supportingTitle}>
          Can the Upload Finish Inside Your Available Window?
        </h2>
        <div className={styles.prose}>
          <p>
            Upload planning often centers on fixed operational timeframes, such as delivering client media files before a deadline or scheduling off-peak server synchronization.
          </p>
          <ul className={styles.itemList}>
            <li>
              <strong>Required Upload Rate (Mode B):</strong> If a 25 GB file must be delivered within a 2-hour window, the calculator determines the nominal uplink speed necessary under your chosen planning assumptions (for example, at 100% throughput factor and 0% reserve, a 25 GB payload requires at least 27.78 Mbps).
            </li>
            <li>
              <strong>Estimated Uploadable Data (Mode C):</strong> If you have an 8-hour overnight maintenance window on a 20 Mbps connection, the calculator computes the total volume transferable within that time frame (up to 72 GB at full rate), helping you determine whether large disk images must be split across multiple sessions.
            </li>
          </ul>
        </div>
      </section>

      {/* 4. Reserved Bandwidth and Concurrent Traffic */}
      <section className={styles.contentSection} aria-labelledby="traffic-control-heading">
        <h2 id="traffic-control-heading" className={styles.supportingTitle}>
          Reserved Bandwidth and Concurrent Traffic
        </h2>
        <div className={styles.prose}>
          <p>
            When large uploads occur while other users or background tasks share the same uplink, devoting the entire pipeline to a single transfer can crowd out interactive applications.
          </p>
          <ul className={styles.itemList}>
            <li>
              <strong>Concurrent Network Sharing:</strong> Video conferencing, voice calls, and standard web browsing require reliable upstream headroom. In addition, download streams require upstream bandwidth to return TCP acknowledgment packets.
            </li>
            <li>
              <strong>Planning Assumptions vs. Real-Time Throttling:</strong> The Reserved Bandwidth input in this calculator is a mathematical planning exclusion. It does not configure router QoS rules or enforce network limits; instead, it models how much longer an upload takes when you assume a portion of the pipe is occupied by other tasks.
            </li>
            <li>
              <strong>Evaluating Trade-offs:</strong> On a 20 Mbps line, reserving 20% reduces the rate used for the upload calculation to 16 Mbps, increasing a 10 GB upload time from 1 hour 6 minutes to 1 hour 23 minutes while reflecting unallocated bandwidth for the rest of the network.
            </li>
          </ul>
        </div>
      </section>

      {/* 5. Batch Uploads and Per-File Planning Overhead */}
      <section className={styles.contentSection} aria-labelledby="batch-overhead-heading">
        <h2 id="batch-overhead-heading" className={styles.supportingTitle}>
          Batch Uploads and Per-File Planning Overhead
        </h2>
        <div className={styles.prose}>
          <p>
            Depending on client software, transfer protocols, and remote server architectures, transferring a large batch of small files can take longer than sending a single archive of identical total volume.
          </p>
          <p>
            Client applications may perform individual directory lookups, request authentications, or multipart initialization for each item. When client or server configurations do not support persistent connection pooling, cumulative setup latency can be noticeable across hundreds or thousands of files.
          </p>
          <p>
            The Estimated Per-File Setup Overhead field provides an optional planning input so you can incorporate an assumed or measured per-file delay into your overall duration estimate.
          </p>
        </div>
      </section>

      {/* 6. Practical Upload Planning Scenarios */}
      <section className={styles.contentSection} aria-labelledby="scenarios-heading">
        <h2 id="scenarios-heading" className={styles.supportingTitle}>
          Practical Upload Planning Scenarios
        </h2>
        <div className={styles.prose}>
          <div className={styles.exampleCard}>
            <div className={styles.exampleTitle}>Scenario A: 20 GB Video Master at 20 Mbps Upstream</div>
            <p className={styles.exampleText}>
              Delivering a 20 GB project file at a full 20 Mbps rate (100% throughput factor, 0% reserve) calculates to exactly <strong>2 hours 13 minutes 20 seconds</strong>. If you model an example scenario reserving 20% for other office tasks (16 Mbps effective), estimated duration becomes <strong>2 hours 46 minutes 40 seconds</strong>.
            </p>
          </div>

          <div className={styles.exampleCard}>
            <div className={styles.exampleTitle}>Scenario B: 500 GB System Backup in an 8-Hour Window</div>
            <p className={styles.exampleText}>
              Planning an off-peak backup across an 8-hour window on a 50 Mbps line yields an estimated maximum capacity of <strong>180 GB</strong>. To complete all 500 GB inside that single 8-hour window, the calculator indicates a required nominal uplink rate of at least <strong>138.89 Mbps</strong>.
            </p>
          </div>

          <div className={styles.exampleCard}>
            <div className={styles.exampleTitle}>Scenario C: 500 RAW Photos with Assumed Setup Latency</div>
            <p className={styles.exampleText}>
              Uploading 500 photo files totaling 15 GB over a 20 Mbps connection requires 1 hour 40 minutes of raw payload transfer. If you model an assumed per-file setup overhead of 1.5 seconds, the 750 seconds (12 minutes 30 seconds) of cumulative latency brings the total estimated duration to <strong>1 hour 52 minutes 30 seconds</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Frequently Asked Questions */}
      <section className={styles.contentSection} aria-labelledby="faq-heading">
        <h2 id="faq-heading" className={styles.supportingTitle}>
          Frequently Asked Questions
        </h2>
        <div className={styles.faqList}>
          <div className={styles.faqItem}>
            <div className={styles.faqQuestion}>
              Why is my upload speed so much lower than my download speed?
            </div>
            <div className={styles.faqAnswer}>
              Most residential internet technologies (such as DOCSIS cable or ADSL) allocate the majority of radio frequency spectrum to downstream data. Because general consumer activity historically involved downloading far more content than sending, service providers configured connections asymmetrically unless you subscribe to symmetric fiber.
            </div>
          </div>

          <div className={styles.faqItem}>
            <div className={styles.faqQuestion}>
              How much upload bandwidth should I reserve for other traffic?
            </div>
            <div className={styles.faqAnswer}>
              There is no universal recommendation because appropriate headroom depends on household size, active applications, and overall line capacity. Testing different reserve percentages (such as 10% to 30%) in the calculator allows you to see how much upload time increases when keeping capacity unallocated for concurrent network tasks.
            </div>
          </div>

          <div className={styles.faqItem}>
            <div className={styles.faqQuestion}>
              Why can many small files take longer to upload than a single large file?
            </div>
            <div className={styles.faqAnswer}>
              Depending on the transfer software and server configuration, each individual file may require independent metadata exchanges, request authorizations, and filesystem operations. If a client does not pipeline requests or reuse connections, cumulative per-file overhead can extend total transfer time beyond the pure byte transfer duration.
            </div>
          </div>

          <div className={styles.faqItem}>
            <div className={styles.faqQuestion}>
              How can I estimate if a cloud backup will finish overnight?
            </div>
            <div className={styles.faqAnswer}>
              Select Mode C (Upload Window Capacity) and enter your available upstream rate alongside your target window duration (such as 8 hours). The calculator projects the total gigabytes transferable under your specified planning assumptions before the window closes.
            </div>
          </div>
        </div>
      </section>

      {/* 7.5 Common Upload Calculations */}
      <section className={styles.contentSection} aria-labelledby="common-uploads-heading">
        <h2 id="common-uploads-heading" className={styles.supportingTitle}>
          Common Upload Time Calculations
        </h2>
        <div className={styles.prose}>
          <p>
            Review detailed upstream estimates across residential and commercial upload speeds (5 Mbps to 1 Gbps) for common file sizes:
          </p>
        </div>
        <nav className={styles.relatedTools} aria-label="Common upload calculations">
          <Link href="/upload-time/10gb" className={styles.relatedLink}>
            10 GB Upload Time
          </Link>
          <span style={{ color: 'var(--border-strong)', margin: '0 0.5rem' }}>·</span>
          <Link href="/upload-time/50gb" className={styles.relatedLink}>
            50 GB Upload Time
          </Link>
          <span style={{ color: 'var(--border-strong)', margin: '0 0.5rem' }}>·</span>
          <Link href="/upload-time/100gb" className={styles.relatedLink}>
            100 GB Upload Time
          </Link>
          <span style={{ color: 'var(--border-strong)', margin: '0 0.5rem' }}>·</span>
          <Link href="/upload-time/1tb" className={styles.relatedLink}>
            1 TB Upload Time
          </Link>
        </nav>
      </section>

      {/* 8. Related Tools Navigation */}
      <section className={styles.contentSection} aria-labelledby="related-tools-heading">
        <nav className={styles.relatedTools} aria-label="Related tools">
          <span id="related-tools-heading">Need other calculations or unit conversions?</span>
          <Link href="/" className={styles.relatedLink}>
            Download Time Calculator
          </Link>
          <span style={{ color: 'var(--border-strong)', margin: '0 0.5rem' }}>·</span>
          <Link href="/file-transfer-time-calculator" className={styles.relatedLink}>
            File Transfer Time Calculator
          </Link>
          <span style={{ color: 'var(--border-strong)', margin: '0 0.5rem' }}>·</span>
          <Link href="/data-usage-calculator" className={styles.relatedLink}>
            Data Usage Calculator
          </Link>
          <span style={{ color: 'var(--border-strong)', margin: '0 0.5rem' }}>·</span>
          <Link href="/video-file-size-calculator" className={styles.relatedLink}>
            Video File Size Calculator
          </Link>
        </nav>
      </section>
    </main>
  );
}
