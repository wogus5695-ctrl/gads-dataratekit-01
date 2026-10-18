import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { FileTransferCalculator } from '@/components/calculator/FileTransferCalculator';
import {
  calculateTransferTime,
  convertSpeed,
  SpeedUnit,
} from '@/lib/transfer';
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

interface BenchmarkSpeed {
  speed: number;
  unit: SpeedUnit;
  label: string;
  bitTargetUnit: SpeedUnit;
}

const FILE_TRANSFER_BENCHMARK_SPEEDS: BenchmarkSpeed[] = [
  { speed: 50, unit: 'MB/s', label: '50 MB/s', bitTargetUnit: 'Mbps' },
  { speed: 100, unit: 'MB/s', label: '100 MB/s', bitTargetUnit: 'Mbps' },
  { speed: 250, unit: 'MB/s', label: '250 MB/s', bitTargetUnit: 'Mbps' },
  { speed: 500, unit: 'MB/s', label: '500 MB/s', bitTargetUnit: 'Mbps' },
  { speed: 1, unit: 'GB/s', label: '1 GB/s', bitTargetUnit: 'Gbps' },
];

function getFileTransferBenchmarkRows() {
  return FILE_TRANSFER_BENCHMARK_SPEEDS.map((item) => {
    const timeRes = calculateTransferTime({
      fileSize: 100,
      fileSizeUnit: 'GB',
      speed: item.speed,
      speedUnit: item.unit,
      efficiencyPercent: 100,
    });
    const bitRes = convertSpeed(item.speed, item.unit, item.bitTargetUnit);
    return {
      label: item.label,
      bitRate: bitRes.success ? bitRes.data.formatted : '—',
      duration: timeRes.success ? timeRes.data.duration.formatted : '—',
    };
  });
}

