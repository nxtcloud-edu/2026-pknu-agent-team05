// R-3 이동 시간 캐시 — RBR-28 ~ RBR-30 · RBR-34
// 근거: route-planning/functional-design/business-logic-model.md C-7 흐름
//
// 이 파일의 핵심은 `cached` 와 `stale` 을 가르는 것이다.
//   cached — 유지 시간 안이라 저장된 값을 썼다. 정상이므로 알리지 않는다
//   stale  — 외부가 실패해서 유지 시간이 지난 옛 값을 쓰고 있다. 화면에 알린다

import type { Coord, TravelMode } from '../domain/schedule/types'
import type { TravelTimeCacheEntry } from '../domain/route/types'

/**
 * RBR-30 구간을 견줄 열쇠를 만든다.
 *
 * 좌표를 정해진 소수 자릿수까지만 본다. 너무 촘촘하면 같은 장소인데 캐시가 안 맞고,
 * 너무 거칠면 다른 장소를 같다고 본다. 자릿수는 설정에서 온다.
 */
export function cacheKey(
  from: Coord,
  to: Coord,
  mode: TravelMode,
  decimals: number,
): string {
  const round = (value: number) => value.toFixed(decimals)
  return `${round(from.lat)},${round(from.lng)}|${round(to.lat)},${round(to.lng)}|${mode}`
}

export interface TravelTimeCache {
  /** 유지 시간 안의 값을 찾는다. 없으면 null */
  readonly findFresh: (key: string, now: Date) => TravelTimeCacheEntry | null
  /** 유지 시간이 지났어도 값을 찾는다. 외부가 실패했을 때 쓴다 (RBR-31) */
  readonly findAny: (key: string) => TravelTimeCacheEntry | null
  readonly put: (entry: TravelTimeCacheEntry) => void
  /** RBR-29 사용자가 `새로 계산` 을 누르면 비운다 */
  readonly clear: () => void
  readonly entries: () => readonly TravelTimeCacheEntry[]
}

/**
 * 메모리에 두는 캐시.
 *
 * 브라우저를 새로 열면 비어 있다. 이동 시간은 시간이 지나면 어차피 낡으므로
 * 오래 남길 이유가 없다. 남기고 싶으면 이 자리만 바꾸면 된다.
 */
export function createTravelTimeCache(
  cacheMinutes: number,
  initial: readonly TravelTimeCacheEntry[] = [],
): TravelTimeCache {
  const map = new Map<string, TravelTimeCacheEntry>(
    initial.map((entry) => [entry.key, entry]),
  )

  return {
    findFresh(key, now) {
      const entry = map.get(key)
      if (entry === undefined) return null

      const ageMinutes = (now.getTime() - new Date(entry.at).getTime()) / 60000
      return ageMinutes <= cacheMinutes ? entry : null
    },

    findAny(key) {
      return map.get(key) ?? null
    },

    put(entry) {
      map.set(entry.key, entry)
    },

    clear() {
      map.clear()
    },

    entries() {
      return [...map.values()]
    },
  }
}
