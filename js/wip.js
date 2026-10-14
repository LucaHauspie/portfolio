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
          <span class="mono wip-item__status">${Site.t('wipStatus')}</span>
          <div class="wip-item__text" data-reveal="fade">${paras(sections[w.title.toLowerCase()])}</div>
          <ul class="mono wip-item__tags">${(w.tags || []).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        </div>
        <div class="wip-item__media" data-reveal="clip">
          ${w.video
            ? `<video src="${w.video}" poster="${w.poster || ''}" muted loop autoplay playsinline aria-label="${esc(w.title)}"></video>`
            : `<img src="${w.img}" alt="${esc(w.title)}" loading="lazy">`}
        </div>
      </article>`).join('');
  };

  Site.wait(load());
})();
