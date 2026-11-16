# Photoshop 프로그램 오류 대응 — TIFF와 Photoshop 자체 문서 생성

이전 `INSIDE_FONT_MATCH_EDITABLE.psd`를 Photoshop에서 열지 못했다는 사용자 보고를 확인했습니다. 복잡한 외부 생성 PSD가 정상적으로 열린다고 더 이상 안내하지 않습니다. 오류의 정확한 원인은 아직 특정하지 못했습니다.

## 우선 바로 열어 볼 파일

- [**완성 디자인 TIFF 다운로드**](https://github.com/goldban/project/raw/refs/heads/main/design/inside_titles_font_match/INSIDE_FONT_MATCH.tif)
- [**단순 PSD 다운로드**](https://github.com/goldban/project/raw/refs/heads/main/design/inside_titles_font_match/INSIDE_FONT_MATCH_SIMPLE.psd)

위 두 파일은 완성된 디자인을 이미지로 담고 있어 글자별 수정은 할 수 없습니다. 단순 PSD는 텍스트·스마트 오브젝트·레이어 효과 기록이 없는 세 칸 이미지 레이어 구성입니다. 완성 TIFF는 일반 RGB 이미지입니다. 글자별 편집이 필요하면 아래 경로를 사용하세요.

## Photoshop 자체 기능으로 편집 가능한 문서 만들기

[**네이티브 생성 패키지 다운로드 — 일반 ZIP**](https://github.com/goldban/project/raw/refs/heads/main/design/inside_native_builder/Inside_Native_Builder.zip)

1. ZIP을 다운로드 폴더에 저장하고, 별도 일반 폴더에 모두 압축 풀기를 합니다.
2. 들어 있는 `NotoSerifCJKkr-Bold.otf`를 설치한 뒤 Photoshop을 다시 실행합니다.
3. Photoshop의 **파일 → 스크립트 → 찾아보기**에서 `Build_Inside_In_Photoshop.jsx`를 선택합니다.
4. 스크립트가 일반 TIFF 배경을 열고, Photoshop 자체 기능으로 세 제목과 흰 획 효과를 생성합니다. 저장 창에서 새 PSD 이름을 지정하세요.

JSX와 `INSIDE_BASE_NO_LIST.tif`는 같은 폴더에 있어야 합니다. 배경 TIFF에는 기존 목록 글자를 지워 뒀기 때문에, 스크립트를 실행하기 전에는 목록이 비어 보이는 것이 정상입니다. 이 배경 파일 자체를 최종 인쇄물로 사용하지 마세요.

목록 문구는 다음과 같습니다.

- 사자놀이 : 속초, 70년을 춤추다 (두 줄)
- 안녕
- 숨으로 빚다

스크립트 생성본에서는 이 세 목록만 텍스트 레이어입니다. 나머지 원고는 TIFF 배경에 합쳐져 있습니다. 원본의 다른 글자까지 모두 편집 가능한 문서라고 안내하지 않습니다. 흰 획 효과 생성이 Photoshop 버전 차이로 실패하면 글자는 생성하고 안내를 띄웁니다. 이때 세 텍스트 레이어에 레이어 스타일 → 획 → 바깥쪽 2px 흰색을 직접 적용하세요.

규격 3508 × 2480px, 가로 258mm, 세로 약 182.395mm, 가이드 87·174mm는 유지합니다. 기존 [양면 반전 확인](../leaflet_pair_same_folds/mirrored_registration_check.png)의 인쇄 배치 주의사항도 유지됩니다.

## 검증 범위

JSX 문법을 확인했고 TIFF를 독립적으로 열어 모드·크기·해상도를 확인했습니다. 패키지는 일반 ZIP이며 CRC 무결성을 검사했습니다. 실제 Adobe Photoshop에서 스크립트를 실행하거나 파일 열기 성공을 확인한 것은 아닙니다. 따라서 네이티브 생성 경로도 Photoshop 자체 실행은 미검증입니다.
