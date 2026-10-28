# 레퍼런스 모션 v3 — After Effects 편집용 JSX 포함

[편집용 전체 ZIP](./Reference_Motion_v3_Package.zip?raw=true) · [JSX 파일](./Build_Reference_Motion_v3.jsx?raw=true) · [미리보기 영상](./character_reference_v3.mp4?raw=true)

v2에서 누락된 **After Effects용 JavaScript(ExtendScript, `.jsx`)**를 추가했습니다. 제공된 `12.mp4` 레퍼런스를 참고해 상반신을 더 크게 잡고, 카메라 이동·기울기·줌 변화와 전경 대각선 그래픽을 강화했습니다. 무음, 1920×1080, 30fps, 10초 반복 구성입니다.

## AE에서 수정하기

1. **전체 ZIP을 풀어 주세요.** JSX만 받으면 필요한 이미지·영상이 없어 실행되지 않습니다.
2. `Build_Reference_Motion_v3.jsx`와 `assets` 폴더를 같은 위치에 둡니다.
3. After Effects의 **파일 → 스크립트 → 스크립트 파일 실행**에서 JSX를 실행합니다.
4. 새 `REFERENCE_V3_10s_…` 컴포지션에서 `CONTROLS` 레이어의 효과 컨트롤을 수정합니다.
5. **다른 이름으로 저장**으로 `.aep`를 저장하고, `assets` 폴더도 함께 보관합니다.

| 컨트롤 | 기본값 | 수정 내용 |
| --- | ---: | --- |
| Camera travel | 65 | 좌우 이동 폭, 0~100px |
| Camera tilt | 2.8 | 카메라 기울기, 0~4도 |
| Camera zoom | 238 | 캐릭터 확대율, 100~350% |
| Zoom pulse | 8.5 | 부드러운 줌 변화량, 0~15 |
| Body playback speed | 1 | 몸·머리카락 영상 재생 속도, 0.1~2배 |
| Graphics opacity | 70 | 전경 그래픽 불투명도, 0~100% |

`FOREGROUND_RIBBON`, `TEAL_MARK`, `BACKGROUND_STRIPE`는 AE 기본 셰이프 레이어이므로 색상·경로를 직접 수정할 수 있습니다. 위치·회전·스케일에 직접 키프레임을 넣으려면 해당 속성의 표현식을 먼저 끄세요. `BACKGROUND` 레이어를 끄면 배경 이미지를 숨길 수 있습니다. 그래픽도 숨기고 캐릭터만 출력하려면 해당 셰이프 레이어도 끄세요.

## 편집 가능한 범위와 제한

카메라·배경·전경 그래픽은 AE에서 편집할 수 있습니다. **몸과 머리카락의 세부 메쉬 변형은 투명 `assets/character_motion.mov`에 렌더링되어 있습니다.** 이 부분은 JSX의 관절 제어점이나 독립 머리카락 슬라이더로 편집할 수 없습니다. 해당 동작을 바꾸려면 아래 Python 제작 스크립트를 수정해 다시 렌더링해야 합니다.

`CHARACTER_SOURCE` 컴포지션에는 원본 PNG 레이어도 비활성 상태로 들어 있습니다. 몸 영상 레이어를 끄고 원본 레이어를 켜면 정지 원화로 교체해 직접 작업할 수 있습니다. 첨부 PSD 원본은 배포하지 않으며, 실행에 필요한 합성 PNG만 포함합니다.

레퍼런스의 팔 뻗기·입 모양·시선 변화는 재현하지 않았습니다. 원본 그림의 자세와 가장자리 픽셀은 유지됩니다. 개별 파츠 리깅이나 Live2D 모델은 아닙니다.

미리보기 MP4는 Python 렌더링입니다. JSX는 같은 카메라 설정과 몸 영상을 사용하되, 그래픽을 AE 기본 레이어로 다시 구성하므로 MP4와 픽셀 단위로 동일하지 않습니다. 외부 플러그인은 필요하지 않습니다.

## 파일과 재현

```text
Build_Reference_Motion_v3.jsx
assets/character_motion.mov  # 투명 ProRes 4444, 960×720, 10초
assets/character.png         # 원본 캐릭터 합성 PNG
assets/background.png
character_reference_v3.mp4
render_reference_motion.py
validate_video.py
validation.json
```

Python 3, Pillow, NumPy, SciPy, FFmpeg/FFprobe가 설치된 환경에서 이 폴더를 작업 경로로 사용합니다.

```sh
python3 render_reference_motion.py --source assets/character.png --output .
python3 validate_video.py
```

JSX 문법, 모의 AE 구성·표현식 실행, 누락 파일 사전 검사와 생성 실패 시 정리를 검사했습니다. **실제 After Effects 실행·렌더링은 미검증입니다.** 영상과 투명 MOV의 전체 디코딩·프레임 수·투명도 검사 결과는 `validation.json`에 기록합니다. 레퍼런스 원본과 음원은 포함하지 않습니다.
