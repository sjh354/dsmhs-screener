import 'dsmhs-screener';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

const ok = (res, data) => res.json({ success: true, data });
const fail = (res, message) => res.json({ success: false, message });

const memos = [
  { author: 'alex', content: '우유 사오기' },
  { author: 'jina', content: '저녁 약속 장소 확인' },
];

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});
app.use(express.static('public'));

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/hello', (req, res) => res.send('Hello, routing!'));

app.get('/hello/:name', (req, res) => {
  res.send(`안녕하세요, ${req.params.name}님`);
});

app.get('/time', (req, res) => res.json({ time: new Date().toISOString() }));

app.get('/random', (req, res) => {
  const n = Math.floor(Math.random() * 100) + 1;
  res.send(`랜덤 숫자: ${n}`);
});

app.get('/memos', (req, res) => {
  res.json({ success: true, data: memos });
});

app.get('/memos/:index', (req, res) => {
  const idx = Number(req.params.index);
  if (!Number.isInteger(idx) || idx < 0 || idx >= memos.length) {
    return fail(res, 'invalid index');
  }
  return ok(res, memos[idx]);
});

app.listen(PORT, () => {
  console.log('Server is running on ' + PORT);
});
