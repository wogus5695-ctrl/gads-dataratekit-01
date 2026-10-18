import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { DownloadCalculator } from '@/components/calculator/DownloadCalculator';
import {
  calculateTransferTime,
  convertSpeed,
  SpeedUnit,
} from '@/lib/transfer';
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

interface BenchmarkSpeed {
  speed: number;
  unit: SpeedUnit;
  label: string;
}

const BENCHMARK_SPEEDS: BenchmarkSpeed[] = [
  { speed: 50, unit: 'Mbps', label: '50 Mbps' },
  { speed: 100, unit: 'Mbps', label: '100 Mbps' },
  { speed: 300, unit: 'Mbps', label: '300 Mbps' },
  { speed: 500, unit: 'Mbps', label: '500 Mbps' },
  { speed: 1, unit: 'Gbps', label: '1 Gbps' },
];

function getBenchmarkRows() {
  return BENCHMARK_SPEEDS.map((item) => {
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

export default function DownloadCalculatorPage() {
  const benchmarkRows = getBenchmarkRows();

  return (
    <main className={styles.pageContainer}>
      <header className={styles.headerSection}>
        <h1 className={styles.title}>Download Time Calculator</h1>
        <p className={styles.description}>
          Calculate how long a file will take to download based on its size and your connection speed.
        </p>
      </header>

      <DownloadCalculator />

      {/* 1. How the download time calculation works */}
      <section className={styles.contentSection} aria-labelledby="how-it-works-heading">
        <h2 id="how-it-works-heading" className={styles.supportingTitle}>
          How the download time calculation works
        </h2>
        <div className={styles.prose}>
          <p>
            The mathematical formula to determine theoretical download duration is straightforward:
          </p>
          <div>
            <div className={styles.formulaBox}>
              Download time = File size in bits ÷ Download speed in bits per second
            </div>
          </div>
          <p>
            Internet service providers (ISPs) advertise connection speeds in bits per second (such as 100 Mbps or 1 Gbps), whereas operating systems and download utilities report file sizes in bytes (such as 100 MB or 50 GB). Because exactly 8 bits make up 1 byte, a 100 Mbps broadband connection can transfer up to 12.5 MB/s under ideal conditions.
          </p>
          <p>
            If you need to convert directly between broadband speeds (Mbps) and file download rates (MB/s), you can use our dedicated{' '}
            <Link href="/mbps-to-mbs" className={styles.relatedLink}>
              Mbps to MB/s Converter
            </Link>
            .
          </p>
        </div>
      </section>

      {/* 2. Download time examples (Benchmark Table + Worked Examples) */}
      <section className={styles.contentSection} aria-labelledby="examples-heading">
        <h2 id="examples-heading" className={styles.supportingTitle}>
          Download time examples
        </h2>
        <div className={styles.prose}>
          <p>
            The reference table below illustrates theoretical download times for a standard 100 GB file across common broadband and fiber connection speeds. These values assume 100% link efficiency under ideal network conditions.
          </p>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.benchmarkTable} aria-label="100 GB download time reference table">
            <thead>
              <tr>
                <th scope="col">Connection speed</th>
                <th scope="col">Equivalent rate</th>
                <th scope="col">Theoretical download time (100 GB)</th>
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
          <h3 className={styles.subheading}>Worked download scenarios</h3>

          <div className={styles.exampleBlock}>
            <div className={styles.exampleTitle}>Medium file download (10 GB at 100 Mbps)</div>
            <div className={styles.exampleDesc}>
              A 10 GB file equals 80,000 megabits (10 × 1,000 × 8). Dividing 80,000 megabits by a 100 Mbps connection speed yields 800 seconds, which equals exactly 13 minutes and 20 seconds under ideal theoretical conditions.
            </div>
          </div>

          <div className={styles.exampleBlock}>
            <div className={styles.exampleTitle}>Large game or digital media (50 GB at 500 Mbps)</div>
            <div className={styles.exampleDesc}>
              A 50 GB file equals 400,000 megabits. Dividing by 500 Mbps yields 800 seconds (13 minutes and 20 seconds).
            </div>
          </div>

          <div className={styles.exampleBlock}>
            <div className={styles.exampleTitle}>High-capacity transfer (100 GB at 1 Gbps)</div>
            <div className={styles.exampleDesc}>
              A 100 GB file equals 800,000 megabits. On a full 1 Gbps (1,000 Mbps) fiber connection, the theoretical transfer time is 800 seconds (13 minutes and 20 seconds).
            </div>
          </div>
        </div>
      </section>

      {/* 3. Why actual downloads can take longer */}
      <section className={styles.contentSection} aria-labelledby="why-slower-heading">
        <h2 id="why-slower-heading" className={styles.supportingTitle}>
          Why actual downloads can take longer
        </h2>
        <div className={styles.prose}>
          <p>
            Theoretical calculations measure pure link bandwidth under perfect conditions. In everyday use, several external factors can cause your actual download duration to be longer than the mathematical minimum:
          </p>
          <ul className={styles.itemList}>
            <li>
              <strong>Remote server and CDN throughput limits:</strong> The remote server, hosting provider, or content delivery network (CDN) delivering your file may cap maximum download speeds per connection or experience server-side traffic congestion during peak hours.
            </li>
            <li>
              <strong>Wi-Fi signal degradation and interference:</strong> Wireless connections are susceptible to radio frequency interference, physical obstacles like walls, and distance from the router, which can trigger packet retries and reduce sustained throughput compared to wired Ethernet.
            </li>
            <li>
              <strong>Shared local network traffic:</strong> Other active devices on your home or office local network—such as smart TVs streaming video, background cloud syncs, or gaming consoles—consume portions of your total available downstream bandwidth.
            </li>
            <li>
              <strong>Protocol and packet overhead:</strong> TCP/IP transport framing, SSL/TLS cryptographic handshakes, and transmission acknowledgments naturally require a small percentage of gross connection capacity.
            </li>
            <li>
              <strong>Storage and disk write bottlenecks:</strong> On multi-gigabit connections, local disk write speeds (especially with mechanical hard drives or throttled SSD cache), live file decryption, and antivirus real-time scanning can become the pacing factor rather than the network link itself.
            </li>
          </ul>
          <p>
            <strong>The 90% throughput assumption:</strong> The 90% setting available in this calculator is designed as a practical planning assumption to account for everyday protocol overhead and minor connection variations. It is an optional planning tool rather than an empirical guarantee, as real-world throughput fluctuates depending on your setup.
          </p>
        </div>
      </section>

      {/* 4. How to use your result */}
      <section className={styles.contentSection} aria-labelledby="how-to-use-heading">
        <h2 id="how-to-use-heading" className={styles.supportingTitle}>
          How to use your result
        </h2>
        <div className={styles.prose}>
          <p>
            To obtain the most accurate estimate for your situation, follow these practical steps when entering your data:
          </p>
          <ul className={styles.itemList}>
            <li>
              <strong>Match your speed unit to your source:</strong> If you are entering your advertised plan from your internet service provider, use <em>Mbps</em> or <em>Gbps</em>. If your web browser, torrent client, or game launcher displays transfer rates in megabytes per second, select <em>MB/s</em>.
            </li>
            <li>
              <strong>Use measured speeds instead of advertised maximums:</strong> Running a quick internet speed test provides your actual delivered downstream rate, which often differs from the nominal package speed stated on your bill.
            </li>
            <li>
              <strong>Verify your file size units:</strong> Check whether your operating system or file manager reports size in standard decimal gigabytes (1 GB = 1,000,000,000 bytes) or binary gibibytes (1 GiB = 1,073,741,824 bytes). For binary values, select <em>GiB</em> in the unit dropdown.
            </li>
          </ul>
        </div>
      </section>

      {/* 5. Common mistakes to avoid */}
      <section className={styles.contentSection} aria-labelledby="common-mistakes-heading">
        <h2 id="common-mistakes-heading" className={styles.supportingTitle}>
          Common mistakes to avoid
        </h2>
        <div className={styles.prose}>
          <ul className={styles.itemList}>
            <li>
              <strong>Confusing Mbps with MB/s:</strong> Megabits per second (Mbps with lowercase &ldquo;b&rdquo;) and megabytes per second (MB/s with uppercase &ldquo;B&rdquo;) differ by a factor of 8. A 100 Mbps connection transfers a maximum of 12.5 MB/s, not 100 MB/s.
            </li>
            <li>
              <strong>Assuming 1 Gbps equals 1 GB/s:</strong> A 1 gigabit connection delivers 1,000 megabits per second, which equals 125 MB/s. Downloading a 100 GB file takes roughly 13 minutes and 20 seconds, rather than 100 seconds.
            </li>
            <li>
              <strong>Treating theoretical calculations as guaranteed finish times:</strong> Live network conditions, routing hops, and server load fluctuate dynamically throughout an active transfer.
            </li>
            <li>
              <strong>Treating GB and GiB as identical:</strong> Operating systems and storage manufacturers sometimes use binary GiB (1,073,741,824 bytes) rather than decimal GB (1,000,000,000 bytes), creating an approximately 7.4% difference in total required bits.
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
              How long does 100 GB take to download at 100 Mbps?
            </div>
            <div className={styles.faqAnswer}>
              Under ideal theoretical conditions with 100% link efficiency, downloading a 100 GB file at 100 Mbps takes exactly 8,000 seconds, which equals 2 hours, 13 minutes, and 20 seconds. If factoring in typical real-world overhead with a 90% throughput assumption, it takes approximately 2 hours, 28 minutes, and 9 seconds.
            </div>
          </div>

          <div className={styles.faqItem}>
            <div className={styles.faqQuestion}>
              How long does 100 GB take at 1 Gbps?
            </div>
            <div className={styles.faqAnswer}>
              On a full 1 Gbps (1,000 Mbps) gigabit connection at theoretical maximum throughput, a 100 GB file takes exactly 800 seconds, which equals 13 minutes and 20 seconds.
            </div>
          </div>

          <div className={styles.faqItem}>
            <div className={styles.faqQuestion}>
              Why is my real download slower than the calculator result?
            </div>
            <div className={styles.faqAnswer}>
              Real-world transfer rates can be constrained by remote server rate limits, Wi-Fi interference, concurrent network usage by other household devices, TCP/IP packet overhead, and local storage drive write bottlenecks.
            </div>
          </div>

          <div className={styles.faqItem}>
            <div className={styles.faqQuestion}>
              What is the difference between Mbps and MB/s?
            </div>
            <div className={styles.faqAnswer}>
              Mbps (megabits per second) measures digital data transmission speed in bits, which is standard for internet service providers. MB/s (megabytes per second) measures data transfer in bytes, commonly used by web browsers and operating systems. Because 1 byte contains 8 bits, divide your Mbps rate by 8 to find the equivalent MB/s.
            </div>
          </div>

          <div className={styles.faqItem}>
            <div className={styles.faqQuestion}>
              Should I use GB or GiB for file size?
            </div>
            <div className={styles.faqAnswer}>
              Use GB (decimal, 1,000,000,000 bytes) for most consumer files, game downloads, and general broadband estimates. If your operating system, torrent client, or file manager explicitly reports file sizes using binary IEC prefixes (GiB, 1,073,741,824 bytes), choose GiB in the calculator dropdown for precise mathematical conversion.
            </div>
          </div>
        </div>
      </section>

      {/* 7. Related tools */}
      <section className={styles.contentSection} aria-labelledby="related-tools-heading">
        <nav className={styles.relatedTools} aria-label="Related tools">
          <span id="related-tools-heading">Need other calculations or unit conversions?</span>
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
