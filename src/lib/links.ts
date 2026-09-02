// フッタリンクの正本(F-08)。歩き方・設計図はアーティファクト(要共有リンク)。
// 規約適合は src/core/footerRule.ts + footer.test.ts(T-010)で検査する。

import type { FooterLink } from "@/core/footerRule";

export const FOOTER_LINKS: readonly FooterLink[] = [
  {
    label: "MIT License",
    href: "https://github.com/twill3c/senzai-niwa/blob/main/LICENSE",
  },
  { label: "GitHub", href: "https://github.com/twill3c/senzai-niwa" },
  {
    label: "潜在の庭の歩き方",
    href: "https://claude.ai/code/artifact/7b166775-0ae0-481f-8552-af41a0f4e15b",
  },
  {
    label: "潜在の庭 設計図",
    href: "https://claude.ai/code/artifact/057fb018-6586-4bbf-a014-f2d541a2581f",
  },
  { label: "App Menu", href: "https://app-menu-amber.vercel.app" },
] as const;
