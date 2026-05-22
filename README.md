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
| `https://dsmhs.yourdomain.com` | 강사 대시보드 |
| `https://dsmhs.yourdomain.com/screener/students` | 학생 목록 API |
| `https://dsmhs.yourdomain.com/screener/endpoints` | 엔드포인트 목록 API |

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
