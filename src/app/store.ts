// 화면과 층 2 를 잇는 자리
// 근거: components.md (두 층 · Q2-A) · nfr-requirements.md U-NFR-4.2
//
// 화면은 여기에 "해달라"고만 한다. 계산식은 domain/ 에, 저장은 storage/ 에 있다.
// 이 파일은 둘을 잇기만 하고 스스로 계산하지 않는다.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { expandDay, expandedScheduleId } from '../domain/schedule/expand'
import type { ExpandedSchedule } from '../domain/schedule/expand'
import { normalizeArrivalTime, resolveTravelMode } from '../domain/schedule/rules'
import type { ScheduleDraft } from '../domain/schedule/rules'
import type {
  DateKey,
  DaySetting,
  Participant,
  Place,
  RecurringOverridePatch,
  RecurringRule,
  Schedule,
  ScheduleKind,
  TimeOfDay,
  TravelMode,
  Weekday,
} from '../domain/schedule/types'
import { emptyPlace } from '../domain/schedule/types'
import type { Settings, UserSettings } from '../domain/settings'
import { todayKey } from '../domain/time'
import { browserStore } from '../storage/localStore'
import type { KeyValueStore } from '../storage/localStore'
import {
  clearEverything,
  findDaySetting,
  findParticipants,
  loadAll,
  modifyRecurringOnDate,
  removeDirectSchedule,
  removeRecurringRule,
  saveDaySettings,
  saveExceptions,
  saveParticipants,
  saveRules,
  saveSchedules,
  saveSettings,
  skipRecurringOnDate,
  upsertDaySetting,
} from '../storage/repository'
import type { StoredData } from '../storage/repository'

/** 반복을 어떻게 지정했는지 — 화면에서 받는 값 */
export type RecurrenceInput =
  | { readonly enabled: false }
  | {
      readonly enabled: true
      readonly weekday: Weekday
      readonly startDate: DateKey
      readonly endDate: DateKey | null
    }

