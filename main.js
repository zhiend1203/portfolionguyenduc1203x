(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const thumb = (id, w = 1280) => `https://drive.google.com/thumbnail?id=${id}&sz=w${w}`;
  const preview = (id) => `https://drive.google.com/file/d/${id}/preview`;
  const hasGsap = typeof window.gsap !== "undefined";

  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- Build cards ---------- */
  const { commercial, series } = window.PROJECTS;

  function card(p, i, extra = "") {
    const el = document.createElement("article");
    el.className = `card ${extra}`.trim();
    el.dataset.video = p.id;
    el.dataset.title = p.title;
    if (p.cat) el.dataset.cat = p.cat;
    el.innerHTML = `
      <span class="card__num">${String(i + 1).padStart(2, "0")}</span>
      <div class="card__media">
        <span class="card__fallback">${p.title.split(" ")[0]}</span>
        <img alt="${p.title}" loading="lazy" src="${thumb(p.id, 900)}" />
      </div>
      <div class="card__meta">
        <h3 class="card__title">${p.title}</h3>
        <span class="card__tag">${p.tag || p.cat}</span>
      </div>`;
    const img = el.querySelector("img");
    img.addEventListener("error", () => img.remove());
    return el;
  }

  const track = document.getElementById("workTrack");
  commercial.forEach((p, i) => track.appendChild(card(p, i)));

  const grid = document.getElementById("seriesGrid");
  series.forEach((p, i) => grid.appendChild(card(p, i, p.cat === "shorts" ? "is-short" : "")));

  document.querySelectorAll("[data-thumb]").forEach((img) => {
    img.src = thumb(img.dataset.thumb, 1920);
    img.addEventListener("error", () => img.remove());
  });

  /* ---------- Filters ---------- */
  document.querySelectorAll(".filter").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter").forEach((b) => b.classList.toggle("is-active", b === btn));
      const f = btn.dataset.filter;
      const cards = [...grid.children];
      cards.forEach((c) => c.classList.toggle("is-hidden", f !== "all" && c.dataset.cat !== f));
      if (hasGsap && !reduce) {
        gsap.fromTo(cards.filter((c) => !c.classList.contains("is-hidden")),
          { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: .6, stagger: .05, ease: "power3.out" });
      }
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  });

  /* ---------- Modal ---------- */
  const modal = document.getElementById("modal");
  const media = document.getElementById("modalMedia");
  const mTitle = document.getElementById("modalTitle");
  let lenis;

  function openModal(id, title, short) {
    media.innerHTML = `<iframe src="${preview(id)}" allow="autoplay; fullscreen" allowfullscreen title="${title}"></iframe>`;
    media.classList.toggle("is-short", !!short);
    mTitle.textContent = title;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    lenis && lenis.stop();
    if (hasGsap) {
      gsap.to(".modal__backdrop", { opacity: 1, duration: .4 });
      gsap.to(".modal__box", { opacity: 1, scale: 1, duration: .5, ease: "power3.out" });
    } else {
      document.querySelector(".modal__backdrop").style.opacity = 1;
      Object.assign(document.querySelector(".modal__box").style, { opacity: 1, transform: "none" });
    }
  }
  function closeModal() {
    const done = () => {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      media.innerHTML = "";
      lenis && lenis.start();
    };
    if (hasGsap) {
      gsap.to(".modal__backdrop", { opacity: 0, duration: .3 });
      gsap.to(".modal__box", { opacity: 0, scale: .94, duration: .3, onComplete: done });
    } else done();
  }
  document.addEventListener("click", (e) => {
    const v = e.target.closest("[data-video]");
    if (v) { openModal(v.dataset.video, v.dataset.title, v.classList.contains("is-short")); return; }
    if (e.target.closest("[data-close]")) closeModal();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal(); });

  /* ---------- Without GSAP / reduced motion: just show everything ---------- */
  const loader = document.querySelector(".loader");
  if (!hasGsap || reduce) {
    loader.remove();
    document.querySelectorAll(".about__text").forEach((t) => (t.style.opacity = 1));
    document.querySelectorAll("[data-count]").forEach((n) => (n.textContent = n.dataset.count + (n.dataset.suffix || "")));
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.1 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach((a) =>
      a.addEventListener("click", (e) => {
        const target = document.querySelector(a.getAttribute("href"));
        if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: 0 }); }
      }));
  }

  /* ---------- Split text into chars ---------- */
  document.querySelectorAll(".split").forEach((el) => {
    const text = el.textContent;
    el.innerHTML = [...text].map((c) => (c === " " ? " " : `<span class="char">${c}</span>`)).join("");
  });
  document.querySelectorAll(".reveal-words").forEach((el) => {
    el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="word">${w}</span>`).join(" ");
  });

  /* ---------- Preloader → hero intro ---------- */
  document.body.classList.add("is-loading");
  const counter = { v: 0 };
  const countEl = document.getElementById("loaderCount");
  gsap.set(".hero__title .char", { yPercent: 110 });
  gsap.set([".hero__eyebrow", ".hero__sub", ".hero__scroll", ".hero__stick"], { opacity: 0, y: 20 });

  gsap.timeline()
    .to(counter, { v: 100, duration: 1.8, ease: "power2.inOut", onUpdate: () => (countEl.textContent = Math.round(counter.v)) })
    .to(".loader__panel", { scaleY: 1, duration: .6, ease: "power4.inOut" })
    .to(".loader__inner", { opacity: 0, duration: .2 }, "<")
    .set(".loader", { background: "transparent" })
    .to(".loader__panel", { scaleY: 0, transformOrigin: "top", duration: .7, ease: "power4.inOut" })
    .add(() => { loader.remove(); document.body.classList.remove("is-loading"); })
    .to(".hero__title .char", { yPercent: 0, duration: 1, stagger: .025, ease: "power4.out" }, "-=.3")
    .to([".hero__eyebrow", ".hero__sub", ".hero__scroll"], { opacity: 1, y: 0, duration: .8, stagger: .1, ease: "power3.out" }, "-=.7")
    .to(".hero__stick", { opacity: 1, y: 0, duration: .6, ease: "back.out(2)" }, "-=.6");

  /* ---------- Marquee ---------- */
  const mTrack = document.querySelector(".marquee__track");
  mTrack.innerHTML += mTrack.innerHTML;
  const marquee = gsap.to(mTrack, { xPercent: -50, duration: 22, ease: "none", repeat: -1 });
  ScrollTrigger.create({
    onUpdate: (self) => {
      const dir = self.direction;
      gsap.to(marquee, { timeScale: dir * Math.min(1 + Math.abs(self.getVelocity()) / 800, 5), duration: .3, overwrite: true });
      gsap.to(marquee, { timeScale: dir, duration: 1, delay: .3 });
    }
  });

  /* ---------- Hero parallax out ---------- */
  gsap.to(".hero__title", { yPercent: -25, opacity: .3, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  const mm = gsap.matchMedia();

  /* ---------- Showreel grows ---------- */
  mm.add("(min-width: 721px)", () => {
    gsap.timeline({ scrollTrigger: { trigger: ".reel", start: "top top", end: "+=120%", scrub: true, pin: ".reel__pin" } })
      .to(".reel__frame", { width: "100vw", borderRadius: 0, ease: "none" })
      .to(".reel__frame img", { scale: 1, ease: "none" }, 0);
  });

  /* ---------- Horizontal work scroll ---------- */
  mm.add("(min-width: 721px)", () => {
    const dist = () => track.scrollWidth - window.innerWidth;
    gsap.to(track, {
      x: () => -dist(), ease: "none",
      scrollTrigger: { trigger: ".work", start: "top top", end: () => "+=" + dist(), scrub: 1, pin: true, invalidateOnRefresh: true }
    });
  });

  /* ---------- Section titles ---------- */
  document.querySelectorAll(".section-title, .contact__title").forEach((t) => {
    gsap.from(t.querySelectorAll(".char"), {
      yPercent: 110, rotate: 6, duration: .9, stagger: .02, ease: "power4.out",
      scrollTrigger: { trigger: t, start: "top 85%" }
    });
  });

  /* ---------- About word highlight ---------- */
  gsap.to(".about__text .word", {
    opacity: 1, stagger: .05, ease: "none",
    scrollTrigger: { trigger: ".about__text", start: "top 80%", end: "bottom 45%", scrub: true }
  });

  /* ---------- About photo + tools ---------- */
  gsap.fromTo(".about__photo img", { clipPath: "inset(100% 0 0 0 round 24px)", scale: 1.25 }, {
    clipPath: "inset(0% 0 0 0 round 24px)", scale: 1, duration: 1.4, ease: "power4.out",
    scrollTrigger: { trigger: ".about__photo", start: "top 80%" }
  });
  gsap.to(".about__photo", { yPercent: -8, ease: "none", scrollTrigger: { trigger: ".about", start: "top bottom", end: "bottom top", scrub: true } });
  gsap.from(".about__list li", { x: -30, opacity: 0, duration: .7, stagger: .1, ease: "power3.out", scrollTrigger: { trigger: ".about__list", start: "top 85%" } });
  gsap.from(".tool", { y: 40, scale: .6, opacity: 0, duration: .8, stagger: .08, ease: "back.out(2.2)", scrollTrigger: { trigger: ".tools", start: "top 90%" } });

  /* ---------- Counters ---------- */
  document.querySelectorAll("[data-count]").forEach((n) => {
    const o = { v: 0 };
    gsap.to(o, {
      v: +n.dataset.count, duration: 1.6, ease: "power2.out",
      onUpdate: () => (n.textContent = Math.round(o.v) + (n.dataset.suffix || "")),
      scrollTrigger: { trigger: n, start: "top 90%" }
    });
  });

  /* ---------- Grid cards / steps reveal ---------- */
  ScrollTrigger.batch(".grid .card, .step", {
    start: "top 90%",
    onEnter: (els) => gsap.fromTo(els, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: .8, stagger: .08, ease: "power3.out" })
  });

  /* ---------- Custom cursor ---------- */
  const cursor = document.querySelector(".cursor");
  if (matchMedia("(hover: hover)").matches) {
    const xTo = gsap.quickTo(cursor, "x", { duration: .25, ease: "power3" });
    const yTo = gsap.quickTo(cursor, "y", { duration: .25, ease: "power3" });
    window.addEventListener("mousemove", (e) => { xTo(e.clientX); yTo(e.clientY); });
    document.addEventListener("mouseover", (e) => {
      cursor.classList.toggle("is-play", !!e.target.closest("[data-video]"));
      cursor.classList.toggle("is-link", !e.target.closest("[data-video]") && !!e.target.closest("a, button"));
    });

    /* Magnetic buttons */
    document.querySelectorAll(".magnetic").forEach((b) => {
      b.addEventListener("mousemove", (e) => {
        const r = b.getBoundingClientRect();
        gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * .35, y: (e.clientY - r.top - r.height / 2) * .35, duration: .4 });
      });
      b.addEventListener("mouseleave", () => gsap.to(b, { x: 0, y: 0, duration: .7, ease: "elastic.out(1, .4)" }));
    });
  }

  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
