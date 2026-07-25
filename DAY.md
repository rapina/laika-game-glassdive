# PRODUCTION LOG / 2026-07-26 / 유리잠수

## 콘셉트 잠금

- 질문: 손끝으로 만든 짧은 통로가 상승하는 생물의 운명을 바꿀 수 있는가?
- 핵심 입력: 길게 누르고 드래그
- 시스템 반응과 긴장 변화: 손가락 주변 얼음이 단계적으로 녹고, 통로를 만난 물고기의 상승 속도가 빨라진다. 위로 갈수록 장애물 사이의 선택 폭이 좁아진다.
- 재료: 얼음, 물, 유리, 손끝의 열
- 시각 매체: Canvas 2D 절차 드로잉과 유체형 물방울 입자
- 대표 색: 어두운 남청색과 옅은 청록색
- 세계: 어둠 속 얼음층 아래에서 유리 물고기 세 마리가 수면을 향해 떠오른다.
- 마지막 장면: 살아남은 물고기가 수면선에서 빛으로 사라지거나, 남은 유리가 어둠 속에 멈춘다.
- 한 판 길이: 최대 90초
- 제외: 외부 게임 아트·음원, 재화, 업그레이드, 광고, 게임 규칙에 필요한 네트워크

상승하는 대상의 자동 운동과 손가락이 만드는 국소적인 길을 한 화면에 겹쳐, 긴 설명 없이 입력과 결과가 이어지도록 했다. 경로를 직접 그리는 대신 얼음의 상태를 연속적으로 감산해 통로를 만드는 데 초점을 두었다.

## 구현

- 390×844 논리 화면과 4× Canvas backing store를 사용했다.
- 20×36 얼음장, 3마리 물고기, 6개 장애물, 성공·즉시 실패·90초 종료 규칙을 구현했다.
- 실제 Pointer Events의 누르기/드래그로 얼음 투명도와 입자를 변경한다.
- 첫 포인터 입력 뒤에만 Web Audio 사인파 음을 합성한다.
- `visibilitychange`, Arcade pause/resume/mute/locale/restart 계약을 연결했다.
- 한국어·영어 HUD, 조작 안내, 결과 화면을 같은 정보 구조로 만들었다.

## 검증

- [x] 프로덕션 웹 빌드
- [x] 단위 테스트
- [x] 프로덕션 아케이드 빌드와 불변 릴리스 검증
- [x] 360×800 / 390×844 / 430×932 (standalone·portal, DPR 3)
- [x] 실제 포인터 입력 반응
- [x] 포털 CSP·필수 자산 로드
- [x] 일시정지 / 복귀 / 재시작 배선
- [x] 음소거 / 첫 입력 전 무음
- [x] 게임 자산 출처와 후가공
- [x] 한국어·영어 UI

### 실행 명령과 결과

- `npm ci` — 잠금 파일 기준 1901 packages 설치. 기존 트리 감사 결과 48 vulnerabilities(15 low, 5 moderate, 24 high, 4 critical). 새 의존성이나 버전 변경 없음. Sonatype 검사 API는 인증 토큰 부재로 실행 불가.
- `npm run build:web` — 성공, Vite 123 modules.
- `npm test` — 3 files, 21 tests 통과.
- `npm run build:arcade` — 성공. 5 immutable files, 1,541,880 bytes, JS gzip 71,938 bytes.
- `npm run viewport` — 성공. 360×800, 390×844, 430×932와 900×760에서 standalone/portal 전부 균일 비율·DPR·경계·오류 검사 통과. 한국어/영어 결과 화면 경계 통과.
- `npm run smoke` — fatal-only 성공. `sourceHash=86ea5ce1efb48b0ff7f030eb184b6e094218b28debcce8b1f2b71908ad119dfd`, `mounted=true`, `interactionVerified=true`, console/page errors 0.
- `npm run csp` — 성공. stylesheet 적용, canvas 390×844 배치, CSP 위반·누락 자산·오류 0.

## 결과

- 상태: draft
- 게임 잠금: 제작 구현과 치명 결함 검증 완료. 공개 서사 단계는 수행하지 않음.
- 알려진 비치명 문제: fatal-only 스모크는 90초 자동 완주를 요구하지 않아 `finished/resultDelivered/restartVerified`가 false다. 뷰포트 검사는 `__gameOverUiBoxes` 없이 캔버스 경계로 결과 오버레이를 판정했다. 기존 잠금 의존성 트리에 npm audit 취약점 경고가 있다.

## 런치패드 피드백

- 재사용 후보: 없음
- 게임에 남길 코드: 얼음 격자 용해, 물고기 상승·장애물 충돌, 절차 음향은 게임 전용으로 유지
- 다음 게임에서 재검증할 항목: 390px 설계를 430px DPR 3 화면으로 확대할 때 backing store 해상도
