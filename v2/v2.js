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
   3D STAGE — low-poly animator at his desk
   ============================================================ */
const stage = $("#stage");
const renderer = new THREE.WebGLRenderer({ canvas: stage, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x050507, 6, 14);
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);

const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.7, ...o });
const mat = {
  skin: M(0xf0c4a0), hoodie: M(0x2c2548), hoodie2: M(0x3a3060), pants: M(0x18181f),
  white: M(0xf2f2f5), black: M(0x0a0a0c, { roughness: 0.3 }), chair: M(0x1b1b22),
  desk: M(0x26232f), metal: M(0x3a3a44, { metalness: 0.6, roughness: 0.35 }),
  vio: M(0x8b5cf6, { emissive: 0x4c1d95, emissiveIntensity: 0.6 })
};
function mesh(geo, m, p = [0, 0, 0], r = [0, 0, 0], parent) {
  const o = new THREE.Mesh(geo, m);
  o.position.set(...p);
  o.rotation.set(...r);
  o.castShadow = true;
  o.receiveShadow = true;
  if (parent) parent.add(o);
  return o;
}

// lights
scene.add(new THREE.HemisphereLight(0xb9b4ff, 0x0a0a12, 0.55));
const key = new THREE.DirectionalLight(0xffffff, 2.2);
key.position.set(2.5, 4, 3);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.camera.left = -3; key.shadow.camera.right = 3; key.shadow.camera.top = 3; key.shadow.camera.bottom = -3;
scene.add(key);
const fill = new THREE.DirectionalLight(0xffe8d6, 0.9);
fill.position.set(-1, 1.6, 4);
scene.add(fill);
const rim = new THREE.PointLight(0x8b5cf6, 14, 8, 1.6);
rim.position.set(-1.2, 2.2, -1.4);
scene.add(rim);
const rim2 = new THREE.PointLight(0xc084fc, 6, 6, 1.6);
rim2.position.set(1.4, 0.6, -1);
scene.add(rim2);

// floor
const floor = mesh(new THREE.CircleGeometry(3.2, 40), new THREE.MeshStandardMaterial({ color: 0x0c0b12, roughness: 0.9 }), [0, 0, 0.3], [-Math.PI / 2, 0, 0], scene);
floor.castShadow = false;
const ring = mesh(new THREE.RingGeometry(1.35, 1.38, 64), new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.5 }), [0, 0.005, 0.3], [-Math.PI / 2, 0, 0], scene);
ring.castShadow = false;

// --- character
const guy = new THREE.Group();
scene.add(guy);
// legs (seated)
for (const sx of [-1, 1]) {
  mesh(new THREE.CylinderGeometry(0.085, 0.095, 0.44, 6), mat.pants, [sx * 0.12, 0.64, 0.2], [Math.PI / 2, 0, 0], guy);
  mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.52, 6), mat.pants, [sx * 0.12, 0.37, 0.42], [0, 0, 0], guy);
  mesh(new THREE.BoxGeometry(0.15, 0.09, 0.26), mat.white, [sx * 0.12, 0.06, 0.48], [0, 0, 0], guy);
}
mesh(new THREE.BoxGeometry(0.42, 0.14, 0.3), mat.pants, [0, 0.66, 0], [0, 0, 0], guy);
// torso
const torso = new THREE.Group();
torso.position.set(0, 0.68, 0);
guy.add(torso);
mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.58, 7), mat.hoodie, [0, 0.29, 0], [0, 0, 0], torso);
mesh(new THREE.BoxGeometry(0.26, 0.12, 0.05), mat.hoodie2, [0, 0.16, 0.22], [0.12, 0, 0], torso); // pocket
mesh(new THREE.TorusGeometry(0.17, 0.065, 5, 9), mat.hoodie2, [0, 0.56, -0.03], [Math.PI / 2 + 0.25, 0, 0], torso); // hood
for (const sx of [-1, 1]) mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.16, 4), mat.white, [sx * 0.05, 0.44, 0.2], [0.15, 0, 0], torso);
mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.12, 6), mat.skin, [0, 0.62, 0], [0, 0, 0], torso);

