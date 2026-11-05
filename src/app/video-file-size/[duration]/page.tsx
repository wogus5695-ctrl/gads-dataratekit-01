import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCanonicalUrl } from '@/config/site';
import {
  VIDEO_PAGES,
  getVideoPageData,
  VIDEO_PROFILE_PAGES,
  getVideoProfilePageData,
} from '@/data/calculation-pages';
import styles from '@/app/calculation-answer.module.css';

interface Props {
  params: { duration: string };
}

export const dynamicParams = false;

export function generateStaticParams() {
  return [
    ...VIDEO_PAGES.map((p) => ({ duration: p.slug })),
    ...VIDEO_PROFILE_PAGES.map((p) => ({ duration: p.slug })),
  ];
}

export function generateMetadata({ params }: Props): Metadata {
  const durationData = getVideoPageData(params.duration);
  if (durationData) {
    const canonical = getCanonicalUrl(`/video-file-size/${durationData.slug}`);
    return {
      title: durationData.title,
      description: durationData.metaDescription,
      alternates: canonical ? { canonical } : undefined,
      openGraph: {
        title: durationData.title,
        description: durationData.metaDescription,
        url: canonical,
        type: 'article',
      },
    };
  }

  const profileData = getVideoProfilePageData(params.duration);
  if (profileData) {
    const canonical = getCanonicalUrl(`/video-file-size/${profileData.slug}`);
    return {
      title: profileData.title,
      description: profileData.metaDescription,
      alternates: canonical ? { canonical } : undefined,
      openGraph: {
        title: profileData.title,
        description: profileData.metaDescription,
        url: canonical,
        type: 'article',
      },
    };
  }

  return {};
}

