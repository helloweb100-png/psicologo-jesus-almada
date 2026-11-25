/* =========================================================
   Psicólogo Jesús Almada Bravo · Instituto Milton H. Erickson
   «La puerta al inconsciente» — script.js (vanilla, sin dependencias)
   ---------------------------------------------------------
   · Única fuente del número de WhatsApp (formato internacional sin "+").
     Si se deja vacío, el botón flotante y el envío del formulario se ocultan.
   · Motor de scroll propio: cada [data-scrub] recibe --p (0–1).
   · El contenido es visible por defecto; todo respaldo por geometría.
   ========================================================= */
const WHATSAPP_NUMBER = "526646284300";

(function () {
  'use strict';

  window.__app = true;
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motion = !reduce;
  if (motion) root.classList.add('motion');

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  /* ---------------------------------------------------------
     WhatsApp
     --------------------------------------------------------- */
  const waOK = /^\d{10,15}$/.test(WHATSAPP_NUMBER);
  const waUrl = (texto) => 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(texto);

  function bindWA(a) {
    if (!waOK) return;
    a.href = waUrl(a.dataset.wa);
    a.target = '_blank';
    a.rel = 'noopener';
  }
  $$('[data-wa]').forEach(bindWA);
  if (!waOK) {
    const fl = $('#wa-float');
    if (fl) fl.hidden = true;
    const sb = $('#form-submit');
    if (sb) sb.hidden = true;
    const st = $('#form-status');
    if (st) st.textContent = 'Por ahora llámanos al 664 608 0726 y con gusto te atendemos.';
  }

  /* ---------------------------------------------------------
     Utilidades de texto: separar palabras
     --------------------------------------------------------- */
  function splitWords(el) {
    let idx = 0;
    const walk = (node) => {
      Array.from(node.childNodes).forEach((ch) => {
        if (ch.nodeType === 3) {
          const frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const i = document.createElement('span'); i.className = 'w__i';
            i.style.setProperty('--i', idx++);
            i.textContent = part;
            w.appendChild(i); frag.appendChild(w);
          });
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1 && ch.tagName !== 'BR') {
          walk(ch);
        }
      });
    };
    walk(el);
  }

  function wrapWordsScrub(el) {
    const nodes = [];
    const collect = (n) => Array.from(n.childNodes).forEach((c) => {
      if (c.nodeType === 3) nodes.push(c); else if (c.nodeType === 1) collect(c);
    });
    collect(el);
    let total = 0;
    nodes.forEach((t) => { total += (t.textContent.match(/\S+/g) || []).length; });
    let i = 0;
    nodes.forEach((t) => {
      const frag = document.createDocumentFragment();
      t.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        const s = document.createElement('span');
        s.className = 'mw';
        s.style.setProperty('--w', (i++ / total).toFixed(4));
        s.textContent = part;
        frag.appendChild(s);
      });
      t.parentNode.replaceChild(frag, t);
    });
  }

  $$('[data-split]').forEach(splitWords);
  $$('[data-words]').forEach(wrapWordsScrub);

  /* ---------------------------------------------------------
     Contadores
     --------------------------------------------------------- */
  const counted = new WeakSet();
  const counters = $$('[data-count]');
  function countUp(scope) {
    $$('[data-count]', scope).forEach((el) => {
      if (counted.has(el)) return;
      counted.add(el);
      const end = parseFloat(el.dataset.count);
      const sep = el.dataset.sep === '1';
      const fmt = (v) => (sep ? Math.round(v).toLocaleString('en-US') : String(Math.round(v)));
      if (!motion) { el.textContent = fmt(end); return; }
      const t0 = performance.now(), dur = 1500;
      const step = (now) => {
        const k = clamp((now - t0) / dur);
        el.textContent = fmt(end * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(step); else el.textContent = fmt(end);
      };
      requestAnimationFrame(step);
    });
  }
  if (motion) counters.forEach((el) => { el.textContent = '0'; });
  setTimeout(() => counters.forEach((el) => { if (!counted.has(el)) { counted.add(el); el.textContent = el.dataset.sep === '1' ? Number(el.dataset.count).toLocaleString('en-US') : el.dataset.count; } }), 14000);

  /* ---------------------------------------------------------
     Revelado (IntersectionObserver + respaldo por geometría)
     --------------------------------------------------------- */
  const all = $$('[data-reveal],[data-split]');
  const pending = new Set(all.filter((el) => !el.closest('.hero')));

  function show(el) {
    if (el.classList.contains('is-in')) return;
    el.classList.add('is-in');
    pending.delete(el);
    if (io) io.unobserve(el);
    if (el.matches('.stat')) countUp(el);
  }

  let io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) show(e.target); });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    pending.forEach((el) => io.observe(el));
  }

  function geoReveal() {
    if (!pending.size) return;
    const vh = window.innerHeight;
    pending.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.94 && r.bottom > 0) show(el);
    });
  }

  /* ---------------------------------------------------------
     Cargador
     --------------------------------------------------------- */
  const loader = $('#loader');
  const tStart = performance.now();
  let opened = false;

  function heroIn() {
    $$('.hero [data-reveal], .hero [data-split]').forEach(show);
  }
  function openLoader() {
    if (opened) return;
    opened = true;
    root.classList.add('is-loaded');
    if (loader) {
      loader.classList.add('is-open');
      setTimeout(() => loader.classList.add('is-done'), 900);
    }
    setTimeout(heroIn, motion ? 250 : 0);
  }
  function whenLoaded() {
    const wait = Math.max(0, 1400 - (performance.now() - tStart));
    setTimeout(openLoader, wait);
  }
  if (document.readyState === 'complete') whenLoaded(); else window.addEventListener('load', whenLoaded, { once: true });
  setTimeout(openLoader, 2000); // respaldo: nunca más de ~2 s

  /* ---------------------------------------------------------
     Motor de scroll: --p por [data-scrub]
     --------------------------------------------------------- */
  const scrubs = $$('[data-scrub]').map((el) => ({
    el,
    mode: el.dataset.scrub,
    from: parseFloat(el.dataset.from || '0'),
    to: parseFloat(el.dataset.to || '1'),
    last: -1,
    p: null,
    cb: null
  }));
  const scrubOf = (el) => scrubs.find((s) => s.el === el);

  function scrubUpdate() {
    if (!motion) return;
    const vh = window.innerHeight;
    for (let i = 0; i < scrubs.length; i++) {
      const s = scrubs[i];
      const r = s.el.getBoundingClientRect();
      let raw;
      if (s.mode === 'pin') {
        const d = r.height - vh;
        raw = d > 8 ? -r.top / d : (r.top <= 0 ? 1 : 0);
      } else {
        raw = (vh - r.top) / (vh + r.height);
      }
      const p = clamp((raw - s.from) / (s.to - s.from));
      if (p === s.last) continue;
      if (Math.abs(p - s.last) > 0.0004 || p === 0 || p === 1) {
        s.last = p;
        s.p = p;
        s.el.style.setProperty('--p', p.toFixed(4));
        if (s.cb) s.cb(p);
      }
    }
  }

  /* ---------------------------------------------------------
     Servicios: pista horizontal pinneada (≥1024 px)
     --------------------------------------------------------- */
  const sv = $('#servicios');
  const svTrack = $('.services__track');
  const svView = $('.services__viewport');
  const svCount = $('#serv-count');
  const svN = $$('.card', svTrack || document).length;
  function measureServices() {
    if (!sv || !svTrack || !motion) return;
    if (window.matchMedia('(min-width: 1024px)').matches) {
      const dist = Math.max(0, svTrack.offsetWidth - svView.clientWidth);
      sv.style.setProperty('--dist', dist + 'px');
    } else {
      sv.style.removeProperty('--dist');
    }
  }
  const svScrub = sv && scrubOf(sv);
  if (svScrub && svCount) {
    svScrub.cb = (p) => {
      const idx = clamp(Math.round(p * (svN - 1)) + 1, 1, svN);
      svCount.textContent = String(idx).padStart(2, '0');
    };
  }

  /* ---------------------------------------------------------
     Diamante de béisbol
     --------------------------------------------------------- */
  (function diamond() {
    const path = $('#diamond-path');
    const ball = $('#diamond-ball');
    if (!path || !ball || !motion || !path.getTotalLength) return;
    const L = path.getTotalLength();
    path.style.strokeDasharray = L;
    path.style.strokeDashoffset = L;
    const s = scrubOf(path.closest('[data-scrub]'));
    if (!s) return;
    s.cb = (p) => {
      path.style.strokeDashoffset = (L * (1 - p)).toFixed(2);
      const pt = path.getPointAtLength(L * p);
      ball.setAttribute('cx', pt.x.toFixed(2));
      ball.setAttribute('cy', pt.y.toFixed(2));
    };
    s.cb(0);
  })();

  /* ---------------------------------------------------------
     Encabezado, progreso, menú, navegación activa
     --------------------------------------------------------- */
  const header = $('#header');
  const burger = $('.burger');
  const menu = $('#menu');

  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    if (burger) {
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    }
    if (menu) menu.setAttribute('aria-hidden', String(!open));
  }
  if (burger) burger.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
  if (menu) menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  window.matchMedia('(min-width: 960px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  function setActive(id) {
    // Los puntos laterales estorban sobre el carrusel de servicios: se atenúan allí
    root.classList.toggle('dots-off', id === 'servicios');
    $$('[data-nav]').forEach((a) => {
      const on = a.dataset.nav === id;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }
  if ('IntersectionObserver' in window) {
    const sio = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach((s) => sio.observe(s));
  }

  function chromeUpdate() {
    const y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('is-compact', y > 60);
    const max = root.scrollHeight - window.innerHeight;
    root.style.setProperty('--page', max > 0 ? clamp(y / max).toFixed(4) : '0');
  }

  /* ---------------------------------------------------------
     Bucle de scroll unificado
     --------------------------------------------------------- */
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      scrubUpdate();
      geoReveal();
      chromeUpdate();
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { measureServices(); onScroll(); });
  window.addEventListener('load', () => { measureServices(); onScroll(); setTimeout(geoReveal, 2000); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measureServices(); onScroll(); });
  measureServices();
  scrubUpdate();
  chromeUpdate();
  setTimeout(geoReveal, 600);
  setTimeout(geoReveal, 2000);

  /* ---------------------------------------------------------
     Cursor, imanes y tilt (solo puntero fino)
     --------------------------------------------------------- */
  if (finePointer && motion) {
    root.classList.add('has-cursor');
    const cur = $('.cursor');
    const dot = $('.cursor__dot');
    const ring = $('.cursor__ring');
    let mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener('pointermove', (e) => {
      mx = e.clientX; my = e.clientY;
      if (cur) cur.classList.add('is-on');
      if (dot) dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
      if (cur) cur.classList.toggle('is-view', !!e.target.closest && !!e.target.closest('[data-cursor]'));
    }, { passive: true });
    (function loop() {
      rx = lerp(rx, mx, 0.18); ry = lerp(ry, my, 0.18);
      if (ring) ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)';
      requestAnimationFrame(loop);
    })();

    $$('.btn--magnetic').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        const dx = clamp((e.clientX - (r.left + r.width / 2)) / (r.width / 2), -1, 1) * 8;
        const dy = clamp((e.clientY - (r.top + r.height / 2)) / (r.height / 2), -1, 1) * 8;
        b.style.setProperty('--bx', dx.toFixed(1) + 'px');
        b.style.setProperty('--by', dy.toFixed(1) + 'px');
      });
      b.addEventListener('pointerleave', () => { b.style.setProperty('--bx', '0px'); b.style.setProperty('--by', '0px'); });
    });

    $$('[data-tilt]').forEach((c) => {
      c.addEventListener('pointermove', (e) => {
        const r = c.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty('--ry', ((x - 0.5) * 12).toFixed(2) + 'deg');
        c.style.setProperty('--rx', ((0.5 - y) * 10).toFixed(2) + 'deg');
        c.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        c.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      });
      c.addEventListener('pointerleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
    });
  }

  /* ---------------------------------------------------------
     Pausa de lienzos fuera de vista
     --------------------------------------------------------- */
  function visibility(el, onChange) {
    let vis = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((en) => { vis = en[0].isIntersecting; onChange(vis); }, { rootMargin: '80px' }).observe(el);
    }
    return () => vis;
  }

  /* ---------------------------------------------------------
     Canvas del hero: anillos que expanden, espirales y polvo dorado
     --------------------------------------------------------- */
  (function hero() {
    const cv = $('#hipnosis');
    const stage = $('.hero__stage');
    const wrap = $('#portal-wrap');
    if (!cv || !stage || !wrap || !cv.getContext) return;
    const ctx = cv.getContext('2d');
    const chips = $$('.orbit__chip');
    const tilt = $('.portal__tilt');
    let W = 0, H = 0, raf = 0, last = performance.now();
    const t0 = last;
    const parts = [];
    const off = { x: 0, y: 0 };
    const target = { x: 0, y: 0, on: false };
    let spiral = 0;
    const omegas = [0.00021, 0.00016, 0.00026, 0.00019, 0.00014];
    const skew = [1, 1.08, 0.94, 1.12, 0.98];

    function size() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = stage.clientWidth; H = stage.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      parts.length = 0;
      const n = W < 700 ? 60 : 90;
      for (let i = 0; i < n; i++) {
        parts.push({ x: Math.random() * W, y: Math.random() * H, s: 0.6 + Math.random() * 1.6, v: 8 + Math.random() * 26, a: 8 + Math.random() * 22, ph: Math.random() * 6.283, tw: 0.8 + Math.random() * 2 });
      }
    }

    function draw(now) {
      const dt = Math.max(0, Math.min(50, now - last)); last = now;
      ctx.clearRect(0, 0, W, H);
      const sr = stage.getBoundingClientRect();
      const wr = wrap.getBoundingClientRect();
      const cx = wr.left + wr.width / 2 - sr.left;
      const cy = wr.top + wr.height / 2 - sr.top;

      if (target.on) {
        const dx = target.x - cx, dy = target.y - cy, d = Math.hypot(dx, dy) || 1;
        off.x = lerp(off.x, (dx / d) * 12, 0.06); off.y = lerp(off.y, (dy / d) * 12, 0.06);
      } else { off.x = lerp(off.x, 0, 0.05); off.y = lerp(off.y, 0, 0.05); }

      const maxR = Math.hypot(W, H) * 0.62;
      const N = 14, step = maxR / N;
      // El timestamp de rAF puede ser menor que t0 en el primer cuadro: sin negativos
      const phase = (Math.max(0, now - t0) / 9000) % 1;
      ctx.lineWidth = 1;
      for (let i = 0; i <= N; i++) {
        const r = step * (i + phase);
        if (r <= 0) continue;
        const a = 1 - r / maxR;
        if (a <= 0) continue;
        const fade = Math.min(1, r / (step * 1.2));
        ctx.strokeStyle = 'rgba(201,162,75,' + (a * 0.5 * fade).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(cx + off.x * (1 - i / N * 0.6), cy + off.y * (1 - i / N * 0.6), r, 0, 6.2832);
        ctx.stroke();
      }

      spiral += 0.0006 * dt / 16.67;
      const thMax = Math.PI * 5, a0 = 14, b = Math.log(maxR / a0) / thMax;
      ctx.strokeStyle = 'rgba(232,200,117,.17)';
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        for (let j = 0; j <= 150; j++) {
          const th = (j / 150) * thMax;
          const r = a0 * Math.exp(b * th);
          const x = cx + off.x + Math.cos(th + spiral + k * 2.0944) * r;
          const y = cy + off.y + Math.sin(th + spiral + k * 2.0944) * r;
          if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      const sec = dt / 1000;
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        p.y -= p.v * sec;
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        const x = p.x + Math.sin(now * 0.0008 + p.ph) * p.a;
        const al = (0.25 + 0.75 * (0.5 + 0.5 * Math.sin(now * 0.001 * p.tw + p.ph))) * 0.85;
        ctx.fillStyle = 'rgba(235,209,139,' + (al * 0.18).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(x, p.y, p.s * 3, 0, 6.2832); ctx.fill();
        ctx.fillStyle = 'rgba(247,226,160,' + al.toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(x, p.y, p.s, 0, 6.2832); ctx.fill();
      }

      // chips orbitando en elipse
      const rxMax = Math.min(wr.width * 0.66, W - cx - 64, cx - 64);
      const radX = Math.max(60, rxMax), radY = wr.height * 0.5;
      for (let i = 0; i < chips.length; i++) {
        const ang = (now - t0) * omegas[i] + i * 1.2566;
        const x = Math.cos(ang) * radX * skew[i];
        const y = Math.sin(ang) * radY * (0.92 + i * 0.03);
        const depth = (Math.sin(ang) + 1) / 2;
        const c = chips[i];
        c.style.transform = 'translate(-50%,-50%) translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + (0.86 + 0.16 * depth).toFixed(3) + ')';
        c.style.opacity = (0.55 + 0.45 * depth).toFixed(2);
        c.style.zIndex = depth > 0.5 ? 4 : 1;
      }
    }

    function loop(now) {
      if (!isVisible() || document.hidden) { raf = 0; return; }
      draw(now);
      raf = requestAnimationFrame(loop);
    }
    function start() { if (!raf && motion) raf = requestAnimationFrame(loop); }
    const isVisible = visibility(stage, (v) => { if (v) start(); });

    size();
    if (motion) start(); else draw(t0 + 2700);
    window.addEventListener('resize', () => { size(); if (!motion) draw(t0 + 2700); });
    document.addEventListener('visibilitychange', start);

    if (finePointer && motion) {
      stage.addEventListener('pointermove', (e) => {
        target.x = e.clientX - stage.getBoundingClientRect().left;
        target.y = e.clientY - stage.getBoundingClientRect().top;
        target.on = true;
        const r = wrap.getBoundingClientRect();
        const px = clamp((e.clientX - r.left) / r.width, -0.5, 1.5), py = clamp((e.clientY - r.top) / r.height, -0.5, 1.5);
        if (tilt) {
          tilt.style.setProperty('--ry', clamp((px - 0.5) * 12, -6, 6).toFixed(2) + 'deg');
          tilt.style.setProperty('--rx', clamp((0.5 - py) * 12, -6, 6).toFixed(2) + 'deg');
        }
      }, { passive: true });
      stage.addEventListener('pointerleave', () => {
        target.on = false;
        if (tilt) { tilt.style.setProperty('--ry', '0deg'); tilt.style.setProperty('--rx', '0deg'); }
      });
    }
  })();

  /* ---------------------------------------------------------
     Canvas de inmersión: burbujas que suben
     --------------------------------------------------------- */
  (function bubbles() {
    const cv = $('#burbujas');
    const sec = $('#inmersion');
    if (!cv || !sec || !cv.getContext) return;
    const ctx = cv.getContext('2d');
    const s = scrubOf(sec);
    let W = 0, H = 0, raf = 0, last = performance.now();
    const list = [];

    function size() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      list.length = 0;
      for (let i = 0; i < 160; i++) {
        list.push({ x: Math.random() * W, y: Math.random() * H, r: 1 + Math.random() * 4.2, v: 18 + Math.random() * 54, ph: Math.random() * 6.283, w: 6 + Math.random() * 18 });
      }
    }
    function draw(now) {
      const dt = Math.max(0, Math.min(50, now - last)) / 1000; last = now;
      const p = s && s.p != null ? s.p : 1;
      ctx.clearRect(0, 0, W, H);
      const count = Math.floor(30 + p * 130);
      const cr = Math.round(lerp(91, 232, p)), cg = Math.round(lerp(155, 200, p)), cb = Math.round(lerp(224, 117, p));
      for (let i = 0; i < count && i < list.length; i++) {
        const b = list[i];
        b.y -= b.v * dt * (1 + p * 0.5);
        if (b.y < -12) { b.y = H + 12; b.x = Math.random() * W; }
        const x = b.x + Math.sin(now * 0.0009 + b.ph) * b.w;
        ctx.strokeStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',.38)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(x, b.y, b.r, 0, 6.2832); ctx.stroke();
        ctx.fillStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',.07)';
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.35)';
        ctx.beginPath(); ctx.arc(x - b.r * 0.35, b.y - b.r * 0.35, Math.max(.5, b.r * 0.18), 0, 6.2832); ctx.fill();
      }
    }
    function loop(now) {
      if (!isVisible() || document.hidden) { raf = 0; return; }
      draw(now); raf = requestAnimationFrame(loop);
    }
    function start() { if (!raf && motion) raf = requestAnimationFrame(loop); }
    const isVisible = visibility(sec, (v) => { if (v) start(); });
    size();
    if (motion) start(); else draw(performance.now());
    window.addEventListener('resize', () => { size(); if (!motion) draw(performance.now()); });
    document.addEventListener('visibilitychange', start);
  })();

  /* ---------------------------------------------------------
     Motivos de consulta
     --------------------------------------------------------- */
  (function reasons() {
    const chips = $$('.chip');
    const slides = $$('.slide');
    const cta = $('#motivo-cta');
    const ctaTxt = $('#motivo-cta-txt');
    const rings = $('.panel__rings');
    const sel = $('#f-motivo');
    if (!chips.length) return;
    chips.forEach((c) => c.addEventListener('click', () => {
      const key = c.dataset.motivo;
      chips.forEach((o) => o.setAttribute('aria-pressed', String(o === c)));
      slides.forEach((s) => s.classList.toggle('is-active', s.dataset.key === key));
      if (ctaTxt) ctaTxt.textContent = key.toLowerCase();
      if (cta) { cta.dataset.wa = 'Hola Mtro. Jesús, quiero hablar de: ' + key + '.'; bindWA(cta); }
      if (sel) { const opt = Array.from(sel.options).find((o) => o.value === key || o.text === key); if (opt) sel.value = opt.value; }
      if (rings) { rings.classList.remove('is-burst'); void rings.offsetWidth; rings.classList.add('is-burst'); }
    }));
  })();

  /* ---------------------------------------------------------
     Proceso: paso activo
     --------------------------------------------------------- */
  (function steps() {
    const list = $$('.step');
    if (!list.length || !('IntersectionObserver' in window)) return;
    const so = new IntersectionObserver((en) => {
      en.forEach((e) => { if (e.isIntersecting) { list.forEach((s) => s.classList.toggle('is-active', s === e.target)); } });
    }, { rootMargin: '-42% 0px -42% 0px' });
    list.forEach((s) => so.observe(s));
  })();

  /* ---------------------------------------------------------
     Horario: abierto ahora / próximo contacto
     --------------------------------------------------------- */
  (function hours() {
    const status = $('#status');
    const txt = $('#status-txt');
    if (!status || !txt) return;
    const names = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const sched = { 1: [9, 20], 2: [9, 20], 3: [9, 20], 4: [9, 20], 5: [9, 20], 6: [9, 14] };
    let day = 0, mins = 0;
    try {
      const parts = new Intl.DateTimeFormat('es-MX', { timeZone: 'America/Tijuana', weekday: 'long', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
      const get = (t) => (parts.find((p) => p.type === t) || {}).value || '';
      const wd = get('weekday').toLowerCase();
      day = Math.max(0, names.findIndex((n) => n.normalize('NFD').replace(/[̀-ͯ]/g, '') === wd.normalize('NFD').replace(/[̀-ͯ]/g, '')));
      mins = parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10);
    } catch (err) { return; }

    $$('.hours tr').forEach((tr) => {
      const days = (tr.dataset.days || '').split(',').map(Number);
      tr.classList.toggle('is-today', days.includes(day));
    });

    const today = sched[day];
    if (today && mins >= today[0] * 60 && mins < today[1] * 60) {
      status.classList.add('is-open');
      txt.textContent = 'Abierto ahora · atendemos hasta las ' + today[1] + ':00 h';
      return;
    }
    if (today && mins < today[0] * 60) { txt.textContent = 'Te respondemos hoy a las 9:00 h'; return; }
    for (let i = 1; i <= 7; i++) {
      const d = (day + i) % 7;
      if (sched[d]) {
        txt.textContent = 'Te respondemos ' + (i === 1 ? 'mañana' : 'el ' + names[d]) + ' a las 9:00 h';
        return;
      }
    }
  })();

  /* ---------------------------------------------------------
     Formulario → WhatsApp
     --------------------------------------------------------- */
  (function form() {
    const f = $('#form-contacto');
    if (!f) return;
    const nombre = $('#f-nombre');
    const err = $('#err-nombre');
    const status = $('#form-status');
    nombre.addEventListener('input', () => { nombre.parentNode.classList.remove('has-error'); err.textContent = ''; });
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const n = nombre.value.trim();
      if (!n) {
        nombre.parentNode.classList.add('has-error');
        err.textContent = '¿Cómo te llamas? Así puedo saludarte por tu nombre.';
        nombre.focus();
        return;
      }
      if (!waOK) { status.textContent = 'Por ahora llámanos al 664 608 0726 y con gusto te atendemos.'; return; }
      const motivo = $('#f-motivo').value;
      const horario = $('#f-horario').value;
      const extra = $('#f-mensaje').value.trim();
      const msg = 'Hola, soy ' + n + '. Me gustaría trabajar: ' + motivo + '. Horario: ' + horario + '.' + (extra ? ' ' + extra : '');
      status.textContent = 'Abriendo WhatsApp…';
      const w = window.open(waUrl(msg), '_blank', 'noopener');
      if (!w) window.location.href = waUrl(msg);
      setTimeout(() => { status.textContent = '¡Listo! Si no se abrió WhatsApp, toca el botón otra vez.'; }, 2600);
    });
  })();

  /* ---------------------------------------------------------
     Anillos del contacto (laten al enfocar el formulario)
     --------------------------------------------------------- */
  (function contactRings() {
    const cv = $('#anillos-contacto');
    const sec = $('#contacto');
    const f = $('#form-contacto');
    if (!cv || !sec || !cv.getContext) return;
    const ctx = cv.getContext('2d');
    let W = 0, H = 0, raf = 0, boost = 0, boostT = 0;
    const t0 = performance.now();
    function size() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function draw(now) {
      ctx.clearRect(0, 0, W, H);
      boost = lerp(boost, boostT, 0.05);
      const cx = W > 900 ? W * 0.74 : W * 0.5, cy = H * 0.5;
      const maxR = Math.max(W, H) * 0.55;
      const N = 9, step = maxR / N;
      const speed = 7000 - boost * 3200;
      const phase = (Math.max(0, now - t0) / speed) % 1;
      for (let i = 0; i <= N; i++) {
        const r = step * (i + phase) * (1 + Math.sin(now * 0.002 + i) * boost * 0.03);
        if (r <= 0) continue;
        const a = (1 - r / maxR) * (0.22 + boost * 0.32);
        if (a <= 0) continue;
        ctx.strokeStyle = 'rgba(201,162,75,' + a.toFixed(3) + ')';
        ctx.lineWidth = 1 + boost * 0.8;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.stroke();
      }
    }
    function loop(now) {
      if (!isVisible() || document.hidden) { raf = 0; return; }
      draw(now); raf = requestAnimationFrame(loop);
    }
    function start() { if (!raf && motion) raf = requestAnimationFrame(loop); }
    const isVisible = visibility(sec, (v) => { if (v) start(); });
    size();
    if (motion) start(); else draw(t0 + 2000);
    window.addEventListener('resize', () => { size(); if (!motion) draw(t0 + 2000); });
    document.addEventListener('visibilitychange', start);
    if (f) {
      f.addEventListener('focusin', () => { boostT = 1; });
      f.addEventListener('focusout', () => { boostT = 0; });
    }
  })();

  /* ---------------------------------------------------------
     Botón flotante de WhatsApp: etiqueta a los 4 s
     --------------------------------------------------------- */
  (function waLabel() {
    const fl = $('#wa-float');
    if (!fl || !waOK) return;
    setTimeout(() => fl.classList.add('is-open'), 4000);
    setTimeout(() => fl.classList.remove('is-open'), 10000);
    fl.addEventListener('pointerenter', () => fl.classList.add('is-open'));
    fl.addEventListener('pointerleave', () => fl.classList.remove('is-open'));
  })();

  onScroll();
})();
