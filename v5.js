// v5 "brune" layer: hangtag intro with string physics, scroll-triggered colour palettes, featured spotlights 01/03.
// Rides on top of v2.js through window.DUC + "duc:page" / "duc:spot" events.
const $ = (q, el = document) => el.querySelector(q);
const $$ = (q, el = document) => [...el.querySelectorAll(q)];
const root = document.documentElement;

/* ---------- palettes ---------- */
// [bg, fg, accent]
const PAL = {
  home: ["#f3eee6", "#2a1a12", "#b5532b"],
  about: ["#e8d6c1", "#3b2416", "#8a4b26"],
  services: ["#f2e3d3", "#3a2316", "#c2552d"],
  process: ["#2a1b15", "#f4e9de", "#e7a27c"],
  work: ["#f3eee6", "#1f1511", "#b5532b"],
  shorts: ["#d5e2c8", "#1e321e", "#3f7a3a"],
  tools: ["#cfe0f2", "#13253b", "#2d6cc0"],
  contact: ["#1e1410", "#f5ebdd", "#e7a27c"]
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

/* ---------- hangtag intro ---------- */
const tagi = $("#tagi"), tagEl = $("#tagEl"), line = $("#tagLine"), hint = $("#tagHint");
const VH = () => (window.visualViewport ? Math.min(innerHeight, visualViewport.height) : innerHeight);
let ax = innerWidth / 2, L = VH() * 0.36;
const S = { x: ax + 30, y: L, vx: 0, vy: 0 };
let grab = null, gone = false, maxPull = 0;
document.body.classList.add("tag-open");
window.DUC?.pause(true);

addEventListener("resize", () => { ax = innerWidth / 2; L = VH() * 0.36; });
tagEl.addEventListener("pointerdown", (e) => {
  if (gone) return;
  grab = { dx: S.x - e.clientX, dy: S.y - e.clientY };
  tagEl.setPointerCapture(e.pointerId); tagi.classList.add("is-grab");
});
tagEl.addEventListener("pointermove", (e) => {
  if (!grab) return;
  S.x = e.clientX + grab.dx; S.y = e.clientY + grab.dy; S.vx = S.vy = 0;
  maxPull = Math.max(maxPull, S.y - L);
  hint.style.opacity = Math.max(0.15, 1 - (S.y - L) / 200);
});
const release = () => {
  if (!grab) return;
  grab = null; tagi.classList.remove("is-grab");
  if (S.y - L > Math.min(200, VH() * 0.22)) snap();
};
tagEl.addEventListener("pointerup", release); tagEl.addEventListener("pointercancel", release);

function tick() {
  if (gone) return;
  if (!grab) {
    // spring (string, slightly elastic) + gravity + damping
    const dx = S.x - ax, dy = S.y, d = Math.hypot(dx, dy) || 1;
    const k = 0.08, f = (d - L) * k;
    S.vx += (-dx / d) * f; S.vy += (-dy / d) * f + 0.6;
    S.vx *= 0.94; S.vy *= 0.94;
    S.x += S.vx; S.y += S.vy;
  }
  render();
  requestAnimationFrame(tick);
}
let spin = 0, lineTo = null;
function render() {
  const ang = Math.atan2(S.x - ax, S.y) * (180 / Math.PI);
  line.setAttribute("x1", ax); line.setAttribute("y1", 0);
  line.setAttribute("x2", lineTo ? lineTo.x : S.x); line.setAttribute("y2", lineTo ? lineTo.y : S.y);
  tagEl.style.transform = `translate(${S.x}px, ${S.y}px) translate(-50%, 0) rotate(${-ang + spin}deg)`;
}
requestAnimationFrame(tick);
// little nudge so it swings on arrival, then a "tug" hint loop
gsap.delayedCall(0.4, () => (S.vx = -9));
const tug = gsap.timeline({ repeat: -1, repeatDelay: 2.2, delay: 2.5 }).add(() => { if (!grab && !gone) S.vy += 7; });

function snap() {
  if (gone) return;
  gone = true; tug.kill();
  // string snaps back up, tag drops & spins away, curtain lifts
  lineTo = { x: S.x, y: S.y };
  gsap.to(lineTo, { x: ax, y: 0, duration: 0.35, ease: "power3.out" });
  gsap.to(S, { y: S.y + VH(), x: S.x + (S.x > ax ? 80 : -80), duration: 0.9, ease: "power2.in", onUpdate: render });
  gsap.to({ v: 0 }, { v: 1, duration: 0.9, onUpdate() { spin = this.targets()[0].v * (S.x > ax ? 50 : -50); } });
  gsap.to(".tagi__top, .tagi__hint, .tagi__skip", { opacity: 0, duration: 0.3 });
  gsap.to(tagi, { yPercent: -100, duration: 1, ease: "expo.inOut", delay: 0.35, onComplete: () => {
    tagi.remove(); document.body.classList.remove("tag-open");
    window.DUC?.pause(false); window.DUC?.replayHero();
  } });
}
$("#tagSkip").addEventListener("click", () => { S.y = L + 260; snap(); });
tagi.addEventListener("wheel", (e) => { if (e.deltaY > 0) { S.vy += 30; S.y += 120; snap(); } }, { passive: true });