export default function VideoFileSizeAnswerPage({ params }: Props) {
  const durationData = getVideoPageData(params.duration);
  const profileData = getVideoProfilePageData(params.duration);

  if (!durationData && !profileData) {
    notFound();
  }

  // Duration-centric view (e.g. 10-minutes, 1-hour)
  if (durationData) {
    return (
      <main className={styles.contentContainer}>
        {/* Breadcrumb Navigation */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/video-file-size-calculator">Video Calculator</Link>
          <span>/</span>
          <span>{durationData.durationLabel}</span>
        </nav>

        {/* Header */}
        <header className={styles.headerSection}>
          <h1 className={styles.title}>{durationData.h1}</h1>
          <div className={styles.subtitleBadge}>Bitrate & Storage Capacity Reference</div>
        </header>

        {/* Immediate Direct Answer Block */}
        <div className={styles.answerCard}>
          <div className={styles.answerLabel}>Direct Answer & Common Baseline</div>
          <p className={styles.answerMainText}>{durationData.directAnswerSummary}</p>
          <div className={styles.answerMetricsGrid}>
            <div className={styles.metricBox}>
              <span className={styles.metricLabel}>Baseline Profile</span>
              <span className={styles.metricValue}>1080p Web (5 Mbps)</span>
            </div>
            <div className={styles.metricBox}>
              <span className={styles.metricLabel}>Estimated File Size</span>
              <span className={styles.metricValue}>{durationData.baselineFileSize}</span>
            </div>
            <div className={styles.metricBox}>
              <span className={styles.metricLabel}>Combined Bitrate</span>
              <span className={styles.metricValue}>{durationData.baselineTotalBitrate}</span>
            </div>
            <div className={styles.metricBox}>
              <span className={styles.metricLabel}>Audio Channel Track</span>
              <span className={styles.metricValue}>{durationData.audioBitrateKbps} kbps</span>
            </div>
          </div>
        </div>

        {/* Comparison Table Across Bitrates and Resolutions */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{durationData.durationLabel} Video File Size Across Common Profiles</h2>
          <div className={styles.prose}>
            <p>
              Video storage requirements are determined by the combined bitrates of the video stream and audio track over time. The table below outlines expected file sizes for a <strong>{durationData.durationLabel.toLowerCase()}</strong> video across common resolutions and recording bitrates:
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
                {durationData.bitrateRows.map((row) => (
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
              If you need a {durationData.durationLabel.toLowerCase()} video to stay under a specific file size ceiling (such as an email attachment, memory card allocation, or FAT32 4 GB single-file limit), your encoding bitrate must not exceed:
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
                {durationData.storageBudgetRows.map((row) => (
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
              Total Bits = Total Bitrate × {durationData.durationSeconds.toLocaleString()} Seconds{'\n'}
              File Size = Total Bits / 8 (Bytes)
            </div>
            <p>
              <strong>Important Quality Clarification:</strong> Bitrate calculations determine raw data storage volume, NOT subjective visual fidelity. A 5 Mbps video encoded with modern AV1 or HEVC (H.265) compression delivers noticeably sharper image quality than an older H.264 stream at the same 5 Mbps, despite both consuming identical storage.
            </p>
          </div>
        </section>

        {/* Practical Considerations */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Practical Video Recording Considerations for {durationData.durationLabel} Recordings</h2>
          <div className={styles.prose}>
            <ul>
              {durationData.contextNotes.map((note, idx) => (
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
          <Link href={`/video-file-size-calculator${durationData.calculatorQuery}`} className={styles.ctaButton}>
            Open Interactive Video Calculator with {durationData.durationLabel} Video Prefilled →
          </Link>
        </section>

        {/* Nearby Pages Navigation */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Other Common Video Durations & Resolution Profiles</h2>
          <div className={styles.nearbyGrid}>
            {durationData.nearbyPages.map((page) => (
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

  // Profile-centric view (e.g. 720p-per-hour, 1080p-per-hour, 4k-per-hour, etc.)
  const prof = profileData!;
  return (
    <main className={styles.contentContainer}>
      {/* Breadcrumb Navigation */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/video-file-size-calculator">Video Calculator</Link>
        <span>/</span>
        <span>{prof.profileName}</span>
      </nav>

      {/* Header */}
      <header className={styles.headerSection}>
        <h1 className={styles.title}>{prof.h1}</h1>
        <div className={styles.subtitleBadge}>Reference Bitrate & Storage Capacity Guide</div>
      </header>

      {/* Immediate Direct Answer Block */}
      <div className={styles.answerCard}>
        <div className={styles.answerLabel}>Direct Answer & Reference Baseline</div>
        <p className={styles.answerMainText}>{prof.directAnswerSummary}</p>
        <div className={styles.answerMetricsGrid}>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>Resolution</span>
            <span className={styles.metricValue}>{prof.resolution}</span>
          </div>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>Frame Rate</span>
            <span className={styles.metricValue}>{prof.frameRate}</span>
          </div>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>Reference Bitrate</span>
            <span className={styles.metricValue}>
              {prof.isRange && prof.upperVideoBitrateMbps
                ? `${prof.videoBitrateMbps}–${prof.upperVideoBitrateMbps} Mbps`
                : `${prof.videoBitrateMbps} Mbps`}
            </span>
          </div>
          <div className={styles.metricBox}>
            <span className={styles.metricLabel}>Audio Channel Track</span>
            <span className={styles.metricValue}>{prof.audioBitrateKbps} kbps</span>
          </div>
        </div>
      </div>

      {/* Duration Scaling Table */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{prof.profileName} File Size by Runtime</h2>
        <div className={styles.prose}>
          <p>
            Storage footprint scaling for <strong>{prof.profileName}</strong> ({prof.resolution} at {prof.frameRate}) across standard recording durations:
          </p>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Recording Duration</th>
                <th className={styles.th}>Total Stream Bitrate</th>
                <th className={styles.th}>Calculated File Size</th>
                <th className={styles.th}>Storage Rate</th>
              </tr>
            </thead>
            <tbody>
              {prof.durationRows.map((row) => (
                <tr key={row.durationLabel}>
                  <td className={styles.td}><strong>{row.durationLabel}</strong></td>
                  <td className={styles.td}>{prof.totalBitrateFormatted}</td>
                  <td className={styles.td}>
                    <strong>
                      {row.upperFileSize
                        ? `${row.calculatedFileSize} – ${row.upperFileSize}`
                        : row.calculatedFileSize}
                    </strong>
                  </td>
                  <td className={styles.td}>{row.storageRateFormatted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Storage Capacity / SD Card Limits */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Memory Card & Storage Capacity for {prof.profileName}</h2>
        <div className={styles.prose}>
          <p>
            The table below estimates how many hours of continuous {prof.profileName} footage fit onto standard SD card and portable drive capacities:
          </p>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Storage Card / Media</th>
                <th className={styles.th}>Usable Capacity</th>
                <th className={styles.th}>Max Recording Time</th>
                <th className={styles.th}>Filesystem & Speed Guidance</th>
              </tr>
            </thead>
            <tbody>
              {prof.storageCapacityRows.map((card) => (
                <tr key={card.cardLabel}>
                  <td className={styles.td}><strong>{card.cardLabel}</strong></td>
                  <td className={styles.td}>~{card.usableCapacityGb} GB</td>
                  <td className={styles.td}><strong>{card.maxRecordingHours}</strong></td>
                  <td className={styles.td}>{card.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Formula & Reference Notice */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Bitrate Mathematics & Profile Disclaimers</h2>
        <div className={styles.prose}>
          <p>
            Digital video file size is governed strictly by the mathematical product of stream bitrates and runtime duration:
          </p>
          <div className={styles.formulaBlock}>
            Total Bitrate (bps) = Video Bitrate (bps) + Audio Bitrate (bps){'\n'}
            Total Bits = Total Bitrate × Duration (seconds){'\n'}
            File Size = Total Bits / 8 (Bytes)
          </div>
          <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: '#4b5563', fontStyle: 'italic' }}>
            {prof.referenceDisclaimer}
          </p>
        </div>
      </section>

      {/* Practical Considerations */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Production & Ingest Considerations for {prof.profileName}</h2>
        <div className={styles.prose}>
          <ul>
            {prof.practicalConsiderations.map((note, idx) => (
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
        <Link href={`/video-file-size-calculator${prof.calculatorQuery}`} className={styles.ctaButton}>
          Open Interactive Video Calculator with {prof.profileName} Prefilled →
        </Link>
      </section>

      {/* Nearby Pages Navigation */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Other Common Video Profiles & Durations</h2>
        <div className={styles.nearbyGrid}>
          {prof.nearbyPages.map((page) => (
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
