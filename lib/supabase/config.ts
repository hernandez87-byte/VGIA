const DEFAULT_SUPABASE_URL = "https://thubnpbdwpxnifwpxeex.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_ddG3Gn3-bqB2FA6UNDMHkw_7KK4f9qQ";

/**
 * La clave publicable de Supabase es intencionalmente visible en el navegador.
 * La seguridad depende de RLS. Nunca agregues aquí una clave secret o service_role.
 */
export function getPublicSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? DEFAULT_SUPABASE_URL,
    publishableKey:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      DEFAULT_SUPABASE_PUBLISHABLE_KEY,
  };
}
