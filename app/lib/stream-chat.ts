export async function streamChat(
  demo: string,
  content: string,
  onChunk: (text: string) => void = () => {}
): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ demo, messages: [{ role: "user", content }] }),
  });
  if (!res.body) return "";
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let acc = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    acc += decoder.decode(value, { stream: true });
    onChunk(acc);
  }
  return acc;
}
