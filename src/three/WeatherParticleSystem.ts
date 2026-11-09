import * as THREE from 'three';
import { SeasonId, ToolId, WeatherIntensity, WeatherMode } from '../types/world';
import { PlanetTerrainHandles } from './PlanetTerrain';

export type ActiveWeatherType =
  | 'snow'
  | 'rain'
  | 'pollen'
  | 'sea_spray'
  | 'mountain_frost'
  | 'embers'
  | 'rainbow'
  | 'stardust'
  | 'dust'
  | 'clear';

const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _dir = new THREE.Vector3();

// -----------------------------------------------------------------------------
// Procedural Canvas Sprite Generators (Zero 404s, Zero External Dependencies)
// -----------------------------------------------------------------------------

function createSnowflakeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 64, 64);
  const cx = 32;
  const cy = 32;

  // Soft radiant center glow
  const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 30);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.2, 'rgba(235, 248, 255, 0.9)');
  grad.addColorStop(0.6, 'rgba(200, 235, 255, 0.35)');
  grad.addColorStop(1, 'rgba(180, 220, 255, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  // Six delicate crystalline snowflake branches
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';

  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // Main spoke
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const xEnd = cx + cos * 24;
    const yEnd = cy + sin * 24;
    ctx.lineTo(xEnd, yEnd);
    ctx.stroke();

    // Secondary sub-branch v-prongs
    const dMid = 14;
    const bx = cx + cos * dMid;
    const by = cy + sin * dMid;
    const normAngle1 = angle + Math.PI / 4;
    const normAngle2 = angle - Math.PI / 4;

    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + Math.cos(normAngle1) * 7, by + Math.sin(normAngle1) * 7);
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + Math.cos(normAngle2) * 7, by + Math.sin(normAngle2) * 7);
    ctx.stroke();
  }

  // Little central hexagon core
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.beginPath();
  ctx.arc(cx, cy, 3.2, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createRaindropTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 32, 64);

  // Vertical elongated luminous droplet
  const grad = ctx.createLinearGradient(16, 4, 16, 60);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
  grad.addColorStop(0.35, 'rgba(215, 240, 255, 0.45)');
  grad.addColorStop(0.85, 'rgba(180, 225, 255, 0.95)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 1)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(16, 36, 4.5, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  // Highlight head at base
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.beginPath();
  ctx.arc(16, 52, 4.0, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createGlowSpriteTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 64, 64);
  const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.25, 'rgba(255, 248, 220, 0.9)');
  grad.addColorStop(0.6, 'rgba(255, 235, 170, 0.35)');
  grad.addColorStop(1, 'rgba(255, 220, 140, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createSparkleStarTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 64, 64);
  const cx = 32;
  const cy = 32;

  // Soft halo
  const halo = ctx.createRadialGradient(cx, cy, 2, cx, cy, 28);
  halo.addColorStop(0, 'rgba(255, 255, 255, 1)');
  halo.addColorStop(0.3, 'rgba(255, 245, 200, 0.6)');
  halo.addColorStop(1, 'rgba(255, 230, 160, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, 64, 64);

  // 4-point diamond star rays
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.beginPath();
  ctx.moveTo(cx, 6);
  ctx.quadraticCurveTo(cx, cy, cx + 26, cy);
  ctx.quadraticCurveTo(cx, cy, cx, 58);
  ctx.quadraticCurveTo(cx, cy, cx - 26, cy);
  ctx.quadraticCurveTo(cx, cy, cx, 6);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createSplashRippleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 64, 64);
  ctx.strokeStyle = 'rgba(225, 245, 255, 0.85)';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(32, 32, 22, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(32, 32, 13, 0, Math.PI * 2);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// -----------------------------------------------------------------------------
// Particle Data Structures
// -----------------------------------------------------------------------------

interface SnowParticle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  baseSize: number;
  swayFreq: number;
  swayAmp: number;
  phase: number;
  opacity: number;
}

interface RainParticle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  baseSize: number;
  length: number;
}

interface RainSplashParticle {
  pos: THREE.Vector3;
  normal: THREE.Vector3;
  age: number;
  maxAge: number;
  maxScale: number;
}

interface AmbientParticle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  color: THREE.Color;
  targetColor: THREE.Color;
  size: number;
  baseSize: number;
  phase: number;
  orbitRadius: number;
  orbitSpeed: number;
  verticalSpeed: number;
  alpha: number;
}

export class WeatherParticleSystem {
  public group = new THREE.Group();

  private terrain: PlanetTerrainHandles;
  private getActiveTool: () => ToolId;
  private getTimeOfDay: () => number;

