/* =========================================================================
   HOME — hero project swap, marquee, works list/grid, statement
   ========================================================================= */

(() => {
  const { $, $$, splitChars, splitWords, fit, stretchy, reduce, touch } = Site;
  const P = Site.projects;
  const pad = (n) => String(n).padStart(2, '0');
  const href = (p) => `project.html?p=${p.slug}`;
  // Iframes only start loading once someone hovers the projects (or shortly after the page is ready),
  // so the live previews don't weigh down the first load of the home page.
  const lazyFrames = [];
  const wake = () => lazyFrames.forEach((f) => { if (!f.src) f.src = f.dataset.src; });
  const frame = (p, cls = 'preview-frame') => {
    const f = document.createElement('iframe');
    f.className = cls;
    f.dataset.src = `${p.preview}?embed`;
    lazyFrames.push(f);
    f.title = `${p.title}, live preview`;
    f.tabIndex = -1;
    f.setAttribute('aria-hidden', 'true');
    return f;
  };
  const tell = (f, msg) => f && f.contentWindow && f.contentWindow.postMessage(msg, '*');

  // A live preview is either an HTML fold (p.preview → iframe) or a muted clip (p.video → video).
  const hasLive = (p) => !!(p && (p.preview || p.video || p.still));
  const liveEl = (p) => {
    if (p.still) {
      const img = new Image();
      img.className = 'preview-frame preview-still';
      img.src = p.still;
      img.alt = '';
      return img;
    }
    if (!p.video) return frame(p);
    const v = document.createElement('video');
    v.className = 'preview-frame preview-video';
    v.src = p.video;
    v.muted = true;
    v.setAttribute('muted', '');
    v.loop = true;
    v.playsInline = true;
    v.preload = 'auto';
    v.setAttribute('aria-hidden', 'true');
    return v;
  };
  // 'play' restarts a clip from the top (like the fold's puk bursting again), 'pause' stops it
  const control = (el, msg) => {
    if (el && el.classList.contains('preview-scaled')) el = el.firstElementChild;
    if (!el) return;
    if (el.tagName !== 'VIDEO') return tell(el, msg);
    if (msg === 'play') { el.currentTime = 0; el.play().catch(() => {}); }
    if (msg === 'pause') el.pause();
  };
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
      <a class="thumb" href="${href(p)}" data-i="${i}" data-label="${p.title}" data-cursor="${Site.t('viewCase')}">
        <div class="thumb__img"><img src="${p.cover}" alt="${p.title}, cover"></div>
        <div class="thumb__label"><span>(${pad(i + 1)}) ${p.title}</span><span>${p.year}</span></div>
      </a>`).join('') + `<span class="hero__scroll">${Site.t('scroll')}</span>`;
  const thumbs = $$('.thumb', strip);
  strip.style.gridTemplateColumns = `repeat(${P.length}, 1fr) auto`;
  const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  $$('[data-count]').forEach((el) => (el.textContent = el.dataset.count === 'word' ? words[P.length] || P.length : pad(P.length)));

  // Projects with a live preview take over the whole hero with their own fold / clip.
  const takeovers = P.map((p, i) => {
    if (!hasLive(p)) return null;
    const layer = document.createElement('div');
    layer.className = 'hero__takeover';
    const f = layer.appendChild(liveEl(p));
    if (p.video) layer.appendChild(Site.liveTitle(p));
    if (f.tagName === 'IFRAME') {
      f.addEventListener('load', () => {
        if (!f.getAttribute('src')) return; // the empty iframe fires 'load' before its real src is set
        tell(f, { corners: false }); // the project strip sits where the fold's corner texts would be
        if (current === i) tell(f, 'play');
      });
    }
    hero.appendChild(layer);
    return layer;
  });
  const meta = $('.hero__meta');
  const stage = $('.hero__stage');
  let sub = null;
  function showSub(p) {
    if (sub) { const old = sub; gsap.to(old, { opacity: 0, y: 10, duration: 0.25, onComplete: () => old.remove() }); sub = null; }
    if (!p || !p.subtitle || p.preview || p.video) return; // folds + video titles carry their own subtitle
    sub = stage.appendChild(Site.subTag(p, 'hero__sub'));
    gsap.fromTo(sub, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'expo.out', delay: 0.25 });
  }
  // During a takeover the other projects step back a little (scaled from the bottom, so the strip keeps its layout).
  function setMini(on, active) {
    thumbs.forEach((t, k) => gsap.to(t, {
      scale: on && k !== active ? 0.8 : 1,
      transformOrigin: '50% 100%', duration: reduce ? 0 : 0.6, ease: 'expo.out', overwrite: 'auto',
    }));
  }
  // clip-path that matches a thumbnail, so the takeover grows out of it (and shrinks back into it)
  const thumbClip = (i) => {
    const h = hero.getBoundingClientRect();
    const r = $('.thumb__img', thumbs[i]).getBoundingClientRect();
    return `inset(${r.top - h.top}px ${h.right - r.right}px ${h.bottom - r.bottom}px ${r.left - h.left}px)`;
  };

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
    // a video can be light or dark from frame to frame → light UI text with a shadow on top of it
    const video = !!(p && p.video);
    document.body.classList.toggle('is-video-hero', video);
    Site.setHeader(video || (p && isLight(p.ink)) ? 'light' : 'dark');
    const live = hasLive(p);
    gsap.to(thumbs, { opacity: (k) => (i < 0 || k === i ? 1 : live ? 0.7 : 0.35), duration: 0.4 });
    gsap.to([title, meta], { opacity: live ? 0 : 1, duration: 0.4 });
    setMini(live, i);
    showSub(p);

    takeovers.forEach((layer, k) => {
      if (!layer) return;
      const f = layer.firstElementChild;
      if (k === i) {
        layer.classList.add('is-on');
        control(f, 'play');
        const lines = $$('.live-title .line__in', layer);
        if (lines.length && !reduce) {
          gsap.fromTo(lines, { yPercent: 110 }, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08, delay: 0.35 });
          gsap.fromTo($$('.live-title__kicker', layer), { opacity: 0 }, { opacity: 1, duration: 0.6, delay: 0.6 });
        }
        gsap.fromTo(layer, { clipPath: thumbClip(k) },
          { clipPath: 'inset(0px 0px 0px 0px)', duration: reduce ? 0 : 0.9, ease: 'expo.inOut', overwrite: true });
      } else if (layer.classList.contains('is-on')) {
        gsap.to(layer, {
          clipPath: thumbClip(k), duration: reduce ? 0 : 0.6, ease: 'expo.inOut', overwrite: true,
          onComplete: () => { layer.classList.remove('is-on'); control(f, 'pause'); },
        });
      }
    });

    if (p && !live) {
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
      const live = takeovers[current];
      if (live && $('iframe', live)) tell($('iframe', live), { pointer: [e.clientX / innerWidth, e.clientY / innerHeight] });
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
    <a class="work" href="${href(p)}" data-i="${i}" data-label="${p.title}" data-cursor="${Site.t('viewCase')}"${p.title.length > 18 ? ' data-long' : ''}>
      <span class="work__num mono">(${i + 1})</span>
      <span class="work__media"><img src="${p.cover}" alt="${p.title}, cover" loading="lazy"></span>
      <h3 class="work__title display"><span class="work__name" data-split>${p.title}</span></h3>
      <span class="work__meta mono">${p.tags.join(', ')}<br>${p.year} <span class="work__arrow">→</span></span>
    </a>`).join('');
  list.dataset.reveal = 'stagger';

  const preview = $('.work-preview');
  const previewInner = $('.work-preview__inner', preview);
  const previewImgs = P.map((p) => {
    if (p.preview) {
      // the fold is laid out for a full screen: render it at desktop size and scale it down to the card
      const box = document.createElement('div');
      box.className = 'preview-scaled';
      box.appendChild(frame(p, ''));
      return previewInner.appendChild(box);
    }
    if (hasLive(p)) return previewInner.appendChild(liveEl(p));
    const img = new Image();
    img.src = p.cover;
    img.alt = '';
    return previewInner.appendChild(img);
  });

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

    function hidePreview() {
      gsap.to(preview, { opacity: 0, scale: 0.6, duration: 0.4, ease: 'power3', overwrite: 'auto' });
      previewImgs.forEach((el) => el.tagName !== 'IMG' && control(el, 'pause'));
    }

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
          previewImgs.forEach((el, k) => el.tagName !== 'IMG' && control(el, k === i ? 'play' : 'pause'));
          gsap.fromTo(previewImgs[i],
            { clipPath: 'inset(100% 0% 0% 0%)', zIndex: ++z, scale: 1.3 },
            { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 0.7, ease: 'expo.out' });
        });
      });
      list.addEventListener('pointerleave', hidePreview);
    }
  });

  /* ----------------------------------------------------------------- ready */

  const fitScaled = () => preview.style.setProperty('--s', preview.offsetWidth / 1440);
  fitScaled();
  addEventListener('resize', fitScaled);
  strip.addEventListener('pointerenter', wake, { once: true });
  list.addEventListener('pointerenter', wake, { once: true });

  Site.onReady(() => {
    setTimeout(wake, 2500);
    if (reduce) return;
    gsap.timeline()
      .to($$('.ch', title), { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: 0.04 })
      .to(thumbs, { yPercent: 0, opacity: 1, duration: 1, ease: 'expo.out', stagger: 0.08 }, 0.3);
  });
})();
