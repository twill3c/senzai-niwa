// モデル資産の読み込みと形状検査(F-01 / G-02 / G-04)。
// 資産は training/train_vae.py だけが生成する(AGENTS.md §5)。
// fixtures.json はテスト専用のため、ここでは import しない(バンドルに載せない — fixtures.ts 参照)。

import weightsJson from "./model/weights.json";
import latentMapJson from "./model/latent_map.json";

export interface VaeMeta {
  arch: number[];
  seed: number;
  epochs: number;
  roundDecimals: number;
  reconBcePerPixel: number;
  latentRange: number;
  testCount: number;
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

export const MODEL: VaeModel = weightsJson as VaeModel;
export const LATENT_MAP: LatentMap = latentMapJson as LatentMap;

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
