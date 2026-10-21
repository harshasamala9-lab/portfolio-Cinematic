import * as THREE from '../vendor/three.module.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')));
  } catch {
    return false;
  }
}

function makeEnvironmentTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const base = ctx.createLinearGradient(0, 0, 0, canvas.height);
  base.addColorStop(0, '#050404');
  base.addColorStop(0.42, '#120c0c');
  base.addColorStop(0.62, '#080606');
  base.addColorStop(1, '#020202');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.globalCompositeOperation = 'lighter';
  const warm = ctx.createRadialGradient(760, 150, 0, 760, 150, 230);
  warm.addColorStop(0, 'rgba(255, 232, 216, 0.85)');
  warm.addColorStop(0.16, 'rgba(238, 195, 177, 0.35)');
  warm.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = warm;
  ctx.fillRect(470, 0, 560, 430);

  const red = ctx.createRadialGradient(220, 330, 0, 220, 330, 300);
  red.addColorStop(0, 'rgba(206, 24, 39, 0.55)');
  red.addColorStop(0.35, 'rgba(114, 9, 18, 0.22)');
  red.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = red;
  ctx.fillRect(0, 80, 620, 432);

  const cool = ctx.createRadialGradient(500, 470, 0, 500, 470, 300);
  cool.addColorStop(0, 'rgba(154, 137, 126, 0.22)');
  cool.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = cool;
  ctx.fillRect(180, 220, 680, 292);

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeParticleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const glow = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  glow.addColorStop(0, 'rgba(255, 244, 234, 1)');
  glow.addColorStop(0.22, 'rgba(255, 205, 190, 0.8)');
  glow.addColorStop(0.55, 'rgba(234, 88, 80, 0.22)');
  glow.addColorStop(1, 'rgba(234, 52, 60, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const glow = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
  glow.addColorStop(0, 'rgba(255, 130, 115, 0.42)');
  glow.addColorStop(0.18, 'rgba(214, 38, 48, 0.24)');
  glow.addColorStop(0.52, 'rgba(135, 12, 21, 0.1)');
  glow.addColorStop(1, 'rgba(80, 0, 8, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 512, 512);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  return renderer;
}

function addParticles(scene, count, radius, particleTexture) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color();

  for (let i = 0; i < count; i += 1) {
    const r = radius[0] + Math.random() * (radius[1] - radius[0]);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
    positions[i * 3 + 1] = Math.cos(phi) * r * 0.82;
    positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * r;
    color.set(Math.random() > 0.78 ? 0xc11c29 : 0xe9d8cd);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.065,
    map: particleTexture,
    transparent: true,
    opacity: 0.55,
    alphaTest: 0.01,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    sizeAttenuation: true
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);
  return points;
}

