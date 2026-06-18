"use client";

import Link from "next/link";
import { useState } from "react";
import CardPanel from "@/app/components/CardPanel";
import { streamChat } from "@/app/lib/stream-chat";

type AlertLevel = "high" | "mid" | "low";
type AlertItem = { id: number; level: AlertLevel; type: string; device: string; desc: string; time: string; group: number };

const ALERTS: AlertItem[] = [
  // 设备健康风险 (group 1)
  { id: 1,  level: "high", type: "振动",   device: "WTG-2",    desc: "塔筒振动1.8mm/s，超阈值1.5mm/s，持续2.3h", time: "08:23", group: 1 },
  { id: 2,  level: "high", type: "温度",   device: "INV-5",    desc: "IGBT结温87°C超阈值85°C，已触发降额保护",   time: "09:14", group: 1 },
  { id: 3,  level: "mid",  type: "振动",   device: "WTG-6",    desc: "塔筒振动1.6mm/s，超阈值，持续0.8h",        time: "10:02", group: 1 },
  { id: 4,  level: "mid",  type: "温度",   device: "INV-3",    desc: "IGBT结温83°C，接近阈值85°C，趋势上升",     time: "10:31", group: 1 },
  { id: 5,  level: "mid",  type: "轴承",   device: "WTG-9",    desc: "发电机轴承温度76°C（阈值80°C），持续升温",  time: "11:05", group: 1 },
  { id: 6,  level: "mid",  type: "轴承",   device: "WTG-12",   desc: "主轴承温度74°C，较昨日上升6°C",            time: "11:22", group: 1 },
  { id: 7,  level: "low",  type: "油温",   device: "WTG-4",    desc: "齿轮箱油温68°C，滤芯差压偏高",             time: "12:10", group: 1 },
  { id: 8,  level: "low",  type: "振动",   device: "WTG-15",   desc: "叶片气动不平衡，振动略高，未超阈值",        time: "12:45", group: 1 },
  // 电气质量告警 (group 2)
  { id: 9,  level: "mid",  type: "电流",   device: "BUS-3",    desc: "三相不平衡率4.2%（阈值3%），持续40min",    time: "09:41", group: 2 },
  { id: 10, level: "mid",  type: "电压",   device: "BUS-1",    desc: "A相电压偏差2.8%（阈值2%），持续15min",     time: "10:15", group: 2 },
  { id: 11, level: "mid",  type: "功率",   device: "INV-8",    desc: "功率因数0.91（要求≥0.95），无功补偿不足",   time: "10:48", group: 2 },
  { id: 12, level: "low",  type: "谐波",   device: "TX-2",     desc: "5次谐波含量4.8%（标准≤4%），略超限",       time: "11:30", group: 2 },
  { id: 13, level: "low",  type: "电压",   device: "BUS-5",    desc: "B相电压偏差1.9%，接近阈值2%",             time: "12:00", group: 2 },
  { id: 14, level: "low",  type: "电流",   device: "BUS-6",    desc: "零序电流2.1A（阈值2A），轻微超限",         time: "12:20", group: 2 },
  { id: 15, level: "low",  type: "功率",   device: "INV-11",   desc: "无功功率输出偏低，功率因数0.92",           time: "13:05", group: 2 },
  // 能耗超标 (group 3)
  { id: 16, level: "mid",  type: "厂用电", device: "HVAC-01",  desc: "综合楼空调日耗电2,340kWh，同比+18%",      time: "06:00", group: 3 },
  { id: 17, level: "mid",  type: "效率",   device: "PUMP-A",   desc: "循环水泵运行效率67%（设计值82%）",         time: "06:00", group: 3 },
  { id: 18, level: "mid",  type: "损耗",   device: "TX-1",     desc: "主变负载率31%，空载损耗占比偏高",          time: "07:30", group: 3 },
  { id: 19, level: "low",  type: "损耗",   device: "TX-3",     desc: "变压器铁损较额定偏高12%，建议检查铁芯",    time: "07:30", group: 3 },
  { id: 20, level: "low",  type: "厂用电", device: "LIGHT-B2", desc: "B区照明回路夜间未切换节能模式",            time: "22:00", group: 3 },
  { id: 21, level: "low",  type: "厂用电", device: "COMP-02",  desc: "空压机卸载时间占比42%，待机能耗偏高",      time: "08:00", group: 3 },
  { id: 22, level: "low",  type: "厂用电", device: "HVAC-03",  desc: "机房精密空调设定温度16°C，建议提至18°C",   time: "08:00", group: 3 },
  // 通讯中断（非关键）(group 4)
  { id: 23, level: "low",  type: "通讯",   device: "WIND-04",  desc: "测风仪数据丢失，通讯超时180s",             time: "06:02", group: 4 },
  { id: 24, level: "low",  type: "通讯",   device: "WIND-07",  desc: "测风仪数据丢失，通讯超时190s",             time: "06:03", group: 4 },
  { id: 25, level: "low",  type: "通讯",   device: "WIND-11",  desc: "测风仪数据丢失，通讯超时175s",             time: "06:04", group: 4 },
  { id: 26, level: "low",  type: "通讯",   device: "MET-02",   desc: "气象站RTU心跳丢失，Modbus无响应",          time: "06:30", group: 4 },
  { id: 27, level: "low",  type: "通讯",   device: "SCADA-N3", desc: "N3子站IEC104链路断开",                    time: "07:00", group: 4 },
  { id: 28, level: "low",  type: "通讯",   device: "WIND-02",  desc: "测风仪数据丢失，通讯超时200s",             time: "07:10", group: 4 },
  { id: 29, level: "low",  type: "通讯",   device: "WIND-09",  desc: "Modbus寄存器读取失败，数据全零",           time: "07:12", group: 4 },
  { id: 30, level: "low",  type: "通讯",   device: "ENV-06",   desc: "环境传感器（温湿度）通讯超时",             time: "07:20", group: 4 },
  { id: 31, level: "low",  type: "通讯",   device: "WIND-14",  desc: "测风仪数据丢失，通讯超时220s",             time: "08:05", group: 4 },
  { id: 32, level: "low",  type: "通讯",   device: "MET-05",   desc: "气象站RTU掉线，遥测遥信全部中断",          time: "08:30", group: 4 },
  { id: 33, level: "low",  type: "通讯",   device: "WIND-16",  desc: "测风仪数据丢失，通讯超时",                 time: "09:00", group: 4 },
  { id: 34, level: "low",  type: "通讯",   device: "RELAY-07", desc: "保护装置通讯告警，装置本身运行正常",        time: "09:15", group: 4 },
  // 已自动恢复 (group 5)
  { id: 35, level: "low",  type: "电压",   device: "BUS-2",    desc: "A相电压瞬时跌落已自动恢复（持续0.3s）",    time: "05:14", group: 5 },
  { id: 36, level: "low",  type: "温度",   device: "INV-7",    desc: "IGBT温度告警后自动降额恢复正常",           time: "07:42", group: 5 },
  { id: 37, level: "low",  type: "通讯",   device: "SCADA-N1", desc: "子站通讯中断后自动重连，运行正常",          time: "08:58", group: 5 },
];

