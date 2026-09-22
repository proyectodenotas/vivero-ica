import { adminClient, getAuthedUser } from "./_supabase.js";

// Gestión de usuarios, solo accesible para role='admin'.
// GET: lista usuarios (perfil + correo). POST: crea un usuario nuevo.
// PATCH: activa/desactiva el acceso de un usuario (bloquea login vía ban).
export default async function handler(req, res) {
  const authed = await getAuthedUser(req);
  if (!authed) { res.status(401).json({ error: "No autorizado" }); return; }
  if (authed.profile.role !== "admin") { res.status(403).json({ error: "Solo administradores" }); return; }

  const client = adminClient();

  if (req.method === "GET") {
    const { data: profiles, error: profErr } = await client
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: true });
    if (profErr) { res.status(500).json({ error: profErr.message }); return; }

    const { data: authList, error: authErr } = await client.auth.admin.listUsers({ perPage: 1000 });
    if (authErr) { res.status(500).json({ error: authErr.message }); return; }
    const emailById = {};
    (authList?.users || []).forEach((u) => { emailById[u.id] = u.email; });

    res.status(200).json({ users: profiles.map((p) => ({ ...p, email: emailById[p.id] || null })) });
    return;
  }

  if (req.method === "POST") {
    const { email, password, nombre, viveroNombre } = req.body || {};
    if (!email || !password) { res.status(400).json({ error: "Falta correo o clave" }); return; }
    const { data: created, error: createErr } = await client.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createErr) { res.status(400).json({ error: createErr.message }); return; }
    const { error: updErr } = await client
      .from("profiles")
      .update({ nombre: nombre || null, vivero_nombre: viveroNombre || null, role: "user", active: true })
      .eq("id", created.user.id);
    if (updErr) { res.status(500).json({ error: updErr.message }); return; }
    res.status(200).json({ ok: true, id: created.user.id });
    return;
  }

  if (req.method === "PATCH") {
    const { id, active } = req.body || {};
    if (!id || typeof active !== "boolean") { res.status(400).json({ error: "Datos inválidos" }); return; }
    if (id === authed.user.id && !active) { res.status(400).json({ error: "No puedes desactivar tu propia cuenta" }); return; }

    const { error: banErr } = await client.auth.admin.updateUserById(id, {
      ban_duration: active ? "none" : "876000h",
    });
    if (banErr) { res.status(500).json({ error: banErr.message }); return; }

    const { error: updErr } = await client.from("profiles").update({ active }).eq("id", id);
    if (updErr) { res.status(500).json({ error: updErr.message }); return; }
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: "Método no permitido" });
}
