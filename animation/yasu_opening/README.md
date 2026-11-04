# 용인예술과학대학교 오프닝

[10초 영상 다운로드](./YASU_Opening_10s.mp4?raw=true)

1920×1080 · 16:9 · 30fps · 10초 · H.264/AAC.
청록·분홍 패널이 움직인 뒤 로고와 용인예술과학대학교가 함께 등장합니다.
로고는 제공된 이미지를 참고한 도형 재구성이며, 배경음은 직접 합성했습니다.

![마지막 화면](./frame_210.jpg)

## 재생성

Python 3, Pillow, NumPy, FFmpeg, Noto Sans CJK 글꼴이 필요합니다.

```sh
cd animation/yasu_opening
python3 render.py
```

영상과 합성 WAV, 확인용 JPG가 현재 폴더에 생성됩니다.
완성 MP4의 전체 300프레임 디코딩, 1920×1080 해상도와 10초 길이를 확인했습니다.
