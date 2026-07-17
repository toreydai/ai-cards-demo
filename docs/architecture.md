# 架构文档

## 目标

本仓库是一个单体 Next.js 应用，用 10 个行业场景 Demo 演示 Kimi K2.5 在 Amazon Bedrock 上的落地效果，供工作坊现场演示：参会者在不同"桌"体验各自行业的 AI 交互界面，背后共用同一套流式对话链路。

## 组件

- **前端**：Next.js 16（App Router）+ React 19 + Tailwind CSS v4。10 个行业页面 `app/<demo>/page.tsx`（`oil-gas-mgmt`、`oil-gas-tech`、`agri-crop`、`agri-livestock`、`ecr`、`travel`、`aerospace`、`energy`、`eng-space`、`travel-tech`），每桌自带模拟业务数据，用 `CardPanel` 组件展示 Mission / Task / Agent / Skill / Infra 卡组
- **API**：单个 Route Handler `app/api/chat/route.ts`（`POST /api/chat`），按请求体中的 `demo` 字段从 `app/api/chat/prompts.ts` 取对应 system prompt，再流式转发给 Bedrock
- **模型调用**：`@aws-sdk/client-bedrock-runtime`，模型 `moonshotai.kimi-k2.5`，Region `us-east-1`；优先用 `InvokeModelWithResponseStreamCommand` 流式返回，异常时回退到非流式 `InvokeModelCommand`
- **客户端流式消费**：`app/lib/stream-chat.ts` 的 `streamChat()`，用 `ReadableStream` reader 逐块解码文本，通过回调把增量内容推给页面 UI

## 架构图

```mermaid
flowchart LR
  subgraph Browser["浏览器"]
    Home["首页\n10 桌卡片网格"]
    Demo["某桌 Demo 页面\napp/&lt;demo&gt;/page.tsx"]
    StreamChat["lib/stream-chat.ts\nstreamChat()"]
  end

  subgraph Server["Next.js Server\n(npm run dev/start, :3002)"]
    Route["POST /api/chat\napp/api/chat/route.ts"]
    Prompts["prompts.ts\n按 demo key 选 system prompt"]
  end

  subgraph Bedrock["Amazon Bedrock (us-east-1)"]
    Kimi["moonshotai.kimi-k2.5\nInvokeModelWithResponseStreamCommand"]
  end

  Home -->|选择一桌| Demo
  Demo -->|用户输入消息| StreamChat
  StreamChat -->|fetch POST { demo, messages }| Route
  Route -->|查表| Prompts
  Route -->|调用模型| Kimi
  Kimi -->|流式 chunk| Route
  Route -->|text/plain 流| StreamChat
  StreamChat -->|onChunk 回调逐字渲染| Demo
```

10 桌页面共用同一个 API 路由和同一个模型，区别仅在于请求体里的 `demo` 字段和页面内展示的模拟业务数据；`route.ts` 拿到 `demo` 后去 `PROMPTS` 表里查对应的 system prompt，再原样把用户消息一起发给 Bedrock。流式返回的文本分片经 `ReadableStream` 一路透传回浏览器，`streamChat()` 每收到一块就触发一次 UI 回调，实现打字机效果。

## 关键设计点

- **每桌数据分两处维护**：页面展示数据在 `app/<demo>/page.tsx` 顶部数组，system prompt 在 `prompts.ts` 对应 key，二者手动保持一致，新增场景无需改动路由或组件代码
- **流式优先、非流式兜底**：`route.ts` 先尝试 `InvokeModelWithResponseStreamCommand`，捕获异常后回退到 `InvokeModelCommand`，避免个别请求或模型版本不支持流式时整体报错
- **无鉴权、无持久化**：`/api/chat` 不做用户鉴权，也不持久化对话历史，纯粹是工作坊现场演示用途，所有业务数据均为页面内硬编码的模拟数据
