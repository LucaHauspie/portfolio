/* =========================================================================
   HOME — the pile of TVs in the hero, marquee, works list/grid, statement
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
  // A hill of old TVs (js/pile.js). Five screens show the projects, some show a line of text, the
  // rest glow blank. Hover a project TV: a big screen appears next to it, linked by a thin line, with the live preview.

  const hero = $('.hero');
  const canvas = $('.pile');
  const pop = $('.pile-pop');
  const popScreen = $('.pile-pop__screen', pop);
  const strip = $('.pile-list');
  const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  $$('[data-count]').forEach((el) => (el.textContent = el.dataset.count === 'word' ? words[P.length] || P.length : pad(P.length)));

  // what's on each TV, in the order of the pile in js/pile.js (bottom row first)
  const lines = (key) => Site.t(key).split('<br>');
  // what's on the named TVs of the pile (slots in js/pile.js); every other TV glows blank
  const SCREENS = {
    name: { type: 'text', lines: lines('tvName') },
    role: { type: 'text', lines: lines('tvRole') },
    dev: { type: 'text', lines: lines('tvDev') },
    live: { type: 'text', lines: lines('tvLive'), tone: 'red' },
  };
  P.forEach((p, i) => { SCREENS[`p${i}`] = { type: 'project', index: i, image: p.cover }; });
  const slotOf = (i) => `p${i}`;

  // project list under the pile: for keyboards, touch and as a fallback without WebGL
  strip.innerHTML = P.map((p, i) => `
    <a class="pile-list__item" href="${href(p)}" data-i="${i}" data-label="${p.title}">
      <img src="${p.cover}" alt="" loading="lazy"><span>(${pad(i + 1)}) ${p.title}</span>
    </a>`).join('');
  const items = $$('.pile-list__item', strip);

  // the big preview: one element per project, made the first time it's needed
  const previews = [];
  const previewOf = (i) => {
    if (previews[i]) return previews[i];
    const p = P[i];
    let el;
    if (p.preview) {
      el = document.createElement('div');
      el.className = 'preview-scaled';
      const f = el.appendChild(frame(p, ''));
      f.addEventListener('load', () => { if (f.getAttribute('src') && showing === i) tell(f, 'play'); });
    } else el = liveEl(p);
    popScreen.appendChild(el);
    previews[i] = el;
    wake();
    return el;
  };
  const sizePop = () => popScreen.style.setProperty('--s', popScreen.offsetWidth / 1600); // folds render at 1600 × 900

  // the line from the TV to its big screen: redrawn every frame, the TV moves a little with the camera
  const line = $('.pile-line line');
  const dot = $('.pile-line circle');
  let lineSlot = null, side = 1;
  const drawLine = () => {
    if (!lineSlot || !pile) return;
    const h = hero.getBoundingClientRect();
    const r = pile.rectOf(lineSlot);
    const pr = popScreen.getBoundingClientRect();
    if (!r) return;
    const x1 = (side > 0 ? r.right : r.left) - h.left, y1 = r.top + r.height / 2 - h.top;
    const x2 = (side > 0 ? pr.left : pr.right) - h.left, y2 = pr.top + pr.height / 2 - h.top;
    line.setAttribute('x1', x1); line.setAttribute('y1', y1); line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    dot.setAttribute('cx', x1); dot.setAttribute('cy', y1);
  };
  gsap.ticker.add(drawLine);

  // a small label above every project TV, so you can tell which ones play something
  const tagsEl = $('.pile-tags');
  tagsEl.innerHTML = P.map((p, i) => `<span class="pile-tag"><i></i>${pad(i + 1)}<span>${p.title}</span></span>`).join('');
  const tags = $$('.pile-tag', tagsEl);
  const placeTags = () => {
    if (!pile || !hero.classList.contains('tags-on')) return;
    const h = hero.getBoundingClientRect();
    if (h.bottom < 0) return;
    tags.forEach((tag, i) => {
      const r = pile.rectOf(slotOf(i));
      if (r) tag.style.transform = `translate(${r.left - h.left}px, ${r.top - h.top - 22}px)`;
      tag.classList.toggle('is-active', showing === i);
    });
  };
  gsap.ticker.add(placeTags);

  let showing = -1;
  let pile = null;
  function showPop(i, slot) {
    if (i === showing) return;
    if (showing >= 0 && previews[showing]) control(previews[showing], 'pause');
    showing = i;
    if (i < 0) {
      gsap.to([pop, '.pile-line'], { opacity: 0, duration: 0.2, ease: 'power2.in', overwrite: true, onComplete: () => { lineSlot = null; } });
      Site.cursorLabel && Site.cursorLabel(null);
      return;
    }
    const p = P[i];
    const el = previewOf(i);
    previews.forEach((x) => x && (x.style.display = x === el ? '' : 'none'));
    $('.pile-pop__num', pop).textContent = pad(i + 1);
    $('.pile-pop__title', pop).textContent = p.title;
    $('.pile-pop__sub', pop).textContent = `${p.subtitle || p.tags.join(', ')} · ${p.year}`;
    $('.pile-pop__meta', pop).textContent = touch ? 'Tap to open' : 'Click to open';
    sizePop();
    // next to the TV, far enough for the line to show: right if there's room, else left; under the pile on phones
    const h = hero.getBoundingClientRect();
    const r = pile && slot ? pile.rectOf(slot) : null;
    const w = pop.offsetWidth, ph = pop.offsetHeight;
    let x, y;
    if (!r || innerWidth < 720) {
      x = (h.width - w) / 2; y = Math.max(84, h.height - ph - strip.offsetHeight - 44); side = 0;
    } else {
      const gap = Math.min(120, innerWidth * 0.06);
      // open towards the side the TV is on (outwards, over the empty room), kept inside the window
      side = r.left + r.width / 2 > innerWidth / 2 ? 1 : -1;
      x = side > 0 ? Math.min(r.right + gap, innerWidth - 24 - w) : Math.max(r.left - gap - w, 24);
      // no room on that side without covering the TV: open on the other side
      if (side > 0 && x < r.right + 16) { side = -1; x = Math.max(r.left - gap - w, 24); }
      else if (side < 0 && x + w > r.left - 16) { side = 1; x = Math.min(r.right + gap, innerWidth - 24 - w); }
      x -= h.left;
      y = Math.min(Math.max(r.top + r.height / 2 - popScreen.offsetHeight / 2 - h.top, 84), h.height - ph - 72); // clear of the list
    }
    gsap.set(pop, { x, y });
    lineSlot = side ? slot : null;
    gsap.fromTo(pop, { opacity: 0, y: y + 10 }, { opacity: 1, y, duration: 0.45, ease: 'expo.out', overwrite: true });
    if (!reduce) gsap.fromTo(popScreen, { scaleY: 0.02, filter: 'brightness(3)' }, { scaleY: 1, filter: 'brightness(1)', duration: 0.45, ease: 'expo.out', delay: 0.12 });
    // the line draws itself from the TV to the screen
    drawLine();
    const len = line.getTotalLength ? line.getTotalLength() : 300;
    gsap.set('.pile-line', { opacity: lineSlot ? 1 : 0 });
    if (lineSlot) gsap.fromTo(line, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: reduce ? 0 : 0.35, ease: 'power2.out', clearProps: 'strokeDasharray,strokeDashoffset' });
    control(el, 'play');
    Site.cursorLabel && Site.cursorLabel(touch ? null : Site.t('viewCase'));
  }

  // open a project with the site's page transition (main.js handles clicks on links)
  const open = (i) => { const a = items[i]; if (a) a.click(); };

  function startPile() {
    // (the path is relative to this script, not the page)
    import('./pile.js').then(({ createPile }) => createPile(canvas, {
      screens: SCREENS,
      onHover: (hit) => {
        if (touch) return;
        showPop(hit && hit.type === 'project' ? hit.index : -1, hit ? hit.slot : null);
        items.forEach((a, k) => a.classList.toggle('is-active', hit && hit.type === 'project' && hit.index === k));
      },
      onClick: (hit) => {
        if (hit.type !== 'project') return;
        // on touch screens the first tap shows the preview, the second opens the case
        if (touch && showing !== hit.index) showPop(hit.index, hit.slot);
        else open(hit.index);
      },
    })).then((p) => {
      pile = p;
      hero.classList.add('has-pile');
      p.ready.then(() => hero.classList.add('tags-on'));
    }).catch(() => hero.classList.add('no-pile'));
  }

  // the project list drives the pile too
  items.forEach((a, i) => {
    a.addEventListener('pointerenter', () => { pile && pile.setActive(slotOf(i)); showPop(i, slotOf(i)); });
    a.addEventListener('focus', () => { pile && pile.setActive(slotOf(i)); showPop(i, slotOf(i)); });
    a.addEventListener('pointerleave', () => { pile && pile.setActive(null); showPop(-1); });
    a.addEventListener('blur', () => { pile && pile.setActive(null); showPop(-1); });
  });
  hero.addEventListener('pointerleave', () => showPop(-1));
  addEventListener('resize', sizePop);

  /* --------------------------------------------------------------- MARQUEE */

  const track = $('.marquee__track');
  const item = `<div class="marquee__item display">${P.map((p) => `<span>${p.title}</span><i class="marquee__sep" aria-hidden="true"></i>`).join('')}</div>`;
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
    // the pile sinks away a little as you scroll
    if (!reduce) {
      gsap.to(canvas, {
        yPercent: 18, opacity: 0.35, ease: 'none',
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

  const fitScaled = () => preview.style.setProperty('--s', preview.offsetWidth / 1600); // folds render at 1600 × 900 (16:9, like the card)
  fitScaled();
  addEventListener('resize', fitScaled);
  strip.addEventListener('pointerenter', wake, { once: true });
  list.addEventListener('pointerenter', wake, { once: true });

  Site.onReady(() => {
    startPile();
    setTimeout(wake, 2500);
  });
})();
