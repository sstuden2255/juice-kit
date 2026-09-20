import { vi } from "vitest";

/** The subset of CanvasRenderingContext2D the particle engine uses, recorded as spies. */
export function createContextMock() {
  return {
    canvas: null as HTMLCanvasElement | null,
    globalAlpha: 1,
    fillStyle: "#000",
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    arc: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
  };
}

export type ContextMock = ReturnType<typeof createContextMock>;

const contexts = new WeakMap<HTMLCanvasElement, ContextMock>();

/** jsdom's getContext returns null (and logs) without the optional canvas package; stub it. */
export function installCanvasMock(): void {
  HTMLCanvasElement.prototype.getContext = vi.fn(function (this: HTMLCanvasElement) {
    let ctx = contexts.get(this);
    if (!ctx) {
      ctx = createContextMock();
      ctx.canvas = this;
      contexts.set(this, ctx);
    }
    return ctx;
  }) as unknown as HTMLCanvasElement["getContext"];
}

export function getContextMock(canvas: HTMLCanvasElement): ContextMock | undefined {
  return contexts.get(canvas);
}
