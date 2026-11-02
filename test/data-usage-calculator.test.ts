import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDataUsage,
  calculateSingleActivity,
  rateToBytesPerSecond,
  formatDataBytes,
  resolveBillingDays,
} from '../src/lib/data-usage/calculations';
import {
  serializeDataUsageState,
  parseDataUsageState,
  DEFAULT_DATA_USAGE_STATE,
} from '../src/lib/data-usage/url-state';
import { VERIFIED_DATA_USAGE_PRESETS } from '../src/data/data-usage-presets';

describe('Internet Data Usage Calculator Engine', () => {
  // 1. Single activity calculation
  it('calculates single activity correctly (5 Mbps for 2 hours on 1 device -> 4.5 GB/day)', () => {
    // 5 Mbps = 625,000 B/s
    // 2 hours = 7,200s
    // Total = 625,000 * 7,200 = 4,500,000,000 bytes = 4.5 GB
    const act = {
      id: 'test-1',
      name: 'Streaming',
      rateValue: 5,
      rateUnit: 'Mbps' as const,
      hoursPerDay: 2,
      minutesPerDay: 0,
      devices: 1,
    };
    const res = calculateSingleActivity(act, 30);

    assert.strictEqual(res.dailyBytes, 4_500_000_000);
    assert.strictEqual(res.dailyGb, 4.5);
    assert.strictEqual(res.dailyFormatted, '4.5 GB');
    assert.strictEqual(res.weeklyGb, 31.5);
    assert.strictEqual(res.billingPeriodGb, 135);
  });

  // 2. Multiple activities aggregation
  it('aggregates multiple activities correctly', () => {
    // Act 1: 5 Mbps, 2h, 1 dev -> 4.5 GB/day
    // Act 2: 3 GB/hr, 1h, 1 dev -> 3 GB/day
    const res = calculateDataUsage({
      activities: [
        {
          id: '1',
          name: 'Video',
          rateValue: 5,
          rateUnit: 'Mbps',
          hoursPerDay: 2,
          minutesPerDay: 0,
          devices: 1,
        },
        {
          id: '2',
          name: 'Netflix HD',
          rateValue: 3,
          rateUnit: 'GB/hr',
          hoursPerDay: 1,
          minutesPerDay: 0,
          devices: 1,
        },
      ],
      billingPeriodOption: 30,
    });

    assert.strictEqual(res.totalDailyGb, 7.5);
    assert.strictEqual(res.totalWeeklyGb, 52.5);
    assert.strictEqual(res.totalBillingGb, 225);
  });

  // 3. Multiple devices multiplier
  it('multiplies usage linearly by active device count', () => {
    // 5 Mbps, 2h, 3 devices -> 4.5 * 3 = 13.5 GB/day
    const act = {
      id: 'test-3',
      name: 'Family stream',
      rateValue: 5,
      rateUnit: 'Mbps' as const,
      hoursPerDay: 2,
      minutesPerDay: 0,
      devices: 3,
    };
    const res = calculateSingleActivity(act, 30);
    assert.strictEqual(res.dailyGb, 13.5);
  });

  // 4. Mbps to GB/day
  it('converts Mbps correctly to daily GB volume', () => {
    // 10 Mbps for 1 hour: 10 * 1,000,000 / 8 * 3600 = 4,500,000,000 bytes = 4.5 GB
    const bps = rateToBytesPerSecond(10, 'Mbps');
    assert.strictEqual(bps, 1_250_000);
    const dayBytes = bps * 3600;
    assert.strictEqual(dayBytes, 4_500_000_000);
  });

  // 5. kbps to 30-day usage
  it('converts low-bandwidth audio streams (160 kbps) across 30 days accurately', () => {
    // 160 kbps = 20,000 B/s
    // 1 hour = 3600s -> 72,000,000 bytes = 72 MB/day
    // 30 days -> 2,160,000,000 bytes = 2.16 GB
    const act = {
      id: 'audio-1',
      name: 'Music',
      rateValue: 160,
      rateUnit: 'kbps' as const,
      hoursPerDay: 1,
      minutesPerDay: 0,
      devices: 1,
    };
    const res = calculateSingleActivity(act, 30);
    assert.strictEqual(res.dailyBytes, 72_000_000);
    assert.strictEqual(res.billingPeriodGb, 2.16);
  });

  // 6. GB/hr direct input
  it('processes GB/hr rate accurately', () => {
    const bps = rateToBytesPerSecond(3, 'GB/hr');
    // 3 GB / 3600s
    assert.ok(Math.abs(bps - 3_000_000_000 / 3600) < 0.0001);
    const act = {
      id: 'gbhr-1',
      name: 'UHD Video',
      rateValue: 3,
      rateUnit: 'GB/hr' as const,
      hoursPerDay: 2,
      minutesPerDay: 0,
      devices: 1,
    };
    const res = calculateSingleActivity(act, 30);
    // 3 GB/hr * 2hr = 6 GB/day -> 30 days = 180 GB
    assert.strictEqual(res.dailyGb, 6);
    assert.strictEqual(res.billingPeriodGb, 180);
  });

  // 7. MB/hr direct input
  it('processes MB/hr rate accurately', () => {
    const act = {
      id: 'mbhr-1',
      name: 'Low bitrate stream',
      rateValue: 500,
      rateUnit: 'MB/hr' as const,
      hoursPerDay: 4,
      minutesPerDay: 0,
      devices: 1,
    };
    const res = calculateSingleActivity(act, 30);
    // 500 MB/hr * 4hr = 2,000 MB = 2 GB/day
    assert.strictEqual(res.dailyGb, 2);
  });

  // 8. Billing days (28, 30, 31)
  it('calculates billing periods for 28, 30, and 31 days correctly', () => {
    assert.strictEqual(resolveBillingDays(28), 28);
    assert.strictEqual(resolveBillingDays(30), 30);
    assert.strictEqual(resolveBillingDays(31), 31);

    const baseAct = {
      id: '1',
      name: 'Video',
      rateValue: 1,
      rateUnit: 'GB/hr' as const,
      hoursPerDay: 1,
      minutesPerDay: 0,
      devices: 1,
    };

    const res28 = calculateDataUsage({ activities: [baseAct], billingPeriodOption: 28 });
    const res30 = calculateDataUsage({ activities: [baseAct], billingPeriodOption: 30 });
    const res31 = calculateDataUsage({ activities: [baseAct], billingPeriodOption: 31 });

    assert.strictEqual(res28.totalBillingGb, 28);
    assert.strictEqual(res30.totalBillingGb, 30);
    assert.strictEqual(res31.totalBillingGb, 31);
  });

  // 9. Custom billing days
  it('handles custom billing days with validation fallback', () => {
    assert.strictEqual(resolveBillingDays('custom', 45), 45);
    // Fallback on negative or invalid
    assert.strictEqual(resolveBillingDays('custom', -5), 30);
    assert.strictEqual(resolveBillingDays('custom', 0), 30);
    assert.strictEqual(resolveBillingDays('custom', 500), 30);
  });

  // 10. Data cap utilization
  it('calculates data cap utilization percentage correctly', () => {
    const act = {
      id: '1',
      name: 'Heavy use',
      rateValue: 10,
      rateUnit: 'GB/hr' as const,
      hoursPerDay: 1,
      minutesPerDay: 0,
      devices: 1,
    }; // 10 GB/day -> 30 days = 300 GB

    const res = calculateDataUsage({
      activities: [act],
      billingPeriodOption: 30,
      enableDataCap: true,
      dataCapValue: 600,
      dataCapUnit: 'GB',
    });

    assert.ok(res.capResult);
    if (!res.capResult) return;
    assert.strictEqual(res.capResult.utilizationPercent, 50);
    assert.strictEqual(res.capResult.isOverPlan, false);
    assert.strictEqual(res.capResult.remainingBytes, 300_000_000_000);
  });

  // 11. Remaining data calculation
  it('calculates remaining data buffer correctly', () => {
    const act = {
      id: '1',
      name: 'Use',
      rateValue: 10,
      rateUnit: 'GB/hr' as const,
      hoursPerDay: 1,
      minutesPerDay: 0,
      devices: 1,
    };
    const res = calculateDataUsage({
      activities: [act],
      billingPeriodOption: 30,
      enableDataCap: true,
      dataCapValue: 1,
      dataCapUnit: 'TB', // 1,000 GB
    });

    assert.ok(res.capResult);
    if (!res.capResult) return;
    assert.strictEqual(res.capResult.remainingBytes, 700_000_000_000);
  });

  // 12. Over-plan state
  it('identifies over-plan state and calculates excess data accurately', () => {
    const act = {
      id: '1',
      name: 'Heavy stream',
      rateValue: 20,
      rateUnit: 'GB/hr' as const,
      hoursPerDay: 1,
      minutesPerDay: 0,
      devices: 1,
    }; // 20 GB/day -> 600 GB

    const res = calculateDataUsage({
      activities: [act],
      billingPeriodOption: 30,
      enableDataCap: true,
      dataCapValue: 500,
      dataCapUnit: 'GB',
    });

    assert.ok(res.capResult);
    if (!res.capResult) return;
    assert.strictEqual(res.capResult.isOverPlan, true);
    assert.strictEqual(res.capResult.overPlanBytes, 100_000_000_000);
    assert.strictEqual(res.capResult.overPlanFormatted, '100 GB');
  });

  // 13. Days to cap calculation
  it('projects days until cap based on daily rate', () => {
    const act = {
      id: '1',
      name: 'Use',
      rateValue: 10,
      rateUnit: 'GB/hr' as const,
      hoursPerDay: 1,
      minutesPerDay: 0,
      devices: 1,
    }; // 10 GB/day

    const res = calculateDataUsage({
      activities: [act],
      billingPeriodOption: 30,
      enableDataCap: true,
      dataCapValue: 250,
      dataCapUnit: 'GB',
    });

    assert.ok(res.capResult);
    if (!res.capResult) return;
    assert.strictEqual(res.capResult.daysUntilCap, 25);
    assert.strictEqual(res.capResult.daysUntilCapFormatted, '25 days');
  });

  // 14. Zero daily usage safe handling
  it('handles zero daily usage without crashing or NaN', () => {
    const act = {
      id: '1',
      name: 'Zero',
      rateValue: 0,
      rateUnit: 'Mbps' as const,
      hoursPerDay: 0,
      minutesPerDay: 0,
      devices: 1,
    };
    const res = calculateDataUsage({
      activities: [act],
      billingPeriodOption: 30,
      enableDataCap: true,
      dataCapValue: 1000,
      dataCapUnit: 'GB',
    });

    assert.strictEqual(res.totalDailyBytes, 0);
    assert.strictEqual(res.totalDailyFormatted, '0 MB');
    assert.ok(res.capResult);
    if (!res.capResult) return;
    assert.strictEqual(res.capResult.daysUntilCap, null);
    assert.strictEqual(res.capResult.daysUntilCapFormatted, 'No usage');
  });

  // 15. Negative and invalid rate handling
  it('sanitizes negative or NaN rate values to zero', () => {
    const act = {
      id: '1',
      name: 'Neg',
      rateValue: -15,
      rateUnit: 'Mbps' as const,
      hoursPerDay: 2,
      minutesPerDay: 0,
      devices: 1,
    };
    const res = calculateSingleActivity(act, 30);
    assert.strictEqual(res.dailyBytes, 0);
  });

  // 16. Invalid duration sanitization
  it('clamps hours to 0-24 and minutes to 0-59', () => {
    const act = {
      id: '1',
      name: 'Duration clamp',
      rateValue: 8,
      rateUnit: 'Mbps' as const,
      hoursPerDay: 30, // should clamp to 24
      minutesPerDay: 120, // should clamp to 59
      devices: 1,
    };
    const res = calculateSingleActivity(act, 30);
    assert.strictEqual(res.dailyDurationSeconds, 24 * 3600 + 59 * 60);
  });

  // 17. Zero devices validation
  it('enforces a minimum of 1 device', () => {
    const act = {
      id: '1',
      name: 'Zero dev',
      rateValue: 5,
      rateUnit: 'Mbps' as const,
      hoursPerDay: 1,
      minutesPerDay: 0,
      devices: 0, // should fallback to 1
    };
    const res = calculateSingleActivity(act, 30);
    assert.strictEqual(res.deviceCount, 1);
  });

  // 18. Official preset conversion
  it('loads official presets and connects source metadata properly', () => {
    const act = {
      id: 'netflix-act',
      name: 'Netflix HD',
      presetId: 'netflix-high-hd',
      rateValue: 3,
      rateUnit: 'GB/hr' as const,
      hoursPerDay: 2,
      minutesPerDay: 0,
      devices: 1,
    };
    const res = calculateSingleActivity(act, 30);
    assert.strictEqual(res.dailyGb, 6);
    assert.ok(res.sourceInfo);
    if (!res.sourceInfo) return;
    assert.strictEqual(res.sourceInfo.sourceType, 'official-usage');
    assert.strictEqual(
      res.sourceInfo.sourceName,
      'Netflix Help Center: How to control how much data Netflix uses'
    );
  });

  // 19. URL serialization
  it('serializes multi-activity calculator state into compact query string', () => {
    const query = serializeDataUsageState(DEFAULT_DATA_USAGE_STATE);
    assert.ok(query.includes('acts='));
    assert.ok(query.includes('Video') && query.includes('stream'));
    assert.ok(query.includes('Audio') && query.includes('stream'));
  });

  // 20. URL deserialization
  it('restores state from query parameters reliably', () => {
    const query = serializeDataUsageState({
      ...DEFAULT_DATA_USAGE_STATE,
      billingPeriodOption: 31,
      enableDataCap: true,
      dataCapValue: 1200,
      dataCapUnit: 'GB',
    });
    const parsed = parseDataUsageState(new URLSearchParams(query));

    assert.strictEqual(parsed.activities.length, 2);
    assert.strictEqual(parsed.billingPeriodOption, 31);
    assert.strictEqual(parsed.enableDataCap, true);
    assert.strictEqual(parsed.dataCapValue, 1200);
    assert.strictEqual(parsed.dataCapUnit, 'GB');
  });

  // 21. Format data bytes utility
  it('formats data volumes cleanly across MB, GB, and TB', () => {
    assert.strictEqual(formatDataBytes(500_000), '0.5 MB');
    assert.strictEqual(formatDataBytes(50_000_000), '50 MB');
    assert.strictEqual(formatDataBytes(2_500_000_000), '2.5 GB');
    assert.strictEqual(formatDataBytes(1_200_000_000_000), '1.2 TB');
  });
});

