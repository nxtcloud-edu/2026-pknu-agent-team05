// 경계 1 테스트 — checkRouteReadiness
//
// route-planning STEP 05 에서 Q4-A 를 반영해 고친 곳이다.
// 좌표가 없는 일정은 계산을 막지 않고 그 일정만 빠진다 (RBR-21).
// 이 동작을 테스트로 못 박아 나중에 되돌아가지 않게 한다.

import { describe, expect, it } from 'vitest'
import { buildRoutePlanningInput, checkRouteReadiness } from './handoff'
import type { ExpandedSchedule } from './schedule/expand'
import { emptyPlace } from './schedule/types'
import type { Coord, DaySetting, Place } from './schedule/types'
import { DEFAULT_SETTINGS } from './settings'

const DATE = '2026-08-26'

function place(query: string, coord: Coord | null): Place {
  return coord === null
    ? emptyPlace(query)
    : { query, resolvedName: query, coord, coordAt: '2026-08-26T00:00:00.000Z' }
}

function schedule(overrides: Partial<ExpandedSchedule> = {}): ExpandedSchedule {
  return {
    id: 's1',
    date: DATE,
    title: '치과',
    place: place('강남역', { lat: 37.498, lng: 127.028 }),
    stayMinutes: 60,
    kind: 'fixed',
    arrivalTime: '14:00',
    travelMode: 'transit',
    done: false,
    pinnedOrder: null,
    isAppointment: false,
    origin: { kind: 'direct' },
    excludedFromRoute: false,
    ...overrides,
  }
}

function check(args: {
  schedules?: readonly ExpandedSchedule[]
  daySetting?: DaySetting | null
}) {
  return checkRouteReadiness(
    buildRoutePlanningInput({
      date: DATE,
      schedules: args.schedules ?? [],
      daySetting:
        args.daySetting === undefined
          ? { date: DATE, origin: place('집', { lat: 37.555, lng: 126.936 }), destination: null }
          : args.daySetting,
      settings: DEFAULT_SETTINGS,
    }),
  )
}

describe('경계 1 · 계산할 수 있는 상태인지', () => {
  it('하루 설정이 없으면 계산할 수 없다 (BR-19)', () => {
    const result = check({ schedules: [schedule()], daySetting: null })
    expect(result.ready).toBe(false)
    if (!result.ready) {
      expect(result.reason.kind).toBe('no-day-setting')
    }
  })

  it('출발지에 좌표가 없으면 계산할 수 없다 (BR-19)', () => {
    const result = check({
      schedules: [schedule()],
      daySetting: { date: DATE, origin: emptyPlace('집'), destination: null },
    })
    expect(result.ready).toBe(false)
  })

  it('일정이 없으면 계산할 수 없다', () => {
    const result = check({ schedules: [] })
    expect(result.ready).toBe(false)
    if (!result.ready) {
      expect(result.reason.kind).toBe('no-schedules')
    }
  })

  it('완료된 일정만 있으면 계산할 수 없다 (BR-15)', () => {
    const result = check({
      schedules: [schedule({ done: true, excludedFromRoute: true })],
    })
    expect(result.ready).toBe(false)
  })

  it('일정과 출발지가 있으면 계산할 수 있다', () => {
    const result = check({ schedules: [schedule()] })
    expect(result.ready).toBe(true)
  })
})

describe('좌표 없는 일정 (Q4-A 로 고친 것)', () => {
  it('좌표가 없어도 계산을 막지 않는다 — 그 일정만 빠진다 (RBR-21)', () => {
    const result = check({
      schedules: [
        schedule({ id: 'ok', title: '되는 것' }),
        schedule({ id: 'no', title: '안 되는 것', place: emptyPlace('어딘가') }),
      ],
    })
    expect(result.ready).toBe(true)
  })

  it('무엇이 빠질지 미리 알려준다 (RBR-22)', () => {
    const result = check({
      schedules: [
        schedule({ id: 'ok', title: '되는 것' }),
        schedule({ id: 'no', title: '안 되는 것', place: emptyPlace('어딘가') }),
      ],
    })
    if (result.ready) {
      expect(result.willExclude).toEqual(['안 되는 것'])
    }
  })

  it('빠질 것이 없으면 목록이 비어 있다', () => {
    const result = check({ schedules: [schedule()] })
    if (result.ready) {
      expect(result.willExclude).toEqual([])
    }
  })

  it('다 빠지면 계산할 것이 없다 (RBR-26)', () => {
    const result = check({
      schedules: [
        schedule({ id: 'a', title: 'A', place: emptyPlace('어딘가') }),
        schedule({ id: 'b', title: 'B', place: emptyPlace('저딘가') }),
      ],
    })
    expect(result.ready).toBe(false)
    if (!result.ready && result.reason.kind === 'all-excluded') {
      expect(result.reason.titles).toEqual(['A', 'B'])
    }
  })

  it('완료된 일정은 빠질 목록에 넣지 않는다', () => {
    const result = check({
      schedules: [
        schedule({ id: 'ok', title: '되는 것' }),
        schedule({
          id: 'done',
          title: '완료된 것',
          place: emptyPlace('어딘가'),
          done: true,
          excludedFromRoute: true,
        }),
      ],
    })
    if (result.ready) {
      expect(result.willExclude).toEqual([])
    }
  })
})

describe('경계 1 로 넘기는 값', () => {
  it('설정에서 필요한 값을 뽑아 넘긴다', () => {
    const input = buildRoutePlanningInput({
      date: DATE,
      schedules: [],
      daySetting: null,
      settings: DEFAULT_SETTINGS,
    })
    expect(input.defaultTravelMode).toBe(DEFAULT_SETTINGS.user.defaultTravelMode)
    expect(input.travelTimeCacheMinutes).toBe(
      DEFAULT_SETTINGS.system.travelTimeCacheMinutes,
    )
  })

  it('펼쳐진 목록을 그대로 넘긴다 — 걸러내지 않는다', () => {
    const schedules = [schedule({ done: true, excludedFromRoute: true }), schedule({ id: 's2' })]
    const input = buildRoutePlanningInput({
      date: DATE,
      schedules,
      daySetting: null,
      settings: DEFAULT_SETTINGS,
    })
    expect(input.schedules).toHaveLength(2)
  })
})
