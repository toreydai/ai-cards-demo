import { NextRequest, NextResponse } from "next/server";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { PROMPTS } from "./prompts";
import { createHash, timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
const bedrock = new BedrockRuntimeClient({ region: "us-east-1" });
const MODEL_ID = "moonshotai.kimi-k2.5";
const MAX_REQUEST_BYTES = 16_384;
const MAX_CALLS_PER_MINUTE = 30;
const recentCalls: number[] = [];

function validAccessKey(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  const actual = createHash("sha256").update(provided).digest();
  const wanted = createHash("sha256").update(expected).digest();
  return timingSafeEqual(actual, wanted);
}

export async function POST(req: NextRequest) {
  const accessKey = process.env.CHAT_ACCESS_KEY;
  if (!accessKey || accessKey.length < 32) {
    return NextResponse.json({ error: "Chat access is not configured" }, { status: 503 });
  }
  if (!validAccessKey(req.headers.get("x-demo-key"), accessKey)) {
    return NextResponse.json({ error: "Invalid access key" }, { status: 401 });
  }
  if (Number(req.headers.get("content-length")) > MAX_REQUEST_BYTES) {
    return NextResponse.json({ error: "Request is too large" }, { status: 413 });
  }
  const raw = await req.text();
  if (Buffer.byteLength(raw, "utf8") > MAX_REQUEST_BYTES) {
    return NextResponse.json({ error: "Request is too large" }, { status: 413 });
  }
  let input: unknown;
  try {
    input = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!input || typeof input !== "object" || !Array.isArray((input as { messages?: unknown }).messages)) {
    return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
  }
  const { messages, demo } = input as { messages: unknown[]; demo?: string };
  if (messages.length < 1 || messages.length > 20 ||
      messages.some((message) => !message || typeof message !== "object" ||
        !["user", "assistant"].includes((message as { role?: string }).role ?? "") ||
        typeof (message as { content?: unknown }).content !== "string")) {
    return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
  }
  const now = Date.now();
  while (recentCalls.length && recentCalls[0] <= now - 60_000) recentCalls.shift();
  if (recentCalls.length >= MAX_CALLS_PER_MINUTE) {
    return NextResponse.json({ error: "Chat rate limit reached" }, { status: 429 });
  }
  recentCalls.push(now);
  const systemPrompt = PROMPTS[demo ?? "travel"] ?? PROMPTS["travel"];
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