// arms: shoulder pivot -> upper -> elbow pivot -> fore -> hand
function makeArm(sx) {
  const sh = new THREE.Group();
  sh.position.set(sx * 0.25, 0.52, 0);
  torso.add(sh);
  mesh(new THREE.SphereGeometry(0.08, 6, 5), mat.hoodie, [0, 0, 0], [0, 0, 0], sh);
  mesh(new THREE.CylinderGeometry(0.065, 0.07, 0.3, 6), mat.hoodie, [0, -0.15, 0], [0, 0, 0], sh);
  const el = new THREE.Group();
  el.position.set(0, -0.3, 0);
  sh.add(el);
  mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.28, 6), mat.hoodie2, [0, -0.14, 0], [0, 0, 0], el);
  mesh(new THREE.IcosahedronGeometry(0.06, 0), mat.skin, [0, -0.31, 0], [0, 0, 0], el);
  return { sh, el };
}
const armR = makeArm(-1), armL = makeArm(1);

// head
const head = new THREE.Group();
head.position.set(0, 0.86, 0);
torso.add(head);
mesh(new THREE.IcosahedronGeometry(0.25, 1), mat.skin, [0, 0, 0], [0, 0, 0], head);
for (const sx of [-1, 1]) mesh(new THREE.IcosahedronGeometry(0.055, 0), mat.skin, [sx * 0.245, -0.01, 0], [0, 0, 0], head);
const eyes = [-1, 1].map((sx) => mesh(new THREE.SphereGeometry(0.03, 6, 5), mat.black, [sx * 0.085, 0.01, 0.225], [0, 0, 0], head));
mesh(new THREE.TorusGeometry(0.06, 0.012, 4, 10, Math.PI), mat.black, [0, -0.08, 0.215], [0.25, 0, Math.PI], head); // smile
mesh(new THREE.IcosahedronGeometry(0.03, 0), mat.skin, [0, -0.025, 0.25], [0, 0, 0], head); // nose
// cap
mesh(new THREE.SphereGeometry(0.262, 9, 5, 0, Math.PI * 2, 0, Math.PI / 2), mat.white, [0, 0.04, 0], [-0.12, 0, 0], head);
const brim = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.025, 10, 1, false, -Math.PI / 2, Math.PI), mat.white, [0, 0.07, 0.17], [-0.12, 0, 0], head);
brim.scale.set(1, 1, 0.9);
mesh(new THREE.SphereGeometry(0.025, 5, 4), mat.vio, [0, 0.305, -0.03], [0, 0, 0], head); // cap button

// chair
const chair = new THREE.Group();
scene.add(chair);
mesh(new THREE.BoxGeometry(0.56, 0.06, 0.52), mat.chair, [0, 0.56, 0], [0, 0, 0], chair);
mesh(new THREE.BoxGeometry(0.52, 0.62, 0.06), mat.chair, [0, 0.95, -0.3], [-0.12, 0, 0], chair);
mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.42, 6), mat.metal, [0, 0.33, 0], [0, 0, 0], chair);
for (let i = 0; i < 5; i++) {
  const a = (i / 5) * Math.PI * 2;
  mesh(new THREE.BoxGeometry(0.05, 0.04, 0.32), mat.metal, [Math.sin(a) * 0.15, 0.08, Math.cos(a) * 0.15], [0, a, 0], chair);
}

