// C-5 보관소 · localStorage 를 직접 부르는 유일한 곳
// 근거: nfr-requirements.md U-NFR-4.3 · tech-stack-decisions.md (Q2-A)
//
// 저장 방식을 바꿀 때 고칠 지점을 하나로 모은다. 다른 파일은 localStorage 를 직접 부르지 않는다.
//
// Q2-A 를 고른 결과 두 가지를 여기서 다룬다.
//   · 글자로만 저장되므로 꺼낼 때 되돌리는 일을 직접 한다
//   · 저장 모양이 바뀌면 판번호로 알아채고 빈 값으로 시작한다

/** 저장 모양의 판번호. 담는 값의 모양을 바꾸면 올린다 */
export const STORAGE_SCHEMA_VERSION = 1

const KEY_PREFIX = 'outing-route-helper'

export const STORAGE_KEYS = {
  schedules: `${KEY_PREFIX}:schedules`,
  recurringRules: `${KEY_PREFIX}:recurring-rules`,
  recurringExceptions: `${KEY_PREFIX}:recurring-exceptions`,
  daySettings: `${KEY_PREFIX}:day-settings`,
  participants: `${KEY_PREFIX}:participants`,
  settings: `${KEY_PREFIX}:settings`,
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]

/** 담기는 모양 — 판번호를 값과 함께 넣는다 */
interface Envelope<T> {
  readonly version: number
  readonly data: T
}

/**
 * 저장 자리를 감싼 것. 테스트에서 갈아끼울 수 있게 인터페이스로 둔다.
 *
 * 브라우저 밖(테스트 · 서버 렌더링)에서는 localStorage 가 없으므로 그 경우도 다룬다.
 */
export interface KeyValueStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

/** 브라우저의 localStorage. 없으면 아무것도 남기지 않는 자리를 쓴다 */
export function browserStore(): KeyValueStore {
  if (typeof localStorage === 'undefined') {
    return memoryStore()
  }
  return localStorage
}

/** 브라우저가 아닌 곳에서 쓰는 자리. 테스트가 이것을 쓴다 */
export function memoryStore(initial: Record<string, string> = {}): KeyValueStore {
  const map = new Map(Object.entries(initial))
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value)
    },
    removeItem: (key) => {
      map.delete(key)
    },
  }
}

/**
 * 꺼낸다.
 *
 * 아래 경우에 모두 `fallback` 을 돌려준다. 오류를 던지지 않는다.
 *   · 값이 없다
 *   · 글자를 되돌릴 수 없다 (사람이 손으로 고쳤거나 깨졌다)
 *   · 판번호가 다르다 — 옮기는 일은 하지 않고 빈 값으로 시작한다
 */
export function read<T>(store: KeyValueStore, key: StorageKey, fallback: T): T {
  const raw = store.getItem(key)
  if (raw === null) return fallback

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return fallback
  }

  if (!isEnvelope(parsed)) return fallback
  if (parsed.version !== STORAGE_SCHEMA_VERSION) return fallback

  return parsed.data as T
}

/** 남긴다. 판번호를 함께 넣는다 */
export function write<T>(store: KeyValueStore, key: StorageKey, data: T): void {
  const envelope: Envelope<T> = { version: STORAGE_SCHEMA_VERSION, data }
  store.setItem(key, JSON.stringify(envelope))
}

/** 하나를 지운다 */
export function remove(store: KeyValueStore, key: StorageKey): void {
  store.removeItem(key)
}

/** 전체 삭제 — BR-44. 이 앱이 남긴 것만 지운다 */
export function clearAll(store: KeyValueStore): void {
  for (const key of Object.values(STORAGE_KEYS)) {
    store.removeItem(key)
  }
}

function isEnvelope(value: unknown): value is Envelope<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'version' in value &&
    typeof (value as { version: unknown }).version === 'number' &&
    'data' in value
  )
}
