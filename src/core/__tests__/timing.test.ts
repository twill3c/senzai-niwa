import { describe, expect, it } from "vitest";
import { MODEL } from "@/core/model";
import { decode } from "@/core/decoder";

// N-03 の実測用(閾値は置かない — 実測値を SPEC §4 に記録するための計測)。
// 環境依存の時間を assert するとフレークするため、ここでは有限性のみ検査する。

describe("decode timing (N-03 計測)", () => {
  it("decode 100 回の平均時間を計測してログに出す", () => {
    decode(MODEL, [0.1, -0.1]); // ウォームアップ(JIT)
    const t0 = performance.now();
    const N = 100;
    for (let i = 0; i < N; i++) {
      decode(MODEL, [Math.sin(i) * 2, Math.cos(i) * 2]);
    }
    const avg = (performance.now() - t0) / N;
    console.log(`decode avg: ${avg.toFixed(3)} ms/call (N=${N})`);
    expect(Number.isFinite(avg)).toBe(true);
  });
});
