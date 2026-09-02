"use client";

// 潜在平面 UI(F-04 / F-05)。
// - 背景 canvas: テスト 10,000 件のエンコーダ μ 散布(クラス別配色)— 初回に一度だけ描く
// - overlay canvas: 現在位置の十字線 — z が動くたびに描き直す
// - 出力 canvas: decode(z) の 28×28 — z が動くたびに描き直す
// 生成(decode)はポインタイベント終端で毎回実行する(N-03)。

import { useEffect, useMemo, useRef, useState } from "react";
import { LATENT_MAP, MODEL } from "@/core/model";
import { decode } from "@/core/decoder";
import { latentToScreen, screenToLatent } from "@/core/latent";
import { morphZ } from "@/core/morph";
import { gridLatents } from "@/core/grid";

const PLANE_SIZE = 480;
const IMG = 28;
const GRID_N = 15;
const MORPH_PERIOD_MS = 4000;

// クラス 0〜9 の配色(matplotlib tab10 相当・散布の視認用)
const COLORS = [
  "#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f",
  "#edc948", "#b07aa1", "#ff9da7", "#9c755f", "#bab0ac",
];

export default function Garden() {
  const bgRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const outRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<HTMLCanvasElement>(null);
  const draggingRef = useRef(false);
  const [z, setZ] = useState<number[]>([0, 0]);
  const [morphA, setMorphA] = useState<number[] | null>(null);
  const [morphB, setMorphB] = useState<number[] | null>(null);
  const [playing, setPlaying] = useState(false);
  const [gridOpen, setGridOpen] = useState(false);

  const range = MODEL.meta.latentRange;
  const gridZs = useMemo(() => gridLatents(GRID_N, range), [range]);

  // モーフ再生(F-06)— rAF で往復補間。ドラッグ開始で停止する
  useEffect(() => {
    if (!playing || !morphA || !morphB) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const phase = ((t - t0) % MORPH_PERIOD_MS) / MORPH_PERIOD_MS;
      const u = (1 - Math.cos(2 * Math.PI * phase)) / 2; // 0→1→0 のコサイン緩急
      setZ(morphZ(morphA, morphB, u));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, morphA, morphB]);

  // 格子俯瞰(F-07)— 開いたときに一度だけ全セルをデコードして描く
  useEffect(() => {
    if (!gridOpen) return;
    const ctx = gridRef.current?.getContext("2d");
    if (!ctx) return;
    for (let i = 0; i < gridZs.length; i++) {
      const pixels = decode(MODEL, gridZs[i]);
      const img = ctx.createImageData(IMG, IMG);
      for (let p = 0; p < pixels.length; p++) {
        const v = Math.round(pixels[p] * 255);
        img.data[p * 4] = v;
        img.data[p * 4 + 1] = v;
        img.data[p * 4 + 2] = v;
        img.data[p * 4 + 3] = 255;
      }
      ctx.putImageData(img, (i % GRID_N) * IMG, Math.floor(i / GRID_N) * IMG);
    }
  }, [gridOpen, gridZs]);

  // 背景の潜在地図(F-05)— 初回のみ
  useEffect(() => {
    const ctx = bgRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#181e24";
    ctx.fillRect(0, 0, PLANE_SIZE, PLANE_SIZE);
    ctx.globalAlpha = 0.45;
    for (const [x, y, label] of LATENT_MAP.points) {
      const [px, py] = latentToScreen([x, y], PLANE_SIZE, range);
      if (px < 0 || px > PLANE_SIZE || py < 0 || py > PLANE_SIZE) continue;
      ctx.fillStyle = COLORS[label];
      ctx.fillRect(px - 1, py - 1, 2, 2);
    }
    ctx.globalAlpha = 1;
  }, [range]);

  // 十字線と生成画像 — z が動くたび
  useEffect(() => {
    const octx = overlayRef.current?.getContext("2d");
    if (octx) {
      octx.clearRect(0, 0, PLANE_SIZE, PLANE_SIZE);
      const [px, py] = latentToScreen(z, PLANE_SIZE, range);
      octx.strokeStyle = "#e8ebee";
      octx.lineWidth = 1;
      octx.beginPath();
      octx.moveTo(px - 8, py);
      octx.lineTo(px + 8, py);
      octx.moveTo(px, py - 8);
      octx.lineTo(px, py + 8);
      octx.stroke();
      octx.strokeStyle = "#7fd4a8";
      octx.beginPath();
      octx.arc(px, py, 5, 0, Math.PI * 2);
      octx.stroke();
      // モーフの始点・終点の印(F-06)
      octx.font = "bold 13px sans-serif";
      octx.textAlign = "center";
      for (const [mark, label] of [
        [morphA, "A"],
        [morphB, "B"],
      ] as const) {
        if (!mark) continue;
        const [mx, my] = latentToScreen(mark, PLANE_SIZE, range);
        octx.fillStyle = "#f2c14e";
        octx.beginPath();
        octx.arc(mx, my, 9, 0, Math.PI * 2);
        octx.fill();
        octx.fillStyle = "#101418";
        octx.fillText(label, mx, my + 4.5);
      }
    }

    const ctx = outRef.current?.getContext("2d");
    if (!ctx) return;
    const pixels = decode(MODEL, z);
    const img = ctx.createImageData(IMG, IMG);
    for (let i = 0; i < pixels.length; i++) {
      const v = Math.round(pixels[i] * 255);
      img.data[i * 4] = v;
      img.data[i * 4 + 1] = v;
      img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [z, range, morphA, morphB]);

  function moveTo(e: React.PointerEvent<HTMLDivElement>) {
    // 表示サイズは CSS で可変(min(480px, 100%))のため、座標は実測の rect 幅で正規化する
    const rect = e.currentTarget.getBoundingClientRect();
    setZ(screenToLatent(e.clientX - rect.left, e.clientY - rect.top, rect.width, range));
  }

  return (
    <div className="garden">
      <div
        className="plane-wrap"
        onPointerDown={(e) => {
          setPlaying(false); // ドラッグ開始でモーフ停止(F-06)
          draggingRef.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          moveTo(e);
        }}
        onPointerMove={(e) => {
          if (draggingRef.current) moveTo(e);
        }}
        onPointerUp={() => {
          draggingRef.current = false;
        }}
      >
        <canvas ref={bgRef} width={PLANE_SIZE} height={PLANE_SIZE} />
        <canvas
          ref={overlayRef}
          className="overlay"
          width={PLANE_SIZE}
          height={PLANE_SIZE}
        />
      </div>
      <div className="output-panel">
        <canvas ref={outRef} width={IMG} height={IMG} />
        <div className="zlabel">
          z = ({z[0].toFixed(2)}, {z[1].toFixed(2)})
        </div>
        <p className="hint">
          色の点はテスト 10,000 字が潜在平面のどこに植わっているか(0〜9 で色分け)。
          点の群れの上をなぞると、その数字が生まれる。群れの境目では字が溶け合う。
        </p>
        <div className="controls">
          <button onClick={() => setMorphA([...z])}>始点 A に記憶</button>
          <button onClick={() => setMorphB([...z])}>終点 B に記憶</button>
          <button
            disabled={!morphA || !morphB}
            onClick={() => setPlaying((p) => !p)}
          >
            {playing ? "モーフ停止" : "モーフ再生"}
          </button>
          <button onClick={() => setGridOpen((o) => !o)}>
            {gridOpen ? "格子を閉じる" : "格子を俯瞰"}
          </button>
        </div>
      </div>
      {gridOpen && (
        <div className="grid-panel">
          <canvas
            ref={gridRef}
            width={GRID_N * IMG}
            height={GRID_N * IMG}
            onClick={(e) => {
              // 押したセルの潜在点へ移動(F-07)— gridLatents と同じ点を使う
              const rect = e.currentTarget.getBoundingClientRect();
              const col = Math.min(
                GRID_N - 1,
                Math.max(0, Math.floor(((e.clientX - rect.left) / rect.width) * GRID_N)),
              );
              const row = Math.min(
                GRID_N - 1,
                Math.max(0, Math.floor(((e.clientY - rect.top) / rect.height) * GRID_N)),
              );
              setPlaying(false);
              setZ(gridZs[row * GRID_N + col]);
            }}
          />
          <p className="hint">
            潜在平面 [-3, 3]² を {GRID_N}×{GRID_N} でデコードした俯瞰図。
            セルを押すとその座標へ移動する。
          </p>
        </div>
      )}
    </div>
  );
}
