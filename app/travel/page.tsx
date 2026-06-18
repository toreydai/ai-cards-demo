"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import CardPanel from "@/app/components/CardPanel";
import { streamChat } from "@/app/lib/stream-chat";

type WorkOrder = {
  id: string;
  type: "改签" | "行程" | "摘要" | "对账";
  urgency: "急" | "中" | "低";
  customer: string;
  summary: string;
  prompt: string;
};

type WorkResult = {
  disposition: string;
  notice: string;
  todos: string[];
};

const WORK_ORDERS: WorkOrder[] = [
  {
    id: "wo1",
    type: "改签",
    urgency: "急",
    customer: "客户A · 张伟（销售总监）",
    summary: "CA1234取消，需13:00前到沪",
    prompt: "客户A的员工张伟（销售总监）来电：原定今天CA1234 08:00北京飞上海的航班取消了，他必须13:00前到上海开客户会。帮我按客户A的差旅政策给出改签方案，并起草一条通知话术发给他。",
  },
  {
    id: "wo2",
    type: "行程",
    urgency: "中",
    customer: "客户B · 考察团（12人）",
    summary: "下周一北京→成都3天，预算¥3500/人",
    prompt: "客户B要安排12人下周一从北京去成都考察3天，人均预算¥3500（含机票酒店）。帮我编排行程方案并附报价表。",
  },
  {
    id: "wo3",
    type: "摘要",
    urgency: "低",
    customer: "客户C · 客服投诉",
    summary: "到店无房、差价报销、要投诉",
    prompt: "帮我总结这段客服对话的诉求和待办：客户说「我上周订的酒店到店没房，前台让我加钱升级，这个差价你们要给我报销，另外下次别再给我订这家了，体验太差，我要投诉」。",
  },
  {
    id: "wo4",
    type: "对账",
    urgency: "中",
    customer: "客户A · 6月对账",
    summary: "3条异常：重复发票/超限/缺凭证",
    prompt: "帮我核对客户A本月的对账异常：6月3日同行程出现两张¥86出租车发票，6月5日酒店发票¥780/晚超政策上限，6月8日一张改签费缺凭证。给出分类处理建议。",
  },
];

const WORK_RESULTS: Record<string, WorkResult> = {
  wo1: {
    disposition: "改签 MU5101 10:45 北京→虹桥，13:20落地，符合客户A差旅政策（经济舱），差价¥0",
    notice: "张总，您好！CA1234因故取消，已为您改签至 MU5101（10:45 T3出发，13:20虹桥落地），请提前60分钟到达登机口。如需地面接送请告知。",
    todos: ["确认改签出票", "发送通知给张伟", "更新行程管理系统", "跟进是否需要接机安排"],
  },
  wo2: {
    disposition: "3日考察行程：CA4103 08:00北京→成都（周一），均价¥1280/人；成都商务酒店¥580/晚×2；地面交通¥240/人。人均¥2,920，低于¥3,500预算",
    notice: "客户B您好，12人成都考察行程已规划完毕，附含机票+酒店+地面交通报价表，人均¥2,920，低于预算。请确认后可立即出票。",
    todos: ["发送行程&报价表至负责人", "等待客户确认后出票", "预留成都备用房", "安排地面接送车辆"],
  },
  wo3: {
    disposition: "客诉3项：①差价¥230报销（需凭证）②该酒店加入黑名单③启动投诉处理流程（48h响应）",
    notice: "尊敬的客户，您反映的酒店问题我们深表歉意！差价将于3个工作日内退款，该酒店已从推荐列表移除。投诉工单号 #TK20260612，专员24h内跟进。",
    todos: ["核实差价金额并走退款流程", "将该酒店加入黑名单", "发送投诉受理确认给客户", "48h内跟进处理结果"],
  },
  wo4: {
    disposition: "异常分类：①重复发票¥86→拒报1张；②酒店超限¥180→需经理审批；③缺凭证→要求补传电子发票",
    notice: "客户A财务对接人：6月账单3项待处理：重复出租车发票(6/3)请核实；酒店超限(6/5)需经理签批；改签费(6/8)请补传凭证。截止6月20日，感谢配合。",
    todos: ["通知当事人核实重复发票", "提交酒店超限审批申请", "催收缺凭证发票（截止6/20）", "对账完成后出具对账单"],
  },
};

