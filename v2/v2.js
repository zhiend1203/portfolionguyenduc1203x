import * as THREE from "./vendor/three.module.min.js";

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
gsap.registerPlugin(ScrollTrigger);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouch = matchMedia("(hover: none)").matches;
const thumb = (id, w = 1000) => `https://drive.google.com/thumbnail?id=${id}&sz=w${w}`;
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
  services: () => isWide() ? { x: -0.3, y: 0.2, s: 0.62, ry: 360, rz: -8, o: 1 } : { x: 0.25, y: 0.3, s: 0.4, ry: 360, rz: -8, o: 0.3 },
  process: () => isWide() ? { x: -0.32, y: 0.2, s: 0.55, ry: 540, rz: 5, o: 1 } : { x: 0.3, y: 0.3, s: 0.4, ry: 540, rz: 5, o: 0 },
  out: () => ({ x: -0.3, y: -0.9, s: 0.7, ry: 600, rz: -20, o: 0 })
};
const cur = { x: 0, y: 0, s: 1, ry: 0, rz: 0 };
const trail = ghosts.map(() => ({ x: 0, y: 0, s: 1, ry: 0, rz: 0 }));
let frame = 0;
function tf(t, rx = 0, extraY = 0) {
  return `translate3d(${t.x * innerWidth}px, ${t.y * innerHeight}px, 0) perspective(1200px) rotateX(${rx}deg) rotateY(${t.ry + extraY}deg) rotateZ(${t.rz}deg) scale(${t.s})`;
}
function renderCard() {
  mouse.sx = lerp(mouse.sx, mouse.x, 0.08);
  mouse.sy = lerp(mouse.sy, mouse.y, 0.08);
  const prev = { ...cur };
  for (const k of ["x", "y", "s", "ry", "rz"]) cur[k] = lerp(cur[k], C[k], 0.14);
  const speed = Math.abs(cur.x - prev.x) * 40 + Math.abs(cur.y - prev.y) * 40 + Math.abs(cur.ry - prev.ry) * 0.06;
  const rx = mouse.sy * 9, ty = mouse.sx * 14;
  card.style.transform = tf(cur, rx, ty) + ` scale(${C.sx}, ${C.sy})`;
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
    { img: "../assets/moho.png", bg: "#ffffff", r: 1.25 },
    { img: "../assets/ae.png", bg: "#0b0b1a", r: 1.05 },
    { img: "../assets/pr.png", bg: "#0b0b1a", r: 1.0 },
    { img: "../assets/ps.png", bg: "#0b0b1a", r: 0.95 },
    { img: "../assets/ai.png", bg: "#0b0b1a", r: 0.9 },
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
      b.rot -= b.vx / b.R;
      b.m.position.set(b.x, b.y, 0);
      b.m.rotation.set(b.vy * 0.004, 0, b.rot * 0.15);
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
  ScrollTrigger.create({ trigger: "#tools", start: "top 60%", onEnter: drop, onEnterBack: () => !active && drop() });
}

/* ============================================================
   CONTENT: work cards, shorts, modal
   ============================================================ */
const { commercial, series } = window.PROJECTS;
const works = [
  ...commercial.map((p) => ({ ...p })),
  ...series.filter((p) => p.cat !== "shorts").map((p) => ({ ...p, tag: p.cat === "stickman" ? "Stickman series" : "Storytelling" }))
];
$("#workTrack").innerHTML = works.map((p, i) => `
  <article class="wcard">
    <div class="wcard__media" data-video="${p.id}" data-title="${p.title}">
      <span class="wcard__fb">${p.title}</span>
      <img alt="${p.title}" loading="lazy" src="${thumb(p.id)}" onerror="this.remove()" />
      <span class="wcard__play">▶</span>
    </div>
    <div class="wcard__meta"><span class="wcard__n">${String(i + 1).padStart(2, "0")}</span><h3>${p.title}</h3><span class="wcard__tag">${p.tag || ""}</span></div>
  </article>`).join("");