// desk props (rise in on scroll)
const props = [];
function prop(build, base) {
  const g = new THREE.Group();
  g.position.set(...base);
  build(g);
  scene.add(g);
  g.userData.base = base;
  props.push(g);
  return g;
}
prop((g) => {
  mesh(new THREE.BoxGeometry(1.7, 0.05, 0.8), mat.desk, [0, 0.82, 0], [0, 0, 0], g);
  for (const [x, z] of [[-0.8, -0.35], [0.8, -0.35], [-0.8, 0.35], [0.8, 0.35]]) mesh(new THREE.BoxGeometry(0.05, 0.8, 0.05), mat.metal, [x, 0.4, z], [0, 0, 0], g);
  mesh(new THREE.BoxGeometry(1.7, 0.012, 0.012), mat.vio, [0, 0.8, -0.4], [0, 0, 0], g);
}, [0, 0, 0.66]);

const screenCanvas = document.createElement("canvas");
screenCanvas.width = 512; screenCanvas.height = 320;
const sctx = screenCanvas.getContext("2d");
const screenTex = new THREE.CanvasTexture(screenCanvas);
screenTex.colorSpace = THREE.SRGBColorSpace;
prop((g) => {
  mesh(new THREE.BoxGeometry(0.26, 0.02, 0.18), mat.metal, [0, 0.855, 0], [0, 0, 0], g);
  mesh(new THREE.BoxGeometry(0.05, 0.26, 0.04), mat.metal, [0, 0.98, 0.02], [0, 0, 0], g);
  mesh(new THREE.BoxGeometry(0.96, 0.6, 0.04), mat.black, [0, 1.25, 0], [0, 0, 0], g);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 0.56), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }));
  scr.position.set(0, 1.25, -0.021);
  scr.rotation.y = Math.PI;
  g.add(scr);
}, [0, 0, 0.92]);
prop((g) => {
  mesh(new THREE.BoxGeometry(0.5, 0.025, 0.16), mat.white, [0, 0.858, 0], [0, 0, 0], g);
}, [0.05, 0, 0.47]);
prop((g) => { // pen tablet
  mesh(new THREE.BoxGeometry(0.34, 0.015, 0.24), mat.black, [0, 0.853, 0], [0, 0.2, 0], g);
  mesh(new THREE.BoxGeometry(0.28, 0.004, 0.17), mat.vio, [0, 0.862, 0], [0, 0.2, 0], g);
  mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.18, 5), mat.white, [0.05, 0.87, 0.02], [0, 0, Math.PI / 2.2], g);
}, [-0.5, 0, 0.5]);
prop((g) => { // mug
  mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.11, 8), mat.vio, [0, 0.9, 0], [0, 0, 0], g);
  mesh(new THREE.TorusGeometry(0.03, 0.01, 4, 8), mat.vio, [0.055, 0.9, 0], [0, 0, 0], g);
}, [0.55, 0, 0.5]);
const screenLight = new THREE.PointLight(0xc084fc, 0, 3, 1.5);
screenLight.position.set(0, 1.25, 0.75);
scene.add(screenLight);

