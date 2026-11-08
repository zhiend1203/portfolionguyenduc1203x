import * as THREE from "./vendor/three.module.min.js";

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
gsap.registerPlugin(ScrollTrigger);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
// animation portfolio: always play full motion (many Windows setups report reduced-motion by default)
const reduce = false;
const isTouch = matchMedia("(hover: none)").matches;
const LOCAL_THUMBS = new Set(["14KowU4q7yDaDcYJJr0K9TenHLvE0dxbW","1DxalS9A7N2BsVqzw6k6r6VEufixnL3ID","1DxgHaNpg3jPo_-2VAzueRckdbaf8rinR","1KyuHOGzq-BxrHkb9ZgZx6OU465SgZZp8","1MKEZFfsvdsTBIX4P4s0gTMk07CMZwRlJ","1SpePFLN9b9yX-OH3CKsJaaAF_XH70Try","1XbeNOH6H1rD17PHiLUhVLBW8-GIDWm6O","1Zyn5rLpNbgC6eucnQrICIgMlI9VYEdkJ","1kJ2hXP4UB5pa4ECQUv3CaK5gUpN05mSb","1kRgpvGGBXjn2A38YcByheOMEmS9P6h0U","1rji8bBV8x95AjIt_Ctg-bk5eLApjM1Ep","1tyuo4lyjJrjMoJ6Oq0GFwYqOLu04mwQu","1w1QuAeAKIVO3tV0OTt9gY0C77cLK2AjN","1w5vckbquhzRmI1s8xl2kfmPQJSYA7dPZ"]);
const thumb = (id, w = 1000) => LOCAL_THUMBS.has(id) && w >= 1000 ? `thumbs/${id}.webp` : `https://drive.google.com/thumbnail?id=${id}&sz=w${w}`;
const preview = (id) => `https://drive.google.com/file/d/${id}/preview`;
const mouse = { x: 0, y: 0, sx: 0, sy: 0 };

$("#year").textContent = new Date().getFullYear();

/* ============================================================
   TEXT SPLITTING
   ============================================================ */
function splitChars(el) {
  const text = el.textContent;
  el.textContent = "";
  el.setAttribute("aria-label", text);
  return [...text].map((c) => {
    const s = document.createElement("span");
    s.className = "char";
    s.setAttribute("aria-hidden", "true");
    s.textContent = c === " " ? " " : c;
    el.appendChild(s);
    return s;
  });
}
function splitWords(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map((w) => `<span class="word">${w}</span>`).join(" ");
  return $$(".word", el);
}

/* ============================================================
   2D PHOTO CARD — squash & stretch, onion skin, flips on scroll
   ============================================================ */
