import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import gsap from 'gsap';
import {
  ANATOMY_HOTSPOTS,
  DIPLOMACY_PARTNERS,
  HABITAT_PROVINCES,
} from '../data/curriculum';
import type { ChapterId } from '../types/panda';
import {
  animatePandaRig,
  createGiantPandaRig,
  createNewbornCubMesh,
  type PandaBehaviorMode,
  type PandaRig,
} from './pandaModel';
import { createPandaTextureSet, type PandaTextureSet } from './proceduralTextures';

export interface EngineCallbacks {
  onLoadProgress?: (percent: number, status: string) => void;
  onHotspotSelect?: (hotspotId: string) => void;
  onProvinceSelect?: (provinceId: 'sichuan' | 'shaanxi' | 'gansu') => void;
  onPartnerSelect?: (partnerId: string) => void;
}

export interface EngineSceneOptions {
  chapter: ChapterId;
  paused: boolean;
  reducedMotion: boolean;
  selectedHotspotId: string | null;
  selectedProvinceId: 'sichuan' | 'shaanxi' | 'gansu';
  routineMode: PandaBehaviorMode;
  growthStage: 'newborn' | 'juvenile' | 'adult';
  restorationIntegrity: number; // 20..100
  selectedPartnerId: string;
}

const _raycaster = new THREE.Raycaster();
const _pointer = new THREE.Vector2();
const _targetCamPos = new THREE.Vector3(0, 2.2, 6.2);
const _targetLookAt = new THREE.Vector3(0, 1.0, 0);
const _dummyObj = new THREE.Object3D();

function latLonToVec3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon + 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

