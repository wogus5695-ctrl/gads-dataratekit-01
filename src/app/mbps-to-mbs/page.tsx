import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { MbpsConverter } from '@/components/converter/MbpsConverter';
import { convertSpeed } from '@/lib/transfer';
import { getCanonicalUrl } from '@/config/site';
import styles from '../page.module.css';

const title = 'Mbps to MB/s Converter — Megabits to Megabytes per Second';
const description =
  'Convert Mbps to MB/s instantly, or convert MB/s back to Mbps. 100 Mbps equals 12.5 MB/s using 8 bits per byte.';
const canonical = getCanonicalUrl('/mbps-to-mbs');

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

const COMMON_CONVERSION_RATES = [10, 50, 100, 300, 500, 1000];

function getConversionTableRows() {
  return COMMON_CONVERSION_RATES.map((mbps) => {
    const res = convertSpeed(mbps, 'Mbps', 'MB/s');
    return {
      mbps: `${mbps.toLocaleString()} Mbps`,
      mbs: res.success ? res.data.formatted : '—',
    };
  });
}

const REVERSE_CONVERSION_RATES = [1, 10, 12.5, 100, 125];

function getReverseConversionRows() {
  return REVERSE_CONVERSION_RATES.map((mbs) => {
    const res = convertSpeed(mbs, 'MB/s', 'Mbps');
    return {
      mbs: `${mbs} MB/s`,
      mbps: res.success ? res.data.formatted : '—',
    };
  });
}

