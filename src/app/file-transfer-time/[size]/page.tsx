import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCanonicalUrl } from '@/config/site';
import { FILE_TRANSFER_PAGES, getFileTransferPageData } from '@/data/calculation-pages';
import styles from '@/app/calculation-answer.module.css';

interface Props {
  params: { size: string };
}

export const dynamicParams = false;

export function generateStaticParams() {
  return FILE_TRANSFER_PAGES.map((p) => ({ size: p.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const data = getFileTransferPageData(params.size);
  if (!data) return {};

  const canonical = getCanonicalUrl(`/file-transfer-time/${data.slug}`);
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

export default function FileTransferScenarioPage({ params }: Props) {
  const data = getFileTransferPageData(params.size);
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
        <span>{data.sizeFormatted}</span>
      </nav>

      {/* Header */}
      <header className={styles.headerSection}>
        <h1 className={styles.title}>{data.h1}</h1>
        <div className={styles.subtitleBadge}>Local Storage, SSD, USB & Network Transfer Planning</div>
      </header>

      {/* Immediate Direct Answer Block */}
      <div className={styles.answerCard}>
        <div className={styles.answerLabel}>Direct Answer & Storage Baseline</div>
        <p className={styles.answerMainText}>{data.directAnswerSummary}</p>
        <div className={styles.answerMetricsGrid}>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>Baseline Scenario</span>
            <span className={styles.metricValue}>{data.baselineScenarioName}</span>
          </div>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>Transfer Duration (85%)</span>
            <span className={styles.metricValue}>{data.baselineDuration}</span>
          </div>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>Limiting Bottleneck</span>
            <span className={styles.metricValue}>{data.baselineBottleneck}</span>
          </div>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>Sustained Throughput</span>
            <span className={styles.metricValue}>{data.baselineThroughput}</span>
          </div>
        </div>
      </div>

      {/* Comparison Table Across Hardware Pipelines */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Transfer Times Across Common Hardware Pipelines</h2>
        <div className={styles.prose}>
          <p>
            Local and network file transfers are governed by a 3-stage hardware chain: <strong>Source Drive Read</strong>, <strong>Interface / Bus</strong>, and <strong>Destination Drive Write</strong>. Throughput cannot exceed the slowest component in that chain.
          </p>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Hardware Pipeline</th>
                <th className={styles.th}>Source Read</th>
                <th className={styles.th}>Interface / Bus</th>
                <th className={styles.th}>Destination Write</th>
                <th className={styles.th}>Limiting Bottleneck</th>
                <th className={styles.th}>Estimated Duration (85%)</th>
              </tr>
            </thead>
            <tbody>
              {data.scenarios.map((sc) => (
                <tr key={sc.scenarioName}>
                  <td className={styles.td}><strong>{sc.scenarioName}</strong></td>
                  <td className={styles.td}>{sc.sourceDrive}</td>
                  <td className={styles.td}>{sc.interfaceBus}</td>
                  <td className={styles.td}>{sc.destinationDrive}</td>
                  <td className={styles.td}>{sc.bottleneckStage}</td>
                  <td className={styles.td}><strong>{sc.transferDuration}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Required Interface Speed Table */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>What Interface Bandwidth is Required for {data.sizeFormatted}?</h2>
        <div className={styles.prose}>
          <p>
            The table below indicates the minimum interface rate required to transfer {data.sizeFormatted} within target timeframes (assuming high-speed SSD storage on both ends):
          </p>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Target Deadline</th>
                <th className={styles.th}>Required Interface Speed</th>
                <th className={styles.th}>Physical Feasibility & Notes</th>
              </tr>
            </thead>
            <tbody>
              {data.requiredInterfaceRows.map((row) => (
                <tr key={row.deadlineLabel}>
                  <td className={styles.td}><strong>{row.deadlineLabel}</strong></td>
                  <td className={styles.td}><strong>{row.requiredInterfaceSpeed}</strong></td>
                  <td className={styles.td}>{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3-Stage Model Formula */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>The 3-Stage File Transfer Calculation Model</h2>
        <div className={styles.prose}>
          <p>
            Unlike internet calculators that model only a single line rate, DataRateKit models end-to-end local hardware transfers across three distinct stages:
          </p>
          <div className={styles.formulaBlock}>
            Raw Bottleneck = min(Source Read Speed, Interface Bus Speed, Destination Write Speed){'\n'}
            Sustained Throughput = Raw Bottleneck × Planning Efficiency (typically 85%){'\n'}
            Transfer Time = Payload Bytes / Sustained Throughput + File Batch Overhead
          </div>
          <p>
            A 10GbE network connection (capable of 1,250 MB/s raw) cannot transfer files faster than 180 MB/s if the destination is a single mechanical hard drive. The slowest stage always dictates overall transfer duration.
          </p>
        </div>
      </section>

      {/* Practical Considerations */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Practical Transfer Bottlenecks for {data.sizeFormatted}</h2>
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
        <h3 className={styles.ctaTitle}>Analyze Custom Hardware, Drives, or Multi-File Batches</h3>
        <p className={styles.ctaText}>
          Use our interactive File Transfer Time Calculator to select specific SSD/HDD models, diagnose stage headroom percentages, and calculate small-file overhead.
        </p>
        <Link href={`/file-transfer-time-calculator${data.calculatorQuery}`} className={styles.ctaButton}>
          Open Interactive Transfer Calculator with {data.sizeFormatted} Prefilled →
        </Link>
      </section>

      {/* Nearby Pages Navigation */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Other Common Transfer Sizes</h2>
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