const card = $("#pcard");
const ghosts = $$(".ghost");
const faces = $$(".glare");
// C = scroll-driven target state (x/y in viewport fractions)
const C = { x: -0.24, y: 0, s: 1, ry: 0, rz: -4, o: 1, sx: 1, sy: 1 };
const isWide = () => innerWidth > 760;
const P = {
  hero: () => isWide() ? { x: 0.3, y: 0.0, s: 1, ry: 0, rz: 5, o: 1 } : { x: 0.18, y: -0.24, s: 0.55, ry: 0, rz: 5, o: 1 },
  heroOut: () => ({ x: 0.3, y: -1.0, s: 0.8, ry: 90, rz: 20, o: 0 }),
  aboutIn: () => ({ x: -0.3, y: 1.0, s: 0.8, ry: 90, rz: -20, o: 0 }),
  about: () => isWide() ? { x: -0.24, y: 0.0, s: 1.1, ry: 180, rz: -4, o: 1 } : { x: 0, y: 0, s: 0.6, ry: 180, rz: -4, o: 0 },
  out: () => ({ x: -0.3, y: -1.0, s: 0.8, ry: 270, rz: -20, o: 0 })
};
const cur = { x: 0, y: 0, s: 1, ry: 0, rz: 0 };
const trail = ghosts.map(() => ({ x: 0, y: 0, s: 1, ry: 0, rz: 0 }));
let frame = 0;
function tf(t, rx = 0, extraY = 0) {
  return `translate3d(${t.x * innerWidth}px, ${t.y * innerHeight}px, 0) perspective(1200px) rotateX(${rx}deg) rotateY(${t.ry + extraY}deg) rotateZ(${t.rz}deg) scale(${t.s})`;
}
let hov = 0, hovT = 0;
card.addEventListener("pointerenter", () => { hovT = 1; card.classList.add("is-hover"); });
card.addEventListener("pointerleave", () => { hovT = 0; card.classList.remove("is-hover"); });
function renderCard() {
  mouse.sx = lerp(mouse.sx, mouse.x, 0.08);
  mouse.sy = lerp(mouse.sy, mouse.y, 0.08);
  const prev = { ...cur };
  for (const k of ["x", "y", "s", "ry", "rz"]) cur[k] = lerp(cur[k], C[k], 0.14);
  const speed = Math.abs(cur.x - prev.x) * 40 + Math.abs(cur.y - prev.y) * 40 + Math.abs(cur.ry - prev.ry) * 0.06;
  hov = lerp(hov, hovT, 0.12);
  const now = performance.now() / 1000;
  const idle = { ...cur, y: cur.y + Math.sin(now * 1.3) * 0.008 * (1 - hov), rz: cur.rz * (1 - hov) + Math.sin(now * 0.9) * 1.6 * (1 - hov), s: cur.s * (1 + 0.3 * hov) };
  const rx = mouse.sy * 9 * (1 - hov * 0.6), ty = mouse.sx * 14 * (1 - hov * 0.6);
  card.style.transform = tf(idle, rx, ty) + ` scale(${C.sx}, ${C.sy})`;
  card.style.opacity = C.o;
  trail.forEach((g, i) => {
    const f = 0.22 - i * 0.06;
    for (const k of ["x", "y", "s", "ry", "rz"]) g[k] = lerp(g[k], cur[k], f);
    ghosts[i].style.transform = tf(g, rx, ty);
    ghosts[i].style.opacity = clamp(speed, 0, 1) * (0.55 - i * 0.15) * C.o;
  });
  const gx = 50 + mouse.sx * 40 + "%", gy = 30 - mouse.sy * 40 + "%";
  faces.forEach((f) => { f.style.setProperty("--gx", gx); f.style.setProperty("--gy", gy); });
  frame++;
  if (frame % 2 === 0) {
    const fr = Math.floor(frame / 2);
    $("#tc").textContent = `00:00:${String(Math.floor(fr / 24) % 60).padStart(2, "0")}:${String(fr % 24).padStart(2, "0")}`;
  }
}
gsap.ticker.add(renderCard);

/* ============================================================
   PHYSICS BALLS (toolkit)
   ============================================================ */
