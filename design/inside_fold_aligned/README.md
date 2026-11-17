# 안쪽면 — 최신 첨부 이미지의 핑크 접지선에 맞춘 수정본

- [**안쪽면 PSD 다운로드 — 이미지형**](https://github.com/goldban/project/raw/refs/heads/main/design/inside_fold_aligned/INSIDE_FOLD_ALIGNED_FLAT.psd)
- [**완성 TIFF 다운로드**](https://github.com/goldban/project/raw/refs/heads/main/design/inside_fold_aligned/INSIDE_FOLD_ALIGNED.tif)
- [**접지선 확인용 시안**](https://github.com/goldban/project/blob/main/design/inside_fold_aligned/fold_proof.jpg)
- [**식순 글자 편집용 Photoshop 생성 패키지**](https://github.com/goldban/project/raw/refs/heads/main/design/inside_fold_aligned/Editable_Fold_Aligned_Package.zip)

![핑크 접지선 확인용](fold_proof.jpg)

## 이번 적용 기준

이전에는 사용자 선택에 따라 양면 모두 87·174mm를 사용했습니다. 이번 새 첨부 이미지의 핑크선은 가로 258mm 기준 약 **84mm·171mm** 위치이므로, 최신 요청인 **첨부 핑크선 기준**을 우선해 안쪽면을 수정했습니다.

- 전체: 3508 × 2480px, 약 258 × 182.395mm.
- 안쪽면: 왼쪽부터 **84 / 87 / 87mm**.
- 접지 가이드: 왼쪽 끝에서 **84mm, 171mm**.
- 겉면 87 / 87 / 84mm와 좌우 반전하여 대응하는 안쪽 배치입니다.
- 겉면 파일은 이번에 수정하지 않았습니다.

## 배치 수정

회색의 기존 칸 경계와 핑크 접지선이 어긋나 있던 부분을 정리했습니다. 가운데·오른쪽의 제목·본문·포스터를 새 칸으로 옮기고, 접지선과 인접한 본문 블록을 더 안쪽으로 배치했습니다. 본문 캐시 이미지 18개는 각 칸의 접지선과 좌우 끝에서 최소 42px(약 3.09mm) 떨어지도록 확인했습니다. 포스터도 같은 기준으로 배치했습니다. 장식용 실은 접지선을 넘는 배경 요소로 남아 있습니다.

정리했던 식순의 글꼴·크기·행간은 유지하면서, 좁아진 칸의 중심에 맞게 식순 전체를 20px 왼쪽으로 이동했습니다. 가운데·오른쪽 내용은 기존 레이어의 캐시 이미지를 그대로 옮겼으므로 문구와 글자·포스터의 비율을 다시 늘리거나 줄이지 않았습니다. 배경은 새 칸 경계에 맞춰 분할 배치했으며 기존 회색 접지선 픽셀은 제외했습니다.

핑크 선은 확인용 JPG에만 있습니다. 완성 TIFF에는 인쇄될 접지선을 넣지 않았고, PSD에는 인쇄되지 않는 가이드 좌표를 넣었습니다. 실제 가이드 색상은 Photoshop 사용자 설정을 따릅니다.

## 열기와 편집

Photoshop 편집용 PSD 오류가 반복되었던 점을 고려해 완성 PSD는 텍스트·스마트 오브젝트·효과가 없는 **기본 RGB 단일 이미지 PSD**입니다. 완성 PSD와 TIFF는 글자별 편집이 불가능합니다.

식순의 글자를 편집하려면 전체 패키지를 압축 해제하고, 제공된 Regular·Bold 글꼴을 설치한 뒤 Photoshop에서 파일 → 스크립트 → 찾아보기로 `Build_Editable_Schedule.jsx`를 실행하세요. Photoshop 자체 기능으로 식순의 22개 텍스트 요소와 네 구분선 레이어를 만듭니다. 다른 두 칸은 이미지 배경입니다. 생성 스크립트의 접지 가이드도 84·171mm로 변경했습니다.

`INSIDE_BASE_NO_SCHEDULE.tif`는 스크립트용 빈 식순 배경이며 최종 인쇄용 파일이 아닙니다. 최종 완성 이미지는 `INSIDE_FOLD_ALIGNED.tif`입니다.

## 검증

PSD와 TIFF를 다시 열어 완성 이미지 일치를 확인했고, PSD의 접지 좌표가 84·171mm에 파일 형식의 소수점 정밀도 범위 내에서 맞는지 확인했습니다. 본문 안전 여백, 식순 글자 영역과 JSX 문법도 검사했습니다. ImageMagick에서도 PSD를 열었습니다. **Adobe Photoshop 자체 실행은 미검증**입니다. 도련은 추가하지 않았으며 최종 재단·도련 요구는 인쇄소 기준을 확인하세요.

![선 없는 완성 미리보기](preview.jpg)
