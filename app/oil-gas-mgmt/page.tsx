"use client";

import Link from "next/link";
import { useState } from "react";
import CardPanel from "@/app/components/CardPanel";
import { streamChat } from "@/app/lib/stream-chat";

type TrendDir = "up" | "down" | "flat";
type Status = "high" | "warn" | "ok";
type CostItem = {
  id: string;
  name: string;
  amount: string;
  amountNum: number;
  trend: string;
  trendDir: TrendDir;
  status: Status;
  prompt: string;
};

const COST_ITEMS: CostItem[] = [
  {
    id: "field",
    name: "野外采集队作业",
    amount: "¥2,340万",
    amountNum: 2340,
    trend: "+8.2%",
    trendDir: "up",
    status: "high",
    prompt: "野外采集队12支，共816人，本月作业费¥2340万，较上月上涨8.2%。帮我分析成本上涨原因，以及用AI辅助可以降低哪些环节的成本？给出量化建议。",
  },
  {
    id: "processing",
    name: "数据处理中心运营",
    amount: "¥1,820万",
    amountNum: 1820,
    trend: "-2.1%",
    trendDir: "down",
    status: "ok",
    prompt: "数据处理中心日处理地震数据1.2TB，运营成本¥1820万，同比下降2.1%，但人工复核耗时占比仍43%。请分析还有哪些自动化空间，给出ROI估算。",
  },
  {
    id: "report",
    name: "报告编写人力",
    amount: "¥980万",
    amountNum: 980,
    trend: "+1.3%",
    trendDir: "up",
    status: "warn",
    prompt: "研究院42名高级解释人员，人均产出3.1份报告/月，报告编写人力成本¥980万。试点AI辅助后产出提升87%。帮我测算如全面推广，年度可节省多少人力成本？",
  },
  {
    id: "hpc",
    name: "智算集群运维",
    amount: "¥1,800万",
    amountNum: 1800,
    trend: "+0.0%",
    trendDir: "flat",
    status: "warn",
    prompt: "智算集群年运维投入¥1800万，平均利用率61%，峰值期97%，目前23个作业排队。从投资回报角度帮我分析：该扩容、维持还是优化调度？给出决策建议。",
  },
  {
    id: "travel",
    name: "差旅及现场费用",
    amount: "¥560万",
    amountNum: 560,
    trend: "-5.2%",
    trendDir: "down",
    status: "ok",
    prompt: "野外现场及差旅费用¥560万，同比下降5.2%。分析远程监控和AI辅助能否进一步压缩现场人员需求，给出可行性评估。",
  },
];

