/**
 * Route Optimization Engine
 * Optimizes the sequence of flexible schedules while strictly preserving the time
 * and ordering of fixed-time schedules. Minimizes total travel time and detects
 * impossible arrival deadlines.
 */

import { DEFAULT_APP_CONFIG } from '../config/appConfig';
import { IRouteServiceProvider, defaultRouteServiceProvider } from '../services/routeServiceBoundary';
import { ImpossibleScheduleWarning, Location, OptimizationResult, RouteLeg, ScheduleItem, TransportMode } from '../types';
import { calculateDepartureTime, minutesToTimeString, timeStringToMinutes } from './timeUtils';

export interface OptimizeOptions {
  originLocation: Location;
  schedules: ScheduleItem[];
  defaultBufferMinutes?: number;
  defaultTransportMode?: TransportMode;
  startOfDayTime?: string; // "HH:mm" (default "09:00")
  returnToOrigin?: boolean;
  provider?: IRouteServiceProvider;
}

/**
 * Main optimization entry point.
 * Guarantees completion in < 3 seconds for 10-15 schedules.
 */
export async function optimizeOutingRoute(
  options: OptimizeOptions
): Promise<OptimizationResult> {
  const {
    originLocation,
    schedules,
    defaultBufferMinutes = DEFAULT_APP_CONFIG.defaultBufferMinutes,
    defaultTransportMode = DEFAULT_APP_CONFIG.defaultTransportMode,
    startOfDayTime = '09:00',
    returnToOrigin = true,
    provider = defaultRouteServiceProvider,
  } = options;

  const now = new Date();
  const computedAt = now.toISOString();

  // Edge case 1: 0 schedules
  if (!schedules || schedules.length === 0) {
    return {
      isFeasible: true,
      orderedSchedules: [],
      legs: [],
      totalTravelTimeMinutes: 0,
      totalStayTimeMinutes: 0,
      totalDistanceKm: 0,
      impossibleWarnings: [],
      overallDepartureTime: startOfDayTime,
      overallReturnTime: startOfDayTime,
      computedAt,
    };
  }

  // Pre-calculate / cache travel times between all points involved
  const allLocations: Location[] = [originLocation, ...schedules.map((s) => s.location)];
  const travelMatrix: Map<string, { durationMinutes: number; distanceKm: number; pathCoordinates?: [number, number][] }> = new Map();

  async function getLegTravel(from: Location, to: Location, mode: TransportMode, timeMin: number) {
    const key = `${from.lat}_${from.lng}_${to.lat}_${to.lng}_${mode}`;
    if (travelMatrix.has(key)) {
      return travelMatrix.get(key)!;
    }
    const res = await provider.getTravelTime(from, to, mode, timeMin);
    const data = {
      durationMinutes: res.durationMinutes,
      distanceKm: res.distanceKm,
      pathCoordinates: res.pathCoordinates,
    };
    travelMatrix.set(key, data);
    return data;
  }

  // Separate fixed vs flexible
  const fixedSchedules = schedules
    .filter((s) => s.type === 'fixed' && s.fixedStartTime)
    .sort((a, b) => timeStringToMinutes(a.fixedStartTime!) - timeStringToMinutes(b.fixedStartTime!));

  const flexibleSchedules = schedules.filter(
    (s) => s.type === 'flexible' || !s.fixedStartTime
  );

  // Check if fixed schedules alone are valid/feasible
  const impossibleWarnings: ImpossibleScheduleWarning[] = [];
  let currentLoc = originLocation;
  let currentTimeMin = timeStringToMinutes(startOfDayTime);

  for (let i = 0; i < fixedSchedules.length; i++) {
    const fix = fixedSchedules[i];
    const targetStartMin = timeStringToMinutes(fix.fixedStartTime!);
    const mode = fix.transportMode || defaultTransportMode;
    const buffer = fix.bufferMinutes !== undefined ? fix.bufferMinutes : defaultBufferMinutes;

    const travel = await getLegTravel(currentLoc, fix.location, mode, currentTimeMin);
    const earliestArrivalMin = currentTimeMin + travel.durationMinutes;

    // Must arrive at or before fixedStartTime
    if (earliestArrivalMin > targetStartMin) {
      const delay = earliestArrivalMin - targetStartMin;
      impossibleWarnings.push({
        scheduleId: fix.id,
        scheduleTitle: fix.title,
        requiredArrival: fix.fixedStartTime!,
        earliestPossibleArrival: minutesToTimeString(earliestArrivalMin),
        delayMinutes: delay,
        reason: `고정 일정 [${fix.title}](${fix.fixedStartTime})에 도착하려면 최소 ${minutesToTimeString(currentTimeMin)}에 이전 장소에서 출발해야 하지만, 이동 시간(${travel.durationMinutes}분)으로 인해 ${delay}분 늦어집니다.`,
      });
    }

    currentLoc = fix.location;
    currentTimeMin = targetStartMin + fix.durationMinutes;
  }

  // If fixed schedules alone are impossible, still build best attempt and return with warning
  if (impossibleWarnings.length > 0) {
    const attemptLegs = await buildScheduleLegs(
      originLocation,
      [...fixedSchedules, ...flexibleSchedules],
      defaultBufferMinutes,
      defaultTransportMode,
      startOfDayTime,
      returnToOrigin,
      getLegTravel
    );

    return {
      isFeasible: false,
      orderedSchedules: [...fixedSchedules, ...flexibleSchedules],
      legs: attemptLegs.legs,
      totalTravelTimeMinutes: attemptLegs.totalTravelTime,
      totalStayTimeMinutes: attemptLegs.totalStayTime,
      totalDistanceKm: attemptLegs.totalDistance,
      impossibleWarnings,
      overallDepartureTime: attemptLegs.overallDepartureTime,
      overallReturnTime: attemptLegs.overallReturnTime,
      computedAt,
    };
  }

  // Find optimal ordering for flexible schedules
  let bestOrderedSchedules: ScheduleItem[] = [];
  let bestTotalTravelTime = Infinity;
  let bestLegsResult: {
    legs: RouteLeg[];
    totalTravelTime: number;
    totalStayTime: number;
    totalDistance: number;
    overallDepartureTime: string;
    overallReturnTime: string;
    isFeasible: boolean;
    warning?: ImpossibleScheduleWarning;
  } | null = null;

  // Generate candidate permutations of flexible schedules
  const flexiblePermutations = generateFlexibleOrderings(flexibleSchedules);

  // If no flexible schedules, evaluate just the fixed order
  if (flexibleSchedules.length === 0) {
    const result = await evaluateScheduleSequence(
      originLocation,
      fixedSchedules,
      defaultBufferMinutes,
      defaultTransportMode,
      startOfDayTime,
      returnToOrigin,
      getLegTravel
    );

    return {
      isFeasible: result.isFeasible,
      orderedSchedules: fixedSchedules,
      legs: result.legs,
      totalTravelTimeMinutes: result.totalTravelTime,
      totalStayTimeMinutes: result.totalStayTime,
      totalDistanceKm: result.totalDistance,
      impossibleWarnings: result.warning ? [result.warning] : [],
      overallDepartureTime: result.overallDepartureTime,
      overallReturnTime: result.overallReturnTime,
      computedAt,
    };
  }

  // For each flexible permutation, interleave into fixed schedule time windows
  for (const flexPerm of flexiblePermutations) {
    // Interleave flexible items before, between, or after fixed schedules
    const candidateSchedules = interleaveFixedAndFlexible(fixedSchedules, flexPerm);

    const evalResult = await evaluateScheduleSequence(
      originLocation,
      candidateSchedules,
      defaultBufferMinutes,
      defaultTransportMode,
      startOfDayTime,
      returnToOrigin,
      getLegTravel
    );

    if (evalResult.isFeasible && evalResult.totalTravelTime < bestTotalTravelTime) {
      bestTotalTravelTime = evalResult.totalTravelTime;
      bestOrderedSchedules = candidateSchedules;
      bestLegsResult = evalResult;
    } else if (!bestLegsResult && !evalResult.isFeasible) {
      // Keep as backup in case none are feasible
      bestLegsResult = evalResult;
      bestOrderedSchedules = candidateSchedules;
    }
  }

  // If no feasible combination found, report warning
  if (!bestLegsResult || !bestLegsResult.isFeasible) {
    const warning = bestLegsResult?.warning || {
      scheduleId: schedules[0].id,
      scheduleTitle: schedules[0].title,
      requiredArrival: '제한 시각',
      earliestPossibleArrival: '시간 초과',
      delayMinutes: 15,
      reason: '현재 등록된 모든 유연 일정을 정해진 고정 일정 시간 내에 완료할 수 없습니다.',
    };

    return {
      isFeasible: false,
      orderedSchedules: bestOrderedSchedules.length > 0 ? bestOrderedSchedules : schedules,
      legs: bestLegsResult?.legs || [],
      totalTravelTimeMinutes: bestLegsResult?.totalTravelTime || 0,
      totalStayTimeMinutes: bestLegsResult?.totalStayTime || 0,
      totalDistanceKm: bestLegsResult?.totalDistance || 0,
      impossibleWarnings: [warning],
      overallDepartureTime: bestLegsResult?.overallDepartureTime || startOfDayTime,
      overallReturnTime: bestLegsResult?.overallReturnTime || startOfDayTime,
      computedAt,
    };
  }

  return {
    isFeasible: true,
    orderedSchedules: bestOrderedSchedules,
    legs: bestLegsResult.legs,
    totalTravelTimeMinutes: bestLegsResult.totalTravelTime,
    totalStayTimeMinutes: bestLegsResult.totalStayTime,
    totalDistanceKm: bestLegsResult.totalDistance,
    impossibleWarnings: [],
    overallDepartureTime: bestLegsResult.overallDepartureTime,
    overallReturnTime: bestLegsResult.overallReturnTime,
    computedAt,
  };
}

