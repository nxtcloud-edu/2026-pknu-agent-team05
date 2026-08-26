/**
 * List of Daily Schedules with Type Badges, Edit, Delete, and Midway triggers
 */

import { AlertCircle, CheckCircle2, ChevronRight, Clock, Compass, Edit2, MapPin, Plus, Sparkles, Trash2, Users } from 'lucide-react';
import React from 'react';
import { ScheduleItem } from '../types';

interface ScheduleListProps {
  schedules: ScheduleItem[];
  onEditSchedule: (schedule: ScheduleItem) => void;
  onDeleteSchedule: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onOpenMidway: (schedule: ScheduleItem) => void;
  onOpenAddModal: () => void;
  onLoadPreset: (presetType: 'weekend' | 'business') => void;
}

export const ScheduleList: React.FC<ScheduleListProps> = ({
  schedules,
  onEditSchedule,
  onDeleteSchedule,
  onToggleComplete,
  onOpenMidway,
  onOpenAddModal,
  onLoadPreset,
}) => {
  const fixedCount = schedules.filter((s) => s.type === 'fixed').length;
  const flexCount = schedules.filter((s) => s.type === 'flexible').length;

  return (
    <div className="flex flex-col h-full border border-[#E5E1DA] bg-[#FDFCFB] p-5 sm:p-6 shadow-xs">
      {/* Header & Stats */}
      <div className="flex items-center justify-between border-b border-[#E5E1DA] pb-4 mb-4">
        <div>
          <h2 className="text-base font-bold tracking-tight text-[#1A1A1A]">
            오늘의 방문 일정
          </h2>
          <div className="mt-1 flex items-center gap-2 text-xs text-[#8C8273] font-semibold">
            <span>총 {schedules.length}개</span>
            <span>•</span>
            <span className="text-[#E63946] font-bold">고정 {fixedCount}개</span>
            <span>•</span>
            <span className="text-[#8C8273] font-bold">유연 {flexCount}개</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 border border-[#1A1A1A] bg-[#1A1A1A] px-3 py-1.5 text-xs font-bold text-white hover:bg-stone-800 active:scale-98 transition-all shadow-2xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>+ 일정 추가</span>
        </button>
      </div>

      {/* Empty State */}
      {schedules.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center border border-dashed border-[#E5E1DA] bg-[#F9F8F6] p-8 text-center">
          <Compass className="h-8 w-8 text-[#B5AFA2] mb-3" />
          <h3 className="text-sm font-bold text-[#1A1A1A]">등록된 일정이 없습니다</h3>
          <p className="mt-1.5 text-xs text-[#8C8273] max-w-xs leading-relaxed">
            오늘 방문할 장소와 일정을 등록하면 최적의 출발 시각과 최단 동선을 자동 계산합니다.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-2.5 w-full max-w-xs">
            <button
              type="button"
              onClick={() => onLoadPreset('weekend')}
              className="flex-1 border border-[#E5E1DA] bg-white px-3 py-2 text-xs font-bold text-[#1A1A1A] hover:border-[#1A1A1A] hover:bg-[#FDFCFB] transition-colors shadow-2xs"
            >
              주말 약속 샘플
            </button>
            <button
              type="button"
              onClick={() => onLoadPreset('business')}
              className="flex-1 border border-[#E5E1DA] bg-white px-3 py-2 text-xs font-bold text-[#1A1A1A] hover:border-[#1A1A1A] hover:bg-[#FDFCFB] transition-colors shadow-2xs"
            >
              외근·진료 샘플
            </button>
          </div>
        </div>
      ) : (
        /* Schedule Items List */
        <div className="space-y-3 flex-1 overflow-y-auto pr-1">
          {schedules.map((schedule, idx) => {
            const isFixed = schedule.type === 'fixed';

            return (
              <div
                key={schedule.id}
                className={`group relative border transition-all p-3.5 ${
                  schedule.isCompleted
                    ? 'border-[#E5E1DA] bg-[#F9F8F6] opacity-60'
                    : isFixed
                    ? 'border-[#E5E1DA] border-l-4 border-l-[#E63946] bg-white hover:shadow-2xs'
                    : 'border-[#E5E1DA] border-l-4 border-l-[#1A1A1A] bg-white hover:shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Index & Type Badge */}
                    <div className="mt-0.5 flex flex-col items-center">
                      <span
                        className={`flex h-5 w-5 items-center justify-center text-[10px] font-mono font-bold ${
                          isFixed
                            ? 'bg-[#E63946] text-white'
                            : 'bg-[#1A1A1A] text-white'
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </div>

                    {/* Schedule Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span
                          className={`text-xs font-bold ${
                            isFixed ? 'text-[#E63946]' : 'text-[#8C8273]'
                          }`}
                        >
                          {isFixed ? `${schedule.fixedStartTime} • 고정 일정` : '유연 일정 (동선 최적화)'}
                        </span>

                        {schedule.isMeeting && (
                          <span className="flex items-center gap-1 border border-[#E5E1DA] bg-[#F9F8F6] px-1.5 py-0.2 text-xs font-bold text-[#1A1A1A]">
                            <Users className="h-3 w-3" />
                            약속 모임 ({schedule.participants?.length || 1}명)
                          </span>
                        )}
                      </div>

                      <h3
                        className={`text-sm font-semibold truncate text-[#1A1A1A] ${
                          schedule.isCompleted ? 'line-through text-[#B5AFA2]' : ''
                        }`}
                      >
                        {schedule.title}
                      </h3>

                      {/* Location & Duration line */}
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#8C8273]">
                        <div className="flex items-center gap-1 truncate max-w-[190px]">
                          <MapPin className="h-3 w-3 text-[#B5AFA2] shrink-0" />
                          <span className="truncate">{schedule.location.name}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-[#B5AFA2] shrink-0" />
                          <span>{schedule.durationMinutes}분 체류</span>
                        </div>
                        {schedule.bufferMinutes !== undefined && (
                          <>
                            <span>•</span>
                            <span className="text-[#1A1A1A] font-medium">
                              +{schedule.bufferMinutes}분 여유
                            </span>
                          </>
                        )}
                      </div>

                      {/* Meeting Midway trigger button if isMeeting */}
                      {schedule.isMeeting && (
                        <div className="mt-2.5">
                          <button
                            type="button"
                            onClick={() => onOpenMidway(schedule)}
                            className="flex items-center gap-1.5 border border-[#1A1A1A] bg-[#F9F8F6] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors"
                          >
                            <Sparkles className="h-3 w-3 text-[#E63946]" />
                            <span>중간지점 & 장소 추천</span>
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditSchedule(schedule)}
                      className="p-1 text-[#8C8273] hover:text-[#1A1A1A] hover:bg-[#F9F8F6] transition-colors"
                      title="일정 수정"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSchedule(schedule.id)}
                      className="p-1 text-[#8C8273] hover:text-[#E63946] hover:bg-[#F9F8F6] transition-colors"
                      title="일정 삭제"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
