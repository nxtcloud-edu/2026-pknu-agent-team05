# route-planning · STEP 05 코드 생성 — 계획

> 코드는 **루트 `src/`** 에. 요약만 `aidlc-docs/construction/route-planning/code/`.
> 근거: `functional-design/` 네 문서 (R-1~R-7 · RBR-1~RBR-46 · C-2 6단계 · V-3) · `nfr-requirements/` 두 문서 (카카오 · 자체 계산 · R-NFR-1~6)
> STEP 03 비기능 설계 · STEP 04 인프라 설계는 건너뛰었다 (`execution-plan.md` Q2-B · Q3-A).

## 만드는 순서

`schedule-core` 와 같은 순서다. 업무 규칙 → 저장 → 화면. 이 단위에는 창구 층이 하나 더 붙는다.

```
1. 업무 규칙        src/domain/route/     ← 테스트를 같이
2. 자체 계산        src/domain/route/estimate.ts  ← 테스트를 같이
3. 창구             src/gateways/         ← 캐시·재시도·실패 흐름 테스트를 같이
4. 앞 단위 손보기   schedule-core 4곳
5. 화면             src/ui/RouteResult/ · PlaceInput · DataPanel
```

창구를 계산보다 뒤에 두는 이유 — C-2 는 이동 시간을 인자로 받으므로 창구가 없어도 완성되고 검증된다 (R-NFR-3.1).

## 무엇을 할지

### 1. 업무 규칙 — `src/domain/route/`

- [x] `types.ts` — R-1 좌표 후보 · R-2 조회 결과(세 상태) · R-3 캐시 항목 · R-4 구간 · R-5 동선 결과 · R-6 도착 불가 · R-7 빠진 일정
- [x] `order.ts` — RBR-1~RBR-7 순서 정하기 (고정형 정렬 · 유연형은 뒤에 · 가까운 곳부터 · 손으로 고정한 자리)
- [x] `schedule-times.ts` — RBR-8~RBR-15 시각 계산 (하루 첫 출발 · 기다리는 시간 · 자정 넘김)
- [x] `feasibility.ts` — RBR-16~RBR-20 도착 불가 판정
- [x] `plan.ts` — C-2 전체를 엮는다. `business-logic-model.md` 의 6단계
- [x] 테스트 — 경계 상황 22가지 (R-NFR-3.2) · 지금 시각을 주입해 (R-NFR-3.3)

### 2. 자체 계산 — `src/domain/route/estimate.ts`

- [x] 두 좌표 사이 대권거리 (Haversine)
- [x] `거리 ÷ 평균 속도 × 우회 계수` · 최소 이동 시간 (Q3-B)
- [x] `src/domain/settings/` 에 값을 더한다 — 도보 · 대중교통 평균 속도 · 우회 계수 · 최소 이동 시간 · 하루 시작 시각 · 캐시 유지 시간 · 좌표 자릿수 · 호출 포기 시간 · 재시도 대기 시간
- [x] 테스트 — 알려진 두 지점의 거리 · 수단별 시간 차이 · 최소 시간 (R-NFR-3.4)

### 3. 창구 — `src/gateways/`

- [x] `mapGateway.ts` — C-7 경계면. 서비스를 갈아끼울 때 지킬 것 (R-NFR-5.3)
- [x] `cache.ts` — R-3 · RBR-28~RBR-30. **`cached` 와 `stale` 을 가른다** (RBR-34)
- [x] `retry.ts` — Q4-B 한 번 재시도 · 호출 포기 시간
- [x] `estimateGateway.ts` — 자체 계산으로 답하는 창구 (도보 · 대중교통)
- [x] `kakao/localApi.ts` — 주소↔좌표 (카카오 로컬)
- [x] `kakao/mobilityApi.ts` — 자동차 이동 시간 (카카오모빌리티)
- [x] `kakao/parse.ts` — 응답 해석. **이동 시간 단위 · 좌표 순서 · 결과 없음** 을 한곳에서 다룬다
- [x] `compositeGateway.ts` — 이동 수단에 따라 갈라 보낸다 (R-NFR-5.4)
- [x] `.env.local.example` — 키 이름만, 값은 비워 둔다 (R-NFR-4.3)
- [x] 테스트 — 캐시가 외부 호출을 줄이는지 · 실패 시 `stale` · 재시도 한 번 · 키 없을 때 자체 계산으로 넘어가는지 (R-NFR-3.5 · R-NFR-4.5)

### 4. 앞 단위 손보기 (`unit-of-work.md` Q4-C · 모두 "그 자리에서 고친다")

