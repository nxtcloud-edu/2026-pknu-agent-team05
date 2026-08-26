// V-9 데이터 관리 패널
// 근거: frontend-components.md V-9 · business-rules.md BR-44 · BR-45 · BR-52
//
// 사용자가 바꾸는 설정만 보여준다. 앱이 정하는 값(캐시 유지 시간 등)은 여기 없다.

import { useState } from 'react'
import type { TravelMode } from '../domain/schedule/types'
import { TRAVEL_MODE_LABEL } from '../domain/schedule/types'
import {
  BUFFER_MINUTES_MAX,
  BUFFER_MINUTES_MIN,
  PLACE_SEARCH_RADIUS_MAX_METERS,
  PLACE_SEARCH_RADIUS_MIN_METERS,
} from '../domain/settings'
import type { Settings, UserSettings } from '../domain/settings'
import { isValidTime } from '../domain/time'
import { Button, Field, Notice, Panel, SegmentedControl, TextInput } from './parts'

export function DataPanel({
  settings,
  counts,
  hasMapKeys,
  onSaveSettings,
  onClearAll,
  onClose,
}: {
  settings: Settings
  counts: {
    schedules: number
    rules: number
    days: number
    participants: number
  }
  /** 지도 API 키가 하나라도 있는지 — 없으면 어림값만 쓰인다 (R-NFR-4.5) */
  hasMapKeys: boolean
  onSaveSettings: (next: UserSettings) => void
  onClearAll: () => void
  onClose: () => void
}) {
  const [buffer, setBuffer] = useState(String(settings.user.bufferMinutes))
  const [defaultMode, setDefaultMode] = useState<TravelMode>(
    settings.user.defaultTravelMode,
  )
  const [radius, setRadius] = useState(String(settings.user.placeSearchRadiusMeters))
  const [dayStart, setDayStart] = useState(settings.user.dayStartTime)
  const [confirming, setConfirming] = useState(false)

  const handleSave = () => {
    onSaveSettings({
      bufferMinutes: clamp(Number(buffer), BUFFER_MINUTES_MIN, BUFFER_MINUTES_MAX),
      defaultTravelMode: defaultMode,
      placeSearchRadiusMeters: clamp(
        Number(radius),
        PLACE_SEARCH_RADIUS_MIN_METERS,
        PLACE_SEARCH_RADIUS_MAX_METERS,
      ),
      dayStartTime: isValidTime(dayStart) ? dayStart : settings.user.dayStartTime,
    })
    onClose()
  }

  return (
    <Panel
      title="데이터와 설정"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button variant="primary" onClick={handleSave}>
            저장
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <section>
          <h3 className="mb-3 text-sm font-semibold text-ink-800">보관된 것</h3>
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="일정" value={counts.schedules} />
            <Stat label="반복 규칙" value={counts.rules} />
            <Stat label="날짜" value={counts.days} />
            <Stat label="참여자" value={counts.participants} />
          </dl>
        </section>

        <section className="space-y-5 border-t border-ink-100 pt-5">
          <h3 className="text-sm font-semibold text-ink-800">설정</h3>

          <Field label="기본 이동 수단" hint="일정에서 고르지 않았을 때">
            <SegmentedControl<TravelMode>
              value={defaultMode}
              onChange={setDefaultMode}
              options={[
                { value: 'walk', label: TRAVEL_MODE_LABEL.walk },
                { value: 'transit', label: TRAVEL_MODE_LABEL.transit },
                { value: 'car', label: TRAVEL_MODE_LABEL.car },
              ]}
            />
          </Field>

          {/* route-planning Q3-B 가 만든 값 (RBR-8) */}
          <Field label="앞날의 하루 시작 시각" hint="동선 계산의 시작점">
            <TextInput type="time" value={dayStart} onChange={setDayStart} />
            <p className="mt-1.5 text-xs leading-relaxed text-ink-400">
              오늘 동선은 지금 시각을 씁니다. 앞날은 이 시각에 나간다고 보고 계산합니다.
            </p>
          </Field>

          <Field
            label="출발 알림 여유 시간"
            hint="분 · 출발 알림 기능에서 쓰입니다"
          >
            <TextInput
              type="number"
              min={BUFFER_MINUTES_MIN}
              max={BUFFER_MINUTES_MAX}
              value={buffer}
              onChange={setBuffer}
            />
          </Field>

          <Field label="만남 장소 검색 반경" hint="m · 중간지점 기능에서 쓰입니다">
            <TextInput
              type="number"
              min={PLACE_SEARCH_RADIUS_MIN_METERS}
              max={PLACE_SEARCH_RADIUS_MAX_METERS}
              value={radius}
              onChange={setRadius}
            />
          </Field>

          <Notice tone="info">
            여유 시간과 검색 반경은 아직 쓰이지 않습니다. 출발 알림과 중간지점 기능이 붙으면
            이 값을 읽습니다.
          </Notice>

          {!hasMapKeys && (
            <Notice tone="warn" title="지도 API 키가 없습니다">
              도보 · 대중교통 이동 시간은 원래 직선거리로 어림합니다. 키가 없으면 자동차도
              어림값을 씁니다. <code className="text-xs">.env.local</code> 에{' '}
              <code className="text-xs">VITE_KAKAO_REST_KEY</code> 와{' '}
              <code className="text-xs">VITE_KAKAO_MOBILITY_KEY</code> 를 넣으면 장소 검색과
              실시간 자동차 이동 시간이 켜집니다.
            </Notice>
          )}
        </section>

        <section className="border-t border-ink-100 pt-5">
          <h3 className="mb-3 text-sm font-semibold text-ink-800">전체 삭제</h3>

          {/* BR-45 되돌릴 수 없음을 먼저 알린다 */}
          {!confirming ? (
            <div className="space-y-3">
              <p className="text-sm leading-relaxed text-ink-500">
                일정 · 반복 규칙 · 참여자 정보가 모두 지워집니다. 이 브라우저에만 저장돼
                있어 되돌릴 수 없습니다.
              </p>
              <Button variant="ghost" onClick={() => setConfirming(true)}>
                전체 삭제
              </Button>
            </div>
          ) : (
            <div className="fade-enter space-y-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5">
              <p className="text-sm font-medium leading-relaxed text-red-800">
                정말 지울까요? 되돌릴 수 없습니다.
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setConfirming(false)}>
                  취소
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    onClearAll()
                    setConfirming(false)
                    onClose()
                  }}
                >
                  지운다
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </Panel>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-ink-50 px-3 py-2.5">
      <dt className="text-xs text-ink-400">{label}</dt>
      <dd className="tabular mt-0.5 text-lg font-semibold text-ink-900">{value}</dd>
    </div>
  )
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(Math.max(value, min), max)
}
