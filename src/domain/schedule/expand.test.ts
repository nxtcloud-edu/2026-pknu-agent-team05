// C-1 일정 펼치기 테스트 — 이 단위의 완료 기준
// 근거: business-logic-model.md 의 경계 상황 14가지 · nfr-requirements.md U-NFR-2.2
//
// 외부 서비스도 브라우저도 필요 없다 (U-NFR-2.1).

import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from '../settings'
import type { Settings } from '../settings'
import { expandDay, expandedScheduleId } from './expand'
import type { ExpandInput } from './expand'
import { emptyPlace } from './types'
import type {
  DateKey,
  RecurringException,
  RecurringRule,
  Schedule,
  TravelMode,
  Weekday,
} from './types'

// 2026-08-26 은 수요일 (요일 3)
const WED: DateKey = '2026-08-26'
const THU: DateKey = '2026-08-27'
const NEXT_WED: DateKey = '2026-09-02'

function makeSchedule(overrides: Partial<Schedule> = {}): Schedule {
  return {
    id: 'schedule-1',
    date: WED,
    title: '치과',
    place: emptyPlace('강남역'),
    stayMinutes: 60,
    kind: 'fixed',
    arrivalTime: '14:00',
    travelMode: 'transit',
    done: false,
    pinnedOrder: null,
    isAppointment: false,
    origin: { kind: 'direct' },
    ...overrides,
  }
}

function makeRule(overrides: Partial<RecurringRule> = {}): RecurringRule {
  return {
    id: 'rule-1',
    weekday: 3 satisfies Weekday, // 수요일
    title: '헬스',
    place: emptyPlace('한강공원'),
    stayMinutes: 90,
    kind: 'fixed',
    arrivalTime: '19:00',
    travelMode: 'walk',
    isAppointment: false,
    startDate: '2026-08-01',
    endDate: null,
    ...overrides,
  }
}

function input(overrides: Partial<ExpandInput> = {}): ExpandInput {
  return {
    date: WED,
    directSchedules: [],
    rules: [],
    exceptions: [],
    settings: DEFAULT_SETTINGS,
    ...overrides,
  }
}