function initBalls() {
  const canvas = $("#balls");
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  r.setPixelRatio(Math.min(devicePixelRatio, 2));
  r.outputColorSpace = THREE.SRGBColorSpace;
  const sc = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -1000, 1000);
  sc.add(new THREE.AmbientLight(0xffffff, 0.9));
  const d = new THREE.DirectionalLight(0xffffff, 2.2); d.position.set(-300, 400, 600); sc.add(d);
  const pv = new THREE.PointLight(0x8b5cf6, 3, 0, 0); pv.position.set(400, -300, 300); sc.add(pv);

  const items = [
    { img: "assets/moho.png", bg: "#ffffff", r: 1.25 },
    { img: "assets/ae.png", bg: "#0b0b1a", r: 1.05 },
    { img: "assets/pr.png", bg: "#0b0b1a", r: 1.0 },
    { img: "assets/ps.png", bg: "#0b0b1a", r: 0.95 },
    { img: "assets/ai.png", bg: "#0b0b1a", r: 0.9 },
    { text: "Rigging", bg: "#8b5cf6", fg: "#fff", r: 0.95 },
    { text: "Lip-sync", bg: "#f4f4f6", fg: "#0a0a0c", r: 0.85 },
    { text: "Blender", bg: "#16161c", fg: "#fff", r: 0.8 },
    { text: "Smart Bones", bg: "#c084fc", fg: "#0a0a0c", r: 0.9 },
    { text: "Storyboard", bg: "#16161c", fg: "#c084fc", r: 0.85 },
    { text: "4K", bg: "#f4f4f6", fg: "#0a0a0c", r: 0.6 },
    { text: "Shorts", bg: "#8b5cf6", fg: "#fff", r: 0.7 },
    { text: "TVC", bg: "#16161c", fg: "#fff", r: 0.65 }
  ];
  const geo = new THREE.SphereGeometry(1, 48, 32);
  const balls = items.map((it) => {
    const cv = document.createElement("canvas");
    cv.width = 512; cv.height = 256;
    const c = cv.getContext("2d");
    c.fillStyle = it.bg; c.fillRect(0, 0, 512, 256);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    if (it.img) {
      const im = new Image();
      im.onload = () => {
        const s = 96 / Math.max(im.width, im.height);
        c.drawImage(im, 128 - (im.width * s) / 2, 128 - (im.height * s) / 2, im.width * s, im.height * s);
        tex.needsUpdate = true;
      };
      im.src = it.img;
    } else {
      c.fillStyle = it.fg;
      c.textAlign = "center"; c.textBaseline = "middle";
      const fs = it.text.length > 8 ? 26 : it.text.length > 4 ? 32 : 44;
      c.font = `700 ${fs}px "Space Grotesk", sans-serif`;
      c.fillText(it.text, 128, 128);
    }
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.32, metalness: 0.05 }));
    sc.add(m);
    return { m, k: it.r, R: 0, x: 0, y: 0, vx: 0, vy: 0, rot: 0 };
  });

  let W = 1, H = 1, active = false, visible = false, raf = 0;
  const ptr = { x: 9999, y: 9999 };
  function size() {
    W = canvas.clientWidth; H = canvas.clientHeight;
    r.setSize(W, H, false);
    cam.left = -W / 2; cam.right = W / 2; cam.top = H / 2; cam.bottom = -H / 2;
    cam.updateProjectionMatrix();
    const base = Math.min(W, H) / 9.5;
    balls.forEach((b) => { b.R = base * b.k; b.m.scale.setScalar(b.R); });
  }
  function drop() {
    balls.forEach((b, i) => {
      b.x = (Math.random() - 0.5) * W * 0.8;
      b.y = H / 2 + b.R + i * 25 + Math.random() * 60; b.in = false;
      b.vx = 0; b.vy = -4;
    });
    active = true;
  }
  function step() {
    for (const b of balls) {
      // float toward centre (gravity-free, like the reference)
      b.vx += -b.x * 0.0016;
      b.vy += -(b.y + H * 0.06) * 0.002 - (b.y > H / 2 ? 0.6 : 0);
      const dx = b.x - ptr.x, dy = b.y - ptr.y, dist = Math.hypot(dx, dy), rr = b.R + 90;
      if (dist < rr && dist > 0.01) { const f = ((rr - dist) / rr) * 2.2; b.vx += (dx / dist) * f; b.vy += (dy / dist) * f; }
      b.vx *= 0.96; b.vy *= 0.96;
      b.x += b.vx; b.y += b.vy;
      const lim = W / 2 - b.R;
      if (b.x < -lim) { b.x = -lim; b.vx *= -0.6; }
      if (b.x > lim) { b.x = lim; b.vx *= -0.6; }
      if (b.y < -H / 2 + b.R) { b.y = -H / 2 + b.R; b.vy *= -0.6; }
      if (b.y < H / 2 - b.R) b.in = true;
      if (b.in && b.y > H / 2 - b.R) { b.y = H / 2 - b.R; b.vy *= -0.6; }
    }
    for (let i = 0; i < balls.length; i++) for (let j = i + 1; j < balls.length; j++) {
      const a = balls[i], b = balls[j];
      const dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy) || 0.01, min = a.R + b.R;
      if (dist < min) {
        const nx = dx / dist, ny = dy / dist, push = (min - dist) / 2;
        a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
        const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (rv < 0) { const imp = -rv * 0.8; a.vx -= nx * imp / 2; a.vy -= ny * imp / 2; b.vx += nx * imp / 2; b.vy += ny * imp / 2; }
      }
    }
    for (const b of balls) {
      b.rot += (-b.vx * 0.04 - b.rot) * 0.1; // gentle tilt only, text stays upright
      b.m.position.set(b.x, b.y, 0);
      b.m.rotation.set(clamp(b.vy * 0.01, -0.35, 0.35), 0, clamp(b.rot, -0.4, 0.4));
    }
  }
  function loop() {
    raf = visible ? requestAnimationFrame(loop) : 0;
    if (active) step();
    r.render(sc, cam);
  }
  canvas.parentElement.addEventListener("pointermove", (e) => {
    const rc = canvas.getBoundingClientRect();
    ptr.x = e.clientX - rc.left - W / 2; ptr.y = -(e.clientY - rc.top - H / 2);
  });
  canvas.parentElement.addEventListener("pointerleave", () => { ptr.x = ptr.y = 9999; });
  addEventListener("resize", size);
  size();
  balls.forEach((b) => b.m.position.set(0, H, 0));
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !raf) loop();
  }).observe(canvas);
  function hide() { active = false; balls.forEach((b, i) => { b.x = 0; b.y = H + b.R * 2 + i * 40; b.vx = b.vy = 0; b.rot = 0; b.m.position.set(b.x, b.y, 0); }); r.render(sc, cam); }
  return { drop, hide };
}


/* ============================================================
   v3: reel-first editorial page with smooth scroll + reveals
   ============================================================ */
$("#year").textContent = new Date().getFullYear();
const heroChars = $$("[data-hero-title]").flatMap(splitChars);
const contactChars = $$("[data-contact]").flatMap(splitChars);

