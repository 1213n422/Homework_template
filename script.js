'use strict';
/* =====================================================================
   noodle doodle — 면을 만지며 할 일을 정리하고, 먹어서 성취를 남기는 메모
   · 모든 기능은 메인 그래픽(원·그릇·면·젓가락·양념)을 직접 만져서 쓴다
   · 다섯 가지 터치만: 터치 · 위로 스와이프(먹기) · 옆으로 스와이프(자르기) · 두 손가락 집기 · 양념 끌어놓기
   · 면의 모양이 할 일의 성격 (굵기=중요도, 길이=걸리는 시간, 색=양념(카테고리))
   · 오늘의 목표를 채우면 숫자가 "완뚝"으로 바뀌고 라멘 건더기 컨페티가 터진다
   ===================================================================== */

/* ---------- 1. 설정 ---------- */
const PULL = 120;                 // 이만큼 당기고 놓으면 후루룩(완료)
const CUT = 30;                   // 면 위에서 옆으로 이만큼 스와이프하면 잘린다
const HANG = 22;                  // 면이 젓가락 위로 이만큼 넘어가 걸린다
const SPACING = 58;               // 면 사이 간격
const MAXCAT = 6;                 // 양념(카테고리) 최대 개수
const GOALS = [3, 5, 8];          // 기록 시트에서 고르는 하루 목표
// 색은 미색 종이 · 남색 · 주황 포인트 · 분홍. 모양은 윤곽선 없이 납작하게
const PAPER = '#fff4ee', CREAM = '#fffaf6', NAVY = '#2b3592', RED = '#f05a22', PINK = '#f8c8d0';
const PALETTE = ['#f05a22', '#f5b82e', '#5aa67a', '#f4a6b7', '#2b3592', '#79a4e8'];
const FONT = '"Pretendard Variable",Pretendard,-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif';
const NUM = FONT;
const CANVAS_TEXT = 'noodle doodle후루룩!한입에잘렸다완뚝오늘의면을터치해서첫뽑아요싹비웠다좋아요다익혔다지난여기서…0123456789/';

// 면 종류 = 모양(굵기·물결). 양념을 안 바르면 종류 고유의 색
const TYPES = {
  somen: { name: '소면',   w: 20, amp: 3,   freq: .06, color: '#eddcb2' },
  ramen: { name: '라면',   w: 24, amp: 6,   freq: .1,  color: '#e5c98c' },
  kal:   { name: '칼국수', w: 30, amp: 3.5, freq: .05, color: '#efe0bd' },
  udon:  { name: '우동',   w: 36, amp: 2.5, freq: .035, color: '#dfc48f' }
};
const SIZES = [{ name: '짧게', len: 130 }, { name: '보통', len: 200 }, { name: '길게', len: 270 }];

/* ---------- 2. 데이터 ---------- */
const $ = s => document.querySelector(s);
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pad = n => String(n).padStart(2, '0');
const ymd = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const seed = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7) >>> 0;

// jit/ph/wj/tj: 면마다 길이·물결·굵기가 조금씩 다르게 보이는 랜덤 값
const mk = (title, memo, type, size, cat = null, age = 0) => ({
  id: Date.now() + Math.floor(Math.random() * 1e6), title, memo, type, size, cat, done: null, at: 0,
  born: Date.now() - age * 864e5, jit: rnd(-25, 25), ph: rnd(0, 6.28), wj: rnd(.8, 1.3), tj: rnd(.85, 1.2)
});
const baseCats = () => [{ id: 'school', name: '학교', color: PALETTE[0] }, { id: 'daily', name: '일상', color: PALETTE[1] }, { id: 'appt', name: '약속', color: PALETTE[2] }];
const SAMPLES = [['기획안 검토', 'udon', 1, 'school'], ['우유 사기', 'ramen', 0, 'daily'], ['친구 만나기', 'kal', 2, 'appt'], ['답장하기', 'somen', 0, null], ['운동', 'ramen', 1, 'daily'], ['빨래', 'somen', 0, 'daily']];
const sample = i => { const s = SAMPLES[i % SAMPLES.length]; return mk(s[0], '', s[1], s[2], s[3]); };

const KEY = 'noodle-doodle-v9';
let tour = null;                   // 따라 해보기 중이면 연습용 그릇이 따로 쓰이고, 저장은 하지 않는다
let db = JSON.parse(localStorage.getItem(KEY) || 'null') || {
  goal: 5, reached: {}, cats: baseCats(),
  noodles: []
};
db.cats.forEach((c, i) => { if (!PALETTE.includes(c.color)) c.color = PALETTE[i % PALETTE.length]; });   // 예전 색은 새 팔레트로
const save = () => { if (!tour) localStorage.setItem(KEY, JSON.stringify(db)); };
const active = () => db.noodles.filter(n => !n.done);
const doneToday = () => db.noodles.filter(n => n.done === ymd());
const catOf = n => db.cats.find(c => c.id === n.cat);
const col = n => (catOf(n) || TYPES[n.type]).color;
function streak() {                // 연속 완뚝 일수
  let c = 0, d = new Date();
  if (!db.reached[ymd(d)]) d.setDate(d.getDate() - 1);
  while (db.reached[ymd(d)]) { c++; d.setDate(d.getDate() - 1); }
  return c;
}

// 저장하지 않는 화면용 상태(위치·당긴 거리·튕김 등)
const rt = new WeakMap();
const R = n => rt.get(n) || (rt.set(n, { x: null, rise: 0, pull: 0, pv: 0, hold: false, sx: 0, sv: 0, st: 0, tv: 0, drag: false, cued: false, a: 1, sel: false, pts: [], w: 10, top: 0 }), rt.get(n));
const pops = new Map();            // 양념이 튀어나온 시각
let flash = 0;

/* ---------- 3. 화면 크기와 배경 ---------- */
const app = $('#app'), cv = $('#stage'), ctx = cv.getContext('2d');
let W, H, dpr, t = 0, scrollX = 0, scrollV = 0, sunPop = 0, G = {};
let bgCv, grain;
const L = {};                      // 계산된 레이아웃

function layout() {
  W = app.clientWidth; H = app.clientHeight; dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = W * dpr; cv.height = H * dpr;
  L.chopY = H * .44;
  
  L.rimY = H * .71; L.rimRx = W * .44; L.rimRy = Math.max(16, H * .03); L.bh = H * .17;
  L.counter = L.rimY + L.bh * 1.02;                                   // 그릇이 놓인 카운터의 윗면
  const pr = document.createElement('div'); pr.style.cssText = 'position:fixed;top:0;padding-top:env(safe-area-inset-top);visibility:hidden'; document.body.appendChild(pr); L.st = pr.offsetHeight; pr.remove();
  L.k = clamp((L.rimY - L.chopY - 30) / 290, .5, 1.1);   // 화면이 작으면 면 길이도 줄인다
  makeSprites();
}

