"use client";

import Link from "next/link";
import { useState } from "react";
import CardPanel from "@/app/components/CardPanel";
import { streamChat } from "@/app/lib/stream-chat";

type Step = 0 | 1 | 2 | 3;
type Cell = { id: string; label: string; type: "farmland" | "forest" | "urban" | "water" | "mixed" };

const GRID: Cell[] = [
  { id: "A1", label: "耕地区", type: "farmland" }, { id: "A2", label: "混合区", type: "mixed" },   { id: "A3", label: "耕地区", type: "farmland" }, { id: "A4", label: "林地", type: "forest" },
  { id: "B1", label: "城镇区", type: "urban" },   { id: "B2", label: "耕地区", type: "farmland" }, { id: "B3", label: "混合区", type: "mixed" },   { id: "B4", label: "耕地区", type: "farmland" },
  { id: "C1", label: "耕地区", type: "farmland" }, { id: "C2", label: "水体",   type: "water" },   { id: "C3", label: "林地",   type: "forest" },  { id: "C4", label: "耕地区", type: "farmland" },
];

const TYPE_CLS: Record<Cell["type"], string> = {
  farmland: "bg-lime-100 text-lime-700 hover:bg-lime-200",
  forest:   "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
  urban:    "bg-zinc-200 text-zinc-600 hover:bg-zinc-300",
  water:    "bg-sky-100 text-sky-700 hover:bg-sky-200",
  mixed:    "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
};

const DETECT_RESULTS = [
  { zone: "B2 耕地区", change: "新增建设用地 312公顷", level: "high", confidence: "91%" },
  { zone: "A2 混合区", change: "耕地转建设用地 175公顷", level: "high", confidence: "87%" },
  { zone: "C2 水体",   change: "湿地面积减少 23公顷",   level: "mid",  confidence: "82%" },
  { zone: "B3 混合区", change: "疑似新建构筑物 6处",     level: "mid",  confidence: "76%" },
  { zone: "A3 耕地区", change: "植被恢复 NDVI +0.17",   level: "ok",   confidence: "94%" },
];

const LEVEL_CLS: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  mid:  "bg-orange-100 text-orange-700",
  ok:   "bg-emerald-100 text-emerald-700",
};

