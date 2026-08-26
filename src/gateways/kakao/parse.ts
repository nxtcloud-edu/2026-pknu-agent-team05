// 카카오 응답 해석 — Q5-C 가 따로 테스트하는 곳
// 근거: route-planning/nfr-requirements/tech-stack-decisions.md `응답 해석을 따로 테스트하는 이유`
//
// ⚠ 이 파일의 코드는 **아직 실제 응답으로 검증되지 않았다** (Q1-A).
//    API 키가 없어 응답을 받아볼 수 없었다. 문서를 보고 짐작해 썼다.
//    키를 넣고 처음 부를 때 아래 세 가지를 확인해야 한다.
//
//    1. 이동 시간의 단위 — 이 앱의 계산은 전부 **분** 기준이다. 카카오는 **초**로 준다고 보고 썼다.
//       틀리면 60배 어긋난 값이 흘러들어가 도착 불가 판정(RBR-16)이 엉뚱해진다.
//    2. 좌표의 순서 — 카카오는 경도를 `x`, 위도를 `y` 로 쓴다고 보고 썼다.
//       뒤바뀌면 캐시 견주기(RBR-30)까지 어긋난다.
//    3. 결과가 없을 때의 모양 — 빈 배열로 온다고 보고 썼다 (RBR-38).

import type { PlaceCandidate } from '../../domain/route/types'

/** 카카오 로컬 검색 응답에서 후보를 뽑는다 (RBR-35 ~ RBR-38) */
export function parsePlaceCandidates(payload: unknown): readonly PlaceCandidate[] {
  if (!isRecord(payload)) return []

  const documents = payload['documents']
  if (!Array.isArray(documents)) return []

  const candidates: PlaceCandidate[] = []

  for (const raw of documents) {
    if (!isRecord(raw)) continue

    // 카카오는 경도를 x, 위도를 y 로 준다고 보고 썼다 — 확인 필요
    const lng = toNumber(raw['x'])
    const lat = toNumber(raw['y'])
    if (lat === null || lng === null) continue

    // 키워드 검색은 place_name, 주소 검색은 address_name 을 준다
    const name =
      toText(raw['place_name']) ??
      toText(raw['address_name']) ??
      toText(raw['road_address_name'])
    if (name === null) continue

    candidates.push({
      name,
      address: toText(raw['road_address_name']) ?? toText(raw['address_name']),
      coord: { lat, lng },
    })
  }

  return candidates
}

/**
 * 카카오모빌리티 자동차 길찾기 응답에서 이동 시간을 뽑는다 (분).
 *
 * 응답이 초로 온다고 보고 60으로 나눈다 — 확인 필요.
 * 0분이 되지 않게 올림한다. 1분 안에 닿는 구간은 없다고 본다.
 */
export function parseCarTravelMinutes(payload: unknown): number | null {
  if (!isRecord(payload)) return null

  const routes = payload['routes']
  if (!Array.isArray(routes) || routes.length === 0) return null

  const first = routes[0]
  if (!isRecord(first)) return null

  // 길을 못 찾으면 result_code 가 0 이 아니다
  const resultCode = toNumber(first['result_code'])
  if (resultCode !== null && resultCode !== 0) return null

  const summary = first['summary']
  if (!isRecord(summary)) return null

  const seconds = toNumber(summary['duration'])
  if (seconds === null) return null

  return Math.max(1, Math.ceil(seconds / 60))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function toText(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}
