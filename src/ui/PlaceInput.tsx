// 장소 고르기 (Q2-C)
// 근거: schedule-core/frontend-components.md `장소 고르기` · route-planning/frontend-components.md
//       business-rules.md BR-21 ~ BR-26 · RBR-35 ~ RBR-40
//
// ── route-planning STEP 05 에서 채운 것 (unit-of-work.md Q4-C · 예정된 자리) ──
// schedule-core 에서는 "좌표는 아직 없습니다" 안내만 있었다.
// BR-21 이 좌표 채우기를 route-planning 으로 넘겼으므로 여기서 후보 찾기·고르기를 넣는다.

import { useState } from 'react'
import type { PlaceCandidate, PlaceLookup } from '../domain/route/types'
import { candidateToPlace } from '../domain/route/types'
import type { Place } from '../domain/schedule/types'
import { Button, TextInput } from './parts'

type SearchState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'searching' }
  /** RBR-36 여럿이면 골라야 확정된다 */
  | { readonly kind: 'choosing'; readonly candidates: readonly PlaceCandidate[] }
  /** RBR-38 하나도 없으면 좌표를 비워 둔다 */
  | { readonly kind: 'none' }
  /** 키가 없거나 호출이 실패했다 */
  | { readonly kind: 'unavailable' }

export function PlaceInput({
  place,
  onChange,
  invalid = false,
  placeholder = '주소나 장소 이름',
  searchPlaces,
  searchEnabled = true,
}: {
  place: Place
  onChange: (place: Place) => void
  invalid?: boolean
  placeholder?: string
  /** C-7 창구. 없으면 찾기 단추를 내지 않는다 */
  searchPlaces?: PlaceLookup
  searchEnabled?: boolean
}) {
  const [state, setState] = useState<SearchState>({ kind: 'idle' })

  // BR-24 글자가 바뀌면 좌표와 확정된 이름을 지운다. 다시 찾아야 한다
  const handleQueryChange = (query: string) => {
    if (query === place.query) return
    setState({ kind: 'idle' })
    onChange({ query, resolvedName: null, coord: null, coordAt: null })
  }

  const handleSearch = async () => {
    if (searchPlaces === undefined) return
    const query = place.query.trim()
    if (query === '') return

    setState({ kind: 'searching' })
    const candidates = await searchPlaces(query)

    if (candidates.length === 0) {
      setState(searchEnabled ? { kind: 'none' } : { kind: 'unavailable' })
      return
    }

    // RBR-37 후보가 하나면 자동으로 확정한다
    if (candidates.length === 1) {
      onChange(candidateToPlace(place.query, candidates[0]!))
      setState({ kind: 'idle' })
      return
    }

    setState({ kind: 'choosing', candidates })
  }

  const handlePick = (candidate: PlaceCandidate) => {
    onChange(candidateToPlace(place.query, candidate))
    setState({ kind: 'idle' })
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <TextInput
            value={place.query}
            onChange={handleQueryChange}
            placeholder={placeholder}
            invalid={invalid}
          />
        </div>
        {searchPlaces !== undefined && (
          <Button
            variant="ghost"
            onClick={handleSearch}
            disabled={place.query.trim() === '' || state.kind === 'searching'}
          >
            {state.kind === 'searching' ? '찾는 중' : '찾기'}
          </Button>
        )}
      </div>

      {/* 확정된 상태 */}
      {place.coord !== null && (
        <p className="fade-enter flex flex-wrap items-center gap-1.5 text-xs text-emerald-700">
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="currentColor">
            <path d="M6.6 11.4L3.5 8.3l1.1-1.1 2 2 4.8-4.8 1.1 1.1z" />
          </svg>
          <span className="font-medium">{place.resolvedName ?? place.query}</span>
          <span className="tabular text-ink-400">
            {place.coord.lat.toFixed(4)}, {place.coord.lng.toFixed(4)}
          </span>
        </p>
      )}

      {/* RBR-36 여럿이면 골라야 확정된다 */}
      {state.kind === 'choosing' && (
        <ul className="fade-enter divide-y divide-ink-100 overflow-hidden rounded-xl border border-ink-200">
          {state.candidates.map((candidate, index) => (
            <li key={`${candidate.name}-${index}`}>
              <button
                type="button"
                onClick={() => handlePick(candidate)}
                className="w-full px-3 py-2.5 text-left transition hover:bg-ink-50"
              >
                <span className="block text-sm font-medium text-ink-900">
                  {candidate.name}
                </span>
                {candidate.address !== null && (
                  <span className="mt-0.5 block text-xs text-ink-400">
                    {candidate.address}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* RBR-38 하나도 없다. 저장은 되고 동선에서 빠진다 */}
      {state.kind === 'none' && (
        <p className="fade-enter text-xs leading-relaxed text-amber-700">
          찾지 못했습니다. 주소를 다르게 적어보세요. 이대로 저장하면 이 일정은 동선 계산에서
          빠집니다.
        </p>
      )}

      {state.kind === 'unavailable' && (
        <p className="fade-enter text-xs leading-relaxed text-amber-700">
          장소를 찾을 수 없습니다. 카카오 API 키가 설정되지 않았습니다. 이대로 저장하면 이
          일정은 동선 계산에서 빠집니다.
        </p>
      )}

      {/* 아직 찾지 않은 상태 */}
      {place.coord === null &&
        place.query.trim() !== '' &&
        state.kind === 'idle' &&
        searchPlaces !== undefined && (
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
              좌표가 없습니다. <span className="font-medium">찾기</span> 를 눌러 장소를
              확정하면 동선 계산에 들어갑니다.
            </span>
          </p>
        )}
    </div>
  )
}
