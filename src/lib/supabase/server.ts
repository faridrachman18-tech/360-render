import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getSupabaseAuthConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be configured.");
  }

  return { supabaseUrl, supabasePublishableKey };
}

export async function createClient() {
  const cookieStore = await cookies();
  const { supabaseUrl, supabasePublishableKey } = getSupabaseAuthConfig();

  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot set cookies directly; proxy.ts refreshes sessions.
        }
      }
    }
  });
}
