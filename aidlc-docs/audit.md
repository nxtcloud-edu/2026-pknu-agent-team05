# 기록

승인 문구와 사람의 답변을 **원문 그대로** 시각과 함께 **덧붙인다.** 덮어쓰지 않는다.
요약하거나 다듬지 않는다.

형식:

```
### 2026-08-24 14:03 · STEP 05 실행 계획 수립 · 게이트 1
- 물은 것: (승인을 물은 문구 그대로)
- 답: (사람이 쓴 말 그대로)
```

---

### 2026-08-26 11:14 · STEP 03 요구사항 분석 · 게이트 1

- 물은 것: 질문 파일을 만들었습니다 — aidlc-docs/inception/requirements/requirement-verification-questions.md (질문 10개: 사용자 수, 참여자 위치 입력 방식, 이동시간 계산 근거, 장소 후보 데이터 출처, "최적"의 기준, 일정 순서 변경 허용 범위, 이동 수단, 알람 방식, 데이터 보관 위치, MVP 제외 항목). 각 [Answer]: 에 답을 채워 저장해 주세요.
1) 수정 요청
2) 다음 단계로
- 답: 답했어

Q1 [Answer]:A
Q2 [Answer]:A
Q3 [Answer]:A
Q4 [Answer]:A
Q5 [Answer]:A
Q6 [Answer]:B
Q7 [Answer]:B
Q8 [Answer]:A
Q9 [Answer]:A
Q10 [Answer]:B

### 2026-08-26 11:16 · STEP 03 요구사항 분석 · 게이트 2

- 물은 것: requirements.md 를 만들었습니다 — aidlc-docs/inception/requirements/requirements.md

Intent Analysis: New Project / Complexity Complex / Requirements Depth Comprehensive
기능 요구 FR-1~FR-7 (일정·할일 등록 9항, 동선 최적화 6항, 약속·중간지점 6항, 장소 후보 5항, 도착시간·출발알람 6항, 실시간 교통 3항, 데이터 보관 2항)
비기능 요구 NFR-1~NFR-5 (성능 3 · 정확성 4 · 테스트 3 · 보안 4 · 유지보수 3)
Technical Constraints: Given = 웹 앱 / 브라우저 저장 / 탭 닫혀도 오는 알림 / 외부 지도·길찾기·장소검색 데이터. Excluded = 로그인·회원가입 / 서버 저장 / 외부 캘린더 연동. 언어·프레임워크는 CONSTRUCTION STEP 02 로 미뤘습니다.
Out of Scope: 캘린더 연동, 로그인·기기간 동기화, 참여자 직접 입력 링크, 협업 편집, 예약·결제, 여러 날 여행 계획

이 단계에 쌓인 실수: 0건

1) 수정 요청
2) 다음 단계로
- 답: 요구는 없어 계속 만들어줘
- 답: 작성했어 다음

Q1 [Answer]:A
Q2 [Answer]:B
Q3 [Answer]:A
Q4 [Answer]:B
Q5 [Answer]:B

### 2026-08-26 11:33 · STEP 04 유저 스토리 · 게이트 2

- 물은 것: 유저 스토리를 만들었습니다.

aidlc-docs/inception/user-stories/personas.md — 페르소나 P-1 한 명 (앱을 직접 쓰는 본인). 참여자는 페르소나가 아니라 데이터로 다룸 (Q1-A)
aidlc-docs/inception/user-stories/stories.md — 스토리 S-1 ~ S-16 (Q2-B 중간 세분). 각 스토리에 순번(Q4-B) · 크기 작다/보통/크다(Q5-B) · 근거 FR 번호 · Given/When/Then 수락 기준(Q3-A)

만들 차례: 1 일정 등록 → 2 유형·도착시각 → 3 이동수단 → 4 출발지·도착지 → 5 완료표시 → 6 브라우저 저장 → 7 실제 이동시간 조회 → 8 동선 추천 → 9 도착불가 경고 → 10 순서 수동 고정 → 11 참여자 등록 → 12 중간지점 계산 → 13 장소 후보 → 14 장소 확정·동선 반영 → 15 출발 알림 → 16 반복 일정
크기 크다: S-7, S-8, S-12, S-13, S-15

FR 37항 전부 스토리에 대응시킨 대응표를 붙였고, NFR 17항은 스토리로 만들지 않고 수락 기준에 조건으로 녹인 뒤 어디에 들어갔는지 표로 남겼습니다. NFR-5.3(계산과 화면 분리)만 STEP 06 애플리케이션 설계로 넘겼습니다.
story-generation-plan.md 체크리스트는 전부 [x] 로 바꿨습니다.

