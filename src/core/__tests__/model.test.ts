import { describe, expect, it } from "vitest";
import { expectedShapes, type LatentMap, type VaeModel } from "@/core/model";
import mnistWeights from "@/core/model/mnist/weights.json";
import mnistMap from "@/core/model/mnist/latent_map.json";
import kmnistWeights from "@/core/model/kmnist/weights.json";
import kmnistMap from "@/core/model/kmnist/latent_map.json";

// T-001 / T-005 / T-006 / T-015(F-01 / G-02 / G-03 / G-04 / F-09)
// T-014: 両庭の資産それぞれに適用する

const GARDENS = [
  {
    id: "mnist",
    model: mnistWeights as unknown as VaeModel,
    map: mnistMap as unknown as LatentMap,
    // G-03 較正 2026-09-02: 30 エポック 0.16716(合格)/ 1 エポック 0.19998(不合格)
    bceThreshold: 0.18,
    // mnist のクラス名は数字(SPEC F-09)
    classNames: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
  },
  {
    id: "kmnist",
    model: kmnistWeights as unknown as VaeModel,
    map: kmnistMap as unknown as LatentMap,
    // G-03 較正 2026-09-03: 30 エポック 0.33271(合格)/ 1 エポック対照 0.36208(不合格)
    bceThreshold: 0.345,
    // 出所: CODH の kmnist_classmap.csv(training/data/ に同梱・2026-09-03 取得)
    classNames: ["お", "き", "す", "つ", "な", "は", "ま", "や", "れ", "を"],
  },
];

describe.each(GARDENS)(
  "model assets [$id]",
  ({ model, map, bceThreshold, classNames }) => {
    // T-001: 重み JSON の形状検査。期待形状は meta.arch から導出する(定数で書かない — HC-016)
    it("重みの形状が meta.arch から導出した形状と一致し全て有限値", () => {
      const s = expectedShapes(model.meta.arch);
      expect(model.meta.arch.length).toBe(4);
      expect(model.meta.arch[0]).toBe(2); // 潜在 2 次元だけは SPEC F-02 の固定仕様
      const layers = [
        { w: model.w1, b: model.b1, shape: s[0] },
        { w: model.w2, b: model.b2, shape: s[1] },
        { w: model.w3, b: model.b3, shape: s[2] },
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

    // T-005: 再構成の質(G-03)。閾値は庭ごとに較正(GARDENS の定義にコメントで出所)
    it("meta.reconBcePerPixel が較正閾値未満の有限な正の値", () => {
      expect(Number.isFinite(model.meta.reconBcePerPixel)).toBe(true);
      expect(model.meta.reconBcePerPixel).toBeGreaterThan(0);
      expect(model.meta.reconBcePerPixel).toBeLessThan(bceThreshold);
    });

    // T-006: 潜在地図の整合(G-04)。件数は配列長から導出し定数で書かない
    it("潜在地図は [x, y, label] の非空配列で座標は有限・ラベルは 0〜9 の整数", () => {
      expect(map.points.length).toBeGreaterThan(0);
      let bad = 0;
      for (const p of map.points) {
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
      expect(map.points.length).toBe(model.meta.testCount);
    });

    // T-015: クラス名の整合(F-09 / G-04)
    it("meta.classNames が 10 件・重複なしで期待の名簿と一致する", () => {
      expect(model.meta.classNames).toEqual(classNames);
      expect(new Set(model.meta.classNames).size).toBe(10);
      for (const n of model.meta.classNames) expect(n.length).toBeGreaterThan(0);
    });
  },
);
