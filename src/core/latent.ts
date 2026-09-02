// 画面座標 ↔ 潜在座標の変換(F-04 / T-008)。
// 潜在平面は [-range, range]²。canvas の y は下向きなので潜在 y と反転させる。

function assertFinite(vs: readonly number[], name: string): void {
  for (const v of vs) {
    if (!Number.isFinite(v)) throw new TypeError(`${name} に非有限値: ${v}`);
  }
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** 画面座標(px, py)∈ [0, size]² → 潜在座標。範囲外は clamp(N-05) */
export function screenToLatent(
  px: number,
  py: number,
  size: number,
  range: number,
): number[] {
  assertFinite([px, py, size, range], "screenToLatent の引数");
  const x = clamp01(px / size) * 2 * range - range;
  const y = range - clamp01(py / size) * 2 * range;
  return [x, y];
}

/** 潜在座標 → 画面座標。潜在側の範囲外もそのまま写す(呼び手が clampLatent する) */
export function latentToScreen(
  z: readonly number[],
  size: number,
  range: number,
): number[] {
  assertFinite(z, "latentToScreen の z");
  assertFinite([size, range], "latentToScreen の引数");
  const px = ((z[0] + range) / (2 * range)) * size;
  const py = ((range - z[1]) / (2 * range)) * size;
  return [px, py];
}

/** 潜在座標を [-range, range]² へ clamp。非有限値は TypeError(N-05) */
export function clampLatent(z: readonly number[], range: number): number[] {
  assertFinite(z, "clampLatent の z");
  return z.map((v) => (v < -range ? -range : v > range ? range : v));
}
