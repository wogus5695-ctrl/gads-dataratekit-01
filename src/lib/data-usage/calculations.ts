import {
  DataUsageRateUnit,
  ActivityItem,
  ActivityCalculationOutput,
  DataUsageCalculationResult,
  BillingPeriodOption,
  DataCapCalculationOutput,
} from './types';
import { getPresetById } from '@/data/data-usage-presets';
import { formatNumber } from '@/lib/transfer/format';

export const DATA_USAGE_RATE_UNITS: DataUsageRateUnit[] = [
  'Mbps',
  'kbps',
  'Gbps',
  'GB/hr',
  'MB/hr',
  'MB/s',
  'KB/s',
  'GB/s',
];

export function rateToBytesPerSecond(value: number, unit: DataUsageRateUnit): number {
  if (value < 0 || !Number.isFinite(value)) return 0;

  switch (unit) {
    case 'kbps':
      return (value * 1_000) / 8;
    case 'Mbps':
      return (value * 1_000_000) / 8;
    case 'Gbps':
      return (value * 1_000_000_000) / 8;
    case 'KB/s':
      return value * 1_000;
    case 'MB/s':
      return value * 1_000_000;
    case 'GB/s':
      return value * 1_000_000_000;
    case 'MB/hr':
      return (value * 1_000_000) / 3600;
    case 'GB/hr':
      return (value * 1_000_000_000) / 3600;
    default:
      return 0;
  }
}

export function formatDataBytes(bytes: number): string {
  if (bytes <= 0 || !Number.isFinite(bytes)) return '0 MB';

  const tb = bytes / 1_000_000_000_000;
  if (tb >= 1) {
    return `${formatNumber(tb, 3)} TB`;
  }

  const gb = bytes / 1_000_000_000;
  if (gb >= 1) {
    return `${formatNumber(gb, 3)} GB`;
  }

  const mb = bytes / 1_000_000;
  return `${formatNumber(mb, 2)} MB`;
}

export function bytesToGigabytes(bytes: number): number {
  if (bytes <= 0 || !Number.isFinite(bytes)) return 0;
  // Round to 6 decimal places safely to eliminate floating point 1.9999999999999998 artifacts
  return Math.round((bytes / 1_000_000_000 + Number.EPSILON) * 1_000_000) / 1_000_000;
}

export function resolveBillingDays(option: BillingPeriodOption, customDays?: number): number {
  if (option === 'custom') {
    const days = Math.round(Number(customDays));
    if (Number.isFinite(days) && days > 0 && days <= 365) {
      return days;
    }
    return 30;
  }
  return option;
}

export function calculateSingleActivity(
  activity: ActivityItem,
  billingDays: number
): ActivityCalculationOutput {
  const rateVal = Math.max(0, parseFloat(String(activity.rateValue)) || 0);
  const hours = Math.max(0, Math.min(24, parseFloat(String(activity.hoursPerDay)) || 0));
  const minutes = Math.max(0, Math.min(59, parseFloat(String(activity.minutesPerDay)) || 0));
  const devices = Math.max(1, Math.round(parseFloat(String(activity.devices)) || 1));

  const dailyDurationSeconds = hours * 3600 + minutes * 60;
  const bytesPerSecond = rateToBytesPerSecond(rateVal, activity.rateUnit);

  const dailyBytes = bytesPerSecond * dailyDurationSeconds * devices;
  const weeklyBytes = dailyBytes * 7;
  const billingPeriodBytes = dailyBytes * billingDays;

  let sourceInfo: ActivityCalculationOutput['sourceInfo'];
  if (activity.presetId) {
    const preset = getPresetById(activity.presetId);
    if (preset) {
      sourceInfo = {
        sourceType: preset.sourceType,
        sourceName: preset.sourceName,
        sourceUrl: preset.sourceUrl,
        lastVerified: preset.lastVerified,
        notes: preset.notes,
      };
    }
  }

  return {
    id: activity.id,
    name: activity.name.trim() || 'Custom Activity',
    bytesPerSecond,
    dailyDurationSeconds,
    deviceCount: devices,
    dailyBytes,
    dailyGb: bytesToGigabytes(dailyBytes),
    dailyFormatted: formatDataBytes(dailyBytes),
    weeklyBytes,
    weeklyGb: bytesToGigabytes(weeklyBytes),
    weeklyFormatted: formatDataBytes(weeklyBytes),
    billingPeriodBytes,
    billingPeriodGb: bytesToGigabytes(billingPeriodBytes),
    billingPeriodFormatted: formatDataBytes(billingPeriodBytes),
    rateFormatted: `${formatNumber(rateVal)} ${activity.rateUnit}`,
    sourceInfo,
  };
}

export function calculateDataUsage(params: {
  activities: ActivityItem[];
  billingPeriodOption: BillingPeriodOption;
  customBillingDays?: number;
  enableDataCap?: boolean;
  dataCapValue?: number;
  dataCapUnit?: 'GB' | 'TB';
}): DataUsageCalculationResult {
  const billingDays = resolveBillingDays(params.billingPeriodOption, params.customBillingDays);

  const activityResults = params.activities.map((act) =>
    calculateSingleActivity(act, billingDays)
  );

  const totalDailyBytes = activityResults.reduce((acc, cur) => acc + cur.dailyBytes, 0);
  const totalWeeklyBytes = totalDailyBytes * 7;
  const totalBillingBytes = totalDailyBytes * billingDays;

  let capResult: DataCapCalculationOutput | undefined;

  if (params.enableDataCap) {
    const capVal = Math.max(0, parseFloat(String(params.dataCapValue)) || 0);
    const unitMultiplier = params.dataCapUnit === 'TB' ? 1_000_000_000_000 : 1_000_000_000;
    const capBytes = capVal * unitMultiplier;

    const utilizationPercent = capBytes > 0 ? (totalBillingBytes / capBytes) * 100 : 0;
    const remainingBytes = capBytes - totalBillingBytes;
    const isOverPlan = totalBillingBytes > capBytes;
    const overPlanBytes = isOverPlan ? totalBillingBytes - capBytes : 0;

    let daysUntilCap: number | null = null;
    let daysUntilCapFormatted = 'No usage';

    if (totalDailyBytes > 0 && capBytes > 0) {
      daysUntilCap = capBytes / totalDailyBytes;
      daysUntilCapFormatted = `${formatNumber(daysUntilCap, 1)} days`;
    } else if (capBytes === 0) {
      daysUntilCap = 0;
      daysUntilCapFormatted = '0 days (No cap set)';
    }

    capResult = {
      enabled: true,
      capBytes,
      capFormatted: formatDataBytes(capBytes),
      utilizationPercent,
      remainingBytes,
      isOverPlan,
      overPlanBytes,
      overPlanFormatted: isOverPlan ? formatDataBytes(overPlanBytes) : undefined,
      daysUntilCap,
      daysUntilCapFormatted,
    };
  }

  return {
    activityResults,
    totalDailyBytes,
    totalDailyGb: bytesToGigabytes(totalDailyBytes),
    totalDailyFormatted: formatDataBytes(totalDailyBytes),
    totalWeeklyBytes,
    totalWeeklyGb: bytesToGigabytes(totalWeeklyBytes),
    totalWeeklyFormatted: formatDataBytes(totalWeeklyBytes),
    totalBillingBytes,
    totalBillingGb: bytesToGigabytes(totalBillingBytes),
    totalBillingFormatted: formatDataBytes(totalBillingBytes),
    billingDays,
    capResult,
  };
}
