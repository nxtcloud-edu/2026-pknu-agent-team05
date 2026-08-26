/**
 * Meeting Midway Calculator & Place Recommender Modal
 * Computes fair midpoint among multiple participants minimizing travel disparity
 * and searches nearby curated cafe / restaurant / bakery candidates.
 */

import { AlertCircle, Check, CheckCircle2, ChevronRight, Clock, Coffee, Filter, MapPin, Plus, Sparkles, Trash2, Users, Utensils, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { DEFAULT_APP_CONFIG } from '../config/appConfig';
import { defaultRouteServiceProvider, KOREAN_LOCATION_PRESETS } from '../services/routeServiceBoundary';
import { Location, MidwayCalculationResult, Participant, PlaceCandidate, ScheduleItem, TransportMode } from '../types';
import { calculateFairMidwayPoint } from '../utils/midwayCalculator';

interface MeetingMidwayModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: ScheduleItem | null;
  onConfirmPlace: (scheduleId: string, confirmedLocation: Location, participants: Participant[]) => void;
}

export const MeetingMidwayModal: React.FC<MeetingMidwayModalProps> = ({
  isOpen,
  onClose,
  schedule,
  onConfirmPlace,
}) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [selectedPresetLoc, setSelectedPresetLoc] = useState<Location>(KOREAN_LOCATION_PRESETS[0]);
  const [customLocQuery, setCustomLocQuery] = useState('');
  const [isSearchingLoc, setIsSearchingLoc] = useState(false);
  const [searchedLocations, setSearchedLocations] = useState<Location[]>([]);

  // Calculation state
  const [isCalculating, setIsCalculating] = useState(false);
  const [midwayResult, setMidwayResult] = useState<MidwayCalculationResult | null>(null);
  const [placeCandidates, setPlaceCandidates] = useState<PlaceCandidate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'cafe' | 'restaurant' | 'bakery' | 'pub'>('all');
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [chosenPlaceId, setChosenPlaceId] = useState<string | null>(null);

  useEffect(() => {
    if (schedule) {
      if (schedule.participants && schedule.participants.length > 0) {
        setParticipants(schedule.participants);
      } else {
        // Default sample participants for immediate easy setup
        setParticipants([
          { id: 'p_me', name: '나 (본인)', origin: DEFAULT_APP_CONFIG.defaultOrigin, travelMode: 'transit' },
          { id: 'p_2', name: '김민수', origin: KOREAN_LOCATION_PRESETS[1], travelMode: 'transit' }, // Hongdae
          { id: 'p_3', name: '이영희', origin: KOREAN_LOCATION_PRESETS[4], travelMode: 'transit' }, // Jamsil
        ]);
      }
      setMidwayResult(null);
      setPlaceCandidates([]);
      setChosenPlaceId(null);
    }
  }, [schedule, isOpen]);

  if (!isOpen || !schedule) return null;

  const handleAddParticipant = () => {
    if (!newParticipantName.trim()) return;

    const newP: Participant = {
      id: `p_${Date.now()}`,
      name: newParticipantName.trim(),
      origin: selectedPresetLoc,
      travelMode: 'transit',
    };

    const updated = [...participants, newP];
    setParticipants(updated);
    setNewParticipantName('');
    setMidwayResult(null);
  };

  const handleRemoveParticipant = (id: string) => {
    const updated = participants.filter((p) => p.id !== id);
    setParticipants(updated);
    setMidwayResult(null);
  };

  const handleCustomLocSearch = async () => {
    if (!customLocQuery.trim()) return;
    setIsSearchingLoc(true);
    try {
      const res = await defaultRouteServiceProvider.geocode(customLocQuery);
      setSearchedLocations(res);
    } catch {
      setSearchedLocations([]);
    } finally {
      setIsSearchingLoc(false);
    }
  };

  const handleCalculate = async () => {
    if (participants.length === 0) return;
    setIsCalculating(true);
    setIsLoadingPlaces(true);

    try {
      // 1. Calculate Fair Midway Point
      const result = await calculateFairMidwayPoint(participants, defaultRouteServiceProvider);
      setMidwayResult(result);

      // 2. Fetch curated nearby candidates around midway point
      const places = await defaultRouteServiceProvider.searchPlaces(
        result.centerLocation,
        DEFAULT_APP_CONFIG.searchRadiusMeters,
        selectedCategory
      );
      setPlaceCandidates(places);
    } catch (err) {
      console.error('Midway calculation error:', err);
    } finally {
      setIsCalculating(false);
      setIsLoadingPlaces(false);
    }
  };

  const handleCategoryChange = async (cat: 'all' | 'cafe' | 'restaurant' | 'bakery' | 'pub') => {
    setSelectedCategory(cat);
    if (!midwayResult) return;
    setIsLoadingPlaces(true);
    try {
      const places = await defaultRouteServiceProvider.searchPlaces(
        midwayResult.centerLocation,
        DEFAULT_APP_CONFIG.searchRadiusMeters,
        cat
      );
      setPlaceCandidates(places);
    } catch (err) {
      console.error('Place search error:', err);
    } finally {
      setIsLoadingPlaces(false);
    }
  };

  const handleConfirmSelectedPlace = (candidate: PlaceCandidate) => {
    const confirmedLocation: Location = {
      name: candidate.name,
      address: candidate.address,
      lat: candidate.lat,
      lng: candidate.lng,
      category: candidate.category,
    };

    setChosenPlaceId(candidate.id);
    onConfirmPlace(schedule.id, confirmedLocation, participants);
    onClose();
  };

  const handleConfirmCenterDirectly = () => {
    if (!midwayResult) return;
    onConfirmPlace(schedule.id, midwayResult.centerLocation, participants);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="flex flex-col w-full max-w-3xl max-h-[92vh] border border-[#E5E1DA] bg-[#FDFCFB] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E5E1DA] bg-[#F9F8F6] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center border border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-xs">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-[#1A1A1A]">
                약속 중간지점 계산 & 주변 장소 추천
              </h2>
              <p className="text-[11px] text-[#8C8273] font-medium">
                일정: <span className="font-bold text-[#1A1A1A]">{schedule.title}</span> | 모든 참여자의 이동 시간 편차를 최소화하는 공평 지점 도출
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#8C8273] hover:text-[#1A1A1A] hover:bg-[#E5E1DA]/40 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content - Dual Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-y-auto divide-y md:divide-y-0 md:divide-x divide-[#E5E1DA]">
          {/* Left Column: Participants Management (5 cols) */}
          <div className="p-5 md:col-span-5 space-y-4 bg-[#F9F8F6]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#1A1A1A]">
                  참여자 목록 ({participants.length}명)
                </span>
                <span className="text-[11px] text-[#8C8273]">출발지 설정</span>
              </div>

              {/* Participant Cards */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {participants.map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between border border-[#E5E1DA] bg-white p-3 shadow-2xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="flex h-4 w-4 items-center justify-center font-mono text-[10px] font-bold bg-[#1A1A1A] text-white">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-[#1A1A1A] truncate">
                          {p.name}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-[#8C8273] truncate">
                        <MapPin className="h-3 w-3 text-[#B5AFA2] shrink-0" />
                        <span className="truncate">{p.origin.name}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveParticipant(p.id)}
                      disabled={participants.length <= 1}
                      className="ml-2 p-1 text-[#8C8273] hover:text-[#E63946] disabled:opacity-30 transition-colors"
                      title="참여자 삭제"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Participant Input Section */}
            <div className="border border-[#E5E1DA] bg-white p-3.5 space-y-2.5 shadow-2xs">
              <span className="block text-xs font-bold text-[#1A1A1A]">
                + 참여자 추가
              </span>
              <input
                type="text"
                placeholder="참여자 이름 (예: 박지훈)"
                value={newParticipantName}
                onChange={(e) => setNewParticipantName(e.target.value)}
                className="w-full border border-[#E5E1DA] bg-white px-2.5 py-1.5 text-xs text-[#1A1A1A] focus:border-[#1A1A1A] focus:outline-none"
              />

              {/* Quick Origin Preset selection */}
              <div className="space-y-1">
                <span className="text-[11px] text-[#8C8273] font-bold">출발지 선택:</span>
                <select
                  value={selectedPresetLoc.name}
                  onChange={(e) => {
                    const found = KOREAN_LOCATION_PRESETS.find((p) => p.name === e.target.value);
                    if (found) setSelectedPresetLoc(found);
                  }}
                  className="w-full border border-[#E5E1DA] bg-white px-2 py-1.5 text-xs text-[#1A1A1A] focus:border-[#1A1A1A] focus:outline-none"
                >
                  {KOREAN_LOCATION_PRESETS.map((p, idx) => (
                    <option key={idx} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleAddParticipant}
                disabled={!newParticipantName.trim()}
                className="flex w-full items-center justify-center gap-1.5 border border-[#1A1A1A] bg-[#1A1A1A] py-1.5 text-xs font-bold text-white hover:bg-stone-800 disabled:bg-[#E5E1DA] disabled:text-[#8C8273] disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>참여자 등록</span>
              </button>
            </div>

            {/* Action Trigger Button */}
            <button
              type="button"
              onClick={handleCalculate}
              disabled={isCalculating || participants.length === 0}
              className="flex w-full items-center justify-center gap-2 border border-[#1A1A1A] bg-[#1A1A1A] py-3 text-xs font-bold text-white shadow-xs hover:bg-stone-800 active:scale-98 disabled:opacity-50 transition-all"
            >
              <Sparkles className={`h-4 w-4 text-[#E63946] ${isCalculating ? 'animate-spin' : ''}`} />
              <span>
                {isCalculating ? '중간지점 계산 중...' : '중간지점 계산 & 장소 추천'}
              </span>
            </button>
          </div>

          {/* Right Column: Calculated Midway & Place Recommendations (7 cols) */}
          <div className="p-5 md:col-span-7 space-y-4">
            {!midwayResult ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center text-[#8C8273] p-6">
                <Users className="h-10 w-10 text-[#B5AFA2] mb-3" />
                <p className="text-sm font-bold text-[#1A1A1A]">
                  공평한 약속 중간지점을 계산해 보세요
                </p>
                <p className="text-xs text-[#8C8273] mt-1.5 max-w-xs leading-relaxed">
                  모든 참여자의 이동 시간을 분석하여 시간 편차가 최소가 되는 최적 역세권과 주변 카페·식당을 추천해 드립니다.
                </p>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Midway Result Banner */}
                <div className="border border-[#E5E1DA] border-l-4 border-l-[#2A9D8F] bg-white p-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#2A9D8F]" />
                      <span className="text-sm font-bold text-[#1A1A1A]">
                        {midwayResult.centerLocation.name} (추천 중간지점)
                      </span>
                    </div>
                    <span className="border border-[#E5E1DA] bg-[#F9F8F6] px-2 py-0.5 text-[10px] font-mono font-bold text-[#1A1A1A]">
                      계산 소요: {midwayResult.computationTimeMs}ms
                    </span>
                  </div>

                  {/* Disparity metrics */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs border-t border-[#E5E1DA] pt-2.5 text-[#1A1A1A]">
                    <div>
                      <span className="text-[#8C8273]">최대 이동 편차:</span>{' '}
                      <strong className="font-bold text-[#1A1A1A]">{midwayResult.maxTimeDiffMinutes}분</strong>
                    </div>
                    <div>
                      <span className="text-[#8C8273]">표준 편차:</span>{' '}
                      <strong className="font-bold text-[#1A1A1A]">±{midwayResult.timeStandardDeviation}분</strong>
                    </div>
                  </div>

                  {/* Participant Travel Times breakdown */}
                  <div className="mt-3 space-y-1.5">
                    {midwayResult.participantResults.map((pr, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-[#F9F8F6] px-2.5 py-1.5 border border-[#E5E1DA]">
                        <span className="font-semibold text-[#1A1A1A]">{pr.participant.name}</span>
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <span className="text-[#8C8273]">{pr.distanceKm}km</span>
                          <span className="font-bold text-[#1A1A1A]">약 {pr.travelTimeMinutes}분 소요</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Place Recommendation Header & Category Filters */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Utensils className="h-3.5 w-3.5 text-[#1A1A1A]" />
                      <span className="text-xs font-bold text-[#1A1A1A]">
                        중간지점 주변 추천 장소 ({placeCandidates.length}곳)
                      </span>
                    </div>
                    {isLoadingPlaces && (
                      <span className="text-[10px] text-[#E63946] animate-pulse font-bold">
                        검색 중...
                      </span>
                    )}
                  </div>

                  {/* Category Pills */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {[
                      { id: 'all', label: '전체' },
                      { id: 'cafe', label: '☕ 카페' },
                      { id: 'restaurant', label: '🍽️ 음식점' },
                      { id: 'bakery', label: '🥐 베이커리' },
                      { id: 'pub', label: '🍻 주점 / 펍' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategoryChange(cat.id as any)}
                        className={`border px-2.5 py-1 text-xs font-bold transition-colors ${
                          selectedCategory === cat.id
                            ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white'
                            : 'border-[#E5E1DA] bg-white text-[#8C8273] hover:border-[#1A1A1A] hover:text-[#1A1A1A]'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Place Candidates List */}
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {placeCandidates.map((place) => (
                      <div
                        key={place.id}
                        className={`flex items-center justify-between border p-3 transition-all ${
                          chosenPlaceId === place.id
                            ? 'border-[#2A9D8F] bg-[#2A9D8F]/10 ring-1 ring-[#2A9D8F]'
                            : 'border-[#E5E1DA] bg-white hover:border-[#1A1A1A]'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="border border-[#E5E1DA] bg-[#F9F8F6] px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-[#8C8273]">
                              {place.categoryName}
                            </span>
                            <h4 className="text-xs font-bold text-[#1A1A1A] truncate">
                              {place.name}
                            </h4>
                            {place.rating && (
                              <span className="text-[10px] font-bold text-[#E63946]">
                                ★ {place.rating}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-[11px] text-[#8C8273] truncate">
                            {place.address} · 중심에서 {place.distanceFromCenterMeters}m
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleConfirmSelectedPlace(place)}
                          className="ml-3 flex items-center gap-1 border border-[#1A1A1A] bg-[#1A1A1A] px-2.5 py-1.5 text-xs font-bold text-white hover:bg-stone-800 active:scale-95 transition-all shadow-2xs"
                        >
                          <Check className="h-3 w-3" />
                          <span>선택</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Direct Midway Center Select button */}
                <div className="border-t border-[#E5E1DA] pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleConfirmCenterDirectly}
                    className="text-xs font-bold text-[#1A1A1A] hover:underline"
                  >
                    중간역을 바로 약속 장소로 지정하기 →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
