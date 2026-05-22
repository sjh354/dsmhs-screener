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

## 강사 서버 호스팅

강사 서버를 개인 서버나 클라우드에 배포하는 방법은 [`deploy/instructor` 브랜치](../../tree/deploy/instructor)의 `README.md`를 참고한다.

---

## 로컬 테스트 환경 (Docker Compose)

단일 PC에서 강사 서버 + 복수 학생을 가상으로 시뮬레이션하는 환경이다.  
실제 배포 전 heartbeat·등록·오프라인 전환 동작을 빠르게 검증할 때 사용한다.

### 사전 요구사항

- Docker Desktop (또는 Docker Engine + Compose v2)

### 실행

```bash
# 이미지 빌드 및 전체 컨테이너 시작
docker compose up --build

# 백그라운드 실행
docker compose up --build -d
```

브라우저에서 `http://localhost:4000` 접속 → 강사 대시보드 확인.

### 네트워크 구성

| 컨테이너 | IP | 역할 |
|---|---|---|
| `instructor` | `172.28.0.10` | 강사 서버 (포트 4000) |
| `student-a` | `172.28.0.11` | 학생 A |
| `student-b` | `172.28.0.12` | 학생 B |
| `student-c` | `172.28.0.13` | 학생 C |

### 주요 시나리오

```bash
# 특정 학생 컨테이너 중지 → 대시보드에서 오프라인 전환 확인 (약 10초)
docker compose stop student-a

# 재시작 → 자동 재등록 확인
docker compose start student-a

# 전체 종료
docker compose down
```

### 학생 수 변경

`docker-compose.yml`에 서비스 블록을 추가하고 고유한 IP를 할당한다:

```yaml
student-d:
  build:
    context: .
    dockerfile: docker/student.Dockerfile
  environment:
    STUDENT_NAME: student-d
    INSTRUCTOR_URL: http://instructor:4000
  depends_on:
    - instructor
  networks:
    classroom:
      ipv4_address: 172.28.0.14
```

## 라이선스

MIT
