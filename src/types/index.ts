/**
 * Domain Type Definitions for Outing Route Assistant
 */

export type TransportMode = 'walking' | 'transit' | 'driving';

export interface Location {
  name: string;
  address?: string;
  lat: number;
  lng: number;
  category?: string;
}

export interface Participant {
  id: string;
  name: string;
  origin: Location;
  travelMode?: TransportMode;
  estimatedTravelTimeMinutes?: number;
  distanceKm?: number;
}

export type ScheduleType = 'fixed' | 'flexible';

export interface ScheduleItem {
  id: string;
  title: string;
  location: Location;
  durationMinutes: number; // 소요/체류 시간 (분)
  type: ScheduleType;
  fixedStartTime?: string; // "HH:mm" - 고정형일 때 필수
  fixedEndTime?: string;   // 계산된 또는 지정된 종료 시각
  isMeeting?: boolean;     // 약속 여부
  participants?: Participant[];
  selectedPlaceCandidate?: PlaceCandidate;
  bufferMinutes?: number;  // 개별 여유 시간 (미지정 시 설정 기본값)
  transportMode?: TransportMode;
  notes?: string;
  colorTag?: string;
  isCompleted?: boolean;
}

export interface RouteLeg {
  from: Location;
  to: Location;
  transportMode: TransportMode;
  departureTime: string; // "HH:mm" (또는 "익일 HH:mm")
  arrivalTime: string;   // "HH:mm" (또는 "익일 HH:mm")
  travelDurationMinutes: number;
  distanceKm: number;
  bufferMinutes: number;
  scheduleItem?: ScheduleItem;
  stayStartTime?: string;
  stayEndTime?: string;
  warning?: string;
  pathCoordinates?: [number, number][];
}

export interface ImpossibleScheduleWarning {
  scheduleId: string;
  scheduleTitle: string;
  requiredArrival: string;
  earliestPossibleArrival: string;
  delayMinutes: number;
  reason: string;
}

export interface OptimizationResult {
  isFeasible: boolean;
  orderedSchedules: ScheduleItem[];
  legs: RouteLeg[];
  totalTravelTimeMinutes: number;
  totalStayTimeMinutes: number;
  totalDistanceKm: number;
  impossibleWarnings: ImpossibleScheduleWarning[];
  overallDepartureTime: string;
  overallReturnTime: string;
  computedAt: string;
}

export interface PlaceCandidate {
  id: string;
  name: string;
  category: 'cafe' | 'restaurant' | 'bakery' | 'pub' | 'etc';
  categoryName: string;
  address: string;
  lat: number;
  lng: number;
  distanceFromCenterMeters: number;
  rating?: number;
  phone?: string;
}

export interface MidwayCalculationResult {
  centerLocation: Location;
  participantResults: {
    participant: Participant;
    travelTimeMinutes: number;
    distanceKm: number;
  }[];
  timeVariance: number;
  timeStandardDeviation: number;
  maxTimeDiffMinutes: number;
  computationTimeMs: number;
}

export interface ScheduledAlarm {
  id: string;
  scheduleId: string;
  title: string;
  departureTime: string; // "HH:mm"
  targetTimeMs: number;
  bufferMinutes: number;
  isDispatched: boolean;
  createdAt: number;
}

export interface TestResult {
  id: string;
  name: string;
  description: string;
  passed: boolean;
  durationMs: number;
  error?: string;
  details?: string;
}
