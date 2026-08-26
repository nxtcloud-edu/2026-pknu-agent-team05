// 시각 다루기 테스트 — BR-48 ~ BR-50 · U-NFR-1
//
// U-NFR-1.1 이 가장 중요하다. localStorage 가 글자만 담으므로(Q2-A)
// 날짜가 글자로 오가며 하루 밀리는 일이 생기기 쉽다.

import { describe, expect, it } from 'vitest'
import {
  compareDateKey,
  endOfSchedule,
  formatDateLabel,
  formatDuration,
  fromDateKey,
  isValidDateKey,
  isValidTime,
  minutesToTime,
  shiftDate,
  timeToMinutes,
  toDateKey,
  todayKey,
  weekdayOf,
} from './index'

describe('날짜를 글자로 바꾸고 되돌리기 (BR-48 · U-NFR-1.1)', () => {
  it('로컬 시각 기준으로 날짜를 만든다', () => {
    // 2026-08-26 오전 2시. UTC 로 바꾸면 8월 25일이 되는 시각대가 있다.
    const date = new Date(2026, 7, 26, 2, 0, 0)
    expect(toDateKey(date)).toBe('2026-08-26')
  })

  it('자정 직후에도 날짜가 밀리지 않는다', () => {
    const date = new Date(2026, 7, 26, 0, 0, 0)
    expect(toDateKey(date)).toBe('2026-08-26')
  })

  it('자정 직전에도 날짜가 밀리지 않는다', () => {
    const date = new Date(2026, 7, 26, 23, 59, 59)
    expect(toDateKey(date)).toBe('2026-08-26')
  })

  it('글자로 바꾸고 되돌린 값이 같다', () => {
    const original = '2026-08-26'
    expect(toDateKey(fromDateKey(original))).toBe(original)
  })

  it('여러 날짜를 오가도 어긋나지 않는다', () => {
    const keys = ['2026-01-01', '2026-02-28', '2026-03-01', '2026-12-31', '2028-02-29']
    for (const key of keys) {
      expect(toDateKey(fromDateKey(key))).toBe(key)
    }
  })

  it('toISOString 과 달리 시간대에 흔들리지 않는다', () => {
    // 오전 9시 이전이면 UTC 기준 날짜가 하루 앞선다. 그 함정을 피했는지 본다.
    const early = new Date(2026, 7, 26, 3, 30, 0)
    expect(toDateKey(early)).toBe('2026-08-26')
  })
})

describe('날짜 형식 검사', () => {
  it('제대로 된 날짜를 받는다', () => {
    expect(isValidDateKey('2026-08-26')).toBe(true)
  })

  it('없는 날짜를 걸러낸다', () => {
    expect(isValidDateKey('2026-02-30')).toBe(false)
    expect(isValidDateKey('2026-13-01')).toBe(false)
  })

  it('형식이 다른 것을 걸러낸다', () => {
    expect(isValidDateKey('2026-8-26')).toBe(false)
    expect(isValidDateKey('26-08-2026')).toBe(false)
    expect(isValidDateKey('')).toBe(false)
  })

  it('윤년 2월 29일을 받는다', () => {
    expect(isValidDateKey('2028-02-29')).toBe(true)
  })

  it('윤년이 아닌 해의 2월 29일을 걸러낸다', () => {
    expect(isValidDateKey('2026-02-29')).toBe(false)
  })
})

describe('요일 판정 (BR-27 이 쓴다)', () => {
  it('2026-08-26 은 수요일이다', () => {
    expect(weekdayOf('2026-08-26')).toBe(3)
  })

  it('2026-08-30 은 일요일이다', () => {
    expect(weekdayOf('2026-08-30')).toBe(0)
  })
})