describe('C-1 일정 펼치기', () => {
  it('그 날짜에 아무것도 없으면 빈 목록이다. 오류가 아니다', () => {
    const result = expandDay(input())
    expect(result).toEqual([])
  })

  it('개별 일정만 있으면 그것들만 나온다', () => {
    const result = expandDay(
      input({ directSchedules: [makeSchedule(), makeSchedule({ id: 's2', title: '회의' })] }),
    )
    expect(result).toHaveLength(2)
    expect(result.map((s) => s.title)).toContain('치과')
    expect(result.map((s) => s.title)).toContain('회의')
  })

  it('다른 날짜의 개별 일정은 섞이지 않는다', () => {
    const result = expandDay(
      input({ directSchedules: [makeSchedule(), makeSchedule({ id: 's2', date: THU })] }),
    )
    expect(result).toHaveLength(1)
  })

  // BR-27 · BR-29
  it('반복 규칙이 그 요일에 해당하면 펼쳐진다', () => {
    const result = expandDay(input({ rules: [makeRule()] }))
    expect(result).toHaveLength(1)
    expect(result[0]?.title).toBe('헬스')
    expect(result[0]?.origin).toEqual({ kind: 'recurring', ruleId: 'rule-1' })
  })

  // BR-27
  it('반복 규칙이 다른 요일이면 펼쳐지지 않는다', () => {
    const result = expandDay(input({ date: THU, rules: [makeRule()] }))
    expect(result).toEqual([])
  })

  // BR-31
  it('`언제부터` 보다 앞선 날짜에는 펼쳐지지 않는다', () => {
    const result = expandDay(input({ rules: [makeRule({ startDate: '2026-09-01' })] }))
    expect(result).toEqual([])
  })

  // BR-31 경계 — 시작 날짜 당일은 펼쳐진다
  it('`언제부터` 당일에는 펼쳐진다', () => {
    const result = expandDay(input({ rules: [makeRule({ startDate: WED })] }))
    expect(result).toHaveLength(1)
  })

  // BR-32
  it('`언제까지` 를 지난 날짜에는 펼쳐지지 않는다', () => {
    const result = expandDay(
      input({ date: NEXT_WED, rules: [makeRule({ endDate: WED })] }),
    )
    expect(result).toEqual([])
  })

  // BR-32 경계 — 끝 날짜 당일은 펼쳐진다
  it('`언제까지` 당일에는 펼쳐진다', () => {
    const result = expandDay(input({ rules: [makeRule({ endDate: WED })] }))
    expect(result).toHaveLength(1)
  })

  // BR-37
  it('`건너뜀` 예외가 있으면 펼쳐지지 않는다', () => {
    const exception: RecurringException = { ruleId: 'rule-1', date: WED, mode: 'skip' }
    const result = expandDay(input({ rules: [makeRule()], exceptions: [exception] }))
    expect(result).toEqual([])
  })

  // BR-37 — 예외는 그 날짜에만 걸린다
  it('`건너뜀` 예외는 다른 날짜의 반복에 영향을 주지 않는다', () => {
    const exception: RecurringException = { ruleId: 'rule-1', date: WED, mode: 'skip' }
    const result = expandDay(
      input({ date: NEXT_WED, rules: [makeRule()], exceptions: [exception] }),
    )
    expect(result).toHaveLength(1)
  })

  // BR-38
  it('`고침` 예외가 있으면 고쳐진 값으로 펼쳐지고, 나머지는 규칙의 값을 쓴다', () => {
    const exception: RecurringException = {
      ruleId: 'rule-1',
      date: WED,
      mode: 'modify',
      patch: { arrivalTime: '20:00' },
    }
    const result = expandDay(input({ rules: [makeRule()], exceptions: [exception] }))
    expect(result[0]?.arrivalTime).toBe('20:00')
    // 고치지 않은 값은 규칙 그대로
    expect(result[0]?.title).toBe('헬스')
    expect(result[0]?.stayMinutes).toBe(90)
  })

  // BR-34
  it('반복 규칙을 고쳐도 예외가 있는 날짜는 예외를 따른다', () => {
    const rule = makeRule({ title: '헬스장 (이름 바꿈)' })
    const exception: RecurringException = {
      ruleId: 'rule-1',
      date: WED,
      mode: 'modify',
      patch: { title: '그날만 다른 제목' },
    }
    const onExceptionDay = expandDay(input({ rules: [rule], exceptions: [exception] }))
    const onOtherDay = expandDay(
      input({ date: NEXT_WED, rules: [rule], exceptions: [exception] }),
    )

    expect(onExceptionDay[0]?.title).toBe('그날만 다른 제목')
    expect(onOtherDay[0]?.title).toBe('헬스장 (이름 바꿈)')
  })

  // BR-8
  it('이동 수단이 비어 있으면 설정의 기본값이 채워진다', () => {
    const settings: Settings = {
      ...DEFAULT_SETTINGS,
      user: { ...DEFAULT_SETTINGS.user, defaultTravelMode: 'car' satisfies TravelMode },
    }
    const schedule = {
      ...makeSchedule(),
      travelMode: null as unknown as TravelMode,
    }
    const result = expandDay(input({ directSchedules: [schedule], settings }))
    expect(result[0]?.travelMode).toBe('car')
  })

  // BR-15
  it('완료 표시된 일정은 목록에 남고 `빠질 것` 으로 표시된다', () => {
    const result = expandDay(
      input({ directSchedules: [makeSchedule({ done: true })] }),
    )
    expect(result).toHaveLength(1)
    expect(result[0]?.excludedFromRoute).toBe(true)
  })

  it('완료되지 않은 일정은 `빠질 것` 이 아니다', () => {
    const result = expandDay(input({ directSchedules: [makeSchedule()] }))
    expect(result[0]?.excludedFromRoute).toBe(false)
  })

  // BR-17 — 반복에서 온 일정의 완료 표시는 그 날짜에만
  it('반복에서 온 일정의 완료 표시는 그 날짜에만 남는다', () => {
    const exception: RecurringException = {
      ruleId: 'rule-1',
      date: WED,
      mode: 'modify',
      patch: { done: true },
    }
    const onExceptionDay = expandDay(input({ rules: [makeRule()], exceptions: [exception] }))
    const onNextWeek = expandDay(
      input({ date: NEXT_WED, rules: [makeRule()], exceptions: [exception] }),
    )

    expect(onExceptionDay[0]?.done).toBe(true)
    expect(onNextWeek[0]?.done).toBe(false)
  })

  // BR-22
  it('좌표가 비어 있어도 오류 없이 펼쳐진다', () => {
    const result = expandDay(input({ directSchedules: [makeSchedule()] }))
    expect(result[0]?.place.coord).toBeNull()
    expect(result).toHaveLength(1)
  })

  // BR-49
  it('도착 시각 + 머무는 시간이 자정을 넘어도 받은 날짜에 속한다', () => {
    const result = expandDay(
      input({
        directSchedules: [makeSchedule({ arrivalTime: '23:00', stayMinutes: 120 })],
      }),
    )
    expect(result).toHaveLength(1)
    expect(result[0]?.date).toBe(WED)
  })

  // BR-28
  it('같은 요일에 반복 규칙이 둘 있으면 둘 다 펼쳐진다', () => {
    const result = expandDay(
      input({
        rules: [makeRule(), makeRule({ id: 'rule-2', title: '독서모임', arrivalTime: '21:00' })],
      }),
    )
    expect(result).toHaveLength(2)
  })

  // BR-5 — 예외로 유형이 유연형이 되면 도착 시각이 비워진다
  it('`고침` 예외로 유연형이 되면 도착 시각이 비워진다', () => {
    const exception: RecurringException = {
      ruleId: 'rule-1',
      date: WED,
      mode: 'modify',
      patch: { kind: 'flexible' },
    }
    const result = expandDay(input({ rules: [makeRule()], exceptions: [exception] }))
    expect(result[0]?.kind).toBe('flexible')
    expect(result[0]?.arrivalTime).toBeNull()
  })

  it('펼쳐진 일정의 가리키는 이름은 규칙과 날짜에서 매번 같게 나온다', () => {
    const first = expandDay(input({ rules: [makeRule()] }))
    const second = expandDay(input({ rules: [makeRule()] }))
    expect(first[0]?.id).toBe(second[0]?.id)
    expect(first[0]?.id).toBe(expandedScheduleId('rule-1', WED))
  })
})

