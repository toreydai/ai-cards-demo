"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import CardPanel from "@/app/components/CardPanel";
import { streamChat } from "@/app/lib/stream-chat";

type LineType = "cmd" | "info" | "data" | "warn" | "ok";
type TermLine = { ts: string; text: string; type: LineType };

type Command = { id: string; label: string; tag: string; prompt: string };

const COMMANDS: Command[] = [
  {
    id: "fault",
    label: "断层解释仲裁",
    tag: "F12/F15",
    prompt: "工区T83相干体属性显示中部有北东向断裂带，F12与F15断层交切关系双人解释结果不一致。帮我分析两种组合方案的依据，给出仲裁建议和QC要点。",
  },
  {
    id: "spec",
    label: "规范查询",
    tag: "T6标定",
    prompt: "T6层位标定误差4.8ms已接近上限5ms，帮我查询层位标定的规范要求，超限后应该走什么流程？给出操作步骤。",
  },
  {
    id: "hpc",
    label: "智算作业调度",
    tag: "PSDM排队",
    prompt: "集群利用率97%，排队作业23个，T83工区PSDM全区偏移需72小时/128节点。帮我分析作业队列，给出优先级排序和是否需要插队的建议。",
  },
  {
    id: "qc",
    label: "QC报告生成",
    tag: "成果提交",
    prompt: "帮我生成工区T83的解释成果QC报告，涵盖层位闭合差统计、断层组合依据、属性体清单和待复核项列表。",
  },
];

const STATUS_BADGES = [
  { label: "工区", value: "T83", color: "text-cyan-300 border-cyan-400/30 bg-cyan-400/10" },
  { label: "集群", value: "97%负载", color: "text-amber-300 border-amber-400/30 bg-amber-400/10" },
  { label: "队列", value: "23作业", color: "text-red-300 border-red-400/30 bg-red-400/10" },
];

function ts() {
  return new Date().toLocaleTimeString("zh-CN", { hour12: false });
}

const LINE_CLS: Record<LineType, string> = {
  cmd:  "text-cyan-300 font-bold",
  info: "text-zinc-400",
  data: "text-green-300",
  warn: "text-amber-400",
  ok:   "text-emerald-400",
};

