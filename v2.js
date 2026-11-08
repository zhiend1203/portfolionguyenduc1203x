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
const VH = () => (window.visualViewport ? Math.min(window.innerHeight, visualViewport.height) : window.innerHeight);
const setVH = () => document.documentElement.style.setProperty("--vvh", VH() + "px");
setVH(); addEventListener("resize", setVH); window.visualViewport && visualViewport.addEventListener("resize", setVH);
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
  hero: () => isWide() ? { x: -0.24, y: 0, s: 1, ry: 0, rz: -4, o: 1 } : { x: 0, y: -0.16, s: 0.75, ry: 0, rz: -3, o: 1 },
  about: () => isWide() ? { x: -0.27, y: 0.02, s: 1, ry: 180, rz: 3, o: 1 } : { x: 0, y: -0.2, s: 0.6, ry: 180, rz: 3, o: 0.25 },
  services: () => isWide() ? { x: -0.25, y: 0.13, s: 0.9, ry: 360, rz: -6, o: 1 } : { x: 0.25, y: 0.3, s: 0.4, ry: 360, rz: -8, o: 0.3 },
  process: () => isWide() ? { x: -0.34, y: 0.14, s: 0.8, ry: 540, rz: 5, o: 1 } : { x: 0.3, y: 0.3, s: 0.4, ry: 540, rz: 5, o: 0 },
  out: () => isWide() ? { x: 0.39, y: 0.12, s: 0.52, ry: 540, rz: -4, o: 1 } : { x: 0.28, y: 0.3, s: 0.38, ry: 540, rz: -4, o: 1 }
};
const cur = { x: 0, y: 0, s: 1, ry: 0, rz: 0 };
const trail = ghosts.map(() => ({ x: 0, y: 0, s: 1, ry: 0, rz: 0 }));
let frame = 0;
function tf(t, rx = 0, extraY = 0) {
  return `translate3d(${t.x * innerWidth}px, ${t.y * VH()}px, 0) perspective(1200px) rotateX(${rx}deg) rotateY(${t.ry + extraY}deg) rotateZ(${t.rz}deg) scale(${t.s})`;
}
let hov = 0, hovT = 0;
// drag: offset in viewport fractions; only kept while the card is docked (Work page onward)
const D = { x: 0, y: 0 }; let drag = null, dragMoved = false;
const docked = () => typeof SECS !== "undefined" && scroller.y >= top(SECS[4]) - 4;
card.style.touchAction = "none";
card.addEventListener("pointerdown", (e) => {
  if (e.target.closest("a") || !docked()) return;
  drag = { x: e.clientX, y: e.clientY, dx: D.x, dy: D.y }; dragMoved = false;
  card.setPointerCapture(e.pointerId); card.classList.add("is-drag"); e.preventDefault();
});
card.addEventListener("pointermove", (e) => {
  if (!drag) return;
  const mx = e.clientX - drag.x, my = e.clientY - drag.y;
  if (Math.abs(mx) + Math.abs(my) > 4) dragMoved = true;
  D.x = drag.dx + mx / innerWidth; D.y = drag.dy + my / VH();
});
const endDrag = () => { drag = null; card.classList.remove("is-drag"); };
card.addEventListener("pointerup", endDrag); card.addEventListener("pointercancel", endDrag);
["touchstart", "touchmove", "touchend", "wheel"].forEach((t) => card.addEventListener(t, (e) => { if (docked()) e.stopPropagation(); }, { passive: true }));
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
  if (!docked()) { D.x = lerp(D.x, 0, 0.12); D.y = lerp(D.y, 0, 0.12); }
  const hs = cur.s < 0.75 ? lerp(cur.s, 0.9, hov) : cur.s * (1 + 0.3 * hov);
  const idle = { ...cur, x: cur.x + D.x, y: cur.y + D.y + Math.sin(now * 1.3) * 0.008 * (1 - hov), rz: cur.rz * (1 - hov) + Math.sin(now * 0.9) * 1.6 * (1 - hov), s: hs };
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
   CONTENT: work cards, shorts, modal
   ============================================================ */
