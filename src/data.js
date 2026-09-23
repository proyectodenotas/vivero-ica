import { supabase } from "./supabaseClient.js";

// ---- profiles ----

export async function updateProfileTheme(id, { theme_primary, theme_secondary, theme_accent }) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ theme_primary, theme_secondary, theme_accent })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---- plant_types ----

export async function fetchPlantTypes() {
  const { data, error } = await supabase.from("plant_types").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function seedDefaultPlantTypes(ownerId, baseTipos) {
  const rows = baseTipos.map((t) => ({
    owner_id: ownerId,
    label: t.label,
    color: t.color,
    sustrato: t.sustrato,
    estratos: t.estratos,
    slug: t.id,
  }));
  // upsert + ignoreDuplicates (apoyado en el índice único owner_id+slug) para que
  // dos invocaciones concurrentes (ej. React.StrictMode en dev) no dupliquen filas.
  const { error } = await supabase
    .from("plant_types")
    .upsert(rows, { onConflict: "owner_id,slug", ignoreDuplicates: true });
  if (error) throw error;
  return fetchPlantTypes();
}

export async function createPlantType(ownerId, { label, color, sustrato, estratos, slug = null }) {
  const { data, error } = await supabase
    .from("plant_types")
    .insert({ owner_id: ownerId, label, color, sustrato, estratos, slug })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePlantType(id, payload) {
  const { data, error } = await supabase.from("plant_types").update(payload).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deletePlantType(id) {
  const { error } = await supabase.from("plant_types").delete().eq("id", id);
  if (error) throw error;
}

// ---- spaces ----

export async function fetchSpaces() {
  const { data, error } = await supabase.from("spaces").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createSpace(ownerId, { nombre, descripcion = null }) {
  const { data, error } = await supabase
    .from("spaces")
    .insert({ owner_id: ownerId, nombre, descripcion })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSpace(id, payload) {
  const { data, error } = await supabase.from("spaces").update(payload).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteSpace(id) {
  const { error } = await supabase.from("spaces").delete().eq("id", id);
  if (error) throw error;
}

// ---- plants ----

export async function fetchPlants() {
  const { data, error } = await supabase.from("plants").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createPlant(ownerId, payload) {
  const { data, error } = await supabase
    .from("plants")
    .insert({ ...payload, owner_id: ownerId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePlant(id, payload) {
  const { data, error } = await supabase.from("plants").update(payload).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deletePlant(id) {
  const { error } = await supabase.from("plants").delete().eq("id", id);
  if (error) throw error;
}

// ---- transacciones ----

export async function fetchTransacciones() {
  const { data, error } = await supabase.from("transacciones").select("*").order("fecha", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createTransaccion(ownerId, payload) {
  const { data, error } = await supabase
    .from("transacciones")
    .insert({ ...payload, owner_id: ownerId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---- bitacora_eventos ----

export async function fetchEventos() {
  const { data, error } = await supabase.from("bitacora_eventos").select("*").order("fecha", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createEvento(ownerId, plantId, payload) {
  const { data, error } = await supabase
    .from("bitacora_eventos")
    .insert({ ...payload, owner_id: ownerId, plant_id: plantId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteEvento(id) {
  const { error } = await supabase.from("bitacora_eventos").delete().eq("id", id);
  if (error) throw error;
}

// ---- storage: fotos de plantas ----

function dataUrlToBlob(dataUrl) {
  const [meta, b64] = dataUrl.split(",");
  const mime = meta.match(/data:(.*);base64/)[1];
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export async function uploadPlantPhoto(ownerId, dataUrl) {
  const blob = dataUrlToBlob(dataUrl);
  const ext = blob.type === "image/png" ? "png" : "jpg";
  const path = `${ownerId}/${crypto.randomUUID()}.${ext}`;
  const { error: uploadErr } = await supabase.storage
    .from("plant-photos")
    .upload(path, blob, { contentType: blob.type });
  if (uploadErr) throw uploadErr;
  const { data } = supabase.storage.from("plant-photos").getPublicUrl(path);
  return data.publicUrl;
}

// ---- migración puntual desde localStorage (versión pre-Supabase) ----

const OLD_EVENT_TIPO_MAP = {
  llegada: "otro",
  plaga: "control_plagas",
  poda: "poda",
  sustrato: "cambio_sustrato",
  fumigacion: "control_plagas",
  otro: "otro",
};

export async function migrateLocalInventory(ownerId, { oldPlants, oldTipos, currentTipos }) {
  const tipoMap = {};
  let tipos = currentTipos;
  for (const ot of oldTipos || []) {
    const existing = tipos.find((t) => t.slug === ot.id || t.label === ot.label);
    if (existing) {
      tipoMap[ot.id] = existing.id;
    } else {
      const created = await createPlantType(ownerId, {
        label: ot.label,
        color: ot.color,
        sustrato: ot.sustrato,
        estratos: ot.estratos,
        slug: ot.id,
      });
      tipoMap[ot.id] = created.id;
      tipos = [...tipos, created];
    }
  }

  let migratedCount = 0;
  for (const op of oldPlants || []) {
    let fotoUrl = null;
    if (op.imagen) {
      fotoUrl = op.imagen.startsWith("data:") ? await uploadPlantPhoto(ownerId, op.imagen).catch(() => null) : op.imagen;
    }
    const notas = [op.notas, op.situacionLlegada ? `Situación de llegada: ${op.situacionLlegada}` : null]
      .filter(Boolean)
      .join("\n");
    const plantRow = await createPlant(ownerId, {
      nombre: op.nombre,
      variedad: op.variedad || null,
      tipo_id: tipoMap[op.tipo] || null,
      sustrato: op.sustrato || null,
      materiales: op.materiales || null,
      cuidados: op.cuidados || null,
      clima_preferido: op.climaPreferido || null,
      adaptacion: op.adaptacion || null,
      ubicacion: op.ubicacion || null,
      foto_url: fotoUrl,
      fecha_recepcion: op.fechaLlegada || null,
      notas: notas || null,
      ai_identified: !!op.aiIdentified,
    });
    for (const ev of op.eventos || []) {
      await createEvento(ownerId, plantRow.id, {
        fecha: ev.fecha || new Date().toISOString().slice(0, 10),
        tipo: OLD_EVENT_TIPO_MAP[ev.tipo] || "otro",
        nota: ev.nota || null,
      });
    }
    migratedCount++;
  }

  return { migratedCount, tipos };
}