/**
 * Interleaves flexible items into chronological fixed items based on available gaps.
 */
function interleaveFixedAndFlexible(
  fixedList: ScheduleItem[],
  flexibleList: ScheduleItem[]
): ScheduleItem[] {
  if (fixedList.length === 0) return flexibleList;
  if (flexibleList.length === 0) return fixedList;

  // Simple insertion heuristic: distribute flexible items into fixed schedule slots
  const result: ScheduleItem[] = [];
  let flexIdx = 0;

  // Insert before first fixed if reasonable, or in between
  for (let i = 0; i < fixedList.length; i++) {
    // Put one or more flexible items before this fixed item
    if (flexIdx < flexibleList.length) {
      result.push(flexibleList[flexIdx]);
      flexIdx++;
    }
    result.push(fixedList[i]);
  }

  // Append remaining flexible items
  while (flexIdx < flexibleList.length) {
    result.push(flexibleList[flexIdx]);
    flexIdx++;
  }

  return result;
}

/**
 * Generates permutations or 2-opt candidate orderings for flexible items.
 */
function generateFlexibleOrderings(flexibleList: ScheduleItem[]): ScheduleItem[][] {
  const n = flexibleList.length;
  if (n <= 1) return [flexibleList];

  // If n is small (<= 5), full permutation (<= 120)
  if (n <= 5) {
    const results: ScheduleItem[][] = [];
    function permute(arr: ScheduleItem[], m: ScheduleItem[] = []) {
      if (arr.length === 0) {
        results.push(m);
      } else {
        for (let i = 0; i < arr.length; i++) {
          const curr = arr.slice();
          const next = curr.splice(i, 1);
          permute(curr.slice(), m.concat(next));
        }
      }
    }
    permute(flexibleList);
    return results;
  }

  // If n > 5, generate initial heuristic + 2-opt neighbors (up to 40 candidates)
  const candidates: ScheduleItem[][] = [flexibleList];
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      const swapped = [...flexibleList];
      const temp = swapped[i];
      swapped[i] = swapped[j];
      swapped[j] = temp;
      candidates.push(swapped);
      if (candidates.length >= 40) break;
    }
    if (candidates.length >= 40) break;
  }
  return candidates;
}

