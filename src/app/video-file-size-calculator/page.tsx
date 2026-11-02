import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { VideoCalculator } from '@/components/calculator/VideoCalculator';
import { calculateVideoFileSize } from '@/lib/video/calculations';
import { getCanonicalUrl } from '@/config/site';
import styles from '../page.module.css';

const title = 'Free Video File Size Calculator — Bitrate & Duration';
const description =
  'Estimate video file size, target video bitrate, or maximum recording duration from bitrate and time. Pure mathematical model supporting decimal and binary units.';
const canonical = getCanonicalUrl('/video-file-size-calculator');

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

interface VideoBenchmarkRow {
  label: string;
  videoBitrate: number;
  audioBitrate: number;
  oneHourSizeGB: string;
  ratePerMinMB: string;
}

const BENCHMARK_EXAMPLES = [
  { label: '5 Mbps Video + 128 kbps Audio', video: 5, audio: 128 },
  { label: '10 Mbps Video + 192 kbps Audio', video: 10, audio: 192 },
  { label: '20 Mbps Video + 320 kbps Audio', video: 20, audio: 320 },
  { label: '50 Mbps Video + 320 kbps Audio', video: 50, audio: 320 },
  { label: '100 Mbps Video + 320 kbps Audio', video: 100, audio: 320 },
];

function getVideoBenchmarkRows(): VideoBenchmarkRow[] {
  return BENCHMARK_EXAMPLES.map((item) => {
    const res = calculateVideoFileSize({
      videoBitrate: item.video,
      videoBitrateUnit: 'Mbps',
      audioBitrate: item.audio,
      audioBitrateUnit: 'kbps',
      durationSeconds: 3600,
      targetSizeUnit: 'GB',
    });

    return {
      label: item.label,
      videoBitrate: item.video,
      audioBitrate: item.audio,
      oneHourSizeGB: res.success ? `${res.data.fileSizeFormatted}` : '—',
      ratePerMinMB: res.success ? `${res.data.mbPerMinute.toFixed(1)} MB/min` : '—',
    };
  });
}

