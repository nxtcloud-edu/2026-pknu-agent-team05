/**
 * Time manipulation utilities with midnight-crossing support and timezone safety.
 */

/**
 * Converts a "HH:mm" time string to minutes from start of the day (00:00 = 0).
 * Supports optional "익일 HH:mm" or "+1d HH:mm" format for next-day schedules.
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const isNextDay = timeStr.includes('익일') || timeStr.includes('+1');
  const cleanStr = timeStr.replace(/[^0-9:]/g, '');
  const [hoursStr, minutesStr] = cleanStr.split(':');
  const hours = parseInt(hoursStr || '0', 10);
  const minutes = parseInt(minutesStr || '0', 10);
  const total = hours * 60 + minutes;
  return isNextDay ? total + 1440 : total;
}

/**
 * Converts minutes from start of day to "HH:mm" string.
 * If minutes >= 1440 (24h), formats as "익일 HH:mm".
 * Handles negative minutes gracefully (e.g. previous day).
 */
export function minutesToTimeString(minutes: number, showNextDayPrefix = true): string {
  let normalized = Math.round(minutes);
  let isNextDay = false;
  let isPrevDay = false;

  if (normalized < 0) {
    isPrevDay = true;
    normalized = (normalized % 1440) + 1440;
  } else if (normalized >= 1440) {
    isNextDay = true;
    normalized = normalized % 1440;
  }

  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  const hh = String(hours).padStart(2, '0');
  const mm = String(mins).padStart(2, '0');

  if (isNextDay && showNextDayPrefix) {
    return `익일 ${hh}:${mm}`;
  }
  if (isPrevDay && showNextDayPrefix) {
    return `전일 ${hh}:${mm}`;
  }
  return `${hh}:${mm}`;
}

/**
 * Calculates departure time:
 * Departure Time = Target Arrival Time - Travel Time (minutes) - Buffer Time (minutes)
 */
export function calculateDepartureTime(
  arrivalMinutes: number,
  travelDurationMinutes: number,
  bufferMinutes: number = 0
): number {
  return arrivalMinutes - travelDurationMinutes - bufferMinutes;
}

/**
 * Calculates arrival time:
 * Arrival Time = Departure Time + Travel Time (minutes)
 */
export function calculateArrivalTime(
  departureMinutes: number,
  travelDurationMinutes: number
): number {
  return departureMinutes + travelDurationMinutes;
}

/**
 * Calculates difference in minutes between two "HH:mm" times.
 * If end is before start, assumes it crossed midnight into the next day.
 */
export function getDurationMinutes(startTimeStr: string, endTimeStr: string): number {
  const startMin = timeStringToMinutes(startTimeStr);
  let endMin = timeStringToMinutes(endTimeStr);
  if (endMin < startMin) {
    endMin += 1440; // Crossed midnight
  }
  return endMin - startMin;
}

/**
 * Adds minutes to a "HH:mm" string.
 */
export function addMinutesToTime(timeStr: string, minutesToAdd: number): string {
  const currentMin = timeStringToMinutes(timeStr);
  return minutesToTimeString(currentMin + minutesToAdd);
}

/**
 * Subtracts minutes from a "HH:mm" string.
 */
export function subtractMinutesFromTime(timeStr: string, minutesToSub: number): string {
  const currentMin = timeStringToMinutes(timeStr);
  return minutesToTimeString(currentMin - minutesToSub);
}

/**
 * Formats a Date object to "HH:mm" in local timezone.
 */
export function formatLocalTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Formats a Date object to "YYYY-MM-DD" in local timezone.
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Determines whether a given time string is in peak hours (traffic congestion).
 */
export function isPeakHour(timeMinutes: number): boolean {
  const normalized = ((timeMinutes % 1440) + 1440) % 1440;
  // Morning peak: 08:00 (480) - 09:30 (570)
  const isMorningPeak = normalized >= 480 && normalized <= 570;
  // Evening peak: 17:30 (1050) - 19:30 (1170)
  const isEveningPeak = normalized >= 1050 && normalized <= 1170;
  return isMorningPeak || isEveningPeak;
}

/**
 * Converts date string ("YYYY-MM-DD") and time string ("HH:mm") to timestamp ms.
 */
export function dateTimeToTimestamp(dateStr: string, timeStr: string): number {
  const isNextDay = timeStr.includes('익일');
  const cleanTime = timeStr.replace(/[^0-9:]/g, '');
  const [hh, mm] = cleanTime.split(':').map((s) => parseInt(s, 10));

  const [year, month, day] = dateStr.split('-').map((s) => parseInt(s, 10));
  const date = new Date(year, month - 1, day, hh || 0, mm || 0, 0, 0);

  if (isNextDay) {
    date.setDate(date.getDate() + 1);
  }
  return date.getTime();
}
