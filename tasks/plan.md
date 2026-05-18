# Plan: dsmhs-screener v1.1

## 의존성 그래프

```
lib/config.js (package.json 읽기)
    └─▶ index.cjs / index.mjs (진입점)
    └─▶ test/config.test.js (테스트 업데이트)

lib/heartbeat.js (5초 변경 — 독립)

package.json (exports/files/dependencies 업데이트)
    └─▶ index.cjs (rename from index.js)
    └─▶ index.mjs (신규)

instructor-server/ (완전 신규 — 다른 태스크에 독립)
    └─▶ server.js
    └─▶ public/index.html
```

---

## 태스크 목록

### Task 1: `lib/heartbeat.js` — 5초 간격으로 변경

**변경 파일:** `lib/heartbeat.js`

**변경 내용:**
- `intervalMs = 30000` → `intervalMs = 5000`

**검증:**
```bash
node -e "const {startHeartbeat}=require('./lib/heartbeat'); console.log('ok')"
```

---

### Task 2: `lib/config.js` — package.json 기반 설정 로드

**변경 파일:** `lib/config.js`

**변경 내용:**
- `require('dotenv')` 제거
- `process.cwd() + '/package.json'`을 읽어 `.dsmhs` 키 파싱
- `studentName`, `instructorUrl` 필수 필드 검증
- `port`는 `process.env.PORT || 3000` 유지
- 기존 반환 API(`{ enabled, instructorUrl, studentName, port }`) 완전 동일 유지

**오류 처리:**
- package.json 없음 → 경고 후 비활성화
- `dsmhs` 키 없음 → 경고 후 비활성화
- 필수 필드 누락 → 누락 필드 명시 후 비활성화

---

### Task 3: Dual CJS/ESM 진입점 + `package.json` 업데이트

**변경 파일:** `index.js` → `index.cjs` (rename), `index.mjs` (신규), `package.json`

**index.cjs** — 기존 index.js 내용 그대로 (CJS)

**index.mjs** — ESM 진입점:
```js
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
// 이하 index.cjs와 동일한 로직
```

**package.json 변경:**
```json
{
  "main": "index.cjs",
  "exports": { ".": { "require": "./index.cjs", "import": "./index.mjs" } },
  "files": ["index.cjs", "index.mjs", "lib/", "INSTRUCTOR_MANUAL.md", "README.md"],
  "dependencies": {}
}
```

**검증:**
```bash
node -e "require('.')"
node --input-type=module --eval "import '.';"
```

---

### Task 4: `test/config.test.js` 업데이트

**변경 파일:** `test/config.test.js`

**변경 내용:**
- 환경변수 기반 테스트 → package.json mock 기반으로 전면 교체
- `fs` mock 또는 `process.cwd()` override 방식으로 테스트
- 커버 케이스: `dsmhs` 키 없음, 필드 누락, 정상, trailing slash 제거, 포트 기본값

**검증:**
```bash
node --test test/config.test.js
node --test test/*.test.js
```

---

### ✅ Checkpoint 1: 전체 테스트 통과

```bash
node --test test/*.test.js
```

---

### Task 5: `instructor-server/` — Express 서버 + 대시보드

**신규 파일:**
- `instructor-server/package.json`
- `instructor-server/server.js`
- `instructor-server/public/index.html`

**server.js API:**

| Method | Path | 동작 |
|---|---|---|
| POST | `/screener/register` | 학생 등록 |
| POST | `/screener/heartbeat` | `lastSeen` 갱신 |
| GET | `/screener/students` | 학생 목록 JSON |
| GET | `/` | 대시보드 HTML 서빙 |

alive 기준: `lastSeen` 기준 10초 이내

**public/index.html:**
- 순수 HTML + CSS + JS (외부 의존성 없음)
- 5초마다 `/screener/students` fetch → 카드 업데이트
- 카드: 이름, IP:포트, 🟢/🔴 상태, 마지막 확인 시각

---

### ✅ Checkpoint 2: `.npmignore` 확인

```bash
npm pack --dry-run  # instructor-server/ 제외 확인
```

---

## 구현 순서

```
Task 1 (heartbeat 5s) → Task 2 (config) → Task 3 (CJS/ESM) → Task 4 (tests)
    → Checkpoint 1 → Task 5 (instructor-server) → Checkpoint 2
```
