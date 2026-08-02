import { createBrowserClient } from "@supabase/ssr";
import { getPublicSupabaseConfig } from "@/lib/supabase/config";

export function hasSupabaseBrowserConfig(): boolean {
  const { url, publishableKey } = getPublicSupabaseConfig();
  return Boolean(url && publishableKey);
}

export function createClient() {
  const { url, publishableKey } = getPublicSupabaseConfig();
  return createBrowserClient(url, publishableKey);
}
