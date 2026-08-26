// C-7 지도 창구를 엮는 자리 — R-NFR-5.3 · R-NFR-5.4
// 근거: route-planning/functional-design/business-logic-model.md C-7 흐름
//
// 이 파일이 Q1-B 와 Q3-B 가 만든 갈림을 한곳에 모은다.
//   자동차        → 카카오모빌리티 API. 실패하면 자체 계산
//   도보 · 대중교통 → 자체 계산 (카카오 계열에서 받지 못한다)
//
// 나중에 대중교통 API 를 얻으면 이 파일만 고친다.

import { estimateTravelTime } from '../domain/route/estimate'
import type {
  MapGateway,
  PlaceCandidate,
  TravelTime,
  TravelTimeCacheEntry,
} from '../domain/route/types'
import type { Coord, TravelMode } from '../domain/schedule/types'
import type { Settings } from '../domain/settings'
import { cacheKey, createTravelTimeCache } from './cache'
import type { TravelTimeCache } from './cache'
import { fetchKakaoCarMinutes, readKakaoKeys, searchKakaoPlaces } from './kakao/api'
import type { KakaoKeys } from './kakao/api'
import { retryOnce } from './retry'

/** 어떤 수단을 외부에서 받아오나. 나중에 대중교통 API 를 얻으면 여기 더한다 */
const MODES_FROM_EXTERNAL: readonly TravelMode[] = ['car']

export interface CreateGatewayOptions {
  readonly settings: Settings
  readonly now?: () => Date
  readonly keys?: KakaoKeys
  readonly cache?: TravelTimeCache
}

export interface RouteGateway extends MapGateway {
  /** RBR-29 사용자가 `새로 계산` 을 누르면 캐시를 비운다 */
  readonly clearCache: () => void
  /** 키가 하나라도 있는지. 화면에서 상태를 알릴 때 쓴다 */
  readonly hasKeys: () => boolean
  readonly cacheEntries: () => readonly TravelTimeCacheEntry[]
}

export function createRouteGateway(options: CreateGatewayOptions): RouteGateway {
  const { settings } = options
  const now = options.now ?? (() => new Date())
  const keys = options.keys ?? readKakaoKeys()
  const cache =
    options.cache ?? createTravelTimeCache(settings.system.travelTimeCacheMinutes)

  const { requestTimeoutMs, retryDelayMs, coordCompareDecimals } = settings.system

  async function searchPlaces(query: string): Promise<readonly PlaceCandidate[]> {
    const found = await searchKakaoPlaces(query, keys, requestTimeoutMs)
    // 키가 없거나 호출이 실패하면 빈 목록. 그 일정은 동선에서 빠진다 (RBR-38 · RBR-21)
    return found ?? []
  }

  async function travelTime(
    from: Coord,
    to: Coord,
    mode: TravelMode,
  ): Promise<TravelTime | null> {
    const currentTime = now()
    const key = cacheKey(from, to, mode, coordCompareDecimals)

    // 자체 계산으로 답하는 수단은 캐시를 거치지 않는다. 계산이 호출보다 싸다
    if (!MODES_FROM_EXTERNAL.includes(mode)) {
      return estimateTravelTime(from, to, mode, settings.estimate, currentTime)
    }

    // RBR-28 유지 시간 안이면 저장된 값을 쓴다. 상태는 cached — 정상이므로 알리지 않는다
    const fresh = cache.findFresh(key, currentTime)
    if (fresh !== null) {
      return { minutes: fresh.minutes, freshness: 'cached', at: fresh.at, mode }
    }

    // RBR-27 외부에 묻는다. Q4-B 짧게 한 번 다시 시도한다
    const minutes = await retryOnce(
      async () => {
        const value = await fetchKakaoCarMinutes(from, to, keys, requestTimeoutMs)
        // 실패를 던져 재시도가 걸리게 한다
        if (value === null) throw new Error('kakao mobility 응답 없음')
        return value
      },
      retryDelayMs,
    ).catch(() => null)

    if (minutes !== null) {
      const at = currentTime.toISOString()
      cache.put({ key, minutes, at, mode })
      return { minutes, freshness: 'fresh', at, mode }
    }

    // RBR-31 실패했다. 유지 시간이 지난 옛 값이라도 있으면 쓰고 낡았다고 표시한다
    const old = cache.findAny(key)
    if (old !== null) {
      return { minutes: old.minutes, freshness: 'stale', at: old.at, mode }
    }

    // 옛 값도 없다. 자체 계산으로 넘어간다 (Q3-B 가 RBR-32 를 거의 없앴다)
    return estimateTravelTime(from, to, mode, settings.estimate, currentTime)
  }

  return {
    searchPlaces,
    travelTime,
    clearCache: cache.clear,
    hasKeys: () => keys.restKey !== null || keys.mobilityKey !== null,
    cacheEntries: cache.entries,
  }
}
