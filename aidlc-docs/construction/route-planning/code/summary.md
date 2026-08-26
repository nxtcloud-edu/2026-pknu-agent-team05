# route-planning · 코드 요약

> **실제 코드는 루트 `src/` 에 있다.** 여기에는 요약만 둔다 (§6 산출물 위치).
> 근거: `functional-design/` 네 문서 · `nfr-requirements/` 두 문서 · `route-planning-code-generation-plan.md`
> 답: Q1-A (호출 코드까지 쓴다) · Q2-A (위·아래 단추) · Q3-A (일정이 바뀌면 바로 재계산) · Q4-A (다듬기까지)

## 검증 결과

```
npm test            8 파일 · 212 통과   (schedule-core 116 + route-planning 96)
npm run typecheck   통과
npm run build       통과 (CSS 22.06 kB · JS 250.01 kB / gzip 77.06 kB)
```

`schedule-core` 의 테스트 116개가 그대로 통과한다. 앞 단위를 고쳐도 무너진 것이 없다.

## 만든 파일

### 계산 — `src/domain/route/`

| 파일 | 무엇 | 근거 |
|---|---|---|
| `types.ts` | R-1 좌표 후보 · R-2 조회 결과(네 상태) · R-3 캐시 항목 · R-4 구간 · R-5 동선 결과 · R-6 도착 불가 · R-7 빠진 일정 · `MapGateway` 경계면 | domain-entities.md |
| `estimate.ts` | Haversine 거리 · `거리 ÷ 속도 × 우회 계수` (Q3-B) | tech-stack-decisions.md |
| `order.ts` | RBR-1~RBR-7 순서 정하기 — 고정형 정렬 · 유연형은 뒤에 · 가까운 곳부터 · 손으로 고정한 자리 | business-logic-model.md 2단계 |
| `schedule-times.ts` | RBR-8~RBR-15 시각 계산 — 하루 첫 출발 · 기다리는 시간 · 자정 넘김 | 4단계 |
| `feasibility.ts` | RBR-16~RBR-20 도착 불가 판정 | 5단계 |
| `plan.ts` | **C-2 전체** 6단계 · `moveScheduleInOrder` (RBR-42) | 전체 |

### 창구 — `src/gateways/`

| 파일 | 무엇 | 근거 |
|---|---|---|
| `cache.ts` | R-3 캐시 · RBR-30 열쇠 만들기. **`findFresh` 와 `findAny` 를 나눠 `cached`/`stale` 을 가른다** | RBR-28~RBR-30 · RBR-34 |
| `retry.ts` | 호출 포기 시간 · 한 번 재시도 (Q4-B) | R-NFR-1.4 · R-NFR-1.5 |
| `kakao/parse.ts` | 응답 해석. **검증되지 않았음을 파일 머리에 경고로 남겼다** | Q5-C |
| `kakao/api.ts` | `fetch` 를 부르는 유일한 곳. 키를 읽는다 | R-NFR-5.1 |
| `mapGateway.ts` | **Q1-B 와 Q3-B 가 만든 갈림이 모이는 곳.** 자동차는 외부, 도보·대중교통은 자체 계산 | R-NFR-5.4 |

### 화면 — `src/ui/`

| 파일 | 무엇 |
|---|---|
| `RouteResult.tsx` | **V-3.** 다섯 상태 — 성공 · 도착 불가 · 빠진 일정 · 낡은 값 · 계산 불가. 기다리는 시간과 어림값 표시 |
| `PlaceInput.tsx` | 후보 찾기·고르기를 채웠다 (RBR-35~RBR-38) |

### 설정 · 환경

| 파일 | 무엇 |
|---|---|
| `src/domain/settings/index.ts` | 값을 더했다 — 하루 시작 시각 · 좌표 자릿수 · 호출 포기 시간 · 재시도 대기 · 평균 속도 · 우회 계수 · 최소 이동 시간 |
| `.env.local.example` | 키 이름만. 값은 비워 둠 (R-NFR-4.3) |

## 테스트 (96개 추가)

| 파일 | 개수 | 무엇을 |
|---|---|---|
| `domain/route/plan.test.ts` | 43 | **완료 기준** — 경계 상황 22가지 + 순서 옮기기 |
| `domain/route/estimate.test.ts` | 21 | Haversine · 수단별 시간 차이 · 설정을 바꾸면 결과가 바뀌는지 |
| `gateways/mapGateway.test.ts` | 24 | 키 없을 때 · 캐시 · `cached`/`stale` 갈림 · 재시도 · 열쇠 자릿수 |
| `domain/handoff.test.ts` | 12 | **Q4-A 로 고친 동작** — 좌표 없어도 계산이 막히지 않는지 |

`handoff.test.ts` 는 앞 단위를 고친 것을 못 박기 위해 만들었다. 그 동작이 나중에 되돌아가지 않게 한다.

## 앞 단위를 고친 것 (unit-of-work.md Q4-C · 모두 "그 자리에서 고침")