  private userWeatherMode: WeatherMode = 'auto';
  private intensity: WeatherIntensity = 'moderate';
  private season: SeasonId = 'spring';
  private activeCondition: ActiveWeatherType = 'pollen';

  // Crossfade transition weights (0..1)
  private weights = {
    snow: 0.0,
    rain: 0.0,
    pollen: 0.0,
    sea_spray: 0.0,
    mountain_frost: 0.0,
    embers: 0.0,
    rainbow: 0.0,
    stardust: 0.0,
    dust: 0.0,
  };

  // Subsystem 1: Falling Snow Flurries
  private snowParticles: SnowParticle[] = [];
  private snowPoints!: THREE.Points;
  private snowMat!: THREE.PointsMaterial;
  private readonly maxSnowCount = 420;

  // Subsystem 2: Rain Droplets & Surface Splashes
  private rainParticles: RainParticle[] = [];
  private rainPoints!: THREE.Points;
  private rainMat!: THREE.PointsMaterial;
  private readonly maxRainCount = 480;

  private splashes: RainSplashParticle[] = [];
  private splashPoints!: THREE.Points;
  private splashMat!: THREE.PointsMaterial;
  private readonly maxSplashCount = 80;

  // Subsystem 3: Biome Ambient Particles (Pollen, Sea Spray, Embers, Rainbow, Stardust, Dust)
  private ambientParticles: AmbientParticle[] = [];
  private ambientPoints!: THREE.Points;
  private ambientMat!: THREE.PointsMaterial;
  private readonly maxAmbientCount = 380;

  // High-altitude Frost Crystals (for mountain blizzards)
  private frostPoints!: THREE.Points;
  private frostMat!: THREE.PointsMaterial;
  private frostVelocities: THREE.Vector3[] = [];
  private readonly maxFrostCount = 200;

  constructor(
    terrain: PlanetTerrainHandles,
    getActiveTool: () => ToolId,
    getTimeOfDay: () => number,
  ) {
    this.terrain = terrain;
    this.getActiveTool = getActiveTool;
    this.getTimeOfDay = getTimeOfDay;

    this.initSnowSubsystem();
    this.initRainSubsystem();
    this.initAmbientSubsystem();
    this.initFrostSubsystem();

    this.group.name = 'WeatherParticleSystem';
    this.updateActiveCondition(true);
  }

  // ---------------------------------------------------------------------------
  // Initializers for Particle Buffers
  // ---------------------------------------------------------------------------

