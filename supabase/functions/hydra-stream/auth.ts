// Authentication & API key retrieval helpers

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CORS_HEADERS } from "./types.ts";

/** Authenticate user and return Supabase client + user, or an error Response */
export async function authenticateUser(
  req: Request,
  providerLabel: string
): Promise<
  | { ok: true; supabase: ReturnType<typeof createClient>; userId: string }
  | { ok: false; response: Response }
> {
  const authHeader = req.headers.get("Authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey =
    Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!authHeader?.startsWith("Bearer ")) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: `Authentication required for ${providerLabel} models` }),
        { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      ),
    };
  }

  const token = authHeader.slice(7);
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: `Authentication required for ${providerLabel} models` }),
        { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      ),
    };
  }

  return { ok: true, supabase, userId: user.id };
}

/** Fetch a specific API key from user's vault via RPC */
export async function getUserApiKey(
  supabase: ReturnType<typeof createClient>,
  keyName: string,
  providerLabel: string
): Promise<{ key: string } | { response: Response }> {
  const { data: apiKeys } = await supabase.rpc("get_my_api_keys").single();
  const key = (apiKeys as Record<string, string | undefined>)?.[keyName];

  if (!key) {
    return {
      response: new Response(
        JSON.stringify({
          error: `${providerLabel} API key not configured. Please add it in your profile settings.`,
        }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      ),
    };
  }

  return { key };
}
