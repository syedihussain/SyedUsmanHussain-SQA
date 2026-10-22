/* ---------- Contact form: opens Gmail (desktop) or mail app (phone) ---------- */
(function () {
  const TO = 'usmanh1999.uh@gmail.com';
  const form = document.getElementById('contactForm');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const n = document.getElementById('fName').value.trim();
    const m = document.getElementById('fEmail').value.trim();
    const t = document.getElementById('fMsg').value.trim();
    const subject = 'Portfolio enquiry from ' + n;
    const body = t + '\n\n— ' + n + ' (' + m + ')';
    const mailto = 'mailto:' + TO + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    const gmail = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(TO) +
                  '&su=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = mailto;
    } else {
      const w = window.open(gmail, '_blank');
      if (!w) window.location.href = mailto; // popup blocked -> try mail app
    }
  });
})();

/* ---------- Helpers ---------- */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const TEAL = '25,230,193', CYAN = '0,200,255', RED = '255,93,108';

function fitCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);   // sharp on retina / 4K
  const w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

/* ---------- 1) Intro: test matrix runs, one defect is found and fixed ---------- */
const intro = document.getElementById('intro');
const introCanvas = document.getElementById('introCanvas');
const introName = document.getElementById('introName');
const hud = document.querySelector('.intro-hud');
const hudFill = document.getElementById('hudFill');
const hudCount = document.getElementById('hudCount');
const hudLabel = document.getElementById('hudLabel');
const hudLog = document.getElementById('hudLog');
let finished = false, introRaf = 0;
const timers = [];
const later = (fn, ms) => timers.push(setTimeout(fn, ms));

function finishIntro() {
  if (finished) return;
  finished = true;
  timers.forEach(clearTimeout);
  cancelAnimationFrame(introRaf);
  intro.classList.add('hide');
  document.body.classList.remove('loading');
  document.body.classList.add('ready');
  setTimeout(() => intro.remove(), 1100);
}

function runIntro() {
  const SWEEP = reduceMotion ? 600 : 3200;       // time for the wave to cross the screen
  let cell, cols, rows, cells, total, failIdx, failAt, W, H, ctx;

  function build() {
    ({ ctx, w: W, h: H } = fitCanvas(introCanvas));
    cell = W < 600 ? 24 : 32;
    cols = Math.ceil(W / cell); rows = Math.ceil(H / cell);
    total = cols * rows;
    cells = [];
    const maxD = cols + rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      cells.push({ c, r, at: ((c + r) / maxD) * SWEEP + Math.random() * 380, run: 160 + Math.random() * 260 });
    }
    failIdx = Math.floor(rows * 0.34) * cols + Math.floor(cols * 0.28);
    failAt = cells[failIdx].at;
  }
  build();
  window.addEventListener('resize', () => { if (!finished) build(); });

  const t0 = performance.now();
  let logState = 0;
  function frame(now) {
    if (finished) return;
    const t = now - t0;
    ctx.clearRect(0, 0, W, H);
    let passed = 0;
    const g = cell - 3;
    for (let i = 0; i < cells.length; i++) {
      const k = cells[i];
      const x = k.c * cell + 1.5, y = k.r * cell + 1.5;
      const dt = t - k.at;
      if (dt < 0) {                                  // waiting
        ctx.fillStyle = 'rgba(' + TEAL + ',.05)';
        ctx.fillRect(x, y, g, g);
        continue;
      }
      if (i === failIdx) {                           // the one that fails, then gets fixed
        if (dt < 900) {
          const p = .55 + .45 * Math.sin(dt / 55);
          ctx.fillStyle = 'rgba(' + RED + ',' + (.35 + p * .5) + ')';
          ctx.shadowColor = 'rgb(' + RED + ')'; ctx.shadowBlur = 18;
          ctx.fillRect(x, y, g, g); ctx.shadowBlur = 0;
          continue;
        }
        passed++;
      } else if (dt < k.run) {                       // running
        ctx.fillStyle = 'rgba(' + CYAN + ',.85)';
        ctx.shadowColor = 'rgb(' + CYAN + ')'; ctx.shadowBlur = 12;
        ctx.fillRect(x, y, g, g); ctx.shadowBlur = 0;
        continue;
      } else passed++;
      const settle = Math.min(1, (dt - k.run) / 900);   // pass: bright, then settles
      ctx.fillStyle = 'rgba(' + TEAL + ',' + (.55 - settle * .47) + ')';
      ctx.fillRect(x, y, g, g);
    }
    // HUD
    const pct = passed / total;
    hudFill.style.width = (pct * 100).toFixed(1) + '%';
    hudCount.textContent = passed.toLocaleString('en-US') + ' / ' + total.toLocaleString('en-US');
    if (logState === 0 && t > failAt) {
      logState = 1; hudLog.className = 'hud-log fail'; hudLog.textContent = '✗ FAIL checkout.applyDiscount';
    } else if (logState === 1 && t > failAt + 900) {
      logState = 2; hudLog.className = 'hud-log ok'; hudLog.textContent = '✓ Defect reported · fixed · re-test PASSED';
    }
    if (pct >= 1 && logState < 3) {
      logState = 3; hudLabel.textContent = 'All tests passed'; hudLog.className = 'hud-log ok'; hudLog.textContent = '0 open defects';
    }
    introRaf = requestAnimationFrame(frame);
  }
  introRaf = requestAnimationFrame(frame);

  const done = SWEEP + 1700;
  later(() => { hud.classList.add('out'); introName.classList.add('in'); }, done);
  later(finishIntro, done + 2300);
}
document.getElementById('skipIntro').addEventListener('click', finishIntro);
runIntro();

