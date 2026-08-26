# route-planning · STEP 02 비기능 요구 — 계획

> 산출물: `aidlc-docs/construction/route-planning/nfr-requirements/`
> — `nfr-requirements.md` · `tech-stack-decisions.md`
> 근거: `functional-design/` 네 문서 · `schedule-core/nfr-requirements/tech-stack-decisions.md`

## 이 단계가 고르는 것

`unit-of-work.md` 가 이 단위의 STEP 02 에 배정한 것은 둘이다.

| 고를 것 | 왜 여기서 |
|---|---|
| 주소↔좌표와 길찾기를 제공하는 외부 서비스 | C-7 지도 창구가 무엇에 닿을지 |
| API 키를 실행 환경에서 주입하는 방식 | NFR-4.1 · 비밀값을 소스에 넣지 않는다 |

언어 · 프레임워크 · 빌드 · 테스트 도구는 **`schedule-core` 의 결정을 그대로 따른다.**
TypeScript + React · Vite · Vitest · Tailwind CSS. 다시 고르지 않는다.

## 이 단위가 져야 하는 비기능 요구

| NFR | 이 단위에서 무엇이 되나 |
|---|---|
| NFR-1.1 동선 3초 | RBR-45 — 일정 10개 기준 |
| NFR-1.3 캐시로 외부 호출 줄이기 | RBR-28 · RBR-30 · RBR-46 |
| NFR-2.1 고정 일정 시각 불가침 | RBR-2 · RBR-17 |
| NFR-2.3 로컬 타임존 · 자정 넘김 | RBR-14 |
| NFR-3.1 외부 없이 단위 테스트 | C-2 가 이동 시간을 인자로 받는다 |
| NFR-3.2 경계 상황 | `business-logic-model.md` 의 22가지 |
| NFR-4.1 비밀값을 소스에서 뺀다 | RBR-33 — 이 단위에서 처음 생긴다 |
| NFR-5.1 외부 접근 경계 분리 | C-7 이 유일한 창구 |
| NFR-5.2 수치를 설정으로 | 캐시 유지 시간 · 좌표 자릿수 · 하루 시작 시각 |

## 미리 확인한 것과 확인하지 못한 것

외부 서비스를 고르기 전에 찾아봤다. **확정하지 못한 것을 밝혀 둔다.**

| 확인된 것 | 근거 |
|---|---|
| 카카오모빌리티는 자전거 · 도보 길찾기와 지오코딩을 **제휴를 통해** 제공한다고 안내한다 | [Kakaomobility Developers](https://developers.kakaomobility.com/) |
| TMAP 은 보행자 경로안내 API 문서를 공개하고 있다 | [TMAP 보행자 경로안내](https://tmap-skopenapi.readme.io/reference/보행자-경로안내) |
| Google Routes API 는 **기능이 지역에 따라 다르다**고 안내한다 | [Google Routes API 문서](https://developers.google.com/maps/documentation/routes/compute_route_directions?hl=ko) |
| 카카오맵이 2026년에 신규 API 4종을 추가하고 이용 절차를 개선했다 | [카카오 devtalk 공지](https://devtalk.kakao.com/t/api-4/150764) |

*내용은 라이선스 준수를 위해 바꾸어 적었다.*

| 확인하지 못한 것 |
|---|
| 각 서비스가 지금 **대중교통 이동 시간**을 API 로 주는지, 무료 한도가 얼마인지 |
| 카카오 신규 API 4종에 대중교통 길찾기가 들어 있는지 |
| ODsay 의 현재 무료 한도 |

**이동 수단 세 가지(도보 · 대중교통 · 자동차)를 모두 다뤄야 하는데(FR-1.5), 국내에서 대중교통
이동 시간을 주는 API 는 자동차 · 도보보다 선택이 좁다.** 이것이 Q1 의 답을 가르는 지점이다.

## 무엇을 할지

- [x] `tech-stack-decisions.md` — 고른 서비스와 왜 골랐는지. 확인하지 못한 것을 함께 남긴다
- [x] API 키를 실행 환경에서 주입하는 방식을 적는다 (NFR-4.1)
- [x] **Vite 가 빌드에 값을 박아 넣는 문제**를 어떻게 다룰지 적는다
- [x] `nfr-requirements.md` — 이 단위가 지는 NFR 을 확인 가능한 문장으로
- [x] C-7 창구의 경계면을 적는다 — 서비스를 갈아끼울 때 고칠 지점 (NFR-5.1)
- [x] 테스트에서 외부를 무엇으로 대신할지 적는다 (NFR-3.1)
- [x] 폴더 짜임을 적는다 — `src/gateways/` 를 새로 만든다

## 무엇을 하지 않나

- 언어 · 프레임워크 · 빌드 · 테스트 도구를 다시 고르지 않는다 — `schedule-core` 를 따른다
- 장소 검색 서비스를 고르지 않는다 — `meetup-midpoint` 의 STEP 02
- 알림 방식을 고르지 않는다 — `departure-alarm` 의 STEP 02
- 업무 규칙을 고치지 않는다 — STEP 01 에서 확정했다
- 코드를 만들지 않는다 — STEP 05

---

## 확인 질문

> 한 질문에 하나만 고른다. 답을 `[Answer]:` 뒤에 적고 저장하면 이어서 문서 두 개를 만든다.

## Q1. 외부 서비스를 어떻게 쓸까

이동 수단 세 가지를 다 다뤄야 하는데, 국내 대중교통 이동 시간 API 는 선택이 좁습니다.
아래 선택지의 서비스 이름은 후보이고, 실제 제공 범위와 한도는 신청 단계에서 확인해야 합니다.

- A) **대역(가짜 창구)으로 먼저 만든다** — 좌표와 이동 시간을 직선거리와 평균 속도로 계산하는 창구를 만들어 C-2 를 완성한다. 실제 서비스는 창구만 갈아끼워 나중에 붙인다. API 키가 없어도 진행된다
- B) **카카오 계열로 간다** — 주소↔좌표와 장소 검색은 카카오, 길찾기도 카카오. 대중교통을 못 받으면 자동차 시간에 배수를 곱해 어림한다
- C) **둘을 섞는다** — 주소↔좌표는 한 서비스, 대중교통 길찾기는 대중교통 전문 서비스. 정확하지만 신청과 관리가 둘이다
- D) **Google Maps Platform 하나로 간다** — 대중교통을 포함해 한 곳에서. 다만 한국에서 기능 제한이 있을 수 있다
- E) Other (please describe after [Answer]: tag below)