async function initHeroScene(canvas) {
  const hero = canvas.closest('.hero');
  if (!hero) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 10.6);
  const renderer = createRenderer(canvas);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 800 ? 1.5 : 1.8));
  scene.environment = makeEnvironmentTexture();

  const particleTexture = makeParticleTexture();
  const group = new THREE.Group();
  scene.add(group);

  const knotGeometry = new THREE.TorusKnotGeometry(1.48, 0.39, 256, 36, 2, 3);
  const knotMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x1a1111,
    metalness: 1,
    roughness: 0.26,
    clearcoat: 1,
    clearcoatRoughness: 0.16,
    envMapIntensity: 1.35
  });
  const knot = new THREE.Mesh(knotGeometry, knotMaterial);
  knot.rotation.set(0.24, -0.2, -0.16);
  group.add(knot);

  const wire = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.5, 0.4, 180, 20, 2, 3),
    new THREE.MeshBasicMaterial({
      color: 0xc31b27,
      wireframe: true,
      transparent: true,
      opacity: 0.045,
      depthWrite: false
    })
  );
  wire.rotation.copy(knot.rotation);
  group.add(wire);

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.55, 3),
    new THREE.MeshStandardMaterial({
      color: 0x2b090c,
      emissive: 0x8e0b15,
      emissiveIntensity: 1.5,
      roughness: 0.3,
      metalness: 0.55
    })
  );
  core.position.z = 0.25;
  group.add(core);

  const rings = new THREE.Group();
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xd92d38,
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const ringA = new THREE.Mesh(new THREE.RingGeometry(2.35, 2.357, 220), ringMaterial);
  ringA.rotation.x = Math.PI / 2.35;
  ringA.rotation.y = 0.4;
  const ringB = new THREE.Mesh(new THREE.RingGeometry(2.82, 2.824, 220), ringMaterial);
  ringB.rotation.x = Math.PI / 2.7;
  ringB.rotation.y = -0.5;
  ringB.material = ringMaterial.clone();
  ringB.material.opacity = 0.12;
  rings.add(ringA, ringB);
  group.add(rings);

  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture(),
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
  glow.scale.set(9.5, 9.5, 1);
  glow.position.z = -1.8;
  scene.add(glow);

  const ambient = new THREE.AmbientLight(0x2a1718, 1.4);
  const keyLight = new THREE.DirectionalLight(0xffdfd2, 3.4);
  keyLight.position.set(4.5, 6, 6);
  const redLight = new THREE.PointLight(0xe01b2a, 90, 22, 2);
  redLight.position.set(-4.5, -1.5, 4);
  const rimLight = new THREE.PointLight(0xff4a4f, 55, 20, 2);
  rimLight.position.set(3.5, 3, -4);
  scene.add(ambient, keyLight, redLight, rimLight);

  const particles = addParticles(scene, window.innerWidth < 800 ? 280 : 720, [3.1, 8.5], particleTexture);
  particles.position.z = -1.5;

  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const base = { x: 0, y: 0, scale: 1, rotX: -0.06 };
  let visible = true;
  let running = false;
  let lastFrame = 0;
  let elapsed = 0;

  function layout() {
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    const narrow = width < 860;
    const aspect = width / height;
    base.x = narrow ? (aspect < 0.65 ? 0.65 : 1.1) : Math.min(3.25, 1.8 + aspect * 0.7);
    base.y = narrow ? 1.15 : 0.08;
    base.scale = narrow ? 0.76 : Math.min(1.08, 0.82 + aspect * 0.11);
    base.rotX = narrow ? -0.08 : -0.04;
    group.scale.setScalar(base.scale);
    group.position.set(base.x, base.y, 0);
  }

  function getScrollProgress() {
    const rect = hero.getBoundingClientRect();
    return Math.min(1, Math.max(0, -rect.top / Math.max(rect.height, 1)));
  }

  function renderFrame(now) {
    if (!visible || document.hidden) {
      running = false;
      lastFrame = 0;
      return;
    }

    if (!lastFrame) lastFrame = now;
    elapsed += Math.min((now - lastFrame) / 1000, 0.05);
    lastFrame = now;

    pointer.x += (pointer.targetX - pointer.x) * 0.035;
    pointer.y += (pointer.targetY - pointer.y) * 0.035;

    const t = elapsed;
    const progress = getScrollProgress();

    group.rotation.y = 0.05 + Math.sin(t * 0.15) * 0.13 + pointer.x * 0.2;
    group.rotation.x = base.rotX + pointer.y * 0.1 + Math.sin(t * 0.24) * 0.03;
    group.rotation.z = progress * 0.1;
    group.position.x = base.x + pointer.x * 0.16;
    group.position.y = base.y + progress * 0.75 + Math.sin(t * 0.35) * 0.035;
    knot.rotation.z = t * 0.045;
    core.rotation.y = -t * 0.28;
    core.rotation.x = t * 0.16;
    const pulse = 1 + Math.sin(t * 0.9) * 0.04;
    core.scale.setScalar(pulse);
    rings.rotation.z = t * 0.025;
    rings.rotation.x = Math.sin(t * 0.12) * 0.04;
    particles.rotation.y = t * 0.012;
    particles.rotation.z = t * 0.004;
    glow.material.opacity = 0.48 + Math.sin(t * 0.55) * 0.06;
    camera.position.x = pointer.x * 0.22;
    camera.position.y = pointer.y * 0.12;

    renderer.render(scene, camera);
    requestAnimationFrame(renderFrame);
  }

  function start() {
    if (running) return;
    running = true;
    lastFrame = 0;
    requestAnimationFrame(renderFrame);
  }

  window.addEventListener('pointermove', (event) => {
    pointer.targetX = (event.clientX / window.innerWidth - 0.5) * 2;
    pointer.targetY = (event.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  const observer = new IntersectionObserver((entries) => {
    visible = entries[0]?.isIntersecting ?? false;
    if (visible) start();
  }, { threshold: 0.01 });

  observer.observe(hero);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && visible) start();
  });
  window.addEventListener('resize', layout, { passive: true });

  layout();
  renderer.render(scene, camera);
  start();
  document.body.classList.add('webgl-ready');
}

