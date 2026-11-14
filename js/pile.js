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
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// where the glass sits on tv-front.webp (fractions, measured from the top left)
const SCREEN = { x0: 0.07, x1: 0.78, y0: 0.09, y1: 0.84 };
// cabinet sizes: width, height, depth (all keep the 1.3 ratio of the front texture)
const SIZES = { S: [1.0, 0.77, 0.95], M: [1.3, 1.0, 1.15], L: [1.62, 1.25, 1.35] };
const TINTS = { silver: 0x1d1e21, gunmetal: 0x101113 }; // almost black, glossy metal
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
const CAM = { y: 0.55, dist: 8.1, target: [0, 2.3, 0] };

// phones (portrait): a tower, two TVs wide, the project TVs big at the front and a few blank ones behind
const TOWER = [
  [-0.84, 0.6, 'L', 'p0', 'gunmetal'], [0.84, 0.55, 'L', 'p1', 'silver'],
  [-0.9, -0.9, 'M', null, 'silver'], [0.95, -0.95, 'M', null, 'gunmetal'],
  [-0.72, 0.5, 'M', 'p2', 'silver'], [0.74, 0.45, 'M', 'role', 'gunmetal'],
  [-0.7, 0.4, 'M', 'dev', 'gunmetal'], [0.72, 0.35, 'M', 'p3', 'silver'],
  [-0.62, 0.3, 'M', 'p4', 'silver'], [0.68, 0.25, 'S', 'live', 'gunmetal'],
  [0.0, 0.2, 'M', 'name', 'gunmetal'],
];
const CAM_TOWER = { y: 0.9, target: [0, 2.85, 0] }; // low, looking up at the pile

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
  // portrait screens get the tower (chosen once, when the pile is made)
  const tall = canvas.clientWidth / canvas.clientHeight < 0.8;
  const layout = tall ? TOWER : LAYOUT;
  const curve = tall ? 0.04 : CURVE;
  const cam = tall ? { ...CAM, ...CAM_TOWER } : CAM;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  // sharp on retina screens (capped at 2×; the 30 fps cap below keeps it light)
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  // soft daylight shadows on the studio floor
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap; // soft, blurred shadow edges

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 60);
  const target = new THREE.Vector3(...cam.target);

  /* ------------------------------------------------------------ textures */
  const loader = new THREE.TextureLoader();
  const load = (url, srgb = true) => new Promise((res) => loader.load(url, (t) => { if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); res(t); }, undefined, () => res(null)));
  const [metalTex, roughTex, frontTex, floorTex] = await Promise.all([
    load('assets/textures/tv-metal.webp'), load('assets/textures/tv-metal-rough.webp', false),
    load('assets/textures/tv-front.webp'), load('assets/textures/floor.webp'),
  ]);
  if (floorTex) { floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(7, 7); }
  // brushed metal: the baked texture for colour and roughness, a dim room reflected in it
  // dark metal under a glossy clearcoat: the brushed texture shows faintly, the room reflects in it
  const metal = Object.fromEntries(Object.entries(TINTS).map(([k, c]) => [k, new THREE.MeshPhysicalMaterial({
    map: metalTex, roughnessMap: roughTex, color: c, roughness: 0.5, metalness: 0.9, envMapIntensity: 0.32, clearcoat: 1, clearcoatRoughness: 0.15,
  })]));
  const fronts = Object.fromEntries(Object.entries(TINTS).map(([k, c]) => [k, new THREE.MeshPhysicalMaterial({
    map: frontTex, roughnessMap: roughTex, color: c, roughness: 0.6, metalness: 0.88, envMapIntensity: 0.28, clearcoat: 0.8, clearcoatRoughness: 0.18,
  })]));
  // only the TVs reflect the (dim) studio, which gives the dark metal its highlights
  const room = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.02).texture;
  [...Object.values(metal), ...Object.values(fronts)].forEach((m) => { m.envMap = room; });

  // a screen's text, drawn with the site's display font
  await document.fonts.load('800 100px Archivo').catch(() => {});
  await document.fonts.ready;
  const textTexture = (lines, tone) => {
    const cv = document.createElement('canvas');
    cv.width = 1280; cv.height = 960; // drawn at 2×, so the text stays crisp
    const g = cv.getContext('2d');
    g.scale(2, 2);
    // dark screens with quiet text: only the project screens are bright and colourful
    g.fillStyle = '#0c0d0f';
    g.fillRect(0, 0, 640, 480);
    g.fillStyle = tone === 'red' ? '#c9c5bd' : '#7d838b'; // the highlighted screen in off-white, not blue
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
  // a photo studio, kept subtle: a seamless paper backdrop drawn as the background (a touch darker up the
  // wall and in the corners, a lighter floor that ends in the page colour at the bottom), so it reads as a
  // room without any visible edge. Unlit, so the lights below only shape the TVs and their shadows.
  scene.background = (() => {
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 512;
    const g = cv.getContext('2d');
    const lg = g.createLinearGradient(0, 0, 0, 512);
    lg.addColorStop(0, '#d8d4cd');    // the wall, up high
    lg.addColorStop(0.62, '#e2dfd8');
    lg.addColorStop(0.8, '#dcd8d1');  // where the wall turns into the floor: a faint band of shade
    lg.addColorStop(0.9, '#e8e5df');
    lg.addColorStop(1, '#efede8');    // the floor, at the bottom exactly the page colour
    g.fillStyle = lg; g.fillRect(0, 0, 64, 512);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  scene.fog = null;
  // the floor only shows the shadows
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ color: 0x1a1612, opacity: 0.3 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  // a soft, dark contact shadow right under the pile
  const contact = (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 256;
    const g = cv.getContext('2d');
    const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    r.addColorStop(0, 'rgba(20,16,12,0.6)'); r.addColorStop(0.5, 'rgba(20,16,12,0.28)'); r.addColorStop(1, 'rgba(20,16,12,0)');
    g.fillStyle = r; g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.005;
    return m;
  })();
  scene.add(contact);

  // low light, like the photo: a dim fill, a key from high behind-left that throws the shadows forward
  // (towards you, onto the bit of floor you see), and a soft front light that just catches the edges
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a847a, 0.35));
  const key = new THREE.DirectionalLight(0xfff4e6, 1.6);
  key.position.set(-3, 9, -5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 28;
  key.shadow.blurSamples = 24;
  key.shadow.mapSize.set(1024, 1024); // a coarser map blurs further and costs less
  key.shadow.bias = -0.0005;
  Object.assign(key.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 30 });
  scene.add(key);
  const front = new THREE.DirectionalLight(0xffffff, 0.45); front.position.set(2, 3, 8); scene.add(front);

  /* ----------------------------------------------------------------- TVs */
  const knobGeo = new THREE.CylinderGeometry(0.035, 0.04, 0.03, 24);
  const knobMat = new THREE.MeshPhysicalMaterial({ color: 0x111111, roughness: 0.35, metalness: 0.6, clearcoat: 1 });
  const tvs = [];
  const pickables = [];
  const placed = [];
  layout.forEach(([x, z0, size, slot, tint], i) => {
    const [w, h, d] = SIZES[size];
    const z = z0 - curve * x * x; // a curved wall of TVs, not a flat one
    // stack: rest on the highest TV underneath
    let base = 0;
    placed.forEach((p) => { if (Math.abs(p.x - x) < (p.w + w) * 0.42 && Math.abs(p.z - z) < (p.d + d) * 0.38) base = Math.max(base, p.top); });
    const y = base + h / 2;
    placed.push({ x, z, w, d, top: base + h });

    const group = new THREE.Group();
    group.position.set(x, y, z);
    // face the camera, give or take a few degrees
    const turn = Math.atan2(-x * (tall ? 0.3 : 0.8), CAM.dist - z) + THREE.MathUtils.degToRad(((i * 37) % 19) - 9);
    group.rotation.y = turn;
    const bodyDepth = d * 0.6;
    const body = new THREE.Mesh(new RoundedBoxGeometry(w, h, bodyDepth, 3, w * 0.05), metal[tint]);
    body.castShadow = true;
    body.receiveShadow = true;
    body.position.z = -bodyDepth / 2;
    // two knobs beside the screen (no separate front plate: the screen sits straight in the metal)
    const knobs = [0.26, 0.05].map((ky) => {
      const k = new THREE.Mesh(knobGeo, knobMat);
      k.rotation.x = Math.PI / 2;
      k.scale.setScalar(w);
      k.position.set(w * 0.39, h * ky, 0.012 * w);
      return k;
    });
    // the tube's back: a square frustum, narrower at the end
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.22, w * 0.5, d * 0.45, 4, 1), metal[tint]);
    tube.rotation.set(-Math.PI / 2, Math.PI / 4, 0);
    tube.scale.set(1, 1, h / w);
    tube.castShadow = true;
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
      map: { value: null }, uHas: { value: 0 }, uTime: { value: 0 }, uHover: { value: 0 }, uPower: { value: 1 },
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

    group.add(body, ...knobs, tube, screen);
    scene.add(group);
    const tv = { i, slot, group, screen, uniforms, type: s.type, project: s.index, home: group.position.clone(), drop: 0, facing: new THREE.Vector3(Math.sin(turn), 0, Math.cos(turn)), hover: 0, w, h };
    [body, screen].forEach((m) => { m.userData.tv = tv; pickables.push(m); });
    tvs.push(tv);

  });

  // the contact shadow covers the pile's footprint on the floor
  {
    const xs = placed.map((q) => [q.x - q.w / 2, q.x + q.w / 2]).flat(), zs = placed.map((q) => [q.z - q.d / 2, q.z + q.d / 2]).flat();
    const [x0, x1, z0, z1] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)];
    contact.position.set((x0 + x1) / 2, 0.005, (z0 + z1) / 2 + 0.3);
    contact.scale.set((x1 - x0) * 1.35, (z1 - z0) * 1.6, 1);
  }

  /* ------------------------------------------------------------- render */
  // the composer renders into its own buffer, which isn't anti-aliased by default: give it 4× MSAA,
  // so the edges of the TVs stay as clean as a plain render (cheap on a 30 fps cap)
  const buffer = new THREE.WebGLRenderTarget(1, 1, { samples: 4, type: THREE.HalfFloatType });
  const composer = new EffectComposer(renderer, buffer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new OutputPass());
  // ink: the picture as if it were printed. Edges wobble a hair like ink on paper, the blacks get a
  // little bleed, a coarse grain moves over it, and the corners fall away into black.
  const ink = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform float uTime; uniform vec2 uRes; varying vec2 vUv;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y); }
      void main() {
        vec2 px = 1.0 / uRes;
        // ink wobble: a slow, low displacement of a pixel or two
        vec2 w = vec2(noise(vUv * 90.0 + uTime * 0.05), noise(vUv * 90.0 - 7.3)) - 0.5;
        vec2 uv = vUv + w * px * 1.6;
        vec3 c = texture2D(tDiffuse, uv).rgb;
        // bleed: dark areas creep a little into the light around them
        vec3 n = min(min(texture2D(tDiffuse, uv + vec2(px.x, 0.0)).rgb, texture2D(tDiffuse, uv - vec2(px.x, 0.0)).rgb),
                     min(texture2D(tDiffuse, uv + vec2(0.0, px.y)).rgb, texture2D(tDiffuse, uv - vec2(0.0, px.y)).rgb));
        c = mix(c, n, 0.35);
        // a print's tone: slightly crushed blacks, a touch less saturation
        float l = dot(c, vec3(0.299, 0.587, 0.114));
        c = mix(vec3(l), c, 0.94);
        // grain (coarse, like a print), and a soft vignette
        float g = hash(floor(vUv * uRes / 1.5) + floor(uTime * 12.0)) - 0.5;
        c += g * 0.045;

        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  composer.addPass(ink);

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    ink.uniforms.uRes.value.set(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
    camera.aspect = w / h;
    // step back on narrow screens so the whole pile fits
    // far enough to fit the pile: its width (and for the tower, its height too)
    const half = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    camera.userData.dist = tall
      ? Math.max(6.9 / (2 * half), 3.9 / (2 * half * camera.aspect))
      : Math.max(CAM.dist, 12 / camera.aspect);
    // the fog follows the camera, so the pile never sinks into it
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
    pointerMoved = true;
  });
  canvas.addEventListener('pointerleave', () => { ndc.set(9, 9); pointerMoved = true; });
  // clicks and taps: find the TV right under the pointer (a tap has no hover before it)
  const pick = (e) => {
    const r = canvas.getBoundingClientRect();
    ray.setFromCamera({ x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 }, camera);
    const tv = (ray.intersectObjects(pickables, false)[0] || {}).object?.userData.tv;
    return tv && tv.type === 'project' ? tv : null;
  };
  canvas.addEventListener('click', (e) => {
    const tv = pick(e);
    if (matchMedia('(hover: none)').matches) forced = tv ? tv.slot : null; // keep the tapped TV lit
    onClick(tv ? { type: tv.type, index: tv.project, slot: tv.slot } : null);
  });

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
  let pointerMoved = false, lastPick = 0, lastFrame = 0;
  const frame = (now) => {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    // 30 frames a second is plenty for slow drift and static (and halves the work on laptops and phones)
    if (now - lastFrame < 31) return;
    lastFrame = now;
    const t = clock.getElapsedTime();
    // camera: a slow drift plus a little parallax with the pointer
    if (!reduce) {
      camX += ((Math.abs(mx) < 2 ? mx : 0) * 0.7 + Math.sin(t * 0.15) * 0.25 - camX) * 0.04;
      camY += ((Math.abs(my) < 2 ? my : 0) * 0.35 - camY) * 0.04;
    }
    const dist = camera.userData.dist || CAM.dist;
    camera.position.set((tall ? 0 : 0.3) + camX, cam.y + camY, dist);
    camera.lookAt(target);

    // which TV is under the pointer: only checked a few times a second, and only when the pointer moved
    if (forced === null) {
      if (pointerMoved && t - lastPick > 0.08) {
        pointerMoved = false;
        lastPick = t;
        ray.setFromCamera(ndc, camera);
        const hit = Math.abs(ndc.x) <= 1 ? ray.intersectObjects(pickables, false)[0] : null;
        const tv = hit && hit.object.userData.tv;
        setActive(tv && tv.type === 'project' ? tv : null); // only the project TVs react
      }
    } else setActive(bySlot(forced));

    tvs.forEach((tv) => {
      const on = tv === active ? 1 : 0;
      tv.hover += (on - tv.hover) * 0.15;
      const u = tv.uniforms;
      u.uTime.value = t;
      u.uHover.value = tv.hover;
      const base = tv.type === 'project' ? 1 : tv.type === 'text' ? 0.7 : 0.18; // the projects are the bright ones
      u.uDim.value += ((active && tv !== active ? base * 0.55 : base) - u.uDim.value) * 0.1;
    });
    ink.uniforms.uTime.value = t;
    composer.render();
  };

  const ready = Promise.resolve(); // the screens are on from the start
  requestAnimationFrame(frame);

  return {
    // highlight a TV by its slot from outside (e.g. the project list under the pile); null gives control back to the pointer
    setActive: (slot) => { forced = slot; },
    rectOf,
    ready,
  };
}
