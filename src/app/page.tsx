import Garden from "@/components/Garden";
import { FOOTER_LINKS } from "@/lib/links";

export default function Home() {
  return (
    <main>
      <h1>潜在の庭</h1>
      <p className="lede">
        VAE(潜在 2 次元)の潜在平面。平面をなぞると、その座標から手書きの字が
        その場で生まれる。庭は二つ — 数字の庭(MNIST)とくずし字の庭(KMNIST)。
        学習は PyTorch(手元)、生成はブラウザ内の TypeScript デコーダ —
        両実装の一致は庭ごとにテストで照合済み。
      </p>
      <Garden />
      <footer className="footer">
        {FOOTER_LINKS.map((l, i) => (
          <span key={l.href}>
            {i > 0 && " ・ "}
            <a href={l.href} target="_blank" rel="noreferrer">
              {l.label}
            </a>
            {l.label === "MIT License" && " © 2026 坂田哲朗"}
          </span>
        ))}
      </footer>
    </main>
  );
}
