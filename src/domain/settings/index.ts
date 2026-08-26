// E-7 설정 — 수치를 모아 두는 자리
// 근거: domain-entities.md E-7 · business-rules.md BR-51 ~ BR-53 · NFR-5.2
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
}

/** 앱이 정하는 값 — BR-52 */
export interface SystemSettings {
  /** 같은 구간을 다시 묻지 않는 기간 (분). route-planning 이 쓴다 — NFR-1.3 */
  readonly travelTimeCacheMinutes: number
  /** 중간지점 후보를 몇 개까지 견줄지. meetup-midpoint 가 쓴다 */
  readonly midpointCandidateCount: number
}

export interface Settings {
  readonly user: UserSettings
  readonly system: SystemSettings
}

/**
 * 기본값.
 *
 * bufferMinutes · placeSearchRadiusMeters · travelTimeCacheMinutes ·
 * midpointCandidateCount 는 이 단위에서 쓰이지 않는다.
 * 뒤 단위가 되돌아오지 않도록 자리를 미리 만들어 둔다 (U-NFR-5.3 · BR-53).
 */
export const DEFAULT_SETTINGS: Settings = {
  user: {
    bufferMinutes: 10,
    defaultTravelMode: 'transit',
    placeSearchRadiusMeters: 500,
  },
  system: {
    travelTimeCacheMinutes: 10,
    midpointCandidateCount: 12,
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
