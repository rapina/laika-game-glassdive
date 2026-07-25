# ART — 유리잠수

## 게임 자산

- 게임 화면, 유리 물고기, 얼음 격자, 장애물, 물방울 입자는 모두 `src/game/SampleGame.ts`의 Canvas 2D 명령으로 절차 생성했다.
- 음향은 첫 포인터 입력 뒤 Web Audio Oscillator와 Gain으로 실시간 합성한다. 오디오 파일은 없다.
- 게임 제작에 외부 이미지, 영상, 3D 모델, 생성 이미지, 샘플 음원 또는 특정 작품 참고 자료를 사용하지 않았다.

## 번들 자산

- 셸 UI는 템플릿에 포함된 Galmuri 글꼴을 사용한다. 라이선스 원문은 `OFL-GALMURI.md`에 있다.
- 앱 아이콘과 파비콘은 기존 저장소 템플릿 자산이다. 게임 플레이의 필수 자산은 아니다.

## 후가공

- 별도 후가공 도구 없음. 색, 투명도, 그라디언트와 입자 이동은 런타임에서 그린다.

## 공개 제작자 일러스트

- 대표 행동: 라이카가 흰 앞발의 열로 세로 얼음판에 길을 내고, 유리 물고기 세 마리가 그 통로로 떠오른다.
- 참조: `brand/art/laika-base.png`, `laika-base-v1`, SHA-256 `820e6d43e915c4e9e32ddcd3cc14d0f2537d99f6d8d397bbd40fc416137a6712`.
- 생성: Codex 내장 `image_gen`에 베이스 PNG를 이미지 참조로 전달했다. 프롬프트는 `art/prompts/laika-glassdive.md`에 보존했다.
- 원본: `art/source/laika-glassdive.png`, 1536×1024, SHA-256 `f54391d44f334cd2286b6f200c7705abac5b979485e44a1f7499ff2ebedc486c`. 원본은 릴리스하지 않는다.
- 후가공: `sips`로 너비를 축소하고 JPEG로 변환했다. 자르기, 합성, 색 변경은 하지 않았다.

| 웹 파일 | 크기 | SHA-256 |
|---|---:|---|
| `public/art/laika-glassdive-640.jpg` | 640×426 | `320d7516ca7aee9c4b2e564753f43224c793c1b5b6a3b405b5349d40f9c28302` |
| `public/art/laika-glassdive-1280.jpg` | 1280×853 | `f5a8da893b90105434d4d5ff6de2b3e57486b5920e7573124d188a6db95ef146` |

시각 검수에서 얼굴 무늬, 뾰족 귀, 흰 가슴과 앞발, 크림색 하네스와 주황 연결구를 확인했다. 뻗은 앞발은 개의 발 형태이며 사람 손, 여분의 발, 생성 문자가 없다. 모바일 크롭에서도 얼굴, 하네스, 얼음을 녹이는 앞발과 유리 물고기가 함께 읽힌다. 세부 기록은 `art/provenance/laika-glassdive.json`에 남겼다.