function drawPanelBase(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(11, 9, 9, 0.94)';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = 'rgba(242, 237, 230, 0.16)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);
}

function drawPanelBar(ctx, width, title, accent = false) {
  const barHeight = 66;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.018)';
  ctx.fillRect(0, 0, width, barHeight);
  ctx.strokeStyle = 'rgba(242, 237, 230, 0.11)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, barHeight);
  ctx.lineTo(width, barHeight);
  ctx.stroke();

  const dots = accent ? ['#c61a26', '#62403d', '#62403d'] : ['#b51622', '#5b3b39', '#5b3b39'];
  dots.forEach((color, index) => {
    ctx.beginPath();
    ctx.arc(34 + index * 23, 33, 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });

  ctx.fillStyle = 'rgba(202, 190, 181, 0.64)';
  ctx.font = '500 20px "JetBrains Mono", monospace';
  ctx.fillText(title, 118, 41);

  ctx.fillStyle = 'rgba(166, 150, 140, 0.52)';
  ctx.font = '400 19px "JetBrains Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText('—   □   ×', width - 32, 40);
  ctx.textAlign = 'left';
}

function createEditorPanel() {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 780;
  const ctx = canvas.getContext('2d');
  drawPanelBase(ctx, canvas.width, canvas.height);
  drawPanelBar(ctx, canvas.width, 'workspace / ideas.js', true);

  const code = [
    { n: '01', runs: [['// build a way forward', '#675a52']] },
    { n: '02', runs: [['', '#8b7d74']] },
    { n: '03', runs: [['const ', '#d9a59d'], ['developer', '#e1d7ce'], [' = {', '#8b7d74']] },
    { n: '04', runs: [['  name', '#cfc3b8'], [': ', '#8b7d74'], ["'SriHarsha'", '#cbb29e'], [',', '#8b7d74']] },
    { n: '05', runs: [['  focus', '#cfc3b8'], [': [', '#8b7d74'], ["'web'", '#cbb29e'], [', ', '#8b7d74'], ["'ai'", '#cbb29e'], ['],', '#8b7d74']] },
    { n: '06', runs: [['  approach', '#cfc3b8'], [': ', '#8b7d74'], ["'keep building'", '#cbb29e'], [',', '#8b7d74']] },
    { n: '07', runs: [['};', '#8b7d74']] },
    { n: '08', runs: [['', '#8b7d74']] },
    { n: '09', runs: [['while ', '#d9a59d'], ['(!', '#8b7d74'], ['understood', '#e1d7ce'], [') {', '#8b7d74']] },
    { n: '10', runs: [['  learn', '#e1d7ce'], ['(); ', '#8b7d74'], ['experiment', '#e1d7ce'], ['();', '#8b7d74']] },
    { n: '11', runs: [['  understanding ', '#e1d7ce'], ['= ', '#8b7d74'], ['reflect', '#e1d7ce'], ['();', '#8b7d74']] },
    { n: '12', runs: [['}', '#8b7d74']] }
  ];

  const startY = 132;
  const lineHeight = 43;
  ctx.font = '400 24px "JetBrains Mono", monospace';
  code.forEach((line, index) => {
    const y = startY + index * lineHeight;
    ctx.fillStyle = 'rgba(132, 118, 108, 0.46)';
    ctx.font = '400 19px "JetBrains Mono", monospace';
    ctx.fillText(line.n, 40, y);
    let x = 98;
    ctx.font = '400 24px "JetBrains Mono", monospace';
    line.runs.forEach(([text, color]) => {
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
      x += ctx.measureText(text).width;
    });
  });

  ctx.fillStyle = '#d51f2b';
  ctx.fillRect(98, startY + 11 * lineHeight - 22, 3, 28);

  ctx.strokeStyle = 'rgba(242, 237, 230, 0.08)';
  ctx.beginPath();
  ctx.moveTo(0, 704);
  ctx.lineTo(canvas.width, 704);
  ctx.stroke();
  ctx.font = '400 17px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(166, 149, 138, 0.45)';
  ctx.fillText('Ln 12, Col 2', 36, 740);
  ctx.textAlign = 'right';
  ctx.fillText('JavaScript   ·   UTF-8   ·   LF', canvas.width - 36, 740);
  ctx.textAlign = 'left';

  ctx.strokeStyle = 'rgba(197, 24, 37, 0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 66);
  ctx.lineTo(112, 66);
  ctx.stroke();

  return canvas;
}

