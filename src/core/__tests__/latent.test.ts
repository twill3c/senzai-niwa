import { describe, expect, it } from "vitest";
import { clampLatent, latentToScreen, screenToLatent } from "@/core/latent";

// T-008(F-04)— 画面座標 ↔ 潜在座標の変換

const SIZE = 480;
const RANGE = 3;

describe("latent coordinate transforms", () => {
  it("往復で一致する(範囲内の潜在点)", () => {
    for (const z of [
      [0, 0],
      [1.5, -2.25],
      [-3, 3],
      [2.999, -0.001],
    ]) {
      const [px, py] = latentToScreen(z, SIZE, RANGE);
      const back = screenToLatent(px, py, SIZE, RANGE);
      expect(back[0]).toBeCloseTo(z[0], 9);
      expect(back[1]).toBeCloseTo(z[1], 9);
    }
  });

  it("画面の四隅が潜在平面の四隅に写る(y は上が正)", () => {
    // 出所: SPEC F-04 — 平面は [-RANGE, RANGE]²。canvas の y は下向きなので反転
    expect(screenToLatent(0, 0, SIZE, RANGE)).toEqual([-RANGE, RANGE]);
    expect(screenToLatent(SIZE, SIZE, SIZE, RANGE)).toEqual([RANGE, -RANGE]);
  });

  it("範囲外の画面座標は clamp される", () => {
    const [x, y] = screenToLatent(-100, SIZE + 100, SIZE, RANGE);
    expect(x).toBe(-RANGE);
    expect(y).toBe(-RANGE);
  });

  it("clampLatent は範囲内をそのまま・範囲外を境界へ・非有限値は TypeError(N-05)", () => {
    expect(clampLatent([1, -1], RANGE)).toEqual([1, -1]);
    expect(clampLatent([5, -5], RANGE)).toEqual([RANGE, -RANGE]);
    expect(() => clampLatent([NaN, 0], RANGE)).toThrow(TypeError);
    expect(() => clampLatent([0, Infinity], RANGE)).toThrow(TypeError);
  });

  it("screenToLatent の非有限入力は TypeError(N-05)", () => {
    expect(() => screenToLatent(NaN, 0, SIZE, RANGE)).toThrow(TypeError);
  });
});
