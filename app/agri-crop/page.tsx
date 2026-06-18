"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import CardPanel from "@/app/components/CardPanel";
import { streamChat } from "@/app/lib/stream-chat";

type RiskLevel = "high" | "mid" | "low";

type Zone = {
  id: string;
  name: string;
  area: number;
  crop: string;
  soilMoist: number;
  ndvi: number;
  risk: RiskLevel;
  riskPct: number;
  note?: string;
  prompt: string;
};

type DiagCard = {
  disease: string;
  confidence: number;
  area: number;
  drug: string;
  drugNote: string;
  action: string;
};

const ZONES: Zone[] = [
  {
    id: "B1",
    name: "片区 B1",
    area: 48,
    crop: "玉米",
    soilMoist: 52,
    ndvi: 0.61,
    risk: "high",
    riskPct: 78,
    note: "水浸状病斑扩散",
    prompt: "片区B1发现叶片水浸状病斑，面积约12%，扩散很快。帮我判断病害类型（结合玉米主要真菌、细菌病害），给出用药方案，注意考虑现有库存情况，以及隔离措施建议。",
  },
  {
    id: "A3",
    name: "片区 A3",
    area: 63,
    crop: "马铃薯",
    soilMoist: 52,
    ndvi: 0.73,
    risk: "mid",
    riskPct: 42,
    note: "土壤湿度偏低",
    prompt: "片区A3土壤湿度52%，低于田间持水量65%，未来3天无雨，马铃薯膨大期需水量大。帮我制定灌溉方案，包括灌溉时间、水量和频次建议。",
  },
  {
    id: "C2",
    name: "片区 C2",
    area: 55,
    crop: "马铃薯",
    soilMoist: 68,
    ndvi: 0.73,
    risk: "low",
    riskPct: 18,
    note: "长势正常",
    prompt: "片区C2马铃薯膨大期，NDVI值0.73，长势良好，土壤湿度正常。基于当前数据生成本季度产量预估报告，对比目标产量给出分析和管理重点建议。",
  },
  {
    id: "D4",
    name: "片区 D4",
    area: 71,
    crop: "玉米",
    soilMoist: 61,
    ndvi: 0.68,
    risk: "mid",
    riskPct: 35,
    note: "追肥窗口期",
    prompt: "马铃薯膨大期，结合当前土壤状况和气象条件，帮我制定D4片区追肥方案，重点考虑磷钾肥配比，给出施肥量和施肥时间建议。",
  },
];

