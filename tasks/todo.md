# TODO: dsmhs-screener v1.1

## Phase 1 — 핵심 변경

- [ ] **Task 1**: `lib/heartbeat.js` — interval 30s → 5s
- [ ] **Task 2**: `lib/config.js` — .env 제거, package.json `"dsmhs"` 키 기반으로 전환
- [ ] **Task 3**: Dual CJS/ESM — `index.cjs` + `index.mjs` + `package.json` exports 업데이트
- [ ] **Task 4**: `test/config.test.js` — package.json mock 기반 테스트로 교체

> **CP-1**: `node --test test/*.test.js` 전체 통과

## Phase 2 — 강사 서버

- [ ] **Task 5**: `instructor-server/` — Express 서버 + 대시보드 HTML

> **CP-2**: `npm pack --dry-run` — instructor-server/ 제외 확인
