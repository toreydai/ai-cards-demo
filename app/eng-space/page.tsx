"use client";

import Link from "next/link";
import { useState } from "react";
import CardPanel from "@/app/components/CardPanel";
import { streamChat } from "@/app/lib/stream-chat";

type Severity = "danger" | "warning" | "ok";

type PipePoint = {
  id: string;
  km: string;
  label: string;
  type: string;
  severity: Severity;
  detail: string;
  prompt: string;
};

const PIPELINE: PipePoint[] = [
  {
    id: "p1",
    km: "K089",
    label: "阴极保护异常",
    type: "腐蚀风险",
    severity: "danger",
    detail: "管地电位 -0.62V，低于保护标准 -0.85V",
    prompt: "K089阀室管地电位-0.62V，低于保护标准-0.85V。帮我分析腐蚀风险等级，给出紧急处置方案和长期整改建议，包括临时牺牲阳极安装方案。",
  },
  {
    id: "p2",
    km: "K145",
    label: "InSAR地面沉降",
    type: "地质风险",
    severity: "warning",
    detail: "累计沉降 8.7mm，预警阈值 10mm",
    prompt: "K145-K167段卫星InSAR数据显示累计地面沉降8.7mm，预警阈值10mm，沉降速率加快。帮我综合评估风险等级，给出处置优先级和现场核查要点。",
  },
  {
    id: "p3",
    km: "K167",
    label: "地质监测正常",
    type: "例行巡检",
    severity: "ok",
    detail: "本月沉降量 0.3mm，趋势平稳",
    prompt: "K167段本月地质监测正常，沉降量0.3mm，趋势平稳。请给出下月巡检计划建议和关键监测参数设置。",
  },
  {
    id: "p4",
    km: "K203",
    label: "第三方施工侵入",
    type: "安全管控",
    severity: "danger",
    detail: "重型机械距管道 45m，保护范围 50m",
    prompt: "K203穿越点附近有重型机械距管道45m，保护范围50m。帮我起草一份现场安全管控通知，要求对方停工并按规程报批，说明法规依据。",
  },
  {
    id: "p5",
    km: "K241",
    label: "防腐层检测",
    type: "例行巡检",
    severity: "ok",
    detail: "防腐层完好率 96.2%，在目标范围内",
    prompt: "K241段防腐层检测完好率96.2%，年度目标95%。请评估防腐层状态，给出下次开挖检测的时间建议和重点检测部位。",
  },
  {
    id: "p6",
    km: "K318",
    label: "阀门操作异常",
    type: "设备风险",
    severity: "warning",
    detail: "截断阀开关扭矩超标 15%",
    prompt: "K318截断阀开关扭矩超标15%，近期操作阻力增大。帮我分析可能原因，给出现场快速检查步骤和是否需要立即更换的判断标准。",
  },
];

const SEV_CLS: Record<Severity, { dot: string; border: string; badge: string; badgeBg: string }> = {
  danger:  { dot: "bg-red-500",     border: "border-red-300",   badge: "text-red-700",     badgeBg: "bg-red-100" },
  warning: { dot: "bg-amber-400",   border: "border-amber-300", badge: "text-amber-700",   badgeBg: "bg-amber-100" },
  ok:      { dot: "bg-emerald-400", border: "border-zinc-200",  badge: "text-emerald-700", badgeBg: "bg-emerald-100" },
};
const SEV_LABEL: Record<Severity, string> = { danger: "紧急", warning: "关注", ok: "正常" };

const RISK_SCORES: Record<string, { score: number; steps: string[] }> = {
  p1: { score: 92, steps: ["48h内安装临时牺牲阳极", "切断K089外部杂散电流源", "安排专业腐蚀检测队到场", "72h内提交整改报告"] },
  p2: { score: 74, steps: ["本周内安排现场地质核查", "加密InSAR监测频率至每周", "评估K145段管道应力状态", "超阈值预案进入就绪状态"] },
  p3: { score: 18, steps: ["下月按计划执行例行巡检", "更新地质监测数据记录", "维持月度上报频率"] },
  p4: { score: 95, steps: ["立即要求施工方现场停工", "设立安全警示标识和隔离带", "向主管部门报告并留存证据", "起草并发出安全管控通知书"] },
  p5: { score: 22, steps: ["归档本次检测报告", "确定下次开挖检测时间", "标注重点检测管段坐标"] },
  p6: { score: 58, steps: ["现场实测扭矩并与档案对比", "查阅阀门维护历史记录", "联系设备厂商确认更换标准", "24h内给出是否更换结论"] },
};

