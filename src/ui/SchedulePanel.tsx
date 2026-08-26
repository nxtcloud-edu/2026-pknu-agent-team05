// V-2 일정 상세 패널
// 근거: frontend-components.md V-2 · business-rules.md BR-1 ~ BR-8 · BR-35 · BR-36
//
// 빈 상태로 열리면 새로 넣는 것, 일정을 들고 열리면 고치는 것이다.

import { useMemo, useState } from 'react'
import type { PlaceLookup } from '../domain/route/types'
import type { ExpandedSchedule } from '../domain/schedule/expand'
import { validateRecurringDraft, validateScheduleDraft } from '../domain/schedule/rules'
import type { RuleViolation, ScheduleField } from '../domain/schedule/rules'
import type { DateKey, Place, ScheduleKind, TravelMode, Weekday } from '../domain/schedule/types'
import { TRAVEL_MODE_LABEL, WEEKDAY_LABEL, emptyPlace } from '../domain/schedule/types'
import { STAY_MINUTES_MIN } from '../domain/settings'
import { formatDateLabel, weekdayOf } from '../domain/time'
import type { RecurrenceInput, ScheduleFormValue } from '../app/store'
import { PlaceInput } from './PlaceInput'
import { Button, Field, Notice, Panel, SegmentedControl, TextInput } from './parts'

