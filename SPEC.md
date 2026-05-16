# SPEC: dsmhs-screener

## 1. Objective

Node.js 풀스택 웹 서비스 개발 강의에서 사용하는 npm 패키지.  
학생이 `require('dsmhs-screener')`를 코드에 포함시키면, 학생의 서버가 강사 서버에 자동으로 등록되고 주기적으로 heartbeat를 전송한다.  
강사는 별도 서버에서 등록된 모든 학생 서버로 API 테스트 요청을 일괄 발송하여 구현 여부를 확인한다.

**대상 사용자**:
- 학생: 패키지를 설치하고 진입점(`app.js`)에서 `require`하는 것만 하면 됨
- 강사: 별도 서버 + 메뉴얼 참고하여 학생들 API 점검

---

## 2. 시스템 구성

```
[학생 서버 A] ──┐
[학생 서버 B] ──┼──(heartbeat/register)──▶ [강사 서버]
[학생 서버 C] ──┘                                │
                                                 │ (test requests, 1초 retry)
                                        ◀────────┘
                             각 학생 서버로 API 요청 발송
```

---

## 3. 패키지 범위

이 저장소(`dsmhs-screener`)는 **학생용 npm 패키지**만 포함한다.  
강사 서버는 별도 리포지터리로 분리.

---

## 4. 학생용 패키지 스펙 (`dsmhs-screener`)

### 4-1. 설치 및 사용법

```bash
npm install dsmhs-screener
```

학생 `app.js` 진입점 최상단에 추가:

```js
require('dsmhs-screener');
// ... 나머지 서버 코드
```

### 4-2. 환경변수 설정 (`.env`)

| 변수명 | 필수 | 설명 | 예시 |
|---|---|---|---|
| `DSMHS_INSTRUCTOR_URL` | ✅ | 강사 서버 주소 | `http://192.168.1.100:4000` |
| `DSMHS_STUDENT_NAME` | ✅ | 학생 이름 또는 학번 | `홍길동` 또는 `20231234` |
| `DSMHS_PORT` | ❌ | 학생 서버 포트 (미설정 시 `process.env.PORT` 또는 `3000`) | `3000` |

### 4-3. 동작 흐름

1. `require` 시점에 환경변수 읽기
2. 강사 서버로 **등록 요청** (POST `/screener/register`)
   ```json
   { "name": "홍길동", "port": 3000, "ip": "<자동감지>" }
   ```
3. 성공 시 콘솔에 `[dsmhs-screener] ✓ 강사 서버에 등록되었습니다. (홍길동)` 출력
4. 실패 시 1초 후 재시도 (최대 10회), 계속 실패해도 학생 서버 동작에는 영향 없음
5. 이후 **30초마다 heartbeat** (POST `/screener/heartbeat`) 전송
6. nodemon 재시작 시 → 재등록 자동 처리

### 4-4. 오류 처리 원칙

- 강사 서버 미응답 → 조용히 재시도, 학생 서버 크래시 방지
- 환경변수 누락 → 경고 메시지 출력 후 패키지 기능 비활성화 (서버는 정상 동작)
- 모든 네트워크 오류를 try-catch로 감싸 학생 코드에 영향 없음

---

## 5. 강사 서버 API 규격 (강사 서버 구현 시 따라야 할 인터페이스)

| Method | Path | 설명 |
|---|---|---|
| POST | `/screener/register` | 학생 서버 등록 |
| POST | `/screener/heartbeat` | heartbeat 수신 |

**POST `/screener/register` body:**
```json
{
  "name": "string",
  "ip": "string",
  "port": number,
  "timestamp": "ISO8601"
}
```

**POST `/screener/heartbeat` body:**
```json
{
  "name": "string",
  "timestamp": "ISO8601"
}
```

---

## 6. 테스트 설정 파일 규격 (강사 서버용)

강사 서버에서 사용하는 `tests.json` 형식 (패키지에 문서화 포함):

```json
{
  "tests": [
    {
      "id": "test-01",
      "name": "GET /api/users 엔드포인트 확인",
      "method": "GET",
      "path": "/api/users",
      "expectedStatus": 200,
      "expectedBodyContains": ["id", "name"]
    },
    {
      "id": "test-02",
      "name": "POST /api/users 생성 확인",
      "method": "POST",
      "path": "/api/users",
      "body": { "name": "테스트" },
      "expectedStatus": 201
    }
  ]
}
```

---

## 7. 프로젝트 구조

```
dsmhs-screener/
├── package.json
├── index.js              # 패키지 진입점 (require 시 자동 실행)
├── lib/
│   ├── config.js         # 환경변수 로드 및 검증
│   ├── register.js       # 강사 서버 등록 로직
│   └── heartbeat.js      # heartbeat 스케줄러
├── INSTRUCTOR_MANUAL.md  # 강사용 메뉴얼
└── SPEC.md
```

---

## 8. 코드 스타일

- **Runtime**: Node.js 18+ (LTS), CommonJS (`require`)
- **의존성 최소화**: `node-fetch` 또는 Node.js 내장 `https` 모듈만 사용
- **외부 의존성**: `dotenv` (환경변수 로드)
- 주석: 한국어 가능, 학생들이 코드를 열어봤을 때 이해할 수 있는 수준
- 테스트: 불필요 (패키지 자체는 단순 클라이언트)

---

## 9. npm 패키지 배포 스펙

```json
{
  "name": "dsmhs-screener",
  "version": "1.0.0",
  "main": "index.js",
  "description": "DSMHS Node.js 강의용 API 점검 패키지",
  "keywords": ["dsmhs", "screener", "education"],
  "license": "MIT"
}
```

- npm public 배포 (npmjs.com)
- `files` 필드로 불필요한 파일 제외

---

## 10. 강사용 메뉴얼 (`INSTRUCTOR_MANUAL.md`) 포함 내용

1. 강사 서버 설치/실행 방법 (별도 리포 링크 또는 최소 구현 예시)
2. 학생 등록 확인 방법
3. `tests.json` 작성법
4. 테스트 실행 방법 및 결과 해석
5. 자주 묻는 질문 (FAQ)

---

## 11. 범위 외 (Boundaries)

- ❌ 강사 서버 구현체 (별도 리포)
- ❌ 웹 대시보드 UI
- ❌ 인증/보안 (강의 내부 네트워크 전제)
- ❌ 학생 코드 수정 요구 (require 한 줄 추가 외)
