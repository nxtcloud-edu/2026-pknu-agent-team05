// C-2 동선 계산 — 이 단위의 핵심 계산
// 근거: route-planning/functional-design/business-logic-model.md 의 6단계
//
// 이 함수는 외부를 직접 부르지 않는다. 이동 시간을 물어볼 수단과 지금 시각을 인자로 받는다.
// 그래서 대역을 넣으면 외부 서비스 없이 전부 검증된다 (R-NFR-3.1 · R-NFR-3.3).

import type { ExpandedSchedule } from '../schedule/expand'
import type { Coord, DateKey, DaySetting } from '../schedule/types'
import type { Settings } from '../settings'
import { minutesToTime } from '../time'
import { findInfeasibleArrivals } from './feasibility'
import { decideOrder } from './order'
import type { OrderableSchedule } from './order'
import { decideDayStartMinutes, scheduleLegs } from './schedule-times'
import type { LegInput } from './schedule-times'
import type {
  ExcludedSchedule,
  RouteLeg,
  RoutePlanResult,
  RoutePoint,
  TravelTimeFreshness,
  TravelTimeLookup,
} from './types'

export interface PlanRouteInput {
  readonly date: DateKey
  readonly schedules: readonly ExpandedSchedule[]
  readonly daySetting: DaySetting | null
  readonly settings: Settings
  readonly lookup: TravelTimeLookup
  /** 밖에서 주입한다. RBR-8 이 지금 시각에 매달려 있다 */
  readonly now: Date
}

