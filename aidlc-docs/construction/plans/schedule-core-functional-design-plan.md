# schedule-core · STEP 01 기능 설계 — 계획

> 산출물: `aidlc-docs/construction/schedule-core/functional-design/`
> — `business-logic-model.md` · `business-rules.md` · `domain-entities.md` · `frontend-components.md`
> 근거: `unit-of-work.md` (schedule-core) · `components.md` (C-1 · C-5 · C-6 / V-1 · V-2 · V-7 · V-9) · `stories.md` (S-1~S-6, S-16)

## 이 단위가 맡은 것

| 구성 요소 | 하는 일 |
|---|---|
| C-1 일정 펼치기 | 반복 규칙 · 예외 · 개별 일정을 날짜 하나에 대해 합쳐 그날 목록을 만든다 |
| C-5 일정 보관소 | 개별 일정 · 반복 규칙 · 예외 기록 · 하루 설정 · 참여자를 브라우저에 남긴다 |
| C-6 설정 | 여유 시간 기본값 · 기본 이동 수단 · 캐시 유지 시간 · 검색 반경 · 중간지점 후보 개수 |

| 화면 | 하는 일 |
|---|---|
| V-1 하루 보기 | 날짜 하나의 일정 목록 (동선 결과 자리는 비워 둔다 — route-planning 이 채운다) |
| V-2 일정 상세 패널 | 일정을 넣고 고친다 |
| V-7 하루 설정 | 하루의 출발지 · 마지막 도착지 |
| V-9 데이터 관리 | 전체 삭제 |

스토리 — S-1 등록·수정·삭제 · S-2 고정형/유연형 · S-3 이동 수단 · S-4 출발지·도착지 · S-5 완료 표시 · S-6 브라우저에 남기 · S-16 반복 일정

## 무엇을 할지

- [x] `domain-entities.md` — 다루는 것들과 각자가 지닌 값을 적는다 (일정 · 반복 규칙 · 예외 기록 · 하루 설정 · 참여자 · 설정) — E-1~E-7
- [x] `business-rules.md` — 항상 맞아야 하는 규칙을 번호 붙여 적는다. 근거 FR · 스토리를 함께 — BR-1~BR-53
- [x] `business-logic-model.md` — C-1 펼치기가 어떤 순서로 무엇을 하는지, C-5 가 무엇을 언제 남기는지 — 펼치기 5단계 · 고치기가 두 갈래로 갈리는 지점
- [x] `frontend-components.md` — V-1 · V-2 · V-7 · V-9 가 무엇을 보여주고 무엇을 받는지. 패널이 열리고 닫히는 규칙 (Q1-C 하루 보기 + 패널)
- [x] 경계 1 (`schedule-core` → `route-planning`) 이 넘기는 것을 도메인 용어로 맞춘다 — domain-entities.md 끝에 대조표
- [x] 경계 3 (`schedule-core` ↔ `meetup-midpoint`) 의 참여자 보관 자리를 미리 만든다 — E-6 참여자
- [x] S-1~S-6 · S-16 의 수락 기준이 규칙으로 다 옮겨졌는지 대조표를 만든다 — business-rules.md 끝에 24행 대조표
- [x] 이 단위의 완료 기준(C-1 펼치기 테스트)에 필요한 경계 상황을 목록으로 뽑는다 — business-logic-model.md 에 14가지

## 무엇을 하지 않나

- **언어 · 프레임워크 · 저장 기술 · 테스트 도구를 고르지 않는다** — 바로 다음 STEP 02 `tech-stack-decisions.md` 에서 고른다
- 이동 시간 · 동선 계산을 다루지 않는다 — `route-planning`
- 출발 시각 · 알림을 다루지 않는다 — `departure-alarm`
- 중간지점 · 장소 검색을 다루지 않는다 — `meetup-midpoint`
- 코드를 만들지 않는다 — STEP 05

---

## 확인 질문

> 한 질문에 하나만 고른다. 답을 `[Answer]:` 뒤에 적고 저장하면 이어서 설계 문서 네 개를 만든다.
> 어느 답을 골라도 언어 · 프레임워크 선택과는 무관하다.

## Q1. 반복은 어디까지 되나 (S-16 · FR-1.8)

- A) 요일만 — "매주 화요일". 요구사항이 든 예 그대로
- B) 요일 + 매일 — "매주 화요일" 과 "매일"
- C) 요일 + 매일 + 격주 + 매월 며칠
- D) Other (please describe after [Answer]: tag below)

[Answer]:A

## Q2. 일정의 장소를 어떻게 넣나 (S-1 · FR-1.2)

- A) 주소나 장소 이름을 글자로 친다. 앱이 좌표로 바꾼다
- B) 지도에서 점을 찍는다
- C) 글자로 치는 것을 기본으로 하고, 결과가 여럿이면 후보를 보여줘 고르게 한다
- D) Other (please describe after [Answer]: tag below)

[Answer]:C

## Q3. 일정이 차지하는 시간을 어떻게 표현하나 (FR-1.2 머무는 시간 · FR-1.4 도착 시각)

- A) 도착 시각 + 머무는 시간 — "14시 도착, 1시간 머문다"
- B) 시작 시각 + 끝 시각 — "14시부터 15시까지"
- C) 유연형은 머무는 시간만, 고정형은 도착 시각 + 머무는 시간
- D) Other (please describe after [Answer]: tag below)

[Answer]:A

## Q4. 하루의 출발지 · 마지막 도착지는 (S-4 · FR-1.7)

- A) 한 번 정하면 모든 날짜에 그대로 쓴다 — 집에서 나가 집으로 돌아온다
- B) 날짜마다 따로 정한다
- C) 기본값을 하나 두고, 날짜마다 다르게 하고 싶으면 그 날짜만 덮어쓴다
- D) Other (please describe after [Answer]: tag below)

[Answer]:B

## Q5. 지난 날짜의 일정은 어떻게 하나

- A) 그대로 남긴다. 날짜를 거슬러 가면 볼 수 있다
- B) 지난 날짜는 볼 수 없게 하고 오늘과 앞날만 다룬다
- C) 남기되 정해진 기간이 지나면 지운다 (기간은 설정에 둔다)
- D) Other (please describe after [Answer]: tag below)

[Answer]:A