// ---------- data
const PR = window.PROJECTS;
const TH = (id) => thumb(id);
const FEATURED = [
  { id: "1Zyn5rLpNbgC6eucnQrICIgMlI9VYEdkJ", t: "Vietnam Airlines", m: "TVC · 2D animation", chips: ["Moho", "After Effects", "Character"], v: "media/p-vna", pos: "1 / 8", row: "1 / 3" },
  { id: "14KowU4q7yDaDcYJJr0K9TenHLvE0dxbW", t: "Techcombank", m: "Commercial · motion + 2D", chips: ["After Effects", "Compositing"], v: "media/p-techcombank", pos: "8 / 13", row: "1 / 5", tall: true },
  { id: "1XbeNOH6H1rD17PHiLUhVLBW8-GIDWm6O", t: "Ghidora Tank", m: "YouTube · tank animation", chips: ["Moho rig", "FX", "Action"], v: "media/p-ghidora", pos: "1 / 8", row: "3 / 5" },
  { id: "1DxgHaNpg3jPo_-2VAzueRckdbaf8rinR", t: "YOBEVE", m: "TVC · product animation", chips: ["After Effects", "Product"], v: "media/p-yobeve", pos: "1 / 6", row: "5 / 9", tall: true },
  { id: "1tyuo4lyjJrjMoJ6Oq0GFwYqOLu04mwQu", t: "Story Series 1–4", m: "YouTube · storytelling", chips: ["Moho", "Lip-sync", "Acting"], v: "media/p-team14", pos: "6 / 13", row: "5 / 7" },
  { id: "1KyuHOGzq-BxrHkb9ZgZx6OU465SgZZp8", t: "Boss 2 — Rig", m: "Moho rig preview", chips: ["Smart bones", "Rigging"], v: "media/p-boss2", pos: "6 / 13", row: "7 / 9" },
  { id: "1QOR2BNpA0f_xIs5vciOwFhdB2eXqiswy", t: "Stickman Ep. 1", m: "YouTube · stickman series", chips: ["Moho", "Reusable rigs"], v: null, pos: "1 / 8", row: "9 / 11" },
  { id: "1l5wa7Gk-jXt6weyRFiguFhA5hlL3QZi6", t: "Short #60", m: "YouTube Shorts · 9:16", chips: ["Shorts", "Character"], v: "media/p-short60", pos: "8 / 13", row: "9 / 13", tall: true, short: true },
  { id: "1w5vckbquhzRmI1s8xl2kfmPQJSYA7dPZ", t: "Story Ep. 0225", m: "YouTube · storytelling", chips: ["Moho", "Acting"], v: "reel/team0225", pos: "1 / 8", row: "11 / 13" }
];
$("#selGrid").innerHTML = FEATURED.map((p, i) => `
  <article class="fw${p.tall ? " fw--tall" : ""}" style="grid-column:${p.pos};grid-row:${p.row}" data-video="${p.id}" data-title="${p.t}"${p.short ? ' data-short="1"' : ""}>
    <div class="fw__media">
      <img alt="${p.t}" loading="lazy" src="${p.v ? p.v + ".jpg" : TH(p.id)}" />
      ${p.v ? `<video muted loop playsinline preload="none" src="${p.v}.mp4"></video>` : ""}
    </div>
    <span class="fw__play">▶</span>
    <div class="fw__info">
      <span class="fw__n">${String(i + 1).padStart(2, "0")}</span>
      <h3 class="fw__t">${p.t}</h3>
      <span class="fw__m">${p.m}</span>
      <div class="fw__chips">${p.chips.map((c) => `<em>${c}</em>`).join("")}</div>
    </div>
  </article>`).join("");

const ARCH = [
  ...PR.commercial.map((p) => ({ ...p, f: "commercial", tag: p.tag || "Commercial" })),
  ...(PR.tank || []).map((p) => ({ ...p, f: "tank" })),
  ...PR.series.map((p) => ({ ...p, f: p.cat === "shorts" ? "shorts" : "series", tag: p.cat === "shorts" ? "Short" : p.cat === "stickman" ? "Stickman" : "Storytelling" }))
];
$("#archGrid").innerHTML = ARCH.map((p) => `
  <article class="ac" data-f="${p.f}" data-video="${p.id}" data-title="${p.title}"${p.f === "shorts" ? ' data-short="1"' : ""}>
    <div class="ac__m"><span class="ac__fb">${p.title}</span><img alt="${p.title}" loading="lazy" src="${TH(p.id)}" onerror="this.remove()" /></div>
    <div class="ac__meta"><b>${p.title}</b><span>${p.tag || ""}</span></div>
  </article>`).join("");
