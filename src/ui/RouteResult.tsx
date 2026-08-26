// V-3 동선 결과
// 근거: route-planning/frontend-components.md V-3 · business-rules.md RBR-
//
// 다섯 상태를 다룬다 — 성공 · 도착 불가 · 빠진 일정(성공과 함께) · 낡은 값 · 계산 불가
// 어림값을 감추지 않는다 (R-NFR-6).

import type { RouteBlockReason } from '../domain/handoff'
import type {
  ExcludedSchedule,
  InfeasibleArrival,
  RouteLeg,
  RoutePlan,
  RoutePlanResult,
} from '../domain/route/types'
import { TRAVEL_MODE_LABEL } from '../domain/schedule/types'
import { formatDuration } from '../domain/time'
import { Button, Notice } from './parts'

export type RouteViewState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'calculating' }
  | { readonly kind: 'done'; readonly result: RoutePlanResult }
  /** 계산 전에 미리 막힌 것을 알린다 (checkRouteReadiness) */
  | { readonly kind: 'not-ready'; readonly reason: RouteBlockReason }

export function RouteResult({
  state,
  isStale,
  onRecalculate,
  onMove,
  onUnpin,
}: {
  state: RouteViewState
  /** 일정이 바뀌어 결과가 낡았는지 (BR-11~BR-13) */
  isStale: boolean
  onRecalculate: () => void
  onMove: (scheduleId: string, direction: 'up' | 'down') => void
  onUnpin: () => void
}) {
  return (
    <section className="rounded-2xl border border-ink-200 bg-white">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-ink-800">동선 추천</h2>
        <div className="flex items-center gap-2">
          {isStale && state.kind === 'done' && (
            <span className="text-xs text-amber-700">일정이 바뀌었습니다</span>
          )}
          <Button variant="subtle" onClick={onRecalculate}>
            새로 계산
          </Button>
        </div>
      </header>

      <div className="px-4 py-4">
        {state.kind === 'idle' && (
          <p className="py-4 text-center text-sm text-ink-400">
            일정과 하루 출발지를 넣으면 동선을 추천합니다.
          </p>
        )}

        {state.kind === 'calculating' && (
          <p className="fade-enter py-4 text-center text-sm text-ink-400">
            이동 시간을 알아보는 중입니다…
          </p>
        )}

        {state.kind === 'not-ready' && <NotReady reason={state.reason} />}

        {state.kind === 'done' && state.result.kind === 'plan' && (
          <PlanView plan={state.result.plan} onMove={onMove} onUnpin={onUnpin} />
        )}

        {state.kind === 'done' && state.result.kind === 'infeasible' && (
          <InfeasibleView
            problems={state.result.problems}
            excluded={state.result.excluded}
          />
        )}

        {state.kind === 'done' && state.result.kind === 'blocked' && (
          <BlockedView result={state.result} />
        )}
      </div>
    </section>
  )
}

// ── 성공 ────────────────────────────────────────────────────

function PlanView({
  plan,
  onMove,
  onUnpin,
}: {
  plan: RoutePlan
  onMove: (scheduleId: string, direction: 'up' | 'down') => void
  onUnpin: () => void
}) {
  const hasPinned = plan.legs.some((leg) => leg.pinned)

  return (
    <div className="fade-enter space-y-4">
      {/* 요약 */}
      <div className="space-y-1">
        <p className="tabular text-sm text-ink-800">
          총 이동 시간{' '}
          <span className="font-semibold">{formatDuration(plan.totalTravelMinutes)}</span>
          <span className="mx-1.5 text-ink-300">·</span>
          {plan.dayStartAt} 나가서 {plan.dayEndAt} 끝
          {plan.hasEstimatedTravelTime && (
            <span className="ml-1.5 text-ink-400">(어림값 포함)</span>
          )}
        </p>
        {/* RBR-5 순서를 어떻게 정했는지 밝힌다 — 가장 짧은 순서를 보장하지 않는다 */}
        <p className="text-xs text-ink-400">
          가까운 곳부터 이어 붙인 순서입니다. 가장 짧은 순서라고 보장하지는 않습니다.
        </p>
      </div>

      {/* R-NFR-6 어림값이 섞였음을 알린다 */}
      {plan.hasEstimatedTravelTime && (
        <Notice tone="info">
          도보 · 대중교통 이동 시간은 직선거리로 어림한 값입니다. 실시간 교통이 반영되지
          않았습니다.
        </Notice>
      )}

      {/* RBR-31 낡은 값을 쓰고 있다 */}
      {plan.hasStaleTravelTime && (
        <Notice tone="warn" title="이동 시간이 최신이 아닙니다">
          길찾기 서비스에 닿지 못해 전에 받아 둔 값을 쓰고 있습니다. `새로 계산` 을
          눌러보세요.
        </Notice>
      )}

      {/* 구간 목록 */}
      <ol className="space-y-0">
        <li className="flex items-center gap-3 py-1.5">
          <span className="tabular w-11 shrink-0 text-xs text-ink-400">
            {plan.dayStartAt}
          </span>
          <span className="h-2 w-2 shrink-0 rounded-full bg-ink-400" />
          <span className="text-sm text-ink-700">{plan.legs[0]?.from.label ?? '출발지'}</span>
        </li>

        {plan.legs.map((leg, index) => (
          <LegRow
            key={`${leg.scheduleId ?? 'end'}-${index}`}
            leg={leg}
            canMoveUp={index > 0 && leg.scheduleId !== null && !leg.arrivalFixed}
            canMoveDown={
              index < plan.legs.length - 1 && leg.scheduleId !== null && !leg.arrivalFixed
            }
            onMove={onMove}
          />
        ))}
      </ol>

      {/* RBR-42 손으로 옮긴 자리가 있으면 풀 수 있게 한다 */}
      {hasPinned && (
        <div className="flex items-center justify-between rounded-xl bg-ink-50 px-3.5 py-2.5">
          <span className="text-xs text-ink-500">손으로 잡은 자리가 있습니다</span>
          <Button variant="subtle" onClick={onUnpin}>
            고정 풀기
          </Button>
        </div>
      )}

      {/* RBR-22 빠진 일정을 성공 결과와 함께 알린다 */}
      {plan.excluded.length > 0 && <ExcludedList excluded={plan.excluded} />}
    </div>
  )
}

