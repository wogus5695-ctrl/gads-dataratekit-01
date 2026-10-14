import React from 'react';
import Link from 'next/link';
import styles from './Footer.module.css';

const FOOTER_LINKS = [
  { href: '/', label: 'Download' },
  { href: '/upload-time-calculator', label: 'Upload' },
  { href: '/file-transfer-time-calculator', label: 'File Transfer' },
  { href: '/mbps-to-mbs', label: 'Mbps ↔ MB/s' },
] as const;

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brandCol}>
          <Link href="/" className={styles.brand} aria-label="DataRateKit Home">
            DataRateKit
          </Link>
          <div className={styles.copyright}>© 2026 DataRateKit. All rights reserved.</div>
        </div>

        <nav className={styles.nav} aria-label="Footer Navigation">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={styles.navLink}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