$$("#tabs button").forEach((b) => b.addEventListener("click", () => {
  $$("#tabs button").forEach((x) => x.classList.toggle("is-on", x === b));
  const f = b.dataset.f, cards = $$(".ac");
  gsap.to(cards, { opacity: 0, scale: 0.92, duration: 0.2, onComplete: () => {
    cards.forEach((c) => (c.style.display = f === "all" || c.dataset.f === f ? "" : "none"));
    const vis = cards.filter((c) => c.style.display !== "none");
    gsap.fromTo(vis, { opacity: 0, y: 30, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.03, ease: "back.out(1.6)" });
    ScrollTrigger.refresh();
  } });
}));


const modal = $("#modal"), media = $("#modalMedia"), mTitle = $("#modalTitle"), mBox = $(".modal__box");
let lenis;
function openModal(id, title, short) {
  media.innerHTML = `<iframe src="${preview(id)}" allow="autoplay; fullscreen" allowfullscreen title="${title}"></iframe>`;
  mTitle.textContent = title;
  mBox.classList.toggle("is-short", !!short);
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  lenis && lenis.stop();
}
function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  setTimeout(() => (media.innerHTML = ""), 300);
  lenis && lenis.start();
}
document.addEventListener("click", (e) => {
  const v = e.target.closest("[data-video]");
  if (v) { e.preventDefault(); openModal(v.dataset.video, v.dataset.title, v.dataset.short); return; }
  if (e.target.closest("[data-close]")) closeModal();
});
addEventListener("keydown", (e) => e.key === "Escape" && closeModal());

/* ============================================================
   CURSOR / MOUSE / MAGNETIC
   ============================================================ */
