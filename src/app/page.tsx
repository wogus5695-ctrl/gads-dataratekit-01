import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { DownloadCalculator } from '@/components/calculator/DownloadCalculator';
import {
  calculateDownloadTime,
  SpeedUnit,
} from '@/lib/download';
import { getCanonicalUrl } from '@/config/site';
import styles from './page.module.css';

const title = 'Free Download Time & Bottleneck Calculator';
const description =
  'Calculate download time, effective download speed, connection vs server CDN bottleneck, and required internet speed with real-world planning factors.';
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

function getDownloadBenchmarkRows() {
  return BENCHMARK_SPEEDS.map((item) => {
    // 100 GB at 100% nominal link efficiency
    const theoreticalRes = calculateDownloadTime({
      fileSize: 100,
      fileSizeUnit: 'GB',
      connectionSpeed: item.speed,
      connectionSpeedUnit: item.unit,
      availableBandwidthPercent: 100,
      serverCapEnabled: false,
      serverCapSpeed: 0,
      serverCapSpeedUnit: 'Mbps',
      planningEfficiencyPercent: 100,
    });

    // 100 GB at default 90% planning assumption
    const planningRes = calculateDownloadTime({
      fileSize: 100,
      fileSizeUnit: 'GB',
      connectionSpeed: item.speed,
      connectionSpeedUnit: item.unit,
      availableBandwidthPercent: 100,
      serverCapEnabled: false,
      serverCapSpeed: 0,
      serverCapSpeedUnit: 'Mbps',
      planningEfficiencyPercent: 90,
    });

    return {
      label: item.label,
      mbRate: theoreticalRes.success
        ? `${theoreticalRes.data.nominalConnectionBytesPerSec / 1e6} MB/s`
        : '—',
      theoreticalDuration: theoreticalRes.success
        ? theoreticalRes.data.formattedTheoreticalDuration
        : '—',
      planningDuration: planningRes.success
        ? planningRes.data.formattedDuration
        : '—',
    };
  });
}

