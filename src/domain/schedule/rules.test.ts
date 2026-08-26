// 규칙 검사 테스트 — BR-1 ~ BR-8 · BR-30 · BR-24
// 근거: nfr-requirements.md U-NFR-2.3 (규칙 검사가 각각 테스트로 확인된다)

import { describe, expect, it } from 'vitest'
import {
  affectsRouteCalculation,
  normalizeArrivalTime,
  placeAfterQueryChange,
  resolveTravelMode,
  validateRecurringDraft,
  validateScheduleDraft,
} from './rules'
import type { ScheduleDraft } from './rules'
import { emptyPlace } from './types'
import type { Schedule } from './types'

function draft(overrides: Partial<ScheduleDraft> = {}): ScheduleDraft {
  return {
    title: '치과',
    placeQuery: '강남역',
    stayMinutes: 60,
    kind: 'fixed',
    arrivalTime: '14:00',
    travelMode: 'transit',
    ...overrides,
  }
}

function rulesOf(violations: readonly { readonly rule: string }[]): string[] {
  return violations.map((violation) => violation.rule)
}

describe('일정 규칙 검사', () => {
  it('제대로 채운 일정은 걸리는 규칙이 없다', () => {
    expect(validateScheduleDraft(draft())).toEqual([])
  })

  // BR-1
  it('BR-1 제목이 비면 걸린다', () => {
    expect(rulesOf(validateScheduleDraft(draft({ title: '' })))).toContain('BR-1')
  })

  it('BR-1 제목이 공백뿐이어도 걸린다', () => {
    expect(rulesOf(validateScheduleDraft(draft({ title: '   ' })))).toContain('BR-1')
  })

  // BR-2
  it('BR-2 장소가 비면 걸린다', () => {
    expect(rulesOf(validateScheduleDraft(draft({ placeQuery: '' })))).toContain('BR-2')
  })

  // BR-3
  it('BR-3 머무는 시간이 0이면 걸린다', () => {
    expect(rulesOf(validateScheduleDraft(draft({ stayMinutes: 0 })))).toContain('BR-3')
  })

  it('BR-3 머무는 시간이 음수면 걸린다', () => {
    expect(rulesOf(validateScheduleDraft(draft({ stayMinutes: -30 })))).toContain('BR-3')
  })

  it('BR-3 머무는 시간이 하루를 넘으면 걸린다', () => {
    expect(rulesOf(validateScheduleDraft(draft({ stayMinutes: 2000 })))).toContain('BR-3')
  })

  // BR-4
  it('BR-4 고정형인데 도착 시각이 없으면 걸린다', () => {
    const violations = validateScheduleDraft(draft({ kind: 'fixed', arrivalTime: null }))
    expect(rulesOf(violations)).toContain('BR-4')
  })

  it('BR-4 도착 시각 형식이 틀리면 걸린다', () => {
    const violations = validateScheduleDraft(draft({ arrivalTime: '25:00' }))
    expect(rulesOf(violations)).toContain('BR-4')
  })

  // BR-5
  it('BR-5 유연형이면 도착 시각이 없어도 걸리지 않는다', () => {
    expect(validateScheduleDraft(draft({ kind: 'flexible', arrivalTime: null }))).toEqual([])
  })

  it('BR-5 유연형에 도착 시각이 들어오면 비운다', () => {
    expect(normalizeArrivalTime('flexible', '14:00')).toBeNull()
  })

  it('BR-6 고정형 → 유연형 으로 바꾸면 도착 시각이 지워진다', () => {
    expect(normalizeArrivalTime('flexible', '09:30')).toBeNull()
  })

  it('고정형은 도착 시각을 그대로 둔다', () => {
    expect(normalizeArrivalTime('fixed', '09:30')).toBe('09:30')
  })

  // BR-8
  it('BR-8 이동 수단을 고르지 않으면 기본값이 채워진다', () => {
    expect(resolveTravelMode(null, 'car')).toBe('car')
  })

  it('BR-8 고른 이동 수단이 있으면 그것을 쓴다', () => {
    expect(resolveTravelMode('walk', 'car')).toBe('walk')
  })

  it('BR-8 고르지 않은 것은 잘못이 아니다', () => {
    expect(validateScheduleDraft(draft({ travelMode: null }))).toEqual([])
  })

  it('여러 규칙을 함께 어기면 모두 돌려준다', () => {
    const violations = validateScheduleDraft(
      draft({ title: '', placeQuery: '', stayMinutes: 0 }),
    )
    expect(rulesOf(violations)).toEqual(
      expect.arrayContaining(['BR-1', 'BR-2', 'BR-3']),
    )
  })
})