이 단계에 쌓인 실수: 1건 — 계획 파일을 aidlc-docs/plans/ 에 잘못 만들어 aidlc-docs/inception/plans/ 로 옮겼습니다.

1) 수정 요청
2) 다음 단계로
- 답: 2

### 2026-08-26 11:51 · STEP 05 실행 계획 수립 · 게이트 1

- 물은 것: 실행 계획 초안과 질문 5개를 만들었습니다 — aidlc-docs/inception/plans/execution-plan.md (Q1 작업 단위를 몇 덩어리로, Q2 CONSTRUCTION STEP 03 비기능 설계 실행 여부, Q3 배포 범위, Q4 알림 수준, Q5 첫 단위 완료 기준). 각 [Answer]: 를 채워 저장해 주세요.
1) 수정 요청
2) 다음 단계로
- 답: 적엇어

Q1 [Answer]:C
Q2 [Answer]:B
Q3 [Answer]:A
Q4 [Answer]:A
Q5 [Answer]:C

### 2026-08-26 11:52 · STEP 05 실행 계획 수립 · 게이트 2

- 물은 것: 실행 계획을 확정했습니다 — aidlc-docs/inception/plans/execution-plan.md

조건 단계 판정
· INCEPTION 06 애플리케이션 설계 — 돌린다
· INCEPTION 07 작업 단위 쪼개기 — 돌린다 (네 덩어리, Q1-C)
· CONSTRUCTION 01 기능 설계 — 돌린다 (단위마다)
· CONSTRUCTION 02 비기능 요구 — 돌린다 (단위마다). 언어·프레임워크·외부 지도 서비스를 여기서 고른다
· CONSTRUCTION 03 비기능 설계 — 건너뛴다 (Q2-B)
· CONSTRUCTION 04 인프라 설계 — 건너뛴다 (Q3-A, 배포 대상 없음)

건너뛴 자리의 NFR 이 어디로 가는지 표로 남겼습니다 — 캐시·수치는 CONSTRUCTION 02 설정으로, 외부 실패 시 이전 값 사용은 CONSTRUCTION 01 business-rules.md 로, 외부 접근 경계와 계산·화면 분리는 INCEPTION 06 components.md 로, 백그라운드 알림 방식은 CONSTRUCTION 02 로, 성능 3초는 CONSTRUCTION 06 으로.

작업 단위와 순서 (Q1-C · Q5-C 를 함께 맞춘 결과)
① 일정 관리와 저장 — S-1~S-6, S-16
② 동선과 이동시간 — S-7~S-10
③ 출발 알림 — S-15
④ 약속·중간지점·장소 후보 — S-11~S-14
Q1-C 는 네 덩어리, Q5-C 는 S-1~S-10 + S-15 까지를 돌아가는 앱으로 본다는 답이라 서로 어긋났습니다. 그래서 알림(S-15)을 약속(④)보다 앞인 ③ 으로 당겨, ③ 을 끝낸 시점이 Q5-C 의 기준을 채우게 맞췄습니다. 이 재배치가 의도와 다르면 수정 요청을 주십시오.

알림 범위 (Q4-A) — 탭이 닫혀 있어도 알림이 온다. 브라우저를 완전히 종료하면 안 와도 된다. 서버 푸시 구성 요소는 만들지 않는다.
사람이 준비할 것 — 외부 지도·길찾기·장소 검색 API 키 (CONSTRUCTION 02 에서 필요)

이 단계에 쌓인 실수: 0건

1) 수정 요청
2) 다음 단계로
- 답: 2

### 2026-08-26 12:03 · STEP 06 애플리케이션 설계 · 게이트 1

- 물은 것: 애플리케이션 설계 계획과 질문 5개를 만들었습니다 — aidlc-docs/inception/plans/application-design-plan.md (Q1 화면 구성, Q2 계층 분리 정도, Q3 외부 서비스 경계 수, Q4 일정 데이터 모양, Q5 검증 범위). 각 [Answer]: 를 채워 저장해 주세요.
1) 수정 요청
2) 다음 단계로
- 답: 다음

Q1 [Answer]:C
Q2 [Answer]:A
Q3 [Answer]:C
Q4 [Answer]:C
Q5 [Answer]:A

### 2026-08-26 12:06 · STEP 06 애플리케이션 설계 · 게이트 2

- 물은 것: 애플리케이션 설계를 만들었습니다 — aidlc-docs/inception/application-design/components.md