export default function MbpsConverterPage() {
  const conversionRows = getConversionTableRows();
  const reverseRows = getReverseConversionRows();

  return (
    <main className={styles.pageContainer}>
      <header className={styles.headerSection}>
        <h1 className={styles.title}>Mbps to MB/s Converter</h1>
        <p className={styles.description}>
          Convert megabits per second (Mbps) to megabytes per second (MB/s), or convert back in the other direction. 1 byte equals 8 bits, so 100 Mbps equals 12.5 MB/s.
        </p>
      </header>

      <MbpsConverter />

      {/* 1. Mbps to MB/s formula */}
      <section className={styles.contentSection} aria-labelledby="formula-heading">
        <h2 id="formula-heading" className={styles.supportingTitle}>
          Mbps to MB/s conversion formula
        </h2>
        <div className={styles.prose}>
          <p>
            The mathematical relationship between megabits per second (Mbps) and megabytes per second (MB/s) is founded on the definition of digital data units:
          </p>
          <div>
            <div className={styles.formulaBox}>
              MB/s = Mbps ÷ 8 &nbsp;&nbsp;|&nbsp;&nbsp; Mbps = MB/s × 8
            </div>
          </div>
          <p>
            Because 1 byte consists of exactly 8 bits, converting from megabits per second to megabytes per second requires dividing by 8. Conversely, converting from megabytes per second to megabits per second requires multiplying by 8.
          </p>
          <p>
            This converter uses standard decimal (SI) multipliers, where 1 megabit equals 1,000,000 bits and 1 megabyte equals 1,000,000 bytes. This calculation provides exact mathematical unit equivalence and does not incorporate reductions for protocol overhead, network congestion, or device performance.
          </p>
        </div>
      </section>

      {/* 2. Common Mbps to MB/s conversions */}
      <section className={styles.contentSection} aria-labelledby="reference-heading">
        <h2 id="reference-heading" className={styles.supportingTitle}>
          Common Mbps to MB/s conversions
        </h2>
        <div className={styles.prose}>
          <p>
            The reference table below shows mathematical unit conversions for frequently referenced network connection rates.
          </p>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.benchmarkTable} aria-label="Mbps to MB/s reference table">
            <thead>
              <tr>
                <th scope="col">Connection speed (Mbps)</th>
                <th scope="col">Mathematical equivalent (MB/s)</th>
              </tr>
            </thead>
            <tbody>
              {conversionRows.map((row) => (
                <tr key={row.mbps}>
                  <th scope="row" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {row.mbps}
                  </th>
                  <td>{row.mbs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.prose} style={{ marginTop: '1.5rem' }}>
          <h3 className={styles.subheading}>Reverse conversions (MB/s to Mbps)</h3>
          <p>
            When file transfer utilities or download managers report throughput in megabytes per second, multiply by 8 to find the equivalent bit rate:
          </p>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.benchmarkTable} aria-label="MB/s to Mbps reference table">
            <thead>
              <tr>
                <th scope="col">Transfer rate (MB/s)</th>
                <th scope="col">Equivalent bit rate (Mbps)</th>
              </tr>
            </thead>
            <tbody>
              {reverseRows.map((row) => (
                <tr key={row.mbs}>
                  <th scope="row" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {row.mbs}
                  </th>
                  <td>{row.mbps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Why 100 Mbps equals 12.5 MB/s */}
      <section className={styles.contentSection} aria-labelledby="why-100mbps-heading">
        <h2 id="why-100mbps-heading" className={styles.supportingTitle}>
          Why 100 Mbps equals 12.5 MB/s
        </h2>
        <div className={styles.prose}>
          <p>
            A common point of confusion is why a 100 Mbps internet plan yields a maximum transfer rate of 12.5 MB/s rather than 100 MB/s.
          </p>
          <p>
            The difference stems entirely from unit definitions rather than network inefficiency or signal loss:
          </p>
          <ul className={styles.itemList}>
            <li>
              <strong>100 megabits per second:</strong> Represents 100,000,000 individual bits transmitted each second.
            </li>
            <li>
              <strong>8 bits per byte:</strong> Storage systems organize bits into 8-bit groups called bytes.
            </li>
            <li>
              <strong>The division:</strong> 100,000,000 bits ÷ 8 = 12,500,000 bytes per second.
            </li>
            <li>
              <strong>The result:</strong> 12,500,000 bytes per second equals exactly 12.5 megabytes per second (MB/s).
            </li>
          </ul>
          <p>
            Therefore, 12.5 MB/s represents 100% of the mathematical data rate for a 100 Mbps stream.
          </p>
        </div>
      </section>

      {/* 4. Bits vs. bytes and capitalization rules */}
      <section className={styles.contentSection} aria-labelledby="bits-vs-bytes-heading">
        <h2 id="bits-vs-bytes-heading" className={styles.supportingTitle}>
          Bits vs. bytes and capitalization rules
        </h2>
        <div className={styles.prose}>
          <p>
            In digital computing, letter casing in unit abbreviations carries a critical mathematical distinction:
          </p>
          <ul className={styles.itemList}>
            <li>
              <strong>Lowercase &ldquo;b&rdquo; stands for bits:</strong> Used in units like bit, Kbps, Mbps, and Gbps. Bits represent the basic binary unit of network communication.
            </li>
            <li>
              <strong>Uppercase &ldquo;B&rdquo; stands for bytes:</strong> Used in units like byte, KB/s, MB/s, and GB/s. Bytes represent storage units (1 byte = 8 bits).
            </li>
            <li>
              <strong>Informal notation (&ldquo;MBps&rdquo;):</strong> Some software applications informally write &ldquo;MBps&rdquo; to denote megabytes per second. Because capitalization can be ambiguous in informal labels, DataRateKit uses <em>Mbps</em> for megabits per second and <em>MB/s</em> for megabytes per second to ensure clear distinction between bits and bytes.
            </li>
          </ul>
          <p>
            It is also important to differentiate between data volume and data transfer rates:
          </p>
          <ul className={styles.itemList}>
            <li>
              <strong>MB (Megabytes):</strong> Measures the total size of a stored file (such as a 500 MB video).
            </li>
            <li>
              <strong>MB/s (Megabytes per second):</strong> Measures how many megabytes are transferred each second.
            </li>
            <li>
              <strong>Mbps (Megabits per second):</strong> Measures how many megabits are transmitted across a network each second.
            </li>
          </ul>
        </div>
      </section>

      {/* 5. Decimal MB/s vs. binary MiB/s */}
      <section className={styles.contentSection} aria-labelledby="binary-units-heading">
        <h2 id="binary-units-heading" className={styles.supportingTitle}>
          Decimal MB/s vs. binary MiB/s
        </h2>
        <div className={styles.prose}>
          <p>
            Another source of discrepancy when comparing download rates across different operating systems is the distinction between decimal and binary unit standards:
          </p>
          <ul className={styles.itemList}>
            <li>
              <strong>Decimal SI units (MB/s):</strong> Uses the decimal mega prefix, where 1 megabyte (MB) = 1,000,000 bytes (10<sup>6</sup>). This calculator performs conversions using standard decimal MB/s.
            </li>
            <li>
              <strong>Binary IEC units (MiB/s):</strong> Uses the binary mebi prefix, where 1 mebibyte (MiB) = 1,048,576 bytes (2<sup>20</sup>). Some applications display binary-rate units such as MiB/s, while others use decimal MB/s.
            </li>
          </ul>
          <p>
            Because 1 MiB is approximately 4.86% larger than 1 MB, a transfer rate of 100 MB/s corresponds to approximately 95.37 MiB/s. Both numbers represent the exact same data transfer throughput on different unit scales.
          </p>
        </div>
      </section>

      {/* 6. How to read internet and transfer-speed labels */}
      <section className={styles.contentSection} aria-labelledby="speed-labels-heading">
        <h2 id="speed-labels-heading" className={styles.supportingTitle}>
          How to read internet and transfer-speed labels
        </h2>
        <div className={styles.prose}>
          <p>
            Understanding which unit a service or software is reporting helps set realistic performance expectations:
          </p>
          <ul className={styles.itemList}>
            <li>
              <strong>Internet service plans:</strong> Internet service rates are often expressed in Mbps or Gbps. A provider offering a &ldquo;300 Mbps&rdquo; package is quoting bandwidth in megabits per second.
            </li>
            <li>
              <strong>Transfer applications and file managers:</strong> Web browsers, cloud storage clients, and operating system file managers frequently report active transfer rates in MB/s (or MiB/s).
            </li>
          </ul>
          <p>
            <strong>Real-world throughput disclaimer:</strong> A mathematical unit conversion reflects theoretical equivalence and does not predict end-to-end application throughput. Observed transfer rates can differ due to protocol behavior, network conditions, Wi-Fi interference, remote service limits, and storage or device constraints.
          </p>
        </div>
      </section>

      {/* 7. Common conversion mistakes */}
      <section className={styles.contentSection} aria-labelledby="common-mistakes-heading">
        <h2 id="common-mistakes-heading" className={styles.supportingTitle}>
          Common conversion mistakes to avoid
        </h2>
        <div className={styles.prose}>
          <ul className={styles.itemList}>
            <li>
              <strong>Treating Mbps and MB/s as identical units:</strong> Overlooking the factor of 8 leads users to expect a 100 Mbps connection to download a 100 MB file in 1 second, when it mathematically requires at least 8 seconds.
            </li>
            <li>
              <strong>Forgetting the factor of 8:</strong> Multiplying when dividing is needed, or dividing when multiplying is needed. Remember: divide Mbps by 8 to get MB/s; multiply MB/s by 8 to get Mbps.
            </li>
            <li>
              <strong>Confusing lowercase &ldquo;b&rdquo; and uppercase &ldquo;B&rdquo;:</strong> Misreading unit labels in speed tests or transfer software, where &ldquo;b&rdquo; signifies bits and &ldquo;B&rdquo; signifies bytes.
            </li>
            <li>
              <strong>Mixing decimal MB/s with binary MiB/s:</strong> Comparing transfer progress from software using binary mebibytes (MiB/s) directly against decimal megabytes (MB/s) without accounting for the ~4.86% unit difference.
            </li>
            <li>
              <strong>Assuming unit-equivalent rate guarantees real application throughput:</strong> Expecting a 100 Mbps internet connection to consistently deliver 12.5 MB/s of payload without accounting for network routing, protocol headers, or server limitations.
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
              How many MB/s is 100 Mbps?
            </div>
            <div className={styles.faqAnswer}>
              100 Mbps equals exactly 12.5 MB/s. Because 1 byte contains 8 bits, divide 100 megabits per second by 8 to obtain 12.5 megabytes per second.
            </div>
          </div>

          <div className={styles.faqItem}>
            <div className={styles.faqQuestion}>
              Is 1 Gbps equal to 125 MB/s?
            </div>
            <div className={styles.faqAnswer}>
              Yes, in standard decimal SI units, 1 Gbps (1,000 Mbps) equals exactly 125 MB/s (1,000 ÷ 8). This represents mathematical unit equivalence; actual file download throughput may be lower due to protocol overhead and network conditions.
            </div>
          </div>

          <div className={styles.faqItem}>
            <div className={styles.faqQuestion}>
              Why does my 100 Mbps connection not always download at 12.5 MB/s?
            </div>
            <div className={styles.faqAnswer}>
              While 100 Mbps mathematically equals 12.5 MB/s, mathematical unit equivalence does not guarantee end-to-end application throughput. Protocol behavior, network conditions, retransmissions, and remote service limits can reduce application-level throughput.
            </div>
          </div>

          <div className={styles.faqItem}>
            <div className={styles.faqQuestion}>
              What is the difference between MB/s and MiB/s?
            </div>
            <div className={styles.faqAnswer}>
              MB/s (megabytes per second) uses the decimal SI prefix where 1 MB = 1,000,000 bytes. MiB/s (mebibytes per second) uses the binary IEC prefix where 1 MiB = 1,048,576 bytes. Because 1 MiB is approximately 4.86% larger than 1 MB, 100 MB/s equals approximately 95.37 MiB/s, representing the same physical data rate on a different measurement scale.
            </div>
          </div>

          <div className={styles.faqItem}>
            <div className={styles.faqQuestion}>
              Is Mbps the same as MBps or MB/s?
            </div>
            <div className={styles.faqAnswer}>
              In standard notation, Mbps uses a lowercase &ldquo;b&rdquo; for bits, while MB/s uses an uppercase &ldquo;B&rdquo; for bytes (1 byte = 8 bits). Although some software informally writes &ldquo;MBps&rdquo; to represent megabytes per second, standard technical notation uses Mbps for megabits and MB/s for megabytes to ensure clear distinction between bits and bytes.
            </div>
          </div>
        </div>
      </section>

      {/* 9. Related tools */}
      <section className={styles.contentSection} aria-labelledby="related-tools-heading">
        <nav className={styles.relatedTools} aria-label="Related tools">
          <span id="related-tools-heading">Need to calculate transfer duration or required speed?</span>
          <Link href="/" className={styles.relatedLink}>
            Download Time Calculator
          </Link>
          <span style={{ color: 'var(--border-strong)', margin: '0 0.5rem' }}>·</span>
          <Link href="/upload-time-calculator" className={styles.relatedLink}>
            Upload Time Calculator
          </Link>
          <span style={{ color: 'var(--border-strong)', margin: '0 0.5rem' }}>·</span>
          <Link href="/file-transfer-time-calculator" className={styles.relatedLink}>
            File Transfer Time Calculator
          </Link>
        </nav>
      </section>
    </main>
  );
}