  private initSnowSubsystem() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxSnowCount * 3);
    const colors = new Float32Array(this.maxSnowCount * 3);

    for (let i = 0; i < this.maxSnowCount; i++) {
      const p = this.createRandomSnowflake(true);
      this.snowParticles.push(p);

      positions[i * 3] = p.pos.x;
      positions[i * 3 + 1] = p.pos.y;
      positions[i * 3 + 2] = p.pos.z;

      // Subtle ice-crystal tint variation
      const tint = 0.94 + Math.random() * 0.06;
      colors[i * 3] = tint;
      colors[i * 3 + 1] = tint * 0.98;
      colors[i * 3 + 2] = 1.0;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const snowTex = createSnowflakeTexture();
    this.snowMat = new THREE.PointsMaterial({
      map: snowTex,
      size: 0.054,
      transparent: true,
      opacity: 0.0,
      vertexColors: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });

    this.snowPoints = new THREE.Points(geo, this.snowMat);
    this.group.add(this.snowPoints);
  }

  private createRandomSnowflake(initialSpread = false): SnowParticle {
    // Generate within the glass orb dome above/around the planet
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 0.85; // Upper to mid hemisphere
    const r = 0.86 + Math.random() * 0.52; // Between planet surface (0.84) and inner orb (1.42)

    const x = Math.sin(phi) * Math.cos(theta) * r;
    const y = initialSpread ? Math.cos(phi) * r : 0.85 + Math.random() * 0.52;
    const z = Math.sin(phi) * Math.sin(theta) * r;

    return {
      pos: new THREE.Vector3(x, y, z),
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 0.04,
        -(0.14 + Math.random() * 0.16),
        (Math.random() - 0.5) * 0.04,
      ),
      baseSize: 0.04 + Math.random() * 0.03,
      swayFreq: 1.8 + Math.random() * 2.2,
      swayAmp: 0.04 + Math.random() * 0.05,
      phase: Math.random() * Math.PI * 2,
      opacity: 0.75 + Math.random() * 0.25,
    };
  }

  private initRainSubsystem() {
    // 1. Rain streaks
    const rainGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxRainCount * 3);
    const colors = new Float32Array(this.maxRainCount * 3);

    for (let i = 0; i < this.maxRainCount; i++) {
      const p = this.createRandomRaindrop(true);
      this.rainParticles.push(p);

      positions[i * 3] = p.pos.x;
      positions[i * 3 + 1] = p.pos.y;
      positions[i * 3 + 2] = p.pos.z;

      colors[i * 3] = 0.75;
      colors[i * 3 + 1] = 0.88;
      colors[i * 3 + 2] = 1.0;
    }

    rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    rainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const rainTex = createRaindropTexture();
    this.rainMat = new THREE.PointsMaterial({
      map: rainTex,
      size: 0.062,
      transparent: true,
      opacity: 0.0,
      vertexColors: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });

    this.rainPoints = new THREE.Points(rainGeo, this.rainMat);
    this.group.add(this.rainPoints);

    // 2. Rain splash rings
    const splashGeo = new THREE.BufferGeometry();
    const splashPositions = new Float32Array(this.maxSplashCount * 3);
    const splashColors = new Float32Array(this.maxSplashCount * 3);

    for (let i = 0; i < this.maxSplashCount; i++) {
      splashPositions[i * 3] = 0;
      splashPositions[i * 3 + 1] = -999; // Off-screen initially
      splashPositions[i * 3 + 2] = 0;

      splashColors[i * 3] = 0.85;
      splashColors[i * 3 + 1] = 0.94;
      splashColors[i * 3 + 2] = 1.0;
    }

    splashGeo.setAttribute('position', new THREE.BufferAttribute(splashPositions, 3));
    splashGeo.setAttribute('color', new THREE.BufferAttribute(splashColors, 3));

    const splashTex = createSplashRippleTexture();
    this.splashMat = new THREE.PointsMaterial({
      map: splashTex,
      size: 0.045,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.splashPoints = new THREE.Points(splashGeo, this.splashMat);
    this.group.add(this.splashPoints);
  }

  private createRandomRaindrop(initialSpread = false): RainParticle {
    const theta = Math.random() * Math.PI * 2;
    const r = 0.45 + Math.random() * 0.75;
    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;
    const y = initialSpread ? 0.4 + Math.random() * 0.95 : 1.15 + Math.random() * 0.25;

    return {
      pos: new THREE.Vector3(x, y, z),
      vel: new THREE.Vector3(
        0.035,
        -(0.75 + Math.random() * 0.45),
        -0.02,
      ),
      baseSize: 0.055 + Math.random() * 0.025,
      length: 0.06 + Math.random() * 0.04,
    };
  }

  private initAmbientSubsystem() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxAmbientCount * 3);
    const colors = new Float32Array(this.maxAmbientCount * 3);

    for (let i = 0; i < this.maxAmbientCount; i++) {
      const p = this.createRandomAmbientParticle(i);
      this.ambientParticles.push(p);

      positions[i * 3] = p.pos.x;
      positions[i * 3 + 1] = p.pos.y;
      positions[i * 3 + 2] = p.pos.z;

      colors[i * 3] = p.color.r;
      colors[i * 3 + 1] = p.color.g;
      colors[i * 3 + 2] = p.color.b;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const glowTex = createGlowSpriteTexture();
    this.ambientMat = new THREE.PointsMaterial({
      map: glowTex,
      size: 0.052,
      transparent: true,
      opacity: 0.0,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.ambientPoints = new THREE.Points(geo, this.ambientMat);
    this.group.add(this.ambientPoints);
  }

  private createRandomAmbientParticle(idx: number): AmbientParticle {
    // Generate spherical position surrounding the globe
    const dir = new THREE.Vector3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5,
    ).normalize();
    const r = 0.85 + Math.random() * 0.45;
    const pos = dir.multiplyScalar(r);

    const c = new THREE.Color('#fff2a8');
    return {
      pos,
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 0.03,
        0.02 + Math.random() * 0.03,
        (Math.random() - 0.5) * 0.03,
      ),
      color: c.clone(),
      targetColor: c.clone(),
      size: 0.045 + Math.random() * 0.025,
      baseSize: 0.045 + Math.random() * 0.025,
      phase: idx * 0.35 + Math.random(),
      orbitRadius: r,
      orbitSpeed: 0.04 + Math.random() * 0.05,
      verticalSpeed: 0.015 + Math.random() * 0.025,
      alpha: 0.65 + Math.random() * 0.35,
    };
  }

  private initFrostSubsystem() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxFrostCount * 3);
    const colors = new Float32Array(this.maxFrostCount * 3);

    for (let i = 0; i < this.maxFrostCount; i++) {
      // Concentrated around north alpine mountain peak (around y ~ 0.5..1.0)
      const theta = Math.random() * Math.PI * 2;
      const phi = 0.15 + Math.random() * 0.65;
      const r = 0.82 + Math.random() * 0.32;
      const x = Math.sin(phi) * Math.cos(theta) * r;
      const y = Math.cos(phi) * r;
      const z = Math.sin(phi) * Math.sin(theta) * r;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      colors[i * 3] = 0.92;
      colors[i * 3 + 1] = 0.96;
      colors[i * 3 + 2] = 1.0;

      this.frostVelocities.push(
        new THREE.Vector3(
          -Math.sin(theta) * 0.18 + (Math.random() - 0.5) * 0.05,
          (Math.random() - 0.5) * 0.03,
          Math.cos(theta) * 0.18 + (Math.random() - 0.5) * 0.05,
        ),
      );
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starTex = createSparkleStarTexture();
    this.frostMat = new THREE.PointsMaterial({
      map: starTex,
      size: 0.048,
      transparent: true,
      opacity: 0.0,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.frostPoints = new THREE.Points(geo, this.frostMat);
    this.group.add(this.frostPoints);
  }

  // ---------------------------------------------------------------------------
  // Condition Mapping & Tool Reactivity
  // ---------------------------------------------------------------------------

  public setWeatherMode(mode: WeatherMode) {
    this.userWeatherMode = mode;
    this.updateActiveCondition();
  }

  public setIntensity(intensity: WeatherIntensity) {
    this.intensity = intensity;
  }

  public setSeason(season: SeasonId) {
    this.season = season;
    if (this.userWeatherMode === 'auto') {
      this.updateActiveCondition();
    } else {
      this.updateAmbientColorsForCondition(this.activeCondition);
    }
  }

  public getSeason(): SeasonId {
    return this.season;
  }

  public onToolChanged() {
    if (this.userWeatherMode === 'auto') {
      this.updateActiveCondition();
    }
  }

  public getCurrentConditionName(): string {
    switch (this.activeCondition) {
      case 'snow':
        return this.season === 'winter'
          ? 'Alpine Snow Flurries & Frost'
          : 'Gentle Snow Flurries';
      case 'rain':
        if (this.season === 'winter') return 'Freezing Sleet & Cold Rain';
        if (this.season === 'spring') return 'Fresh Spring Rain Shower';
        if (this.season === 'autumn') return 'Autumn Drizzle & Mist';
        return 'Summer Rain Shower';
      case 'pollen':
        if (this.season === 'autumn') return 'Swirling Autumn Leaves & Foliage';
        if (this.season === 'spring') return 'Cherry Blossom Petals & Spring Pollen';
        if (this.season === 'winter') return 'Crystalline Frost Motes';
        return 'Meadow Blossom Pollen';
      case 'sea_spray':
        return 'Coastal Sea Spray & Mist';
      case 'mountain_frost':
        return this.season === 'winter'
          ? 'Alpine Mountain Blizzard'
          : 'Alpine Frost & Spindrift';
      case 'embers':
        return this.season === 'autumn'
          ? 'Cozy Autumn Hearth Embers'
          : 'Crackling Campfire Embers';
      case 'rainbow':
        return 'Prismatic Rainbow Shimmer';
      case 'stardust':
        return this.season === 'summer'
          ? 'Summer Fireflies & Twilight Stardust'
          : this.season === 'winter'
          ? 'Aurora Borealis Glint & Stardust'
          : 'Astral Stardust Twinkle';
      case 'dust':
        return 'Earthy Sculpting Sand Dust';
      case 'clear':
        return `Clear Calm ${this.season.charAt(0).toUpperCase() + this.season.slice(1)} Sky`;
    }
  }

  public getIntensityMultiplier(): number {
    switch (this.intensity) {
      case 'gentle':
        return 0.55;
      case 'moderate':
        return 1.0;
      case 'dense':
        return 1.6;
    }
  }

  private updateActiveCondition(immediate = false) {
    let target: ActiveWeatherType = 'pollen';

    if (this.userWeatherMode !== 'auto') {
      target = this.userWeatherMode;
    } else {
      const tool = this.getActiveTool();
      const timeOfDay = this.getTimeOfDay();
      const isNight = timeOfDay > 0.65;

      switch (tool) {
        case 'snowcloud':
          target = 'snow';
          break;
        case 'cloud':
          target = this.season === 'winter' ? 'snow' : 'rain';
          break;
        case 'mountain':
          target = 'mountain_frost';
          break;
        case 'lake':
        case 'sailboat':
        case 'duck':
        case 'dock':
          target = 'sea_spray';
          break;
        case 'tree':
        case 'flower':
        case 'beehive':
          target = this.season === 'winter' ? 'snow' : 'pollen';
          break;
        case 'campfire':
          target = 'embers';
          break;
        case 'rainbow':
          target = 'rainbow';
          break;
        case 'shootingstar':
        case 'balloon':
          target = 'stardust';
          break;
        case 'raise':
        case 'lower':
          target = 'dust';
          break;
        default:
          if (this.season === 'winter') {
            target = isNight ? 'stardust' : 'snow';
          } else if (this.season === 'autumn') {
            target = isNight ? 'embers' : 'pollen';
          } else if (this.season === 'summer') {
            target = isNight ? 'stardust' : 'sea_spray';
          } else {
            target = isNight ? 'stardust' : 'pollen';
          }
          break;
      }
    }

    this.activeCondition = target;
    if (immediate) {
      for (const k of Object.keys(this.weights) as (keyof typeof this.weights)[]) {
        this.weights[k] = k === target ? 1.0 : 0.0;
      }
    }

    this.updateAmbientColorsForCondition(target);
  }

  private updateAmbientColorsForCondition(cond: ActiveWeatherType) {
    const palette: THREE.Color[] = [];

    switch (cond) {
      case 'pollen':
        if (this.season === 'autumn') {
          palette.push(
            new THREE.Color('#d4380d'), // Fiery scarlet maple leaf
            new THREE.Color('#fa8c16'), // Vibrant pumpkin orange leaf
            new THREE.Color('#ffc069'), // Golden amber birch leaf
            new THREE.Color('#871400'), // Deep burnt russet oak leaf
            new THREE.Color('#faad14'), // Harvest gold
          );
        } else if (this.season === 'spring') {
          palette.push(
            new THREE.Color('#ffadd2'), // Cherry blossom petal pink
            new THREE.Color('#ffd6e7'), // Pale sakura petal
            new THREE.Color('#fffb8f'), // Spring pollen gold
            new THREE.Color('#b7eb8f'), // Tender spring sprout green
          );
        } else if (this.season === 'winter') {
          palette.push(
            new THREE.Color('#ffffff'), // Snow crystal
            new THREE.Color('#e6f7ff'), // Diamond frost
            new THREE.Color('#bae7ff'), // Pale ice crystal
            new THREE.Color('#d9f7be'), // Frosted pine needle
          );
        } else {
          palette.push(
            new THREE.Color('#ffe58f'), // Warm golden pollen
            new THREE.Color('#ffd666'),
            new THREE.Color('#d9f7be'), // Tender chartreuse leaf mote
            new THREE.Color('#ffd6e7'), // Blossom petal pink
          );
        }
        break;
      case 'sea_spray':
        palette.push(
          new THREE.Color('#87e8de'), // Sea foam aqua
          new THREE.Color('#b5f5ec'),
          new THREE.Color('#5cdbd3'),
          new THREE.Color('#ffffff'), // Salt spray white
        );
        break;
      case 'embers':
        palette.push(
          new THREE.Color('#ffa940'), // Orange ember
          new THREE.Color('#ff7a45'), // Fiery vermillion
          new THREE.Color('#ffec3d'), // Radiant yellow spark
          new THREE.Color('#ff4d4f'), // Crimson coal
        );
        break;
      case 'rainbow':
        palette.push(
          new THREE.Color('#ffadd2'), // Pastel magenta
          new THREE.Color('#d3adf7'), // Violet
          new THREE.Color('#87e8de'), // Cyan
          new THREE.Color('#ffe58f'), // Sunbeam yellow
          new THREE.Color('#b7eb8f'), // Mint
        );
        break;
      case 'stardust':
        if (this.season === 'summer') {
          palette.push(
            new THREE.Color('#d9f7be'), // Firefly chartreuse glow
            new THREE.Color('#fffb8f'), // Firefly golden light
            new THREE.Color('#ffd666'),
            new THREE.Color('#bae7ff'), // Twilight star
          );
        } else if (this.season === 'winter') {
          palette.push(
            new THREE.Color('#87e8de'), // Aurora green
            new THREE.Color('#b5f5ec'), // Aurora pale cyan
            new THREE.Color('#d3adf7'), // Aurora violet
            new THREE.Color('#ffffff'), // Crystalline diamond
          );
        } else {
          palette.push(
            new THREE.Color('#fff1b8'), // Diamond starlight
            new THREE.Color('#ffffff'),
            new THREE.Color('#d3adf7'), // Cosmic violet
            new THREE.Color('#bae7ff'), // Pale blue nebula
          );
        }
        break;
      case 'dust':
        palette.push(
          new THREE.Color('#e8c49e'), // Sandstone dust
          new THREE.Color('#d4a373'), // Terracotta
          new THREE.Color('#c28b58'), // Rich earth
          new THREE.Color('#f0dfc8'), // Fine chalk
        );
        break;
      default:
        palette.push(new THREE.Color('#ffffff'));
        break;
    }

    for (let i = 0; i < this.ambientParticles.length; i++) {
      const p = this.ambientParticles[i];
      const targetColor = palette[i % palette.length];
      p.targetColor.copy(targetColor);
    }
  }

  // ---------------------------------------------------------------------------
  // Per-Frame Update Loop
  // ---------------------------------------------------------------------------

  public update(dt: number, elapsedTime: number) {
    if (this.userWeatherMode === 'auto') {
      this.updateActiveCondition(false);
    }

    const intensityMult = this.getIntensityMultiplier();

    // 1. Smooth cross-fading of subsystem weights
    const targetCond = this.activeCondition;
    for (const key of Object.keys(this.weights) as (keyof typeof this.weights)[]) {
      const isTarget = key === targetCond;
      const targetVal = isTarget ? 1.0 : 0.0;
      this.weights[key] = THREE.MathUtils.damp(
        this.weights[key],
        targetVal,
        3.5,
        dt,
      );
    }

    // 2. Update Snow Flurries
    const snowWeight = this.weights.snow;
    this.snowMat.opacity = THREE.MathUtils.lerp(
      0.0,
      0.88 * intensityMult,
      snowWeight,
    );

    if (this.snowMat.opacity > 0.005) {
      const posAttr = this.snowPoints.geometry.attributes.position;
      const activeCount = Math.floor(this.maxSnowCount * Math.min(1.0, intensityMult));

      for (let i = 0; i < activeCount; i++) {
        const p = this.snowParticles[i];

        // Organic lateral wind sway
        const swayX = Math.sin(elapsedTime * p.swayFreq + p.phase) * p.swayAmp * dt;
        const swayZ = Math.cos(elapsedTime * p.swayFreq * 0.8 + p.phase) * p.swayAmp * dt;

        p.pos.x += p.vel.x * dt + swayX;
        p.pos.y += p.vel.y * dt;
        p.pos.z += p.vel.z * dt + swayZ;

        // Check bounds: distance to center and bottom boundary
        const dist = p.pos.length();
        _dir.copy(p.pos).normalize();
        const surfRadius = this.terrain.getSurfaceRadiusAtDir(_dir);

        // If snowflake hit the terrain surface or falls below bottom of orb, recycle to top
        if (dist <= surfRadius + 0.008 || p.pos.y < -1.15 || dist > 1.44) {
          const fresh = this.createRandomSnowflake(false);
          p.pos.copy(fresh.pos);
          p.vel.copy(fresh.vel);
        }

        posAttr.setXYZ(i, p.pos.x, p.pos.y, p.pos.z);
      }
      posAttr.needsUpdate = true;
    }

    // 3. Update Rain Droplets & Splashes
    const rainWeight = this.weights.rain;
    this.rainMat.opacity = THREE.MathUtils.lerp(
      0.0,
      0.78 * intensityMult,
      rainWeight,
    );
    this.splashMat.opacity = THREE.MathUtils.lerp(
      0.0,
      0.82 * intensityMult,
      rainWeight,
    );

    if (this.rainMat.opacity > 0.005) {
      const rainPosAttr = this.rainPoints.geometry.attributes.position;
      const activeRain = Math.floor(this.maxRainCount * Math.min(1.0, intensityMult));

      for (let i = 0; i < activeRain; i++) {
        const r = this.rainParticles[i];
        r.pos.x += r.vel.x * dt;
        r.pos.y += r.vel.y * dt;
        r.pos.z += r.vel.z * dt;

        _dir.copy(r.pos).normalize();
        const surfRadius = this.terrain.getSurfaceRadiusAtDir(_dir);
        const dist = r.pos.length();

        // When raindrop hits planet surface
        if (dist <= surfRadius + 0.006 || r.pos.y < -1.1) {
          if (dist <= surfRadius + 0.02 && this.splashes.length < this.maxSplashCount) {
            const surf = this.terrain.getSurfacePointAndNormal(_dir);
            this.splashes.push({
              pos: surf.point.clone().addScaledVector(surf.normal, 0.003),
              normal: surf.normal.clone(),
              age: 0,
              maxAge: 0.22 + Math.random() * 0.12,
              maxScale: 0.035 + Math.random() * 0.02,
            });
          }

          // Reset raindrop to top
          const fresh = this.createRandomRaindrop(false);
          r.pos.copy(fresh.pos);
          r.vel.copy(fresh.vel);
        }

        rainPosAttr.setXYZ(i, r.pos.x, r.pos.y, r.pos.z);
      }
      rainPosAttr.needsUpdate = true;

      // Update splashes
      const splashPosAttr = this.splashPoints.geometry.attributes.position;
      for (let i = this.splashes.length - 1; i >= 0; i--) {
        const sp = this.splashes[i];
        sp.age += dt;
        if (sp.age >= sp.maxAge) {
          this.splashes.splice(i, 1);
          splashPosAttr.setY(i, -999);
          continue;
        }
        splashPosAttr.setXYZ(i, sp.pos.x, sp.pos.y, sp.pos.z);
      }
      splashPosAttr.needsUpdate = true;
    }

    // 4. Update Ambient Biome Particles (Pollen, Sea Spray, Embers, Rainbow, Stardust, Dust)
    const ambientWeight =
      this.weights.pollen +
      this.weights.sea_spray +
      this.weights.embers +
      this.weights.rainbow +
      this.weights.stardust +
      this.weights.dust;

    this.ambientMat.opacity = THREE.MathUtils.lerp(
      0.0,
      0.85 * intensityMult,
      ambientWeight,
    );

    if (this.ambientMat.opacity > 0.005) {
      const ambPosAttr = this.ambientPoints.geometry.attributes.position;
      const ambColAttr = this.ambientPoints.geometry.attributes.color;
      const activeAmbient = Math.floor(this.maxAmbientCount * Math.min(1.0, intensityMult));

      const isEmbers = this.weights.embers > 0.4;
      const isSeaSpray = this.weights.sea_spray > 0.4;
      const isRainbow = this.weights.rainbow > 0.4;
      const isStardust = this.weights.stardust > 0.4;

      for (let i = 0; i < activeAmbient; i++) {
        const p = this.ambientParticles[i];

        // Smoothly blend color towards target palette
        p.color.lerp(p.targetColor, dt * 4.5);
        ambColAttr.setXYZ(i, p.color.r, p.color.g, p.color.b);

        if (isEmbers) {
          // Warm buoyant lift upward from campfire & village clearings
          p.pos.y += (0.09 + Math.sin(elapsedTime * 3.0 + p.phase) * 0.04) * dt;
          p.pos.x += Math.sin(elapsedTime * 2.2 + p.phase) * 0.025 * dt;
          p.pos.z += Math.cos(elapsedTime * 2.5 + p.phase) * 0.025 * dt;

          const dist = p.pos.length();
          if (dist > 1.38 || p.pos.y > 1.25) {
            // Respawn near lower/mid surface
            const freshDir = new THREE.Vector3(
              (Math.random() - 0.5) * 0.7,
              -0.2 + Math.random() * 0.45,
              0.6 + Math.random() * 0.5,
            ).normalize();
            p.pos.copy(freshDir.multiplyScalar(0.86));
          }
        } else if (isSeaSpray) {
          // Spray bubbling up from sea level along coasts
          const curR = p.pos.length();
          p.pos.addScaledVector(p.vel, dt * 1.5);
          p.pos.y += Math.sin(elapsedTime * 2.0 + p.phase) * 0.012 * dt;

          if (curR < 0.74 || curR > 1.25) {
            const seaDir = new THREE.Vector3(
              0.65 + (Math.random() - 0.5) * 0.45,
              -0.18 + (Math.random() - 0.5) * 0.35,
              0.72 + (Math.random() - 0.5) * 0.35,
            ).normalize();
            p.pos.copy(seaDir.multiplyScalar(this.terrain.seaLevel + 0.005));
          }
        } else if (isRainbow) {
          // Prismatic arch drift
          const angle = elapsedTime * 0.35 + p.phase;
          p.pos.x = Math.sin(angle) * 0.95;
          p.pos.y = 0.25 + Math.sin(angle * 1.8) * 0.38;
          p.pos.z = Math.cos(angle) * 0.95;
        } else if (isStardust) {
          // Floating in upper orb stratosphere with twinkle
          p.pos.x += Math.sin(elapsedTime * 0.6 + p.phase) * 0.008 * dt;
          p.pos.y += Math.cos(elapsedTime * 0.7 + p.phase) * 0.008 * dt;
          p.pos.z += Math.sin(elapsedTime * 0.5 + p.phase * 1.5) * 0.008 * dt;
        } else {
          // Default meadow blossom pollen & gentle dust:
          // Lazy buoyant thermal drift around vegetation
          p.pos.x += (p.vel.x + Math.sin(elapsedTime * 1.1 + p.phase) * 0.02) * dt;
          p.pos.y += (p.vel.y + Math.cos(elapsedTime * 0.9 + p.phase) * 0.015) * dt;
          p.pos.z += (p.vel.z + Math.sin(elapsedTime * 1.3 + p.phase * 0.8) * 0.02) * dt;

          const dist = p.pos.length();
          _dir.copy(p.pos).normalize();
          const surfR = this.terrain.getSurfaceRadiusAtDir(_dir);

          if (dist <= surfR + 0.006 || dist > 1.35) {
            p.pos.copy(_dir.multiplyScalar(surfR + 0.04 + Math.random() * 0.28));
          }
        }

        ambPosAttr.setXYZ(i, p.pos.x, p.pos.y, p.pos.z);
      }
      ambPosAttr.needsUpdate = true;
      ambColAttr.needsUpdate = true;
    }

    // 5. Update Alpine Mountain Frost & Spindrift
    const mountainWeight = this.weights.mountain_frost;
    this.frostMat.opacity = THREE.MathUtils.lerp(
      0.0,
      0.82 * intensityMult,
      mountainWeight,
    );

    if (this.frostMat.opacity > 0.005) {
      const frostPosAttr = this.frostPoints.geometry.attributes.position;
      const activeFrost = Math.floor(this.maxFrostCount * Math.min(1.0, intensityMult));

      for (let i = 0; i < activeFrost; i++) {
        const vel = this.frostVelocities[i];
        const fx = frostPosAttr.getX(i) + vel.x * dt;
        const fy = frostPosAttr.getY(i) + vel.y * dt;
        const fz = frostPosAttr.getZ(i) + vel.z * dt;

        _v1.set(fx, fy, fz);
        const dist = _v1.length();
        _dir.copy(_v1).normalize();
        const surfR = this.terrain.getSurfaceRadiusAtDir(_dir);

        if (dist <= surfR + 0.006 || dist > 1.25 || _v1.y < 0.2) {
          // Recycle near high northern alpine peak
          const angle = Math.random() * Math.PI * 2;
          const phi = 0.2 + Math.random() * 0.55;
          const r = surfR + 0.02 + Math.random() * 0.18;
          _v1.set(
            Math.sin(phi) * Math.cos(angle) * r,
            Math.cos(phi) * r,
            Math.sin(phi) * Math.sin(angle) * r,
          );
        }

        frostPosAttr.setXYZ(i, _v1.x, _v1.y, _v1.z);
      }
      frostPosAttr.needsUpdate = true;
    }
  }

  // ---------------------------------------------------------------------------
  // Transient Particle Burst Trigger
  // ---------------------------------------------------------------------------

  public triggerWeatherBurst(dir: THREE.Vector3, type: ActiveWeatherType) {
    _v2.copy(dir).normalize();
    const surfR = this.terrain.getSurfaceRadiusAtDir(_v2);
    const center = _v2.clone().multiplyScalar(surfR + 0.04);

    const count = 18;
    for (let i = 0; i < count; i++) {
      const idx = (Math.random() * this.ambientParticles.length) | 0;
      const p = this.ambientParticles[idx];
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 0.12,
        (Math.random() - 0.5) * 0.12,
        (Math.random() - 0.5) * 0.12,
      );
      p.pos.copy(center).add(offset);
      p.vel.copy(offset).normalize().multiplyScalar(0.08 + Math.random() * 0.08);
      if (type === 'snow') {
        p.color.set('#ffffff');
      } else if (type === 'rain') {
        p.color.set('#bde0fe');
      } else if (type === 'sea_spray') {
        p.color.set('#87e8de');
      } else if (type === 'embers') {
        p.color.set('#ffa940');
      } else {
        p.color.set('#ffe58f');
      }
    }
  }

  public dispose() {
    this.snowPoints.geometry.dispose();
    this.snowMat.dispose();
    this.rainPoints.geometry.dispose();
    this.rainMat.dispose();
    this.splashPoints.geometry.dispose();
    this.splashMat.dispose();
    this.ambientPoints.geometry.dispose();
    this.ambientMat.dispose();
    this.frostPoints.geometry.dispose();
    this.frostMat.dispose();
  }
}
