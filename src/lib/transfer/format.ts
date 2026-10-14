import { FormattedDuration } from './types';

/**
 * Format a number cleanly without floating-point artifacts (e.g. 12.4999999997 -> 12.5)
 */
export function formatNumber(value: number, maxDecimals = 3): string {
  if (!Number.isFinite(value)) {
    return '0';
  }

  // Round to maxDecimals safely
  const factor = Math.pow(10, maxDecimals);
  const rounded = Math.round((value + Number.EPSILON) * factor) / factor;

  // Format with locale commas if needed, removing trailing zeros
  const parts = rounded.toString().split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  if (parts.length > 1) {
    return `${integerPart}.${parts[1]}`;
  }
  return integerPart;
}

/**
 * Formats a duration in seconds into human-readable text and structured parts.
 * Example outputs:
 *  - 59 -> "59 seconds" (short: "59s")
 *  - 90 -> "1 minute 30 seconds" (short: "1m 30s")
 *  - 8000 -> "2 hours 13 minutes 20 seconds" (short: "2h 13m 20s")
 *  - 100000 -> "1 day 3 hours 46 minutes 40 seconds" (short: "1d 3h 46m 40s")
 */
export function formatDuration(totalSeconds: number): FormattedDuration {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return {
      rawSeconds: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      formatted: '0 seconds',
      formattedShort: '0s',
    };
  }

  // Handle sub-second durations
  if (totalSeconds > 0 && totalSeconds < 1) {
    const formattedSub = `${formatNumber(totalSeconds, 2)} seconds`;
    return {
      rawSeconds: totalSeconds,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: totalSeconds,
      formatted: formattedSub,
      formattedShort: `< 1s`,
    };
  }

  const roundedTotal = Math.round(totalSeconds);
  const days = Math.floor(roundedTotal / 86400);
  const hours = Math.floor((roundedTotal % 86400) / 3600);
  const minutes = Math.floor((roundedTotal % 3600) / 60);
  const seconds = roundedTotal % 60;

  const partsLong: string[] = [];
  const partsShort: string[] = [];

  if (days > 0) {
    partsLong.push(`${days} ${days === 1 ? 'day' : 'days'}`);
    partsShort.push(`${days}d`);
  }
  if (hours > 0) {
    partsLong.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
    partsShort.push(`${hours}h`);
  }
  if (minutes > 0) {
    partsLong.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
    partsShort.push(`${minutes}m`);
  }
  if (seconds > 0 || partsLong.length === 0) {
    partsLong.push(`${seconds} ${seconds === 1 ? 'second' : 'seconds'}`);
    partsShort.push(`${seconds}s`);
  }

  return {
    rawSeconds: totalSeconds,
    days,
    hours,
    minutes,
    seconds,
    formatted: partsLong.join(' '),
    formattedShort: partsShort.join(' '),
  };
}
