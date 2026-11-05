import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCanonicalUrl } from '@/config/site';
import {
  FILE_TRANSFER_PAGES,
  getFileTransferPageData,
  FILE_TRANSFER_SCENARIOS,
  getFileTransferScenarioData,
} from '@/data/calculation-pages';
import styles from '@/app/calculation-answer.module.css';

interface Props {
  params: { size: string };
}

export const dynamicParams = false;

export function generateStaticParams() {
  return [
    ...FILE_TRANSFER_PAGES.map((p) => ({ size: p.slug })),
    ...FILE_TRANSFER_SCENARIOS.map((s) => ({ size: s })),
  ];
}

export function generateMetadata({ params }: Props): Metadata {
  const sizeData = getFileTransferPageData(params.size);
  if (sizeData) {
    const canonical = getCanonicalUrl(`/file-transfer-time/${sizeData.slug}`);
    return {
      title: sizeData.title,
      description: sizeData.metaDescription,
      alternates: canonical ? { canonical } : undefined,
      openGraph: {
        title: sizeData.title,
        description: sizeData.metaDescription,
        url: canonical,
        type: 'article',
      },
    };
  }

  const scenarioData = getFileTransferScenarioData(params.size);
  if (scenarioData) {
    const canonical = getCanonicalUrl(`/file-transfer-time/${scenarioData.slug}`);
    return {
      title: scenarioData.title,
      description: scenarioData.metaDescription,
      alternates: canonical ? { canonical } : undefined,
      openGraph: {
        title: scenarioData.title,
        description: scenarioData.metaDescription,
        url: canonical,
        type: 'article',
      },
    };
  }

  return {};
}

