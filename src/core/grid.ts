// 格子俯瞰の潜在点列(F-07)。n×n を行優先で返す。左上が (-r, +r)、右下が (+r, -r)
// (潜在 y は上が正 — latent.ts と同じ向き)。

export function gridLatents(n: number, range: number): number[][] {
  if (!Number.isInteger(n) || n < 2) {
    throw new TypeError(`格子数が不正: ${n}(2 以上の整数)`);
  }
  if (!Number.isFinite(range) || range <= 0) {
    throw new TypeError(`range が不正: ${range}`);
  }
  const out: number[][] = [];
  for (let row = 0; row < n; row++) {
    const y = range - (2 * range * row) / (n - 1);
    for (let col = 0; col < n; col++) {
      const x = -range + (2 * range * col) / (n - 1);
      out.push([x, y]);
    }
  }
  return out;
}
