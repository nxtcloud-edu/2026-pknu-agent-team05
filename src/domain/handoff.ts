// 경계 1 — schedule-core → route-planning
// 근거: aidlc-docs/inception/application-design/unit-of-work.md 경계 1
//
// route-planning 을 만들 때 schedule-core 의 코드를 다시 읽지 않아도 되게 한다 (Q2-A).
//
// ── route-planning STEP 05 에서 고친 것 (unit-of-work.md Q4-C · 그 자리에서 고침) ──
// Q4-A 로 "좌표 없는 일정은 빼고 나머지로 계산한다" 가 정해졌다.
// 그래서 `missing-coords` 를 계산 막힘에서 뺐다. 이제 좌표가 없어도 계산은 진행되고,
// 빠진 일정은 RoutePlan.excluded 에 담겨 화면에 알려진다 (RBR-21 · RBR-22).
// 좌표 정책은 route-planning 이 정한다고 schedule-core BR-21 에 적혀 있어 예정된 자리다.

import type { ExpandedSchedule } from './schedule/expand'
import type { DaySetting, TravelMode } from './schedule/types'
import type { Settings } from './settings'

/** route-planning 이 받는 것 전부 */
export interface RoutePlanningInput {
  readonly date: string
  /** C-1 이 펼친 목록. 반복과 예외가 이미 합쳐진 상태다 */
  readonly schedules: readonly ExpandedSchedule[]
  /** 하루의 출발지 · 마지막 도착지. 없으면 계산할 수 없다 — BR-19 */
  readonly daySetting: DaySetting | null
  readonly defaultTravelMode: TravelMode
  /** 같은 구간을 다시 묻지 않는 기간 (분) — NFR-1.3 */
  readonly travelTimeCacheMinutes: number
}

/**
 * 경계 1 로 넘길 것을 모은다.
 *
 * 이 단위가 하는 것 — 반복과 예외를 합치고, 이동 수단 기본값을 채우고,
 *                    완료된 것을 `빠질 것` 으로 표시한다.
 * 이 단위가 하지 않는 것 — 순서 정하기 · 이동 시간 구하기 · 좌표 채우기 (BR-21)
 *                          · 완료된 것을 걸러내기 (route-planning 이 한다)
 */
export function buildRoutePlanningInput(args: {
  readonly date: string
  readonly schedules: readonly ExpandedSchedule[]
  readonly daySetting: DaySetting | null
  readonly settings: Settings
}): RoutePlanningInput {
  return {
    date: args.date,
    schedules: args.schedules,
    daySetting: args.daySetting,
    defaultTravelMode: args.settings.user.defaultTravelMode,
    travelTimeCacheMinutes: args.settings.system.travelTimeCacheMinutes,
  }
}

/**
 * 동선을 계산할 수 있는 상태인지 본다.
 *
 * 좌표가 없는 일정은 **막힘이 아니다.** 빼고 계산한다 (Q4-A · RBR-21).
 * 몇 개가 빠질지만 알려서 화면이 미리 안내할 수 있게 한다.
 */
export type RouteReadiness =
  | { readonly ready: true; readonly willExclude: readonly string[] }
  | { readonly ready: false; readonly reason: RouteBlockReason }

export type RouteBlockReason =
  | { readonly kind: 'no-day-setting' }
  | { readonly kind: 'no-schedules' }
  /** 좌표가 없어 뺀 결과 계산할 일정이 하나도 남지 않았다 (RBR-26) */
  | { readonly kind: 'all-excluded'; readonly titles: readonly string[] }

export function checkRouteReadiness(input: RoutePlanningInput): RouteReadiness {
  // BR-19 출발지가 없으면 계산할 수 없다
  if (input.daySetting === null || input.daySetting.origin.coord === null) {
    return { ready: false, reason: { kind: 'no-day-setting' } }
  }

  const active = input.schedules.filter((schedule) => !schedule.excludedFromRoute)

  if (active.length === 0) {
    return { ready: false, reason: { kind: 'no-schedules' } }
  }

  // Q4-A 좌표가 없는 일정은 빠지지만 계산은 막지 않는다
  const willExclude = active
    .filter((schedule) => schedule.place.coord === null)
    .map((schedule) => schedule.title)

  // RBR-26 다 빠지면 계산할 것이 없다
  if (willExclude.length === active.length) {
    return { ready: false, reason: { kind: 'all-excluded', titles: willExclude } }
  }

  return { ready: true, willExclude }
}