- [x] `domain/handoff.ts` — `checkRouteReadiness` 의 `missing-coords` 를 계산 막힘에서 뺀다 (Q4-A · RBR-21)
- [x] `domain/settings/` — 값을 더한다 (위 2번에 적음)
- [x] `ui/PlaceInput.tsx` — 후보 찾기 · 고르기를 넣는다 (RBR-35~RBR-38)
- [x] `ui/DayView.tsx` — `좌표 없음 → 계산할 수 없다` 안내를 `빼고 계산한다` 로 고친다
- [x] 고친 것을 `code/` 요약에 남긴다 (Q4-C 가 요구하는 것)
- [x] `schedule-core` 의 테스트 116개가 여전히 통과하는지 확인한다

### 5. 화면 — `src/ui/`

- [x] `RouteResult/` — V-3. 다섯 상태 (성공 · 도착 불가 · 빠진 일정 · 낡은 값 · 계산 불가)
- [x] 기다리는 시간을 보여준다 (RBR-13 을 화면에서 설명한다)
- [x] **어림값 표시** (R-NFR-6) — 구간마다 · 총 이동 시간에도
- [x] 순서를 손으로 옮기는 조작 (RBR-42 · RBR-43)
- [x] `새로 계산` (RBR-29)
- [x] `DataPanel` 에 하루 시작 시각 칸을 더한다
- [x] `DayView` 의 점선 자리를 `RouteResult` 로 바꾼다

### 마무리

- [x] `npm run typecheck` · `npm test` · `npm run build` 통과 확인
- [x] `code/summary.md` 에 요약 · 앞 단위 고친 것 · 확인하지 못한 것을 남긴다

## 무엇을 하지 않나

- 출발 시각에서 여유 시간 빼기 · 알림 걸기 — `departure-alarm`
- 중간지점 · 장소 후보 조회 — `meetup-midpoint`
- 화면 V-4 · V-5 · V-6 · V-8 — 뒤 단위
- 일정 저장 구조 바꾸기 — `schedule-core` 에서 확정했다
- 업무 규칙 새로 만들기 — STEP 01 에서 확정했다

---

## 확인 질문

> 한 질문에 하나만 고른다. 답을 `[Answer]:` 뒤에 적고 저장하면 코드를 만든다.

## Q1. 카카오 API 호출 코드를 이번에 쓰나

키가 없으므로 **실제로 동작하는지 확인할 수 없습니다.** 응답 모양도 문서를 보고 짐작해 쓰게 됩니다.

- A) 실제 호출 코드까지 쓴다 — 키를 넣으면 바로 동작하도록. 다만 검증되지 않은 코드가 남고, 응답 모양이 다르면 고쳐야 한다
- B) 창구 경계면과 자체 계산만 만들고 카카오 부분은 비워 둔다 — 검증된 코드만 남는다. 키를 받는 시점에 채운다
- C) 호출 코드를 쓰되 **아직 검증되지 않았음을 코드와 화면에 표시한다** — 키를 넣고 처음 부를 때 응답 모양이 맞는지 확인하는 절차를 둔다
- D) Other (please describe after [Answer]: tag below)

[Answer]:A

## Q2. 순서를 손으로 옮기는 조작을 어떻게 만드나 (RBR-42)

- A) 위 · 아래 단추로 한 칸씩 옮긴다 — 단순하고 확실하다
- B) 끌어서 놓는다 (드래그) — 손에 익지만 만들 것이 많다
- C) 일정을 고를 때 "몇 번째" 를 골라 넣는다
- D) Other (please describe after [Answer]: tag below)

[Answer]:A

## Q3. 동선을 언제 계산하나

- A) 일정이 바뀌면 바로 다시 계산한다 — 늘 최신이지만 외부 호출이 잦아진다
- B) 사용자가 `동선 계산` 을 누를 때만 — 호출을 아끼고, 계산 결과가 낡았음을 표시로 알린다
- C) 화면을 열 때 한 번 계산하고, 그 뒤에는 일정이 바뀌면 낡았다고 표시만 한다
- D) Other (please describe after [Answer]: tag below)

[Answer]:A

## Q4. V-3 화면을 어디까지 만드나

`schedule-core` 는 Q1-C(다듬기까지)로 만들었습니다.

- A) 같은 수준으로 다듬는다 — 앞 단위와 결이 맞는다
- B) 뼈대만 — 값이 보이는 데까지
- C) 다듬되 순서 옮기기 같은 조작은 최소한으로
- D) Other (please describe after [Answer]: tag below)

[Answer]:A