function makeSprites() {
  bgCv = document.createElement('canvas'); bgCv.width = W * dpr; bgCv.height = H * dpr;
  const b = bgCv.getContext('2d'); b.scale(dpr, dpr);
  b.fillStyle = PAPER; b.fillRect(0, 0, W, H);
  b.fillStyle = NAVY; b.globalAlpha = .07; b.textBaseline = 'alphabetic'; b.textAlign = 'left';       // 배경에 깔린 큰 로고
  const ls = Math.min((W - 96) / 3.4, 110); b.font = `900 ${ls}px ${FONT}`;
  b.fillText('noodle', 14, H * .17 + ls); b.fillText('doodle', 14, H * .17 + ls * 1.85); b.globalAlpha = 1;

  // 종이 같은 고운 알갱이
  const n = document.createElement('canvas'); n.width = n.height = 160;
  const nc = n.getContext('2d'), img = nc.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) {
    img.data[i] = img.data[i + 1] = img.data[i + 2] = 255 - Math.pow(Math.random(), 3) * 90; img.data[i + 3] = 255;
  }
  nc.putImageData(img, 0, 0); grain = ctx.createPattern(n, 'repeat');
}

/* ---------- 4. 면의 몸 (모양 계산 + 그리기) ---------- */
const back = x => { x = clamp(x, 0, 1); return 1 + 2.7 * Math.pow(x - 1, 3) + 1.7 * Math.pow(x - 1, 2); };   // 톡 튀어나오는 이징
const nlen = n => (SIZES[n.size].len + n.jit) * L.k;
const ageGrow = n => Math.min(.6, (Date.now() - n.born) / 864e5 * .1);     // 미룰수록 면이 불어서 굵어진다

// 한 가닥의 점 목록. 물결 + 늘어남 + 끝의 움직임
function geom(n, r) {
  const T = TYPES[n.type], len = nlen(n), stretch = Math.max(0, r.st), pull = Math.max(0, r.pull);
  const tension = pull + stretch * .6, L2 = len + r.st + HANG, pts = [];
  r.w = T.w * n.tj * (1 + ageGrow(n)) * (1 - Math.min(.35, (pull + stretch) / 600));    // 당기면 가늘어진다
  r.top = L.chopY - HANG - r.pull + (1 - back(r.rise)) * (L.rimY - L.chopY);                  // rise: 그릇에서 솟아오르는 등장
  for (let yy = 0; yy <= L2; yy += 5) {
    const s = yy / L2, k = clamp(yy / 30, 0, 1);
    const x = r.x + T.amp * n.wj * Math.max(.25, 1 - tension / 220) * Math.sin(yy * T.freq * n.wj + n.ph + t * 1.6) * k + r.sx * s * s;
    pts.push([x, r.top + yy]);
  }
  r.pts = pts; return pts;
}

function drawNoodle(n, r, alpha, glow) {   // 윤곽선 없이 납작한 색 한 줄
  const p = geom(n, r), w = r.w, c = col(n);
  if (r.rise <= 0) return;
  const path = () => { ctx.beginPath(); p.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); };
  ctx.save(); ctx.globalAlpha = alpha; ctx.lineCap = ctx.lineJoin = 'round';
  if (r.rise < 1) { ctx.beginPath(); ctx.rect(0, 0, W, L.rimY); ctx.clip(); }          // 그릇 안에서 끌려 올라오는 것처럼
  if (glow) { path(); ctx.strokeStyle = NAVY; ctx.lineWidth = w + 8; ctx.stroke(); }  // 잡힌 면은 남색 테두리
  path(); ctx.strokeStyle = c; ctx.lineWidth = w; ctx.stroke();
  ctx.restore();
}

