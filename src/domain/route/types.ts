// R-1 ~ R-7 · route-planning 이 다루는 것들
// 근거: aidlc-docs/construction/route-planning/functional-design/domain-entities.md
//
// 이 단위는 거의 아무것도 보관하지 않는다. 캐시(R-3)와 좌표만 남고 나머지는 계산된다.

import type { Coord, DateKey, Place, TimeOfDay, TravelMode } from '../schedule/types'

/**
 * R-2 이동 시간이 어디서 왔는지 — 세 상태
 *
 * `cached` 와 `stale` 을 가르는 것이 중요하다. 앞은 정상이므로 알리지 않고,
 * 뒤는 값이 낡았으므로 화면에 알린다 (RBR-34 · FR-6.3).
 */
export type TravelTimeFreshness =
  /** 방금 외부에서 받았다 */
  | 'fresh'
  /** 캐시 유지 시간 안이라 저장된 값을 썼다. 정상 (RBR-28) */
  | 'cached'
  /** 외부가 실패해서 유지 시간이 지난 옛 값을 쓰고 있다. 알린다 (RBR-31) */
  | 'stale'
  /** 앱이 직선거리로 어림했다. 실시간 교통이 반영되지 않았다 (Q3-B · R-NFR-6) */
  | 'estimated'

/** R-1 좌표 후보 — 사용자가 친 글자로 외부에서 찾은 결과 */
export interface PlaceCandidate {
  /** 찾아낸 장소 이름. Place.resolvedName 이 된다 */
  readonly name: string
  /** 사람이 읽을 주소. 후보를 구별하는 데 쓴다 */
  readonly address: string | null
  readonly coord: Coord
}

/** R-2 이동 시간 조회 결과 */
export interface TravelTime {
  readonly minutes: number
  readonly freshness: TravelTimeFreshness
  /** 조회 시각 (ISO 8601) */
  readonly at: string
  readonly mode: TravelMode
}

/** R-3 이동 시간 캐시 항목 (보관된다) */
export interface TravelTimeCacheEntry {
  /** 출발·도착 좌표와 이동 수단으로 만든 열쇠. 좌표는 정해진 자릿수까지 자른다 (RBR-30) */
  readonly key: string
  readonly minutes: number
  readonly at: string
  readonly mode: TravelMode
}

/** 구간의 한쪽 끝 */
export interface RoutePoint {
  readonly label: string
  readonly coord: Coord
}

/** R-4 구간 — 한 곳에서 다음 곳으로 가는 하나의 이동 */
export interface RouteLeg {
  readonly from: RoutePoint
  readonly to: RoutePoint
  /** 어느 일정으로 가는 구간인지. 마지막 도착지로 가는 구간이면 null */
  readonly scheduleId: string | null
  /** 알림 문구에 들어간다 (경계 2 · FR-5.4) */
  readonly destinationLabel: string
  readonly mode: TravelMode
  readonly travelMinutes: number
  readonly freshness: TravelTimeFreshness
  readonly departAt: TimeOfDay
  readonly arriveAt: TimeOfDay
  /** 도착한 뒤 그곳에 있는 시간. 마지막 도착지면 0 */
  readonly stayMinutes: number
  /**
   * 고정형 일정에 일찍 닿아 기다리는 시간 (분) — RBR-13
   *
   * **총 이동 시간에 넣지 않는다.** 넣으면 순서를 견줄 때 엉뚱한 답이 나온다.
   * 다만 화면에는 보여준다. 감추면 시간이 어디로 갔는지 설명되지 않는다.
   */
  readonly waitMinutes: number
  /** 도착 시각이 사용자가 정한 것인지, 계산된 것인지 */
  readonly arrivalFixed: boolean
  /** 사용자가 이 자리를 손으로 고정했는지 (RBR-6) */
  readonly pinned: boolean
  /** 자정을 넘겨 도착하거나 끝나는지 (RBR-14) */
  readonly crossesMidnight: boolean
}

/** R-7 빠진 일정 — 좌표를 못 찾아 동선에서 뺀 것 (Q4-A · RBR-21) */
export interface ExcludedSchedule {
  readonly scheduleId: string
  readonly title: string
  readonly reason: 'no-coord' | 'empty-query'
  /** 고정형이 빠지면 도착 불가 판정도 함께 사라진다. 더 눈에 띄게 알린다 (RBR-25) */
  readonly wasFixed: boolean
}

