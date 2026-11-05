import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCanonicalUrl } from '@/config/site';
import {
  DOWNLOAD_SPEED_PAGES,
  getDownloadSpeedPageData,
} from '@/data/calculation-pages';
import styles from '@/app/calculation-answer.module.css';

interface Props {
  params: { speed: string };
}

export const dynamicParams = false;

export function generateStaticParams() {
  return DOWNLOAD_SPEED_PAGES.map((p) => ({ speed: p.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const data = getDownloadSpeedPageData(params.speed);
  if (!data) return {};

  const canonical = getCanonicalUrl(`/download-speed/${data.slug}`);
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

export default function DownloadSpeedScenarioPage({ params }: Props) {
  const data = getDownloadSpeedPageData(params.speed);
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
        <span>{data.speedFormatted}</span>
      </nav>

      {/* Header */}
      <header className={styles.headerSection}>
        <h1 className={styles.title}>{data.h1}</h1>
        <div className={styles.subtitleBadge}>Broadband Speed & File Transfer Guide</div>
      </header>

      {/* Immediate Direct Answer Block */}
      <div className={styles.answerCard}>
        <div className={styles.answerLabel}>Direct Answer & Nominal Rate</div>
        <p className={styles.answerMainText}>{data.directAnswerSummary}</p>
        <div className={styles.answerMetricsGrid}>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>Nominal Line Rate</span>
            <span className={styles.metricValue}>{data.speedFormatted} ({data.nominalMBs})</span>
          </div>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>Planning Rate (90% eff)</span>
            <span className={styles.metricValue}>{data.effectivePlanningMBs}</span>
          </div>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>10 GB Duration</span>
            <span className={styles.metricValue}>
              {data.fileSizeRows.find((r) => r.sizeGb === 10)?.planningDuration || 'N/A'}
            </span>
          </div>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>100 GB Duration</span>
            <span className={styles.metricValue}>
              {data.fileSizeRows.find((r) => r.sizeGb === 100)?.planningDuration || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* File Size Comparison Table */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Download Times by File Size at {data.speedFormatted}</h2>
        <div className={styles.prose}>
          <p>
            The table below compares estimated download durations at a sustained nominal speed of <strong>{data.speedFormatted}</strong> ({data.nominalMBs}) across standard downloadable file sizes. Planning duration incorporates a 90% real-world efficiency factor to account for TCP protocol headers and network routing variations:
          </p>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>File Size</th>
                <th className={styles.th}>Theoretical Duration (100%)</th>
                <th className={styles.th}>Planning Duration (90% eff)</th>
                <th className={styles.th}>Effective Throughput</th>
              </tr>
            </thead>
            <tbody>
              {data.fileSizeRows.map((row) => (
                <tr key={row.fileSizeLabel}>
                  <td className={styles.td}><strong>{row.fileSizeLabel}</strong></td>
                  <td className={styles.td}>{row.theoreticalDuration}</td>
                  <td className={styles.td}><strong>{row.planningDuration}</strong></td>
                  <td className={styles.td}>{row.transferSpeedMBs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Time Window Capacity Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>How Much Data Can You Download at {data.speedFormatted}?</h2>
        <div className={styles.prose}>
          <p>
            Depending on available time windows (such as a lunch break, an evening gaming session, or an overnight backup schedule), a continuous {data.speedFormatted} line yields the following total data volume:
          </p>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Time Window</th>
                <th className={styles.th}>Theoretical Maximum Capacity</th>
                <th className={styles.th}>Planning Usable Capacity (90% eff)</th>
              </tr>
            </thead>
            <tbody>
              {data.timeWindowRows.map((row) => (
                <tr key={row.windowLabel}>
                  <td className={styles.td}><strong>{row.windowLabel}</strong></td>
                  <td className={styles.td}>{row.theoreticalCapacityGb}</td>
                  <td className={styles.td}><strong>{row.planningCapacityGb}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Formula & Speed Unit Interpretation */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Mbps to MB/s Rate Conversion & Planning Formula</h2>
        <div className={styles.prose}>
          <p>
            Internet service providers advertise bandwidth in <strong>Megabits per second (Mbps)</strong>, whereas file sizes on disk are measured in <strong>Megabytes (MB)</strong> or <strong>Gigabytes (GB)</strong>. Because 1 Byte contains 8 bits:
          </p>
          <div className={styles.formulaBlock}>
            Nominal Throughput = {data.speedMbps} Mbps ÷ 8 = {data.nominalMBs}{'\n'}
            Planning Throughput = {data.nominalMBs} × 0.90 (90% Efficiency) = {data.effectivePlanningMBs}{'\n'}
            Estimated Time = File Size (MB) ÷ Usable Throughput (MB/s)
          </div>
          <p>
            <strong>Real-World Variance:</strong> The 90% planning factor models typical TCP window scaling and network contention. It represents a practical planning model rather than a guaranteed hardware speed.
          </p>
        </div>
      </section>

      {/* Practical Considerations */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Real-World Observations for {data.speedFormatted} Connections</h2>
        <div className={styles.prose}>
          <ul>
            {data.thresholdObservations.map((obs, idx) => (
              <li key={idx}>{obs}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Interactive CTA */}
      <section className={styles.ctaBox}>
        <h3 className={styles.ctaTitle}>Need to Factor in Background Streaming or Remote Server Limits?</h3>
        <p className={styles.ctaText}>
          Use our interactive Download Path Planning Calculator to test custom file sizes, simulate shared household bandwidth caps, and evaluate remote CDN bottlenecks.
        </p>
        <Link href={`/${data.calculatorQuery}`} className={styles.ctaButton}>
          Open Interactive Calculator with {data.speedFormatted} Prefilled →
        </Link>
      </section>

      {/* Nearby Pages Navigation */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Compare Other Broadband Speeds</h2>
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
