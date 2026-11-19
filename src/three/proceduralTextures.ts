import * as THREE from 'three';

export interface PandaTextureSet {
  ivoryFurMap: THREE.CanvasTexture;
  blackFurMap: THREE.CanvasTexture;
  furBumpMap: THREE.CanvasTexture;
  bambooMap: THREE.CanvasTexture;
  groundMap: THREE.CanvasTexture;
  groundBumpMap: THREE.CanvasTexture;
  earthMap: THREE.CanvasTexture;
  contactShadowMap: THREE.CanvasTexture;
  particleMap: THREE.CanvasTexture;
  dispose: () => void;
}

function makeCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2D canvas context unavailable');
  }
  return [canvas, ctx];
}

function drawFurCanvas(
  baseRgb: [number, number, number],
  variance: number,
  size = 512,
): HTMLCanvasElement {
  const [canvas, ctx] = makeCanvas(size, size);
  ctx.fillStyle = `rgb(${baseRgb[0]}, ${baseRgb[1]}, ${baseRgb[2]})`;
  ctx.fillRect(0, 0, size, size);

  // Layered directional hair strokes for natural mammalian coat grain
  const strandCount = 9500;
  for (let i = 0; i < strandCount; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const len = 8 + Math.random() * 14;
    const drift = (Math.random() - 0.5) * 4;
    const delta = (Math.random() - 0.5) * variance;
    const r = Math.max(0, Math.min(255, Math.round(baseRgb[0] + delta)));
    const g = Math.max(0, Math.min(255, Math.round(baseRgb[1] + delta * 0.96)));
    const b = Math.max(0, Math.min(255, Math.round(baseRgb[2] + delta * 0.88)));

    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.55)`;
    ctx.lineWidth = 1 + Math.random() * 1.3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + drift, y + len);
    ctx.stroke();
  }
  return canvas;
}

function drawFurBumpCanvas(size = 512): HTMLCanvasElement {
  const [canvas, ctx] = makeCanvas(size, size);
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 8500; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const len = 7 + Math.random() * 13;
    const v = Math.round(85 + Math.random() * 140);
    ctx.strokeStyle = `rgba(${v}, ${v}, ${v}, 0.45)`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 3, y + len);
    ctx.stroke();
  }
  return canvas;
}

function drawBambooCanvas(size = 512): HTMLCanvasElement {
  const [canvas, ctx] = makeCanvas(size, size);
  const grad = ctx.createLinearGradient(0, 0, size, 0);
  grad.addColorStop(0, '#4d7a42');
  grad.addColorStop(0.35, '#79a86b');
  grad.addColorStop(0.65, '#649257');
  grad.addColorStop(1, '#48733d');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Fine vertical culm fibers
  for (let i = 0; i < 650; i++) {
    const x = Math.random() * size;
    const alpha = 0.06 + Math.random() * 0.14;
    ctx.strokeStyle = Math.random() > 0.5 ? `rgba(218, 236, 195, ${alpha})` : `rgba(24, 52, 28, ${alpha})`;
    ctx.lineWidth = 1 + Math.random() * 1.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }

  // Horizontal bamboo nodal rings
  const nodes = [0.22, 0.52, 0.82];
  for (const ny of nodes) {
    const y = ny * size;
    ctx.fillStyle = 'rgba(26, 48, 26, 0.72)';
    ctx.fillRect(0, y - 5, size, 8);
    ctx.fillStyle = 'rgba(205, 224, 178, 0.55)';
    ctx.fillRect(0, y + 3, size, 4);
  }
  return canvas;
}

function drawGroundCanvas(size = 512): [HTMLCanvasElement, HTMLCanvasElement] {
  const [colorCanvas, ctx] = makeCanvas(size, size);
  const [bumpCanvas, bCtx] = makeCanvas(size, size);

  ctx.fillStyle = '#1b3123';
  ctx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#777777';
  bCtx.fillRect(0, 0, size, size);

  for (let i = 0; i < 4200; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 2 + Math.random() * 11;
    const moss = Math.random() > 0.42;
    ctx.fillStyle = moss
      ? `rgba(${34 + Math.random() * 36}, ${66 + Math.random() * 44}, ${38 + Math.random() * 24}, 0.35)`
      : `rgba(${52 + Math.random() * 26}, ${44 + Math.random() * 20}, ${32 + Math.random() * 15}, 0.35)`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    const bv = Math.round(90 + Math.random() * 110);
    bCtx.fillStyle = `rgba(${bv},${bv},${bv},0.3)`;
    bCtx.beginPath();
    bCtx.arc(x, y, r * 0.8, 0, Math.PI * 2);
    bCtx.fill();
  }

  // Fallen bamboo leaf flecks
  for (let i = 0; i < 450; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const angle = Math.random() * Math.PI * 2;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = Math.random() > 0.3 ? 'rgba(130, 152, 92, 0.42)' : 'rgba(176, 154, 102, 0.36)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 6, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  return [colorCanvas, bumpCanvas];
}

function drawEarthCanvas(): HTMLCanvasElement {
  const w = 1024;
  const h = 512;
  const [canvas, ctx] = makeCanvas(w, h);

  // Deep museum ocean gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
  oceanGrad.addColorStop(0, '#18322c');
  oceanGrad.addColorStop(0.5, '#0d2224');
  oceanGrad.addColorStop(1, '#18322c');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, w, h);

  // Subtle lat/lon cartographic graticule
  ctx.strokeStyle = 'rgba(201, 166, 107, 0.14)';
  ctx.lineWidth = 1;
  for (let lon = -150; lon <= 150; lon += 30) {
    const x = ((lon + 180) / 360) * w;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const y = ((90 - lat) / 180) * h;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  const toXY = (lon: number, lat: number): [number, number] => [
    ((lon + 180) / 360) * w,
    ((90 - lat) / 180) * h,
  ];

  const drawPolygon = (pts: [number, number][], fill: string, stroke = 'rgba(242,239,230,0.22)') => {
    ctx.beginPath();
    pts.forEach(([lon, lat], idx) => {
      const [x, y] = toXY(lon, lat);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  };

  // North America
  drawPolygon(
    [
      [-168, 66], [-140, 70], [-100, 72], [-76, 62], [-54, 52], [-66, 44],
      [-78, 34], [-82, 25], [-96, 20], [-88, 14], [-80, 9], [-92, 14],
      [-106, 20], [-116, 32], [-125, 42], [-136, 56], [-162, 58],
    ],
    '#2f523a',
  );

  // South America
  drawPolygon(
    [
      [-78, 10], [-62, 10], [-50, 1], [-35, -6], [-40, -22], [-54, -34],
      [-66, -48], [-70, -55], [-75, -44], [-72, -20], [-81, -5],
    ],
    '#34593e',
  );

  // Europe
  drawPolygon(
    [
      [-10, 36], [-9, 43], [-4, 48], [6, 54], [12, 58], [22, 68], [42, 68],
      [60, 62], [58, 50], [40, 44], [28, 41], [16, 40], [10, 44], [3, 42], [-5, 36],
    ],
    '#365a41',
  );

  // Africa
  drawPolygon(
    [
      [-17, 15], [-6, 35], [10, 37], [32, 31], [43, 12], [51, 12], [41, -2],
      [35, -24], [20, -35], [15, -25], [12, -6], [8, 4], [-8, 5], [-17, 14],
    ],
    '#3c5d3d',
  );

  // Asia (including East Asia & Tibetan Plateau)
  drawPolygon(
    [
      [42, 42], [58, 50], [60, 68], [105, 75], [145, 70], [176, 66], [160, 56],
      [142, 52], [132, 42], [128, 35], [121, 31], [116, 22], [108, 16], [103, 2],
      [98, 16], [90, 22], [78, 8], [68, 24], [56, 26], [46, 30], [36, 36],
    ],
    '#375d42',
  );

  // China Highlight Region (Warm Bamboo-Gold Cartographic Accent)
  drawPolygon(
    [
      [75, 39], [88, 48], [105, 44], [122, 52], [134, 48], [125, 40], [122, 31],
      [118, 24], [108, 21], [98, 22], [90, 28], [80, 31],
    ],
    '#6d9b60',
    'rgba(201, 166, 107, 0.78)',
  );

  // Sichuan-Shaanxi-Gansu Panda Sanctuary Glow
  const [px, py] = toXY(104.5, 32);
  const rad = ctx.createRadialGradient(px, py, 2, px, py, 26);
  rad.addColorStop(0, 'rgba(201, 166, 107, 0.95)');
  rad.addColorStop(0.5, 'rgba(201, 166, 107, 0.35)');
  rad.addColorStop(1, 'rgba(201, 166, 107, 0)');
  ctx.fillStyle = rad;
  ctx.beginPath();
  ctx.arc(px, py, 26, 0, Math.PI * 2);
  ctx.fill();

  // Japan
  drawPolygon(
    [
      [130, 31], [136, 34], [141, 38], [145, 44], [140, 41], [133, 35],
    ],
    '#4a7052',
  );

  // UK
  drawPolygon(
    [
      [-6, 50], [1, 51], [0, 58], [-6, 57],
    ],
    '#4a7052',
  );

  // Australia
  drawPolygon(
    [
      [114, -22], [128, -14], [142, -11], [153, -26], [148, -38], [135, -34], [116, -34],
    ],
    '#426342',
  );

  return canvas;
}

function drawContactShadowCanvas(size = 256): HTMLCanvasElement {
  const [canvas, ctx] = makeCanvas(size, size);
  const grad = ctx.createRadialGradient(size / 2, size / 2, size * 0.06, size / 2, size / 2, size * 0.48);
  grad.addColorStop(0, 'rgba(5, 10, 7, 0.65)');
  grad.addColorStop(0.55, 'rgba(5, 10, 7, 0.25)');
  grad.addColorStop(1, 'rgba(5, 10, 7, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

function drawParticleCanvas(size = 128): HTMLCanvasElement {
  const [canvas, ctx] = makeCanvas(size, size);
  const grad = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(242, 239, 230, 0.9)');
  grad.addColorStop(0.4, 'rgba(201, 166, 107, 0.35)');
  grad.addColorStop(1, 'rgba(242, 239, 230, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

export function createPandaTextureSet(maxAnisotropy: number): PandaTextureSet {
  const ivoryCanvas = drawFurCanvas([241, 236, 224], 26, 512);
  const blackCanvas = drawFurCanvas([26, 28, 30], 22, 512);
  const furBumpCanvas = drawFurBumpCanvas(512);
  const bambooCanvas = drawBambooCanvas(512);
  const [groundColorCanvas, groundBumpCanvas] = drawGroundCanvas(512);
  const earthCanvas = drawEarthCanvas();
  const shadowCanvas = drawContactShadowCanvas(256);
  const particleCanvas = drawParticleCanvas(128);

  const configureColorTex = (canvas: HTMLCanvasElement, repeatX = 1, repeatY = 1): THREE.CanvasTexture => {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
    tex.anisotropy = maxAnisotropy;
    tex.needsUpdate = true;
    return tex;
  };

  const configureDataTex = (canvas: HTMLCanvasElement, repeatX = 1, repeatY = 1): THREE.CanvasTexture => {
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
    tex.anisotropy = maxAnisotropy;
    tex.needsUpdate = true;
    return tex;
  };

  const ivoryFurMap = configureColorTex(ivoryCanvas, 2, 2);
  const blackFurMap = configureColorTex(blackCanvas, 2, 2);
  const furBumpMap = configureDataTex(furBumpCanvas, 2, 2);
  const bambooMap = configureColorTex(bambooCanvas, 1, 2);
  const groundMap = configureColorTex(groundColorCanvas, 24, 24);
  const groundBumpMap = configureDataTex(groundBumpCanvas, 24, 24);
  const earthMap = configureColorTex(earthCanvas, 1, 1);
  earthMap.wrapS = THREE.ClampToEdgeWrapping;
  earthMap.wrapT = THREE.ClampToEdgeWrapping;

  const contactShadowMap = configureColorTex(shadowCanvas, 1, 1);
  contactShadowMap.wrapS = THREE.ClampToEdgeWrapping;
  contactShadowMap.wrapT = THREE.ClampToEdgeWrapping;

  const particleMap = configureColorTex(particleCanvas, 1, 1);
  particleMap.wrapS = THREE.ClampToEdgeWrapping;
  particleMap.wrapT = THREE.ClampToEdgeWrapping;

  return {
    ivoryFurMap,
    blackFurMap,
    furBumpMap,
    bambooMap,
    groundMap,
    groundBumpMap,
    earthMap,
    contactShadowMap,
    particleMap,
    dispose: () => {
      ivoryFurMap.dispose();
      blackFurMap.dispose();
      furBumpMap.dispose();
      bambooMap.dispose();
      groundMap.dispose();
      groundBumpMap.dispose();
      earthMap.dispose();
      contactShadowMap.dispose();
      particleMap.dispose();
    },
  };
}