const GROUPS = [
  { id: 1, name: "设备健康风险",       color: "red",    icon: "⚙️", priority: "P0 立即处理",  action: "停机检查 WTG-2、INV-5，安排当日维护窗口" },
  { id: 2, name: "电气质量告警",       color: "orange", icon: "⚡", priority: "P1 今日处理",  action: "检查无功补偿装置，调整谐波滤波器参数" },
  { id: 3, name: "能耗超标",           color: "amber",  icon: "📊", priority: "P2 本周处理",  action: "优化HVAC设定，更换低效水泵叶轮" },
  { id: 4, name: "通讯中断（非关键）", color: "blue",   icon: "📡", priority: "P3 计划处理",  action: "统一排查光纤交换机，可延后集中处理" },
  { id: 5, name: "已自动恢复",         color: "green",  icon: "✅", priority: "P4 备档",       action: "记录日志备档，无需人工干预" },
];

const GROUP_STYLE: Record<string, { card: string; badge: string; priority: string }> = {
  red:    { card: "border-red-300 bg-red-50",      badge: "bg-red-100 text-red-700",       priority: "bg-red-600 text-white" },
  orange: { card: "border-orange-300 bg-orange-50", badge: "bg-orange-100 text-orange-700", priority: "bg-orange-500 text-white" },
  amber:  { card: "border-amber-300 bg-amber-50",  badge: "bg-amber-100 text-amber-700",   priority: "bg-amber-500 text-white" },
  blue:   { card: "border-blue-300 bg-blue-50",    badge: "bg-blue-100 text-blue-700",     priority: "bg-blue-500 text-white" },
  green:  { card: "border-emerald-300 bg-emerald-50", badge: "bg-emerald-100 text-emerald-700", priority: "bg-emerald-600 text-white" },
};

const LEVEL_CLS: Record<AlertLevel, string> = {
  high: "bg-red-100 text-red-700 font-bold",
  mid:  "bg-orange-100 text-orange-600",
  low:  "bg-zinc-100 text-zinc-500",
};
const LEVEL_TXT: Record<AlertLevel, string> = { high: "高", mid: "中", low: "低" };

type Mode = "list" | "scanning" | "grouped";

