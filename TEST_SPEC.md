# TEST_SPEC.md — senzai-niwa

<!-- scaffold template v1.24.0 から展開(2026-09-02)。実行系を vitest に読み替えて運用する -->

## 実行規約

- `npm run test`(vitest run)を stage 3–5 の判定に使用
- モデル資産(`src/core/model/*.json`)の更新は専用コミット(`data: regenerate model assets`)で行い、
  理由をループログに記す。資産更新時は G-01/G-03 の照合テストが同時に緑であること
- 照合フィクスチャの正は**丸め済み重みを numpy float64 で読み戻した** forward の出力。
  丸め前の torch 重みで期待値を作らない(照合不能になる)

## 期待値の出所(HC-016)

| 出所 | 書き方 |
|---|---|
| SPEC の条項 | 条項 ID を書く。SPEC の保証粒度を超える期待値を書かない |
| 実測 | 実測日と実測値をコメントに残す |
| フィクスチャ導出 | train_vae.py が書き出した値から導出し、定数で書かない |

件数は定数で書かず、資産のメタ・配列長から導出する(G-04)。

## オラクルの出所

| フィクスチャ | 出所 | 性格 |
|---|---|---|
| fixtures.json samples(潜在点 64 件 → 784 ピクセル) | train_vae.py が丸め済み重みを numpy float64 で読み戻して再計算 | 二実装照合の正(非循環: 学習は torch、正は numpy、被験は TS) |
| weights.json meta(reconBcePerPixel ほか) | train_vae.py がテスト 10,000 件で実測して記録 | G-03 の較正元 |
| latent_map.json | train_vae.py がテスト集合をエンコードした μ とラベル | G-04 の対象 |

## ケース一覧

| ID | 対応要求 | ケース | 期待 | 出所 |
|---|---|---|---|---|
| T-001 | F-01/G-02 | weights.json の形状検査 | 各層の行列・バイアス長が meta.arch から導出した形状と一致 | フィクスチャ導出 |
| T-002 | F-03/G-01 | フィクスチャ 64 潜在点の照合 | TS decode の 784 値が Python 値と最大絶対誤差 < 1e-9 | SPEC G-01 |
| T-003 | F-03/G-02 | 決定論 | 同一 z で decode を 2 回呼ぶと深い等値 | SPEC G-02 |
| T-004 | N-05 | 縁の仕様 | 非有限値(NaN/±Inf)を含む z は TypeError。範囲外の有限値([-10,10] 等)は正常に [0,1] の有限値を返す | SPEC N-05 |
| T-005 | G-03 | 再構成の質の記録 | meta.reconBcePerPixel が存在し有限かつ較正閾値以下(閾値は loop_001 実測後に SPEC へ記録した値) | 実測 |
| T-006 | G-04 | 潜在地図の整合 | 点数 = ラベル数、全座標が有限、ラベルは 0〜9 のみ(件数は配列長から導出) | フィクスチャ導出 |
| T-007 | F-03 | 出力域 | decode の全出力が [0,1] に収まる(sigmoid の値域) | SPEC F-02 |
| T-008 | F-04 | UI 純関数 | 画面座標 ↔ 潜在座標の変換が往復で一致し、範囲外は clamp される | SPEC F-04 |
| T-009 | G-01 陽性対照 | 照合器自身の検査 | 重みを 1e-6 だけ崩した decode はフィクスチャ照合に失敗する(照合器が実際に撃つことの対照) | HC-041 |
| T-010 | F-08 | フッタ規約 | FOOTER_LINKS が規約 5 項目・並び・行き先(LICENSE/リポジトリ/アーティファクト×2/App Menu)に適合 | フリート規約(koho-lens 正本) |
| T-011 | F-08 陽性対照 | フッタ検査器の検査 | 壊した一覧(項目数 4・並び入替・行き先差替×3・空)がそれぞれ違反として検出される | HC-041 |
| T-012 | F-06 | モーフ補間 | morphZ(a,b,0)=a・morphZ(a,b,1)=b・u=0.5 で中点・u は [0,1] に clamp・決定論・非有限値は TypeError | SPEC F-06 |
| T-013 | F-07 | 格子の潜在点列 | gridLatents(n,r) は n² 点・行優先で先頭 (-r,+r)/末尾 (+r,-r)・全点有限・重複なし(集合サイズ n²) | SPEC F-07 |
| T-014 | F-09 | 両庭へのゲート適用 | T-001/T-002/T-003/T-004/T-005/T-006/T-007/T-009 を mnist / kmnist の両資産に describe.each で適用(G-03 の閾値は庭ごとの較正値) | SPEC §4(loop_004 拡張) |
| T-015 | F-09/G-04 | クラス名の整合 | meta.classNames は 10 件・非空・重複なし。kmnist は配布元 classmap(CODH・kmnist_classmap.csv)の お き す つ な は ま や れ を と一致。mnist は "0"〜"9" | 外部権威(classmap)+ SPEC F-09 |
