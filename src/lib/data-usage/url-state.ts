import {
  DataUsageCalculatorState,
  ActivityItem,
  BillingPeriodOption,
  DataUsageRateUnit,
} from './types';
import { DATA_USAGE_RATE_UNITS } from './calculations';

export const DEFAULT_DATA_USAGE_STATE: DataUsageCalculatorState = {
  activities: [
    {
      id: 'default-1',
      name: 'Video stream',
      rateValue: 3,
      rateUnit: 'Mbps',
      hoursPerDay: 2,
      minutesPerDay: 0,
      devices: 1,
    },
    {
      id: 'default-2',
      name: 'Audio stream',
      rateValue: 160,
      rateUnit: 'kbps',
      hoursPerDay: 1,
      minutesPerDay: 0,
      devices: 1,
    },
  ],
  billingPeriodOption: 30,
  customBillingDays: 30,
  enableDataCap: false,
  dataCapValue: 1000,
  dataCapUnit: 'GB',
};

const MAX_ACTIVITIES = 8;

export function serializeDataUsageState(state: DataUsageCalculatorState): string {
  const params = new URLSearchParams();

  // Activities (compact serialization: name~presetId~rate~unit~h~m~dev)
  const actTokens = state.activities.slice(0, MAX_ACTIVITIES).map((act) => {
    const safeName = encodeURIComponent(act.name.replace(/~/g, '-'));
    const safePreset = act.presetId ? encodeURIComponent(act.presetId) : '';
    const rate = Math.max(0, parseFloat(String(act.rateValue)) || 0);
    const unit = act.rateUnit;
    const h = Math.max(0, Math.min(24, parseFloat(String(act.hoursPerDay)) || 0));
    const m = Math.max(0, Math.min(59, parseFloat(String(act.minutesPerDay)) || 0));
    const dev = Math.max(1, Math.round(parseFloat(String(act.devices)) || 1));

    return `${safeName}~${safePreset}~${rate}~${unit}~${h}~${m}~${dev}`;
  });

  if (actTokens.length > 0) {
    params.set('acts', actTokens.join(';'));
  }

  // Billing Period
  if (state.billingPeriodOption !== 30) {
    params.set('days', String(state.billingPeriodOption));
  }
  if (state.billingPeriodOption === 'custom' && state.customBillingDays) {
    params.set('cdays', String(state.customBillingDays));
  }

  // Data Cap
  if (state.enableDataCap) {
    params.set('cap', String(state.dataCapValue));
    params.set('capUnit', state.dataCapUnit);
  }

  return params.toString();
}

export function parseDataUsageState(
  params: URLSearchParams | { get: (key: string) => string | null }
): DataUsageCalculatorState {
  const state: DataUsageCalculatorState = {
    activities: [...DEFAULT_DATA_USAGE_STATE.activities],
    billingPeriodOption: DEFAULT_DATA_USAGE_STATE.billingPeriodOption,
    customBillingDays: DEFAULT_DATA_USAGE_STATE.customBillingDays,
    enableDataCap: DEFAULT_DATA_USAGE_STATE.enableDataCap,
    dataCapValue: DEFAULT_DATA_USAGE_STATE.dataCapValue,
    dataCapUnit: DEFAULT_DATA_USAGE_STATE.dataCapUnit,
  };

  const actsParam = params.get('acts');
  if (actsParam) {
    const rawActs = actsParam.split(';').slice(0, MAX_ACTIVITIES);
    const parsedActs: ActivityItem[] = [];

    rawActs.forEach((token, idx) => {
      const parts = token.split('~');
      if (parts.length >= 7) {
        const name = decodeURIComponent(parts[0]) || `Activity ${idx + 1}`;
        const presetId = parts[1] ? decodeURIComponent(parts[1]) : undefined;
        const rateVal = Math.max(0, parseFloat(parts[2]) || 0);
        const rateUnit = (DATA_USAGE_RATE_UNITS.includes(parts[3] as DataUsageRateUnit)
          ? parts[3]
          : 'Mbps') as DataUsageRateUnit;
        const h = Math.max(0, Math.min(24, parseFloat(parts[4]) || 0));
        const m = Math.max(0, Math.min(59, parseFloat(parts[5]) || 0));
        const dev = Math.max(1, Math.round(parseFloat(parts[6]) || 1));

        parsedActs.push({
          id: `act-${idx + 1}`,
          name,
          presetId,
          rateValue: rateVal,
          rateUnit,
          hoursPerDay: h,
          minutesPerDay: m,
          devices: dev,
        });
      }
    });

    if (parsedActs.length > 0) {
      state.activities = parsedActs;
    }
  }

  // Billing days
  const daysParam = params.get('days');
  if (daysParam === '28' || daysParam === '30' || daysParam === '31') {
    state.billingPeriodOption = parseInt(daysParam, 10) as BillingPeriodOption;
  } else if (daysParam === 'custom') {
    state.billingPeriodOption = 'custom';
    const cdays = parseInt(params.get('cdays') || '30', 10);
    if (!Number.isNaN(cdays) && cdays > 0 && cdays <= 365) {
      state.customBillingDays = cdays;
    }
  }

  // Data Cap
  const capParam = params.get('cap');
  if (capParam) {
    const capNum = parseFloat(capParam);
    if (!Number.isNaN(capNum) && capNum >= 0 && Number.isFinite(capNum)) {
      state.enableDataCap = true;
      state.dataCapValue = capNum;
    }
    const capUnitParam = params.get('capUnit');
    if (capUnitParam === 'TB' || capUnitParam === 'GB') {
      state.dataCapUnit = capUnitParam;
    }
  }

  return state;
}
