/**
 * Fair Midway Point Calculator
 * Calculates the optimal geographic midpoint among participants that minimizes
 * the variance (disparity) and maximum difference of individual travel times.
 */

import { DEFAULT_APP_CONFIG } from '../config/appConfig';
import { calculateHaversineDistance, IRouteServiceProvider, defaultRouteServiceProvider } from '../services/routeServiceBoundary';
import { Location, MidwayCalculationResult, Participant, TransportMode } from '../types';

/**
 * Computes the fair midway location for a list of participants.
 * Fully synchronous core evaluation with async provider support.
 */
export async function calculateFairMidwayPoint(
  participants: Participant[],
  provider: IRouteServiceProvider = defaultRouteServiceProvider
): Promise<MidwayCalculationResult> {
  const startTime = performance.now();

  // Edge case 1: 0 participants
  if (!participants || participants.length === 0) {
    return {
      centerLocation: {
        name: DEFAULT_APP_CONFIG.defaultOrigin.name,
        address: DEFAULT_APP_CONFIG.defaultOrigin.address,
        lat: DEFAULT_APP_CONFIG.defaultOrigin.lat,
        lng: DEFAULT_APP_CONFIG.defaultOrigin.lng,
      },
      participantResults: [],
      timeVariance: 0,
      timeStandardDeviation: 0,
      maxTimeDiffMinutes: 0,
      computationTimeMs: Math.round(performance.now() - startTime),
    };
  }

  // Edge case 2: Exactly 1 participant -> their origin is the optimal midpoint
  if (participants.length === 1) {
    const p = participants[0];
    return {
      centerLocation: {
        name: p.origin.name || `${p.name}님의 출발지`,
        address: p.origin.address || '',
        lat: p.origin.lat,
        lng: p.origin.lng,
      },
      participantResults: [
        {
          participant: p,
          travelTimeMinutes: 0,
          distanceKm: 0,
        },
      ],
      timeVariance: 0,
      timeStandardDeviation: 0,
      maxTimeDiffMinutes: 0,
      computationTimeMs: Math.round(performance.now() - startTime),
    };
  }

  // Calculate geometric centroid as the initial baseline
  let sumLat = 0;
  let sumLng = 0;
  for (const p of participants) {
    sumLat += p.origin.lat;
    sumLng += p.origin.lng;
  }
  const centroidLat = sumLat / participants.length;
  const centroidLng = sumLng / participants.length;

  // Search grid around centroid to minimize travel time variance
  // We evaluate 25 candidate points in a concentric grid
  const candidateOffsets = [
    { dLat: 0, dLng: 0 },
    { dLat: 0.005, dLng: 0 },
    { dLat: -0.005, dLng: 0 },
    { dLat: 0, dLng: 0.005 },
    { dLat: 0, dLng: -0.005 },
    { dLat: 0.0035, dLng: 0.0035 },
    { dLat: -0.0035, dLng: 0.0035 },
    { dLat: 0.0035, dLng: -0.0035 },
    { dLat: -0.0035, dLng: -0.0035 },
    { dLat: 0.01, dLng: 0 },
    { dLat: -0.01, dLng: 0 },
    { dLat: 0, dLng: 0.01 },
    { dLat: 0, dLng: -0.01 },
  ];

  let bestCenter = { lat: centroidLat, lng: centroidLng };
  let minObjectiveScore = Infinity;

  // Objective function: Minimize (Variance of Travel Times) + 0.5 * (Max Travel Time)
  for (const offset of candidateOffsets) {
    const testLat = centroidLat + offset.dLat;
    const testLng = centroidLng + offset.dLng;

    const times: number[] = [];
    for (const p of participants) {
      const mode: TransportMode = p.travelMode || 'transit';
      const distKm = calculateHaversineDistance(p.origin.lat, p.origin.lng, testLat, testLng);
      // Fast heuristic estimate for grid search
      const speed = DEFAULT_APP_CONFIG.speedsKmH[mode];
      const timeMin = Math.ceil((distKm * 1.35 / speed) * 60) + (mode === 'transit' ? 6 : 0);
      times.push(timeMin);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const variance = times.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / times.length;
    const maxTime = Math.max(...times);
    const score = variance + maxTime * 0.4;

    if (score < minObjectiveScore) {
      minObjectiveScore = score;
      bestCenter = { lat: testLat, lng: testLng };
    }
  }

  // Reverse geocode or create meaningful label for the best center
  const centerLocation: Location = {
    name: '약속 중간지점 (공평 소요시간)',
    address: `위도 ${bestCenter.lat.toFixed(4)}, 경도 ${bestCenter.lng.toFixed(4)}`,
    lat: bestCenter.lat,
    lng: bestCenter.lng,
  };

  // Now calculate precise travel times for all participants using the provider
  const participantResults = await Promise.all(
    participants.map(async (p) => {
      const mode: TransportMode = p.travelMode || 'transit';
      const route = await provider.getTravelTime(p.origin, centerLocation, mode);
      return {
        participant: p,
        travelTimeMinutes: route.durationMinutes,
        distanceKm: route.distanceKm,
      };
    })
  );

  const finalTimes = participantResults.map((r) => r.travelTimeMinutes);
  const avgTime = finalTimes.reduce((a, b) => a + b, 0) / finalTimes.length;
  const variance =
    finalTimes.reduce((sum, t) => sum + Math.pow(t - avgTime, 2), 0) / finalTimes.length;
  const stdDev = Math.round(Math.sqrt(variance) * 10) / 10;
  const maxDiff = Math.max(...finalTimes) - Math.min(...finalTimes);

  const computationTimeMs = Math.round(performance.now() - startTime);

  return {
    centerLocation,
    participantResults,
    timeVariance: Math.round(variance * 10) / 10,
    timeStandardDeviation: stdDev,
    maxTimeDiffMinutes: maxDiff,
    computationTimeMs,
  };
}
