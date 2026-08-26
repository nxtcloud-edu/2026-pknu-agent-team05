// 순서 정하기 — RBR-1 ~ RBR-7
// 근거: route-planning/functional-design/business-logic-model.md 2단계
//
// Q1-B 를 골랐으므로 순서가 두 덩어리로 나뉜다.
//   [ 고정형 — 시각 순서대로 ]  →  [ 유연형 — 가까운 곳부터 ]
// 앞 덩어리는 정렬만 하면 끝이고, 뒷 덩어리만 순서를 궁리한다.

import { timeToMinutes } from '../time'
import type { Coord, TravelMode } from '../schedule/types'
import type { TravelTimeLookup } from './types'

/** 순서를 정할 대상. 필요한 값만 뽑아 쓴다 */
export interface OrderableSchedule {
  readonly id: string
  readonly title: string
  readonly coord: Coord
  readonly mode: TravelMode
  readonly stayMinutes: number
  /** 고정형이면 도착 시각, 유연형이면 null */
  readonly arrivalTime: string | null
  /** 사용자가 손으로 고정한 자리 (RBR-6) */
  readonly pinnedOrder: number | null
}

/**
 * 순서를 정한다.
 *
 * 이동 시간을 물어봐야 하므로 비동기다. `lookup` 을 인자로 받으므로 외부 없이 테스트된다.
 */
export async function decideOrder(args: {
  readonly schedules: readonly OrderableSchedule[]
  readonly startCoord: Coord
  readonly lookup: TravelTimeLookup
}): Promise<readonly OrderableSchedule[]> {
  const { schedules, startCoord, lookup } = args

  // RBR-1 고정형은 도착 시각이 이른 것부터. 이 순서를 앱이 바꾸지 않는다
  const fixed = schedules
    .filter((schedule) => schedule.arrivalTime !== null)
    .sort((a, b) => timeToMinutes(a.arrivalTime!) - timeToMinutes(b.arrivalTime!))

  const flexible = schedules.filter((schedule) => schedule.arrivalTime === null)

  // RBR-3 유연형은 고정형 사이에 끼우지 않는다. 모든 고정형이 끝난 뒤에 놓는다
  // 유연형이 시작하는 곳은 마지막 고정형의 장소. 고정형이 없으면 하루 출발지 (RBR-4)
  const flexibleStart = fixed.at(-1)?.coord ?? startCoord

  const orderedFlexible = await orderNearestNeighbor(flexible, flexibleStart, lookup)

  // RBR-6 손으로 고정한 자리를 되살린다
  return applyPinnedOrder([...fixed, ...orderedFlexible])
}

/**
 * RBR-5 가까운 곳부터 이어 붙인다.
 *
 * 지금 있는 곳에서 이동 시간이 가장 짧은 곳을 다음으로 고르고, 그것을 되풀이한다.
 *
 * **가장 짧은 순서를 보장하지 않는다.** FR-2.2 는 목표로 남고 보장은 하지 않는다 (Q2-C).
 * 사용자가 더 나은 순서를 알면 손으로 옮길 수 있다 (RBR-42).
 */
async function orderNearestNeighbor(
  schedules: readonly OrderableSchedule[],
  startCoord: Coord,
  lookup: TravelTimeLookup,
): Promise<readonly OrderableSchedule[]> {
  if (schedules.length <= 1) return schedules

  const remaining = [...schedules]
  const ordered: OrderableSchedule[] = []
  let current = startCoord

  while (remaining.length > 0) {
    let bestIndex = 0
    let bestMinutes = Number.POSITIVE_INFINITY

    for (let i = 0; i < remaining.length; i += 1) {
      const candidate = remaining[i]!
      const travel = await lookup(current, candidate.coord, candidate.mode)
      // 이동 시간을 못 얻은 후보는 뒤로 밀린다. 뺄 수는 없다 — 순서에는 들어가야 한다
      const minutes = travel?.minutes ?? Number.POSITIVE_INFINITY

      if (minutes < bestMinutes) {
        bestMinutes = minutes
        bestIndex = i
      }
    }

    const chosen = remaining.splice(bestIndex, 1)[0]!
    ordered.push(chosen)
    current = chosen.coord
  }

  return ordered
}

/**
 * RBR-6 · RBR-42 손으로 고정한 자리를 지킨다.
 *
 * 고정된 것을 먼저 그 자리에 놓고, 나머지를 순서대로 빈 자리에 채운다.
 */
export function applyPinnedOrder(
  schedules: readonly OrderableSchedule[],
): readonly OrderableSchedule[] {
  const pinned = schedules.filter((schedule) => schedule.pinnedOrder !== null)
  if (pinned.length === 0) return schedules

  const unpinned = schedules.filter((schedule) => schedule.pinnedOrder === null)
  const slots: (OrderableSchedule | null)[] = new Array(schedules.length).fill(null)

  // 고정된 자리에 먼저 놓는다. 범위를 벗어난 자리는 무시한다
  for (const schedule of pinned) {
    const index = schedule.pinnedOrder!
    if (index >= 0 && index < slots.length && slots[index] === null) {
      slots[index] = schedule
    } else {
      unpinned.push(schedule)
    }
  }

  // 남은 것을 빈 자리에 순서대로 채운다
  let cursor = 0
  for (let i = 0; i < slots.length; i += 1) {
    if (slots[i] === null) {
      slots[i] = unpinned[cursor] ?? null
      cursor += 1
    }
  }

  return slots.filter((slot): slot is OrderableSchedule => slot !== null)
}
