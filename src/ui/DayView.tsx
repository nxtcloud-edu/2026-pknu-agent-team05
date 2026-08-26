// V-1 하루 보기 — 앱의 기본 화면
// 근거: frontend-components.md V-1 · business-rules.md BR-9 · BR-15 · BR-19
//
// 하루 보기 하나가 늘 떠 있고, 나머지는 패널로 열린다 (Q1-C).
// 동선 결과 자리는 비워 둔다 — route-planning 이 채운다 (U-NFR-5.2).

import type { ExpandedSchedule } from '../domain/schedule/expand'
import { checkRouteReadiness } from '../domain/handoff'
import type { RouteBlockReason } from '../domain/handoff'
import { buildRoutePlanningInput } from '../domain/handoff'
import type { DateKey, DaySetting } from '../domain/schedule/types'
import { TRAVEL_MODE_LABEL } from '../domain/schedule/types'
import type { Settings } from '../domain/settings'
import { endOfSchedule, formatDateLabel, formatDuration, shiftDate, todayKey } from '../domain/time'
import { Button, KindMark, Notice, RecurringMark } from './parts'

export function DayView({
  date,
  onDateChange,
  schedules,
  daySetting,
  settings,
  isStale,
  isEmpty,
  onOpenSchedule,
  onOpenNewSchedule,
  onOpenDaySetting,
  onOpenData,
  onToggleDone,
  onInsertExamples,
}: {
  date: DateKey
  onDateChange: (date: DateKey) => void
  schedules: readonly ExpandedSchedule[]
  daySetting: DaySetting | null
  settings: Settings
  isStale: boolean
  isEmpty: boolean
  onOpenSchedule: (schedule: ExpandedSchedule) => void
  onOpenNewSchedule: () => void
  onOpenDaySetting: () => void
  onOpenData: () => void
  onToggleDone: (schedule: ExpandedSchedule) => void
  onInsertExamples: () => void
}) {
  const today = todayKey()
  const readiness = checkRouteReadiness(
    buildRoutePlanningInput({ date, schedules, daySetting, settings }),
  )

  const activeCount = schedules.filter((schedule) => !schedule.excludedFromRoute).length
  const totalStay = schedules
    .filter((schedule) => !schedule.excludedFromRoute)
    .reduce((sum, schedule) => sum + schedule.stayMinutes, 0)

  return (
    <div className="space-y-4">
      {/* 날짜 고르기 */}
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-200 bg-white px-4 py-3">
        <div className="flex items-center gap-1">
          <IconButton label="앞날로" onClick={() => onDateChange(shiftDate(date, -1))}>
            <path d="M11 4l-5 5 5 5" />
          </IconButton>

          <div className="min-w-[9.5rem] px-2 text-center">
            <p className="text-base font-semibold text-ink-900">{formatDateLabel(date)}</p>
            {date !== today && (
              <button
                type="button"
                onClick={() => onDateChange(today)}
                className="text-xs text-ink-400 underline decoration-ink-200 transition hover:text-ink-600"
              >
                오늘로
              </button>
            )}
            {date === today && <p className="text-xs text-ink-400">오늘</p>}
          </div>

          <IconButton label="다음날로" onClick={() => onDateChange(shiftDate(date, 1))}>
            <path d="M7 4l5 5-5 5" />
          </IconButton>
        </div>

        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <p className="tabular hidden text-xs text-ink-400 sm:block">
              일정 {activeCount}개 · 머무는 시간 {formatDuration(totalStay)}
            </p>
          )}
          <Button variant="subtle" onClick={onOpenData}>
            데이터
          </Button>
        </div>
      </header>

      {/* 하루 설정 요약 */}
      <section className="rounded-2xl border border-ink-200 bg-white px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-ink-400">하루 시작과 끝</p>
            {daySetting === null ? (
              <p className="mt-0.5 text-sm text-ink-400">아직 정하지 않았습니다</p>
            ) : (
              <p className="mt-0.5 truncate text-sm text-ink-800">
                {daySetting.origin.query || '출발지 없음'}
                <span className="mx-1.5 text-ink-300">→</span>
                {daySetting.destination === null ? (
                  <span className="text-ink-400">마지막 일정에서 끝</span>
                ) : (
                  daySetting.destination.query
                )}
              </p>
            )}
          </div>
          <Button variant="ghost" onClick={onOpenDaySetting}>
            {daySetting === null ? '정하기' : '고치기'}
          </Button>
        </div>
      </section>

      {/* 일정 목록 */}
      <section className="rounded-2xl border border-ink-200 bg-white">
        <header className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-ink-800">일정</h2>
          <Button variant="ghost" onClick={onOpenNewSchedule}>
            + 일정 넣기
          </Button>
        </header>

        {schedules.length === 0 ? (
          <EmptyState isFirstTime={isEmpty} onInsertExamples={onInsertExamples} />
        ) : (
          <ul className="divide-y divide-ink-100">
            {schedules.map((schedule) => (
              <ScheduleRow
                key={schedule.id}
                schedule={schedule}
                onOpen={() => onOpenSchedule(schedule)}
                onToggleDone={() => onToggleDone(schedule)}
              />
            ))}
          </ul>
        )}
      </section>

      {/* 동선 결과 자리 — route-planning 이 채운다 */}
      <section className="rounded-2xl border border-dashed border-ink-300 bg-white/60 px-4 py-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-ink-300">
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 15.5c3 0 3-5.5 6-5.5s3-5.5 6-5.5" strokeLinecap="round" strokeDasharray="3 2.5" />
              <circle cx="4" cy="15.5" r="1.6" />
              <circle cx="16" cy="4.5" r="1.6" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-ink-600">동선 추천</h2>
            {isStale && schedules.length > 0 && (
              <p className="mt-1 text-xs text-amber-700">
                일정이 바뀌었습니다. 다시 계산해야 합니다.
              </p>
            )}
            <p className="mt-1 text-sm leading-relaxed text-ink-400">
              {describeBlock(readiness.ready ? null : readiness.reason)}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

