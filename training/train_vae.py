# train_vae.py — MNIST VAE(潜在 2 次元)の学習とモデル資産の生成(F-01 / F-02)
#
# 二実装照合の契約(TEST_SPEC 実行規約):
#   フィクスチャのピクセル値・再構成 BCE は、丸め済みデコーダ重みを numpy float64 で
#   「読み戻して」計算する。丸め前の torch 重みで計算すると TS 側(丸め済み JSON を読む)と
#   照合できない。学習は torch、正は numpy、被験は TS — オラクルは循環しない(G-01)。
#
# 使い方:
#   training/.venv/Scripts/python.exe training/train_vae.py --data training/data --out src/core/model
#
# 依存: torch(CPU)+ numpy。シード固定。

import argparse
import gzip
import json
import struct
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

SEED = 1
ENC_HIDDEN = (512, 256)
DEC_HIDDEN = (256, 512)
LATENT = 2
EPOCHS = 30
BATCH = 128
LR = 1e-3
ROUND_DECIMALS = 6
LATENT_RANGE = 3.0
N_GRID = 6          # フィクスチャ格子 6×6([-2,2]²)
N_RANDOM = 28       # + N(0,1) 乱数 28 点 = 計 64 点
MAP_DECIMALS = 3    # 潜在地図の座標丸め(表示用途のみ・照合には使わない)


def load_idx_images(path: Path) -> np.ndarray:
    with gzip.open(path, "rb") as f:
        magic, n, rows, cols = struct.unpack(">IIII", f.read(16))
        assert magic == 2051, f"images magic mismatch: {magic}"
        data = np.frombuffer(f.read(), dtype=np.uint8)
    return data.reshape(n, rows * cols)


def load_idx_labels(path: Path) -> np.ndarray:
    with gzip.open(path, "rb") as f:
        magic, n = struct.unpack(">II", f.read(8))
        assert magic == 2049, f"labels magic mismatch: {magic}"
        return np.frombuffer(f.read(), dtype=np.uint8)


class Vae(nn.Module):
    def __init__(self) -> None:
        super().__init__()
        h1, h2 = ENC_HIDDEN
        d1, d2 = DEC_HIDDEN
        self.enc1 = nn.Linear(784, h1)
        self.enc2 = nn.Linear(h1, h2)
        self.fc_mu = nn.Linear(h2, LATENT)
        self.fc_logvar = nn.Linear(h2, LATENT)
        self.dec1 = nn.Linear(LATENT, d1)
        self.dec2 = nn.Linear(d1, d2)
        self.dec3 = nn.Linear(d2, 784)

    def encode(self, x: torch.Tensor) -> tuple[torch.Tensor, torch.Tensor]:
        h = F.relu(self.enc2(F.relu(self.enc1(x))))
        return self.fc_mu(h), self.fc_logvar(h)

    def decode_logits(self, z: torch.Tensor) -> torch.Tensor:
        return self.dec3(F.relu(self.dec2(F.relu(self.dec1(z)))))

    def forward(self, x: torch.Tensor) -> tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        mu, logvar = self.encode(x)
        std = torch.exp(0.5 * logvar)
        z = mu + std * torch.randn_like(std)
        return self.decode_logits(z), mu, logvar