// Monitor content: a bouncing ball with onion skin + timeline (animator's screen)
function drawScreen(t) {
  const c = sctx, W = 512, H = 320;
  c.fillStyle = "#0d0b14"; c.fillRect(0, 0, W, H);
  c.fillStyle = "#1a1626"; c.fillRect(0, 0, W, 24);
  ["#ff5f57", "#febc2e", "#28c840"].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(14 + i * 14, 12, 4, 0, 7); c.fill(); });
  c.fillStyle = "#8e8e98"; c.font = "12px monospace"; c.fillText("ball_rig.moho", 66, 16);
  c.strokeStyle = "rgba(255,255,255,0.05)";
  for (let x = 0; x < W; x += 32) { c.beginPath(); c.moveTo(x, 24); c.lineTo(x, 250); c.stroke(); }
  for (let y = 24; y < 250; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  const ground = 228;
  c.strokeStyle = "#3a3448"; c.lineWidth = 2; c.beginPath(); c.moveTo(20, ground + 16); c.lineTo(W - 20, ground + 16); c.stroke();
  const ball = (tt, alpha) => {
    const p = ((tt % 1.1) + 1.1) % 1.1 / 1.1;
    const h = Math.abs(Math.sin(Math.PI * p));
    const sp = Math.abs(Math.cos(Math.PI * p));
    let sy = 1 + 0.3 * sp * sp, sx = 1 / sy;
    if (h < 0.07) { sy = 0.68; sx = 1.35; }
    const x = 50 + ((tt * 80) % 410);
    const y = ground - h * 165 + (1 - sy) * 16;
    c.save(); c.translate(x, y); c.scale(sx, sy);
    c.globalAlpha = alpha; c.fillStyle = alpha < 1 ? "#8b5cf6" : "#c084fc";
    c.beginPath(); c.arc(0, 0, 16, 0, 7); c.fill(); c.restore(); c.globalAlpha = 1;
    return p;
  };
  for (let k = 4; k >= 1; k--) ball(t - k * 0.07, 0.12 * (5 - k) / 2);
  const p = ball(t, 1);
  c.fillStyle = "#15121e"; c.fillRect(0, 250, W, 70);
  c.fillStyle = "#2a2538";
  for (let x = 20; x < W - 10; x += 12) c.fillRect(x, 262, 1, x % 48 === 20 ? 12 : 6);
  c.fillStyle = "#c084fc";
  [20, 128, 236, 344, 452].forEach((x) => { c.save(); c.translate(x, 292); c.rotate(Math.PI / 4); c.fillRect(-5, -5, 10, 10); c.restore(); });
  const ph = 20 + p * 432;
  c.fillStyle = "#ff4d6d"; c.fillRect(ph, 254, 2, 62);
  c.fillStyle = "#8e8e98"; c.fillText(`frame ${String(Math.floor(p * 24) + 1).padStart(2, "0")}/24`, W - 100, 16);
}

/* ---------- camera states ---------- */
const S = { px: 0, py: 1.45, pz: 2.6, tx: 0, ty: 1.32, tz: 0, shift: 8, desk: 0, typing: 0, look: 1, fade: 1 };
const P = {
  hero: { px: 0, py: 1.45, pz: 2.6, tx: 0, ty: 1.32, tz: 0, shift: 8, desk: 0, typing: 0, look: 1 },
  about: { px: 1.6, py: 1.75, pz: 2.3, tx: 0, ty: 1.15, tz: 0.1, shift: 9, desk: 0, typing: 0, look: 1 },
  services: { px: -2.7, py: 2.0, pz: -2.6, tx: 0.1, ty: 1.45, tz: 0.6, shift: 7, desk: 1, typing: 1, look: 0 },
  process: { px: -1.6, py: 3.5, pz: -2.6, tx: 0.1, ty: 0.85, tz: 0.6, shift: 7, desk: 1, typing: 1, look: 0 }
};
Object.assign(S, P.hero);
const tgt = new THREE.Vector3();
let wave = 0; // 0..1 hello wave after intro
const easeBack = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize);
resize();

