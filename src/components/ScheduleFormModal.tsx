/**
 * Modal dialog for registering and editing schedule items.
 */

import { AlertCircle, Clock, Compass, MapPin, Sparkles, Users, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { DEFAULT_APP_CONFIG } from '../config/appConfig';
import { defaultRouteServiceProvider, KOREAN_LOCATION_PRESETS } from '../services/routeServiceBoundary';
import { Location, Participant, ScheduleItem, ScheduleType, TransportMode } from '../types';

interface ScheduleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (schedule: ScheduleItem) => void;
  initialData?: ScheduleItem | null;
  onOpenMidwayForSchedule?: (schedule: Partial<ScheduleItem>) => void;
}

export const ScheduleFormModal: React.FC<ScheduleFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  onOpenMidwayForSchedule,
}) => {
  const [title, setTitle] = useState('');
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [locationLat, setLocationLat] = useState(37.4979);
  const [locationLng, setLocationLng] = useState(127.0276);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [type, setType] = useState<ScheduleType>('flexible');
  const [fixedStartTime, setFixedStartTime] = useState('14:00');
  const [isMeeting, setIsMeeting] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [bufferMinutes, setBufferMinutes] = useState<number | undefined>(undefined);
  const [transportMode, setTransportMode] = useState<TransportMode>('transit');
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setLocationName(initialData.location.name);
      setLocationAddress(initialData.location.address || '');
      setLocationLat(initialData.location.lat);
      setLocationLng(initialData.location.lng);
      setDurationMinutes(initialData.durationMinutes);
      setType(initialData.type);
      setFixedStartTime(initialData.fixedStartTime || '14:00');
      setIsMeeting(!!initialData.isMeeting);
      setParticipants(initialData.participants || []);
      setBufferMinutes(initialData.bufferMinutes);
      setTransportMode(initialData.transportMode || 'transit');
      setNotes(initialData.notes || '');
    } else {
      // Default reset
      setTitle('');
      const defaultPreset = KOREAN_LOCATION_PRESETS[0];
      setLocationName(defaultPreset.name);
      setLocationAddress(defaultPreset.address || '');
      setLocationLat(defaultPreset.lat);
      setLocationLng(defaultPreset.lng);
      setDurationMinutes(60);
      setType('flexible');
      setFixedStartTime('14:00');
      setIsMeeting(false);
      setParticipants([]);
      setBufferMinutes(undefined);
      setTransportMode('transit');
      setNotes('');
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await defaultRouteServiceProvider.geocode(searchQuery);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectLocation = (loc: Location) => {
    setLocationName(loc.name);
    setLocationAddress(loc.address || '');
    setLocationLat(loc.lat);
    setLocationLng(loc.lng);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const schedule: ScheduleItem = {
      id: initialData?.id || `sched_${Date.now()}`,
      title: title.trim(),
      location: {
        name: locationName.trim() || '지정 장소',
        address: locationAddress.trim(),
        lat: locationLat,
        lng: locationLng,
      },
      durationMinutes: Math.max(5, durationMinutes),
      type,
      fixedStartTime: type === 'fixed' ? fixedStartTime : undefined,
      isMeeting,
      participants: isMeeting ? participants : undefined,
      bufferMinutes: bufferMinutes !== undefined ? Math.max(0, bufferMinutes) : undefined,
      transportMode,
      notes: notes.trim() || undefined,
      isCompleted: initialData?.isCompleted || false,
    };

    onSave(schedule);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg border border-[#E5E1DA] bg-[#FDFCFB] shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E1DA] bg-[#F9F8F6] px-6 py-4">
          <div>
            <h2 className="text-base font-bold tracking-tight text-[#1A1A1A]">
              {initialData ? '일정 수정' : '새 일정 등록'}
            </h2>
            <p className="text-xs text-[#8C8273] font-medium">
              방문 장소, 소요 시간, 약속 참여자 및 고정 여부를 설정합니다
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#8C8273] hover:text-[#1A1A1A] hover:bg-[#E5E1DA]/40 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-[#1A1A1A] mb-1.5">
              일정 제목 / 용무 <span className="text-[#E63946]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="예: 치과 진료, 서점 구경, 팀 프로젝트 미팅"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-[#E5E1DA] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#B5AFA2] focus:border-[#1A1A1A] focus:outline-none"
            />
          </div>

          {/* Schedule Type Selection (Fixed vs Flexible) */}
          <div>
            <label className="block text-xs font-bold text-[#1A1A1A] mb-1.5">
              일정 유형 <span className="text-[#E63946]">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('flexible')}
                className={`flex flex-col items-start border p-3.5 text-left transition-all ${
                  type === 'flexible'
                    ? 'border-[#1A1A1A] border-l-4 border-l-[#1A1A1A] bg-white shadow-2xs'
                    : 'border-[#E5E1DA] bg-[#F9F8F6] hover:border-[#1A1A1A]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#1A1A1A]">
                  <Compass className="h-4 w-4 text-[#1A1A1A]" />
                  <span>유연 일정 (최적 동선)</span>
                </div>
                <p className="mt-1 text-xs text-[#8C8273]">
                  총 이동 시간이 최소가 되도록 순서가 자동 최적화됩니다.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setType('fixed')}
                className={`flex flex-col items-start border p-3.5 text-left transition-all ${
                  type === 'fixed'
                    ? 'border-[#E63946] border-l-4 border-l-[#E63946] bg-white shadow-2xs'
                    : 'border-[#E5E1DA] bg-[#F9F8F6] hover:border-[#E63946]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#E63946]">
                  <Clock className="h-4 w-4 text-[#E63946]" />
                  <span>고정 일정 (시간 엄수)</span>
                </div>
                <p className="mt-1 text-xs text-[#8C8273]">
                  약속 시각이 고정되며 어떤 추천에서도 시각을 어기지 않습니다.
                </p>
              </button>
            </div>
          </div>

          {/* If Fixed Type: Start Time Picker */}
          {type === 'fixed' && (
            <div className="border border-[#E63946]/30 border-l-4 border-l-[#E63946] bg-white p-3.5 space-y-2">
              <label className="block text-xs font-bold text-[#E63946]">
                고정 시작 시각 (도착 목표 시각)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="time"
                  required
                  value={fixedStartTime}
                  onChange={(e) => setFixedStartTime(e.target.value)}
                  className="border border-[#E5E1DA] bg-[#F9F8F6] px-3 py-1.5 text-sm font-mono font-bold text-[#1A1A1A] focus:border-[#E63946] focus:outline-none"
                />
                <span className="text-xs text-[#8C8273]">
                  이 시각에 늦지 않도록 출발 시각과 알림이 계산됩니다.
                </span>
              </div>
            </div>
          )}

          {/* Location Picker & Search */}
          <div>
            <label className="block text-xs font-bold text-[#1A1A1A] mb-1.5">
              방문 / 도착 장소 <span className="text-[#E63946]">*</span>
            </label>

            {/* Currently Selected Location Pill */}
            <div className="mb-2 flex items-center justify-between border border-[#E5E1DA] bg-white px-3 py-2.5 shadow-2xs">
              <div className="flex items-center gap-2 overflow-hidden">
                <MapPin className="h-4 w-4 text-[#1A1A1A] shrink-0" />
                <div className="truncate">
                  <span className="text-xs font-bold text-[#1A1A1A]">{locationName}</span>
                  {locationAddress && (
                    <span className="ml-1.5 text-xs text-[#8C8273] truncate">
                      ({locationAddress})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick search input */}
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="장소 또는 지하철역 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                className="flex-1 border border-[#E5E1DA] bg-white px-3 py-1.5 text-xs text-[#1A1A1A] placeholder:text-[#B5AFA2] focus:border-[#1A1A1A] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={isSearching}
                className="border border-[#1A1A1A] bg-[#1A1A1A] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-stone-800"
              >
                {isSearching ? '검색 중...' : '검색'}
              </button>
            </div>

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="mb-2 max-h-36 overflow-y-auto border border-[#E5E1DA] bg-white p-1 shadow-xs space-y-1">
                {searchResults.map((loc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectLocation(loc)}
                    className="flex w-full items-start gap-2 px-2.5 py-1.5 text-left text-xs hover:bg-[#F9F8F6]"
                  >
                    <MapPin className="mt-0.5 h-3.5 w-3.5 text-[#8C8273] shrink-0" />
                    <div>
                      <div className="font-semibold text-[#1A1A1A]">{loc.name}</div>
                      {loc.address && <div className="text-xs text-[#8C8273]">{loc.address}</div>}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Popular Presets */}
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs text-[#8C8273] font-bold self-center mr-1">추천 장소:</span>
              {KOREAN_LOCATION_PRESETS.slice(0, 6).map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectLocation(preset)}
                  className={`border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                    locationName === preset.name
                      ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white font-bold'
                      : 'border-[#E5E1DA] bg-white text-[#8C8273] hover:border-[#1A1A1A] hover:text-[#1A1A1A]'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Duration & Transport Mode */}
          <div className="grid grid-cols-2 gap-3">
            {/* Duration */}
            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] mb-1.5">
                체류 / 활동 시간 (분)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="5"
                  max="720"
                  step="5"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 30)}
                  className="w-full border border-[#E5E1DA] bg-white px-3 py-1.5 text-sm font-mono font-bold text-[#1A1A1A] focus:border-[#1A1A1A] focus:outline-none"
                />
              </div>
            </div>

            {/* Transport Mode */}
            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] mb-1.5">
                이동 수단
              </label>
              <select
                value={transportMode}
                onChange={(e) => setTransportMode(e.target.value as TransportMode)}
                className="w-full border border-[#E5E1DA] bg-white px-3 py-1.5 text-xs font-bold text-[#1A1A1A] focus:border-[#1A1A1A] focus:outline-none"
              >
                <option value="transit">대중교통 (지하철/버스)</option>
                <option value="driving">자동차 / 택시</option>
                <option value="walking">도보</option>
              </select>
            </div>
          </div>

          {/* Meeting Toggle (약속 및 참여자) */}
          <div className="border border-[#E5E1DA] bg-[#F9F8F6] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#1A1A1A]" />
                <span className="text-xs font-bold text-[#1A1A1A]">
                  약속 모임 / 동행 참여자 설정
                </span>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={isMeeting}
                  onChange={(e) => setIsMeeting(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="peer h-5 w-9 bg-[#E5E1DA] after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:bg-white after:transition-all peer-checked:bg-[#1A1A1A] peer-checked:after:translate-x-full"></div>
              </label>
            </div>

            {isMeeting && (
              <div className="border-t border-[#E5E1DA] pt-3 space-y-2">
                <p className="text-xs text-[#8C8273]">
                  참여자의 각 출발지를 입력하면 <strong>이동 시간 편차가 가장 적은 공평 중간지점</strong>과 주변 맛집·카페를 계산할 수 있습니다.
                </p>
                {onOpenMidwayForSchedule && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenMidwayForSchedule({
                        title,
                        location: {
                          name: locationName,
                          address: locationAddress,
                          lat: locationLat,
                          lng: locationLng,
                        },
                        durationMinutes,
                        type,
                        fixedStartTime,
                        isMeeting: true,
                        participants,
                      });
                    }}
                    className="flex w-full items-center justify-center gap-1.5 border border-[#1A1A1A] bg-white px-3 py-2 text-xs font-bold text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#E63946]" />
                    <span>약속 참여자 설정 & 중간지점 장소 추천 열기</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Optional Individual Buffer Time & Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#8C8273] mb-1">
                개별 여유 시간 (분)
              </label>
              <input
                type="number"
                placeholder={`기본값 (${DEFAULT_APP_CONFIG.defaultBufferMinutes}분)`}
                value={bufferMinutes !== undefined ? bufferMinutes : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setBufferMinutes(val === '' ? undefined : parseInt(val, 10));
                }}
                className="w-full border border-[#E5E1DA] bg-white px-3 py-1.5 text-xs text-[#1A1A1A] placeholder:text-[#B5AFA2] focus:border-[#1A1A1A] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#8C8273] mb-1">
                메모 / 특이사항
              </label>
              <input
                type="text"
                placeholder="준비물, 예약번호 등"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-[#E5E1DA] bg-white px-3 py-1.5 text-xs text-[#1A1A1A] placeholder:text-[#B5AFA2] focus:border-[#1A1A1A] focus:outline-none"
              />
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-[#E5E1DA] bg-[#F9F8F6] px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="border border-[#E5E1DA] bg-white px-4 py-2 text-xs font-bold text-[#8C8273] hover:text-[#1A1A1A] hover:border-[#1A1A1A] transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="border border-[#1A1A1A] bg-[#1A1A1A] px-5 py-2 text-xs font-bold text-white hover:bg-stone-800 active:scale-98 shadow-xs transition-all"
          >
            {initialData ? '수정 완료' : '일정 등록'}
          </button>
        </div>
      </div>
    </div>
  );
};
