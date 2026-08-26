// 외부 호출 감싸기 — Q4-B · R-NFR-1.4 · R-NFR-1.5
//
// 짧게 한 번만 다시 시도한다. 여러 번 늘려가며 시도하면 R-NFR-1.1(3초 안)을 넘긴다.

/** 정해진 시간 안에 답이 없으면 포기한다 — R-NFR-1.4 */
export async function withTimeout<T>(
  task: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await task(controller.signal)
  } finally {
    clearTimeout(timer)
  }
}

/**
 * 실패하면 짧게 기다린 뒤 한 번만 다시 시도한다 — Q4-B
 *
 * 두 번 다 실패하면 마지막 오류를 그대로 던진다. 부르는 쪽이 캐시의 옛 값으로 넘어간다.
 */
export async function retryOnce<T>(
  task: () => Promise<T>,
  delayMs: number,
): Promise<T> {
  try {
    return await task()
  } catch {
    await sleep(delayMs)
    return task()
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
