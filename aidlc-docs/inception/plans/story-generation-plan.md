# STEP 04 유저 스토리 — 계획

> 산출물: `aidlc-docs/inception/user-stories/stories.md` · `aidlc-docs/inception/user-stories/personas.md`
> 근거: `aidlc-docs/inception/requirements/requirements.md` (FR-1~FR-7 · NFR-1~NFR-5)

## 이 단계를 왜 돌리나

조건 단계지만 실행한다. Intent Analysis 가 Complexity **Complex** · Requirements Depth **Comprehensive** 이고,
기능 요구가 7군데 31항이다. 스토리로 쪼개지 않으면 STEP 07 에서 작업 단위를 나눌 근거가 생기지 않는다.

## 무엇을 할지

- [x] `requirements.md` 의 FR-1~FR-7 을 빠짐없이 훑어 스토리로 옮긴다 (어느 FR 도 빠지지 않게 대응표를 만든다) — FR 37항 전부 대응
- [x] `personas.md` 에 페르소나를 쓴다 — 목표 · 상황 · 겪는 불편 — P-1 한 명 (Q1-A)
- [x] `stories.md` 에 스토리를 쓴다 — `~로서 / ~를 하고 싶다 / ~하기 때문에` 형식 — S-1 ~ S-16 (Q2-B, 15개 안팎)
- [x] 스토리마다 근거 FR 번호를 붙인다
- [x] 스토리마다 수락 기준을 붙인다 (형식은 Q3 답에 따른다) — Given / When / Then (Q3-A)
- [x] 스토리마다 우선순위를 붙인다 (방식은 Q4 답에 따른다) — 순번 1~16 (Q4-B) · 크기 작다/보통/크다 (Q5-B)
- [x] NFR 은 스토리로 만들지 않고, 관련 스토리의 수락 기준에 조건으로 녹인다 — NFR 대응표로 어디에 넣었는지 남김
- [x] `Out of Scope (MVP)` 항목은 스토리로 만들지 않는다 — 캘린더 연동 · 로그인 · 참여자 직접입력 링크 · 협업 · 예약결제 · 여러날 여행 제외
- [x] FR ↔ 스토리 대응표를 `stories.md` 끝에 붙여 빠진 FR 이 없음을 보인다

## 무엇을 하지 않나

- 언어 · 프레임워크 · 라이브러리를 고르지 않는다 (CONSTRUCTION STEP 02)
- 화면 배치 · 컴포넌트 구조를 정하지 않는다 (STEP 06)
- 작업 단위로 묶지 않는다 (STEP 07)
- 코드를 만들지 않는다

---

## 확인 질문

> 한 질문에 하나만 고른다. 답을 `[Answer]:` 뒤에 적고 저장하면 이어서 만든다.

## Q1. 페르소나는 몇 명으로 세우나

- A) 한 명 — 앱을 직접 쓰는 본인만. 참여자는 페르소나가 아니라 데이터로 다룬다 (Q1-A · Q2-A 답과 맞음)
- B) 두 명 — 앱을 쓰는 본인 + 약속에 불려 나오는 참여자 (참여자는 앱을 직접 쓰지 않지만 관점은 반영)
- C) 세 명 이상 — 쓰는 상황을 나눠 여러 명 (예: 하루에 약속이 몰리는 사람 / 혼자 볼일만 보는 사람 / 지각이 잦은 사람)
- D) Other (please describe after [Answer]: tag below)

[Answer]:A

## Q2. 스토리를 얼마나 잘게 쪼개나

- A) 굵게 — FR 그룹(FR-1 ~ FR-7)마다 스토리 하나씩, 7개 안팎
- B) 중간 — 사용자가 한 번에 끝내는 일 단위로, 15개 안팎 (예: "일정 등록한다", "동선 추천을 받는다", "중간지점을 계산한다")
- C) 잘게 — FR 항목 하나에 스토리 하나씩, 30개 안팎
- D) Other (please describe after [Answer]: tag below)

[Answer]:B

## Q3. 수락 기준은 어떤 형식으로 쓰나

- A) `Given / When / Then` 형식으로 쓴다 — 나중에 테스트로 그대로 옮기기 쉽다
- B) 확인 항목 체크리스트로 쓴다 — 읽기 쉽고 짧다
- C) 기본은 체크리스트로 쓰고, 계산이 얽힌 스토리(동선 · 중간지점 · 출발시각)만 Given/When/Then 으로 쓴다
- D) Other (please describe after [Answer]: tag below)

[Answer]:A

## Q4. 우선순위는 어떤 방식으로 표시하나

- A) MoSCoW — Must / Should / Could / Won't
- B) 순서만 매긴다 — 1, 2, 3 … 만들 차례대로
- C) 두 덩어리로 나눈다 — 첫 버전에 넣을 것 / 그 다음에 넣을 것
- D) Other (please describe after [Answer]: tag below)

[Answer]:B

## Q5. 스토리 크기(작업량) 추정을 넣나

- A) 넣지 않는다 — 우선순위만으로 충분하다
- B) 세 단계로 넣는다 — 작다 / 보통 / 크다
- C) 숫자로 넣는다 — 1 · 2 · 3 · 5 · 8
- D) Other (please describe after [Answer]: tag below)

[Answer]:B
