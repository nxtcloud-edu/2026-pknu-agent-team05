// C-1 일정 펼치기 — 이 단위의 핵심 계산
// 근거: aidlc-docs/construction/schedule-core/functional-design/business-logic-model.md
//
// 보관된 것은 세 갈래로 나뉘어 있다 (개별 일정 · 반복 규칙 · 예외 기록).
// 여기가 날짜 하나에 대해 합치는 자리다.
//
// 이 함수는 외부를 부르지 않는다. 그래서 외부 서비스나 브라우저 없이 테스트된다 (U-NFR-2.1).

import type { Settings } from '../settings'
import { compareDateKey, timeToMinutes, weekdayOf } from '../time'
import type {
  DateKey,
  RecurringException,
  RecurringRule,
  Schedule,
  TravelMode,
} from './types'

export interface ExpandInput {
  readonly date: DateKey
  /** 그 날짜에 직접 넣은 일정들 */
  readonly directSchedules: readonly Schedule[]
  /** 반복 규칙 전부 */
  readonly rules: readonly RecurringRule[]
  /** 예외 기록 전부 */
  readonly exceptions: readonly RecurringException[]
  readonly settings: Settings
}

/** 펼쳐진 일정. 동선 계산에서 빠질 것인지 표시가 붙는다 */
export interface ExpandedSchedule extends Schedule {
  /** BR-15 완료된 일정은 목록에 남지만 동선 계산에서 빠진다 */
  readonly excludedFromRoute: boolean
}

/**
 * 날짜 하나의 일정 목록을 만든다.
 *
 * 순서는 화면에 보여줄 순서다. **동선 순서가 아니다** — 그것은 route-planning 이 정한다 (FR-2.1).
 */
export function expandDay(input: ExpandInput): readonly ExpandedSchedule[] {
  const { date, directSchedules, rules, exceptions, settings } = input

  // 1. 그 날짜의 개별 일정을 모은다
  const collected: Schedule[] = directSchedules
    .filter((schedule) => schedule.date === date)
    .map((schedule) => ({ ...schedule }))

  // 2. 반복 규칙을 하나씩 본다
  const weekday = weekdayOf(date)

  for (const rule of rules) {
    // 2-1. 요일이 다르면 건너뛴다 — BR-27
    if (rule.weekday !== weekday) continue

    // 2-2. `언제부터` 보다 앞선 날짜면 건너뛴다 — BR-31
    if (compareDateKey(date, rule.startDate) < 0) continue

    // 2-3. `언제까지` 를 지났으면 건너뛴다 — BR-32
    if (rule.endDate !== null && compareDateKey(date, rule.endDate) > 0) continue

    // 2-4. 예외 기록을 본다
    const exception = findException(exceptions, rule.id, date)

    // `건너뜀` 이면 펼치지 않는다 — BR-37
    if (exception?.mode === 'skip') continue

    // 규칙의 값으로 일정을 만들고, `고침` 이면 그 위에 덮는다 — BR-34 · BR-38
    collected.push(materializeRule(rule, date, exception))
  }

  // 3. 이동 수단이 비어 있는 일정에 설정의 기본값을 채운다 — BR-8
  const withDefaults = collected.map((schedule) => ({
    ...schedule,
    travelMode: fillTravelMode(schedule.travelMode, settings.user.defaultTravelMode),
  }))

  // 4. 완료 표시된 일정에 `동선 계산에서 빠질 것` 을 표시한다 — BR-15
  const expanded: ExpandedSchedule[] = withDefaults.map((schedule) => ({
    ...schedule,
    excludedFromRoute: schedule.done,
  }))

  // 5. 화면에 보여줄 순서로 늘어놓는다
  return sortForDisplay(expanded)
}

/** ruleId + date 조합의 예외를 찾는다. 조합은 하나뿐이다 — BR-39 */
function findException(
  exceptions: readonly RecurringException[],
  ruleId: string,
  date: DateKey,
): RecurringException | undefined {
  return exceptions.find(
    (exception) => exception.ruleId === ruleId && exception.date === date,
  )
}

/**
 * 반복 규칙을 그 날짜의 일정으로 펼친다.
 *
 * `고침` 예외가 있으면 바뀐 값만 덮고, 나머지는 규칙의 값을 쓴다 — BR-38
 */
function materializeRule(
  rule: RecurringRule,
  date: DateKey,
  exception: RecurringException | undefined,
): Schedule {
  const patch = exception?.mode === 'modify' ? exception.patch : undefined

  const kind = patch?.kind ?? rule.kind
  // BR-5 유연형이면 도착 시각을 비운다. 예외로 유형이 바뀐 경우에도 지킨다.
  const rawArrival =
    patch !== undefined && 'arrivalTime' in patch ? patch.arrivalTime : rule.arrivalTime
  const arrivalTime = kind === 'flexible' ? null : (rawArrival ?? null)

  return {
    // 펼쳐진 일정의 가리키는 이름은 규칙과 날짜로 정해진다. 보관되지 않으므로 매번 같아야 한다.
    id: expandedScheduleId(rule.id, date),
    date,
    title: patch?.title ?? rule.title,
    place: patch?.place ?? rule.place,
    stayMinutes: patch?.stayMinutes ?? rule.stayMinutes,
    kind,
    arrivalTime,
    travelMode: patch?.travelMode ?? rule.travelMode,
    done: patch?.done ?? false,
    pinnedOrder: patch?.pinnedOrder ?? null,
    isAppointment: patch?.isAppointment ?? rule.isAppointment,
    origin: { kind: 'recurring', ruleId: rule.id },
  }
}

/**
 * 펼쳐진 일정을 가리키는 이름.
 *
 * 보관되지 않으므로 규칙 아이디와 날짜에서 매번 똑같이 만들어야 한다.
 * 그래야 화면에서 고르고 예외를 남기는 일이 이어진다.
 */
export function expandedScheduleId(ruleId: string, date: DateKey): string {
  return `recurring:${ruleId}:${date}`
}

/** BR-8 이동 수단이 비어 있으면 기본값을 채운다 */
function fillTravelMode(
  mode: TravelMode | null | undefined,
  defaultMode: TravelMode,
): TravelMode {
  return mode ?? defaultMode
}

/**
 * 화면에 보여줄 순서.
 *
 * 시각이 정해진 일정을 먼저 (이른 것부터), 그 뒤에 유연형을 넣은 순서대로.
 * 시각이 정해진 것을 먼저 보여주면 하루의 뼈대가 눈에 들어온다.
 */
function sortForDisplay(
  schedules: readonly ExpandedSchedule[],
): readonly ExpandedSchedule[] {
  const fixed = schedules
    .filter((schedule) => schedule.arrivalTime !== null)
    .sort((a, b) => timeToMinutes(a.arrivalTime!) - timeToMinutes(b.arrivalTime!))

  const flexible = schedules.filter((schedule) => schedule.arrivalTime === null)

  return [...fixed, ...flexible]
}