두 층 (Q2-A). 층 1 화면 / 층 2 그 밖의 모든 것. 층은 둘이지만 아래 층 안은 구성 요소 8개로 나눴습니다.
계산 — C-1 일정 펼치기 · C-2 동선 계산 · C-3 중간지점 계산 · C-4 출발시각 계산과 알림 예약
보관 — C-5 일정 보관소 · C-6 설정
창구 — C-7 지도 창구(주소↔좌표 · 길찾기) · C-8 장소 창구 (Q3-C 로 둘)
화면 — V-1 하루 보기 + V-2~V-9 패널들 (Q1-C)

Q4-C 를 반영해 C-5 는 개별 일정 · 반복 규칙 · 예외 기록을 따로 보관하고, C-1 이 날짜마다 합쳐 펼칩니다. 미래 날짜를 미리 만들지 않습니다.
C-2 동선 계산과 C-3 중간지점 계산은 외부를 직접 부르지 않고 이동 시간을 받아 씁니다. 대역으로 갈아끼우면 외부 없이 검증됩니다 (NFR-3.1).
C-4 는 지금 시각을 주입받습니다. 실제 시간을 기다리지 않고 검증하기 위해서입니다 (NFR-3.3).
수치는 전부 C-6 에 모았습니다 — 여유 시간 기본값 · 기본 이동 수단 · 캐시 유지 시간 · 검색 반경 · 중간지점 후보 개수 (NFR-5.2).
검증은 Q5-A 대로 계산 요소만 단위 테스트, 화면은 손으로 확인. 빌드·테스트 명령은 스택이 없어 CONSTRUCTION 02 이후로 미뤘습니다.
흐름 두 개(동선 받기 · 약속 장소 정하기)를 그렸고, 단위 ①~④ 에 구성 요소를 배정했고, 스토리 S-1~S-16 전부 대응표를 붙였습니다.
언어 · 프레임워크 · 외부 서비스 이름은 어디에도 적지 않았습니다.

이 단계에 쌓인 실수: 0건

1) 수정 요청
2) 다음 단계로
- 답: 2

### 2026-08-26 12:18 · STEP 07 작업 단위 쪼개기 · 게이트 1

- 물은 것: 작업 단위 쪼개기 계획과 질문 4개를 만들었습니다 — aidlc-docs/inception/plans/unit-of-work-plan.md (Q1 단위 이름 규칙, Q2 단위 사이 경계면을 문서로 못 박을지, Q3 단위 완료 기준, Q4 앞 단위를 고쳐야 할 때). 각 [Answer]: 를 채워 저장해 주세요.
1) 수정 요청
2) 다음 단계로
- 답: 다 작성했어 다음

Q1 [Answer]:A
Q2 [Answer]:A
Q3 [Answer]:B
Q4 [Answer]:C

### 2026-08-26 12:20 · STEP 07 작업 단위 쪼개기 · 게이트 2

- 물은 것: 작업 단위를 확정했습니다 — aidlc-docs/inception/application-design/unit-of-work.md

단위 넷 (Q1-A)
1 schedule-core — 일정을 넣고 브라우저에 남긴다 (C-1 · C-5 · C-6 / V-1 · V-2 · V-7 · V-9 / S-1~S-6, S-16)
2 route-planning — 실제 이동 시간을 받아 동선을 추천한다 (C-2 · C-7 / V-3 / S-7~S-10)
3 departure-alarm — 출발 시각을 계산해 알림을 걸어둔다 (C-4 / V-8 / S-15)
4 meetup-midpoint — 약속 중간지점과 장소 후보 (C-3 · C-8 / V-4 · V-5 · V-6 / S-11~S-14)

경계면 네 개를 못 박았습니다 (Q2-A) — ① schedule-core→route-planning (펼쳐진 일정 목록 · 하루 설정 · 설정값) ② route-planning→departure-alarm (동선 결과 또는 도착불가 경고) ③ schedule-core↔meetup-midpoint (약속·참여자 / 확정 장소) ④ meetup-midpoint→route-planning (재계산 요청). 넘기는 것의 의미만 적고 이름·타입은 CONSTRUCTION 01 로 미뤘습니다.

완료 기준 (Q3-B) — 단위마다 계산 단위 테스트 통과. 화면 확인 · 성능 3초 · 탭 닫힌 상태의 실제 알림 · 권한 거부 안내는 완료 기준에서 빼고 CONSTRUCTION 06 으로 넘겼습니다.

앞 단위 수정 (Q4-C) — 그 자리에서 고치는 경우 3가지(버그 · 설계에 예정된 자리 채우기 · 깨지 않는 추가)와 되돌아가는 경우 3가지(확정 요구·설계와 어긋남 · 앞 단위 완료 기준 무효 · NFR-5.1/5.3 위반)를 표로 못 박았습니다. 되돌아가면 mistakes.md 에 남깁니다.

