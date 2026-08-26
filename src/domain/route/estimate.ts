// 이동 시간 자체 계산 — Q3-B
// 근거: route-planning/nfr-requirements/tech-stack-decisions.md `자체 계산 방식`
//
// 카카오 계열에서 도보 · 대중교통 이동 시간을 받지 못하므로 앱이 어림한다.
// 자동차도 외부 호출이 실패하면 여기로 넘어온다.
//
// 이 계산은 외부를 부르지 않는다. 그래서 그대로 테스트된다 (R-NFR-3.4).

import type { Coord, TravelMode } from '../schedule/types'
import type { EstimateSettings } from '../settings'
import type { TravelTime } from './types'

/** 지구 반지름 (km) */
const EARTH_RADIUS_KM = 6371

/**
 * 두 좌표 사이의 대권거리 (km) — Haversine
 *
 * 직선거리이므로 실제 경로보다 짧다. 우회 계수로 메운다.
 */
export function greatCircleKm(from: Coord, to: Coord): number {
  const dLat = toRadians(to.lat - from.lat)
  const dLng = toRadians(to.lng - from.lng)
  const lat1 = toRadians(from.lat)
  const lat2 = toRadians(to.lat)

  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)))
}

/**
 * 이동 시간을 어림한다 (분).
 *
 * `거리 ÷ 평균 속도 × 우회 계수`. 최소 시간보다 작아지지 않는다.
 * 수치는 설정에서 받는다. 여기 박지 않는다 (R-NFR-5.5).
 */
export function estimateMinutes(
  from: Coord,
  to: Coord,
  mode: TravelMode,
  settings: EstimateSettings,
): number {
  const km = greatCircleKm(from, to)
  const speed = settings.speedKmh[mode]
  const detour = settings.detourFactor[mode]

  const minutes = (km / speed) * 60 * detour

  return Math.max(settings.minimumMinutes, Math.round(minutes))
}

/**
 * 어림한 이동 시간을 조회 결과 모양으로 만든다.
 *
 * `freshness` 가 `estimated` 다. 실시간 교통이 반영되지 않았음을 화면까지 전한다 (R-NFR-6.1).
 */
export function estimateTravelTime(
  from: Coord,
  to: Coord,
  mode: TravelMode,
  settings: EstimateSettings,
  now: Date = new Date(),
): TravelTime {
  return {
    minutes: estimateMinutes(from, to, mode, settings),
    freshness: 'estimated',
    at: now.toISOString(),
    mode,
  }
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}