/* ---------- 2) Hero background: quiet test grid ---------- */
(function heroField() {
  const canvas = document.getElementById('heroCanvas');
  const hero = document.getElementById('home');
  let ctx, W, H, cell = 36, cols, rows, live = [], visible = true, last = 0, spawnAt = 0;
  function build() {
    ({ ctx, w: W, h: H } = fitCanvas(canvas));
    cols = Math.ceil(W / cell); rows = Math.ceil(H / cell); live = [];
    drawGrid();
  }
  function drawGrid() {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(' + TEAL + ',.07)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let c = 0; c <= cols; c++) { ctx.moveTo(c * cell + .5, 0); ctx.lineTo(c * cell + .5, H); }
    for (let r = 0; r <= rows; r++) { ctx.moveTo(0, r * cell + .5); ctx.lineTo(W, r * cell + .5); }
    ctx.stroke();
  }
  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible || now - last < 33) return;
    last = now;
    if (now > spawnAt) {
      spawnAt = now + 90;
      const bad = Math.random() < 0.03;
      live.push({ c: (Math.random() * cols) | 0, r: (Math.random() * rows) | 0, born: now, bad, col: bad ? RED : (Math.random() < .25 ? CYAN : TEAL) });
    }
    drawGrid();
    live = live.filter(k => now - k.born < 1800);
    for (const k of live) {
      const age = now - k.born;
      let col = k.col, a = Math.max(0, 1 - age / 1800) * .5;
      if (k.bad && age > 700) col = TEAL;               // failed, then fixed
      ctx.fillStyle = 'rgba(' + col + ',' + a + ')';
      ctx.fillRect(k.c * cell + 3, k.r * cell + 3, cell - 5, cell - 5);
    }
  }
  build();
  window.addEventListener('resize', build);
  if (reduceMotion) return;
  if ('IntersectionObserver' in window) new IntersectionObserver(e => { visible = e[0].isIntersecting; }).observe(hero);
  requestAnimationFrame(frame);
})();

/* ---------- 3) Mobile menu ---------- */
const menuBtn = document.getElementById('menuBtn');
const menu = document.getElementById('menu');
function toggleMenu(open) {
  const isOpen = open ?? !menu.classList.contains('open');
  menu.classList.toggle('open', isOpen);
  menuBtn.classList.toggle('open', isOpen);
  menuBtn.setAttribute('aria-expanded', isOpen);
}
menuBtn.addEventListener('click', () => toggleMenu());
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggleMenu(false)));
document.addEventListener('keydown', e => { if (e.key === 'Escape') toggleMenu(false); });

/* ---------- 4) Scroll: nav background + social hide ---------- */
const nav = document.getElementById('nav');
const social = document.getElementById('social');
const heroEl = document.getElementById('home');
function onScroll() {
  nav.classList.toggle('scrolled', window.scrollY > 40);
  social.classList.toggle('away', window.scrollY > heroEl.offsetHeight * 0.6);
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- 5) Reveal on scroll + active menu link ---------- */
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('show'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  reveals.forEach(el => io.observe(el));
  const links = [...menu.querySelectorAll('a[href^="#"]')];
  const so = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id)); });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('main section[id]').forEach(s => so.observe(s));
} else {
  reveals.forEach(el => el.classList.add('show'));
}

/* ---------- 6) Contact: email app + copy ---------- */
const MAIL = 'usmanh1999.uh@gmail.com';
const copyBtn = document.getElementById('copyMail');
copyBtn.addEventListener('click', () => {
  const ok = () => { copyBtn.textContent = 'Copied'; setTimeout(() => copyBtn.textContent = 'Copy email', 1600); };
  if (navigator.clipboard) navigator.clipboard.writeText(MAIL).then(ok, () => {});
});
document.getElementById('year').textContent = new Date().getFullYear();
