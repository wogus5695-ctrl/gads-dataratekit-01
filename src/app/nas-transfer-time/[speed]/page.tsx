import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCanonicalUrl } from '@/config/site';
import { NAS_PAGES, getNasPageData } from '@/data/calculation-pages';
import styles from '@/app/calculation-answer.module.css';

interface Props {
  params: { speed: string };
}

export const dynamicParams = false;

export function generateStaticParams() {
  return NAS_PAGES.map((p) => ({ speed: p.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const data = getNasPageData(params.speed);
  if (!data) return {};

  const canonical = getCanonicalUrl(`/nas-transfer-time/${data.slug}`);
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

export default function NasTransferScenarioPage({ params }: Props) {
  const data = getNasPageData(params.speed);
  if (!data) {
    notFound();
  }

  return (
    <main className={styles.contentContainer}>
      {/* Breadcrumb Navigation */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/file-transfer-time-calculator">File Transfer Calculator</Link>
        <span>/</span>
        <span>{data.displaySpeed}</span>
      </nav>

      {/* Header */}
      <header className={styles.headerSection}>
        <h1 className={styles.title}>{data.h1}</h1>
        <div className={styles.subtitleBadge}>Network Attached Storage (NAS) Speed Guide</div>
      </header>

      {/* Immediate Direct Answer Block */}
      <div className={styles.answerCard}>
        <div className={styles.answerLabel}>Direct Answer & Interface Baseline</div>
        <p className={styles.answerMainText}>{data.directAnswerSummary}</p>
        <div className={styles.answerMetricsGrid}>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>Network Interface</span>
            <span className={styles.metricValue}>{data.interfaceLabel}</span>
          </div>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>Raw Interface Ceiling</span>
            <span className={styles.metricValue}>{data.nominalSpeedMBs.toFixed(1)} MB/s</span>
          </div>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>Planning Throughput ({data.planningEfficiencyPercent}%)</span>
            <span className={styles.metricValue}>{data.planningThroughputMBs.toFixed(1)} MB/s</span>
          </div>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>1 TB Transfer Duration</span>
            <span className={styles.metricValue}>
              {data.sizeRows.find((r) => r.sizeGb === 1000)?.estimatedDuration || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Size Comparison Table */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Transfer Times by Data Size Over {data.slug.toUpperCase()}</h2>
        <div className={styles.prose}>
          <p>
            The table below outlines transfer durations across common data volumes over <strong>{data.interfaceLabel}</strong>. These calculations assume high-speed storage endpoints (NVMe/fast SSD array) so that the network interface remains the primary limiting stage at {data.planningEfficiencyPercent}% planning throughput:
          </p>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Data Payload Size</th>
                <th className={styles.th}>Interface Nominal Ceiling</th>
                <th className={styles.th}>Planning Throughput ({data.planningEfficiencyPercent}%)</th>
                <th className={styles.th}>Estimated Duration</th>
                <th className={styles.th}>Limiting Bottleneck</th>
              </tr>
            </thead>
            <tbody>
              {data.sizeRows.map((row) => (
                <tr key={row.dataSizeLabel}>
                  <td className={styles.td}><strong>{row.dataSizeLabel}</strong></td>
                  <td className={styles.td}>{row.interfaceNominalMBs}</td>
                  <td className={styles.td}><strong>{row.planningThroughputMBs}</strong></td>
                  <td className={styles.td}><strong>{row.estimatedDuration}</strong></td>
                  <td className={styles.td}>{row.bottleneckStage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3-Stage Architecture Explanation */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>3-Stage Pipeline: Source Read → Network Bus → Destination Write</h2>
        <div className={styles.prose}>
          <p>
            A local network file transfer never moves faster than its slowest physical link. The throughput achievable over a NAS connection depends on all three stages:
          </p>
          <div className={styles.formulaBlock}>
            Raw Interface Ceiling = {data.nominalSpeedGbps} Gbps × 125 MB/s = {data.nominalSpeedMBs.toFixed(1)} MB/s{'\n'}
            Sustained Usable Throughput = {data.nominalSpeedMBs.toFixed(1)} MB/s × {data.planningEfficiencyPercent / 100} = {data.planningThroughputMBs.toFixed(1)} MB/s{'\n'}
            Actual Effective Speed = min(Source Read, Interface Bus, Destination Write)
          </div>
          <p>
            <strong>Storage Dependency:</strong> If either your local PC drive or your remote NAS array writes slower than {data.planningThroughputMBs.toFixed(1)} MB/s, the transfer rate drops immediately to that storage drive's write speed.
          </p>
        </div>
      </section>

      {/* Storage Bottleneck Warnings */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Hardware & Storage Bottleneck Warnings</h2>
        <div className={styles.prose}>
          <ul>
            {data.storageBottleneckWarnings.map((warn, idx) => (
              <li key={idx}>{warn}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Interactive CTA */}
      <section className={styles.ctaBox}>
        <h3 className={styles.ctaTitle}>Simulate Your Exact PC Storage & NAS Array Hardware</h3>
        <p className={styles.ctaText}>
          Use our interactive 3-Stage File Transfer Calculator to configure custom drive speeds (HDD, SATA SSD, NVMe), simulate multi-file batch overhead, and identify physical bottlenecks.
        </p>
        <Link href={`/file-transfer-time-calculator${data.calculatorQuery}`} className={styles.ctaButton}>
          Open Interactive Calculator with {data.slug.toUpperCase()} Prefilled →
        </Link>
      </section>

      {/* Nearby Pages Navigation */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Compare Other NAS Network Speeds</h2>
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
