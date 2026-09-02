import { describe, expect, it } from "vitest";
import { LATENT_MAP, MODEL, expectedShapes } from "@/core/model";

// T-001 / T-005 / T-006(F-01 / G-02 / G-03 / G-04)

describe("model assets", () => {
  // T-001: 重み JSON の形状検査。期待形状は meta.arch から導出する(定数で書かない — HC-016)
  it("重みの形状が meta.arch から導出した形状と一致し全て有限値", () => {
    const s = expectedShapes(MODEL.meta.arch);
    expect(MODEL.meta.arch.length).toBe(4);
    expect(MODEL.meta.arch[0]).toBe(2); // 潜在 2 次元だけは SPEC F-02 の固定仕様
    const layers = [
      { w: MODEL.w1, b: MODEL.b1, shape: s[0] },
      { w: MODEL.w2, b: MODEL.b2, shape: s[1] },
      { w: MODEL.w3, b: MODEL.b3, shape: s[2] },
    ];
    // 有限性は 50 万要素の全数走査になるため、expect を要素ごとに呼ばず件数で検査する
    for (const { w, b, shape } of layers) {
      expect(w.length).toBe(shape.rows);
      let badShape = 0;
      let nonFinite = 0;
      for (const row of w) {
        if (row.length !== shape.cols) badShape++;
        for (const v of row) if (!Number.isFinite(v)) nonFinite++;
      }
      expect(b.length).toBe(shape.rows);
      for (const v of b) if (!Number.isFinite(v)) nonFinite++;
      expect(badShape).toBe(0);
      expect(nonFinite).toBe(0);
    }
  });

  // T-005: 再構成の質(G-03)。閾値 0.18 は較正済み —
  // 実測 2026-09-02: 30 エポック 0.16716(合格)/ 1 エポック 0.19998(不合格)。
  // 学習不足・資産の壊れをここで捕まえる(SPEC §4)
  it("meta.reconBcePerPixel が較正閾値 0.18 未満の有限な正の値", () => {
    expect(Number.isFinite(MODEL.meta.reconBcePerPixel)).toBe(true);
    expect(MODEL.meta.reconBcePerPixel).toBeGreaterThan(0);
    expect(MODEL.meta.reconBcePerPixel).toBeLessThan(0.18);
  });

  // T-006: 潜在地図の整合(G-04)。件数は配列長から導出し定数で書かない
  it("潜在地図は [x, y, label] の非空配列で座標は有限・ラベルは 0〜9 の整数", () => {
    expect(LATENT_MAP.points.length).toBeGreaterThan(0);
    let bad = 0;
    for (const p of LATENT_MAP.points) {
      const ok =
        p.length === 3 &&
        Number.isFinite(p[0]) &&
        Number.isFinite(p[1]) &&
        Number.isInteger(p[2]) &&
        p[2] >= 0 &&
        p[2] <= 9;
      if (!ok) bad++;
    }
    expect(bad).toBe(0);
    // meta.testCount との突合(G-04 — 件数は双方ともデータ由来)
    expect(LATENT_MAP.points.length).toBe(MODEL.meta.testCount);
  });
});
