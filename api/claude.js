import { getAuthedUser } from "./_supabase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "Método no permitido" }); return; }
  const authed = await getAuthedUser(req);
  if (!authed) { res.status(401).json({ error: "No autorizado" }); return; }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { res.status(500).json({ error: "Falta ANTHROPIC_API_KEY" }); return; }
  try {
    const body = req.body;
    const hasWebSearch = (body.tools || []).some((t) => t.type === "web_search_20250305");
    const headers = {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    };
    if (hasWebSearch) headers["anthropic-beta"] = "web-search-2025-03-05";
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) { res.status(500).json({ error: String(err) }); }
}
