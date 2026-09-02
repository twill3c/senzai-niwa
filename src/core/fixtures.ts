// 照合フィクスチャ(G-01)。テスト専用 — src/app / src/components から import してはならない
// (クライアントバンドルに ~1MB のフィクスチャが載ってしまう)。

import fixturesJson from "./model/fixtures.json";

export interface FixtureSample {
  z: number[];
  pixels: number[];
}

export interface Fixtures {
  samples: FixtureSample[];
}

export const FIXTURES: Fixtures = fixturesJson as Fixtures;