export default function Page() {
  const [step, setStep] = useState<Step>(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detecting, setDetecting] = useState(false);
  const [detectPct, setDetectPct] = useState(0);
  const [detectText, setDetectText] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reportText, setReportText] = useState("");

  function toggleCell(id: string) {
    if (step !== 0) return;
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  }

  async function runDetect() {
    if (selected.size === 0) return;
    setDetecting(true);
    setDetectPct(0);
    setDetectText("");

    const phases = ["加载基准影像（2026-03-15）", "加载当前影像（2026-06-08）", "配准对齐", "像素差分计算", "变化阈值提取", "目标分类"];
    for (let i = 0; i < phases.length; i++) {
      await new Promise<void>((r) => setTimeout(r, 400));
      setDetectPct(Math.round(((i + 1) / phases.length) * 85));
    }

    const zones = [...selected].join("、");
    const prompt = `遥感任务RS-2026-0612，已选择区域：${zones}。请分析这些区域的土地覆盖变化，给出变化类型、面积估算和风险评级（150字以内）。`;
    try {
      await streamChat("aerospace", prompt, setDetectText);
    } catch { /* ignore */ }

    setDetectPct(100);
    setDetecting(false);
    setStep(2);
  }

  async function runReport() {
    setReporting(true);
    setReportText("");
    const prompt = `请为遥感任务RS-2026-0612生成标准解译报告，包括：任务概况、变化统计汇总（表格格式）、重点区域描述、气象影响分析、处置建议。`;
    try {
      await streamChat("aerospace", prompt, setReportText);
    } catch { /* ignore */ }
    setReporting(false);
    setStep(3);
  }

  const STEPS = ["选择影像区域", "AI 变化检测", "生成解译报告", "报告完成"];
  const stepDone = (i: number) => step > i;
  const stepActive = (i: number) => step === i;

  return (
    <main className="min-h-screen bg-[#f3f0f7]">
      <header className="border-b border-black/10 bg-white px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <Link href="/" className="text-xs text-zinc-400 hover:text-zinc-700">← Demo 中心</Link>
            <div className="mt-0.5 text-xs font-semibold uppercase tracking-widest text-zinc-400">桌7 · 遥感 / 卫星</div>
            <h1 className="text-xl font-black text-zinc-950">遥感判读台 · 变化检测流水线</h1>
          </div>
          <div className="hidden gap-2 sm:flex text-xs font-semibold">
            <span className="rounded-md bg-violet-50 px-3 py-1.5 text-violet-700 border border-violet-200">任务 RS-2026-0612</span>
            <span className="rounded-md bg-zinc-50 px-3 py-1.5 text-zinc-600 border border-zinc-200">12.6万km²</span>
            <span className="rounded-md bg-zinc-50 px-3 py-1.5 text-zinc-600 border border-zinc-200">云量 3.2%</span>
          </div>
        </div>
      </header>

      {/* 步骤条 */}
      <div className="border-b border-black/8 bg-white px-5 py-3 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center gap-0">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center">
              <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                stepDone(i) ? "bg-violet-600 text-white" :
                stepActive(i) ? "bg-violet-100 text-violet-700 ring-1 ring-violet-300" :
                "text-zinc-400"
              }`}>
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                  stepDone(i) ? "bg-white/20" : stepActive(i) ? "bg-violet-600 text-white" : "bg-zinc-200"
                }`}>
                  {stepDone(i) ? "✓" : i + 1}
                </span>
                {s}
              </div>
              {i < STEPS.length - 1 && <div className={`mx-1 h-px w-6 ${step > i ? "bg-violet-400" : "bg-zinc-200"}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-5 sm:px-8">
        <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-5">
        {/* Step 0: 选区 */}
        <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-zinc-400">黄河中游流域影像 · 2026-06-08</div>
              <div className="mt-1 text-sm font-semibold text-zinc-700">
                {step === 0 ? "点击格区选择待检测范围（可多选）" : `已选择 ${selected.size} 个格区`}
              </div>
            </div>
            {step === 0 && selected.size > 0 && (
              <button onClick={() => { setStep(1); runDetect(); }}
                className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-violet-700">
                确认区域，开始检测 →
              </button>
            )}
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2">
            {GRID.map((cell) => {
              const isSelected = selected.has(cell.id);
              const hasResult = step >= 2 && DETECT_RESULTS.find((r) => r.zone.startsWith(cell.id));
              const result = hasResult;
              return (
                <button
                  key={cell.id}
                  onClick={() => toggleCell(cell.id)}
                  disabled={step > 0}
                  className={`relative h-24 rounded-xl border-2 p-3 text-left transition ${
                    isSelected
                      ? "border-violet-500 bg-violet-50 ring-2 ring-violet-200"
                      : step === 0
                        ? `border-transparent ${TYPE_CLS[cell.type]}`
                        : `border-transparent ${TYPE_CLS[cell.type]} opacity-70`
                  }`}
                >
                  <div className="text-xs font-bold text-inherit opacity-60">{cell.id}</div>
                  <div className="mt-1 text-sm font-semibold">{cell.label}</div>
                  {result && (
                    <div className={`mt-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${LEVEL_CLS[result.level]}`}>
                      {result.level === "high" ? "变化" : result.level === "mid" ? "疑似" : "正常"}
                    </div>
                  )}
                  {isSelected && step === 0 && (
                    <div className="absolute right-2 top-2 h-3 w-3 rounded-full bg-violet-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 1-2: 检测结果 */}
        {step >= 1 && (
          <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold text-zinc-400">变化检测结果</div>
            {detecting && (
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-xs font-medium text-zinc-500">
                  <span>正在分析影像差异…</span><span className="text-violet-600 font-bold">{detectPct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div className="h-full rounded-full bg-violet-500 transition-all duration-500" style={{ width: `${detectPct}%` }} />
                </div>
              </div>
            )}
            {step >= 2 && (
              <div className="mt-4 space-y-3">
                {DETECT_RESULTS.map((r) => (
                  <div key={r.zone} className="flex items-center gap-4 rounded-lg border border-black/8 px-4 py-3">
                    <div className="w-24 shrink-0 text-sm font-semibold text-zinc-700">{r.zone}</div>
                    <div className="flex-1 text-sm text-zinc-600">{r.change}</div>
                    <div className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${LEVEL_CLS[r.level]}`}>{r.level === "ok" ? "正常" : r.level === "high" ? "显著" : "疑似"}</div>
                    <div className="w-12 text-right text-xs text-zinc-400">置信 {r.confidence}</div>
                  </div>
                ))}
                {detectText && (
                  <div className="rounded-lg bg-violet-50 p-4 text-sm leading-6 text-violet-900 whitespace-pre-wrap">{detectText}</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 2: 生成报告按钮 */}
        {step === 2 && (
          <div className="flex justify-end">
            <button onClick={runReport}
              className="rounded-xl bg-violet-600 px-7 py-3 text-sm font-bold text-white shadow-md transition hover:bg-violet-700">
              生成解译报告 →
            </button>
          </div>
        )}

        {/* Step 3: 报告 */}
        {step >= 3 && (
          <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-zinc-400">解译报告 · RS-2026-0612</div>
              {!reporting && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">✓ 生成完毕</span>}
            </div>
            {reporting && (
              <div className="mt-3 flex gap-1 text-zinc-400">
                {[0, 0.15, 0.3].map((d, i) => (
                  <span key={i} className="animate-bounce text-xl" style={{ animationDelay: `${d}s` }}>·</span>
                ))}
              </div>
            )}
            {reportText && (
              <div className="mt-4 text-sm leading-7 text-zinc-800 whitespace-pre-wrap">{reportText}</div>
            )}
          </div>
        )}
        </div>

        {/* 卡组面板 */}
        <div className="lg:sticky lg:top-5 lg:self-start">
          <CardPanel
            mission={{
              type: "提效目标",
              subtitle: "快人一步 · AI影像变化检测",
              template: "把变化检测时间\n从 3天 缩短到 2小时",
            }}
            task={{ tasks: ["变化检测", "影像识别", "解译质检", "解译报告"], mode: "机器干" }}
            agents={["A-02 分析", "A-03 识别", "A-06 质检合规"]}
            skills={["图片识别", "变化检测", "地图出图", "质量校验"]}
            infra={["I-01 算力", "I-02 大模型", "I-06 数据底座"]}
          />
        </div>
        </div>
      </div>
    </main>
  );
}
