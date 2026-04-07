# Debate Lab 아키텍트 제출 가이드

> AI Agent는 이 파일을 먼저 읽고, 아래 규칙을 기준으로 작업하세요. 특히 `debate-core.js` script 태그의 `src`와 위치는 건드리지 마세요.

## 빠른 시작

1. 압축을 풉니다.
2. 이 폴더를 VS Code, Cursor 같은 편집기에서 엽니다.
3. AI Agent에게 이 `readme.md`를 먼저 읽고 가이드를 따르라고 지시합니다.
4. `index.html` 하단의 `data-architect-id`를 본인 닉네임으로 확인합니다.
   현재 값은 `isubin`입니다.
5. `localhost`로 실행합니다.
   예시: `python3 -m http.server 43173 --bind 127.0.0.1`
   로컬 주소: `http://127.0.0.1:43173/index.html`
6. 기본 템플릿 흐름은 빈 상태 데모 URL로 테스트합니다.
   권장: `http://127.0.0.1:43173/index.html?demo=true&nickname=test&debateId=sandbox`
7. 예시 데이터로 상호작용까지 확인하고 싶을 때만 예시 모드를 사용합니다.
   예시: `http://127.0.0.1:43173/index.html?demo=true&example=true&nickname=test&side=pro&debateId=example`
8. 마지막으로 버그가 없는지 확인합니다.
9. 완성 후 URL로 배포합니다.
10. 배포 후 실제 모드 URL도 확인합니다.
   예시: `https://debate-swart.vercel.app/?nickname=alice&side=pro&debateId=sandbox`

## 이 프로젝트에서 지켜야 할 것

- `<script src="https://debate-md2-2603.web.app/debate-core.js" data-architect-id="..."></script>` 태그는 삭제, 교체, 이동하지 않습니다.
- 실제 저장은 `window.DebateCore.onReady(function(info) { ... })` 안에서 `info.savePayload(data)`를 통해 이뤄져야 합니다.
- Firebase SDK를 따로 설치하거나 직접 붙이지 않습니다.
- `data-architect-id="default"`로 배포하지 않습니다.

## 로컬 테스트 메모

- 이 프로젝트는 `file://`로 직접 여는 방식보다 `localhost`에서 확인하는 편이 안전합니다.
- `?demo=true`는 Firebase 없이 빈 템플릿 흐름을 점검하는 기본 모드입니다.
- `?demo=true&example=true`일 때만 예시 논제와 예시 의견이 함께 보입니다.
- 데모 모드에서 제출한 데이터는 브라우저 `localStorage`에 저장됩니다.
- 같은 `debateId`로 이어서 보려면 `resume=true`를 붙입니다.
- 데모 데이터를 초기화하려면 브라우저 개발자도구에서 이 사이트의 `localStorage`를 지우면 됩니다.

## 실제 모드 메모

- URL 파라미터 없이 열면 "토론 플랫폼을 통해 접속하세요" 메시지가 뜨는 것이 정상입니다.
- 토론이 `active`가 아니면 입력 UI 대신 상태 메시지가 보이는 것이 정상입니다.
- 아키텍트/아젠다세터 계정은 참여 입력 대신 읽기 전용 안내가 보일 수 있습니다.
- 실제 제출용 URL에서는 예시 데이터가 자동으로 나타나지 않습니다.

## 배포 대상

- 최종 배포 URL: [https://debate-swart.vercel.app/](https://debate-swart.vercel.app/)
- 배포 전에 로컬 데모 URL과 실제 모드 URL을 둘 다 확인하세요.