describe('Verified Presets Dataset Integrity', () => {
  it('guarantees all presets have non-empty source URLs and valid verification dates (2026-11-02)', () => {
    assert.ok(VERIFIED_DATA_USAGE_PRESETS.length >= 8);

    VERIFIED_DATA_USAGE_PRESETS.forEach((preset) => {
      assert.ok(preset.id && preset.id.length > 0, `Preset must have id: ${preset.id}`);
      assert.ok(preset.label && preset.label.length > 0, `Preset must have label: ${preset.id}`);
      assert.ok(preset.sourceName && preset.sourceName.length > 0, `Missing sourceName: ${preset.id}`);
      assert.ok(
        preset.sourceUrl && preset.sourceUrl.startsWith('https://'),
        `Preset must have valid HTTPS source URL: ${preset.id}`
      );
      assert.strictEqual(
        preset.lastVerified,
        '2026-11-02',
        `lastVerified must be current audit date 2026-11-02: ${preset.id}`
      );
      assert.ok(
        preset.sourceType === 'official-usage' || preset.sourceType === 'official-bitrate',
        `sourceType must be official-usage or official-bitrate: ${preset.id}`
      );
      assert.ok(preset.rateValue > 0, `rateValue must be positive: ${preset.id}`);
    });
  });

  it('guarantees official provider domain integrity for all curated presets', () => {
    const ALLOWED_HOSTS_BY_PROVIDER: Record<string, string> = {
      Netflix: 'help.netflix.com',
      Spotify: 'support.spotify.com',
      'YouTube Music': 'support.google.com',
    };

    VERIFIED_DATA_USAGE_PRESETS.forEach((preset) => {
      const url = new URL(preset.sourceUrl);
      const expectedHost = ALLOWED_HOSTS_BY_PROVIDER[preset.provider];
      assert.ok(expectedHost, `Unknown provider ${preset.provider}`);
      assert.strictEqual(
        url.hostname,
        expectedHost,
        `Preset ${preset.id} must be hosted on official domain ${expectedHost}, found ${url.hostname}`
      );
      if (preset.provider === 'YouTube Music') {
        assert.ok(
          url.pathname.includes('/youtubemusic/'),
          `YouTube Music preset URL must point to YouTube Music documentation path: ${preset.sourceUrl}`
        );
      }
    });
  });

  it('verifies premium condition metadata is explicitly noted for tiered quality presets', () => {
    const spotifyVeryHigh = VERIFIED_DATA_USAGE_PRESETS.find((p) => p.id === 'spotify-very-high');
    assert.ok(spotifyVeryHigh);
    if (spotifyVeryHigh) {
      assert.ok(spotifyVeryHigh.label.includes('Premium'), 'Spotify Very High label must mention Premium condition');
      assert.ok(spotifyVeryHigh.notes?.includes('Premium'), 'Spotify Very High notes must mention Premium condition');
    }

    const ytMusicHigh = VERIFIED_DATA_USAGE_PRESETS.find((p) => p.id === 'ytmusic-high');
    assert.ok(ytMusicHigh);
    if (ytMusicHigh) {
      assert.ok(ytMusicHigh.label.includes('Premium'), 'YouTube Music High label must mention Premium condition');
      assert.ok(ytMusicHigh.notes?.includes('Premium'), 'YouTube Music High notes must mention Premium condition');
    }
  });

  it('contains zero unsupported third-party or unverified presets', () => {
    const invalidPresets = VERIFIED_DATA_USAGE_PRESETS.filter(
      (p) =>
        p.provider.toLowerCase().includes('zoom') ||
        p.provider.toLowerCase().includes('meet') ||
        p.provider.toLowerCase().includes('gaming') ||
        p.provider.toLowerCase().includes('browsing')
    );
    assert.strictEqual(invalidPresets.length, 0);
  });
});
