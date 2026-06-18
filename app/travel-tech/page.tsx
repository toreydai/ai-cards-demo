"use client";

import Link from "next/link";
import { useState } from "react";
import CardPanel from "@/app/components/CardPanel";
import { streamChat } from "@/app/lib/stream-chat";

type Trend = "up" | "down" | "flat";
type OppLevel = "S" | "A" | "B";

type Route = {
  id: string;
  route: string;
  price: number;
  load: number;
  yoy: number;
  trend: Trend;
  gap: number;
  competitor: string;
  prompt: string;
};

type Opportunity = {
  routeId: string;
  level: OppLevel;
  title: string;
  value: string;
  reason: string;
  action: string;
};

const ROUTES: Route[] = [
  {
    id: "r1",
    route: "广州 → 成都",
    price: 680,
    load: 88,
    yoy: 18,
    trend: "up",
    gap: -12,
    competitor: "竞争激烈",
    prompt: "广州-成都航线均价680元，客座率88%，同比增18%，但缺舱率12%。帮我分析增长驱动因素，给出提升分销深度和客座率的具体建议。",
  },
  {
    id: "r2",
    route: "上海 → 三亚",
    price: 1240,
    load: 94,
    yoy: 31,
    trend: "up",
    gap: 0,
    competitor: "供给紧张",
    prompt: "上海-三亚暑期溢价已启动，均价1240元，客座率94%，同比增31%。帮我分析暑期出行数据，给出分销策略和库存管理建议。",
  },
  {
    id: "r3",
    route: "北京 → 昆明",
    price: 890,
    load: 71,
    yoy: -4,
    trend: "down",
    gap: 8,
    competitor: "超卖风险",
    prompt: "北京-昆明均价890元，客座率71%，同比下降4%，有8%超卖风险。帮我分析客座率下滑原因，给出需求刺激方案和超卖处置预案。",
  },
  {
    id: "r4",
    route: "深圳 → 重庆",
    price: 520,
    load: 82,
    yoy: 9,
    trend: "flat",
    gap: -5,
    competitor: "稳定",
    prompt: "深圳-重庆均价520元，客座率82%，同比增9%，商旅占比高达45%。帮我识别高价值商旅客群特征，给出提升客单价的方案。",
  },
  {
    id: "r5",
    route: "成都 → 杭州",
    price: 750,
    load: 77,
    yoy: 22,
    trend: "up",
    gap: -3,
    competitor: "新兴增长",
    prompt: "成都-杭州新兴网红线，均价750元，客座率77%，同比增22%，年轻客群为主。帮我分析新兴旅游线路的商机，给出针对年轻用户的分销渠道和产品建议。",
  },
];

const OPPORTUNITIES: Opportunity[] = [
  { routeId: "r2", level: "S", title: "暑期溢价窗口", value: "+¥280万/月", reason: "客座率94%，供给紧张，溢价空间未充分释放", action: "立即提价8%，联系蜜鸟谈保量协议" },
  { routeId: "r1", level: "A", title: "缺舱补充机会", value: "+¥160万/月", reason: "缺舱率12%，高成长线路，分销深度不足", action: "优先补入广州-成都额外时刻，扩大分销商覆盖" },
  { routeId: "r5", level: "A", title: "年轻客群渗透", value: "+¥95万/季", reason: "成都-杭州同比增22%，年轻用户主导，渠道红利期", action: "与抖音旅行、小红书合作套餐产品" },
  { routeId: "r4", level: "B", title: "商旅客单价提升", value: "+¥60万/季", reason: "商旅占比45%，但当前无差异化产品", action: "推出商务舱套餐，接入企业直连采购" },
];

const OPP_CLS: Record<OppLevel, { badge: string; border: string; bg: string }> = {
  S: { badge: "bg-fuchsia-600 text-white", border: "border-fuchsia-300", bg: "bg-fuchsia-50" },
  A: { badge: "bg-violet-600 text-white",  border: "border-violet-300",  bg: "bg-violet-50" },
  B: { badge: "bg-zinc-400 text-white",    border: "border-zinc-200",    bg: "" },
};

const TREND_ICON: Record<Trend, { icon: string; cls: string }> = {
  up:   { icon: "↑", cls: "text-emerald-600" },
  down: { icon: "↓", cls: "text-red-500" },
  flat: { icon: "→", cls: "text-zinc-400" },
};