[Answer]:B

## Q2. API 키를 어떻게 다루나

Vite 는 빌드할 때 환경변수 값을 결과물에 박아 넣습니다. **브라우저로 내려가는 키는 감춰지지 않습니다.**
서버가 없으므로(Q3-A · Q4-A) 키를 대신 들고 있을 곳도 없습니다.

- A) `.env.local` 에 두고 빌드에 박히는 것을 감수한다 — 내 컴퓨터에서만 실행하므로(Q3-A) 밖으로 나가지 않는다. `.gitignore` 로 저장소에 올라가지 않게 한다
- B) 서비스 쪽에서 도메인 · 출처 제한을 걸 수 있는 키만 쓴다 — 키가 노출돼도 다른 곳에서 못 쓴다
- C) 키가 필요 없는 창구부터 만들고, 키가 필요한 것은 나중에 붙인다
- D) Other (please describe after [Answer]: tag below)

[Answer]:A

## Q3. 대중교통 이동 시간을 못 얻을 때 어떻게 하나

- A) 자동차 이동 시간에 정해진 배수를 곱해 어림한다 (배수는 설정에). 어림값임을 화면에 표시한다
- B) 직선거리에 대중교통 평균 속도를 곱해 어림한다 (속도는 설정에). 어림값임을 표시한다
- C) 대중교통을 고른 일정은 이동 시간을 `알 수 없음` 으로 두고 동선에서 뺀다
- D) Other (please describe after [Answer]: tag below)

[Answer]:B

## Q4. 외부 호출이 실패했을 때 다시 시도하나

- A) 다시 시도하지 않는다 — 바로 캐시의 옛 값으로 넘어간다 (RBR-31). 빠르다
- B) 짧게 한 번 다시 시도하고, 그래도 실패하면 옛 값으로 넘어간다
- C) 간격을 늘려가며 몇 번 다시 시도한다 (횟수는 설정에)
- D) Other (please describe after [Answer]: tag below)

[Answer]:B

## Q5. 테스트에서 외부를 무엇으로 대신하나

- A) 창구 인터페이스를 손으로 만든 대역으로 갈아끼운다 — 외부 호출 코드 자체는 테스트하지 않는다
- B) 네트워크 요청을 가로채는 도구를 붙여 응답을 흉내낸다 — 외부 호출 코드까지 테스트한다
- C) A 를 기본으로 하고, 응답을 해석하는 부분만 저장해 둔 응답 예시로 따로 테스트한다
- D) Other (please describe after [Answer]: tag below)

[Answer]:C
