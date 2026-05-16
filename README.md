# dsmhs-screener

DSMHS Node.js 강의용 API 점검 패키지.  
학생이 `require('dsmhs-screener')`를 코드에 추가하면 강사 서버에 자동으로 등록되고 30초마다 heartbeat를 전송한다.

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

## 환경변수 설정 (`.env`)

프로젝트 루트에 `.env` 파일 생성:

```
DSMHS_INSTRUCTOR_URL=http://192.168.1.100:4000
DSMHS_STUDENT_NAME=홍길동
```

| 변수명 | 필수 | 설명 | 예시 |
|---|---|---|---|
| `DSMHS_INSTRUCTOR_URL` | ✅ | 강사 서버 주소 | `http://192.168.1.100:4000` |
| `DSMHS_STUDENT_NAME` | ✅ | 학생 이름 또는 학번 | `홍길동` 또는 `20231234` |
| `DSMHS_PORT` | ❌ | 학생 서버 포트 (기본값: `PORT` 환경변수 또는 `3000`) | `3000` |

## 동작

1. `require` 시 환경변수를 읽어 강사 서버에 등록 요청 전송
2. 등록 실패 시 1초 간격으로 최대 10회 재시도
3. 등록 성공 후 30초마다 heartbeat 전송
4. 강사 서버 장애가 학생 서버에 영향을 주지 않음

## 강사용 정보

`INSTRUCTOR_MANUAL.md` 참고.

## 라이선스

MIT