export default function DownloadCalculatorPage() {
  const benchmarkRows = getDownloadBenchmarkRows();

  return (
    <main className={styles.pageContainer}>
      <header className={styles.headerSection}>
        <h1 className={styles.title}>Download Time Calculator</h1>
        <p className={styles.description}>
          Plan download durations, identify throughput bottlenecks between your connection and remote servers, and calculate required internet speeds for large files.
        </p>
      </header>

      <DownloadCalculator />

      {/* 1. How download time is calculated */}
      <section className={styles.contentSection} aria-labelledby="how-it-works-heading">
        <h2 id="how-it-works-heading" className={styles.supportingTitle}>
          How download time is calculated
        </h2>
        <div className={styles.prose}>
          <p>
            The theoretical duration required to download any digital file over an IP network is determined by dividing total file data volume by sustained transfer throughput:
          </p>
          <div>
            <div className={styles.formulaBox}>
              Download duration = File size in bits ÷ Sustained download speed in bits per second
            </div>
          </div>
          <p>
            Broadband internet providers quote connection bandwidth in <em>bits per second</em> (such as 100 Mbps or 1 Gbps), whereas software installers, game stores, and operating systems display file sizes in <em>bytes</em> (such as 50 GB or 100 GB). Because each byte consists of 8 bits, a nominal 100 Mbps broadband link has an upper theoretical ceiling of 12.5 megabytes per second (12.5 MB/s).
          </p>
          <p>
            When planning actual transfers, theoretical line speed serves only as an upper boundary. Practical download duration is dictated by whichever segment along the end-to-end network path has the lowest throughput—whether your subscribed internet tier, shared home traffic, Wi-Fi attenuation, or remote host rate limiting.
          </p>
        </div>
      </section>

      {/* 2. Reference Table */}
      <section className={styles.contentSection} aria-labelledby="reference-table-heading">
        <h2 id="reference-table-heading" className={styles.supportingTitle}>
          100 GB download duration reference table
        </h2>
        <div className={styles.prose}>
          <p>
            The reference table below compares theoretical line-rate durations against realistic 90% planning assumptions for a 100 GB file across common home broadband tiers.
          </p>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.benchmarkTable} aria-label="100 GB download time reference table">
            <thead>
              <tr>
                <th scope="col">Connection Tier</th>
                <th scope="col">Max Throughput</th>
                <th scope="col">Theoretical Limit (100%)</th>
                <th scope="col">Planning Estimate (90%)</th>
              </tr>
            </thead>
            <tbody>
              {benchmarkRows.map((row) => (
                <tr key={row.label}>
                  <th scope="row" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {row.label}
                  </th>
                  <td>{row.mbRate}</td>
                  <td>{row.theoreticalDuration}</td>
                  <td>{row.planningDuration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Internet speed vs effective download throughput */}
      <section className={styles.contentSection} aria-labelledby="throughput-heading">
        <h2 id="throughput-heading" className={styles.supportingTitle}>
          Internet speed vs effective download throughput
        </h2>
        <div className={styles.prose}>
          <p>
            Users frequently observe that their game launcher or web browser downloads at a lower rate than the headline speed on their ISP billing statement. This variance is caused by protocol layers and transmission dynamics:
          </p>
          <ul className={styles.itemList}>
            <li>
              <strong>TCP/IP header overhead:</strong> Every data packet sent across the internet includes IP routing headers, TCP framing, and sequence numbers. Acknowledgment packets (ACKs) return from client to server, absorbing roughly 3% to 6% of raw link capacity.
            </li>
            <li>
              <strong>Transport protocol congestion control:</strong> Modern protocols like TCP BBR, Cubic, or QUIC dynamically ramp throughput based on round-trip time (RTT) and packet loss. Downloads do not start instantaneously at full speed; they ramp up gradually.
            </li>
            <li>
              <strong>Wi-Fi interface variance:</strong> Wireless connections experience RF interference from neighboring networks, structural walls, and distance from the router, resulting in packet retransmissions and jitter.
            </li>
            <li>
              <strong>Planning factor:</strong> In network capacity planning, engineers routinely apply a throughput efficiency factor (such as 90% or 85%) to establish dependable operational estimates rather than relying on theoretical zero-overhead assumptions.
            </li>
          </ul>
        </div>
      </section>

      {/* 4. Why server or CDN limits can control download speed */}
      <section className={styles.contentSection} aria-labelledby="server-limits-heading">
        <h2 id="server-limits-heading" className={styles.supportingTitle}>
          Why server or CDN limits can control download speed
        </h2>
        <div className={styles.prose}>
          <p>
            A high-speed broadband connection only determines how fast data can enter your local router; it cannot force a remote server to send data faster than the host is willing or able to transmit.
          </p>
          <p>
            When downloading game patches, open-source ISO distributions, or files from community hosting services, the remote content delivery network (CDN) or origin server often imposes strict rate limits per IP address or per connection to preserve bandwidth for thousands of concurrent users.
          </p>
          <p>
            For example, if a software mirror caps outbound bandwidth at 50 Mbps (6.25 MB/s), an end user on a 1 Gbps fiber connection will still only download at 50 Mbps. In this scenario, purchasing additional home bandwidth provides zero reduction in download time because the bottleneck resides entirely on the remote host.
          </p>
        </div>
      </section>

      {/* 5. How shared bandwidth changes completion time */}
      <section className={styles.contentSection} aria-labelledby="shared-bandwidth-heading">
        <h2 id="shared-bandwidth-heading" className={styles.supportingTitle}>
          How shared bandwidth changes completion time
        </h2>
        <div className={styles.prose}>
          <p>
            In home and office environments, an internet connection is rarely dedicated to a single download task. Multiple background and foreground activities compete for the same downstream pipe:
          </p>
          <ul className={styles.itemList}>
            <li>
              <strong>Concurrent 4K video streaming:</strong> Each active 4K HDR stream on Netflix or YouTube consumes between 15 Mbps and 25 Mbps of steady bandwidth.
            </li>
            <li>
              <strong>Cloud synchronizations:</strong> Services like Google Drive, OneDrive, and iCloud silently sync photos and files across household devices.
            </li>
            <li>
              <strong>Gaming and voice chat:</strong> Video calls (Zoom, Teams) and online multiplayer gaming demand low-latency, unthrottled bandwidth to prevent bufferbloat and packet drops.
            </li>
          </ul>
          <p>
            Allocating a realistic percentage share—such as 75% or 50%—in the calculator ensures that your download planning accounts for concurrent household usage without choking active connections.
          </p>
        </div>
      </section>

      {/* 6. Mbps vs MB/s for downloads */}
      <section className={styles.contentSection} aria-labelledby="mbps-mbs-heading">
        <h2 id="mbps-mbs-heading" className={styles.supportingTitle}>
          Mbps vs MB/s for downloads
        </h2>
        <div className={styles.prose}>
          <p>
            The distinction between bits and bytes is the single most common source of confusion in transfer calculations:
          </p>
          <ul className={styles.itemList}>
            <li>
              <strong>Mbps (Megabits per second):</strong> Written with a lowercase &ldquo;b&rdquo;, Mbps measures network data transmission rates over time. All ISP packages and modem interfaces are advertised in Mbps or Gbps.
            </li>
            <li>
              <strong>MB/s (Megabytes per second):</strong> Written with a capital &ldquo;B&rdquo;, MB/s measures file storage volume transferred per second. Web browsers (Chrome, Edge), Steam, and Battle.net display download progress in MB/s.
            </li>
          </ul>
          <p>
            To convert Mbps to MB/s, divide the speed by 8. A 100 Mbps connection yields 12.5 MB/s, a 500 Mbps connection yields 62.5 MB/s, and a 1 Gbps connection yields 125 MB/s under ideal conditions. You can also use our dedicated{' '}
            <Link href="/mbps-to-mbs" className={styles.relatedLink}>
              Mbps to MB/s Converter
            </Link>{' '}
            for instant bidirectional conversions.
          </p>
        </div>
      </section>

      {/* 7. Advertised speed vs measured speed */}
      <section className={styles.contentSection} aria-labelledby="measured-speed-heading">
        <h2 id="measured-speed-heading" className={styles.supportingTitle}>
          Advertised speed vs measured speed
        </h2>
        <div className={styles.prose}>
          <p>
            Internet service contracts usually state &ldquo;speeds up to&rdquo; a nominal maximum. During peak evening hours (7:00 PM – 11:00 PM), local neighborhood optical line terminals or cable nodes experience aggregate traffic spikes that can reduce delivered throughput by 10% to 30%.
          </p>
          <p>
            For precise transfer planning, conduct a speed test on your local network under representative conditions, and input that measured speed into the calculator rather than the theoretical speed listed on your billing contract.
          </p>
        </div>
      </section>

      {/* 8. Three worked download planning scenarios */}
      <section className={styles.contentSection} aria-labelledby="scenarios-heading">
        <h2 id="scenarios-heading" className={styles.supportingTitle}>
          Worked download planning scenarios
        </h2>
        <div className={styles.prose}>
          <div className={styles.exampleBlock}>
            <div className={styles.exampleTitle}>
              Scenario A: Large AAA Game Download (100 GB at 100 Mbps)
            </div>
            <div className={styles.exampleDesc}>
              A modern PC game requires downloading 100 GB over a 100 Mbps home broadband connection. 100 GB equals 800,000 megabits. At 100% theoretical line rate (12.5 MB/s), the transfer requires exactly 8,000 seconds (2 hours, 13 minutes, 20 seconds). Factoring in an example 90% planning assumption (90 Mbps effective / 11.25 MB/s), the estimated duration is <strong>2 hours, 28 minutes, and 9 seconds</strong>.
            </div>
          </div>

          <div className={styles.exampleBlock}>
            <div className={styles.exampleTitle}>
              Scenario B: OS Developer Image with Server Cap (8 GB at 1 Gbps on Capped Mirror)
            </div>
            <div className={styles.exampleDesc}>
              An engineer on a 1 Gbps gigabit connection downloads an 8 GB Linux distribution ISO from a public community mirror capped at 50 Mbps (6.25 MB/s). Although the gigabit link could theoretically receive 8 GB in 64 seconds (1m 4s), the server cap acts as the active constraint. With 90% planning efficiency on the capped stream (5.625 MB/s), the download takes approximately <strong>23 minutes and 42 seconds</strong>.
            </div>
          </div>

          <div className={styles.exampleBlock}>
            <div className={styles.exampleTitle}>
              Scenario C: Media Archive on Shared Connection (45 GB at 500 Mbps, 50% Allocation)
            </div>
            <div className={styles.exampleDesc}>
              A video editor downloads a 45 GB raw footage archive on a 500 Mbps studio line while coworkers stream video calls. Reserving 50% bandwidth leaves 250 Mbps for the download. Under a 90% planning factor, effective download throughput is 225 Mbps (28.125 MB/s), completing the archive in <strong>26 minutes and 40 seconds</strong> (compared to 12 minutes on an idle line).
            </div>
          </div>
        </div>
      </section>

      {/* 9. Common download-planning mistakes */}
      <section className={styles.contentSection} aria-labelledby="mistakes-heading">
        <h2 id="mistakes-heading" className={styles.supportingTitle}>
          Common download-planning mistakes
        </h2>
        <div className={styles.prose}>
          <ul className={styles.itemList}>
            <li>
              <strong>Confusing Mbps with MB/s:</strong> Expecting a 100 Mbps connection to download a 100 MB file in 1 second. Because 8 bits equal 1 byte, 100 Mbps transfers 12.5 MB/s, requiring 8 seconds under ideal conditions.
            </li>
            <li>
              <strong>Assuming 1 Gbps equals 1 GB/s:</strong> A 1 Gbps fiber connection transfers 125 megabytes per second, not 1 gigabyte per second. A 100 GB game still requires roughly 13 to 15 minutes.
            </li>
            <li>
              <strong>Ignoring remote server delivery caps:</strong> Upgrading your home internet package will not speed up downloads if the content provider&apos;s server or CDN edge node limits bandwidth per connection.
            </li>
            <li>
              <strong>Overlooking shared household activity:</strong> Running large downloads while family members or coworkers stream 4K video or upload files divides the available pipe and extends completion times.
            </li>
            <li>
              <strong>Treating decimal GB and binary GiB as identical:</strong> Operating systems like Windows report storage in binary GiB (1 GiB = 1,073,741,824 bytes), whereas download sizes are often quoted in decimal GB (1 GB = 1,000,000,000 bytes). A 100 GiB file is approximately 7.4% larger than 100 GB.
            </li>
          </ul>
        </div>
      </section>

      {/* 10. Frequently asked questions */}
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
              Under theoretical maximum line efficiency with no overhead or competing traffic, a 100 GB file takes exactly 8,000 seconds, which equals 2 hours, 13 minutes, and 20 seconds. Applying a default 90% planning assumption to account for TCP/IP packet framing and network fluctuation, the estimated duration is 2 hours, 28 minutes, and 9 seconds.
            </div>
          </div>

          <div className={styles.faqItem}>
            <div className={styles.faqQuestion}>
              Why is my actual download speed lower than my internet plan?
            </div>
            <div className={styles.faqAnswer}>
              Advertised speeds represent raw line capacity under ideal conditions. Real-world download throughput is reduced by TCP/IP framing headers, Wi-Fi interference, packet loss recovery, competing devices on your local network, and bandwidth limits enforced by the remote host server.
            </div>
          </div>

          <div className={styles.faqItem}>
            <div className={styles.faqQuestion}>
              Can a remote server slow down my download even if I have Gigabit internet?
            </div>
            <div className={styles.faqAnswer}>
              Yes. Download speed is governed by the slowest link in the end-to-end chain. If the hosting service, cloud storage provider, or CDN edge throttles single-connection transfers to 20 Mbps or 50 Mbps, your gigabit connection cannot exceed that ceiling.
            </div>
          </div>

          <div className={styles.faqItem}>
            <div className={styles.faqQuestion}>
              How does shared household Wi-Fi affect download time?
            </div>
            <div className={styles.faqAnswer}>
              All active devices on a local router share the same downstream connection pool. Concurrent 4K video streaming, smart home devices, and background cloud syncing consume available bandwidth, leaving less throughput for your download and extending total transfer time.
            </div>
          </div>

          <div className={styles.faqItem}>
            <div className={styles.faqQuestion}>
              What is the difference between advertised Mbps and download MB/s?
            </div>
            <div className={styles.faqAnswer}>
              Internet service providers advertise bandwidth in megabits per second (Mbps), while file managers and download clients show transfer rates in megabytes per second (MB/s). Because 8 bits make up 1 byte, divide your Mbps rate by 8 to calculate the maximum theoretical MB/s.
            </div>
          </div>
        </div>
      </section>

      {/* 10.5 Popular Calculation Guides */}
      <section className={styles.contentSection} aria-labelledby="common-downloads-heading">
        <h2 id="common-downloads-heading" className={styles.sectionTitle}>
          Common Download Time Calculations
        </h2>
        <div className={styles.prose}>
          <p>
            Explore detailed transfer breakdowns across home broadband plans (25 Mbps to 2.5 Gbps) by file size and connection speed:
          </p>
        </div>
        <div style={{ marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          By File Size:
        </div>
        <nav className={styles.relatedTools} aria-label="Common download calculations by file size">
          <Link href="/download-time/5gb" className={styles.relatedLink}>
            5 GB
          </Link>
          <span style={{ color: 'var(--border-strong)', margin: '0 0.5rem' }}>·</span>
          <Link href="/download-time/10gb" className={styles.relatedLink}>
            10 GB
          </Link>
          <span style={{ color: 'var(--border-strong)', margin: '0 0.5rem' }}>·</span>
          <Link href="/download-time/20gb" className={styles.relatedLink}>
            20 GB
          </Link>
          <span style={{ color: 'var(--border-strong)', margin: '0 0.5rem' }}>·</span>
          <Link href="/download-time/50gb" className={styles.relatedLink}>
            50 GB
          </Link>
          <span style={{ color: 'var(--border-strong)', margin: '0 0.5rem' }}>·</span>
          <Link href="/download-time/100gb" className={styles.relatedLink}>
            100 GB
          </Link>
          <span style={{ color: 'var(--border-strong)', margin: '0 0.5rem' }}>·</span>
          <Link href="/download-time/500gb" className={styles.relatedLink}>
            500 GB
          </Link>
          <span style={{ color: 'var(--border-strong)', margin: '0 0.5rem' }}>·</span>
          <Link href="/download-time/1tb" className={styles.relatedLink}>
            1 TB
          </Link>
        </nav>
        <div style={{ marginTop: '1rem', marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          By Connection Speed:
        </div>
        <nav className={styles.relatedTools} aria-label="Common download calculations by connection speed">
          <Link href="/download-speed/50mbps" className={styles.relatedLink}>
            50 Mbps
          </Link>
          <span style={{ color: 'var(--border-strong)', margin: '0 0.5rem' }}>·</span>
          <Link href="/download-speed/100mbps" className={styles.relatedLink}>
            100 Mbps
          </Link>
          <span style={{ color: 'var(--border-strong)', margin: '0 0.5rem' }}>·</span>
          <Link href="/download-speed/300mbps" className={styles.relatedLink}>
            300 Mbps
          </Link>
          <span style={{ color: 'var(--border-strong)', margin: '0 0.5rem' }}>·</span>
          <Link href="/download-speed/500mbps" className={styles.relatedLink}>
            500 Mbps
          </Link>
          <span style={{ color: 'var(--border-strong)', margin: '0 0.5rem' }}>·</span>
          <Link href="/download-speed/1gbps" className={styles.relatedLink}>
            1 Gbps
          </Link>
        </nav>
      </section>

      {/* 11. Related tools */}
      <section className={styles.contentSection} aria-labelledby="related-tools-heading">
        <nav className={styles.relatedTools} aria-label="Related tools">
          <span id="related-tools-heading">Need other network calculations?</span>
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
          <span style={{ color: 'var(--border-strong)', margin: '0 0.5rem' }}>·</span>
          <Link href="/video-file-size-calculator" className={styles.relatedLink}>
            Video File Size Calculator
          </Link>
          <span style={{ color: 'var(--border-strong)', margin: '0 0.5rem' }}>·</span>
          <Link href="/data-usage-calculator" className={styles.relatedLink}>
            Internet Data Usage Calculator
          </Link>
        </nav>
      </section>
    </main>
  );
}
