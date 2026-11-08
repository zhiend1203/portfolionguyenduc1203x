# Nguyen Minh Duc — 2D Animator Portfolio

Static portfolio site (HTML + CSS + JS, no build step). Monochrome dark style:
"Welcome" intro, floating pill nav, typewriter hero, draggable ID badge on a physics lanyard
(`lanyard.js`), About with stats, tabbed Portfolio Showcase (Commercials / YouTube Series /
Shorts / Tools) and glass Contact cards. Animations use GSAP + ScrollTrigger and Lenis.

Videos play from Google Drive (files must be shared "Anyone with the link").

## Edit content

- **Videos / titles:** `projects.js` — each entry is a Google Drive file ID + title.
- **Showreel:** `data-video` / `data-thumb` on `.reel__frame` in `index.html`.
- **Typewriter words, tab descriptions, tools:** top of `main.js`.
- **Text, links:** `index.html`. Colors and fonts: top of `styles.css`.

## Deploy on Cloudflare Pages

1. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick this repo.
2. Framework preset: **None**, build command: *(empty)*, output directory: `/`.
3. After deploy: project → Custom domains → add `animation.gripe` (DNS is set up automatically when the domain is on Cloudflare).

## Run locally

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```
