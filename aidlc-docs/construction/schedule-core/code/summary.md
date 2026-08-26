# schedule-core · 코드 요약

> **실제 코드는 루트 `src/` 에 있다.** 여기에는 요약만 둔다 (§6 산출물 위치).
> 근거: `functional-design/` 네 문서 · `nfr-requirements/` 두 문서 · `schedule-core-code-generation-plan.md`
> 답: Q1-C (다듬기까지) · Q2-A (주석 · 문구 한국어) · Q3-C (빈 화면 + 안내 + 예시 단추) · Q4-B (키보드 · 낭독기 별도 작업 없음)

## 만든 파일

### 프로젝트 세우기 (루트)

| 파일 | 무엇 |
|---|---|
| `package.json` | 의존 버전을 **정확한 값으로 박았다** (`^` 범위 없음). 명령 5개 |
| `tsconfig.json` | `strict` + `noUncheckedIndexedAccess` |
| `vite.config.ts` | `@tailwindcss/vite` 플러그인 · Vitest 설정 (`environment: 'node'`) |
| `index.html` | `lang="ko"` |
| `.gitignore` | `node_modules/` · `dist/` 추가 |

의존 — React 19.2.8 · TypeScript 7.0.2 · Vite 8.2.2 · Vitest 4.1.11 · Tailwind CSS 4.3.3

### 층 2 · 계산 — `src/domain/`

| 파일 | 무엇 | 근거 |
|---|---|---|
| `schedule/types.ts` | E-1 장소 · E-2 일정 · E-3 반복 규칙 · E-5 예외 기록 · E-4 하루 설정 · E-6 참여자 | domain-entities.md |
| `schedule/rules.ts` | BR-1~BR-8 검사 · BR-5·BR-6 도착 시각 비우기 · BR-8 기본값 채우기 · BR-11~BR-14 다시 계산 판정 · BR-24 좌표 지우기 · BR-30 반복 검사 | business-rules.md |
| `schedule/expand.ts` | **C-1 일정 펼치기** — 5단계 | business-logic-model.md |
| `time/index.ts` | BR-48 로컬 타임존 · BR-49 자정 넘김 · BR-50 끝 시각 구하기 | business-rules.md §9 |
| `settings/index.ts` | E-7 설정 — 수치가 사는 유일한 곳 | NFR-5.2 · BR-51~53 |
| `handoff.ts` | 경계 1 로 넘길 모양 · 계산 가능 여부 판정 | unit-of-work.md 경계 1 |

### 층 2 · 보관 — `src/storage/`

| 파일 | 무엇 | 근거 |
|---|---|---|
| `localStore.ts` | **`localStorage` 를 직접 부르는 유일한 곳.** 판번호 · 되돌릴 수 없는 값 다루기 | U-NFR-4.3 |
| `repository.ts` | E-2~E-7 꺼내고 남기기 · BR-10·BR-33·BR-41 함께 지우기 · BR-35·BR-36·BR-39 예외 · BR-18 하루 설정 · BR-44 전체 삭제 | business-logic-model.md C-5 |

### 층 1 · 화면 — `src/ui/` · `src/app/`

| 파일 | 무엇 |
|---|---|
| `app/store.ts` | 화면과 층 2 를 잇는 자리. 고치기 · 지우기 · 완료 표시가 `어디서 왔는지` 에 따라 두 갈래로 갈리는 지점 |
| `app/App.tsx` | 패널 열림 · 닫힘 규칙 (한 번에 하나 · 날짜 옮기면 닫힘) |
| `ui/DayView.tsx` | **V-1 하루 보기** — 날짜 옮기기 · 일정 목록 · 하루 설정 요약 · 동선 결과 자리(비움) · 빈 화면 안내 |
| `ui/SchedulePanel.tsx` | **V-2 일정 상세** — 규칙 검사 결과를 칸 옆에 · 반복 안내 문구 |
| `ui/DaySettingPanel.tsx` | **V-7 하루 설정** — "이 날짜에만 적용됩니다" 안내 |
| `ui/DataPanel.tsx` | **V-9 데이터 관리** — 전체 삭제 두 단계 확인 · 사용자 설정 |
| `ui/PlaceInput.tsx` | 장소 고르기 (Q2-C). 좌표가 없는 상태를 화면에 알린다 |
| `ui/parts.tsx` | 되풀이되는 조각 — Panel · Field · TextInput · SegmentedControl · Button · Notice · KindMark · RecurringMark |
| `index.css` | Tailwind v4 한 줄 import · 색 토큰 · 패널 열림 애니메이션 (`prefers-reduced-motion` 존중) |

