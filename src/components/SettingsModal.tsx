/**
 * Application Settings Modal
 * Configures default buffer minutes, search radius, cache duration, base origin, and transport mode.
 */

import { AlertCircle, Check, MapPin, RefreshCw, RotateCcw, Save, Settings, X } from 'lucide-react';
import React, { useState } from 'react';
import { AppConfig, DEFAULT_APP_CONFIG } from '../config/appConfig';
import { KOREAN_LOCATION_PRESETS } from '../services/routeServiceBoundary';
import { Location, TransportMode } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onSaveConfig: (newConfig: AppConfig) => void;
  onResetAllData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onResetAllData,
}) => {
  const [bufferMinutes, setBufferMinutes] = useState(config.defaultBufferMinutes);
  const [searchRadius, setSearchRadius] = useState(config.searchRadiusMeters);
  const [cacheTtlMinutes, setCacheTtlMinutes] = useState(Math.round(config.cacheTtlMs / 60000));
  const [originName, setOriginName] = useState(config.defaultOrigin.name);
  const [originAddress, setOriginAddress] = useState(config.defaultOrigin.address);
  const [originLat, setOriginLat] = useState(config.defaultOrigin.lat);
  const [originLng, setOriginLng] = useState(config.defaultOrigin.lng);
  const [transportMode, setTransportMode] = useState<TransportMode>(config.defaultTransportMode);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: Location) => {
    setOriginName(preset.name);
    setOriginAddress(preset.address || '');
    setOriginLat(preset.lat);
    setOriginLng(preset.lng);
  };

  const handleSave = () => {
    const updated: AppConfig = {
      ...config,
      defaultBufferMinutes: Math.max(0, bufferMinutes),
      searchRadiusMeters: Math.max(200, searchRadius),
      cacheTtlMs: Math.max(1, cacheTtlMinutes) * 60 * 1000,
      defaultOrigin: {
        name: originName.trim() || '우리집',
        address: originAddress.trim(),
        lat: originLat,
        lng: originLng,
      },
      defaultTransportMode: transportMode,
    };

    onSaveConfig(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="flex flex-col w-full max-w-lg border border-[#E5E1DA] bg-[#FDFCFB] shadow-2xl overflow-hidden max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E1DA] bg-[#F9F8F6] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Settings className="h-5 w-5 text-[#1A1A1A]" />
            <div>
              <h2 className="text-base font-bold tracking-tight text-[#1A1A1A]">환경 설정 & 기본값</h2>
              <p className="text-[11px] text-[#8C8273] font-medium">출발지, 여유 시간 버퍼, 장소 탐색 반경 및 이동 수단을 설정합니다</p>
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Base Origin Setup */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#1A1A1A]">
              기본 출발지 / 귀가지 (우리집)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={originName}
                onChange={(e) => setOriginName(e.target.value)}
                placeholder="출발지 이름 (예: 우리집 (강남역 부근))"
                className="w-full border border-[#E5E1DA] bg-white px-3 py-2 text-xs text-[#1A1A1A] focus:border-[#1A1A1A] focus:outline-none"
              />
            </div>
            {/* Quick preset selector */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[11px] text-[#8C8273] font-bold self-center">빠른 선택:</span>
              {KOREAN_LOCATION_PRESETS.slice(0, 5).map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className="border border-[#E5E1DA] bg-[#F9F8F6] px-2.5 py-0.5 text-xs font-bold text-[#8C8273] hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition-colors"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Buffer Time & Search Radius */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] mb-1.5">
                기본 여유 시간 (분)
              </label>
              <input
                type="number"
                min="0"
                max="60"
                value={bufferMinutes}
                onChange={(e) => setBufferMinutes(parseInt(e.target.value, 10) || 0)}
                className="w-full border border-[#E5E1DA] bg-white px-3 py-1.5 text-sm font-mono font-bold text-[#1A1A1A] focus:border-[#1A1A1A] focus:outline-none"
              />
              <p className="text-[11px] text-[#8C8273] mt-1">
                출발 시각 = 도착 − 이동 − 여유시간
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] mb-1.5">
                장소 탐색 반경 (미터)
              </label>
              <input
                type="number"
                min="300"
                max="5000"
                step="100"
                value={searchRadius}
                onChange={(e) => setSearchRadius(parseInt(e.target.value, 10) || 1000)}
                className="w-full border border-[#E5E1DA] bg-white px-3 py-1.5 text-sm font-mono font-bold text-[#1A1A1A] focus:border-[#1A1A1A] focus:outline-none"
              />
              <p className="text-[11px] text-[#8C8273] mt-1">
                중간지점 주변 맛집·카페 탐색 반경
              </p>
            </div>
          </div>

          {/* Default Transport Mode & Cache TTL */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] mb-1.5">
                기본 이동 수단
              </label>
              <select
                value={transportMode}
                onChange={(e) => setTransportMode(e.target.value as TransportMode)}
                className="w-full border border-[#E5E1DA] bg-white px-3 py-1.5 text-xs font-bold text-[#1A1A1A] focus:border-[#1A1A1A] focus:outline-none"
              >
                <option value="transit">대중교통 (지하철·버스 기본)</option>
                <option value="driving">자동차 / 택시</option>
                <option value="walking">도보</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] mb-1.5">
                경로 캐시 유지 시간 (분)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={cacheTtlMinutes}
                onChange={(e) => setCacheTtlMinutes(parseInt(e.target.value, 10) || 15)}
                className="w-full border border-[#E5E1DA] bg-white px-3 py-1.5 text-sm font-mono font-bold text-[#1A1A1A] focus:border-[#1A1A1A] focus:outline-none"
              />
            </div>
          </div>

          {/* Data Reset Section */}
          <div className="border-t border-[#E5E1DA] pt-4">
            {!showResetConfirm ? (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-[#E63946] hover:underline"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>저장된 모든 일정 및 설정 초기화</span>
              </button>
            ) : (
              <div className="border border-[#E63946]/30 border-l-4 border-l-[#E63946] bg-white p-3.5 space-y-2">
                <p className="text-xs font-bold text-[#E63946]">
                  정말로 모든 일정과 브라우저 저장 데이터를 초기화하시겠습니까?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onResetAllData();
                      setShowResetConfirm(false);
                      onClose();
                    }}
                    className="border border-[#E63946] bg-[#E63946] px-3 py-1 text-xs font-bold text-white hover:bg-rose-700"
                  >
                    초기화 확인
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="border border-[#E5E1DA] bg-white px-3 py-1 text-xs font-bold text-[#8C8273] hover:text-[#1A1A1A]"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
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
            onClick={handleSave}
            className="flex items-center gap-1.5 border border-[#1A1A1A] bg-[#1A1A1A] px-5 py-2 text-xs font-bold text-white hover:bg-stone-800 active:scale-98 shadow-xs transition-all"
          >
            <Save className="h-3.5 w-3.5" />
            <span>설정 저장</span>
          </button>
        </div>
      </div>
    </div>
  );
};
