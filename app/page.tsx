import Link from "next/link";

type Demo = {
  href: string;
  table: string;
  industry: string;
  desc: string;
  label: string;
  status: string;
  accent: string;
  marker: string;
  variant: "hero" | "metric" | "flow" | "compact";
  metric?: string;
  metricLabel?: string;
  chips: string[];
  steps?: string[];
};

const DEMOS: Demo[] = [
  {
    href: "/oil-gas-mgmt",
    table: "桌1",
    industry: "油气能源 · 管理层",
    desc: "点击成本行 → AI 逐项分析降本空间",
    label: "成本钻取台",
    status: "管理驾驶舱",
    accent: "from-amber-500 to-zinc-900",
    marker: "OG",
    variant: "hero",
    metric: "18%",
    metricLabel: "异常成本收敛",
    chips: ["成本表格钻取", "逐项AI分析", "周报生成"],
  },
  {
    href: "/oil-gas-tech",
    table: "桌2",
    industry: "油气能源 · 技术层",
    desc: "地震解释与智算助手",
    label: "物探技术中枢",
    status: "解释攻关",
    accent: "from-cyan-500 to-slate-800",
    marker: "R2",
    variant: "flow",
    chips: ["断层解释", "规范问答", "智算调度"],
    steps: ["读入属性", "匹配规范", "输出方案"],
  },
  {
    href: "/agri-crop",
    table: "桌3",
    industry: "农业种植 / 种业",
    desc: "病害识别与农情助手",
    label: "作物巡田员",
    status: "图像识别",
    accent: "from-emerald-500 to-lime-700",
    marker: "AG",
    variant: "metric",
    metric: "92",
    metricLabel: "样本置信度",
    chips: ["叶片病斑", "农情问答", "用药建议"],
  },
  {
    href: "/agri-livestock",
    table: "桌4",
    industry: "农牧 / AIoT",
    desc: "传感器监控台 · 点击圈舍触发 AI 分析",
    label: "牧场传感台",
    status: "边缘预警",
    accent: "from-rose-500 to-stone-800",
    marker: "AI",
    variant: "compact",
    metric: "24h",
    metricLabel: "提前预警",
    chips: ["实时传感器", "圈舍点击分析", "追问"],
  },
  {
    href: "/ecr",
    table: "桌5",
    industry: "工程建设",
    desc: "合同全文渲染 → AI 逐段扫描 → 内嵌风险高亮",
    label: "合同扫描台",
    status: "风险审阅",
    accent: "from-orange-500 to-neutral-900",
    marker: "EC",
    variant: "flow",
    chips: ["文档渲染", "风险高亮", "条款追问"],
    steps: ["合同文本", "AI扫描", "风险清单"],
  },
  {
    href: "/travel",
    table: "桌6",
    industry: "商旅 / 出行",
    desc: "多轮对话气泡 · 快捷场景芯片",
    label: "差旅对话台",
    status: "客服增效",
    accent: "from-sky-500 to-indigo-700",
    marker: "TR",
    variant: "hero",
    metric: "6min",
    metricLabel: "完成客户方案",
    chips: ["对话气泡", "快捷回复", "多轮上下文"],
  },
  {
    href: "/aerospace",
    table: "桌7",
    industry: "遥感 / 卫星",
    desc: "格区选择 → 检测 → 报告 三步流水线",
    label: "遥感流水台",
    status: "变化检测",
    accent: "from-violet-500 to-black",
    marker: "RS",
    variant: "metric",
    metric: "3km²",
    metricLabel: "自动圈定范围",
    chips: ["地图选区", "逐步检测", "报告生成"],
  },
  {
    href: "/energy",
    table: "桌8",
    industry: "工业 / 电力 / 矿业",
    desc: "37条告警列表 → 一键 → 5类归并卡片",
    label: "告警归并台",
    status: "告警治理",
    accent: "from-red-500 to-zinc-900",
    marker: "EN",
    variant: "compact",
    metric: "37",
    metricLabel: "告警合并为 5 类",
    chips: ["无输入框", "AI一键归并", "分组展开"],
  },
  {
    href: "/eng-space",
    table: "桌9",
    industry: "工程 + 航天科技",
    desc: "管道完整性与卫星巡检",
    label: "管线巡检卫士",
    status: "巡检融合",
    accent: "from-teal-500 to-blue-900",
    marker: "LG",
    variant: "flow",
    chips: ["卫星巡检", "管道风险", "闭环工单"],
    steps: ["遥感发现", "GIS 定位", "工单闭环"],
  },
  {
    href: "/travel-tech",
    table: "桌10",
    industry: "出行 + 科技混合",
    desc: "票务数据分析与商机挖掘",
    label: "票务商机雷达",
    status: "商机洞察",
    accent: "from-fuchsia-500 to-slate-900",
    marker: "FT",
    variant: "metric",
    metric: "12",
    metricLabel: "高潜客群切片",
    chips: ["票价波动", "客户分群", "机会推送"],
  },
];

