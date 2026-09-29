/* =========================================================================
   ARCHIVE: poster grid from window.ARCHIVE (js/data.js) + full-size lightbox
   ========================================================================= */

(() => {
  const { $, $$, reduce } = Site;
  const A = window.ARCHIVE || [];
  const esc = (t) => String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const pad = (n) => String(n).padStart(2, '0');

  const card = (a, i) => `
    <button class="poster" type="button" data-i="${i}" data-cursor="View" data-reveal="fade">
      <div class="poster__img"><img src="assets/archive/thumbs/${a.file}" alt="${esc(a.title)}" loading="lazy"></div>
      <div class="poster__label mono"><span>(${pad(i + 1)}) ${esc(a.title)}</span><span>${esc(a.note)}</span></div>
    </button>`;
  // columns filled left to right, so the first row reads 01, 02, 03
  const grid = $('.archive-grid');
  const colCount = () => (innerWidth <= 600 ? 1 : innerWidth <= 1000 ? 2 : 3);
  let cols = 0;
  const layout = () => {
    const n = colCount();
    if (n === cols) return;
    cols = n;
    const buckets = Array.from({ length: n }, () => []);
    A.forEach((a, i) => buckets[i % n].push(card(a, i)));
    grid.innerHTML = buckets.map((b) => `<div class="archive-col">${b.join('')}</div>`).join('');
    grid.querySelectorAll('.poster').forEach((b) => b.addEventListener('click', () => open(+b.dataset.i)));
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
    const btn = $(`.poster[data-i="${current}"]`);
    btn && btn.focus();
  };

  layout();
  addEventListener('resize', () => { const before = cols; layout(); if (cols !== before) ScrollTrigger.refresh(); });
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