type ScanState = "idle" | "scanning" | "done";

export default function Page() {
  const [scan, setScan] = useState<ScanState>("idle");
  const [scanIdx, setScanIdx] = useState(-1);
  const [showOpps, setShowOpps] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [outputs, setOutputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);

  async function startScan() {
    if (scan !== "idle") return;
    setScan("scanning");
    setShowOpps(false);
    setSelectedOpp(null);

    for (let i = 0; i < ROUTES.length; i++) {
      setScanIdx(i);
      await new Promise((r) => setTimeout(r, 600));
    }
    setScanIdx(-1);
    setScan("done");
    setShowOpps(true);
  }

  function reset() {
    setScan("idle");
    setScanIdx(-1);
    setShowOpps(false);
    setSelectedOpp(null);
  }

  async function viewDetail(opp: Opportunity) {
    setSelectedOpp(opp);
    const route = ROUTES.find((r) => r.id === opp.routeId);
    if (!route || outputs[opp.routeId]) return;
    const routeId = opp.routeId;
    setLoading(routeId);
    try {
      await streamChat("travel-tech", route.prompt, (text) =>
        setOutputs((prev) => ({ ...prev, [routeId]: text }))
      );
    } catch {
      setOutputs((prev) => ({ ...prev, [routeId]: "分析失败，请重试" }));
    }
    setLoading(null);
  }

  return (
    <main className="min-h-screen bg-[#f5f0fa]">
      <header className="border-b border-black/10 bg-white px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-xs text-zinc-400 hover:text-zinc-700">← Demo 中心</Link>
            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">桌10 · 出行 + 科技混合</div>
            <h1 className="text-xl font-black text-zinc-950">票务商机雷达</h1>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-md border border-fuchsia-200 bg-fuchsia-50 px-3 py-1.5 text-fuchsia-700">5条核心航线</span>
            <span className="rounded-md border border-violet-200 bg-violet-50 px-3 py-1.5 text-violet-700">暑期旺季窗口</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-5 sm:px-8">
        <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-5">
        {/* 航线数据表格 */}
        <div className="rounded-xl border border-black/10 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3">
            <div>
              <div className="text-sm font-black text-zinc-900">TOP5 航线数据看板</div>
              <div className="text-xs text-zinc-400">2026年6月 · 实时票务数据</div>
            </div>
            <div className="flex gap-2">
              {scan === "done" && (
                <button onClick={reset} className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-500 hover:bg-zinc-50">
                  重置
                </button>
              )}
              <button
                onClick={startScan}
                disabled={scan === "scanning"}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                  scan === "idle"
                    ? "bg-fuchsia-600 text-white hover:bg-fuchsia-700"
                    : scan === "scanning"
                      ? "bg-fuchsia-400 text-white opacity-75"
                      : "bg-emerald-600 text-white"
                }`}
              >
                {scan === "idle" ? "🔍 AI 挖掘商机" : scan === "scanning" ? "扫描中…" : "✓ 商机已识别"}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-xs text-zinc-400">
                  <th className="px-5 py-2.5 text-left font-semibold">航线</th>
                  <th className="px-4 py-2.5 text-right font-semibold">均价</th>
                  <th className="px-4 py-2.5 text-right font-semibold">客座率</th>
                  <th className="px-4 py-2.5 text-right font-semibold">同比</th>
                  <th className="px-4 py-2.5 text-left font-semibold">竞对状态</th>
                  <th className="px-4 py-2.5 text-left font-semibold">缺/超</th>
                </tr>
              </thead>
              <tbody>
                {ROUTES.map((route, idx) => {
                  const isScanning = scan === "scanning" && scanIdx === idx;
                  const scanned = scan === "done" || (scan === "scanning" && scanIdx > idx);
                  const opp = OPPORTUNITIES.find((o) => o.routeId === route.id);
                  return (
                    <tr
                      key={route.id}
                      className={`border-b border-zinc-50 transition-colors duration-300 ${
                        isScanning
                          ? "bg-fuchsia-50"
                          : scanned && opp
                            ? opp.level === "S" ? "bg-fuchsia-50/60" : opp.level === "A" ? "bg-violet-50/60" : ""
                            : "hover:bg-zinc-50"
                      }`}
                    >
                      <td className="px-5 py-3 font-semibold text-zinc-900">
                        <div className="flex items-center gap-2">
                          {isScanning && <span className="h-2 w-2 animate-pulse rounded-full bg-fuchsia-500" />}
                          {scanned && opp && (
                            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${OPP_CLS[opp.level].badge}`}>
                              {opp.level}
                            </span>
                          )}
                          {route.route}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-zinc-800">¥{route.price}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-100">
                            <div
                              className={`h-full rounded-full ${route.load >= 90 ? "bg-red-400" : route.load >= 80 ? "bg-amber-400" : "bg-zinc-300"}`}
                              style={{ width: `${route.load}%` }}
                            />
                          </div>
                          <span className="font-semibold text-zinc-700">{route.load}%</span>
                        </div>
                      </td>
                      <td className={`px-4 py-3 text-right font-bold ${TREND_ICON[route.trend].cls}`}>
                        {TREND_ICON[route.trend].icon} {Math.abs(route.yoy)}%
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500">{route.competitor}</td>
                      <td className="px-4 py-3 text-xs">
                        {route.gap < 0 ? (
                          <span className="text-red-600">缺舱 {Math.abs(route.gap)}%</span>
                        ) : route.gap > 0 ? (
                          <span className="text-amber-600">超卖 {route.gap}%</span>
                        ) : (
                          <span className="text-zinc-400">均衡</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 商机卡片 */}
        {showOpps && (
          <div>
            <div className="mb-3 text-sm font-black text-zinc-900">AI 识别商机 · 按优先级排序</div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {OPPORTUNITIES.map((opp) => {
                const cls = OPP_CLS[opp.level];
                const active = selectedOpp?.routeId === opp.routeId;
                return (
                  <button
                    key={opp.routeId}
                    onClick={() => viewDetail(opp)}
                    className={`rounded-xl border-2 bg-white p-4 text-left shadow-sm transition hover:shadow-md ${cls.border} ${active ? "ring-2 ring-fuchsia-300" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-black ${cls.badge}`}>{opp.level}级商机</span>
                      <span className="text-xs font-bold text-fuchsia-700">{opp.value}</span>
                    </div>
                    <div className="mt-2 text-sm font-black text-zinc-900">{opp.title}</div>
                    <div className="mt-1 text-xs leading-4 text-zinc-500">{opp.reason}</div>
                    <div className={`mt-3 rounded-lg p-2 text-xs text-zinc-700 ${cls.bg}`}>{opp.action}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* AI 详情分析 */}
        {selectedOpp && (
          <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="text-xs font-semibold text-zinc-400">
                AI 深度分析 · {ROUTES.find((r) => r.id === selectedOpp.routeId)?.route}
              </div>
              {loading === selectedOpp.routeId && (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-fuchsia-500 border-t-transparent" />
              )}
            </div>
            {loading === selectedOpp.routeId && !outputs[selectedOpp.routeId] ? (
              <div className="mt-3 flex gap-1 text-zinc-300">
                {[0, 0.15, 0.3].map((d, i) => (
                  <span key={i} className="animate-bounce text-xl" style={{ animationDelay: `${d}s` }}>·</span>
                ))}
              </div>
            ) : outputs[selectedOpp.routeId] ? (
              <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-800">{outputs[selectedOpp.routeId]}</div>
            ) : null}
          </div>
        )}
        </div>

        {/* 卡组面板 */}
        <div className="lg:sticky lg:top-5 lg:self-start">
          <CardPanel
            mission={{
              type: "增长目标",
              subtitle: "多挣钱 · AI挖掘高价值商旅商机",
              template: "帮商旅团队每月\n多发现 50个 有效商机",
            }}
            task={{ tasks: ["续约商机", "差旅优化", "个性化推荐", "行程通知"], mode: "人机合作" }}
            agents={["A-01 检索", "A-02 分析", "A-07 增长"]}
            skills={["数据分析", "数据库查询", "报告生成", "邮件/消息发送"]}
            infra={["I-02 大模型", "I-05 工具集成", "I-06 数据底座"]}
          />
        </div>
        </div>
      </div>
    </main>
  );
}
