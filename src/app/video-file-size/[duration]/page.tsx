import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCanonicalUrl } from '@/config/site';
import { VIDEO_PAGES, getVideoPageData } from '@/data/calculation-pages';
import styles from '@/app/calculation-answer.module.css';

interface Props {
  params: { duration: string };
}

export const dynamicParams = false;

export function generateStaticParams() {
  return VIDEO_PAGES.map((p) => ({ duration: p.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const data = getVideoPageData(params.duration);
  if (!data) return {};

  const canonical = getCanonicalUrl(`/video-file-size/${data.slug}`);
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

export default function VideoFileSizeScenarioPage({ params }: Props) {
  const data = getVideoPageData(params.duration);
  if (!data) {
    notFound();
  }

  return (
    <main className={styles.contentContainer}>
      {/* Breadcrumb Navigation */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/video-file-size-calculator">Video Calculator</Link>
        <span>/</span>
        <span>{data.durationLabel}</span>
      </nav>

      {/* Header */}
      <header className={styles.headerSection}>
        <h1 className={styles.title}>{data.h1}</h1>
        <div className={styles.subtitleBadge}>Bitrate & Storage Capacity Reference</div>
      </header>

      {/* Immediate Direct Answer Block */}
      <div className={styles.answerCard}>
        <div className={styles.answerLabel}>Direct Answer & Common Baseline</div>
        <p className={styles.answerMainText}>{data.directAnswerSummary}</p>
        <div className={styles.answerMetricsGrid}>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>Baseline Profile</span>
            <span className={styles.metricValue}>1080p Web (5 Mbps)</span>
          </div>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>Estimated File Size</span>
            <span className={styles.metricValue}>{data.baselineFileSize}</span>
          </div>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>Combined Bitrate</span>
            <span className={styles.metricValue}>{data.baselineTotalBitrate}</span>
          </div>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>Audio Channel Track</span>
            <span className={styles.metricValue}>{data.audioBitrateKbps} kbps</span>
          </div>
        </div>
      </div>

      {/* Comparison Table Across Bitrates and Resolutions */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{data.durationLabel} File Size Across Common Video Profiles</h2>
        <div className={styles.prose}>
          <p>
            Video storage requirements are determined by the combined bitrates of the video stream and audio track over time. The table below outlines expected file sizes for a <strong>{data.durationLabel}</strong> video across common resolutions and recording bitrates:
          </p>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Profile & Use Case</th>
                <th className={styles.th}>Video Bitrate</th>
                <th className={styles.th}>Audio Bitrate</th>
                <th className={styles.th}>Calculated File Size</th>
                <th className={styles.th}>Storage Rate</th>
              </tr>
            </thead>
            <tbody>
              {data.bitrateRows.map((row) => (
                <tr key={row.useCaseLabel}>
                  <td className={styles.td}><strong>{row.useCaseLabel}</strong></td>
                  <td className={styles.td}>{row.videoBitrateMbps} Mbps</td>
                  <td className={styles.td}>{row.audioBitrateKbps} kbps</td>
                  <td className={styles.td}><strong>{row.calculatedFileSize}</strong></td>
                  <td className={styles.td}>{row.storagePerMinute}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Storage Budget Limits (Reverse Bitrate) */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Maximum Allowable Bitrate for Storage Constraints</h2>
        <div className={styles.prose}>
          <p>
            If you need a {data.durationLabel} video to stay under a specific file size ceiling (such as an email attachment, memory card allocation, or FAT32 4 GB single-file limit), your encoding bitrate must not exceed:
          </p>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Storage Budget</th>
                <th className={styles.th}>Maximum Video Bitrate</th>
                <th className={styles.th}>Encoding Guidance</th>
              </tr>
            </thead>
            <tbody>
              {data.storageBudgetRows.map((row) => (
                <tr key={row.storageLimitLabel}>
                  <td className={styles.td}><strong>{row.storageLimitLabel}</strong></td>
                  <td className={styles.td}><strong>{row.maxAllowableVideoBitrate}</strong></td>
                  <td className={styles.td}>{row.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Formula & Codec Explanation */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Bitrate Mathematics vs. Codec Visual Quality</h2>
        <div className={styles.prose}>
          <p>
            Digital video file size is governed strictly by the mathematical product of stream bitrates and runtime duration:
          </p>
          <div className={styles.formulaBlock}>
            Total Bitrate (bps) = Video Bitrate (bps) + Audio Bitrate (bps){'\n'}
            Total Bits = Total Bitrate × {data.durationSeconds.toLocaleString()} Seconds{'\n'}
            File Size = Total Bits / 8 (Bytes)
          </div>
          <p>
            <strong>Important Quality Clarification:</strong> Bitrate calculations determine raw data storage volume, NOT subjective visual fidelity. A 5 Mbps video encoded with modern AV1 or HEVC (H.265) compression delivers noticeably sharper image quality than an older H.264 stream at the same 5 Mbps, despite both consuming identical storage.
          </p>
        </div>
      </section>

      {/* Practical Considerations */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Practical Video Recording Considerations for {data.durationLabel}</h2>
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
        <h3 className={styles.ctaTitle}>Calculate Custom Bitrates, Multi-Track Audio, or SD Card Limits</h3>
        <p className={styles.ctaText}>
          Use our interactive Video File Size Calculator to test custom runtimes, find required bitrates for email attachments, and calculate maximum recording time on memory cards.
        </p>
        <Link href={`/video-file-size-calculator${data.calculatorQuery}`} className={styles.ctaButton}>
          Open Interactive Video Calculator with {data.durationLabel} Prefilled →
        </Link>
      </section>

      {/* Nearby Pages Navigation */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Other Common Video Durations</h2>
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
