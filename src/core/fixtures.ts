// 照合フィクスチャ(G-01)。テスト専用 — src/app / src/components から import してはならない
// (クライアントバンドルにフィクスチャが載ってしまう)。両庭ぶんを束ねる(T-014)。

import mnistFixtures from "./model/mnist/fixtures.json";
import kmnistFixtures from "./model/kmnist/fixtures.json";

export interface FixtureSample {
  z: number[];
  pixels: number[];
}

export interface Fixtures {
  samples: FixtureSample[];
}

export const FIXTURES_BY_GARDEN: Record<"mnist" | "kmnist", Fixtures> = {
  mnist: mnistFixtures as Fixtures,
  kmnist: kmnistFixtures as Fixtures,
};
