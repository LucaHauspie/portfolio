# Luca Hauspie — Portfolio

Personal portfolio site. Plain HTML/CSS/JS with no build step, animated with [GSAP](https://gsap.com) (ScrollTrigger, Flip) and [Lenis](https://lenis.darkroom.engineering) smooth scroll. Type is set in **Archivo** (variable width + weight) and **JetBrains Mono**.

## Pages

| File | What it is |
| --- | --- |
| `index.html` | Home: interactive hero (hover a project to preview it), marquee, works list ↔ grid (GSAP Flip), statement, contact CTA |
| `project.html?p=<slug>` | Case page, rendered from `js/data.js` |
| `about.html` | About: disciplines, toolbox, education, tone of voice |
| `contact.html` | Contact: copy-to-clipboard e-mail, socials, mailto form |

## Editing content

Almost everything lives in **`js/data.js`**:

- `SITE`: e-mail, socials, availability line, timezone for the live clock
- `PROJECTS`: title, year, tags, colours, cover, intro/body text and `gallery` images

### Adding your project assets

1. Drop images in `assets/projects/<slug>/` (e.g. `cover.jpg`, `01.jpg`, `02.jpg`…).
2. In `js/data.js`, point `cover` to your file and fill `gallery`:
   ```js
   gallery: [
     { src: 'assets/projects/myst/01.jpg', wide: true }, // full width
     'assets/projects/myst/02.jpg',                      // half width
     'assets/projects/myst/03.jpg',
   ],
   ```
3. Covers work best at **4:3**. Gallery halves are 4:5, wide images 16:9.

Replace the portrait in `assets/about/portrait.svg` (update the `src` in `about.html`) and edit the About/Contact copy directly in the HTML (look for `TODO` comments).

## Run locally

```bash
npm install   # first time only
npm start     # → http://localhost:8000, reloads on save
```

## Deploy to GitHub Pages

```bash
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch → `main` / `(root)`**.
The site will be live at `https://<your-username>.github.io/<repo-name>/`.
Name the repo `<your-username>.github.io` to serve it from the root domain instead.

All paths are relative, so it works in a sub-folder without changes.
