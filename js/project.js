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

  // Paragraphs come from content/<slug>.md: "## Intro", "## Body", "## Question",
  // "## Step 1: Title" …, "## Biggest challenge", "## What I've learned". A blank line = new paragraph.
  const loadContent = async () => {
    let md = '';
    try {
      const res = await fetch(`content/${p.slug}.md`, { cache: 'no-cache' });
      if (res.ok) md = await res.text();
    } catch (_) { /* opened as a file, or offline: the page renders without the paragraphs */ }
    md = md.replace(/<!--[\s\S]*?-->/g, '');
    const sections = {};
    md.split(/^##\s+/m).slice(1).forEach((chunk) => {
      const nl = chunk.indexOf('\n');
      const head = (nl < 0 ? chunk : chunk.slice(0, nl)).trim();
      const body = (nl < 0 ? '' : chunk.slice(nl + 1)).trim();
      sections[head.toLowerCase()] = { head, body };
    });
    const get = (name) => (sections[name] ? sections[name].body : '');
    p.intro = get('intro');
    p.body = get('body');
    p.challenge = get('biggest challenge');
    p.learned = get("what i've learned") || get('what i’ve learned');
    // "## Concept 1: Title", "## Concept 2: Title" … (visuals come from p.concept in data.js)
    p.conceptText = Object.keys(sections).filter((h) => /^concept \d+/.test(h)).sort()
      .map((h) => ({ title: sections[h].head.replace(/^concept \d+:?\s*/i, ''), text: sections[h].body }));
    if (p.process) {
      p.process.hmw = get('question');
      p.process.weeks.forEach((w, k) => {
        const key = Object.keys(sections).find((h) => new RegExp(`^step ${k + 1}\\b`).test(h));
        if (!key) return;
        const title = sections[key].head.replace(/^step \d+:?\s*/i, '').trim();
        if (title) w.title = title;
        w.text = sections[key].body;
      });
    }
  };
  // text → escaped HTML paragraphs (blank line = new paragraph)
  const paras = (txt) => String(txt || '').split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean)
    .map((x) => x.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, ' '));

  Site.wait(loadContent().then(() => {
  const next = P[(i + 1) % P.length];
  const pad = (n) => String(n).padStart(2, '0');
  const isLight = (hex) => {
    const n = parseInt(hex.replace('#', ''), 16);
    return ((n >> 16) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114) / 255 > 0.5;
  };
  const theme = (proj) => (isLight(proj.ink) ? 'light' : 'dark'); // header text matches the project's text colour

  document.title = `${p.title} | ${window.SITE.name}`;
  document.body.style.setProperty('--p-bg', p.color);
  document.body.style.setProperty('--p-fg', p.ink);
  // accent colour (numbers, underlines, buttons) from the project's own design; default is the site orange
  if (p.accent) document.body.style.setProperty('--red', p.accent);
  const setHeaderThemes = () => $$('main > section').forEach((s) => (s.dataset.header = theme(p)));

  // hero
  $('.project-hero__kicker').textContent = `(${pad(i + 1)}/${pad(P.length)}) ${p.context}`;
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
  if (p.preview || p.video || p.still) {
    hero.classList.add('project-hero--live');
    const h1 = $('.project-hero__title');
    h1.classList.add('sr-only');
    delete h1.dataset.fit;
    delete h1.dataset.reveal;
    if (p.still) {
      fold = document.createElement('img');
      fold.src = p.still;
      fold.alt = `${p.title}, start screen`;
    } else if (p.video) {
      fold = document.createElement('video');
      Object.assign(fold, { src: p.video, muted: true, loop: true, autoplay: true, playsInline: true });
      fold.setAttribute('muted', '');
      fold.setAttribute('aria-label', `${p.title}, video`);
    } else {
      fold = document.createElement('iframe');
      fold.src = p.preview;
      fold.title = `${p.title}, live hero`;
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

    let play = () => {}, pause = () => {};
    if (p.still) {
      // just an image — nothing to play
    } else if (p.video) {
      play = () => fold.play().catch(() => {});
      pause = () => fold.pause();
    } else {
      // the iframe ignores the pointer (so scrolling + the cursor keep working) — forward it instead
      const tell = (msg) => fold.contentWindow && fold.contentWindow.postMessage(msg, '*');
      if (p.previewCursor) hero.dataset.cursor = p.previewCursor;
      hero.addEventListener('pointermove', (e) => tell({ pointer: [e.clientX / innerWidth, e.clientY / innerHeight] }));
      hero.addEventListener('click', (e) => !e.target.closest('a') && tell(p.previewClick || 'burst'));
      play = () => tell('play');
      pause = () => tell('pause');
    }
    Site.onInit(() => ScrollTrigger.create({
      trigger: hero, start: 'top top', end: 'bottom top', onLeave: pause, onEnterBack: play,
    }));
  } else {
    const cover = $('.project-cover__frame img');
    cover.src = p.cover;
    cover.alt = `${p.title}, cover`;
  }
  $('.project-intro__lead').innerHTML = paras(p.intro).join('<br><br>');
  // one <p> per paragraph; the original (empty) element stays as the first one
  const bodyParas = paras(p.body);
  const bodyEl = $('.project-intro__body');
  bodyEl.innerHTML = bodyParas[0] || '';
  bodyEl.insertAdjacentHTML('afterend', bodyParas.slice(1).map((x) => `<p class="project-intro__body" data-reveal="fade">${x}</p>`).join(''));
  if (p.url) {
    $$('.project-intro__body').pop().insertAdjacentHTML('afterend',
      `<a class="pill mono project-link" href="${p.url}" target="_blank" rel="noopener" data-magnetic>${Site.t('visitLive')} <span>↗</span></a>`);
  }

  // final design, page by page: scrollable desktop screenshot in a browser frame + the mobile version in a phone
  if (p.screens) {
    $('.project-intro').insertAdjacentHTML('afterend', `
      <section class="proto">
        ${p.screens.map((sc) => `
        <div class="proto__group">
          <p class="mono proto__label">${sc.label}</p>
          <div class="proto__row">
            ${sc.desktop ? `
            <figure class="proto__desk">
              <div class="site-demo__browser">
                <div class="site-demo__bar mono"><i></i><i></i><i></i><span>Desktop</span></div>
                <div class="proto__screen proto__screen--desk" data-lenis-prevent><img src="${sc.desktop}" alt="${p.title}, ${sc.label}, desktop" loading="lazy"></div>
              </div>
            </figure>` : ''}
            ${sc.mobile ? `
            <figure class="proto__phone">
              <div class="proto__screen proto__screen--phone" data-lenis-prevent><img src="${sc.mobile}" alt="${p.title}, ${sc.label}, mobile" loading="lazy"></div>
            </figure>` : ''}
          </div>
        </div>`).join('')}
        <p class="site-demo__note mono">${Site.t('screensNote')}</p>
      </section>`);
  }

  // live website in a browser frame — rendered at its design size (e.g. 1440×900) and scaled, never reflowed
  if (p.site) {
    const st = p.site;
    const host = st.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    $('.project-intro').insertAdjacentHTML('afterend', `
      <section class="site-demo">
        <div class="site-demo__browser">
          <div class="site-demo__bar mono"><i></i><i></i><i></i><span>${host}</span></div>
          <div class="site-demo__screen" style="--w:${st.width}; --h:${st.height}">
            <iframe src="${st.url}" title="${p.title}, live website" loading="lazy" style="width:${st.width}px; height:${st.height}px"></iframe>
            ${st.shot ? `<div class="site-demo__shot"><img src="${st.shot}" alt="${p.title}, full homepage" loading="lazy"></div>` : ''}
          </div>
        </div>
        <p class="site-demo__note mono">${Site.t('liveWebsiteNote', { size: `${st.width}×${st.height}` })}</p>
        <a class="pill site-demo__open" href="${st.url}" target="_blank" rel="noopener" data-magnetic>${Site.t('openWebsite')} <span>↗</span></a>
      </section>`);
    const screen = $('.site-demo__screen');
    const frame = $('iframe', screen);
    const scale = () => frame.style.transform = `scale(${screen.clientWidth / st.width})`;
    scale();
    addEventListener('resize', scale);
    // the custom cursor can't follow inside the iframe, so hide it there
    frame.addEventListener('pointerenter', () => gsap.to('.cursor, .cursor-label', { opacity: 0, duration: 0.2 }));
    frame.addEventListener('pointerleave', () => gsap.to('.cursor, .cursor-label', { opacity: 1, duration: 0.2 }));
  }

  // concept block: numbered parts, each with a visual, a title and one short paragraph
  if (p.conceptText && p.conceptText.length) {
    const vis = p.concept || [];
    $('.project-intro').insertAdjacentHTML('afterend', `
      <section class="concept">
        <p class="mono concept__label">${Site.t('conceptLabel')}</p>
        <div class="concept__grid">
          ${p.conceptText.map((c, k) => {
            const v = vis[k] || {};
            const media = v.video ? `<video src="${v.video}" poster="${v.poster || ''}" muted loop autoplay playsinline aria-hidden="true"></video>`
              : v.img ? `<img src="${v.img}" alt="${p.title}, ${c.title}" loading="lazy">`
              : `<span class="concept__big display">${v.big || c.title}</span>`;
            return `
          <article class="concept__part">
            <div class="concept__media${v.big || (!v.img && !v.video) ? ' concept__media--type' : ' concept__media--frame'}" data-reveal="clip">${media}</div>
            <div class="concept__head">
              <span class="concept__num display">${pad(k + 1)}</span>
              <h3 class="concept__title">${paras(c.title).join('')}</h3>
            </div>
            <p class="concept__text" data-reveal="fade">${paras(c.text).join(' ')}</p>
          </article>`;
          }).join('')}
        </div>
      </section>`);
  }

  // end result showcase: captioned rows of final screens (phone screens share one aspect ratio)
  if (p.showcase) {
    $('.gallery').insertAdjacentHTML('beforebegin', `
      <section class="showcase">
        ${p.showcase.map((r) => `
        <div class="showcase__group">
          <p class="mono showcase__label">${r.label}</p>
          <div class="process__row">${r.imgs.map((it) => {
            // item: image path, or { video, poster, ar } for a muted looping clip
            if (it && it.video) return `
            <figure class="process__img has-img" data-reveal="clip" data-ar="${it.ar || 0.5625}">
              <video src="${it.video}" poster="${it.poster || ''}" muted loop autoplay playsinline aria-label="${p.title}, ${r.label}"></video>
            </figure>`;
            return `
            <figure class="process__img has-img" data-reveal="clip"${r.phone ? ' data-ar="0.462"' : ''}>
              <img src="${it}" alt="${p.title}, ${r.label}"${r.phone ? ' style="object-position: top"' : ''}>
            </figure>`;
          }).join('')}
          </div>
        </div>`).join('')}
      </section>`);
  }

  // process timeline (brief question, team, week by week) between the intro and the gallery
  if (p.process) {
    const pr = p.process;
    // process copy is plain text: escape it so e.g. "W&LT" isn't read as HTML
    const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    pr.weeks.forEach((w) => ['title', 'text', 'note'].forEach((key) => w[key] && (w[key] = esc(w[key]))));
    pr.weeks.forEach((w) => w.points && (w.points = w.points.map(esc)));
    // imgs: paths (or { src }); empty [] shows placeholder frames, false shows none.
    // Images are laid out in justified rows: same height per row, widths follow each image's proportions.
    const imgs = (w, k) => {
      if (w.imgs === false) return '';
      // items: path, or { src, scroll: true, label } for a full-page design you scroll through inside its frame
      const list = (w.imgs && w.imgs.length ? w.imgs : [null, null]).map((it) => (it && typeof it === 'object' ? it : { src: it }));
      const perRow = list.length === 4 ? 2 : 3;
      const rows = [];
      for (let r = 0; r < list.length; r += perRow) rows.push(list.slice(r, r + perRow));
      let j = 0;
      // rows with a scrollable page get more height; { large: true } shows an image at reading size (e.g. text)
      return rows.map((row) => `
        <div class="process__row${row.some((x) => x.scroll) ? ' process__row--tall' : ''}${row.some((x) => x.large) ? ' process__row--large' : ''}">${row.map(({ src, scroll, label, at, large }) => {
          j += 1;
          const alt = `${p.title}, ${label || `${(pr.step || 'week').toLowerCase()} ${k + 1}, image ${j}`}`;
          return `
          <figure class="process__img${src ? ' has-img' : ''}${scroll ? ' process__img--scroll' : ''}${large ? ' process__img--large' : ''}" data-reveal="clip">
            ${scroll ? `<div class="process__scroll" data-lenis-prevent${at ? ` data-at="${at}"` : ''}><img src="${src}" alt="${alt}"></div>${label ? `<figcaption class="mono">${label}</figcaption>` : ''}`
              : src ? `<img src="${src}" alt="${alt}">`
              : `<span class="mono">(${pr.step || 'Week'} ${pad(k + 1)}) Image ${j}</span>`}
          </figure>`;
        }).join('')}
        </div>`).join('');
    };
    $('.gallery').insertAdjacentHTML('beforebegin', `
      <section class="process">
        <div class="process__head">
          <h2 class="display process__title" data-fit="1"><span class="line"><span class="line__in" data-split>${Site.t('processTitle')}</span></span></h2>
        </div>
        ${pr.hmw ? `
        <div class="process__hmw">
          <p class="mono">${Site.t('questionLabel')}</p>
          <p class="process__q" data-reveal="fade">${pr.hmw}</p>
        </div>` : ''}
        ${pr.team ? `
        <div class="process__team mono" data-reveal="stagger">
          ${pr.team.map((t) => `<div${t.me ? ' class="is-me"' : ''}><span>${t.name}</span><span>${t.role}</span></div>`).join('')}
        </div>` : ''}
        <ol class="process__weeks">
          ${pr.weeks.map((w, k) => `
          <li class="process__week">
            <div class="process__side">
              <span class="mono">(${pr.step || 'Week'})</span>
              <span class="display process__num"><span data-split>${pad(k + 1)}</span></span>
            </div>
            <div class="process__body">
              <h3 class="process__wt" data-reveal="fade">${w.title}</h3>
              <p class="process__text" data-reveal="fade">${w.text}</p>
              ${w.note ? `<p class="process__note mono">(${w.note})</p>` : ''}
              ${w.points ? `<ul class="process__points mono" data-reveal="stagger">${w.points.map((x) => `<li>${x}</li>`).join('')}</ul>` : ''}
              <div class="process__imgs">${imgs(w, k)}</div>
            </div>
          </li>`).join('')}
        </ol>
      </section>`);
  }

  // scroll frames can open at a point in the page (at: 0–1 of its height)
  $$('.process__scroll[data-at]').forEach((box) => {
    const img = $('img', box);
    const go = () => (box.scrollTop = box.scrollHeight * parseFloat(box.dataset.at));
    if (img.complete && img.naturalWidth) go(); else img.addEventListener('load', go, { once: true });
  });

  // justified rows: each figure grows by its aspect ratio; the row is capped so it never gets too tall
  const fitRow = (row) => {
    const figs = [...row.children];
    const sum = figs.reduce((t, f) => t + parseFloat(f.style.getPropertyValue('--ar') || 4 / 3), 0);
    row.style.setProperty('--sum', sum);
  };
  $$('.process__row').forEach((row) => {
    [...row.children].forEach((fig) => {
      if (fig.classList.contains('process__img--scroll')) return fig.style.setProperty('--ar', 0.72);
      if (fig.dataset.ar) return fig.style.setProperty('--ar', fig.dataset.ar);
      const img = $('img', fig);
      const set = () => { fig.style.setProperty('--ar', img.naturalWidth / img.naturalHeight); fitRow(row); ScrollTrigger.refresh(); };
      if (!img) fig.style.setProperty('--ar', 4 / 3);
      else if (img.complete && img.naturalWidth) set();
      else img.addEventListener('load', set, { once: true });
    });
    fitRow(row);
  });

  // full video (with sound + controls) between the intro and the gallery
  if (p.film) {
    $('.gallery').insertAdjacentHTML('beforebegin', `
      <section class="project-film" id="film">
        <div class="project-film__inner">
          <div class="project-film__head mono"><span>${Site.t('filmLabel')}</span><span>${Site.t('filmSound')}</span></div>
          <video class="project-film__video" src="${p.film}" poster="${p.cover}" controls playsinline preload="metadata"></video>
        </div>
      </section>`);
    const film = $('.project-film__video');
    // jump-to button on the hero; the click counts as the gesture that allows playback with sound
    hero.insertAdjacentHTML('beforeend', `<a class="pill mono project-watch" href="#film">${Site.t('watchFilm')} <span>↓</span></a>`);
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

  // the live website already shows the result: no placeholder gallery next to it
  // no gallery images → no gallery (no empty placeholder frames)
  if (!p.gallery || !p.gallery.length) $('.gallery').remove();

  // gallery: real images, or placeholder frames until assets are added
  const pattern = [true, false, false, true, false, false];
  const items = p.gallery.length
    ? p.gallery.map((g) => (typeof g === 'string' ? { src: g } : g))
    : pattern.map((wide) => ({ wide }));
  // { src, scroll: true, label } = a full-page screenshot you can scroll through inside its frame
  if ($('.gallery') && items.length && items.every((g) => g.scroll)) {
    $('.gallery').classList.add('gallery--pages');
    // optional w: relative column width (e.g. desktop design 2, mobile design 1)
    $('.gallery').style.gridTemplateColumns = items.map((g) => `${g.w || 1}fr`).join(' ');
  }
  if ($('.gallery')) $('.gallery').innerHTML = items.map((g, k) => `
    <figure class="gallery__item${g.wide ? ' gallery__item--wide' : ''}${g.scroll ? ' gallery__item--scroll' : ''}" data-reveal="clip">
      ${g.label ? `<figcaption class="mono">${g.label}</figcaption>` : ''}
      ${g.src
        ? `<div class="gallery__media"${g.scroll ? ' data-lenis-prevent' : ''}><img src="${g.src}" alt="${p.title}, ${g.label || `image ${k + 1}`}" loading="lazy"></div>`
        : `<div class="gallery__ph mono"><span>(${pad(k + 1)}) Asset placeholder</span><b>${pad(k + 1)}</b><span>Add images to gallery[] in js/data.js</span></div>`}
    </figure>`).join('');

  // closing section: biggest challenge + what I've learned (after the process)
  const closeText = (t) => t ? String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;') : `<span class="reflect__todo">${Site.t('todo')}</span>`;
  $('.next').insertAdjacentHTML('beforebegin', `
    <section class="reflect">
      <div class="reflect__item">
        <p class="mono">${Site.t('challengeLabel')}</p>
        <p class="reflect__text" data-reveal="fade">${closeText(p.challenge)}</p>
      </div>
      <div class="reflect__item">
        <p class="mono">${Site.t('learnedLabel')}</p>
        <p class="reflect__text" data-reveal="fade">${closeText(p.learned)}</p>
      </div>
    </section>`);

  // page order: end result first (live site, full video, gallery), then the process
  const processEl = $('.process');
  if (processEl) $('.reflect').before(processEl);

  setHeaderThemes();
  // subtitle tag (HTML folds carry their own)
  if (p.subtitle && !p.preview && !p.video) {
    if (p.still) hero.appendChild(Site.subTag(p, 'project-sub project-sub--over'));
    else $('.page-hero__row', hero).before(Site.subTag(p, 'project-sub'));
  }
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
  }));
})();