스토리 16개가 모두 단위 하나에만 담깁니다. S-5 · S-11 · S-14 는 다른 단위를 건드리지만 경계면을 통해서만 건드립니다.
단위별 STEP 02 에서 고를 것도 표로 적었습니다 — schedule-core 에서 언어·프레임워크·저장방식·테스트도구, route-planning 에서 지도 서비스, departure-alarm 에서 알림 방식, meetup-midpoint 에서 장소 검색 서비스.

이 단계에 쌓인 실수: 0건

이것으로 INCEPTION 7단계가 끝납니다. 다음은 CONSTRUCTION 첫 단위 schedule-core 의 STEP 01 기능 설계입니다.

1) 수정 요청
2) 다음 단계로
- 답: 2

### 2026-08-26 12:28 · CONSTRUCTION schedule-core STEP 01 기능 설계 · 게이트 1

- 물은 것: schedule-core 기능 설계 계획과 질문 5개를 만들었습니다 — aidlc-docs/construction/plans/schedule-core-functional-design-plan.md (Q1 반복 범위, Q2 장소 입력 방식, Q3 시간 표현, Q4 하루 출발지·도착지 적용 범위, Q5 지난 날짜 처리). 각 [Answer]: 를 채워 저장해 주세요.
1) 수정 요청
2) 다음 단계로
- 답: 다음

Q1 [Answer]:A
Q2 [Answer]:C
Q3 [Answer]:A
Q4 [Answer]:B
Q5 [Answer]:A

### 2026-08-26 12:33 · CONSTRUCTION schedule-core STEP 01 기능 설계 · 게이트 2

- 물은 것: schedule-core 기능 설계를 만들었습니다 — aidlc-docs/construction/schedule-core/functional-design/ 에 문서 네 개

domain-entities.md — E-1 장소 · E-2 일정 · E-3 반복 규칙 · E-4 하루 설정 · E-5 예외 기록 · E-6 참여자 · E-7 설정. 보관하는 것과 계산되는 것을 갈랐습니다. 동선 순서 · 구간 시각 · 출발 시각은 보관하지 않습니다.
business-rules.md — BR-1~BR-53. 스토리 수락 기준 24행 대조표를 붙였습니다.
business-logic-model.md — C-1 펼치기 5단계, 완료 기준이 되는 경계 상황 14가지, 고치기가 직접 넣은 일정과 반복에서 온 일정으로 갈리는 지점.
frontend-components.md — V-1 하루 보기 · V-2 일정 상세 · V-7 하루 설정 · V-9 데이터 관리. 패널 열림/닫힘 규칙.

답이 만든 결과 세 가지를 짚습니다.
Q3-A — 지정한 도착 시각과 머무는 시간만 보관하고 끝나는 시각은 보관하지 않습니다. 유연형은 지정한 도착 시각이 빈 칸입니다. 유형에 따라 구조가 달라지지 않고 한 칸이 비는 것으로 갈립니다.
Q4-B — 하루 설정을 날짜마다 따로 둡니다. 새 날짜를 열면 출발지가 비어 있어 매번 넣어야 합니다. V-7 에 "이 설정은 이 날짜에만 적용됩니다" 안내를 넣었습니다. 이 불편이 예상과 다르면 Q4-C(기본값 두고 날짜별로 덮어쓰기)로 바꾸는 편이 낫습니다.
Q2-C — 후보를 골라 확정하는 흐름인데, 주소를 좌표로 바꾸는 C-7 지도 창구는 route-planning 단위 소유입니다(components.md). 그래서 이 단위는 좌표를 담을 자리와 고르는 흐름만 만들고, 실제 조회는 route-planning 이 선 뒤에 이어집니다(BR-21, BR-22). 단위 경계를 옮기지 않았으므로 unit-of-work.md 는 고치지 않았습니다. 이 판단이 의도와 다르면 수정 요청을 주십시오.

언어 · 프레임워크 · 저장 기술 · 컴포넌트 라이브러리는 어디에도 적지 않았습니다. 다음 STEP 02 에서 고릅니다.

이 단계에 쌓인 실수: 0건

1) 수정 요청
2) 다음 단계로
- 답: 2

### 2026-08-26 12:44 · CONSTRUCTION schedule-core STEP 02 비기능 요구 · 게이트 1

- 물은 것: schedule-core 비기능 요구 계획과 질문 5개를 만들었습니다 — aidlc-docs/construction/plans/schedule-core-nfr-requirements-plan.md (Q1 언어·프레임워크, Q2 브라우저 저장 방식, Q3 테스트 도구, Q4 빌드·실행 방식, Q5 스타일링). 여기가 기술을 고르는 유일한 자리입니다. 각 [Answer]: 를 채워 저장해 주세요.
1) 수정 요청
2) 다음 단계로
- 답: 다음

