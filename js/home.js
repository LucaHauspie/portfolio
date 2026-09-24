/* =========================================================================
   HOME — hero project swap, marquee, works list/grid, statement
   ========================================================================= */

(() => {
  const { $, $$, splitChars, splitWords, fit, stretchy, reduce, touch } = Site;
  const P = Site.projects;
  const pad = (n) => String(n).padStart(2, '0');
  const href = (p) => `project.html?p=${p.slug}`;
  const isLight = (hex) => {
    const n = parseInt(hex.replace('#', ''), 16);
    return ((n >> 16) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114) / 255 > 0.5;
  };

  /* ------------------------------------------------------------------ HERO */

  const hero = $('.hero');
  const title = $('.hero__title');
  const media = $('.hero__media');
  const mediaImg = $('img', media);
  const strip = $('.hero__strip');
  const NAME = ['Luca', 'Hauspie'];

  const setLines = (lines) => {
    title.innerHTML = lines.map((l) => `<span class="line"><span class="line__in">${l}</span></span>`).join('');
    $$('.line__in', title).forEach(splitChars);
  };
  setLines(NAME);
  const heroType = stretchy(title, { listen: hero, radius: 0.2 });

  strip.innerHTML =
    P.map((p, i) => `
      <a class="thumb" href="${href(p)}" data-i="${i}" data-label="${p.title}" data-cursor="View case">
        <div class="thumb__img"><img src="${p.cover}" alt="${p.title} — cover"></div>
        <div class="thumb__label"><span>(${pad(i + 1)}) ${p.title}</span><span>${p.year}</span></div>
      </a>`).join('') + '<span class="hero__scroll">Scroll ↓</span>';
  const thumbs = $$('.thumb', strip);

  gsap.set(hero, { '--hero-bg': '#f2efe9', '--hero-fg': '#0e0e0e' });

  let current = -1;
  function show(i) {
    if (i === current) return;
    current = i;
    const p = P[i];
    setLines(p ? p.lines : NAME);
    heroType.refresh();
    fit(title);
    if (!reduce) {
      gsap.fromTo($$('.ch', title), { yPercent: 110 }, { yPercent: 0, duration: 0.8, ease: 'expo.out', stagger: 0.018 });
    }
    gsap.to(hero, {
      '--hero-bg': p ? p.color : '#f2efe9',
      '--hero-fg': p ? p.ink : '#0e0e0e',
      duration: 0.6,
      ease: 'power2.out',
    });
    Site.setHeader(p && isLight(p.ink) ? 'light' : 'dark');
    gsap.to(thumbs, { opacity: (k) => (i < 0 || k === i ? 1 : 0.35), duration: 0.4 });

    if (p) {
      mediaImg.src = p.cover;
      gsap.to(media, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'expo.out', overwrite: true });
      gsap.fromTo(mediaImg, { scale: 1.4 }, { scale: 1, duration: 1.2, ease: 'expo.out' });
    } else {
      gsap.to(media, { clipPath: 'inset(50% 50% 50% 50%)', duration: 0.6, ease: 'expo.inOut', overwrite: true });
    }
  }

  if (!touch) {
    thumbs.forEach((t, i) => {
      t.addEventListener('pointerenter', () => show(i));
      t.addEventListener('focus', () => show(i));
    });
    strip.addEventListener('pointerleave', () => show(-1));
    strip.addEventListener('focusout', (e) => !strip.contains(e.relatedTarget) && show(-1));

    // media card drifts with the pointer
    const mx = gsap.quickTo(media, 'x', { duration: 1, ease: 'power3' });
    const my = gsap.quickTo(media, 'y', { duration: 1, ease: 'power3' });
    const mr = gsap.quickTo(media, 'rotation', { duration: 1, ease: 'power3' });
    hero.addEventListener('pointermove', (e) => {
      const nx = e.clientX / innerWidth - 0.5;
      const ny = e.clientY / innerHeight - 0.5;
      mx(nx * innerWidth * 0.25);
      my(ny * innerHeight * 0.2);
      mr(nx * 8);
    });
  }

  if (!reduce) {
    gsap.set($$('.ch', title), { yPercent: 110 });
    gsap.set(thumbs, { yPercent: 30, opacity: 0 });
  }

  /* --------------------------------------------------------------- MARQUEE */

  const track = $('.marquee__track');
  const item = `<div class="marquee__item display">${P.map((p) => `<span>${p.title}</span><i>✺</i>`).join('')}</div>`;
  track.innerHTML = item + item;

  /* ----------------------------------------------------------------- WORKS */

  const list = $('.works__list');
  list.innerHTML = P.map((p, i) => `
    <a class="work" href="${href(p)}" data-i="${i}" data-label="${p.title}" data-cursor="View case">
      <span class="work__num mono">(${i + 1})</span>
      <span class="work__media"><img src="${p.cover}" alt="${p.title} — cover" loading="lazy"></span>
      <h3 class="work__title display"><span class="work__name" data-split>${p.title}</span></h3>
      <span class="work__meta mono">${p.tags.join(', ')}<br>${p.year} <span class="work__arrow">→</span></span>
    </a>`).join('');
  list.dataset.reveal = 'stagger';

  const preview = $('.work-preview');
  $('.work-preview__inner', preview).innerHTML = P.map((p) => `<img src="${p.cover}" alt="">`).join('');
  const previewImgs = $$('img', preview);

  /* ---------------------------------------------------------------- init */

  Site.onInit(() => {
    // hero drifts away as you scroll
    if (!reduce) {
      gsap.to(title, {
        yPercent: 35, scale: 0.85, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
      });
    }

    // marquee: loops forever, speeds up + flips with scroll direction
    if (!reduce) {
      const loop = gsap.to(track, { xPercent: -50, ease: 'none', duration: 22, repeat: -1 });
      loop.totalTime(loop.duration() * 50); // room to play in reverse
      const skew = gsap.quickTo($$('.marquee__item', track), 'skewX', { duration: 0.4, ease: 'power3' });
      let dir = 1;
      ScrollTrigger.create({
        onUpdate(self) {
          const v = self.getVelocity();
          dir = self.direction;
          gsap.to(loop, { timeScale: dir * Math.min(5, 1 + Math.abs(v) / 400), duration: 0.2, overwrite: true });
          gsap.to(loop, { timeScale: dir, duration: 1.2, delay: 0.25 });
          skew(gsap.utils.clamp(-12, 12, v / -150));
        },
      });
    }

    // statement: words light up as you scroll, inline images open up
    const statement = $('.statement__text');
    const units = splitWords(statement);
    if (!reduce) {
      const st = { trigger: statement, start: 'top 80%', end: 'bottom 50%', scrub: true };
      gsap.fromTo(units, { opacity: 0.12 }, { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: st });
      gsap.fromTo($$('.inline-img', statement), { width: 0 }, { width: '1.8em', ease: 'none', scrollTrigger: st });
    }

    // list / grid toggle with GSAP Flip
    const pill = $('.toggle__pill');
    const buttons = $$('.toggle button');
    const movePill = (btn, animate) =>
      gsap.to(pill, { x: btn.offsetLeft - 3, width: btn.offsetWidth, duration: animate ? 0.6 : 0, ease: 'expo.out' });
    movePill(buttons[0], false);

    buttons.forEach((btn) => btn.addEventListener('click', () => {
      const grid = btn.dataset.mode === 'grid';
      if (grid === list.classList.contains('is-grid')) return;
      buttons.forEach((b) => b.setAttribute('aria-pressed', b === btn));
      movePill(btn, true);
      hidePreview();
      const targets = $$('.work__media, .work__name, .work__num, .work__meta', list);
      const state = Flip.getState(targets);
      list.classList.toggle('is-grid', grid);
      if (reduce) return ScrollTrigger.refresh();
      Flip.from(state, {
        duration: 1.1,
        ease: 'expo.inOut',
        scale: true,
        stagger: 0.015,
        onComplete: () => ScrollTrigger.refresh(),
      });
    }));

    // floating preview that follows the cursor over the list
    let z = 1;
    let lastX = 0;
    const qx = gsap.quickTo(preview, 'x', { duration: 0.7, ease: 'power3' });
    const qy = gsap.quickTo(preview, 'y', { duration: 0.7, ease: 'power3' });
    const qr = gsap.quickTo(preview, 'rotation', { duration: 0.9, ease: 'power3' });
    gsap.set(preview, { xPercent: -50, yPercent: -50 });

    function hidePreview() { gsap.to(preview, { opacity: 0, scale: 0.6, duration: 0.4, ease: 'power3', overwrite: 'auto' }); }

    if (!touch && !reduce) {
      list.addEventListener('pointermove', (e) => {
        qx(e.clientX);
        qy(e.clientY);
        qr(gsap.utils.clamp(-14, 14, (e.clientX - lastX) * 0.6));
        lastX = e.clientX;
      });
      $$('.work', list).forEach((row, i) => {
        row.addEventListener('pointerenter', () => {
          if (list.classList.contains('is-grid')) return;
          gsap.to(preview, { opacity: 1, scale: 1, duration: 0.5, ease: 'expo.out', overwrite: 'auto' });
          gsap.fromTo(previewImgs[i],
            { clipPath: 'inset(100% 0% 0% 0%)', zIndex: ++z, scale: 1.3 },
            { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 0.7, ease: 'expo.out' });
        });
      });
      list.addEventListener('pointerleave', hidePreview);
    }
  });

  /* ----------------------------------------------------------------- ready */

  Site.onReady(() => {
    if (reduce) return;
    gsap.timeline()
      .to($$('.ch', title), { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: 0.04 })
      .to(thumbs, { yPercent: 0, opacity: 1, duration: 1, ease: 'expo.out', stagger: 0.08 }, 0.3);
  });
})();
