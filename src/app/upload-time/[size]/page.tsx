import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCanonicalUrl } from '@/config/site';
import { UPLOAD_PAGES, getUploadPageData } from '@/data/calculation-pages';
import styles from '@/app/calculation-answer.module.css';

interface Props {
  params: { size: string };
}

export const dynamicParams = false;

export function generateStaticParams() {
  return UPLOAD_PAGES.map((p) => ({ size: p.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const data = getUploadPageData(params.size);
  if (!data) return {};

  const canonical = getCanonicalUrl(`/upload-time/${data.slug}`);
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

export default function UploadTimeScenarioPage({ params }: Props) {
  const data = getUploadPageData(params.size);
  if (!data) {
    notFound();
  }

  return (
    <main className={styles.contentContainer}>
      {/* Breadcrumb Navigation */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/upload-time-calculator">Upload Calculator</Link>
        <span>/</span>
        <span>{data.sizeFormatted}</span>
      </nav>

      {/* Header */}
      <header className={styles.headerSection}>
        <h1 className={styles.title}>{data.h1}</h1>
        <div className={styles.subtitleBadge}>Asymmetric Upstream & Backup Planning Guide</div>
      </header>

      {/* Immediate Direct Answer Block */}
      <div className={styles.answerCard}>
        <div className={styles.answerLabel}>Direct Answer & Upstream Baseline</div>
        <p className={styles.answerMainText}>{data.directAnswerSummary}</p>
        <div className={styles.answerMetricsGrid}>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>Baseline Upstream</span>
            <span className={styles.metricValue}>{data.defaultSpeedLabel}</span>
          </div>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>Planned Duration (with reserve)</span>
            <span className={styles.metricValue}>{data.defaultPlannedDuration}</span>
          </div>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>Dedicated Line Time</span>
            <span className={styles.metricValue}>{data.defaultPayloadDuration}</span>
          </div>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>Effective Upstream Rate</span>
            <span className={styles.metricValue}>{data.defaultEffectiveSpeed}</span>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Upload Time Comparison Across Upstream Speeds</h2>
        <div className={styles.prose}>
          <p>
            Because most residential broadband plans are asymmetric (with upload bandwidth significantly lower than download speed), uploading <strong>{data.sizeFormatted}</strong> requires careful capacity planning. The table below compares 100% dedicated line speed against a realistic planned upload keeping 20% bandwidth unallocated for other devices.
          </p>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Upload Speed</th>
                <th className={styles.th}>Dedicated Line Time (100%)</th>
                <th className={styles.th}>Planned Time (20% Reserve)</th>
                <th className={styles.th}>Effective Throughput</th>
              </tr>
            </thead>
            <tbody>
              {data.comparisonRows.map((row) => (
                <tr key={row.speedLabel}>
                  <td className={styles.td}><strong>{row.speedLabel}</strong></td>
                  <td className={styles.td}>{row.purePayloadDuration}</td>
                  <td className={styles.td}><strong>{row.plannedDurationWithReserve}</strong></td>
                  <td className={styles.td}>{row.effectiveThroughput}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Required Speed Table */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>What Upload Speed Do You Need for {data.sizeFormatted}?</h2>
        <div className={styles.prose}>
          <p>
            To complete an upload of {data.sizeFormatted} within your desired schedule or overnight backup window, your upstream connection must sustain at least the following rate:
          </p>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Target Deadline</th>
                <th className={styles.th}>Required Effective Speed</th>
                <th className={styles.th}>Recommended Nominal Upstream Plan</th>
              </tr>
            </thead>
            <tbody>
              {data.requiredSpeedRows.map((row) => (
                <tr key={row.deadlineLabel}>
                  <td className={styles.td}><strong>{row.deadlineLabel}</strong></td>
                  <td className={styles.td}>{row.requiredEffectiveSpeed}</td>
                  <td className={styles.td}><strong>{row.requiredNominalSpeed}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Formula & Upstream Model */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Calculation Formula & Upstream Headroom Model</h2>
        <div className={styles.prose}>
          <p>
            Upload durations are modeled using three specific factors: raw payload bit volume, throughput factor, and reserved bandwidth:
          </p>
          <div className={styles.formulaBlock}>
            Payload Bits = {data.sizeGb.toLocaleString()} × 8,000,000,000 bits{'\n'}
            Available Upstream = Nominal Speed × Throughput Factor × (1 - Reserved Bandwidth %){'\n'}
            Upload Time = Payload Bits / Available Upstream + Batch Setup Overhead
          </div>
          <p>
            Saturating 100% of an upstream connection can trigger severe bufferbloat, increasing latency for voice calls, video meetings, and online gaming. Reserving 15% to 20% of upstream bandwidth ensures local network responsiveness while large backups run in the background.
          </p>
        </div>
      </section>

      {/* Practical Considerations */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Real-World Upload Considerations for {data.sizeFormatted}</h2>
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
        <h3 className={styles.ctaTitle}>Need Custom Multi-File Overheads or Shift Windows?</h3>
        <p className={styles.ctaText}>
          Open our interactive Upload Time Calculator to customize per-file latency, calculate overnight window capacities, and model bandwidth reservation percentages.
        </p>
        <Link href={`/upload-time-calculator${data.calculatorQuery}`} className={styles.ctaButton}>
          Open Interactive Upload Calculator with {data.sizeFormatted} Prefilled →
        </Link>
      </section>

      {/* Nearby Pages Navigation */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Other Common Upload File Sizes</h2>
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
