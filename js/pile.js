/* =========================================================================
   PILE: a hill of old CRT TVs in a dark room (Three.js), for the home hero.
   - every TV is modelled here: a rounded metal cabinet, a front panel, the tapered tube
     at the back and a slightly curved screen; the materials use the textures baked by
     scripts/textures.mjs (assets/textures/), tinted silver or gunmetal per TV
   - the TVs are stacked in rings, wide at the bottom and narrow at the top, like a cone
   - each TV can have a slot name (p0–p4, name, role, dev, live): home.js decides what's on
     those screens; the others glow blank with static
     createPile(canvas, { screens, onHover, onClick }) → { setActive, rectOf, ready }
   ========================================================================= */

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// where the glass sits on tv-front.webp (fractions, measured from the top left)
const SCREEN = { x0: 0.07, x1: 0.78, y0: 0.09, y1: 0.84 };
// cabinet sizes: width, height, depth (all keep the 1.3 ratio of the front texture)
const SIZES = { S: [1.0, 0.77, 0.95], M: [1.3, 1.0, 1.15], L: [1.62, 1.25, 1.35] };
const TINTS = { silver: 0x2b2d31, gunmetal: 0x17181b }; // dark, glossy metal
// the pile curves around the viewer: the further a TV is from the middle, the further back it stands
const CURVE = 0.16;
// the hill, ring by ring from the ground up: [x, z, size, slot, metal]. Heights stack up by themselves,
// and every TV turns towards the camera (with a little wobble).
const LAYOUT = [
  // ground: front, middle and back rows
  [-3.4, 1.0, 'M', null, 'gunmetal'], [-1.75, 1.45, 'L', 'role', 'silver'], [0.0, 1.7, 'L', 'p0', 'gunmetal'],
  [1.8, 1.45, 'L', 'p1', 'silver'], [3.45, 1.0, 'M', null, 'gunmetal'],
  [-2.6, -0.5, 'M', null, 'silver'], [-0.9, -0.2, 'L', null, 'gunmetal'], [0.95, -0.2, 'L', null, 'silver'], [2.65, -0.5, 'M', null, 'gunmetal'],
  [-1.5, -2.0, 'M', null, 'gunmetal'], [0.25, -2.1, 'L', null, 'silver'], [1.95, -1.9, 'M', null, 'gunmetal'],
  // second ring
  [-2.5, 0.55, 'M', 'dev', 'gunmetal'], [-0.85, 0.85, 'L', 'p2', 'silver'], [0.9, 0.85, 'M', 'p3', 'gunmetal'], [2.55, 0.55, 'M', null, 'silver'],
  [-1.0, -1.2, 'M', null, 'silver'], [1.0, -1.25, 'M', null, 'gunmetal'],
  // third ring
  [-1.55, 0.2, 'M', 'live', 'silver'], [0.05, 0.35, 'M', 'p4', 'gunmetal'], [1.6, 0.15, 'S', null, 'silver'], [-0.1, -0.85, 'S', null, 'gunmetal'],
  // the top
  [-0.2, -0.1, 'M', 'name', 'silver'],
];
const CAM = { y: 0.55, dist: 8.1, target: [0, 2.3, 0] }; // low, looking up at the pile

