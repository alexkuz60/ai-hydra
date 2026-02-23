// Patent Deep Analysis — Synthesis pass

import { VariantResult } from "./types.ts";
import { parseSSEBuffer } from "./sse.ts";

export async function synthesizeBestResponse(
  supabaseUrl: string,
  supabaseKey: string,
  authHeader: string,
  modelId: string,
  taskPrompt: string,
  variants: VariantResult[],
  language: string,
): Promise<{ text: string; token_count: number; elapsed_ms: number }> {
  const isRu = language === 'ru';
  const successfulVariants = variants.filter(v => v.status !== 'failed' && v.text.length > 100);

  if (successfulVariants.length === 0) {
    return { text: '', token_count: 0, elapsed_ms: 0 };
  }
  if (successfulVariants.length === 1) {
    return { text: successfulVariants[0].text, token_count: successfulVariants[0].token_count, elapsed_ms: 0 };
  }

  const advocateVariant = successfulVariants.find(v => v.config_label === 'devils_advocate');
  const regularVariants = successfulVariants.filter(v => v.config_label !== 'devils_advocate');

  const variantsBlock = regularVariants.map((v, i) =>
    `### Вариант ${i + 1} (${v.config_label}, ${v.token_count} токенов, temp=${v.config.temperature})\n${v.text}`
  ).join('\n\n---\n\n');

  const advocateBlock = advocateVariant
    ? `\n\n---\n\n### 🔴 АДВОКАТ ДЬЯВОЛА (контраргументы и причины для отказа):\n${advocateVariant.text}`
    : '';

  const synthesisPrompt = isRu
    ? `Ты — экспертный синтезатор для патентного анализа. Тебе предоставлены несколько вариантов ответа на одну задачу И контраргументы от «Адвоката дьявола».\n\n## Исходная задача:\n${taskPrompt}\n\n## Варианты ответов:\n${variantsBlock}${advocateBlock}\n\n## Твоя задача:\n1. Проанализируй все варианты И аргументы Адвоката дьявола\n2. ОБЯЗАТЕЛЬНО учти контраргументы — если Адвокат дьявола нашёл обоснованные причины для отказа, они ДОЛЖНЫ быть отражены в финальном заключении\n3. Объедини сильные стороны аналитических вариантов\n4. Если аргументы «за» не перевешивают аргументы «против» — ЧЕСТНО скажи: патентный потенциал отсутствует\n5. Не «натягивай сову на глобус» — честный отказ лучше ложного одобрения\n\nВерни только финальный синтезированный ответ.`
    : `You are an expert synthesizer for patent analysis. You are given multiple response variants AND counter-arguments from the "Devil's Advocate."\n\n## Original task:\n${taskPrompt}\n\n## Response variants:\n${variantsBlock}${advocateBlock}\n\n## Your task:\n1. Analyze all variants AND Devil's Advocate arguments\n2. MANDATORY: account for counter-arguments — if the Devil's Advocate found substantiated reasons for rejection, they MUST be reflected in the final conclusion\n3. Combine strengths of analytical variants\n4. If arguments "for" don't outweigh arguments "against" — HONESTLY state: no patent potential\n5. An honest rejection is better than a false approval\n\nReturn only the final synthesized response.`;

  const startTime = Date.now();
  try {
    const streamUrl = `${supabaseUrl}/functions/v1/hydra-stream`;
    const response = await fetch(streamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'apikey': supabaseKey,
      },
      body: JSON.stringify({
        message: synthesisPrompt,
        model_id: modelId,
        role: 'assistant',
        system_prompt: 'You are an expert patent analysis synthesizer. Combine the best elements from multiple response variants into one optimal answer.',
        temperature: 0.3,
        max_tokens: 8192,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Synthesis failed: ${response.status}: ${errText}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let text = '';
    let tokenCount = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const { chunks, remaining } = parseSSEBuffer(buffer);
      buffer = remaining;
      for (const chunk of chunks) {
        text += chunk;
        tokenCount++;
      }
    }

    try { reader.cancel(); } catch { /* ok */ }

    return { text, token_count: tokenCount, elapsed_ms: Date.now() - startTime };
  } catch (err: any) {
    console.error('[patent-deep] Synthesis error:', err);
    const longest = successfulVariants.reduce((a, b) => a.text.length > b.text.length ? a : b);
    return { text: longest.text, token_count: longest.token_count, elapsed_ms: Date.now() - startTime };
  }
}