export class PandaDocumentaryEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private textures: PandaTextureSet;
  private lastTickMs = 0;
  private isSoftwareGl: boolean;
  private frameId = 0;
  private disposed = false;

  private callbacks: EngineCallbacks;
  private state: EngineSceneOptions = {
    chapter: 1,
    paused: false,
    reducedMotion: false,
    selectedHotspotId: null,
    selectedProvinceId: 'sichuan',
    routineMode: 'eating',
    growthStage: 'newborn',
    restorationIntegrity: 20,
    selectedPartnerId: 'washington',
  };

  // Shared lights & environment
  private keyLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private rimLight!: THREE.DirectionalLight;
  private groundMesh!: THREE.Mesh;
  private particles!: THREE.Points;

  // Chapter Groups
  private forestGroup = new THREE.Group();
  private sunbeamsGroup = new THREE.Group();
  private anatomyMarkersGroup = new THREE.Group();
  private mountainMapGroup = new THREE.Group();
  private climbingTreeGroup = new THREE.Group();
  private lifeCycleGroup = new THREE.Group();
  private conservationGroup = new THREE.Group();
  private diplomacyGroup = new THREE.Group();
  private ecosystemGroup = new THREE.Group();

  // Actors
  private heroPanda!: PandaRig;
  private juvenilePanda!: PandaRig;
  private newbornCub!: { group: THREE.Group; dispose: () => void };

  // Dynamic visual references
  private clickableMeshes: THREE.Object3D[] = [];
  private hotspotMeshes = new Map<string, THREE.Mesh>();
  private provinceBeacons = new Map<string, THREE.Mesh>();
  private partnerBeacons = new Map<string, THREE.Mesh>();
  private diplomacyGlobePivot = new THREE.Group();
  private restoredBambooInstances!: THREE.InstancedMesh;
  private monitoringBeacons: THREE.Mesh[] = [];
  private ecosystemRings: THREE.Mesh[] = [];
  private ecosystemNodes: THREE.Group[] = [];

  private disposableGeos: THREE.BufferGeometry[] = [];
  private disposableMats: THREE.Material[] = [];
  private envRenderTarget: THREE.WebGLRenderTarget | null = null;
  private cameraTweening = false;
  private elapsedSimTime = 0;

  constructor(container: HTMLElement, callbacks: EngineCallbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;

    this.callbacks.onLoadProgress?.(12, 'Initializing Physically-Based WebGL Pipeline');

    // Software WebGL detection per skill specification
    this.isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas').getContext('webgl2');
        if (!probe) return true;
        const ext = probe.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
        const gpu = String(probe.getParameter(param));
        probe.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c1b13);
    this.scene.fog = new THREE.FogExp2(0x0c1b13, 0.032);

    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 180);
    this.camera.position.copy(_targetCamPos);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI * 0.485;
    this.controls.minDistance = 2.2;
    this.controls.maxDistance = 18;
    this.controls.target.copy(_targetLookAt);

    this.controls.addEventListener('start', () => {
      this.cameraTweening = false;
      gsap.killTweensOf(_targetCamPos);
      gsap.killTweensOf(_targetLookAt);
    });

    this.callbacks.onLoadProgress?.(32, 'Generating Procedural Fur & Botanical Textures');
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const roomEnv = new RoomEnvironment();
    this.envRenderTarget = pmrem.fromScene(roomEnv, 0.04);
    this.scene.environment = this.envRenderTarget.texture;
    roomEnv.dispose();
    pmrem.dispose();

    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.textures = createPandaTextureSet(maxAniso);

    this.callbacks.onLoadProgress?.(54, 'Sculpting Giant Panda Anatomy & Bamboo Forest');
    this.setupLighting();
    this.setupGroundAndAtmosphere();
    this.setupActors();
    this.setupForestAndSunbeams();
    this.setupAnatomyMarkers();
    this.setupMountainMap();
    this.setupLifeCycleStage();
    this.setupConservationStage();
    this.setupDiplomacyGlobe();
    this.setupEcosystemPanorama();

    this.callbacks.onLoadProgress?.(84, 'Calibrating Interactive Raycasting & Camera Rigs');
    this.applyChapterVisibility(1);
    this.camera.position.set(-0.95, 1.75, 5.2);
    this.controls.target.set(-1.15, 0.95, 0);
    this.controls.update();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.callbacks.onLoadProgress?.(100, 'Ready for Exploration');
    this.startLoop();
  }

  private trackGeo<T extends THREE.BufferGeometry>(g: T): T {
    this.disposableGeos.push(g);
    return g;
  }

  private trackMat<T extends THREE.Material>(m: T): T {
    this.disposableMats.push(m);
    return m;
  }

  private setupLighting(): void {
    this.hemiLight = new THREE.HemisphereLight(0xaad0ba, 0x16241a, 0.72);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xfff0d4, 2.1);
    this.keyLight.position.set(6, 11, 7);
    this.keyLight.castShadow = !this.isSoftwareGl;
    this.keyLight.shadow.mapSize.set(1024, 1024);
    this.keyLight.shadow.camera.left = -10;
    this.keyLight.shadow.camera.right = 10;
    this.keyLight.shadow.camera.top = 10;
    this.keyLight.shadow.camera.bottom = -10;
    this.keyLight.shadow.camera.near = 1;
    this.keyLight.shadow.camera.far = 32;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.02;
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight(0x8bc99d, 0.95);
    this.rimLight.position.set(-6, 5, -7);
    this.scene.add(this.rimLight);
  }

  private setupGroundAndAtmosphere(): void {
    const groundGeo = this.trackGeo(new THREE.CircleGeometry(42, 32));
    const groundMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: this.textures.groundMap,
        bumpMap: this.textures.groundBumpMap,
        bumpScale: 0.08,
        roughness: 0.92,
        metalness: 0.0,
      }),
    );
    this.groundMesh = new THREE.Mesh(groundGeo, groundMat);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);

    // Floating mist & golden spore particles
    const count = 240;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 24;
      positions[i * 3 + 1] = 0.4 + Math.random() * 6.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 24;
    }
    const pGeo = this.trackGeo(new THREE.BufferGeometry());
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMat = this.trackMat(
      new THREE.PointsMaterial({
        size: 0.18,
        map: this.textures.particleMap,
        transparent: true,
        opacity: 0.52,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    this.particles = new THREE.Points(pGeo, pMat);
    this.scene.add(this.particles);
  }

  private setupActors(): void {
    this.heroPanda = createGiantPandaRig(this.textures);
    this.scene.add(this.heroPanda.root);

    this.juvenilePanda = createGiantPandaRig(this.textures);
    this.juvenilePanda.root.scale.setScalar(0.56);
    this.juvenilePanda.root.position.set(1.35, 0, 0.55);
    this.juvenilePanda.root.rotation.y = -0.5;
    this.lifeCycleGroup.add(this.juvenilePanda.root);

    this.newbornCub = createNewbornCubMesh();
    this.newbornCub.group.position.set(-0.95, 0.08, 0.95);
    this.lifeCycleGroup.add(this.newbornCub.group);
  }

  private setupForestAndSunbeams(): void {
    this.scene.add(this.forestGroup);
    this.scene.add(this.sunbeamsGroup);

    // Instanced Bamboo Culms forming deep surrounding grove (clear path around origin)
    const stalkCount = 75;
    const stalkGeo = this.trackGeo(new THREE.CylinderGeometry(0.055, 0.075, 9.5, 10));
    stalkGeo.translate(0, 4.75, 0);
    const stalkMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: this.textures.bambooMap,
        roughness: 0.52,
        metalness: 0.02,
      }),
    );
    const bambooInst = new THREE.InstancedMesh(stalkGeo, stalkMat, stalkCount);
    bambooInst.castShadow = !this.isSoftwareGl;
    bambooInst.receiveShadow = true;

    const leafClusterGeo = this.trackGeo(new THREE.ConeGeometry(0.45, 1.25, 6));
    const leafMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x5c8b4f,
        roughness: 0.68,
        metalness: 0.0,
      }),
    );
    const leafInst = new THREE.InstancedMesh(leafClusterGeo, leafMat, stalkCount);

    const tint = new THREE.Color();
    for (let i = 0; i < stalkCount; i++) {
      // Keep front viewing corridor (z > 0.8 && |x| < 4.0) completely unobstructed
      const angle = (i / stalkCount) * Math.PI * 2 + Math.random() * 0.25;
      const radius = 3.4 + Math.pow(Math.random(), 0.75) * 14.5;
      let x = Math.cos(angle) * radius;
      let z = Math.sin(angle) * radius;
      if (z > 0.6 && Math.abs(x) < 4.2) {
        z = -Math.abs(z) - 1.2;
        x *= 1.15;
      }
      const scaleH = 0.75 + Math.random() * 0.6;
      const scaleR = 0.78 + Math.random() * 0.45;

      _dummyObj.position.set(x, 0, z);
      _dummyObj.rotation.set(
        (Math.random() - 0.5) * 0.08,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.08,
      );
      _dummyObj.scale.set(scaleR, scaleH, scaleR);
      _dummyObj.updateMatrix();
      bambooInst.setMatrixAt(i, _dummyObj.matrix);

      tint.setHSL(0.28 + (Math.random() - 0.5) * 0.04, 0.34, 0.48 + Math.random() * 0.14);
      bambooInst.setColorAt(i, tint);

      _dummyObj.position.set(x, 6.2 * scaleH, z);
      _dummyObj.rotation.set(0.4, Math.random() * Math.PI * 2, 0.35);
      _dummyObj.scale.setScalar(0.9 + Math.random() * 0.5);
      _dummyObj.updateMatrix();
      leafInst.setMatrixAt(i, _dummyObj.matrix);
    }
    bambooInst.instanceMatrix.needsUpdate = true;
    if (bambooInst.instanceColor) bambooInst.instanceColor.needsUpdate = true;
    bambooInst.computeBoundingSphere();
    leafInst.instanceMatrix.needsUpdate = true;
    leafInst.computeBoundingSphere();

    this.forestGroup.add(bambooInst);
    this.forestGroup.add(leafInst);

    // Mossy forest boulders grounded on terrain
    const rockGeo = this.trackGeo(new THREE.DodecahedronGeometry(0.65, 1));
    const rockMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x3b483d,
        bumpMap: this.textures.groundBumpMap,
        bumpScale: 0.05,
        flatShading: true,
        roughness: 0.92,
        metalness: 0.02,
      }),
    );
    const rockCoords: [number, number, number][] = [
      [-2.3, 0.15, -1.6],
      [2.6, 0.12, -2.1],
      [-3.1, 0.2, 1.4],
      [3.3, 0.1, 1.8],
    ];
    rockCoords.forEach(([rx, ry, rz], idx) => {
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(rx, ry, rz);
      rock.scale.set(1.1 + idx * 0.1, 0.65, 0.95);
      rock.rotation.set(idx * 0.4, idx * 1.1, 0);
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.forestGroup.add(rock);
    });

    // Climbing evergreen trunk for Chapter 4 Climbing routine
    const trunkGeo = this.trackGeo(new THREE.CylinderGeometry(0.32, 0.44, 5.2, 14));
    trunkGeo.translate(0, 2.6, 0);
    const trunkMat = this.trackMat(
      new THREE.MeshStandardMaterial({ color: 0x4b3b2e, roughness: 0.92 }),
    );
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(0, 0, 0.72);
    trunk.rotation.x = 0.08;
    trunk.castShadow = true;
    this.climbingTreeGroup.add(trunk);
    this.climbingTreeGroup.visible = false;
    this.scene.add(this.climbingTreeGroup);

    // Volumetric sunbeam shafts
    const beamGeo = this.trackGeo(new THREE.ConeGeometry(2.6, 13, 24, 1, true));
    const beamMat = this.trackMat(
      new THREE.MeshBasicMaterial({
        color: 0xf4e3b8,
        transparent: true,
        opacity: 0.06,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    const beamPositions: [number, number, number, number][] = [
      [-1.5, 5.5, -1.5, -0.25],
      [1.8, 5.8, -0.5, 0.2],
      [0.2, 5.4, 1.6, -0.15],
    ];
    for (const [bx, by, bz, rz] of beamPositions) {
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(bx, by, bz);
      beam.rotation.z = rz;
      beam.rotation.x = 0.18;
      this.sunbeamsGroup.add(beam);
    }
  }

  private setupAnatomyMarkers(): void {
    this.scene.add(this.anatomyMarkersGroup);
    const markerGeo = this.trackGeo(new THREE.SphereGeometry(0.055, 16, 14));
    const ringGeo = this.trackGeo(new THREE.TorusGeometry(0.095, 0.011, 8, 24));

    ANATOMY_HOTSPOTS.forEach((spot) => {
      const mat = this.trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xc9a66b,
          emissive: 0xc9a66b,
          emissiveIntensity: 0.65,
          roughness: 0.25,
          metalness: 0.4,
        }),
      );
      const marker = new THREE.Mesh(markerGeo, mat);
      marker.position.set(...spot.position);
      marker.userData = { type: 'hotspot', id: spot.id };

      const ring = new THREE.Mesh(
        ringGeo,
        this.trackMat(
          new THREE.MeshBasicMaterial({
            color: 0xf2efe6,
            transparent: true,
            opacity: 0.72,
          }),
        ),
      );
      marker.add(ring);

      this.anatomyMarkersGroup.add(marker);
      this.hotspotMeshes.set(spot.id, marker);
      this.clickableMeshes.push(marker);
    });
  }

  private setupMountainMap(): void {
    this.scene.add(this.mountainMapGroup);

    // Sculpted 3D mountain terrain relief of Western China
    const terrainGeo = this.trackGeo(new THREE.PlaneGeometry(14, 10, 48, 36));
    terrainGeo.rotateX(-Math.PI / 2);
    const pos = terrainGeo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const cLow = new THREE.Color(0x1f472c);
    const cMid = new THREE.Color(0x568251);
    const cPeak = new THREE.Color(0xd8d7cf);

    const cTmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const ridge1 = Math.exp(-((x + 1.4) ** 2 * 0.22 + (z - 0.5) ** 2 * 0.25)) * 2.5; // Sichuan Minshan
      const ridge2 = Math.exp(-((x - 1.9) ** 2 * 0.28 + (z + 1.1) ** 2 * 0.3)) * 2.0; // Shaanxi Qinling
      const ridge3 = Math.exp(-((x - 0.2) ** 2 * 0.35 + (z + 1.6) ** 2 * 0.35)) * 1.7; // Gansu Baishuijiang
      const wave = Math.sin(x * 1.1) * Math.cos(z * 1.3) * 0.28 + Math.sin(x * 2.4 + z) * 0.1;
      const y = Math.max(0.05, ridge1 + ridge2 + ridge3 + wave + 0.2);
      pos.setY(i, y);

      if (y < 1.2) {
        cTmp.copy(cLow).lerp(cMid, THREE.MathUtils.clamp((y - 0.2) / 1.0, 0, 1));
      } else {
        cTmp.copy(cMid).lerp(cPeak, THREE.MathUtils.clamp((y - 1.2) / 1.1, 0, 1));
      }
      colors[i * 3] = cTmp.r;
      colors[i * 3 + 1] = cTmp.g;
      colors[i * 3 + 2] = cTmp.b;
    }
    terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    terrainGeo.computeVertexNormals();

    const terrainMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.86,
        metalness: 0.04,
      }),
    );
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.position.y = 0.04;
    terrain.receiveShadow = true;
    terrain.castShadow = true;
    this.mountainMapGroup.add(terrain);

    // Framed museum map plinth beneath terrain
    const plinthGeo = this.trackGeo(new THREE.BoxGeometry(14.4, 0.4, 10.4));
    const plinthMat = this.trackMat(
      new THREE.MeshStandardMaterial({ color: 0x171a18, roughness: 0.5, metalness: 0.25 }),
    );
    const plinth = new THREE.Mesh(plinthGeo, plinthMat);
    plinth.position.y = -0.18;
    this.mountainMapGroup.add(plinth);

    // Inset China Reference Globe floating beside the mountain map
    const miniGlobeGeo = this.trackGeo(new THREE.SphereGeometry(1.15, 32, 24));
    const miniGlobeMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: this.textures.earthMap,
        roughness: 0.55,
        metalness: 0.12,
      }),
    );
    const miniGlobe = new THREE.Mesh(miniGlobeGeo, miniGlobeMat);
    miniGlobe.position.set(-2.9, 3.1, -2.5);
    miniGlobe.rotation.y = -2.25; // Face China toward viewer
    this.mountainMapGroup.add(miniGlobe);

    // Province Beacons (Sichuan, Shaanxi, Gansu)
    const beaconCoords: Record<'sichuan' | 'shaanxi' | 'gansu', [number, number, number]> = {
      sichuan: [-1.4, 2.85, 0.5],
      shaanxi: [1.9, 2.35, -1.1],
      gansu: [0.2, 2.05, -1.6],
    };
    const beaconGeo = this.trackGeo(new THREE.OctahedronGeometry(0.24, 0));
    HABITAT_PROVINCES.forEach((prov) => {
      const mat = this.trackMat(
        new THREE.MeshStandardMaterial({
          color: prov.color,
          emissive: prov.color,
          emissiveIntensity: 0.55,
          roughness: 0.25,
          metalness: 0.5,
        }),
      );
      const beacon = new THREE.Mesh(beaconGeo, mat);
      beacon.position.set(...beaconCoords[prov.id]);
      beacon.userData = { type: 'province', id: prov.id };
      this.mountainMapGroup.add(beacon);
      this.provinceBeacons.set(prov.id, beacon);
      this.clickableMeshes.push(beacon);
    });
  }

  private setupLifeCycleStage(): void {
    this.scene.add(this.lifeCycleGroup);

    // Mossy bamboo-leaf nursery nest for Newborn Cub
    const nestGeo = this.trackGeo(new THREE.TorusGeometry(0.38, 0.11, 10, 24));
    const nestMat = this.trackMat(
      new THREE.MeshStandardMaterial({ color: 0x4b6b3e, roughness: 0.88 }),
    );
    const nest = new THREE.Mesh(nestGeo, nestMat);
    nest.rotation.x = Math.PI / 2;
    nest.position.set(-0.95, 0.08, 0.95);
    this.lifeCycleGroup.add(nest);
  }

  private setupConservationStage(): void {
    this.scene.add(this.conservationGroup);

    // Conservation monitoring station mast + beacon lights
    const mastGeo = this.trackGeo(new THREE.CylinderGeometry(0.05, 0.08, 2.8, 10));
    const mastMat = this.trackMat(
      new THREE.MeshStandardMaterial({ color: 0x3b4440, roughness: 0.4, metalness: 0.65 }),
    );
    const beaconGeo = this.trackGeo(new THREE.SphereGeometry(0.14, 14, 12));
    const stationCoords: [number, number][] = [
      [-2.8, -1.4],
      [2.6, -1.9],
      [0.4, -3.1],
    ];
    for (const [sx, sz] of stationCoords) {
      const mast = new THREE.Mesh(mastGeo, mastMat);
      mast.position.set(sx, 1.4, sz);
      this.conservationGroup.add(mast);

      const beaconMat = this.trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xc9a66b,
          emissive: 0x79a86b,
          emissiveIntensity: 0.4,
          roughness: 0.2,
        }),
      );
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(sx, 2.85, sz);
      this.conservationGroup.add(beacon);
      this.monitoringBeacons.push(beacon);
    }

    // Restorable Bamboo Sapling Grove (scales from 0 -> 1 based on restorationIntegrity)
    const saplingCount = 48;
    const saplingGeo = this.trackGeo(new THREE.CylinderGeometry(0.04, 0.06, 4.4, 8));
    saplingGeo.translate(0, 2.2, 0);
    const saplingMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: this.textures.bambooMap,
        roughness: 0.55,
      }),
    );
    this.restoredBambooInstances = new THREE.InstancedMesh(saplingGeo, saplingMat, saplingCount);
    for (let i = 0; i < saplingCount; i++) {
      // Crescent arc behind & flanking the panda (never blocking front camera corridor)
      const angle = Math.PI * 0.88 + (i / saplingCount) * Math.PI * 1.24;
      const r = 1.95 + (i % 4) * 0.95;
      _dummyObj.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r - 1.15);
      _dummyObj.rotation.set(0, angle, (Math.random() - 0.5) * 0.06);
      _dummyObj.scale.set(1, 0.3, 1);
      _dummyObj.updateMatrix();
      this.restoredBambooInstances.setMatrixAt(i, _dummyObj.matrix);
    }
    this.restoredBambooInstances.instanceMatrix.needsUpdate = true;
    this.restoredBambooInstances.computeBoundingSphere();
    this.conservationGroup.add(this.restoredBambooInstances);
  }

  private setupDiplomacyGlobe(): void {
    this.scene.add(this.diplomacyGroup);

    // Museum Exhibition Pedestal
    const pedGeo = this.trackGeo(new THREE.CylinderGeometry(1.1, 1.35, 0.65, 32));
    const pedMat = this.trackMat(
      new THREE.MeshStandardMaterial({ color: 0x171a18, roughness: 0.4, metalness: 0.35 }),
    );
    const pedestal = new THREE.Mesh(pedGeo, pedMat);
    pedestal.position.y = 0.325;
    this.diplomacyGroup.add(pedestal);

    this.diplomacyGlobePivot.position.set(0, 2.35, 0);
    this.diplomacyGroup.add(this.diplomacyGlobePivot);

    const globeRadius = 1.68;
    const globeGeo = this.trackGeo(new THREE.SphereGeometry(globeRadius, 48, 36));
    const globeMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: this.textures.earthMap,
        roughness: 0.55,
        metalness: 0.14,
      }),
    );
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    globeMesh.castShadow = true;
    this.diplomacyGlobePivot.add(globeMesh);

    // Brass meridian ring
    const meridianGeo = this.trackGeo(new THREE.TorusGeometry(globeRadius + 0.14, 0.025, 12, 64));
    const meridianMat = this.trackMat(
      new THREE.MeshStandardMaterial({ color: 0xc9a66b, roughness: 0.3, metalness: 0.8 }),
    );
    const meridian = new THREE.Mesh(meridianGeo, meridianMat);
    this.diplomacyGroup.add(meridian);
    meridian.position.copy(this.diplomacyGlobePivot.position);

    // Origin Chengdu marker + Diplomacy Arcs to Partner Cities
    const chengdu = DIPLOMACY_PARTNERS[0];
    const originPos = latLonToVec3(chengdu.lat, chengdu.lon, globeRadius + 0.03);
    const markerGeo = this.trackGeo(new THREE.SphereGeometry(0.06, 14, 12));

    DIPLOMACY_PARTNERS.forEach((partner) => {
      const pPos = latLonToVec3(partner.lat, partner.lon, globeRadius + 0.03);
      const isOrigin = partner.id === 'chengdu';
      const mat = this.trackMat(
        new THREE.MeshStandardMaterial({
          color: isOrigin ? 0xf2efe6 : 0xc9a66b,
          emissive: isOrigin ? 0x79a86b : 0xc9a66b,
          emissiveIntensity: 0.85,
          roughness: 0.2,
        }),
      );
      const beacon = new THREE.Mesh(markerGeo, mat);
      beacon.position.copy(pPos);
      beacon.userData = { type: 'partner', id: partner.id };
      this.diplomacyGlobePivot.add(beacon);
      this.partnerBeacons.set(partner.id, beacon);
      this.clickableMeshes.push(beacon);

      if (!isOrigin) {
        const mid = originPos.clone().add(pPos).multiplyScalar(0.5);
        const arcHeight = globeRadius + 0.45 + originPos.distanceTo(pPos) * 0.22;
        mid.normalize().multiplyScalar(arcHeight);
        const curve = new THREE.QuadraticBezierCurve3(originPos, mid, pPos);
        const tubeGeo = this.trackGeo(new THREE.TubeGeometry(curve, 32, 0.013, 6, false));
        const tubeMat = this.trackMat(
          new THREE.MeshStandardMaterial({
            color: 0xc9a66b,
            emissive: 0xc9a66b,
            emissiveIntensity: 0.45,
            roughness: 0.3,
          }),
        );
        const arc = new THREE.Mesh(tubeGeo, tubeMat);
        this.diplomacyGlobePivot.add(arc);
      }
    });

    // Orient East Asia & diplomatic arcs prominently toward viewer
    this.diplomacyGlobePivot.rotation.y = -2.25;
  }

  private setupEcosystemPanorama(): void {
    this.scene.add(this.ecosystemGroup);

    // Golden Ecological Umbrella Dome Rings + Co-occurring Species Nodes
    const ringMat = this.trackMat(
      new THREE.MeshBasicMaterial({
        color: 0xc9a66b,
        transparent: true,
        opacity: 0.42,
      }),
    );
    for (let i = 0; i < 3; i++) {
      const rGeo = this.trackGeo(new THREE.TorusGeometry(2.6 + i * 0.95, 0.018, 8, 64));
      const ring = new THREE.Mesh(rGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.08 + i * 0.04;
      this.ecosystemGroup.add(ring);
      this.ecosystemRings.push(ring);
    }

    const nodeColors = [0xd4a455, 0xc45e3d, 0x8ea97d, 0x5aa3a8];
    const orbGeo = this.trackGeo(new THREE.IcosahedronGeometry(0.28, 1));
    const pillarGeo = this.trackGeo(new THREE.CylinderGeometry(0.03, 0.04, 1.35, 8));

    nodeColors.forEach((hex, idx) => {
      const nodeGroup = new THREE.Group();
      const angle = (idx / nodeColors.length) * Math.PI * 2 + 0.5;
      const dist = 3.1;
      nodeGroup.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);

      const pillar = new THREE.Mesh(
        pillarGeo,
        this.trackMat(new THREE.MeshStandardMaterial({ color: 0x26382c, roughness: 0.7 })),
      );
      pillar.position.y = 0.675;
      nodeGroup.add(pillar);

      const orb = new THREE.Mesh(
        orbGeo,
        this.trackMat(
          new THREE.MeshStandardMaterial({
            color: hex,
            emissive: hex,
            emissiveIntensity: 0.45,
            roughness: 0.25,
          }),
        ),
      );
      orb.position.y = 1.55;
      nodeGroup.add(orb);

      this.ecosystemGroup.add(nodeGroup);
      this.ecosystemNodes.push(nodeGroup);
    });
  }

  private applyChapterVisibility(chapter: ChapterId): void {
    const showHeroPanda = chapter !== 3 && chapter !== 7;
    this.heroPanda.root.visible = showHeroPanda;
    this.forestGroup.visible = chapter !== 3 && chapter !== 7;
    this.sunbeamsGroup.visible = chapter === 1 || chapter === 4 || chapter === 8 || chapter === 9;
    this.anatomyMarkersGroup.visible = chapter === 2;
    this.mountainMapGroup.visible = chapter === 3;
    this.climbingTreeGroup.visible = chapter === 4 && this.state.routineMode === 'climbing';
    this.lifeCycleGroup.visible = chapter === 5;
    this.conservationGroup.visible = chapter === 6;
    this.diplomacyGroup.visible = chapter === 7;
    this.ecosystemGroup.visible = chapter === 8;

    // Position hero panda per chapter
    if (chapter === 5) {
      this.heroPanda.root.position.set(-0.35, 0, -0.35);
      this.heroPanda.root.rotation.y = 0.25;
    } else if (chapter === 6) {
      this.heroPanda.root.position.set(0, 0, 0.35);
      this.heroPanda.root.rotation.y = 0.1;
    } else {
      this.heroPanda.root.position.set(0, 0, 0);
      this.heroPanda.root.rotation.y = chapter === 1 ? -0.22 : 0;
    }

    // Chapter atmospheric palette shifts
    const bg = this.scene.background as THREE.Color;
    const fog = this.scene.fog as THREE.FogExp2;
    if (chapter === 1) {
      bg.setHex(0x0b1c13);
      fog.color.setHex(0x0b1c13);
      fog.density = 0.021;
      this.keyLight.intensity = 2.25;
    } else if (chapter === 7) {
      bg.setHex(0x0c191a);
      fog.color.setHex(0x0c191a);
      fog.density = 0.016;
      this.keyLight.intensity = 2.15;
    } else if (chapter === 8 || chapter === 9) {
      bg.setHex(0x13291d);
      fog.color.setHex(0x13291d);
      fog.density = 0.022;
      this.keyLight.intensity = 2.35;
    } else {
      bg.setHex(0x10251b);
      fog.color.setHex(0x10251b);
      fog.density = 0.024;
      this.keyLight.intensity = 2.25;
    }

    this.controls.enableRotate = chapter !== 1;
    this.controls.enableZoom = chapter === 2 || chapter === 3 || chapter === 7 || chapter === 8;
  }

  public updateOptions(next: EngineSceneOptions): void {
    const chapterChanged = next.chapter !== this.state.chapter;
    const hotspotChanged = next.selectedHotspotId !== this.state.selectedHotspotId;
    const provinceChanged = next.selectedProvinceId !== this.state.selectedProvinceId;
    const stageChanged = next.growthStage !== this.state.growthStage;
    const routineChanged = next.routineMode !== this.state.routineMode;

    this.state = { ...next };

    if (chapterChanged) {
      this.applyChapterVisibility(next.chapter);
      this.flyToChapterCamera(next.chapter);
    } else if (next.chapter === 2 && hotspotChanged && next.selectedHotspotId) {
      const spot = ANATOMY_HOTSPOTS.find((h) => h.id === next.selectedHotspotId);
      if (spot) {
        this.animateCameraTo(
          spot.cameraOffset[0],
          spot.cameraOffset[1],
          spot.cameraOffset[2],
          spot.position[0] * 0.4,
          spot.position[1],
          spot.position[2] * 0.4,
        );
      }
    } else if (next.chapter === 3 && provinceChanged) {
      const targetX =
        next.selectedProvinceId === 'sichuan'
          ? -1.4
          : next.selectedProvinceId === 'shaanxi'
            ? 1.9
            : 0.2;
      this.animateCameraTo(targetX * 0.65, 5.4, 6.8, targetX * 0.6, 1.4, -0.4);
    } else if (next.chapter === 5 && stageChanged) {
      if (next.growthStage === 'newborn') {
        this.animateCameraTo(-1.3, 1.25, 2.75, -0.85, 0.25, 0.85);
      } else if (next.growthStage === 'juvenile') {
        this.animateCameraTo(2.4, 1.7, 3.2, 1.15, 0.65, 0.4);
      } else {
        this.animateCameraTo(-0.8, 2.2, 4.4, -0.2, 1.0, 0);
      }
    } else if (next.chapter === 4 && routineChanged) {
      this.climbingTreeGroup.visible = next.routineMode === 'climbing';
    }

    // Update conservation restoration forest scale dynamically
    if (this.restoredBambooInstances) {
      const progress = Math.max(0, Math.min(1, (next.restorationIntegrity - 20) / 80));
      const count = this.restoredBambooInstances.count;
      for (let i = 0; i < count; i++) {
        const angle = Math.PI * 0.88 + (i / count) * Math.PI * 1.24;
        const r = 1.95 + (i % 4) * 0.95;
        const activeThreshold = i / count;
        const scaleY = progress >= activeThreshold ? 0.35 + progress * 0.95 : 0.08;
        _dummyObj.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r - 1.15);
        _dummyObj.rotation.set(0, angle, 0);
        _dummyObj.scale.set(1, scaleY, 1);
        _dummyObj.updateMatrix();
        this.restoredBambooInstances.setMatrixAt(i, _dummyObj.matrix);
      }
      this.restoredBambooInstances.instanceMatrix.needsUpdate = true;

      this.monitoringBeacons.forEach((b) => {
        const m = b.material as THREE.MeshStandardMaterial;
        m.emissiveIntensity = 0.25 + progress * 0.9;
      });
    }
  }

  private flyToChapterCamera(chapter: ChapterId): void {
    const presets: Record<ChapterId, [number, number, number, number, number, number]> = {
      1: [-0.95, 1.75, 5.2, -1.15, 0.95, 0],
      2: [0.45, 1.75, 4.1, -1.05, 0.95, 0.1],
      3: [-1.4, 6.8, 9.8, -1.5, 0.8, -0.3],
      4: [-1.8, 1.9, 4.8, -1.05, 0.95, 0],
      5: [-0.85, 1.95, 5.1, -0.95, 0.72, 0.2],
      6: [0.65, 2.55, 6.2, -1.15, 1.0, -0.4],
      7: [-1.25, 2.75, 7.6, -1.25, 1.85, 0],
      8: [-1.2, 3.6, 8.4, -1.35, 1.1, 0],
      9: [-0.95, 1.9, 5.0, -1.1, 0.95, 0],
    };
    const [cx, cy, cz, lx, ly, lz] = presets[chapter];
    this.animateCameraTo(cx, cy, cz, lx, ly, lz);
  }

  private animateCameraTo(
    cx: number,
    cy: number,
    cz: number,
    lx: number,
    ly: number,
    lz: number,
  ): void {
    if (this.state.reducedMotion || this.isSoftwareGl) {
      this.camera.position.set(cx, cy, cz);
      this.controls.target.set(lx, ly, lz);
      this.controls.update();
      return;
    }

    this.cameraTweening = true;
    _targetCamPos.copy(this.camera.position);
    _targetLookAt.copy(this.controls.target);

    gsap.killTweensOf(_targetCamPos);
    gsap.killTweensOf(_targetLookAt);

    gsap.to(_targetCamPos, {
      x: cx,
      y: cy,
      z: cz,
      duration: 1.1,
      ease: 'power3.out',
      onComplete: () => {
        this.cameraTweening = false;
      },
    });
    gsap.to(_targetLookAt, {
      x: lx,
      y: ly,
      z: lz,
      duration: 1.1,
      ease: 'power3.out',
    });
  }

  private handlePointerDown = (event: PointerEvent): void => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    _pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    _pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    _raycaster.setFromCamera(_pointer, this.camera);
    const activeTargets = this.clickableMeshes.filter((obj) => {
      if (this.state.chapter === 2) return obj.userData.type === 'hotspot';
      if (this.state.chapter === 3) return obj.userData.type === 'province';
      if (this.state.chapter === 7) return obj.userData.type === 'partner';
      return false;
    });

    const hits = _raycaster.intersectObjects(activeTargets, false);
    if (hits.length > 0) {
      const data = hits[0].object.userData;
      if (data.type === 'hotspot') {
        this.callbacks.onHotspotSelect?.(data.id);
      } else if (data.type === 'province') {
        this.callbacks.onProvinceSelect?.(data.id);
      } else if (data.type === 'partner') {
        this.callbacks.onPartnerSelect?.(data.id);
      }
    }
  };

  private handleResize = (): void => {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.renderer.render(this.scene, this.camera);
  };

  private bindEvents(): void {
    this.renderer.domElement.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('resize', this.handleResize);
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 45);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 45);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private startLoop(): void {
    this.lastTickMs = performance.now();
    const tick = () => {
      if (this.disposed) return;

      const now = performance.now();
      const dt = Math.min((now - this.lastTickMs) / 1000, 0.1);
      this.lastTickMs = now;
      if (!this.state.paused && !this.state.reducedMotion) {
        this.elapsedSimTime += dt;
      }
      const t = this.elapsedSimTime;

      if (this.cameraTweening) {
        this.camera.position.copy(_targetCamPos);
        this.controls.target.copy(_targetLookAt);
      }
      this.controls.update();

      // Determine Panda Behavior Mode based on current chapter
      let behavior: PandaBehaviorMode = 'idle';
      if (this.state.chapter === 4) {
        behavior = this.state.routineMode;
      } else if (this.state.chapter === 9) {
        behavior = 'waving';
      } else if (this.state.chapter === 6 && this.state.restorationIntegrity >= 70) {
        behavior = 'eating';
      }

      const highlightPseudoThumb =
        this.state.chapter === 2 && this.state.selectedHotspotId === 'pseudo_thumb';

      animatePandaRig(this.heroPanda, t, behavior, highlightPseudoThumb);

      if (this.state.chapter === 5) {
        animatePandaRig(this.juvenilePanda, t + 1.4, 'roaming', false);
        this.newbornCub.group.position.y = 0.08 + Math.sin(t * 2.5) * 0.01;
      }

      if (this.state.chapter === 2) {
        this.hotspotMeshes.forEach((mesh, id) => {
          const isSelected = id === this.state.selectedHotspotId;
          const pulse = isSelected ? 1.38 + Math.sin(t * 4) * 0.14 : 1.0 + Math.sin(t * 2.5) * 0.08;
          mesh.scale.setScalar(pulse);
        });
      }

      if (this.state.chapter === 3) {
        this.provinceBeacons.forEach((beacon, id) => {
          beacon.rotation.y = t * 1.4;
          beacon.scale.setScalar(id === this.state.selectedProvinceId ? 1.35 : 0.95);
        });
      }

      if (this.state.chapter === 7) {
        this.diplomacyGlobePivot.rotation.y += dt * (this.state.paused ? 0 : 0.14);
        this.partnerBeacons.forEach((b, id) => {
          b.scale.setScalar(id === this.state.selectedPartnerId ? 1.45 : 1.0);
        });
      }

      if (this.state.chapter === 8) {
        this.ecosystemRings.forEach((r, idx) => {
          r.rotation.z = t * (0.15 + idx * 0.06);
        });
        this.ecosystemNodes.forEach((node, idx) => {
          node.position.y = Math.sin(t * 1.6 + idx * 1.2) * 0.12;
        });
      }

      if (this.particles && !this.state.paused && !this.state.reducedMotion) {
        this.particles.rotation.y = t * 0.025;
      }

      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.renderer.render(this.scene, this.camera);
      this.afterDraw(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    gsap.killTweensOf(_targetCamPos);
    gsap.killTweensOf(_targetLookAt);

    this.renderer.domElement.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('resize', this.handleResize);

    this.controls.dispose();
    this.heroPanda.dispose();
    this.juvenilePanda.dispose();
    this.newbornCub.dispose();
    this.textures.dispose();
    this.envRenderTarget?.dispose();
    this.disposableGeos.forEach((g) => g.dispose());
    this.disposableMats.forEach((m) => m.dispose());
    this.renderer.dispose();

    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
