# Portfolio — SriHarsha Samala

A cinematic, scroll-driven personal portfolio built with vanilla HTML, CSS, JavaScript, Three.js, and GSAP.

## Structure

```
index.html          # single-page site
css/                # base tokens + section styles
js/                 # hero/about scenes, journey, finale, interactions
vendor/             # Three.js, GSAP, ScrollTrigger, fonts (self-hosted)
assets/             # favicon
```

## Run locally

```bash
python3 -m http.server 4173
# http://127.0.0.1:4173/
```

## Deploy

The site is fully static — no build step is required. Vercel will serve the project root as-is.

- **Drag & drop:** https://vercel.com/new — upload this folder.
- **CLI:** `npx vercel` from this directory.
- **Git:** import `harshasamala9-lab/portfolio-Cinematic` in Vercel.
