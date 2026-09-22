import { getAuthedUser } from "./_supabase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "Método no permitido" }); return; }
  const authed = await getAuthedUser(req);
  if (!authed) { res.status(401).json({ error: "No autorizado" }); return; }
  const apiKey = process.env.PLANTNET_API_KEY;
  if (!apiKey) { res.status(500).json({ error: "Falta PLANTNET_API_KEY" }); return; }
  try {
    const { mediaType, b64 } = req.body || {};
    if (!b64) { res.status(400).json({ error: "Falta imagen" }); return; }
    const buffer = Buffer.from(b64, "base64");
    const ext = mediaType === "image/png" ? "png" : "jpg";
    const form = new FormData();
    form.append("images", new Blob([buffer], { type: mediaType || "image/jpeg" }), `photo.${ext}`);

    const url = `https://my-api.plantnet.org/v2/identify/all?api-key=${encodeURIComponent(apiKey)}&lang=es&nb-results=3`;
    const response = await fetch(url, { method: "POST", body: form });
    const data = await response.json();
    if (!response.ok) {
      res.status(response.status).json({ error: (data && data.message) || "Error de identificación" });
      return;
    }
    const results = data.results || [];
    const top = results[0];
    if (!top) { res.status(200).json({ scientificName: null }); return; }
    res.status(200).json({
      scientificName: (top.species && top.species.scientificNameWithoutAuthor) || data.bestMatch || null,
      commonNames: (top.species && top.species.commonNames) || [],
      family: (top.species && top.species.family && top.species.family.scientificNameWithoutAuthor) || null,
      score: typeof top.score === "number" ? top.score : null,
      remaining: data.remainingIdentificationRequests,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
