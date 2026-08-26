// E-1 ~ E-6 · schedule-core 가 다루는 것들
// 근거: aidlc-docs/construction/schedule-core/functional-design/domain-entities.md
//
// 보관되는 것만 여기 있다. 동선 순서 · 구간별 시각 · 출발 시각은 계산 결과이므로 보관하지 않는다.

/** 이동 수단 — FR-1.5 */
export type TravelMode = 'walk' | 'transit' | 'car'

export const TRAVEL_MODES: readonly TravelMode[] = ['walk', 'transit', 'car']

export const TRAVEL_MODE_LABEL: Record<TravelMode, string> = {
  walk: '도보',
  transit: '대중교통',
  car: '자동차',
}

/** 일정 유형 — FR-1.3 */
export type ScheduleKind = 'fixed' | 'flexible'

/** 요일. 0 = 일요일 … 6 = 토요일 (JavaScript Date 와 같은 규칙) */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export const WEEKDAY_LABEL: Record<Weekday, string> = {
  0: '일',
  1: '월',
  2: '화',
  3: '수',
  4: '목',
  5: '금',
  6: '토',
}

/**
 * E-1 장소
 *
 * 좌표가 비어 있을 수 있다. 주소를 좌표로 바꾸는 일은 C-7 지도 창구가 하고,
 * 그것은 route-planning 단위 소유다 (BR-21). 이 단위는 자리만 만든다 (BR-22).
 */
export interface Place {
  /** 사용자가 직접 친 주소나 장소 이름 (Q2-C) */
  readonly query: string
  /** 후보 중 고른 것의 이름. 아직 고르지 않았으면 비어 있다 (BR-25) */
  readonly resolvedName: string | null
  /** 위도 · 경도. route-planning 이 채운다 (BR-21) */
  readonly coord: Coord | null
  /** 좌표를 얻은 시각 (ISO 8601). 좌표가 없으면 함께 비어 있다 */
  readonly coordAt: string | null
}

export interface Coord {
  readonly lat: number
  readonly lng: number
}

/** 날짜만 담는 값. `YYYY-MM-DD` 형식. 사용자의 표준시 기준 (BR-48) */
export type DateKey = string

/** 시각만 담는 값. `HH:MM` 형식 (24시간) */
export type TimeOfDay = string

/** E-2 일정이 어디서 왔는지 */
export type ScheduleOrigin =
  | { readonly kind: 'direct' }
  | { readonly kind: 'recurring'; readonly ruleId: string }

/**
 * E-2 일정
 *
 * 직접 넣은 것과 반복에서 펼쳐진 것이 같은 모양이다.
 * 유형에 따라 지닌 값의 종류가 달라지지 않고, arrivalTime 한 칸이 비는 것으로 갈린다 (Q3-A).
 */
export interface Schedule {
  readonly id: string
  readonly date: DateKey
  readonly title: string
  readonly place: Place
  /** 그곳에서 머무는 시간 (분). 0 보다 커야 한다 — BR-3 */
  readonly stayMinutes: number
  readonly kind: ScheduleKind
  /** 사용자가 정한 도착해야 하는 시각. 유연형이면 null — BR-4 · BR-5 */
  readonly arrivalTime: TimeOfDay | null
  readonly travelMode: TravelMode
  readonly done: boolean
  /** 사용자가 순서를 직접 잡았다면 몇 번째인지 — FR-2.6 */
  readonly pinnedOrder: number | null
  readonly isAppointment: boolean
  readonly origin: ScheduleOrigin
}

/**
 * E-3 반복 규칙 (Q1-A — 요일 하나만)
 *
 * 미래 날짜의 일정을 미리 만들지 않는다. 볼 때 펼친다 (BR-29).
 */
export interface RecurringRule {
  readonly id: string
  readonly weekday: Weekday
  readonly title: string
  readonly place: Place
  readonly stayMinutes: number
  readonly kind: ScheduleKind
  readonly arrivalTime: TimeOfDay | null
  readonly travelMode: TravelMode
  readonly isAppointment: boolean
  /** 이 규칙이 시작되는 날짜 — BR-31 */
  readonly startDate: DateKey
  /** 이 규칙이 끝나는 날짜. 끝이 없으면 null — BR-32 */
  readonly endDate: DateKey | null
}

/** E-5 예외 기록이 덮어쓰는 값들. 바뀐 것만 담는다 — BR-38 */
export interface RecurringOverridePatch {
  readonly title?: string
  readonly place?: Place
  readonly stayMinutes?: number
  readonly kind?: ScheduleKind
  readonly arrivalTime?: TimeOfDay | null
  readonly travelMode?: TravelMode
  readonly done?: boolean
  readonly pinnedOrder?: number | null
  readonly isAppointment?: boolean
}

/**
 * E-5 예외 기록 — 반복에서 펼쳐질 일정 하나를 그 날짜에만 다르게 다룬다 (FR-1.9)
 *
 * `ruleId` + `date` 조합은 하나뿐이다 (BR-39).
 */
export type RecurringException =
  | {
      readonly ruleId: string
      readonly date: DateKey
      readonly mode: 'skip'
    }
  | {
      readonly ruleId: string
      readonly date: DateKey
      readonly mode: 'modify'
      readonly patch: RecurringOverridePatch
    }

/**
 * E-4 하루 설정 — 날짜마다 하나 (Q4-B · BR-18)
 */
export interface DaySetting {
  readonly date: DateKey
  /** 하루가 시작되는 곳. 없으면 동선을 계산할 수 없다 — BR-19 */
  readonly origin: Place
  /** 하루가 끝나는 곳. 비어 있으면 돌아오는 구간을 계산에 넣지 않는다 — BR-20 */
  readonly destination: Place | null
}

/**
 * E-6 참여자 — 보관하는 곳은 이 단위, 쓰는 곳은 meetup-midpoint (경계 3)
 */
export interface Participant {
  readonly id: string
  /** 어느 일정에 딸린 참여자인지. 그 일정은 isAppointment 가 참이어야 한다 */
  readonly scheduleId: string
  readonly name: string
  readonly place: Place
  readonly travelMode: TravelMode
}

/** 빈 장소를 만든다 */
export function emptyPlace(query = ''): Place {
  return { query, resolvedName: null, coord: null, coordAt: null }
}

/** 장소에 좌표가 채워져 있나 — 동선 계산에 쓸 수 있는지 판단할 때 (BR-22) */
export function hasCoord(place: Place): boolean {
  return place.coord !== null
}
