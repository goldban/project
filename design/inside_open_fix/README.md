# 안쪽면 PSD 열기 문제 — 재저장본과 단순 호환본

## 압축 해제 없이 바로 다운로드

- [**편집용 PSD 다운로드**](https://github.com/goldban/project/raw/refs/heads/main/design/inside_open_fix/INSIDE_87-87-84_OPEN_FIX_EDITABLE.psd)
- [**단순 구조 PSD 다운로드**](https://github.com/goldban/project/raw/refs/heads/main/design/inside_open_fix/INSIDE_87-87-84_SIMPLE.psd)
- [**TIFF 대체 파일**](https://github.com/goldban/project/raw/refs/heads/main/design/inside_open_fix/INSIDE_87-87-84_OPEN_FIX.tif)

이전 ZIP 파일 대신 위 파일을 다운로드 폴더에 저장한 뒤 Photoshop의 파일 → 열기로 열어 주세요.

## 변경한 부분

사용자가 Photoshop에서 PSD 열기 오류를 보고해, 문서 구조와 텍스트 정보를 다른 PSD 작성기로 다시 저장했습니다. 오류의 근본 원인이 특정되거나 Adobe Photoshop에서 성공을 확인한 것은 아닙니다.

원본 보관용 숨김 그룹 1개를 이 간소화된 파일에서 제외했습니다. 현재 디자인용 **텍스트 레이어 25개와 스마트 오브젝트 2개**는 유지했습니다. 제외한 보관 그룹은 [이전 안쪽면 전체 ZIP](../leaflet_pair_same_folds/INSIDE_87-87-84_SAME_FOLDS.zip)에 남아 있습니다. 글자를 편집할 때는 원본에서 사용한 글꼴이 필요합니다. 텍스트 업데이트 안내가 나오면 업데이트를 선택하세요.

편집용 PSD도 열리지 않으면 단순 PSD 또는 TIFF를 사용하세요. **단순 PSD는 세 칸이 각각 이미지 레이어로 되어 있으며 글자별 편집은 할 수 없습니다.** 텍스트·스마트 오브젝트·원본 보관 그룹 등의 복잡한 부가 구조가 없는 기본 RGB/8bit/비압축 PSD입니다. TIFF도 단일 합성 이미지입니다.

전체 크기 3508 × 2480px, 가로 258mm, 세로 약 182.395mm, 칸 폭 87 / 87 / 84mm와 가이드 87·174mm는 이전 요청을 유지했습니다. 디자인이나 접지 기준을 새로 바꾸지 않았습니다. 양면 인쇄 배치에 관한 [이전 반전 확인 시안](../leaflet_pair_same_folds/mirrored_registration_check.png)은 계속 적용됩니다.

## 검증

PSD 재열기, 텍스트 수·내용, 스마트 오브젝트 내부 데이터, 가이드 유지와 기존 디자인의 불투명 픽셀 일치를 확인했습니다. 반투명 가장자리 일부에는 Canvas 처리에 따른 8비트 값 최대 2단계의 반올림 차이가 있으며 배치와 글자 내용은 유지했습니다. psd-tools·Pillow(단순 PSD)·ImageMagick에서 열기를 확인했습니다. Adobe Photoshop 자체 실행은 미검증입니다.

파일 크기 확인: 편집용 PSD 99,627,216바이트, 단순 PSD 52,199,378바이트. 다운로드 파일 크기가 크게 다르거나 HTML 파일로 저장됐다면 다운로드가 정상 완료됐는지 확인해 주세요.
