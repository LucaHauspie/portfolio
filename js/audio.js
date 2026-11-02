/* =========================================================================
   AUDIO: the ambient background track + a soft tick when hovering things.
   - track: assets/ambient.m4a, looped, quiet
   - on by default, but browsers only allow sound after a click or key press,
     so it starts on the first click or tap. The header toggle turns it off (remembered).
   - it picks up where it was on the previous page, and drops away while a
     video with sound is playing
   ========================================================================= */

(() => {
  const SRC = 'assets/ambient.m4a'; // 96 kbps AAC (the 4.3 MB mp3 original is in _originals/)
  const KEY = 'lh-music';
  const VOLUME = 0.32;
  const HOVER = 'a[href], button, [data-cursor], label, .work, .pile-list__item';

  const wanted = () => { try { return localStorage.getItem(KEY) !== '0'; } catch (_) { return true; } };
  const save = (v) => { try { localStorage.setItem(KEY, v ? '1' : '0'); } catch (_) {} };
  const touch = matchMedia('(hover: none)').matches;

  let track = null, ctx = null, on = false, ducked = false, fade = null;
  const listeners = new Set();

  const fadeTo = (target, ms = 900) => {
    if (!track) return;
    clearInterval(fade);
    const from = track.volume, t0 = performance.now();
    fade = setInterval(() => {
      const k = Math.min(1, (performance.now() - t0) / ms);
      track.volume = from + (target - from) * k;
      if (k === 1) { clearInterval(fade); if (target === 0 && !on) track.pause(); }
    }, 30);
  };
  const level = () => (ducked ? 0 : VOLUME);

  function setOn(v) {
    on = v;
    save(v);
    if (v) {
      if (!track) {
        track = new Audio(SRC);
        track.loop = true;
        track.volume = 0;
        try { const t = +sessionStorage.getItem('lh-music-t'); if (t) track.currentTime = t; } catch (_) {}
      }
      track.play().catch(() => {});
      fadeTo(level());
      if (!ctx && (window.AudioContext || window.webkitAudioContext)) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx) ctx.resume();
    } else fadeTo(0, 400);
    listeners.forEach((fn) => fn(on));
  }

  // a short, soft tick (filtered noise), like a switch on old equipment
  let last = 0;
  function tick(strength = 1) {
    if (!on || !ctx || performance.now() - last < 45) return;
    last = performance.now();
    const t = ctx.currentTime;
    const len = Math.floor(ctx.sampleRate * 0.03);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 4;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3200 + Math.random() * 600; bp.Q.value = 2;
    const g = ctx.createGain(); g.gain.value = 0.14 * strength;
    src.connect(bp).connect(g).connect(ctx.destination);
    src.start(t);
  }
  if (!touch) {
    document.addEventListener('pointerover', (e) => {
      const el = e.target.closest && e.target.closest(HOVER);
      if (!el || (e.relatedTarget && el.contains(e.relatedTarget))) return; // only when entering it
      tick();
    });
  }

  // keep the place in the track for the next page
  addEventListener('pagehide', () => { try { if (track) sessionStorage.setItem('lh-music-t', track.currentTime); } catch (_) {} });

  // a video playing with its sound on pushes the music away
  const audible = () => [...document.querySelectorAll('video, audio')].some((m) => m !== track && !m.paused && !m.muted && m.volume > 0);
  ['play', 'pause', 'ended', 'volumechange'].forEach((type) => document.addEventListener(type, () => {
    ducked = audible();
    if (on) fadeTo(level(), 500);
  }, true));

  // on by default: start on the first click or tap (not on a key: someone tabbing through the page
  // with a keyboard or screen reader shouldn't suddenly get music; the toggle is right there)
  if (wanted()) {
    const start = (e) => {
      removeEventListener('pointerdown', start, true);
      if (e.target && e.target.closest && e.target.closest('[data-music]')) return;
      setOn(true);
    };
    addEventListener('pointerdown', start, true);
  }

  window.Music = {
    get on() { return on; },
    get wanted() { return on || wanted(); },
    toggle: () => setOn(!on),
    fadeOut: () => { if (on && track) { try { sessionStorage.setItem('lh-music-t', track.currentTime); } catch (_) {} fadeTo(0, 300); } },
    tick,
    onChange: (fn) => listeners.add(fn),
  };
})();
