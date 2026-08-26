/**
 * Navigation Bar with Date Selector, Optimization Trigger, and Modals Toggles
 */

import { AlertCircle, Calendar, CheckCircle2, Clock, FlaskConical, Navigation, Plus, RefreshCw, Settings } from 'lucide-react';
import React from 'react';
import { formatLocalDate } from '../utils/timeUtils';

interface NavbarProps {
  selectedDate: string;
  onDateChange: (newDate: string) => void;
  onOpenAddModal: () => void;
  onOpenSettings: () => void;
  onOpenTests: () => void;
  onRunOptimization: () => void;
  isOptimizing: boolean;
  scheduleCount: number;
  isFeasible: boolean;
  testPassedCount?: { passed: number; total: number };
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedDate,
  onDateChange,
  onOpenAddModal,
  onOpenSettings,
  onOpenTests,
  onRunOptimization,
  isOptimizing,
  scheduleCount,
  isFeasible,
  testPassedCount,
}) => {
  const todayStr = formatLocalDate(new Date());

  const isToday = selectedDate === todayStr;

  return (
    <header className="sticky top-0 z-30 border-b border-[#E5E1DA] bg-[#FDFCFB]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-xs">
            <Navigation className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-serif italic font-bold tracking-tight text-[#1A1A1A]">
                외출 동선 도우미
              </h1>
              <span className="hidden border border-[#E5E1DA] bg-[#F9F8F6] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#8C8273] sm:inline-block">
                스마트 외출 매니저
              </span>
            </div>
            <p className="hidden text-[11px] text-[#8C8273] font-medium md:block">
              지능형 외출 동선 최적화 & 약속 중간지점 계산
            </p>
          </div>
        </div>

        {/* Center: Date Picker & Quick Navigator */}
        <div className="flex items-center gap-1.5 border border-[#E5E1DA] bg-[#F9F8F6] p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() - 1);
              onDateChange(formatLocalDate(d));
            }}
            className="px-2 py-1 text-xs font-semibold text-[#8C8273] hover:text-[#1A1A1A] hover:bg-[#E5E1DA]/60 transition-colors"
            title="이전 날짜"
          >
            ◀
          </button>

          <div className="relative flex items-center">
            <Calendar className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[#8C8273]" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="border-0 bg-transparent py-1 pl-8 pr-2 text-xs font-bold text-[#1A1A1A] focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => onDateChange(todayStr)}
            className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${
              isToday
                ? 'bg-[#1A1A1A] text-white'
                : 'text-[#8C8273] hover:text-[#1A1A1A] hover:bg-[#E5E1DA]/60'
            }`}
          >
            오늘
          </button>

          <button
            type="button"
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + 1);
              onDateChange(formatLocalDate(d));
            }}
            className="px-2 py-1 text-xs font-semibold text-[#8C8273] hover:text-[#1A1A1A] hover:bg-[#E5E1DA]/60 transition-colors"
            title="다음 날짜"
          >
            ▶
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Unit Test Dashboard trigger */}
          <button
            type="button"
            onClick={onOpenTests}
            id="btn-unit-tests"
            className="flex items-center gap-1.5 border border-[#E5E1DA] bg-white px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#1A1A1A] hover:border-[#1A1A1A] hover:bg-[#F9F8F6] transition-colors shadow-2xs"
            title="알고리즘 및 단위 테스트 검증"
          >
            <FlaskConical className="h-3.5 w-3.5 text-[#2A9D8F]" />
            <span className="hidden sm:inline">단위 테스트</span>
            {testPassedCount && (
              <span className="bg-[#E5E1DA] px-1.5 py-0.2 text-[10px] font-mono font-bold text-[#1A1A1A]">
                {testPassedCount.passed}/{testPassedCount.total}
              </span>
            )}
          </button>

          {/* Re-optimize Button */}
          <button
            type="button"
            onClick={onRunOptimization}
            disabled={isOptimizing || scheduleCount === 0}
            id="btn-optimize"
            className={`flex items-center gap-1.5 border border-[#1A1A1A] px-3 py-1.5 text-xs font-bold uppercase tracking-widest shadow-2xs transition-all ${
              scheduleCount === 0
                ? 'border-[#E5E1DA] bg-[#F9F8F6] text-[#B5AFA2] cursor-not-allowed'
                : 'bg-white text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white active:scale-98'
            }`}
            title="등록된 일정의 최적 동선 재계산"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isOptimizing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">동선 최적화</span>
            <span className="sm:hidden">최적화</span>
          </button>

          {/* Add Schedule Button */}
          <button
            type="button"
            onClick={onOpenAddModal}
            id="btn-add-schedule"
            className="flex items-center gap-1.5 border border-[#1A1A1A] bg-[#1A1A1A] px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-white shadow-xs hover:bg-stone-800 active:scale-98 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>일정 추가</span>
          </button>

          {/* Settings Button */}
          <button
            type="button"
            onClick={onOpenSettings}
            id="btn-settings"
            className="border border-[#E5E1DA] bg-white p-2 text-[#1A1A1A] hover:border-[#1A1A1A] hover:bg-[#F9F8F6] transition-colors"
            title="설정 (여유시간, 기본 출발지, 반경 등)"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