function label(n, r, alpha) {      // 제목은 면 안에 세로로. 밝은 면엔 남색, 어두운 면엔 크림색 글자
  if (db.titles === false || r.rise < .6 || !r.pts.length) return;
  const S0 = HANG + 18, sp = 15, room = Math.floor((r.pts.length * 5 - S0 - 14) / sp), cs = [...n.title];
  const chars = cs.length > room ? [...cs.slice(0, Math.max(1, room - 1)), '…'] : cs;
  const c = parseInt(col(n).slice(1), 16), lum = .299 * (c >> 16) + .587 * ((c >> 8) & 255) + .114 * (c & 255);
  ctx.save(); ctx.globalAlpha = alpha; ctx.font = `800 13px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = lum < 150 ? CREAM : NAVY;
  chars.forEach((ch, i) => { const j = Math.round((S0 + i * sp) / 5); if (j < r.pts.length - 1) ctx.fillText(ch, r.pts[j][0], r.pts[j][1]); });
  ctx.restore();
}

function drawChops() {             // 남색 젓가락 두 개, 왼쪽 끝이 가늘다
  ctx.save(); ctx.fillStyle = NAVY;
  [[L.chopY - 7, 3, L.chopY - 5, 9], [L.chopY + 8, 3, L.chopY + 9, 10]].forEach(([y0, w0, y1, w1]) => {
    ctx.beginPath(); ctx.moveTo(-10, y0 - w0 / 2); ctx.lineTo(W + 10, y1 - w1 / 2); ctx.lineTo(W + 10, y1 + w1 / 2); ctx.lineTo(-10, y0 + w0 / 2); ctx.closePath(); ctx.fill();
  });
  ctx.restore();
}

function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function pill(s, x, y, o) {        // 작은 안내 라벨: 문구는 전부 이 모양 하나로
  ctx.save(); ctx.font = o.font; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  const px = o.px == null ? 12 : o.px, h = o.h || 26, w = ctx.measureText(s).width + px * 2, l = x - w / 2;
  rr(l, y - h / 2, w, h, 8); ctx.fillStyle = o.bg; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = NAVY; ctx.stroke();
  ctx.fillStyle = o.fg; ctx.fillText(s, l + px, y + 1); ctx.restore();
}
const cue = (s, x, y) => pill(s, x, y, { font: `800 12px ${FONT}`, bg: RED, fg: CREAM });

// 납작한 포스터 글자 (색 하나)
function otext(s, x, y, size, font, color = NAVY) {
  ctx.save(); ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = color; ctx.fillText(s, x, y); ctx.restore();
}

/* ---------- 5. 원 · 그릇 · 양념 · 토핑 ---------- */
// 완료한 면이 한 가닥씩 감겨 만드는 조형물 (나의 그릇 기록에서 보인다)
function art(c, R, list, goal, sd) {
  const K = Math.max(goal, list.length), th = (1.5 + (sd % 4) * .3) * 6.283, dir = sd % 2 ? 1 : -1;
  c.lineCap = c.lineJoin = 'round';
  for (let i = 0; i < K; i++) {
    const n = list[i], f0 = i / K, f1 = (i + 1) / K - .01;
    c.beginPath();
    for (let f = f0; f <= f1; f += .004) {
      const a = dir * f * th - 1.57, r = R * (.5 + .42 * f) + (n ? Math.sin(f * 90) * TYPES[n.type].amp * .3 : 0);
      c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    if (n) { c.strokeStyle = col(n); c.lineWidth = 3 + TYPES[n.type].w * .3; } else { c.strokeStyle = 'rgba(251,243,224,.2)'; c.lineWidth = 3; }
    c.stroke();
  }
}

// 양옆의 큰 세로 글자: 왼쪽은 이름, 오른쪽은 오늘의 숫자(목표를 채우면 "완뚝!")
const SIDE = { y: 150, step: 62, size: 58 };
function drawSide() {
  const done = doneToday().length, full = done > 0 && done >= db.goal;
  ctx.save(); const sc = (1 + Math.sin(t * 2) * .006) * (1 + sunPop), cx = W - 32, cy = SIDE.y + SIDE.step; ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.translate(-cx, -cy);
  (full ? ['완', '뚝', '!'] : [`${done}`, '/', `${db.goal}`]).forEach((ch, i) => otext(ch, cx, SIDE.y + i * SIDE.step, SIDE.size, `900 ${SIDE.size - 8}px ${FONT}`, full || i === 0 ? RED : NAVY));
  ctx.restore();
}

// 라멘 건더기들. 후루룩 때 튀고, 완뚝하면 컨페티가 되고, 그릇 위에도 쌓인다
const TOPS = 9;
function topping(k, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineWidth = 1.8; ctx.strokeStyle = NAVY; ctx.lineJoin = ctx.lineCap = 'round';
  const sh = c => { ctx.fillStyle = c; ctx.fill(); ctx.stroke(); };
  const circ = (a, b, r, c) => { ctx.beginPath(); ctx.arc(a, b, r, 0, 6.283); sh(c); };
  if (k === 0) { ctx.beginPath(); ctx.ellipse(0, 0, 18, 12, -.2, 0, 6.283); sh('#fffaf0'); circ(2, 0, 6, '#f3b83c'); }                                                // 반숙란
  else if (k === 1) { circ(0, 0, 11, '#fffaf6'); ctx.beginPath(); ctx.arc(0, 0, 5.5, 0, 6.283); ctx.strokeStyle = '#ef7b9a'; ctx.lineWidth = 3; ctx.stroke(); }          // 나루토마키: 흰 동그라미에 분홍 고리
  else if (k === 2) { ctx.beginPath(); ctx.arc(0, 0, 8, 0, 6.283); ctx.lineWidth = 8; ctx.stroke(); ctx.strokeStyle = '#6aa97a'; ctx.lineWidth = 4.5; ctx.stroke(); }          // 대파
  else if (k === 3) { ctx.beginPath(); ctx.ellipse(0, 0, 17, 10, .15, 0, 6.283); sh('#c4694a'); ctx.beginPath(); ctx.ellipse(-2, -1, 10, 4, .15, 0, 6.283); ctx.stroke(); }          // 차슈
  else if (k === 4) { ctx.beginPath(); ctx.rect(-9, -12, 18, 24); sh('#2c4a3a'); }                                                                                                  // 김
  else if (k === 5) { circ(-6, 3, 5, '#f3b83c'); circ(5, 3, 5, '#f3b83c'); circ(0, -6, 5, '#f3b83c'); }                                                                             // 옥수수
  else if (k === 6) { ctx.beginPath(); ctx.ellipse(0, 0, 15, 7, 0, 0, 6.283); sh('#e3b878'); }                                                                                      // 멘마
  else if (k === 7) { ctx.beginPath(); ctx.rect(-10, -10, 20, 20); sh('#fffaf0'); }                                                                                                 // 두부
  else { ctx.beginPath(); ctx.moveTo(-11, 4); ctx.quadraticCurveTo(0, -9, 11, -2); ctx.lineWidth = 9; ctx.stroke(); ctx.strokeStyle = RED; ctx.lineWidth = 5.5; ctx.stroke(); }  // 고추
  ctx.restore();
}
const SLOTS = [[-.55, 0], [-.2, .25], [.2, -.2], [.55, .1], [-.35, -.3], [0, .35], [.4, .35], [-.7, .3]];

const blobPos = (i, n) => [W / 2 + (i - (n - 1) / 2) * 54, L.counter + 38];
function blob(c, x, y, s, on) {    // 양념통 하나: 뚜껑, 몸통, 라벨
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (on) { ctx.strokeStyle = CREAM; ctx.lineWidth = 2.5; rr(-17, -22, 34, 42, 9); ctx.stroke(); }
  ctx.fillStyle = c.color; rr(-12, -10, 24, 25, 6); ctx.fill();
  ctx.fillStyle = 'rgba(255,250,246,.85)'; ctx.fillRect(-12, 0, 24, 8);
  ctx.fillStyle = CREAM; rr(-9, -18, 18, 9, 3); ctx.fill();
  ctx.restore();
}

function drawBlobs() {             // 카운터 위에 늘어선 양념통
  const nb = db.cats.length;
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  db.cats.forEach((c, i) => {
    const [x, y] = blobPos(i, nb), held = g && g.cat === c && g.mode === 'dragblob';
    if (held) { ctx.strokeStyle = 'rgba(255,250,246,.4)'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 4]); rr(x - 12, y - 18, 24, 33, 6); ctx.stroke(); ctx.setLineDash([]); }
    else blob(c, x, y, back((Date.now() - (pops.get(c.id) || 0)) / 450), false);
    ctx.font = `800 10px ${FONT}`; ctx.fillStyle = CREAM; ctx.fillText(c.name.slice(0, 4), x, y + 29);
  });
  ctx.restore();
}

// 가게 처마의 천막(노렌): 조각 하나가 버튼 하나. 날짜 · 기록 · 제목 · 도움말
const NOREN = [{ c: NAVY }, { t: '기록', c: RED }, { t: '제목', c: NAVY }, { t: '도움말', c: RED }];
const sway = [0, 0, 0, 0];
const norenBox = i => { const gap = 5, w = (W - gap * 5) / 4; return { x: gap + i * (w + gap), w, y: L.st + 10, h: 64 }; };
function drawNoren() {
  ctx.save(); ctx.fillStyle = NAVY; rr(0, L.st + 4, W, 7, 3); ctx.fill();
  NOREN.forEach((p, i) => {
    const b = norenBox(i), cx = b.x + b.w / 2; sway[i] *= .94;
    ctx.save(); ctx.translate(cx, b.y); ctx.rotate(Math.sin(t * 1.2 + i * .9) * .012 + sway[i] * Math.sin(t * 13)); ctx.translate(-cx, -b.y);
    ctx.fillStyle = p.c; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + b.w, b.y); ctx.lineTo(b.x + b.w, b.y + b.h); ctx.lineTo(cx, b.y + b.h - 9); ctx.lineTo(b.x, b.y + b.h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = CREAM; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (i === 0) { const d = new Date(); ctx.font = `900 19px ${FONT}`; ctx.fillText(`${pad(d.getMonth() + 1)}.${pad(d.getDate())}`, cx, b.y + 24); ctx.font = `800 11px ${FONT}`; ctx.fillText('일월화수목금토'[d.getDay()] + '요일', cx, b.y + 44); }
    else {
      ctx.font = `900 15px ${FONT}`; ctx.globalAlpha = p.t === '제목' && db.titles === false ? .5 : 1; ctx.fillText(p.t, cx, b.y + 30);
      if (p.t === '제목' && db.titles === false) { ctx.fillRect(cx - 14, b.y + 30, 28, 2); }
    }
    ctx.restore();
  });
  ctx.restore();
}
const norenTouch = i => {
  sway[i] = .22; buzz(10);
  if (i === 1) openHistory();
  else if (i === 2) { db.titles = db.titles === false; save(); toast(db.titles === false ? '제목을 숨겼어요' : '제목을 보여요'); }
  else if (i === 3) show('guide');
};

function drawBowl() {              // 납작한 그릇: 분홍 윗부분, 남색 줄 둘, 주황 아랫부분, 굽
  const cx = W / 2, y = L.rimY, rx = L.rimRx, ry = L.rimRy, bh = L.bh, fy = y + bh * 1.02;
  ctx.fillStyle = NAVY; ctx.fillRect(0, L.counter, W, H - L.counter);                                                         // 카운터
  ctx.fillStyle = RED; ctx.fillRect(cx - rx * .22, y + bh * .8, rx * .44, fy - y - bh * .8);                                   // 굽
  ctx.save(); ctx.beginPath(); ctx.moveTo(cx - rx, y); ctx.bezierCurveTo(cx - rx, y + bh * 1.2, cx + rx, y + bh * 1.2, cx + rx, y); ctx.closePath(); ctx.clip();
  ctx.fillStyle = PINK; ctx.fillRect(0, y, W, bh * 1.3);
  ctx.fillStyle = RED; ctx.fillRect(0, y + bh * .72, W, bh);
  ctx.fillStyle = NAVY; ctx.fillRect(0, y + bh * .58, W, 6); ctx.fillRect(0, y + bh * .66, W, 6);
  ctx.restore();
  ctx.fillStyle = CREAM; ctx.beginPath(); ctx.ellipse(cx, y, rx, ry + 2, 0, 0, 6.283); ctx.fill();                            // 테두리 안쪽
  ctx.save(); ctx.beginPath(); ctx.ellipse(cx, y, rx - 9, ry - 2, 0, 0, 6.283); ctx.clip();                                    // 수북한 면
  ctx.strokeStyle = RED; ctx.lineWidth = 2; [-.5, 0, .5].forEach((f, k) => { ctx.beginPath(); for (let x = cx - rx; x <= cx + rx; x += 4) { const yy = y + f * ry + Math.sin(x * .22 + k * 2) * 2.6; x === cx - rx ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); } ctx.stroke(); });
  ctx.restore();
  doneToday().sort((a, b) => a.at - b.at).slice(-8).forEach((n, i) => {                                                      // 오늘 해치운 면은 토핑으로
    const age = (Date.now() - n.at) / 550;
    topping(i % TOPS, cx + SLOTS[i][0] * rx * .8, y + SLOTS[i][1] * ry * .7 - (1 - clamp(age, 0, 1)) * 130, back(age));
  });
  drawBlobs();
}

/* ---------- 6. 연출: 토핑 컨페티와 큰 글자 ---------- */
const fx = [], fly = [];
const confetti = (x, y, n, spread, up, sc = 1) => { for (let i = 0; i < n; i++) fx.push({ k: (Math.random() * TOPS) | 0, x, y, vx: rnd(-1, 1) * spread, vy: -rnd(.3, 1) * up, g: .22, rot: rnd(0, 6.28), vr: rnd(-.25, .25), s: rnd(.8, 1.3) * sc, life: 1, dec: rnd(.008, .016), ph: rnd(0, 6.28) }); };
const rain = n => { for (let i = 0; i < n; i++) fx.push({ k: (Math.random() * TOPS) | 0, x: rnd(0, W), y: rnd(-120, -20), vx: rnd(-1, 1), vy: rnd(1.5, 4), g: .05, rot: rnd(0, 6.28), vr: rnd(-.12, .12), s: rnd(.6, .9), life: 1, dec: .005, ph: rnd(0, 6.28) }); };
// 큰 글자: 'big'은 포스터 글자, 'pill'은 작은 안내 라벨
const say = (text, x, y, size, kind = 'pill') => { const hw = [...text].length * size * .55 / 2 + 14; fx.push({ text, x: clamp(x, hw, W - hw), y, vx: 0, vy: -.8, g: 0, life: 1, dec: .012, size, kind }); };
const slash = (x0, y0, x1, y1) => fx.push({ slash: [x0, y0, x1, y1], life: 1, dec: .1, vx: 0, vy: 0, g: 0 });
const buzz = p => navigator.vibrate && navigator.vibrate(p);   // 진동은 안드로이드에서만 동작

function drawFx() {
  for (let i = fx.length - 1; i >= 0; i--) {
    const f = fx[i]; f.x += f.vx + (f.text || f.slash ? 0 : Math.sin(t * 3 + f.ph) * .5); f.y += f.vy; f.vy += f.g; f.life -= f.dec;
    if (f.life <= 0 || f.y > H + 40) { fx.splice(i, 1); continue; }
    ctx.globalAlpha = Math.min(1, f.life * 3);
    if (f.slash) { ctx.strokeStyle = CREAM; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(f.slash[0], f.slash[1]); ctx.lineTo(f.slash[2], f.slash[3]); ctx.stroke(); }
    else if (f.text) {
      const s = f.life > .85 ? 1 + (f.life - .85) * 4 : 1;                  // 나타날 때 톡 커졌다 줄어든다
      ctx.save(); ctx.translate(f.x, f.y); ctx.scale(s, s);
      if (f.kind === 'big') otext(f.text, 0, 0, f.size, `900 ${f.size}px ${FONT}`);
      else pill(f.text, 0, 0, { font: `800 ${f.size}px ${FONT}`, bg: CREAM, fg: NAVY, h: f.size * 1.8, px: f.size * .7 });
      ctx.restore();
    } else { f.rot += f.vr; ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rot); topping(f.k, 0, 0, f.s); ctx.restore(); }
  }
  ctx.globalAlpha = 1;
}

/* ---------- 7. 성취감: 후루룩 · 콤보 · 완뚝 ---------- */
let combo = 0, lastAt = 0;

function slurpAll(list) {          // 한 가닥이든 한입에 여러 가닥이든 같은 길로 완료
  const now = Date.now();
  combo = now - lastAt < 7000 ? combo + list.length : list.length; lastAt = now;   // 7초 안에 이어서 하면 콤보
  const text = list.length > 1 ? `한입에! ×${list.length}` : combo > 1 ? `후루룩! ×${combo}` : '후루룩!';
  list.forEach((n, i) => {
    const r = R(n); n.done = ymd(); n.at = now + i * 110;
    fly.push({ n, r: { ...r }, d: i * 7, fired: false, text: i === 0 ? text : null, v: 6, a: 1 });   // 위로 빨려 올라가는 면
    r.pull = r.pv = r.sx = r.st = 0; r.hold = r.sel = r.drag = false;
  });
  const cnt = doneToday().length, wait = 350 + list.length * 110;
  if (cnt >= db.goal && !db.reached[ymd()]) { db.reached[ymd()] = true; setTimeout(celebrate, wait); }
  else if (!active().length) setTimeout(() => say('그릇 싹 비웠다!', W / 2, H * .5, 17), wait);
  sunPop = .04; buzz(list.length > 1 ? [30, 30, 60] : 30); save();
  toast(`${cnt}/${db.goal} · ${list.length > 1 ? list.length + '가닥' : list[0].title}`, () => {
    list.forEach(n => { n.done = null; R(n).x = null; });
    combo = Math.max(0, combo - list.length);
    if (doneToday().length < db.goal) delete db.reached[ymd()];
    save();
  });
  did('slurp'); if (list.length > 1) did('multi');
}

function celebrate() {             // 하루 목표 달성: 원이 붉게 + 건더기 컨페티 + 큰 글자
  sunPop = .12; flash = 1; confetti(W / 2, H * .3, 24, 7, 9, .75); rain(12);
  say('완뚝!', W / 2, H * .5, 96, 'big');
  buzz([40, 60, 40, 60, 140]);
  setTimeout(() => toast(streak() > 1 ? `연속 ${streak()}일 완뚝!` : '오늘의 한 그릇 완뚝!'), 900);
}

/* ---------- 8. 자르기 · 양념 ---------- */
function cutNoodle(n, dir) {       // 옆으로 스와이프: 면이 잘려 떨어진다 (삭제, 되돌릴 수 있다)
  const r = R(n); db.noodles = db.noodles.filter(m => m !== n);
  fly.push({ n, r: { ...r }, d: 0, fired: true, cut: dir, v: 2, a: 1 });
  buzz(20); save(); did('cut');
  toast('면을 잘랐어요', () => { db.noodles.push(n); R(n).x = null; save(); });
}
function assign(n, c) {            // 양념 방울을 면에 놓으면 색이 입혀진다 (같은 양념이면 벗겨진다)
  n.cat = n.cat === c.id ? null : c.id; save(); R(n).pv = -9; buzz(15);
  confetti(R(n).x, L.chopY + 40, 5, 3, 4, .7); did('assign');
}

/* ---------- 9. 터치 제스처 ---------- */
const ptrs = new Map();
let g = null, hoverN = null, filter = null;
const pos = e => { const b = cv.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };

function nearest(x, y, tol) {      // 점 (x,y)에서 가장 가까운 면과 그 위치(0=위 ~ 1=끝)
  let best = null, bd = tol;
  active().forEach(n => {
    const r = R(n), p = r.pts;
    if (r.rise <= 0) return;
    for (let i = 0; i < p.length; i++) { const d = Math.hypot(x - p[i][0], y - p[i][1]); if (d < bd) { bd = d; best = { n, s: i / Math.max(1, p.length - 1) }; } }
  });
  return best;
}

function hitTest(x, y) {           // 양념 > 면 > 숫자 > 그릇 > 빈 곳
  const nb = db.cats.length;
  if (!tour) for (let i = 0; i < 4; i++) { const b = norenBox(i); if (x > b.x && x < b.x + b.w && y > L.st && y < b.y + b.h) return { kind: 'noren', i }; }
  for (let i = 0; i < nb; i++) { const [bx, by] = blobPos(i, nb); if (Math.abs(x - bx) < 24 && Math.abs(y - by) < 30) return { kind: 'blob', i }; }
  const h = nearest(x, y, 24);
  if (h) return { kind: 'noodle', n: h.n };                                   // 면: 터치·위로·옆으로
  if (x > W - 66 && y > 105 && y < SIDE.y + SIDE.step * 2.7) return { kind: 'sun' };      // 오른쪽 큰 숫자
  if (y > L.rimY - L.rimRy * 3 && Math.abs(x - W / 2) < L.rimRx * 1.05) return { kind: 'bowl' };
  return { kind: 'pan' };
}

function release() {               // 잡고 있던 것을 모두 놓는다 (제자리로 튕겨 돌아간다)
  active().forEach(n => { const r = R(n); r.hold = r.drag = r.sel = r.cued = false; });
  hoverN = null;
}

cv.addEventListener('pointerdown', e => {
  try { cv.setPointerCapture(e.pointerId); } catch (_) {}
  const p = pos(e); ptrs.set(e.pointerId, { x: p.x, y: p.y });
  if (ptrs.size === 2) { startMulti(); return; }
  if (ptrs.size > 2 || g) return;
  const h = hitTest(p.x, p.y);
  g = { x0: p.x, y0: p.y, x: p.x, y: p.y, px: p.x, py: p.y, pt: performance.now(), vx: 0, vy: 0, mode: h.kind, n: h.n, i: h.i, moved: false };
  if (h.kind === 'blob') g.cat = db.cats[h.i];
  scrollV = 0;
});

cv.addEventListener('pointermove', e => {
  const p = pos(e), q = ptrs.get(e.pointerId);
  if (q) { q.x = p.x; q.y = p.y; }
  if (!g) return;
  if (g.mode === 'multi') { const [a, b] = [...ptrs.values()]; if (b) { g.pa = [a.x, a.y]; g.pb = [b.x, b.y]; multiUpdate(); } return; }
  const now = performance.now(), dt = now - g.pt;
  if (dt > 0) { g.vx = .5 * g.vx + .5 * (p.x - g.px) / dt; g.vy = .5 * g.vy + .5 * (p.y - g.py) / dt; g.px = p.x; g.py = p.y; g.pt = now; }
  const dx = p.x - g.x0, dy = p.y - g.y0;
  if (!g.moved && Math.hypot(dx, dy) > 8) {
    g.moved = true; clearTimeout(g.long);
    const up = dy < 0 && -dy > Math.abs(dx), side = Math.abs(dx) > Math.abs(dy), m = g.mode;
    if (m === 'noodle') g.mode = up ? 'pull' : side ? 'cut' : 'none';       // 위로 → 당기기, 옆으로 → 자르기
    else if (m === 'blob') g.mode = 'dragblob';
    else if (['sun', 'bowl', 'pan', 'noren'].includes(m)) g.mode = 'pan';
  }
  const m = g.mode;
  if (m === 'pan') scrollX = clamp(scrollX - (p.x - g.x), 0, G.max);
  else if (m === 'cut') { if (Math.abs(p.x - g.x0) > CUT) { slash(g.x0 - 10 * Math.sign(p.x - g.x0), g.y0, p.x, g.y0 + (p.y - g.y0) * .5); cutNoodle(g.n, Math.sign(p.x - g.x0)); g.mode = 'none'; } }
  else if (m === 'pull') {
    const was = R(g.n).pull >= PULL, v = clamp(-dy * .9, 0, 420);
    g.sel = [g.n]; const r = R(g.n); r.hold = true; r.pull = v;
    if (!was && v >= PULL) buzz(12);
  }
  else if (m === 'dragblob') { const h = nearest(p.x, p.y, 34); hoverN = h ? h.n : null; }
  g.x = p.x; g.y = p.y;
});

function end(cancel) {
  if (!g || g.mode === 'multi') return;
  clearTimeout(g.long);
  const m = g.mode, n = g.n, r = n && R(n);
  if (m === 'pull') { if (!cancel && (r.pull >= PULL || (g.vy < -1.2 && r.pull > 50))) slurpAll(g.sel); else release(); }   // 빠르게 튕겨 올려도 완료
  else if (m === 'dragblob') { const h = nearest(g.x, g.y, 34); if (!cancel && h) assign(h.n, g.cat); }
  else if (m === 'pan') scrollV = clamp(-g.vx * 16, -40, 40);                                  // 놓은 뒤 관성
  else if (!g.moved && !cancel) {
    if (m === 'noodle') { r.pv = -7; openDetail(n); }
    else if (m === 'sun') { if (tour) { say('지난 그릇이 열려요', W / 2, 250, 13); did('sun'); } else openHistory(); }
    else if (m === 'noren') norenTouch(g.i);
    else if (m === 'bowl') { if (tour) { say('새 면은 여기서 만들어요', W / 2, L.rimY - 30, 13); did('bowl'); } else openForm(); }
  }
  hoverN = null; g = null;
}

// 한입에: 두 손가락으로 면을 집어 함께 들어 올린다
function startMulti() {
  if (g) { clearTimeout(g.long); release(); }
  const [a, b] = [...ptrs.values()];
  g = { mode: 'multi', sel: [], lift: 0, y0: (a.y + b.y) / 2, pa: [a.x, a.y], pb: [b.x, b.y], moved: false };
  multiUpdate();
}
function multiUpdate() {
  const [xa, ya] = g.pa, [xb, yb] = g.pb;
  g.lift = clamp(-((ya + yb) / 2 - g.y0) * .9, 0, 420);
  if (g.lift < 18) {               // 들어 올리기 전까지는 손가락 사이에 들어온 면이 선택된다
    const lo = Math.min(xa, xb) - 12, hi = Math.max(xa, xb) + 12;
    g.sel = active().filter(n => R(n).x >= lo && R(n).x <= hi);
  }
  active().forEach(n => { const r = R(n), on = g.sel.includes(n); r.sel = on; r.hold = on; if (on) r.pull = g.lift; });
}
function endMulti(cancel) {
  if (!cancel && g.lift >= PULL && g.sel.length) slurpAll(g.sel); else release();
  g = null;
}

cv.addEventListener('pointerup', e => { ptrs.delete(e.pointerId); if (g && g.mode === 'multi') endMulti(false); else if (!ptrs.size) end(false); });
cv.addEventListener('pointercancel', e => { ptrs.delete(e.pointerId); if (g && g.mode === 'multi') endMulti(true); else if (!ptrs.size) end(true); });

/* ---------- 10. 따라 해보기: 손가락 그림자를 따라 다섯 가지 ---------- */
const STEPS = [
  { k: 'tap',     t: '면 터치',        d: '면을 한 번 터치', need: 3 },
  { k: 'bowl',    t: '그릇 터치',      d: '그릇을 한 번 터치', need: 3 },
  { k: 'sun',     t: '숫자 터치',      d: '오른쪽 큰 숫자를 터치', need: 3 },
  { k: 'slurp',   t: '위로 스와이프',  d: '면을 위로 스와이프하고 놓기', need: 4 },
  { k: 'cut',     t: '옆으로 스와이프', d: '면을 옆으로 스와이프', need: 4 },
  { k: 'multi',   t: '두 손가락 집기', d: '면 두 가닥을 집어 위로 올리기', need: 4 },
  { k: 'assign',  t: '양념 끌어놓기',  d: '양념통을 면 위로 끌어다 놓기', need: 3 }
];
let snap = '';

function ensure(k) { while (active().length < k) db.noodles.push(sample(db.noodles.length)); }
function startTour(from) {         // 도움말의 한 줄을 눌러 그 동작만 연습한다
  closeSheet(); snap = JSON.stringify(db); filter = null; g = null; ptrs.clear();
  tour = { i: from - 1, done: false };
  db = { goal: 5, reached: {}, cats: baseCats(), noodles: [0, 1, 2, 3, 4].map(sample) };
  document.body.classList.add('touring'); $('#coach').hidden = false; nextStep();
}
function nextStep() {
  tour.i++; tour.done = false;
  if (tour.i >= STEPS.length) return endTour(true);
  const s = STEPS[tour.i]; ensure(s.need);
  $('#co-n').textContent = ''; $('#co-t').textContent = s.t; $('#co-d').textContent = s.d;
  warm(s.t + s.d);
}
function did(k) {                  // 터치가 일어날 때마다 불린다. 지금 단계와 같으면 다음으로
  if (!tour || tour.done || STEPS[tour.i].k !== k) return;
  tour.done = true; say('좋아요!', W / 2, H * .3, 24); confetti(W / 2, H * .3, 5, 4, 5, .6); buzz(15);
  setTimeout(() => tour && endTour(false), 1000);
}
function endTour(all) {
  closeSheet(); db = JSON.parse(snap); tour = null; filter = null; g = null; ptrs.clear();
  document.body.classList.remove('touring'); $('#coach').hidden = true; 
  if (all) { rain(12); say('다 익혔다!', W / 2, H * .45, 44, 'big'); setTimeout(() => toast('이제 마음껏 만져보세요'), 900); }
}
$('#guide-list').onclick = e => { const li = e.target.closest('li[data-s]'); if (li) startTour(+li.dataset.s); };
$('#co-end').onclick = () => endTour(false);

function ghost() {                 // 지금 단계의 손가락 시범: 크림색 동그라미가 같은 동작을 반복한다
  if (!tour || tour.done || g) return;
  const s = STEPS[tour.i], act = active(), a = act[0], b = act[1];
  if (!a || R(a).x === null || R(a).rise < 1) return;
  const ra = R(a), y0 = ra.top, len = nlen(a), mid = y0 + len * .4, rb = b && R(b), my = y0 + len * .85;
  let fs = [], hold = false;                       // 각 손가락: [시작, 끝] 또는 [점] (끝이 없으면 터치)
  if (s.k === 'slurp') fs = [[[ra.x, mid + 30], [ra.x, mid - 150]]];
  else if (s.k === 'tap') fs = [[[ra.x, mid]]];
  else if (s.k === 'bowl') fs = [[[W / 2 - 40, L.rimY + L.bh * .1]]];
  else if (s.k === 'cut') fs = [[[ra.x - 30, mid], [ra.x + 34, mid]]];
  else if (s.k === 'multi' && rb) fs = [[[ra.x - 16, my], [ra.x - 16, my - 170]], [[rb.x + 16, my], [rb.x + 16, my - 170]]];
  else if (s.k === 'assign') fs = [[blobPos(0, db.cats.length), [ra.x, y0 + len * .5]]];
  else if (s.k === 'sun') fs = [[[W - 32, SIDE.y + SIDE.step]]];
  const CY = 2.6, u = (t % CY) / CY, ease = x => x * x * (3 - 2 * x), st0 = hold ? .42 : .15;
  fs.forEach(f => {
    const a0 = f[0], a1 = f[f.length - 1], mv = f.length > 1;
    const k = mv ? ease(clamp((u - st0) / (hold ? .38 : .55), 0, 1)) : 0, x = a0[0] + (a1[0] - a0[0]) * k, y = a0[1] + (a1[1] - a0[1]) * k;
    const al = u < .1 ? u / .1 : u > .88 ? (1 - u) / .12 : 1;
    const press = mv ? u > .12 && u < .78 : Math.abs(u - .25) < .06;
    const ring = (!mv && u > .25 && u < .45) ? (u - .25) / .2 : (hold && u > .12 && u < st0) ? (u - .12) / (st0 - .12) : -1;   // 터치: 번지는 동그라미, 꾹: 차오르는 동그라미
    if (ring >= 0) { ctx.save(); ctx.globalAlpha = .8 * (hold ? .5 + ring * .5 : 1 - ring); ctx.strokeStyle = NAVY; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, hold ? 30 - ring * 10 : 18 + ring * 32, 0, 6.283); ctx.stroke(); ctx.restore(); }
    ctx.save(); ctx.globalAlpha = al * .95;
    if (mv) { ctx.setLineDash([3, 6]); ctx.strokeStyle = NAVY; ctx.globalAlpha = al * .7; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(a0[0], a0[1]); ctx.lineTo(a1[0], a1[1]); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = al * .95; }
    const r = press ? 16 : 20;
    ctx.fillStyle = CREAM; ctx.strokeStyle = NAVY; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill(); ctx.stroke();
    ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(x, y, 4, 0, 6.283); ctx.fill(); ctx.restore();
  });
}

/* ---------- 11. 메인 루프 ---------- */
function frame(ms) {
  t = ms / 1000; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const act = active(), total = act.length * SPACING, fits = total + 60 <= W;
  G = { max: fits ? 0 : total + 60 - W, slot: i => (fits ? (W - total) / 2 : 30 - scrollX) + SPACING / 2 + i * SPACING };

  if (!(g && g.mode === 'pan')) { scrollX += scrollV; scrollV *= .93; }
  scrollX = clamp(scrollX, 0, G.max); sunPop *= .9;

  ctx.drawImage(bgCv, 0, 0, W, H);
  if (flash > .01) { ctx.save(); ctx.globalAlpha = flash * .18; ctx.fillStyle = RED; ctx.fillRect(0, 0, W, H); ctx.restore(); flash *= .95; }   // 완뚝: 종이가 붉게 번쩍
  drawSide(); drawBowl(); if (!tour) drawNoren();

  act.forEach((n, i) => {          // 1) 위치와 스프링
    const r = R(n);
    if (r.x === null) { r.x = G.slot(i); r.rise = -i * .1; }                 // 처음엔 그릇에서 차례로 솟아오른다
    r.x += (G.slot(i) - r.x) * .2;
    r.rise = Math.min(1, r.rise + .03);
    if (!r.hold) { r.pv -= r.pull * .16; r.pv *= .8; r.pull += r.pv; if (Math.abs(r.pull) + Math.abs(r.pv) < .1) r.pull = r.pv = 0; }   // 놓으면 출렁이며 제자리로
    if (!r.drag) {                 // 늘어난 면은 탱! 하고 튕겨 돌아온다
      r.sv -= r.sx * .2; r.sv *= .78; r.sx += r.sv; r.tv -= r.st * .2; r.tv *= .78; r.st += r.tv;
      if (Math.abs(r.sx) + Math.abs(r.sv) < .1) r.sx = r.sv = 0;
      if (Math.abs(r.st) + Math.abs(r.tv) < .1) r.st = r.tv = 0;
    }
    r.a += ((filter && n.cat !== filter ? .25 : 1) - r.a) * .15;
  });
  drawChops();
  act.forEach(n => { const r = R(n); drawNoodle(n, r, r.a, r.sel || n === hoverN || (r.hold && r.pull >= PULL)); });

  for (let i = fly.length - 1; i >= 0; i--) {                         // 후루룩 올라가는 면 / 잘려 떨어지는 면
    const f = fly[i], r = f.r;
    if (f.cut) { f.v += 1.1; r.pull -= f.v; r.sx += f.cut * 2.2; f.a -= .035; }
    else if (f.d > 0) f.d--;
    else {
      if (!f.fired) { f.fired = true; confetti(r.x, L.chopY - r.pull, 4, 3, 5, .6); if (f.text) say(f.text, clamp(r.x, 80, W - 80), L.chopY - r.pull - 30, 15 + Math.min(combo, 5)); }
      f.v += 1.8; r.pull += f.v; f.a -= .025;
    }
    if (f.a <= 0) fly.splice(i, 1); else drawNoodle(f.n, r, f.a, !f.cut);
  }
  act.forEach(n => label(n, R(n), R(n).a));

  if (g && g.mode === 'pull' && R(g.n).pull >= PULL) cue('놓으면 후루룩', clamp(R(g.n).x, 60, W - 60), L.chopY - R(g.n).pull - 24);
  if (g && g.mode === 'multi') {                                      // 젓가락으로 집는 두 손가락
    ctx.save(); ctx.strokeStyle = NAVY; ctx.lineWidth = 1.8; ctx.setLineDash([4, 5]);
    ctx.beginPath(); ctx.moveTo(g.pa[0], g.pa[1]); ctx.lineTo(g.pb[0], g.pb[1]); ctx.stroke(); ctx.setLineDash([]);
    [g.pa, g.pb].forEach(q => { ctx.fillStyle = CREAM; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(q[0], q[1], 15, 0, 6.283); ctx.fill(); ctx.stroke(); });
    ctx.restore();
    if (g.sel.length) cue(g.lift >= PULL ? '놓으면 한입에' : `${g.sel.length}가닥`, (g.pa[0] + g.pb[0]) / 2, Math.min(g.pa[1], g.pb[1]) - 28);
  }
  if (g && g.mode === 'dragblob') blob(g.cat, g.x, g.y - 26, 1.25, true);   // 손에 들린 양념

  if (!act.length) {                                                  // 면이 하나도 없을 때의 문구
    const msg = doneToday().length ? ['오늘 면은', '싹 비웠어요'] : ['그릇을 터치해', '첫 면을 뽑아요'];
    msg.forEach((s, i) => otext(s, W / 2, L.chopY + 80 + i * 46, 32, `900 32px ${FONT}`));
  }

  drawFx(); ghost();
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = .1; ctx.fillStyle = grain; ctx.fillRect(0, 0, W, H); ctx.restore();   // 종이 질감
  requestAnimationFrame(frame);
}

/* ---------- 12. 시트(입력·읽기·양념·기록·안내) ---------- */
const sheet = $('#sheet');
const show = v => { sheet.classList.add('open'); sheet.querySelectorAll('.panel').forEach(p => p.classList.toggle('on', p.dataset.view === v)); };
function closeSheet() { sheet.classList.remove('open'); document.activeElement.blur(); }
sheet.addEventListener('pointerdown', e => { if (e.target === sheet) closeSheet(); });
document.querySelectorAll('[data-close]').forEach(b => b.onclick = closeSheet);

let cur = null, editing = null, form = { type: 'ramen', size: 1, cat: null }, mgrBack = null;

const miniNoodle = T => {          // 종류 칩 안의 작은 면 그림
  const pts = []; for (let y = 2; y <= 42; y += 3) pts.push((15 + T.amp * .9 * Math.sin(y * T.freq * 1.8)).toFixed(1) + ',' + y);
  return `<svg viewBox="0 0 30 44"><polyline points="${pts}" fill="none" stroke="${T.color}" stroke-width="${T.w * .55}" stroke-linecap="round"/></svg>`;
};
$('#f-types').innerHTML = Object.entries(TYPES).map(([k, T]) => `<button class="chip" data-k="${k}">${miniNoodle(T)}<b>${T.name}</b></button>`).join('');
$('#f-sizes').innerHTML = SIZES.map((s, i) => `<button class="chip" data-k="${i}"><b>${s.name}</b></button>`).join('');
const paintChips = () => {
  document.querySelectorAll('#f-types .chip').forEach(c => c.classList.toggle('on', c.dataset.k === form.type));
  document.querySelectorAll('#f-sizes .chip').forEach(c => c.classList.toggle('on', +c.dataset.k === form.size));
  document.querySelectorAll('#f-cats .chip').forEach(c => c.classList.toggle('on', (c.dataset.k || null) === form.cat));
};
const fillCats = () => { $('#f-cats').innerHTML = '<button class="chip sm" data-k="">없음</button>' + db.cats.map(c => `<button class="chip sm" data-k="${c.id}"><b style="background:${c.color}"></b>${esc(c.name)}</button>`).join(''); if (!db.cats.some(c => c.id === form.cat)) form.cat = null; paintChips(); };
$('#f-types').onclick = e => { const c = e.target.closest('.chip'); if (c) { form.type = c.dataset.k; paintChips(); } };
$('#f-sizes').onclick = e => { const c = e.target.closest('.chip'); if (c) { form.size = +c.dataset.k; paintChips(); } };
$('#f-cats').onclick = e => { const c = e.target.closest('.chip'); if (c) { form.cat = c.dataset.k || null; paintChips(); } };
$('#f-cats-edit').onclick = () => openMgr(null, 'form');

function openForm(n) {
  editing = n || null; form = { type: n ? n.type : 'ramen', size: n ? n.size : 1, cat: n ? n.cat : null };
  $('#form-title').textContent = n ? '수정' : '새 면';
  $('#f-title').value = n ? n.title : ''; $('#f-memo').value = n ? n.memo : '';
  fillCats(); show('form');
}
$('#f-save').onclick = () => {
  const title = $('#f-title').value.trim(), memo = $('#f-memo').value.trim();
  if (!title) { $('#f-title').focus(); return; }
  warm(title);
  if (editing) Object.assign(editing, { title, memo, type: form.type, size: form.size, cat: form.cat });
  else { db.noodles.push(mk(title, memo, form.type, form.size, form.cat)); scrollX = 1e5; buzz(15); sunPop = .03; }   // 새 면은 그릇에서 솟아오른다
  save(); closeSheet();
};

function openDetail(n) {           // 메모 읽기. 따라 해보기 중에는 시트 대신 문구만
  if (tour) { say('메모가 열려요', clamp(R(n).x, 70, W - 70), L.chopY - 36, 13); did('tap'); return; }
  cur = n; $('#d-title').textContent = n.title;
  const c = catOf(n);
  $('#d-meta').textContent = `${TYPES[n.type].name} · ${SIZES[n.size].name}${c ? ' · ' + c.name : ''}`;
  $('#d-memo').textContent = n.memo || '적어둔 메모가 없어요'; $('#d-memo').classList.toggle('none', !n.memo); show('detail');
}
$('#d-edit').onclick = () => openForm(cur);
$('#d-del').onclick = () => { const n = cur; closeSheet(); cutNoodle(n, 1); };

function openMgr(focusId, back) {  // 양념(카테고리) 고치기: 색을 누르면 바뀌고, 이름은 바로 쓴다
  mgrBack = back || null; renderMgr(); show('cats');
  const el = focusId && $(`#m-list [data-id="${focusId}"] input`);
  if (el) setTimeout(() => { el.focus(); el.select(); }, 120);
}
const renderMgr = () => { $('#m-list').innerHTML = db.cats.map(c => `<div class="mrow" data-id="${c.id}"><button class="dot" style="background:${c.color}" aria-label="색 바꾸기"></button><input maxlength="6" value="${esc(c.name)}"><button class="x">삭제</button></div>`).join(''); };
$('#m-list').addEventListener('input', e => { const c = db.cats.find(x => x.id === e.target.closest('.mrow').dataset.id); if (c) { c.name = e.target.value; warm(c.name); save(); } });
$('#m-list').addEventListener('click', e => {
  const row = e.target.closest('.mrow'), c = row && db.cats.find(x => x.id === row.dataset.id); if (!c) return;
  if (e.target.closest('.dot')) { c.color = PALETTE[(PALETTE.indexOf(c.color) + 1) % PALETTE.length]; e.target.closest('.dot').style.background = c.color; save(); }
  else if (e.target.closest('.x')) { db.noodles.forEach(n => { if (n.cat === c.id) n.cat = null; }); db.cats = db.cats.filter(x => x !== c); if (filter === c.id) filter = null; save(); renderMgr(); }
});
$('#m-add').onclick = () => {
  if (db.cats.length >= MAXCAT) return toast(`양념은 최대 ${MAXCAT}개예요`);
  const c = { id: 'c' + Date.now(), name: '새 양념', color: PALETTE.find(p => !db.cats.some(x => x.color === p)) || PALETTE[0] };
  db.cats.push(c); pops.set(c.id, Date.now()); save(); renderMgr(); const el = $(`#m-list [data-id="${c.id}"] input`); el.focus(); el.select();
};
$('#m-done').onclick = () => { db.cats.forEach(c => { if (!c.name.trim()) c.name = '양념'; }); save(); if (mgrBack === 'form') { fillCats(); show('form'); } else closeSheet(); };

