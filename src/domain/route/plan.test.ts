// C-2 동선 계산 테스트 — 이 단위의 완료 기준
// 근거: route-planning/functional-design/business-logic-model.md 의 경계 상황 22가지
//       nfr-requirements.md R-NFR-3.1 ~ R-NFR-3.3
//
// 이동 시간과 지금 시각을 주입하므로 외부 서비스도 실제 시간도 필요 없다.

import { describe, expect, it } from 'vitest'
import type { ExpandedSchedule } from '../schedule/expand'
import { emptyPlace } from '../schedule/types'
import type { Coord, DaySetting, Place, TravelMode } from '../schedule/types'
import { DEFAULT_SETTINGS } from '../settings'
import type { Settings } from '../settings'
import { moveScheduleInOrder, planRoute } from './plan'
import type { TravelTime, TravelTimeLookup } from './types'

const DATE = '2026-08-26' // 수요일
const NOW = new Date(2026, 7, 26, 9, 0, 0) // 그날 오전 9시

function coord(lat: number, lng: number): Coord {
  return { lat, lng }
}

function place(query: string, c: Coord | null): Place {
  return c === null
    ? emptyPlace(query)
    : { query, resolvedName: query, coord: c, coordAt: NOW.toISOString() }
}

function schedule(overrides: Partial<ExpandedSchedule> = {}): ExpandedSchedule {
  return {
    id: 's1',
    date: DATE,
    title: '치과',
    place: place('강남역', coord(37.498, 127.028)),
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

function daySetting(overrides: Partial<DaySetting> = {}): DaySetting {
  return {
    date: DATE,
    origin: place('집', coord(37.555, 126.936)),
    destination: null,
    ...overrides,
  }
}

/** 모든 구간을 같은 시간으로 답하는 대역 */
function fixedLookup(minutes: number): TravelTimeLookup {
  return async (_from, _to, mode) => ({
    minutes,
    freshness: 'fresh',
    at: NOW.toISOString(),
    mode,
  })
}

/** 거리에 따라 답하는 대역 — 가까운 곳부터 이어 붙이기를 검증할 때 */
function distanceLookup(table: Record<string, number>): TravelTimeLookup {
  return async (from, to, mode) => {
    const key = `${from.lat.toFixed(3)},${from.lng.toFixed(3)}->${to.lat.toFixed(3)},${to.lng.toFixed(3)}`
    const minutes = table[key]
    if (minutes === undefined) return { minutes: 60, freshness: 'fresh', at: NOW.toISOString(), mode }
    return { minutes, freshness: 'fresh', at: NOW.toISOString(), mode }
  }
}

function run(args: {
  schedules?: readonly ExpandedSchedule[]
  daySetting?: DaySetting | null
  settings?: Settings
  lookup?: TravelTimeLookup
  now?: Date
  date?: string
}) {
  return planRoute({
    date: args.date ?? DATE,
    schedules: args.schedules ?? [],
    daySetting: args.daySetting === undefined ? daySetting() : args.daySetting,
    settings: args.settings ?? DEFAULT_SETTINGS,
    lookup: args.lookup ?? fixedLookup(20),
    now: args.now ?? NOW,
  })
}

describe('계산할 수 없는 경우', () => {
  it('하루 출발지가 없으면 계산하지 않는다 (RBR-23)', async () => {
    const result = await run({ schedules: [schedule()], daySetting: null })
    expect(result.kind).toBe('blocked')
    if (result.kind === 'blocked') {
      expect(result.block.kind).toBe('no-origin')
    }
  })

  it('하루 출발지에 좌표가 없으면 계산하지 않는다 (RBR-23)', async () => {
    const result = await run({
      schedules: [schedule()],
      daySetting: daySetting({ origin: emptyPlace('집') }),
    })
    expect(result.kind).toBe('blocked')
  })

  it('일정이 없으면 계산할 것이 없다고 알린다. 오류가 아니다 (RBR-26)', async () => {
    const result = await run({ schedules: [] })
    expect(result.kind).toBe('blocked')
    if (result.kind === 'blocked') {
      expect(result.block.kind).toBe('no-schedules')
    }
  })

  it('좌표를 뺀 뒤 남은 일정이 없으면 알린다 (RBR-26)', async () => {
    const result = await run({
      schedules: [schedule({ place: emptyPlace('어딘가') })],
    })
    expect(result.kind).toBe('blocked')
    if (result.kind === 'blocked' && result.block.kind === 'no-schedules') {
      expect(result.block.excluded).toHaveLength(1)
    }
  })

  it('옛 값도 없이 외부가 실패하면 알린다 (RBR-32)', async () => {
    const result = await run({
      schedules: [schedule()],
      lookup: async () => null,
    })
    expect(result.kind).toBe('blocked')
    if (result.kind === 'blocked') {
      expect(result.block.kind).toBe('travel-time-unavailable')
    }
  })
})

describe('일정 하나', () => {
  it('출발지에서 그 일정으로 가는 구간이 나온다', async () => {
    const result = await run({ schedules: [schedule()] })
    expect(result.kind).toBe('plan')
    if (result.kind === 'plan') {
      expect(result.plan.legs).toHaveLength(1)
      expect(result.plan.legs[0]?.destinationLabel).toBe('치과')
    }
  })

  it('마지막 도착지가 있으면 구간이 하나 더 붙는다 (BR-20)', async () => {
    const result = await run({
      schedules: [schedule()],
      daySetting: daySetting({ destination: place('집', coord(37.555, 126.936)) }),
    })
    if (result.kind === 'plan') {
      expect(result.plan.legs).toHaveLength(2)
      expect(result.plan.legs[1]?.scheduleId).toBeNull()
    }
  })

  it('마지막 도착지가 비어 있으면 마지막 일정에서 끝난다 (RBR-24 · BR-20)', async () => {
    const result = await run({ schedules: [schedule()] })
    if (result.kind === 'plan') {
      expect(result.plan.legs).toHaveLength(1)
    }
  })
})

describe('순서 정하기 (Q1-B · RBR-1 ~ RBR-5)', () => {
  it('고정형만 있으면 도착 시각이 이른 것부터 (RBR-1)', async () => {
    const result = await run({
      schedules: [
        schedule({ id: 'late', title: '저녁', arrivalTime: '19:00' }),
        schedule({ id: 'early', title: '아침', arrivalTime: '10:00' }),
      ],
    })
    if (result.kind === 'plan') {
      expect(result.plan.order).toEqual(['early', 'late'])
    }
  })

  it('유연형은 고정형 뒤로 간다 — 사이에 끼우지 않는다 (RBR-3 · Q1-B)', async () => {
    const result = await run({
      schedules: [
        schedule({ id: 'flex', title: '장 보기', kind: 'flexible', arrivalTime: null }),
        schedule({ id: 'fixed1', title: '치과', arrivalTime: '14:00' }),
        schedule({ id: 'fixed2', title: '저녁', arrivalTime: '19:00' }),
      ],
    })
    if (result.kind === 'plan') {
      expect(result.plan.order).toEqual(['fixed1', 'fixed2', 'flex'])
    }
  })

  it('고정형 사이에 시간이 많이 남아도 유연형을 넣지 않는다 (RBR-3 · Q1-B)', async () => {
    // 14시 치과가 60분, 19시 저녁. 사이에 4시간이 빈다
    const result = await run({
      schedules: [
        schedule({ id: 'flex', title: '장 보기', kind: 'flexible', arrivalTime: null, stayMinutes: 30 }),
        schedule({ id: 'fixed1', title: '치과', arrivalTime: '14:00', stayMinutes: 60 }),
        schedule({ id: 'fixed2', title: '저녁', arrivalTime: '19:00', stayMinutes: 90 }),
      ],
    })
    if (result.kind === 'plan') {
      // 장 보기가 저녁 뒤에 온다
      expect(result.plan.order.at(-1)).toBe('flex')
    }
  })

  it('고정형이 없으면 유연형만으로 순서를 정한다 (RBR-4)', async () => {
    const result = await run({
      schedules: [
        schedule({ id: 'a', title: 'A', kind: 'flexible', arrivalTime: null }),
        schedule({ id: 'b', title: 'B', kind: 'flexible', arrivalTime: null }),
      ],
    })
    expect(result.kind).toBe('plan')
    if (result.kind === 'plan') {
      expect(result.plan.order).toHaveLength(2)
    }
  })

  it('유연형끼리는 가까운 곳부터 이어 붙인다 (RBR-5)', async () => {
    const home = coord(37.555, 126.936)
    const near = coord(37.556, 126.94)
    const far = coord(37.6, 127.1)

    // 집 → near 10분, 집 → far 50분, near → far 40분
    const table: Record<string, number> = {
      '37.555,126.936->37.556,126.940': 10,
      '37.555,126.936->37.600,127.100': 50,
      '37.556,126.940->37.600,127.100': 40,
      '37.600,127.100->37.556,126.940': 40,
    }

    const result = await run({
      daySetting: daySetting({ origin: place('집', home) }),
      schedules: [
        schedule({ id: 'far', title: '먼 곳', kind: 'flexible', arrivalTime: null, place: place('먼 곳', far) }),
        schedule({ id: 'near', title: '가까운 곳', kind: 'flexible', arrivalTime: null, place: place('가까운 곳', near) }),
      ],
      lookup: distanceLookup(table),
    })

    if (result.kind === 'plan') {
      expect(result.plan.order).toEqual(['near', 'far'])
    }
  })

  it('완료 표시된 일정은 순서에서 빠진다 (RBR-7)', async () => {
    const result = await run({
      schedules: [
        schedule({ id: 'done', title: '끝난 것', done: true, excludedFromRoute: true }),
        schedule({ id: 'todo', title: '남은 것' }),
      ],
    })
    if (result.kind === 'plan') {
      expect(result.plan.order).toEqual(['todo'])
    }
  })

  it('손으로 고정한 자리를 지킨다 (RBR-6)', async () => {
    const result = await run({
      schedules: [
        schedule({ id: 'a', title: 'A', kind: 'flexible', arrivalTime: null, pinnedOrder: 1 }),
        schedule({ id: 'b', title: 'B', kind: 'flexible', arrivalTime: null, pinnedOrder: 0 }),
      ],
    })
    if (result.kind === 'plan') {
      expect(result.plan.order).toEqual(['b', 'a'])
    }
  })

  it('순서를 어떻게 정했는지 함께 낸다 (RBR-5)', async () => {
    const result = await run({ schedules: [schedule()] })
    if (result.kind === 'plan') {
      expect(result.plan.orderingMethod).toBe('nearest-neighbor')
    }
  })
})

describe('시각 계산 (RBR-8 ~ RBR-15)', () => {
  it('오늘이면 첫 출발 시각이 지금 시각이다 (RBR-8)', async () => {
    const result = await run({
      schedules: [schedule({ kind: 'flexible', arrivalTime: null })],
      now: new Date(2026, 7, 26, 9, 30, 0),
    })
    if (result.kind === 'plan') {
      expect(result.plan.legs[0]?.departAt).toBe('09:30')
    }
  })

  it('앞날이면 설정의 하루 시작 시각을 쓴다 (RBR-8)', async () => {
    const result = await run({
      date: '2026-08-27',
      schedules: [
        schedule({ date: '2026-08-27', kind: 'flexible', arrivalTime: null }),
      ],
      now: new Date(2026, 7, 26, 9, 30, 0),
    })
    if (result.kind === 'plan') {
      expect(result.plan.legs[0]?.departAt).toBe('09:00')
    }
  })

  it('지난 날짜에는 지금 시각을 쓰지 않는다 (RBR-15)', async () => {
    const result = await run({
      date: '2026-08-20',
      schedules: [
        schedule({ date: '2026-08-20', kind: 'flexible', arrivalTime: null }),
      ],
      now: new Date(2026, 7, 26, 15, 0, 0),
    })
    if (result.kind === 'plan') {
      expect(result.plan.legs[0]?.departAt).toBe('09:00')
    }
  })

  it('고정형의 출발 시각은 도착 시각에서 이동 시간을 뺀 값이다 (RBR-12)', async () => {
    const result = await run({
      schedules: [schedule({ arrivalTime: '14:00' })],
      lookup: fixedLookup(25),
    })
    if (result.kind === 'plan') {
      expect(result.plan.legs[0]?.arriveAt).toBe('14:00')
      expect(result.plan.legs[0]?.departAt).toBe('13:35')
    }
  })

  it('고정형의 도착 시각을 앱이 바꾸지 않는다 (RBR-2)', async () => {
    const result = await run({
      schedules: [
        schedule({ id: 'a', arrivalTime: '14:00' }),
        schedule({ id: 'b', title: '저녁', arrivalTime: '19:00' }),
      ],
    })
    if (result.kind === 'plan') {
      expect(result.plan.legs[0]?.arriveAt).toBe('14:00')
      expect(result.plan.legs[1]?.arriveAt).toBe('19:00')
      expect(result.plan.legs.every((leg) => leg.arrivalFixed)).toBe(true)
    }
  })

  it('유연형의 도착 시각은 앞 구간이 끝난 뒤 이동해서 닿는 시각이다 (RBR-10)', async () => {
    const result = await run({
      schedules: [
        schedule({ id: 'a', title: 'A', kind: 'flexible', arrivalTime: null, stayMinutes: 30 }),
        schedule({ id: 'b', title: 'B', kind: 'flexible', arrivalTime: null, stayMinutes: 30 }),
      ],
      lookup: fixedLookup(20),
      now: new Date(2026, 7, 26, 9, 0, 0),
    })
    if (result.kind === 'plan') {
      // 09:00 출발 → 09:20 도착 → 30분 머묾 → 09:50 출발 → 10:10 도착
      expect(result.plan.legs[0]?.arriveAt).toBe('09:20')
      expect(result.plan.legs[1]?.departAt).toBe('09:50')
      expect(result.plan.legs[1]?.arriveAt).toBe('10:10')
    }
  })

  it('고정형에 일찍 닿으면 기다린다. 기다린 시간이 총 이동 시간에 안 들어간다 (RBR-13)', async () => {
    const result = await run({
      schedules: [schedule({ arrivalTime: '14:00' })],
      lookup: fixedLookup(20),
      now: new Date(2026, 7, 26, 9, 0, 0),
    })
    if (result.kind === 'plan') {
      // 09:00 에 나갈 수 있는데 13:40 에 나가면 되므로 4시간 40분을 기다린다
      expect(result.plan.legs[0]?.waitMinutes).toBe(280)
      // 총 이동 시간은 이동한 20분뿐이다
      expect(result.plan.totalTravelMinutes).toBe(20)
    }
  })

  it('총 이동 시간은 구간 이동 시간의 합이다 (RBR-13)', async () => {
    const result = await run({
      schedules: [
        schedule({ id: 'a', title: 'A', kind: 'flexible', arrivalTime: null }),
        schedule({ id: 'b', title: 'B', kind: 'flexible', arrivalTime: null }),
      ],
      lookup: fixedLookup(15),
    })
    if (result.kind === 'plan') {
      expect(result.plan.totalTravelMinutes).toBe(30)
    }
  })

  it('첫 일정이 고정형이고 일찍 나가야 하면 하루 시작 시각을 쓰지 않는다 (RBR-9)', async () => {
    const result = await run({
      date: '2026-08-27',
      schedules: [schedule({ date: '2026-08-27', arrivalTime: '08:00' })],
      lookup: fixedLookup(30),
      now: new Date(2026, 7, 26, 9, 0, 0),
    })
    if (result.kind === 'plan') {
      // 설정은 09:00 이지만 08:00 도착이므로 07:30 에 나가야 한다
      expect(result.plan.legs[0]?.departAt).toBe('07:30')
    }
  })

  it('자정을 넘겨도 시각이 어긋나지 않는다 (RBR-14)', async () => {
    const result = await run({
      schedules: [
        schedule({ id: 'a', title: '밤 일정', arrivalTime: '23:00', stayMinutes: 120 }),
      ],
      lookup: fixedLookup(20),
    })
    if (result.kind === 'plan') {
      expect(result.plan.legs[0]?.arriveAt).toBe('23:00')
      // 23시 도착 + 120분 = 다음날 01:00
      expect(result.plan.dayEndAt).toBe('01:00')
    }
  })
})

describe('도착 불가 (RBR-16 ~ RBR-19)', () => {
  it('이을 수 없는 고정형 둘이면 순서 대신 경고를 낸다 (RBR-16 · RBR-17)', async () => {
    const result = await run({
      schedules: [
        schedule({ id: 'a', title: '치과', arrivalTime: '14:00', stayMinutes: 60 }),
        schedule({ id: 'b', title: '저녁', arrivalTime: '15:00', stayMinutes: 60 }),
      ],
      lookup: fixedLookup(40),
    })
    expect(result.kind).toBe('infeasible')
  })

  it('몇 분 모자라는지 알린다 (RBR-18)', async () => {
    const result = await run({
      schedules: [
        schedule({ id: 'a', title: '치과', arrivalTime: '14:00', stayMinutes: 60 }),
        schedule({ id: 'b', title: '저녁', arrivalTime: '15:00', stayMinutes: 60 }),
      ],
      lookup: fixedLookup(40),
    })
    if (result.kind === 'infeasible') {
      const problem = result.problems[0]!
      // 14:00 도착 + 60분 = 15:00 끝. 40분 이동하면 15:40. 15:00 까지니 40분 모자란다
      expect(problem.shortMinutes).toBe(40)
      expect(problem.title).toBe('저녁')
      expect(problem.causedByTitle).toBe('치과')
    }
  })

  it('도착 불가가 두 곳이면 모두 알린다 (RBR-19)', async () => {
    const result = await run({
      schedules: [
        schedule({ id: 'a', title: 'A', arrivalTime: '10:00', stayMinutes: 60 }),
        schedule({ id: 'b', title: 'B', arrivalTime: '10:30', stayMinutes: 60 }),
        schedule({ id: 'c', title: 'C', arrivalTime: '11:00', stayMinutes: 60 }),
      ],
      lookup: fixedLookup(30),
    })
    if (result.kind === 'infeasible') {
      expect(result.problems.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('제때 닿을 수 있으면 경고가 없다', async () => {
    const result = await run({
      schedules: [
        schedule({ id: 'a', title: '치과', arrivalTime: '14:00', stayMinutes: 60 }),
        schedule({ id: 'b', title: '저녁', arrivalTime: '19:00', stayMinutes: 60 }),
      ],
      lookup: fixedLookup(30),
    })
    expect(result.kind).toBe('plan')
  })

  it('도착 불가여도 빠진 일정을 함께 알린다', async () => {
    const result = await run({
      schedules: [
        schedule({ id: 'a', title: '치과', arrivalTime: '14:00', stayMinutes: 60 }),
        schedule({ id: 'b', title: '저녁', arrivalTime: '15:00', stayMinutes: 60 }),
        schedule({ id: 'c', title: '좌표없음', place: emptyPlace('어딘가') }),
      ],
      lookup: fixedLookup(40),
    })
    if (result.kind === 'infeasible') {
      expect(result.excluded).toHaveLength(1)
    }
  })
})

describe('좌표 없는 일정 (Q4-A · RBR-21 ~ RBR-25)', () => {
  it('좌표가 없는 일정을 빼고 나머지로 계산한다 (RBR-21)', async () => {
    const result = await run({
      schedules: [
        schedule({ id: 'ok', title: '되는 것' }),
        schedule({ id: 'no', title: '안 되는 것', place: emptyPlace('어딘가') }),
      ],
    })
    expect(result.kind).toBe('plan')
    if (result.kind === 'plan') {
      expect(result.plan.order).toEqual(['ok'])
      expect(result.plan.excluded).toHaveLength(1)
    }
  })

  it('왜 빠졌는지 알린다 (RBR-22)', async () => {
    const result = await run({
      schedules: [
        schedule({ id: 'ok', title: '되는 것' }),
        schedule({ id: 'empty', title: '주소 빈 것', place: emptyPlace('') }),
        schedule({ id: 'nocoord', title: '못 찾은 것', place: emptyPlace('없는 주소') }),
      ],
    })
    if (result.kind === 'plan') {
      const reasons = result.plan.excluded.map((item) => item.reason)
      expect(reasons).toContain('empty-query')
      expect(reasons).toContain('no-coord')
    }
  })

  it('빠진 것이 고정형이면 표시한다 (RBR-25)', async () => {
    const result = await run({
      schedules: [
        schedule({ id: 'ok', title: '되는 것', kind: 'flexible', arrivalTime: null }),
        schedule({ id: 'no', title: '고정형인데 좌표 없음', kind: 'fixed', arrivalTime: '14:00', place: emptyPlace('어딘가') }),
      ],
    })
    if (result.kind === 'plan') {
      expect(result.plan.excluded[0]?.wasFixed).toBe(true)
    }
  })
})

describe('이동 시간의 상태 (RBR-31 · RBR-34 · R-NFR-6)', () => {
  it('캐시에서 온 값은 낡은 것으로 보지 않는다 (RBR-34)', async () => {
    const result = await run({
      schedules: [schedule()],
      lookup: async (_f, _t, mode): Promise<TravelTime> => ({
        minutes: 20,
        freshness: 'cached',
        at: NOW.toISOString(),
        mode,
      }),
    })
    if (result.kind === 'plan') {
      expect(result.plan.hasStaleTravelTime).toBe(false)
    }
  })

  it('실패해서 옛 값을 쓰면 낡았다고 표시한다 (RBR-31)', async () => {
    const result = await run({
      schedules: [schedule()],
      lookup: async (_f, _t, mode): Promise<TravelTime> => ({
        minutes: 20,
        freshness: 'stale',
        at: NOW.toISOString(),
        mode,
      }),
    })
    if (result.kind === 'plan') {
      expect(result.plan.hasStaleTravelTime).toBe(true)
    }
  })

  it('어림값이 섞이면 표시한다 (R-NFR-6.3)', async () => {
    const result = await run({
      schedules: [schedule({ travelMode: 'walk' as TravelMode })],
      lookup: async (_f, _t, mode): Promise<TravelTime> => ({
        minutes: 12,
        freshness: 'estimated',
        at: NOW.toISOString(),
        mode,
      }),
    })
    if (result.kind === 'plan') {
      expect(result.plan.hasEstimatedTravelTime).toBe(true)
    }
  })

  it('구간마다 어디서 온 값인지 남는다', async () => {
    const result = await run({ schedules: [schedule()], lookup: fixedLookup(20) })
    if (result.kind === 'plan') {
      expect(result.plan.legs[0]?.freshness).toBe('fresh')
    }
  })
})

describe('순서를 손으로 옮기기 (RBR-42)', () => {
  it('위로 옮기면 앞 일정과 자리가 바뀐다', () => {
    const pins = moveScheduleInOrder(['a', 'b', 'c'], 'b', 'up')
    const map = new Map(pins.map((pin) => [pin.scheduleId, pin.pinnedOrder]))
    expect(map.get('b')).toBe(0)
    expect(map.get('a')).toBe(1)
  })

  it('아래로 옮기면 뒤 일정과 자리가 바뀐다', () => {
    const pins = moveScheduleInOrder(['a', 'b', 'c'], 'b', 'down')
    const map = new Map(pins.map((pin) => [pin.scheduleId, pin.pinnedOrder]))
    expect(map.get('b')).toBe(2)
    expect(map.get('c')).toBe(1)
  })

  it('맨 위에서 더 위로는 옮기지 않는다', () => {
    expect(moveScheduleInOrder(['a', 'b'], 'a', 'up')).toEqual([])
  })

  it('맨 아래에서 더 아래로는 옮기지 않는다', () => {
    expect(moveScheduleInOrder(['a', 'b'], 'b', 'down')).toEqual([])
  })

  it('없는 일정은 옮기지 않는다', () => {
    expect(moveScheduleInOrder(['a', 'b'], 'z', 'up')).toEqual([])
  })
})
