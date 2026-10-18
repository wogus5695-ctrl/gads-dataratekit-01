import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { UploadCalculator } from '@/components/calculator/UploadCalculator';
import {
  calculateTransferTime,
  convertSpeed,
  SpeedUnit,
} from '@/lib/transfer';
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

interface BenchmarkSpeed {
  speed: number;
  unit: SpeedUnit;
  label: string;
}

const UPLOAD_BENCHMARK_SPEEDS: BenchmarkSpeed[] = [
  { speed: 5, unit: 'Mbps', label: '5 Mbps' },
  { speed: 10, unit: 'Mbps', label: '10 Mbps' },
  { speed: 20, unit: 'Mbps', label: '20 Mbps' },
  { speed: 50, unit: 'Mbps', label: '50 Mbps' },
  { speed: 100, unit: 'Mbps', label: '100 Mbps' },
];

function getUploadBenchmarkRows() {
  return UPLOAD_BENCHMARK_SPEEDS.map((item) => {
    const timeRes = calculateTransferTime({
      fileSize: 100,
      fileSizeUnit: 'GB',
      speed: item.speed,
      speedUnit: item.unit,
      efficiencyPercent: 100,
    });
    const rateRes = convertSpeed(item.speed, item.unit, 'MB/s');
    return {
      label: item.label,
      mbRate: rateRes.success ? rateRes.data.formatted : '—',
      duration: timeRes.success ? timeRes.data.duration.formatted : '—',
    };
  });
}

