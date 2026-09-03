// 庭(データセット)の切替(F-09)。資産は動的 import で必要な庭だけ読み込む。
// 静的 import で両庭を束ねるとクライアントバンドルが倍(重み JSON 約 5.4MB × 2)になるため。

import type { LatentMap, VaeModel } from "@/core/model";

export type GardenId = "mnist" | "kmnist";

export const GARDEN_IDS: readonly GardenId[] = ["mnist", "kmnist"] as const;

export const GARDEN_LABELS: Record<GardenId, string> = {
  mnist: "数字の庭",
  kmnist: "くずし字の庭",
};

export interface GardenAssets {
  model: VaeModel;
  latentMap: LatentMap;
}

export async function loadGarden(id: GardenId): Promise<GardenAssets> {
  if (id === "kmnist") {
    const [w, m] = await Promise.all([
      import("@/core/model/kmnist/weights.json"),
      import("@/core/model/kmnist/latent_map.json"),
    ]);
    return {
      model: w.default as unknown as VaeModel,
      latentMap: m.default as unknown as LatentMap,
    };
  }
  const [w, m] = await Promise.all([
    import("@/core/model/mnist/weights.json"),
    import("@/core/model/mnist/latent_map.json"),
  ]);
  return {
    model: w.default as unknown as VaeModel,
    latentMap: m.default as unknown as LatentMap,
  };
}
