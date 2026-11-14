/* =========================================================================
   WORK IN PROGRESS: items from window.WIP (js/data.js), texts from content/wip.md
   ========================================================================= */

(() => {
  const { $ } = Site;
  const W = window.WIP || [];
  const esc = (t) => String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const pad = (n) => String(n).padStart(2, '0');

  const load = async () => {
    let md = '';
    try {
      const res = await fetch('content/wip.md', { cache: 'no-cache' });
      if (res.ok) md = await res.text();
    } catch (_) { /* opened as a file: no texts */ }
    md = md.replace(/<!--[\s\S]*?-->/g, '');
    const sections = {};
    md.split(/^##\s+/m).slice(1).forEach((chunk) => {
      const nl = chunk.indexOf('\n');
      sections[chunk.slice(0, nl < 0 ? undefined : nl).trim().toLowerCase()] = nl < 0 ? '' : chunk.slice(nl + 1).trim();
    });
    const paras = (t) => String(t || '').split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean).map((x) => `<p>${esc(x)}</p>`).join('');

    $('.wip-hero__intro').innerHTML = esc(sections.intro || '');
    const slug = (w) => `now-${w.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

    // index under the title: everything on one hairline table, each line jumps to its item
    $('.wip-hero').insertAdjacentHTML('beforeend', `
      <ol class="wip-index" data-reveal="stagger">
        ${W.map((w, i) => `
        <li><a class="wip-index__row" href="#${slug(w)}">
          <span class="wip-index__num">${pad(i + 1)}</span>
          <span class="wip-index__title">${esc(w.title)}</span>
          <span class="wip-index__kind">${esc(w.kind)}</span>
          <span class="wip-index__status"><i></i>${esc(w.status || Site.t('wipStatus'))}</span>
        </a></li>`).join('')}
      </ol>`);

    // what each item shows on the left
    const media = (w) => {
      if (w.feature === 'aerata') return `
        <div class="aerata" role="img" aria-label="AERATA, the design: a breathing sun between two rising arms">
          <span class="aerata__bloom"></span>
          <img class="aerata__arm aerata__arm--l" src="assets/projects/aerata/tendril.svg" alt="">
          <img class="aerata__arm aerata__arm--r" src="assets/projects/aerata/tendril.svg" alt="">
          <span class="aerata__sun"><img src="assets/projects/aerata/ball.svg" alt=""></span>
          <span class="aerata__word" aria-hidden="true">AERATA</span>
          <p class="aerata__line">An immersive experience that<br>lets you bring Transfo’s breath back<br><b>By Transfo Intiem</b></p>
          <p class="aerata__credits">All credits to:<br><b>Luca &nbsp; Margot &nbsp; Leon</b></p>
          <span class="aerata__grain"></span>
        </div>`;
      // not started yet: a quiet countdown instead of a picture
      if (w.soon) return `
        <div class="wip-soon">
          <p class="wip-soon__label mono">(Starts)</p>
          <p class="wip-soon__date display">${w.soon.map(esc).join(' ')}</p>
          <p class="wip-soon__count mono" data-countdown="${esc(w.starts || '')}"></p>
        </div>`;
      return `
        <div class="screen vhs-screen">
          <div class="vhs-screen__in">
            ${w.video
              ? `<video src="${w.video}" poster="${w.poster || ''}" muted loop autoplay playsinline aria-label="${esc(w.title)}"></video>`
              : `<img src="${w.img}" alt="${esc(w.title)}" loading="lazy">`}
            <span class="vhs-screen__noise"></span><span class="vhs-screen__track"></span>
            <span class="vhs-screen__osd vhs-screen__osd--play">▶ Play</span>
            <span class="vhs-screen__osd vhs-screen__osd--sp">SP</span>
            <span class="vhs-screen__osd vhs-screen__osd--time">0:00:00</span>
          </div>
        </div>`;
    };

    // every item the same: a title row in hairline cells, the picture large on the left, the text on the right
    $('.wip-list').innerHTML = W.map((w, i) => `
      <article class="wip-entry${w.feature ? ' wip-entry--feature' : ''}" id="${slug(w)}">
        <header class="wip-entry__head">
          <span class="wip-entry__num mono">${pad(i + 1)}</span>
          <h2 class="wip-entry__title">${esc(w.title)}</h2>
          <span class="wip-entry__kind mono">${esc(w.kind)}</span>
          <span class="wip-entry__status mono"><i></i>${esc(w.status || Site.t('wipStatus'))}</span>
        </header>
        <div class="wip-entry__body">
          <div class="wip-entry__media" data-reveal="clip">${media(w)}</div>
          <div class="wip-entry__side">
            <div class="wip-entry__text" data-reveal="fade">${paras(sections[w.title.toLowerCase()])}</div>
            <ul class="wip-entry__tags mono">${(w.tags || []).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
          </div>
        </div>
      </article>`).join('');

    // countdown: "in 48 days"
    document.querySelectorAll('[data-countdown]').forEach((el) => {
      const d = new Date(el.dataset.countdown);
      if (isNaN(d)) return;
      const days = Math.ceil((d - Date.now()) / 864e5);
      el.textContent = days > 1 ? `In ${days} days` : days === 1 ? 'Tomorrow' : 'Started';
    });
  };

  // the clips play like a VHS tape: a running counter, and the screen tilts towards the pointer in 3D
  const vhs = () => {
    const t0 = performance.now();
    const fmt = (s) => `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(Math.floor(s) % 60).padStart(2, '0')}`;
    const screens = [...document.querySelectorAll('.vhs-screen')];
    gsap.ticker.add(() => screens.forEach((sc) => {
      const v = sc.querySelector('video');
      sc.querySelector('.vhs-screen__osd--time').textContent = fmt(v ? v.currentTime : (performance.now() - t0) / 1000);
    }));
    if (Site.reduce || Site.touch) return;
    screens.forEach((sc) => {
      const inner = sc.querySelector('.vhs-screen__in');
      const rx = gsap.quickTo(inner, 'rotationX', { duration: 0.8, ease: 'power3' });
      const ry = gsap.quickTo(inner, 'rotationY', { duration: 0.8, ease: 'power3' });
      sc.addEventListener('pointermove', (e) => {
        const r = sc.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * 10);
        rx(-((e.clientY - r.top) / r.height - 0.5) * 8);
      });
      sc.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
  };

  Site.wait(load().then(vhs));
})();
