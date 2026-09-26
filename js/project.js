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
  const setHeaderThemes = () => $$('main > section').forEach((s) => (s.dataset.header = theme(p)));

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
  // Projects with a live preview (HTML fold or video clip) open on it full-screen, like the real site.
  const hero = $('.project-hero');
  let fold = null;
  if (p.preview || p.video) {
    hero.classList.add('project-hero--live');
    const h1 = $('.project-hero__title');
    h1.classList.add('sr-only');
    delete h1.dataset.fit;
    delete h1.dataset.reveal;
    if (p.video) {
      fold = document.createElement('video');
      Object.assign(fold, { src: p.video, muted: true, loop: true, autoplay: true, playsInline: true });
      fold.setAttribute('muted', '');
      fold.setAttribute('aria-label', `${p.title} — video`);
    } else {
      fold = document.createElement('iframe');
      fold.src = p.preview;
      fold.title = `${p.title} — live hero`;
      fold.tabIndex = -1;
    }
    fold.className = 'project-hero__live';
    hero.prepend(fold);
    if (p.video) {
      const t = Site.liveTitle(p);
      $('.live-title__text', t).dataset.reveal = 'lines';
      fold.after(t);
    }
    // the meta row moves below the hero, and the hero replaces the cover
    const row = $('.page-hero__row', hero);
    const metaBlock = document.createElement('section');
    metaBlock.className = 'project-meta';
    metaBlock.appendChild(row);
    hero.after(metaBlock);
    $('.project-cover').remove();

    let play, pause;
    if (p.video) {
      play = () => fold.play().catch(() => {});
      pause = () => fold.pause();
    } else {
      // the iframe ignores the pointer (so scrolling + the cursor keep working) — forward it instead
      const tell = (msg) => fold.contentWindow && fold.contentWindow.postMessage(msg, '*');
      hero.dataset.cursor = 'Click to release';
      hero.addEventListener('pointermove', (e) => tell({ pointer: [e.clientX / innerWidth, e.clientY / innerHeight] }));
      hero.addEventListener('click', () => tell('burst'));
      play = () => tell('play');
      pause = () => tell('pause');
    }
    Site.onInit(() => ScrollTrigger.create({
      trigger: hero, start: 'top top', end: 'bottom top', onLeave: pause, onEnterBack: play,
    }));
  } else {
    const cover = $('.project-cover__frame img');
    cover.src = p.cover;
    cover.alt = `${p.title} — cover`;
  }
  $('.project-intro__lead').textContent = p.intro;
  $('.project-intro__body').textContent = p.body;
  if (p.url) {
    $('.project-intro__body').insertAdjacentHTML('afterend',
      `<a class="pill mono project-link" href="${p.url}" target="_blank" rel="noopener" data-magnetic>Visit live site <span>↗</span></a>`);
  }

  // full video (with sound + controls) between the intro and the gallery
  if (p.film) {
    $('.gallery').insertAdjacentHTML('beforebegin', `
      <section class="project-film" id="film">
        <div class="project-film__inner">
          <div class="project-film__head mono"><span>(Full video)</span><span>Sound on ♪</span></div>
          <video class="project-film__video" src="${p.film}" poster="${p.cover}" controls playsinline preload="metadata"></video>
        </div>
      </section>`);
    const film = $('.project-film__video');
    // jump-to button on the hero; the click counts as the gesture that allows playback with sound
    hero.insertAdjacentHTML('beforeend', '<a class="pill mono project-watch" href="#film">Watch the full video <span>↓</span></a>');
    $('.project-watch').addEventListener('click', (e) => {
      e.preventDefault();
      const play = () => film.play().catch(() => {});
      // scroll so the player (labels + video) sits centred in the screen, then start it
      const box = $('.project-film__inner');
      const offset = -Math.max(0, (innerHeight - box.getBoundingClientRect().height) / 2);
      if (Site.lenis) Site.scrollTo(box, { offset, onComplete: play });
      else { scrollTo({ top: box.getBoundingClientRect().top + scrollY + offset }); play(); }
    });
    // the looping hero clip rests while the full video plays
    film.addEventListener('play', () => fold && fold.pause && fold.pause());
  }

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

  setHeaderThemes();
  if (p.video) hero.dataset.header = 'light'; // light header on top of the dimmed clip

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
    if (!fold) stretchy($('.project-hero__title'), { listen: hero, radius: 0.2 });
    stretchy($('.next__title'), { listen: nextEl, radius: 0.2 });
    Site.fitAll();

    const bar = $('.next__bar');
    nextEl.addEventListener('pointerenter', () => gsap.to(bar, { scaleX: 1, duration: 0.8, ease: 'expo.out' }));
    nextEl.addEventListener('pointerleave', () => gsap.to(bar, { scaleX: 0, duration: 0.6, ease: 'expo.inOut' }));
  });
})();
