(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof window.gsap !== "undefined";
  const thumb = (id, w = 1000) => `https://drive.google.com/thumbnail?id=${id}&sz=w${w}`;
  const preview = (id) => `https://drive.google.com/file/d/${id}/preview`;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  $("#year").textContent = new Date().getFullYear();

  /* ================= PORTFOLIO TABS ================= */
  const { commercial, series } = window.PROJECTS;
  const DESC = {
    commercial: "2D animated commercial — character animation, motion graphics and compositing.",
    stickman: "Episode from an ongoing stickman YouTube series, built on reusable Moho rigs.",
    story: "Storytelling / explainer video animated from script and voiceover.",
    shorts: "Vertical 9:16 short for YouTube Shorts, TikTok and Reels."
  };
  const TOOLS = [
    { name: "Moho Pro", img: "../assets/moho.png", light: true },
    { name: "After Effects", img: "../assets/ae.png" },
    { name: "Premiere Pro", img: "../assets/pr.png" },
    { name: "Photoshop", img: "../assets/ps.png" },
    { name: "Illustrator", img: "../assets/ai.png" },
    { name: "Blender", text: "B" }
  ];
  const DATA = {
    commercial: commercial.map((p) => ({ ...p, desc: DESC.commercial })),
    series: series.filter((p) => p.cat !== "shorts").map((p) => ({ ...p, desc: DESC[p.cat], tag: p.cat === "stickman" ? "Stickman series" : "Storytelling" })),
    shorts: series.filter((p) => p.cat === "shorts").map((p) => ({ ...p, desc: DESC.shorts, tag: "9:16 Short", short: true }))
  };

  const panel = $("#panel");

  function cardHTML(p) {
    return `
      <article class="pcard${p.short ? " pcard--short" : ""}">
        <div class="pcard__media" data-video="${p.id}" data-title="${p.title}"${p.short ? ' data-short="1"' : ""}>
          <span class="pcard__fallback">${p.title}</span>
          <img alt="${p.title}" loading="lazy" src="${thumb(p.id)}" onerror="this.remove()" />
          <span class="pcard__play">▶</span>
        </div>
        <h3 class="pcard__title">${p.title}</h3>
        <p class="pcard__desc">${p.desc}</p>
        <div class="pcard__foot">
          <span class="pcard__tag">${p.tag || ""}</span>
          <button class="pcard__btn" data-video="${p.id}" data-title="${p.title}"${p.short ? ' data-short="1"' : ""}>Watch <span>→</span></button>
        </div>
      </article>`;
  }

  function toolsHTML() {
    return `<div class="tools-grid">${TOOLS.map((t) => `
      <div class="tool">
        ${t.img
          ? `<span class="tool__logo${t.light ? " tool__logo--light" : ""}"><img src="${t.img}" alt="${t.name}" /></span>`
          : `<span class="tool__logo tool__logo--text">${t.text}</span>`}
        <span class="tool__name">${t.name}</span>
      </div>`).join("")}</div>`;
  }

  function showTab(name, animate) {
    const render = () => {
      panel.innerHTML = name === "tools" ? toolsHTML() : DATA[name].map(cardHTML).join("");
      if (hasGsap && !reduce && animate) {
        gsap.fromTo(panel.querySelectorAll(".pcard, .tool"),
          { y: 30, opacity: 0, filter: "blur(6px)" },
          { y: 0, opacity: 1, filter: "blur(0px)", duration: .6, stagger: .05, ease: "power3.out" });
      }
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    };
    if (hasGsap && !reduce && animate && panel.children.length) {
      gsap.to(panel.children, { opacity: 0, y: -10, duration: .2, stagger: .015, onComplete: render });
    } else render();
  }

  const tabs = $$(".tab");
  const pill = $(".tabs__pill");
  function movePill(btn) {
    pill.style.width = btn.offsetWidth + "px";
    pill.style.transform = `translateX(${btn.offsetLeft - 6}px)`;
  }
  tabs.forEach((t) => t.addEventListener("click", () => {
    if (t.classList.contains("is-active")) return;
    tabs.forEach((x) => { x.classList.toggle("is-active", x === t); x.setAttribute("aria-selected", x === t); });
    movePill(t);
    showTab(t.dataset.tab, true);
  }));
  movePill($(".tab.is-active"));
  window.addEventListener("resize", () => movePill($(".tab.is-active")));
  showTab("commercial", false);

  /* ================= MODAL ================= */
  const modal = $("#modal"), media = $("#modalMedia"), mTitle = $("#modalTitle");
  let lenis;
  function openModal(id, title, short) {
    media.innerHTML = `<iframe src="${preview(id)}" allow="autoplay; fullscreen" allowfullscreen title="${title}"></iframe>`;
    media.classList.toggle("is-short", !!short);
    mTitle.textContent = title;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    lenis && lenis.stop();
  }
  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    setTimeout(() => (media.innerHTML = ""), 350);
    lenis && lenis.start();
  }
  document.addEventListener("click", (e) => {
    const v = e.target.closest("[data-video]");
    if (v) { openModal(v.dataset.video, v.dataset.title, v.dataset.short); return; }
    if (e.target.closest("[data-close]")) closeModal();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal(); });

  /* ================= NAV ACTIVE LINK ================= */
  const links = $$(".nav__links a");
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + en.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("main section[id]").forEach((s) => io.observe(s));

  /* ================= TYPEWRITER ================= */
  const typed = $("#typed");
  const words = ["Moho 2D Animator", "Stickman Specialist", "Rigging & Lip-sync", "Faceless YouTube Videos"];
  function typewriter() {
    if (reduce) { typed.textContent = words[0]; return; }
    let w = 0, i = 0, del = false;
    (function tick() {
      const word = words[w];
      i += del ? -1 : 1;
      typed.textContent = word.slice(0, i);
      let t = del ? 40 : 85;
      if (!del && i === word.length) { del = true; t = 1700; }
      else if (del && i === 0) { del = false; w = (w + 1) % words.length; t = 350; }
      setTimeout(tick, t);
    })();
  }

  /* ================= LANYARD ================= */
  const badge = $("#badge");
  let lanyard = null;
  if (!reduce) {
    lanyard = window.Lanyard(badge, $("#badgeCard"), $("#strap"));
    badge.addEventListener("lanyard:grab", () => {
      const h = $(".badge__hint"); if (h) h.style.opacity = 0;
    }, { once: true });
  } else badge.classList.add("is-static");

  /* ================= NO GSAP / REDUCED MOTION FALLBACK ================= */
  const intro = $(".intro");
  const counters = $$("[data-count]");
  const setCount = (n, v) => (n.textContent = Math.round(v) + (n.dataset.suffix || ""));

  if (!hasGsap || reduce) {
    intro.remove();
    document.body.classList.remove("is-intro");
    counters.forEach((n) => setCount(n, +n.dataset.count));
    typewriter();
    lanyard && lanyard.drop();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.1 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
    $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
      const target = $(a.getAttribute("href"));
      if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: a.getAttribute("href") === "#home" ? -200 : -90 }); }
    }));
  }

  /* ---------- Intro → site ---------- */
  gsap.set(".fx", { opacity: 0, y: 28, filter: "blur(8px)" });
  gsap.set(".nav", { opacity: 0, y: -20 });
  gsap.set("#badgeCard, .badge__hint", { opacity: 0 });

  gsap.timeline({ delay: .3 })
    .to(".intro__icons svg", { opacity: 1, duration: .5, stagger: .15 })
    .to(".intro__line .w", { opacity: 1, filter: "blur(0px)", duration: .55, stagger: .16, ease: "power2.out" }, "+=.1")
    .to(".intro__url", { opacity: 1, duration: .4 }, "-=.1")
    .to(".intro", { opacity: 0, scale: 1.04, duration: .7, ease: "power2.inOut" }, "+=.7")
    .add(() => {
      intro.remove();
      document.body.classList.remove("is-intro");
      lenis && lenis.start();
      gsap.set("#badgeCard", { opacity: 1 });
      lanyard && lanyard.drop();
      typewriter();
    })
    .to(".nav", { opacity: 1, y: 0, duration: .7, ease: "power3.out" }, "-=.2")
    .to(".fx", { opacity: 1, y: 0, filter: "blur(0px)", duration: .9, stagger: .09, ease: "power3.out" }, "<")
    .to(".badge__hint", { opacity: 1, duration: .6 }, "+=.4");

  /* ---------- Scroll reveals ---------- */
  ScrollTrigger.batch(".reveal", {
    start: "top 88%",
    onEnter: (els) => gsap.fromTo(els,
      { y: 40, opacity: 0, filter: "blur(8px)" },
      { y: 0, opacity: 1, filter: "blur(0px)", duration: .9, stagger: .08, ease: "power3.out", overwrite: true })
  });
  gsap.set(".reveal", { opacity: 0 });

  /* ---------- About photo parallax ---------- */
  gsap.to(".about__ring", { yPercent: -10, ease: "none", scrollTrigger: { trigger: ".about", start: "top bottom", end: "bottom top", scrub: true } });

  /* ---------- Counters ---------- */
  counters.forEach((n) => {
    const o = { v: 0 };
    gsap.to(o, { v: +n.dataset.count, duration: 1.6, ease: "power2.out", onUpdate: () => setCount(n, o.v), scrollTrigger: { trigger: n, start: "top 92%" } });
  });

  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