/** 일정을 넣거나 고칠 때 화면이 넘기는 것 전부 */
export interface ScheduleFormValue extends ScheduleDraft {
  readonly place: Place
  readonly isAppointment: boolean
  readonly recurrence: RecurrenceInput
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function useAppStore(store: KeyValueStore = browserStore()) {
  const [data, setData] = useState<StoredData>(() => loadAll(store))
  const [date, setDate] = useState<DateKey>(() => todayKey())
  /** 그 날짜의 계산 결과가 낡았는지 — BR-11 ~ BR-13. 보관되지 않는 화면 상태다 */
  const [staleDates, setStaleDates] = useState<ReadonlySet<DateKey>>(() => new Set())

  // 보관된 것이 바뀌면 남긴다
  useEffect(() => {
    saveSchedules(store, data.schedules)
    saveRules(store, data.rules)
    saveExceptions(store, data.exceptions)
    saveDaySettings(store, data.daySettings)
    saveParticipants(store, data.participants)
    saveSettings(store, data.settings)
  }, [store, data])

  const markStale = useCallback((target: DateKey) => {
    setStaleDates((previous) => new Set(previous).add(target))
  }, [])

  /** C-1 펼치기 — 계산은 domain 이 한다 */
  const schedules: readonly ExpandedSchedule[] = useMemo(
    () =>
      expandDay({
        date,
        directSchedules: data.schedules,
        rules: data.rules,
        exceptions: data.exceptions,
        settings: data.settings,
      }),
    [date, data.schedules, data.rules, data.exceptions, data.settings],
  )

  const daySetting = useMemo(
    () => findDaySetting(data.daySettings, date),
    [data.daySettings, date],
  )

  /** 일정을 넣는다. 반복을 켜면 반복 규칙이 되고, 일정은 따로 만들지 않는다 (BR-29) */
  const addSchedule = useCallback(
    (value: ScheduleFormValue) => {
      const kind: ScheduleKind = value.kind
      const arrivalTime = normalizeArrivalTime(kind, value.arrivalTime)
      const travelMode = resolveTravelMode(
        value.travelMode,
        data.settings.user.defaultTravelMode,
      )

      if (value.recurrence.enabled) {
        const rule: RecurringRule = {
          id: newId('rule'),
          weekday: value.recurrence.weekday,
          title: value.title.trim(),
          place: value.place,
          stayMinutes: value.stayMinutes,
          kind,
          arrivalTime,
          travelMode,
          isAppointment: value.isAppointment,
          startDate: value.recurrence.startDate,
          endDate: value.recurrence.endDate,
        }
        setData((previous) => ({ ...previous, rules: [...previous.rules, rule] }))
      } else {
        const schedule: Schedule = {
          id: newId('schedule'),
          date,
          title: value.title.trim(),
          place: value.place,
          stayMinutes: value.stayMinutes,
          kind,
          arrivalTime,
          travelMode,
          done: false,
          pinnedOrder: null,
          isAppointment: value.isAppointment,
          origin: { kind: 'direct' },
        }
        setData((previous) => ({
          ...previous,
          schedules: [...previous.schedules, schedule],
        }))
      }

      markStale(date)
    },
    [data.settings.user.defaultTravelMode, date, markStale],
  )

  /**
   * 일정을 고친다.
   *
   * 같은 조작이 `어디서 왔는지` 에 따라 두 갈래로 갈린다 (business-logic-model.md).
   *   직접 넣음      → 그 일정 자체를 고친다 (BR-41)
   *   반복에서 펼쳐짐 → `고침` 예외를 남긴다. 반복 규칙은 건드리지 않는다 (BR-35)
   */
  const updateSchedule = useCallback(
    (target: ExpandedSchedule, value: ScheduleFormValue) => {
      const kind: ScheduleKind = value.kind
      const arrivalTime = normalizeArrivalTime(kind, value.arrivalTime)
      const travelMode = resolveTravelMode(
        value.travelMode,
        data.settings.user.defaultTravelMode,
      )

      if (target.origin.kind === 'direct') {
        setData((previous) => ({
          ...previous,
          schedules: previous.schedules.map((schedule) =>
            schedule.id === target.id
              ? {
                  ...schedule,
                  title: value.title.trim(),
                  place: value.place,
                  stayMinutes: value.stayMinutes,
                  kind,
                  arrivalTime,
                  travelMode,
                  isAppointment: value.isAppointment,
                }
              : schedule,
          ),
        }))
      } else {
        const patch: RecurringOverridePatch = {
          title: value.title.trim(),
          place: value.place,
          stayMinutes: value.stayMinutes,
          kind,
          arrivalTime,
          travelMode,
          isAppointment: value.isAppointment,
        }
        setData((previous) =>
          modifyRecurringOnDate(previous, {
            ruleId: target.origin.kind === 'recurring' ? target.origin.ruleId : '',
            date,
            mode: 'modify',
            patch,
          }),
        )
      }

      markStale(date)
    },
    [data.settings.user.defaultTravelMode, date, markStale],
  )

  /**
   * 일정을 지운다. 두 갈래로 갈린다.
   *   직접 넣음      → 그 일정을 지운다. 딸린 참여자도 함께 (BR-10 · BR-41)
   *   반복에서 펼쳐짐 → `건너뜀` 예외를 남긴다 (BR-36 · BR-40)
   */
  const removeSchedule = useCallback(
    (target: ExpandedSchedule) => {
      if (target.origin.kind === 'direct') {
        setData((previous) => removeDirectSchedule(previous, target.id))
      } else {
        const ruleId = target.origin.ruleId
        setData((previous) => skipRecurringOnDate(previous, ruleId, date))
      }
      markStale(date)
    },
    [date, markStale],
  )

  /** 완료 표시 — 반복에서 온 것이면 `고침` 예외로 그 날짜에만 남는다 (BR-17) */
  const toggleDone = useCallback(
    (target: ExpandedSchedule) => {
      if (target.origin.kind === 'direct') {
        setData((previous) => ({
          ...previous,
          schedules: previous.schedules.map((schedule) =>
            schedule.id === target.id ? { ...schedule, done: !schedule.done } : schedule,
          ),
        }))
      } else {
        const ruleId = target.origin.ruleId
        setData((previous) =>
          modifyRecurringOnDate(previous, {
            ruleId,
            date,
            mode: 'modify',
            patch: { done: !target.done },
          }),
        )
      }
      markStale(date)
    },
    [date, markStale],
  )

  /** 반복 규칙 자체를 지운다 — 모든 날짜에서 사라진다 (BR-33) */
  const removeRule = useCallback(
    (ruleId: string) => {
      setData((previous) => removeRecurringRule(previous, ruleId))
      markStale(date)
    },
    [date, markStale],
  )

  /** 하루 설정 — 날짜마다 하나 (BR-18 · Q4-B) */
  const saveDaySetting = useCallback(
    (origin: Place, destination: Place | null) => {
      const next: DaySetting = { date, origin, destination }
      setData((previous) => ({
        ...previous,
        daySettings: upsertDaySetting(previous.daySettings, next),
      }))
      markStale(date)
    },
    [date, markStale],
  )

  const updateUserSettings = useCallback((next: UserSettings) => {
    setData((previous) => ({
      ...previous,
      settings: { ...previous.settings, user: next },
    }))
  }, [])

  /** BR-44 전체 삭제 */
  const clearAllData = useCallback(() => {
    clearEverything(store)
    setData(loadAll(store))
    setStaleDates(new Set())
  }, [store])

  /** 예시 일정을 넣는다 (Q3-C — 처음 열었을 때 넣는 단추) */
  const insertExamples = useCallback(() => {
    const today = date
    const exampleSchedules: readonly Schedule[] = [
      {
        id: newId('schedule'),
        date: today,
        title: '치과 진료',
        place: emptyPlace('서울 강남구 강남대로 396'),
        stayMinutes: 40,
        kind: 'fixed',
        arrivalTime: '14:00',
        travelMode: 'transit',
        done: false,
        pinnedOrder: null,
        isAppointment: false,
        origin: { kind: 'direct' },
      },
      {
        id: newId('schedule'),
        date: today,
        title: '장 보기',
        place: emptyPlace('서울 마포구 양화로 45'),
        stayMinutes: 30,
        kind: 'flexible',
        arrivalTime: null,
        travelMode: 'car',
        done: false,
        pinnedOrder: null,
        isAppointment: false,
        origin: { kind: 'direct' },
      },
      {
        id: newId('schedule'),
        date: today,
        title: '민수와 저녁 약속',
        place: emptyPlace(''),
        stayMinutes: 90,
        kind: 'fixed',
        arrivalTime: '19:00',
        travelMode: 'transit',
        done: false,
        pinnedOrder: null,
        isAppointment: true,
        origin: { kind: 'direct' },
      },
    ]

    const exampleRule: RecurringRule = {
      id: newId('rule'),
      weekday: new Date().getDay() as Weekday,
      title: '헬스장',
      place: emptyPlace('서울 용산구 이촌로'),
      stayMinutes: 60,
      kind: 'fixed',
      arrivalTime: '21:00',
      travelMode: 'walk',
      isAppointment: false,
      startDate: today,
      endDate: null,
    }

    const exampleDaySetting: DaySetting = {
      date: today,
      origin: emptyPlace('서울 서대문구 신촌로'),
      destination: emptyPlace('서울 서대문구 신촌로'),
    }

    setData((previous) => ({
      ...previous,
      schedules: [...previous.schedules, ...exampleSchedules],
      rules: [...previous.rules, exampleRule],
      daySettings: upsertDaySetting(previous.daySettings, exampleDaySetting),
    }))
    markStale(today)
  }, [date, markStale])

  const participantsOf = useCallback(
    (scheduleId: string): readonly Participant[] =>
      findParticipants(data.participants, scheduleId),
    [data.participants],
  )

  /** 반복 규칙을 찾는다 — 펼쳐진 일정을 고칠 때 원래 값을 보여주려면 필요하다 */
  const ruleOf = useCallback(
    (ruleId: string): RecurringRule | null =>
      data.rules.find((rule) => rule.id === ruleId) ?? null,
    [data.rules],
  )

  const isStale = staleDates.has(date)

  const isEmpty =
    data.schedules.length === 0 && data.rules.length === 0 && data.daySettings.length === 0

  return {
    date,
    setDate,
    schedules,
    daySetting,
    settings: data.settings,
    counts: {
      schedules: data.schedules.length,
      rules: data.rules.length,
      days: new Set(data.schedules.map((schedule) => schedule.date)).size,
      participants: data.participants.length,
    },
    isStale,
    isEmpty,
    addSchedule,
    updateSchedule,
    removeSchedule,
    toggleDone,
    removeRule,
    saveDaySetting,
    updateUserSettings,
    clearAllData,
    insertExamples,
    participantsOf,
    ruleOf,
  }
}

export type AppStore = ReturnType<typeof useAppStore>

export { expandedScheduleId }
export type { ExpandedSchedule, Settings, TimeOfDay, TravelMode }
