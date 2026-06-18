"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import CardPanel from "@/app/components/CardPanel";
import { streamChat } from "@/app/lib/stream-chat";

type AlertState = "danger" | "warning" | "normal";
type Pen = {
  id: string;
  name: string;
  count: number;
  temp: number;
  tempAlert: AlertState;
  nh3: number;
  nh3Alert: AlertState;
  humidity: number;
  humidAlert: AlertState;
  feedRatio: number;
  feedAlert: AlertState;
  note?: string;
  prompt: string;
};

const PENS: Pen[] = [
  {
    id: "pen4",
    name: "4号猪舍",
    count: 2400,
    temp: 29.3, tempAlert: "danger",
    nh3: 18,   nh3Alert: "warning",
    humidity: 76, humidAlert: "normal",
    feedRatio: 3.12, feedAlert: "danger",
    note: "⚠️ 高温告警",
    prompt: "4号猪舍2400头猪，当前温度29.3°C（适宜22-26°C），氨气浓度18ppm（预警值20ppm），湿度76%，料肉比3.12（目标2.75）。请给出干预优先级和具体操作建议。",
  },
  {
    id: "pen7",
    name: "7号猪舍",
    count: 2800,
    temp: 24.1, tempAlert: "normal",
    nh3: 12,   nh3Alert: "normal",
    humidity: 68, humidAlert: "normal",
    feedRatio: 2.88, feedAlert: "warning",
    prompt: "7号猪舍2800头猪，各项环境指标正常（温度24.1°C，氨气12ppm，湿度68%），但料肉比2.88略高于目标2.75。请分析原因并给出优化饲喂方案。",
  },
  {
    id: "pen2",
    name: "2号猪舍",
    count: 2200,
    temp: 25.8, tempAlert: "normal",
    nh3: 15,   nh3Alert: "warning",
    humidity: 71, humidAlert: "normal",
    feedRatio: 2.95, feedAlert: "warning",
    note: "3头隔离观察",
    prompt: "2号猪舍2200头猪，3头已隔离（体温39.8°C，食欲下降）。氨气浓度15ppm偏高，料肉比2.95。请给出隔离猪只处置建议和全舍防疫加强措施。",
  },
  {
    id: "pen1",
    name: "1号猪舍",
    count: 1800,
    temp: 23.4, tempAlert: "normal",
    nh3: 10,   nh3Alert: "normal",
    humidity: 65, humidAlert: "normal",
    feedRatio: 2.81, feedAlert: "normal",
    prompt: "1号猪舍1800头猪，所有指标正常（温度23.4°C，氨气10ppm，湿度65%，料肉比2.81）。请评估当前饲料配方是否还有优化空间，以及接近出栏期的管理重点。",
  },
];

const ALERT_CLS: Record<AlertState, { val: string; bar: string }> = {
  danger:  { val: "text-red-600 font-black",   bar: "bg-red-500" },
  warning: { val: "text-amber-600 font-bold",  bar: "bg-amber-400" },
  normal:  { val: "text-zinc-700",             bar: "bg-emerald-400" },
};

const CARD_BORDER: Record<AlertState, string> = {
  danger:  "border-red-400 ring-1 ring-red-200",
  warning: "border-amber-400",
  normal:  "border-zinc-200",
};

function worstAlert(pen: Pen): AlertState {
  const states = [pen.tempAlert, pen.nh3Alert, pen.humidAlert, pen.feedAlert];
  if (states.includes("danger")) return "danger";
  if (states.includes("warning")) return "warning";
  return "normal";
}

