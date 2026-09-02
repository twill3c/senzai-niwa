import { describe, expect, it } from "vitest";
import { validateFooterLinks } from "@/core/footerRule";
import { FOOTER_LINKS } from "@/lib/links";

// T-010 / T-011(F-08)— フリート共通フッタ規約
// 出所: フリート規約(koho-lens 正本)= 5 項目・この並び:
//   MIT License(→ 本リポジトリの LICENSE)・GitHub(→ 本リポジトリ)・
//   歩き方・設計図(→ claude.ai/code/artifact/)・App Menu(→ app-menu-amber.vercel.app)
// 検査規則は表示用データではなく src/lib/links.ts の正本データに対して書く(HC-068)

describe("footer links(F-08)", () => {
  // T-010: 出荷するリンク一覧が規約に適合する
  it("FOOTER_LINKS が規約 5 項目・並び・行き先に適合(違反 0 件)", () => {
    expect(validateFooterLinks(FOOTER_LINKS, "senzai-niwa")).toEqual([]);
  });

  // T-011: 陽性対照(HC-041)— 検査器が実際に撃つことを壊し方ごとに確かめる
  it("壊した一覧はそれぞれ違反として検出される(陽性対照)", () => {
    const base = FOOTER_LINKS.map((l) => ({ ...l }));

    const fourItems = base.slice(0, 4);
    expect(validateFooterLinks(fourItems, "senzai-niwa").length).toBeGreaterThan(0);

    const swapped = [base[1], base[0], base[2], base[3], base[4]];
    expect(validateFooterLinks(swapped, "senzai-niwa").length).toBeGreaterThan(0);

    const wrongLicense = base.map((l, i) =>
      i === 0 ? { ...l, href: "https://opensource.org/licenses/MIT" } : l,
    );
    expect(validateFooterLinks(wrongLicense, "senzai-niwa").length).toBeGreaterThan(0);

    const wrongRepo = base.map((l, i) =>
      i === 1 ? { ...l, href: "https://github.com/someone-else/senzai-niwa" } : l,
    );
    expect(validateFooterLinks(wrongRepo, "senzai-niwa").length).toBeGreaterThan(0);

    const wrongArtifact = base.map((l, i) =>
      i === 2 ? { ...l, href: "https://example.com/how-to" } : l,
    );
    expect(validateFooterLinks(wrongArtifact, "senzai-niwa").length).toBeGreaterThan(0);

    const wrongMenu = base.map((l, i) =>
      i === 4 ? { ...l, href: "https://app-menu.vercel.app" } : l,
    );
    expect(validateFooterLinks(wrongMenu, "senzai-niwa").length).toBeGreaterThan(0);
  });

  // 検査対象が空でないこと(HC-041: 走査対象の空を別ケースで確かめる)
  it("空の一覧は違反になる", () => {
    expect(validateFooterLinks([], "senzai-niwa").length).toBeGreaterThan(0);
  });
});
