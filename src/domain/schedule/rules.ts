// 규칙 검사 — BR-1 ~ BR-8 · BR-30
// 근거: aidlc-docs/construction/schedule-core/functional-design/business-rules.md
//
// 저장하기 전에 이 검사를 지나야 한다. 걸리면 저장하지 않고 어느 칸이 왜 잘못됐는지 알린다 (S-1).

import { STAY_MINUTES_MAX, STAY_MINUTES_MIN } from '../settings'
import { isValidTime } from '../time'
import type { RecurringRule, Schedule, ScheduleKind, TimeOfDay, TravelMode } from './types'
import { TRAVEL_MODES } from './types'

/** 어느 칸이 잘못됐는지 */
export type ScheduleField =
  | 'title'
  | 'place'
  | 'stayMinutes'
  | 'arrivalTime'
  | 'travelMode'
  | 'startDate'
  | 'endDate'
  | 'weekday'

export interface RuleViolation {
  readonly field: ScheduleField
  /** 어긴 규칙 번호. 테스트가 이것으로 가리킨다 */
  readonly rule: string
  readonly message: string
}

/** 일정을 넣거나 고칠 때 사용자가 채우는 값 */
export interface ScheduleDraft {
  readonly title: string
  readonly placeQuery: string
  readonly stayMinutes: number
  readonly kind: ScheduleKind
  readonly arrivalTime: TimeOfDay | null
  readonly travelMode: TravelMode | null
}

/**
 * BR-1 ~ BR-8 검사.
 *
 * 어긴 것을 모두 모아 돌려준다. 하나만 알리면 사용자가 여러 번 고쳐야 한다.
 */
export function validateScheduleDraft(draft: ScheduleDraft): readonly RuleViolation[] {
  const violations: RuleViolation[] = []

  // BR-1 제목이 비어 있으면 저장하지 않는다
  if (draft.title.trim() === '') {
    violations.push({
      field: 'title',
      rule: 'BR-1',
      message: '제목을 넣어주세요.',
    })
  }

  // BR-2 장소에 사용자가 넣은 글자가 비어 있으면 저장하지 않는다
  if (draft.placeQuery.trim() === '') {
    violations.push({
      field: 'place',
      rule: 'BR-2',
      message: '장소를 넣어주세요.',
    })
  }

  // BR-3 머무는 시간은 0보다 커야 한다
  if (!Number.isInteger(draft.stayMinutes) || draft.stayMinutes < STAY_MINUTES_MIN) {
    violations.push({
      field: 'stayMinutes',
      rule: 'BR-3',
      message: `머무는 시간을 ${STAY_MINUTES_MIN}분 이상으로 넣어주세요.`,
    })
  } else if (draft.stayMinutes > STAY_MINUTES_MAX) {
    violations.push({
      field: 'stayMinutes',
      rule: 'BR-3',
      message: '머무는 시간이 하루를 넘습니다.',
    })
  }

  // BR-4 고정형이면 지정한 도착 시각이 있어야 한다
  if (draft.kind === 'fixed') {
    if (draft.arrivalTime === null || draft.arrivalTime.trim() === '') {
      violations.push({
        field: 'arrivalTime',
        rule: 'BR-4',
        message: '시간 고정형 일정에는 도착 시각이 필요합니다.',
      })
    } else if (!isValidTime(draft.arrivalTime)) {
      violations.push({
        field: 'arrivalTime',
        rule: 'BR-4',
        message: '도착 시각을 HH:MM 형식으로 넣어주세요.',
      })
    }
  }

  // BR-8 이동 수단이 잘못된 값이면 걸러낸다.
  //      고르지 않은 것(null)은 잘못이 아니다 — 기본값이 채워진다.
  if (draft.travelMode !== null && !TRAVEL_MODES.includes(draft.travelMode)) {
    violations.push({
      field: 'travelMode',
      rule: 'BR-8',
      message: '이동 수단을 골라주세요.',
    })
  }

  return violations
}

/**
 * BR-5 유연형이면 지정한 도착 시각을 비운다. 값이 들어와도 무시한다.
 * BR-6 고정형 → 유연형 으로 바꾸면 도착 시각을 지운다.
 */
export function normalizeArrivalTime(
  kind: ScheduleKind,
  arrivalTime: TimeOfDay | null,
): TimeOfDay | null {
  if (kind === 'flexible') return null
  return arrivalTime
}

/** BR-8 이동 수단을 고르지 않았으면 기본값을 채운다 */
export function resolveTravelMode(
  chosen: TravelMode | null,
  defaultMode: TravelMode,
): TravelMode {
  return chosen ?? defaultMode
}

/** BR-30 반복 규칙에 담기는 값은 일정과 같은 규칙을 따른다 */
export function validateRecurringDraft(
  draft: ScheduleDraft & { readonly startDate: string; readonly endDate: string | null },
): readonly RuleViolation[] {
  const violations = [...validateScheduleDraft(draft)]

  if (draft.endDate !== null && draft.endDate !== '' && draft.endDate < draft.startDate) {
    violations.push({
      field: 'endDate',
      rule: 'BR-30',
      message: '끝나는 날짜가 시작 날짜보다 앞섭니다.',
    })
  }

  return violations
}

/**
 * BR-11 ~ BR-14 · 이 값이 바뀌면 그 날짜의 계산 결과가 낡는다.
 *
 * BR-14 제목만 바뀌면 다시 계산하지 않는다. 이동 시간에 영향이 없다.
 */
export function affectsRouteCalculation(before: Schedule, after: Schedule): boolean {
  return (
    before.place.query !== after.place.query ||
    before.place.coord?.lat !== after.place.coord?.lat ||
    before.place.coord?.lng !== after.place.coord?.lng ||
    before.stayMinutes !== after.stayMinutes ||
    before.kind !== after.kind ||
    before.arrivalTime !== after.arrivalTime ||
    before.travelMode !== after.travelMode ||
    before.done !== after.done ||
    before.pinnedOrder !== after.pinnedOrder
  )
}

/**
 * BR-24 사용자가 넣은 글자가 바뀌면 좌표와 확정된 이름을 지운다. 다시 변환돼야 한다.
 */
export function placeAfterQueryChange(
  previousQuery: string,
  nextQuery: string,
  currentPlace: RecurringRule['place'],
): RecurringRule['place'] {
  if (previousQuery === nextQuery) return currentPlace
  return { query: nextQuery, resolvedName: null, coord: null, coordAt: null }
}
