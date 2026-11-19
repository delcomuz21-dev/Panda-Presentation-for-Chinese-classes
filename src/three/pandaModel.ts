import * as THREE from 'three';
import type { PandaTextureSet } from './proceduralTextures';

export type PandaBehaviorMode = 'idle' | 'eating' | 'resting' | 'climbing' | 'roaming' | 'waving';

export interface PandaRig {
  root: THREE.Group;
  bodyPivot: THREE.Group;
  headPivot: THREE.Group;
  jawPivot: THREE.Group;
  leftEar: THREE.Mesh;
  rightEar: THREE.Mesh;
  leftArmPivot: THREE.Group;
  rightArmPivot: THREE.Group;
  leftLegPivot: THREE.Group;
  rightLegPivot: THREE.Group;
  pseudoThumbMesh: THREE.Mesh;
  bambooSnack: THREE.Group;
  contactShadow: THREE.Mesh;
  dispose: () => void;
}

export function createGiantPandaRig(textures: PandaTextureSet): PandaRig {
  const root = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };

  // Physically-based fur and anatomical materials
  const ivoryFurMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.ivoryFurMap,
      bumpMap: textures.furBumpMap,
      bumpScale: 0.018,
      roughness: 0.88,
      metalness: 0.0,
    }),
  );

  const blackFurMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.blackFurMap,
      bumpMap: textures.furBumpMap,
      bumpScale: 0.02,
      roughness: 0.84,
      metalness: 0.02,
    }),
  );

  const eyePatchMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x16181a,
      bumpMap: textures.furBumpMap,
      bumpScale: 0.012,
      roughness: 0.82,
      metalness: 0.02,
    }),
  );

  const noseMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0x181818,
      roughness: 0.28,
      metalness: 0.04,
      clearcoat: 0.45,
      clearcoatRoughness: 0.3,
    }),
  );

  const eyeGlossMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0x1c140e,
      roughness: 0.08,
      metalness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
    }),
  );

  const eyeHighlightMat = trackMat(
    new THREE.MeshBasicMaterial({ color: 0xf6f3ea }),
  );

  const pawPadMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x2a2524,
      roughness: 0.72,
      metalness: 0.0,
    }),
  );

  const clawMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xd8cfbe,
      roughness: 0.42,
      metalness: 0.05,
    }),
  );

  const pseudoThumbMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x3b3532,
      emissive: 0x000000,
      roughness: 0.58,
      metalness: 0.04,
    }),
  );

  // Soft grounded contact shadow disc
  const shadowGeo = trackGeo(new THREE.CircleGeometry(1.18, 32));
  const shadowMat = trackMat(
    new THREE.MeshBasicMaterial({
      map: textures.contactShadowMap,
      transparent: true,
      depthWrite: false,
      opacity: 0.52,
    }),
  );
  const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.015;
  root.add(contactShadow);

  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  // 1. Sculpted Lathe Torso (heavy bear hindquarters tapering slightly toward shoulders)
  const torsoProfile = [
    new THREE.Vector2(0.0, -0.58),
    new THREE.Vector2(0.46, -0.52),
    new THREE.Vector2(0.68, -0.25),
    new THREE.Vector2(0.72, 0.06),
    new THREE.Vector2(0.64, 0.36),
    new THREE.Vector2(0.52, 0.62),
    new THREE.Vector2(0.32, 0.78),
    new THREE.Vector2(0.0, 0.84),
  ];
  const torsoGeo = trackGeo(new THREE.LatheGeometry(torsoProfile, 28));
  const torsoMesh = new THREE.Mesh(torsoGeo, ivoryFurMat);
  torsoMesh.position.set(0, 0.92, -0.05);
  torsoMesh.scale.set(1.06, 1.0, 0.98);
  torsoMesh.rotation.x = 0.14;
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  bodyPivot.add(torsoMesh);

  // Lower pelvis / seated fullness
  const rumpGeo = trackGeo(new THREE.SphereGeometry(0.62, 24, 20));
  const rumpMesh = new THREE.Mesh(rumpGeo, ivoryFurMat);
  rumpMesh.position.set(0, 0.58, -0.18);
  rumpMesh.scale.set(1.1, 0.85, 1.05);
  rumpMesh.castShadow = true;
  rumpMesh.receiveShadow = true;
  bodyPivot.add(rumpMesh);

  // Iconic black shoulder saddle wrapping across the upper back and chest
  const saddleGeo = trackGeo(new THREE.TorusGeometry(0.49, 0.2, 18, 32));
  const saddleMesh = new THREE.Mesh(saddleGeo, blackFurMat);
  saddleMesh.position.set(0, 1.24, 0.04);
  saddleMesh.rotation.x = Math.PI / 2 + 0.16;
  saddleMesh.scale.set(1.15, 1.06, 1.08);
  saddleMesh.castShadow = true;
  saddleMesh.receiveShadow = true;
  bodyPivot.add(saddleMesh);

  // Short ivory tail
  const tailGeo = trackGeo(new THREE.SphereGeometry(0.14, 14, 12));
  const tailMesh = new THREE.Mesh(tailGeo, ivoryFurMat);
  tailMesh.position.set(0, 0.55, -0.78);
  tailMesh.scale.set(1.0, 0.9, 1.25);
  tailMesh.castShadow = true;
  bodyPivot.add(tailMesh);

  // 2. Sculpted Head & Facial Anatomy
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 1.56, 0.44);
  bodyPivot.add(headPivot);

  const craniumGeo = trackGeo(new THREE.SphereGeometry(0.48, 28, 24));
  const craniumMesh = new THREE.Mesh(craniumGeo, ivoryFurMat);
  craniumMesh.scale.set(1.12, 0.98, 1.02);
  craniumMesh.castShadow = true;
  craniumMesh.receiveShadow = true;
  headPivot.add(craniumMesh);

  // Puffed zygomatic cheeks (distinctive bamboo-chewing jaw muscles)
  const cheekGeo = trackGeo(new THREE.SphereGeometry(0.24, 18, 16));
  for (const side of [-1, 1]) {
    const cheek = new THREE.Mesh(cheekGeo, ivoryFurMat);
    cheek.position.set(side * 0.28, -0.1, 0.22);
    cheek.scale.set(1.15, 0.95, 1.05);
    headPivot.add(cheek);
  }

  // Muzzle & snout bridge
  const muzzleGeo = trackGeo(new THREE.SphereGeometry(0.22, 20, 18));
  const muzzleMesh = new THREE.Mesh(muzzleGeo, ivoryFurMat);
  muzzleMesh.position.set(0, -0.11, 0.43);
  muzzleMesh.scale.set(1.12, 0.85, 1.18);
  muzzleMesh.castShadow = true;
  headPivot.add(muzzleMesh);

  // Articulated lower jaw
  const jawPivot = new THREE.Group();
  jawPivot.position.set(0, -0.2, 0.34);
  headPivot.add(jawPivot);
  const jawGeo = trackGeo(new THREE.SphereGeometry(0.16, 16, 14));
  const jawMesh = new THREE.Mesh(jawGeo, ivoryFurMat);
  jawMesh.position.set(0, -0.02, 0.1);
  jawMesh.scale.set(1.05, 0.65, 1.18);
  jawPivot.add(jawMesh);

  // Glossy black nose pad
  const noseGeo = trackGeo(new THREE.SphereGeometry(0.082, 16, 14));
  const noseMesh = new THREE.Mesh(noseGeo, noseMat);
  noseMesh.position.set(0, -0.05, 0.65);
  noseMesh.scale.set(1.3, 0.85, 0.9);
  headPivot.add(noseMesh);

  // Tilted oval black eye patches + glossy eyes + sclera catchlights
  const patchGeo = trackGeo(new THREE.SphereGeometry(0.16, 18, 16));
  const eyeGeo = trackGeo(new THREE.SphereGeometry(0.048, 16, 14));
  const catchGeo = trackGeo(new THREE.SphereGeometry(0.014, 10, 10));

  for (const side of [-1, 1]) {
    const patch = new THREE.Mesh(patchGeo, eyePatchMat);
    patch.position.set(side * 0.21, 0.04, 0.39);
    patch.scale.set(1.05, 1.25, 0.45);
    patch.rotation.z = side * -0.34;
    patch.rotation.y = side * 0.28;
    headPivot.add(patch);

    const eye = new THREE.Mesh(eyeGeo, eyeGlossMat);
    eye.position.set(side * 0.2, 0.05, 0.445);
    headPivot.add(eye);

    const catchlight = new THREE.Mesh(catchGeo, eyeHighlightMat);
    catchlight.position.set(side * 0.2 + 0.015, 0.068, 0.486);
    headPivot.add(catchlight);
  }

  // Round black ears
  const earGeo = trackGeo(new THREE.SphereGeometry(0.17, 18, 16));
  const leftEar = new THREE.Mesh(earGeo, blackFurMat);
  leftEar.position.set(-0.39, 0.37, 0.02);
  leftEar.scale.set(1.0, 1.05, 0.62);
  leftEar.castShadow = true;
  headPivot.add(leftEar);

  const rightEar = new THREE.Mesh(earGeo, blackFurMat);
  rightEar.position.set(0.39, 0.37, 0.02);
  rightEar.scale.set(1.0, 1.05, 0.62);
  rightEar.castShadow = true;
  headPivot.add(rightEar);

  // 3. Articulated Forelimbs + Pseudo-Thumb + Claws
  const upperArmGeo = trackGeo(new THREE.CapsuleGeometry(0.165, 0.42, 10, 18));
  const forePawGeo = trackGeo(new THREE.SphereGeometry(0.18, 18, 16));
  const clawGeo = trackGeo(new THREE.ConeGeometry(0.022, 0.075, 8));
  const thumbGeo = trackGeo(new THREE.CapsuleGeometry(0.042, 0.075, 6, 10));

  let pseudoThumbMesh!: THREE.Mesh;

  const buildForelimb = (side: -1 | 1): THREE.Group => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.56, 1.18, 0.18);

    const limb = new THREE.Mesh(upperArmGeo, blackFurMat);
    limb.position.set(0, -0.32, 0.14);
    limb.rotation.x = -0.35;
    limb.rotation.z = side * -0.14;
    limb.castShadow = true;
    limb.receiveShadow = true;
    pivot.add(limb);

    const paw = new THREE.Mesh(forePawGeo, blackFurMat);
    paw.position.set(side * 0.05, -0.62, 0.28);
    paw.scale.set(1.05, 0.8, 1.25);
    paw.castShadow = true;
    pivot.add(paw);

    // 5 digits / claws
    for (let c = -2; c <= 2; c++) {
      const claw = new THREE.Mesh(clawGeo, clawMat);
      claw.position.set(side * 0.05 + c * 0.045, -0.67, 0.44);
      claw.rotation.x = Math.PI * 0.65;
      pivot.add(claw);
    }

    // Specialized 6th digit: Pseudo-thumb (radial sesamoid pad on inner wrist)
    const thumb = new THREE.Mesh(thumbGeo, side === 1 ? pseudoThumbMat : pawPadMat);
    thumb.position.set(side * -0.1, -0.58, 0.31);
    thumb.rotation.z = side * 0.72;
    thumb.rotation.x = 0.45;
    pivot.add(thumb);
    if (side === 1) {
      pseudoThumbMesh = thumb;
    }

    return pivot;
  };

  const leftArmPivot = buildForelimb(-1);
  const rightArmPivot = buildForelimb(1);
  bodyPivot.add(leftArmPivot);
  bodyPivot.add(rightArmPivot);

  // Bamboo Snack held during Feeding / Chapter 4
  const bambooSnack = new THREE.Group();
  const snackStalkGeo = trackGeo(new THREE.CylinderGeometry(0.036, 0.042, 0.95, 14));
  const snackMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.bambooMap,
      roughness: 0.48,
      metalness: 0.02,
    }),
  );
  const snackStalk = new THREE.Mesh(snackStalkGeo, snackMat);
  snackStalk.castShadow = true;
  bambooSnack.add(snackStalk);

  const leafGeo = trackGeo(new THREE.ConeGeometry(0.045, 0.22, 6));
  const leafMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x6f9e5e,
      roughness: 0.55,
      metalness: 0.0,
    }),
  );
  for (let i = 0; i < 3; i++) {
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set(0.05, 0.32 + i * 0.08, 0);
    leaf.rotation.z = -0.8 - i * 0.2;
    leaf.scale.set(0.5, 1, 0.18);
    bambooSnack.add(leaf);
  }
  bambooSnack.position.set(0.32, 0.98, 0.68);
  bambooSnack.rotation.set(0.35, 0.1, 0.38);
  bambooSnack.visible = false;
  bodyPivot.add(bambooSnack);

  // 4. Articulated Hindlimbs (Seated forward stance with dark pads)
  const legGeo = trackGeo(new THREE.CapsuleGeometry(0.185, 0.36, 10, 18));
  const hindPawGeo = trackGeo(new THREE.SphereGeometry(0.19, 18, 16));
  const padGeo = trackGeo(new THREE.SphereGeometry(0.11, 14, 12));

  const buildHindlimb = (side: -1 | 1): THREE.Group => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.44, 0.46, -0.04);

    const leg = new THREE.Mesh(legGeo, blackFurMat);
    leg.position.set(side * 0.06, -0.18, 0.26);
    leg.rotation.x = Math.PI / 2 - 0.32;
    leg.rotation.z = side * -0.22;
    leg.castShadow = true;
    leg.receiveShadow = true;
    pivot.add(leg);

    const paw = new THREE.Mesh(hindPawGeo, blackFurMat);
    paw.position.set(side * 0.14, -0.26, 0.52);
    paw.scale.set(1.0, 0.85, 1.32);
    paw.castShadow = true;
    pivot.add(paw);

    const pad = new THREE.Mesh(padGeo, pawPadMat);
    pad.position.set(side * 0.14, -0.27, 0.65);
    pad.scale.set(1.1, 0.85, 0.45);
    pivot.add(pad);

    return pivot;
  };

  const leftLegPivot = buildHindlimb(-1);
  const rightLegPivot = buildHindlimb(1);
  bodyPivot.add(leftLegPivot);
  bodyPivot.add(rightLegPivot);

  return {
    root,
    bodyPivot,
    headPivot,
    jawPivot,
    leftEar,
    rightEar,
    leftArmPivot,
    rightArmPivot,
    leftLegPivot,
    rightLegPivot,
    pseudoThumbMesh,
    bambooSnack,
    contactShadow,
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}