const clock = new THREE.Clock();
let blinkT = 2;
function renderStage() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  mouse.sx = lerp(mouse.sx, mouse.x, 0.06);
  mouse.sy = lerp(mouse.sy, mouse.y, 0.06);
  const wide = camera.aspect > 1 ? 1 : 0;

  // camera
  camera.position.set(S.px + mouse.sx * 0.12, S.py + mouse.sy * 0.08, S.pz);
  tgt.set(S.tx, S.ty, S.tz);
  camera.lookAt(tgt);
  camera.filmOffset = S.shift * wide;
  camera.updateProjectionMatrix();

  // desk props rise
  props.forEach((g, i) => {
    const lp = clamp((S.desk - i * 0.12) / 0.45);
    const s = lp <= 0 ? 0.0001 : easeBack(lp);
    g.scale.setScalar(s);
    g.position.y = (1 - lp) * -0.4;
    g.visible = lp > 0;
  });
  screenLight.intensity = S.desk * 2.5;
  if (S.desk > 0.3) { drawScreen(t); screenTex.needsUpdate = true; }

  // breathing + head
  torso.scale.y = 1 + Math.sin(t * 2) * 0.012;
  const lookY = mouse.sx * 0.55 * S.look;
  const lookX = -mouse.sy * 0.3 * S.look + S.typing * 0.22;
  head.rotation.y = lerp(head.rotation.y, lookY + Math.sin(t * 0.7) * 0.04, 0.08);
  head.rotation.x = lerp(head.rotation.x, lookX, 0.08);
  torso.rotation.x = S.typing * 0.12;

  // blink
  blinkT -= dt;
  const blink = blinkT < 0.12 ? 0.1 : 1;
  if (blinkT < 0) blinkT = 2 + Math.random() * 3;
  eyes.forEach((e) => (e.scale.y = blink));

  // arms: rest -> typing, plus hello wave
  const ty = S.typing;
  for (const [arm, side] of [[armR, -1], [armL, 1]]) {
    const tap = ty * Math.sin(t * 18 + side) * 0.06;
    arm.sh.rotation.set(lerp(-0.15, -0.5, ty) + tap, 0, side * lerp(0.08, 0.12, ty));
    arm.el.rotation.set(lerp(-1.35, -0.85, ty) - tap * 1.5, 0, 0);
  }
  if (wave > 0) {
    armR.sh.rotation.set(lerp(armR.sh.rotation.x, -0.1, wave), 0, lerp(armR.sh.rotation.z, -2.5, wave));
    armR.el.rotation.set(0, 0, lerp(0, -0.35 + Math.sin(t * 10) * 0.45, wave));
  }

  ring.material.opacity = 0.35 + Math.sin(t * 1.5) * 0.15;
  renderer.render(scene, camera);
}

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
      c.font = `800 ${fs}px Syne, sans-serif`;
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

function camSegment(trigger, from, to, start, end) {
  gsap.fromTo(S, { ...P[from] }, {
    ...P[to], ease: "none", immediateRender: false,
    scrollTrigger: { trigger, start, end, scrub: 1 }
  });
}

