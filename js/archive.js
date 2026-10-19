/* =========================================================================
   ARCHIVE: the posters as CD jewel cases, from window.ARCHIVE (js/data.js) + full-size lightbox
   ========================================================================= */

(() => {
  const { $, $$, reduce } = Site;
  const A = window.ARCHIVE || [];
  const esc = (t) => String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const pad = (n) => String(n).padStart(2, '0');

  // every poster sits in a CD jewel case (overlay baked by scripts/textures.mjs)
  const card = (a, i) => `
    <button class="jewel" type="button" data-i="${i}" data-cursor="View" data-reveal="fade">
      <span class="jewel__case"><img src="assets/archive/thumbs/${a.file}" alt="${esc(a.title)}" loading="lazy"></span>
      <span class="jewel__label mono"><span class="tag"><i></i>${pad(i + 1)}</span><span class="jewel__title">${esc(a.title)}</span><span class="jewel__note">${esc(a.note)}</span></span>
    </button>`;
  const grid = $('.archive-grid');
  const layout = () => {
    grid.innerHTML = A.map(card).join('');
    grid.querySelectorAll('.jewel').forEach((b) => b.addEventListener('click', () => open(+b.dataset.i)));
  };

  const box = $('.lightbox');
  const img = $('img', box);
  const cap = $('figcaption', box);
  let current = -1;

  const show = (i) => {
    current = (i + A.length) % A.length;
    const a = A[current];
    img.src = `assets/archive/${a.file}`;
    img.alt = a.title;
    cap.textContent = `(${pad(current + 1)}/${pad(A.length)}) ${a.title}${a.note ? `, ${a.note}` : ''}`;
  };
  const open = (i) => {
    show(i);
    box.classList.add('is-open');
    box.setAttribute('aria-hidden', 'false');
    Site.lenis && Site.lenis.stop();
    gsap.to(box, { opacity: 1, duration: reduce ? 0 : 0.4 });
    gsap.fromTo(img, { scale: 0.94, opacity: 0 }, { scale: 1, opacity: 1, duration: reduce ? 0 : 0.6, ease: 'expo.out' });
    $('.lightbox__close').focus();
  };
  const close = () => {
    gsap.to(box, {
      opacity: 0, duration: reduce ? 0 : 0.3,
      onComplete: () => { box.classList.remove('is-open'); box.setAttribute('aria-hidden', 'true'); },
    });
    Site.lenis && Site.lenis.start();
    const btn = $(`.jewel[data-i="${current}"]`);
    btn && btn.focus();
  };

  layout();
  $('.lightbox__close').addEventListener('click', close);
  $('.lightbox__nav--prev').addEventListener('click', () => show(current - 1));
  $('.lightbox__nav--next').addEventListener('click', () => show(current + 1));
  box.addEventListener('click', (e) => { if (e.target === box || e.target.classList.contains('lightbox__fig')) close(); });
  addEventListener('keydown', (e) => {
    if (!box.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });
})();