const shorts = series.filter((p) => p.cat === "shorts");
$("#fan").innerHTML = shorts.map((p) => `
  <div class="phone" data-video="${p.id}" data-title="${p.title}" data-short="1">
    <img alt="${p.title}" loading="lazy" src="${thumb(p.id, 600)}" onerror="this.remove()" />
    <span>${p.title}</span>
  </div>`).join("");

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

/* ============================================================
   SCROLL ANIMATIONS
   ============================================================ */
const heroChars = $$("[data-hero-title]").flatMap(splitChars);
const contactChars = $$("[data-contact]").flatMap(splitChars);

// card path: list of [scrollY, preset] keyframes, rebuilt on refresh
let stops = [], scrollDriven = false;
function buildStops() {
  const vh = innerHeight;
  const box = (sel) => { const el = $(sel); return el.parentElement.classList.contains("pin-spacer") ? el.parentElement : el; };
  const T = (sel) => box(sel).getBoundingClientRect().top + scrollY;
  stops = [
    [0, P.hero()],
    [T("#about"), P.about()],
    [T("#services") - vh, P.about()],
    [T("#services"), P.services()],
    [T("#process") - vh, P.services()],
    [T("#process"), P.process()],
    [T("#work") - vh, P.process()],
    [T("#work") - vh * 0.2, P.out()]
  ];
}
function cardFromScroll() {
  if (!scrollDriven || !stops.length) return;
  const y = scrollY;
  let i = 0;
  while (i < stops.length - 2 && y > stops[i + 1][0]) i++;
  const [a, A] = stops[i], [b, B] = stops[i + 1];
  const t = gsap.parseEase("power1.inOut")(clamp((y - a) / Math.max(1, b - a)));
  for (const k of ["x", "y", "s", "ry", "rz", "o"]) C[k] = lerp(A[k], B[k], t);
}
gsap.ticker.add(cardFromScroll, false, true);

const SNAP = { snapTo: "labelsDirectional", duration: { min: 0.25, max: 0.7 }, delay: 0.08, ease: "power2.inOut" };
function pinTL(sel, len) {
  return gsap.timeline({ scrollTrigger: { trigger: sel, start: "top top", end: "+=" + len + "%", pin: true, scrub: 0.6, snap: SNAP } });
}

