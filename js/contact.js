/* =========================================================================
   CONTACT — copy e-mail, big social links, mailto form
   ========================================================================= */

(() => {
  const { $, scramble } = Site;
  const { SITE } = window;

  // big social rows
  $('.socials-big').innerHTML = SITE.socials.map((s) => `
    <a href="${s.url}" target="_blank" rel="noopener" data-cursor="Open">
      <span class="display" data-split>${s.label}</span>
      <span class="socials-big__arrow">↗</span>
    </a>`).join('');

  // copy e-mail to clipboard
  const copyBtn = $('.copy-email');
  const hint = $('.copy-email__hint');
  let resetTimer;
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(SITE.email);
      scramble(hint, '(Copied to clipboard ✓)');
    } catch (_) {
      location.href = `mailto:${SITE.email}`;
      return;
    }
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => scramble(hint, '(Click to copy)'), 2200);
  });

  // form → opens the visitor's mail app (static hosting has no backend)
  const form = $('.form');
  const submit = $('button[type="submit"]', form);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const missing = ['name', 'email', 'message'].find((k) => !String(data.get(k) || '').trim());
    if (missing) {
      const field = form.elements[missing];
      field.focus();
      gsap.fromTo(field, { x: -10 }, { x: 0, duration: 0.6, ease: 'elastic.out(1, 0.3)' });
      return;
    }
    const subject = `${data.get('topic')}: ${data.get('name')}`;
    const body = `${data.get('message')}\n\n${data.get('name')} (${data.get('email')})`;
    location.href = `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const label = submit.innerHTML;
    scramble(submit, 'Opening mail app…');
    setTimeout(() => (submit.innerHTML = label), 3000);
  });
})();
