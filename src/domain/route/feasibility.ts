// 도착 불가 판정 — RBR-16 ~ RBR-20
// 근거: route-planning/functional-design/business-logic-model.md 5단계
//
// 불가능한 계획을 그럴듯한 추천으로 내지 않는다 (NFR-2.1).
// 도착 불가가 하나라도 있으면 순서를 주지 않고 경고만 준다 (RBR-17).

import { minutesToTime, timeToMinutes } from '../time'
import type { LegInput } from './schedule-times'
import type { InfeasibleArrival } from './types'

/**
 * 고정형 일정에 제때 닿을 수 있는지 본다.
 *
 * 앞 일정이 끝나고 이동해서 닿는 시각이 정해진 도착 시각보다 늦으면 도착 불가다 (RBR-16).
 * 여러 곳에서 생기면 모두 모아 준다. 첫 번째만 주지 않는다 (RBR-19).
 */
export function findInfeasibleArrivals(args: {
  readonly inputs: readonly LegInput[]
  readonly dayStartMinutes: number
}): readonly InfeasibleArrival[] {
  const { inputs, dayStartMinutes } = args

  const problems: InfeasibleArrival[] = []
  let cursor = dayStartMinutes
  let previousLabel: string | null = null

  for (const input of inputs) {
    const earliestArrival = cursor + input.travelMinutes

    if (input.fixedArrival !== null) {
      const required = timeToMinutes(input.fixedArrival)

      if (earliestArrival > required) {
        problems.push({
          scheduleId: input.scheduleId ?? '',
          title: input.destinationLabel,
          requiredArrival: input.fixedArrival,
          earliestArrival: minutesToTime(earliestArrival),
          shortMinutes: earliestArrival - required,
          // RBR-18 앞의 어느 일정 때문인지. 무엇을 고쳐야 하는지 알려주기 위해
          causedByTitle: previousLabel,
        })
        // 이 일정을 못 맞췄어도 뒤를 계속 본다. 뒤에서 또 생기면 그것도 알린다 (RBR-19)
        // 뒤 계산은 늦게 닿은 시각을 기준으로 이어간다
        cursor = earliestArrival + input.stayMinutes
      } else {
        // 제때 닿았다. 기다렸다가 정해진 시각에 시작한다 (RBR-13)
        cursor = required + input.stayMinutes
      }
    } else {
      cursor = earliestArrival + input.stayMinutes
    }

    previousLabel = input.destinationLabel
  }

  return problems
}
