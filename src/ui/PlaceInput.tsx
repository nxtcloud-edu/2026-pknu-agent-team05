// 장소 고르기 (Q2-C)
// 근거: frontend-components.md `장소 고르기` · business-rules.md BR-21 ~ BR-26
//
// 글자를 치고, 후보가 여럿이면 골라 확정한다.
// 후보를 구하는 것은 외부 조회이고, 그 창구(C-7)는 route-planning 단위 소유다 (BR-21).
// 그래서 이 단위에서는 **고르는 흐름과 담을 자리만** 만든다. 실제 조회는 뒤 단위가 잇는다 (BR-22).

import type { Place } from '../domain/schedule/types'
import { TextInput } from './parts'

export function PlaceInput({
  place,
  onChange,
  invalid = false,
  placeholder = '주소나 장소 이름',
}: {
  place: Place
  onChange: (place: Place) => void
  invalid?: boolean
  placeholder?: string
}) {
  // BR-24 글자가 바뀌면 좌표와 확정된 이름을 지운다. 다시 변환돼야 한다
  const handleQueryChange = (query: string) => {
    if (query === place.query) return
    onChange({ query, resolvedName: null, coord: null, coordAt: null })
  }

  return (
    <div className="space-y-2">
      <TextInput
        value={place.query}
        onChange={handleQueryChange}
        placeholder={placeholder}
        invalid={invalid}
      />

      {place.query.trim() !== '' && place.coord === null && (
        <p className="flex items-start gap-1.5 text-xs leading-relaxed text-ink-400">
          <svg
            viewBox="0 0 16 16"
            className="mt-0.5 h-3.5 w-3.5 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M8 14s4.5-4.2 4.5-7.5a4.5 4.5 0 10-9 0C3.5 9.8 8 14 8 14z" />
            <circle cx="8" cy="6.5" r="1.6" />
          </svg>
          <span>
            좌표는 아직 없습니다. 지도 · 길찾기 연동이 붙으면 이 글자로 후보를 찾아 고르게
            됩니다. 그때까지도 일정은 저장됩니다.
          </span>
        </p>
      )}

      {place.coord !== null && (
        <p className="flex items-center gap-1.5 text-xs text-emerald-700">
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor">
            <path d="M6.6 11.4L3.5 8.3l1.1-1.1 2 2 4.8-4.8 1.1 1.1z" />
          </svg>
          {place.resolvedName ?? place.query}
          <span className="tabular text-ink-400">
            {place.coord.lat.toFixed(4)}, {place.coord.lng.toFixed(4)}
          </span>
        </p>
      )}
    </div>
  )
}
