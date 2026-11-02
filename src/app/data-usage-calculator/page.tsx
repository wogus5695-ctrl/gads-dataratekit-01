import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { DataUsageCalculator } from '@/components/calculator/DataUsageCalculator';
import { getCanonicalUrl } from '@/config/site';
import styles from '../page.module.css';

const title = 'Free Data Usage Calculator — Daily & Monthly Internet Data';
const description =
  'Estimate daily, weekly, and monthly internet data usage across multiple activities and devices. Evaluate data plan caps with verified official streaming presets.';
const canonical = getCanonicalUrl('/data-usage-calculator');

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

export default function DataUsageCalculatorPage() {
  return (
    <main className={styles.pageContainer}>
      <header className={styles.headerSection}>
        <h1 className={styles.title}>Internet Data Usage Calculator</h1>
        <p className={styles.description}>
          Estimate how much internet data your household or remote setup consumes per day, week, and billing period. Combine multiple streaming, audio, and custom network activities with device multipliers to plan data caps effectively.
        </p>
      </header>

      <DataUsageCalculator />

      {/* 1. How Internet Data Usage Is Calculated */}
      <section className={styles.contentSection} aria-labelledby="how-it-works-heading">
        <h2 id="how-it-works-heading" className={styles.supportingTitle}>
          How Internet Data Usage Is Calculated
        </h2>
        <div className={styles.prose}>
          <p>
            Internet data consumption represents the cumulative volume of digital information transmitted across your network connection over time. Each individual online task consumes data proportional to its active transfer rate, daily duration, and the number of active devices:
          </p>
          <div>
            <div className={styles.formulaBox}>
              Daily Usage (Bytes) = Transfer Rate (Bytes per second) × Duration (seconds) × Device Count
            </div>
          </div>
          <p>
            When multiple family members, workstations, or smart appliances share a single connection, the total network load is the arithmetic sum of all simultaneous and sequential activities across the household:
          </p>
          <div>
            <div className={styles.formulaBox}>
              Period Total = Σ (Activity Daily Usage) × Billing Days
            </div>
          </div>
          <p>
            For example, streaming video at 3 Mbps (375,000 bytes per second) for 2 hours (7,200 seconds) on a single laptop consumes exactly 2,700,000,000 bytes (2.7 decimal GB per day). Over a 30-day planning cycle, this single habit accounts for 81 GB of internet traffic. These default activities represent neutral mathematical examples rather than typical or recommended usage presets.
          </p>
        </div>
      </section>

      {/* 2. Bandwidth vs Data Volume */}
      <section className={styles.contentSection} aria-labelledby="bandwidth-vs-volume-heading">
        <h2 id="bandwidth-vs-volume-heading" className={styles.supportingTitle}>
          Bandwidth (Mbps) vs. Data Volume (GB)
        </h2>
        <div className={styles.prose}>
          <p>
            A frequent point of confusion when planning internet usage is the technical distinction between connection speed and total data volume:
          </p>
          <ul className={styles.itemList}>
            <li>
              <strong>Bandwidth (Mbps or Gbps):</strong> Measures the instantaneous pipeline capacity or velocity of data transmission. A 100 Mbps internet connection indicates your pipe can transfer up to 100 million bits in one second.
            </li>
            <li>
              <strong>Data Volume (GB or TB):</strong> Measures the accumulated quantity of storage units transferred through that pipe over a billing cycle. While higher bandwidth allows files to finish faster, your total monthly bill or quota is determined solely by the volume consumed.
            </li>
          </ul>
          <p>
            Operating systems, mobile service providers, and home broadband ISPs measure monthly allowances in decimal gigabytes (1 GB = 1,000,000,000 bytes) or terabytes (1 TB = 1,000 GB).
          </p>
        </div>
      </section>

      {/* 3. Daily, Weekly, and Billing-Period Usage */}
      <section className={styles.contentSection} aria-labelledby="planning-periods-heading">
        <h2 id="planning-periods-heading" className={styles.supportingTitle}>
          Daily, Weekly, and Billing-Period Planning
        </h2>
        <div className={styles.prose}>
          <p>
            Internet usage naturally fluctuates between business days and weekends. By establishing a normalized daily baseline, you can project usage across standard calendar timeframes:
          </p>
          <ul className={styles.itemList}>
            <li>
              <strong>Weekly Planning (7 Days):</strong> Provides an immediate operational check against short-term travel SIM quotas or weekly mobile hotspot thresholds.
            </li>
            <li>
              <strong>30-Day Planning Period:</strong> Widely utilized as an accessible monthly planning model for home internet budgeting and subscription alignment.
            </li>
            <li>
              <strong>Flexible Billing Cycles (28, 30, 31, or Custom Days):</strong> Mobile carriers often bill on strict 28-day (4-week) schedules, whereas wireline providers follow calendar months ranging from 28 to 31 days. Customizing your cycle length ensures planning alignment with your ISP billing statement.
            </li>
          </ul>
        </div>
      </section>

      {/* 4. Multiple Devices and Concurrent Usage */}
      <section className={styles.contentSection} aria-labelledby="multi-device-heading">
        <h2 id="multi-device-heading" className={styles.supportingTitle}>
          Multiple Devices and Concurrent Usage
        </h2>
        <div className={styles.prose}>
          <p>
            Modern homes routinely support multiple simultaneous video and audio streams across tablets, smart televisions, and smartphones. Each additional concurrent device running an application doubles the bandwidth demands and total data consumption of that stream:
          </p>
          <p>
            If two household members stream High Definition video (3 GB/hour) independently for 3 hours every evening, daily consumption rises to 18 GB per day (3 GB/hr × 3 hours × 2 devices), accumulating to 540 GB across a 30-day period.
          </p>
        </div>
      </section>

      {/* 5. Understanding Broadband and Mobile Data Caps */}
      <section className={styles.contentSection} aria-labelledby="data-caps-heading">
        <h2 id="data-caps-heading" className={styles.supportingTitle}>
          Understanding Broadband and Mobile Data Caps
        </h2>
        <div className={styles.prose}>
          <p>
            Depending on your provider, region, and subscription agreement, internet plans may include a monthly data allowance or enforce a Fair Usage Policy (FUP). Where data limits apply, network operators typically handle excess volume through various plan-specific mechanisms:
          </p>
          <ul className={styles.itemList}>
            <li>
              <strong>Overage Charges:</strong> Some providers automatically assess additional charges or bill per gigabyte when consumption exceeds your tier limit.
            </li>
            <li>
              <strong>Speed Throttling:</strong> On certain plans, transfer rates are reduced to basic speeds for the remainder of the billing cycle once a threshold is reached.
            </li>
            <li>
              <strong>Deprioritization:</strong> Traffic may be deprioritized only during periods of local cell or node congestion, while maintaining standard speeds during normal hours.
            </li>
          </ul>
          <p>
            The Data Cap evaluator in this calculator projects linear progress based on current inputs, helping you compare your estimated consumption against whatever threshold your specific plan enforces.
          </p>
        </div>
      </section>

      {/* 6. Why Real-World Data Usage Can Vary */}
      <section className={styles.contentSection} aria-labelledby="variance-heading">
        <h2 id="variance-heading" className={styles.supportingTitle}>
          Why Real-World Data Usage Can Vary
        </h2>
        <div className={styles.prose}>
          <p>
            Mathematical projections provide an indispensable planning baseline, but actual internet provider measurements can diverge due to dynamic network behavior:
          </p>
          <ul className={styles.itemList}>
            <li>
              <strong>Adaptive Bitrate Streaming (ABR):</strong> Video players continuously adjust resolution and bitrate according to momentary Wi-Fi signal strength and ISP routing conditions.
            </li>
            <li>
              <strong>Operating System and Game Updates:</strong> Background OS updates, application patches, and console game downloads can consume tens of gigabytes in single unattended sessions.
            </li>
            <li>
              <strong>Automated Cloud Backups:</strong> Smartphone photo synchronization, cloud drive mirroring, and off-site computer backups transmit significant upstream data outside regular browsing hours.
            </li>
            <li>
              <strong>Packet Framing and Protocol Overhead:</strong> Transport protocols (TCP/IP, TLS/HTTPS, and Wi-Fi headers) introduce small packet encapsulation layers that add to total metered line traffic.
            </li>
          </ul>
        </div>
      </section>

      {/* 7. Official Preset Methodology */}
      <section className={styles.contentSection} aria-labelledby="methodology-heading">
        <h2 id="methodology-heading" className={styles.supportingTitle}>
          Official Preset Methodology & Sources
        </h2>
        <div className={styles.prose}>
          <p>
            To avoid misleading generalizations, DataRateKit maintains a strict factual policy regarding service presets:
          </p>
          <ul className={styles.itemList}>
            <li>
              <strong>Official Published Data Only:</strong> We exclusively curate presets directly documented in official provider help centers or technical developer documentation (such as Netflix published gigabyte-per-hour settings and Spotify official stream bitrates).
            </li>
            <li>
              <strong>No Unverified Third-Party Estimates:</strong> Generic assumptions such as &ldquo;Web browsing = 50 MB/hr&rdquo; or &ldquo;Gaming = 100 MB/hr&rdquo; are intentionally excluded from preset menus, as real-world consumption varies radically by content and engine.
            </li>
            <li>
              <strong>Transparent Source Auditing:</strong> Each preset card displays its official document title, verification date, and direct documentation link. Users can freely override any value using Custom Activity mode.
            </li>
          </ul>
        </div>
      </section>

      {/* 8. FAQ */}
      <section className={styles.contentSection} aria-labelledby="faq-heading">
        <h2 id="faq-heading" className={styles.supportingTitle}>
          Frequently Asked Questions
        </h2>
        <div className={styles.faqList}>
          <div className={styles.faqItem}>
            <div className={styles.faqQuestion}>
              How much internet data does streaming video use?
            </div>
            <div className={styles.faqAnswer}>
              Data usage depends directly on selected video resolution and stream bitrate. According to official provider documentation, standard definition (SD) typically consumes up to 1 GB per hour, high definition (1080p HD) consumes up to 3 GB per hour, and 4K Ultra HD consumes up to 7 GB per hour under high-quality settings.
            </div>
          </div>

          <div className={styles.faqItem}>
            <div className={styles.faqQuestion}>
              Does 100 Mbps internet mean I use 100 MB of data?
            </div>
            <div className={styles.faqAnswer}>
              No. 100 Mbps measures connection speed in megabits per second, not consumed volume in megabytes. Because 8 bits equal 1 byte, a connection running continuously at 100 Mbps transfers approximately 12.5 megabytes per second (MB/s), which accumulates to 45 GB of data per hour if sustained at full line capacity.
            </div>
          </div>

          <div className={styles.faqItem}>
            <div className={styles.faqQuestion}>
              How can I calculate data usage for work meetings?
            </div>
            <div className={styles.faqAnswer}>
              Because video conferencing tools adapt dynamically to participant counts and screen shares, add a Custom Activity with your meeting bitrate. Typical 720p 1:1 video calls consume approximately 1.2 Mbps to 1.5 Mbps, which equals roughly 540 MB to 675 MB per hour of active meeting time.
            </div>
          </div>

          <div className={styles.faqItem}>
            <div className={styles.faqQuestion}>
              Why is a 30-day period used instead of calendar months?
            </div>
            <div className={styles.faqAnswer}>
              A 30-day cycle provides a standardized, easily comparable planning baseline across months of differing lengths (28 to 31 days). You can toggle between 28, 30, 31, or custom cycle days in the calculator header to match your exact provider billing cycle.
            </div>
          </div>
        </div>
      </section>

      {/* 9. Related Tools */}
      <section className={styles.contentSection} aria-labelledby="related-tools-heading">
        <nav className={styles.relatedTools} aria-label="Related tools">
          <span id="related-tools-heading">Need other calculations or unit conversions?</span>
          <Link href="/mbps-to-mbs" className={styles.relatedLink}>
            Mbps to MB/s Converter
          </Link>
          <span style={{ color: 'var(--border-strong)', margin: '0 0.5rem' }}>·</span>
          <Link href="/video-file-size-calculator" className={styles.relatedLink}>
            Video File Size Calculator
          </Link>
          <span style={{ color: 'var(--border-strong)', margin: '0 0.5rem' }}>·</span>
          <Link href="/" className={styles.relatedLink}>
            Download Time Calculator
          </Link>
          <span style={{ color: 'var(--border-strong)', margin: '0 0.5rem' }}>·</span>
          <Link href="/upload-time-calculator" className={styles.relatedLink}>
            Upload Time Calculator
          </Link>
        </nav>
      </section>
    </main>
  );
}
