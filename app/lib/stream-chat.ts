export async function streamChat(
  demo: string,
  content: string,
  onChunk: (text: string) => void = () => {}
): Promise<string> {
  let accessKey = sessionStorage.getItem("chat-access-key");
  if (!accessKey) {
    accessKey = window.prompt("请输入工作坊聊天访问密钥");
    if (!accessKey) throw new Error("需要聊天访问密钥");
    sessionStorage.setItem("chat-access-key", accessKey);
  }
  const send = (key: string) => fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-demo-key": key },
    body: JSON.stringify({ demo, messages: [{ role: "user", content }] }),
  });
  let res = await send(accessKey);
  if (res.status === 401) {
    sessionStorage.removeItem("chat-access-key");
    const replacement = window.prompt("访问密钥无效，请重新输入");
    if (!replacement) throw new Error("需要有效的聊天访问密钥");
    sessionStorage.setItem("chat-access-key", replacement);
    res = await send(replacement);
  }
  if (!res.ok) {
    const message = `聊天请求失败 (${res.status})`;
    window.alert(message);
    throw new Error(message);
  }
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