const PROCESS_STEPS = ["解析差旅需求", "查询客户差旅政策", "制定处置方案", "生成通知话术"];

const TYPE_CLS: Record<WorkOrder["type"], string> = {
  "改签": "bg-red-100 text-red-700",
  "行程": "bg-blue-100 text-blue-700",
  "摘要": "bg-purple-100 text-purple-700",
  "对账": "bg-amber-100 text-amber-700",
};

const URGENCY_DOT: Record<WorkOrder["urgency"], string> = {
  "急": "bg-red-500",
  "中": "bg-amber-400",
  "低": "bg-zinc-300",
};

export default function Page() {
  const [selected, setSelected] = useState<WorkOrder | null>(null);
  const [processStep, setProcessStep] = useState(-1);
  const [outputs, setOutputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [checkedTodos, setCheckedTodos] = useState<Set<string>>(new Set());
  const scanningRef = useRef<string | null>(null);

  async function processOrder(order: WorkOrder) {
    if (loading) return;
    setSelected(order);
    setCopied(false);

    if (outputs[order.id]) {
      setProcessStep(PROCESS_STEPS.length);
      return;
    }

    scanningRef.current = order.id;
    setProcessStep(0);

    for (let i = 1; i <= PROCESS_STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, 600));
      if (scanningRef.current !== order.id) return;
      setProcessStep(i);
    }

    if (scanningRef.current !== order.id) return;
    setLoading(order.id);
    try {
      await streamChat("travel", order.prompt, (text) =>
        setOutputs((prev) => ({ ...prev, [order.id]: text }))
      );
    } catch {
      setOutputs((prev) => ({ ...prev, [order.id]: "处理失败，请重试" }));
    }
    setLoading(null);
  }

  function copyNotice(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function toggleTodo(key: string) {
    setCheckedTodos((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const processDone = processStep >= PROCESS_STEPS.length;
  const result = selected ? WORK_RESULTS[selected.id] : null;

  return (
    <main className="min-h-screen bg-[#eef5fb]">
      <header className="border-b border-black/10 bg-white px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-xs text-zinc-400 hover:text-zinc-700">← Demo 中心</Link>
            <div className="mt-0.5 text-xs font-semibold uppercase tracking-widest text-zinc-400">桌6 · 商旅 / 出行</div>
            <h1 className="text-xl font-black text-zinc-950">差旅工单台</h1>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-red-700">1单 急</span>
            <span className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-700">2单 中</span>
            <span className="rounded-md border border-sky-200 bg-sky-50 px-3 py-1.5 text-sky-700">30秒 AI 处理</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-5 sm:px-8">
        <div className="grid gap-5 lg:grid-cols-[300px_1fr_20rem]">
          {/* 左：工单列表 */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-zinc-400">待处理工单 · 点击开始 AI 处理</div>
            {WORK_ORDERS.map((order) => {
              const active = selected?.id === order.id;
              const done = !!outputs[order.id];
              return (
                <button
                  key={order.id}
                  onClick={() => processOrder(order)}
                  disabled={loading !== null}
                  className={`w-full rounded-xl border-2 bg-white p-4 text-left shadow-sm transition hover:shadow-md ${
                    active ? "border-sky-400 ring-2 ring-sky-200" : "border-zinc-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${URGENCY_DOT[order.urgency]}`} />
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${TYPE_CLS[order.type]}`}>
                        {order.type}
                      </span>
                    </div>
                    <span className={`text-[11px] font-bold ${
                      order.urgency === "急" ? "text-red-600" : order.urgency === "中" ? "text-amber-600" : "text-zinc-400"
                    }`}>
                      {order.urgency}优先
                    </span>
                  </div>
                  <div className="mt-2 text-sm font-semibold text-zinc-800">{order.customer}</div>
                  <div className="mt-0.5 text-xs text-zinc-500">{order.summary}</div>
                  <div className={`mt-3 rounded-lg py-1.5 text-center text-xs font-bold transition ${
                    active && done ? "bg-sky-600 text-white" : active && loading ? "bg-sky-100 text-sky-700" : "bg-zinc-100 text-zinc-500"
                  }`}>
                    {active && loading ? "AI 处理中…" : active && done ? "✓ 已处理" : "AI 处理"}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 右：处理结果 */}
          <div className="space-y-4">
            {!selected && (
              <div className="flex h-64 items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-white text-sm text-zinc-400">
                点击左侧工单开始 AI 处理
              </div>
            )}

            {/* 处理步骤动画 */}
            {selected && !processDone && (
              <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                <div className="mb-5 text-xs font-semibold text-zinc-400">AI 处理中 · {selected.customer}</div>
                <div className="space-y-5">
                  {PROCESS_STEPS.map((step, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 transition-opacity duration-300 ${
                        i < processStep ? "opacity-100" : i === processStep ? "opacity-90" : "opacity-20"
                      }`}
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        i < processStep
                          ? "bg-sky-600 text-white"
                          : i === processStep
                          ? "border-2 border-sky-400 text-sky-600"
                          : "border-2 border-zinc-200 text-zinc-300"
                      }`}>
                        {i < processStep ? "✓" : i + 1}
                      </div>
                      <span className={`text-sm font-medium ${
                        i < processStep ? "text-zinc-400 line-through" : i === processStep ? "text-zinc-900" : "text-zinc-300"
                      }`}>
                        {step}
                        {i === processStep && (
                          <span className="ml-2 inline-flex gap-0.5">
                            {[0, 0.15, 0.3].map((d, j) => (
                              <span key={j} className="animate-bounce text-sky-500" style={{ animationDelay: `${d}s` }}>·</span>
                            ))}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 结构化结果 */}
            {selected && processDone && result && (
              <>
                {/* 处置方案 */}
                <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
                  <div className="mb-2 text-xs font-semibold text-zinc-400">处置方案</div>
                  <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-zinc-800">
                    {result.disposition}
                  </div>
                </div>

                {/* 客户通知话术 */}
                <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-xs font-semibold text-zinc-400">客户通知话术</div>
                    <button
                      onClick={() => copyNotice(result.notice)}
                      className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                        copied ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      }`}
                    >
                      {copied ? "已复制 ✓" : "复制话术"}
                    </button>
                  </div>
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-6 text-zinc-700">
                    {result.notice}
                  </div>
                </div>

                {/* 待办清单 */}
                <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
                  <div className="mb-3 text-xs font-semibold text-zinc-400">待办清单</div>
                  <div className="space-y-1">
                    {result.todos.map((todo, i) => {
                      const key = `${selected.id}-${i}`;
                      const checked = checkedTodos.has(key);
                      return (
                        <button
                          key={i}
                          onClick={() => toggleTodo(key)}
                          className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition hover:bg-zinc-50"
                        >
                          <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                            checked ? "border-sky-500 bg-sky-500" : "border-zinc-300"
                          }`}>
                            {checked && <span className="text-white text-[10px] font-bold">✓</span>}
                          </div>
                          <span className={`text-sm ${checked ? "text-zinc-400 line-through" : "text-zinc-800"}`}>
                            {todo}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 border-t border-zinc-100 pt-3 text-xs text-zinc-400">
                    已完成 {Array.from(checkedTodos).filter((k) => k.startsWith(selected.id)).length} / {result.todos.length} 项
                  </div>
                </div>

                {/* AI 详细分析 */}
                <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="text-xs font-semibold text-zinc-400">AI 详细分析</div>
                    {loading === selected.id && (
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
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
              </>
            )}
          </div>

          {/* 卡组面板 */}
          <div className="lg:sticky lg:top-5 lg:self-start">
            <CardPanel
              mission={{
                type: "提效目标",
                subtitle: "快人一步 · 工单秒级智能处置",
                template: "把差旅工单处理时间\n从 4小时 缩短到 5分钟",
              }}
              task={{ tasks: ["改签方案", "行程通知", "对话摘要", "订单对账"], mode: "人机合作" }}
              agents={["A-01 检索", "A-05 写手"]}
              skills={["知识问答", "数据库查询", "邮件/消息发送", "对话理解"]}
              infra={["I-02 大模型", "I-03 知识库", "I-05 工具集成"]}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
