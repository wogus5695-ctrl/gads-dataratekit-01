import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCanonicalUrl } from '@/config/site';
import { DOWNLOAD_PAGES, getDownloadPageData } from '@/data/calculation-pages';
import styles from '@/app/calculation-answer.module.css';

interface Props {
  params: { size: string };
}

export const dynamicParams = false;

export function generateStaticParams() {
  return DOWNLOAD_PAGES.map((p) => ({ size: p.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const data = getDownloadPageData(params.size);
  if (!data) return {};

  const canonical = getCanonicalUrl(`/download-time/${data.slug}`);
  return {
    title: data.title,
    description: data.metaDescription,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title: data.title,
      description: data.metaDescription,
      url: canonical,
      type: 'article',
    },
  };
}

export default function DownloadTimeScenarioPage({ params }: Props) {
  const data = getDownloadPageData(params.size);
  if (!data) {
    notFound();
  }

  return (
    <main className={styles.contentContainer}>
      {/* Breadcrumb Navigation */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/">Download Calculator</Link>
        <span>/</span>
        <span>{data.sizeFormatted}</span>
      </nav>

      {/* Header */}
      <header className={styles.headerSection}>
        <h1 className={styles.title}>{data.h1}</h1>
        <div className={styles.subtitleBadge}>Broadband Download Reference & Planning Guide</div>
      </header>

      {/* Immediate Direct Answer Block */}
      <div className={styles.answerCard}>
        <div className={styles.answerLabel}>Direct Answer & Baseline</div>
        <p className={styles.answerMainText}>{data.directAnswerSummary}</p>
        <div className={styles.answerMetricsGrid}>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>Baseline Speed</span>
            <span className={styles.metricValue}>{data.defaultSpeedLabel}</span>
          </div>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>Planning Duration (90%)</span>
            <span className={styles.metricValue}>{data.defaultPlanningDuration}</span>
          </div>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>Theoretical Wire Time</span>
            <span className={styles.metricValue}>{data.defaultTheoreticalDuration}</span>
          </div>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>Effective Payload Rate</span>
            <span className={styles.metricValue}>{data.defaultEffectiveSpeed}</span>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Download Time Comparison Across Internet Speeds</h2>
        <div className={styles.prose}>
          <p>
            The table below contrasts nominal wire speed against realistic planning throughput for a <strong>{data.sizeFormatted}</strong> file. Planning time models a 90% throughput factor to account for TCP framing overhead, Wi-Fi loss, and real-world network variance.
          </p>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Broadband Plan</th>
                <th className={styles.th}>Theoretical Time (100%)</th>
                <th className={styles.th}>Planning Time (90%)</th>
                <th className={styles.th}>Effective Throughput</th>
              </tr>
            </thead>
            <tbody>
              {data.comparisonRows.map((row) => (
                <tr key={row.speedLabel}>
                  <td className={styles.td}><strong>{row.speedLabel}</strong></td>
                  <td className={styles.td}>{row.theoreticalDuration}</td>
                  <td className={styles.td}><strong>{row.planningDuration}</strong></td>
                  <td className={styles.td}>{row.effectiveMBs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Required Speed Table */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>What Internet Speed Do You Need for {data.sizeFormatted}?</h2>
        <div className={styles.prose}>
          <p>
            If you need to complete this download within a specific time window, your connection must deliver at least the following sustained throughput:
          </p>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Target Deadline</th>
                <th className={styles.th}>Required Sustained Rate</th>
                <th className={styles.th}>Minimum Recommended Plan (90% eff)</th>
              </tr>
            </thead>
            <tbody>
              {data.requiredSpeedRows.map((row) => (
                <tr key={row.deadlineLabel}>
                  <td className={styles.td}><strong>{row.deadlineLabel}</strong></td>
                  <td className={styles.td}>{row.requiredEffectiveMBs}</td>
                  <td className={styles.td}><strong>{row.requiredInternetPlanMbps}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Formula & Engine Details */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Calculation Formula & Planning Factors</h2>
        <div className={styles.prose}>
          <p>
            DataRateKit calculates download durations strictly using deterministic mathematical models derived from total byte volume and active path throughput:
          </p>
          <div className={styles.formulaBlock}>
            Total Bytes = {data.sizeGb.toLocaleString()} × 1,000,000,000 Bytes (SI Standard){'\n'}
            Effective Rate = min(Nominal Speed × Bandwidth Share, Remote Server Cap) × Efficiency Factor{'\n'}
            Download Time = Total Bytes / Effective Rate
          </div>
          <p>
            Advertised broadband speeds are expressed in megabits per second (Mbps). Since 8 bits equal 1 byte, a 100 Mbps connection maxes out at 12.5 MB/s theoretically. Applying a 90% planning factor yields an expected sustained throughput of 11.25 MB/s.
          </p>
        </div>
      </section>

      {/* Practical Considerations */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Real-World Transfer Considerations for {data.sizeFormatted}</h2>
        <div className={styles.prose}>
          <ul>
            {data.contextNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Interactive CTA */}
      <section className={styles.ctaBox}>
        <h3 className={styles.ctaTitle}>Need Custom Speeds, Server Caps, or Efficiency?</h3>
        <p className={styles.ctaText}>
          Use our interactive Download Time Calculator to adjust bandwidth allocations, test remote CDN delivery limits, and analyze transfer bottlenecks in real time.
        </p>
        <Link href={`/${data.calculatorQuery}`} className={styles.ctaButton}>
          Open Interactive Calculator with {data.sizeFormatted} Prefilled →
        </Link>
      </section>

      {/* Nearby Pages Navigation */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Other Common Download File Sizes</h2>
        <div className={styles.nearbyGrid}>
          {data.nearbyPages.map((page) => (
            <Link key={page.slug} href={page.href} className={styles.nearbyCard}>
              <span className={styles.nearbyCardTitle}>{page.label}</span>
              <span className={styles.nearbyCardDesc}>{page.description}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
