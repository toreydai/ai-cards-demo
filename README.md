# ai-cards-demo

10 个行业 AI Demo 站点，展示 Kimi K2.5 在 Amazon Bedrock 上的落地场景。每桌一个行业，各有独立的业务数据和交互界面，适合工作坊现场演示。

## Demo 一览

| 桌 | 路径 | 行业场景 |
|----|------|---------|
| 桌1 | `/oil-gas-mgmt` | 物探集团 · 管理层成本钻取 |
| 桌2 | `/oil-gas-tech` | 物探研究院 · 地震解释终端 |
| 桌3 | `/agri-crop` | 农业种植 · 卫星巡田识别 |
| 桌4 | `/agri-livestock` | 农牧 · 养殖传感预警 |
| 桌5 | `/ecr` | 工程建设 · 合同风险扫描 |
| 桌6 | `/travel` | 差旅服务商 · 工单智能处置 |
| 桌7 | `/aerospace` | 遥感 · 变化检测流水线 |
| 桌8 | `/energy` | 能源 · 告警归并治理 |
| 桌9 | `/eng-space` | 管道 · 完整性巡检融合 |
| 桌10 | `/travel-tech` | 出行科技 · 票务商机挖掘 |

## 技术栈

- **前端**：Next.js 16 (App Router) · React 19 · Tailwind CSS v4
- **模型**：`moonshotai/kimi-k2.5`，通过 Amazon Bedrock 调用（`us-east-1`）
- **SDK**：`@aws-sdk/client-bedrock-runtime`，流式响应

## 前置条件

1. Node.js 18+
2. AWS 凭证，具备 `bedrock:InvokeModelWithResponseStream` 权限
3. 在 `us-east-1` 的 Bedrock 控制台开通 Kimi K2.5 模型访问（`moonshotai.kimi-k2.5`）

## 快速开始

```bash
git clone <this-repo>
cd ai-cards-demo
npm install
npm run dev        # 启动开发服务器，端口 3002
```

访问 `http://localhost:3002` 进入 Demo 中心。

生产构建：

```bash
npm run build
npm start          # 同样运行在端口 3002
```

## 目录结构

```
app/
  page.tsx                  首页（10 桌卡片网格）
  <demo>/page.tsx           各桌页面（行业数据 + 交互 UI）
  api/chat/
    route.ts                POST /api/chat，流式转发给 Bedrock
    prompts.ts              各桌 system prompt
    travelPolicy.ts         差旅桌模拟数据
  components/
    CardPanel.tsx           卡组面板（Mission / Task / Agent / Skill / Infra）
  lib/
    stream-chat.ts          流式 fetch 工具函数
docs/
  architecture.md           架构图
  testing.md                各桌测试场景与验证方法
```

## 添加新场景

每桌的数据和 AI 指令分两处：

- **UI 数据**：`app/<demo>/page.tsx` 顶部的数据数组
- **System Prompt**：`app/api/chat/prompts.ts` 对应 key

两处数据保持一致即可，无需改动其他文件。

## 测试

各桌测试场景和验证点见 [`docs/testing.md`](docs/testing.md)。

## License

MIT - see the [LICENSE](LICENSE) file for details.

## 免责声明

- 本项目仅供学习与技术参考，不构成生产部署方案。
- 运行过程中会调用 Amazon Bedrock 上的 AI 模型并产生费用，请根据实际使用量评估成本。
- 作者不对因使用本项目产生的任何费用或损失承担责任。
- 本项目与 Amazon Web Services 及 Moonshot AI 无官方关联，相关服务的可用性与定价以各方官方文档为准。
- 生产环境使用前请根据实际需求进行安全评估与调整。
