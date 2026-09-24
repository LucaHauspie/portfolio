/* =========================================================================
   PROJECT — case page rendered from js/data.js  (project.html?p=<slug>)
   ========================================================================= */

(() => {
  const { $, $$, stretchy } = Site;
  const P = Site.projects;
  const slug = new URLSearchParams(location.search).get('p');
  const i = P.findIndex((p) => p.slug === slug);
  if (i < 0) return location.replace('index.html#works');

  const p = P[i];
  const next = P[(i + 1) % P.length];
  const pad = (n) => String(n).padStart(2, '0');
  const isLight = (hex) => {
    const n = parseInt(hex.replace('#', ''), 16);
    return ((n >> 16) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114) / 255 > 0.5;
  };
  const theme = (proj) => (isLight(proj.ink) ? 'light' : 'dark'); // header text matches the project's text colour

  document.title = `${p.title} — ${window.SITE.name}`;
  document.body.style.setProperty('--p-bg', p.color);
  document.body.style.setProperty('--p-fg', p.ink);
  $$('main > section').forEach((s) => (s.dataset.header = theme(p)));

  // hero
  $('.project-hero__kicker').textContent = `(${pad(i + 1)}/${pad(P.length)}) — ${p.context}`;
  $('.project-hero__title').innerHTML = p.lines
    .map((l) => `<span class="line"><span class="line__in" data-split>${l}</span></span>`).join('');
  $('.project-hero .page-hero__row').innerHTML = `
    <span>(Year)<br>${p.year}</span>
    <span>(Discipline)<br>${p.tags.join(', ')}</span>
    <span>(Role)<br>${p.role}</span>
    <span>(Context)<br>${p.context}</span>`;

  // cover + intro
  const cover = $('.project-cover__frame img');
  cover.src = p.cover;
  cover.alt = `${p.title} — cover`;
  $('.project-intro__lead').textContent = p.intro;
  $('.project-intro__body').textContent = p.body;

  // gallery: real images, or placeholder frames until assets are added
  const pattern = [true, false, false, true, false, false];
  const items = p.gallery.length
    ? p.gallery.map((g) => (typeof g === 'string' ? { src: g } : g))
    : pattern.map((wide) => ({ wide }));
  $('.gallery').innerHTML = items.map((g, k) => `
    <figure class="gallery__item${g.wide ? ' gallery__item--wide' : ''}" data-reveal="clip">
      ${g.src
        ? `<img src="${g.src}" alt="${p.title} — image ${k + 1}" loading="lazy">`
        : `<div class="gallery__ph mono"><span>(${pad(k + 1)}) Asset placeholder</span><b>${pad(k + 1)}</b><span>Add images to gallery[] in js/data.js</span></div>`}
    </figure>`).join('');

  // next project
  const nextEl = $('.next');
  nextEl.href = `project.html?p=${next.slug}`;
  nextEl.dataset.label = next.title;
  nextEl.dataset.header = theme(next);
  nextEl.style.setProperty('--n-bg', next.color);
  nextEl.style.setProperty('--n-fg', next.ink);
  const nextTitle = $('.next__title .line__in');
  nextTitle.textContent = next.title;
  nextTitle.dataset.split = '';
  $('.next__title').dataset.fit = '1';

  Site.onInit(() => {
    stretchy($('.project-hero__title'), { listen: $('.project-hero'), radius: 0.2 });
    stretchy($('.next__title'), { listen: nextEl, radius: 0.2 });
    Site.fitAll();

    const bar = $('.next__bar');
    nextEl.addEventListener('pointerenter', () => gsap.to(bar, { scaleX: 1, duration: 0.8, ease: 'expo.out' }));
    nextEl.addEventListener('pointerleave', () => gsap.to(bar, { scaleX: 0, duration: 0.6, ease: 'expo.inOut' }));
  });
})();
