/**
 * Application Configuration & Tunable Parameters
 * All values are maintained here and NOT hardcoded in core calculation algorithms.
 */

export interface AppConfig {
  /** Default buffer time before departure in minutes (여유 시간) */
  defaultBufferMinutes: number;
  /** Place search radius around midway point in meters (검색 반경) */
  searchRadiusMeters: number;
  /** Route and place query cache time-to-live in milliseconds (캐시 유지 시간) */
  cacheTtlMs: number;
  /** Default departure origin (기본 출발지 e.g., 집) */
  defaultOrigin: {
    name: string;
    address: string;
    lat: number;
    lng: number;
  };
  /** Default transportation mode */
  defaultTransportMode: 'transit' | 'driving' | 'walking';
  /** Base speeds (km/h) for fallback estimation */
  speedsKmH: {
    walking: number;
    transit: number;
    driving: number;
  };
  /** Congestion multiplier applied during peak hours (08:00-09:30, 17:30-19:30) */
  peakHourCongestionMultiplier: number;
  /** Maximum number of schedules allowed for single-day optimization */
  maxSchedules: number;
  /** Optimization timeout limit in milliseconds */
  optimizationTimeoutMs: number;
}

export const DEFAULT_APP_CONFIG: AppConfig = {
  defaultBufferMinutes: 10,
  searchRadiusMeters: 1200,
  cacheTtlMs: 15 * 60 * 1000, // 15 minutes
  defaultOrigin: {
    name: '우리집 (강남역 부근)',
    address: '서울특별시 강남구 테헤란로 152',
    lat: 37.4979,
    lng: 127.0276,
  },
  defaultTransportMode: 'transit',
  speedsKmH: {
    walking: 4.5,
    transit: 25.0,
    driving: 32.0,
  },
  peakHourCongestionMultiplier: 1.35,
  maxSchedules: 15,
  optimizationTimeoutMs: 3000,
};

export const STORAGE_KEYS = {
  SCHEDULES: 'outing_assistant_schedules_v1',
  SETTINGS: 'outing_assistant_settings_v1',
  ACTIVE_DATE: 'outing_assistant_active_date_v1',
  CUSTOM_PLACES: 'outing_assistant_custom_places_v1',
};