Q1 [Answer]:A
Q2 [Answer]:A
Q3 [Answer]:A
Q4 [Answer]:A
Q5 [Answer]:B

### 2026-08-26 12:46 · CONSTRUCTION schedule-core STEP 02 비기능 요구 · 게이트 2

- 물은 것: schedule-core 비기능 요구를 만들었습니다 — aidlc-docs/construction/schedule-core/nfr-requirements/ 에 문서 두 개

tech-stack-decisions.md — 고른 것: TypeScript + React (Q1-A) · localStorage (Q2-A) · Vitest (Q3-A) · Vite (Q4-A) · Tailwind CSS (Q5-B). 각각 왜 골랐는지와 견준 후보를 적었습니다. 이 결정을 나머지 세 단위가 그대로 따릅니다.
폴더 짜임 — src/domain (계산) · src/storage (보관) · src/ui (화면) · src/app. domain 은 ui 를 가져오지 않습니다 (NFR-5.3). localStorage 를 직접 부르는 곳은 storage/localStore.ts 한 군데입니다.
명령 — npm install · npm run dev · npm run typecheck · npm test (감시 모드 아님) · npm run build. CONSTRUCTION 06 이 이 명령을 씁니다.

nfr-requirements.md — U-NFR-1 시각 다루기 · U-NFR-2 검증 · U-NFR-3 보안 · U-NFR-4 유지보수 · U-NFR-5 이 단위만으로 서는 것. 이 단위가 지지 않는 NFR 9개는 어느 단위가 지는지 표로 넘겼습니다.

짚어야 할 것 세 가지
1. Tailwind 는 v4 부터 설정 방식이 바뀌었습니다. @tailwindcss/vite 플러그인과 CSS 한 줄 import 로 끝나고 tailwind.config.js 와 PostCSS 설정이 없습니다. v3 방식으로 만들면 스타일이 조용히 안 먹는 형태로 실패하므로 STEP 05 에서 주의합니다. (출처: tailwindcss.com Vite 설치 안내)
2. Q2-A localStorage 는 글자만 담으므로 시각이 글자로 오가며 어긋날 위험이 있습니다. U-NFR-1.3 으로 테스트 대상에 넣었습니다.
3. Vite 는 빌드할 때 값을 결과물에 박아 넣습니다. route-planning 에서 API 키를 다룰 때 브라우저로 내려가는 키는 감춰지지 않는다는 점을 그 단위에서 짚어야 합니다.

이 단계에 쌓인 실수: 0건

1) 수정 요청
2) 다음 단계로
- 답: 2

### 2026-08-26 12:52 · CONSTRUCTION schedule-core STEP 05 코드 생성 · 게이트 1

- 물은 것: schedule-core 코드 생성 계획과 질문 4개를 만들었습니다 — aidlc-docs/construction/plans/schedule-core-code-generation-plan.md (Q1 화면 완성도, Q2 주석·문구 언어, Q3 처음 열었을 때, Q4 키보드·낭독기 지원). 승인하면 루트 src/ 에 실제 코드를 만듭니다. 각 [Answer]: 를 채워 저장해 주세요.
1) 수정 요청
2) 다음 단계로
- 답: 다음

Q1 [Answer]:C
Q2 [Answer]:A
Q3 [Answer]:C
Q4 [Answer]:B

### 2026-08-26 13:20 · CONSTRUCTION schedule-core STEP 05 코드 생성 · 게이트 2

- 물은 것: schedule-core 코드를 만들었습니다. 실제 코드는 루트 src/ 에, 요약은 aidlc-docs/construction/schedule-core/code/summary.md 에 있습니다.

검증 결과
npm test — 4 파일 116개 통과
npm run typecheck — 통과
npm run build — 통과 (CSS 20.79 kB · JS 227.95 kB / gzip 70.65 kB)

만든 것
프로젝트 — React 19.2.8 · TypeScript 7.0.2 · Vite 8.2.2 · Vitest 4.1.11 · Tailwind CSS 4.3.3. 버전을 ^ 범위 없이 정확한 값으로 박았습니다.
src/domain/ — schedule/types.ts (E-1~E-6) · schedule/rules.ts (BR-1~BR-8 등) · schedule/expand.ts (C-1 펼치기) · time/index.ts (BR-48·BR-49) · settings/index.ts (E-7) · handoff.ts (경계 1)
src/storage/ — localStore.ts (localStorage 를 직접 부르는 유일한 곳) · repository.ts (함께 지우기 · 예외 · 전체 삭제)
src/ui/ — DayView (V-1) · SchedulePanel (V-2) · DaySettingPanel (V-7) · DataPanel (V-9) · PlaceInput · parts
src/app/ — store.ts (화면과 층 2 를 잇는 자리) · App.tsx (패널 열림·닫힘 규칙)

