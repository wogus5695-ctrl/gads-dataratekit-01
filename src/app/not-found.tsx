import React from 'react';
import Link from 'next/link';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <div className={styles.errorCode}>404 Error</div>
        <h1 className={styles.title}>Page not found</h1>
        <p className={styles.description}>
          The page you&apos;re looking for doesn&apos;t exist or has moved. Explore our core data transfer tools below:
        </p>

        <section className={styles.navSection} aria-label="Available Tools">
          <div className={styles.navTitle}>Available DataRateKit tools:</div>
          <div className={styles.toolGrid}>
            <Link href="/" className={styles.toolLink}>
              Download Time Calculator
            </Link>
            <Link href="/upload-time-calculator" className={styles.toolLink}>
              Upload Time Calculator
            </Link>
            <Link href="/file-transfer-time-calculator" className={styles.toolLink}>
              File Transfer Time Calculator
            </Link>
            <Link href="/mbps-to-mbs" className={styles.toolLink}>
              Mbps to MB/s Converter
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
