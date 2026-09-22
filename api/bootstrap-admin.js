import { adminClient, getAuthedUser } from "./_supabase.js";

// Promueve al usuario autenticado que llama a role='admin', únicamente si
// todavía no existe ningún admin. Se llama automáticamente tras el primer
// login (ver App.jsx) — no hace nada si ya hay un admin.
export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "Método no permitido" }); return; }
  const authed = await getAuthedUser(req);
  if (!authed) { res.status(401).json({ error: "No autorizado" }); return; }

  const client = adminClient();
  const { count, error: countErr } = await client
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");
  if (countErr) { res.status(500).json({ error: countErr.message }); return; }
  if (count > 0) { res.status(403).json({ error: "Ya existe un administrador" }); return; }

  const { error: updateErr } = await client
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", authed.user.id);
  if (updateErr) { res.status(500).json({ error: updateErr.message }); return; }

  res.status(200).json({ ok: true, promoted: authed.user.id });
}
