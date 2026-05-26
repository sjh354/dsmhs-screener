# dsmhs 강사 서버

DSMHS 강의용 강사 모니터링 서버.  
학생들의 API 엔드포인트 자가진단 결과를 수집하고 대시보드로 표시한다.

## 사전 요구사항

- Node.js 18 이상
- nginx (리버스프록시)
- certbot (HTTPS, 선택)

---

## 배포

### 1. 저장소 클론

```bash
git clone -b deploy/instructor <repo-url> dsmhs-instructor
cd dsmhs-instructor
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 서버 실행

```bash
node server.js
```

기본 포트는 `4000`. 변경하려면:

```bash
PORT=8080 node server.js
```

---

## nginx 설정

```bash
# nginx.conf를 sites-available에 복사 (도메인 교체 필요)
sudo cp nginx.conf /etc/nginx/sites-available/dsmhs
sudo ln -s /etc/nginx/sites-available/dsmhs /etc/nginx/sites-enabled/

# 설정 테스트 및 적용
sudo nginx -t
sudo systemctl reload nginx
```

### HTTPS 인증서 발급 (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d dsmhs.yourdomain.com
```

---

## 업데이트

```bash
git pull origin deploy/instructor
npm install
# 서버 재시작
```

---

## 접속 확인

| 주소 | 설명 |
|------|------|
| `https://dsmhs.yourdomain.com` | 강사 대시보드 (암호: `2026spring`) |
| `https://dsmhs.yourdomain.com/screener/students` | 학생 목록 API |
| `https://dsmhs.yourdomain.com/screener/config` | 수업 설정 조회/업로드 API |

---

## 대시보드 기능

### 암호 보호

대시보드 첫 접속 시 암호 입력 화면이 표시된다. 암호: **`2026spring`**  
세션 중 한 번만 입력하면 되며 탭을 닫으면 초기화된다.

### 수업 설정 (학생 명단 + 엔드포인트)

수업 시작 전 JSON 파일을 업로드해 학생 명단과 테스트할 엔드포인트를 한 번에 설정한다.

**설정 파일 형식** (`example-config.json` 참고):

```json
{
  "students": ["홍길동", "이지은", "박민수"],
  "endpoints": [
    { "method": "GET", "path": "/health" },
    { "method": "GET", "path": "/memos" },
    { "method": "POST", "path": "/memos", "body": {"title":"test","content":"test"} }
  ]
}
```

- **설정 업로드**: 헤더의 "설정 업로드" 버튼 → JSON 파일 선택
- **설정 다운로드**: 헤더의 "설정 다운로드" 버튼 → 현재 설정을 JSON으로 저장

> **주의**: 설정은 서버 메모리에만 저장된다. 서버 재시작 시 재업로드 필요.

### 학생 상태 표시

| 배지 | 의미 |
|------|------|
| 🟢 | 온라인 (heartbeat 정상) |
| 🔴 | 오프라인 (접속했다 끊김) |
| ⬜ | 미접속 (명단에 있지만 아직 한 번도 연결 안 됨) |

---

## 학생 설정 안내

학생들의 `package.json`에 아래 내용을 추가하도록 안내한다:

```json
{
  "dsmhs": {
    "studentName": "홍길동",
    "instructorUrl": "https://dsmhs.yourdomain.com"
  }
}
```

서버 진입점 최상단에 한 줄 추가:

```js
// CJS
require('dsmhs-screener');

// ESM
import 'dsmhs-screener';
```