const cursor = $(".cursor");
addEventListener("pointermove", (e) => {
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -((e.clientY / innerHeight) * 2 - 1);
  if (!isTouch) gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.25, ease: "power3.out", overwrite: true });
});
document.addEventListener("pointerover", (e) => {
  cursor.classList.toggle("is-hover", !!e.target.closest("a, button, [data-video]"));
});
$$(".magnetic").forEach((el) => {
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.35, y: (e.clientY - r.top - r.height / 2) * 0.35, duration: 0.4, ease: "power3.out" });
  });
  el.addEventListener("pointerleave", () => gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" }));
});
$$(".svc").forEach((el) => el.addEventListener("pointermove", (e) => {
  const r = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${e.clientX - r.left}px`);
  el.style.setProperty("--my", `${e.clientY - r.top}px`);
}));

// ---- ambient particles: keyframe diamonds, dots and crosses drifting; dodge cursor; surge on page change
(() => {
  const cv = $("#fx"), cx = cv.getContext("2d");
  let W, H, dpr;
  const P = [];
  const size = () => { dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size(); addEventListener("resize", size);
  const N = Math.round(Math.min(110, (innerWidth * innerHeight) / 26000));
  for (let i = 0; i < N; i++) P.push({ x: Math.random() * W, y: Math.random() * H, z: 0.3 + Math.random() * 0.9, k: i % 3, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.02, vx: 0, vy: 0 });
  let lastY = 0;
  gsap.ticker.add(() => {
    const sy = window.scrollY, surge = (sy - lastY) * 0.35; lastY = sy;
    const mx = (mouse.x * 0.5 + 0.5) * W, my = (-mouse.y * 0.5 + 0.5) * H;
    cx.clearRect(0, 0, W, H);
    for (const p of P) {
      p.vy += (-0.12 * p.z - p.vy) * 0.05 - surge * 0.02 * p.z;
      p.vx += (Math.sin((p.y + p.r * 50) * 0.004) * 0.15 - p.vx) * 0.05;
      const dx = p.x - mx, dy = p.y - my, d = Math.hypot(dx, dy);
      if (d < 140) { p.vx += (dx / d) * 0.6; p.vy += (dy / d) * 0.6; }
      p.x += p.vx; p.y += p.vy; p.r += p.vr + p.vx * 0.01;
      if (p.y < -20) { p.y = H + 20; p.x = Math.random() * W; } if (p.y > H + 20) { p.y = -20; p.x = Math.random() * W; }
      if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
      const a = 0.15 + 0.35 * p.z, s = 2 + p.z * 4;
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.globalAlpha = a;
      if (p.k === 0) { cx.fillStyle = "#c084fc"; cx.fillRect(-s / 2, -s / 2, s, s); }
      else if (p.k === 1) { cx.fillStyle = "#ffffff"; cx.beginPath(); cx.arc(0, 0, s * 0.35, 0, 7); cx.fill(); }
      else { cx.strokeStyle = "#8b5cf6"; cx.lineWidth = 1.2; cx.beginPath(); cx.moveTo(-s, 0); cx.lineTo(s, 0); cx.moveTo(0, -s); cx.lineTo(0, s); cx.stroke(); }
      cx.restore();
    }
  });
})();

// ---- contact reel: clips slide in every 4s with rotating mask shapes
const REEL = (() => {
  const items = [
    ["vna-1", "Vietnam Airlines", "1Zyn5rLpNbgC6eucnQrICIgMlI9VYEdkJ"], ["ghidora-1", "Ghidora Tank", "1XbeNOH6H1rD17PHiLUhVLBW8-GIDWm6O"],
    ["team14", "Team Project 1–4", "1tyuo4lyjJrjMoJ6Oq0GFwYqOLu04mwQu"], ["boss2", "Boss 2 — Rig preview", "1KyuHOGzq-BxrHkb9ZgZx6OU465SgZZp8"],
    ["vna-2", "Vietnam Airlines", "1Zyn5rLpNbgC6eucnQrICIgMlI9VYEdkJ"], ["team0225", "Team Project 0225", "1w5vckbquhzRmI1s8xl2kfmPQJSYA7dPZ"],
    ["ghidora-2", "Ghidora Tank", "1XbeNOH6H1rD17PHiLUhVLBW8-GIDWm6O"], ["outro", "Outro", "1w1QuAeAKIVO3tV0OTt9gY0C77cLK2AjN"]
  ];
  const masks = [
    ["circle(0% at 72% 50%)", "circle(150% at 72% 50%)"],
    ["polygon(0% 0%, 0% 0%, -40% 100%, -40% 100%)", "polygon(0% 0%, 140% 0%, 100% 100%, -40% 100%)"],
    ["inset(50% 0% 50% 0%)", "inset(0% 0% 0% 0%)"],
    ["inset(0% 0% 0% 100%)", "inset(0% 0% 0% 0%)"],
    ["polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)", "polygon(-50% -50%, 150% -50%, 150% 150%, -50% 150%)"]
  ];
  const stage = $("#reelStage"), reel = $("#reel");
  const slides = items.map(([f]) => {
    const d = document.createElement("div");
    d.className = "reel__slide";
    d.innerHTML = `<video muted playsinline preload="none" poster="reel/${f}.jpg" src="reel/${f}.mp4"></video>`;
    stage.appendChild(d);
    return d;
  });
  let idx = -1, z = 1, timer = null, running = false;
  function go(n) {
    const prev = slides[idx];
    idx = (n + slides.length) % slides.length;
    const s = slides[idx], v = s.querySelector("video"), [a, b] = masks[idx % masks.length];
    s.style.zIndex = ++z;
    v.muted = true; v.preload = "auto"; v.currentTime = 0; v.play().catch(() => {});
    const nx = slides[(idx + 1) % slides.length].querySelector("video"); nx.preload = "auto";
    gsap.fromTo(s, { clipPath: a }, { clipPath: b, duration: 1.1, ease: "power4.inOut" });
    gsap.fromTo(v, { scale: 1.3 }, { scale: 1, duration: 1.6, ease: "power3.out" });
    if (prev) { const pv = prev.querySelector("video"); gsap.to(pv, { scale: 1.1, duration: 1.1, ease: "power2.in" }); gsap.delayedCall(1.2, () => { pv.pause(); }); }
    $("#reelN").textContent = `${String(idx + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
    gsap.fromTo("#reelT", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, delay: 0.4 });
    $("#reelT").textContent = items[idx][1];
    reel.dataset.video = items[idx][2]; reel.dataset.title = items[idx][1];
    gsap.fromTo("#reelBar", { scaleX: 0 }, { scaleX: 1, duration: 4, ease: "none" });
    clearTimeout(timer);
    if (running) timer = setTimeout(() => go(idx + 1), 4000);
  }
  return {
    start() { if (running) return; running = true; go(idx + 1); },
    stop() { running = false; clearTimeout(timer); slides.forEach((s) => s.querySelector("video").pause()); }
  };
})();


/* ---------- featured: play previews while in view (continuous motion), restart on hover */
const io = new IntersectionObserver((ents) => ents.forEach((e) => {
  const v = e.target.querySelector("video"); if (!v) return;
  if (e.isIntersecting) { v.preload = "auto"; v.muted = true; v.play().then(() => e.target.classList.add("is-playing")).catch(() => {}); }
  else { v.pause(); }
}), { threshold: 0.35 });
$$(".fw").forEach((el) => {
  io.observe(el);
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect(), dx = (e.clientX - r.left) / r.width - 0.5, dy = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(el, { rotateY: dx * 6, rotateX: -dy * 6, transformPerspective: 1200, duration: 0.6, ease: "power3.out" });
  });
  el.addEventListener("pointerleave", () => gsap.to(el, { rotateY: 0, rotateX: 0, duration: 0.9, ease: "elastic.out(1, 0.5)" }));
});

