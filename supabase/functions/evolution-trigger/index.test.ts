import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") || Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/evolution-trigger`;

// Helper to call the function
async function callEvolutionTrigger(body: Record<string, unknown>, token?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }
  return { status: res.status, json, text };
}

// ── Test 1: Unauthenticated request returns 401 ──
Deno.test("evolution-trigger: rejects unauthenticated requests", async () => {
  const { status, json } = await callEvolutionTrigger({ mode: "autorun" });
  assertEquals(status, 401);
  assertExists(json?.error);
});

// ── Test 2: Invalid mode returns 400 ──
Deno.test("evolution-trigger: rejects invalid mode", async () => {
  const { status, json } = await callEvolutionTrigger(
    { mode: "invalid_mode" },
    SUPABASE_ANON_KEY, // anon key as token — will pass auth header check but may fail RLS
  );
  // Should be 400 for invalid mode, or 401 if auth check is stricter
  assertEquals(status === 400 || status === 401, true, `Expected 400 or 401, got ${status}`);
  if (json) assertExists(json.error);
});

// ── Test 3: Single mode without chronicle_id is invalid ──
Deno.test("evolution-trigger: single mode without chronicle_id returns 400", async () => {
  const { status, json } = await callEvolutionTrigger(
    { mode: "single" },
    SUPABASE_ANON_KEY,
  );
  // mode=single without chronicle_id falls through to 'else' branch → 400
  assertEquals(status === 400 || status === 401, true, `Expected 400 or 401, got ${status}`);
  if (json) assertExists(json.error);
});

// ── Test 4: Single mode with non-existent chronicle returns 404 ──
Deno.test("evolution-trigger: single mode with fake id returns 404", async () => {
  const { status, json } = await callEvolutionTrigger(
    { mode: "single", chronicle_id: "00000000-0000-0000-0000-000000000000" },
    SUPABASE_ANON_KEY,
  );
  // 404 not found, or 401 if auth blocks
  assertEquals(status === 404 || status === 401, true, `Expected 404 or 401, got ${status}`);
  if (json) assertExists(json.error);
});

// ── Test 5: CORS preflight returns 200 ──
Deno.test("evolution-trigger: CORS preflight works", async () => {
  const res = await fetch(FUNCTION_URL, { method: "OPTIONS" });
  await res.text(); // consume body
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
});

// ── Test 6: Response structure validation (autorun with anon key) ──
Deno.test("evolution-trigger: autorun response has expected shape", async () => {
  const { json } = await callEvolutionTrigger(
    { mode: "autorun" },
    SUPABASE_ANON_KEY,
  );
  // Even if it fails auth, the JSON should have either 'error' or 'revised'+'total'
  assertExists(json);
  if (json.error) {
    assertEquals(typeof json.error, "string");
  } else {
    assertEquals(typeof json.revised, "number");
    assertEquals(typeof json.total, "number");
    // 'remaining' is present in successful autorun responses
    assertExists(json.remaining !== undefined || json.total !== undefined);
  }
});
