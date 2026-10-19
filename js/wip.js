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
    $('.wip-list').innerHTML = W.map((w, i) => `
      <article class="wip-item">
        <div class="wip-item__head">
          <div class="display wip-item__num"><span data-split>${pad(i + 1)}</span></div>
          <h2 class="wip-item__title">${esc(w.title)}</h2>
          <p class="mono wip-item__kind">(${esc(w.kind)})</p>
          <span class="mono tag wip-item__status"><i></i>${esc(w.status || Site.t('wipStatus'))}</span>
          <div class="wip-item__text" data-reveal="fade">${paras(sections[w.title.toLowerCase()])}</div>
          <ul class="mono wip-item__tags">${(w.tags || []).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        </div>
        <div class="wip-item__media${w.soon ? ' wip-item__media--soon display' : ' screen vhs-screen'}" data-reveal="clip">
          ${w.soon ? w.soon.map((l) => `<span>${esc(l)}</span>`).join('') : `
          <div class="vhs-screen__in">
            ${w.video
              ? `<video src="${w.video}" poster="${w.poster || ''}" muted loop autoplay playsinline aria-label="${esc(w.title)}"></video>`
              : `<img src="${w.img}" alt="${esc(w.title)}" loading="lazy">`}
            <span class="vhs-screen__noise"></span><span class="vhs-screen__track"></span>
            <span class="vhs-screen__osd vhs-screen__osd--play">▶ Play</span>
            <span class="vhs-screen__osd vhs-screen__osd--sp">SP</span>
            <span class="vhs-screen__osd vhs-screen__osd--time">0:00:00</span>
          </div>`}
        </div>
      </article>`).join('');
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
