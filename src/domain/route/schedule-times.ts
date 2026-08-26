// 시각 계산 — RBR-8 ~ RBR-15
// 근거: route-planning/functional-design/business-logic-model.md 4단계
//
// 이 계산의 핵심은 두 가지다.
//   · 고정형의 도착 시각은 앱이 바꾸지 않는다 (RBR-2)
//   · 고정형에 일찍 닿아 기다리는 시간을 총 이동 시간에 넣지 않는다 (RBR-13)

import { minutesToTime, timeToMinutes, todayKey } from '../time'
import type { DateKey, TimeOfDay, TravelMode } from '../schedule/types'
import type { RouteLeg, RoutePoint, TravelTimeFreshness } from './types'

/** 구간을 만들기 전의 재료 */
export interface LegInput {
  readonly from: RoutePoint
  readonly to: RoutePoint
  readonly scheduleId: string | null
  readonly destinationLabel: string
  readonly mode: TravelMode
  readonly travelMinutes: number
  readonly freshness: TravelTimeFreshness
  readonly stayMinutes: number
  /** 고정형이면 사용자가 정한 도착 시각, 유연형이면 null */
  readonly fixedArrival: TimeOfDay | null
  readonly pinned: boolean
}

/**
 * RBR-8 하루의 첫 출발 시각을 정한다.
 *
 * 오늘이면 지금 시각, 앞날이면 설정의 하루 시작 시각.
 * 지난 날짜면 지금 시각을 쓰지 않는다 (RBR-15).
 */
export function decideDayStartMinutes(args: {
  readonly date: DateKey
  readonly now: Date
  readonly dayStartTime: TimeOfDay
}): number {
  const { date, now, dayStartTime } = args
  const today = todayKey(now)

  if (date === today) {
    return now.getHours() * 60 + now.getMinutes()
  }

  // 앞날이든 지난 날짜든 설정의 하루 시작 시각을 쓴다 (RBR-15)
  return timeToMinutes(dayStartTime)
}

export interface ScheduledLegs {
  readonly legs: readonly RouteLeg[]
  readonly dayStartMinutes: number
  readonly dayEndMinutes: number
  /** 기다린 시간을 넣지 않은 합 (RBR-13) */
  readonly totalTravelMinutes: number
}

/**
 * 구간마다 출발 · 도착 시각을 계산한다.
 *
 * 앞에서부터 이어 계산한다. 자정을 넘어도 분 단위로 계속 더하므로 어긋나지 않는다 (RBR-14).
 */
export function scheduleLegs(args: {
  readonly inputs: readonly LegInput[]
  readonly dayStartMinutes: number
}): ScheduledLegs {
  const { inputs, dayStartMinutes } = args

  const legs: RouteLeg[] = []
  let cursor = dayStartMinutes
  let totalTravel = 0

  // RBR-9 첫 일정이 고정형이면 그 도착 시각에서 거꾸로 계산한다.
  //        그 값이 하루 시작 시각보다 이르면 하루 시작 시각을 쓰지 않는다.
  const first = inputs[0]
  if (first?.fixedArrival != null) {
    const backward = timeToMinutes(first.fixedArrival) - first.travelMinutes
    if (backward < cursor) {
      cursor = backward
    }
  }

  for (const input of inputs) {
    let departMinutes: number
    let arriveMinutes: number
    let waitMinutes = 0

    if (input.fixedArrival !== null) {
      // RBR-2 고정형의 도착 시각은 그대로 쓴다
      arriveMinutes = alignToCursor(timeToMinutes(input.fixedArrival), cursor)
      // RBR-12 출발 시각 = 정해진 도착 시각 − 이동 시간
      departMinutes = arriveMinutes - input.travelMinutes

      // RBR-13 일찍 닿으면 그 자리에서 기다린다. 기다린 시간은 이동 시간에 넣지 않는다
      if (departMinutes > cursor) {
        waitMinutes = departMinutes - cursor
      }
    } else {
      // RBR-10 유연형의 도착 시각은 계산한다
      departMinutes = cursor
      arriveMinutes = departMinutes + input.travelMinutes
    }

    // RBR-11 앞 일정이 끝나는 시각 = 도착 시각 + 머무는 시간
    cursor = arriveMinutes + input.stayMinutes
    totalTravel += input.travelMinutes

    legs.push({
      from: input.from,
      to: input.to,
      scheduleId: input.scheduleId,
      destinationLabel: input.destinationLabel,
      mode: input.mode,
      travelMinutes: input.travelMinutes,
      freshness: input.freshness,
      departAt: minutesToTime(departMinutes),
      arriveAt: minutesToTime(arriveMinutes),
      stayMinutes: input.stayMinutes,
      waitMinutes,
      arrivalFixed: input.fixedArrival !== null,
      pinned: input.pinned,
      crossesMidnight: arriveMinutes >= 1440 || departMinutes >= 1440,
    })
  }

  return {
    legs,
    dayStartMinutes: legs.length > 0 ? timeToMinutes(legs[0]!.departAt) : dayStartMinutes,
    dayEndMinutes: cursor,
    totalTravelMinutes: totalTravel,
  }
}

/**
 * 고정형의 도착 시각이 지금 진행 중인 시각보다 앞서면 다음 날로 넘긴다.
 *
 * 밤 11시에 시작해 새벽 1시 일정으로 이어지는 경우다. 일정의 날짜는 바뀌지 않는다 (BR-49).
 */
function alignToCursor(arrivalMinutes: number, cursor: number): number {
  let value = arrivalMinutes
  while (value < cursor) {
    value += 1440
  }
  return value
}
