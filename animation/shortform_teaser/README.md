# 캐릭터 숏폼 모션 그래픽 시안

[영상 보기·다운로드](./character_teaser_draft.mp4?raw=true)

15초 · 9:16 · 1080×1920 · 30fps · H.264/AAC. 720×1280으로 합성 후 1080×1920으로 확대 출력합니다.

첨부 캐릭터를 바탕으로 만든 배경, 타이포 전환, 화면 확대, 직접 합성한 리듬으로 구성했습니다. 참고 영상과 그 음원은 포함하지 않았습니다. 캐릭터 자체의 관절 애니메이션은 포함하지 않습니다.

마지막 화면의 `[ 작품명 ]`, `개봉일 입력`, `YYYY.MM.DD`는 임시 표시입니다. 실제 작품명과 개봉일 확정 후 교체해야 합니다.

## 재생성

Python 3, Pillow, NumPy, FFmpeg, Noto Sans CJK Bold 폰트가 필요합니다.

```sh
cd animation/shortform_teaser
python3 render.py
```

동일 폴더에 MP4, 합성 WAV와 확인용 JPG가 생성됩니다. 출력 영상 450프레임 전체 디코딩을 확인했습니다.
