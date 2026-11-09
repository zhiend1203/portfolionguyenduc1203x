// v5 "brune" layer: hangtag intro with string physics, scroll-triggered colour palettes, featured spotlights 01/03.
// Rides on top of v2.js through window.DUC + "duc:page" / "duc:spot" events.
const $ = (q, el = document) => el.querySelector(q);
const $$ = (q, el = document) => [...el.querySelectorAll(q)];
const root = document.documentElement;

/* ---------- palettes ---------- */
// [bg, fg, accent]
const PAL = {
  home: ["#f4f1ea", "#141218", "#7c5cff"],
  about: ["#e9e4ff", "#1c1633", "#6a4cf5"],
  services: ["#ffe9d6", "#2b1a10", "#ff6b3d"],
  process: ["#16131f", "#f4f1ea", "#b9a4ff"],
  work: ["#f4f1ea", "#141218", "#7c5cff"],
  shorts: ["#fff0b8", "#2a2100", "#d99a00"],
  tools: ["#ddebff", "#0f1e3a", "#3366ff"],
  contact: ["#7c5cff", "#ffffff", "#ffe066"]
};
const spotPal = $$("#spot .spot__item").map((el) => el.dataset.pal.split(","));
function paint([bg, fg, ac], d = 0.9) {
  gsap.to(document.body, { "--bg": bg, "--fg": fg, "--acc": ac, duration: d, ease: "power2.inOut", overwrite: "auto" });
}
paint(PAL.home, 0);

document.addEventListener("duc:page", (e) => {
  const { id } = e.detail;
  if (id === "spot") return; // spot paints per item
  if (PAL[id]) paint(PAL[id]);
  $$("#spot video").forEach((v) => v.pause());
});

/* ---------- spotlights ---------- */
const items = $$("#spot .spot__item"), dots = $$("#spot .spot__dots i");
let cur = -1;
function splitT(el) {
  if (el.dataset.split) return;
  el.dataset.split = 1;
  el.innerHTML = el.innerHTML.split(/<br\s*\/?>/i).map((line) =>
    `<span class="sl">${[...line].map((c) => `<span class="sc">${c === " " ? "&nbsp;" : c}</span>`).join("")}</span>`).join("");
}
items.forEach((it) => splitT($(".spot__t", it)));
gsap.set(items, { autoAlpha: 0 });

function showSpot(i, dir) {
  if (i === cur) return;
  const out = items[cur], inn = items[i];
  paint(spotPal[i], 1);
  dots.forEach((d, k) => d.classList.toggle("on", k === i));
  if (out) {
    gsap.to(out.querySelectorAll(".sc"), { yPercent: -110 * dir, opacity: 0, duration: 0.45, stagger: 0.012, ease: "power3.in" });
    gsap.to(out.querySelectorAll(".spot__badge, .spot__d, .spot__pills, .spot__cta, .spot__n"), { y: -30 * dir, opacity: 0, duration: 0.4, ease: "power2.in" });
    gsap.to(out.querySelector(".spot__frame"), { y: -140 * dir, rotate: -8 * dir, opacity: 0, duration: 0.55, ease: "power3.in" });
    gsap.to(out.querySelectorAll(".spot__float"), { y: -220 * dir, opacity: 0, duration: 0.5, ease: "power3.in" });
    gsap.set(out, { autoAlpha: 0, delay: 0.6 });
    out.querySelector("video")?.pause();
  }
  const at = out ? 0.45 : 0.15;
  gsap.set(inn, { autoAlpha: 1, delay: at - 0.05 });
  gsap.fromTo(inn.querySelectorAll(".sc"), { yPercent: 110 * dir, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.9, stagger: 0.025, ease: "expo.out", delay: at });
  gsap.fromTo(inn.querySelectorAll(".spot__badge, .spot__d, .spot__cta, .spot__n"), { y: 40 * dir, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.06, ease: "expo.out", delay: at + 0.15 });
  gsap.fromTo(inn.querySelectorAll(".spot__pills span"), { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, stagger: 0.06, ease: "back.out(2.5)", delay: at + 0.3 });
  gsap.fromTo(inn.querySelector(".spot__frame"), { y: 180 * dir, rotate: 10 * dir, opacity: 0, scale: 0.85 }, { y: 0, rotate: i === 1 ? 3 : -3, opacity: 1, scale: 1, duration: 1.1, ease: "expo.out", delay: at + 0.05 });
  gsap.fromTo(inn.querySelectorAll(".spot__float"), { y: 260 * dir, opacity: 0 }, { y: 0, opacity: 1, duration: 1.3, stagger: 0.1, ease: "expo.out", delay: at + 0.15 });
  const v = inn.querySelector("video");
  if (v) { v.preload = "auto"; v.play().catch(() => {}); }
  cur = i;
}
document.addEventListener("duc:spot", (e) => showSpot(e.detail.i, e.detail.dir >= 0 ? 1 : -1));

