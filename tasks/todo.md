# TODO: dsmhs-screener

## Phase 1 — 패키지 기반

- [x] **Task 1**: `package.json` 초기화 (name, version, main, dependencies, files, engines)
- [x] **Task 2**: `lib/config.js` — 환경변수 로드 및 검증

> **CP-1**: ✅ config.js 동작 확인

## Phase 2 — 핵심 로직

- [x] **Task 3**: `lib/register.js` — 강사 서버 등록 (재시도 포함)
- [x] **Task 4**: `lib/heartbeat.js` — 30초 heartbeat 스케줄러

> **CP-2**: ✅ register + heartbeat 동작 확인

## Phase 3 — 통합

- [x] **Task 5**: `index.js` — 진입점, 전체 흐름 조합

> **CP-3**: ✅ `require('.')` 단일 명령으로 전체 흐름 동작 확인

## Phase 4 — 문서 및 배포

- [x] **Task 6**: `INSTRUCTOR_MANUAL.md` — 강사용 완전 가이드
- [x] **Task 7**: `README.md`, `.npmignore`, 배포 준비

> **CP-4**: `npm pack --dry-run` 확인 및 메뉴얼 최종 검토