export default function FileTransferAnswerPage({ params }: Props) {
  const sizeData = getFileTransferPageData(params.size);
  const scenarioData = getFileTransferScenarioData(params.size);

  if (!sizeData && !scenarioData) {
    notFound();
  }

  // Size-specific answer view (e.g. 100gb, 1tb)
  if (sizeData) {
    return (
      <main className={styles.contentContainer}>
        {/* Breadcrumb Navigation */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/file-transfer-time-calculator">File Transfer Calculator</Link>
          <span>/</span>
          <span>{sizeData.sizeFormatted}</span>
        </nav>

        {/* Header */}
        <header className={styles.headerSection}>
          <h1 className={styles.title}>{sizeData.h1}</h1>
          <div className={styles.subtitleBadge}>Local Storage, SSD, USB & Network Transfer Planning</div>
        </header>

        {/* Immediate Direct Answer Block */}
        <div className={styles.answerCard}>
          <div className={styles.answerLabel}>Direct Answer & Storage Baseline</div>
          <p className={styles.answerMainText}>{sizeData.directAnswerSummary}</p>
          <div className={styles.answerMetricsGrid}>
            <div className={styles.metricBox}>
              <span className={styles.metricLabel}>Baseline Scenario</span>
              <span className={styles.metricValue}>{sizeData.baselineScenarioName}</span>
            </div>
            <div className={styles.metricBox}>
              <span className={styles.metricLabel}>Transfer Duration (85%)</span>
              <span className={styles.metricValue}>{sizeData.baselineDuration}</span>
            </div>
            <div className={styles.metricBox}>
              <span className={styles.metricLabel}>Limiting Bottleneck</span>
              <span className={styles.metricValue}>{sizeData.baselineBottleneck}</span>
            </div>
            <div className={styles.metricBox}>
              <span className={styles.metricLabel}>Sustained Throughput</span>
              <span className={styles.metricValue}>{sizeData.baselineThroughput}</span>
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
                {sizeData.scenarios.map((sc) => (
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
          <h2 className={styles.sectionTitle}>What Interface Bandwidth is Required for {sizeData.sizeFormatted}?</h2>
          <div className={styles.prose}>
            <p>
              The table below indicates the minimum interface rate required to transfer {sizeData.sizeFormatted} within target timeframes (assuming high-speed SSD storage on both ends):
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
                {sizeData.requiredInterfaceRows.map((row) => (
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
          <h2 className={styles.sectionTitle}>Practical Transfer Bottlenecks for {sizeData.sizeFormatted}</h2>
          <div className={styles.prose}>
            <ul>
              {sizeData.contextNotes.map((note, idx) => (
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
          <Link href={`/file-transfer-time-calculator${sizeData.calculatorQuery}`} className={styles.ctaButton}>
            Open Interactive Transfer Calculator with {sizeData.sizeFormatted} Prefilled →
          </Link>
        </section>

        {/* Nearby Pages Navigation */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Other Common Transfer Sizes & Hardware Scenarios</h2>
          <div className={styles.nearbyGrid}>
            {sizeData.nearbyPages.map((page) => (
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

  // Hardware Scenario view (e.g. ssd-to-hdd, ssd-to-ssd)
  const sc = scenarioData!;
  return (
    <main className={styles.contentContainer}>
      {/* Breadcrumb Navigation */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/file-transfer-time-calculator">File Transfer Calculator</Link>
        <span>/</span>
        <span>{sc.scenarioTitle}</span>
      </nav>

      {/* Header */}
      <header className={styles.headerSection}>
        <h1 className={styles.title}>{sc.h1}</h1>
        <div className={styles.subtitleBadge}>Hardware Pipeline Throughput & Bottleneck Guide</div>
      </header>

      {/* Immediate Direct Answer Block */}
      <div className={styles.answerCard}>
        <div className={styles.answerLabel}>Direct Answer & Bottleneck Summary</div>
        <p className={styles.answerMainText}>{sc.directAnswerSummary}</p>
      </div>

      {/* Hardware Pipeline Benchmark Comparison */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Transfer Times Across Common {sc.scenarioTitle} Pipelines</h2>
        <div className={styles.prose}>
          <p>
            Hardware data transfers are constrained by the slowest link in the 3-stage chain (Source Read, Interface Bus, Destination Write). The table below details sustained throughput (at 85% planning efficiency) and expected durations across representative configurations:
          </p>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Hardware Configuration</th>
                <th className={styles.th}>Source Read</th>
                <th className={styles.th}>Interface Bus</th>
                <th className={styles.th}>Destination Write</th>
                <th className={styles.th}>Limiting Bottleneck</th>
                <th className={styles.th}>Effective Throughput</th>
                <th className={styles.th}>100 GB Transfer</th>
                <th className={styles.th}>1 TB Transfer</th>
              </tr>
            </thead>
            <tbody>
              {sc.hardwareRows.map((hw) => (
                <tr key={hw.scenarioName}>
                  <td className={styles.td}><strong>{hw.scenarioName}</strong></td>
                  <td className={styles.td}>{hw.sourceRead}</td>
                  <td className={styles.td}>{hw.interfaceBus}</td>
                  <td className={styles.td}>{hw.destinationWrite}</td>
                  <td className={styles.td}>{hw.limitingBottleneck}</td>
                  <td className={styles.td}><strong>{hw.effectiveMBs}</strong></td>
                  <td className={styles.td}>{hw.transferDuration100GB}</td>
                  <td className={styles.td}><strong>{hw.transferDuration1TB}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Size Comparison Across Storage Workloads */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{sc.scenarioTitle} Times Across Backup & Migration Sizes</h2>
        <div className={styles.prose}>
          <p>
            Estimated transfer times across standard payload sizes comparing typical, worst-case, and optimal drive setups:
          </p>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Payload Size</th>
                <th className={styles.th}>Standard Setup (85% eff)</th>
                <th className={styles.th}>Constrained / Cache-Depleted</th>
                <th className={styles.th}>Optimal Hardware Setup</th>
              </tr>
            </thead>
            <tbody>
              {sc.sizeRows.map((row) => (
                <tr key={row.sizeLabel}>
                  <td className={styles.td}><strong>{row.sizeLabel}</strong></td>
                  <td className={styles.td}><strong>{row.standardDuration}</strong></td>
                  <td className={styles.td}>{row.worstCaseDuration}</td>
                  <td className={styles.td}>{row.optimalDuration}</td>
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
            Unlike simple internet calculators that rely solely on network speeds, DataRateKit calculates end-to-end hardware throughput by evaluating the lowest common denominator across three distinct stages:
          </p>
          <div className={styles.formulaBlock}>
            Raw Bottleneck = min(Source Read Speed, Interface Bus Speed, Destination Write Speed){'\n'}
            Sustained Throughput = Raw Bottleneck × Planning Efficiency (85%){'\n'}
            Transfer Time = Payload Bytes / Sustained Throughput
          </div>
          <p>
            A high-speed NVMe reading at 3,500 MB/s cannot transfer data faster than 180 MB/s when writing to an external mechanical drive. Throughput is strictly capped by the destination write rate.
          </p>
        </div>
      </section>

      {/* Engineering Observations */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Engineering Observations & Drive Bottlenecks</h2>
        <div className={styles.prose}>
          <ul>
            {sc.baselineExplanation.map((note, idx) => (
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
        <Link href={`/file-transfer-time-calculator${sc.calculatorQuery}`} className={styles.ctaButton}>
          Open Interactive Transfer Calculator with {sc.scenarioTitle} Settings →
        </Link>
      </section>

      {/* Nearby Pages Navigation */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Related Hardware Scenarios & Transfer Sizes</h2>
        <div className={styles.nearbyGrid}>
          {sc.nearbyPages.map((page) => (
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
