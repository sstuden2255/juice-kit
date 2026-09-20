import { describe, expect, test, vi } from "vitest";
import { getContextMock } from "../../test/canvas-mock";
import { ParticleEngine } from "./particle-engine";

function makeEngine(options: ConstructorParameters<typeof ParticleEngine>[1] = {}) {
  const canvas = document.createElement("canvas");
  const frames: Array<(time: number) => void> = [];
  const engine = new ParticleEngine(canvas, {
    devicePixelRatio: 2,
    requestFrame: (cb) => {
      frames.push(cb);
      return frames.length;
    },
    cancelFrame: () => {},
    ...options,
  });
  engine.resize(300, 150);
  return { engine, canvas, frames, ctx: getContextMock(canvas)! };
}

describe("ParticleEngine", () => {
  test("resize scales the backing store by the device pixel ratio", () => {
    const { engine, canvas, ctx } = makeEngine();
    expect(canvas.width).toBe(600);
    expect(canvas.height).toBe(300);
    expect(engine.size).toEqual({ width: 300, height: 150 });
    expect(ctx.setTransform).toHaveBeenLastCalledWith(2, 0, 0, 2, 0, 0);
  });

  test("burst spawns the requested count and schedules a frame", () => {
    const { engine, frames } = makeEngine();
    engine.burst({ x: 10, y: 10, count: 25 });
    expect(engine.activeCount).toBe(25);
    expect(frames).toHaveLength(1);
  });

  test("particles age out after their lifetime", () => {
    const { engine } = makeEngine();
    engine.burst({ x: 0, y: 0, count: 10, lifetime: 0.1 });
    expect(engine.tick(0.05)).toBe(10);
    expect(engine.tick(0.05)).toBe(0);
    expect(engine.activeCount).toBe(0);
  });

  test("tick draws every alive particle and clears the canvas first", () => {
    const { engine, ctx } = makeEngine();
    engine.burst({ x: 5, y: 5, count: 7, shapes: ["circle"], lifetime: 1 });
    engine.tick(0.016);
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 300, 150);
    expect(ctx.arc).toHaveBeenCalledTimes(7);
    expect(ctx.fill).toHaveBeenCalledTimes(7);
  });

  test("gravity pulls particles downward over time", () => {
    const { engine, ctx } = makeEngine();
    engine.emit({ x: 100, y: 100, count: 1, speed: 0, gravity: 1000, drag: 0, lifetime: 5 });
    engine.tick(0.05);
    const firstY = (ctx.translate.mock.calls[0] as [number, number])[1];
    for (let i = 0; i < 10; i += 1) engine.tick(0.05);
    const lastY = (ctx.translate.mock.calls.at(-1) as [number, number])[1];
    expect(lastY).toBeGreaterThan(firstY);
  });

  test("respects maxParticles by recycling the oldest", () => {
    const { engine } = makeEngine({ maxParticles: 50 });
    engine.burst({ x: 0, y: 0, count: 80 });
    expect(engine.activeCount).toBe(50);
  });

  test("the frame loop keeps running until every particle is dead", () => {
    const { engine, frames } = makeEngine();
    engine.burst({ x: 0, y: 0, count: 3, lifetime: 0.03 });
    frames.shift()!(1000);
    expect(frames).toHaveLength(1);
    frames.shift()!(1050);
    expect(engine.activeCount).toBe(0);
    expect(frames).toHaveLength(0);
  });

  test("clear removes particles, dispose refuses new emissions", () => {
    const { engine } = makeEngine();
    engine.burst({ x: 0, y: 0, count: 5 });
    engine.clear();
    expect(engine.activeCount).toBe(0);
    engine.dispose();
    engine.burst({ x: 0, y: 0, count: 5 });
    expect(engine.activeCount).toBe(0);
  });

  test("is inert without a 2D context", () => {
    const canvas = document.createElement("canvas");
    const spy = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    try {
      const engine = new ParticleEngine(canvas);
      engine.burst({ x: 0, y: 0, count: 5 });
      expect(engine.activeCount).toBe(0);
      expect(engine.tick(0.016)).toBe(0);
    } finally {
      spy.mockRestore();
    }
  });
});
