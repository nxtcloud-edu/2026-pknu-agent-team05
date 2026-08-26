// 시각 다루기
// 근거: business-rules.md BR-48 ~ BR-50 · nfr-requirements.md U-NFR-1
//
// BR-48  날짜와 시각은 사용자의 표준시로 다룬다. UTC 로 바꿔 저장하다가 날짜가 밀리지 않게 한다.
// BR-49  도착 시각 + 머무는 시간이 자정을 넘어도 그 일정은 원래 날짜에 속한다.
// BR-50  끝나는 시각을 보관하지 않는다. 필요할 때 구한다.

import type { DateKey, TimeOfDay, Weekday } from '../schedule/types'

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/

/**
 * Date 를 `YYYY-MM-DD` 로 바꾼다. **로컬 시각 기준**이다.
 *
 * `toISOString()` 을 쓰면 UTC 로 바뀌면서 한국 시간대에서는 오전 9시 이전이
 * 하루 전 날짜가 된다. 그래서 쓰지 않는다 (BR-48).
 */
export function toDateKey(date: Date): DateKey {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** `YYYY-MM-DD` 를 그 날 0시의 Date 로 바꾼다. 로컬 시각 기준 */
export function fromDateKey(key: DateKey): Date {
  if (!isValidDateKey(key)) {
    throw new Error(`날짜 형식이 아니다: ${key}`)
  }
  const [year, month, day] = key.split('-').map(Number) as [number, number, number]
  // new Date('2026-08-26') 은 UTC 로 읽히므로 쓰지 않는다. 인자를 나눠 넘긴다.
  return new Date(year, month - 1, day)
}

export function isValidDateKey(key: string): boolean {
  if (!DATE_KEY_PATTERN.test(key)) return false
  const [year, month, day] = key.split('-').map(Number) as [number, number, number]
  const date = new Date(year, month - 1, day)
  return (
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
  )
}

export function isValidTime(time: string): boolean {
  return TIME_PATTERN.test(time)
}

/** 오늘 날짜. 지금 시각을 밖에서 넣을 수 있게 해 둔다 (테스트에서 쓴다) */
export function todayKey(now: Date = new Date()): DateKey {
  return toDateKey(now)
}

/** 그 날짜의 요일 — BR-27 판정에 쓴다 */
export function weekdayOf(key: DateKey): Weekday {
  return fromDateKey(key).getDay() as Weekday
}

/** 날짜를 며칠 옮긴다. 음수면 거슬러 간다 */
export function shiftDate(key: DateKey, days: number): DateKey {
  const date = fromDateKey(key)
  date.setDate(date.getDate() + days)
  return toDateKey(date)
}

/** 두 날짜를 견준다. a < b 면 음수 */
export function compareDateKey(a: DateKey, b: DateKey): number {
  return a < b ? -1 : a > b ? 1 : 0
}

/** `HH:MM` 을 그날 0시부터의 분으로 바꾼다 */
export function timeToMinutes(time: TimeOfDay): number {
  if (!isValidTime(time)) {
    throw new Error(`시각 형식이 아니다: ${time}`)
  }
  const [hour, minute] = time.split(':').map(Number) as [number, number]
  return hour * 60 + minute
}

/** 그날 0시부터의 분을 `HH:MM` 으로 바꾼다. 24시간을 넘으면 넘긴 만큼만 남긴다 */
export function minutesToTime(minutes: number): TimeOfDay {
  const wrapped = ((minutes % 1440) + 1440) % 1440
  const hour = String(Math.floor(wrapped / 60)).padStart(2, '0')
  const minute = String(wrapped % 60).padStart(2, '0')
  return `${hour}:${minute}`
}

/**
 * 끝나는 시각을 구한다 — BR-50
 *
 * 자정을 넘으면 `crossesMidnight` 가 참이 된다. 그래도 일정의 날짜는 바뀌지 않는다 (BR-49).
 */
export function endOfSchedule(
  arrivalTime: TimeOfDay,
  stayMinutes: number,
): { readonly time: TimeOfDay; readonly crossesMidnight: boolean } {
  const total = timeToMinutes(arrivalTime) + stayMinutes
  return {
    time: minutesToTime(total),
    crossesMidnight: total >= 1440,
  }
}

/** 사람이 읽는 날짜 — `8월 26일 (수)` */
export function formatDateLabel(key: DateKey): string {
  const date = fromDateKey(key)
  const weekday = WEEKDAY_SHORT[date.getDay() as Weekday]
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${weekday})`
}

const WEEKDAY_SHORT: Record<Weekday, string> = {
  0: '일',
  1: '월',
  2: '화',
  3: '수',
  4: '목',
  5: '금',
  6: '토',
}

/** 분을 사람이 읽는 길이로 — `90분` → `1시간 30분` */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}분`
  const hour = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hour}시간` : `${hour}시간 ${rest}분`
}
