/* =========================================================================
   SHARED SITE ENGINE
   Header/footer, smooth scroll, cursor, page transitions, preloader,
   text splitting, fit-to-width type, stretchy variable-font effect, reveals.
   Page scripts (home.js, project.js, …) render their DOM synchronously and
   register hooks via Site.onInit / Site.onReady; boot runs on DOMContentLoaded.
   ========================================================================= */

(() => {
  const { SITE, PROJECTS } = window;
  const TEXT = window.TEXT || {};
  const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
  // fill {placeholders} in a TEXT string
  const t = (key, vars = {}) => String(TEXT[key] ?? '').replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`));
  gsap.registerPlugin(ScrollTrigger);
  if (window.Flip) gsap.registerPlugin(Flip);

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = matchMedia('(hover: none)').matches;
  const page = document.body.dataset.page;

  const initHooks = [];
  const waits = []; // async page work (e.g. loading a project's Markdown) that boot waits for
  const readyHooks = [];
  let isReady = false;

  /* ---------------------------------------------------------------- utils */

  // Wrap text into words (.wd) and characters (.ch) so we can animate each letter.
  function splitChars(el) {
    const text = el.textContent.trim();
    el.textContent = '';
    el.setAttribute('aria-label', text);
    text.split(/\s+/).forEach((word, i, arr) => {
      const w = document.createElement('span');
      w.className = 'wd';
      w.setAttribute('aria-hidden', 'true');
      for (const c of word) {
        const s = document.createElement('span');
        s.className = 'ch';
        s.textContent = c;
        w.appendChild(s);
      }
      el.appendChild(w);
      if (i < arr.length - 1) el.appendChild(document.createTextNode(' '));
    });
    return $$('.ch', el);
  }

  // Wrap words of rich text into .w spans (keeps <em>, images etc. as single units).
  function splitWords(el) {
    const units = [];
    [...el.childNodes].forEach((node) => {
      if (node.nodeType === 3) {
        const frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) return frag.appendChild(document.createTextNode(part));
          const s = document.createElement('span');
          s.className = 'w';
          s.textContent = part;
          frag.appendChild(s);
          units.push(s);
        });
        node.replaceWith(frag);
      } else if (node.nodeType === 1) {
        node.classList.add('w');
        units.push(node);
      }
    });
    return units;
  }

  // Scale a title so its widest .line__in fills the element's width.
  function fit(el) {
    const ratio = parseFloat(el.dataset.fit) || 1;
    const inners = $$('.line__in', el);
    if (!inners.length) return;
    el.style.fontSize = '100px';
    inners.forEach((n) => (n.style.width = 'max-content'));
    const widest = Math.max(...inners.map((n) => n.getBoundingClientRect().width));
    inners.forEach((n) => (n.style.width = ''));
    let size = (100 * el.clientWidth * ratio) / widest;
    // optional height caps: data-fit-max-h="<ancestor selector>" or data-fit-vh="0.6" (share of viewport)
    const maxH = el.dataset.fitMaxH && el.closest(el.dataset.fitMaxH);
    if (maxH) size = Math.min(size, maxH.clientHeight / (inners.length * 0.86));
    if (el.dataset.fitVh) size = Math.min(size, (innerHeight * parseFloat(el.dataset.fitVh)) / (inners.length * 0.86));
    el.style.fontSize = `${size}px`;
  }
  const fitAll = () => $$('[data-fit]').forEach(fit);

  // Letters swell (wider + heavier) as the pointer gets close — variable font magic.
  function stretchy(target, opts = {}) {
    const listen = opts.listen || target;
    const rest = opts.rest || { wd: 62, wg: 800 };
    const peak = opts.peak || { wd: 125, wg: 900 };
    const radius = opts.radius || 0.22; // fraction of viewport width
    let chars = [];
    let vals = [];
    let px = 0, py = 0, inside = false, settled = true;

    const refresh = () => {
      chars = $$('.ch', target);
      vals = chars.map(() => ({ wd: rest.wd, wg: rest.wg }));
      chars.forEach((c) => {
        c.style.setProperty('--wd', rest.wd);
        c.style.setProperty('--wg', rest.wg);
      });
    };
    refresh();
    if (reduce) return { refresh };

    listen.addEventListener('pointermove', (e) => { px = e.clientX; py = e.clientY; inside = true; settled = false; });
    listen.addEventListener('pointerleave', () => { inside = false; });

    const tick = (time) => {
      if (!chars.length) return;
      const box = target.getBoundingClientRect();
      if (box.bottom < 0 || box.top > innerHeight) return;
      let active = inside;
      if (touch) {
        // on touch screens a virtual pointer sweeps across the word
        active = true;
        px = box.left + (Math.sin(time * 0.8) * 0.5 + 0.5) * box.width;
        py = box.top + box.height / 2;
      }
      if (!active && settled) return;
      const R = innerWidth * radius;
      const rects = active ? chars.map((c) => c.getBoundingClientRect()) : null;
      let moving = false;
      chars.forEach((c, i) => {
        let t = 0;
        if (active) {
          const r = rects[i];
          const d = Math.hypot(px - (r.left + r.width / 2), (py - (r.top + r.height / 2)) * 0.6);
          t = Math.max(0, 1 - d / R);
          t = t * t * (3 - 2 * t);
        }
        const v = vals[i];
        const tw = rest.wd + (peak.wd - rest.wd) * t;
        const tg = rest.wg + (peak.wg - rest.wg) * t;
        v.wd += (tw - v.wd) * 0.14;
        v.wg += (tg - v.wg) * 0.14;
        if (Math.abs(tw - v.wd) > 0.1) moving = true;
        c.style.setProperty('--wd', v.wd.toFixed(2));
        c.style.setProperty('--wg', v.wg.toFixed(1));
      });
      settled = !moving && !active;
    };
    gsap.ticker.add(tick);
    return { refresh };
  }

  // Scramble text into a new string.
  function scramble(el, text, duration = 0.6) {
    const glyphs = '!<>-_\\/[]{}—=+*^?#ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const from = el.textContent;
    const len = Math.max(from.length, text.length);
    const o = { p: 0 };
    gsap.killTweensOf(el._scr || {});
    el._scr = o;
    return gsap.to(o, {
      p: 1,
      duration,
      ease: 'none',
      onUpdate() {
        let out = '';
        for (let i = 0; i < len; i++) {
          const k = i / len;
          if (o.p > k + 0.25) out += text[i] || '';
          else if (o.p > k) out += glyphs[(Math.random() * glyphs.length) | 0];
          else out += from[i] || '';
        }
        el.textContent = out;
      },
      onComplete() { el.textContent = text; },
    });
  }

  /* ------------------------------------------------------- header & footer */

  const path = location.pathname.split('/').pop() || 'index.html';
  const navLink = (href, label) =>
    `<a class="u-link${path === href ? ' is-active' : ''}" href="${href}">${label}</a>`;
  const socialLinks = () =>
    SITE.socials.map((s) => `<a class="u-link" href="${s.url}" target="_blank" rel="noopener">${s.label}</a>`).join('');

  function renderHeader() {
    const h = document.createElement('header');
    h.className = 'header mono';
    h.dataset.theme = 'dark';
    h.innerHTML = `
      <a href="index.html" class="header__brand" data-label="Home">${SITE.name}<br>${SITE.role.join('<br>')}</a>
      <div class="header__socials">${socialLinks()}</div>
      <div class="header__right">
        <span class="header__clock">${SITE.location}<br><span data-clock></span></span>
        <nav class="header__nav">
          <a class="u-link" href="index.html#works" data-label="Work">Work</a>
          ${navLink('archive.html', 'Archive')}
          ${navLink('about.html', 'About')}
          ${navLink('contact.html', 'Contact')}
        </nav>
      </div>`;
    document.body.prepend(h);
    return h;
  }

  function renderFooter() {
    const slot = $('[data-footer]');
    if (!slot) return;
    const mini = slot.dataset.footer === 'mini';
    const year = new Date().getFullYear();
    slot.outerHTML = `
      <footer class="footer${mini ? ' footer--mini' : ''}" data-header="dark">
        ${mini ? '' : `
        <div class="footer__kicker mono"><span>${t('footerKickerLeft')}</span><span>${t('footerKickerRight')}</span></div>
        <a href="contact.html" class="footer__big display" data-fit="1" data-cursor="Say hi" data-label="Contact">
          <span class="line"><span class="line__in" data-split>${t('footerBig')}</span></span>
        </a>
        <a class="footer__email u-link" data-email href="#"></a>`}
        <div class="footer__grid mono">
          <div><span>©${year}</span><span>${SITE.name}</span><span>${t('footerRights')}</span></div>
          <div>${socialLinks()}</div>
          <div>
            <a class="u-link" href="index.html#works" data-label="Work">Work</a>
            <a class="u-link" href="archive.html">Archive</a>
            <a class="u-link" href="about.html">About</a>
            <a class="u-link" href="contact.html">Contact</a>
          </div>
          <div><span>${t('footerTime')}, ${SITE.location}</span><span data-clock></span><button class="u-link" data-top>${t('backToTop')}</button></div>
        </div>
      </footer>`;
  }

  // every element with data-t="key" gets its text from window.TEXT (js/data.js)
  function fillText() {
    const n = PROJECTS.length;
    const img = (p) => p ? `<span class="inline-img"><img src="${p.cover}" alt=""></span>` : '';
    const vars = { archive: String((window.ARCHIVE || []).length).padStart(2, '0'), count: String(n).padStart(2, '0'), countWord: words[n] || n, img1: img(PROJECTS[0]), img2: img(PROJECTS[2]) };
    $$('[data-t]').forEach((el) => (el.innerHTML = t(el.dataset.t, vars)));
  }

  function fillSiteData() {
    $$('[data-email]').forEach((a) => {
      if (a.tagName === 'A') a.href = `mailto:${SITE.email}`;
      if (!a.children.length) a.textContent = SITE.email;
    });
    $$('[data-availability]').forEach((el) => (el.textContent = SITE.availability));
  }

  function startClock() {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: SITE.timezone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    });
    const els = $$('[data-clock]');
    const upd = () => { const t = fmt.format(new Date()); els.forEach((e) => (e.textContent = t)); };
    upd();
    setInterval(upd, 1000);
  }

  // Header colour follows the section underneath it.
  function headerTheme(header) {
    $$('[data-header]').forEach((sec) => {
      ScrollTrigger.create({
        trigger: sec,
        start: 'top 40px',
        end: 'bottom 40px',
        onToggle: (self) => self.isActive && (header.dataset.theme = sec.dataset.header),
      });
    });
  }

  /* ---------------------------------------------------------------- lenis */

  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollTo = (target, opts = {}) => {
    if (lenis) lenis.scrollTo(target, { duration: 1.4, ...opts });
    else {
      const y = typeof target === 'number' ? target : target.getBoundingClientRect().top + scrollY;
      window.scrollTo({ top: y, behavior: opts.immediate ? 'auto' : 'smooth' });
    }
  };

  /* --------------------------------------------------------------- cursor */

  function cursor() {
    if (touch || reduce) return;
    const dot = document.createElement('div');
    dot.className = 'cursor';
    const label = document.createElement('div');
    label.className = 'cursor-label mono';
    document.body.append(dot, label);

    const dx = gsap.quickTo(dot, 'x', { duration: 0.15, ease: 'power3' });
    const dy = gsap.quickTo(dot, 'y', { duration: 0.15, ease: 'power3' });
    const lx = gsap.quickTo(label, 'x', { duration: 0.5, ease: 'power3' });
    const ly = gsap.quickTo(label, 'y', { duration: 0.5, ease: 'power3' });
    addEventListener('pointermove', (e) => { dx(e.clientX); dy(e.clientY); lx(e.clientX); ly(e.clientY); });

    document.addEventListener('pointerover', (e) => {
      const withLabel = e.target.closest('[data-cursor]');
      const link = e.target.closest('a, button, label');
      if (withLabel) {
        label.textContent = withLabel.dataset.cursor;
        gsap.to(label, { scale: 1, duration: 0.4, ease: 'back.out(2)' });
        gsap.to(dot, { scale: 0, duration: 0.3 });
      } else {
        gsap.to(label, { scale: 0, duration: 0.3 });
        gsap.to(dot, { scale: link ? 3.2 : 1, duration: 0.3 });
      }
    });
  }

  /* ------------------------------------------------------ page transition */

  // the overlay is in each page's HTML (so it's there before any paint); create it only as a fallback
  let overlay = $('.transition');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'transition';
    overlay.innerHTML = '<div class="transition__col"></div>'.repeat(5) + '<div class="transition__label display"></div>';
    document.body.appendChild(overlay);
  }
  const cols = $$('.transition__col', overlay);
  const overlayLabel = $('.transition__label', overlay);
  gsap.set(cols, { scaleY: 1 });

  const samePage = (url) =>
    url.pathname.replace(/index\.html$/, '') === location.pathname.replace(/index\.html$/, '') &&
    url.search === location.search;

  function leave(href, label) {
    lenis && lenis.stop();
    overlayLabel.textContent = label || '';
    try { sessionStorage.setItem('lh-label', label || ''); } catch (_) {}
    gsap.timeline({ onComplete: () => (location.href = href) })
      .set(cols, { transformOrigin: 'bottom' })
      .fromTo(cols, { scaleY: 0 }, { scaleY: 1, duration: 0.7, ease: 'expo.inOut', stagger: 0.05 })
      .fromTo(overlayLabel, { opacity: 0, yPercent: 40 }, { opacity: 1, yPercent: 0, duration: 0.5, ease: 'expo.out' }, 0.35);
  }

  function enter() {
    try { sessionStorage.removeItem('lh-label'); } catch (_) {}
    return gsap.timeline()
      .to(overlayLabel, { opacity: 0, yPercent: -30, duration: 0.4, ease: 'power2.in' }, 0)
      .set(cols, { transformOrigin: 'top' }, 0)
      .to(cols, { scaleY: 0, duration: 0.9, ease: 'expo.inOut', stagger: 0.05 }, 0.1);
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (samePage(url)) {
      if (url.hash) {
        const t = $(url.hash);
        if (t) { e.preventDefault(); scrollTo(t); }
      } else if (a.getAttribute('href').startsWith('index.html') || url.pathname === location.pathname) {
        e.preventDefault();
        scrollTo(0);
      }
      return;
    }
    e.preventDefault();
    if (reduce) return (location.href = url.href);
    const label = a.dataset.label || (url.pathname.split('/').pop().replace('.html', '') || 'Home');
    leave(url.href, label);
  });

  // Coming back via the browser's back button restores a cached page — reset overlay.
  addEventListener('pageshow', (e) => {
    if (e.persisted) { gsap.set(cols, { scaleY: 0 }); gsap.set(overlayLabel, { opacity: 0 }); lenis && lenis.start(); }
  });

  /* ------------------------------------------------------------ preloader */

  function preloader() {
    let seen = false;
    try { seen = sessionStorage.getItem('lh-loaded') === '1'; sessionStorage.setItem('lh-loaded', '1'); } catch (_) {}
    if (page !== 'home' || seen || reduce) return null;

    const el = document.createElement('div');
    el.className = 'preloader';
    el.innerHTML = `
      <div class="preloader__top mono"><span>${SITE.name}</span><span>Portfolio ©${new Date().getFullYear()}</span><span>Loading selected works</span></div>
      <div>
        <div class="preloader__bar"><span></span></div>
        <div class="preloader__count display">000</div>
      </div>`;
    document.body.appendChild(el);
    gsap.set(cols, { scaleY: 0 });
    gsap.set(overlayLabel, { opacity: 0 });
    lenis && lenis.stop();

    const count = $('.preloader__count', el);
    const o = { v: 0 };
    return gsap.timeline()
      .to(o, {
        v: 100, duration: 2, ease: 'power3.inOut',
        onUpdate: () => (count.textContent = String(Math.round(o.v)).padStart(3, '0')),
      })
      .to($('.preloader__bar span', el), { scaleX: 1, duration: 2, ease: 'power3.inOut' }, 0)
      .to(count, { yPercent: -30, opacity: 0, duration: 0.5, ease: 'power2.in' })
      .to(el, { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' }, '-=0.2')
      .add(() => { el.remove(); lenis && lenis.start(); });
  }

  /* -------------------------------------------------------------- reveals */

  function prepareReveals() {
    if (reduce) return;
    $$('[data-reveal="lines"]').forEach((el) => gsap.set($$('.line__in', el), { yPercent: 110 }));
    $$('[data-reveal="chars"]').forEach((el) => gsap.set($$('.ch', el), { yPercent: 110 }));
    $$('[data-reveal="fade"]').forEach((el) => gsap.set(el, { y: 40, opacity: 0 }));
    $$('[data-reveal="stagger"]').forEach((el) => gsap.set(el.children, { y: 30, opacity: 0 }));
    $$('[data-reveal="clip"]').forEach((el) => gsap.set(el, { clipPath: 'inset(100% 0% 0% 0%)' }));
  }

  function playReveals() {
    if (reduce) return;
    const on = (el, fn) =>
      ScrollTrigger.create({ trigger: el, start: 'top 97%', once: true, onEnter: fn });

    $$('[data-reveal="lines"]').forEach((el) =>
      on(el, () => gsap.to($$('.line__in', el), { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08 })));
    $$('[data-reveal="chars"]').forEach((el) =>
      on(el, () => gsap.to($$('.ch', el), { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.025 })));
    $$('[data-reveal="fade"]').forEach((el) =>
      on(el, () => gsap.to(el, { y: 0, opacity: 1, duration: 1.1, ease: 'expo.out' })));
    $$('[data-reveal="stagger"]').forEach((el) =>
      on(el, () => gsap.to(el.children, { y: 0, opacity: 1, duration: 1, ease: 'expo.out', stagger: 0.06 })));
    $$('[data-reveal="clip"]').forEach((el) =>
      on(el, () => gsap.to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut' })));

    $$('[data-parallax]').forEach((img) => {
      gsap.fromTo(img, { yPercent: -15 }, {
        yPercent: 0, ease: 'none',
        scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
  }

  function magnetic() {
    if (touch || reduce) return;
    $$('[data-magnetic]').forEach((el) => {
      const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      const y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        x((e.clientX - r.left - r.width / 2) * 0.35);
        y((e.clientY - r.top - r.height / 2) * 0.35);
      });
      el.addEventListener('pointerleave', () => { x(0); y(0); });
    });
  }

  /* ----------------------------------------------------------------- boot */

  async function boot() {
    const header = renderHeader();
    renderFooter();
    fillText();
    fillSiteData();
    startClock();
    cursor();

    const loader = preloader();

    try { await Promise.all(waits); } catch (err) { console.error(err); }
    fillText();
    $$('[data-split]').forEach(splitChars);
    try { await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]); } catch (_) {}
    fitAll();

    const footerBig = $('.footer__big');
    if (footerBig) stretchy(footerBig, { listen: $('.footer'), rest: { wd: 62, wg: 800 }, radius: 0.18 });

    prepareReveals();
    initHooks.forEach((fn) => fn());
    headerTheme(header);
    magnetic();

    $$('[data-top]').forEach((b) => b.addEventListener('click', () => scrollTo(0, { duration: 2 })));

    ScrollTrigger.refresh();
    if (location.hash) {
      const t = $(location.hash);
      if (t) scrollTo(t, { immediate: true, force: true });
    }

    const go = () => {
      isReady = true;
      playReveals();
      readyHooks.forEach((fn) => fn());
    };
    if (loader) loader.add(go, '-=0.9');
    else if (reduce) { gsap.set(cols, { scaleY: 0 }); gsap.set(overlayLabel, { opacity: 0 }); go(); }
    else enter().add(go, 0.45);
    window.__siteBooted = true;

    let rw = innerWidth;
    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(onResize, 200); });
    function onResize() {
      if (touch && innerWidth === rw) return; // ignore mobile URL-bar height changes
      rw = innerWidth;
      fitAll();
      ScrollTrigger.refresh();
    }
  }

  document.addEventListener('DOMContentLoaded', boot);

  window.Site = {
    $, $$, reduce, touch, splitChars, splitWords, fit, fitAll, stretchy, scramble, scrollTo,
    get lenis() { return lenis; },
    t,
    // Subtitle line in the project's own style (.live-sub--<slug>).
    subTag(p, cls = '') {
      const el = document.createElement('p');
      el.className = `live-sub live-sub--${p.slug} ${cls}`;
      el.textContent = p.subtitle;
      return el;
    },
    // Big title laid over a project's video hero (home takeover + case page).
    liveTitle(p) {
      const el = document.createElement('div');
      el.className = 'live-title';
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = `
        ${p.kicker ? `<p class="live-title__kicker mono">(${p.kicker})</p>` : ''}
        <div class="live-title__text display" data-fit="0.7" data-fit-vh="0.5">
          ${p.lines.map((l) => `<span class="line"><span class="line__in">${l}</span></span>`).join('')}
        </div>
        ${p.subtitle ? `<p class="live-title__sub"><span class="line"><span class="line__in">${p.subtitle}</span></span></p>` : ''}`;
      return el;
    },
    setHeader: (theme) => { const h = $('.header'); if (h) h.dataset.theme = theme; },
    onInit: (fn) => initHooks.push(fn),
    wait: (promise) => waits.push(promise),
    onReady: (fn) => (isReady ? fn() : readyHooks.push(fn)),
    projects: PROJECTS,
  };
})();