export async function planRoute(input: PlanRouteInput): Promise<RoutePlanResult> {
  const { date, schedules, daySetting, settings, lookup, now } = input

  // ── 1. 계산할 일정을 고른다 ────────────────────────────────

  // RBR-23 하루 출발지에 좌표가 없으면 계산하지 않는다
  const originCoord = daySetting?.origin.coord ?? null
  if (daySetting === null || originCoord === null) {
    return { kind: 'blocked', block: { kind: 'no-origin' } }
  }

  // RBR-7 완료 표시된 일정을 뺀다
  const active = schedules.filter((schedule) => !schedule.excludedFromRoute)

  // RBR-21 좌표가 없는 일정을 뺀다. 빠진 목록에 담는다
  const excluded: ExcludedSchedule[] = []
  const orderable: OrderableSchedule[] = []

  for (const schedule of active) {
    if (schedule.place.coord === null) {
      excluded.push({
        scheduleId: schedule.id,
        title: schedule.title,
        reason: schedule.place.query.trim() === '' ? 'empty-query' : 'no-coord',
        // RBR-25 고정형이 빠지면 도착 불가 판정도 사라진다. 더 눈에 띄게 알린다
        wasFixed: schedule.kind === 'fixed',
      })
      continue
    }

    orderable.push({
      id: schedule.id,
      title: schedule.title,
      coord: schedule.place.coord,
      mode: schedule.travelMode,
      stayMinutes: schedule.stayMinutes,
      arrivalTime: schedule.arrivalTime,
      pinnedOrder: schedule.pinnedOrder,
    })
  }

  // RBR-26 남은 일정이 없으면 그 사실을 알린다
  if (orderable.length === 0) {
    return { kind: 'blocked', block: { kind: 'no-schedules', excluded } }
  }

  // ── 2. 순서를 정한다 ──────────────────────────────────────
  const ordered = await decideOrder({
    schedules: orderable,
    startCoord: originCoord,
    lookup,
  })

  // ── 3. 구간마다 이동 시간을 받는다 ─────────────────────────
  const originPoint: RoutePoint = {
    label: daySetting.origin.resolvedName ?? daySetting.origin.query,
    coord: originCoord,
  }

  const inputs: LegInput[] = []
  let cursor: RoutePoint = originPoint

  for (const schedule of ordered) {
    const travel = await lookup(cursor.coord, schedule.coord, schedule.mode)

    // RBR-32 옛 값도 없이 외부가 실패했다
    if (travel === null) {
      return {
        kind: 'blocked',
        block: {
          kind: 'travel-time-unavailable',
          legLabel: `${cursor.label} → ${schedule.title}`,
        },
      }
    }

    const to: RoutePoint = { label: schedule.title, coord: schedule.coord }

    inputs.push({
      from: cursor,
      to,
      scheduleId: schedule.id,
      destinationLabel: schedule.title,
      mode: schedule.mode,
      travelMinutes: travel.minutes,
      freshness: travel.freshness,
      stayMinutes: schedule.stayMinutes,
      fixedArrival: schedule.arrivalTime,
      pinned: schedule.pinnedOrder !== null,
    })

    cursor = to
  }

  // RBR-24 마지막 도착지. 좌표가 없으면 그 구간만 뺀다
  const destinationCoord = daySetting.destination?.coord ?? null
  if (daySetting.destination !== null && destinationCoord !== null) {
    const travel = await lookup(
      cursor.coord,
      destinationCoord,
      settings.user.defaultTravelMode,
    )

    if (travel !== null) {
      const to: RoutePoint = {
        label: daySetting.destination.resolvedName ?? daySetting.destination.query,
        coord: destinationCoord,
      }

      inputs.push({
        from: cursor,
        to,
        scheduleId: null,
        destinationLabel: to.label,
        mode: settings.user.defaultTravelMode,
        travelMinutes: travel.minutes,
        freshness: travel.freshness,
        stayMinutes: 0,
        fixedArrival: null,
        pinned: false,
      })
    }
    // 마지막 구간의 이동 시간을 못 얻으면 그 구간만 빼고 마무리한다 (RBR-24)
  }

  // ── 4~5. 시각을 계산하고 도착 불가를 본다 ───────────────────
  const dayStartMinutes = decideDayStartMinutes({
    date,
    now,
    dayStartTime: settings.user.dayStartTime,
  })

  const problems = findInfeasibleArrivals({ inputs, dayStartMinutes })

  // RBR-17 도착 불가가 하나라도 있으면 순서를 주지 않는다
  if (problems.length > 0) {
    return { kind: 'infeasible', problems, excluded }
  }

  const scheduled = scheduleLegs({ inputs, dayStartMinutes })

  // ── 6. 결과를 낸다 ────────────────────────────────────────
  return {
    kind: 'plan',
    plan: {
      date,
      order: ordered.map((schedule) => schedule.id),
      legs: scheduled.legs,
      // RBR-13 기다린 시간은 넣지 않는다
      totalTravelMinutes: scheduled.totalTravelMinutes,
      dayStartAt: minutesToTime(scheduled.dayStartMinutes),
      dayEndAt: minutesToTime(scheduled.dayEndMinutes),
      excluded,
      hasStaleTravelTime: hasFreshness(scheduled.legs, 'stale'),
      hasEstimatedTravelTime: hasFreshness(scheduled.legs, 'estimated'),
      orderingMethod: 'nearest-neighbor',
    },
  }
}

function hasFreshness(
  legs: readonly RouteLeg[],
  freshness: TravelTimeFreshness,
): boolean {
  return legs.some((leg) => leg.freshness === freshness)
}

/** 손으로 순서를 옮긴다 — RBR-42. 옮긴 자리를 고정한다 */
export function moveScheduleInOrder(
  order: readonly string[],
  scheduleId: string,
  direction: 'up' | 'down',
): readonly { readonly scheduleId: string; readonly pinnedOrder: number }[] {
  const index = order.indexOf(scheduleId)
  if (index === -1) return []

  const target = direction === 'up' ? index - 1 : index + 1
  if (target < 0 || target >= order.length) return []

  const next = [...order]
  const moved = next[index]!
  next[index] = next[target]!
  next[target] = moved

  // 옮긴 둘만 고정한다. 나머지는 앱이 다시 정한다
  return [
    { scheduleId: next[index]!, pinnedOrder: index },
    { scheduleId: next[target]!, pinnedOrder: target },
  ]
}

/** 좌표가 같은지 견준다 — 순서 계산에서 같은 자리를 걸러낼 때 */
export function sameCoord(a: Coord, b: Coord): boolean {
  return a.lat === b.lat && a.lng === b.lng
}
