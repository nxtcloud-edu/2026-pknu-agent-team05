// 자체 계산 테스트 — Q3-B · R-NFR-3.4
//
// 외부를 부르지 않으므로 그대로 검증된다.

import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from '../settings'
import { estimateMinutes, estimateTravelTime, greatCircleKm } from './estimate'

const ESTIMATE = DEFAULT_SETTINGS.estimate

// 서울시청과 강남역. 실제 직선거리는 약 8.5km 안팎이다
const CITY_HALL = { lat: 37.5665, lng: 126.978 }
const GANGNAM = { lat: 37.4979, lng: 127.0276 }

describe('직선거리 (Haversine)', () => {
  it('같은 지점은 0 이다', () => {
    expect(greatCircleKm(CITY_HALL, CITY_HALL)).toBe(0)
  })

  it('서울시청 ~ 강남역이 8km 대로 나온다', () => {
    const km = greatCircleKm(CITY_HALL, GANGNAM)
    expect(km).toBeGreaterThan(8)
    expect(km).toBeLessThan(9.5)
  })

  it('방향이 바뀌어도 거리가 같다', () => {
    expect(greatCircleKm(CITY_HALL, GANGNAM)).toBeCloseTo(
      greatCircleKm(GANGNAM, CITY_HALL),
      6,
    )
  })

  it('위도 1도는 약 111km 다', () => {
    const km = greatCircleKm({ lat: 37, lng: 127 }, { lat: 38, lng: 127 })
    expect(km).toBeGreaterThan(110)
    expect(km).toBeLessThan(112)
  })
})

describe('이동 시간 어림하기', () => {
  it('같은 지점도 최소 시간은 나온다', () => {
    expect(estimateMinutes(CITY_HALL, CITY_HALL, 'walk', ESTIMATE)).toBe(
      ESTIMATE.minimumMinutes,
    )
  })

  it('도보가 대중교통보다 오래 걸린다', () => {
    const walk = estimateMinutes(CITY_HALL, GANGNAM, 'walk', ESTIMATE)
    const transit = estimateMinutes(CITY_HALL, GANGNAM, 'transit', ESTIMATE)
    expect(walk).toBeGreaterThan(transit)
  })

  it('대중교통이 자동차보다 오래 걸린다', () => {
    const transit = estimateMinutes(CITY_HALL, GANGNAM, 'transit', ESTIMATE)
    const car = estimateMinutes(CITY_HALL, GANGNAM, 'car', ESTIMATE)
    expect(transit).toBeGreaterThan(car)
  })

  it('멀어지면 시간이 늘어난다', () => {
    const near = estimateMinutes(CITY_HALL, { lat: 37.57, lng: 126.98 }, 'walk', ESTIMATE)
    const far = estimateMinutes(CITY_HALL, GANGNAM, 'walk', ESTIMATE)
    expect(far).toBeGreaterThan(near)
  })

  it('정수 분으로 나온다', () => {
    const minutes = estimateMinutes(CITY_HALL, GANGNAM, 'transit', ESTIMATE)
    expect(Number.isInteger(minutes)).toBe(true)
  })

  it('서울시청 ~ 강남역 대중교통이 그럴듯한 범위에 든다', () => {
    // 8.5km · 22km/h · 우회 1.4 → 약 32분. 실제 지하철도 30분 안팎이다
    const minutes = estimateMinutes(CITY_HALL, GANGNAM, 'transit', ESTIMATE)
    expect(minutes).toBeGreaterThan(20)
    expect(minutes).toBeLessThan(50)
  })

  it('설정을 바꾸면 결과가 달라진다 — 수치가 코드에 박혀 있지 않다 (R-NFR-5.5)', () => {
    const fast = estimateMinutes(CITY_HALL, GANGNAM, 'walk', {
      ...ESTIMATE,
      speedKmh: { ...ESTIMATE.speedKmh, walk: 9 },
    })
    const normal = estimateMinutes(CITY_HALL, GANGNAM, 'walk', ESTIMATE)
    expect(fast).toBeLessThan(normal)
  })

  it('우회 계수를 키우면 시간이 늘어난다', () => {
    const straight = estimateMinutes(CITY_HALL, GANGNAM, 'walk', {
      ...ESTIMATE,
      detourFactor: { ...ESTIMATE.detourFactor, walk: 1 },
    })
    const detoured = estimateMinutes(CITY_HALL, GANGNAM, 'walk', ESTIMATE)
    expect(detoured).toBeGreaterThan(straight)
  })
})

describe('어림값임을 드러낸다 (R-NFR-6.1)', () => {
  it('freshness 가 estimated 다', () => {
    const result = estimateTravelTime(CITY_HALL, GANGNAM, 'transit', ESTIMATE)
    expect(result.freshness).toBe('estimated')
  })

  it('이동 수단을 함께 담는다', () => {
    const result = estimateTravelTime(CITY_HALL, GANGNAM, 'walk', ESTIMATE)
    expect(result.mode).toBe('walk')
  })

  it('조회 시각을 주입할 수 있다', () => {
    const now = new Date(2026, 7, 26, 9, 0, 0)
    const result = estimateTravelTime(CITY_HALL, GANGNAM, 'car', ESTIMATE, now)
    expect(result.at).toBe(now.toISOString())
  })
})
