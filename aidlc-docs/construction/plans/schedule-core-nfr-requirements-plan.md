# schedule-core · STEP 02 비기능 요구 — 계획

> 산출물: `aidlc-docs/construction/schedule-core/nfr-requirements/`
> — `nfr-requirements.md` · `tech-stack-decisions.md`
> 근거: `requirements.md` NFR-1~NFR-5 · `unit-of-work.md` (단위별 STEP 02 에서 고를 것) · `functional-design/` 문서 네 개

## 이 단계가 하는 일

**기술을 고르는 곳은 이 단계 한 군데다.** 지금까지 어느 문서에도 언어 · 프레임워크를 적지 않았다.

`unit-of-work.md` 가 이 단위의 STEP 02 에 배정한 것:

| 고를 것 | 왜 여기서 |
|---|---|
| 언어 · 프레임워크 | 나머지 세 단위가 그대로 따른다 |
| 브라우저 저장 방식 | C-5 보관소가 E-2~E-7 을 남기는 방법 (FR-7.1) |
| 테스트 도구 | 이 단위의 완료 기준이 C-1 펼치기 테스트다 (Q3-B) |
| 빌드 · 실행 방식 | Q3-A — 내 컴퓨터에서 실행해 브라우저로 열어보는 데까지 |

뒤 단위로 미루는 것 — `route-planning` 의 지도 서비스, `departure-alarm` 의 알림 방식, `meetup-midpoint` 의 장소 검색 서비스.

## 이 단위가 져야 하는 비기능 요구

`requirements.md` 의 NFR 중 이 단위에 걸리는 것만 골라 `nfr-requirements.md` 에 옮긴다.

| NFR | 이 단위에서 무엇이 되나 |
|---|---|
| NFR-2.3 로컬 타임존 · 자정 넘김 | BR-48, BR-49 — 시각을 어떻게 다루는지 |
| NFR-3.1 외부 없이 단위 테스트 | C-1 펼치기는 외부를 부르지 않는다. 그대로 테스트된다 |
| NFR-3.2 경계 상황 | `business-logic-model.md` 의 14가지 |
| NFR-4.2 정보가 밖으로 나가지 않음 | BR-46 |
| NFR-4.3 입력 검증 | BR-9 |
| NFR-4.4 전체 삭제 | BR-44, BR-45 |
| NFR-5.2 수치를 설정으로 | BR-51~BR-53 · E-7 |
| NFR-5.3 계산과 화면 분리 | C-1 은 화면을 모른다 |

이 단위에 걸리지 않는 것 — NFR-1.1 · NFR-1.2 성능(계산이 없다) · NFR-1.3 캐시 · NFR-2.1 · NFR-2.2 · NFR-2.4 · NFR-3.3 시각 주입 · NFR-4.1 비밀값 · NFR-5.1 외부 경계. 어느 단위에서 지는지 표로 남긴다.

## 무엇을 할지

- [x] `tech-stack-decisions.md` — 고른 것과 **왜 골랐는지**를 적는다. 후보와 견준 이유를 함께 — TypeScript+React · localStorage · Vitest · Vite · Tailwind CSS
- [x] `nfr-requirements.md` — 이 단위가 지는 NFR 을 확인 가능한 문장으로 옮긴다 — U-NFR-1~U-NFR-5. 지지 않는 것 9개는 어느 단위가 지는지 표로
- [x] E-1~E-7 을 고른 저장 방식에 어떻게 담을지 적는다 (구조만. 코드는 STEP 05) — storage/repositories/ 에 E별로, localStorage 접근은 한 군데
- [x] 빌드 · 실행 · 테스트 **명령**을 적는다 — CONSTRUCTION 06 이 이 명령을 쓴다 — npm install · dev · typecheck · test · build
- [x] 나머지 세 단위가 이 결정을 어떻게 따르는지 한 줄로 적는다 — 언어·빌드·테스트는 이 문서를 따르고 외부 서비스만 각자 고른다
- [x] 폴더 짜임을 적는다 — 코드는 루트 `src/`, 계산과 화면을 어떻게 가를지 (NFR-5.3) — src/domain · storage · ui · app

## 무엇을 하지 않나

- 지도 · 길찾기 · 장소 검색 서비스를 고르지 않는다 — `route-planning` · `meetup-midpoint` 의 STEP 02
- 알림 방식을 고르지 않는다 — `departure-alarm` 의 STEP 02
- 업무 규칙을 고치지 않는다 — STEP 01 에서 확정했다
- 코드를 만들지 않는다 — STEP 05

---

## 확인 질문

> 한 질문에 하나만 고른다. 답을 `[Answer]:` 뒤에 적고 저장하면 이어서 문서 두 개를 만든다.
> 버전 번호는 여기서 정하지 않는다. STEP 05 에서 설치할 때 고정한다.

## Q1. 언어와 프레임워크

- A) TypeScript + React — 쓰는 사람이 많아 참고할 것이 많다
- B) TypeScript + Vue — 화면과 상태를 다루는 방식이 정돈돼 있다
- C) TypeScript + Svelte — 만들어지는 결과물이 가볍다
- D) TypeScript만, 프레임워크 없이 — 패널 네 개뿐이라 프레임워크가 과할 수 있다
- E) Other (please describe after [Answer]: tag below)

[Answer]:A

## Q2. 브라우저에 어떻게 남기나 (FR-7.1 · C-5)

- A) `localStorage` — 다루기 쉽다. 글자로만 저장되므로 꺼낼 때 되돌리는 일을 직접 한다. 용량 한계가 있다 (보통 5MB 안팎)
- B) `IndexedDB` — 구조를 가진 값을 그대로 담고 용량이 넉넉하다. 다루는 코드가 길어진다
- C) `localStorage` 로 시작하고, 용량이 문제되면 옮긴다 — 옮길 수 있게 보관소 경계를 나눠 둔다
- D) Other (please describe after [Answer]: tag below)

[Answer]:A

## Q3. 테스트는 무엇으로 돌리나 (완료 기준이 C-1 펼치기 테스트다)

- A) Vitest — 빠르고 설정이 적다
- B) Jest — 오래돼 자료가 많다
- C) 런타임에 딸린 테스트 기능만 쓴다 — 도구를 하나도 더 얹지 않는다
- D) Other (please describe after [Answer]: tag below)

[Answer]:A

## Q4. 어떻게 빌드하고 실행하나 (Q3-A — 내 컴퓨터에서 브라우저로 열어보는 데까지)

- A) Vite — 개발 중 새로고침이 빠르고 설정이 적다
- B) 번들러 없이 브라우저가 모듈을 바로 읽게 한다 — 빌드 단계가 없다
- C) 서버까지 함께 다루는 프레임워크를 쓴다 (Next.js 등)
- D) Other (please describe after [Answer]: tag below)

[Answer]:A

## Q5. 화면 모양은 어떻게 입히나

- A) CSS 파일을 직접 쓴다 — 얹는 것이 없다
- B) Tailwind CSS — 클래스로 모양을 정한다
- C) 완성된 컴포넌트 묶음을 쓴다 (MUI 등) — 만들 것이 줄지만 결과물이 무거워진다
- D) Other (please describe after [Answer]: tag below)

[Answer]:B