function thumb(el, list, reached, d) {   // 그날의 조형물 썸네일
  const c = el.getContext('2d'); c.scale(2, 2); c.translate(44, 44);
  c.fillStyle = reached ? RED : NAVY; c.beginPath(); c.arc(0, 0, 40, 0, 6.283); c.fill();
  art(c, 36, list.sort((a, b) => a.at - b.at), db.goal, seed(d));
}
function openHistory() {
  const days = {}; db.noodles.filter(n => n.done).forEach(n => (days[n.done] = days[n.done] || []).push(n));
  const keys = Object.keys(days).sort().reverse();
  $('#h-sum').textContent = `연속 ${streak()}일 완뚝 · 지금까지 ${db.noodles.filter(n => n.done).length}가닥 후루룩`;
  $('#h-goals').innerHTML = GOALS.map(v => `<button class="chip${v === db.goal ? ' on' : ''}" data-g="${v}"><b>${v}그릇</b></button>`).join('');
  $('#h-list').innerHTML = keys.length ? keys.map(d => `
    <div class="day"><canvas data-d="${d}" width="176" height="176"></canvas>
    <div class="dh"><b>${d.slice(5).replace('-', '.')}</b><span>${days[d].length}</span>${db.reached[d] ? '<em>완뚝</em>' : ''}</div>
    ${days[d].map(n => `<div class="it"><span>${esc(n.title)}</span><button data-id="${n.id}">복구</button></div>`).join('')}</div>`).join('')
    : '<p class="empty">아직 후루룩한 면이 없어요.<br>면을 위로 스와이프해보세요</p>';
  document.querySelectorAll('#h-list canvas').forEach(el => thumb(el, days[el.dataset.d], db.reached[el.dataset.d], el.dataset.d));
  show('history');
}
$('#h-goals').onclick = e => { const b = e.target.closest('[data-g]'); if (b) { db.goal = +b.dataset.g; save(); sunPop = .05; openHistory(); } };
$('#h-list').onclick = e => {
  const b = e.target.closest('button'), n = b && db.noodles.find(x => x.id === +b.dataset.id);
  if (!n) return;
  n.done = null; R(n).x = null;
  if (doneToday().length < db.goal) delete db.reached[ymd()];
  save(); openHistory();
};