export default function Page() {
  const [mode, setMode] = useState<Mode>("list");
  const [scanPct, setScanPct] = useState(0);
  const [scanLabel, setScanLabel] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null);

  async function runMerge() {
    setMode("scanning");
    setScanPct(0);
    setAnalysis("");

    const steps = ["读取设备告警元数据", "提取故障特征向量", "计算相似度聚类", "生成优先级矩阵", "输出处置建议"];
    for (let i = 0; i < steps.length; i++) {
      setScanLabel(steps[i]);
      await new Promise<void>((r) => setTimeout(r, 500));
      setScanPct(Math.round(((i + 1) / steps.length) * 80));
    }
    setScanLabel("AI 综合分析中…");

    const summary = ALERTS.map((a) => `[${a.device}] ${a.type}: ${a.desc}`).join("\n");
    const prompt = `以下是今日发生的 ${ALERTS.length} 条设备告警，请分析归并后的5类根因，给出每类的风险判断和运维优先级，最后用3-5句话给出总体处置建议。\n\n${summary}`;

    try {
      await streamChat("energy", prompt, setAnalysis);
    } catch { /* ignore */ }

    setScanPct(100);
    await new Promise<void>((r) => setTimeout(r, 400));
    setMode("grouped");
  }

  return (
    <main className="min-h-screen bg-[#f6f1f1]">
      <header className="border-b border-black/10 bg-white px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-xs text-zinc-400 hover:text-zinc-700">← Demo 中心</Link>
            <div className="mt-0.5 text-xs font-semibold uppercase tracking-widest text-zinc-400">桌8 · 工业 / 电力</div>
            <h1 className="text-xl font-black text-zinc-950">工厂脉冲台 · 告警归并</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-4xl font-black text-red-600">{ALERTS.length}</div>
              <div className="text-xs font-medium text-zinc-400">待处理告警</div>
            </div>
            {mode === "list" && (
              <button onClick={runMerge} className="rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-red-700 active:scale-95">
                ⚡ AI 一键归并
              </button>
            )}
            {mode === "grouped" && (
              <button onClick={() => { setMode("list"); setScanPct(0); setAnalysis(""); setExpandedGroup(null); }}
                className="rounded-xl border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100">
                ↺ 重置
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 扫描进度条 */}
      {mode === "scanning" && (
        <div className="border-b border-black/5 bg-white px-5 py-4 sm:px-8">
          <div className="mx-auto max-w-7xl space-y-3">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-zinc-500">{scanLabel}</span>
              <span className="font-bold text-red-600">{scanPct}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
              <div className="h-full rounded-full bg-red-500 transition-all duration-500" style={{ width: `${scanPct}%` }} />
            </div>
            {analysis && (
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-7 text-zinc-700 whitespace-pre-wrap">{analysis}</div>
            )}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-5 py-5 sm:px-8">
        <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div>
        {/* 原始告警列表 */}
        {mode === "list" && (
          <div className="space-y-1.5">
            {ALERTS.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-lg border border-black/8 bg-white px-4 py-2.5 shadow-sm">
                <span className="w-5 shrink-0 text-center text-xs text-zinc-300">{a.id}</span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${LEVEL_CLS[a.level]}`}>{LEVEL_TXT[a.level]}</span>
                <span className="w-14 shrink-0 text-xs text-zinc-400">{a.type}</span>
                <span className="w-24 shrink-0 font-mono text-xs font-semibold text-zinc-700">{a.device}</span>
                <span className="flex-1 text-sm text-zinc-600">{a.desc}</span>
                <span className="shrink-0 text-xs text-zinc-300">{a.time}</span>
              </div>
            ))}
          </div>
        )}

        {/* 归并结果 */}
        {mode === "grouped" && (
          <div className="space-y-5">
            {analysis && (
              <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
                <div className="text-xs font-semibold text-zinc-400">AI 综合分析</div>
                <div className="mt-2 text-sm leading-7 text-zinc-800 whitespace-pre-wrap">{analysis}</div>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {GROUPS.map((g) => {
                const items = ALERTS.filter((a) => a.group === g.id);
                const s = GROUP_STYLE[g.color];
                const open = expandedGroup === g.id;
                return (
                  <div key={g.id} className={`rounded-xl border-2 p-4 ${s.card}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{g.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-black text-zinc-900">{g.name}</span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${s.badge}`}>{items.length} 条</span>
                        </div>
                        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${s.priority}`}>{g.priority}</span>
                      </div>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-zinc-600">{g.action}</p>
                    <button onClick={() => setExpandedGroup(open ? null : g.id)}
                      className="mt-2 text-xs font-semibold text-zinc-400 transition hover:text-zinc-700">
                      {open ? "▲ 收起" : "▼ 查看 " + items.length + " 条告警"}
                    </button>
                    {open && (
                      <div className="mt-3 space-y-1.5 max-h-56 overflow-y-auto">
                        {items.map((a) => (
                          <div key={a.id} className="flex items-start gap-2 rounded-md bg-white/60 px-2.5 py-1.5 text-xs">
                            <span className="font-mono font-semibold text-zinc-700 shrink-0">{a.device}</span>
                            <span className="text-zinc-500 leading-4">{a.desc}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        </div>

        {/* 卡组面板 */}
        <div className="lg:sticky lg:top-5 lg:self-start">
          <CardPanel
            mission={{
              type: "降本目标",
              subtitle: "省人省钱 · 计划外停机损失最小化",
              template: "把计划外停机\n维修成本降低 35%",
            }}
            task={{ tasks: ["告警归并", "故障定位", "预测维护", "巡检报告"], mode: "机器干" }}
            agents={["A-02 分析", "A-03 识别"]}
            skills={["数据分析", "告警关联", "预测维护", "报告生成"]}
            infra={["I-02 大模型", "I-05 工具集成", "I-06 数据底座"]}
          />
        </div>
        </div>
      </div>
    </main>
  );
}
