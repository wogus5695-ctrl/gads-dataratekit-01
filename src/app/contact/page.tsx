import React from 'react';
import type { Metadata } from 'next';
import { getCanonicalUrl } from '@/config/site';
import styles from '../info.module.css';

const title = 'Contact DataRateKit';
const description =
  'Contact DataRateKit: Send calculation feedback, report formula discrepancies, request new features, or ask privacy questions.';
const canonical = getCanonicalUrl('/contact');

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

export default function ContactPage() {
  return (
    <main className={styles.contentContainer}>
      <header className={styles.headerSection}>
        <h1 className={styles.title}>Contact DataRateKit</h1>
        <div className={styles.lastUpdated}>User Support and Feedback</div>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Get in Touch</h2>
        <div className={styles.prose}>
          <p>
            We welcome feedback, suggestions, bug reports, and inquiries from our users. Whether you have discovered a calculation discrepancy, want to suggest a new unit or interface preset, or have a question about our privacy policy, please reach out to us directly:
          </p>
          <div className={styles.callout}>
            <strong>Direct Support Email:</strong>{' '}
            <a href="mailto:wogus5695@gmail.com">wogus5695@gmail.com</a>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Reporting Calculation Discrepancies</h2>
        <div className={styles.prose}>
          <p>
            If you believe one of our calculators or unit converters produced an unexpected result, including the following details in your email will help us investigate quickly:
          </p>
          <ul>
            <li>The specific calculator page URL (e.g., Download, Upload, or File Transfer).</li>
            <li>Your exact input values (file size, speed, and selected units).</li>
            <li>Whether the real-world 90% efficiency toggle was enabled.</li>
            <li>The result you received versus the result you expected, including any source reference.</li>
          </ul>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>General Inquiries and Policy Questions</h2>
        <div className={styles.prose}>
          <p>
            For privacy inquiries, DMCA notices, or partnership questions, please send an email to the address listed above. We strive to review and respond to legitimate inquiries within 2 to 3 business days.
          </p>
        </div>
      </section>
    </main>
  );
}