export default function Page() {
  const [lines, setLines] = useState<TermLine[]>([
    { ts: "09:00:00", text: "物探AI终端就绪 · 工区T83 鄂尔多斯", type: "ok" },
    { ts: "09:00:01", text: "已加载解释规范库 · GB/T 地震数据处理解释标准", type: "info" },
    { ts: "09:00:02", text: "集群状态: 480节点在线 · 97%负载 · 23作业排队", type: "warn" },
    { ts: "09:00:03", text: "就绪，等待指令 ▌", type: "info" },
  ]);
  const [running, setRunning] = useState<string | null>(null);
  const [followInput, setFollowInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  function pushLine(line: TermLine) {
    setLines((prev) => {
      const filtered = prev.filter((l) => !l.text.endsWith("▌"));
      return [...filtered, line];
    });
  }

  function pushReady() {
    setLines((prev) => {
      const filtered = prev.filter((l) => !l.text.endsWith("▌"));
      return [...filtered, { ts: ts(), text: "就绪，等待指令 ▌", type: "info" as LineType }];
    });
  }

  async function runCommand(cmd: Command) {
    if (running) return;
    setRunning(cmd.id);
    pushLine({ ts: ts(), text: `$ execute ${cmd.id} --zone T83 --model kimi-k2`, type: "cmd" });
    pushLine({ ts: ts(), text: `任务初始化: ${cmd.label} [${cmd.tag}] ...`, type: "info" });

    try {
      const text = await streamChat("oil-gas-tech", cmd.prompt);
      text.split("\n").forEach((l) => {
        const t = l.trim();
        if (!t) return;
        const type: LineType =
          t.startsWith("⚠") || t.startsWith("警告") ? "warn"
          : t.startsWith("✓") || t.startsWith("通过") || t.startsWith("建议") ? "ok"
          : "data";
        pushLine({ ts: ts(), text: t, type });
      });
    } catch {
      pushLine({ ts: ts(), text: "ERR: 连接失败，请重试", type: "warn" });
    }

    pushLine({ ts: ts(), text: `任务完成: ${cmd.label}`, type: "ok" });
    pushReady();
    setRunning(null);
  }

  async function sendFollow() {
    if (!followInput.trim() || running) return;
    const input = followInput.trim();
    setFollowInput("");
    setRunning("follow");
    pushLine({ ts: ts(), text: `$ query "${input}"`, type: "cmd" });

    try {
      const text = await streamChat("oil-gas-tech", input);
      text.split("\n").forEach((l) => {
        const t = l.trim();
        if (t) pushLine({ ts: ts(), text: t, type: "data" });
      });
    } catch {
      pushLine({ ts: ts(), text: "ERR: 连接失败", type: "warn" });
    }
    pushReady();
    setRunning(null);
  }

  return (
    <main className="flex h-screen flex-col bg-zinc-950 text-zinc-100">
      <header className="border-b border-white/10 px-5 py-3 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300">← Demo 中心</Link>
            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">桌2 · 油气能源 · 技术层</div>
            <h1 className="text-xl font-black text-white">物探技术终端</h1>
          </div>
          <div className="hidden gap-2 sm:flex">
            {STATUS_BADGES.map((s) => (
              <div key={s.label} className={`rounded border px-3 py-1.5 text-xs font-mono ${s.color}`}>
                {s.label}: <span className="font-bold">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-4 overflow-hidden px-5 py-4 sm:px-8">
        {/* 卡组面板 */}
        <div className="hidden w-48 shrink-0 lg:block">
          <CardPanel
            mission={{
              type: "提效目标",
              subtitle: "快人一步 · AI辅助地震解释",
              template: "把地震解释周期\n从 3周 缩短到 5天",
            }}
            task={{ tasks: ["规程问答", "参数复盘", "参数优化"], mode: "人机合作" }}
            agents={["A-01 检索", "A-02 分析", "A-04 专家"]}
            skills={["知识问答", "数据分析", "高风险确认", "报告生成"]}
            infra={["I-01 算力", "I-02 大模型", "I-03 知识库"]}
          />
        </div>
        {/* 命令面板 */}
        <aside className="flex w-52 shrink-0 flex-col gap-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">指令菜单</div>
          {COMMANDS.map((cmd) => (
            <button
              key={cmd.id}
              onClick={() => runCommand(cmd)}
              disabled={!!running}
              className={`rounded-lg border px-3 py-3 text-left transition ${
                running === cmd.id
                  ? "border-cyan-400 bg-cyan-400/10 text-cyan-200"
                  : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:bg-white/10 disabled:opacity-40"
              }`}
            >
              <div className="flex items-center gap-2">
                {running === cmd.id && (
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
                )}
                <span className="text-sm font-semibold">{cmd.label}</span>
              </div>
              <span className="mt-1 block text-[11px] text-zinc-500">[{cmd.tag}]</span>
            </button>
          ))}

          <div className="mt-auto space-y-2">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">自定义查询</div>
            <textarea
              value={followInput}
              onChange={(e) => setFollowInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendFollow(); }
              }}
              placeholder="输入查询指令..."
              rows={3}
              className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300 outline-none placeholder:text-zinc-600 focus:border-cyan-400/40"
            />
            <button
              onClick={sendFollow}
              disabled={!!running || !followInput.trim()}
              className="w-full rounded-lg border border-cyan-400/30 bg-cyan-400/10 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/20 disabled:opacity-40"
            >
              执行
            </button>
          </div>
        </aside>

        {/* 终端输出 */}
        <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/10 bg-black font-mono">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500/60" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
              <div className="h-3 w-3 rounded-full bg-green-500/60" />
            </div>
            <span className="text-xs text-zinc-500">物探AI终端 · T83工区</span>
            {running && <span className="ml-auto animate-pulse text-xs text-cyan-400">● 运行中</span>}
          </div>
          <div className="flex-1 overflow-y-auto space-y-0.5 p-4">
            {lines.map((line, i) => (
              <div key={i} className="flex gap-3 text-sm leading-6">
                <span className="shrink-0 pt-0.5 text-[11px] text-zinc-600">{line.ts}</span>
                <span className={LINE_CLS[line.type]}>{line.text}</span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </section>
      </div>
    </main>
  );
}
