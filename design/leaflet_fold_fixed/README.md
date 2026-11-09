# 3단 리플렛 접지 수정본

## PSD 다운로드 — Windows 일반 ZIP

[**수정 PSD 다운로드: leaflet_windows.zip**](https://github.com/goldban/project/raw/refs/heads/main/design/leaflet_fold_fixed/leaflet_windows.zip)

이 ZIP 하나만 다운로드한 뒤 Windows 파일 탐색기에서 **모두 압축 풀기**를 누르세요. 분할 파일이나 별도 압축 프로그램이 필요하지 않습니다. 파일 이름은 호환성을 위해 영문으로 저장했습니다.

- `INSIDE_84-87-87.psd`: 안쪽면 수정 디자인.
- `OUTSIDE_87-87-84.psd`: 겉면 수정 디자인.
- `inside_fold_proof.jpg`, `outside_fold_proof.jpg`: 핑크 접지선 확인용 시안.
- `READ_ME.txt`: 수정 및 인쇄 조건.

**간편 다운로드 PSD는 3개의 래스터 합성 패널로 구성되며, 원본 편집 레이어는 별도 ZIP에 보관했습니다.** 수정 디자인의 합성 화면은 이전 전체 PSD와 픽셀 단위로 동일함을 검증했습니다.

### 원본 편집 레이어 백업 — 필요할 때 별도 다운로드

아래 ZIP은 각각 독립적인 일반 ZIP입니다. 서로 합칠 필요가 없습니다. 원본 텍스트·스마트 오브젝트는 접지 보정 전 상태입니다.

- [안쪽면 원본 레이어 ZIP](https://github.com/goldban/project/raw/refs/heads/main/design/leaflet_fold_fixed/INSIDE_original_layers.zip)
- [겉면 원본 레이어 ZIP](https://github.com/goldban/project/raw/refs/heads/main/design/leaflet_fold_fixed/OUTSIDE_original_layers.zip)

기존 `leaflet_fold_fixed.z01` / `leaflet_fold_fixed.zip`은 분할 압축이며 Windows 기본 압축 해제로 열리지 않을 수 있습니다. 위의 **leaflet_windows.zip**을 이용하세요. 모든 새 ZIP의 단일 디스크 형식과 CRC 무결성을 확인했습니다. Windows 자체에서의 압축 해제 실행은 미검증입니다.

## 적용 규격

| 실제 면 | 원본 파일명 | 왼쪽부터 칸 폭 | 왼쪽 끝 기준 접지 위치 |
|---|---|---|---|
| 겉면 | 팜플렛 뒷면.psd | 87 / 87 / 84mm | 87mm, 174mm |
| 안쪽면 | 팜플렛 앞면.psd | 84 / 87 / 87mm | 84mm, 171mm |

가로 합계는 258mm입니다. 디자인을 각 칸 폭에 맞춰 조정했습니다. PSD에는 인쇄되지 않는 접지 가이드가 들어 있습니다. 핑크 선이 있는 JPG는 검토용입니다.

### 겉면 확인

![겉면 87 / 87 / 84mm](outside_fold_proof.jpg)

### 안쪽면 확인

![안쪽면 84 / 87 / 87mm](inside_fold_proof.jpg)

## 편집 및 인쇄 조건

보이는 수정 디자인은 **칸별 래스터 합성 레이어**입니다. 일반 ZIP용 PSD의 원본 편집 레이어는 별도 백업 ZIP에 보관했습니다. 기존 분할 압축용 전체 PSD에는 원본 레이어가 숨김 그룹에 있습니다. 원본 레이어는 보정 전 좌표입니다.

세로 비율과 픽셀 수는 원본을 유지했고 도련은 추가하지 않았습니다. 안쪽면 세로 약 182.395mm, 겉면 약 182.555mm로 차이가 약 0.16mm 있습니다. 겉면 원본은 약 147ppi입니다. 인쇄소의 최종 세로 크기·도련·해상도 조건을 확인한 뒤 재접수하세요. 자세한 내용은 [수정내역.txt](수정내역.txt)를 참고하세요.

PSD 재열기, 합성 이미지 일치, 보관 레이어 수와 가이드 좌표를 검증했습니다. Adobe Photoshop 자체 실행은 미검증입니다.
