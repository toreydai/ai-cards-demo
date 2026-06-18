"use client";

import Link from "next/link";
import { useState } from "react";
import CardPanel from "@/app/components/CardPanel";
import { streamChat } from "@/app/lib/stream-chat";

type RiskLevel = "high" | "mid" | "note";
type Risk = { id: number; para: number; level: RiskLevel; clause: string; desc: string; suggestion: string };

const CLAUSES = [
  {
    id: 0,
    title: "第1条 工程概况",
    text: "本工程为某省级政务云平台数据中心配套基础设施工程，建筑面积约3,200平方米，包括供配电系统、精密空调、消防及综合布线系统。工期自开工之日起180个日历天，建设地点位于某省行政中心综合楼B栋地下二层及一层。",
  },
  {
    id: 1,
    title: "第8条 付款方式",
    text: "预付款比例为合同总价的15%，在签订合同后10个工作日内支付。工程进度款按月支付，每次支付不超过当月完成工程量的80%。竣工验收合格后30日内结清工程款，保留5%质量保证金。",
  },
  {
    id: 2,
    title: "第15条 工期违约",
    text: "承包方每延误一个日历天，须向业主支付合同总价0.1%的违约金，违约金累计上限为合同总价的10%。因不可抗力或业主原因造成的延误不计入逾期，但承包方须在延误发生后24小时内书面告知业主，否则视为承包方自愿承担工期风险。",
  },
  {
    id: 3,
    title: "第22条 工程变更",
    text: "业主有权在不增加合同总价的前提下单方面变更工程量，承包方不得因此提出索赔。工程量增减超过10%时，双方协商调整价格。业主认为不合理的变更申请可予以拒绝，承包方须继续履行原合同约定。",
  },
  {
    id: 4,
    title: "第29条 验收标准",
    text: "工程验收依据国家现行规范GB50300-2013《建筑工程施工质量验收统一标准》及项目技术规格书执行。分项工程验收由业主组织，承包方配合；竣工验收须经业主、监理及相关部门共同确认，验收时间由业主确定。",
  },
  {
    id: 5,
    title: "第33条 知识产权",
    text: "承包方在合同履行过程中形成的所有技术文件、设计成果、施工方案及数据，其知识产权归业主所有。承包方不得将上述成果用于本项目以外的任何用途，违者须承担相应法律责任及赔偿损失。",
  },
  {
    id: 6,
    title: "第38条 争议解决",
    text: "合同履行过程中发生争议，双方应友好协商解决；协商不成的，业主有权指定仲裁机构进行仲裁，裁决结果对双方均有约束力。仲裁期间承包方须继续履行合同义务，不得以争议为由停工或拒绝履行。",
  },
  {
    id: 7,
    title: "第42条 保险责任",
    text: "承包方须在开工前购买工程一切险及第三者责任险，保额不低于合同总价，并将业主列为共同被保险人。保险期限覆盖整个施工期及缺陷责任期，保险费用由承包方承担。",
  },
];

const RISKS: Risk[] = [
  {
    id: 1, para: 2, level: "high",
    clause: "第15条 第2款",
    desc: "24小时告知义务过于苛刻，施工现场实际操作困难，一旦疏漏视为自愿承担全部工期风险",
    suggestion: "谈判要求改为 72 小时，或明确书面告知可通过电子邮件完成",
  },
  {
    id: 2, para: 3, level: "high",
    clause: "第22条 第1款",
    desc: "业主单方面变更工程量却不允许索赔，属于不平等条款，可能导致成本大幅超出",
    suggestion: '要求删除"不得索赔"表述，增加"变更须双方签字确认"约束',
  },
  {
    id: 3, para: 6, level: "high",
    clause: "第38条 第2款",
    desc: "仲裁机构由业主单方指定，且仲裁期间承包方须继续施工，严重损害承包方权益",
    suggestion: '改为"双方协商确定仲裁机构"，争议金额超合同5%时可申请暂停施工',
  },
  {
    id: 4, para: 1, level: "mid",
    clause: "第8条 付款周期",
    desc: "竣工后30日结清但质保金5%，结合0.1%/天违约金上限10%，现金流压力较大",
    suggestion: "争取质保金降至3%，或以银行保函替代质保金扣留",
  },
  {
    id: 5, para: 5, level: "mid",
    clause: "第33条 知识产权",
    desc: "施工方案及数据一律归业主，可能包含承包方专有技术，知识产权归属过于宽泛",
    suggestion: '要求明确"专有技术及通用工法除外"，并列举豁免清单',
  },
  {
    id: 6, para: 4, level: "note",
    clause: "第29条 验收时间",
    desc: "验收时间由业主确定，可能拖延竣工确认，影响尾款结算时间节点",
    suggestion: '增加"业主须在承包方提交验收申请后15个工作日内组织验收"的时限约定',
  },
];

