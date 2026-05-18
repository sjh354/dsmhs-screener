# SPEC: dsmhs-screener v1.1

## 변경 요약 (v1.0 → v1.1)

| # | 변경 내용 |
|---|---|
| 1 | Dual CJS/ESM 지원 (`exports` 조건부 내보내기) |
| 2 | 학생 설정을 `.env` → 학생 `package.json`의 `"dsmhs"` 키로 이동 |
| 3 | heartbeat 간격 30초 → 5초 |
| 4 | 강사 서버 최소 구현체 (`instructor-server/`) 추가 |

---

## 1. Objective

Node.js 풀스택 웹 서비스 개발 강의에서 사용하는 npm 패키지.  
학생이 `require('dsmhs-screener')`(CJS) 또는 `import 'dsmhs-screener'`(ESM)를 코드에 포함시키면,  
학생의 서버가 강사 서버에 자동으로 등록되고 5초마다 heartbeat를 전송한다.

**대상 사용자**:
- 학생: 패키지 설치 + `package.json`에 이름/서버주소 입력 + 진입점에 `require` 한 줄 추가
- 강사: `instructor-server/`를 실행하여 대시보드로 학생들 접속 현황 확인

---

## 2. 시스템 구성

```
[학생 서버 A] ──┐
[학생 서버 B] ──┼──(register / heartbeat 5s)──▶ [강사 서버 :4000]
[학생 서버 C] ──┘                                       │
                                               브라우저 대시보드
```

---

## 3. 프로젝트 구조

```
dsmhs-screener/
├── package.json           # exports 조건부 내보내기 포함
├── index.cjs              # CJS 진입점 (require)
├── index.mjs              # ESM 진입점 (import)
├── lib/
│   ├── config.js          # package.json에서 설정 로드
│   ├── register.js        # 강사 서버 등록 로직
│   ├── heartbeat.js       # 5초 heartbeat 스케줄러
│   └── http.js            # HTTP 유틸리티
├── instructor-server/     # 강사용 서버 (npm publish 제외)
│   ├── package.json
│   ├── server.js          # Express API 서버
│   └── public/
│       └── index.html     # 학생 현황 대시보드
├── INSTRUCTOR_MANUAL.md
├── README.md
└── SPEC.md
```

---

## 4. 변경 상세

### 4-1. Dual CJS/ESM 지원

**package.json 변경:**
```json
{
  "main": "index.cjs",
  "exports": {
    ".": {
      "require": "./index.cjs",
      "import": "./index.mjs"
    }
  },
  "files": [
    "index.cjs",
    "index.mjs",
    "lib/",
    "INSTRUCTOR_MANUAL.md",
    "README.md"
  ]
}
```

- `index.cjs`: 기존 `index.js` 내용 그대로 (`require`/`module.exports`)
- `index.mjs`: 동일 로직을 ESM `import`/`export` 문법으로 작성
- `lib/` 내부 파일은 CJS 유지 (index.mjs에서 `createRequire`로 호출)

### 4-2. 학생 설정을 package.json으로 이동

학생 `package.json`에 추가:
```json
{
  "dsmhs": {
    "studentName": "홍길동",
    "instructorUrl": "http://192.168.1.100:4000"
  }
}
```

- `config.js`가 `process.cwd() + '/package.json'`을 읽어 `dsmhs` 키 파싱
- `dotenv` 의존성 제거 (`package.json`의 `dependencies`에서 삭제)
- 포트는 `process.env.PORT || 3000` 유지 (별도 설정 불필요)
- 설정 누락 시 경고 출력 후 기능 비활성화 (기존과 동일)

**오류 처리:**
- `package.json` 파일 없음 → 경고 후 비활성화
- `dsmhs` 키 없음 → 경고 후 비활성화
- `studentName` 또는 `instructorUrl` 누락 → 누락된 필드 명시 후 비활성화

### 4-3. heartbeat 간격 5초

```js
// heartbeat.js
function startHeartbeat(config, intervalMs = 5000) { ... }
```

### 4-4. 강사 서버 (`instructor-server/`)

**server.js 스펙:**

| Method | Path | 설명 |
|---|---|---|
| POST | `/screener/register` | 학생 등록 수신 |
| POST | `/screener/heartbeat` | heartbeat 수신, `lastSeen` 갱신 |
| GET | `/screener/students` | 등록 학생 목록 JSON |
| GET | `/` | 대시보드 HTML 서빙 |

학생 상태 판단: `lastSeen`이 **10초** 이내면 alive (heartbeat 5초 기준 여유 2배)

**public/index.html 대시보드:**
- 자동 새로고침 (5초)
- 학생별 카드: 이름, IP:포트, 접속 상태 (🟢 alive / 🔴 offline), 마지막 확인 시각
- 외부 의존성 없음 (순수 HTML + CSS + fetch API)
- `/screener/students` 엔드포인트를 JS로 폴링

**instructor-server/package.json:**
```json
{
  "name": "dsmhs-instructor-server",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "express": "^4.18.0"
  }
}
```

---

## 5. 코드 스타일

- `lib/` 내부: CommonJS (`'use strict'`, `require`, `module.exports`)
- `index.mjs`: ESM (`import`, `export`) — `createRequire`로 lib 파일 호출
- `instructor-server/`: CommonJS (Express 관례)
- 주석: 한국어, 학생이 읽어도 이해할 수 있는 수준

---

## 6. 테스트 전략

- 기존 테스트 파일(`test/`) 유지, config 관련 테스트 업데이트
- CJS: `require('dsmhs-screener')` 동작 확인
- ESM: `import 'dsmhs-screener'` 동작 확인 (`node --input-type=module`)

---

## 7. npm 배포 범위

- **포함**: `index.cjs`, `index.mjs`, `lib/`, `README.md`, `INSTRUCTOR_MANUAL.md`
- **제외**: `instructor-server/`, `test/`, `SPEC.md`, `.claude/`, `CLAUDE.md`

---

## 8. 범위 외 (Boundaries)

- ❌ 인증/보안 (강의 내부 네트워크 전제)
- ❌ 데이터 영속성 (강사 서버 메모리 저장만)
- ❌ 학생 코드 수정 요구 (require/import 한 줄 추가 외)
- ❌ `.env` 파일 지원 (v1.1부터 제거)