export function SchedulePanel({
  date,
  target,
  defaultTravelMode,
  searchPlaces,
  searchEnabled,
  onSave,
  onRemove,
  onRemoveRule,
  onClose,
}: {
  date: DateKey
  /** null 이면 새로 넣는 것 */
  target: ExpandedSchedule | null
  defaultTravelMode: TravelMode
  searchPlaces?: PlaceLookup
  searchEnabled?: boolean
  onSave: (value: ScheduleFormValue) => void
  onRemove: () => void
  onRemoveRule: (ruleId: string) => void
  onClose: () => void
}) {
  const isNew = target === null
  const fromRecurring = target?.origin.kind === 'recurring'

  const [title, setTitle] = useState(target?.title ?? '')
  const [place, setPlace] = useState<Place>(target?.place ?? emptyPlace())
  const [stayMinutes, setStayMinutes] = useState(String(target?.stayMinutes ?? 60))
  const [kind, setKind] = useState<ScheduleKind>(target?.kind ?? 'fixed')
  const [arrivalTime, setArrivalTime] = useState(target?.arrivalTime ?? '')
  const [travelMode, setTravelMode] = useState<TravelMode>(
    target?.travelMode ?? defaultTravelMode,
  )
  const [isAppointment, setIsAppointment] = useState(target?.isAppointment ?? false)

  // 반복 — 새로 넣을 때만 켤 수 있다. 이미 있는 일정의 반복 여부는 바꾸지 않는다
  const [recurrenceOn, setRecurrenceOn] = useState(false)
  const [weekday, setWeekday] = useState<Weekday>(() => weekdayOf(date))
  const [startDate, setStartDate] = useState<DateKey>(date)
  const [endDate, setEndDate] = useState('')

  const [submitted, setSubmitted] = useState(false)

  const recurrence: RecurrenceInput = recurrenceOn
    ? { enabled: true, weekday, startDate, endDate: endDate === '' ? null : endDate }
    : { enabled: false }

  const draft = {
    title,
    placeQuery: place.query,
    stayMinutes: Number(stayMinutes),
    kind,
    arrivalTime: arrivalTime === '' ? null : arrivalTime,
    travelMode,
  }

  const violations: readonly RuleViolation[] = useMemo(() => {
    if (recurrenceOn) {
      return validateRecurringDraft({
        ...draft,
        startDate,
        endDate: endDate === '' ? null : endDate,
      })
    }
    return validateScheduleDraft(draft)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, place.query, stayMinutes, kind, arrivalTime, travelMode, recurrenceOn, startDate, endDate])

  const errorOf = (field: ScheduleField): string | undefined => {
    if (!submitted) return undefined
    return violations.find((violation) => violation.field === field)?.message
  }

  const handleSubmit = () => {
    setSubmitted(true)
    if (violations.length > 0) return

    onSave({
      ...draft,
      place,
      isAppointment,
      recurrence,
    })
  }

  // BR-6 유형을 유연형으로 바꾸면 도착 시각을 지운다
  const handleKindChange = (next: ScheduleKind) => {
    setKind(next)
    if (next === 'flexible') setArrivalTime('')
  }

  return (
    <Panel
      title={isNew ? '일정 넣기' : '일정 고치기'}
      description={formatDateLabel(date)}
      onClose={onClose}
      footer={
        <>
          {!isNew && (
            <div className="mr-auto flex gap-2">
              <Button variant="subtle" onClick={onRemove}>
                {fromRecurring ? '이 날만 건너뛰기' : '지우기'}
              </Button>
              {fromRecurring && target.origin.kind === 'recurring' && (
                <Button
                  variant="subtle"
                  onClick={() => onRemoveRule(target.origin.kind === 'recurring' ? target.origin.ruleId : '')}
                >
                  반복 전체 지우기
                </Button>
              )}
            </div>
          )}
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            저장
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* BR-35 반복에서 온 일정을 고칠 때 무엇이 일어나는지 미리 알린다 */}
        {fromRecurring && (
          <Notice tone="recurring" title="반복에서 나온 일정입니다">
            매주 {WEEKDAY_LABEL[weekdayOf(date)]}요일 반복에서 나왔습니다. 고치면{' '}
            {formatDateLabel(date)} 하루만 바뀝니다. 다음 주는 그대로입니다.
          </Notice>
        )}

        <Field label="제목" error={errorOf('title')}>
          <TextInput
            value={title}
            onChange={setTitle}
            placeholder="어디에 무엇을 하러 가나요"
            invalid={errorOf('title') !== undefined}
          />
        </Field>

        <Field
          label="장소"
          hint="주소나 장소 이름"
          error={errorOf('place')}
        >
          <PlaceInput
            place={place}
            onChange={setPlace}
            invalid={errorOf('place') !== undefined}
            searchPlaces={searchPlaces}
            searchEnabled={searchEnabled}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="유형">
            <SegmentedControl<ScheduleKind>
              value={kind}
              onChange={handleKindChange}
              options={[
                { value: 'fixed', label: '시간 고정' },
                { value: 'flexible', label: '아무 때나' },
              ]}
            />
          </Field>

          {/* BR-4 고정형을 고르면 나타나고 필수다. BR-5 유연형이면 사라진다 */}
          {kind === 'fixed' && (
            <Field label="도착 시각" error={errorOf('arrivalTime')}>
              <TextInput
                type="time"
                value={arrivalTime}
                onChange={setArrivalTime}
                invalid={errorOf('arrivalTime') !== undefined}
              />
            </Field>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="머무는 시간" hint="분" error={errorOf('stayMinutes')}>
            <TextInput
              type="number"
              min={STAY_MINUTES_MIN}
              value={stayMinutes}
              onChange={setStayMinutes}
              invalid={errorOf('stayMinutes') !== undefined}
            />
          </Field>

          <Field label="이동 수단" hint="고르지 않으면 기본값">
            <SegmentedControl<TravelMode>
              value={travelMode}
              onChange={setTravelMode}
              options={[
                { value: 'walk', label: TRAVEL_MODE_LABEL.walk },
                { value: 'transit', label: TRAVEL_MODE_LABEL.transit },
                { value: 'car', label: TRAVEL_MODE_LABEL.car },
              ]}
            />
          </Field>
        </div>

        <div className="rounded-xl border border-ink-200 bg-ink-50 px-4 py-3.5">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={isAppointment}
              onChange={(event) => setIsAppointment(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-ink-300 accent-ink-900"
            />
            <span className="text-sm">
              <span className="font-medium text-ink-800">약속입니다</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">
                참여자를 넣고 중간지점을 계산하는 기능은 뒤 작업 단위에서 붙습니다. 지금은
                약속 표시만 남습니다.
              </span>
            </span>
          </label>
        </div>

        {/* 반복 — 새로 넣을 때만 (Q1-A 요일 하나) */}
        {isNew && (
          <div className="rounded-xl border border-ink-200 px-4 py-3.5">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={recurrenceOn}
                onChange={(event) => setRecurrenceOn(event.target.checked)}
                className="h-4 w-4 rounded border-ink-300 accent-ink-900"
              />
              <span className="text-sm font-medium text-ink-800">매주 되풀이합니다</span>
            </label>

            {recurrenceOn && (
              <div className="fade-enter mt-4 space-y-4">
                <Field label="요일" hint="여러 요일은 일정을 나눠 넣습니다">
                  <div className="flex gap-1">
                    {([0, 1, 2, 3, 4, 5, 6] as const).map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setWeekday(day)}
                        className={`h-9 w-9 rounded-lg text-sm font-medium transition ${
                          weekday === day
                            ? 'bg-ink-900 text-white'
                            : 'bg-ink-50 text-ink-500 hover:bg-ink-100'
                        }`}
                      >
                        {WEEKDAY_LABEL[day]}
                      </button>
                    ))}
                  </div>
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="언제부터">
                    <TextInput type="date" value={startDate} onChange={setStartDate} />
                  </Field>
                  <Field label="언제까지" hint="비우면 끝이 없습니다" error={errorOf('endDate')}>
                    <TextInput
                      type="date"
                      value={endDate}
                      onChange={setEndDate}
                      invalid={errorOf('endDate') !== undefined}
                    />
                  </Field>
                </div>

                <Notice tone="info">
                  미래 날짜의 일정을 미리 만들지 않습니다. 날짜를 열 때마다 규칙에서 펼칩니다.
                  그날만 고치거나 건너뛸 수 있습니다.
                </Notice>
              </div>
            )}
          </div>
        )}
      </div>
    </Panel>
  )
}
