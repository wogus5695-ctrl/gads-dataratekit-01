'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Header.module.css';

const NAV_ITEMS = [
  { href: '/', label: 'Download' },
  { href: '/upload-time-calculator', label: 'Upload' },
  { href: '/file-transfer-time-calculator', label: 'File Transfer' },
  { href: '/mbps-to-mbs', label: 'Mbps ↔ MB/s' },
] as const;

export function Header() {
  const pathname = usePathname();
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const handleLinkClick = () => {
    if (detailsRef.current) {
      detailsRef.current.removeAttribute('open');
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label="DataRateKit Home">
          DataRateKit
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.desktopNav} aria-label="Main Navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Tools Disclosure */}
        <div className={styles.mobileNavContainer}>
          <details className={styles.mobileDetails} ref={detailsRef}>
            <summary className={styles.mobileSummary}>
              <span>Tools</span>
              <span className={styles.menuCaret} aria-hidden="true">
                ▾
              </span>
            </summary>
            <nav className={styles.mobileMenu} aria-label="Mobile Tools Navigation">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleLinkClick}
                    className={`${styles.mobileLink} ${isActive ? styles.mobileLinkActive : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span>{item.label}</span>
                    {isActive && <span style={{ fontSize: '0.6875rem' }}>✓</span>}
                  </Link>
                );
              })}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
