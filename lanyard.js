// Hanging ID badge on a lanyard — 2D verlet rope physics, draggable.
window.Lanyard = function (container, card, canvas) {
  const ctx = canvas.getContext("2d");
  const SEGMENTS = 14;
  const G = 0.55;          // gravity (px / frame²)
  const DAMP = 0.975;      // velocity damping
  const MAXV = 22;         // max px per frame (prevents wild flings)
  const ITER = 24;         // constraint iterations
  let W = 0, H = 0, dpr = 1, seg = 20, cardW = 230, cardH = 300, comDist = 160;
  let pts = [], body = null, anchor = { x: 0, y: -30 };
  let running = false, visible = true, dragging = false, grab = { x: 0, y: 0 }, pointer = { x: 0, y: 0 };

  function measure() {
    const r = container.getBoundingClientRect();
    W = r.width; H = r.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr; canvas.height = H * dpr;
    cardW = card.offsetWidth; cardH = card.offsetHeight;
    comDist = cardH * 0.55;
    const ropeLen = Math.max(140, Math.min(H * 0.42, 300));
    seg = ropeLen / SEGMENTS;
    anchor = { x: W * 0.5, y: -30 };
  }

  function reset(hidden) {
    pts = [];
    for (let i = 0; i <= SEGMENTS; i++) {
      // start folded up and to the side so it swings in when released
      const x = hidden ? anchor.x - i * seg * 0.75 : anchor.x;
      const y = hidden ? anchor.y - i * seg * 0.66 : anchor.y + i * seg;
      pts.push({ x, y, px: x, py: y });
    }
    const last = pts[SEGMENTS];
    body = { x: last.x - (hidden ? comDist : 0), y: last.y + (hidden ? 0 : comDist), px: 0, py: 0 };
    body.px = body.x; body.py = body.y;
  }

  function integrate(p, damp = DAMP) {
    const clamp = (v) => Math.max(-MAXV, Math.min(MAXV, v));
    const vx = clamp((p.x - p.px) * damp), vy = clamp((p.y - p.py) * damp);
    p.px = p.x; p.py = p.y;
    p.x += vx; p.y += vy + G;
  }

  function solve(a, b, len, wa, wb) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const d = Math.hypot(dx, dy) || 0.0001;
    const diff = (d - len) / d;
    a.x += dx * diff * wa; a.y += dy * diff * wa;
    b.x -= dx * diff * wb; b.y -= dy * diff * wb;
  }

  function step() {
    for (let i = 1; i <= SEGMENTS; i++) integrate(pts[i]);
    integrate(body, 0.962);
    const last = pts[SEGMENTS];
    for (let k = 0; k < ITER; k++) {
      pts[0].x = anchor.x; pts[0].y = anchor.y;
      for (let i = 0; i < SEGMENTS; i++) solve(pts[i], pts[i + 1], seg, i === 0 ? 0 : 0.5, 0.5);
      solve(last, body, comDist, 0.35, 0.65);
      if (dragging) {
        // pin the badge to the pointer, but never further than the strap can reach (no slingshot on release)
        let tx = pointer.x + grab.x, ty = pointer.y + grab.y;
        const ax = tx - anchor.x, ay = ty - anchor.y, d = Math.hypot(ax, ay), max = seg * SEGMENTS * 0.98;
        if (d > max) { tx = anchor.x + ax / d * max; ty = anchor.y + ay / d * max; }
        last.x = tx; last.y = ty;
      }
      // keep inside the container (loosely)
      body.x = Math.max(cardW * 0.3, Math.min(W - cardW * 0.3, body.x));
      body.y = Math.min(H - 20, Math.max(40, body.y));
      last.y = Math.max(10, last.y);
      body.y = Math.max(body.y, last.y + comDist * 0.25); // never flip over the top
    }
  }

  function render() {
    const last = pts[SEGMENTS];
    const dx = body.x - last.x, dy = body.y - last.y;
    const ang = Math.atan2(-dx, dy);
    card.style.transform = `translate(${last.x - cardW / 2}px, ${last.y}px) rotate(${ang}rad)`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < SEGMENTS; i++) {
        const mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
      }
      ctx.lineTo(last.x, last.y - 6);
    };
    path(); ctx.strokeStyle = "#000"; ctx.lineWidth = 17; ctx.stroke();
    path(); ctx.strokeStyle = "#1b1b1b"; ctx.lineWidth = 13; ctx.stroke();
    // printed marks along the strap
    ctx.fillStyle = "rgba(255,255,255,.55)";
    for (let i = 1; i < SEGMENTS - 1; i += 2) {
      const a = pts[i], b = pts[i + 1];
      ctx.save();
      ctx.translate((a.x + b.x) / 2, (a.y + b.y) / 2);
      ctx.rotate(Math.atan2(b.y - a.y, b.x - a.x));
      ctx.fillRect(-seg * 0.3, -1.5, seg * 0.6, 3);
      ctx.restore();
    }
  }

  function loop() {
    if (!running) return;
    if (visible) { step(); render(); }
    requestAnimationFrame(loop);
  }

  function local(e) {
    const r = container.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  card.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    dragging = true;
    card.classList.add("is-drag");
    card.setPointerCapture(e.pointerId);
    pointer = local(e);
    const last = pts[SEGMENTS];
    grab = { x: last.x - pointer.x, y: last.y - pointer.y };
    container.dispatchEvent(new CustomEvent("lanyard:grab"));
  });
  card.addEventListener("pointermove", (e) => { if (dragging) pointer = local(e); });
  const release = () => { dragging = false; card.classList.remove("is-drag"); };
  card.addEventListener("pointerup", release);
  card.addEventListener("pointercancel", release);

  new IntersectionObserver(([en]) => (visible = en.isIntersecting)).observe(container);

  let rT;
  window.addEventListener("resize", () => {
    clearTimeout(rT);
    rT = setTimeout(() => { const oldW = W; measure(); if (Math.abs(oldW - W) > 40) reset(false); }, 150);
  });

  measure();
  reset(true);
  render();

  return {
    drop() { if (!running) { running = true; loop(); } },
    settle() { reset(false); render(); }
  };
};