/* ---------- hero video timecode */
const heroVid = $("#heroVid");
gsap.ticker.add(() => {
  const t = heroVid.currentTime || 0;
  $("#heroTc").textContent = `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(Math.floor(t % 60)).padStart(2, "0")}:${String(Math.floor((t % 1) * 24)).padStart(2, "0")}`;
});
heroVid.play().catch(() => {});
addEventListener("pointerdown", () => heroVid.paused && heroVid.play().catch(() => {}), { passive: true });

/* ---------- card path follows the page */
let stops = [], ready = false;
const tops = (sel) => $(sel).getBoundingClientRect().top + scrollY;
function buildStops() {
  const vh = innerHeight, a = tops("#about"), ah = $(".abt__grid").offsetHeight;
  stops = [[0, P.hero()], [vh * 0.75, P.heroOut()], [a - vh * 0.9, P.aboutIn()], [a - vh * 0.05, P.about()], [a + ah - vh * 0.75, P.about()], [a + ah - vh * 0.1, P.out()]];
}
gsap.ticker.add(() => {
  if (!ready) return;
  const y = scrollY;
  let i = 0;
  while (i < stops.length - 2 && y > stops[i + 1][0]) i++;
  const [a, A] = stops[i], [b, B] = stops[i + 1];
  const t = gsap.parseEase("power2.inOut")(clamp((y - a) / Math.max(1, b - a)));
  for (const k of ["x", "y", "s", "ry", "rz", "o"]) C[k] = lerp(A[k], B[k], t);
  card.classList.toggle("is-off", C.o < 0.3);
  const p = y / Math.max(1, document.documentElement.scrollHeight - innerHeight);
  card.style.setProperty("--p", p.toFixed(3));
  $("#frameNo").textContent = String(Math.round(p * 240) + 1).padStart(3, "0");
});

