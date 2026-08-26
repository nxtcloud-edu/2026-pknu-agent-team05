// V-7 하루 설정 패널
// 근거: frontend-components.md V-7 · business-rules.md BR-18 ~ BR-20
//
// Q4-B 를 골랐으므로 하루 설정은 날짜마다 따로다. 그 사실을 화면에서 알린다.

import { useState } from 'react'
import type { PlaceLookup } from '../domain/route/types'
import type { DateKey, DaySetting, Place } from '../domain/schedule/types'
import { emptyPlace } from '../domain/schedule/types'
import { formatDateLabel } from '../domain/time'
import { PlaceInput } from './PlaceInput'
import { Button, Field, Notice, Panel } from './parts'

export function DaySettingPanel({
  date,
  daySetting,
  searchPlaces,
  searchEnabled,
  onSave,
  onClose,
}: {
  date: DateKey
  daySetting: DaySetting | null
  searchPlaces?: PlaceLookup
  searchEnabled?: boolean
  onSave: (origin: Place, destination: Place | null) => void
  onClose: () => void
}) {
  const [origin, setOrigin] = useState<Place>(daySetting?.origin ?? emptyPlace())
  const [useDestination, setUseDestination] = useState(daySetting?.destination !== null)
  const [destination, setDestination] = useState<Place>(
    daySetting?.destination ?? emptyPlace(),
  )
  const [submitted, setSubmitted] = useState(false)

  // BR-19 출발지는 필수다
  const originMissing = origin.query.trim() === ''

  const handleSubmit = () => {
    setSubmitted(true)
    if (originMissing) return
    onSave(origin, useDestination ? destination : null)
  }

  return (
    <Panel
      title="하루 설정"
      description={formatDateLabel(date)}
      onClose={onClose}
      footer={
        <>
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
        {/* Q4-B — 새 날짜를 열면 비어 있는 이유를 알린다 */}
        <Notice tone="info">
          이 설정은 <span className="font-semibold">{formatDateLabel(date)}</span> 에만
          적용됩니다. 다른 날짜는 따로 정해야 합니다.
        </Notice>

        <Field
          label="출발지"
          hint="하루가 시작되는 곳"
          error={submitted && originMissing ? '출발지를 넣어주세요.' : undefined}
        >
          <PlaceInput
            place={origin}
            onChange={setOrigin}
            invalid={submitted && originMissing}
            placeholder="집 주소 등"
            searchPlaces={searchPlaces}
            searchEnabled={searchEnabled}
          />
        </Field>

        <div className="rounded-xl border border-ink-200 px-4 py-3.5">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={useDestination}
              onChange={(event) => setUseDestination(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-ink-300 accent-ink-900"
            />
            <span className="text-sm">
              <span className="font-medium text-ink-800">마지막에 돌아갈 곳이 있습니다</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">
                끄면 마지막 일정에서 끝납니다. 돌아오는 구간을 계산에 넣지 않습니다.
              </span>
            </span>
          </label>

          {useDestination && (
            <div className="fade-enter mt-4">
              <Field label="마지막 도착지">
                <PlaceInput
                  place={destination}
                  onChange={setDestination}
                  placeholder="집 주소 등"
                  searchPlaces={searchPlaces}
                  searchEnabled={searchEnabled}
                />
              </Field>
            </div>
          )}
        </div>
      </div>
    </Panel>
  )
}