export default function VideoCalculatorPage() {
  const benchmarkRows = getVideoBenchmarkRows();

  return (
    <main className={styles.pageContainer}>
      <header className={styles.headerSection}>
        <h1 className={styles.title}>Video File Size Calculator</h1>
        <p className={styles.description}>
          Estimate video file size from bitrate and duration, estimate the target video bitrate for a file-size limit, or determine maximum recording time for available storage. Use bitrate-based estimates without relying on a specific codec preset.
        </p>
      </header>

      <VideoCalculator />

      {/* 1. How video file size calculation works */}
      <section className={styles.contentSection} aria-labelledby="how-it-works-heading">
        <h2 id="how-it-works-heading" className={styles.supportingTitle}>
          How video file size calculation works
        </h2>
        <div className={styles.prose}>
          <p>
            Digital video files consist of multiplexed data streams, principally comprising an encoded video track, one or more audio tracks, and container metadata. The fundamental mathematical relationship governing stream storage volume is:
          </p>
          <div>
            <div className={styles.formulaBox}>
              File Size (bits) = Total Bitrate (bits per second) × Duration (seconds)
            </div>
          </div>
          <p>
            Because operating systems, memory cards, and hard drives report file sizes in bytes rather than bits, the total bit count is divided by exactly 8:
          </p>
          <div>
            <div className={styles.formulaBox}>
              File Size in Bytes = (Video Bitrate + Audio Bitrate) × Duration in seconds ÷ 8
            </div>
          </div>
          <p>
            This calculator performs bitrate- and duration-based data volume estimation. It does not calculate uncompressed raw video frames from pixel dimensions, bit depth, or chroma subsampling.
          </p>
          <p>
            For example, a video stream encoded at 20 Mbps accompanied by a 320 kbps stereo audio track has a combined data rate of 20.32 Mbps (20,320,000 bits per second). Over a 1-hour duration (3,600 seconds), this yields 73,152,000,000 bits, which equals 9,144,000,000 bytes (approximately 9.144 decimal GB or 8.52 binary GiB).
          </p>
        </div>
      </section>

      {/* 2. How Bitrate Changes File Size */}
      <section className={styles.contentSection} aria-labelledby="bitrate-scaling-heading">
        <h2 id="bitrate-scaling-heading" className={styles.supportingTitle}>
          How Bitrate Changes File Size
        </h2>
        <div className={styles.prose}>
          <p>
            The reference table below illustrates theoretical mathematical data volume for 1 hour of recording across arbitrary video and audio bitrate combinations. These figures are pure mathematical products of data rate and time (bitrate × duration ÷ 8), not recommended, typical, or standard presets for any specific resolution or codec. Bitrates vary widely based on codec efficiency, frame rate, motion complexity, bit depth, and encoder settings.
          </p>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.benchmarkTable} aria-label="1-hour video file size reference table">
            <thead>
              <tr>
                <th scope="col">Bitrate combination example</th>
                <th scope="col">Storage rate</th>
                <th scope="col">1-hour data volume (Decimal GB)</th>
              </tr>
            </thead>
            <tbody>
              {benchmarkRows.map((row) => (
                <tr key={row.label}>
                  <th scope="row" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {row.label}
                  </th>
                  <td>{row.ratePerMinMB}</td>
                  <td>{row.oneHourSizeGB}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Worked Examples */}
      <section className={styles.contentSection} aria-labelledby="worked-examples-heading">
        <h2 id="worked-examples-heading" className={styles.supportingTitle}>
          Worked Examples: Step-by-Step Calculations
        </h2>
        <div className={styles.prose}>
          <p>
            The following worked examples demonstrate step-by-step arithmetic across each calculation mode using neutral mathematical scenarios.
          </p>

          <div className={styles.exampleBlock}>
            <div className={styles.exampleTitle}>Example 1: Estimating File Size from Combined Bitrates (Mode A)</div>
            <div className={styles.exampleDesc}>
              A 15-minute video clip (900 seconds) is encoded at a video bitrate of 45 Mbps with a 384 kbps audio track:
              <br /><br />
              1. Combined bitrate: 45,000,000 bps + 384,000 bps = 45,384,000 bps (45.384 Mbps).
              <br />
              2. Total bits: 45,384,000 bps × 900 seconds = 40,845,600,000 bits.
              <br />
              3. Total bytes: 40,845,600,000 bits ÷ 8 = 5,105,700,000 bytes.
              <br />
              4. Result: <strong>5.106 GB</strong> (decimal SI, 1 GB = 10^9 bytes) or <strong>4.755 GiB</strong> (binary IEC, 1 GiB = 2^30 bytes).
            </div>
          </div>

          <div className={styles.exampleBlock}>
            <div className={styles.exampleTitle}>Example 2: Target Video Bitrate for a 100 MB File-Size Limit (Mode B)</div>
            <div className={styles.exampleDesc}>
              A video must fit within a 100 MB file-size limit over a 3-minute duration (180 seconds), with a 160 kbps audio stream:
              <br /><br />
              1. Target total bytes: 100 × 1,000,000 = 100,000,000 bytes (800,000,000 bits).
              <br />
              2. Total allowable data rate: 800,000,000 bits ÷ 180 seconds ≈ 4,444,444.44 bps (≈ 4.444 Mbps).
              <br />
              3. Deduct audio bitrate: 4,444,444.44 bps − 160,000 bps = 4,284,444.44 bps.
              <br />
              4. Target video bitrate: <strong>4.284 Mbps</strong>. If audio were not deducted, total file size would exceed the 100 MB limit by 3.6 MB.
            </div>
          </div>

          <div className={styles.exampleBlock}>
            <div className={styles.exampleTitle}>Example 3: Maximum Recording Duration on a 128 GB Storage Target (Mode C)</div>
            <div className={styles.exampleDesc}>
              A storage card provides 128 GB of decimal capacity (128,000,000,000 bytes). Video is recorded at 100 Mbps with a 256 kbps audio track:
              <br /><br />
              1. Available bits: 128,000,000,000 bytes × 8 = 1,024,000,000,000 bits.
              <br />
              2. Total bitrate: 100,000,000 bps + 256,000 bps = 100,256,000 bps.
              <br />
              3. Maximum duration: 1,024,000,000,000 ÷ 100,256,000 ≈ 10,213.8525 seconds.
              <br />
              4. Converted time: 10,214 seconds rounds to <strong>2 hours 50 minutes 14 seconds</strong> (2h 50m 14s).
            </div>
          </div>
        </div>
      </section>

      {/* 4. What changes video file size */}
      <section className={styles.contentSection} aria-labelledby="factors-heading">
        <h2 id="factors-heading" className={styles.supportingTitle}>
          What changes video file size
        </h2>
        <div className={styles.prose}>
          <p>
            While mathematical estimates provide an authoritative baseline, actual encoded media file sizes can vary based on several technical factors:
          </p>
          <ul className={styles.itemList}>
            <li>
              <strong>Variable Bitrate (VBR) vs. Constant Bitrate (CBR):</strong> Under CBR encoding, data is written at a steady rate throughout the file. Under VBR encoding, the encoder allocates higher bitrates to complex scenes with rapid motion and reduces bitrates during static scenes, resulting in an average bitrate that may differ from your peak target.
            </li>
            <li>
              <strong>Container and multiplexing overhead:</strong> Container overhead, metadata, additional tracks, muxing behavior, and encoder output can cause the final file size to differ from a bitrate × duration estimate. Container formats (such as MP4, MKV, MOV, or WebM) require structural headers, indexing tables, and packet encapsulation that introduce non-zero overhead depending on duration, stream count, and muxer implementation.
            </li>
            <li>
              <strong>Multiple audio and subtitle tracks:</strong> Adding secondary language tracks, surround sound (5.1 or 7.1 channel audio), or embedded closed-caption streams increases the total composite stream bitrate.
            </li>
            <li>
              <strong>Content complexity and encoder efficiency:</strong> Modern compression codecs achieve equivalent visual fidelity at lower bitrates compared to older codecs, directly reducing the required stream data rate for a given perceptual quality.
            </li>
          </ul>
        </div>
      </section>

      {/* 5. Video bitrate vs audio bitrate */}
      <section className={styles.contentSection} aria-labelledby="audio-bitrate-heading">
        <h2 id="audio-bitrate-heading" className={styles.supportingTitle}>
          Video bitrate vs. audio bitrate in target budgeting
        </h2>
        <div className={styles.prose}>
          <p>
            When aiming for a specific file-size limit—such as meeting email attachment thresholds, cloud upload quotas, or storage media limits—both video and audio tracks share the same total allowable bitrate pool.
          </p>
          <p>
            If your target file size permits a total data rate of 5,000 kbps (5 Mbps) over your video duration, allocating 320 kbps to high-fidelity audio leaves 4,680 kbps for the video track. If audio bitrate is omitted from your calculation, the resulting video file will consistently exceed your target size by the cumulative volume of the audio stream.
          </p>
        </div>
      </section>

      {/* 6. How to estimate storage for recording */}
      <section className={styles.contentSection} aria-labelledby="recording-heading">
        <h2 id="recording-heading" className={styles.supportingTitle}>
          How to estimate storage for field recording
        </h2>
        <div className={styles.prose}>
          <p>
            When preparing storage cards or external SSDs for camera recording, consider these practical practices:
          </p>
          <ul className={styles.itemList}>
            <li>
              <strong>Check manufacturer storage definitions:</strong> Memory cards are sold using decimal gigabytes (1 GB = 1,000,000,000 bytes). If an operating system formats and reports storage in binary gibibytes (1 GiB = 1,073,741,824 bytes), a &ldquo;128 GB&rdquo; card will display approximately 119.2 GiB of usable capacity before recording begins.
            </li>
            <li>
              <strong>Reserve safety margins:</strong> Operating systems require filesystem tables (such as exFAT file allocation tables) and may prevent recording when media reaches high capacity. Plan recording duration with an appropriate safety buffer.
            </li>
          </ul>
        </div>
      </section>

      {/* 7. Common calculation mistakes */}
      <section className={styles.contentSection} aria-labelledby="common-mistakes-heading">
        <h2 id="common-mistakes-heading" className={styles.supportingTitle}>
          Common calculation mistakes to avoid
        </h2>
        <div className={styles.prose}>
          <ul className={styles.itemList}>
            <li>
              <strong>Confusing Mbps with MB/s:</strong> Megabits per second (Mbps) measures transmission rate, while megabytes per second (MB/s) measures storage rate. Because 1 byte contains 8 bits, recording at 80 Mbps writes 10 MB/s to your drive, not 80 MB/s.
            </li>
            <li>
              <strong>Overlooking audio bitrate:</strong> Calculating target video bitrate without deducting the audio stream causes encoded videos to exceed target file limits.
            </li>
            <li>
              <strong>Mixing decimal GB with binary GiB:</strong> A 10 GB file equals 10,000,000,000 bytes, whereas 10 GiB equals 10,737,418,240 bytes. Ensure your unit selection matches your distribution destination.
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
              How do I calculate file size from video bitrate?
            </div>
            <div className={styles.faqAnswer}>
              Add the video bitrate and audio bitrate together to obtain the total bitrate in bits per second. Multiply this total by the duration in seconds, then divide by 8 to get total bytes. Finally, convert bytes into your desired unit (such as megabytes or gigabytes).
            </div>
          </div>

          <div className={styles.faqItem}>
            <div className={styles.faqQuestion}>
              Does video resolution directly change file size?
            </div>
            <div className={styles.faqAnswer}>
              Resolution (such as 1080p or 4K) does not directly determine file size; bitrate does. A 4K video encoded at 15 Mbps will produce the same mathematical stream file size as a 1080p video encoded at 15 Mbps over the same duration, although visual quality per pixel will differ substantially.
            </div>
          </div>

          <div className={styles.faqItem}>
            <div className={styles.faqQuestion}>
              What is the difference between VBR and CBR file sizes?
            </div>
            <div className={styles.faqAnswer}>
              CBR (Constant Bitrate) maintains an identical data rate across every second of video, making final file size mathematically predictable. VBR (Variable Bitrate) dynamically shifts bandwidth according to scene complexity, so file size calculations using VBR reflect the target average bitrate rather than an absolute constant.
            </div>
          </div>

          <div className={styles.faqItem}>
            <div className={styles.faqQuestion}>
              Why is my exported file slightly larger than the calculated size?
            </div>
            <div className={styles.faqAnswer}>
              Calculations evaluate stream payloads. Exported media files include container wrapper overhead (such as MP4 or MOV headers), metadata, audio track padding, timecode tracks, and chapter markers. Container overhead, metadata, additional tracks, muxing behavior, and encoder output can cause the final file size to differ from a pure bitrate × duration estimate.
            </div>
          </div>
        </div>
      </section>

      {/* 9. Related tools */}
      <section className={styles.contentSection} aria-labelledby="related-tools-heading">
        <nav className={styles.relatedTools} aria-label="Related tools">
          <span id="related-tools-heading">Need other calculations or unit conversions?</span>
          <Link href="/upload-time-calculator" className={styles.relatedLink}>
            Upload Time Calculator
          </Link>
          <span style={{ color: 'var(--border-strong)', margin: '0 0.5rem' }}>·</span>
          <Link href="/file-transfer-time-calculator" className={styles.relatedLink}>
            File Transfer Time Calculator
          </Link>
          <span style={{ color: 'var(--border-strong)', margin: '0 0.5rem' }}>·</span>
          <Link href="/mbps-to-mbs" className={styles.relatedLink}>
            Mbps to MB/s Converter
          </Link>
          <span style={{ color: 'var(--border-strong)', margin: '0 0.5rem' }}>·</span>
          <Link href="/" className={styles.relatedLink}>
            Download Time Calculator
          </Link>
        </nav>
      </section>
    </main>
  );
}