function scoreColor(score: number) {
  if (score >= 80) return { bar: "bg-red-500",     text: "text-red-600",     label: "高风险", bg: "bg-red-50",     border: "border-red-200" };
  if (score >= 50) return { bar: "bg-amber-400",   text: "text-amber-600",   label: "中等风险", bg: "bg-amber-50",   border: "border-amber-200" };
  return               { bar: "bg-emerald-400", text: "text-emerald-600", label: "低风险", bg: "bg-emerald-50", border: "border-emerald-200" };
}

export default function Page() {
  const [selected, setSelected] = useState<PipePoint | null>(null);
  const [outputs, setOutputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [reportLoading, setReportLoading] = useState(false);
  const [report, setReport] = useState("");

  async function analyze(point: PipePoint) {
    setSelected(point);
    setReport("");
    if (outputs[point.id]) return;
    setLoading(point.id);
    try {
      await streamChat("eng-space", point.prompt, (text) =>
        setOutputs((prev) => ({ ...prev, [point.id]: text }))
      );
    } catch {
      setOutputs((prev) => ({ ...prev, [point.id]: "分析失败，请重试" }));
    }
    setLoading(null);
  }

  async function genReport() {
    if (reportLoading) return;
    setSelected(null);
    setReportLoading(true);
    setReport("");
    const prompt = "帮我生成2026-06-12管道综合巡检日报，涵盖以下三处风险点的发现、分析和处置建议：K089阴极保护异常（管地电位-0.62V）、K145地面沉降（8.7mm接近预警）、K203第三方施工侵入（重型机械距管道45m）。";
    try {
      await streamChat("eng-space", prompt, setReport);
    } catch { setReport("生成失败，请重试"); }
    setReportLoading(false);
  }

  function toggleItem(key: string) {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const riskData = selected ? RISK_SCORES[selected.id] : null;
  const sc = riskData ? scoreColor(riskData.score) : null;

  return (
    <main className="min-h-screen bg-[#f0f4f8]">
      <header className="border-b border-black/10 bg-white px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-xs text-zinc-400 hover:text-zinc-700">← Demo 中心</Link>
            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">桌9 · 工程 + 航天科技</div>
            <h1 className="text-xl font-black text-zinc-950">管线巡检台</h1>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-red-700">2 紧急风险</span>
            <span className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-700">2 关注</span>
            <span className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-zinc-600">总里程 318km</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-5 sm:px-8">
        <div className="grid gap-5 lg:grid-cols-[320px_1fr_20rem]">
          {/* 左：时间轴 */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-zinc-400">巡检时间轴 · 点击节点查看详情</div>
            <div className="relative pl-6">
              <div className="absolute left-3 top-3 h-[calc(100%-1.5rem)] w-0.5 bg-zinc-200" />
              <div className="space-y-2">
                {PIPELINE.map((point) => {
                  const cls = SEV_CLS[point.severity];
                  const active = selected?.id === point.id;
                  return (
                    <button
                      key={point.id}
                      onClick={() => analyze(point)}
                      className={`relative w-full rounded-lg border-2 bg-white p-3 text-left shadow-sm transition hover:shadow-md ${cls.border} ${active ? "ring-2 ring-teal-300" : ""}`}
                    >
                      <div className={`absolute -left-[1.45rem] top-4 h-3.5 w-3.5 rounded-full border-2 border-white ${cls.dot} shadow`} />
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[11px] font-bold text-zinc-400">{point.km}</div>
                          <div className="text-sm font-black text-zinc-900">{point.label}</div>
                          <div className="text-[11px] text-zinc-500">{point.detail}</div>
                        </div>
                        <div className="shrink-0 space-y-1 text-right">
                          <span className={`block rounded-full px-2 py-0.5 text-[10px] font-bold ${cls.badgeBg} ${cls.badge}`}>
                            {SEV_LABEL[point.severity]}
                          </span>
                          <span className="block text-[10px] text-zinc-400">{point.type}</span>
                        </div>
                      </div>
                      {loading === point.id && (
                        <div className="mt-2 h-1 overflow-hidden rounded-full bg-zinc-100">
                          <div className="h-full w-1/2 animate-pulse rounded-full bg-teal-400" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={genReport}
              disabled={reportLoading}
              className="mt-2 w-full rounded-xl border border-teal-300 bg-teal-600 py-3 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-50"
            >
              {reportLoading ? "生成中…" : "📋 生成今日巡检日报"}
            </button>
          </div>

          {/* 右：风险评分 + 处置清单 + AI 分析 */}
          <div className="space-y-4">
            {!selected && !report && (
              <div className="flex h-64 items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-white text-sm text-zinc-400">
                点击左侧节点查看 AI 风险分析，或生成日报
              </div>
            )}

            {selected && riskData && sc && (
              <>
                {/* 风险量化评分 */}
                <div className={`overflow-hidden rounded-xl border ${sc.border} ${sc.bg} shadow-sm`}>
                  <div className="flex items-center justify-between px-5 py-4">
                    <div>
                      <div className="text-[11px] font-semibold text-zinc-500">{selected.km} · {selected.type}</div>
                      <div className="mt-0.5 text-lg font-black text-zinc-900">{selected.label}</div>
                      <div className="mt-1 text-xs text-zinc-500">{selected.detail}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-zinc-500">综合风险评分</div>
                      <div className={`text-5xl font-black leading-none ${sc.text}`}>{riskData.score}</div>
                      <div className={`mt-1 text-xs font-bold ${sc.text}`}>{sc.label}</div>
                    </div>
                  </div>
                  <div className="px-5 pb-4">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/60">
                      <div className={`h-full rounded-full transition-all duration-700 ${sc.bar}`} style={{ width: `${riskData.score}%` }} />
                    </div>
                  </div>
                </div>

                {/* 处置步骤清单 */}
                <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
                  <div className="mb-4 text-xs font-semibold text-zinc-400">处置步骤清单 · 点击勾选完成项</div>
                  <div className="space-y-2">
                    {riskData.steps.map((step, i) => {
                      const key = `${selected.id}-${i}`;
                      const checked = checkedItems.has(key);
                      return (
                        <button
                          key={i}
                          onClick={() => toggleItem(key)}
                          className="flex w-full items-start gap-3 rounded-lg p-2.5 text-left transition hover:bg-zinc-50"
                        >
                          <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                            checked ? "border-teal-500 bg-teal-500" : "border-zinc-300"
                          }`}>
                            {checked && <span className="text-white text-xs font-bold">✓</span>}
                          </div>
                          <div className="flex items-start gap-2">
                            <span className={`text-xs font-bold ${checked ? "text-zinc-300" : "text-teal-600"}`}>{String(i + 1).padStart(2, "0")}</span>
                            <span className={`text-sm ${checked ? "text-zinc-400 line-through" : "text-zinc-800"}`}>{step}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {riskData.steps.length > 0 && (
                    <div className="mt-3 border-t border-zinc-100 pt-3 text-xs text-zinc-400">
                      已完成 {Array.from(checkedItems).filter(k => k.startsWith(selected.id)).length} / {riskData.steps.length} 项
                    </div>
                  )}
                </div>

                {/* AI 分析报告 */}
                <div className="rounded-xl border border-black/10 bg-white shadow-sm">
                  <div className="border-l-4 border-teal-500 px-5 py-4">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="text-xs font-semibold text-teal-700">AI 风险分析报告</div>
                      {loading === selected.id && (
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
                      )}
                    </div>
                    {loading === selected.id && !outputs[selected.id] ? (
                      <div className="flex gap-1 text-zinc-300">
                        {[0, 0.15, 0.3].map((d, i) => (
                          <span key={i} className="animate-bounce text-xl" style={{ animationDelay: `${d}s` }}>·</span>
                        ))}
                      </div>
                    ) : outputs[selected.id] ? (
                      <div className="whitespace-pre-wrap text-sm leading-7 text-zinc-700">{outputs[selected.id]}</div>
                    ) : null}
                  </div>
                </div>
              </>
            )}

            {/* 日报 */}
            {report && (
              <div className="rounded-xl border border-black/10 bg-white shadow-sm">
                <div className="border-b border-zinc-100 px-5 py-4">
                  <div className="text-xs text-zinc-400">今日巡检日报 · 2026-06-12</div>
                  <div className="text-lg font-black text-zinc-900">管道综合巡检日报</div>
                </div>
                <div className="border-l-4 border-teal-500 px-5 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="text-xs font-semibold text-teal-700">AI 生成</div>
                    {reportLoading && (
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
                    )}
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-7 text-zinc-700">{report}</div>
                </div>
              </div>
            )}
          </div>

          {/* 卡组面板 */}
          <div className="lg:sticky lg:top-5 lg:self-start">
            <CardPanel
              mission={{
                type: "质量目标",
                subtitle: "不靠老师傅也稳定 · AI完整性管理",
                template: "把安全隐患\n漏检率降低 70%",
              }}
              task={{ tasks: ["完整性管理", "隐患标记", "巡检识别", "作业日报"], mode: "人机合作" }}
              agents={["A-02 分析", "A-04 专家"]}
              skills={["数据分析", "风险匹配", "高风险确认", "报告生成"]}
              infra={["I-02 大模型", "I-03 知识库", "I-06 数据底座"]}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
