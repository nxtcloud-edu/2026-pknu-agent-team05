// 보관소 테스트 — BR-10 · BR-18 · BR-33 · BR-35 · BR-36 · BR-39 · BR-41 · BR-44 · U-NFR-1.3
//
// U-NFR-1.3 이 이 파일의 중심이다. localStorage 는 글자만 담으므로(Q2-A)
// 시각을 글자로 넣고 꺼내 되돌린 값이 넣기 전과 같은지 확인해야 한다.

import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from '../domain/settings'
import { emptyPlace } from '../domain/schedule/types'
import type {
  DaySetting,
  Participant,
  RecurringException,
  RecurringRule,
  Schedule,
} from '../domain/schedule/types'
import { STORAGE_KEYS, STORAGE_SCHEMA_VERSION, memoryStore, read, write } from './localStore'
import {
  clearEverything,
  findDaySetting,
  findParticipants,
  loadAll,
  modifyRecurringOnDate,
  removeDirectSchedule,
  removeRecurringRule,
  saveDaySettings,
  saveParticipants,
  saveRules,
  saveSchedules,
  saveSettings,
  skipRecurringOnDate,
  upsertDaySetting,
  upsertException,
} from './repository'
import type { StoredData } from './repository'

function makeSchedule(overrides: Partial<Schedule> = {}): Schedule {
  return {
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
    ...overrides,
  }
}

