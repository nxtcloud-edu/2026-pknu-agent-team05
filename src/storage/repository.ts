// C-5 보관소 · E-2 ~ E-7 을 꺼내고 남기는 자리
// 근거: business-logic-model.md (C-5 남기는 시점 · 꺼내는 시점) · business-rules.md BR-10 · BR-33 · BR-41 · BR-44
//
// localStorage 를 직접 부르지 않는다. localStore.ts 를 통해서만 닿는다 (U-NFR-4.3).

import type { Settings } from '../domain/settings'
import { DEFAULT_SETTINGS } from '../domain/settings'
import type {
  DateKey,
  DaySetting,
  Participant,
  RecurringException,
  RecurringRule,
  Schedule,
} from '../domain/schedule/types'
import type { KeyValueStore } from './localStore'
import { STORAGE_KEYS, clearAll, read, write } from './localStore'

/** 보관된 것 전부. 한 번에 꺼내 C-1 에 넘긴다 */
export interface StoredData {
  readonly schedules: readonly Schedule[]
  readonly rules: readonly RecurringRule[]
  readonly exceptions: readonly RecurringException[]
  readonly daySettings: readonly DaySetting[]
  readonly participants: readonly Participant[]
  readonly settings: Settings
}

export function loadAll(store: KeyValueStore): StoredData {
  return {
    schedules: read<readonly Schedule[]>(store, STORAGE_KEYS.schedules, []),
    rules: read<readonly RecurringRule[]>(store, STORAGE_KEYS.recurringRules, []),
    exceptions: read<readonly RecurringException[]>(
      store,
      STORAGE_KEYS.recurringExceptions,
      [],
    ),
    daySettings: read<readonly DaySetting[]>(store, STORAGE_KEYS.daySettings, []),
    participants: read<readonly Participant[]>(store, STORAGE_KEYS.participants, []),
    settings: read<Settings>(store, STORAGE_KEYS.settings, DEFAULT_SETTINGS),
  }
}

export function saveSchedules(store: KeyValueStore, value: readonly Schedule[]): void {
  write(store, STORAGE_KEYS.schedules, value)
}

export function saveRules(store: KeyValueStore, value: readonly RecurringRule[]): void {
  write(store, STORAGE_KEYS.recurringRules, value)
}

export function saveExceptions(
  store: KeyValueStore,
  value: readonly RecurringException[],
): void {
  write(store, STORAGE_KEYS.recurringExceptions, value)
}

export function saveDaySettings(store: KeyValueStore, value: readonly DaySetting[]): void {
  write(store, STORAGE_KEYS.daySettings, value)
}

export function saveParticipants(
  store: KeyValueStore,
  value: readonly Participant[],
): void {
  write(store, STORAGE_KEYS.participants, value)
}

export function saveSettings(store: KeyValueStore, value: Settings): void {
  write(store, STORAGE_KEYS.settings, value)
}

/** BR-44 전체 삭제 — E-2~E-6 을 지우고 E-7 을 기본값으로 되돌린다 */
export function clearEverything(store: KeyValueStore): void {
  clearAll(store)
}

// ─────────────────────────────────────────────────────────────
// 함께 지우기 — BR-10 · BR-33 · BR-41
// 지우는 일이 한 갈래로 끝나지 않는 대목이라 계산으로 떼어 둔다.
// ─────────────────────────────────────────────────────────────

/**
 * BR-41 직접 넣은 일정을 지운다. 예외를 남기지 않는다.
 * BR-10 그 일정에 딸린 참여자도 함께 지운다.
 */
export function removeDirectSchedule(
  data: StoredData,
  scheduleId: string,
): StoredData {
  return {
    ...data,
    schedules: data.schedules.filter((schedule) => schedule.id !== scheduleId),
    participants: data.participants.filter(
      (participant) => participant.scheduleId !== scheduleId,
    ),
  }
}

/**
 * BR-33 반복 규칙을 지운다. 딸린 예외 기록도 함께 지운다.
 */
export function removeRecurringRule(data: StoredData, ruleId: string): StoredData {
  return {
    ...data,
    rules: data.rules.filter((rule) => rule.id !== ruleId),
    exceptions: data.exceptions.filter((exception) => exception.ruleId !== ruleId),
  }
}

/**
 * BR-36 · BR-40 반복에서 펼쳐진 일정을 그 날짜에만 건너뛴다.
 *
 * 지우는 것이 아니라 `건너뜀` 예외를 남기는 것이다.
 */
export function skipRecurringOnDate(
  data: StoredData,
  ruleId: string,
  date: DateKey,
): StoredData {
  const exception: RecurringException = { ruleId, date, mode: 'skip' }
  return { ...data, exceptions: upsertException(data.exceptions, exception) }
}

/**
 * BR-35 · BR-38 반복에서 펼쳐진 일정을 그 날짜에만 고친다.
 *
 * 반복 규칙은 건드리지 않는다.
 */
export function modifyRecurringOnDate(
  data: StoredData,
  exception: Extract<RecurringException, { mode: 'modify' }>,
): StoredData {
  return { ...data, exceptions: upsertException(data.exceptions, exception) }
}

/**
 * BR-39 같은 반복 규칙 + 같은 날짜에 예외는 하나뿐이다. 이미 있으면 덮어쓴다.
 */
export function upsertException(
  exceptions: readonly RecurringException[],
  next: RecurringException,
): readonly RecurringException[] {
  const rest = exceptions.filter(
    (exception) => !(exception.ruleId === next.ruleId && exception.date === next.date),
  )
  return [...rest, next]
}

/** BR-18 하루 설정은 날짜마다 하나다. 같은 날짜가 있으면 덮어쓴다 */
export function upsertDaySetting(
  daySettings: readonly DaySetting[],
  next: DaySetting,
): readonly DaySetting[] {
  const rest = daySettings.filter((setting) => setting.date !== next.date)
  return [...rest, next]
}

/** 그 날짜의 하루 설정을 찾는다. 없으면 null (새 날짜는 비어 있다 — Q4-B) */
export function findDaySetting(
  daySettings: readonly DaySetting[],
  date: DateKey,
): DaySetting | null {
  return daySettings.find((setting) => setting.date === date) ?? null
}

/** 그 일정에 딸린 참여자 — 경계 3 (meetup-midpoint 가 쓴다) */
export function findParticipants(
  participants: readonly Participant[],
  scheduleId: string,
): readonly Participant[] {
  return participants.filter((participant) => participant.scheduleId === scheduleId)
}
