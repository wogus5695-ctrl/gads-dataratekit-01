import React from 'react';
import Link from 'next/link';
import styles from './Footer.module.css';

const TOOL_LINKS = [
  { href: '/', label: 'Download' },
  { href: '/upload-time-calculator', label: 'Upload' },
  { href: '/file-transfer-time-calculator', label: 'File Transfer' },
  { href: '/mbps-to-mbs', label: 'Mbps ↔ MB/s' },
] as const;

const LEGAL_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Use' },
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

        <div className={styles.navGroups}>
          <nav className={styles.nav} aria-label="Calculators and Tools">
            {TOOL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={styles.navLink}>
                {link.label}
              </Link>
            ))}
          </nav>
          <nav className={styles.navSecondary} aria-label="Site and Legal">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={styles.navLinkSecondary}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