function LegRow({
  leg,
  canMoveUp,
  canMoveDown,
  onMove,
}: {
  leg: RouteLeg
  canMoveUp: boolean
  canMoveDown: boolean
  onMove: (scheduleId: string, direction: 'up' | 'down') => void
}) {
  return (
    <>
      {/* 이동 */}
      <li className="flex items-start gap-3 py-1">
        <span className="w-11 shrink-0" />
        <span className="ml-[3px] w-[2px] shrink-0 self-stretch bg-ink-200" style={{ minHeight: '1.5rem' }} />
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 py-0.5 text-xs text-ink-400">
          <span className="tabular">↓ {formatDuration(leg.travelMinutes)}</span>
          <span>{TRAVEL_MODE_LABEL[leg.mode]}</span>
          <FreshnessMark leg={leg} />
          {/* RBR-13 기다리는 시간을 보여준다. 총 이동 시간에는 안 들어간다 */}
          {leg.waitMinutes > 0 && (
            <span className="tabular text-violet-500">
              · {formatDuration(leg.waitMinutes)} 기다림
            </span>
          )}
        </span>
      </li>

      {/* 도착 */}
      <li className="flex items-center gap-3 py-1.5">
        <span className="tabular w-11 shrink-0 text-xs text-ink-600">{leg.arriveAt}</span>
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${
            leg.arrivalFixed ? 'bg-ink-800' : 'bg-ink-300'
          }`}
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium text-ink-900">
              {leg.destinationLabel}
            </span>
            {/* 고정형은 앱이 시각을 바꾸지 않았음을 보인다 (RBR-2) */}
            {leg.arrivalFixed && (
              <span title="시간 고정형" className="shrink-0 text-ink-500">
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="8" cy="8" r="6" />
                  <path d="M8 4.8V8l2.2 1.6" strokeLinecap="round" />
                </svg>
              </span>
            )}
            {leg.pinned && (
              <span className="shrink-0 rounded bg-ink-100 px-1.5 py-0.5 text-[0.65rem] font-medium text-ink-600">
                고정
              </span>
            )}
            {leg.crossesMidnight && (
              <span title="자정을 넘깁니다" className="shrink-0 text-xs text-violet-500">
                +1
              </span>
            )}
          </span>
          {leg.stayMinutes > 0 && (
            <span className="tabular mt-0.5 block text-xs text-ink-400">
              {formatDuration(leg.stayMinutes)} 머묾
            </span>
          )}
        </span>

        {/* RBR-42 위 · 아래 단추로 한 칸씩 옮긴다 (Q2-A) */}
        {leg.scheduleId !== null && (canMoveUp || canMoveDown) && (
          <span className="flex shrink-0 flex-col">
            <MoveButton
              disabled={!canMoveUp}
              onClick={() => onMove(leg.scheduleId!, 'up')}
              label="위로"
            >
              <path d="M3 7l4-4 4 4" />
            </MoveButton>
            <MoveButton
              disabled={!canMoveDown}
              onClick={() => onMove(leg.scheduleId!, 'down')}
              label="아래로"
            >
              <path d="M3 4l4 4 4-4" />
            </MoveButton>
          </span>
        )}
      </li>
    </>
  )
}

/** 이동 시간이 어디서 왔는지 — cached 는 알리지 않는다 (RBR-34) */
function FreshnessMark({ leg }: { leg: RouteLeg }) {
  if (leg.freshness === 'estimated') {
    return (
      <span title="직선거리로 어림한 값" className="text-ink-400">
        · 어림값
      </span>
    )
  }
  if (leg.freshness === 'stale') {
    return (
      <span title="길찾기에 닿지 못해 전에 받은 값" className="text-amber-600">
        · 낡은 값
      </span>
    )
  }
  return null
}

// ── 도착 불가 ────────────────────────────────────────────────

function InfeasibleView({
  problems,
  excluded,
}: {
  problems: readonly InfeasibleArrival[]
  excluded: readonly ExcludedSchedule[]
}) {
  return (
    <div className="fade-enter space-y-4">
      {/* RBR-17 순서를 아예 보여주지 않는다 */}
      <Notice tone="warn" title="제때 도착할 수 없는 일정이 있습니다">
        어떤 순서로도 시간을 맞출 수 없어 동선을 내지 않았습니다.
      </Notice>

      <ul className="space-y-3">
        {problems.map((problem, index) => (
          <li
            key={`${problem.scheduleId}-${index}`}
            className="rounded-xl border border-amber-200 bg-amber-50/60 px-3.5 py-3"
          >
            <p className="text-sm font-semibold text-ink-900">
              {problem.title}{' '}
              <span className="tabular font-normal text-ink-600">
                {problem.requiredArrival}
              </span>
            </p>
            <p className="tabular mt-1 text-xs leading-relaxed text-ink-600">
              {problem.causedByTitle !== null && <>{problem.causedByTitle} 다음으로 </>}
              가면 {problem.earliestArrival} 에 닿습니다.{' '}
              <span className="font-semibold text-amber-800">
                {formatDuration(problem.shortMinutes)} 모자랍니다.
              </span>
            </p>
          </li>
        ))}
      </ul>

      <p className="text-xs leading-relaxed text-ink-500">
        도착 시각이나 이동 수단, 머무는 시간을 고쳐보세요. 가능해지면 경고가 사라집니다.
      </p>

      {excluded.length > 0 && <ExcludedList excluded={excluded} />}
    </div>
  )
}

// ── 빠진 일정 ────────────────────────────────────────────────

function ExcludedList({ excluded }: { excluded: readonly ExcludedSchedule[] }) {
  const hasFixed = excluded.some((item) => item.wasFixed)

  return (
    <div
      className={`rounded-xl border px-3.5 py-3 ${
        hasFixed ? 'border-amber-200 bg-amber-50' : 'border-ink-200 bg-ink-50'
      }`}
    >
      <p className="text-xs font-semibold text-ink-700">
        동선에서 빠진 일정 {excluded.length}개
      </p>
      <ul className="mt-1.5 space-y-1">
        {excluded.map((item) => (
          <li key={item.scheduleId} className="text-xs leading-relaxed text-ink-600">
            · {item.title}
            {/* RBR-25 고정형이 빠지면 도착 불가 판정도 사라진다. 더 눈에 띄게 */}
            {item.wasFixed && (
              <span className="ml-1 font-semibold text-amber-800">(시간 고정형)</span>
            )}
            <span className="ml-1 text-ink-400">
              {item.reason === 'empty-query'
                ? '— 장소가 아직 정해지지 않았습니다'
                : '— 주소를 찾지 못했습니다'}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-ink-500">
        일정을 열어 장소를 찾으면 동선에 들어갑니다.
        {hasFixed && ' 시간 고정형이 빠지면 늦을지 여부도 알 수 없습니다.'}
      </p>
    </div>
  )
}

// ── 계산 불가 ────────────────────────────────────────────────

function BlockedView({
  result,
}: {
  result: Extract<RoutePlanResult, { kind: 'blocked' }>
}) {
  const { block } = result

  if (block.kind === 'no-origin') {
    return (
      <Notice tone="info">
        하루의 출발지를 먼저 정해주세요. 출발지가 없으면 첫 구간을 계산할 수 없습니다.
      </Notice>
    )
  }

  if (block.kind === 'no-schedules') {
    return (
      <div className="space-y-3">
        <Notice tone="info">계산할 일정이 없습니다.</Notice>
        {block.excluded.length > 0 && <ExcludedList excluded={block.excluded} />}
      </div>
    )
  }

  return (
    <Notice tone="warn" title="이동 시간을 알 수 없습니다">
      {block.legLabel} 구간의 이동 시간을 구하지 못했습니다.
    </Notice>
  )
}

function NotReady({ reason }: { reason: RouteBlockReason }) {
  if (reason.kind === 'no-day-setting') {
    return (
      <Notice tone="info">
        하루의 출발지를 먼저 정해주세요. 위 <span className="font-medium">하루 시작과 끝</span>{' '}
        에서 정할 수 있습니다.
      </Notice>
    )
  }

  if (reason.kind === 'no-schedules') {
    return (
      <p className="py-4 text-center text-sm text-ink-400">
        일정을 넣으면 동선을 추천합니다.
      </p>
    )
  }

  return (
    <Notice tone="warn" title="계산할 일정이 없습니다">
      장소를 못 찾은 일정만 있습니다 — {reason.titles.join(' · ')}. 일정을 열어 장소를
      찾아주세요.
    </Notice>
  )
}

function MoveButton({
  disabled,
  onClick,
  label,
  children,
}: {
  disabled: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className="rounded p-0.5 text-ink-300 transition hover:bg-ink-100 hover:text-ink-600 disabled:opacity-30 disabled:hover:bg-transparent"
    >
      <svg
        viewBox="0 0 14 12"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
    </button>
  )
}
