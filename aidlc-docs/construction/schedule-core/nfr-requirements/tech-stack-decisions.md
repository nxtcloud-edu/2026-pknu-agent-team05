# 기술 선택

> **이 프로젝트에서 기술을 고르는 곳은 이 문서다.** INCEPTION 의 어느 문서에도 언어 · 프레임워크가 적혀 있지 않다.
> 근거: `unit-of-work.md` (단위별 STEP 02 에서 고를 것) · `schedule-core-nfr-requirements-plan.md` Q1-A · Q2-A · Q3-A · Q4-A · Q5-B
> 여기서 정한 언어 · 프레임워크 · 빌드 · 테스트 도구는 **나머지 세 단위가 그대로 따른다.**

## 고른 것

| 무엇 | 고른 것 | 답 |
|---|---|---|
| 언어 | TypeScript | Q1-A |
| 화면 프레임워크 | React | Q1-A |
| 브라우저 저장 | `localStorage` | Q2-A |
| 테스트 도구 | Vitest | Q3-A |
| 빌드 · 개발 서버 | Vite | Q4-A |
| 화면 모양 | Tailwind CSS | Q5-B |

버전은 STEP 05 에서 설치할 때 고정한다. 열린 범위(`^`)로 두지 않고 정확한 버전으로 박는다.

## 왜 골랐나

### TypeScript + React (Q1-A)

- 이 앱은 계산 결과를 화면에 반영하는 일이 잦다. 일정을 고치면 동선이 낡고, 장소가 확정되면 다시 계산된다 (BR-11~BR-13). 화면과 상태를 잇는 일을 프레임워크가 맡는 편이 낫다.
- TypeScript 를 쓰는 이유는 E-1~E-7 의 "비어 있을 수 있는 값"이 많기 때문이다. 유연형 일정은 지정한 도착 시각이 비고(BR-5), 좌표도 빌 수 있다(BR-22). 빈 값을 다루다 틀리는 것을 컴파일 단계에서 잡는다.
- 견준 것 — 프레임워크 없이(Q1-D)도 패널 넷은 만들 수 있다. 하지만 뒤 단위에서 화면이 다섯 개 더 붙고(V-3~V-6, V-8) 계산 결과가 여러 화면에 얽힌다. 그때 직접 만든 상태 관리가 부담이 된다.

### `localStorage` (Q2-A)

- 남기는 것은 일정 · 반복 규칙 · 예외 기록 · 하루 설정 · 참여자 · 설정이다 (E-2~E-7). 지난 날짜를 지우지 않지만(BR-47) 하루에 일정 몇 개 수준이면 몇 년치도 용량 한계에 닿지 않는다.
- 글자로만 저장되므로 **꺼낼 때 되돌리는 일을 직접 한다.** 특히 날짜와 시각이 글자로 바뀌었다가 돌아온다. BR-48(로컬 타임존)이 여기서 깨지기 쉬우니 NFR-2.3 을 검증 대상에 넣는다.
- 견준 것 — `IndexedDB`(Q2-B)는 구조를 그대로 담지만 다루는 코드가 길어진다. 이 앱의 데이터 양에는 과하다.

### Vitest (Q3-A)

- Vite 를 쓰기로 했으므로(Q4-A) 설정을 공유한다. 별도 변환 설정이 필요 없다.
- 이 단위의 완료 기준이 C-1 펼치기 테스트다 (Q3-B). 계산 요소는 외부를 부르지 않으므로 브라우저 없이 돌아간다 (NFR-3.1).

### Vite (Q4-A)

- Q3-A 로 배포 대상이 없다. 개발 서버로 브라우저에서 열어보는 것이 목표다.
- 견준 것 — 번들러 없이(Q4-B)는 TypeScript 를 쓰는 이상 변환이 필요해 맞지 않는다. 서버까지 다루는 프레임워크(Q4-C)는 서버가 없는 이 앱에 불필요하다 (Q3-A · Q4-A 알림 결정으로 서버 구성 요소가 하나도 없다).

### Tailwind CSS (Q5-B)