// floating props drift forever + frame follows the mouse a little
$$(".spot__float").forEach((f, k) => {
  gsap.to(f, { yPercent: k % 2 ? 12 : -12, rotate: (k % 2 ? 1 : -1) * 6, duration: 3 + (k % 3), repeat: -1, yoyo: true, ease: "sine.inOut" });
});
addEventListener("pointermove", (e) => {
  if (!window.DUC || DUC.SECS[DUC.page]?.id !== "spot") return;
  const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
  gsap.to(".spot__media", { x: nx * 30, y: ny * 20, rotationY: nx * 10, rotationX: -ny * 8, duration: 0.8, ease: "power3.out", transformPerspective: 900 });
});

/* ---------- hangtag intro: verlet rope + swinging tag ---------- */
const tagi = $("#tagi"), tagEl = $("#tagEl"), hint = $("#tagHint"), svg = $(".tagi__svg");
svg.innerHTML = '<path id="rope" fill="none" />';
const rope = $("#rope");
const VH = () => (window.visualViewport ? Math.min(innerHeight, visualViewport.height) : innerHeight);
const N = 18;
let ax, REST, SEG;
const P = [];
function layout() {
  ax = innerWidth / 2; REST = VH() * 0.34; SEG = REST / (N - 1);
}
layout();
for (let k = 0; k < N; k++) P.push({ x: ax, y: k * SEG, ox: ax, oy: k * SEG });
P[N - 1].x = P[N - 1].ox = ax + 120; // start swung out so it falls into a swing
let grab = null, gone = false, attached = true, ang = 0, angV = 0, tilt = 0, spinV = 0;
const T = { x: ax, y: REST, vx: 0, vy: 0 }; // free-falling tag after the snap
document.body.classList.add("tag-open");
window.DUC?.pause(true);
addEventListener("resize", () => { const old = ax; layout(); P.forEach((p) => { p.x += ax - old; p.ox += ax - old; }); });

tagEl.addEventListener("pointerdown", (e) => {
  if (gone) return;
  grab = { x: e.clientX, y: e.clientY };
  tagEl.setPointerCapture(e.pointerId); tagi.classList.add("is-grab");
  gsap.to(hint, { opacity: 0.25, duration: 0.3 });
});
tagEl.addEventListener("pointermove", (e) => { if (grab) { grab.x = e.clientX; grab.y = e.clientY; } });
const release = () => {
  if (!grab) return;
  const end = P[N - 1], stretch = Math.hypot(end.x - ax, end.y) / REST;
  grab = null; tagi.classList.remove("is-grab");
  if (stretch > 1.32) snap(); else gsap.to(hint, { opacity: 1, duration: 0.4 });
};
tagEl.addEventListener("pointerup", release); tagEl.addEventListener("pointercancel", release);