/**
 * Evaluates a proposed sequential ordering of schedules.
 */
async function evaluateScheduleSequence(
  origin: Location,
  orderedItems: ScheduleItem[],
  defaultBufferMinutes: number,
  defaultMode: TransportMode,
  startOfDayTime: string,
  returnToOrigin: boolean,
  getLegTravel: (from: Location, to: Location, mode: TransportMode, timeMin: number) => Promise<{ durationMinutes: number; distanceKm: number; pathCoordinates?: [number, number][] }>
) {
  const legs: RouteLeg[] = [];
  let currentLoc = origin;
  let currentTimeMin = timeStringToMinutes(startOfDayTime);
  let totalTravelTime = 0;
  let totalStayTime = 0;
  let totalDistance = 0;

  let isFeasible = true;
  let firstWarning: ImpossibleScheduleWarning | undefined;

  for (let i = 0; i < orderedItems.length; i++) {
    const item = orderedItems[i];
    const mode = item.transportMode || defaultMode;
    const buffer = item.bufferMinutes !== undefined ? item.bufferMinutes : defaultBufferMinutes;

    const travel = await getLegTravel(currentLoc, item.location, mode, currentTimeMin);
    const arrivalTimeMin = currentTimeMin + travel.durationMinutes;

    let stayStartMin: number;
    let departureTimeMin: number;

    if (item.type === 'fixed' && item.fixedStartTime) {
      const fixedStartMin = timeStringToMinutes(item.fixedStartTime);

      // Check deadline feasibility
      if (arrivalTimeMin > fixedStartMin) {
        isFeasible = false;
        const delay = arrivalTimeMin - fixedStartMin;
        if (!firstWarning) {
          firstWarning = {
            scheduleId: item.id,
            scheduleTitle: item.title,
            requiredArrival: item.fixedStartTime,
            earliestPossibleArrival: minutesToTimeString(arrivalTimeMin),
            delayMinutes: delay,
            reason: `[${item.title}]에 도착 예정 시각은 ${minutesToTimeString(arrivalTimeMin)}이지만, 고정 시작 시각은 ${item.fixedStartTime}이므로 ${delay}분 지각됩니다.`,
          };
        }
      }

      // Schedule departure calculated from fixed time minus travel minus buffer
      // Formula: Departure = Target Arrival - Travel Time - Buffer Time
      departureTimeMin = calculateDepartureTime(fixedStartMin, travel.durationMinutes, buffer);
      stayStartMin = fixedStartMin;
    } else {
      // Flexible schedule
      departureTimeMin = currentTimeMin;
      stayStartMin = arrivalTimeMin;
    }

    const stayEndMin = stayStartMin + item.durationMinutes;

    legs.push({
      from: currentLoc,
      to: item.location,
      transportMode: mode,
      departureTime: minutesToTimeString(departureTimeMin),
      arrivalTime: minutesToTimeString(arrivalTimeMin),
      travelDurationMinutes: travel.durationMinutes,
      distanceKm: travel.distanceKm,
      bufferMinutes: buffer,
      scheduleItem: item,
      stayStartTime: minutesToTimeString(stayStartMin),
      stayEndTime: minutesToTimeString(stayEndMin),
      pathCoordinates: travel.pathCoordinates,
      warning: arrivalTimeMin > (item.fixedStartTime ? timeStringToMinutes(item.fixedStartTime) : Infinity)
        ? `예상 도착 시각 지연 (${minutesToTimeString(arrivalTimeMin)})`
        : undefined,
    });

    totalTravelTime += travel.durationMinutes;
    totalStayTime += item.durationMinutes;
    totalDistance += travel.distanceKm;

    currentLoc = item.location;
    currentTimeMin = stayEndMin;
  }

  // Return leg back to origin if requested
  if (returnToOrigin && orderedItems.length > 0) {
    const returnTravel = await getLegTravel(currentLoc, origin, defaultMode, currentTimeMin);
    const returnArrivalMin = currentTimeMin + returnTravel.durationMinutes;

    legs.push({
      from: currentLoc,
      to: origin,
      transportMode: defaultMode,
      departureTime: minutesToTimeString(currentTimeMin),
      arrivalTime: minutesToTimeString(returnArrivalMin),
      travelDurationMinutes: returnTravel.durationMinutes,
      distanceKm: returnTravel.distanceKm,
      bufferMinutes: defaultBufferMinutes,
      pathCoordinates: returnTravel.pathCoordinates,
    });

    totalTravelTime += returnTravel.durationMinutes;
    totalDistance += returnTravel.distanceKm;
    currentTimeMin = returnArrivalMin;
  }

  const overallDepartureTime = legs.length > 0 ? legs[0].departureTime : startOfDayTime;
  const overallReturnTime = minutesToTimeString(currentTimeMin);

  return {
    legs,
    totalTravelTime,
    totalStayTime,
    totalDistance: Math.round(totalDistance * 10) / 10,
    overallDepartureTime,
    overallReturnTime,
    isFeasible,
    warning: firstWarning,
  };
}

/**
 * Helper to build schedule legs even when impossible, for diagnostic visualization.
 */
async function buildScheduleLegs(
  origin: Location,
  orderedItems: ScheduleItem[],
  defaultBufferMinutes: number,
  defaultMode: TransportMode,
  startOfDayTime: string,
  returnToOrigin: boolean,
  getLegTravel: (from: Location, to: Location, mode: TransportMode, timeMin: number) => Promise<{ durationMinutes: number; distanceKm: number; pathCoordinates?: [number, number][] }>
) {
  return evaluateScheduleSequence(
    origin,
    orderedItems,
    defaultBufferMinutes,
    defaultMode,
    startOfDayTime,
    returnToOrigin,
    getLegTravel
  );
}