/* ---------- 13. 토스트 · 날짜 · 폰트 · 시작 ---------- */
let toastT;
function toast(msg, undo) {
  const el = $('#toast'), b = el.querySelector('button');
  el.firstElementChild.textContent = msg; b.hidden = !undo;
  b.onclick = () => { undo(); el.classList.remove('on'); };
  el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), undo ? 4500 : 2200);
}

// 캔버스에 쓰는 글자는 폰트가 미리 로드돼 있어야 예쁘게 나온다
const warm = s => document.fonts && Promise.all([document.fonts.load('900 48px "Pretendard Variable"', s), document.fonts.load('800 13px "Pretendard Variable"', s), document.fonts.load('400 62px Anton', '0123456789/noodle doodle')]).catch(() => {});


warm(CANVAS_TEXT + db.noodles.map(n => n.title).join('') + db.cats.map(c => c.name).join('') + STEPS.map(s => s.t + s.d).join(''));
new ResizeObserver(layout).observe(app);
layout();
if (document.fonts) document.fonts.ready.then(() => makeSprites());
if (!localStorage.getItem('noodle-doodle-seen9')) { show('guide'); localStorage.setItem('noodle-doodle-seen6', '1'); }   // 처음 여는 사람에게는 도움말부터
requestAnimationFrame(frame);
