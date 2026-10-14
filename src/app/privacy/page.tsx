import React from 'react';
import type { Metadata } from 'next';
import { getCanonicalUrl } from '@/config/site';
import styles from '../info.module.css';

const title = 'Privacy Policy';
const description =
  'DataRateKit Privacy Policy: Learn how data is handled, our client-side calculation model, hosting log practices, and advertising disclosures.';
const canonical = getCanonicalUrl('/privacy');

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

export default function PrivacyPolicyPage() {
  return (
    <main className={styles.contentContainer}>
      <header className={styles.headerSection}>
        <h1 className={styles.title}>Privacy Policy</h1>
        <div className={styles.lastUpdated}>Effective Date: October 2026</div>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>1. Overview and Core Philosophy</h2>
        <div className={styles.prose}>
          <p>
            DataRateKit (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;the site&rdquo;) is an open, browser-based data rate and transfer time calculation utility. We value your privacy and believe in minimal data footprint. You do not need to create an account, register, or provide any personal information to use any of our calculators and conversion tools.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>2. Calculator Data and Client-Side Processing</h2>
        <div className={styles.prose}>
          <p>
            All calculations—including download time, upload duration, local file transfer speed, and bandwidth unit conversions—are executed entirely in your web browser via client-side JavaScript.
          </p>
          <p>
            DataRateKit does not operate or maintain a database of your calculator input numbers or calculation results. When you use our &ldquo;Copy link&rdquo; or state-sharing features, the selected values and units are encoded directly into the web address (URL query parameters) so that you or anyone you share the link with can restore the same calculation state.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>3. Web Hosting and Server Infrastructure</h2>
        <div className={styles.prose}>
          <p>
            DataRateKit is hosted on modern cloud infrastructure provided by Vercel Inc. Like virtually all web hosts, the underlying hosting platform may automatically record standard technical log entries when your browser requests web pages, assets, or shareable URLs.
          </p>
          <p>
            These technical logs may include your IP address, browser user-agent string, operating system version, the requested URL path, and timestamps. This information is processed strictly for infrastructure security, network routing, DDoS mitigation, and operational reliability.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>4. Google AdSense and Third-Party Advertising Disclosures</h2>
        <div className={styles.prose}>
          <p>
            To keep our utility free and accessible to everyone, DataRateKit may display third-party advertisements served by Google AdSense and its advertising partners.
          </p>
          <p>
            In connection with serving advertisements:
          </p>
          <ul>
            <li>
              Third-party vendors, including Google, use cookies, device identifiers, or similar tracking technologies to serve ads based on a user&rsquo;s prior visits to this website or other websites on the Internet.
            </li>
            <li>
              Google&rsquo;s use of advertising cookies enables it and its partners to serve ads to our users based on their visits to DataRateKit and/or other sites across the Web.
            </li>
            <li>
              Users may opt out of personalized advertising at any time by visiting{' '}
              <a
                href="https://adssettings.google.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Ads Settings
              </a>
              . Alternatively, users can opt out of third-party vendors&rsquo; use of cookies for personalized advertising by visiting{' '}
              <a
                href="https://www.aboutads.info/choices/"
                target="_blank"
                rel="noopener noreferrer"
              >
                aboutads.info
              </a>
              .
            </li>
          </ul>
          <p>
            For more information on how Google manages information gathered from websites using its services, please refer to Google&rsquo;s official documentation on{' '}
            <a
              href="https://policies.google.com/technologies/partner-sites"
              target="_blank"
              rel="noopener noreferrer"
            >
              How Google uses information from sites or apps that use our services
            </a>
            .
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>5. Consent Management and Regional Privacy Rights</h2>
        <div className={styles.prose}>
          <p>
            If you access DataRateKit from the European Economic Area (EEA), the United Kingdom (UK), or Switzerland, we facilitate required cookie and advertising consent choices in accordance with applicable regional privacy frameworks (such as GDPR and ePrivacy regulations) using a Google-certified Consent Management Platform (CMP).
          </p>
          <p>
            You have the right to accept, reject, or customize your advertising and cookie preferences where required by law.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>6. Third-Party Analytics</h2>
        <div className={styles.prose}>
          <p>
            DataRateKit does not currently run behavioral web tracking suites or intrusive user fingerprinting scripts. If we implement basic aggregated web analytics in the future to understand overall site performance, this Privacy Policy will be promptly updated to reflect those practices.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>7. Contact Us</h2>
        <div className={styles.prose}>
          <p>
            If you have any questions, suggestions, or concerns regarding this Privacy Policy or our data handling practices, please contact us by email:
          </p>
          <div className={styles.callout}>
            <strong>Email:</strong>{' '}
            <a href="mailto:wogus5695@gmail.com">wogus5695@gmail.com</a>
          </div>
        </div>
      </section>
    </main>
  );
}
