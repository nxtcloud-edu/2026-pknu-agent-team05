// 창구 테스트 — R-NFR-3.5 · R-NFR-4.5
// 근거: route-planning/functional-design/business-logic-model.md C-7 흐름
//
// 캐시 · 실패 · 재시도 흐름을 확인한다. `cached` 와 `stale` 이 갈리는지가 핵심이다.
// 키를 넣지 않으므로 실제 카카오 호출은 일어나지 않는다.

import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from '../domain/settings'
import { cacheKey, createTravelTimeCache } from './cache'
import { createRouteGateway } from './mapGateway'
import { retryOnce, withTimeout } from './retry'

const FROM = { lat: 37.5665, lng: 126.978 }
const TO = { lat: 37.4979, lng: 127.0276 }
const NOW = new Date(2026, 7, 26, 9, 0, 0)

function gateway(overrides: Partial<Parameters<typeof createRouteGateway>[0]> = {}) {
  return createRouteGateway({
    settings: DEFAULT_SETTINGS,
    now: () => NOW,
    keys: { restKey: null, mobilityKey: null },
    ...overrides,
  })
}

describe('키가 없을 때 (R-NFR-4.5)', () => {
  it('앱이 멈추지 않고 자체 계산으로 답한다', async () => {
    const result = await gateway().travelTime(FROM, TO, 'car')
    expect(result).not.toBeNull()
    expect(result?.freshness).toBe('estimated')
  })

  it('장소 검색은 빈 목록을 돌려준다 — 그 일정은 동선에서 빠진다 (RBR-38)', async () => {
    const result = await gateway().searchPlaces('강남역')
    expect(result).toEqual([])
  })

  it('키가 없음을 알 수 있다', () => {
    expect(gateway().hasKeys()).toBe(false)
  })

  it('키가 하나라도 있으면 알 수 있다', () => {
    const withKey = gateway({ keys: { restKey: 'abc', mobilityKey: null } })
    expect(withKey.hasKeys()).toBe(true)
  })
})

describe('자체 계산으로 답하는 수단 (Q3-B)', () => {
  it('도보는 외부를 부르지 않고 어림한다', async () => {
    const result = await gateway().travelTime(FROM, TO, 'walk')
    expect(result?.freshness).toBe('estimated')
    expect(result?.minutes).toBeGreaterThan(0)
  })

  it('대중교통도 어림한다', async () => {
    const result = await gateway().travelTime(FROM, TO, 'transit')
    expect(result?.freshness).toBe('estimated')
  })

  it('수단마다 결과가 다르다', async () => {
    const walk = await gateway().travelTime(FROM, TO, 'walk')
    const transit = await gateway().travelTime(FROM, TO, 'transit')
    expect(walk?.minutes).not.toBe(transit?.minutes)
  })

  it('자체 계산은 캐시를 거치지 않는다 — 계산이 호출보다 싸다', async () => {
    const cache = createTravelTimeCache(10)
    await gateway({ cache }).travelTime(FROM, TO, 'walk')
    expect(cache.entries()).toHaveLength(0)
  })
})

describe('캐시 (RBR-28 ~ RBR-30 · RBR-34)', () => {
  it('유지 시간 안의 값은 cached 로 돌려준다 — 정상이므로 알리지 않는다', async () => {
    const key = cacheKey(FROM, TO, 'car', DEFAULT_SETTINGS.system.coordCompareDecimals)
    const cache = createTravelTimeCache(10, [
      { key, minutes: 33, at: NOW.toISOString(), mode: 'car' },
    ])

    const result = await gateway({ cache }).travelTime(FROM, TO, 'car')
    expect(result?.freshness).toBe('cached')
    expect(result?.minutes).toBe(33)
  })

  it('유지 시간이 지난 값은 cached 로 쓰지 않는다', async () => {
    const key = cacheKey(FROM, TO, 'car', DEFAULT_SETTINGS.system.coordCompareDecimals)
    const old = new Date(NOW.getTime() - 60 * 60000).toISOString()
    const cache = createTravelTimeCache(10, [
      { key, minutes: 33, at: old, mode: 'car' },
    ])

    const result = await gateway({ cache }).travelTime(FROM, TO, 'car')
    // 키가 없어 외부를 못 부르므로 옛 값을 stale 로 쓴다 (RBR-31)
    expect(result?.freshness).toBe('stale')
    expect(result?.minutes).toBe(33)
  })

  it('cached 와 stale 이 갈린다 (RBR-34)', async () => {
    const key = cacheKey(FROM, TO, 'car', DEFAULT_SETTINGS.system.coordCompareDecimals)

    const freshCache = createTravelTimeCache(10, [
      { key, minutes: 20, at: NOW.toISOString(), mode: 'car' },
    ])
    const oldCache = createTravelTimeCache(10, [
      { key, minutes: 20, at: new Date(NOW.getTime() - 3600_000).toISOString(), mode: 'car' },
    ])

    const a = await gateway({ cache: freshCache }).travelTime(FROM, TO, 'car')
    const b = await gateway({ cache: oldCache }).travelTime(FROM, TO, 'car')

    expect(a?.freshness).toBe('cached')
    expect(b?.freshness).toBe('stale')
  })

  it('새로 계산을 누르면 캐시를 비운다 (RBR-29)', async () => {
    const key = cacheKey(FROM, TO, 'car', DEFAULT_SETTINGS.system.coordCompareDecimals)
    const cache = createTravelTimeCache(10, [
      { key, minutes: 33, at: NOW.toISOString(), mode: 'car' },
    ])
    const g = gateway({ cache })

    g.clearCache()

    const result = await g.travelTime(FROM, TO, 'car')
    // 캐시가 비었고 키도 없으므로 어림값이 나온다
    expect(result?.freshness).toBe('estimated')
  })
})