function initScroll() {
  // 3D camera path
  camSegment("#about", "hero", "about", "top bottom", "center center");
  camSegment("#services", "about", "services", "top bottom", "top 10%");
  camSegment("#process", "services", "process", "top bottom", "center center");
  gsap.to(S, { fade: 0, ease: "none", scrollTrigger: { trigger: "#work", start: "top bottom", end: "top 20%", scrub: true } });
  gsap.to([stage, ".glow"], { opacity: 0, ease: "none", scrollTrigger: { trigger: "#work", start: "top bottom", end: "top 20%", scrub: true } });

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

  // about: words light up one by one
  const words = splitWords($(".scrub-words"));
  gsap.to(words, { opacity: 1, ease: "none", stagger: 0.1, scrollTrigger: { trigger: ".about__text", start: "top 80%", end: "bottom 45%", scrub: true } });
  $$("[data-count]").forEach((el) => {
    const n = { v: 0 }, end = +el.dataset.count, suf = el.dataset.suffix || "";
    ScrollTrigger.create({
      trigger: el, start: "top 90%", once: true,
      onEnter: () => gsap.to(n, { v: end, duration: 1.6, ease: "power2.out", onUpdate: () => (el.textContent = Math.round(n.v) + suf) })
    });
  });

  // big titles: letters flip up in sync with scroll
  $$(".split-scrub").forEach((el) => {
    const chars = splitChars(el);
    gsap.from(chars, {
      yPercent: 110, rotateX: -90, opacity: 0, transformOrigin: "50% 100%", ease: "none", stagger: 0.06,
      scrollTrigger: { trigger: el, start: "top 92%", end: "top 55%", scrub: true }
    });
  });

  // service cards rise and tilt in
  $$(".svc").forEach((el) => {
    gsap.from(el, {
      y: 140, rotate: 5, scale: 0.9, opacity: 0, ease: "none",
      scrollTrigger: { trigger: el, start: "top 100%", end: "top 65%", scrub: true }
    });
  });

  // process: line draws, steps light up
  gsap.to(".timeline__svg line", { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: ".timeline", start: "top 60%", end: "bottom 60%", scrub: true } });
  $$(".step").forEach((el) => {
    gsap.to(el, { opacity: 1, ease: "none", scrollTrigger: { trigger: el, start: "top 75%", end: "top 55%", scrub: true } });
    ScrollTrigger.create({ trigger: el, start: "top 60%", toggleClass: "is-on" });
    gsap.from(el.querySelector("h3"), { x: 80, ease: "none", scrollTrigger: { trigger: el, start: "top 90%", end: "top 55%", scrub: true } });
  });

  // work: pinned horizontal gallery
  const pin = $(".work__pin"), wTrack = $("#workTrack"), wHead = $(".work__head");
  const dist = () => wTrack.scrollWidth + wHead.offsetWidth - innerWidth;
  const hz = gsap.to([wHead, wTrack], {
    x: () => -dist(), ease: "none",
    scrollTrigger: { trigger: ".work", pin, start: "top top", end: () => "+=" + dist(), scrub: 1, invalidateOnRefresh: true }
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

  // shorts: phones fan out from a stack
  const phones = $$(".phone");
  const mid = (phones.length - 1) / 2;
  phones.forEach((ph, i) => {
    const o = i - mid;
    gsap.fromTo(ph, { x: 0, y: 120, rotate: o * 3, scale: 0.8 }, {
      x: () => o * ph.offsetWidth * 1.05, y: Math.abs(o) * 40, rotate: o * 9, scale: 1, ease: "none",
      scrollTrigger: { trigger: ".fan", start: "top 85%", end: "center 55%", scrub: true, invalidateOnRefresh: true }
    });
  });

  // contact: letters rise
  gsap.from(contactChars, {
    yPercent: 110, ease: "none", stagger: 0.04,
    scrollTrigger: { trigger: ".contact__title", start: "top 90%", end: "top 45%", scrub: true }
  });
  gsap.from(".cta", { scale: 0, rotate: -90, ease: "none", scrollTrigger: { trigger: ".cta", start: "top 100%", end: "top 70%", scrub: true } });

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

gsap.ticker.add(() => {
  if (S.fade > 0.01) renderStage();
});
initBalls();

const load = { v: 0 };
const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
gsap.set(heroChars, { yPercent: 110 });
gsap.set("[data-hero]", { opacity: 0, y: 20 });
gsap.timeline()
  .to(load, { v: 100, duration: reduce ? 0.1 : 1.6, ease: "power2.inOut", onUpdate: () => {
    $("#loadNum").textContent = Math.round(load.v);
    $("#loadBar").style.width = load.v + "%";
  } })
  .add(() => fontsReady)
  .to(".loader", { yPercent: -100, duration: 0.9, ease: "power4.inOut" })
  .add(() => { document.body.classList.remove("is-loading"); $(".loader").remove(); startLenis(); }, "-=0.3")
  .to(heroChars, { yPercent: 0, duration: 1.1, ease: "power4.out", stagger: 0.035 }, "-=0.4")
  .to("[data-hero]", { opacity: 1, y: 0, duration: 0.8, stagger: 0.1 }, "<0.3")
  .add(() => {
    gsap.timeline()
      .to({ w: 0 }, { w: 1, duration: 0.5, ease: "power2.out", onUpdate() { wave = this.targets()[0].w; } })
      .to({ w: 1 }, { w: 0, duration: 0.6, delay: 1.6, ease: "power2.inOut", onUpdate() { wave = this.targets()[0].w; } });
  }, "<")
  .add(initScroll);