function createTerminalPanel() {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 540;
  const ctx = canvas.getContext('2d');
  drawPanelBase(ctx, canvas.width, canvas.height);
  drawPanelBar(ctx, canvas.width, 'workspace / terminal');

  const lines = [
    { prompt: '$', text: 'npm run build', color: '#d8ccc2' },
    { text: '', color: '#8b7d74' },
    { text: '> compiling interface...', color: '#87776d' },
    { text: '> resolving ideas...', color: '#87776d' },
    { text: '> connecting the pieces...', color: '#87776d' },
    { text: '', color: '#8b7d74' },
    { prompt: '✓', text: 'ready to iterate', color: '#d9a59d' }
  ];

  ctx.font = '400 21px "JetBrains Mono", monospace';
  lines.forEach((line, index) => {
    const y = 142 + index * 43;
    let x = 44;
    if (line.prompt) {
      ctx.fillStyle = line.prompt === '✓' ? '#d42a35' : 'rgba(217, 165, 157, 0.8)';
      ctx.fillText(line.prompt, x, y);
      x += 34;
    }
    ctx.fillStyle = line.color;
    ctx.fillText(line.text, x, y);
  });

  ctx.fillStyle = '#cf2631';
  ctx.fillRect(320, 438, 11, 23);
  ctx.strokeStyle = 'rgba(242, 237, 230, 0.08)';
  ctx.beginPath();
  ctx.moveTo(0, 476);
  ctx.lineTo(canvas.width, 476);
  ctx.stroke();
  ctx.font = '400 16px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(166, 149, 138, 0.42)';
  ctx.fillText('zsh  ·  ~/workspace', 34, 510);
  ctx.textAlign = 'right';
  ctx.fillText('build / 0 errors', canvas.width - 34, 510);
  ctx.textAlign = 'left';

  return canvas;
}

function createFocusPanel() {
  const canvas = document.createElement('canvas');
  canvas.width = 760;
  canvas.height = 520;
  const ctx = canvas.getContext('2d');
  drawPanelBase(ctx, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(198, 26, 38, 0.9)';
  ctx.fillRect(40, 50, 52, 2);
  ctx.font = '400 17px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(199, 151, 143, 0.78)';
  ctx.fillText('CURRENT FOCUS', 40, 92);

  const rows = [
    ['01', 'LEARN', 'Web platforms'],
    ['02', 'EXPLORE', 'Local AI'],
    ['03', 'CONNECT', 'APIs & ideas']
  ];

  rows.forEach((row, index) => {
    const y = 172 + index * 102;
    ctx.font = '400 16px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(207, 54, 64, 0.75)';
    ctx.fillText(row[0], 42, y);
    ctx.font = '500 22px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(222, 211, 202, 0.88)';
    ctx.fillText(row[1], 92, y);
    ctx.font = '300 18px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(159, 143, 133, 0.58)';
    ctx.fillText(row[2], 92, y + 30);
    ctx.strokeStyle = 'rgba(242, 237, 230, 0.08)';
    ctx.beginPath();
    ctx.moveTo(40, y + 48);
    ctx.lineTo(canvas.width - 40, y + 48);
    ctx.stroke();
  });

  ctx.fillStyle = 'rgba(166, 149, 138, 0.4)';
  ctx.font = '400 15px "JetBrains Mono", monospace';
  ctx.fillText('STATUS / IN PROGRESS', 40, 486);

  return canvas;
}

function makePanel(canvasSource, width, height, renderer) {
  const texture = new THREE.CanvasTexture(canvasSource);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    toneMapped: false
  });
  const geometry = new THREE.PlaneGeometry(width, height);
  const mesh = new THREE.Mesh(geometry, material);
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({
      color: 0xb61622,
      transparent: true,
      opacity: 0.2,
      depthWrite: false
    })
  );
  mesh.add(edges);
  return mesh;
}