export function animatePandaRig(
  rig: PandaRig,
  time: number,
  mode: PandaBehaviorMode,
  highlightPseudoThumb = false,
): void {
  const thumbMat = rig.pseudoThumbMesh.material as THREE.MeshStandardMaterial;
  if (highlightPseudoThumb) {
    const glow = 0.35 + Math.sin(time * 4) * 0.18;
    thumbMat.emissive.setRGB(glow * 0.85, glow * 0.65, glow * 0.25);
  } else {
    thumbMat.emissive.setRGB(0, 0, 0);
  }

  // Subtle breathing baseline
  const breathe = Math.sin(time * 1.8) * 0.018;
  rig.bodyPivot.scale.set(1 + breathe * 0.5, 1 + breathe, 1 + breathe * 0.5);
  rig.leftEar.rotation.z = Math.sin(time * 2.1) * 0.04;
  rig.rightEar.rotation.z = -Math.sin(time * 2.1 + 0.6) * 0.04;

  rig.bambooSnack.visible = mode === 'eating';

  if (mode === 'eating') {
    rig.bodyPivot.rotation.set(0.05, 0, 0);
    rig.bodyPivot.position.set(0, 0, 0);
    rig.headPivot.rotation.set(0.14 + Math.sin(time * 4.5) * 0.05, Math.sin(time * 1.1) * 0.1, 0);
    rig.jawPivot.rotation.x = Math.max(0, Math.sin(time * 7.2) * 0.24);
    rig.rightArmPivot.rotation.set(-0.75 + Math.sin(time * 2.4) * 0.07, 0.15, -0.25);
    rig.leftArmPivot.rotation.set(-0.42, -0.1, 0.15);
    rig.leftLegPivot.rotation.set(0, 0, 0);
    rig.rightLegPivot.rotation.set(0, 0, 0);
  } else if (mode === 'resting') {
    rig.bodyPivot.rotation.set(-0.22, 0.15, 0.14);
    rig.bodyPivot.position.set(0, -0.12, 0);
    rig.headPivot.rotation.set(0.28 + Math.sin(time * 0.8) * 0.03, -0.18, 0.12);
    rig.jawPivot.rotation.x = 0.03;
    rig.leftArmPivot.rotation.set(0.18, 0, 0.2);
    rig.rightArmPivot.rotation.set(0.24, 0, -0.2);
    rig.leftLegPivot.rotation.set(-0.15, 0, 0);
    rig.rightLegPivot.rotation.set(-0.1, 0, 0);
  } else if (mode === 'climbing') {
    const climbOsc = Math.sin(time * 2.6);
    rig.bodyPivot.rotation.set(-0.48, 0, Math.sin(time * 1.3) * 0.05);
    rig.bodyPivot.position.set(0, 0.35 + Math.abs(climbOsc) * 0.16, 0);
    rig.headPivot.rotation.set(-0.25, Math.sin(time * 1.6) * 0.18, 0);
    rig.jawPivot.rotation.x = 0;
    rig.leftArmPivot.rotation.set(-1.35 + climbOsc * 0.32, 0, 0.22);
    rig.rightArmPivot.rotation.set(-1.35 - climbOsc * 0.32, 0, -0.22);
    rig.leftLegPivot.rotation.set(-0.55 - climbOsc * 0.22, 0, 0);
    rig.rightLegPivot.rotation.set(-0.55 + climbOsc * 0.22, 0, 0);
  } else if (mode === 'roaming') {
    const stride = Math.sin(time * 3.0);
    rig.bodyPivot.rotation.set(0.28, Math.sin(time * 1.5) * 0.06, Math.cos(time * 3.0) * 0.04);
    rig.bodyPivot.position.set(0, 0.12 + Math.abs(stride) * 0.04, 0);
    rig.headPivot.rotation.set(-0.18, Math.sin(time * 1.1) * 0.14, 0);
    rig.jawPivot.rotation.x = 0.02;
    rig.leftArmPivot.rotation.set(stride * 0.32, 0, 0.1);
    rig.rightArmPivot.rotation.set(-stride * 0.32, 0, -0.1);
    rig.leftLegPivot.rotation.set(-stride * 0.26, 0, 0);
    rig.rightLegPivot.rotation.set(stride * 0.26, 0, 0);
  } else if (mode === 'waving') {
    rig.bodyPivot.rotation.set(0, 0, 0);
    rig.bodyPivot.position.set(0, 0, 0);
    rig.headPivot.rotation.set(Math.sin(time * 1.6) * 0.05, Math.sin(time * 1.1) * 0.12, 0.06);
    rig.jawPivot.rotation.x = 0.05;
    rig.rightArmPivot.rotation.set(-1.15, 0.2, -0.45 + Math.sin(time * 4.5) * 0.25);
    rig.leftArmPivot.rotation.set(0.05, 0, 0.12);
    rig.leftLegPivot.rotation.set(0, 0, 0);
    rig.rightLegPivot.rotation.set(0, 0, 0);
  } else {
    // Calm idle documentary pose
    rig.bodyPivot.rotation.set(0, 0, 0);
    rig.bodyPivot.position.set(0, 0, 0);
    rig.headPivot.rotation.set(
      Math.sin(time * 0.9) * 0.06,
      Math.sin(time * 0.65) * 0.16,
      Math.sin(time * 0.5) * 0.04,
    );
    rig.jawPivot.rotation.x = Math.max(0, Math.sin(time * 1.3) * 0.04);
    rig.leftArmPivot.rotation.set(Math.sin(time * 1.1) * 0.05, 0, 0.08);
    rig.rightArmPivot.rotation.set(-Math.sin(time * 1.1) * 0.05, 0, -0.08);
    rig.leftLegPivot.rotation.set(0, 0, 0);
    rig.rightLegPivot.rotation.set(0, 0, 0);
  }
}

