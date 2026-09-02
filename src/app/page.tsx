import Garden from "@/components/Garden";

export default function Home() {
  return (
    <main>
      <h1>潜在の庭</h1>
      <p className="lede">
        MNIST で学習した VAE(潜在 2 次元)の潜在平面。平面をなぞると、その座標から
        手書き数字がその場で生まれる。学習は PyTorch(手元)、生成はブラウザ内の
        TypeScript デコーダ — 両実装の一致はテストで照合済み。
      </p>
      <Garden />
    </main>
  );
}