const { commercial, series } = window.PROJECTS;
const NEWW = [
  { local: "media/h-1209.mp4", v: "media/p-1209", title: "Mech Battle 1209", tag: "Mech / tank" },
  { local: "media/h-tap6.mp4", v: "media/p-tap6", title: "Episode 6", tag: "YouTube series" },
  { local: "media/h-72.mp4", v: "media/p-72", title: "Rescue Pups Ep. 72", tag: "YouTube series" },
  { local: "media/h-among.mp4", v: "media/p-among", title: "Among Crew", tag: "Trend" },
  { local: "media/h-73.mp4", v: "media/p-73", title: "Rescue Pups Ep. 73", tag: "YouTube series" },
  { local: "media/h-tap5.mp4", v: "media/p-tap5", title: "Poppy Trend Ep. 5", tag: "Trend" },
  { local: "media/h-79.mp4", v: "media/p-79", title: "Rescue Pups Ep. 79", tag: "YouTube series" }
];
const works = [
  ...commercial.slice(0, 1),
  ...NEWW.slice(0, 2),
  ...commercial.slice(1).map((p) => ({ ...p })),
  ...(window.PROJECTS.tank || []).map((p) => ({ ...p })),
  ...NEWW.slice(2),
  ...series.filter((p) => p.cat !== "shorts").map((p) => ({ ...p, tag: p.cat === "stickman" ? "Stickman series" : "Storytelling" }))
];
$("#workTrack").innerHTML = works.map((p, i) => `
  <article class="wcard${p.image ? " wcard--img" : ""}">
    <div class="wcard__media" ${p.local ? `data-local="${p.local}"` : `data-video="${p.id}"`} data-title="${p.title}">
      <span class="wcard__fb">${p.title}</span>
      <img alt="${p.title}" loading="lazy" src="${p.v ? p.v + ".jpg" : thumb(p.id)}" onerror="this.remove()" />
      ${p.v ? `<video muted loop playsinline autoplay preload="none" src="${p.v}.mp4"></video>` : ""}
      <span class="wcard__play">▶</span>
    </div>
    <div class="wcard__meta"><span class="wcard__n">${String(i + 1).padStart(2, "0")}</span><h3>${p.title}</h3><span class="wcard__tag">${p.tag || ""}</span></div>
  </article>`).join("");
const shorts = series.filter((p) => p.cat === "shorts");
$("#fan").innerHTML = shorts.map((p) => `
  <div class="phone" data-video="${p.id}" data-title="${p.title}" data-short="1">
    <div class="phone__in">
      <img alt="${p.title}" loading="lazy" src="${thumb(p.id, 600)}" onerror="this.remove()" />
      <i class="phone__play">▶</i>
      <span>${p.title}</span>
    </div>
  </div>`).join("");

const modal = $("#modal"), media = $("#modalMedia"), mTitle = $("#modalTitle"), mBox = $(".modal__box");
let lenis, pagerPaused = false;
function openModal(id, title, short, local) {
  media.innerHTML = local ? `<video src="${local}" controls autoplay playsinline style="width:100%;height:100%;background:#000"></video>`
    : `<iframe src="${preview(id)}" allow="autoplay; fullscreen" allowfullscreen title="${title}"></iframe>`;
  mTitle.textContent = title;
  mBox.classList.toggle("is-short", !!short);
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  pagerPaused = true;
}
function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  setTimeout(() => (media.innerHTML = ""), 300);
  pagerPaused = false;
}
document.addEventListener("click", (e) => {
  const v = e.target.closest("[data-video], [data-local]");
  if (v) { e.preventDefault(); openModal(v.dataset.video, v.dataset.title, v.dataset.short, v.dataset.local); return; }
  if (e.target.closest("[data-close]")) closeModal();
});
addEventListener("keydown", (e) => e.key === "Escape" && closeModal());

/* ============================================================
   CURSOR / MOUSE / MAGNETIC
   ============================================================ */