describe('캐시 열쇠 (RBR-30)', () => {
  const decimals = 4

  it('같은 구간 · 같은 수단은 같은 열쇠다', () => {
    expect(cacheKey(FROM, TO, 'car', decimals)).toBe(cacheKey(FROM, TO, 'car', decimals))
  })

  it('이동 수단이 다르면 다른 열쇠다', () => {
    expect(cacheKey(FROM, TO, 'car', decimals)).not.toBe(
      cacheKey(FROM, TO, 'walk', decimals),
    )
  })

  it('방향이 다르면 다른 열쇠다', () => {
    expect(cacheKey(FROM, TO, 'car', decimals)).not.toBe(
      cacheKey(TO, FROM, 'car', decimals),
    )
  })

  it('정해진 자릿수보다 작은 차이는 같은 구간으로 본다', () => {
    const almostSame = { lat: FROM.lat + 0.000001, lng: FROM.lng }
    expect(cacheKey(FROM, TO, 'car', decimals)).toBe(
      cacheKey(almostSame, TO, 'car', decimals),
    )
  })

  it('자릿수를 늘리면 작은 차이도 다른 구간이 된다', () => {
    const almostSame = { lat: FROM.lat + 0.000001, lng: FROM.lng }
    expect(cacheKey(FROM, TO, 'car', 8)).not.toBe(cacheKey(almostSame, TO, 'car', 8))
  })
})

describe('캐시 자체', () => {
  it('유지 시간 안의 값을 찾는다', () => {
    const cache = createTravelTimeCache(10)
    cache.put({ key: 'k', minutes: 20, at: NOW.toISOString(), mode: 'car' })
    expect(cache.findFresh('k', NOW)?.minutes).toBe(20)
  })

  it('유지 시간이 지나면 findFresh 가 못 찾는다', () => {
    const cache = createTravelTimeCache(10)
    cache.put({ key: 'k', minutes: 20, at: NOW.toISOString(), mode: 'car' })
    const later = new Date(NOW.getTime() + 20 * 60000)
    expect(cache.findFresh('k', later)).toBeNull()
  })

  it('findAny 는 유지 시간과 무관하게 찾는다 (RBR-31)', () => {
    const cache = createTravelTimeCache(10)
    cache.put({ key: 'k', minutes: 20, at: NOW.toISOString(), mode: 'car' })
    expect(cache.findAny('k')?.minutes).toBe(20)
  })

  it('같은 열쇠에 넣으면 덮어쓴다', () => {
    const cache = createTravelTimeCache(10)
    cache.put({ key: 'k', minutes: 20, at: NOW.toISOString(), mode: 'car' })
    cache.put({ key: 'k', minutes: 35, at: NOW.toISOString(), mode: 'car' })
    expect(cache.entries()).toHaveLength(1)
    expect(cache.findAny('k')?.minutes).toBe(35)
  })
})

describe('재시도 (Q4-B)', () => {
  it('성공하면 한 번만 부른다', async () => {
    let calls = 0
    await retryOnce(async () => {
      calls += 1
      return 'ok'
    }, 0)
    expect(calls).toBe(1)
  })

  it('실패하면 한 번 다시 부른다', async () => {
    let calls = 0
    const result = await retryOnce(async () => {
      calls += 1
      if (calls === 1) throw new Error('첫 번째 실패')
      return 'ok'
    }, 0)
    expect(calls).toBe(2)
    expect(result).toBe('ok')
  })

  it('두 번 다 실패하면 오류를 던진다 — 세 번은 부르지 않는다', async () => {
    let calls = 0
    await expect(
      retryOnce(async () => {
        calls += 1
        throw new Error('계속 실패')
      }, 0),
    ).rejects.toThrow()
    expect(calls).toBe(2)
  })
})

describe('호출 포기 (R-NFR-1.4)', () => {
  it('제때 끝나면 결과를 돌려준다', async () => {
    const result = await withTimeout(async () => 'ok', 1000)
    expect(result).toBe('ok')
  })

  it('중단 신호를 넘겨준다', async () => {
    const result = await withTimeout(async (signal) => signal.aborted, 1000)
    expect(result).toBe(false)
  })
})
