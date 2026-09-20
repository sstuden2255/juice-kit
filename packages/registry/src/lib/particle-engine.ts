/**
 * ParticleEngine: a small canvas-2D particle system for celebratory effects.
 *
 * Particles are drawn on a <canvas>, never as DOM nodes, so bursts of hundreds of particles
 * stay off the layout and compositor paths. The engine is framework-agnostic and dependency
 * free; `ParticleCanvas` (ui/particle-canvas.tsx) wraps it for React.
 */

export type ParticleShape = "circle" | "square" | "triangle" | "star";

type Range = number | readonly [min: number, max: number];

export interface EmitOptions {
  /** Origin, in CSS pixels from the canvas's top-left corner. */
  x: number;
  y: number;
  /** Particles to spawn. Default 40. */
  count?: number;
  /** Fill colors, picked at random per particle. Any CSS color canvas understands. */
  colors?: readonly string[];
  /** Initial speed in px/s, a number or [min, max]. Default [220, 620]. */
  speed?: Range;
  /** Direction of the emission center in degrees: 0 = right, -90 = up. Default -90. */
  angle?: number;
  /** Total arc around `angle` in degrees. 360 is an omnidirectional burst. Default 360. */
  spread?: number;
  /** Downward acceleration in px/s². Default 900. */
  gravity?: number;
  /** Fraction of velocity lost per second, 0..1. Default 0.35. */
  drag?: number;
  /** Particle size in px, a number or [min, max]. Default [4, 10]. */
  size?: Range;
  /** Lifetime in seconds, a number or [min, max]. Default [0.6, 1.2]. */
  lifetime?: Range;
  /** Shapes to pick from at random. Default ["circle", "square"]. */
  shapes?: readonly ParticleShape[];
  /** Maximum angular speed in rad/s (each particle gets a random spin in ±spin). Default 8. */
  spin?: number;
  /** Shrink particles as they age. Default true. */
  scaleOut?: boolean;
}

export interface ParticleEngineOptions {
  /** Upper bound on simultaneously alive particles. Default 600. */
  maxParticles?: number;
  /** Override the device pixel ratio (clamped to 1..3). Default window.devicePixelRatio. */
  devicePixelRatio?: number;
  /** Frame scheduler override, for tests or custom loops. Default requestAnimationFrame. */
  requestFrame?: (callback: (time: number) => void) => number;
  cancelFrame?: (handle: number) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  color: string;
  shape: ParticleShape;
  rotation: number;
  spin: number;
  gravity: number;
  drag: number;
  scaleOut: boolean;
}

export const DEFAULT_PARTICLE_COLORS: readonly string[] = [
  "#f5c542",
  "#ff7a59",
  "#7c5cff",
  "#3ddc97",
  "#ff5c8a",
  "#4cc9f0",
];

const MAX_FRAME_DT = 0.05;

function pick<T>(values: readonly T[], fallback: T): T {
  if (values.length === 0) return fallback;
  return values[Math.floor(Math.random() * values.length)] ?? fallback;
}

function sample(range: Range): number {
  if (typeof range === "number") return range;
  const [min, max] = range;
  return min + Math.random() * (max - min);
}

function clampDpr(value: number | undefined): number {
  const dpr = value ?? (typeof window !== "undefined" ? window.devicePixelRatio : 1) ?? 1;
  return Math.min(3, Math.max(1, dpr || 1));
}

export class ParticleEngine {
  readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D | null;
  private readonly maxParticles: number;
  private readonly dpr: number;
  private readonly requestFrame: (callback: (time: number) => void) => number;
  private readonly cancelFrame: (handle: number) => void;

  private particles: Particle[] = [];
  private width = 0;
  private height = 0;
  private frameHandle: number | null = null;
  private lastTime: number | null = null;
  private disposed = false;

  constructor(canvas: HTMLCanvasElement, options: ParticleEngineOptions = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.maxParticles = Math.max(1, options.maxParticles ?? 600);
    this.dpr = clampDpr(options.devicePixelRatio);
    // Outside a browser there is no frame loop; `tick()` can still be driven manually.
    this.requestFrame =
      options.requestFrame ??
      ((callback) =>
        typeof requestAnimationFrame === "function" ? requestAnimationFrame(callback) : -1);
    this.cancelFrame =
      options.cancelFrame ??
      ((handle) => {
        if (handle >= 0 && typeof cancelAnimationFrame === "function") cancelAnimationFrame(handle);
      });
    this.resize(canvas.clientWidth || canvas.width, canvas.clientHeight || canvas.height);
  }

  /** Number of particles currently alive. */
  get activeCount(): number {
    return this.particles.length;
  }

