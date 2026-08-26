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