| 무엇 | 왜 | 어느 경우 |
|---|---|---|
| `domain/handoff.ts` — `checkRouteReadiness` 의 `missing-coords` 를 막힘에서 뺐다. `RouteReadiness.ready` 에 `willExclude` 를 더했다 | Q4-A 로 "좌표 없는 일정은 빼고 계산" 이 정해졌다. 좌표 정책은 이 단위에서 정한다고 `schedule-core` BR-21 에 적혀 있다 | 설계에 예정된 자리 |
| `domain/settings/index.ts` — 값 7개를 더했다 | Q3-B · RBR-8 · RBR-30 · Q4-B 가 요구한다. 기존 값을 건드리지 않았다 | 깨지 않는 추가 |
| `ui/PlaceInput.tsx` — 후보 찾기·고르기를 넣었다 | BR-21 이 좌표 채우기를 이 단위로 넘겼다 | 설계에 예정된 자리 |
| `ui/DayView.tsx` — 동선 결과 자리를 `routeSlot` 으로 열고 `RouteResult` 를 받는다. `좌표 없음` 표시를 `동선에서 빠짐` 으로 고쳤다 | 비워 둔 자리를 채우는 것 · Q4-A 로 안내가 틀리게 됐다 | 설계에 예정된 자리 |
| `ui/DataPanel.tsx` — 하루 시작 시각 칸과 키 없음 안내를 더했다 | Q3-B 가 만든 값 (RBR-8) | 깨지 않는 추가 |
| `app/store.ts` — 창구 · 계산 · 재계산 · 순서 옮기기를 이었다 | 이 단위의 화면과 계산을 잇는 자리 | 예정된 자리 |

`schedule-core` 의 완료 기준(경계 상황 14가지)은 그대로 통과한다. 무너진 것이 없다.

## 설계와 다르게 만든 것

없다. 아래는 설계대로 지킨 대목이다.

| 요구 | 코드에서 |
|---|---|
| R-NFR-3.1 외부 없이 검증 | `planRoute` 가 `lookup` 과 `now` 를 인자로 받는다 |
| R-NFR-5.1 외부 경계 분리 | `fetch` 는 `gateways/kakao/api.ts` 에만 있다 |
| R-NFR-5.2 계산과 화면 분리 | `domain/route/` 는 `gateways/` 와 `ui/` 를 가져오지 않는다 |
| R-NFR-5.4 갈림이 한곳에 | `mapGateway.ts` 의 `MODES_FROM_EXTERNAL` 배열 하나로 갈린다 |
| R-NFR-5.5 수치를 설정으로 | 계산 코드에 숫자가 없다. 테스트가 설정을 바꿔 확인한다 |
| RBR-13 기다린 시간 제외 | `totalTravelMinutes` 에 `waitMinutes` 를 넣지 않는다. 테스트로 못 박았다 |
| RBR-17 도착 불가면 순서 없음 | `RoutePlanResult` 가 합타입이라 `infeasible` 일 때 순서가 아예 없다 |
| R-NFR-6 어림값을 감추지 않음 | `freshness: 'estimated'` 가 화면까지 올라간다 |

## 확인하지 못한 것

### 1. 카카오 API 호출 (Q1-A 를 고른 결과)

**`gateways/kakao/` 의 코드는 실제 키로 검증되지 않았다.** 키가 없어 응답을 받아볼 수 없었다.
문서와 커뮤니티 글을 보고 짐작해 썼다. 파일 머리에 경고를 남겼다.

키를 넣고 처음 부를 때 아래 셋을 확인해야 한다.

| 무엇 | 어떻게 썼나 | 틀리면 |
|---|---|---|
| 이동 시간의 단위 | 카카오모빌리티가 **초**로 준다고 보고 60으로 나눈다 | 60배 어긋난 값이 흘러들어가 도착 불가 판정(RBR-16)이 엉뚱해진다 |
| 좌표의 순서 | 카카오가 경도를 `x`, 위도를 `y` 로 쓴다고 보고 썼다. 모빌리티에는 `경도,위도` 순서로 보낸다 | 캐시 견주기(RBR-30)까지 어긋난다 |
| 결과가 없을 때 | `documents` 가 빈 배열로 온다고 보고 썼다 | RBR-38(후보 없으면 좌표를 비운다)이 안 돈다 |

### 2. R-NFR-3.6 응답 해석 테스트

저장해 둔 응답 예시로 해석 함수를 검증하기로 했는데(Q5-C), **응답 예시를 얻을 수 없어 만들지 못했다.**
`parse.ts` 를 따로 떼어 두었으므로 응답을 받는 시점에 그 파일만 대상으로 테스트를 붙이면 된다.

### 3. 화면

Q3-B(완료 기준은 계산 테스트)와 Q5-A(화면은 손으로) 에 따라 CONSTRUCTION 06 으로 넘긴다.
개발 서버가 HTML · 변환된 모듈 · Tailwind CSS 를 내려주는 것까지는 확인했다.

- V-3 의 다섯 상태가 실제로 그려지는지
- 위·아래 단추로 순서가 옮겨지고 고정 표시가 붙는지
- 기다리는 시간과 어림값 표시가 읽히는지
- 좁은 화면에서 무너지지 않는지

## 뒤 단위가 이어받을 지점

| 단위 | 어디서 |
|---|---|
| `departure-alarm` | `RoutePlan.legs` 의 `departAt` · `arriveAt` · `destinationLabel` · `freshness` 를 받는다 (경계 2). `RoutePlanResult` 가 `infeasible` 이면 알림을 걸지 않는다. `settings.user.bufferMinutes` 를 읽는다 |
| `meetup-midpoint` | 약속 장소가 확정되면 `store` 의 재계산이 자동으로 돈다 (경계 4 · Q3-A). `gateways/` 에 장소 검색 창구를 더한다 |

## 대중교통 API 를 나중에 얻으면

`mapGateway.ts` 의 `MODES_FROM_EXTERNAL` 에 `'transit'` 을 더하고, `travelTime` 안에서 대중교통이
향하는 곳을 정하면 된다. 계산 코드(`domain/route/`)는 고치지 않는다.