const RISK_STYLE: Record<RiskLevel, { badge: string; border: string; dot: string }> = {
  high: { badge: "bg-red-100 text-red-700 font-bold", border: "border-l-4 border-red-400 bg-red-50", dot: "bg-red-500" },
  mid:  { badge: "bg-orange-100 text-orange-700",     border: "border-l-4 border-orange-400 bg-orange-50", dot: "bg-orange-500" },
  note: { badge: "bg-amber-100 text-amber-700",        border: "border-l-4 border-amber-400 bg-amber-50",  dot: "bg-amber-500" },
};
const RISK_LABEL: Record<RiskLevel, string> = { high: "高风险", mid: "中风险", note: "注意" };
const HIGHLIGHT: Record<RiskLevel, string> = {
  high: "bg-red-100 border-b-2 border-red-400",
  mid:  "bg-orange-100 border-b-2 border-orange-400",
  note: "bg-amber-100 border-b-2 border-amber-400",
};

export default function Page() {
  const [scanning, setScanning] = useState(false);
  const [scanIdx, setScanIdx] = useState(-1);
  const [revealed, setRevealed] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState("");
  const [followInput, setFollowInput] = useState("");
  const [followOutput, setFollowOutput] = useState("");
  const [followLoading, setFollowLoading] = useState(false);

  async function runScan() {
    if (scanning || revealed) return;
    setScanning(true);
    setScanIdx(-1);
    setAnalysis("");

    for (let i = 0; i < CLAUSES.length; i++) {
      setScanIdx(i);
      await new Promise<void>((r) => setTimeout(r, 380));
    }
    setScanIdx(-1);

    const prompt = `以下是一份工程建设合同的关键条款，请从承包方角度识别主要风险点，给出简要风险评级和应对建议（总计150字以内）：\n\n${CLAUSES.map((c) => `${c.title}：${c.text}`).join("\n\n")}`;
    try {
      await streamChat("ecr", prompt, setAnalysis);
    } catch { /* ignore */ }

    setRevealed(true);
    setScanning(false);
  }

  async function askFollowup() {
    if (!followInput.trim() || followLoading) return;
    setFollowLoading(true);
    setFollowOutput("");
    try {
      await streamChat("ecr", followInput, setFollowOutput);
    } catch { setFollowOutput("网络错误，请重试"); }
    finally { setFollowLoading(false); }
  }

  const riskByPara = (paraId: number) => RISKS.find((r) => r.para === paraId);

  return (
    <main className="min-h-screen bg-[#f6f2ec]">
      <header className="border-b border-black/10 bg-white px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-xs text-zinc-400 hover:text-zinc-700">← Demo 中心</Link>
            <div className="mt-0.5 text-xs font-semibold uppercase tracking-widest text-zinc-400">桌5 · 工程建设</div>
            <h1 className="text-xl font-black text-zinc-950">合同风险扫描台</h1>
          </div>
          <div className="flex items-center gap-3">
            {revealed && (
              <div className="flex gap-2 text-xs font-semibold">
                <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">{RISKS.filter((r) => r.level === "high").length} 高风险</span>
                <span className="rounded-full bg-orange-100 px-3 py-1 text-orange-700">{RISKS.filter((r) => r.level === "mid").length} 中风险</span>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">{RISKS.filter((r) => r.level === "note").length} 注意</span>
              </div>
            )}
            {!revealed && (
              <button
                onClick={runScan}
                disabled={scanning}
                className="rounded-xl bg-orange-600 px-6 py-3 text-sm font-bold text-white shadow transition hover:bg-orange-700 disabled:opacity-60"
              >
                {scanning ? "AI 扫描中…" : "🔍 AI 扫描风险"}
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* 合同文档 */}
        <section className="space-y-3">
          {CLAUSES.map((c) => {
            const risk = riskByPara(c.id);
            const isScanning = scanning && scanIdx === c.id;
            const isRisk = revealed && risk;
            const selected = selectedRisk === (risk?.id ?? -1);
            return (
              <div
                key={c.id}
                onClick={() => risk && setSelectedRisk(selected ? null : risk.id)}
                className={`rounded-xl border p-4 transition-all duration-300 ${
                  isScanning ? "border-blue-300 bg-blue-50 ring-2 ring-blue-200" :
                  isRisk ? `cursor-pointer border-transparent ${HIGHLIGHT[risk.level]} ${selected ? "ring-2 ring-offset-1" : ""}` :
                  "border-black/8 bg-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="text-xs font-bold text-zinc-400">{c.title}</div>
                  {isScanning && <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />}
                  {isRisk && (
                    <span className={`rounded-full px-2 py-0.5 text-xs ${RISK_STYLE[risk.level].badge}`}>
                      {RISK_LABEL[risk.level]}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-700">{c.text}</p>
              </div>
            );
          })}
        </section>

        {/* 风险面板 */}
        <aside className="space-y-4">
          {/* AI 总结 */}
          {(analysis || scanning) && (
            <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold text-zinc-400">AI 风险概述</div>
              {analysis ? (
                <div className="mt-2 text-sm leading-6 text-zinc-700 whitespace-pre-wrap">{analysis}</div>
              ) : (
                <div className="mt-2 flex gap-1 text-zinc-400">
                  {[0, 0.15, 0.3].map((d, i) => (
                    <span key={i} className="animate-bounce text-lg" style={{ animationDelay: `${d}s` }}>·</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 风险列表 */}
          {revealed && (
            <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold text-zinc-400">风险清单（点击定位条款）</div>
              <div className="mt-3 space-y-3">
                {RISKS.map((r) => {
                  const s = RISK_STYLE[r.level];
                  const active = selectedRisk === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedRisk(active ? null : r.id)}
                      className={`cursor-pointer rounded-lg p-3 transition ${s.border} ${active ? "ring-1 ring-offset-1 ring-orange-300" : "hover:opacity-80"}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 shrink-0 rounded-full ${s.dot}`} />
                        <span className="text-xs font-semibold text-zinc-500">{r.clause}</span>
                        <span className={`ml-auto rounded-full px-2 py-0.5 text-xs ${s.badge}`}>{RISK_LABEL[r.level]}</span>
                      </div>
                      <p className="mt-1.5 text-xs leading-5 text-zinc-700">{r.desc}</p>
                      {active && (
                        <div className="mt-2 rounded-md border border-orange-200 bg-orange-50 p-2 text-xs leading-5 text-orange-800">
                          💡 {r.suggestion}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 追问 */}
          {revealed && (
            <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold text-zinc-400">追问合同细节</div>
              <textarea
                value={followInput}
                onChange={(e) => setFollowInput(e.target.value)}
                placeholder="例：第38条仲裁条款如何反制？"
                rows={3}
                className="mt-2 w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-200"
              />
              <button
                onClick={askFollowup}
                disabled={followLoading || !followInput.trim()}
                className="mt-2 w-full rounded-lg bg-orange-600 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:opacity-40"
              >
                {followLoading ? "分析中…" : "提交"}
              </button>
              {followOutput && (
                <div className="mt-3 text-sm leading-6 text-zinc-700 whitespace-pre-wrap">{followOutput}</div>
              )}
            </div>
          )}

          {/* 卡组面板 */}
          <CardPanel
            mission={{
              type: "质量目标",
              subtitle: "不靠老师傅也稳定 · AI合同风控",
              template: "把合同漏审\n风险条款减少 80%",
            }}
            task={{ tasks: ["合同比对", "风险标注", "漏项检查", "合规审计"], mode: "人机合作" }}
            agents={["A-01 检索", "A-04 专家", "A-06 质检合规"]}
            skills={["文档读取", "条款比对", "合规检查", "报告生成"]}
            infra={["I-02 大模型", "I-03 知识库", "I-06 数据底座"]}
          />
        </aside>
      </div>
    </main>
  );
}