## 테스트 결과

```
npm test        4 파일 · 116 통과
npm run typecheck   통과
npm run build       통과 (CSS 20.79 kB · JS 227.95 kB / gzip 70.65 kB)
```

| 파일 | 개수 | 무엇을 |
|---|---|---|
| `domain/schedule/expand.test.ts` | 25 | **완료 기준** — 경계 상황 14가지 전부 + 화면 순서 |
| `domain/schedule/rules.test.ts` | 30 | BR-1~BR-8 각각 · BR-11~BR-14 · BR-24 · BR-30 |
| `domain/time/index.test.ts` | 34 | BR-48 로컬 타임존 · BR-49 자정 · 윤년 · 달·해 넘김 |
| `storage/repository.test.ts` | 27 | U-NFR-1.3 시각 되돌리기 · 판번호 · 함께 지우기 · 전체 삭제 |

### 완료 기준 대조 (unit-of-work.md Q3-B)

| 통과해야 하는 것 | 결과 |
|---|---|
| 반복 규칙이 해당 요일에 나타남 | ✓ |
| `건너뜀` 예외로 빠짐 | ✓ |
| `고침` 예외로 바뀐 값이 들어감 | ✓ |
| 규칙 수정과 예외가 함께 있을 때 | ✓ |
| 완료 표시가 `빠질 것` 으로 표시됨 | ✓ |
| 이동 수단 기본값 채워짐 | ✓ |
| 좌표 없이도 펼쳐짐 | ✓ |
| 자정 넘김 | ✓ |
| 같은 요일 규칙 둘 | ✓ |
| 일정 0개 | ✓ |
| `언제부터` 이전 · `언제까지` 이후 (경계 당일 포함) | ✓ |

## 설계와 다르게 만든 것

없다. 아래는 설계에 적힌 대로 지킨 대목이다.

| 요구 | 코드에서 |
|---|---|
| NFR-5.3 계산과 화면 분리 | `domain/` 은 `ui/` 를 가져오지 않는다. 한 방향이다 |
| NFR-5.2 수치를 설정으로 | 여유 시간 · 반경 · 캐시 시간 · 머무는 시간 한계가 `domain/settings/` 에만 있다 |
| U-NFR-4.3 저장 접근 한 군데 | `localStorage` 는 `storage/localStore.ts` 에서만 부른다 |
| BR-21 좌표는 뒤 단위가 채운다 | 이 단위는 `Place.coord` 자리만 만들고 `null` 로 둔다 |
| U-NFR-5.3 뒤 단위 자리 미리 | E-6 참여자 · E-7 의 여유 시간 · 반경 · 캐시 시간 |

## 뒤 단위가 이어받을 지점

| 단위 | 어디서 이어붙이나 |
|---|---|
| `route-planning` | `domain/handoff.ts` 의 `RoutePlanningInput` 을 받는다 · `DayView.tsx` 의 동선 결과 자리를 채운다 · `Place.coord` 를 채우는 창구를 만든다 |
| `departure-alarm` | `route-planning` 의 동선 결과에서 출발 시각을 구한다 · `settings.user.bufferMinutes` 를 읽는다 |
| `meetup-midpoint` | `repository.ts` 의 `findParticipants` 로 참여자를 꺼낸다 · `settings.user.placeSearchRadiusMeters` 를 읽는다 · V-4~V-6 화면을 만든다 |

## 확인하지 못한 것

Q3-B 로 완료 기준을 계산 테스트로 좁혔고, Q5-A 로 화면은 손으로 확인하기로 했다.
아래는 **CONSTRUCTION 06 빌드와 테스트**에서 브라우저로 확인해야 한다.

- V-1 · V-2 · V-7 · V-9 가 실제로 그려지는지 (개발 서버가 HTML · 모듈 · CSS 를 내려주는 것까지는 확인했다)
- 패널 열림 · 닫힘이 손에 맞는지
- 좁은 화면에서 무너지지 않는지
- `localStorage` 에 실제로 남고 새로 열었을 때 복원되는지 (테스트에서는 메모리 자리로 확인했다)

## Q4-B 에 대해

키보드 조작과 낭독기 지원을 별도로 맞추지 않았다 (Q4-B).
다만 `button` · `input` · `label` 같은 기본 요소는 그대로 썼다. `div` 로 단추를 만드는 것이 오히려
더 긴 코드가 되기 때문이다. 결과적으로 탭 이동과 엔터 누르기는 브라우저 기본 동작으로 된다.
`aria` 속성과 낭독기용 안내는 넣지 않았다. 나중에 필요해지면 이 위에 붙이면 된다.
