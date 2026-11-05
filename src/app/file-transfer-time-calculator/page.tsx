import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { FileTransferCalculator } from '@/components/calculator/FileTransferCalculator';
import {
  calculateFileTransferTime,
  SpeedUnit,
} from '@/lib/file-transfer';
import { getCanonicalUrl } from '@/config/site';
import styles from '../page.module.css';

const title = 'File Transfer Time & Bottleneck Calculator';
const description =
  'Estimate file transfer time across source read, interface, and destination write speeds. Identify transfer bottlenecks and calculate effective throughput.';
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

interface BenchmarkRow {
  scenario: string;
  source: string;
  interfaceRate: string;
  destination: string;
  limitingStage: string;
  effectiveSpeed: string;
  duration100GB: string;
}

const BENCHMARK_SCENARIOS: BenchmarkRow[] = [
  {
    scenario: 'Gigabit LAN to NAS HDD',
    source: '500 MB/s (SATA SSD)',
    interfaceRate: '1 Gbps (125 MB/s)',
    destination: '180 MB/s (NAS HDD)',
    limitingStage: 'Interface (1 Gbps)',
    effectiveSpeed: '106.25 MB/s (85% eff)',
    duration100GB: '15m 41s',
  },
  {
    scenario: '10GbE LAN to NAS RAID',
    source: '3,500 MB/s (NVMe SSD)',
    interfaceRate: '10 Gbps (1,250 MB/s)',
    destination: '350 MB/s (RAID 5 example)',
    limitingStage: 'Destination Write',
    effectiveSpeed: '297.50 MB/s (85% eff)',
    duration100GB: '5m 36s',
  },
  {
    scenario: 'External USB 3.0 HDD Backup',
    source: '500 MB/s (SATA SSD)',
    interfaceRate: '5 Gbps (625 MB/s)',
    destination: '120 MB/s (Ext HDD)',
    limitingStage: 'Destination Write',
    effectiveSpeed: '102.00 MB/s (85% eff)',
    duration100GB: '16m 20s',
  },
  {
    scenario: 'Fast NVMe to External USB-C SSD',
    source: '7,000 MB/s (PCIe 4.0)',
    interfaceRate: '10 Gbps (1,250 MB/s)',
    destination: '1,000 MB/s (Ext NVMe)',
    limitingStage: 'Destination Write',
    effectiveSpeed: '850.00 MB/s (85% eff)',
    duration100GB: '1m 58s',
  },
  {
    scenario: 'Legacy USB 2.0 Flash Drive',
    source: '500 MB/s (Internal SSD)',
    interfaceRate: '480 Mbps (60 MB/s)',
    destination: '25 MB/s (USB Flash)',
    limitingStage: 'Destination Write',
    effectiveSpeed: '21.25 MB/s (85% eff)',
    duration100GB: '1h 18m 26s',
  },
];