const VERT = `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FRAG = `
uniform sampler2D map;
uniform float uHas, uTime, uHover, uNoise, uSeed, uPower, uDim;
uniform vec2 uRepeat, uOffset;
uniform vec3 uTint;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float box(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
void main() {
  vec2 c = vUv - 0.5;
  vec2 uv = 0.5 + c * (1.0 + dot(c, c) * 0.14);                  // the bulge of the tube
  vec3 col = uHas > 0.5 ? texture2D(map, uv * uRepeat + uOffset).rgb : uTint;
  float n = hash(floor(vUv * vec2(260.0, 200.0)) + floor(uTime * 24.0) + uSeed);
  col = mix(col, vec3(n) * uTint, uNoise);                         // static
  col *= 0.88 + 0.12 * sin(vUv.y * 700.0);                         // scanlines
  col += 0.05 * smoothstep(0.96, 1.0, fract(vUv.y * 0.6 - uTime * 0.12 + uSeed)); // a slow rolling bar
  col *= 1.0 - 0.55 * pow(length(c) * 1.3, 2.6);                  // darker towards the corners
  col *= (0.92 + 0.45 * uHover) * uDim * uPower;
  col *= 1.0 - 0.06 * hash(vec2(floor(uTime * 12.0), uSeed));      // a little flicker
  float edge = box(c, vec2(0.5), 0.06);                            // rounded corners, like the glass
  col *= smoothstep(0.0, -0.01, edge);
  gl_FragColor = vec4(col, 1.0);
}`;

export async function createPile(canvas, { screens = [], onHover = () => {}, onClick = () => {} } = {}) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x060607);
  scene.fog = new THREE.Fog(0x060607, 10, 22);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 60);
  const target = new THREE.Vector3(...CAM.target);

  /* ------------------------------------------------------------ textures */
  const loader = new THREE.TextureLoader();
  const load = (url, srgb = true) => new Promise((res) => loader.load(url, (t) => { if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; res(t); }, undefined, () => res(null)));
  const [metalTex, roughTex, frontTex, floorTex] = await Promise.all([
    load('assets/textures/tv-metal.webp'), load('assets/textures/tv-metal-rough.webp', false),
    load('assets/textures/tv-front.webp'), load('assets/textures/floor.webp'),
  ]);
  if (floorTex) { floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(7, 7); }
  // brushed metal: the baked texture for colour and roughness, a dim room reflected in it
  // dark metal under a glossy clearcoat: the brushed texture shows faintly, the room reflects in it
  const metal = Object.fromEntries(Object.entries(TINTS).map(([k, c]) => [k, new THREE.MeshPhysicalMaterial({
    map: metalTex, roughnessMap: roughTex, color: c, roughness: 0.55, metalness: 0.92, envMapIntensity: 1.1, clearcoat: 1, clearcoatRoughness: 0.12,
  })]));
  const fronts = Object.fromEntries(Object.entries(TINTS).map(([k, c]) => [k, new THREE.MeshPhysicalMaterial({
    map: frontTex, roughnessMap: roughTex, color: c, roughness: 0.6, metalness: 0.88, envMapIntensity: 0.9, clearcoat: 0.8, clearcoatRoughness: 0.18,
  })]));
  // only the TVs reflect a (dim) room; the floor and wall get no reflections and stay dark
  const room = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.02).texture;
  [...Object.values(metal), ...Object.values(fronts)].forEach((m) => { m.envMap = room; });

  // a screen's text, drawn with the site's display font
  await document.fonts.load('800 100px Archivo').catch(() => {});
  await document.fonts.ready;
  const textTexture = (lines, tone) => {
    const cv = document.createElement('canvas');
    cv.width = 640; cv.height = 480;
    const g = cv.getContext('2d');
    // dark screens with quiet text: only the project screens are bright and colourful
    g.fillStyle = '#0c0d0f';
    g.fillRect(0, 0, 640, 480);
    g.fillStyle = tone === 'red' ? '#4a74ff' : '#7d838b';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    let size = 150;
    const font = () => `800 extra-condensed ${size}px Archivo, "Arial Narrow", sans-serif`; // the site's narrow display cut
    g.font = font();
    while (size > 40 && (Math.max(...lines.map((l) => g.measureText(l.toUpperCase()).width)) > 520 || lines.length * size * 0.9 > 360)) { size -= 4; g.font = font(); }
    lines.forEach((l, k) => g.fillText(l.toUpperCase(), 320, 240 + (k - (lines.length - 1) / 2) * size * 0.92));
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };

  /* --------------------------------------------------------------- room */
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ map: floorTex, color: 0x111113, roughness: 0.55, metalness: 0.05 }));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(60, 20), new THREE.MeshStandardMaterial({ map: floorTex, color: 0x18181a, roughness: 0.9 }));
  wall.position.set(0, 10, -4.5);
  scene.add(wall);
  // soft light painted on the floor and wall: a pool in front of the pile, faint squares on the wall
  const glowTexture = (draw, w = 512, h = 512) => {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    draw(cv.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  };
  const additive = (map, opacity) => new THREE.MeshBasicMaterial({ map, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(14, 7), additive(glowTexture((g, w, h) => {
    const r = g.createRadialGradient(w / 2, h * 0.3, 0, w / 2, h * 0.3, w * 0.55);
    r.addColorStop(0, 'rgba(210,225,240,0.9)'); r.addColorStop(0.5, 'rgba(120,135,150,0.25)'); r.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = r; g.fillRect(0, 0, w, h);
  }), 0.16));
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0.1, 0.01, 3.4);
  scene.add(pool);
  const squares = new THREE.Mesh(new THREE.PlaneGeometry(4, 3.4), additive(glowTexture((g) => {
    g.filter = 'blur(10px)';
    [[40, 40], [200, 30], [60, 190], [230, 200], [90, 350], [250, 360]].forEach(([x, y], k) => {
      g.fillStyle = `rgba(200,215,230,${0.16 + (k % 3) * 0.06})`; g.fillRect(x, y, 120, 110);
    });
  }), 0.22));
  squares.position.set(5.6, 2.2, -4.45);
  scene.add(squares);

  // light from the screens, faked with a few lights in front of the pile
  scene.add(new THREE.HemisphereLight(0x9aa6b4, 0x050505, 0.1));
  [[-3, 2.2, 3.6, 4], [0.4, 4.2, 3.8, 6], [3, 2.2, 3.6, 3.6], [0, 1.2, 4.2, 2.5]].forEach(([x, y, z, i]) => {
    const l = new THREE.PointLight(0xdfe8f5, i, 9, 1.6); l.position.set(x, y, z); scene.add(l);
  });
  const rim = new THREE.DirectionalLight(0x8fa0b5, 0.35); rim.position.set(-4, 6, -3); scene.add(rim);

  /* ----------------------------------------------------------------- TVs */
  const tvs = [];
  const pickables = [];
  const placed = [];
  LAYOUT.forEach(([x, z0, size, slot, tint], i) => {
    const [w, h, d] = SIZES[size];
    const z = z0 - CURVE * x * x; // a curved wall of TVs, not a flat one
    // stack: rest on the highest TV underneath
    let base = 0;
    placed.forEach((p) => { if (Math.abs(p.x - x) < (p.w + w) * 0.42 && Math.abs(p.z - z) < (p.d + d) * 0.38) base = Math.max(base, p.top); });
    const y = base + h / 2;
    placed.push({ x, z, w, d, top: base + h });

    const group = new THREE.Group();
    group.position.set(x, y, z);
    // face the camera, give or take a few degrees
    const turn = Math.atan2(-x * 0.8, CAM.dist - z) + THREE.MathUtils.degToRad(((i * 37) % 19) - 9);
    group.rotation.y = turn;
    const bodyDepth = d * 0.6;
    const body = new THREE.Mesh(new RoundedBoxGeometry(w, h, bodyDepth, 3, w * 0.05), metal[tint]);
    body.position.z = -bodyDepth / 2;
    const front = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.97, h * 0.97), fronts[tint]);
    front.position.z = 0.003;
    // the tube's back: a square frustum, narrower at the end
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.22, w * 0.5, d * 0.45, 4, 1), metal[tint]);
    tube.rotation.set(-Math.PI / 2, Math.PI / 4, 0);
    tube.scale.set(1, 1, h / w);
    tube.position.set(0, h * 0.02, -bodyDepth - d * 0.2);

    // the glass: a plane bulging slightly outwards
    const fw = w * 0.97, fh = h * 0.97;
    const sw = (SCREEN.x1 - SCREEN.x0) * fw, sh = (SCREEN.y1 - SCREEN.y0) * fh;
    const geo = new THREE.PlaneGeometry(sw, sh, 16, 12);
    const pos = geo.attributes.position;
    for (let k = 0; k < pos.count; k += 1) {
      const px = pos.getX(k) / (sw / 2), py = pos.getY(k) / (sh / 2);
      pos.setZ(k, w * 0.035 * (1 - px * px) * (1 - py * py));
    }
    const s = (slot && screens[slot]) || { type: 'blank' };
    const uniforms = {
      map: { value: null }, uHas: { value: 0 }, uTime: { value: 0 }, uHover: { value: 0 }, uPower: { value: reduce ? 1 : 0 },
      uNoise: { value: s.type === 'blank' ? 0.28 : 0.04 }, uSeed: { value: Math.random() * 10 }, uDim: { value: 1 },
      uRepeat: { value: new THREE.Vector2(1, 1) }, uOffset: { value: new THREE.Vector2(0, 0) },
      uTint: { value: new THREE.Color(s.type === 'blank' ? 0xb9c4cc : 0xffffff) },
    };
    const screen = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG }));
    screen.position.set(((SCREEN.x0 + SCREEN.x1) / 2 - 0.5) * fw, (0.5 - (SCREEN.y0 + SCREEN.y1) / 2) * fh, 0.006);

    // what's on it
    const aspect = sw / sh;
    const cover = (tex) => {
      const img = tex.image; const a = img.width / img.height;
      if (a > aspect) { uniforms.uRepeat.value.set(aspect / a, 1); uniforms.uOffset.value.set((1 - aspect / a) / 2, 0); }
      else { uniforms.uRepeat.value.set(1, a / aspect); uniforms.uOffset.value.set(0, (1 - a / aspect) / 2); }
    };
    if (s.type === 'project') {
      load(s.image).then((tex) => { if (!tex) return; cover(tex); uniforms.map.value = tex; uniforms.uHas.value = 1; });
    } else if (s.type === 'text') {
      const tex = textTexture(s.lines, s.tone); cover(tex); uniforms.map.value = tex; uniforms.uHas.value = 1;
    }

    group.add(body, front, tube, screen);
    scene.add(group);
    const tv = { i, slot, group, screen, uniforms, type: s.type, project: s.index, home: group.position.clone(), drop: 0, facing: new THREE.Vector3(Math.sin(turn), 0, Math.cos(turn)), hover: 0, w, h };
    [body, front, screen].forEach((m) => { m.userData.tv = tv; pickables.push(m); });
    tvs.push(tv);

    // a reflection of the screen on the floor in front of the bottom row
    if (base === 0 && z > 0.5) {
      const refl = new THREE.Mesh(new THREE.PlaneGeometry(sw * 1.05, 2.6), additive(glowTexture((g, cw, ch) => {
        const lg = g.createLinearGradient(0, 0, 0, ch);
        lg.addColorStop(0, 'rgba(220,232,245,0.85)'); lg.addColorStop(0.35, 'rgba(160,175,190,0.25)'); lg.addColorStop(1, 'rgba(0,0,0,0)');
        g.filter = 'blur(6px)'; g.fillStyle = lg; g.fillRect(12, 0, cw - 24, ch);
      }, 128, 256), 0.1));
      refl.rotation.x = -Math.PI / 2;
      refl.position.set(screen.position.x, 0.012, 1.3 + 0.02);
      group.add(refl);
      refl.position.y = -y + 0.012;
      tv.reflection = refl;
    }
  });

  /* ----------------------------------------------------- render + bloom */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.55, 0.45, 0.8);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloom.resolution.set(w / 2, h / 2);
    camera.aspect = w / h;
    // step back on narrow screens so the whole pile fits
    camera.userData.dist = Math.max(CAM.dist, 12 / camera.aspect);
    // the fog follows the camera, so the pile never sinks into it
    scene.fog.near = camera.userData.dist - 2;
    scene.fog.far = camera.userData.dist + 12;
    camera.updateProjectionMatrix();
  };
  resize();
  new ResizeObserver(resize).observe(canvas);

  /* -------------------------------------------------------------- hover */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2(9, 9);
  let mx = 0, my = 0, active = null, forced = null;
  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    mx = ndc.x; my = ndc.y;
  });
  canvas.addEventListener('pointerleave', () => ndc.set(9, 9));
  canvas.addEventListener('click', () => { if (active) onClick(active); });

  const setActive = (tv) => {
    if (tv === active) return;
    active = tv;
    canvas.style.cursor = tv && tv.type === 'project' ? 'pointer' : '';
    onHover(tv ? { type: tv.type, index: tv.project, slot: tv.slot } : null);
  };

  // the TV's screen in page coordinates, for placing the big preview next to it
  const corners = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  const bySlot = (slot) => tvs.find((tv) => tv.slot === slot) || null;
  const rectOf = (slot) => {
    const tv = bySlot(slot);
    if (!tv) return null;
    const g = tv.screen.geometry.parameters;
    const r = canvas.getBoundingClientRect();
    const xs = [], ys = [];
    corners.forEach((v, k) => {
      v.set((k % 2 ? 0.5 : -0.5) * g.width, (k < 2 ? 0.5 : -0.5) * g.height, 0);
      tv.screen.localToWorld(v).project(camera);
      xs.push(r.left + ((v.x + 1) / 2) * r.width);
      ys.push(r.top + ((1 - v.y) / 2) * r.height);
    });
    const left = Math.min(...xs), top = Math.min(...ys);
    return { left, top, width: Math.max(...xs) - left, height: Math.max(...ys) - top, right: Math.max(...xs), bottom: Math.max(...ys) };
  };

  /* --------------------------------------------------------------- loop */
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
  const clock = new THREE.Clock();
  let camX = 0, camY = 0;
  const frame = () => {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    const t = clock.getElapsedTime();
    // camera: a slow drift plus a little parallax with the pointer
    if (!reduce) {
      camX += ((Math.abs(mx) < 2 ? mx : 0) * 0.7 + Math.sin(t * 0.15) * 0.25 - camX) * 0.04;
      camY += ((Math.abs(my) < 2 ? my : 0) * 0.35 - camY) * 0.04;
    }
    const dist = camera.userData.dist || CAM.dist;
    camera.position.set(0.3 + camX, CAM.y + camY, dist);
    camera.lookAt(target);

    if (forced === null) {
      ray.setFromCamera(ndc, camera);
      const hit = Math.abs(ndc.x) <= 1 ? ray.intersectObjects(pickables, false)[0] : null;
      const tv = hit && hit.object.userData.tv;
      setActive(tv && tv.type === 'project' ? tv : null); // only the project TVs react
    } else setActive(bySlot(forced));

    tvs.forEach((tv) => {
      const on = tv === active ? 1 : 0;
      tv.hover += (on - tv.hover) * 0.15;
      const u = tv.uniforms;
      u.uTime.value = t;
      u.uHover.value = tv.hover;
      const base = tv.type === 'project' ? 1 : tv.type === 'text' ? 0.7 : 0.18; // the projects are the bright ones
      u.uDim.value += ((active && tv !== active ? base * 0.55 : base) - u.uDim.value) * 0.1;
      // the hovered TV leans out of the pile a little
      tv.group.position.copy(tv.home).addScaledVector(tv.facing, tv.hover * 0.22);
      tv.group.position.y += tv.drop;
      tv.group.scale.setScalar(1 + tv.hover * 0.025);
    });
    composer.render();
  };

  // entrance: the TVs drop onto the pile one by one, then their screens switch on
  const ready = new Promise((res) => {
    if (reduce || !window.gsap) { res(); return; }
    tvs.forEach((tv, k) => {
      gsap.fromTo(tv, { drop: 7 }, { drop: 0, duration: 0.9, ease: 'bounce.out', delay: 0.15 + k * 0.05 });
      gsap.to(tv.uniforms.uPower, { value: 1, duration: 0.5, delay: 0.9 + k * 0.05, ease: 'steps(4)', onComplete: k === tvs.length - 1 ? res : undefined });
      if (tv.reflection) gsap.from(tv.reflection.material, { opacity: 0, duration: 0.6, delay: 1 + k * 0.05 });
    });
  });
  frame();

  return {
    // highlight a TV by its slot from outside (e.g. the project list under the pile); null gives control back to the pointer
    setActive: (slot) => { forced = slot; },
    rectOf,
    ready,
  };
}
