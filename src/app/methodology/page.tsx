import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getCanonicalUrl } from '@/config/site';
import styles from './methodology.module.css';

const title = 'Calculation Methodology & Standards';
const description =
  'Learn how DataRateKit handles units, throughput assumptions, bottlenecks, bitrate, data usage, rounding, validation, and calculator limitations.';
const canonical = getCanonicalUrl('/methodology');

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical,
  },
  openGraph: {
    title,
    description,
    url: canonical,
    type: 'website',
  },
};

export default function MethodologyPage() {
  return (
    <main className={styles.contentContainer}>
      <header className={styles.headerSection}>
        <h1 className={styles.title}>Calculation Methodology</h1>
        <div className={styles.lastUpdated}>
          Technical Calculation Standards, Mathematical Models & Pipeline Specifications
        </div>
      </header>

      {/* Intro */}
      <section className={styles.section}>
        <div className={styles.prose}>
          <p>
            DataRateKit maintains a focused suite of browser-based calculation utilities designed for internet download planning, upstream bandwidth allocation, storage interface bottleneck analysis, telecom unit conversions, video bitrate storage forecasting, and internet data quota tracking.
          </p>
          <p>
            This document outlines the explicit mathematical formulas, unit standards, planning assumptions, validation rules, and structural limitations governing every calculation engine on DataRateKit. All calculations are executed locally within the client browser using deterministic mathematical models derived from user inputs.
          </p>
          <div className={styles.callout}>
            <strong>Scope of Documentation:</strong> DataRateKit models theoretical and user-adjusted transfer scenarios based on user-supplied parameters. DataRateKit does not run active network probes, measure physical broadband lines, benchmark installed storage hardware, or monitor remote server health.
          </div>
        </div>
      </section>

      {/* 1. Core Unit Conventions */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>1. Core Unit Conventions</h2>
        <div className={styles.prose}>
          <p>
            Digital data calculations frequently produce discrepancies when telecommunications ratings (quoted in bits) are conflated with filesystem storage measurements (quoted in bytes), or when decimal powers of 10 are confused with binary powers of 2. DataRateKit enforces explicit mathematical multipliers across all calculation engines:
          </p>

          <h3 className={styles.subheading}>Fundamental Bit-to-Byte Identity</h3>
          <p>
            Across all engines, the bit-to-byte relationship is governed strictly by the mathematical identity:
          </p>
          <div className={styles.formulaBlock}>
            1 Byte = 8 bits
          </div>

          <h3 className={styles.subheading}>Decimal SI Units (Base 10)</h3>
          <p>
            Decimal units follow the International System of Units (SI) standard, utilizing exact powers of 1,000 ($10^3$):
          </p>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Quantity</th>
                  <th className={styles.th}>Symbol</th>
                  <th className={styles.th}>Byte Equivalent</th>
                  <th className={styles.th}>Base 10 Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={styles.td}>Kilobyte</td>
                  <td className={styles.td}>KB</td>
                  <td className={styles.td}>1,000 Bytes</td>
                  <td className={styles.td}>$10^3$</td>
                </tr>
                <tr>
                  <td className={styles.td}>Megabyte</td>
                  <td className={styles.td}>MB</td>
                  <td className={styles.td}>1,000,000 Bytes</td>
                  <td className={styles.td}>$10^6$</td>
                </tr>
                <tr>
                  <td className={styles.td}>Gigabyte</td>
                  <td className={styles.td}>GB</td>
                  <td className={styles.td}>1,000,000,000 Bytes</td>
                  <td className={styles.td}>$10^9$</td>
                </tr>
                <tr>
                  <td className={styles.td}>Terabyte</td>
                  <td className={styles.td}>TB</td>
                  <td className={styles.td}>1,000,000,000,000 Bytes</td>
                  <td className={styles.td}>$10^{12}$</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className={styles.subheading}>Binary IEC Units (Base 2)</h3>
          <p>
            Binary units follow the International Electrotechnical Commission (IEC) standard, utilizing exact powers of 1,024 ($2^{10}$):
          </p>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Quantity</th>
                  <th className={styles.th}>Symbol</th>
                  <th className={styles.th}>Byte Equivalent</th>
                  <th className={styles.th}>Base 2 Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={styles.td}>Kibibyte</td>
                  <td className={styles.td}>KiB</td>
                  <td className={styles.td}>1,024 Bytes</td>
                  <td className={styles.td}>$2^{10}$</td>
                </tr>
                <tr>
                  <td className={styles.td}>Mebibyte</td>
                  <td className={styles.td}>MiB</td>
                  <td className={styles.td}>1,048,576 Bytes</td>
                  <td className={styles.td}>$2^{20}$</td>
                </tr>
                <tr>
                  <td className={styles.td}>Gibibyte</td>
                  <td className={styles.td}>GiB</td>
                  <td className={styles.td}>1,073,741,824 Bytes</td>
                  <td className={styles.td}>$2^{30}$</td>
                </tr>
                <tr>
                  <td className={styles.td}>Tebibyte</td>
                  <td className={styles.td}>TiB</td>
                  <td className={styles.td}>1,099,511,627,776 Bytes</td>
                  <td className={styles.td}>$2^{40}$</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            <em>Tool Support Note:</em> IEC binary storage units (KiB, MiB, GiB, TiB) are supported in the core transfer library, <Link href="/">Download Time Calculator</Link>, <Link href="/upload-time-calculator">Upload Time Calculator</Link>, <Link href="/file-transfer-time-calculator">File Transfer Time Calculator</Link>, and <Link href="/mbps-to-mbs">Mbps to MB/s Converter</Link>. The <Link href="/video-file-size-calculator">Video File Size Calculator</Link> and <Link href="/data-usage-calculator">Internet Data Usage Calculator</Link> strictly utilize SI decimal units standard in consumer video container bitrates and ISP billing quotas.
          </p>

          <h3 className={styles.subheading}>Network Rate Multipliers (Telecommunications Standard)</h3>
          <p>
            Telecommunication rates and internet connection speeds are universally expressed in decimal bits per second:
          </p>
          <ul>
            <li><strong>1 kbps:</strong> 1,000 bits per second</li>
            <li><strong>1 Mbps:</strong> 1,000,000 bits per second (125,000 Bytes/s = 0.125 MB/s)</li>
            <li><strong>1 Gbps:</strong> 1,000,000,000 bits per second (125,000,000 Bytes/s = 125 MB/s)</li>
          </ul>
        </div>
      </section>

      {/* 2. Nominal Rates vs Planning Assumptions */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>2. Nominal Rates vs. Planning Assumptions</h2>
        <div className={styles.prose}>
          <p>
            A central distinction in DataRateKit calculation architecture is the difference between theoretical nominal rates and user-adjusted planning assumptions:
          </p>
          <ul>
            <li>
              <strong>Nominal Line Rate (100% Theoretical Ceiling):</strong> The maximum theoretical data transmission rate possible under ideal conditions, assuming zero protocol framing overhead, zero transport contention, and unconstrained remote server delivery.
            </li>
            <li>
              <strong>Available Bandwidth Share (%):</strong> An editable scenario input representing the portion of total connection capacity dedicated to a specific task, allowing users to model background downloads or reserve capacity for concurrent household streaming or VoIP calls.
            </li>
            <li>
              <strong>Planning Efficiency (%):</strong> A user-adjustable factor (commonly defaulting to 90% for broadband downloads or 85% for local bus transfers) that accounts for real-world protocol encapsulation (TCP/IP packet headers, TLS/SSL encryption, ACK packets, and file system management).
            </li>
            <li>
              <strong>Calculated Effective Throughput:</strong> The sustained payload throughput obtained after applying bandwidth allocation limits, remote server caps, and planning efficiency factors.
            </li>
          </ul>
          <div className={styles.callout}>
            <strong>Important Clarification:</strong> Planning percentages (such as 90% or 85%) are user-configurable planning parameters, NOT empirical measurements, laboratory benchmarks, or guaranteed performance metrics. Users can freely adjust efficiency from 1% to 100% to simulate aggressive, nominal, or highly conservative environments.
          </div>
        </div>
      </section>

      {/* 3. Download Calculation Model */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>3. Download Calculation Model</h2>
        <div className={styles.prose}>
          <p>
            The <Link href="/">Download Time Calculator</Link> models end-to-end internet download performance across a multi-stage path: connection line rate, available bandwidth allocation, optional remote host ceiling, and planning efficiency.
          </p>

          <h3 className={styles.subheading}>Mathematical Formulations</h3>
          <p>1. Available Connection Bandwidth (Bytes/s):</p>
          <div className={styles.formulaBlock}>
            AvailableConnectionRate = NominalConnectionRate × (AvailableBandwidthPercent / 100)
          </div>

          <p>2. Active Path Ceiling (accounting for optional remote CDN/server cap):</p>
          <div className={styles.formulaBlock}>
            PathCeiling = ServerCapEnabled ? min(AvailableConnectionRate, ServerCapRate) : AvailableConnectionRate
          </div>

          <p>3. Sustained Effective Throughput:</p>
          <div className={styles.formulaBlock}>
            EffectiveThroughput = PathCeiling × (PlanningEfficiencyPercent / 100)
          </div>

          <p>4. Download Duration (Seconds):</p>
          <div className={styles.formulaBlock}>
            DownloadDuration = FileSizeBytes / EffectiveThroughput
          </div>

          <p>5. Theoretical Duration (Baseline Comparison at 100% Line Speed):</p>
          <div className={styles.formulaBlock}>
            TheoreticalDuration = FileSizeBytes / NominalConnectionRate
          </div>

          <h3 className={styles.subheading}>Operating Modes</h3>
          <ul>
            <li>
              <strong>Mode A (Download Time):</strong> Solves for completion duration and theoretical line-rate baseline from entered file size and connection parameters.
            </li>
            <li>
              <strong>Mode B (Download Bottleneck Analysis):</strong> Identifies the primary limiting stage (Internet Connection, Local Bandwidth Share, Remote Server/CDN Cap, or Balanced) and computes remaining headroom percentages across non-bottleneck components.
            </li>
            <li>
              <strong>Mode C (Required Connection Speed):</strong> Computes the minimum broadband plan speed required to download a given file within a designated deadline at target efficiency and allocation. Includes a feasibility check: if an active remote server cap prevents reaching the required speed even with infinite broadband bandwidth, the engine flags the target as infeasible.
            </li>
          </ul>
        </div>
      </section>

      {/* 4. Upload Planning Model */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>4. Upload Planning Model</h2>
        <div className={styles.prose}>
          <p>
            The <Link href="/upload-time-calculator">Upload Time Calculator</Link> is engineered for asymmetric broadband and commercial upstream links, incorporating reserved headroom and per-file batch processing overhead.
          </p>

          <h3 className={styles.subheading}>Mathematical Formulations</h3>
          <p>1. Effective Upstream Bandwidth (bits/s):</p>
          <div className={styles.formulaBlock}>
            EffectiveBps = NominalBps × (ThroughputFactorPercent / 100) × (1 - ReservedBandwidthPercent / 100)
          </div>

          <p>2. Unallocated Reserved Bandwidth (bits/s):</p>
          <div className={styles.formulaBlock}>
            ReservedBps = NominalBps × (ThroughputFactorPercent / 100) × (ReservedBandwidthPercent / 100)
          </div>

          <p>3. Payload Transfer Duration and Batch Overhead:</p>
          <div className={styles.formulaBlock}>
            PayloadDurationSeconds = (FileSizeBytes × 8) / EffectiveBps{'\n'}
            BatchOverheadSeconds = floor(FileCount) × PerFileOverheadSeconds{'\n'}
            TotalDurationSeconds = PayloadDurationSeconds + BatchOverheadSeconds
          </div>

          <h3 className={styles.subheading}>Operating Modes</h3>
          <ul>
            <li>
              <strong>Mode A (Upload Time):</strong> Calculates total upload time, separating pure payload transfer time from cumulative batch setup overhead.
            </li>
            <li>
              <strong>Mode B (Required Upload Speed):</strong> Computes the nominal upload speed required to finish an upload within a target deadline:
              <div className={styles.formulaBlock}>
                UsableWindowSeconds = TargetWindowSeconds - BatchOverheadSeconds{'\n'}
                RequiredEffectiveBps = (FileSizeBytes × 8) / UsableWindowSeconds{'\n'}
                RequiredNominalBps = RequiredEffectiveBps / (ThroughputFactorRatio × AvailableRatio)
              </div>
              If batch overhead equals or exceeds the target window, the scenario is flagged as infeasible.
            </li>
            <li>
              <strong>Mode C (Upload Window Capacity):</strong> Calculates the maximum payload volume deliverable over a designated window (e.g. overnight or business shift):
              <div className={styles.formulaBlock}>
                UsableWindowSeconds = max(0, TargetWindowSeconds - SetupReserveSeconds){'\n'}
                MaximumPayloadBytes = (EffectiveBps × UsableWindowSeconds) / 8
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* 5. File Transfer Bottleneck Model */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>5. File Transfer Bottleneck Model</h2>
        <div className={styles.prose}>
          <p>
            The <Link href="/file-transfer-time-calculator">File Transfer Time Calculator</Link> models multi-gigabyte local storage and high-speed network transfers across a serial three-stage hardware pipeline:
          </p>
          <div className={styles.formulaBlock}>
            Source Storage Read ───▶ Interface / Bus / Network ───▶ Destination Storage Write
          </div>

          <h3 className={styles.subheading}>Bottleneck Identification & Headroom</h3>
          <p>
            Throughput across a serial transfer pipeline cannot exceed the slowest link in the transmission chain:
          </p>
          <div className={styles.formulaBlock}>
            RawBottleneckBytesPerSec = min(SourceReadSpeed, InterfaceSpeed, DestinationWriteSpeed)
          </div>
          <p>
            When two or three stages match within a numerical tolerance ($\epsilon = 10^{-4}$ Bytes/s), the state is classified as <em>Balanced (Tie)</em>. For stages operating faster than the bottleneck, percentage headroom is quantified as:
          </p>
          <div className={styles.formulaBlock}>
            HeadroomPercent = ((StageSpeed - RawBottleneck) / RawBottleneck) × 100
          </div>

          <h3 className={styles.subheading}>Operating Modes</h3>
          <ul>
            <li>
              <strong>Mode A (Transfer Duration):</strong> Combines effective throughput ($RawBottleneck \times Efficiency$) with optional file batch overhead ($\lfloor FileCount \rfloor \times PerFileOverhead$) to output total transfer time and sustained throughput.
            </li>
            <li>
              <strong>Mode B (Bottleneck Analysis):</strong> Diagnoses which component restricts transfer throughput, provides stage-by-stage headroom percentages, and provides actionable recommendations regarding interface versus drive upgrades.
            </li>
            <li>
              <strong>Mode C (Required Interface Speed):</strong> Solves for the interface bandwidth required to achieve a target duration, while verifying whether the storage drives can sustain the required rate:
              <div className={styles.formulaBlock}>
                StorageCeiling = min(SourceReadSpeed, DestinationWriteSpeed)
              </div>
              If the required rate exceeds the storage ceiling, the target is flagged as infeasible under current storage hardware.
            </li>
          </ul>
        </div>
      </section>

      {/* 6. Mbps to MB/s Conversion Model */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>6. Mbps ↔ MB/s Conversion Model</h2>
        <div className={styles.prose}>
          <p>
            The <Link href="/mbps-to-mbs">Mbps to MB/s Converter</Link> provides bidirectional mathematical conversions between networking bitrates and filesystem byte rates.
          </p>

          <h3 className={styles.subheading}>Decimal Mathematical Conversion (SI Standard)</h3>
          <div className={styles.formulaBlock}>
            MB/s = Mbps ÷ 8{'\n'}
            Mbps = MB/s × 8
          </div>
          <p>
            <em>Verified Worked Examples:</em>
          </p>
          <ul>
            <li><strong>100 Mbps:</strong> 100 ÷ 8 = 12.5 MB/s</li>
            <li><strong>1,000 Mbps (1 Gbps):</strong> 1,000 ÷ 8 = 125 MB/s</li>
            <li><strong>25 MB/s:</strong> 25 × 8 = 200 Mbps</li>
          </ul>

          <h3 className={styles.subheading}>Distinction Between Decimal MB/s and Binary MiB/s</h3>
          <p>
            Decimal megabytes per second (MB/s) operate on base 10 (1,000,000 Bytes/s), standard in network transmission and drive manufacturer specifications. Binary mebibytes per second (MiB/s) operate on base 2 (1,048,576 Bytes/s), standard in certain operating system transfer dialogs (e.g. Windows Explorer).
          </p>
          <div className={styles.formulaBlock}>
            100 Mbps = 12.5 MB/s (Decimal SI) = 11.921 MiB/s (Binary IEC)
          </div>
        </div>
      </section>

      {/* 7. Video File Size Model */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>7. Video File Size Model</h2>
        <div className={styles.prose}>
          <p>
            The <Link href="/video-file-size-calculator">Video File Size Calculator</Link> models digital media storage from continuous stream bitrates and runtime parameters.
          </p>

          <h3 className={styles.subheading}>Mathematical Formulations</h3>
          <div className={styles.formulaBlock}>
            TotalBitrateBps = VideoBitrateBps + AudioBitrateBps{'\n'}
            TotalBits = TotalBitrateBps × DurationSeconds{'\n'}
            TotalBytes = TotalBits / 8
          </div>

          <h3 className={styles.subheading}>Operating Modes</h3>
          <ul>
            <li>
              <strong>Mode A (Find File Size):</strong> Computes total file size from video bitrate, audio bitrate, and duration in hours, minutes, and seconds.
            </li>
            <li>
              <strong>Mode B (Find Required Bitrate):</strong> Computes the maximum video bitrate permissible to constrain a video within a specific storage ceiling (e.g. email attachment or disc limit):
              <div className={styles.formulaBlock}>
                TargetTotalBps = (TargetFileSizeBytes × 8) / DurationSeconds{'\n'}
                RequiredVideoBps = TargetTotalBps - AudioBitrateBps
              </div>
              If audio bitrate exceeds the target file capacity, the engine flags the state with an explanatory error.
            </li>
            <li>
              <strong>Mode C (Find Maximum Duration):</strong> Computes the maximum recording time allowed by available flash storage capacity:
              <div className={styles.formulaBlock}>
                DurationSeconds = (AvailableStorageBytes × 8) / TotalBitrateBps
              </div>
            </li>
          </ul>
          <div className={styles.callout}>
            <strong>Quality Clarification:</strong> The calculator computes container bitrate storage requirements strictly according to mathematical volume. It does not measure subjective visual fidelity or codec efficiency. Visual quality at a given bitrate depends heavily on the compression efficiency of the underlying codec (e.g. AV1, HEVC/H.265, AVC/H.264) and scene motion complexity.
          </div>
        </div>
      </section>

      {/* 8. Internet Data Usage Model */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>8. Internet Data Usage Model</h2>
        <div className={styles.prose}>
          <p>
            The <Link href="/data-usage-calculator">Internet Data Usage Calculator</Link> aggregates data volume consumption across multiple simultaneous online activities, active household devices, and billing cycles.
          </p>

          <h3 className={styles.subheading}>Mathematical Formulations</h3>
          <p>For each configured activity:</p>
          <div className={styles.formulaBlock}>
            DailyDurationSeconds = (Hours × 3600) + (Minutes × 60){'\n'}
            DailyBytes = RateInBytesPerSecond × DailyDurationSeconds × DeviceCount{'\n'}
            WeeklyBytes = DailyBytes × 7{'\n'}
            BillingPeriodBytes = DailyBytes × BillingDays
          </div>
          <p>Total data consumption is the direct summation across all active activities:</p>
          <div className={styles.formulaBlock}>
            TotalBillingBytes = Σ (ActivityBillingBytes)
          </div>

          <h3 className={styles.subheading}>Monthly Data Cap Utilization</h3>
          <div className={styles.formulaBlock}>
            UtilizationPercent = (TotalBillingBytes / DataCapBytes) × 100{'\n'}
            DaysUntilCapExhaustion = DataCapBytes / TotalDailyBytes
          </div>

          <h3 className={styles.subheading}>Verified Presets Policy</h3>
          <p>
            Preset activity values provided in the calculator are derived strictly from documented provider specifications, classified into two factual tiers:
          </p>
          <ul>
            <li>
              <strong>Type A (Official Usage Documentation):</strong> Streaming services that officially publish volumetric data usage rates (e.g. Netflix Help Center documentation specifying Low up to 0.3 GB/hr, Medium up to 0.7 GB/hr, and 4K up to 7 GB/hr).
            </li>
            <li>
              <strong>Type B (Official Stream Bitrate Documentation):</strong> Streaming platforms that officially publish stream bitrates (e.g. Spotify official audio stream documentation specifying 24 kbps, 96 kbps, 160 kbps, and 320 kbps; YouTube Music official audio documentation).
            </li>
          </ul>
          <p>
            Third-party estimates, blog claims, and arbitrary averages are excluded from presets. All preset values remain fully editable by the user.
          </p>
        </div>
      </section>

      {/* 9. Presets and Reference Values Classification */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>9. Presets and Reference Values Classification</h2>
        <div className={styles.prose}>
          <p>
            To maintain technical transparency, values presented across DataRateKit are classified into distinct evidentiary tiers:
          </p>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Class</th>
                  <th className={styles.th}>Category</th>
                  <th className={styles.th}>Examples in Code</th>
                  <th className={styles.th}>Evidentiary Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={styles.td}><strong>Class A</strong></td>
                  <td className={styles.td}>Mathematical Constants</td>
                  <td className={styles.td}>1 Byte = 8 bits, 1 GB = $10^9$ Bytes</td>
                  <td className={styles.td}>Absolute mathematical fact.</td>
                </tr>
                <tr>
                  <td className={styles.td}><strong>Class B</strong></td>
                  <td className={styles.td}>Interface Physical Ceilings</td>
                  <td className={styles.td}>Gigabit Ethernet (1 Gbps), USB 3.0 (5 Gbps)</td>
                  <td className={styles.td}>Nominal bus specification ceilings.</td>
                </tr>
                <tr>
                  <td className={styles.td}><strong>Class C</strong></td>
                  <td className={styles.td}>Planning Assumptions</td>
                  <td className={styles.td}>90% broadband efficiency, 85% file transfer factor</td>
                  <td className={styles.td}>User-editable scenario inputs.</td>
                </tr>
                <tr>
                  <td className={styles.td}><strong>Class D</strong></td>
                  <td className={styles.td}>Example Hardware Throughput Presets</td>
                  <td className={styles.td}>NVMe PCIe 4.0 (~7,000 MB/s), HDD (~180 MB/s)</td>
                  <td className={styles.td}>Editable example throughput values used for planning scenarios. They are not direct measurements of user devices and do not represent guaranteed manufacturer performance.</td>
                </tr>
                <tr>
                  <td className={styles.td}><strong>Class E</strong></td>
                  <td className={styles.td}>Documented Activity Presets</td>
                  <td className={styles.td}>Netflix 4K (7 GB/hr), Spotify High (160 kbps)</td>
                  <td className={styles.td}>Officially documented provider benchmarks.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 10. Rounding and Formatting Rules */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>10. Rounding and Display Formatting</h2>
        <div className={styles.prose}>
          <p>
            Calculations use JavaScript number precision internally and formatting is applied when values are displayed:
          </p>
          <ul>
            <li>
              <strong>Display Rounding Helper:</strong> Number.EPSILON is used in the display-rounding helper to reduce common binary floating-point rounding artifacts before formatting (e.g. avoiding displaying 12.4999999999997 instead of 12.5).
            </li>
            <li>
              <strong>Throughput Display:</strong> Effective speeds and rates are formatted up to 2 decimal places with localized thousands separators.
            </li>
            <li>
              <strong>Duration Formatting:</strong> Total seconds are decomposed into integer days, hours, minutes, and seconds. Durations between 0 and 1 second display as <code>&lt; 1s</code> in short format and <code>0.xx seconds</code> in detailed format.
            </li>
            <li>
              <strong>Data Volume Formatting:</strong> Byte totals dynamically scale to MB (&lt; 1 GB, 2 decimals), GB (1 GB to 1 TB, 3 decimals), and TB (&ge; 1 TB, 3 decimals).
            </li>
          </ul>
        </div>
      </section>

      {/* 11. Input Validation and Boundary Handling */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>11. Input Validation and Boundary Handling</h2>
        <div className={styles.prose}>
          <p>
            All inputs are rigorously sanitized before entering calculation pipelines:
          </p>
          <ul>
            <li>
              <strong>Numeric Validation:</strong> Empty strings, <code>null</code>, <code>undefined</code>, <code>NaN</code>, and negative values are intercepted by <code>validatePositiveNumber</code>.
            </li>
            <li>
              <strong>Upper Bounds:</strong> Shared numeric validation applies an upper safety bound of <code>1e15</code> to supported numeric inputs to prevent impractically large calculation values.
            </li>
            <li>
              <strong>Efficiency Bounds:</strong> Planning efficiency and throughput factors are validated between 1% and 100%. Reserved bandwidth is constrained between 0% and 99%.
            </li>
            <li>
              <strong>Infeasible State Handling:</strong> Scenarios where physical constraints make completion impossible (e.g., target upload window shorter than batch overhead, or required speed exceeding remote server delivery caps) are detected and flagged with explicit diagnostic notes rather than returning invalid mathematical results.
            </li>
          </ul>
        </div>
      </section>

      {/* 12. Shareable Calculator State */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>12. Shareable Calculator State</h2>
        <div className={styles.prose}>
          <p>
            Supported calculators encode selected configuration parameters directly into URL query strings. This enables shareable, reproducible calculation states:
          </p>
          <ul>
            <li>
              <strong>Client-Side State Synchronization:</strong> Selected inputs (such as mode, data size, speed, and efficiency) serialize into URL query parameters without storing user inputs in an application database.
            </li>
            <li>
              <strong>Canonical Hygiene:</strong> All calculator pages emit clean, self-referential canonical tags without query strings, preserving clean indexation signals for search engines.
            </li>
            <li>
              <strong>Defensive Parsing:</strong> Query parameters are defensively parsed. If parameters contain invalid types, unsupported units, or out-of-range values, the engine automatically falls back to verified safe defaults.
            </li>
          </ul>
        </div>
      </section>

      {/* 13. Practical Limitations & Environmental Variance */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>13. Practical Limitations & Environmental Variance</h2>
        <div className={styles.prose}>
          <p>
            While DataRateKit calculations are mathematically exact representations of entered inputs, physical real-world transfers are subject to real-time environmental factors that cannot be modeled by deterministic calculators:
          </p>
          <div className={styles.callout}>
            <strong>Real-World Variables Beyond Static Modeling:</strong>
            <ul>
              <li><strong>Transport Protocol Overhead:</strong> TCP slow start, packet loss, TCP window scaling, and dynamic retransmission overhead.</li>
              <li><strong>Wireless Interference:</strong> Wi-Fi physical obstructions, RF interference, channel contention, and distance degradation.</li>
              <li><strong>ISP Traffic Management:</strong> Upstream route peering congestion, dynamic throttling during peak hours, and bufferbloat.</li>
              <li><strong>Remote Server Constraints:</strong> CDN edge cache misses, remote origin server CPU limits, and per-connection bandwidth throttles.</li>
              <li><strong>Storage Thermal & Cache Limits:</strong> Solid-state drive SLC cache exhaustion during sustained writes, thermal throttling, and filesystem metadata overhead for workloads with millions of small files.</li>
              <li><strong>Variable Bitrate Encoding:</strong> Digital video streams utilize variable bitrate (VBR) encoding where scene complexity dynamically alters momentary bitrates.</li>
            </ul>
          </div>
          <p>
            DataRateKit calculators provide planning baselines and structural models, not real-time physical diagnostics or performance warranties.
          </p>
        </div>
      </section>

      {/* 14. Testing & Verification Policy */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>14. Automated Testing & Verification Policy</h2>
        <div className={styles.prose}>
          <p>
            To ensure continuous mathematical integrity and prevent regression errors, the DataRateKit codebase is protected by automated test suites executed prior to any deployment:
          </p>
          <ul>
            <li>
              <strong>Formula & Math Unit Tests:</strong> Validate exact calculation engine outputs against verified mathematical baselines across all six utilities.
            </li>
            <li>
              <strong>Boundary & Edge Case Tests:</strong> Verify system behavior under extreme values, sub-second durations, fractional inputs, and maximum capacity limits.
            </li>
            <li>
              <strong>URL State & Parser Tests:</strong> Test query string serialization, parameter validation, and fallback handling for malformed or missing query arguments.
            </li>
            <li>
              <strong>Static SSR Visibility Tests:</strong> Ensure all core calculator pages and informational documentation render complete static HTML during build time without relying on client-side loading shells or error fallbacks.
            </li>
          </ul>
        </div>
      </section>

      {/* 15. Questions & Technical Feedback */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>15. Questions & Technical Feedback</h2>
        <div className={styles.prose}>
          <p>
            We welcome technical review of our calculation methodologies. If you identify a mathematical discrepancy, an ambiguous planning assumption, or an outdated preset reference, please submit technical feedback via our <Link href="/contact">Contact Page</Link>.
          </p>
          <p>
            For information regarding site identity, please visit our <Link href="/about">About Page</Link>. For terms of use and liability disclaimers, review our <Link href="/terms">Terms of Use</Link> and <Link href="/privacy">Privacy Policy</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}