export default function FileTransferCalculatorPage() {
  const benchmarkRows = getFileTransferBenchmarkRows();

  return (
    <main className={styles.pageContainer}>
      <header className={styles.headerSection}>
        <h1 className={styles.title}>File Transfer Time Calculator</h1>
        <p className={styles.description}>
          Calculate how long it will take to copy or transfer files based on total data size and sustained transfer speed.
        </p>
      </header>

      <FileTransferCalculator />

      {/* 1. How the file transfer time calculation works */}
      <section className={styles.contentSection} aria-labelledby="how-it-works-heading">
        <h2 id="how-it-works-heading" className={styles.supportingTitle}>
          How the file transfer time calculation works
        </h2>
        <div className={styles.prose}>
          <p>
            When copying files between drives, transferring data across a local area network (LAN), or backing up data to an external SSD or network-attached storage (NAS), transfer duration is governed by total data volume and sustained transfer throughput:
          </p>
          <div>
            <div className={styles.formulaBox}>
              Transfer time = File size ÷ Sustained transfer speed
            </div>
          </div>
          <p>
            Storage capacity and file sizes are measured in bytes (such as megabytes, gigabytes, or terabytes). Operating systems and file transfer dialogs typically report data copy rates in megabytes per second (MB/s). In contrast, connection interfaces and network links are often rated in bits per second (such as Gigabit Ethernet or USB 5Gbps). Because 1 byte contains 8 bits, an interface rated at 1 Gbps (1,000 Mbps) corresponds mathematically to an upper ceiling of 125 MB/s.
          </p>
          <p>
            The calculator is most useful when the entered rate represents the sustained transfer speed actually observed during the copy, rather than a theoretical interface peak. To convert directly between bit-based interface rates and byte-based copy speeds, you can use our{' '}
            <Link href="/mbps-to-mbs" className={styles.relatedLink}>
              Mbps to MB/s Converter
            </Link>
            .
          </p>
        </div>
      </section>

      {/* 2. File transfer time examples (Benchmark Table + Worked Examples) */}
      <section className={styles.contentSection} aria-labelledby="examples-heading">
        <h2 id="examples-heading" className={styles.supportingTitle}>
          File transfer time examples
        </h2>
        <div className={styles.prose}>
          <p>
            The reference table below illustrates theoretical transfer durations for a 100 GB example file across several example sustained transfer rates. These are theoretical values calculated using the full entered transfer speed without reductions for filesystem overhead, interface constraints, or storage latency.
          </p>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.benchmarkTable} aria-label="100 GB file transfer time reference table">
            <thead>
              <tr>
                <th scope="col">Sustained transfer speed</th>
                <th scope="col">Equivalent bit rate</th>
                <th scope="col">Theoretical transfer time (100 GB)</th>
              </tr>
            </thead>
            <tbody>
              {benchmarkRows.map((row) => (
                <tr key={row.label}>
                  <th scope="row" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {row.label}
                  </th>
                  <td>{row.bitRate}</td>
                  <td>{row.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.prose}>
          <h3 className={styles.subheading}>Worked transfer scenarios</h3>

          <div className={styles.exampleBlock}>
            <div className={styles.exampleTitle}>Medium project backup (50 GB at 100 MB/s)</div>
            <div className={styles.exampleDesc}>
              A 50 GB dataset equals 50,000 megabytes. Transferring this volume at a sustained rate of 100 MB/s requires 500 seconds, which equals exactly 8 minutes and 20 seconds under consistent sustained throughput.
            </div>
          </div>

          <div className={styles.exampleBlock}>
            <div className={styles.exampleTitle}>Large media archive migration (250 GB at 250 MB/s)</div>
            <div className={styles.exampleDesc}>
              A 250 GB archive contains 250,000 megabytes. Moving this data at a sustained rate of 250 MB/s takes 1,000 seconds, or exactly 16 minutes and 40 seconds.
            </div>
          </div>

          <div className={styles.exampleBlock}>
            <div className={styles.exampleTitle}>System drive image backup (1 TB at 500 MB/s)</div>
            <div className={styles.exampleDesc}>
              A 1 TB image equals 1,000 GB (1,000,000 MB) using standard decimal storage units. At a sustained throughput of 500 MB/s, theoretical transfer time is 2,000 seconds, which equals 33 minutes and 20 seconds.
            </div>
          </div>
        </div>
      </section>

      {/* 3. What limits file transfer speed */}
      <section className={styles.contentSection} aria-labelledby="bottleneck-heading">
        <h2 id="bottleneck-heading" className={styles.supportingTitle}>
          What limits file transfer speed
        </h2>
        <div className={styles.prose}>
          <p>
            In real-world data transfers, the end-to-end transfer rate is shaped by every component in the data path. While performance is often bounded by the slowest relevant component, multiple factors can interact simultaneously to determine sustained throughput:
          </p>
          <ul className={styles.itemList}>
            <li>
              <strong>Source drive read speed:</strong> The medium holding the original data (such as an internal SSD, mechanical hard drive, or external storage) must read and deliver data continuously. If the source drive cannot sustain high read rates, the rest of the transfer pipeline is constrained.
            </li>
            <li>
              <strong>Destination drive write speed:</strong> The receiving storage medium must write incoming data to disk. For many storage devices, sustained sequential write speeds may be lower than read speeds due to caching behavior, media write characteristics, or device-level management.
            </li>
            <li>
              <strong>Connection interface and bus bandwidth:</strong> External connections (such as USB, Thunderbolt, or SATA) and internal buses (PCIe lanes) define the maximum data bandwidth available between host controllers and storage devices.
            </li>
            <li>
              <strong>Local network infrastructure (for NAS and LAN transfers):</strong> Networked transfers traverse network interface cards (NICs), switches, routers, and wireless links. Negotiated link speeds, network path limits, and concurrent traffic establish the upper network ceiling.
            </li>
            <li>
              <strong>Filesystem and operating system overhead:</strong> Filesystem metadata, block allocation, journaling, directory updates, and other bookkeeping operations can add processing work depending on the filesystem and workload.
            </li>
            <li>
              <strong>Protocol processing and transport overhead:</strong> Network file-sharing protocols can introduce additional protocol and latency overhead depending on the protocol, client, server configuration, and workload.
            </li>
            <li>
              <strong>Internal caching and thermal behavior:</strong> Some storage devices show different short-burst and sustained transfer performance because of caching behavior, internal media handling, or thermal conditions that can lead to throttling during prolonged heavy writes.
            </li>
          </ul>
        </div>
      </section>

      {/* 4. Interface rate vs. sustained copy speed */}
      <section className={styles.contentSection} aria-labelledby="interface-vs-sustained-heading">
        <h2 id="interface-vs-sustained-heading" className={styles.supportingTitle}>
          Interface rate vs. sustained copy speed
        </h2>
        <div className={styles.prose}>
          <p>
            Nominal link rates (such as USB 5Gbps, USB 10Gbps, Gigabit Ethernet, or Thunderbolt 4) describe interface capability, not guaranteed application-level file-copy throughput.
          </p>
          <p>
            For example, an external drive connected via a USB 10Gbps port is theoretically capable of transporting over 1 GB/s across the physical cable. However, if the underlying drive inside the enclosure is a mechanical hard disk with a sustained write capability of 140 MB/s, the file transfer will proceed at 140 MB/s, regardless of the 10Gbps interface headroom.
          </p>
          <p>
            <strong>Preset options in the calculator:</strong> The interface presets provided in this calculator (such as Gigabit Ethernet, USB, or Thunderbolt) supply nominal interface or link rates for quick reference. When using an interface preset, the resulting time represents an idealized ceiling that assumes the storage hardware and transfer pipeline can fully saturate the connection.
          </p>
          <p>
            <strong>The 100% default calculation:</strong> Unlike internet download or upload planning where unknown network congestion is common, local file transfers are often evaluated against a known, observed sustained copy speed from an active file manager dialog. When an observed sustained rate is entered, the calculator applies 100% of that rate directly without arbitrary reductions.
          </p>
          <p>
            <strong>Planning adjustments (95%, 90%, 85%, 80%):</strong> The optional adjustment settings model lower-throughput planning scenarios. They allow users to evaluate the impact of reduced throughput without assuming that specific technologies conform to a fixed overhead percentage.
          </p>
        </div>
      </section>

      {/* 5. Why many small files can transfer more slowly */}
      <section className={styles.contentSection} aria-labelledby="small-files-heading">
        <h2 id="small-files-heading" className={styles.supportingTitle}>
          Why many small files can transfer more slowly
        </h2>
        <div className={styles.prose}>
          <p>
            Users frequently observe that transferring a 50 GB folder containing 100,000 small documents, source code files, or photos takes significantly longer than transferring a single 50 GB video file, even across the exact same storage hardware.
          </p>
          <p>
            This difference occurs because each individual file requires dedicated operating system and filesystem transactions:
          </p>
          <ul className={styles.itemList}>
            <li>
              <strong>Filesystem metadata creation:</strong> For every file, the operating system must create a new directory record, verify naming rules, assign access permissions, record timestamps, and allocate physical storage clusters.
            </li>
            <li>
              <strong>Per-file I/O operations:</strong> Each file requires separate open, read, write, flush, and close system calls. The latency of executing these operations thousands of times accumulates into substantial idle time between actual payload writes.
            </li>
            <li>
              <strong>Potential non-sequential access patterns:</strong> Small files and their corresponding directory entries can involve non-sequential read and write operations across storage blocks, which can add storage controller latency compared to continuous sequential streams.
            </li>
            <li>
              <strong>Network protocol latency on networked transfers:</strong> On networked file shares, each file operation may require round-trip acknowledgments between client and server, multiplying latency over thousands of files depending on protocol and network configuration.
            </li>
          </ul>
          <p>
            Combining many small files into fewer larger archive files (such as a tar or zip container) may improve transfer efficiency in some workflows by reducing per-file metadata operations, though creating and extracting the archive also requires processing time.
          </p>
        </div>
      </section>

      {/* 6. How to choose the correct transfer speed */}
      <section className={styles.contentSection} aria-labelledby="how-to-choose-heading">
        <h2 id="how-to-choose-heading" className={styles.supportingTitle}>
          How to choose the correct transfer speed
        </h2>
        <div className={styles.prose}>
          <p>
            Entering an appropriate transfer speed is essential for realistic transfer planning:
          </p>
          <ul className={styles.itemList}>
            <li>
              <strong>Use an observed sustained copy rate:</strong> A representative sustained rate observed during a comparable transfer between the same devices (reported in MB/s by file managers like Windows File Explorer, macOS Finder, or rsync) provides a realistic basis for estimation.
            </li>
            <li>
              <strong>Prioritize sustained rates over initial burst speeds:</strong> Some operating systems and storage devices show high initial transfer rates during the first few seconds of a copy due to caching or memory buffering, before leveling off to a lower sustained rate. For long transfers, use the leveled-off sustained rate.
            </li>
            <li>
              <strong>Treat interface presets as theoretical ceilings:</strong> If you only know the interface specification (such as a Gigabit Ethernet link or a USB 3.0 port), select that preset to see the absolute theoretical minimum transfer duration. Then consider using an adjustment scenario if your drives cannot saturate the link.
            </li>
            <li>
              <strong>Verify MB/s versus Mbps units:</strong> Ensure your speed unit matches your data source. Storage benchmarks and file copy dialogs report in megabytes per second (MB/s), whereas network cards and interface cables are rated in megabits per second (Mbps or Gbps).
            </li>
            <li>
              <strong>Account for NAS and network path bottlenecks:</strong> On local network transfers, the mathematical link conversion (such as 1 Gbps = 125 MB/s) represents nominal network bandwidth, not guaranteed file-copy throughput. Real-world NAS throughput depends on the storage subsystem, array or drive configuration, CPU resources, protocol behavior, and concurrent network traffic.
            </li>
          </ul>
        </div>
      </section>

      {/* 7. Common file-transfer mistakes */}
      <section className={styles.contentSection} aria-labelledby="common-mistakes-heading">
        <h2 id="common-mistakes-heading" className={styles.supportingTitle}>
          Common file-transfer mistakes to avoid
        </h2>
        <div className={styles.prose}>
          <ul className={styles.itemList}>
            <li>
              <strong>Equating interface ratings with sustained transfer speed:</strong> Assuming a USB 10Gbps or Gigabit Ethernet connection will transfer files at the interface&apos;s maximum rated signaling speed, regardless of the drives attached.
            </li>
            <li>
              <strong>Confusing megabits (Mbps) and megabytes (MB/s):</strong> Overlooking that 1 byte consists of 8 bits. An interface rated at 1 Gbps (1,000 Mbps) can deliver at most 125 MB/s of theoretical payload, not 1,000 MB/s.
            </li>
            <li>
              <strong>Overlooking destination drive write bottlenecks:</strong> Focusing exclusively on how fast the source drive can read data, while neglecting that the destination drive may write at a substantially lower rate.
            </li>
            <li>
              <strong>Using short burst speeds for long transfer planning:</strong> Entering an initial burst speed observed during the first few seconds of a copy, which may reflect temporary memory buffering or device caching rather than representative sustained write capability.
            </li>
            <li>
              <strong>Assuming small files transfer as fast as large sequential files:</strong> Expecting thousands of small loose files to copy at the same sustained throughput as a single continuous media archive.
            </li>
          </ul>
        </div>
      </section>

      {/* 8. Frequently asked questions */}
      <section className={styles.contentSection} aria-labelledby="faq-heading">
        <h2 id="faq-heading" className={styles.supportingTitle}>
          Frequently asked questions
        </h2>
        <div className={styles.faqList}>
          <div className={styles.faqItem}>
            <div className={styles.faqQuestion}>
              How long does 100 GB take to transfer at 100 MB/s?
            </div>
            <div className={styles.faqAnswer}>
              At a sustained transfer rate of 100 MB/s, transferring 100 GB requires exactly 1,000 seconds, which equals 16 minutes and 40 seconds under theoretical conditions using the full entered speed. If evaluating a planning scenario such as 90% of the entered speed, the same transfer would take approximately 18 minutes and 31 seconds.
            </div>
          </div>

          <div className={styles.faqItem}>
            <div className={styles.faqQuestion}>
              Why is my file transfer slower than the USB or Ethernet rating?
            </div>
            <div className={styles.faqAnswer}>
              Connection interface ratings describe nominal interface capability, not application-level storage throughput. The actual transfer rate is bounded by the slowest relevant component in the pipeline, such as destination write performance, filesystem bookkeeping, or protocol overhead.
            </div>
          </div>

          <div className={styles.faqItem}>
            <div className={styles.faqQuestion}>
              Should I enter MB/s or Mbps into the calculator?
            </div>
            <div className={styles.faqAnswer}>
              Enter the speed unit that corresponds to your measurement. File copy progress dialogs in operating systems like Windows and macOS typically report data transfer rates in megabytes per second (MB/s), whereas network link ratings are usually expressed in megabits per second (Mbps). Because 1 byte contains 8 bits, 100 MB/s is equivalent to 800 Mbps.
            </div>
          </div>

          <div className={styles.faqItem}>
            <div className={styles.faqQuestion}>
              Why do many small files copy more slowly than one large file of the same total size?
            </div>
            <div className={styles.faqAnswer}>
              Each individual file requires the filesystem and operating system to handle directory updates, allocation bookkeeping, and per-file I/O operations. When copying thousands of small files, the cumulative overhead of these repeated operations can substantially lower effective throughput compared to a single continuous sequential stream.
            </div>
          </div>

          <div className={styles.faqItem}>
            <div className={styles.faqQuestion}>
              What speed should I enter for a NAS transfer?
            </div>
            <div className={styles.faqAnswer}>
              Use an observed sustained copy rate from your file manager or backup utility when available. If only a nominal network link rate is known (such as Gigabit Ethernet = 125 MB/s), treat it as an interface ceiling rather than a guaranteed file-copy rate, because NAS storage performance, device resources, array configuration, and protocol overhead determine actual sustained throughput.
            </div>
          </div>
        </div>
      </section>

      {/* 9. Related tools */}
      <section className={styles.contentSection} aria-labelledby="related-tools-heading">
        <nav className={styles.relatedTools} aria-label="Related tools">
          <span id="related-tools-heading">Need other calculations or unit conversions?</span>
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
