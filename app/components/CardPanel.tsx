"use client";

export type MissionType = "降本目标" | "提效目标" | "质量目标" | "增长目标" | "合规目标";
export type TaskMode = "机器干" | "人机合作" | "人干";

export interface CardPanelProps {
  mission: {
    type: MissionType;
    subtitle: string;
    template: string; // e.g. "把__工作的人力成本降低__%"
  };
  task: {
    tasks: string[]; // exact terms from 任务速查表, e.g. ["病害识别", "植保建议"]
    mode: TaskMode;
  };
  agents: string[]; // e.g. ["A-01 检索", "A-02 分析"]
  skills: string[]; // e.g. ["图片识别", "知识问答"]
  infra: string[];  // e.g. ["I-02 大模型", "I-03 知识库"]
}

const MISSION_STYLE: Record<MissionType, { icon: string; color: string; bg: string; border: string }> = {
  降本目标: { icon: "💰", color: "text-amber-700", bg: "bg-amber-50",  border: "border-amber-300" },
  提效目标: { icon: "⚡", color: "text-blue-700",  bg: "bg-blue-50",   border: "border-blue-300"  },
  质量目标: { icon: "🎯", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-300" },
  增长目标: { icon: "📈", color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-300" },
  合规目标: { icon: "🛡", color: "text-cyan-700",   bg: "bg-cyan-50",   border: "border-cyan-300"  },
};

const MODE_MARK: Record<TaskMode, { label: string; cls: string }> = {
  机器干:   { label: "机器干",   cls: "bg-blue-600 text-white"   },
  人机合作: { label: "人机合作", cls: "bg-violet-600 text-white" },
  人干:     { label: "人干",     cls: "bg-zinc-600 text-white"   },
};

export default function CardPanel({ mission, task, agents, skills, infra }: CardPanelProps) {
  const ms = MISSION_STYLE[mission.type];

  return (
    <div className="space-y-2.5">
      {/* Mission 目标卡 */}
      <div className={`rounded-xl border-2 ${ms.border} bg-white p-4 shadow-sm`}>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Mission 目标卡</span>
          <span className="text-base">{ms.icon}</span>
        </div>
        <div className={`mb-1 text-xs font-bold ${ms.color}`}>{mission.type}</div>
        <div className="text-[11px] text-zinc-500 mb-2">{mission.subtitle}</div>
        <div className={`rounded-lg ${ms.bg} px-3 py-2 text-xs font-medium text-zinc-800 leading-5`}>
          {mission.template}
        </div>
      </div>

      {/* Task 任务卡 */}
      <div className="rounded-xl border-2 border-emerald-200 bg-white p-4 shadow-sm">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Task 任务卡</span>
          <span className="text-base">📋</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {task.tasks.map((t) => (
            <span key={t} className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Agent AI 员工卡 */}
      <div className="rounded-xl bg-purple-700 p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-purple-200">Agent AI 员工卡</span>
          <span className="text-base">🤖</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {agents.map((a) => (
            <span key={a} className="rounded-full bg-purple-500/60 px-2.5 py-1 text-[11px] font-semibold text-white">
              {a}
            </span>
          ))}
        </div>
      </div>

      {/* 技能卡 */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Skill 技能卡</span>
          <span className="text-base">🔧</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <span key={s} className="rounded-full bg-white border border-zinc-200 px-2.5 py-0.5 text-[11px] font-medium text-zinc-600">
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* 基础设施卡 */}
      <div className="rounded-xl bg-zinc-900 p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Infra 基础设施卡</span>
          <span className="text-base">🏗</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {infra.map((i) => (
            <span key={i} className="rounded-full bg-zinc-700 px-2.5 py-1 text-[11px] font-semibold text-zinc-100">
              {i}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
