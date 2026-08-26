// 경계 1 — schedule-core → route-planning
// 근거: aidlc-docs/inception/application-design/unit-of-work.md 경계 1
//
// 이 단위가 route-planning 에 넘기는 것의 모양을 여기 한 군데에 모은다.
// route-planning 을 만들 때 이 단위의 코드를 다시 읽지 않아도 되게 한다 (Q2-A).

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
 * route-planning 이 서기 전에도 화면이 왜 계산할 수 없는지 알려야 한다 (BR-19 · BR-22).
 */
export type RouteReadiness =
  | { readonly ready: true }
  | { readonly ready: false; readonly reason: RouteBlockReason }

export type RouteBlockReason =
  | { readonly kind: 'no-day-setting' }
  | { readonly kind: 'no-schedules' }
  | { readonly kind: 'missing-coords'; readonly titles: readonly string[] }

export function checkRouteReadiness(input: RoutePlanningInput): RouteReadiness {
  // BR-19 출발지가 없으면 계산할 수 없다
  if (input.daySetting === null || input.daySetting.origin.coord === null) {
    return { ready: false, reason: { kind: 'no-day-setting' } }
  }

  const active = input.schedules.filter((schedule) => !schedule.excludedFromRoute)

  if (active.length === 0) {
    return { ready: false, reason: { kind: 'no-schedules' } }
  }

  // BR-21 좌표는 route-planning 이 채운다. 아직 없는 것이 있으면 알린다
  const missing = active
    .filter((schedule) => schedule.place.coord === null)
    .map((schedule) => schedule.title)

  if (missing.length > 0) {
    return { ready: false, reason: { kind: 'missing-coords', titles: missing } }
  }

  return { ready: true }
}
