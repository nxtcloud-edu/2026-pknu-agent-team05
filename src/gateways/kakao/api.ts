// 카카오 API 호출 — C-7 의 외부와 닿는 부분
// 근거: route-planning/nfr-requirements/tech-stack-decisions.md
//
// ⚠ 이 파일은 `fetch` 를 부르는 유일한 곳 중 하나다 (R-NFR-5.1).
// ⚠ 아직 실제 키로 검증되지 않았다 (Q1-A). `parse.ts` 의 경고를 함께 보라.
//
// 키가 없으면 `null` 을 돌려준다. 부르는 쪽이 자체 계산으로 넘어간다 (R-NFR-4.5).

import type { Coord } from '../../domain/schedule/types'
import type { PlaceCandidate } from '../../domain/route/types'
import { withTimeout } from '../retry'
import { parseCarTravelMinutes, parsePlaceCandidates } from './parse'

const LOCAL_KEYWORD_URL = 'https://dapi.kakao.com/v2/local/search/keyword.json'
const LOCAL_ADDRESS_URL = 'https://dapi.kakao.com/v2/local/search/address.json'
const MOBILITY_DIRECTIONS_URL = 'https://apis-navi.kakaomobility.com/v1/directions'

/**
 * 키를 읽는다.
 *
 * ⚠ Vite 는 빌드할 때 `VITE_` 로 시작하는 값을 결과물에 박아 넣는다.
 *   브라우저로 내려가는 키는 감춰지지 않는다 (R-NFR-4.2 · Q2-A).
 *   Q3-A 로 배포하지 않기 때문에 지금은 감수한다. 인터넷에 올릴 때 다시 봐야 한다.
 */
export interface KakaoKeys {
  readonly restKey: string | null
  readonly mobilityKey: string | null
}

export function readKakaoKeys(): KakaoKeys {
  const env = import.meta.env as Record<string, string | undefined>
  return {
    restKey: nonEmpty(env['VITE_KAKAO_REST_KEY']),
    mobilityKey: nonEmpty(env['VITE_KAKAO_MOBILITY_KEY']),
  }
}

/**
 * 주소나 장소 이름으로 좌표 후보를 찾는다 (RBR-35 ~ RBR-38).
 *
 * 키워드 검색을 먼저 하고, 결과가 없으면 주소 검색을 한다.
 * "강남역 스타벅스" 는 키워드로 찾히고 "서울 강남구 강남대로 396" 은 주소로 찾힌다.
 */
export async function searchKakaoPlaces(
  query: string,
  keys: KakaoKeys,
  timeoutMs: number,
): Promise<readonly PlaceCandidate[] | null> {
  if (keys.restKey === null) return null

  const trimmed = query.trim()
  if (trimmed === '') return []

  const byKeyword = await callLocal(LOCAL_KEYWORD_URL, trimmed, keys.restKey, timeoutMs)
  if (byKeyword !== null && byKeyword.length > 0) return byKeyword

  const byAddress = await callLocal(LOCAL_ADDRESS_URL, trimmed, keys.restKey, timeoutMs)
  if (byAddress !== null) return byAddress

  // 둘 다 실패했다. 결과가 없는 것(빈 배열)과 구별해 null 로 돌려준다
  return byKeyword
}

async function callLocal(
  url: string,
  query: string,
  restKey: string,
  timeoutMs: number,
): Promise<readonly PlaceCandidate[] | null> {
  const target = `${url}?query=${encodeURIComponent(query)}&size=10`

  try {
    const response = await withTimeout(
      (signal) =>
        fetch(target, {
          headers: { Authorization: `KakaoAK ${restKey}` },
          signal,
        }),
      timeoutMs,
    )

    if (!response.ok) return null
    return parsePlaceCandidates(await response.json())
  } catch {
    return null
  }
}

/**
 * 자동차 이동 시간을 받는다 (분). 실패하면 null (RBR-27 · RBR-31).
 *
 * 카카오모빌리티는 좌표를 `경도,위도` 순서로 받는다고 보고 썼다 — 확인 필요.
 */
export async function fetchKakaoCarMinutes(
  from: Coord,
  to: Coord,
  keys: KakaoKeys,
  timeoutMs: number,
): Promise<number | null> {
  if (keys.mobilityKey === null) return null

  const params = new URLSearchParams({
    origin: `${from.lng},${from.lat}`,
    destination: `${to.lng},${to.lat}`,
    priority: 'RECOMMEND',
    // 실시간 교통을 반영한 값을 받는다 (FR-6.1)
    car_fuel: 'GASOLINE',
    alternatives: 'false',
  })

  try {
    const response = await withTimeout(
      (signal) =>
        fetch(`${MOBILITY_DIRECTIONS_URL}?${params.toString()}`, {
          headers: { Authorization: `KakaoAK ${keys.mobilityKey}` },
          signal,
        }),
      timeoutMs,
    )

    if (!response.ok) return null
    return parseCarTravelMinutes(await response.json())
  } catch {
    return null
  }
}

function nonEmpty(value: string | undefined): string | null {
  if (value === undefined) return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}
