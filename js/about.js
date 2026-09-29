/* =========================================================================
   ABOUT: renders the page text from content/about.md
   ## Hero (facts), ## Intro (paragraph, *word* = red), any other ## Heading
   with "- Big | small" items = a numbered chapter, ## Tone of voice = words.
   ========================================================================= */

(() => {
  const { $ } = Site;
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const pad = (n) => String(n).padStart(2, '0');

  const load = async () => {
    let md = '';
    try {
      const res = await fetch('content/about.md', { cache: 'no-cache' });
      if (res.ok) md = await res.text();
    } catch (_) { /* opened as a file: the page renders without this text */ }
    md = md.replace(/<!--[\s\S]*?-->/g, '');

    const sections = md.split(/^##\s+/m).slice(1).map((chunk) => {
      const nl = chunk.indexOf('\n');
      return { head: (nl < 0 ? chunk : chunk.slice(0, nl)).trim(), body: (nl < 0 ? '' : chunk.slice(nl + 1)).trim() };
    });
    const items = (body) => body.split('\n').filter((l) => /^\s*-\s+/.test(l)).map((l) => l.replace(/^\s*-\s+/, ''));

    // hero facts
    const facts = $('[data-facts]');
    const hero = sections.find((s) => s.head.toLowerCase() === 'hero');
    if (facts) {
      facts.outerHTML = (hero ? items(hero.body) : []).map((f) => {
        const [label, ...rest] = f.split(':');
        return `<span>(${esc(label.trim())})<br>${esc(rest.join(':').trim())}</span>`;
      }).join('');
    }

    // intro: blank line = new paragraph, *word* = red highlight
    const intro = sections.find((s) => s.head.toLowerCase() === 'intro');
    $('.about-intro__text').innerHTML = (intro ? intro.body : '')
      .split(/\n\s*\n/).map((p) => esc(p.trim()).replace(/\*(.+?)\*/g, '<strong>$1</strong>')).join('<br><br>');

    // Education + Experience: one chapter, two columns ("- Place | role | period")
    const cvNames = ['education', 'experience'];
    const cv = sections.filter((s) => cvNames.includes(s.head.toLowerCase()));
    const cvHtml = (num) => `
    <section class="chapter chapter--cv" data-header="dark">
      <div class="chapter__head">
        <div class="display chapter__num"><span data-split>${pad(num)}</span></div>
        <p class="mono">${cv.map((s) => esc(s.head)).join(' &amp; ')}</p>
      </div>
      <div class="cv">
        ${cv.map((s) => `
        <div class="cv__col">
          <p class="mono cv__label">(${esc(s.head)})</p>
          <ul class="cv__list" data-reveal="stagger">
            ${items(s.body).map((it) => {
              const [place, role = '', when = ''] = it.split('|').map((x) => x.trim());
              return `<li class="cv__item"><span class="cv__place">${esc(place)}</span><span class="cv__role">${esc(role)}</span><span class="cv__when mono">${esc(when)}</span></li>`;
            }).join('')}
          </ul>
        </div>`).join('')}
      </div>
    </section>`;

    // chapters
    let n = 0;
    let cvDone = false;
    const html = sections
      .filter((s) => !['hero', 'intro'].includes(s.head.toLowerCase()))
      .filter((s) => {
        if (!cvNames.includes(s.head.toLowerCase())) return true;
        if (cvDone) return false;
        cvDone = true;
        s.isCv = true;
        return true;
      })
      .map((s) => {
        n += 1;
        if (s.isCv) return cvHtml(n);
        const head = `
      <div class="chapter__head">
        <div class="display chapter__num"><span data-split>${pad(n)}</span></div>
        <p class="mono">${esc(s.head)}${s.head.toLowerCase() === 'tone of voice' ? '<br>(hover the words)' : ''}</p>
      </div>`;
        if (s.head.toLowerCase() === 'tone of voice') {
          const words = s.body.split(/[,\n]/).map((w) => w.trim()).filter(Boolean);
          return `
    <section class="chapter" data-header="dark">${head}
      <div class="voice display" data-reveal="stagger">${words.map((w) => `<span>${esc(w)}</span>`).join('')}</div>
    </section>`;
        }
        return `
    <section class="chapter" data-header="dark">${head}
      <div class="rows" data-reveal="stagger">
        ${items(s.body).map((it) => {
          const [big, small = ''] = it.split('|').map((x) => x.trim());
          return `<div class="rows__item"><span class="display rows__big" data-split>${esc(big)}</span><span class="mono">${esc(small)}</span></div>`;
        }).join('\n        ')}
      </div>
    </section>`;
      }).join('\n');
    $('[data-chapters]').outerHTML = html;
  };

  Site.wait(load());
})();
