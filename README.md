# dsmhs-screener

DSMHS Node.js 강의용 API 점검 패키지.  
학생이 `require('dsmhs-screener')`를 코드에 추가하면 강사 서버에 자동으로 등록되고 5초마다 heartbeat를 전송한다.

## 설치

```bash
npm install dsmhs-screener
```

## 사용법

`app.js` (또는 서버 진입점) 최상단에 한 줄 추가:

```js
require('dsmhs-screener');

// ... 나머지 서버 코드
const express = require('express');
// ...
```

ESM 환경:

```js
import 'dsmhs-screener';
```

## 설정 (`package.json`)

`package.json`에 `"dsmhs"` 키를 추가한다:

```json
{
  "name": "my-app",
  "dsmhs": {
    "studentName": "홍길동",
    "instructorUrl": "http://192.168.1.100:4000"
  }
}
```

| 키 | 필수 | 설명 | 예시 |
|---|---|---|---|
| `studentName` | ✅ | 학생 이름 또는 학번 | `"홍길동"` 또는 `"20231234"` |
| `instructorUrl` | ✅ | 강사 서버 주소 | `"http://192.168.1.100:4000"` |

서버 포트는 `PORT` 환경변수 (없으면 `3000`)를 자동으로 읽는다.

## 동작

1. `require` 시 `package.json`의 `dsmhs` 설정을 읽어 강사 서버에 등록 요청 전송
2. 등록 실패 시 1초 간격으로 최대 10회 재시도
3. 등록 성공 후 5초마다 heartbeat 전송
4. 강사 서버 장애가 학생 서버에 영향을 주지 않음

## 강사용 정보

`INSTRUCTOR_MANUAL.md` 참고.

## 라이선스

MIT