describe('날짜 옮기기', () => {
  it('하루 뒤로 옮긴다', () => {
    expect(shiftDate('2026-08-26', 1)).toBe('2026-08-27')
  })

  it('하루 앞으로 옮긴다 — 지난 날짜를 볼 수 있다 (Q5-A)', () => {
    expect(shiftDate('2026-08-26', -1)).toBe('2026-08-25')
  })

  it('달을 넘긴다', () => {
    expect(shiftDate('2026-08-31', 1)).toBe('2026-09-01')
  })

  it('해를 넘긴다', () => {
    expect(shiftDate('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('일주일 뒤는 같은 요일이다', () => {
    const next = shiftDate('2026-08-26', 7)
    expect(weekdayOf(next)).toBe(weekdayOf('2026-08-26'))
  })
})

describe('날짜 견주기', () => {
  it('앞선 날짜가 작다', () => {
    expect(compareDateKey('2026-08-25', '2026-08-26')).toBeLessThan(0)
  })

  it('같으면 0 이다', () => {
    expect(compareDateKey('2026-08-26', '2026-08-26')).toBe(0)
  })

  it('나중 날짜가 크다', () => {
    expect(compareDateKey('2026-09-01', '2026-08-26')).toBeGreaterThan(0)
  })
})

describe('시각 다루기', () => {
  it('시각을 분으로 바꾼다', () => {
    expect(timeToMinutes('00:00')).toBe(0)
    expect(timeToMinutes('14:30')).toBe(870)
    expect(timeToMinutes('23:59')).toBe(1439)
  })

  it('분을 시각으로 바꾼다', () => {
    expect(minutesToTime(0)).toBe('00:00')
    expect(minutesToTime(870)).toBe('14:30')
    expect(minutesToTime(1439)).toBe('23:59')
  })

  it('24시간을 넘는 분은 넘긴 만큼만 남긴다', () => {
    expect(minutesToTime(1440)).toBe('00:00')
    expect(minutesToTime(1500)).toBe('01:00')
  })

  it('시각 형식을 검사한다', () => {
    expect(isValidTime('09:00')).toBe(true)
    expect(isValidTime('23:59')).toBe(true)
    expect(isValidTime('24:00')).toBe(false)
    expect(isValidTime('09:60')).toBe(false)
    expect(isValidTime('9:00')).toBe(false)
  })
})

describe('끝나는 시각 구하기 (BR-49 · BR-50)', () => {
  it('보관하지 않고 도착 시각 + 머무는 시간으로 구한다', () => {
    expect(endOfSchedule('14:00', 60)).toEqual({ time: '15:00', crossesMidnight: false })
  })

  it('자정을 넘으면 표시한다', () => {
    expect(endOfSchedule('23:00', 120)).toEqual({ time: '01:00', crossesMidnight: true })
  })

  it('정확히 자정에 끝나면 넘은 것으로 본다', () => {
    expect(endOfSchedule('23:00', 60)).toEqual({ time: '00:00', crossesMidnight: true })
  })

  it('자정을 넘어도 일정의 날짜는 바뀌지 않는다 — 판단은 부르는 쪽이 한다', () => {
    const result = endOfSchedule('22:30', 180)
    expect(result.crossesMidnight).toBe(true)
    expect(result.time).toBe('01:30')
  })
})

describe('사람이 읽는 표시', () => {
  it('날짜를 읽기 쉽게 만든다', () => {
    expect(formatDateLabel('2026-08-26')).toBe('8월 26일 (수)')
  })

  it('한 시간 미만은 분으로만 보여준다', () => {
    expect(formatDuration(45)).toBe('45분')
  })

  it('한 시간이 넘으면 시간과 분으로 나눈다', () => {
    expect(formatDuration(90)).toBe('1시간 30분')
  })

  it('딱 맞는 시간은 분을 붙이지 않는다', () => {
    expect(formatDuration(120)).toBe('2시간')
  })
})

describe('오늘 날짜', () => {
  it('지금 시각을 밖에서 넣을 수 있다', () => {
    expect(todayKey(new Date(2026, 7, 26, 10, 0, 0))).toBe('2026-08-26')
  })
})
