// モデル資産の型と形状検査(F-01 / G-02 / G-04)。
// 資産は training/train_vae.py だけが生成する(AGENTS.md §5)。
// 資産の実体は src/core/model/<garden>/ にあり、クライアントは src/lib/gardens.ts の
// 動的 import で必要な庭だけを読み込む(F-09 — 両庭を静的 import するとバンドルが倍になる)。
// fixtures.json はテスト専用のため、ここでは import しない(fixtures.ts 参照)。

export interface VaeMeta {
  arch: number[];
  seed: number;
  epochs: number;
  roundDecimals: number;
  reconBcePerPixel: number;
  latentRange: number;
  testCount: number;
  /** クラス 0〜9 の表示名。kmnist は配布元 classmap 由来・mnist は数字(F-09/G-04) */
  classNames: string[];
}

export interface VaeModel {
  meta: VaeMeta;
  w1: number[][];
  b1: number[];
  w2: number[][];
  b2: number[];
  w3: number[][];
  b3: number[];
}

/** 潜在地図の 1 点: [x, y, label] */
export type LatentPoint = number[];

export interface LatentMap {
  points: LatentPoint[];
}

/** meta.arch([in, h1, h2, out])から各層の重み行列の期待形状を導出する(T-001) */
export function expectedShapes(
  arch: readonly number[],
): { rows: number; cols: number }[] {
  const shapes: { rows: number; cols: number }[] = [];
  for (let i = 1; i < arch.length; i++) {
    shapes.push({ rows: arch[i], cols: arch[i - 1] });
  }
  return shapes;
}