function makeRule(overrides: Partial<RecurringRule> = {}): RecurringRule {
  return {
    id: 'rule-1',
    weekday: 3,
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

function emptyData(): StoredData {
  return {
    schedules: [],
    rules: [],
    exceptions: [],
    daySettings: [],
    participants: [],
    settings: DEFAULT_SETTINGS,
  }
}

describe('남기고 꺼내기 (BR-42 · U-NFR-1.3)', () => {
  it('아무것도 없으면 빈 값으로 시작한다', () => {
    const store = memoryStore()
    const data = loadAll(store)
    expect(data.schedules).toEqual([])
    expect(data.rules).toEqual([])
    expect(data.settings).toEqual(DEFAULT_SETTINGS)
  })

  it('넣은 일정을 그대로 꺼낸다', () => {
    const store = memoryStore()
    const schedule = makeSchedule()
    saveSchedules(store, [schedule])
    expect(loadAll(store).schedules).toEqual([schedule])
  })

  // U-NFR-1.3 — 이 앱에서 가장 깨지기 쉬운 대목
  it('시각을 글자로 넣고 꺼내 되돌린 값이 같다', () => {
    const store = memoryStore()
    const schedule = makeSchedule({ arrivalTime: '23:45', date: '2026-12-31' })
    saveSchedules(store, [schedule])

    const loaded = loadAll(store).schedules[0]
    expect(loaded?.arrivalTime).toBe('23:45')
    expect(loaded?.date).toBe('2026-12-31')
  })

  it('도착 시각이 비어 있는 유연형 일정도 되돌린다', () => {
    const store = memoryStore()
    const schedule = makeSchedule({ kind: 'flexible', arrivalTime: null })
    saveSchedules(store, [schedule])

    const loaded = loadAll(store).schedules[0]
    expect(loaded?.kind).toBe('flexible')
    expect(loaded?.arrivalTime).toBeNull()
  })

  it('좌표가 비어 있는 장소도 되돌린다 (BR-22)', () => {
    const store = memoryStore()
    saveSchedules(store, [makeSchedule()])
    const loaded = loadAll(store).schedules[0]
    expect(loaded?.place.coord).toBeNull()
    expect(loaded?.place.query).toBe('강남역')
  })

  it('좌표가 채워진 장소도 되돌린다', () => {
    const store = memoryStore()
    const schedule = makeSchedule({
      place: {
        query: '강남역',
        resolvedName: '강남역 2호선',
        coord: { lat: 37.498, lng: 127.028 },
        coordAt: '2026-08-26T04:00:00.000Z',
      },
    })
    saveSchedules(store, [schedule])
    expect(loadAll(store).schedules[0]?.place.coord).toEqual({ lat: 37.498, lng: 127.028 })
  })

  it('반복 규칙 · 예외 · 하루 설정 · 참여자 · 설정을 모두 되돌린다', () => {
    const store = memoryStore()
    const rule = makeRule()
    const exception: RecurringException = {
      ruleId: 'rule-1',
      date: '2026-08-26',
      mode: 'skip',
    }
    const daySetting: DaySetting = {
      date: '2026-08-26',
      origin: emptyPlace('집'),
      destination: null,
    }
    const participant: Participant = {
      id: 'p1',
      scheduleId: 's1',
      name: '민수',
      place: emptyPlace('신촌'),
      travelMode: 'transit',
    }

    saveRules(store, [rule])
    saveDaySettings(store, [daySetting])
    saveParticipants(store, [participant])
    saveSettings(store, {
      ...DEFAULT_SETTINGS,
      user: { ...DEFAULT_SETTINGS.user, bufferMinutes: 25 },
    })
    write(store, STORAGE_KEYS.recurringExceptions, [exception])

    const data = loadAll(store)
    expect(data.rules).toEqual([rule])
    expect(data.exceptions).toEqual([exception])
    expect(data.daySettings).toEqual([daySetting])
    expect(data.participants).toEqual([participant])
    expect(data.settings.user.bufferMinutes).toBe(25)
  })
})

describe('저장 모양 판번호', () => {
  it('판번호가 다르면 빈 값으로 시작한다', () => {
    const store = memoryStore({
      [STORAGE_KEYS.schedules]: JSON.stringify({ version: 999, data: [makeSchedule()] }),
    })
    expect(loadAll(store).schedules).toEqual([])
  })

  it('판번호가 같으면 꺼낸다', () => {
    const store = memoryStore({
      [STORAGE_KEYS.schedules]: JSON.stringify({
        version: STORAGE_SCHEMA_VERSION,
        data: [makeSchedule()],
      }),
    })
    expect(loadAll(store).schedules).toHaveLength(1)
  })

  it('글자가 깨져 있으면 빈 값으로 시작한다', () => {
    const store = memoryStore({ [STORAGE_KEYS.schedules]: '{{{ 깨진 값' })
    expect(loadAll(store).schedules).toEqual([])
  })

  it('감싸는 모양이 아니면 빈 값으로 시작한다', () => {
    const store = memoryStore({ [STORAGE_KEYS.schedules]: JSON.stringify([makeSchedule()]) })
    expect(loadAll(store).schedules).toEqual([])
  })

  it('되돌릴 수 없어도 오류를 던지지 않는다', () => {
    const store = memoryStore({ [STORAGE_KEYS.settings]: 'not json' })
    expect(() => loadAll(store)).not.toThrow()
    expect(loadAll(store).settings).toEqual(DEFAULT_SETTINGS)
  })
})

describe('함께 지우기', () => {
  // BR-41 · BR-10
  it('BR-41 직접 넣은 일정을 지우면 그 일정만 사라진다', () => {
    const data: StoredData = {
      ...emptyData(),
      schedules: [makeSchedule(), makeSchedule({ id: 's2' })],
    }
    const next = removeDirectSchedule(data, 's1')
    expect(next.schedules.map((s) => s.id)).toEqual(['s2'])
  })

  it('BR-10 일정을 지우면 딸린 참여자도 함께 지워진다', () => {
    const data: StoredData = {
      ...emptyData(),
      schedules: [makeSchedule()],
      participants: [
        { id: 'p1', scheduleId: 's1', name: '민수', place: emptyPlace('신촌'), travelMode: 'transit' },
        { id: 'p2', scheduleId: 's2', name: '영희', place: emptyPlace('홍대'), travelMode: 'walk' },
      ],
    }
    const next = removeDirectSchedule(data, 's1')
    expect(next.participants.map((p) => p.id)).toEqual(['p2'])
  })

  it('BR-41 직접 넣은 일정을 지워도 예외를 남기지 않는다', () => {
    const data: StoredData = { ...emptyData(), schedules: [makeSchedule()] }
    const next = removeDirectSchedule(data, 's1')
    expect(next.exceptions).toEqual([])
  })

  // BR-33
  it('BR-33 반복 규칙을 지우면 딸린 예외도 함께 지워진다', () => {
    const data: StoredData = {
      ...emptyData(),
      rules: [makeRule(), makeRule({ id: 'rule-2' })],
      exceptions: [
        { ruleId: 'rule-1', date: '2026-08-26', mode: 'skip' },
        { ruleId: 'rule-2', date: '2026-08-26', mode: 'skip' },
      ],
    }
    const next = removeRecurringRule(data, 'rule-1')
    expect(next.rules.map((r) => r.id)).toEqual(['rule-2'])
    expect(next.exceptions.map((e) => e.ruleId)).toEqual(['rule-2'])
  })
})

describe('반복 일정 그날만 다루기', () => {
  // BR-36 · BR-40
  it('BR-36 건너뛰면 `건너뜀` 예외가 남는다. 규칙은 그대로다', () => {
    const data: StoredData = { ...emptyData(), rules: [makeRule()] }
    const next = skipRecurringOnDate(data, 'rule-1', '2026-08-26')

    expect(next.rules).toHaveLength(1)
    expect(next.exceptions).toEqual([
      { ruleId: 'rule-1', date: '2026-08-26', mode: 'skip' },
    ])
  })

  // BR-35
  it('BR-35 그날만 고치면 `고침` 예외가 남는다. 규칙은 그대로다', () => {
    const data: StoredData = { ...emptyData(), rules: [makeRule()] }
    const next = modifyRecurringOnDate(data, {
      ruleId: 'rule-1',
      date: '2026-08-26',
      mode: 'modify',
      patch: { arrivalTime: '20:00' },
    })

    expect(next.rules[0]?.arrivalTime).toBe('19:00')
    expect(next.exceptions).toHaveLength(1)
  })

  // BR-39
  it('BR-39 같은 규칙 + 같은 날짜의 예외는 하나뿐이다. 덮어쓴다', () => {
    const first: RecurringException = {
      ruleId: 'rule-1',
      date: '2026-08-26',
      mode: 'skip',
    }
    const second: RecurringException = {
      ruleId: 'rule-1',
      date: '2026-08-26',
      mode: 'modify',
      patch: { title: '바뀐 제목' },
    }
    const result = upsertException([first], second)

    expect(result).toHaveLength(1)
    expect(result[0]?.mode).toBe('modify')
  })

  it('다른 날짜의 예외는 함께 남는다', () => {
    const first: RecurringException = {
      ruleId: 'rule-1',
      date: '2026-08-26',
      mode: 'skip',
    }
    const second: RecurringException = {
      ruleId: 'rule-1',
      date: '2026-09-02',
      mode: 'skip',
    }
    expect(upsertException([first], second)).toHaveLength(2)
  })
})

describe('하루 설정 (BR-18 · Q4-B)', () => {
  it('날짜마다 하나다. 같은 날짜는 덮어쓴다', () => {
    const first: DaySetting = {
      date: '2026-08-26',
      origin: emptyPlace('집'),
      destination: null,
    }
    const second: DaySetting = {
      date: '2026-08-26',
      origin: emptyPlace('사무실'),
      destination: null,
    }
    const result = upsertDaySetting([first], second)

    expect(result).toHaveLength(1)
    expect(result[0]?.origin.query).toBe('사무실')
  })

  it('다른 날짜에 영향을 주지 않는다', () => {
    const wed: DaySetting = {
      date: '2026-08-26',
      origin: emptyPlace('집'),
      destination: null,
    }
    const thu: DaySetting = {
      date: '2026-08-27',
      origin: emptyPlace('사무실'),
      destination: null,
    }
    const result = upsertDaySetting([wed], thu)

    expect(result).toHaveLength(2)
    expect(findDaySetting(result, '2026-08-26')?.origin.query).toBe('집')
  })

  it('새 날짜는 하루 설정이 비어 있다 (Q4-B)', () => {
    expect(findDaySetting([], '2026-08-26')).toBeNull()
  })
})

describe('참여자 찾기 (경계 3)', () => {
  it('그 일정에 딸린 참여자만 돌려준다', () => {
    const participants: readonly Participant[] = [
      { id: 'p1', scheduleId: 's1', name: '민수', place: emptyPlace('신촌'), travelMode: 'transit' },
      { id: 'p2', scheduleId: 's2', name: '영희', place: emptyPlace('홍대'), travelMode: 'walk' },
      { id: 'p3', scheduleId: 's1', name: '철수', place: emptyPlace('잠실'), travelMode: 'car' },
    ]
    expect(findParticipants(participants, 's1').map((p) => p.name)).toEqual(['민수', '철수'])
  })
})

describe('전체 삭제 (BR-44 · NFR-4.4)', () => {
  it('E-2~E-6 을 모두 지우고 E-7 을 기본값으로 되돌린다', () => {
    const store = memoryStore()
    saveSchedules(store, [makeSchedule()])
    saveRules(store, [makeRule()])
    saveParticipants(store, [
      { id: 'p1', scheduleId: 's1', name: '민수', place: emptyPlace('신촌'), travelMode: 'transit' },
    ])
    saveSettings(store, {
      ...DEFAULT_SETTINGS,
      user: { ...DEFAULT_SETTINGS.user, bufferMinutes: 30 },
    })

    clearEverything(store)

    const data = loadAll(store)
    expect(data.schedules).toEqual([])
    expect(data.rules).toEqual([])
    expect(data.participants).toEqual([])
    expect(data.settings).toEqual(DEFAULT_SETTINGS)
  })

  it('이 앱이 남긴 것만 지운다', () => {
    const store = memoryStore({ 'other-app:data': '남아야 한다' })
    saveSchedules(store, [makeSchedule()])

    clearEverything(store)

    expect(store.getItem('other-app:data')).toBe('남아야 한다')
  })
})

describe('꺼낼 수 없는 값 다루기', () => {
  it('read 는 값이 없으면 fallback 을 돌려준다', () => {
    const store = memoryStore()
    expect(read(store, STORAGE_KEYS.schedules, ['기본값'])).toEqual(['기본값'])
  })
})