function ScheduleRow({
  schedule,
  onOpen,
  onToggleDone,
}: {
  schedule: ExpandedSchedule
  onOpen: () => void
  onToggleDone: () => void
}) {
  const fromRecurring = schedule.origin.kind === 'recurring'
  const end =
    schedule.arrivalTime !== null
      ? endOfSchedule(schedule.arrivalTime, schedule.stayMinutes)
      : null

  return (
    <li className={`row-enter ${schedule.done ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-3 px-4 py-3">
        {/* 완료 표시 — BR-15 목록에서 사라지지 않는다 */}
        <button
          type="button"
          onClick={onToggleDone}
          title={schedule.done ? '완료 되돌리기' : '완료로 표시'}
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
            schedule.done
              ? 'border-ink-800 bg-ink-800 text-white'
              : 'border-ink-300 hover:border-ink-500'
          }`}
        >
          {schedule.done && (
            <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2.5 6.2l2.3 2.3L9.5 3.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        <button
          type="button"
          onClick={onOpen}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          {/* 유형 표시 — S-2 구분되어 보여야 한다 */}
          <span className="flex shrink-0 items-center gap-1">
            <KindMark kind={schedule.kind} />
            {fromRecurring && <RecurringMark />}
          </span>

          {/* 시각 — 유연형은 — */}
          <span className="tabular w-11 shrink-0 text-sm text-ink-600">
            {schedule.arrivalTime ?? '—'}
          </span>

          <span className="min-w-0 flex-1">
            {/* BR-9 사용자가 넣은 글자는 글자로만 그린다 */}
            <span
              className={`block truncate text-sm font-medium ${
                schedule.done ? 'text-ink-500 line-through' : 'text-ink-900'
              }`}
            >
              {schedule.title}
              {schedule.isAppointment && (
                <span className="ml-1.5 rounded bg-sky-50 px-1.5 py-0.5 align-middle text-[0.65rem] font-semibold text-sky-700">
                  약속
                </span>
              )}
            </span>
            <span className="mt-0.5 block truncate text-xs text-ink-400">
              {schedule.place.query || '장소 없음'}
              {schedule.place.coord === null && schedule.place.query !== '' && (
                <span className="ml-1 text-amber-600">· 좌표 없음</span>
              )}
            </span>
          </span>

          <span className="hidden shrink-0 text-right sm:block">
            <span className="tabular block text-xs text-ink-500">
              {formatDuration(schedule.stayMinutes)}
            </span>
            <span className="block text-xs text-ink-400">
              {TRAVEL_MODE_LABEL[schedule.travelMode]}
            </span>
          </span>

          {end?.crossesMidnight === true && (
            <span
              title="자정을 넘겨 끝납니다. 이 일정은 이 날짜에 속합니다"
              className="shrink-0 text-xs text-violet-500"
            >
              +1
            </span>
          )}
        </button>
      </div>
    </li>
  )
}

/** Q3-C — 빈 화면 + 안내 + 예시를 넣는 단추 */
function EmptyState({
  isFirstTime,
  onInsertExamples,
}: {
  isFirstTime: boolean
  onInsertExamples: () => void
}) {
  return (
    <div className="fade-enter px-4 py-12 text-center">
      <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-50 text-ink-300">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
          <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" strokeLinecap="round" />
        </svg>
      </span>

      <p className="text-sm font-medium text-ink-700">이 날에는 아직 일정이 없습니다</p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink-400">
        갈 곳을 넣어보세요. 시각이 정해진 일정과 아무 때나 가도 되는 일정을 섞어 넣을 수
        있습니다.
      </p>

      {isFirstTime && (
        <div className="mt-5">
          <Button variant="ghost" onClick={onInsertExamples}>
            예시 일정 넣어보기
          </Button>
          <p className="mt-2 text-xs text-ink-400">지우면 됩니다</p>
        </div>
      )}
    </div>
  )
}

/** 동선을 계산할 수 없는 이유를 사람 말로 (BR-19 · BR-22) */
function describeBlock(reason: RouteBlockReason | null): string {
  if (reason === null) {
    return '동선을 계산할 준비가 됐습니다. 계산 기능은 다음 작업 단위에서 붙습니다.'
  }

  switch (reason.kind) {
    case 'no-day-setting':
      return '하루의 출발지를 먼저 정해주세요. 출발지가 없으면 첫 구간을 계산할 수 없습니다.'
    case 'no-schedules':
      return '계산할 일정이 없습니다. 일정을 넣으면 동선을 추천합니다.'
    case 'missing-coords':
      return `좌표를 아직 못 찾은 일정이 있습니다 — ${reason.titles.join(' · ')}. 지도 연동이 붙으면 채워집니다.`
  }
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className="rounded-xl p-2 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
    >
      <svg viewBox="0 0 18 18" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </button>
  )
}