def numpy_decode(w: dict[str, np.ndarray], z: np.ndarray) -> np.ndarray:
    """丸め済み重み(float64)での forward。TS 実装と同じ数式:
    h1 = ReLU(W1·z + b1), h2 = ReLU(W2·h1 + b2), x = sigmoid(W3·h2 + b3)"""
    h1 = np.maximum(z @ w["w1"].T + w["b1"], 0.0)
    h2 = np.maximum(h1 @ w["w2"].T + w["b2"], 0.0)
    logits = h2 @ w["w3"].T + w["b3"]
    with np.errstate(over="ignore"):
        return 1.0 / (1.0 + np.exp(-logits))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default="training/data")
    ap.add_argument("--out", default="src/core/model")
    ap.add_argument("--epochs", type=int, default=EPOCHS)
    args = ap.parse_args()
    data = Path(args.data)
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    torch.manual_seed(SEED)
    x_train = torch.from_numpy(
        load_idx_images(data / "train-images.gz").astype(np.float32) / 255.0
    )
    x_test_np = load_idx_images(data / "t10k-images.gz").astype(np.float64) / 255.0
    y_test = load_idx_labels(data / "t10k-labels.gz")
    n = x_train.shape[0]
    print(f"train {n} / test {x_test_np.shape[0]}")

    model = Vae()
    opt = torch.optim.Adam(model.parameters(), lr=LR)
    for epoch in range(args.epochs):
        perm = torch.randperm(n)
        total = 0.0
        for i in range(0, n, BATCH):
            x = x_train[perm[i : i + BATCH]]
            opt.zero_grad()
            logits, mu, logvar = model(x)
            bce = F.binary_cross_entropy_with_logits(logits, x, reduction="sum")
            kld = -0.5 * torch.sum(1 + logvar - mu.pow(2) - logvar.exp())
            loss = (bce + kld) / x.shape[0]
            loss.backward()
            opt.step()
            total += loss.item() * x.shape[0]
        print(f"epoch {epoch + 1}/{args.epochs}: loss/sample {total / n:.3f}")

    # ---- デコーダ重みの丸め → 読み戻し(照合の正はここから先の numpy 値のみ)----
    model.eval()
    sd = model.state_dict()
    w = {
        "w1": np.round(sd["dec1.weight"].numpy().astype(np.float64), ROUND_DECIMALS),
        "b1": np.round(sd["dec1.bias"].numpy().astype(np.float64), ROUND_DECIMALS),
        "w2": np.round(sd["dec2.weight"].numpy().astype(np.float64), ROUND_DECIMALS),
        "b2": np.round(sd["dec2.bias"].numpy().astype(np.float64), ROUND_DECIMALS),
        "w3": np.round(sd["dec3.weight"].numpy().astype(np.float64), ROUND_DECIMALS),
        "b3": np.round(sd["dec3.bias"].numpy().astype(np.float64), ROUND_DECIMALS),
    }

    # フィクスチャ潜在点 64 件: 格子 36 + N(0,1) 乱数 28(シード固定)
    grid = np.linspace(-2.0, 2.0, N_GRID)
    zs = [np.array([gx, gy]) for gy in grid for gx in grid]
    rng = np.random.default_rng(SEED)
    zs += [rng.standard_normal(2) for _ in range(N_RANDOM)]
    samples = [
        {"z": [float(v) for v in z], "pixels": [float(p) for p in numpy_decode(w, z[None, :])[0]]}
        for z in zs
    ]

    # 潜在地図: テスト全件のエンコーダ μ(表示用・座標は丸める)
    with torch.no_grad():
        mu, _ = model.encode(torch.from_numpy(x_test_np.astype(np.float32)))
    mu64 = mu.numpy().astype(np.float64)
    points = [
        [round(float(m[0]), MAP_DECIMALS), round(float(m[1]), MAP_DECIMALS), int(lb)]
        for m, lb in zip(mu64, y_test)
    ]

    # 再構成の質(G-03 の較正元): μ を丸め済み numpy デコーダに通した BCE/pixel
    recon = numpy_decode(w, mu64)
    eps = 1e-7
    p = np.clip(recon, eps, 1 - eps)
    bce_pp = float(-(x_test_np * np.log(p) + (1 - x_test_np) * np.log(1 - p)).mean())
    print(f"recon BCE/pixel (test {len(points)}, rounded weights): {bce_pp:.5f}")

    weights = {
        "meta": {
            "arch": [LATENT, *DEC_HIDDEN, 784],
            "seed": SEED,
            "epochs": args.epochs,
            "roundDecimals": ROUND_DECIMALS,
            "reconBcePerPixel": bce_pp,
            "latentRange": LATENT_RANGE,
            "testCount": len(points),
        },
        **{k: v.tolist() for k, v in w.items()},
    }
    (out / "weights.json").write_text(json.dumps(weights), encoding="utf-8")
    (out / "fixtures.json").write_text(json.dumps({"samples": samples}), encoding="utf-8")
    (out / "latent_map.json").write_text(json.dumps({"points": points}), encoding="utf-8")
    for f in ["weights.json", "fixtures.json", "latent_map.json"]:
        print(f"wrote {out}/{f} ({(out / f).stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
