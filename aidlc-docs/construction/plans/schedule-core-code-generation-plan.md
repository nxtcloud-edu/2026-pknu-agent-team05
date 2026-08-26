# schedule-core · STEP 05 코드 생성 — 계획

> 코드는 **루트 `src/`** 에 만든다. `aidlc-docs/` 에는 요약만 남긴다 (`schedule-core/code/`).
> 근거: `functional-design/` 네 문서 (E-1~E-7 · BR-1~BR-53 · C-1 펼치기 흐름 · V-1·V-2·V-7·V-9) · `nfr-requirements/` 두 문서 (스택 · U-NFR-1~5)
> STEP 03 비기능 설계 · STEP 04 인프라 설계는 건너뛰었다 (`execution-plan.md` Q2-B · Q3-A).

## 만드는 순서

규칙(§3)이 정한 순서는 **업무 규칙 → API → 저장 → 화면**이고, 층마다 테스트를 같이 만든다.
이 앱에는 서버가 없으므로(Q3-A · Q4-A) API 층이 없다. 그 자리를 건너뛴다.

```
1. 프로젝트 세우기      Vite + React + TypeScript + Vitest + Tailwind v4
2. 업무 규칙            src/domain/  ← 테스트를 같이
3. 저장                 src/storage/ ← 테스트를 같이
4. 화면                 src/ui/ · src/app/
```

## 무엇을 할지

### 1. 프로젝트 세우기

- [x] `npm` 프로젝트를 만들고 Vite + React + TypeScript 를 세운다
- [x] Vitest 를 붙인다. `npm test` 가 감시 모드가 아니라 한 번 돌고 끝나게 한다 (U-NFR-2.4)
- [x] Tailwind CSS **v4 방식**으로 붙인다 — `@tailwindcss/vite` 플러그인 + CSS 한 줄 `@import`. `tailwind.config.js` 와 PostCSS 설정을 만들지 않는다
- [x] `npm run typecheck` 을 만든다
- [x] 폴더를 `tech-stack-decisions.md` 의 짜임대로 만든다 — `domain` · `storage` · `ui` · `app`
- [x] 의존 버전을 정확한 값으로 박는다 (열린 범위 `^` 를 쓰지 않는다)

### 2. 업무 규칙 — `src/domain/`

- [x] E-1~E-7 의 자료형 (`domain/schedule/types.ts` 등). 비어 있을 수 있는 값을 타입으로 드러낸다
- [x] BR-1~BR-8 · BR-30 규칙 검사 (`domain/schedule/rules.ts`)
- [x] **C-1 일정 펼치기** (`domain/schedule/expand.ts`) — `business-logic-model.md` 의 5단계
- [x] BR-48 · BR-49 시각 다루기 (`domain/time/`)
- [x] E-7 설정 기본값 (`domain/settings/`) — 수치는 여기에만 (U-NFR-4.1)
- [x] 경계 1 로 넘길 모양 (`domain/handoff.ts`) — `unit-of-work.md` 경계 1 대로
- [x] 테스트 — 경계 상황 14가지 (U-NFR-2.2) · 규칙 검사 각각 (U-NFR-2.3)

### 3. 저장 — `src/storage/`

- [x] `localStorage` 를 직접 부르는 곳 한 군데 (`storage/localStore.ts`) — U-NFR-4.3
- [x] E-2~E-7 별로 꺼내고 남기는 자리 (`storage/repositories/`)
- [x] 저장 모양 판번호를 넣고, 꺼낼 때 다르면 빈 값으로 시작한다 (`nfr-requirements.md` 위험 표)
- [x] 시각을 글자로 넣고 꺼내 되돌린 값이 같은지 테스트 (U-NFR-1.3)
- [x] BR-10 · BR-33 · BR-41 함께 지우기 · BR-44 전체 삭제
- [x] 테스트 — 남기고 꺼내기 · 함께 지우기 · 전체 삭제 · 판번호 불일치

### 4. 화면 — `src/ui/` · `src/app/`

- [x] V-1 하루 보기 — 날짜 옮기기 · 일정 목록 · 하루 설정 요약 · 동선 결과 자리(비움)
- [x] V-2 일정 상세 패널 — 규칙 검사 결과를 칸 옆에 · 반복 안내 문구 (BR-35)
- [x] V-7 하루 설정 패널 — "이 날짜에만 적용됩니다" 안내 (BR-18)
- [x] V-9 데이터 관리 패널 — 전체 삭제 확인 (BR-45) · 사용자가 바꾸는 설정 (BR-52)
- [x] 패널 열림 · 닫힘 규칙 (`frontend-components.md`)
- [x] `domain/` 이 `ui/` 를 가져오지 않는지 확인 (U-NFR-4.2)

### 마무리

- [x] `npm run typecheck` · `npm test` · `npm run build` 가 모두 통과하는지 확인한다
- [x] `aidlc-docs/construction/schedule-core/code/` 에 **요약만** 남긴다 (파일 목록 · 무엇이 어디에 있는지 · 테스트 결과)

## 무엇을 하지 않나

- 동선 계산 · 이동 시간 조회 · 주소를 좌표로 바꾸기 — `route-planning`
- 출발 시각 계산 · 알림 — `departure-alarm`
- 중간지점 · 장소 후보 — `meetup-midpoint`
- 화면 V-3 · V-4 · V-5 · V-6 · V-8 — 뒤 단위
- 지도를 그리는 것 — 이 단위에 지도가 없다 (Q2-C 는 글자로 치고 후보를 고르는 방식)
- 업무 규칙을 새로 만들거나 고치는 것 — STEP 01 에서 확정했다

---

## 확인 질문

> 한 질문에 하나만 고른다. 답을 `[Answer]:` 뒤에 적고 저장하면 코드를 만든다.

## Q1. 화면을 어디까지 만드나

- A) 뼈대만 — 눌러서 동작하는 데까지. 모양은 최소한
- B) 쓸 수 있게 — 하루 보기와 패널 넷이 제대로 갖춰지고, 화면이 좁을 때도 무너지지 않는다
- C) 다듬기까지 — 애니메이션 · 빈 화면 안내 그림 등 손에 익는 느낌까지
- D) Other (please describe after [Answer]: tag below)

[Answer]:C

## Q2. 코드 주석과 화면 문구를 어떤 언어로 쓰나

- A) 주석은 한국어, 화면 문구도 한국어
- B) 주석은 영어, 화면 문구는 한국어
- C) 둘 다 영어
- D) Other (please describe after [Answer]: tag below)

[Answer]:A

## Q3. 처음 열었을 때 무엇이 보이나

- A) 빈 화면 — 일정을 직접 넣는다
- B) 예시 일정 몇 개가 들어 있다 — 어떻게 쓰는지 보이고, 지우면 된다
- C) 빈 화면이지만 "일정을 넣어보세요" 안내와 예시를 넣는 단추가 있다
- D) Other (please describe after [Answer]: tag below)

[Answer]:C

## Q4. 키보드와 화면 낭독기 지원을 어디까지 하나

- A) 기본까지 — 키보드로 모든 것을 조작할 수 있고, 단추와 칸에 이름이 붙어 있다
- B) 하지 않는다 — 혼자 쓰는 앱이라 넘어간다
- C) 기본에 더해 낭독기로 목록과 패널을 읽을 수 있게 맞춘다
- D) Other (please describe after [Answer]: tag below)

[Answer]:B
