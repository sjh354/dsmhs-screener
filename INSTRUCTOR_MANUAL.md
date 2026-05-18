# DSMHS Screener — 강사용 운영 메뉴얼

## 1. 시스템 구성

```
[학생 서버 A] ──┐
[학생 서버 B] ──┼──(register / heartbeat)──▶ [강사 서버 :4000]
[학생 서버 C] ──┘                                     │
                                              브라우저 대시보드
```

학생은 `package.json`에 `"dsmhs"` 설정 추가 후 `require('dsmhs-screener')`를 앱 최상단에 추가하기만 하면 된다.  
강사 서버는 학생들의 등록과 heartbeat를 수신하고, 실시간 대시보드에서 접속 상태를 확인한다.

---

## 2. 강사 서버 설치 및 실행

이 레포지터리의 `instructor-server/` 디렉터리를 사용한다.

```bash
cd instructor-server
npm install
npm start
```

서버가 시작되면 브라우저에서 `http://localhost:4000` 접속 → 학생 대시보드 확인.

포트를 변경하려면:

```bash
PORT=5000 npm start
```

---

## 3. 학생 등록 확인

### 대시보드 (권장)

브라우저에서 `http://<강사PC IP>:4000` 접속.  
5초마다 자동 갱신되며 각 학생의 이름, IP:포트, 온라인 상태, 마지막 응답 시각을 표시한다.

### API 직접 조회

```bash
curl http://localhost:4000/screener/students
```

응답 예시:
```json
[
  {
    "name": "홍길동",
    "ip": "192.168.1.12",
    "port": 3000,
    "alive": true,
    "lastSeenIso": "2024-01-01T09:05:00.000Z"
  },
  {
    "name": "김철수",
    "ip": "192.168.1.15",
    "port": 3000,
    "alive": false,
    "lastSeenIso": "2024-01-01T09:04:30.000Z"
  }
]
```

`alive: false` — 마지막 heartbeat로부터 10초 이상 경과. 학생 서버가 꺼진 것으로 판단.

---

## 4. 학생 설정 안내

학생 프로젝트의 `package.json`에 `"dsmhs"` 키를 추가해야 한다:

```json
{
  "name": "my-app",
  "dsmhs": {
    "studentName": "홍길동",
    "instructorUrl": "http://192.168.1.100:4000"
  }
}
```

- `instructorUrl`에 강사 PC의 실제 IP를 사용한다 (`localhost` 사용 금지).
- 학생 서버 포트는 `PORT` 환경변수에서 자동으로 읽는다.

---

## 5. FAQ

**Q. 학생이 등록되지 않아요.**
- 학생 `package.json`의 `instructorUrl`이 강사 PC의 실제 IP로 설정되어 있는지 확인 (`localhost` 사용 금지).
- 방화벽에서 포트 4000이 열려 있는지 확인.
- 강사 서버가 `0.0.0.0`으로 바인딩되어 있는지 확인.

**Q. IP가 127.0.0.1로 등록되어요.**
- 학생 PC가 네트워크 인터페이스가 없거나 루프백만 있는 환경이다.
- 학생이 Wi-Fi나 유선 네트워크에 연결되어 있는지 확인한다.

**Q. 강사 서버가 꺼진 후 다시 켜면 학생들이 재등록되나요?**
- heartbeat 수신 시 등록 정보가 없으면 자동으로 재등록된다 (포트 정보 없이).
- 정확한 포트 정보가 필요하면 학생이 서버를 재시작해야 한다.

**Q. 학생 서버가 실행 중인데 등록 실패 메시지가 뜨나요?**
- 정상 동작이다. 패키지는 강사 서버와 무관하게 학생 서버 동작에 영향을 주지 않는다.
