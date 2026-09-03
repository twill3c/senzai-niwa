import { describe, expect, it } from "vitest";
import type { VaeModel } from "@/core/model";
import { FIXTURES_BY_GARDEN } from "@/core/fixtures";
import { decode } from "@/core/decoder";
import mnistWeights from "@/core/model/mnist/weights.json";
import kmnistWeights from "@/core/model/kmnist/weights.json";

// T-002 / T-003 / T-004 / T-007 / T-009(F-03 / G-01 / G-02 / N-05)
// T-014: 両庭(mnist / kmnist)の資産それぞれに適用する(SPEC §4 loop_004 拡張)

const GARDENS = [
  { id: "mnist" as const, model: mnistWeights as unknown as VaeModel },
  { id: "kmnist" as const, model: kmnistWeights as unknown as VaeModel },
];

function maxAbsDiff(a: readonly number[], b: readonly number[]): number {
  let m = 0;
  for (let i = 0; i < a.length; i++) m = Math.max(m, Math.abs(a[i] - b[i]));
  return m;
}

describe.each(GARDENS)("decode — 二実装照合(G-01)[$id]", ({ id, model }) => {
  const fixtures = FIXTURES_BY_GARDEN[id];

  // T-002: 正は train_vae.py が丸め済み重みを numpy float64 で読み戻して再計算した値
  // (TEST_SPEC 実行規約)。走査対象が空でないことも確かめる(HC-041)
  it("フィクスチャ全潜在点で Python 再計算値と最大絶対誤差 < 1e-9", () => {
    expect(fixtures.samples.length).toBeGreaterThan(0);
    for (const s of fixtures.samples) {
      const out = decode(model, s.z);
      expect(out.length).toBe(s.pixels.length);
      expect(maxAbsDiff(out, s.pixels)).toBeLessThan(1e-9);
    }
  });

  // T-009: 陽性対照 — 照合器が実際に撃つことの確認(HC-041)。
  // b3 の 1 要素を 1e-3 ずらすと、その画素の生成値が閾値 1e-9 を超えて動くはず。
  // ただし飽和画素(σ' ≈ 0)では発火しないため、中間調の画素で行う。
  // その前提(中間調画素の存在)自体を assert で固定する(HC-070)
  it("重みを崩した decode は照合に失敗する(陽性対照)", () => {
    const s = fixtures.samples[0];
    const midIdx = s.pixels.findIndex((v) => v > 0.05 && v < 0.95);
    expect(midIdx).toBeGreaterThanOrEqual(0); // 前提: 中間調画素が存在する
    const broken: VaeModel = {
      ...model,
      b3: model.b3.map((v, i) => (i === midIdx ? v + 1e-3 : v)),
    };
    const out = decode(broken, s.z);
    expect(Math.abs(out[midIdx] - s.pixels[midIdx])).toBeGreaterThan(1e-9);
  });

  // T-003: 決定論(G-02)
  it("同一 z で decode を 2 回呼ぶと深い等値", () => {
    const a = decode(model, [0.5, -1.25]);
    const b = decode(model, [0.5, -1.25]);
    expect(a).toEqual(b);
  });

  // T-004: 縁の仕様(N-05)— 非有限値は TypeError、範囲外の有限値は正常系
  it("非有限値・要素数不正の z は TypeError", () => {
    expect(() => decode(model, [NaN, 0])).toThrow(TypeError);
    expect(() => decode(model, [0, Infinity])).toThrow(TypeError);
    expect(() => decode(model, [0, -Infinity])).toThrow(TypeError);
    expect(() => decode(model, [0, 0, 0])).toThrow(TypeError);
    expect(() => decode(model, [0])).toThrow(TypeError);
  });

  // T-004 + T-007: 範囲外でも有限で [0,1](sigmoid の値域 — SPEC F-02)
  it("範囲外の有限 z([-10,10])でも全出力が [0,1] の有限値", () => {
    for (const z of [
      [-10, -10],
      [10, 10],
      [-10, 10],
      [0, 0],
    ]) {
      const out = decode(model, z);
      expect(out.length).toBe(model.meta.arch[model.meta.arch.length - 1]);
      for (const v of out) {
        expect(Number.isFinite(v)).toBe(true);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });
});
