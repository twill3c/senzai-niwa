import { describe, expect, it } from "vitest";
import { morphZ } from "@/core/morph";
import { gridLatents } from "@/core/grid";

// T-012 / T-013(F-06 / F-07)

describe("morphZ(F-06)", () => {
  const a = [-1.5, 2];
  const b = [2.5, -1];

  // 出所: SPEC F-06 — 線形補間の定義(端点・中点は代数的に導出できる)
  it("端点と中点が線形補間の定義どおり", () => {
    expect(morphZ(a, b, 0)).toEqual(a);
    expect(morphZ(a, b, 1)).toEqual(b);
    expect(morphZ(a, b, 0.5)).toEqual([0.5, 0.5]);
  });

  it("u は [0,1] に clamp される", () => {
    expect(morphZ(a, b, -0.5)).toEqual(a);
    expect(morphZ(a, b, 1.5)).toEqual(b);
  });

  it("決定論(同一入力 → 深い等値)", () => {
    expect(morphZ(a, b, 0.3)).toEqual(morphZ(a, b, 0.3));
  });

  it("非有限値は TypeError(N-05)", () => {
    expect(() => morphZ([NaN, 0], b, 0.5)).toThrow(TypeError);
    expect(() => morphZ(a, [0, Infinity], 0.5)).toThrow(TypeError);
    expect(() => morphZ(a, b, NaN)).toThrow(TypeError);
  });
});

describe("gridLatents(F-07)", () => {
  it("n² 点・行優先で左上 (-r,+r)・右下 (+r,-r)", () => {
    const n = 5;
    const r = 3;
    const g = gridLatents(n, r);
    expect(g.length).toBe(n * n);
    expect(g[0]).toEqual([-r, r]);
    expect(g[n - 1]).toEqual([r, r]);
    expect(g[n * n - 1]).toEqual([r, -r]);
  });

  it("全点が有限で重複しない(集合サイズ = n²)", () => {
    const g = gridLatents(15, 3);
    const keys = new Set(g.map((z) => z.join(",")));
    expect(keys.size).toBe(15 * 15);
    for (const z of g) {
      expect(Number.isFinite(z[0])).toBe(true);
      expect(Number.isFinite(z[1])).toBe(true);
    }
  });

  it("不正な引数(n < 2・非有限 r)は TypeError(N-05)", () => {
    expect(() => gridLatents(1, 3)).toThrow(TypeError);
    expect(() => gridLatents(15, NaN)).toThrow(TypeError);
  });
});
