# 토론 템플릿

미디어디자인 수업 토론 플랫폼의 기본 템플릿입니다.

## 시작하기

### 1. 파일 받기
이 폴더를 통째로 복사하세요.

### 2. data-architect-id 변경
`index.html`에서 본인 닉네임으로 변경하세요:

```html
<script
  src="debate-core.js 경로"
  data-architect-id="본인닉네임"
></script>
```

### 3. 배포
Netlify, Vercel 등에 배포하세요. 폴더를 그대로 드래그앤드롭하면 됩니다.

### 4. 동작 확인
배포된 URL에 `?nickname=테스트&side=pro`를 붙여서 접속해보세요.
닉네임과 찬성 뱃지가 표시되면 정상입니다.

### 5. 자유롭게 수정
`style.css`와 `app.js`를 자유롭게 수정하세요.

## 파일 구조

```
index.html   ← HTML 구조
style.css    ← 스타일 (자유 수정)
app.js       ← 토론 로직 (자유 수정)
```

## Core Script API

`window.DebateCore.onReady()` 콜백으로 다음 정보를 받습니다:

| 속성 | 타입 | 설명 |
|------|------|------|
| nickname | string \| null | 접속한 학생 닉네임 |
| side | "pro" \| "con" | 찬성/반대 |
| role | "participant" \| "architect" \| "agendasetter" | 역할 |
| status | "pending" \| "active" \| "reviewing" \| "closed" | 토론 상태 |
| savePayload(data) | function | 커스텀 데이터를 Firebase에 저장 |

## 금지 사항

- Core Script 태그를 제거하거나 src를 변경하는 행위
- URL 파라미터를 강제로 조작하는 스크립트 삽입 (부정행위)
- Core Script를 우회하여 직접 Firebase에 데이터를 전송하는 행위

## 허용 사항

- UI/UX 전반 자유 설계
- savePayload 데이터 구조 자유 설계
- 추가 라이브러리 자유 사용
- 페이지 구조 완전 변경 가능
