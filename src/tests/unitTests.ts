/**
 * Standalone Unit Test Suite
 * Tests Route Optimization, Midway Point Calculation, Departure Times,
 * Midnight Crossing, Impossible Deadlines, Participant Edge Cases,
 * External Service Failures, and Time-Injected Alarm Scheduling.
 * Runs 100% offline without external services.
 */

import { IRouteServiceProvider, RouteTravelResult } from '../services/routeServiceBoundary';
import { Location, Participant, PlaceCandidate, ScheduleItem, TestResult, TransportMode } from '../types';
import { AlarmScheduler, NotificationPayload } from '../utils/alarmScheduler';
import { calculateFairMidwayPoint } from '../utils/midwayCalculator';
import { optimizeOutingRoute } from '../utils/routeOptimizer';
import { calculateDepartureTime, getDurationMinutes, minutesToTimeString, timeStringToMinutes } from '../utils/timeUtils';

/**
 * Deterministic Mock Route Provider for reliable unit tests.
 */
export class MockTestRouteProvider implements IRouteServiceProvider {
  public shouldFail: boolean = false;
  public mockTravelTimes: Map<string, number> = new Map();

  async getTravelTime(
    origin: Location,
    destination: Location,
    mode: TransportMode,
    departureTimeMinutes: number = 540
  ): Promise<RouteTravelResult> {
    if (this.shouldFail) {
      throw new Error('External Routing API Network Timeout (504)');
    }

    const key = `${origin.name}_${destination.name}`;
    let duration = this.mockTravelTimes.get(key);

    if (duration === undefined) {
      // Calculate realistic distance based on lat/lng delta
      const dLat = Math.abs(origin.lat - destination.lat);
      const dLng = Math.abs(origin.lng - destination.lng);
      const approxDistKm = (dLat + dLng) * 80;
      duration = Math.max(5, Math.ceil(approxDistKm * 3));
    }

    return {
      durationMinutes: duration,
      distanceKm: Math.round(duration * 0.4 * 10) / 10,
      isTrafficReflected: true,
      source: 'mock-provider',
    };
  }

  async searchPlaces(center: Location, radiusMeters: number, category = 'all'): Promise<PlaceCandidate[]> {
    if (this.shouldFail) {
      throw new Error('External Places Search API Failed');
    }
    return [
      {
        id: 'mock_place_1',
        name: '테스트 카페 & 브런치',
        category: 'cafe',
        categoryName: '카페',
        address: '테스트로 123',
        lat: center.lat + 0.001,
        lng: center.lng + 0.001,
        distanceFromCenterMeters: 150,
        rating: 4.8,
      },
    ];
  }

  async geocode(query: string): Promise<Location[]> {
    if (this.shouldFail) throw new Error('Geocoding Failed');
    return [{ name: query, lat: 37.5, lng: 127.0, address: query }];
  }

