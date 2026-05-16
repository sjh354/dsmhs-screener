# DSMHS Screener — 강사용 운영 메뉴얼

## 1. 시스템 구성

```
[학생 서버 A] ──┐
[학생 서버 B] ──┼──(register / heartbeat)──▶ [강사 서버 :4000]
[학생 서버 C] ──┘                                     │
                                                      │ (API 테스트 요청 일괄 발송)
                                             ◀────────┘
```

학생은 `.env` 설정 후 `require('dsmhs-screener')`를 앱 최상단에 추가하기만 하면 된다.  
강사 서버는 학생들의 등록을 수신하고, 원할 때 API 테스트를 일괄 발송한다.

---

## 2. 강사 서버 설치 및 실행

### 최소 구현 (Express.js)

아래 코드를 그대로 복사하여 `instructor-server.js`로 저장한다.

```js
const express = require('express');
const app = express();
app.use(express.json());

// 등록된 학생 목록 (메모리 저장)
const students = {};

// 학생 서버 등록 수신
app.post('/screener/register', (req, res) => {
  const { name, ip, port, timestamp } = req.body;
  students[name] = { ip, port, timestamp, lastSeen: new Date() };
  console.log(`[등록] ${name} — ${ip}:${port}`);
  res.sendStatus(200);
});

// heartbeat 수신
app.post('/screener/heartbeat', (req, res) => {
  const { name, timestamp } = req.body;
  if (students[name]) {
    students[name].lastSeen = new Date();
  }
  res.sendStatus(200);
});

// 등록된 학생 목록 조회 (강사용)
app.get('/screener/students', (req, res) => {
  res.json(students);
});

app.listen(4000, () => {
  console.log('강사 서버 실행 중: http://0.0.0.0:4000');
});
```

```bash
npm install express
node instructor-server.js
```

---

## 3. 학생 등록 확인

강사 서버가 실행 중이면 다음 명령으로 등록된 학생 목록을 확인한다:

```bash
curl http://localhost:4000/screener/students
```

또는 브라우저에서 `http://<강사PC IP>:4000/screener/students` 접속.

응답 예시:
```json
{
  "홍길동": { "ip": "192.168.1.12", "port": 3000, "lastSeen": "2024-01-01T09:05:00.000Z" },
  "김철수": { "ip": "192.168.1.15", "port": 3000, "lastSeen": "2024-01-01T09:04:30.000Z" }
}
```

`lastSeen`이 30초 이상 갱신되지 않으면 학생 서버가 꺼진 것이다.

---

## 4. `tests.json` 작성 가이드

강사 서버에서 학생 서버에 발송할 테스트를 정의하는 파일이다.

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

### 필드 설명

| 필드 | 필수 | 설명 |
|---|---|---|
| `id` | ✅ | 테스트 고유 ID |
| `name` | ✅ | 테스트 이름 (결과 출력용) |
| `method` | ✅ | HTTP 메서드 (GET, POST, PUT, DELETE) |
| `path` | ✅ | 요청 경로 (예: `/api/users`) |
| `body` | ❌ | 요청 body (POST/PUT 시 사용) |
| `expectedStatus` | ✅ | 기대 HTTP 상태 코드 |
| `expectedBodyContains` | ❌ | 응답 body에 포함되어야 할 문자열 배열 |

---

## 5. 테스트 실행 방법

강사 서버에 다음 엔드포인트를 추가하고 호출한다:

```js
const fs = require('fs');
const http = require('http');

app.post('/screener/run-tests', async (req, res) => {
  const { tests } = JSON.parse(fs.readFileSync('tests.json', 'utf-8'));
  const results = {};

  for (const [name, { ip, port }] of Object.entries(students)) {
    results[name] = [];
    for (const test of tests) {
      try {
        const result = await runTest(ip, port, test);
        results[name].push(result);
      } catch (e) {
        results[name].push({ id: test.id, name: test.name, pass: false, error: e.message });
      }
    }
  }

  res.json(results);
});

async function runTest(ip, port, test) {
  // HTTP 요청 발송 후 expectedStatus, expectedBodyContains 검증
  // (실제 구현은 node-fetch 또는 내장 http 모듈 사용)
}
```

테스트 실행:
```bash
curl -X POST http://localhost:4000/screener/run-tests
```

---

## 6. FAQ

**Q. 학생이 등록되지 않아요.**
- 학생 `.env`에 `DSMHS_INSTRUCTOR_URL`이 강사 PC의 실제 IP로 설정되어 있는지 확인 (`localhost` 사용 금지).
- 방화벽에서 포트 4000이 열려 있는지 확인.
- 강사 서버가 `0.0.0.0`으로 바인딩되어 있는지 확인 (`localhost`가 아닌).

**Q. IP가 127.0.0.1로 등록되어요.**
- 학생 PC가 네트워크 인터페이스가 없거나 루프백만 있는 환경이다.
- 학생이 Wi-Fi나 유선 네트워크에 연결되어 있는지 확인한다.

**Q. 강사 서버가 꺼진 후 다시 켜면 학생들이 재등록되나요?**
- nodemon으로 실행 중인 학생 서버는 재시작 시 자동 재등록된다.
- 그렇지 않은 경우 학생이 서버를 수동으로 재시작하거나 30초 heartbeat를 기다린다. 단, heartbeat는 register가 아니므로 강사 서버는 register 없는 heartbeat도 수용하도록 구현해야 한다.

**Q. 학생 서버가 크래시 없이 실행되는데 등록 실패 메시지가 뜨나요?**
- 정상 동작이다. 패키지는 강사 서버와 무관하게 학생 서버 동작에 영향을 주지 않는다.