function initScroll() {
  // 3D camera path
  ScrollTrigger.addEventListener("refresh", buildStops);
  buildStops();
  scrollDriven = true;
  gsap.to(".glow", { opacity: 0, ease: "none", scrollTrigger: { trigger: "#work", start: "top bottom", end: "top 20%", scrub: true } });

  // hero letters scatter away as you scroll
  gsap.to(heroChars, {
    yPercent: -140, rotate: () => gsap.utils.random(-40, 40), opacity: 0, ease: "none",
    stagger: { each: 0.03, from: "random" },
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom 30%", scrub: true }
  });
  gsap.to("[data-hero]", { y: -60, opacity: 0, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "50% top", scrub: true } });

  // marquee driven by scroll velocity
  const track = $("#marquee");
  let mx = 0, dir = 1, boost = 0;
  ScrollTrigger.create({ onUpdate: (self) => { dir = self.direction; boost = Math.min(Math.abs(self.getVelocity()) / 120, 30); } });
  gsap.ticker.add(() => {
    const half = track.scrollWidth / 2;
    mx -= (1.2 + boost) * dir;
    boost *= 0.92;
    if (mx <= -half) mx += half;
    if (mx > 0) mx -= half;
    track.style.transform = `translate3d(${mx}px,0,0)`;
  });

  // big titles: letters flip up in sync with scroll
  $$(".split-scrub").forEach((el) => {
    const chars = splitChars(el);
    gsap.from(chars, {
      yPercent: 110, rotateX: -90, opacity: 0, transformOrigin: "50% 100%", ease: "none", stagger: 0.06,
      scrollTrigger: { trigger: el.closest("section"), start: "top 85%", end: "top 15%", scrub: true }
    });
  });

  // ABOUT (pinned): words light up, then stats count
  const words = splitWords($(".scrub-words"));
  const aTl = pinTL("#about", 110);
  aTl.addLabel("a0").to(words, { opacity: 1, stagger: 0.08, duration: 0.4, ease: "none" }).addLabel("a1");
  $$("[data-count]").forEach((el, i) => {
    const n = { v: 0 }, end = +el.dataset.count, suf = el.dataset.suffix || "";
    aTl.fromTo(el.parentElement, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "back.out(2)" }, i ? "<0.15" : ">")
      .to(n, { v: end, duration: 0.8, ease: "power2.out", onUpdate: () => (el.textContent = Math.round(n.v) + suf) }, "<");
  });
  aTl.addLabel("a2");

  // SERVICES (pinned): cards drop in one by one with squash & stretch
  const sTl = pinTL("#services", 120);
  sTl.addLabel("s0");
  $$(".svc").forEach((el, i) => {
    sTl.fromTo(el, { y: () => innerHeight, rotate: i % 2 ? -8 : 8, opacity: 0, scaleY: 1.15, scaleX: 0.9 },
      { y: 0, rotate: 0, opacity: 1, scaleY: 1.15, scaleX: 0.9, duration: 0.7, ease: "power2.in" })
      .to(el, { scaleY: 0.88, scaleX: 1.06, duration: 0.12, transformOrigin: "50% 100%" })
      .to(el, { scaleY: 1, scaleX: 1, duration: 0.35, ease: "back.out(3)" })
      .addLabel("s" + (i + 1));
  });

  // PROCESS (pinned): line draws step by step, each step lights up
  const pTl = pinTL("#process", 120);
  const steps = $$(".step");
  pTl.addLabel("p0");
  steps.forEach((el, i) => {
    pTl.to(".timeline__svg line", { strokeDashoffset: 100 - ((i + 1) / steps.length) * 100, duration: 0.5, ease: "none" })
      .to(el, { opacity: 1, duration: 0.3 }, "<0.2")
      .fromTo(el.querySelector("h3"), { x: 80 }, { x: 0, duration: 0.4, ease: "back.out(2)" }, "<")
      .to(el.querySelector(".step__dot"), { backgroundColor: "#8b5cf6", boxShadow: "0 0 24px #8b5cf6", scale: 1.3, duration: 0.2 }, "<")
      .addLabel("p" + (i + 1));
  });

  // work: pinned horizontal gallery
  const pin = $(".work__pin"), wTrack = $("#workTrack"), wHead = $(".work__head");
  const dist = () => wTrack.scrollWidth + wHead.offsetWidth - innerWidth;
  const hz = gsap.to([wHead, wTrack], {
    x: () => -dist(), ease: "none",
    scrollTrigger: { trigger: ".work", pin, start: "top top", end: () => "+=" + dist() * 0.6, scrub: 0.6, invalidateOnRefresh: true }
  });
  $$(".wcard").forEach((card) => {
    const m = card.querySelector(".wcard__media");
    gsap.fromTo(m, { clipPath: "inset(12% 12% 12% 12% round 16px)", scale: 0.88 }, {
      clipPath: "inset(0% 0% 0% 0% round 16px)", scale: 1, ease: "none",
      scrollTrigger: { trigger: card, containerAnimation: hz, start: "left 100%", end: "left 60%", scrub: true }
    });
    const img = m.querySelector("img");
    if (img) gsap.fromTo(img, { xPercent: -8 }, {
      xPercent: 8, ease: "none",
      scrollTrigger: { trigger: card, containerAnimation: hz, start: "left right", end: "right left", scrub: true }
    });
    gsap.from(card.querySelector(".wcard__meta"), {
      y: 30, opacity: 0, ease: "none",
      scrollTrigger: { trigger: card, containerAnimation: hz, start: "left 90%", end: "left 60%", scrub: true }
    });
  });

  // shorts: pinned; phones fly in one by one (squash on landing), stack, then fan out
  const phones = $$(".phone");
  const mid = (phones.length - 1) / 2;
  const stl = gsap.timeline({
    scrollTrigger: { trigger: ".shorts", start: "top top", end: "+=" + (phones.length * 35 + 60) + "%", pin: true, scrub: 0.6, invalidateOnRefresh: true, snap: SNAP }
  });
  stl.addLabel("h0");
  gsap.set(phones, { y: () => innerHeight, rotate: () => gsap.utils.random(-25, 25), scale: 0.7, opacity: 0 });
  phones.forEach((ph, i) => {
    stl.to(ph, { y: -i * 8, rotate: (i - mid) * 3, scale: 1, opacity: 1, duration: 1, ease: "power2.in" })
      .to(ph, { scaleY: 0.86, scaleX: 1.1, duration: 0.15, ease: "power1.out" })
      .to(ph, { scaleY: 1, scaleX: 1, duration: 0.35, ease: "back.out(3)" })
      .addLabel("h" + (i + 1));
  });
  stl.to(phones, {
    x: (i, el) => (i - mid) * el.offsetWidth * 1.08,
    y: (i) => Math.abs(i - mid) * 40,
    rotate: (i) => (i - mid) * 9,
    duration: 1.4, ease: "back.out(1.6)", stagger: { each: 0.08, from: "center" }
  }, "+=0.2").addLabel("hEnd");

  // CONTACT (pinned): letters rise, CTA spins in
  const cTl = pinTL("#contact", 80);
  cTl.addLabel("c0")
    .from(contactChars, { yPercent: 110, stagger: 0.04, duration: 0.6, ease: "power3.out" })
    .from(".contact__sub, .contact__meta", { y: 40, opacity: 0, duration: 0.4 }, "<0.3")
    .addLabel("c1")
    .from(".cta", { scale: 0, rotate: -180, duration: 0.6, ease: "back.out(1.8)" })
    .addLabel("c2");

  // back of card: playhead + frame number follow scroll
  ScrollTrigger.create({ start: 0, end: "max", onUpdate: (st) => {
    card.style.setProperty("--p", st.progress.toFixed(3));
    $("#frameNo").textContent = String(Math.round(st.progress * 240) + 1).padStart(3, "0");
  } });

  // progress + nav
  gsap.to("#progress", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: true } });
  $$(".nav__links a").forEach((a) => {
    const sec = $(a.getAttribute("href"));
    ScrollTrigger.create({ trigger: sec, start: "top 50%", end: "bottom 50%", onToggle: (s) => a.classList.toggle("is-active", s.isActive) });
  });

  ScrollTrigger.refresh();
}

/* ============================================================
   BOOT
   ============================================================ */
function startLenis() {
  if (reduce || !window.Lenis) return;
  lenis = new window.Lenis({ lerp: 0.09 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault();
    lenis.scrollTo(a.getAttribute("href"), { duration: 1.6 });
  }));
}

initBalls();

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
  .add(() => { document.body.classList.remove("is-loading"); $(".loader").remove(); startLenis(); }, "-=0.3")
  // card drops in: stretch while falling, squash on impact, settle
  .to(C, { y: P.hero().y, rz: P.hero().rz, duration: 0.55, ease: "power2.in" }, "-=0.2")
  .to(C, { sx: 1.22, sy: 0.74, duration: 0.09, ease: "power1.out" })
  .to(C, { sx: 1, sy: 1, duration: 0.9, ease: "elastic.out(1.1, 0.35)" })
  .to(heroChars, { yPercent: 0, duration: 1.1, ease: "power4.out", stagger: 0.035 }, "-=0.9")
  .to("[data-hero]", { opacity: 1, y: 0, duration: 0.8, stagger: 0.1 }, "<0.3")
  .add(initScroll);