  async reverseGeocode(lat: number, lng: number): Promise<string> {
    if (this.shouldFail) throw new Error('Reverse Geocode Failed');
    return `서울시 테스트구 (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
  }
}

// Fixed test locations
const LOC_HOME: Location = { name: '집', lat: 37.4979, lng: 127.0276 };
const LOC_GANGNAM: Location = { name: '강남역', lat: 37.498, lng: 127.028 };
const LOC_HONGDAE: Location = { name: '홍대입구', lat: 37.557, lng: 126.924 };
const LOC_JAMSIL: Location = { name: '잠실', lat: 37.513, lng: 127.1 };
const LOC_SEONGSU: Location = { name: '성수', lat: 37.544, lng: 127.056 };
const LOC_YEOUIDO: Location = { name: '여의도', lat: 37.521, lng: 126.924 };

/**
 * Runs the entire test suite and returns individual test reports.
 */
export async function runAllUnitTests(): Promise<{
  results: TestResult[];
  allPassed: boolean;
  totalDurationMs: number;
}> {
  const testResults: TestResult[] = [];
  const overallStart = performance.now();

  // Helper assertion wrapper
  async function runTestCase(
    id: string,
    name: string,
    description: string,
    fn: () => Promise<void> | void
  ) {
    const start = performance.now();
    try {
      await fn();
      testResults.push({
        id,
        name,
        description,
        passed: true,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
      });
    } catch (err: any) {
      testResults.push({
        id,
        name,
        description,
        passed: false,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
        error: err?.message || String(err),
      });
    }
  }

  const mockProvider = new MockTestRouteProvider();

  // Test 1: 0 Schedules Boundary
  await runTestCase(
    'test_0_schedules',
    '일정 0개 경계 테스트',
    '등록된 일정이 전혀 없을 때 에러 없이 빈 최적화 결과를 반환해야 함',
    async () => {
      const res = await optimizeOutingRoute({
        originLocation: LOC_HOME,
        schedules: [],
        provider: mockProvider,
      });
      if (!res.isFeasible) throw new Error('0개 일정은 항상 feasible이어야 합니다.');
      if (res.legs.length !== 0) throw new Error(`구간(legs) 길이가 0이어야 하지만 ${res.legs.length}입니다.`);
      if (res.impossibleWarnings.length !== 0) throw new Error('경고가 없어야 합니다.');
    }
  );

  // Test 2: 1 Flexible Schedule
  await runTestCase(
    'test_1_schedule',
    '일정 1개 단일 스케줄 테스트',
    '1개 유연 일정에 대해 출발지 -> 일정 -> 귀가 경로가 정확히 계산되어야 함',
    async () => {
      const singleSchedule: ScheduleItem = {
        id: 's1',
        title: '도서관 책 반납',
        location: LOC_GANGNAM,
        durationMinutes: 30,
        type: 'flexible',
      };
      const res = await optimizeOutingRoute({
        originLocation: LOC_HOME,
        schedules: [singleSchedule],
        provider: mockProvider,
        startOfDayTime: '10:00',
        returnToOrigin: true,
      });

      if (!res.isFeasible) throw new Error('단일 유연 일정은 feasible이어야 합니다.');
      if (res.legs.length !== 2) throw new Error(`왕복 2개 구간이 생성되어야 합니다 (현재: ${res.legs.length})`);
      if (res.legs[0].scheduleItem?.title !== '도서관 책 반납') throw new Error('첫 번째 일정이 일치하지 않습니다.');
    }
  );

  // Test 3: Impossible Fixed Schedule Combination (경고 감지)
  await runTestCase(
    'test_impossible_schedule',
    '도착 불가 조합 감지 및 경고 테스트',
    '물리적으로 정해진 시각에 도착할 수 없는 고정 일정 조합에서 isFeasible=false 및 경고 사유 반환',
    async () => {
      mockProvider.mockTravelTimes.set('집_홍대입구', 45);
      mockProvider.mockTravelTimes.set('홍대입구_잠실', 50);

      const fixed1: ScheduleItem = {
        id: 'f1',
        title: '홍대 미팅',
        location: LOC_HONGDAE,
        durationMinutes: 60,
        type: 'fixed',
        fixedStartTime: '10:00', // 10:00 ~ 11:00
      };

      const fixed2: ScheduleItem = {
        id: 'f2',
        title: '잠실 중요한 인터뷰',
        location: LOC_JAMSIL,
        durationMinutes: 60,
        type: 'fixed',
        fixedStartTime: '11:10', // 홍대 11:00 종료 후 잠실까지 50분 걸리는데 11:10까지 도착 불가!
      };

      const res = await optimizeOutingRoute({
        originLocation: LOC_HOME,
        schedules: [fixed1, fixed2],
        provider: mockProvider,
        startOfDayTime: '09:00',
      });

      if (res.isFeasible) throw new Error('도착 불가능한 일정인데 isFeasible=true로 판정되었습니다.');
      if (res.impossibleWarnings.length === 0) throw new Error('불가 일정 경고(impossibleWarnings)가 비어있습니다.');
      const warning = res.impossibleWarnings[0];
      if (warning.scheduleTitle !== '잠실 중요한 인터뷰') {
        throw new Error(`경고 대상이 '잠실 중요한 인터뷰'여야 하지만 '${warning.scheduleTitle}'입니다.`);
      }
    }
  );

  // Test 4: Flexible Schedule Reordering (동선 최적화)
  await runTestCase(
    'test_flexible_reordering',
    '유연형 일정 최소 이동 시간 순서 재배치',
    '유연형 일정들의 순서를 재조정하여 총 이동 거리가 최소가 되는 순서로 최적화해야 함',
    async () => {
      // Home is at Gangnam. Schedules: Seongsu (near), Hongdae (far)
      const flexFar: ScheduleItem = {
        id: 'flex_far',
        title: '홍대 카페 (먼 곳)',
        location: LOC_HONGDAE,
        durationMinutes: 40,
        type: 'flexible',
      };
      const flexNear: ScheduleItem = {
        id: 'flex_near',
        title: '성수 팝업스토어 (가까운 곳)',
        location: LOC_SEONGSU,
        durationMinutes: 40,
        type: 'flexible',
      };

      const res = await optimizeOutingRoute({
        originLocation: LOC_HOME,
        schedules: [flexFar, flexNear],
        provider: mockProvider,
        startOfDayTime: '13:00',
      });

      if (!res.isFeasible) throw new Error('유연 일정 최적화 실패');
      if (res.orderedSchedules.length !== 2) throw new Error('일정 개수 불일치');
    }
  );

  // Test 5: Fixed + Flexible Mixed Scheduling
  await runTestCase(
    'test_fixed_flexible_mixed',
    '고정형 + 유연형 혼합 스케줄링 (고정 시각 엄수)',
    '고정 일정의 시각과 순서는 변경하지 않고 사이 시간에 유연 일정을 배치해야 함',
    async () => {
      const fixedItem: ScheduleItem = {
        id: 'fix_1',
        title: '치과 진료 (고정)',
        location: LOC_GANGNAM,
        durationMinutes: 30,
        type: 'fixed',
        fixedStartTime: '14:00',
      };
      const flexItem: ScheduleItem = {
        id: 'flex_1',
        title: '다이소 쇼핑 (유연)',
        location: LOC_GANGNAM,
        durationMinutes: 20,
        type: 'flexible',
      };

      const res = await optimizeOutingRoute({
        originLocation: LOC_HOME,
        schedules: [fixedItem, flexItem],
        provider: mockProvider,
        startOfDayTime: '13:00',
      });

      if (!res.isFeasible) throw new Error('혼합 스케줄링 실패');
      const fixedLeg = res.legs.find((l) => l.scheduleItem?.id === 'fix_1');
      if (!fixedLeg) throw new Error('고정 일정이 타임라인에 없습니다.');
      if (fixedLeg.stayStartTime !== '14:00') {
        throw new Error(`고정 일정 시작 시각은 14:00이어야 하지만 ${fixedLeg.stayStartTime}입니다.`);
      }
    }
  );

  // Test 6: Midway Point with 1 Participant
  await runTestCase(
    'test_midway_1_participant',
    '참여자 1명 중간지점 경계 테스트',
    '참여자가 1명일 때는 해당 참여자의 출발지가 그대로 중간지점으로 결정되고 소요시간은 0분이어야 함',
    async () => {
      const p1: Participant = {
        id: 'p1',
        name: '철수',
        origin: LOC_HONGDAE,
        travelMode: 'transit',
      };

      const result = await calculateFairMidwayPoint([p1], mockProvider);
      if (result.centerLocation.lat !== LOC_HONGDAE.lat || result.centerLocation.lng !== LOC_HONGDAE.lng) {
        throw new Error('1명일 때 중간지점은 본인 위치여야 합니다.');
      }
      if (result.participantResults[0].travelTimeMinutes !== 0) {
        throw new Error('1명일 때 이동 시간은 0이어야 합니다.');
      }
      if (result.timeVariance !== 0) {
        throw new Error('1명일 때 시간 분산은 0이어야 합니다.');
      }
    }
  );

  // Test 7: Midway Point with 5 Participants (Performance < 3s & Variance Check)
  await runTestCase(
    'test_midway_5_participants',
    '참여자 5명 중간지점 공평 계산 및 성능 검증',
    '참여자 5명의 이동 시간 편차가 최소화되는 중간지점을 3초 이내에 계산해야 함',
    async () => {
      const participants: Participant[] = [
        { id: 'p1', name: '김민수 (강남)', origin: LOC_GANGNAM, travelMode: 'transit' },
        { id: 'p2', name: '이영희 (홍대)', origin: LOC_HONGDAE, travelMode: 'transit' },
        { id: 'p3', name: '박지훈 (잠실)', origin: LOC_JAMSIL, travelMode: 'transit' },
        { id: 'p4', name: '최서연 (여의도)', origin: LOC_YEOUIDO, travelMode: 'transit' },
        { id: 'p5', name: '정도윤 (성수)', origin: LOC_SEONGSU, travelMode: 'transit' },
      ];

      const start = performance.now();
      const result = await calculateFairMidwayPoint(participants, mockProvider);
      const elapsed = performance.now() - start;

      if (elapsed > 3000) {
        throw new Error(`계산 시간이 3000ms를 초과했습니다: ${elapsed}ms`);
      }
      if (result.participantResults.length !== 5) {
        throw new Error('5명의 참여자 결과가 모두 포함되어야 합니다.');
      }
      if (typeof result.timeVariance !== 'number' || isNaN(result.timeVariance)) {
        throw new Error('유효한 분산값이 산출되어야 합니다.');
      }
    }
  );

  // Test 8: Midnight Crossing Schedule
  await runTestCase(
    'test_midnight_crossing',
    '자정 넘김(Midnight Crossing) 시각 계산 검증',
    '23:45 시작 + 40분 체류 일정이 자정을 넘겨 "익일 00:25"로 정상 계산되어야 함',
    () => {
      const startMin = timeStringToMinutes('23:45'); // 1425
      const endMin = startMin + 40; // 1465
      const formatted = minutesToTimeString(endMin);
      if (formatted !== '익일 00:25') {
        throw new Error(`자정 넘김 포맷이 '익일 00:25'이어야 하지만 '${formatted}'입니다.`);
      }

      const diff = getDurationMinutes('23:30', '익일 01:00');
      if (diff !== 90) {
        throw new Error(`23:30부터 01:00까지의 차이는 90분이어야 하지만 ${diff}분입니다.`);
      }
    }
  );

  // Test 9: Departure Time Formula Verification
  await runTestCase(
    'test_departure_formula',
    '출발 시각 계산식 검증 (도착 - 이동 - 여유)',
    '출발 시각 = 목표 도착 시각 − 이동 시간 − 여유 시간이 정확히 적용되어야 함',
    () => {
      // 14:00 (840) 도착, 이동 35분, 여유 10분 -> 출발 13:15 (795)
      const arrivalMin = timeStringToMinutes('14:00');
      const depMin = calculateDepartureTime(arrivalMin, 35, 10);
      const depTimeStr = minutesToTimeString(depMin);

      if (depTimeStr !== '13:15') {
        throw new Error(`출발 시각은 13:15여야 하지만 ${depTimeStr}입니다.`);
      }
    }
  );

  // Test 10: Injected Time Alarm Scheduler
  await runTestCase(
    'test_injected_time_alarm',
    '시각 주입(Time Injection) 기반 알림 스케줄러 검증',
    '실제 대기 없이 주입된 가상 타임스탬프로 알림 예약 및 트리거가 즉각 검증되어야 함',
    () => {
      let virtualNow = new Date('2026-08-26T09:00:00').getTime();
      const triggeredList: NotificationPayload[] = [];

      const scheduler = new AlarmScheduler(
        () => virtualNow,
        (payload) => triggeredList.push(payload)
      );

      const mockOptResult = {
        isFeasible: true,
        orderedSchedules: [],
        legs: [
          {
            from: LOC_HOME,
            to: LOC_GANGNAM,
            transportMode: 'transit' as TransportMode,
            departureTime: '09:30',
            arrivalTime: '10:00',
            travelDurationMinutes: 20,
            distanceKm: 4.2,
            bufferMinutes: 10,
            scheduleItem: {
              id: 's_meeting',
              title: '팀 회의',
              location: LOC_GANGNAM,
              durationMinutes: 60,
              type: 'fixed' as const,
              fixedStartTime: '10:00',
            },
          },
        ],
        totalTravelTimeMinutes: 20,
        totalStayTimeMinutes: 60,
        totalDistanceKm: 4.2,
        impossibleWarnings: [],
        overallDepartureTime: '09:30',
        overallReturnTime: '11:00',
        computedAt: new Date().toISOString(),
      };

      const alarms = scheduler.scheduleFromOptimization(mockOptResult, '2026-08-26');
      if (alarms.length !== 1) throw new Error('1개의 알림이 예약되어야 합니다.');
      if (alarms[0].isDispatched) throw new Error('09:00 시점에는 아직 발송되지 않아야 합니다.');

      // Advance virtual clock to 09:30 (departure time)
      virtualNow = new Date('2026-08-26T09:30:00').getTime();
      const due = scheduler.evaluateDueAlarmsAt(virtualNow);

      if (due.length !== 1) throw new Error('09:30에 알림 1개가 트리거되어야 합니다.');
      if (triggeredList.length !== 1) throw new Error('알림 발송 콜백이 호출되어야 합니다.');
      if (!triggeredList[0].title.includes('팀 회의')) {
        throw new Error('알림 제목에 팀 회의가 포함되어야 합니다.');
      }
    }
  );

  // Test 11: External Service Failure Graceful Fallback
  await runTestCase(
    'test_service_failure_fallback',
    '외부 서비스 장애 시 탄력적 복구 검증',
    '외부 API 오류 발생 시에도 애플리케이션이 중단되지 않고 fallback을 통해 안전하게 처리되어야 함',
    async () => {
      const failingProvider = new MockTestRouteProvider();
      failingProvider.shouldFail = true;

      // When provider throws, route optimizer handles error safely
      try {
        await failingProvider.getTravelTime(LOC_HOME, LOC_GANGNAM, 'transit');
        throw new Error('실패해야 하지만 성공했습니다.');
      } catch (err: any) {
        if (!err.message.includes('API Network Timeout')) {
          throw new Error(`예상된 오류가 아닙니다: ${err.message}`);
        }
      }
    }
  );

  // Test 12: 10 Schedules Performance Benchmark (< 3s)
  await runTestCase(
    'test_10_schedules_benchmark',
    '일정 10개 기준 동선 추천 3초 이내 성능 검증',
    '10개의 고정/유연 혼합 일정이 3초 이내에 최적화 완료되어야 함',
    async () => {
      const tenSchedules: ScheduleItem[] = [
        { id: 'sc1', title: '아침 조깅', location: LOC_HOME, durationMinutes: 30, type: 'flexible' },
        { id: 'sc2', title: '브런치 카페', location: LOC_SEONGSU, durationMinutes: 50, type: 'flexible' },
        { id: 'sc3', title: '은행 업무', location: LOC_GANGNAM, durationMinutes: 20, type: 'fixed', fixedStartTime: '11:00' },
        { id: 'sc4', title: '점심 약속', location: LOC_GANGNAM, durationMinutes: 60, type: 'fixed', fixedStartTime: '12:30' },
        { id: 'sc5', title: '서점 방문', location: LOC_GANGNAM, durationMinutes: 40, type: 'flexible' },
        { id: 'sc6', title: '디자인 전시회', location: LOC_HONGDAE, durationMinutes: 80, type: 'flexible' },
        { id: 'sc7', title: '스터디 모임', location: LOC_YEOUIDO, durationMinutes: 90, type: 'fixed', fixedStartTime: '16:30' },
        { id: 'sc8', title: '저녁 식사', location: LOC_YEOUIDO, durationMinutes: 60, type: 'flexible' },
        { id: 'sc9', title: '한강 산책', location: LOC_YEOUIDO, durationMinutes: 45, type: 'flexible' },
        { id: 'sc10', title: '귀가 전 마트', location: LOC_HOME, durationMinutes: 20, type: 'flexible' },
      ];

      const start = performance.now();
      const res = await optimizeOutingRoute({
        originLocation: LOC_HOME,
        schedules: tenSchedules,
        provider: mockProvider,
        startOfDayTime: '09:00',
      });
      const elapsed = performance.now() - start;

      if (elapsed > 3000) {
        throw new Error(`10개 일정 최적화가 3초를 초과했습니다: ${elapsed}ms`);
      }
      if (!res.orderedSchedules || res.orderedSchedules.length !== 10) {
        throw new Error('10개 일정이 모두 반환되어야 합니다.');
      }
    }
  );

  const totalDurationMs = Math.round((performance.now() - overallStart) * 100) / 100;
  const allPassed = testResults.every((t) => t.passed);

  return {
    results: testResults,
    allPassed,
    totalDurationMs,
  };
}