const cursor = $(".cursor");
addEventListener("pointermove", (e) => {
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -((e.clientY / VH()) * 2 - 1);
  if (!isTouch) gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.25, ease: "power3.out", overwrite: true });
});
document.addEventListener("pointerover", (e) => {
  cursor.classList.toggle("is-hover", !!e.target.closest("a, button, [data-video], [data-local]"));
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

/* ============================================================
   SCROLL ANIMATIONS
   ============================================================ */
const heroChars = $$("[data-hero-title]").flatMap(splitChars);
const contactChars = $$("[data-contact]").flatMap(splitChars);

/* ============================================================
   FULL-PAGE PAGER — 1 wheel notch / swipe = next page, page plays its animation
   ============================================================ */
const SECS = ["#home", "#about", "#services", "#process", "#work", "#shorts", "#tools", "#contact"].map((q) => $(q));
const top = (el) => el.offsetTop;
let page = 0, busy = false, workX = 0, ready = false;
const scroller = { y: 0 };
const titleChars = new Map($$(".split-scrub").map((el) => [el.closest("section"), splitChars(el)]));
const words = splitWords($(".scrub-words"));

// card keyframes by page scroll position
let stops = [];
function buildStops() {
  stops = [[0, P.hero()], [top(SECS[1]), P.about()], [top(SECS[2]), P.services()], [top(SECS[3]), P.process()], [top(SECS[4]), P.out()]];
}
function cardFromScroll() {
  if (!ready) return;
  const y = scroller.y;
  let i = 0;
  while (i < stops.length - 2 && y > stops[i + 1][0]) i++;
  const [a, A] = stops[i], [b, B] = stops[i + 1];
  const t = clamp((y - a) / Math.max(1, b - a));
  for (const k of ["x", "y", "s", "ry", "rz", "o"]) C[k] = lerp(A[k], B[k], t);
}
gsap.ticker.add(cardFromScroll);

// ---- per-page entrance timelines (played every time the page is entered)
const flipIn = (tl, sec) => { const ch = titleChars.get(sec); if (ch) tl.fromTo(ch, { yPercent: 110, rotateX: -90, opacity: 0 }, { yPercent: 0, rotateX: 0, opacity: 1, transformOrigin: "50% 100%", duration: 0.7, stagger: 0.04, ease: "back.out(1.7)" }, 0); };
const squashDrop = (tl, el, at, rot = 6) => tl
  .fromTo(el, { y: () => -VH() * 0.9, rotate: rot, opacity: 0, scaleX: 0.9, scaleY: 1.15 }, { y: 0, rotate: 0, opacity: 1, duration: 0.5, ease: "power2.in" }, at)
  .to(el, { scaleX: 1.08, scaleY: 0.86, transformOrigin: "50% 100%", duration: 0.09, ease: "power1.out" })
  .to(el, { scaleX: 1, scaleY: 1, duration: 0.6, ease: "elastic.out(1.1, 0.4)" });
const T = {};
const mk = (i) => (T[i] = gsap.timeline({ paused: true }));
let balls;

function buildTimelines() {
  // 0 hero
  mk(0).fromTo(heroChars, { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: "power4.out", stagger: 0.03 })
    .fromTo("[data-hero]", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 }, 0.2);
  // 1 about
  const aT = mk(1);
  aT.fromTo(".about .kicker", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.4 })
    .fromTo(words, { opacity: 0.12 }, { opacity: 1, duration: 0.25, stagger: 0.025, ease: "none" }, 0.1);
  $$("[data-count]").forEach((el, i) => {
    const n = { v: 0 }, end = +el.dataset.count, suf = el.dataset.suffix || "";
    aT.fromTo(el.parentElement, { y: 70, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "back.out(2.2)" }, 0.6 + i * 0.12)
      .fromTo(n, { v: 0 }, { v: end, duration: 1.1, ease: "power2.out", onUpdate: () => (el.textContent = Math.round(n.v) + suf) }, "<");
  });
  // 2 services
  const sT = mk(2);
  flipIn(sT, SECS[2]);
  $$(".svc").forEach((el, i) => squashDrop(sT, el, 0.25 + i * 0.22, i % 2 ? -7 : 7));
  // 3 process
  const pT = mk(3), steps = $$(".step");
  flipIn(pT, SECS[3]);
  pT.fromTo(".timeline__svg line", { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 1.4, ease: "power1.inOut" }, 0.3);
  steps.forEach((el, i) => {
    const at = 0.3 + i * 0.35;
    pT.fromTo(el, { opacity: 0.15 }, { opacity: 1, duration: 0.3 }, at)
      .fromTo(el.querySelector("h3"), { x: 70 }, { x: 0, duration: 0.5, ease: "back.out(2)" }, at)
      .fromTo(el.querySelector(".step__dot"), { scale: 0.6, backgroundColor: "#050507", boxShadow: "0 0 0px #8b5cf6" }, { scale: 1.25, backgroundColor: "#8b5cf6", boxShadow: "0 0 24px #8b5cf6", duration: 0.3, ease: "back.out(3)" }, at);
  });
  // 4 work
  const wT = mk(4);
  wT.fromTo(".work__head > *", { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: "power3.out" })
    .fromTo(".wcard__media", { clipPath: "inset(50% 50% 50% 50% round 16px)", scale: 0.85 }, { clipPath: "inset(0% 0% 0% 0% round 16px)", scale: 1, duration: 0.7, stagger: { each: 0.04, grid: "auto", from: "start" }, ease: "power3.inOut" }, 0.15)
    .fromTo(".wcard__meta", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.04 }, 0.4);
  // 5 shorts — deal like cards: stack (squash) → anticipation → arc out, overshoot → follow-through → idle float
  const hT = mk(5), phones = $$(".phone"), mid = (phones.length - 1) / 2;
  const fx = (i, el) => (i - mid) * el.offsetWidth * 1.05;
  let floatTw;
  flipIn(hT, SECS[5]);
  hT.add(() => { floatTw && floatTw.kill(); }, 0);
  phones.forEach((ph, i) => {
    const at = 0.15 + i * 0.16;
    hT.fromTo(ph, { x: 0, y: () => -VH(), rotate: (i - mid) * -14, opacity: 1, scaleX: 0.9, scaleY: 1.15 },
      { y: -i * 6, rotate: (i - mid) * 2.5, duration: 0.42, ease: "power2.in" }, at)
      .to(ph, { scaleX: 1.12, scaleY: 0.85, transformOrigin: "50% 100%", duration: 0.07 }, ">")
      .to(ph, { scaleX: 1, scaleY: 1, duration: 0.45, ease: "elastic.out(1.2, 0.45)" }, ">");
  });
  // anticipation: whole stack squashes and leans back
  hT.to(phones, { scaleY: 0.9, scaleX: 1.06, y: 18, rotate: (i) => (i - mid) * -4, duration: 0.22, ease: "power2.out" }, ">-0.2")
    // deal out along an arc (up then down), overshooting the final angle
    .addLabel("deal", ">")
    .to(phones, { x: (i, el) => fx(i, el) * 0.6, y: (i) => (i === mid ? -50 : -90), scaleY: 1, scaleX: 1, duration: 0.28, ease: "power2.out" }, "deal")
    .to(phones, { x: fx, y: (i) => Math.abs(i - mid) * 36, duration: 0.3, ease: "power2.in" }, ">")
    .to(phones, { rotate: (i) => (i - mid) * 15, duration: 0.58, ease: "power2.out" }, "deal")
    // follow-through: settle the swing
    .to(phones, { rotate: (i) => (i - mid) * 9, duration: 0.9, ease: "elastic.out(1.1, 0.35)" }, ">-0.05")
    .add(() => {
      floatTw = gsap.to(phones, { y: (i) => Math.abs(i - mid) * 36 - 10, duration: 1.8, ease: "sine.inOut", yoyo: true, repeat: -1, stagger: { each: 0.35 } });
    });

  // 6 tools
  const tT = mk(6);
  flipIn(tT, SECS[6]);
  tT.fromTo(".tools__hint", { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.8);
  // 7 contact
  mk(7).fromTo(contactChars, { yPercent: 110 }, { yPercent: 0, duration: 0.8, stagger: 0.035, ease: "power4.out" })
    .fromTo(".contact .kicker, .contact__sub, .contact__meta", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.08 }, 0.35)
    .fromTo("#reel", { clipPath: "inset(0% 0% 100% 0% round 22px)" }, { clipPath: "inset(0% 0% 0% 0% round 22px)", duration: 1, ease: "power4.inOut" }, 0.1)
    .fromTo(".cta", { scale: 0, rotate: -180 }, { scale: 1, rotate: 0, duration: 0.9, ease: "elastic.out(1, 0.5)" }, 0.6);
  // start every page in its "before" state
  Object.values(T).forEach((tl) => tl.progress(0).pause());
}

