// Patent Deep Analysis — SSE helpers

export function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/** Parse SSE lines from a buffer, returns extracted text chunks and remaining buffer */
export function parseSSEBuffer(buffer: string): { chunks: string[]; remaining: string } {
  const chunks: string[] = [];
  let remaining = buffer;

  let newlineIdx: number;
  while ((newlineIdx = remaining.indexOf('\n')) !== -1) {
    let line = remaining.slice(0, newlineIdx);
    remaining = remaining.slice(newlineIdx + 1);
    if (line.endsWith('\r')) line = line.slice(0, -1);
    if (!line.startsWith('data: ')) continue;
    const jsonStr = line.slice(6).trim();
    if (jsonStr === '[DONE]') break;
    try {
      const parsed = JSON.parse(jsonStr);
      const content = parsed.choices?.[0]?.delta?.content as string | undefined;
      if (content) chunks.push(content);
    } catch { /* partial JSON */ }
  }

  return { chunks, remaining };
}