const G = 0.55, DAMP = 0.992;
function sim() {
  // integrate
  for (let k = 1; k < N; k++) {
    const p = P[k];
    if (k === N - 1 && attached && grab) continue;
    const vx = (p.x - p.ox) * DAMP, vy = (p.y - p.oy) * DAMP;
    p.ox = p.x; p.oy = p.y;
    p.x += vx; p.y += vy + G * (k === N - 1 && attached ? 2.2 : 1); // the tag end is heavier
  }
  if (attached && grab) {
    // follow the finger, but the string resists: allowed up to 1.55x its length with elastic falloff
    const end = P[N - 1], dx = grab.x - ax, dy = Math.max(10, grab.y - 40), d = Math.hypot(dx, dy), lim = REST * 1.55;
    const k = d > REST ? REST + (Math.min(d, lim * 1.4) - REST) * 0.62 : d;
    end.ox = end.x; end.oy = end.y;
    end.x = ax + (dx / d) * k; end.y = (dy / d) * k;
  }
  P[0].x = P[0].ox = ax; P[0].y = P[0].oy = 0;
  // constraints (rope can stretch a little while being pulled)
  const seg = attached && grab ? Math.max(SEG, Math.hypot(P[N - 1].x - ax, P[N - 1].y) / (N - 1)) : SEG;
  for (let it = 0; it < 14; it++) {
    for (let k = 0; k < N - 1; k++) {
      const a = P[k], b = P[k + 1], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, diff = (d - seg) / d;
      const pinA = k === 0, pinB = k + 1 === N - 1 && attached && grab;
      if (pinA && pinB) continue;
      if (pinA) { b.x -= dx * diff; b.y -= dy * diff; }
      else if (pinB) { a.x += dx * diff; a.y += dy * diff; }
      else { a.x += dx * diff * 0.5; a.y += dy * diff * 0.5; b.x -= dx * diff * 0.5; b.y -= dy * diff * 0.5; }
    }
  }
}
function draw() {
  let d = `M${P[0].x},${P[0].y}`;
  for (let k = 1; k < N - 1; k++) { const mx = (P[k].x + P[k + 1].x) / 2, my = (P[k].y + P[k + 1].y) / 2; d += ` Q${P[k].x},${P[k].y} ${mx},${my}`; }
  d += ` L${P[N - 1].x},${P[N - 1].y}`;
  rope.setAttribute("d", d);
  const tension = attached ? Math.min(1, Math.max(0, Math.hypot(P[N - 1].x - ax, P[N - 1].y) / REST - 1) / 0.32) : 0;
  rope.style.strokeWidth = 1.6 - tension * 0.6;
  rope.style.stroke = tension > 0.85 ? "#7c5cff" : "#141218";
  if (attached) {
    const a = P[N - 2], b = P[N - 1];
    const target = Math.atan2(b.x - a.x, b.y - a.y) * -57.3;
    // tag hangs from its hole: angular spring with lag -> natural secondary swing
    angV += (target - ang) * 0.12; angV *= 0.82; ang += angV;
    const vx = b.x - b.ox; tilt += (vx * 2.2 - tilt) * 0.15;
    tagEl.style.transform = `translate(${b.x}px, ${b.y}px) translate(-50%, -6px) rotate(${ang}deg) rotateY(${Math.max(-35, Math.min(35, tilt))}deg) scale(${1 + tension * 0.04})`;
    tagEl.style.setProperty("--sh", `${-ang * 0.6}px`);
  } else {
    T.vy += 1.1; T.x += T.vx; T.y += T.vy; ang += spinV;
    tagEl.style.transform = `translate(${T.x}px, ${T.y}px) translate(-50%, -6px) rotate(${ang}deg)`;
  }
}
function tick() {
  sim(); draw();
  if (!gone || T.y < VH() * 2) requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
// idle "tug" so people notice it can be pulled
const tug = gsap.timeline({ repeat: -1, repeatDelay: 2.4, delay: 2.2 }).add(() => {
  if (grab || gone) return;
  const e = P[N - 1]; e.oy -= 7; e.ox += Math.random() > 0.5 ? 4 : -4;
});
gsap.fromTo(hint, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.6, ease: "power3.out" });

function snap() {
  if (gone) return;
  gone = true; attached = false; tug.kill();
  const e = P[N - 1];
  T.x = e.x; T.y = e.y; T.vx = (e.x - e.ox) * 0.6 + (e.x > ax ? 3 : -3); T.vy = -9; spinV = e.x > ax ? 2.2 : -2.2;
  // rope recoils: give the loose end a kick upwards
  e.oy = e.y + 60; e.ox = e.x;
  tagi.classList.add("is-snap");
  gsap.to(".tagi__top, .tagi__hint, .tagi__skip", { opacity: 0, duration: 0.3 });
  gsap.to(tagi, { yPercent: -100, duration: 1.05, ease: "expo.inOut", delay: 0.55, onComplete: () => {
    gone = true; tagi.remove(); document.body.classList.remove("tag-open");
    window.DUC?.pause(false); window.DUC?.replayHero();
  } });
}
$("#tagSkip").addEventListener("click", () => { P[N - 1].ox = P[N - 1].x; P[N - 1].y += 40; snap(); });
tagi.addEventListener("wheel", (e) => { if (e.deltaY > 0 && !gone) snap(); }, { passive: true });
