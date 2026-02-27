import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Estimate token count (~4 chars per token) */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Download file from storage and return text content or base64 for images */
async function getFileContent(
  supabase: ReturnType<typeof createClient>,
  filePath: string,
  mimeType: string | null
): Promise<{ text?: string; base64?: string; type: "text" | "image" }> {
  const { data, error } = await supabase.storage
    .from("task-files")
    .download(filePath);

  if (error || !data) {
    throw new Error(`Failed to download file: ${error?.message || "no data"}`);
  }

  const mime = mimeType || "";

  // Images → base64 for vision model
  if (mime.startsWith("image/")) {
    const buffer = await data.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const b64 = btoa(binary);
    return { base64: b64, type: "image" };
  }

  // CSV / plain text / markdown
  if (
    mime.includes("text/") ||
    mime.includes("csv") ||
    mime.includes("markdown") ||
    mime.includes("json") ||
    mime.includes("yaml")
  ) {
    const text = await data.text();
    return { text, type: "text" };
  }

  // PDF → extract text (limited — first ~10k chars via text extraction)
  if (mime.includes("pdf")) {
    // Fallback: treat as binary text extraction attempt
    const text = await data.text();
    // PDFs as raw text won't work well, but we capture what we can
    const cleanText = text.replace(/[^\x20-\x7E\u0400-\u04FF\n\r\t]/g, " ").substring(0, 15000);
    if (cleanText.trim().length > 50) {
      return { text: cleanText, type: "text" };
    }
    // If text extraction failed, return a note
    return { text: "[PDF содержимое не удалось извлечь как текст]", type: "text" };
  }

  // Word docs and other office formats - attempt text extraction
  if (mime.includes("word") || mime.includes("officedocument")) {
    const text = await data.text();
    const cleanText = text.replace(/[^\x20-\x7E\u0400-\u04FF\n\r\t]/g, " ").substring(0, 15000);
    if (cleanText.trim().length > 50) {
      return { text: cleanText, type: "text" };
    }
    return { text: "[Документ: содержимое не удалось извлечь]", type: "text" };
  }

  // Fallback
  const text = await data.text();
  return { text: text.substring(0, 10000), type: "text" };
}

/** Call Lovable AI to generate digest */
async function generateDigest(
  content: { text?: string; base64?: string; type: "text" | "image" },
  fileName: string,
  mimeType: string | null,
  language: string
): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  const isRu = language === "ru";

  const systemPrompt = isRu
    ? `Ты — аналитик, создающий краткие дайджесты файлов для стратегического планирования. 
Твоя задача — извлечь ключевую информацию и создать структурированное резюме (200-500 слов).
Формат:
## Тип контента
## Ключевые данные и факты  
## Релевантность для стратегического планирования
## Числовые метрики (если есть)
Пиши конкретно, без воды. Сохраняй числа, имена, даты.`
    : `You are an analyst creating concise file digests for strategic planning.
Extract key information and create a structured summary (200-500 words).
Format:
## Content Type
## Key Data & Facts
## Relevance to Strategic Planning
## Numerical Metrics (if any)
Be specific, no fluff. Preserve numbers, names, dates.`;

  const messages: any[] = [{ role: "system", content: systemPrompt }];

  if (content.type === "image" && content.base64) {
    messages.push({
      role: "user",
      content: [
        {
          type: "text",
          text: isRu
            ? `Создай дайджест этого изображения (файл: "${fileName}"). Опиши содержимое, структуру, текст на изображении, диаграммы, схемы — всё что важно для стратегического анализа.`
            : `Create a digest of this image (file: "${fileName}"). Describe content, structure, text in the image, diagrams, schemas — everything relevant for strategic analysis.`,
        },
        {
          type: "image_url",
          image_url: {
            url: `data:${mimeType || "image/png"};base64,${content.base64}`,
          },
        },
      ],
    });
  } else {
    // Truncate text to ~12k chars to fit in context
    const truncatedText = (content.text || "").substring(0, 12000);
    messages.push({
      role: "user",
      content: isRu
        ? `Создай дайджест этого файла для стратегического планирования.\n\nФайл: "${fileName}" (${mimeType || "unknown"})\n\nСодержимое:\n${truncatedText}`
        : `Create a digest of this file for strategic planning.\n\nFile: "${fileName}" (${mimeType || "unknown"})\n\nContent:\n${truncatedText}`,
    });
  }

  const response = await fetch(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 1500,
        temperature: 0.3,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI gateway error:", response.status, errorText);
    throw new Error(`AI gateway error: ${response.status}`);
  }

  const result = await response.json();
  return result.choices?.[0]?.message?.content || "[Не удалось создать дайджест]";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { task_file_id, session_id, language = "ru" } = await req.json();

    if (!task_file_id || !session_id) {
      return new Response(
        JSON.stringify({ error: "task_file_id and session_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get file info
    const { data: fileInfo, error: fileError } = await supabase
      .from("task_files")
      .select("*")
      .eq("id", task_file_id)
      .single();

    if (fileError || !fileInfo) {
      return new Response(
        JSON.stringify({ error: "File not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if digest already exists
    const { data: existing } = await supabase
      .from("file_digests")
      .select("id")
      .eq("task_file_id", task_file_id)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ message: "Digest already exists", id: existing.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract content
    const content = await getFileContent(supabase, fileInfo.file_path, fileInfo.mime_type);

    // Generate AI digest
    const digest = await generateDigest(content, fileInfo.file_name, fileInfo.mime_type, language);
    const tokenEstimate = estimateTokens(digest);

    // Store digest
    const { data: digestRecord, error: insertError } = await supabase
      .from("file_digests")
      .insert({
        task_file_id,
        session_id,
        user_id: user.id,
        digest,
        digest_type: content.type === "image" ? "vision_summary" : "text_summary",
        source_mime_type: fileInfo.mime_type,
        source_file_name: fileInfo.file_name,
        token_estimate: tokenEstimate,
        metadata: {
          original_size: fileInfo.file_size,
          compression_ratio: fileInfo.file_size > 0
            ? (digest.length / fileInfo.file_size).toFixed(3)
            : null,
        },
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({
        id: digestRecord.id,
        token_estimate: tokenEstimate,
        digest_type: content.type === "image" ? "vision_summary" : "text_summary",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("digest-file error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