완료 기준 (Q3-B) — business-logic-model.md 의 경계 상황 14가지가 모두 테스트로 통과합니다. 경계 당일(언제부터·언제까지)까지 포함했습니다.

짚어야 할 것 세 가지
1. 확인하지 못한 것 — 화면이 실제로 브라우저에 그려지는지는 확인하지 못했습니다. 개발 서버가 HTML·모듈·CSS(Tailwind 클래스 생성 확인)를 내려주는 것까지는 확인했지만 React 렌더링 결과는 브라우저에서 봐야 합니다. Q3-B·Q5-A 에 따라 CONSTRUCTION 06 으로 넘겼습니다. localStorage 에 실제로 남는지도 테스트에서는 메모리 자리로 확인했습니다.
2. Q4-B 를 따라 aria 속성과 낭독기 지원을 별도로 넣지 않았습니다. 다만 button·input·label 같은 기본 요소는 그대로 썼습니다(div 로 단추를 만드는 것이 더 긴 코드가 되기 때문입니다). 결과적으로 탭 이동과 엔터는 브라우저 기본 동작으로 됩니다.
3. vite.config.ts 에서 defineConfig 를 vite 에서 가져왔더니 test 옵션이 타입에 없어 typecheck 가 실패했습니다. vitest/config 에서 가져오도록 고쳤습니다. 코드 작성 중 발견해 바로 고친 것이라 실수 기록에는 남기지 않았습니다.

설계와 다르게 만든 것은 없습니다. 계획 체크리스트 27항 전부 [x] 로 바꿨습니다.

이 단계에 쌓인 실수: 0건

1) 수정 요청
2) 다음 단계로
- 답: 2

### 2026-08-26 13:29 · CONSTRUCTION route-planning STEP 01 기능 설계 · 게이트 1

- 물은 것: route-planning 기능 설계 계획과 질문 5개를 만들었습니다 — aidlc-docs/construction/plans/route-planning-functional-design-plan.md (Q1 유연형을 고정형 사이에 끼울지, Q2 유연형이 많을 때, Q3 첫 출발 시각, Q4 좌표를 못 찾았을 때, Q5 이동 시간 재조회 시점). 각 [Answer]: 를 채워 저장해 주세요.
1) 수정 요청
2) 다음 단계로
- 답: 다음

Q1 [Answer]:B
Q2 [Answer]:C
Q3 [Answer]:B
Q4 [Answer]:A
Q5 [Answer]:C

### 2026-08-26 13:35 · CONSTRUCTION route-planning STEP 01 기능 설계 · 게이트 2

- 물은 것: route-planning 기능 설계를 만들었습니다 — aidlc-docs/construction/route-planning/functional-design/ 에 문서 네 개

domain-entities.md — R-1 좌표 후보 · R-2 이동 시간 조회 결과 · R-3 캐시 항목 · R-4 구간 · R-5 동선 결과 · R-6 도착 불가 경고 · R-7 빠진 일정. 이 단위는 캐시와 좌표만 보관하고 동선 결과는 보관하지 않습니다.
business-rules.md — RBR-1~RBR-46 (schedule-core 의 BR- 와 구분). 스토리 수락 기준 대조표 포함.
business-logic-model.md — C-2 계산 6단계 · 경계 상황 22가지 · C-7 의 캐시/실패 흐름
frontend-components.md — V-3 동선 결과 (성공 · 도착 불가 · 빠진 일정 · 낡은 값 · 계산 불가 다섯 상태) · PlaceInput 후보 고르기 · 하루 시작 시각 칸

답이 만든 결과와 짚어야 할 것

1. Q2-C 와 FR-2.2 의 긴장 — 가까운 곳부터 이어 붙이는 방식은 총 이동 시간이 가장 짧은 순서를 보장하지 않습니다. FR-2.2 는 그것을 최적화 목표로 정했습니다. 목표는 유지하되 보장하지 않는다고 문서에 명시하고, 화면에 "가까운 곳부터 이어 붙인 순서입니다" 라고 밝히고, 사용자가 손으로 옮길 수 있게 했습니다 (RBR-5). 요구사항 위반으로 보시면 수정 요청을 주십시오.