// background slideshow removed — pages sit on the plain dark background
const BG = { show() {} };

// ---- ambient particles: keyframe diamonds, dots and crosses drifting; dodge cursor; surge on page change
(() => {
  const cv = $("#fx"), cx = cv.getContext("2d");
  let W, H, dpr;
  const P = [];
  const size = () => { dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = VH(); cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size(); addEventListener("resize", size);
  const N = Math.round(Math.min(110, (innerWidth * VH()) / 26000));
  for (let i = 0; i < N; i++) P.push({ x: Math.random() * W, y: Math.random() * H, z: 0.3 + Math.random() * 0.9, k: i % 3, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.02, vx: 0, vy: 0 });
  let lastY = 0;
  gsap.ticker.add(() => {
    const surge = (scroller.y - lastY); lastY = scroller.y;
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

// ---- horizontal work paging
const workMax = () => Math.max(0, $("#workTrack").scrollWidth + $(".work__head").offsetWidth - innerWidth);
const workStep = () => innerWidth * 0.85;
function setWork(x, dur = 0.9) {
  workX = clamp(x, 0, workMax());
  gsap.to([".work__head", "#workTrack"], { x: -workX, duration: dur, ease: "power3.inOut", overwrite: true });
}

// ---- navigation
const navLinks = $$(".nav__links a");
function setUI() {
  gsap.to("#progress", { scaleX: page / (SECS.length - 1), duration: 0.6 });
  navLinks.forEach((a) => a.classList.toggle("is-active", $(a.getAttribute("href")) === SECS[page] || (a.getAttribute("href") === "#work" && (page === 4 || page === 5))));
}
function goTo(i, dir = 1) {
  i = clamp(i, 0, SECS.length - 1);
  if (i === page || busy) return;
  busy = true;
  const from = page;
  page = i;
  setUI();
  if (i === 4) setWork(dir > 0 ? 0 : workMax(), 0);
  if (i === 7) gsap.delayedCall(0.5, REEL.start); else if (from === 7) REEL.stop();
  if (balls) { if (i === 6) balls.drop(); else if (from === 6) gsap.delayedCall(0.9, balls.hide); }
  BG.show(i, dir);
  const dist = Math.abs(i - from);
  gsap.to(scroller, {
    y: top(SECS[i]), duration: reduce ? 0.01 : Math.min(1.6, 0.85 + 0.12 * (dist - 1)), ease: "power3.inOut",
    onUpdate: () => window.scrollTo(0, scroller.y),
    onComplete: () => setTimeout(() => (busy = false), 250)
  });
  gsap.delayedCall(reduce ? 0 : 0.45, () => T[i] && T[i].restart());
}
function step(dir) {
  if (busy || pagerPaused) return;
  if (page === 4) {
    if (dir > 0 && workX < workMax() - 2) { busy = true; setWork(workX + workStep()); return setTimeout(() => (busy = false), 650); }
    if (dir < 0 && workX > 2) { busy = true; setWork(workX - workStep()); return setTimeout(() => (busy = false), 650); }
  }
  goTo(page + dir, dir);
}
let lastWheel = 0;
function onWheel(e) {
  if (pagerPaused) return;
  e.preventDefault();
  const now = performance.now(), gap = now - lastWheel;
  lastWheel = now;
  const d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
  if (Math.abs(d) < 3 || busy) return;
  if (gap < 140 && now - lastNav < 900) return; // trackpad inertia tail
  lastNav = now;
  step(d > 0 ? 1 : -1);
}
let lastNav = 0, ty0 = null;
function startPager() {
  document.documentElement.classList.add("pager");
  buildStops();
  buildTimelines();
  ready = true;
  addEventListener("wheel", onWheel, { passive: false });
  addEventListener("touchstart", (e) => (ty0 = e.touches[0].clientY), { passive: true });
  addEventListener("touchmove", (e) => !pagerPaused && e.preventDefault(), { passive: false });
  addEventListener("touchend", (e) => {
    if (ty0 == null || pagerPaused) return;
    const dy = ty0 - e.changedTouches[0].clientY; ty0 = null;
    if (Math.abs(dy) > 40) step(dy > 0 ? 1 : -1);
  });
  addEventListener("keydown", (e) => {
    if (pagerPaused) return;
    if (["ArrowDown", "PageDown", " "].includes(e.key)) { e.preventDefault(); step(1); }
    if (["ArrowUp", "PageUp"].includes(e.key)) { e.preventDefault(); step(-1); }
    if (e.key === "Home") goTo(0, -1);
    if (e.key === "End") goTo(SECS.length - 1, 1);
  });
  $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const i = SECS.indexOf($(a.getAttribute("href")));
    if (i < 0) return;
    e.preventDefault();
    goTo(i, i > page ? 1 : -1);
  }));
  addEventListener("resize", () => {
    buildStops();
    scroller.y = top(SECS[page]);
    window.scrollTo(0, scroller.y);
    if (page === 4) setWork(workX, 0);
  });
  // card back: playhead + frame follow page position
  gsap.ticker.add(() => {
    const p = scroller.y / Math.max(1, top(SECS[SECS.length - 1]));
    card.style.setProperty("--p", p.toFixed(3));
    $("#frameNo").textContent = String(Math.round(p * 240) + 1).padStart(3, "0");
  });
  // marquee: always runs, speeds up during page moves
  const track = $("#marquee");
  let mx = 0, lastY = 0;
  gsap.ticker.add(() => {
    const v = scroller.y - lastY; lastY = scroller.y;
    const half = track.scrollWidth / 2;
    mx -= 1.2 + Math.abs(v) * 0.6;
    if (mx <= -half) mx += half;
    track.style.transform = `translate3d(${mx}px,0,0)`;
  });
  setUI();
  BG.show(0, 1);
}

balls = initBalls();
window.scrollTo(0, 0);
if ("scrollRestoration" in history) history.scrollRestoration = "manual";

const load = { v: 0 };
const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
gsap.set(heroChars, { yPercent: 110 });
Object.assign(C, P.hero(), { y: -1.2, rz: 12, sx: 0.8, sy: 1.3 });
Object.assign(cur, C);
trail.forEach((g) => Object.assign(g, C));
gsap.set("[data-hero]", { opacity: 0, y: 20 });
gsap.timeline()
  .to(load, { v: 100, duration: reduce ? 0.1 : 1.6, ease: "power2.inOut", onUpdate: () => {
    $("#loadNum").textContent = Math.round(load.v);
    $("#loadBar").style.width = load.v + "%";
  } })
  .add(() => fontsReady)
  .to(".loader", { yPercent: -100, duration: 0.9, ease: "power4.inOut" })
  .add(() => { document.body.classList.remove("is-loading"); $(".loader").remove(); }, "-=0.3")
  // card drops in: stretch while falling, squash on impact, settle
  .to(C, { y: P.hero().y, rz: P.hero().rz, duration: 0.55, ease: "power2.in" }, "-=0.2")
  .to(C, { sx: 1.22, sy: 0.74, duration: 0.09, ease: "power1.out" })
  .to(C, { sx: 1, sy: 1, duration: 0.9, ease: "elastic.out(1.1, 0.35)" })
  .to(heroChars, { yPercent: 0, duration: 1.1, ease: "power4.out", stagger: 0.035 }, "-=0.9")
  .to("[data-hero]", { opacity: 1, y: 0, duration: 0.8, stagger: 0.1 }, "<0.3")
  .add(() => { startPager(); T[0].progress(1); });