- 만드는 화면이 하루 보기 하나 + 패널 여덟 개다. 패널마다 CSS 파일을 따로 두면 이름이 겹치고 흩어진다.
- **v4 부터 설정 방식이 바뀌었다.** `@tailwindcss/vite` 플러그인을 Vite 설정에 넣고, CSS 에 `@import "tailwindcss";` 한 줄을 넣는다. `tailwind.config.js` 와 PostCSS 설정 파일이 필요 없다. ([Tailwind CSS · Vite 설치 안내](https://tailwindcss.com/docs/guides/vite/) · [Vite 플러그인 설정 정리](https://tailkits.com/blog/install-tailwind-css-with-vite/) — 라이선스 준수를 위해 내용을 바꿔 적었다)
- STEP 05 에서 v3 방식(PostCSS + config 파일)으로 만들지 않도록 주의한다. 조용히 스타일이 안 먹는 형태로 실패한다.

## 폴더 짜임 (NFR-5.3)

코드는 루트 `src/` 에 둔다. `aidlc-docs/` 에는 코드를 넣지 않는다.
두 층(Q2-A · `components.md`)이 폴더로 드러나게 한다.

```
src/
├── domain/            층 2 · 계산 — 화면을 모른다
│   ├── schedule/          E-2 일정 · E-3 반복 규칙 · E-5 예외 기록
│   │   ├── types.ts
│   │   ├── rules.ts           BR-1~BR-8 · BR-30 검사
│   │   └── expand.ts          C-1 일정 펼치기
│   ├── dayPlan/           E-4 하루 설정
│   └── settings/          E-7 설정 — 수치는 여기 (NFR-5.2)
│
├── storage/           층 2 · 바깥과 닿는 것 — C-5 보관소
│   ├── localStore.ts      localStorage 읽기·쓰기 한 군데
│   └── repositories/      E-2~E-7 별로 꺼내고 남기는 자리
│
├── ui/                층 1 · 화면 — 계산식을 갖지 않는다
│   ├── DayView/           V-1 하루 보기
│   ├── SchedulePanel/     V-2 일정 상세
│   ├── DaySettingPanel/   V-7 하루 설정
│   └── DataPanel/         V-9 데이터 관리
│
├── app/               화면과 층 2 를 잇는 자리
└── main.tsx
```

### 이 짜임이 지키는 것

| 요구 | 어떻게 |
|---|---|
| NFR-5.3 계산과 화면 분리 | `domain/` 은 `ui/` 를 가져오지 않는다. 반대 방향만 허용한다 |
| NFR-5.2 수치를 설정으로 | 여유 시간 · 반경 · 캐시 유지 시간의 기본값은 `domain/settings/` 에만 있다 |
| NFR-5.1 외부 접근 경계 | 이 단위에는 외부 창구가 없다. `route-planning` 이 `src/gateways/` 를 새로 만든다 |
| Q2-A 를 나중에 바꿀 여지 | `localStorage` 를 직접 부르는 곳을 `storage/localStore.ts` 한 군데로 모은다 |

`storage/localStore.ts` 를 한 군데로 모으는 것은 Q2-C 를 고르지 않았어도 해두는 편이 낫다. 저장 방식이 코드 곳곳에 흩어지지 않게 하는 것이 목적이다.

## 뒤 단위가 덧붙일 것

| 단위 | STEP 02 에서 고를 것 | 이 결정과의 관계 |
|---|---|---|
| `route-planning` | 주소↔좌표 · 길찾기 외부 서비스 · API 키 주입 방식 | 언어 · 빌드 · 테스트는 이 문서를 따른다. `src/gateways/` 를 새로 만든다 |
| `departure-alarm` | 탭이 닫혀도 오는 알림을 어떤 브라우저 기능으로 구현할지 | 같음. 브라우저 기능이라 새 의존이 늘지 않을 수 있다 |
| `meetup-midpoint` | 장소 검색 외부 서비스 | 같음. `route-planning` 과 같은 서비스일 수 있다 |

## 명령 (CONSTRUCTION 06 이 쓴다)

STEP 05 에서 실제로 만들고 여기 적은 대로 동작하는지 확인한다.

| 무엇 | 명령 |
|---|---|
| 의존 설치 | `npm install` |
| 개발 서버 | `npm run dev` — 브라우저에서 열어 확인한다 |
| 타입 검사 | `npm run typecheck` |
| 테스트 (한 번) | `npm test` — 감시 모드가 아니라 한 번 돌고 끝나야 한다 |
| 빌드 | `npm run build` |

테스트를 감시 모드로 두지 않는 이유는 CONSTRUCTION 06 이 자동으로 돌려야 하기 때문이다.

## 비밀값 (NFR-4.1)

이 단위는 외부 서비스를 부르지 않으므로 비밀값이 없다.
`route-planning` 의 STEP 02 에서 API 키를 다루게 되면, 그때 실행 환경에서 주입하는 방식을 정한다.
Vite 는 빌드할 때 값을 결과물에 박아 넣으므로, 브라우저로 내려가는 키는 감춰지지 않는다. 그 사실을 `route-planning` 에서 짚어야 한다.