function SensorBar({ value, max, state }: { value: number; max: number; state: AlertState }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
      <div className={`h-full rounded-full ${ALERT_CLS[state].bar}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

const DIAG_STEPS = ["环境传感器读取", "生产指标核算", "健康风险建模", "干预方案生成"];

type ActionMatrix = { urgent: string[]; today: string[]; routine: string[] };

const ACTION_MATRIX: Record<string, ActionMatrix> = {
  pen4: {
    urgent: ["立即开启备用风机，目标温度≤26°C", "检查饮水系统确保正常供给"],
    today: ["每2h巡检氨气，接近20ppm立即加强通风", "复核饲喂量，调整料肉比至2.75"],
    routine: ["记录当日环境参数", "下午5时汇报处置进展"],
  },
  pen7: {
    urgent: [],
    today: ["分析近7日采食量与料肉比趋势", "调整饲喂配方，优化能量蛋白比"],
    routine: ["正常巡检，维持各项指标", "每周上报生产日报"],
  },
  pen2: {
    urgent: ["3头隔离猪体温每4h监测一次", "全舍氨气抽排加强至≤12ppm"],
    today: ["出入口碘伏消毒（每班次）", "隔离区物品禁止与健康区混用"],
    routine: ["料肉比每周复核", "防疫记录实时更新"],
  },
  pen1: {
    urgent: [],
    today: [],
    routine: ["出栏前2周适度限能", "关注体重均匀度，规划出栏顺序", "维持当前管理水平"],
  },
};

export default function Page() {
  const [selected, setSelected] = useState<Pen | null>(null);
  const [diagStep, setDiagStep] = useState(-1);
  const [outputs, setOutputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const scanningRef = useRef<string | null>(null);

  async function analyze(pen: Pen) {
    if (loading) return;
    setSelected(pen);

    if (outputs[pen.id]) {
      setDiagStep(DIAG_STEPS.length);
      return;
    }

    scanningRef.current = pen.id;
    setDiagStep(0);

    for (let i = 1; i <= DIAG_STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, 560));
      if (scanningRef.current !== pen.id) return;
      setDiagStep(i);
    }

    if (scanningRef.current !== pen.id) return;
    setLoading(pen.id);
    try {
      await streamChat("agri-livestock", pen.prompt, (text) =>
        setOutputs((prev) => ({ ...prev, [pen.id]: text }))
      );
    } catch {
      setOutputs((prev) => ({ ...prev, [pen.id]: "分析失败，请重试" }));
    }
    setLoading(null);
  }

  const diagDone = diagStep >= DIAG_STEPS.length;
  const matrix = selected ? ACTION_MATRIX[selected.id] : null;

  return (
    <main className="min-h-screen bg-[#f8f1ef]">
      <header className="border-b border-black/10 bg-white px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-xs text-zinc-400 hover:text-zinc-700">← Demo 中心</Link>
            <div className="mt-0.5 text-xs font-semibold uppercase tracking-widest text-zinc-400">桌4 · 农牧 / AIoT</div>
            <h1 className="text-xl font-black text-zinc-950">牧场预警台</h1>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-rose-700">存栏 12.8万头</span>
            <span className="rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-rose-700">均重 68kg</span>
            <span className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-700">料肉比 2.98</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-5 sm:px-8">
        <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-5">
        {/* 圈舍监控网格 */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {PENS.map((pen) => {
            const worst = worstAlert(pen);
            const active = selected?.id === pen.id;
            return (
              <div
                key={pen.id}
                className={`rounded-xl border-2 bg-white p-4 shadow-sm transition ${CARD_BORDER[worst]} ${active ? "ring-2 ring-rose-300" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-black text-zinc-900">{pen.name}</div>
                    <div className="text-xs text-zinc-400">{pen.count.toLocaleString()} 头</div>
                  </div>
                  {pen.note && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">{pen.note}</span>
                  )}
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-zinc-400">温度</span>
                      <span className={ALERT_CLS[pen.tempAlert].val}>{pen.temp}°C</span>
                    </div>
                    <SensorBar value={pen.temp} max={35} state={pen.tempAlert} />
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-zinc-400">NH₃</span>
                      <span className={ALERT_CLS[pen.nh3Alert].val}>{pen.nh3} ppm</span>
                    </div>
                    <SensorBar value={pen.nh3} max={25} state={pen.nh3Alert} />
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-zinc-400">湿度</span>
                      <span className={ALERT_CLS[pen.humidAlert].val}>{pen.humidity}%</span>
                    </div>
                    <SensorBar value={pen.humidity} max={100} state={pen.humidAlert} />
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-zinc-400">料肉比</span>
                      <span className={ALERT_CLS[pen.feedAlert].val}>{pen.feedRatio}</span>
                    </div>
                    <SensorBar value={pen.feedRatio} max={3.5} state={pen.feedAlert} />
                  </div>
                </div>

                <button
                  onClick={() => analyze(pen)}
                  disabled={loading !== null}
                  className={`mt-4 w-full rounded-lg py-2 text-sm font-bold transition ${
                    active
                      ? "bg-rose-600 text-white"
                      : worst === "danger"
                      ? "bg-red-50 text-red-700 hover:bg-red-100"
                      : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  {active && loading === pen.id ? "诊断中…" : active && outputs[pen.id] ? "✓ 已诊断" : "AI 诊断"}
                </button>
              </div>
            );
          })}
        </div>

        {/* 诊断结果区 */}
        {selected && (
          <div className="grid gap-4 lg:grid-cols-2">
            {/* 左：诊断步骤 → 干预优先级矩阵 */}
            <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
              {!diagDone ? (
                <>
                  <div className="mb-5 text-xs font-semibold text-zinc-400">AI 诊断流程 · {selected.name}</div>
                  <div className="space-y-5">
                    {DIAG_STEPS.map((step, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-3 transition-opacity duration-300 ${
                          i < diagStep ? "opacity-100" : i === diagStep ? "opacity-90" : "opacity-20"
                        }`}
                      >
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                          i < diagStep
                            ? "bg-rose-500 text-white"
                            : i === diagStep
                            ? "border-2 border-rose-400 text-rose-600"
                            : "border-2 border-zinc-200 text-zinc-300"
                        }`}>
                          {i < diagStep ? "✓" : i + 1}
                        </div>
                        <span className={`text-sm font-medium ${
                          i < diagStep ? "text-zinc-400 line-through" : i === diagStep ? "text-zinc-900" : "text-zinc-300"
                        }`}>
                          {step}
                          {i === diagStep && (
                            <span className="ml-2 inline-flex gap-0.5">
                              {[0, 0.15, 0.3].map((d, j) => (
                                <span key={j} className="animate-bounce text-rose-500" style={{ animationDelay: `${d}s` }}>·</span>
                              ))}
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : matrix ? (
                <>
                  <div className="mb-4 text-xs font-semibold text-zinc-400">干预优先级矩阵 · {selected.name}</div>
                  <div className="space-y-3">
                    {matrix.urgent.length > 0 && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-red-500" />
                          <span className="text-xs font-bold text-red-700">紧急行动</span>
                        </div>
                        <ul className="space-y-1.5">
                          {matrix.urgent.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-zinc-800">
                              <span className="mt-0.5 font-bold text-red-500">!</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {matrix.today.length > 0 && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-amber-400" />
                          <span className="text-xs font-bold text-amber-700">今日跟进</span>
                        </div>
                        <ul className="space-y-1.5">
                          {matrix.today.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-zinc-800">
                              <span className="mt-0.5 text-amber-500">▸</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {matrix.routine.length > 0 && (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-400" />
                          <span className="text-xs font-bold text-emerald-700">常规监控</span>
                        </div>
                        <ul className="space-y-1.5">
                          {matrix.routine.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-zinc-800">
                              <span className="mt-0.5 text-emerald-500">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            {/* 右：AI 干预建议 */}
            <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <div className="text-xs font-semibold text-zinc-400">AI 干预建议 · {selected.name}</div>
                {loading === selected.id && (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-rose-400 border-t-transparent" />
                )}
              </div>
              {!diagDone ? (
                <div className="flex h-40 items-center justify-center text-sm text-zinc-300">
                  诊断完成后显示
                </div>
              ) : loading === selected.id && !outputs[selected.id] ? (
                <div className="flex gap-1 text-zinc-400">
                  {[0, 0.15, 0.3].map((d, i) => (
                    <span key={i} className="animate-bounce text-xl" style={{ animationDelay: `${d}s` }}>·</span>
                  ))}
                </div>
              ) : outputs[selected.id] ? (
                <div className="whitespace-pre-wrap text-sm leading-7 text-zinc-800">{outputs[selected.id]}</div>
              ) : null}
            </div>
          </div>
        )}
        </div>

        {/* 卡组面板 */}
        <div className="lg:sticky lg:top-5 lg:self-start">
          <CardPanel
            mission={{
              type: "质量目标",
              subtitle: "不靠老师傅也稳定 · AIoT全自动预警",
              template: "把疫病漏诊率\n降低 60%",
            }}
            task={{ tasks: ["环境预警", "健康预警", "症状归因", "栏舍报告"], mode: "机器干" }}
            agents={["A-02 分析", "A-03 识别"]}
            skills={["数据分析", "预测预警", "设备联动", "报告生成"]}
            infra={["I-01 算力", "I-02 大模型", "I-05 工具集成"]}
          />
        </div>
        </div>
      </div>
    </main>
  );
}
