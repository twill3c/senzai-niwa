import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "潜在の庭 — VAE 潜在空間さんぽ",
  description:
    "MNIST で学習した VAE(潜在 2 次元)の潜在平面を歩くと、手書き数字がその場で生まれる。学習は PyTorch、生成はブラウザ内 TypeScript。",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