function DemoVisual({ demo }: { demo: Demo }) {
  if (demo.variant === "flow") {
    return (
      <div className="mt-4 h-24 space-y-1.5">
        {demo.steps?.map((step, index) => (
          <div key={step} className="grid grid-cols-[1.5rem_1fr] items-center gap-2 rounded-md bg-white/12 px-2.5 py-1.5 text-white ring-1 ring-white/15">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/18 text-[10px] font-bold">
              {index + 1}
            </div>
            <div className="text-xs font-medium leading-snug">{step}</div>
          </div>
        ))}
      </div>
    );
  }

  if (demo.variant === "metric") {
    return (
      <div className="mt-4 rounded-lg bg-white/10 p-3 ring-1 ring-white/15">
        <div className="flex h-16 items-end justify-between gap-4">
        <div>
          <div className="text-3xl font-black tracking-normal text-white">{demo.metric}</div>
          <div className="mt-1 text-xs text-white/65">{demo.metricLabel}</div>
        </div>
        <div className="flex h-16 items-end gap-1.5">
          {[38, 58, 46, 72, 64].map((height, index) => (
            <span
              key={index}
              className="w-3 rounded-t-full bg-white/70"
              style={{ height: Math.round(height * 0.75) }}
            />
          ))}
        </div>
        </div>
      </div>
    );
  }

  if (demo.variant === "compact") {
    return (
      <div className="mt-4 h-24 rounded-lg border border-white/15 bg-black/12 p-3">
        <div className="flex items-center justify-between">
          <div className="text-3xl font-black text-white">{demo.metric}</div>
          <div className="max-w-28 text-right text-xs leading-snug text-white/65">{demo.metricLabel}</div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          <span className="h-1.5 rounded-full bg-white/75" />
          <span className="h-1.5 rounded-full bg-white/35" />
          <span className="h-1.5 rounded-full bg-white/55" />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 grid h-24 grid-cols-[1fr_auto] items-center gap-4 rounded-lg bg-white/10 p-3 ring-1 ring-white/15">
      <div className="space-y-2">
        <div className="h-2 w-full rounded-full bg-white/75" />
        <div className="h-2 w-3/4 rounded-full bg-white/35" />
        <div className="h-2 w-5/6 rounded-full bg-white/50" />
      </div>
      <div className="text-right">
        <div className="text-4xl font-black text-white">{demo.metric}</div>
        <div className="text-xs text-white/65">{demo.metricLabel}</div>
      </div>
    </div>
  );
}

function DemoCard({ demo }: { demo: Demo }) {
  return (
    <Link
      href={demo.href}
      className="group h-[330px] overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
    >
      <div className={`relative flex h-full flex-col bg-gradient-to-br ${demo.accent} p-4 text-white`}>
        <div className="absolute right-3 top-3 text-6xl font-black tracking-normal text-white/10">
          {demo.marker}
        </div>
        <div className="relative flex items-center justify-between gap-3">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-white/55">{demo.table}</div>
          <span className="rounded-full bg-white/14 px-2.5 py-1 text-[11px] font-medium text-white ring-1 ring-white/20">
            {demo.status}
          </span>
        </div>
        <div className="relative mt-3 min-h-[4.5rem]">
          <h2 className="text-[1.35rem] font-black leading-tight text-white">{demo.label}</h2>
          <div className="mt-2 text-xs leading-5 text-white/70">{demo.industry}</div>
        </div>

        <p className="relative mt-2 min-h-10 text-sm font-semibold leading-5 text-white">
          {demo.desc}
        </p>

        <DemoVisual demo={demo} />

        <div className="relative mt-auto flex flex-wrap gap-1.5 pt-4">
          {demo.chips.map((chip) => (
            <span key={chip} className="rounded-full bg-white/12 px-2 py-1 text-[11px] text-white/72 ring-1 ring-white/15">
              {chip}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f5f3ef] text-zinc-950">
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12">
        <div className="mb-8 flex flex-col gap-4 border-b border-zinc-300 pb-7 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-semibold text-zinc-500">6月16日工作坊 · Kimi on Bedrock</div>
            <h1 className="mt-2 text-4xl font-black leading-tight text-zinc-950 sm:text-5xl">
              AI 一人团队 Demo 中心
            </h1>
          </div>
          <p className="max-w-md text-sm leading-6 text-zinc-600">
            10 桌不是同一套海报换字，而是按行业场景做不同入口：有管理驾驶舱、现场流程、检测指标和行动卡。
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {DEMOS.map((demo) => (
            <DemoCard key={demo.href} demo={demo} />
          ))}
        </div>
      </section>
    </main>
  );
}
