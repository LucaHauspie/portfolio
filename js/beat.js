/* =========================================================================
   BEAT: an old school boom bap loop, made live in the browser (Web Audio).
   No samples or audio files: every kick, snare, hat, chord and crackle is
   synthesised here, so there's nothing copyrighted in it.
   - 88 BPM, MPC-style swing, a 4-bar jazzy minor loop (Am9, Dm9, Fmaj9, E7b9)
   - on by default: browsers only allow sound after a click or key press, so it
     starts on the first one. The header toggle turns it off (remembered).
   - the loop keeps its place when you go to another page
   ========================================================================= */

(() => {
  const KEY = 'lh-beat';
  const BPM = 88;
  const SIX = 60 / BPM / 4; // one 16th note, in seconds
  const SWING = SIX * 0.22; // every second 16th comes a little late
  const LOOP = 64; // 4 bars of 16ths

  const wanted = () => { try { return localStorage.getItem(KEY) !== '0'; } catch (_) { return true; } };
  const save = (v) => { try { localStorage.setItem(KEY, v ? '1' : '0'); } catch (_) {} };

  let ctx = null, master, drums, keys, verb, lfo, timer = null;
  let on = false, ducked = false;
  let step = 0, nextTime = 0;
  const listeners = new Set();

  /* --------------------------------------------------------------- sounds */

  const noise = (seconds) => {
    const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i += 1) d[i] = Math.random() * 2 - 1;
    return buf;
  };
  let noiseBuf;
  const env = (g, t, peak, decay, attack = 0.002) => {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  };

  function kick(t, v) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(130, t);
    o.frequency.exponentialRampToValueAtTime(46, t + 0.12);
    env(g, t, 0.95 * v, 0.42);
    o.connect(g).connect(drums);
    o.start(t); o.stop(t + 0.5);
    // the beater: a tiny click on top
    const n = ctx.createBufferSource(); n.buffer = noiseBuf;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2500;
    const ng = ctx.createGain(); env(ng, t, 0.18 * v, 0.012, 0.001);
    n.connect(lp).connect(ng).connect(drums);
    n.start(t, Math.random()); n.stop(t + 0.03);
    // pump the chords on every kick, like a sidechain
    keys.gain.cancelScheduledValues(t);
    keys.gain.setValueAtTime(0.55, t);
    keys.gain.linearRampToValueAtTime(1, t + 0.28);
  }

  function snare(t, v) {
    const n = ctx.createBufferSource(); n.buffer = noiseBuf;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
    const bp = ctx.createBiquadFilter(); bp.type = 'peaking'; bp.frequency.value = 2200; bp.gain.value = 6;
    const g = ctx.createGain(); env(g, t, 0.5 * v, 0.2);
    n.connect(hp).connect(bp).connect(g);
    g.connect(drums); g.connect(verb);
    n.start(t, Math.random()); n.stop(t + 0.3);
    // the body of the drum
    const o = ctx.createOscillator(); o.type = 'triangle';
    o.frequency.setValueAtTime(200, t); o.frequency.exponentialRampToValueAtTime(150, t + 0.1);
    const og = ctx.createGain(); env(og, t, 0.32 * v, 0.12);
    o.connect(og).connect(drums);
    o.start(t); o.stop(t + 0.2);
  }

  function hat(t, v, open = false) {
    const n = ctx.createBufferSource(); n.buffer = noiseBuf;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000;
    const g = ctx.createGain(); env(g, t, 0.13 * v, open ? 0.32 : 0.045);
    n.connect(hp).connect(g).connect(drums);
    n.start(t, Math.random()); n.stop(t + (open ? 0.4 : 0.08));
  }

  // electric piano: a sine with a soft overtone, a quick attack and a long fade, with a tape warble
  function chord(t, notes, v, length) {
    notes.forEach((f, i) => {
      [1, 2].forEach((mult, k) => {
        const o = ctx.createOscillator();
        o.type = k ? 'triangle' : 'sine';
        o.frequency.value = f * mult;
        o.detune.value = (i % 2 ? 4 : -4);
        lfo.connect(o.detune);
        const g = ctx.createGain();
        env(g, t + i * 0.012, (k ? 0.018 : 0.06) * v, length, 0.008);
        o.connect(g); g.connect(keys); g.connect(verb);
        o.start(t); o.stop(t + length + 0.1);
      });
    });
  }

  function bass(t, f, length) {
    const o = ctx.createOscillator(); o.type = 'triangle';
    o.frequency.value = f;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.42, t + 0.01);
    g.gain.setValueAtTime(0.42, t + length * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + length);
    o.connect(lp).connect(g).connect(master);
    o.start(t); o.stop(t + length + 0.05);
  }

  /* ------------------------------------------------------------- the loop */

  // one chord + bass root per bar
  const BARS = [
    { keys: [261.63, 329.63, 392.0, 493.88], root: 55.0 },   // Am9
    { keys: [174.61, 220.0, 261.63, 329.63], root: 73.42 },  // Dm9
    { keys: [220.0, 261.63, 329.63, 392.0], root: 87.31 },   // Fmaj9
    { keys: [207.65, 246.94, 293.66, 349.23], root: 82.41 }, // E7b9
  ];
  // 2-bar drum pattern (32 steps); numbers are velocities
  const KICK = { 0: 1, 10: 0.85, 16: 1, 23: 0.6, 26: 0.9 };
  const SNARE = { 4: 1, 12: 1, 20: 1, 28: 1, 31: 0.25 };
  const BASS = { 0: 0.8, 10: 0.45 }; // per bar: when the bass plays, length in beats

  function play(s, t) {
    const d = s % 32;
    if (KICK[d]) kick(t, KICK[d]);
    if (SNARE[d]) snare(t, SNARE[d]);
    if (d % 2 === 0) hat(t, d % 4 === 0 ? 0.75 : 0.45, d === 30);
    else if (d === 15 || d === 29) hat(t, 0.25);
    const bar = BARS[Math.floor(s / 16) % BARS.length];
    const b = s % 16;
    // chopped chord stabs: a long one on the one, a shorter one on the "and" of three
    if (b === 0) chord(t, bar.keys, 1, SIX * 9);
    if (b === 10) chord(t, bar.keys, 0.55, SIX * 5);
    if (BASS[b] !== undefined) bass(t, bar.root, SIX * 4 * (b === 0 ? 2.2 : 1.2));
  }

  function schedule() {
    while (nextTime < ctx.currentTime + 0.15) {
      play(step, nextTime + (step % 2 ? SWING : 0));
      nextTime += SIX;
      step = (step + 1) % LOOP;
    }
  }

  // the loop keeps running "in the background" between pages: pick it up where it is now
  function syncStep() {
    let t0 = 0;
    try { t0 = +sessionStorage.getItem('lh-beat-t0') || 0; } catch (_) {}
    if (!t0) { t0 = Date.now(); try { sessionStorage.setItem('lh-beat-t0', t0); } catch (_) {} }
    const elapsed = (Date.now() - t0) / 1000;
    const steps = Math.ceil(elapsed / SIX);
    step = steps % LOOP;
    nextTime = ctx.currentTime + (steps * SIX - elapsed) + 0.05;
  }

  /* ---------------------------------------------------------------- setup */

  function build() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    noiseBuf = noise(2);
    // master: a little saturation, a lowpass for the dusty sampler feel, a compressor to glue it
    master = ctx.createGain(); master.gain.value = 0;
    const shaper = ctx.createWaveShaper();
    const curve = new Float32Array(1024);
    for (let i = 0; i < curve.length; i += 1) { const x = (i / 1023) * 2 - 1; curve[i] = Math.tanh(x * 1.6) / Math.tanh(1.6); }
    shaper.curve = curve;
    const lofi = ctx.createBiquadFilter(); lofi.type = 'lowpass'; lofi.frequency.value = 6500;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4;
    const out = ctx.createGain(); out.gain.value = 0.45; // the compressor adds make-up gain: bring it back to background level
    master.connect(shaper).connect(lofi).connect(comp).connect(out).connect(ctx.destination);
    drums = ctx.createGain(); drums.gain.value = 0.9; drums.connect(master);
    keys = ctx.createGain(); keys.connect(master);
    // short room reverb
    verb = ctx.createConvolver();
    const len = ctx.sampleRate * 1.4;
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c += 1) { const d = ir.getChannelData(c); for (let i = 0; i < len; i += 1) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3; }
    verb.buffer = ir;
    const wet = ctx.createGain(); wet.gain.value = 0.22;
    verb.connect(wet).connect(master);
    // tape warble on the keys
    lfo = ctx.createGain(); lfo.gain.value = 7;
    const wob = ctx.createOscillator(); wob.frequency.value = 0.55; wob.connect(lfo); wob.start();
    // vinyl: soft hiss + random crackles
    const crackle = ctx.createBuffer(1, ctx.sampleRate * 5, ctx.sampleRate);
    const cd = crackle.getChannelData(0);
    for (let i = 0; i < cd.length; i += 1) {
      cd[i] = (Math.random() * 2 - 1) * 0.02;
      if (Math.random() < 0.0004) cd[i] = (Math.random() < 0.5 ? -1 : 1) * (0.3 + Math.random() * 0.7);
    }
    const vinyl = ctx.createBufferSource(); vinyl.buffer = crackle; vinyl.loop = true;
    const vhp = ctx.createBiquadFilter(); vhp.type = 'highpass'; vhp.frequency.value = 1200;
    const vg = ctx.createGain(); vg.gain.value = 0.12;
    vinyl.connect(vhp).connect(vg).connect(master); vinyl.start();
    return true;
  }

  const level = () => (ducked ? 0 : 0.4);
  function setOn(v) {
    on = v;
    save(v);
    if (v) {
      if (!ctx && !build()) return;
      ctx.resume();
      if (!timer) { syncStep(); timer = setInterval(schedule, 25); }
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(level(), ctx.currentTime, 0.6);
    } else if (ctx) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.12);
      setTimeout(() => { if (!on) { clearInterval(timer); timer = null; ctx.suspend(); } }, 600);
    }
    listeners.forEach((fn) => fn(on));
  }

  // a video playing with its sound on (e.g. the full film on a project page) pushes the beat down
  const anyAudible = () => [...document.querySelectorAll('video, audio')].some((m) => !m.paused && !m.muted && m.volume > 0);
  ['play', 'pause', 'ended', 'volumechange'].forEach((type) => document.addEventListener(type, () => {
    ducked = anyAudible();
    if (on && ctx) master.gain.setTargetAtTime(level(), ctx.currentTime, 0.2);
  }, true));

  // on by default (unless turned off before): start on the first click, tap or key
  if (wanted()) {
    const start = (e) => {
      ['pointerdown', 'keydown'].forEach((ev) => removeEventListener(ev, start, true));
      if (e.target && e.target.closest && e.target.closest('[data-beat]')) return; // the toggle handles itself
      setOn(true);
    };
    ['pointerdown', 'keydown'].forEach((ev) => addEventListener(ev, start, true));
  }

  window.Beat = {
    get on() { return on; },
    get wanted() { return on || wanted(); },
    toggle: () => setOn(!(on || wanted())), // "on" until the first click starts it counts as on
    fadeOut: () => { if (ctx && on) master.gain.setTargetAtTime(0, ctx.currentTime, 0.15); },
    onChange: (fn) => listeners.add(fn),
    bpm: BPM,
  };
})();
