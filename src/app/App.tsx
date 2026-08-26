// 화면을 잇는 자리 — 패널이 열리고 닫히는 규칙을 여기서 지킨다
// 근거: frontend-components.md `패널이 열리고 닫히는 규칙`
//
//   · 한 번에 패널 하나만 열린다
//   · 패널이 열려 있어도 하루 보기는 보인다
//   · 저장하거나 취소하면 닫힌다
//   · 날짜를 옮기면 열린 패널이 닫힌다

import { useCallback, useState } from 'react'
import type { ExpandedSchedule } from '../domain/schedule/expand'
import type { DateKey } from '../domain/schedule/types'
import { DataPanel } from '../ui/DataPanel'
import { DaySettingPanel } from '../ui/DaySettingPanel'
import { DayView } from '../ui/DayView'
import { SchedulePanel } from '../ui/SchedulePanel'
import type { ScheduleFormValue } from './store'
import { useAppStore } from './store'

type OpenPanel =
  | { readonly kind: 'none' }
  | { readonly kind: 'schedule'; readonly target: ExpandedSchedule | null }
  | { readonly kind: 'daySetting' }
  | { readonly kind: 'data' }

export function App() {
  const store = useAppStore()
  const [panel, setPanel] = useState<OpenPanel>({ kind: 'none' })

  const close = useCallback(() => setPanel({ kind: 'none' }), [])

  // 날짜를 옮기면 열린 패널이 닫힌다
  const changeDate = useCallback(
    (next: DateKey) => {
      store.setDate(next)
      setPanel({ kind: 'none' })
    },
    [store],
  )

  const handleSaveSchedule = (value: ScheduleFormValue) => {
    if (panel.kind !== 'schedule') return
    if (panel.target === null) {
      store.addSchedule(value)
    } else {
      store.updateSchedule(panel.target, value)
    }
    close()
  }

  const handleRemoveSchedule = () => {
    if (panel.kind !== 'schedule' || panel.target === null) return
    store.removeSchedule(panel.target)
    close()
  }

  const handleRemoveRule = (ruleId: string) => {
    store.removeRule(ruleId)
    close()
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <Header />

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
          {/* 하루 보기는 늘 보인다 */}
          <DayView
            date={store.date}
            onDateChange={changeDate}
            schedules={store.schedules}
            daySetting={store.daySetting}
            settings={store.settings}
            isStale={store.isStale}
            isEmpty={store.isEmpty}
            onOpenSchedule={(schedule) => setPanel({ kind: 'schedule', target: schedule })}
            onOpenNewSchedule={() => setPanel({ kind: 'schedule', target: null })}
            onOpenDaySetting={() => setPanel({ kind: 'daySetting' })}
            onOpenData={() => setPanel({ kind: 'data' })}
            onToggleDone={store.toggleDone}
            onInsertExamples={store.insertExamples}
          />

          {/* 한 번에 패널 하나만 */}
          {panel.kind !== 'none' && (
            <aside className="lg:sticky lg:top-10">
              {panel.kind === 'schedule' && (
                <SchedulePanel
                  key={panel.target?.id ?? 'new'}
                  date={store.date}
                  target={panel.target}
                  defaultTravelMode={store.settings.user.defaultTravelMode}
                  onSave={handleSaveSchedule}
                  onRemove={handleRemoveSchedule}
                  onRemoveRule={handleRemoveRule}
                  onClose={close}
                />
              )}

              {panel.kind === 'daySetting' && (
                <DaySettingPanel
                  key={store.date}
                  date={store.date}
                  daySetting={store.daySetting}
                  onSave={(origin, destination) => {
                    store.saveDaySetting(origin, destination)
                    close()
                  }}
                  onClose={close}
                />
              )}

              {panel.kind === 'data' && (
                <DataPanel
                  settings={store.settings}
                  counts={store.counts}
                  onSaveSettings={store.updateUserSettings}
                  onClearAll={store.clearAllData}
                  onClose={close}
                />
              )}
            </aside>
          )}
        </div>

        <Footer />
      </div>
    </div>
  )
}

function Header() {
  return (
    <header>
      <h1 className="text-xl font-bold tracking-tight text-ink-900">외출 동선 도우미</h1>
      <p className="mt-1 text-sm text-ink-500">
        갈 곳을 넣어두면 동선을 추천하고, 나가야 할 때 알려줍니다.
      </p>
    </header>
  )
}

function Footer() {
  return (
    <footer className="mt-8 rounded-2xl border border-ink-200 bg-white/60 px-4 py-3.5">
      <p className="text-xs font-medium text-ink-500">지금 만들어진 것</p>
      <p className="mt-1.5 text-xs leading-relaxed text-ink-400">
        일정 관리와 저장까지입니다. 동선 추천 · 출발 알림 · 약속 중간지점은 다음 작업 단위에서
        붙습니다. 자료는 이 브라우저에만 남습니다.
      </p>
    </footer>
  )
}