export default function FileTransferCalculatorPage() {
  return (
    <main className={styles.pageContainer}>
      <header className={styles.headerSection}>
        <h1 className={styles.title}>File Transfer Time Calculator</h1>
        <p className={styles.description}>
          Estimate file transfer time across your source drive, connection interface or network, and destination drive. Compare all three stages to identify the throughput bottleneck and calculate realistic transfer duration.
        </p>
      </header>

      <FileTransferCalculator />

      {/* 1. How file transfer bottlenecks work */}
      <section className={styles.contentSection} aria-labelledby="how-it-works-heading">
        <h2 id="how-it-works-heading" className={styles.supportingTitle}>
          How file transfer bottlenecks work
        </h2>
        <div className={styles.prose}>
          <p>
            Unlike internet downloads where a single ISP connection typically bounds your throughput, moving files between drives or across a local network involves a complete three-stage physical pipeline:
          </p>
          <div className={styles.formulaBox}>
            Effective Throughput = min(Source Read, Interface / Bus Rate, Destination Write) × Planning Efficiency
          </div>
          <p>
            Total transfer duration is determined by your total payload size divided by this effective throughput, plus any metadata latency incurred across multi-file batches:
          </p>
          <div className={styles.formulaBox}>
            Total Transfer Time = (Data Size ÷ Effective Throughput) + (File Count × Per-File Overhead)
          </div>
          <p>
            Because data must flow sequentially from source to destination, every component must keep pace. If any single stage is slower than the others, it becomes the primary bottleneck, forcing the faster stages to operate below their rated capabilities.
          </p>
        </div>
      </section>

      {/* 2. Source read vs interface vs destination write */}
      <section className={styles.contentSection} aria-labelledby="pipeline-stages-heading">
        <h2 id="pipeline-stages-heading" className={styles.supportingTitle}>
          Source read vs. interface rate vs. destination write speed
        </h2>
        <div className={styles.prose}>
          <p>
            Understanding where a bottleneck occurs requires evaluating each of the three stages in your data path independently:
          </p>
          <ul className={styles.itemList}>
            <li>
              <strong>Stage 1 — Source Read Speed:</strong> The original media (such as an internal PCIe NVMe SSD, SATA SSD, mechanical hard drive, or memory card) must retrieve data from storage blocks. Typical sequential read rates range from 90 MB/s for UHS-I SD cards to over 7,000 MB/s for modern PCIe 4.0 NVMe drives, though sustained real-world performance varies by controller and thermal conditions.
            </li>
            <li>
              <strong>Stage 2 — Interface / Bus Bandwidth:</strong> The physical link connecting host systems and storage enclosures. Common interfaces include Gigabit Ethernet (1 Gbps nominal = 125 MB/s raw ceiling), 10GbE (1,250 MB/s ceiling), USB 3.0 (5 Gbps = 625 MB/s ceiling), USB 3.2 Gen 2 (10 Gbps = 1,250 MB/s ceiling), and Thunderbolt 4 (40 Gbps = 5,000 MB/s ceiling).
            </li>
            <li>
              <strong>Stage 3 — Destination Write Speed:</strong> The target drive or networked array that commits incoming data to persistent media. For many mechanical drives and budget flash devices, sustained sequential write speeds (100–180 MB/s for HDDs, 30–70 MB/s for entry flash) are substantially lower than peak burst rates or read capabilities.
            </li>
          </ul>
        </div>
      </section>

      {/* 3. Storage MB/s vs network Mbps/Gbps */}
      <section className={styles.contentSection} aria-labelledby="units-heading">
        <h2 id="units-heading" className={styles.supportingTitle}>
          Storage MB/s vs. network Mbps and Gbps
        </h2>
        <div className={styles.prose}>
          <p>
            One of the most frequent sources of confusion in file transfer planning is the mathematical distinction between bits and bytes:
          </p>
          <p>
            Operating systems, file managers (such as Windows File Explorer, macOS Finder, or rsync), and storage drive benchmarks measure throughput in <strong>Megabytes per second (MB/s)</strong> or <strong>Gigabytes per second (GB/s)</strong>. In contrast, network cards, Ethernet switches, Wi-Fi routers, and bus interfaces are rated in <strong>bits per second (Mbps or Gbps)</strong>.
          </p>
          <p>
            Because <strong>1 Byte = 8 bits</strong>:
          </p>
          <ul className={styles.itemList}>
            <li>
              A <strong>1 Gigabit Ethernet (1 Gbps)</strong> network link provides an absolute theoretical maximum of 1,000,000,000 bits ÷ 8 = <strong>125 MB/s</strong>.
            </li>
            <li>
              A <strong>2.5 GbE</strong> link caps out at 2,500,000,000 bits ÷ 8 = <strong>312.5 MB/s</strong>.
            </li>
            <li>
              A <strong>10 GbE</strong> link provides up to 10,000,000,000 bits ÷ 8 = <strong>1,250 MB/s</strong>.
            </li>
            <li>
              A <strong>USB 5Gbps (USB 3.0)</strong> bus provides a theoretical physical signaling ceiling of <strong>625 MB/s</strong> before encoding and protocol overhead.
            </li>
          </ul>
          <p>
            To quickly convert between bit rates and byte rates, you can use our{' '}
            <Link href="/mbps-to-mbs" className={styles.relatedLink}>
              Mbps to MB/s Converter
            </Link>
            .
          </p>
        </div>
      </section>

      {/* 4. Slowest stage controls throughput */}
      <section className={styles.contentSection} aria-labelledby="slowest-stage-heading">
        <h2 id="slowest-stage-heading" className={styles.supportingTitle}>
          Why the slowest stage controls throughput (Headroom Analysis)
        </h2>
        <div className={styles.prose}>
          <p>
            In any serial transfer pipeline, investing in faster hardware only yields speed improvements if you upgrade the <em>limiting stage</em>. Consider a common high-performance workstation scenario:
          </p>
          <p>
            You have an ultra-fast internal PCIe 4.0 NVMe SSD capable of reading data at <strong>7,000 MB/s</strong>, connected via a <strong>40 Gbps Thunderbolt 4 cable (5,000 MB/s raw)</strong> to an external backup enclosure containing a 7200 RPM mechanical hard drive that writes at <strong>180 MB/s</strong>.
          </p>
          <p>
            Despite having 6,820 MB/s of unutilized source headroom and 4,820 MB/s of interface headroom, your actual transfer speed will not exceed 180 MB/s raw. Upgrading from a 10 Gbps cable to a 40 Gbps Thunderbolt cable will result in exactly <strong>0% speed improvement</strong> because the mechanical destination drive remains the bottleneck.
          </p>
        </div>
      </section>

      {/* 5. Why many small files take longer */}
      <section className={styles.contentSection} aria-labelledby="small-files-heading">
        <h2 id="small-files-heading" className={styles.supportingTitle}>
          Why many small files take longer (I/O latency &amp; metadata overhead)
        </h2>
        <div className={styles.prose}>
          <p>
            Transferring a single 50 GB 4K video file often takes a fraction of the time required to copy 50 GB consisting of 100,000 small source code files, documents, or photo thumbnails across the exact same hardware.
          </p>
          <p>
            This performance divergence occurs because sequential throughput numbers assume uninterrupted continuous data streams. When handling multi-file batches:
          </p>
          <ul className={styles.itemList}>
            <li>
              <strong>Filesystem Metadata &amp; Journaling:</strong> For every individual file, the operating system must allocate directory index records, update timestamps, assign security permissions, and log transactions in the filesystem journal (NTFS, APFS, or ext4).
            </li>
            <li>
              <strong>I/O System Call Latency:</strong> Each file requires distinct system calls: open file, query attributes, allocate clusters, write payload, flush buffers, and close handle. On solid-state drives, this overhead is typically 2 to 5 milliseconds per file; on mechanical drives or across network shares, it can reach 15 to 30 milliseconds per file.
            </li>
            <li>
              <strong>SMB / NFS Network Framing:</strong> Network file-sharing protocols require round-trip acknowledgment packets for every file metadata query, multiplying total latency across high-latency or Wi-Fi links.
            </li>
          </ul>
          <p>
            In this calculator, enabling the <strong>Small-File Batch Planning</strong> option allows you to model this cumulative overhead directly by specifying your file count and per-file latency.
          </p>
        </div>
      </section>

      {/* 6. Theoretical interface rate vs sustained transfer rate */}
      <section className={styles.contentSection} aria-labelledby="sustained-vs-peak-heading">
        <h2 id="sustained-vs-peak-heading" className={styles.supportingTitle}>
          Theoretical interface rate vs. sustained transfer rate
        </h2>
        <div className={styles.prose}>
          <p>
            Why does a drive rated for 1,050 MB/s frequently drop to 150 MB/s after the first few gigabytes of a large transfer?
          </p>
          <ul className={styles.itemList}>
            <li>
              <strong>SLC Cache Exhaustion:</strong> Modern TLC and QLC SSDs use a portion of high-speed Single-Level Cell (SLC) pseudo-cache to absorb short bursts quickly. Once this cache fills during prolonged transfers (often after 20 GB to 100 GB of continuous writing), write speeds drop sharply to the native NAND flash write speed.
            </li>
            <li>
              <strong>Thermal Throttling:</strong> Compact external SSDs and M.2 drives without active cooling can quickly reach 70°C to 80°C under continuous write workloads. To prevent hardware damage, the internal controller automatically throttles performance.
            </li>
            <li>
              <strong>SMR Mechanical Drive Penalities:</strong> Shingled Magnetic Recording (SMR) hard drives must rewrite overlapping tracks when modifying data, causing drastic throughput drops during sustained random or sequential writes.
            </li>
          </ul>
          <p>
            Our calculator applies an adjustable default <strong>85% Planning Efficiency</strong> to account for sustained thermal throttling, protocol encapsulation (SMB/NFS/USB packet framing), and filesystem journaling. This value serves as an editable planning baseline rather than a universal performance constant.
          </p>
        </div>
      </section>

      {/* 7. Local, external, LAN & NAS transfer planning */}
      <section className={styles.contentSection} aria-labelledby="transfer-planning-heading">
        <h2 id="transfer-planning-heading" className={styles.supportingTitle}>
          Local drive, external storage, LAN, and NAS transfer planning
        </h2>
        <div className={styles.prose}>
          <p>
            Use these practical guidelines when configuring your transfer pipeline:
          </p>
          <ul className={styles.itemList}>
            <li>
              <strong>Local NVMe to NVMe:</strong> Internal PCIe bus bandwidth (3,500–7,000 MB/s) is rarely the bottleneck. Performance is primarily dictated by the sustained write capability and thermal dissipation of the receiving SSD.
            </li>
            <li>
              <strong>PC to External USB SSD:</strong> Verify port capabilities. Connecting a 1,000 MB/s NVMe external drive to a standard USB 3.0 (5 Gbps) port limits transfer throughput to approximately 420–450 MB/s effective. Use a USB 3.2 Gen 2 (10 Gbps) or Thunderbolt port to achieve full drive speed.
            </li>
            <li>
              <strong>PC to NAS over Gigabit Ethernet:</strong> Standard 1GbE is capped at 125 MB/s raw (~105–112 MB/s real-world). If your NAS has a fast RAID array or SSD cache, upgrading your PC, switch, and NAS to <strong>2.5GbE (312 MB/s)</strong> or <strong>10GbE (1,250 MB/s)</strong> will yield immediate, noticeable throughput improvements.
            </li>
          </ul>
        </div>
      </section>

      {/* 8. Benchmark Table & Worked Scenarios */}
      <section className={styles.contentSection} aria-labelledby="benchmarks-heading">
        <h2 id="benchmarks-heading" className={styles.supportingTitle}>
          Multi-stage transfer benchmark reference &amp; worked scenarios
        </h2>
        <div className={styles.prose}>
          <p>
            The table below compares estimated transfer durations for a 100 GB dataset across representative storage and network pipelines at 85% planning efficiency:
          </p>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.benchmarkTable} aria-label="100 GB multi-stage file transfer reference table">
            <thead>
              <tr>
                <th scope="col">Pipeline Scenario</th>
                <th scope="col">Source Read</th>
                <th scope="col">Interface / LAN</th>
                <th scope="col">Dest Write</th>
                <th scope="col">Limiting Bottleneck</th>
                <th scope="col">Effective Speed</th>
                <th scope="col">100 GB Time</th>
              </tr>
            </thead>
            <tbody>
              {BENCHMARK_SCENARIOS.map((row) => (
                <tr key={row.scenario}>
                  <th scope="row" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {row.scenario}
                  </th>
                  <td>{row.source}</td>
                  <td>{row.interfaceRate}</td>
                  <td>{row.destination}</td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#b45309' }}>{row.limitingStage}</span>
                  </td>
                  <td>{row.effectiveSpeed}</td>
                  <td style={{ fontWeight: 600 }}>{row.duration100GB}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.prose}>
          <h3 className={styles.subheading}>Worked transfer scenarios</h3>

          <div className={styles.exampleBlock}>
            <div className={styles.exampleTitle}>
              Scenario A: Internal NVMe to External SSD via USB 3.0 (100 GB)
            </div>
            <div className={styles.exampleDesc}>
              A 100 GB 4K video project is transferred from a 3,500 MB/s internal NVMe SSD to a fast external portable SSD (1,050 MB/s write capability) over a USB 3.0 (5 Gbps) port. USB 3.0 caps raw throughput to 625 MB/s, making the USB interface the bottleneck. At 85% planning efficiency, effective throughput is 531.25 MB/s, completing the transfer in approximately <strong>3 minutes and 8 seconds</strong>.
            </div>
          </div>

          <div className={styles.exampleBlock}>
            <div className={styles.exampleTitle}>
              Scenario B: PC to NAS Backup over 1GbE vs. 10GbE (250 GB)
            </div>
            <div className={styles.exampleDesc}>
              Backing up a 250 GB system archive from an internal SSD to a 4-disk NAS RAID array (using a 350 MB/s planning example; actual throughput depends on drive model, RAID level, controller, and filesystem) over standard Gigabit Ethernet (1 Gbps = 125 MB/s raw limit) takes <strong>39 minutes and 13 seconds</strong> (interface bottleneck). Upgrading the network link to 10GbE shifts the bottleneck to the NAS array (350 MB/s), reducing the transfer duration to just <strong>14 minutes and 0 seconds</strong>.
            </div>
          </div>

          <div className={styles.exampleBlock}>
            <div className={styles.exampleTitle}>
              Scenario C: Small-File Photo Batch with Filesystem Overhead (20 GB, 15,000 files)
            </div>
            <div className={styles.exampleDesc}>
              Copying 20 GB of RAW photos (15,000 individual files) to an external SSD. At 500 MB/s sustained throughput (85% eff = 425 MB/s), the pure data transfer takes 47 seconds. However, with an average filesystem metadata latency of 0.015 seconds per file across the external link, metadata handling adds 225 seconds. Total transfer time is <strong>4 minutes and 32 seconds</strong>, with metadata overhead accounting for over 82% of total duration.
            </div>
          </div>
        </div>
      </section>

      {/* 9. Frequently asked questions */}
      <section className={styles.contentSection} aria-labelledby="faq-heading">
        <h2 id="faq-heading" className={styles.supportingTitle}>
          Frequently asked questions
        </h2>
        <div className={styles.faqList}>
          <div className={styles.faqItem}>
            <div className={styles.faqQuestion}>
              How does the File Transfer Calculator identify the bottleneck?
            </div>
            <div className={styles.faqAnswer}>
              The calculator converts your Source Read Speed, Interface / Network Speed, and Destination Write Speed into normalized Bytes per Second (B/s). It identifies the minimum value as the primary bottleneck and computes the headroom percentage for the remaining stages, showing exactly which component limits your copy speed.
            </div>
          </div>

          <div className={styles.faqItem}>
            <div className={styles.faqQuestion}>
              Why is a 1 Gbps Ethernet connection slower than a 500 MB/s SATA SSD?
            </div>
            <div className={styles.faqAnswer}>
              Because 1 Byte consists of 8 bits. A 1 Gigabit per second (1 Gbps) Ethernet link has an absolute theoretical ceiling of 125 Megabytes per second (125 MB/s). Even a budget SATA III SSD operating at 500 MB/s is four times faster than Gigabit Ethernet.
            </div>
          </div>

          <div className={styles.faqItem}>
            <div className={styles.faqQuestion}>
              Why do transfers start fast and slow down significantly later?
            </div>
            <div className={styles.faqAnswer}>
              Operating systems use available RAM as a write buffer, and modern SSDs use fast pseudo-SLC cache. During the first few gigabytes, data is absorbed rapidly. Once this buffer is exhausted, the drive must flush data directly to slower native TLC/QLC flash or mechanical platters, revealing true sustained write performance.
            </div>
          </div>

          <div className={styles.faqItem}>
            <div className={styles.faqQuestion}>
              How do I use Mode C (Required Interface Speed)?
            </div>
            <div className={styles.faqAnswer}>
              Mode C allows you to enter a dataset size and your target completion deadline (for example, transferring 100 GB within 15 minutes). The calculator determines the minimum network or bus speed required and verifies whether your source and destination drives can sustain that throughput without hitting a hard storage ceiling.
            </div>
          </div>

          <div className={styles.faqItem}>
            <div className={styles.faqQuestion}>
              How can I reduce small-file transfer slowdowns?
            </div>
            <div className={styles.faqAnswer}>
              To minimize filesystem metadata overhead, archive or compress your files into a single container (such as a ZIP, TAR, or 7z archive) before transferring. Moving one 20 GB archive file avoids tens of thousands of individual filesystem creation and attribute-setting operations.
            </div>
          </div>
        </div>
      </section>

      {/* 9.5 Common File Transfer Calculations */}
      <section className={styles.contentSection} aria-labelledby="common-transfers-heading">
        <h2 id="common-transfers-heading" className={styles.supportingTitle}>
          Common File Transfer Calculations
        </h2>
        <div className={styles.prose}>
          <p>
            Review 3-stage hardware bottleneck and duration breakdowns across SSD, USB, and LAN/NAS pipelines for large payloads:
          </p>
        </div>
        <nav className={styles.relatedTools} aria-label="Common file transfer calculations">
          <Link href="/file-transfer-time/100gb" className={styles.relatedLink}>
            100 GB File Transfer Time
          </Link>
          <span style={{ color: 'var(--border-strong)', margin: '0 0.5rem' }}>·</span>
          <Link href="/file-transfer-time/1tb" className={styles.relatedLink}>
            1 TB File Transfer Time
          </Link>
        </nav>
      </section>

      {/* 10. Related tools */}
      <section className={styles.contentSection} aria-labelledby="related-tools-heading">
        <nav className={styles.relatedTools} aria-label="Related tools">
          <span id="related-tools-heading">Need other network planning tools?</span>
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
          <span style={{ color: 'var(--border-strong)', margin: '0 0.5rem' }}>·</span>
          <Link href="/video-file-size-calculator" className={styles.relatedLink}>
            Video File Size Calculator
          </Link>
          <span style={{ color: 'var(--border-strong)', margin: '0 0.5rem' }}>·</span>
          <Link href="/data-usage-calculator" className={styles.relatedLink}>
            Data Usage Calculator
          </Link>
        </nav>
      </section>
    </main>
  );
}