  /** Canvas size in CSS pixels. */
  get size(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  /** Resize the backing store to `width` × `height` CSS pixels at the device pixel ratio. */
  resize(width: number, height: number): void {
    this.width = Math.max(0, Math.floor(width));
    this.height = Math.max(0, Math.floor(height));
    this.canvas.width = Math.max(1, Math.round(this.width * this.dpr));
    this.canvas.height = Math.max(1, Math.round(this.height * this.dpr));
    this.ctx?.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  /** Omnidirectional burst: confetti pop, achievement unlock. */
  burst(options: EmitOptions): void {
    this.emit({ spread: 360, ...options });
  }

  /** Upward cone with strong gravity: fountain, level-up geyser. */
  fountain(options: EmitOptions): void {
    this.emit({
      angle: -90,
      spread: 55,
      speed: [520, 920],
      gravity: 1500,
      lifetime: [0.9, 1.5],
      ...options,
    });
  }

  /** Directional emission with full control over the arc. */
  emit(options: EmitOptions): void {
    if (this.disposed || !this.ctx) return;
    const count = Math.max(0, Math.floor(options.count ?? 40));
    const colors = options.colors ?? DEFAULT_PARTICLE_COLORS;
    const shapes = options.shapes ?? (["circle", "square"] as const);
    const speed = options.speed ?? ([220, 620] as const);
    const size = options.size ?? ([4, 10] as const);
    const lifetime = options.lifetime ?? ([0.6, 1.2] as const);
    const angle = ((options.angle ?? -90) * Math.PI) / 180;
    const spread = ((options.spread ?? 360) * Math.PI) / 180;
    const gravity = options.gravity ?? 900;
    const drag = Math.min(1, Math.max(0, options.drag ?? 0.35));
    const spin = options.spin ?? 8;
    const scaleOut = options.scaleOut ?? true;

    for (let i = 0; i < count; i += 1) {
      if (this.particles.length >= this.maxParticles) {
        // Recycle the oldest particle instead of dropping the new one.
        this.particles.shift();
      }
      const theta = angle + (Math.random() - 0.5) * spread;
      const velocity = sample(speed);
      this.particles.push({
        x: options.x,
        y: options.y,
        vx: Math.cos(theta) * velocity,
        vy: Math.sin(theta) * velocity,
        age: 0,
        life: Math.max(0.05, sample(lifetime)),
        size: Math.max(0.5, sample(size)),
        color: pick(colors, DEFAULT_PARTICLE_COLORS[0] ?? "#f5c542"),
        shape: pick(shapes, "circle"),
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() * 2 - 1) * spin,
        gravity,
        drag,
        scaleOut,
      });
    }
    this.schedule();
  }

  /**
   * Advance the simulation by `dt` seconds and redraw. The internal loop calls this every
   * frame; tests and custom loops may call it directly. Returns the alive count.
   */
  tick(dt: number): number {
    const ctx = this.ctx;
    if (!ctx) return 0;
    const step = Math.min(MAX_FRAME_DT, Math.max(0, dt));

    ctx.clearRect(0, 0, this.width, this.height);

    let write = 0;
    for (let read = 0; read < this.particles.length; read += 1) {
      const p = this.particles[read];
      if (!p) continue;
      p.age += step;
      if (p.age >= p.life) continue;
      const retain = Math.pow(1 - p.drag, step);
      p.vx *= retain;
      p.vy = p.vy * retain + p.gravity * step;
      p.x += p.vx * step;
      p.y += p.vy * step;
      p.rotation += p.spin * step;
      this.draw(ctx, p);
      this.particles[write] = p;
      write += 1;
    }
    this.particles.length = write;
    return write;
  }

  /** Remove every particle and clear the canvas. */
  clear(): void {
    this.particles.length = 0;
    this.ctx?.clearRect(0, 0, this.width, this.height);
    this.stop();
  }

  /** Stop the loop and release the canvas. The engine cannot be reused afterwards. */
  dispose(): void {
    this.clear();
    this.disposed = true;
  }

  private draw(ctx: CanvasRenderingContext2D, p: Particle): void {
    const t = p.age / p.life;
    const alpha = 1 - t * t;
    const scale = p.scaleOut ? 1 - t * 0.8 : 1;
    const half = (p.size * scale) / 2;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.beginPath();
    switch (p.shape) {
      case "square":
        ctx.fillRect(-half, -half, half * 2, half * 2);
        break;
      case "triangle":
        ctx.moveTo(0, -half);
        ctx.lineTo(half, half);
        ctx.lineTo(-half, half);
        ctx.closePath();
        ctx.fill();
        break;
      case "star": {
        const inner = half * 0.45;
        for (let i = 0; i < 10; i += 1) {
          const radius = i % 2 === 0 ? half : inner;
          const a = (i * Math.PI) / 5 - Math.PI / 2;
          const px = Math.cos(a) * radius;
          const py = Math.sin(a) * radius;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        break;
      }
      default:
        ctx.arc(0, 0, half, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
  }

  private schedule(): void {
    if (this.frameHandle !== null || this.disposed) return;
    const handle = this.requestFrame((time) => this.frame(time));
    this.frameHandle = handle >= 0 ? handle : null;
  }

  private frame(time: number): void {
    this.frameHandle = null;
    const dt = this.lastTime === null ? 1 / 60 : (time - this.lastTime) / 1000;
    this.lastTime = time;
    const alive = this.tick(dt);
    if (alive > 0) {
      this.schedule();
    } else {
      this.lastTime = null;
    }
  }

  private stop(): void {
    if (this.frameHandle !== null) {
      this.cancelFrame(this.frameHandle);
      this.frameHandle = null;
    }
    this.lastTime = null;
  }
}