async function initAboutScene(canvas) {
  const frame = canvas.closest('.visual-frame');
  if (!frame) return;

  await document.fonts.ready;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 100);
  camera.position.set(0, 0, 11);
  const renderer = createRenderer(canvas);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  renderer.toneMappingExposure = 1.05;

  const group = new THREE.Group();
  group.rotation.y = -0.13;
  group.rotation.x = 0.03;
  scene.add(group);

  const mainPanel = makePanel(createEditorPanel(), 4.5, 2.93, renderer);
  mainPanel.position.set(-0.4, 0.45, 0);
  group.add(mainPanel);

  const terminalPanel = makePanel(createTerminalPanel(), 3.1, 1.86, renderer);
  terminalPanel.position.set(1.65, -1.38, 0.85);
  terminalPanel.rotation.y = -0.22;
  group.add(terminalPanel);

  const focusPanel = makePanel(createFocusPanel(), 2.45, 1.68, renderer);
  focusPanel.position.set(-2.05, -1.52, 1.05);
  focusPanel.rotation.y = 0.2;
  group.add(focusPanel);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.72, 0.006, 4, 180),
    new THREE.MeshBasicMaterial({
      color: 0xd12632,
      transparent: true,
      opacity: 0.18,
      depthWrite: false
    })
  );
  ring.position.set(0, -0.2, -0.7);
  ring.rotation.x = 0.98;
  group.add(ring);

  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture(),
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
  glow.scale.set(7.4, 7.4, 1);
  glow.position.set(0.2, -0.2, -1.5);
  scene.add(glow);

  const particleTexture = makeParticleTexture();
  const dust = addParticles(scene, 150, [2.6, 5.2], particleTexture);
  dust.position.z = 0.3;
  dust.material.size = 0.04;
  dust.material.opacity = 0.4;

  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let visible = true;
  let running = false;
  let lastFrame = 0;
  let elapsed = 0;

  function layout() {
    const width = canvas.clientWidth || 600;
    const height = canvas.clientHeight || 600;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const aspect = width / height;
    const scale = aspect < 0.82 ? 0.78 : 0.9;
    group.scale.setScalar(scale);
    group.position.y = aspect < 0.82 ? 0.08 : 0;
  }

  function renderFrame(now) {
    if (!visible || document.hidden) {
      running = false;
      lastFrame = 0;
      return;
    }

    if (!lastFrame) lastFrame = now;
    elapsed += Math.min((now - lastFrame) / 1000, 0.05);
    lastFrame = now;

    pointer.x += (pointer.targetX - pointer.x) * 0.045;
    pointer.y += (pointer.targetY - pointer.y) * 0.045;
    const t = elapsed;

    group.rotation.y = -0.13 + pointer.x * 0.1 + Math.sin(t * 0.16) * 0.025;
    group.rotation.x = 0.03 + pointer.y * 0.055;
    group.position.x = pointer.x * 0.08;

    mainPanel.position.y = 0.45 + Math.sin(t * 0.55) * 0.035;
    terminalPanel.position.y = -1.38 + Math.sin(t * 0.72 + 1.2) * 0.045;
    focusPanel.position.y = -1.52 + Math.sin(t * 0.63 + 2.1) * 0.04;
    terminalPanel.rotation.y = -0.22 + pointer.x * 0.025;
    focusPanel.rotation.y = 0.2 + pointer.x * 0.02;
    ring.rotation.z = t * 0.04;
    dust.rotation.y = t * 0.02;
    glow.material.opacity = 0.26 + Math.sin(t * 0.6) * 0.04;

    renderer.render(scene, camera);
    requestAnimationFrame(renderFrame);
  }

  function start() {
    if (running) return;
    running = true;
    lastFrame = 0;
    requestAnimationFrame(renderFrame);
  }

  frame.addEventListener('pointermove', (event) => {
    const rect = frame.getBoundingClientRect();
    pointer.targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    pointer.targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  }, { passive: true });

  frame.addEventListener('pointerleave', () => {
    pointer.targetX = 0;
    pointer.targetY = 0;
  }, { passive: true });

  const observer = new IntersectionObserver((entries) => {
    visible = entries[0]?.isIntersecting ?? false;
    if (visible) start();
  }, { threshold: 0.01 });

  observer.observe(frame);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && visible) start();
  });
  window.addEventListener('resize', layout, { passive: true });

  layout();
  renderer.render(scene, camera);
  start();
  document.body.classList.add('about-webgl-ready');
}

export async function initScenes() {
  if (reducedMotion || !supportsWebGL()) return;

  const heroCanvas = document.getElementById('hero-canvas');
  const aboutCanvas = document.getElementById('about-canvas');

  if (heroCanvas) {
    try {
      await initHeroScene(heroCanvas);
    } catch (error) {
      console.warn('Hero scene unavailable; using static fallback.');
    }
  }

  if (aboutCanvas) {
    const initAbout = () => {
      initAboutScene(aboutCanvas).catch(() => {
        console.warn('Workspace scene unavailable; using static fallback.');
      });
    };
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(initAbout, { timeout: 1800 });
    } else {
      window.setTimeout(initAbout, 500);
    }
  }
}
