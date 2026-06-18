import { NextRequest, NextResponse } from "next/server";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { PROMPTS } from "./prompts";

const bedrock = new BedrockRuntimeClient({ region: "us-east-1" });
const MODEL_ID = "moonshotai.kimi-k2.5";

export async function POST(req: NextRequest) {
  const { messages, demo } = await req.json();
  const systemPrompt = PROMPTS[demo] ?? PROMPTS["travel"];
  const body = JSON.stringify({
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    max_tokens: 2048,
    temperature: 0.3,
  });

  try {
    const response = await bedrock.send(
      new InvokeModelWithResponseStreamCommand({
        modelId: MODEL_ID,
        contentType: "application/json",
        accept: "application/json",
        body,
      })
    );
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    const events = response.body;
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of events ?? []) {
            const bytes = event.chunk?.bytes;
            if (!bytes) continue;
            try {
              const parsed = JSON.parse(decoder.decode(bytes));
              const delta =
                parsed.choices?.[0]?.delta?.content ??
                parsed.choices?.[0]?.message?.content ??
                "";
              if (delta) controller.enqueue(encoder.encode(delta));
            } catch {
              // 跳过无法解析的分片
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
    });
  } catch {
    // 模型不支持流式时回退到非流式
    try {
      const response = await bedrock.send(
        new InvokeModelCommand({ modelId: MODEL_ID, contentType: "application/json", accept: "application/json", body })
      );
      const result = JSON.parse(new TextDecoder().decode(response.body));
      return new Response(result.choices[0].message.content, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }
}
