import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Sync Hydrapedia content → role_knowledge for the Guide role.
 * Expects POST { sections: Array<{ id, title, content }>, user_id }
 * Deletes previous guide knowledge from hydrapedia source, then inserts fresh chunks.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { sections, user_id } = await req.json();

    if (!sections || !user_id) {
      return new Response(
        JSON.stringify({ error: "Missing sections or user_id" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Delete old hydrapedia knowledge for guide role
    const { error: delErr } = await supabase
      .from("role_knowledge")
      .delete()
      .eq("user_id", user_id)
      .eq("role", "guide")
      .eq("category", "hydrapedia");

    if (delErr) {
      console.error("[sync-guide-knowledge] Delete error:", delErr);
    }

    // Chunk each section and insert
    const CHUNK_SIZE = 2000; // chars per chunk
    const inserts: any[] = [];

    for (const section of sections) {
      const text = `# ${section.title}\n\n${section.content}`;
      const chunks: string[] = [];

      // Split by paragraphs then merge into chunks
      const paragraphs = text.split(/\n{2,}/);
      let current = "";
      for (const p of paragraphs) {
        if (current.length + p.length + 2 > CHUNK_SIZE && current.length > 0) {
          chunks.push(current.trim());
          current = p;
        } else {
          current += (current ? "\n\n" : "") + p;
        }
      }
      if (current.trim()) chunks.push(current.trim());

      for (let i = 0; i < chunks.length; i++) {
        inserts.push({
          user_id,
          role: "guide",
          content: chunks[i],
          source_title: section.title,
          source_url: null,
          category: "hydrapedia",
          version: new Date().toISOString().slice(0, 10),
          chunk_index: i,
          chunk_total: chunks.length,
          tags: ["hydrapedia", section.id],
          metadata: { section_id: section.id },
          embedding: null,
        });
      }
    }

    // Batch insert (Supabase handles up to 1000 rows)
    if (inserts.length > 0) {
      const batchSize = 500;
      let inserted = 0;
      for (let i = 0; i < inserts.length; i += batchSize) {
        const batch = inserts.slice(i, i + batchSize);
        const { error } = await supabase.from("role_knowledge").insert(batch);
        if (error) {
          console.error("[sync-guide-knowledge] Insert batch error:", error);
          throw error;
        }
        inserted += batch.length;
      }

      console.log(`[sync-guide-knowledge] Synced ${inserted} chunks from ${sections.length} sections`);

      return new Response(
        JSON.stringify({ ok: true, chunks: inserted, sections: sections.length }),
        { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, chunks: 0, sections: 0 }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[sync-guide-knowledge] Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
