import { FileSizeUnit } from '@/lib/transfer/types';

export type DataUsageRateUnit =
  | 'kbps'
  | 'Mbps'
  | 'Gbps'
  | 'KB/s'
  | 'MB/s'
  | 'GB/s'
  | 'MB/hr'
  | 'GB/hr';

export type PresetCategory = 'video' | 'audio' | 'conferencing' | 'cloud';

export type PresetSourceType = 'official-usage' | 'official-bitrate';

export interface DataUsagePreset {
  id: string;
  label: string;
  provider: string;
  category: PresetCategory;
  rateValue: number;
  rateUnit: DataUsageRateUnit;
  sourceType: PresetSourceType;
  sourceName: string;
  sourceUrl: string;
  lastVerified: string;
  notes?: string;
}

export interface ActivityItem {
  id: string;
  name: string;
  presetId?: string;
  rateValue: unknown;
  rateUnit: DataUsageRateUnit;
  hoursPerDay: unknown;
  minutesPerDay: unknown;
  devices: unknown;
}

export type BillingPeriodOption = 28 | 30 | 31 | 'custom';

export interface ActivityCalculationOutput {
  id: string;
  name: string;
  bytesPerSecond: number;
  dailyDurationSeconds: number;
  deviceCount: number;
  dailyBytes: number;
  dailyGb: number;
  dailyFormatted: string;
  weeklyBytes: number;
  weeklyGb: number;
  weeklyFormatted: string;
  billingPeriodBytes: number;
  billingPeriodGb: number;
  billingPeriodFormatted: string;
  rateFormatted: string;
  sourceInfo?: {
    sourceType: PresetSourceType;
    sourceName: string;
    sourceUrl: string;
    lastVerified: string;
    notes?: string;
  };
}

export interface DataCapCalculationOutput {
  enabled: boolean;
  capBytes: number;
  capFormatted: string;
  utilizationPercent: number;
  remainingBytes: number;
  isOverPlan: boolean;
  overPlanBytes: number;
  overPlanFormatted?: string;
  daysUntilCap: number | null;
  daysUntilCapFormatted: string;
}

export interface DataUsageCalculationResult {
  activityResults: ActivityCalculationOutput[];
  totalDailyBytes: number;
  totalDailyGb: number;
  totalDailyFormatted: string;
  totalWeeklyBytes: number;
  totalWeeklyGb: number;
  totalWeeklyFormatted: string;
  totalBillingBytes: number;
  totalBillingGb: number;
  totalBillingFormatted: string;
  billingDays: number;
  capResult?: DataCapCalculationOutput;
}

export interface DataUsageCalculatorState {
  activities: ActivityItem[];
  billingPeriodOption: BillingPeriodOption;
  customBillingDays: number;
  enableDataCap: boolean;
  dataCapValue: number;
  dataCapUnit: 'GB' | 'TB';
}