describe('화면에 보여줄 순서', () => {
  it('시각이 정해진 일정이 이른 것부터 먼저 온다', () => {
    const result = expandDay(
      input({
        directSchedules: [
          makeSchedule({ id: 'a', title: '늦은 것', arrivalTime: '18:00' }),
          makeSchedule({ id: 'b', title: '이른 것', arrivalTime: '09:00' }),
        ],
      }),
    )
    expect(result.map((s) => s.title)).toEqual(['이른 것', '늦은 것'])
  })

  it('유연형은 시각이 정해진 것 뒤에 온다', () => {
    const result = expandDay(
      input({
        directSchedules: [
          makeSchedule({ id: 'a', title: '유연', kind: 'flexible', arrivalTime: null }),
          makeSchedule({ id: 'b', title: '고정', arrivalTime: '15:00' }),
        ],
      }),
    )
    expect(result.map((s) => s.title)).toEqual(['고정', '유연'])
  })

  it('펼친 목록의 순서는 동선 순서가 아니다 — 유연형끼리는 넣은 순서를 지킨다', () => {
    const result = expandDay(
      input({
        directSchedules: [
          makeSchedule({ id: 'a', title: '첫째', kind: 'flexible', arrivalTime: null }),
          makeSchedule({ id: 'b', title: '둘째', kind: 'flexible', arrivalTime: null }),
        ],
      }),
    )
    expect(result.map((s) => s.title)).toEqual(['첫째', '둘째'])
  })
})
