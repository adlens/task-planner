import dayjs, { Dayjs } from 'dayjs';

/**
 * Convert minutes to dayjs duration
 */
export function minutesToDuration(minutes: number): Dayjs {
  return dayjs().startOf('day').add(minutes, 'minute');
}

/**
 * Add minutes to a time string
 */
export function addMinutes(timeStr: string, minutes: number): string {
  return dayjs(timeStr).add(minutes, 'minute').toISOString();
}

/**
 * Check if two time ranges overlap
 */
export function isTimeOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = dayjs(start1);
  const e1 = dayjs(end1);
  const s2 = dayjs(start2);
  const e2 = dayjs(end2);
  
  return s1.isBefore(e2) && s2.isBefore(e1);
}

/**
 * Format time for display
 */
export function formatTime(timeStr: string): string {
  return dayjs(timeStr).format('HH:mm');
}

/**
 * Format time range for display
 */
export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} - ${formatTime(end)}`;
}

/**
 * Get current time as ISO string
 */
export function getCurrentTime(): string {
  return dayjs().toISOString();
}

/**
 * Get today's date as YYYY-MM-DD
 */
export function getTodayDate(): string {
  return dayjs().format('YYYY-MM-DD');
}

/**
 * Format date for display (e.g. 2月1日 周五)
 */
export function formatDateDisplay(dateStr: string): string {
  const d = dayjs(dateStr);
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${d.format('M月D日')} ${weekdays[d.day()]}`;
}

/**
 * Check if a time is in the past
 */
export function isPast(timeStr: string): boolean {
  return dayjs(timeStr).isBefore(dayjs());
}

/**
 * Format elapsed duration from start time to now (or to end time)
 */
export function formatElapsed(startTime: string, endTime?: string): string {
  const end = endTime ? dayjs(endTime) : dayjs();
  const minutes = Math.floor(end.diff(dayjs(startTime), 'minute'));
  const seconds = Math.floor((end.diff(dayjs(startTime), 'second') % 60));
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} 时 ${mins} 分 ${seconds} 秒`;
  }
  if (minutes > 0) {
    return `${minutes} 分 ${seconds} 秒`;
  }
  return `${seconds} 秒`;
}
