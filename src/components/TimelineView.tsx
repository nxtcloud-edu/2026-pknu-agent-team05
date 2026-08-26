/**
 * Step-by-Step Optimized Route Timeline View
 * Displays departures, travel legs, arrival times, activities, buffer times,
 * and prominent warnings if any fixed schedule is impossible to reach on time.
 */

import { AlertOctagon, AlertTriangle, ArrowDown, Bell, CheckCircle, Clock, Footprints, Info, MapPin, Navigation, Sparkles, Train, Utensils } from 'lucide-react';
import React from 'react';
import { OptimizationResult, RouteLeg, TransportMode } from '../types';

interface TimelineViewProps {
  optimizationResult: OptimizationResult | null;
  isOptimizing: boolean;
  onRunOptimization: () => void;
  baseOriginName: string;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  optimizationResult,
  isOptimizing,
  onRunOptimization,
  baseOriginName,
}) => {
  if (isOptimizing) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] rounded-2xl border border-stone-200 bg-white p-8 text-center">
        <Navigation className="h-8 w-8 text-amber-500 animate-spin mb-3" />
        <h3 className="text-sm font-bold text-stone-900">최적 동선 계산 중...</h3>
        <p className="text-xs text-stone-500 mt-1">
          실시간 교통 상황 반영 및 고정 일정 시간 엄수 동선을 탐색하고 있습니다.
        </p>
      </div>
    );
  }

  if (!optimizationResult || optimizationResult.legs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] rounded-2xl border border-stone-200 bg-white p-8 text-center text-stone-400">
        <Clock className="h-8 w-8 text-stone-300 mb-2" />
        <h3 className="text-xs font-bold text-stone-700">추천 동선이 준비되지 않았습니다</h3>
        <p className="text-[11px] text-stone-500 mt-1">
          일정을 등록한 후 '동선 최적화' 버튼을 눌러 최적 스케줄을 확인하세요.
        </p>
      </div>
    );
  }

  const { isFeasible, impossibleWarnings, legs, totalTravelTimeMinutes, totalDistanceKm, totalStayTimeMinutes, overallDepartureTime, overallReturnTime } =
    optimizationResult;

  const renderModeIcon = (mode: TransportMode) => {
    switch (mode) {
      case 'walking':
        return <Footprints className="h-3.5 w-3.5" />;
      case 'driving':
        return <Navigation className="h-3.5 w-3.5" />;
      case 'transit':
      default:
        return <Train className="h-3.5 w-3.5" />;
    }
  };

  const getModeLabel = (mode: TransportMode) => {
    switch (mode) {
      case 'walking':
        return '도보';
      case 'driving':
        return '자동차/택시';
      case 'transit':
      default:
        return '대중교통';
    }
  };

  return (
    <div className="flex flex-col h-full border border-[#E5E1DA] bg-[#FDFCFB] p-5 sm:p-6 shadow-xs">
      {/* Timeline Header & Summary Badge */}
      <div className="border-b border-[#E5E1DA] pb-4 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold tracking-tight text-[#1A1A1A]">
              최적화된 동선 타임라인
            </h2>
            {isFeasible ? (
              <span className="flex items-center gap-1 border border-[#2A9D8F]/30 bg-[#2A9D8F]/10 px-2 py-0.5 text-xs font-bold text-[#2A9D8F]">
                <CheckCircle className="h-3.5 w-3.5" />
                일정 검증 완료
              </span>
            ) : (
              <span className="flex items-center gap-1 border border-[#E63946] bg-[#E63946]/10 px-2 py-0.5 text-xs font-bold text-[#E63946] animate-pulse">
                <AlertOctagon className="h-3.5 w-3.5" />
                일정 시간 충돌 발생
              </span>
            )}
          </div>

          <div className="text-right">
            <span className="text-xs font-mono font-bold text-[#1A1A1A]">
              {overallDepartureTime} 출발 — {overallReturnTime} 귀가
            </span>
          </div>
        </div>

        {/* Stats Metric Strip - Editorial Style */}
        <div className="mt-3 grid grid-cols-3 gap-3 border border-[#E5E1DA] bg-[#F9F8F6] p-3 text-[#1A1A1A]">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-[#8C8273]">
              총 이동 시간
            </span>
            <span className="text-lg font-bold text-[#1A1A1A] font-mono">
              {totalTravelTimeMinutes}분
            </span>
          </div>
          <div className="flex flex-col border-l border-[#E5E1DA] pl-3">
            <span className="text-[11px] font-bold text-[#8C8273]">
              총 이동 거리
            </span>
            <span className="text-lg font-bold text-[#1A1A1A] font-mono">
              {totalDistanceKm}km
            </span>
          </div>
          <div className="flex flex-col border-l border-[#E5E1DA] pl-3">
            <span className="text-[11px] font-bold text-[#8C8273]">
              총 체류 시간
            </span>
            <span className="text-lg font-bold text-[#1A1A1A] font-mono">
              {totalStayTimeMinutes}분
            </span>
          </div>
        </div>
      </div>

      {/* Impossible Deadlines Warning Banner */}
      {!isFeasible && impossibleWarnings.length > 0 && (
        <div className="mb-4 border border-[#E63946] bg-[#FDFCFB] p-4 text-[#1A1A1A] space-y-2.5">
          <div className="flex items-center gap-2">
            <AlertOctagon className="h-4 w-4 text-[#E63946] shrink-0" />
            <h4 className="text-xs font-bold text-[#E63946]">
              경고: 제시간 도착 불가 일정 감지
            </h4>
          </div>
          <div className="space-y-1.5 text-xs">
            {impossibleWarnings.map((warn, idx) => (
              <div key={idx} className="border-l-2 border-[#E63946] bg-[#F9F8F6] p-2 pl-3">
                <p className="font-semibold text-[#1A1A1A]">
                  ⚠️ [{warn.scheduleTitle}] 목표 도착: {warn.requiredArrival} / 예상 최단 도착: {warn.earliestPossibleArrival} ({warn.delayMinutes}분 지연)
                </p>
                <p className="text-[11px] text-[#8C8273] mt-0.5">{warn.reason}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#8C8273]">
            💡 <strong>해결 팁:</strong> 이전 경유지의 체류 시간을 줄이거나 고정 일정의 시작 시각을 뒤로 조정해 보세요.
          </p>
        </div>
      )}

      {/* Step-by-Step Leg Cards */}
      <div className="space-y-3 flex-1 overflow-y-auto pr-1">
        {legs.map((leg, idx) => {
          const isReturnLeg = !leg.scheduleItem;
          const schedule = leg.scheduleItem;
          const isFixed = schedule?.type === 'fixed';

          return (
            <div key={idx} className="relative pl-7 pb-2">
              {/* Vertical connector line */}
              {idx < legs.length - 1 && (
                <div className="absolute left-[13px] top-6 bottom-0 w-[1px] bg-[#E5E1DA]" />
              )}

              {/* Step indicator dot */}
              <div
                className={`absolute left-0 top-1 flex h-6 w-6 items-center justify-center text-[10px] font-mono font-bold ${
                  isReturnLeg
                    ? 'border border-[#E5E1DA] bg-[#F9F8F6] text-[#8C8273]'
                    : isFixed
                    ? 'border border-[#E63946] bg-[#E63946] text-white'
                    : 'border border-[#1A1A1A] bg-[#1A1A1A] text-white'
                }`}
              >
                {idx + 1}
              </div>

              {/* Step Content Box */}
              <div className="border border-[#E5E1DA] bg-white p-3.5 shadow-2xs">
                {/* Movement / Transit Header */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 border border-[#E5E1DA] bg-[#F9F8F6] px-2 py-0.5 font-bold text-[#1A1A1A] text-xs">
                      {renderModeIcon(leg.transportMode)}
                      <span>{getModeLabel(leg.transportMode)}</span>
                    </span>
                    <span className="font-mono text-xs text-[#1A1A1A]">
                      {leg.travelDurationMinutes}분 이동 ({leg.distanceKm}km)
                    </span>
                  </div>

                  {/* Departure time pill */}
                  <div className="flex items-center gap-1 text-xs font-mono font-bold bg-[#1A1A1A] text-white px-2 py-0.5">
                    <Bell className="h-3 w-3 text-[#E63946]" />
                    <span>{leg.departureTime} 출발</span>
                  </div>
                </div>

                {/* Route Leg endpoints */}
                <div className="mt-2.5 flex items-center gap-1.5 text-xs text-[#1A1A1A]">
                  <span className="truncate max-w-[130px] text-[#8C8273]">{leg.from.name}</span>
                  <span className="text-[#B5AFA2]">➔</span>
                  <span className="truncate max-w-[150px] font-bold text-[#1A1A1A]">{leg.to.name}</span>
                  <span className="text-[#8C8273] ml-auto font-mono text-xs">{leg.arrivalTime} 도착</span>
                </div>

                {/* Formula breakdown caption */}
                <div className="mt-1 text-[11px] text-[#8C8273] font-mono">
                  도착 목표 {isFixed ? schedule?.fixedStartTime : leg.arrivalTime} − 이동 {leg.travelDurationMinutes}분 − 여유 {leg.bufferMinutes}분 = <strong className="text-[#1A1A1A]">{leg.departureTime} 출발</strong>
                </div>

                {/* If Activity / Stay */}
                {schedule && (
                  <div
                    className={`mt-2.5 border-l-2 p-3 ${
                      isFixed ? 'border-l-[#E63946] bg-[#F9F8F6]' : 'border-l-[#1A1A1A] bg-[#F9F8F6]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold ${
                            isFixed ? 'text-[#E63946]' : 'text-[#8C8273]'
                          }`}
                        >
                          {isFixed ? '고정 일정' : '유연 일정'}
                        </span>
                        <h4 className="text-xs font-bold text-[#1A1A1A] truncate">
                          {schedule.title}
                        </h4>
                      </div>
                      <span className="text-xs font-mono font-semibold text-[#1A1A1A]">
                        {leg.stayStartTime} ~ {leg.stayEndTime} ({schedule.durationMinutes}분)
                      </span>
                    </div>

                    {schedule.notes && (
                      <p className="mt-1 text-xs text-[#8C8273]">
                        메모: {schedule.notes}
                      </p>
                    )}
                  </div>
                )}

                {/* If Return Home leg */}
                {isReturnLeg && (
                  <div className="mt-2.5 border border-[#E5E1DA] bg-[#F9F8F6] p-2 text-center text-xs font-bold text-[#1A1A1A]">
                    🏠 귀가 완료 ({leg.arrivalTime})
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