export function createNewbornCubMesh(): { group: THREE.Group; dispose: () => void } {
  const group = new THREE.Group();
  const geos: THREE.BufferGeometry[] = [];
  const mats: THREE.Material[] = [];

  const pinkMat = new THREE.MeshStandardMaterial({
    color: 0xefc0ba,
    roughness: 0.72,
    metalness: 0.0,
  });
  const fuzzMat = new THREE.MeshStandardMaterial({
    color: 0xf7e3df,
    roughness: 0.9,
    metalness: 0.0,
  });
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x07120c,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
  });
  mats.push(pinkMat, fuzzMat, shadowMat);

  const bodyGeo = new THREE.CapsuleGeometry(0.11, 0.2, 8, 14);
  const headGeo = new THREE.SphereGeometry(0.095, 16, 14);
  const limbGeo = new THREE.CapsuleGeometry(0.032, 0.08, 6, 10);
  const tailGeo = new THREE.ConeGeometry(0.025, 0.09, 8);
  const shadowGeo = new THREE.CircleGeometry(0.24, 20);
  geos.push(bodyGeo, headGeo, limbGeo, tailGeo, shadowGeo);

  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.015;
  group.add(shadow);

  const body = new THREE.Mesh(bodyGeo, pinkMat);
  body.position.set(0, 0.14, 0);
  body.rotation.z = Math.PI / 2 - 0.18;
  body.castShadow = true;
  group.add(body);

  const head = new THREE.Mesh(headGeo, fuzzMat);
  head.position.set(0.17, 0.17, 0.04);
  head.castShadow = true;
  group.add(head);

  const tail = new THREE.Mesh(tailGeo, pinkMat);
  tail.position.set(-0.21, 0.11, 0);
  tail.rotation.z = Math.PI / 2 + 0.3;
  group.add(tail);

  for (const zOff of [-0.07, 0.07]) {
    const arm = new THREE.Mesh(limbGeo, pinkMat);
    arm.position.set(0.09, 0.09, zOff);
    arm.rotation.x = zOff * 4;
    group.add(arm);

    const leg = new THREE.Mesh(limbGeo, pinkMat);
    leg.position.set(-0.11, 0.08, zOff);
    leg.rotation.x = zOff * 4;
    group.add(leg);
  }

  return {
    group,
    dispose: () => {
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
    },
  };
}