2. Q1-B 의 결과 — 14시 치과와 19시 약속 사이 4시간이 비어도 장 보기를 그 사이에 넣지 않고 19시 뒤로 보냅니다. 화면에 "3시간 15분 기다림" 이 드러나도록 만들었습니다. 이 결과가 예상과 다르면 Q1-A 로 바꾸는 편이 낫습니다. 대신 계산이 복잡해집니다.

3. 앞 단위를 고쳐야 하는 것 4가지 (unit-of-work.md Q4-C 기준으로 모두 "그 자리에서 고친다")
· domain/handoff.ts 의 checkRouteReadiness — missing-coords 를 계산 막힘으로 판정하던 것을 Q4-A 에 맞게 푼다
· domain/settings/ 에 "앞날의 하루 시작 시각" 을 더한다 (Q3-B 가 만든 값)
· PlaceInput 에 후보 찾기·고르기를 넣는다 (BR-21 이 넘긴 것)
· DayView 의 "좌표 없음 → 계산할 수 없다" 안내를 "빼고 계산한다" 로 고친다
checkRouteReadiness 는 schedule-core 의 완료 기준 14가지에 들어 있지 않아 그 기준이 무너지지 않습니다.

4. RBR-13 — 고정형에 일찍 닿아 기다리는 시간을 총 이동 시간에 넣지 않습니다. 넣으면 순서를 견줄 때 엉뚱한 답이 나옵니다. 대신 화면에는 보여줍니다.

5. RBR-43 이 RBR-17 과 다릅니다 — 앱이 정한 순서는 도착 불가면 내지 않지만, 사람이 손으로 잡은 순서는 경고만 하고 막지 않습니다.

외부 지도 서비스는 고르지 않았습니다. 다음 STEP 02 에서 고릅니다.

이 단계에 쌓인 실수: 0건

1) 수정 요청
2) 다음 단계로
- 답: 2

### 2026-08-26 13:44 · CONSTRUCTION route-planning STEP 02 비기능 요구 · 게이트 1

- 물은 것: route-planning 비기능 요구 계획과 질문 5개를 만들었습니다 — aidlc-docs/construction/plans/route-planning-nfr-requirements-plan.md (Q1 외부 서비스, Q2 API 키 다루기, Q3 대중교통 시간을 못 얻을 때, Q4 재시도, Q5 테스트에서 외부 대신하기). 조사로 확인된 것과 확인하지 못한 것을 계획에 함께 적었습니다. 각 [Answer]: 를 채워 저장해 주세요.
1) 수정 요청
2) 다음 단계로
- 답: 다음

Q1 [Answer]:B
Q2 [Answer]:A
Q3 [Answer]:B
Q4 [Answer]:B
Q5 [Answer]:C

### 2026-08-26 13:47 · CONSTRUCTION route-planning STEP 02 비기능 요구 · 게이트 2

- 물은 것: route-planning 비기능 요구를 만들었습니다 — aidlc-docs/construction/route-planning/nfr-requirements/ 에 문서 두 개

고른 것 — 주소↔좌표는 카카오 로컬 REST API · 자동차 이동 시간은 카카오모빌리티 자동차 길찾기 API · 도보와 대중교통은 앱이 자체 계산 · API 키는 .env.local (Q2-A) · 재시도 한 번 (Q4-B) · 테스트는 대역 + 응답 해석 예시 (Q5-C)
폴더 — src/gateways/ 를 새로 만듭니다. fetch 를 부르는 곳은 gateways/kakao/ 안에만 둡니다. compositeGateway.ts 가 이동 수단에 따라 실제 API 와 자체 계산으로 갈라 보냅니다.

짚어야 할 것 세 가지

1. Q1-B 를 고르고 확인해보니 이동 수단 셋이 갈렸습니다. 자동차만 실제 API 로 실시간 교통이 반영되고, 도보와 대중교통은 어림값입니다. 카카오모빌리티는 도보·자전거 길찾기를 제휴로 제공한다고 안내하고 있고(출처: developers.kakaomobility.com), 카카오 계열에 대중교통 이동 시간 API 가 있는지는 확인하지 못했습니다. 그래서 Q3-B 의 자체 계산을 대중교통뿐 아니라 도보에도 적용했습니다. Q3 은 대중교통만 물었으므로 이 확장이 의도와 다르면 수정 요청을 주십시오.

2. FR-6.1(실시간 교통 반영)이 자동차에만 지켜집니다. 감추지 않기 위해 R-NFR-6 을 새로 만들어 "어림값을 화면에 표시한다" 를 요구로 못 박았습니다. FR-2.2(총 이동 시간 최소화)가 Q2-C 로 보장되지 않는 것과 함께 nfr-requirements.md 끝에 "요구사항과 어긋나는 것" 표로 모아 두었습니다.