const STATUS_CLS: Record<Status, { dot: string; badge: string; row: string }> = {
  high: { dot: "bg-red-500", badge: "bg-red-100 text-red-700", row: "hover:bg-red-50" },
  warn: { dot: "bg-amber-500", badge: "bg-amber-100 text-amber-700", row: "hover:bg-amber-50" },
  ok:   { dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700", row: "hover:bg-emerald-50" },
};
const STATUS_LABEL: Record<Status, string> = { high: "偏高", warn: "关注", ok: "正常" };
const TREND_CLS: Record<TrendDir, string> = { up: "text-red-600", down: "text-emerald-600", flat: "text-zinc-400" };

const TOTAL = COST_ITEMS.reduce((s, c) => s + c.amountNum, 0);

export default function Page() {
  const [selected, setSelected] = useState<CostItem | null>(null);
  const [analysis, setAnalysis] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [reportInput, setReportInput] = useState("");
  const [reportOutput, setReportOutput] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);

  async function selectItem(item: CostItem) {
    setSelected(item);
    setShowReport(false);
    if (analysis[item.id]) return;
    setLoading(item.id);
    try {
      await streamChat("oil-gas-mgmt", item.prompt, (text) =>
        setAnalysis((prev) => ({ ...prev, [item.id]: text }))
      );
    } catch { setAnalysis((prev) => ({ ...prev, [item.id]: "获取分析失败，请重试" })); }
    setLoading(null);
  }

  async function genReport() {
    const content = reportInput.trim() || "帮我起草本周数智化项目进展管理周报，涵盖三个攻关组的进度、成本和下周计划。";
    setReportLoading(true);
    setReportOutput("");
    try {
      await streamChat("oil-gas-mgmt", content, setReportOutput);
    } catch { setReportOutput("网络错误，请重试"); }
    setReportLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#f4f0e8]">
      <header className="border-b border-black/10 bg-white px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-xs text-zinc-400 hover:text-zinc-700">← Demo 中心</Link>
            <div className="mt-0.5 text-xs font-semibold uppercase tracking-widest text-zinc-400">桌1 · 油气能源 · 管理层</div>
            <h1 className="text-xl font-black text-zinc-950">作业成本智能分析</h1>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            {["87% 产出提升", "42 名专家", "61% 集群利用率"].map((s) => (
              <span key={s} className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-700">{s}</span>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
        {/* 成本明细表 */}
        <section className="space-y-4">
          <div className="rounded-xl border border-black/10 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-zinc-100 px-5 py-3 flex items-center justify-between">
              <div className="text-sm font-black text-zinc-900">本月成本明细</div>
              <div className="text-xs text-zinc-400">点击行查看 AI 分析</div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs font-semibold text-zinc-400">
                  <th className="px-5 py-3">项目</th>
                  <th className="px-3 py-3 text-right">金额</th>
                  <th className="px-3 py-3 text-right">环比</th>
                  <th className="px-3 py-3 text-right">占比</th>
                  <th className="px-5 py-3 text-right">状态</th>
                </tr>
              </thead>
              <tbody>
                {COST_ITEMS.map((item) => {
                  const s = STATUS_CLS[item.status];
                  const active = selected?.id === item.id;
                  const pct = Math.round((item.amountNum / TOTAL) * 100);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => selectItem(item)}
                      className={`cursor-pointer border-b border-zinc-50 transition ${s.row} ${active ? "bg-amber-50" : ""}`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 shrink-0 rounded-full ${s.dot}`} />
                          <span className="font-semibold text-zinc-800">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-right font-mono font-bold text-zinc-900">{item.amount}</td>
                      <td className={`px-3 py-4 text-right font-semibold ${TREND_CLS[item.trendDir]}`}>{item.trend}</td>
                      <td className="px-3 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                            <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-zinc-400 w-7">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.badge}`}>
                          {STATUS_LABEL[item.status]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-zinc-50">
                  <td className="px-5 py-3 text-xs font-bold text-zinc-500">合计</td>
                  <td className="px-3 py-3 text-right font-mono font-black text-zinc-900">¥{TOTAL.toLocaleString()}万</td>
                  <td colSpan={3} />
                </tr>
              </tbody>
            </table>
          </div>

          {/* 管理周报 */}
          <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-black text-zinc-900">管理周报生成</div>
              <button onClick={() => setShowReport(!showReport)}
                className="text-xs font-semibold text-amber-600 hover:text-amber-800">
                {showReport ? "收起" : "展开"}
              </button>
            </div>
            {showReport && (
              <div className="mt-4 space-y-3">
                <textarea
                  value={reportInput}
                  onChange={(e) => setReportInput(e.target.value)}
                  placeholder="帮我起草本周数智化项目进展管理周报，涵盖三个攻关组的进度、成本和下周计划。"
                  rows={3}
                  className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-200"
                />
                <button onClick={genReport} disabled={reportLoading}
                  className="w-full rounded-lg bg-amber-600 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50">
                  {reportLoading ? "生成中…" : "生成周报"}
                </button>
                {reportOutput && (
                  <div className="rounded-lg bg-amber-50 p-4 text-sm leading-7 text-zinc-800 whitespace-pre-wrap">{reportOutput}</div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* 分析面板 */}
        <aside className="space-y-4">
          <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm min-h-[24rem]">
            {!selected ? (
              <div className="flex h-72 flex-col items-center justify-center text-center text-sm text-zinc-400">
                <div className="text-3xl mb-3">←</div>
                <div>点击左侧成本项目</div>
                <div className="text-xs mt-1">AI 实时分析该项目的降本空间</div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${STATUS_CLS[selected.status].dot}`} />
                  <div className="text-xs font-semibold text-zinc-400">AI 分析</div>
                </div>
                <div className="mt-1 text-lg font-black text-zinc-900">{selected.name}</div>
                <div className="mt-0.5 flex items-baseline gap-2">
                  <span className="font-mono text-2xl font-black text-zinc-800">{selected.amount}</span>
                  <span className={`text-sm font-semibold ${TREND_CLS[selected.trendDir]}`}>{selected.trend}</span>
                </div>
                <div className="mt-4">
                  {loading === selected.id ? (
                    <div className="flex gap-1 text-zinc-400">
                      {[0, 0.15, 0.3].map((d, i) => (
                        <span key={i} className="animate-bounce text-xl" style={{ animationDelay: `${d}s` }}>·</span>
                      ))}
                    </div>
                  ) : analysis[selected.id] ? (
                    <div className="text-sm leading-7 text-zinc-700 whitespace-pre-wrap">{analysis[selected.id]}</div>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          {/* 卡组面板 */}
          <CardPanel
            mission={{
              type: "降本目标",
              subtitle: "省人省钱 · AI取代重复性人工分析",
              template: "把报告编写的\n人力成本降低 40%",
            }}
            task={{ tasks: ["成本分析", "作业日报", "参数复盘"], mode: "人机合作" }}
            agents={["A-02 分析", "A-04 专家", "A-05 写手"]}
            skills={["数据分析", "表格分析", "预测优化", "报告生成"]}
            infra={["I-02 大模型", "I-03 知识库", "I-04 Agent运行"]}
          />
        </aside>
      </div>
    </main>
  );
}
