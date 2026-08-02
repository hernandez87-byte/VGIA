import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicSupabaseConfig } from "@/lib/supabase/config";

export function hasSupabaseServerConfig(): boolean {
  const { url, publishableKey } = getPublicSupabaseConfig();
  return Boolean(url && publishableKey);
}

export async function createClient() {
  const { url, publishableKey } = getPublicSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Los Server Components no siempre pueden escribir cookies.
          // proxy.ts se encarga de refrescar la sesión cuando corresponde.
        }
      },
    },
  });
}