describe('반복 규칙 검사 (BR-30)', () => {
  it('일정과 같은 규칙을 따른다', () => {
    const violations = validateRecurringDraft({
      ...draft({ title: '' }),
      startDate: '2026-08-01',
      endDate: null,
    })
    expect(rulesOf(violations)).toContain('BR-1')
  })

  it('끝나는 날짜가 시작 날짜보다 앞서면 걸린다', () => {
    const violations = validateRecurringDraft({
      ...draft(),
      startDate: '2026-09-01',
      endDate: '2026-08-01',
    })
    expect(rulesOf(violations)).toContain('BR-30')
  })

  it('끝나는 날짜가 비어 있으면 걸리지 않는다', () => {
    const violations = validateRecurringDraft({
      ...draft(),
      startDate: '2026-08-01',
      endDate: null,
    })
    expect(violations).toEqual([])
  })
})

describe('다시 계산해야 하는지 (BR-11 ~ BR-14)', () => {
  const base: Schedule = {
    id: 's1',
    date: '2026-08-26',
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
  }

  it('BR-14 제목만 바뀌면 다시 계산하지 않는다', () => {
    expect(affectsRouteCalculation(base, { ...base, title: '치과 검진' })).toBe(false)
  })

  it('BR-11 장소가 바뀌면 다시 계산한다', () => {
    expect(
      affectsRouteCalculation(base, { ...base, place: emptyPlace('종로3가') }),
    ).toBe(true)
  })

  it('BR-11 머무는 시간이 바뀌면 다시 계산한다', () => {
    expect(affectsRouteCalculation(base, { ...base, stayMinutes: 30 })).toBe(true)
  })

  it('BR-11 이동 수단이 바뀌면 다시 계산한다', () => {
    expect(affectsRouteCalculation(base, { ...base, travelMode: 'car' })).toBe(true)
  })

  it('BR-11 완료 표시가 바뀌면 다시 계산한다', () => {
    expect(affectsRouteCalculation(base, { ...base, done: true })).toBe(true)
  })

  it('BR-11 손으로 고정한 자리가 바뀌면 다시 계산한다', () => {
    expect(affectsRouteCalculation(base, { ...base, pinnedOrder: 2 })).toBe(true)
  })

  it('BR-11 도착 시각이 바뀌면 다시 계산한다', () => {
    expect(affectsRouteCalculation(base, { ...base, arrivalTime: '15:00' })).toBe(true)
  })

  it('아무것도 바뀌지 않으면 다시 계산하지 않는다', () => {
    expect(affectsRouteCalculation(base, { ...base })).toBe(false)
  })
})

describe('장소 글자가 바뀔 때 (BR-24)', () => {
  const resolved = {
    query: '강남역',
    resolvedName: '강남역 2호선',
    coord: { lat: 37.498, lng: 127.028 },
    coordAt: '2026-08-26T04:00:00.000Z',
  }

  it('글자가 바뀌면 좌표와 확정된 이름이 지워진다', () => {
    const next = placeAfterQueryChange('강남역', '종로3가', resolved)
    expect(next.query).toBe('종로3가')
    expect(next.coord).toBeNull()
    expect(next.resolvedName).toBeNull()
    expect(next.coordAt).toBeNull()
  })

  it('글자가 그대로면 좌표를 지우지 않는다', () => {
    const next = placeAfterQueryChange('강남역', '강남역', resolved)
    expect(next.coord).toEqual({ lat: 37.498, lng: 127.028 })
  })
})