export default function UploadCalculatorPage() {
  const benchmarkRows = getUploadBenchmarkRows();

  return (
    <main className={styles.pageContainer}>
      <header className={styles.headerSection}>
        <h1 className={styles.title}>Upload Time Calculator</h1>
        <p className={styles.description}>
          Calculate how long a file will take to upload based on its size and your upload speed.
        </p>
      </header>

      <UploadCalculator />

      {/* 1. How the upload time calculation works */}
      <section className={styles.contentSection} aria-labelledby="how-it-works-heading">
        <h2 id="how-it-works-heading" className={styles.supportingTitle}>
          How the upload time calculation works
        </h2>
        <div className={styles.prose}>
          <p>
            When transmitting data from your local device to a remote server, cloud storage bucket, or video hosting platform, upload duration is governed by your upstream connection rate:
          </p>
          <div>
            <div className={styles.formulaBox}>
              Upload time = File size in bits ÷ Upload speed in bits per second
            </div>
          </div>
          <p>
            Internet service providers measure bandwidth in bits per second (such as 20 Mbps or 50 Mbps), whereas operating systems, cloud drives, and cameras measure file sizes in bytes (such as 500 MB or 25 GB). Because 1 byte consists of exactly 8 bits, an upstream rate of 20 Mbps translates to a maximum theoretical transfer rate of 2.5 MB/s under ideal conditions.
          </p>
          <p>
            To convert directly between upstream connection speeds (Mbps) and file transfer rates (MB/s), you can use our{' '}
            <Link href="/mbps-to-mbs" className={styles.relatedLink}>
              Mbps to MB/s Converter
            </Link>
            .
          </p>
        </div>
      </section>

      {/* 2. Upload time examples (Benchmark Table + Worked Examples) */}
      <section className={styles.contentSection} aria-labelledby="examples-heading">
        <h2 id="examples-heading" className={styles.supportingTitle}>
          Upload time examples
        </h2>
        <div className={styles.prose}>
          <p>
            The reference table below illustrates theoretical upload durations for a 100 GB example file across several example upload rates. These are theoretical values calculated using the full entered upload rate, without reductions for protocol overhead, competing network traffic, or remote receiving constraints.
          </p>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.benchmarkTable} aria-label="100 GB upload time reference table">
            <thead>
              <tr>
                <th scope="col">Upload speed</th>
                <th scope="col">Equivalent rate</th>
                <th scope="col">Theoretical upload time (100 GB)</th>
              </tr>
            </thead>
            <tbody>
              {benchmarkRows.map((row) => (
                <tr key={row.label}>
                  <th scope="row" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {row.label}
                  </th>
                  <td>{row.mbRate}</td>
                  <td>{row.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.prose}>
          <h3 className={styles.subheading}>Worked upload scenarios</h3>

          <div className={styles.exampleBlock}>
            <div className={styles.exampleTitle}>Video or presentation upload (10 GB at 20 Mbps)</div>
            <div className={styles.exampleDesc}>
              A 10 GB file contains 80,000 megabits (10 × 1,000 × 8). At a sustained upstream rate of 20 Mbps, the theoretical upload duration is 4,000 seconds, which equals exactly 1 hour, 6 minutes, and 40 seconds under ideal theoretical conditions.
            </div>
          </div>

          <div className={styles.exampleBlock}>
            <div className={styles.exampleTitle}>Cloud backup archive (50 GB at 50 Mbps)</div>
            <div className={styles.exampleDesc}>
              A 50 GB dataset equals 400,000 megabits. Uploading over a 50 Mbps upstream link requires 8,000 seconds, which equals 2 hours, 13 minutes, and 20 seconds.
            </div>
          </div>

          <div className={styles.exampleBlock}>
            <div className={styles.exampleTitle}>Large repository transfer (100 GB at 100 Mbps)</div>
            <div className={styles.exampleDesc}>
              A 100 GB file equals 800,000 megabits. On an upstream connection sustaining 100 Mbps, theoretical transfer time is 8,000 seconds (2 hours, 13 minutes, and 20 seconds).
            </div>
          </div>
        </div>
      </section>

      {/* 3. Why actual uploads can take longer */}
      <section className={styles.contentSection} aria-labelledby="why-slower-heading">
        <h2 id="why-slower-heading" className={styles.supportingTitle}>
          Why actual uploads can take longer
        </h2>
        <div className={styles.prose}>
          <p>
            Theoretical calculations measure pure upstream bandwidth under perfect conditions. In practice, sending data to remote services involves several external factors that can extend actual completion times:
          </p>
          <ul className={styles.itemList}>
            <li>
              <strong>Remote service receiving limits:</strong> The destination cloud platform, video host, or remote server may impose connection caps, account rate limits, or processing queues.
            </li>
            <li>
              <strong>Wi-Fi signal quality and packet retransmissions:</strong> Upstream traffic is sensitive to wireless interference, distance from your router, and wall attenuation. When wireless packet loss occurs, unacknowledged packets must be retransmitted, lowering effective throughput.
            </li>
            <li>
              <strong>Shared upstream bandwidth:</strong> On asymmetric connections, upstream capacity may be lower than downstream capacity. If multiple devices on your local network run video conferences, stream live video, or perform cloud backups simultaneously, they share the available upstream capacity.
            </li>
            <li>
              <strong>Protocol and transport overhead:</strong> Protocol framing, retransmissions, encryption, application behavior, and other transport overhead can reduce application-level throughput depending on the transfer.
            </li>
            <li>
              <strong>Background synchronization:</strong> Automated cloud synchronization and backup software running in the background can use upstream bandwidth at the same time as the active upload.
            </li>
            <li>
              <strong>Local file reading and disk access:</strong> Uploading archives containing tens of thousands of small files can be limited by local disk read latency and operating system file handle management, rather than the network link alone.
            </li>
          </ul>
          <p>
            <strong>The 90% throughput setting:</strong> The optional 90% setting in this calculator models a scenario in which sustained throughput is 90% of your entered upload rate. It serves as a practical planning comparison to evaluate a lower-throughput case, rather than an empirical universal constant or guarantee.
          </p>
        </div>
      </section>

      {/* 4. How to choose the correct upload speed */}
      <section className={styles.contentSection} aria-labelledby="how-to-choose-heading">
        <h2 id="how-to-choose-heading" className={styles.supportingTitle}>
          How to choose the correct upload speed
        </h2>
        <div className={styles.prose}>
          <p>
            Entering the appropriate upstream rate is essential for reliable upload planning:
          </p>
          <ul className={styles.itemList}>
            <li>
              <strong>Account for asymmetric connections:</strong> Some broadband plans provide different upload and download rates, while others are symmetric. If your plan lists a separate upload rate, use that value for a theoretical plan-based estimate. For a measurement-based estimate, use an observed upload rate under relevant conditions.
            </li>
            <li>
              <strong>Use measured speed test upload values:</strong> When testing your connection with a speed test utility, record the separate &ldquo;Upload&rdquo; score. An upload test score is useful for measurement-based planning because it reflects conditions during that specific test, though it does not guarantee identical throughput to every remote destination.
            </li>
            <li>
              <strong>Avoid confusing download speed with upload speed:</strong> Some broadband offers emphasize download speed, so verify whether a separate upload rate is listed. Using a download figure for an upload calculation will produce an unrealistic estimate on asymmetric connections.
            </li>
            <li>
              <strong>Match your speed unit to your tool:</strong> Broadband plans and speed tests report rates in megabits per second (Mbps). If your backup software or browser displays progress in megabytes per second (MB/s), select <em>MB/s</em> in the speed unit dropdown.
            </li>
          </ul>
        </div>
      </section>

      {/* 5. Common upload mistakes */}
      <section className={styles.contentSection} aria-labelledby="common-mistakes-heading">
        <h2 id="common-mistakes-heading" className={styles.supportingTitle}>
          Common upload mistakes to avoid
        </h2>
        <div className={styles.prose}>
          <ul className={styles.itemList}>
            <li>
              <strong>Entering download speed instead of upload speed:</strong> On connections where downstream and upstream rates differ, entering your download speed (such as 300 Mbps on a plan with 20 Mbps upload) will severely underestimate transfer time.
            </li>
            <li>
              <strong>Confusing Mbps with MB/s:</strong> Megabits per second (Mbps) and megabytes per second (MB/s) differ by a factor of 8. A 20 Mbps upload connection delivers up to 2.5 MB/s, not 20 MB/s.
            </li>
            <li>
              <strong>Treating theoretical calculations as guaranteed finish times:</strong> Remote server ingestion rates, network congestion, and routing conditions can change during a long transfer.
            </li>
            <li>
              <strong>Overlooking background cloud sync activity:</strong> Automated desktop photo or file sync utilities can quietly saturate upstream bandwidth without displaying an active progress bar.
            </li>
            <li>
              <strong>Treating GB and GiB as identical:</strong> Decimal gigabytes (1 GB = 1,000,000,000 bytes) and binary gibibytes (1 GiB = 1,073,741,824 bytes) differ by approximately 7.4%. Use the unit explicitly reported by your source file manager.
            </li>
          </ul>
        </div>
      </section>

      {/* 6. Frequently asked questions */}
      <section className={styles.contentSection} aria-labelledby="faq-heading">
        <h2 id="faq-heading" className={styles.supportingTitle}>
          Frequently asked questions
        </h2>
        <div className={styles.faqList}>
          <div className={styles.faqItem}>
            <div className={styles.faqQuestion}>
              How long does 100 GB take to upload at 20 Mbps?
            </div>
            <div className={styles.faqAnswer}>
              Under theoretical conditions using the full entered upload rate, uploading a 100 GB file at 20 Mbps takes exactly 40,000 seconds, which equals 11 hours, 6 minutes, and 40 seconds. Using the calculator&apos;s optional 90% planning scenario, the same transfer would take approximately 12 hours, 20 minutes, and 44 seconds.
            </div>
          </div>

          <div className={styles.faqItem}>
            <div className={styles.faqQuestion}>
              Why is my upload speed lower than my download speed?
            </div>
            <div className={styles.faqAnswer}>
              Some access technologies and service plans are asymmetric, meaning upstream and downstream rates are provisioned differently. Other connections are symmetric and provide similar rates in both directions. Check the upload rate published for your plan or measure it under relevant conditions.
            </div>
          </div>

          <div className={styles.faqItem}>
            <div className={styles.faqQuestion}>
              Should I use my internet plan speed or a speed-test result?
            </div>
            <div className={styles.faqAnswer}>
              If your plan lists a separate upload rate, you can use that value for a theoretical plan-based calculation. Advertised or published plan rates may differ from the throughput observed during a specific upload and are not necessarily a sustained end-to-end rate to every destination. A speed test provides an observed upload rate under specific test conditions, which can serve as a helpful basis for measurement-based planning.
            </div>
          </div>

          <div className={styles.faqItem}>
            <div className={styles.faqQuestion}>
              Why is my cloud upload taking longer than the calculator estimate?
            </div>
            <div className={styles.faqAnswer}>
              Remote services may impose connection, account, processing, or receiving limits. In addition, local background synchronization and Wi-Fi interference can reduce the effective network upload rate. Furthermore, remote-side processing—such as antivirus scanning, file integrity verification, or media processing—may delay when a file becomes available after transfer, even if it does not reduce the network upload rate itself.
            </div>
          </div>

          <div className={styles.faqItem}>
            <div className={styles.faqQuestion}>
              What is the difference between Mbps and MB/s for uploads?
            </div>
            <div className={styles.faqAnswer}>
              Mbps (megabits per second) measures digital data transmission in bits, and internet service rates are often expressed in Mbps. MB/s (megabytes per second) measures data transfer in bytes, which transfer applications often display. Because 1 byte contains 8 bits, divide your upload speed in Mbps by 8 to find the equivalent MB/s (for example, 20 Mbps ÷ 8 = 2.5 MB/s).
            </div>
          </div>
        </div>
      </section>

      {/* 7. Related tools */}
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
          <Link href="/mbps-to-mbs" className={styles.relatedLink}>
            Mbps to MB/s Converter
          </Link>
        </nav>
      </section>
    </main>
  );
}
