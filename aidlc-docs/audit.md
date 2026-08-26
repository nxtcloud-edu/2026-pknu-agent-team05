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
