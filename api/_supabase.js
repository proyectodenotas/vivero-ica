import { createClient } from "@supabase/supabase-js";

// Cliente con service role: solo para uso server-side, ignora RLS.
// Nunca exponer SUPABASE_SERVICE_ROLE_KEY al cliente.
export function adminClient() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Falta SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

// Verifica el JWT del header Authorization: Bearer <token> y devuelve el
// usuario autenticado junto con su fila de profiles (o null si no es válido).
export async function getAuthedUser(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;

  const client = adminClient();
  const { data: userData, error: userErr } = await client.auth.getUser(token);
  if (userErr || !userData?.user) return null;

  const { data: profile, error: profileErr } = await client
    .from("profiles")
    .select("id, role, nombre, vivero_nombre, active")
    .eq("id", userData.user.id)
    .single();
  if (profileErr || !profile || !profile.active) return null;

  return { user: userData.user, profile };
}