const RISK_CLS: Record<RiskLevel, { border: string; badge: string; bar: string; bg: string }> = {
  high: { border: "border-red-400",     badge: "bg-red-100 text-red-700",         bar: "bg-red-500",     bg: "bg-red-50" },
  mid:  { border: "border-amber-400",   badge: "bg-amber-100 text-amber-700",     bar: "bg-amber-400",   bg: "bg-amber-50" },
  low:  { border: "border-emerald-400", badge: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-400", bg: "" },
};
const RISK_LABEL: Record<RiskLevel, string> = { high: "高风险", mid: "关注", low: "正常" };

const DIAG_MAP: Record<string, DiagCard> = {
  B1: {
    disease: "玉米大斑病 / 细菌性叶枯",
    confidence: 87,
    area: 5.8,
    drug: "苯醚甲环唑 + 吡唑醚菌酯",
    drugNote: "800倍液，隔7天再喷一次",
    action: "立即隔离发病区域，施药后72h复查，上报农情系统",
  },
  A3: {
    disease: "水分胁迫（非病害）",
    confidence: 94,
    area: 0,
    drug: "无需用药",
    drugNote: "补水为主",
    action: "滴灌补水 35mm，分3次施用，优先早6时前",
  },
  C2: {
    disease: "无明显病害",
    confidence: 96,
    area: 0,
    drug: "预防性保护剂可选",
    drugNote: "代森锰锌 600倍液，晴天喷施",
    action: "按计划追施钾肥，继续监测NDVI变化",
  },
  D4: {
    disease: "轻度缺素症（待确认）",
    confidence: 71,
    area: 2.1,
    drug: "磷酸二氢钾叶面肥",
    drugNote: "0.3%溶液，叶面喷施",
    action: "建议采样送检，明确缺素类型后再追肥",
  },
};

const SCAN_STEPS = ["读取卫星遥感数据", "病害特征识别分析", "匹配农药知识库", "生成田间处方"];

export default function Page() {
  const [selected, setSelected] = useState<Zone | null>(null);
  const [scanStep, setScanStep] = useState(-1);
  const [outputs, setOutputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const scanningRef = useRef<string | null>(null);

  async function inspect(zone: Zone) {
    if (loading) return;
    setSelected(zone);

    if (outputs[zone.id]) {
      setScanStep(SCAN_STEPS.length);
      return;
    }

    scanningRef.current = zone.id;
    setScanStep(0);

    for (let i = 1; i <= SCAN_STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, 580));
      if (scanningRef.current !== zone.id) return;
      setScanStep(i);
    }

    if (scanningRef.current !== zone.id) return;
    setLoading(zone.id);
    try {
      await streamChat("agri-crop", zone.prompt, (text) =>
        setOutputs((prev) => ({ ...prev, [zone.id]: text }))
      );
    } catch {
      setOutputs((prev) => ({ ...prev, [zone.id]: "分析失败，请重试" }));
    }
    setLoading(null);
  }

  const diag = selected ? DIAG_MAP[selected.id] : null;
  const scanDone = scanStep >= SCAN_STEPS.length;

  return (
    <main className="min-h-screen bg-[#f2f7f0]">
      <header className="border-b border-black/10 bg-white px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-xs text-zinc-400 hover:text-zinc-700">← Demo 中心</Link>
            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">桌3 · 农业种植 / 种业</div>
            <h1 className="text-xl font-black text-zinc-950">田间巡检台</h1>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700">总面积 237亩</span>
            <span className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-red-700">1片区高风险</span>
            <span className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-700">2片区需关注</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-5 sm:px-8">
        <div className="grid gap-5 lg:grid-cols-[1fr_26rem_20rem]">
          {/* 左：地块卡片 */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-zinc-400">点击片区卡片 → AI 卫星巡检</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {ZONES.map((zone) => {
                const cls = RISK_CLS[zone.risk];
                const active = selected?.id === zone.id;
                return (
                  <button
                    key={zone.id}
                    onClick={() => inspect(zone)}
                    disabled={loading !== null}
                    className={`rounded-xl border-2 bg-white p-4 text-left shadow-sm transition hover:shadow-md ${cls.border} ${active ? "ring-2 ring-emerald-300" : ""}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-base font-black text-zinc-900">{zone.name}</div>
                        <div className="text-xs text-zinc-400">{zone.crop} · {zone.area}亩</div>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${cls.badge}`}>
                        {RISK_LABEL[zone.risk]}
                      </span>
                    </div>

                    {zone.note && (
                      <div className={`mt-2 rounded-md px-2.5 py-1.5 text-xs font-medium ${cls.bg} text-zinc-700`}>
                        {zone.note}
                      </div>
                    )}

                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <div>
                        <div className="text-zinc-400">土壤湿度</div>
                        <div className="mt-0.5 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
                            <div className={`h-full rounded-full ${cls.bar}`} style={{ width: `${zone.soilMoist}%` }} />
                          </div>
                          <span className="font-semibold text-zinc-700">{zone.soilMoist}%</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-zinc-400">病害风险</div>
                        <div className="mt-0.5 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
                            <div className={`h-full rounded-full ${cls.bar}`} style={{ width: `${zone.riskPct}%` }} />
                          </div>
                          <span className="font-semibold text-zinc-700">{zone.riskPct}%</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-zinc-400">NDVI </span>
                        <span className="font-semibold text-zinc-700">{zone.ndvi}</span>
                      </div>
                    </div>

                    <div className={`mt-3 rounded-lg py-1.5 text-center text-sm font-bold transition ${
                      active ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}>
                      {active && loading === zone.id
                        ? "扫描中…"
                        : active && outputs[zone.id]
                        ? "✓ 已诊断"
                        : "🛰 AI 巡检"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 右：扫描动画 → 处方单 + AI 分析 */}
          <div className="space-y-3">
            {!selected && (
              <div className="flex h-64 items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-white text-sm text-zinc-400">
                点击左侧片区开始 AI 巡检
              </div>
            )}

            {/* 扫描动画 */}
            {selected && !scanDone && (
              <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                <div className="mb-5 text-xs font-semibold text-zinc-400">AI 卫星巡检扫描中 · {selected.name}</div>
                <div className="space-y-5">
                  {SCAN_STEPS.map((step, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 transition-opacity duration-300 ${
                        i < scanStep ? "opacity-100" : i === scanStep ? "opacity-90" : "opacity-20"
                      }`}
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                        i < scanStep
                          ? "bg-emerald-500 text-white"
                          : i === scanStep
                          ? "border-2 border-emerald-400 text-emerald-600"
                          : "border-2 border-zinc-200 text-zinc-300"
                      }`}>
                        {i < scanStep ? "✓" : i + 1}
                      </div>
                      <span className={`text-sm font-medium ${
                        i < scanStep ? "text-zinc-400 line-through" : i === scanStep ? "text-zinc-900" : "text-zinc-300"
                      }`}>
                        {step}
                        {i === scanStep && (
                          <span className="ml-2 inline-flex gap-0.5">
                            {[0, 0.15, 0.3].map((d, j) => (
                              <span key={j} className="animate-bounce text-emerald-500" style={{ animationDelay: `${d}s` }}>·</span>
                            ))}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 田间处方单 */}
            {selected && scanDone && diag && (
              <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
                  <div>
                    <div className="text-[11px] text-zinc-400">田间处方单 · {selected.name}</div>
                    <div className="mt-0.5 text-base font-black text-zinc-900">{diag.disease}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-zinc-400">AI 置信度</div>
                    <div className={`text-3xl font-black ${
                      diag.confidence >= 90 ? "text-emerald-600" : diag.confidence >= 75 ? "text-amber-500" : "text-red-500"
                    }`}>
                      {diag.confidence}%
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <table className="mb-4 w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-100">
                        <th className="pb-2 text-left text-xs font-semibold text-zinc-400">推荐药剂</th>
                        <th className="pb-2 text-left text-xs font-semibold text-zinc-400">用法用量</th>
                        <th className="pb-2 text-right text-xs font-semibold text-zinc-400">涉及面积</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="pt-3 font-semibold text-zinc-900">{diag.drug}</td>
                        <td className="pt-3 text-zinc-500">{diag.drugNote}</td>
                        <td className="pt-3 text-right font-semibold text-zinc-900">
                          {diag.area > 0 ? `${diag.area}亩` : "—"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                    <div className="mb-1 text-xs font-bold text-amber-700">立即处置行动</div>
                    <div className="text-sm text-zinc-800">{diag.action}</div>
                  </div>
                </div>
              </div>
            )}

            {/* AI 综合分析 */}
            {selected && scanDone && (
              <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <div className="text-xs font-semibold text-zinc-400">AI 综合分析</div>
                  {loading === selected.id && (
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                  )}
                </div>
                {loading === selected.id && !outputs[selected.id] ? (
                  <div className="flex gap-1 text-zinc-300">
                    {[0, 0.15, 0.3].map((d, i) => (
                      <span key={i} className="animate-bounce text-xl" style={{ animationDelay: `${d}s` }}>·</span>
                    ))}
                  </div>
                ) : outputs[selected.id] ? (
                  <div className="whitespace-pre-wrap text-sm leading-7 text-zinc-800">{outputs[selected.id]}</div>
                ) : null}
              </div>
            )}
          </div>

          {/* 卡组面板 */}
          <div>
            <CardPanel
              mission={{
                type: "提效目标",
                subtitle: "快人一步 · 卫星遥感实时识别",
                template: "把病害巡检的处理时间\n从 2天 缩短到 2小时",
              }}
              task={{ tasks: ["病害识别", "地块巡检", "植保建议", "农服报告"], mode: "机器干" }}
              agents={["A-01 检索", "A-02 分析", "A-03 识别", "A-05 写手"]}
              skills={["图片识别", "知识问答", "方案建议", "报告生成"]}
              infra={["I-02 大模型", "I-03 知识库", "I-05 工具集成"]}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
