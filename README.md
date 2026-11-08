# Nguyen Minh Duc — 2D Animator Portfolio

Static portfolio site (HTML + CSS + JS, no build step) with GSAP scroll animations:
preloader, split-text reveals, skills marquee, pinned showreel that grows on scroll,
horizontal commercial gallery, filterable YouTube series grid, custom cursor and magnetic buttons.

Videos play from Google Drive (files must be shared "Anyone with the link").

## Edit content

- **Videos / titles:** `projects.js` — each entry is a Google Drive file ID + title.
- **Showreel:** `data-video` / `data-thumb` on `.reel__frame` in `index.html`.
- **Text, links:** `index.html`. Colors and fonts: top of `styles.css`.

## Deploy on Cloudflare Pages

1. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick this repo.
2. Framework preset: **None**, build command: *(empty)*, output directory: `/`.
3. After deploy: project → Custom domains → add `animation.gripe` (DNS is set up automatically when the domain is on Cloudflare).

## Run locally

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```