3. R-NFR-4.2 — Vite 는 빌드할 때 키를 결과물에 박아 넣습니다. 서버가 없어 키를 대신 들고 있을 곳도 없습니다. Q3-A 로 배포하지 않기 때문에 지금은 감수하고, 인터넷에 올릴 때 다시 봐야 한다고 남겼습니다.

키가 없어도 STEP 05 는 끝까지 진행됩니다. 창구가 자체 계산으로 답하므로 동선 추천·도착 불가 경고·순서 옮기기가 모두 동작합니다. 다만 R-NFR-3.6(응답 해석 테스트)은 응답 예시를 얻을 수 없어 자리만 만들고 비워 둡니다.

이 단계에 쌓인 실수: 0건

1) 수정 요청
2) 다음 단계로
- 답: 2

### 2026-08-26 13:53 · CONSTRUCTION route-planning STEP 05 코드 생성 · 게이트 1

- 물은 것: route-planning 코드 생성 계획과 질문 4개를 만들었습니다 — aidlc-docs/construction/plans/route-planning-code-generation-plan.md (Q1 카카오 호출 코드를 지금 쓸지, Q2 순서 옮기기 조작, Q3 동선 계산 시점, Q4 V-3 완성도). 각 [Answer]: 를 채워 저장해 주세요.
1) 수정 요청
2) 다음 단계로
- 답: 다음

Q1 [Answer]:A
Q2 [Answer]:A
Q3 [Answer]:A
Q4 [Answer]:A

### 2026-08-26 14:16 · CONSTRUCTION route-planning STEP 05 코드 생성 · 게이트 2

- 물은 것: route-planning 코드를 만들었습니다. 코드는 루트 src/ 에, 요약은 aidlc-docs/construction/route-planning/code/summary.md 에 있습니다.

검증 결과
npm test — 8 파일 212개 통과 (schedule-core 116 + route-planning 96)
npm run typecheck — 통과
npm run build — 통과 (CSS 22.06 kB · JS 250.01 kB / gzip 77.06 kB)
schedule-core 의 테스트 116개가 그대로 통과합니다. 앞 단위를 고쳐도 무너진 것이 없습니다.

만든 것
src/domain/route/ — types · estimate(Haversine) · order(RBR-1~7) · schedule-times(RBR-8~15) · feasibility(RBR-16~20) · plan(C-2 6단계)
src/gateways/ — cache(cached/stale 갈림) · retry · kakao/parse · kakao/api(fetch 유일한 곳) · mapGateway(자동차는 외부, 도보·대중교통은 자체계산)
src/ui/ — RouteResult(V-3 다섯 상태) · PlaceInput 후보 고르기 채움
.env.local.example — 키 이름만

앞 단위를 고친 것 6곳 (모두 Q4-C 의 "그 자리에서 고침") — handoff.ts 의 checkRouteReadiness · settings 값 7개 추가 · PlaceInput 후보 고르기 · DayView 의 routeSlot 과 안내 문구 · DataPanel 하루 시작 시각 · store.ts 연결. 고친 동작을 못 박기 위해 handoff.test.ts 12개를 새로 만들었습니다.

확인하지 못한 것 세 가지
1. Q1-A 를 고른 결과 gateways/kakao/ 코드가 실제 키로 검증되지 않았습니다. 파일 머리에 경고를 남기고, 키를 넣을 때 확인할 세 가지를 요약에 적었습니다 — 이동 시간 단위(초로 보고 60으로 나눔) · 좌표 순서(경도 x, 위도 y 로 봄) · 결과 없을 때 모양(빈 배열로 봄). 셋 중 하나라도 틀리면 값이 어긋납니다.
2. R-NFR-3.6 응답 해석 테스트를 만들지 못했습니다. 응답 예시를 얻을 수 없었습니다. parse.ts 를 따로 떼어 두어 나중에 그 파일만 대상으로 붙일 수 있습니다.
3. 화면은 손으로 확인하지 못했습니다 (Q3-B · Q5-A 로 CONSTRUCTION 06 으로 넘김). 개발 서버가 HTML·모듈·CSS 를 내려주는 것까지는 확인했습니다.

설계와 다르게 만든 것은 없습니다. 계획 체크리스트 35항 전부 [x] 로 바꿨습니다.
키가 없어도 앱이 동작합니다. 모든 이동 시간이 어림값이 되고 화면에 어림값이라고 표시됩니다.

이 단계에 쌓인 실수: 0건

1) 수정 요청
2) 다음 단계로
- 답: 우선 키 없이 동작. 다른 작업을 진행하기 전에 푸쉬진행
