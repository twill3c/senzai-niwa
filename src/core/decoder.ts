// TS デコーダ(F-03)。Python 側 numpy_decode と同一の数式:
//   h1 = ReLU(W1·z + b1), h2 = ReLU(W2·h1 + b2), x = sigmoid(W3·h2 + b3)
// 正は丸め済み重みを読み戻した numpy float64(G-01)。ここはその写し。

import type { VaeModel } from "./model";

function affine(
  w: readonly (readonly number[])[],
  b: readonly number[],
  x: readonly number[],
  relu: boolean,
): number[] {
  const out = new Array<number>(w.length);
  for (let i = 0; i < w.length; i++) {
    const row = w[i];
    let s = b[i];
    for (let j = 0; j < row.length; j++) s += row[j] * x[j];
    out[i] = relu && s < 0 ? 0 : s;
  }
  return out;
}

/**
 * 潜在点 z(要素数 = meta.arch[0])から 784 ピクセル([0,1])を生成する。
 * 非有限値・要素数不正は TypeError(N-05)。範囲外の有限値は正常系(sigmoid が抑える)。
 */
export function decode(model: VaeModel, z: readonly number[]): number[] {
  if (z.length !== model.meta.arch[0]) {
    throw new TypeError(`z の要素数が不正: ${z.length}(期待 ${model.meta.arch[0]})`);
  }
  for (const v of z) {
    if (!Number.isFinite(v)) throw new TypeError(`z に非有限値: ${v}`);
  }
  const h1 = affine(model.w1, model.b1, z, true);
  const h2 = affine(model.w2, model.b2, h1, true);
  const logits = affine(model.w3, model.b3, h2, false);
  for (let i = 0; i < logits.length; i++) {
    logits[i] = 1 / (1 + Math.exp(-logits[i]));
  }
  return logits;
}