/** R-6 도착 불가 경고 (S-9 · RBR-16~RBR-19) */
export interface InfeasibleArrival {
  readonly scheduleId: string
  readonly title: string
  /** 사용자가 정한 도착 시각 */
  readonly requiredArrival: TimeOfDay
  /** 앞 일정이 끝나고 이동해서 실제로 닿는 시각 */
  readonly earliestArrival: TimeOfDay
  /** 몇 분 모자라는지 */
  readonly shortMinutes: number
  /** 앞의 어느 일정 때문인지. 첫 구간이면 null */
  readonly causedByTitle: string | null
}

/** R-5 동선 결과 */
export interface RoutePlan {
  readonly date: DateKey
  /** 확정된 일정 순서 (일정 이름) */
  readonly order: readonly string[]
  readonly legs: readonly RouteLeg[]
  /** 구간 이동 시간의 합. 기다린 시간은 넣지 않는다 (RBR-13) */
  readonly totalTravelMinutes: number
  readonly dayStartAt: TimeOfDay
  readonly dayEndAt: TimeOfDay
  readonly excluded: readonly ExcludedSchedule[]
  /** 구간 중 하나라도 stale 이면 참 (RBR-31) */
  readonly hasStaleTravelTime: boolean
  /** 구간 중 하나라도 estimated 이면 참 — 총 이동 시간도 어림값이다 (R-NFR-6.3) */
  readonly hasEstimatedTravelTime: boolean
  /** 순서를 어떻게 정했는지. 화면에 밝힌다 (RBR-5) */
  readonly orderingMethod: 'nearest-neighbor'
}

/** 계산을 아예 할 수 없는 이유 */
export type RoutePlanBlock =
  /** 하루 출발지에 좌표가 없다 (RBR-23) */
  | { readonly kind: 'no-origin' }
  /** 계산할 일정이 하나도 남지 않았다 (RBR-26) */
  | { readonly kind: 'no-schedules'; readonly excluded: readonly ExcludedSchedule[] }
  /** 옛 값도 없이 외부가 실패했다 (RBR-32) */
  | { readonly kind: 'travel-time-unavailable'; readonly legLabel: string }

/** C-2 가 내놓는 것 — 셋 중 하나다 */
export type RoutePlanResult =
  | { readonly kind: 'plan'; readonly plan: RoutePlan }
  /** 도착 불가가 하나라도 있으면 순서를 주지 않는다 (RBR-17) */
  | {
      readonly kind: 'infeasible'
      readonly problems: readonly InfeasibleArrival[]
      readonly excluded: readonly ExcludedSchedule[]
    }
  | { readonly kind: 'blocked'; readonly block: RoutePlanBlock }

/**
 * 이동 시간을 물어볼 수단.
 *
 * C-2 는 외부를 직접 부르지 않는다. 이것을 인자로 받는다.
 * 그래서 대역을 넣으면 외부 없이 테스트된다 (R-NFR-3.1).
 */
export interface TravelTimeLookup {
  (from: Coord, to: Coord, mode: TravelMode): Promise<TravelTime | null>
}

/** 주소를 좌표로 바꾸는 수단 (C-7 · RBR-35~RBR-38) */
export interface PlaceLookup {
  (query: string): Promise<readonly PlaceCandidate[]>
}

/** C-7 지도 창구의 경계면 — 서비스를 갈아끼울 때 지킬 것 (R-NFR-5.3) */
export interface MapGateway {
  /** 주소↔좌표. 후보 0개 · 1개 · 여러 개 */
  searchPlaces: PlaceLookup
  /** 이동 시간. 얻지 못하면 null */
  travelTime: TravelTimeLookup
}

/** 확정된 장소를 Place 로 바꾼다 (RBR-37 · RBR-39) */
export function candidateToPlace(query: string, candidate: PlaceCandidate): Place {
  return {
    query,
    resolvedName: candidate.name,
    coord: candidate.coord,
    coordAt: new Date().toISOString(),
  }
}
