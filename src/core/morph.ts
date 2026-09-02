// モーフ補間(F-06)。2 潜在点の線形補間。u は [0,1] に clamp、非有限値は TypeError(N-05)。

function assertFinite(vs: readonly number[], name: string): void {
  for (const v of vs) {
    if (!Number.isFinite(v)) throw new TypeError(`${name} に非有限値: ${v}`);
  }
}

/** a→b の線形補間。u=0 で a、u=1 で b。u は [0,1] に clamp */
export function morphZ(
  a: readonly number[],
  b: readonly number[],
  u: number,
): number[] {
  assertFinite(a, "morphZ の a");
  assertFinite(b, "morphZ の b");
  assertFinite([u], "morphZ の u");
  const t = u < 0 ? 0 : u > 1 ? 1 : u;
  return a.map((v, i) => v + (b[i] - v) * t);
}
