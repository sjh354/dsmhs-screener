# Implementation Plan: dsmhs-screener

## Overview

학생용 npm 패키지 `dsmhs-screener`와 강사용 메뉴얼을 제작한다.  
패키지는 `require` 한 줄로 활성화되며, 강사 서버에 자동 등록 + heartbeat를 전송한다.

---

## Dependency Graph

```
Task 1: package.json 초기화
    │
    ▼
Task 2: lib/config.js  (환경변수 로드)
    │
    ├──▶ Task 3: lib/register.js  (등록 로직)
    │         │
    │         ▼
    │    Task 4: lib/heartbeat.js  (heartbeat 스케줄러)
    │         │
    │         ▼
    └──▶ Task 5: index.js  (진입점 — config + register + heartbeat 조합)
              │
              ▼
         Task 6: INSTRUCTOR_MANUAL.md  (강사 메뉴얼, 독립 작성 가능)
              │
              ▼
         Task 7: npm 배포 준비 (.npmignore, README, 최종 점검)
```

---

## Tasks

### Task 1 — package.json 초기화

**목표**: 패키지 메타데이터 및 의존성 설정

**작업**:
- `npm init -y` 후 필드 수정
- `name`, `version`, `main`, `description`, `keywords`, `license` 설정
- `dependencies`: `dotenv`
- `engines`: `{ "node": ">=18" }`
- `files`: `["index.js", "lib/", "INSTRUCTOR_MANUAL.md", "README.md"]`

**검증**: `node -e "require('./package.json')"` 오류 없음

---

### Task 2 — lib/config.js

**목표**: 환경변수 로드 및 검증

**작업**:
- `dotenv`로 `.env` 로드
- `DSMHS_INSTRUCTOR_URL`, `DSMHS_STUDENT_NAME` 필수 확인
- `DSMHS_PORT` 없으면 `process.env.PORT || 3000`
- 누락 시 경고 메시지 출력 후 `enabled: false` 반환
- 정상 시 `{ enabled: true, instructorUrl, studentName, port }` 반환

**검증**:
- 환경변수 없이 실행 → 경고 출력, `enabled: false`
- 환경변수 설정 후 실행 → `enabled: true`, 올바른 값 반환

---

### Task 3 — lib/register.js

**목표**: 강사 서버에 학생 서버 등록

**작업**:
- Node.js 내장 `http`/`https` 모듈로 POST 요청 (외부 의존성 없음)
- 요청 body: `{ name, ip, port, timestamp }`
- IP 자동 감지: `os.networkInterfaces()`로 로컬 네트워크 IP 추출
- 실패 시 1초 후 재시도, 최대 10회
- 성공 시 `[dsmhs-screener] ✓ 강사 서버에 등록되었습니다. (이름)` 출력
- 10회 모두 실패 시 `[dsmhs-screener] ✗ 강사 서버에 연결할 수 없습니다. 수동으로 확인하세요.` 출력

**검증**:
- 강사 서버 없는 상태에서 실행 → 10회 재시도 후 경고, 프로세스 크래시 없음
- 강사 서버 mock 실행 후 → 등록 성공 메시지 출력

---

### Task 4 — lib/heartbeat.js

**목표**: 30초마다 heartbeat 전송

**작업**:
- `setInterval(30000)`으로 반복
- 요청 body: `{ name, timestamp }`
- 실패해도 콘솔 경고 없음 (조용히 재시도)
- `startHeartbeat(config)` 함수 export
- `process.on('exit')`에서 인터벌 정리

**검증**:
- 함수 호출 후 30초 내 두 번 이상 전송 확인 (간격 단축 테스트)
- 강사 서버 다운 상태에서 프로세스 크래시 없음

---

### Task 5 — index.js (진입점)

**목표**: `require('dsmhs-screener')` 시 자동 실행

**작업**:
- `config.js` → `register.js` → `heartbeat.js` 순서로 호출
- `config.enabled === false`이면 즉시 종료 (아무것도 하지 않음)
- 모든 로직을 비동기(async IIFE)로 감싸 `require` 자체는 블로킹하지 않음
- `process.on('uncaughtException')`으로 최후 방어선 확보

**검증**:
- `node -e "require('.')"` 실행 시 환경변수 없으면 경고 후 정상 종료
- 환경변수 설정 + mock 서버 실행 → 등록 성공 메시지 확인

---

### Task 6 — INSTRUCTOR_MANUAL.md

**목표**: 강사가 혼자 셋업하고 운영할 수 있는 완전한 가이드

**포함 내용**:
1. 시스템 구성 개요 (다이어그램)
2. 강사 서버 최소 구현 예시 (Express.js 코드 포함)
3. `tests.json` 작성 가이드 및 예시
4. 학생 등록 확인 방법
5. 테스트 실행 방법 (curl 또는 강사 서버 API 호출)
6. FAQ (학생 등록 안 됨, IP 감지 오류 등)

**검증**: 문서만으로 강사 서버를 5분 안에 셋업 가능한지 리뷰

---

### Task 7 — 배포 준비

**목표**: npmjs.com 배포 가능 상태

**작업**:
- `README.md` 작성 (설치, 사용법, 환경변수 표)
- `.npmignore` 작성 (SPEC.md, tasks/, .env 제외)
- `npm pack`으로 패키지 내용 확인
- 버전 `1.0.0` 확인

**검증**:
- `npm pack --dry-run` → 포함 파일 목록이 의도한 것과 일치
- `npm publish --dry-run` 오류 없음

---

## Checkpoints

| 체크포인트 | 조건 |
|---|---|
| CP-1 (Tasks 1-2 후) | config.js가 환경변수를 올바르게 로드/검증하는 것 확인 |
| CP-2 (Tasks 3-4 후) | mock 서버로 register + heartbeat 동작 확인 |
| CP-3 (Task 5 후) | `require('.')` 한 줄로 전체 흐름 동작 확인 |
| CP-4 (Tasks 6-7 후) | `npm pack` 결과 및 메뉴얼 최종 검토 |

---

## 구현 순서 (수직 슬라이스)

```
Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6 → Task 7
```

Task 6 (메뉴얼)은 Task 5 이후 독립적으로 작성 가능.