/* ---------- scroll reveals */
function initScroll() {
  buildStops(); ready = true;
  ScrollTrigger.addEventListener("refresh", buildStops);

  // hero parallax out
  gsap.to(".hx__media video", { yPercent: 18, scale: 1.15, ease: "none", scrollTrigger: { trigger: ".hx", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".hx__copy", { y: -120, opacity: 0, ease: "none", scrollTrigger: { trigger: ".hx", start: "30% top", end: "90% top", scrub: true } });

  // marquee speed from scroll velocity
  const track = $("#marquee"); let mx = 0, boost = 0, dir = 1;
  ScrollTrigger.create({ onUpdate: (self) => { dir = self.direction; boost = Math.min(Math.abs(self.getVelocity()) / 120, 30); } });
  gsap.ticker.add(() => { const half = track.scrollWidth / 2; mx -= (1.2 + boost) * dir; boost *= 0.92; if (mx <= -half) mx += half; if (mx > 0) mx -= half; track.style.transform = `translate3d(${mx}px,0,0)`; });

  // big titles flip in
  $$(".split-scrub").forEach((el) => {
    const ch = splitChars(el);
    gsap.fromTo(ch, { yPercent: 110, rotateX: -90, opacity: 0 }, { yPercent: 0, rotateX: 0, opacity: 1, transformOrigin: "50% 100%", duration: 0.8, stagger: 0.035, ease: "back.out(1.7)",
      scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none reverse" } });
  });
  // generic reveals
  ScrollTrigger.batch("[data-reveal], .kicker", { start: "top 90%", onEnter: (els) => gsap.fromTo(els, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: "power3.out" }) });
  // featured tiles: mask open + rise
  $$(".fw").forEach((el, i) => {
    gsap.fromTo(el, { clipPath: "inset(30% 10% 0% 10% round 20px)", y: 120, opacity: 0 }, { clipPath: "inset(0% 0% 0% 0% round 20px)", y: 0, opacity: 1, duration: 1.2, ease: "power4.out",
      scrollTrigger: { trigger: el, start: "top 92%" } });
    gsap.fromTo(el.querySelector(".fw__media"), { yPercent: -8 }, { yPercent: 8, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
  });
  // archive cards
  ScrollTrigger.batch(".ac", { start: "top 95%", onEnter: (els) => gsap.fromTo(els, { y: 50, opacity: 0, rotate: 3 }, { y: 0, opacity: 1, rotate: 0, duration: 0.7, stagger: 0.05, ease: "back.out(1.5)" }) });
  // about words + counters + services rows
  const words = splitWords($(".scrub-words"));
  gsap.fromTo(words, { opacity: 0.12 }, { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: ".about__text", start: "top 80%", end: "bottom 45%", scrub: true } });
  $$("[data-count]").forEach((el) => {
    const n = { v: 0 }, end = +el.dataset.count, suf = el.dataset.suffix || "";
    ScrollTrigger.create({ trigger: el, start: "top 90%", onEnter: () => gsap.fromTo(n, { v: 0 }, { v: end, duration: 1.6, ease: "power2.out", onUpdate: () => (el.textContent = Math.round(n.v) + suf) }) });
  });
  gsap.fromTo(".svcx div", { x: 60, opacity: 0 }, { x: 0, opacity: 1, stagger: 0.12, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: ".svcx", start: "top 85%" } });
  // toolkit balls drop on enter
  ScrollTrigger.create({ trigger: "#tools", start: "top 70%", onEnter: () => balls && balls.drop(), onEnterBack: () => balls && balls.drop(), onLeave: () => balls && balls.hide(), onLeaveBack: () => balls && balls.hide() });
  // process line + steps
  gsap.to(".proc__line i", { scaleX: 1, ease: "none", scrollTrigger: { trigger: ".proc__row", start: "top 80%", end: "top 35%", scrub: true } });
  $$(".pstep").forEach((el, i) => {
    gsap.fromTo(el, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, delay: i * 0.12, ease: "back.out(1.6)", scrollTrigger: { trigger: ".proc__row", start: "top 80%" } });
    ScrollTrigger.create({ trigger: ".proc__row", start: `top ${78 - i * 12}%`, onEnter: () => el.classList.add("is-on"), onLeaveBack: () => el.classList.remove("is-on") });
  });
  // contact
  gsap.fromTo(contactChars, { yPercent: 110 }, { yPercent: 0, duration: 0.9, stagger: 0.035, ease: "power4.out", scrollTrigger: { trigger: ".contact__title", start: "top 85%" } });
  gsap.fromTo(".cta", { scale: 0, rotate: -180 }, { scale: 1, rotate: 0, duration: 1, ease: "elastic.out(1, 0.5)", scrollTrigger: { trigger: ".cta", start: "top 92%" } });
  gsap.fromTo("#reel", { clipPath: "inset(0% 0% 100% 0% round 22px)" }, { clipPath: "inset(0% 0% 0% 0% round 22px)", duration: 1.1, ease: "power4.inOut", scrollTrigger: { trigger: ".cx", start: "top 70%" } });
  ScrollTrigger.create({ trigger: ".cx", start: "top 60%", end: "bottom top", onToggle: (st) => (st.isActive ? REEL.start() : REEL.stop()) });
  // progress + nav
  gsap.to("#progress", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: true } });
  $$(".nav__links a").forEach((a) => {
    const sec = $(a.getAttribute("href"));
    ScrollTrigger.create({ trigger: sec, start: "top 50%", end: "bottom 50%", onToggle: (st) => a.classList.toggle("is-active", st.isActive) });
  });
  ScrollTrigger.refresh();
}

function startLenis() {
  lenis = new window.Lenis({ lerp: 0.085 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); lenis.scrollTo(a.getAttribute("href"), { duration: 1.6 }); }));
}

/* ---------- boot */
let balls = initBalls();
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.scrollTo(0, 0);
const load = { v: 0 };
gsap.set(heroChars, { yPercent: 110 });
gsap.set("[data-hero]", { opacity: 0, y: 20 });
Object.assign(C, P.hero(), { y: -1.2, rz: 14, sx: 0.8, sy: 1.3 });
Object.assign(cur, C); trail.forEach((g) => Object.assign(g, C));
gsap.timeline()
  .to(load, { v: 100, duration: 1.3, ease: "power2.inOut", onUpdate: () => { $("#loadNum").textContent = Math.round(load.v); $("#loadBar").style.width = load.v + "%"; } })
  .to(".loader", { yPercent: -100, duration: 0.9, ease: "power4.inOut" })
  .add(() => { document.body.classList.remove("is-loading"); $(".loader").remove(); startLenis(); }, "-=0.3")
  .to(C, { y: P.hero().y, rz: P.hero().rz, duration: 0.55, ease: "power2.in" }, "-=0.2")
  .to(C, { sx: 1.22, sy: 0.74, duration: 0.09, ease: "power1.out" })
  .to(C, { sx: 1, sy: 1, duration: 0.9, ease: "elastic.out(1.1, 0.35)" })
  .to(heroChars, { yPercent: 0, duration: 1.1, ease: "power4.out", stagger: 0.035 }, "-=1.1")
  .to("[data-hero]", { opacity: 1, y: 0, duration: 0.8, stagger: 0.1 }, "<0.3")
  .add(initScroll);
