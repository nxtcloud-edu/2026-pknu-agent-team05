// E-7 설정 — 수치를 모아 두는 자리
// 근거: schedule-core/domain-entities.md E-7 · business-rules.md BR-51 ~ BR-53 · NFR-5.2
//       route-planning/nfr-requirements.md R-NFR-5.5
//
// 계산 코드와 화면 코드에 숫자를 박지 않는다. 필요한 값은 여기서 받아 쓴다.

import type { TravelMode } from '../schedule/types'

/** 사용자가 바꾸는 값 — BR-52 */
export interface UserSettings {
  /** 출발 시각을 얼마나 앞당길지 (분). departure-alarm 이 쓴다 — FR-5.3 */
  readonly bufferMinutes: number
  /** 이동 수단을 고르지 않은 일정에 채울 값 — BR-8 */
  readonly defaultTravelMode: TravelMode
  /** 중간지점 주변을 얼마나 넓게 볼지 (m). meetup-midpoint 가 쓴다 — S-13 */
  readonly placeSearchRadiusMeters: number
  /**
   * 앞날의 하루 시작 시각 (`HH:MM`).
   *
   * 오늘 동선은 지금 시각에서 시작하고, 앞날은 이 시각에 나간다고 보고 계산한다.
   * route-planning 의 Q3-B 가 만든 값이다 (RBR-8).
   */
  readonly dayStartTime: string
}

/** 앱이 정하는 값 — BR-52 */
export interface SystemSettings {
  /** 같은 구간을 다시 묻지 않는 기간 (분). route-planning 이 쓴다 — NFR-1.3 · RBR-28 */
  readonly travelTimeCacheMinutes: number
  /** 중간지점 후보를 몇 개까지 견줄지. meetup-midpoint 가 쓴다 */
  readonly midpointCandidateCount: number
  /**
   * 캐시에서 구간을 견줄 때 좌표를 몇 자리까지 볼지 — RBR-30
   *
   * 너무 촘촘하면 같은 장소인데 캐시가 안 맞고, 너무 거칠면 다른 장소를 같다고 본다.
   * 소수 4자리는 약 11m 안팎이다.
   */
  readonly coordCompareDecimals: number
  /** 외부 호출을 얼마나 기다리다 포기할지 (ms) — R-NFR-1.4 */
  readonly requestTimeoutMs: number
  /** 재시도 전에 기다리는 시간 (ms). 한 번만 재시도한다 — Q4-B */
  readonly retryDelayMs: number
}

/**
 * 이동 시간을 자체 계산할 때 쓰는 값 — route-planning Q3-B
 *
 * 카카오 계열에서 도보 · 대중교통 이동 시간을 받지 못하므로 앱이 어림한다.
 * `거리 ÷ 평균 속도 × 우회 계수` 로 구한다.
 */
export interface EstimateSettings {
  /** 수단별 평균 속도 (km/h) */
  readonly speedKmh: Record<TravelMode, number>
  /**
   * 우회 계수. 직선으로 갈 수 없으므로 곱한다.
   *
   * 도보는 골목을 돌아 걷고, 대중교통은 노선을 따라 돌아간다.
   */
  readonly detourFactor: Record<TravelMode, number>
  /** 아주 가까운 곳도 0분이 되지 않게 한다 (분) */
  readonly minimumMinutes: number
}

export interface Settings {
  readonly user: UserSettings
  readonly system: SystemSettings
  readonly estimate: EstimateSettings
}

/**
 * 기본값.
 *
 * bufferMinutes · placeSearchRadiusMeters · midpointCandidateCount 는 아직 쓰이지 않는다.
 * 뒤 단위가 되돌아오지 않도록 자리를 미리 만들어 둔다 (U-NFR-5.3 · BR-53).
 */
export const DEFAULT_SETTINGS: Settings = {
  user: {
    bufferMinutes: 10,
    defaultTravelMode: 'transit',
    placeSearchRadiusMeters: 500,
    dayStartTime: '09:00',
  },
  system: {
    travelTimeCacheMinutes: 10,
    midpointCandidateCount: 12,
    coordCompareDecimals: 4,
    requestTimeoutMs: 4000,
    retryDelayMs: 300,
  },
  estimate: {
    // 도보는 사람이 걷는 속도, 대중교통은 기다리기와 갈아타기가 섞인 실효 속도,
    // 자동차는 도심 평균을 잡았다. 자동차는 보통 외부 API 값을 쓰고 이 값은 실패 시에만 쓰인다.
    speedKmh: { walk: 4.5, transit: 22, car: 28 },
    // 도보는 골목을 돌아 걷고, 대중교통은 노선을 따라 크게 돌아간다.
    detourFactor: { walk: 1.3, transit: 1.4, car: 1.35 },
    minimumMinutes: 3,
  },
}

/** 반경을 넓혀 다시 찾을 때 쓰는 단위 (m) — S-13 */
export const PLACE_SEARCH_RADIUS_STEP_METERS = 500

/** 반경의 허용 범위 (m) */
export const PLACE_SEARCH_RADIUS_MIN_METERS = 100
export const PLACE_SEARCH_RADIUS_MAX_METERS = 5000

/** 여유 시간의 허용 범위 (분) */
export const BUFFER_MINUTES_MIN = 0
export const BUFFER_MINUTES_MAX = 120

/** 머무는 시간의 허용 범위 (분) — BR-3 */
export const STAY_MINUTES_MIN = 1
export const STAY_MINUTES_MAX = 24 * 60
