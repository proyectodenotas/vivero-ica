import React, { useState, useEffect, useRef } from "react";
import {
  Search, Plus, X, Pencil, Trash2, Leaf, Sprout, MapPin, Sun,
  Camera, Loader2, Sparkles, Droplet, Compass, ClipboardList,
  Home, Bug, Scissors, Layers, Droplets, FileText, Clock,
  CloudSun, RefreshCw, AlertTriangle, Flower2, ShoppingCart, Coins,
} from "lucide-react";
import { storage } from "./storage.js";
import { supabase } from "./supabaseClient.js";
import * as db from "./data.js";

async function authHeader() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ---- Categorías base, con sustrato pensado para el clima árido de Ica ----
const BASE_TIPOS = [
  {
    id: "cactus",
    label: "Cactus y suculentas",
    color: "#A85C32",
    sustrato: "60% arena gruesa, 25% tierra de hoja, 15% grava fina — drenaje máximo, pensado para el calor seco de Ica.",
    estratos: [60, 25, 15],
  },
  {
    id: "tropical",
    label: "Tropicales",
    color: "#2F5233",
    sustrato: "40% tierra negra, 30% fibra de coco o turba, 20% compost, 10% perlita — retiene humedad extra frente al ambiente seco.",
    estratos: [40, 30, 20, 10],
  },
  {
    id: "frutal",
    label: "Frutales",
    color: "#6B4F2A",
    sustrato: "50% tierra de chacra, 30% compost, 20% arena — cubrir con mulch para conservar humedad del suelo.",
    estratos: [50, 30, 20],
  },
  {
    id: "aromatica",
    label: "Aromáticas y hierbas",
    color: "#5C7A4A",
    sustrato: "50% tierra de hoja, 30% arena, 20% compost — buen drenaje, riego moderado y frecuente.",
    estratos: [50, 30, 20],
  },
  {
    id: "ornamental",
    label: "Ornamentales de interior",
    color: "#8FB79B",
    sustrato: "40% tierra negra, 30% compost, 20% perlita, 10% arena.",
    estratos: [40, 30, 20, 10],
  },
  {
    id: "palmera",
    label: "Palmeras",
    color: "#B08D57",
    sustrato: "50% tierra franca, 30% arena gruesa, 20% compost — buen drenaje con retención moderada de humedad.",
    estratos: [50, 30, 20],
  },
  {
    id: "conifera",
    label: "Coníferas y árboles",
    color: "#4A5D3A",
    sustrato: "60% tierra de jardín, 25% arena, 15% compost — suelo suelto y bien aireado.",
    estratos: [60, 25, 15],
  },
  {
    id: "trepadora",
    label: "Trepadoras y enredaderas",
    color: "#6B8A5C",
    sustrato: "40% tierra negra, 30% compost, 20% fibra de coco, 10% perlita — soporte firme y riego constante.",
    estratos: [40, 30, 20, 10],
  },
  {
    id: "bulbosa",
    label: "Bulbosas y rizomatosas",
    color: "#A6763E",
    sustrato: "50% tierra franca, 30% arena, 20% compost — drenaje rápido para evitar pudrición del bulbo.",
    estratos: [50, 30, 20],
  },
  {
    id: "orquidea",
    label: "Orquídeas",
    color: "#8B5E83",
    sustrato: "70% corteza de pino, 20% musgo sphagnum, 10% carbón activado — sustrato aireado, sin tierra.",
    estratos: [70, 20, 10],
  },
  {
    id: "helecho",
    label: "Helechos",
    color: "#3E6B5A",
    sustrato: "40% turba o fibra de coco, 30% tierra de hoja, 20% perlita, 10% carbón — alta retención de humedad.",
    estratos: [40, 30, 20, 10],
  },
  {
    id: "acuatica",
    label: "Plantas acuáticas",
    color: "#3B6B8A",
    sustrato: "Sustrato arcilloso o grava fina en el fondo del recipiente, sumergido en agua limpia.",
    estratos: [70, 30],
  },
  {
    id: "cesped",
    label: "Césped y cobertoras",
    color: "#5C8A3E",
    sustrato: "60% tierra franca, 25% arena, 15% compost — nivelado y bien compactado.",
    estratos: [60, 25, 15],
  },
  {
    id: "bonsai",
    label: "Bonsái",
    color: "#7A5C3E",
    sustrato: "Akadama, arena gruesa y un poco de compost en partes iguales — excelente drenaje.",
    estratos: [34, 33, 33],
  },
  {
    id: "medicinal",
    label: "Medicinales",
    color: "#7A8A4A",
    sustrato: "50% tierra de hoja, 30% compost, 20% arena — riego moderado según la especie.",
    estratos: [50, 30, 20],
  },
  {
    id: "otra",
    label: "Otras",
    color: "#9C8B6E",
    sustrato: "Sustrato balanceado con buen drenaje; ajustar según la especie.",
    estratos: [50, 50],
  },
];
const BASE_IDS = BASE_TIPOS.map((t) => t.id);
const EXTRA_COLORS = ["#7A5C3E", "#4A6B5C", "#8B5E83", "#5C6B8A", "#9B7653", "#3E6B5A", "#8A5C6B"];

const CARE_INFO = {
  cactus: {
    cuidados: "Riego escaso y espaciado (cada 2-3 semanas en verano, menos en invierno), dejando secar el sustrato por completo entre riegos. Ubicar a pleno sol. Podar solo para retirar partes dañadas.",
    climaPreferido: "Zonas áridas y semiáridas, con suelos bien drenados y alta exposición solar.",
    adaptacion: "Ya está naturalmente adaptada al clima seco de Ica; evita el exceso de riego y la humedad estancada, el principal riesgo para este tipo de plantas.",
    materiales: ["arena gruesa", "grava fina", "perlita", "tierra de hoja"],
  },
  tropical: {
    cuidados: "Riego frecuente para mantener el sustrato ligeramente húmedo, sin encharcar. Luz indirecta brillante. Aumentar la humedad ambiental con nebulizaciones o bandejas con agua.",
    climaPreferido: "Climas cálidos y húmedos, con lluvias frecuentes y poca variación de temperatura.",
    adaptacion: "En Ica, ubicar en zonas con sombra parcial y nebulizar las hojas regularmente para compensar la baja humedad ambiental típica del desierto costero.",
    materiales: ["fibra de coco", "turba", "musgo sphagnum", "corteza de pino", "perlita", "compost"],
  },
  frutal: {
    cuidados: "Riego profundo y regular, especialmente en floración y fructificación. Podas de formación y sanitarias cada temporada. Fertilizar con compost o abono orgánico periódicamente.",
    climaPreferido: "Varía según la especie; muchos frutales prefieren clima templado con estación fría marcada para inducir la floración.",
    adaptacion: "Usar mulch grueso para conservar la humedad del suelo y regar con mayor frecuencia durante el calor extremo de Ica; considerar sombra parcial en las horas de más sol si la especie no tolera bien el calor seco.",
    materiales: ["tierra de chacra", "compost", "arena", "mulch de corteza"],
  },
  aromatica: {
    cuidados: "Riego moderado y frecuente, evitando encharcar. Pleno sol o semisombra según la especie. Cosechar o podar las hojas regularmente para estimular brotes nuevos.",
    climaPreferido: "La mayoría son de origen mediterráneo, adaptadas a climas templados y secos con buena exposición solar.",
    adaptacion: "Se adaptan bien al clima árido de Ica; conviene regar en las horas más frescas del día para evitar el estrés hídrico por el calor.",
    materiales: ["tierra de hoja", "arena gruesa", "compost", "perlita"],
  },
  ornamental: {
    cuidados: "Riego moderado, dejando secar la superficie del sustrato entre riegos. Luz indirecta, evitando el sol directo intenso. Limpiar las hojas periódicamente para favorecer la fotosíntesis.",
    climaPreferido: "Ambientes interiores estables, con temperatura templada y humedad moderada.",
    adaptacion: "Protegerla del sol directo y del aire muy seco típico de Ica; ubicarla lejos de corrientes de aire caliente y considerar aumentar la humedad ambiental a su alrededor.",
    materiales: ["tierra negra", "compost", "perlita", "corteza de pino", "musgo"],
  },
  palmera: {
    cuidados: "Riego regular en verano, más espaciado en invierno. Pleno sol o semisombra según la especie. Retirar hojas secas de la base periódicamente.",
    climaPreferido: "Climas cálidos y tropicales o subtropicales; muchas toleran algo de sequía una vez establecidas.",
    adaptacion: "La mayoría se adapta bien al calor seco de Ica; reforzar el riego en los meses más calurosos y proteger del viento fuerte cuando son jóvenes.",
    materiales: ["tierra franca", "arena gruesa", "compost"],
  },
  conifera: {
    cuidados: "Riego moderado y espaciado, evitando encharcamiento. Pleno sol. Podas ligeras de mantenimiento.",
    climaPreferido: "Climas templados a fríos, con estaciones bien marcadas.",
    adaptacion: "En Ica conviene regar con más frecuencia en verano y vigilar el estrés por calor; elegir variedades tolerantes a climas áridos.",
    materiales: ["tierra de jardín", "arena", "compost"],
  },
  trepadora: {
    cuidados: "Riego regular manteniendo el sustrato húmedo sin encharcar. Luz indirecta a media sombra. Proveer tutor o soporte para que trepe.",
    climaPreferido: "Climas cálidos y húmedos; muchas son de origen tropical o subtropical.",
    adaptacion: "Ubicar en zonas con sombra parcial y aumentar la frecuencia de riego para compensar la sequedad ambiental de Ica.",
    materiales: ["tierra negra", "compost", "fibra de coco", "perlita"],
  },
  bulbosa: {
    cuidados: "Riego moderado durante el crecimiento activo, reducir o suspender en el periodo de dormancia del bulbo. Pleno sol a semisombra.",
    climaPreferido: "Varía según la especie; muchas prefieren climas templados con una temporada fría o seca marcada.",
    adaptacion: "Asegurar buen drenaje para evitar pudrición del bulbo por el calor y riego irregular; plantar a la profundidad adecuada.",
    materiales: ["tierra franca", "arena", "compost"],
  },
  orquidea: {
    cuidados: "Riego por inmersión o nebulización cuando el sustrato se seca, evitando encharcar las raíces. Luz indirecta brillante. Buena ventilación.",
    climaPreferido: "Climas tropicales húmedos con alta humedad ambiental y temperaturas estables.",
    adaptacion: "En Ica, aumentar la humedad con nebulizaciones frecuentes y ubicar lejos de corrientes de aire seco y sol directo intenso.",
    materiales: ["corteza de pino", "musgo sphagnum", "carbón activado"],
  },
  helecho: {
    cuidados: "Mantener el sustrato siempre húmedo, sin encharcar. Sombra o luz indirecta baja. Nebulizar las frondas regularmente.",
    climaPreferido: "Climas húmedos y sombríos, típicos de sotobosque tropical o templado.",
    adaptacion: "Ubicar en el rincón más sombreado y húmedo disponible, y nebulizar con frecuencia para contrarrestar la sequedad del aire en Ica.",
    materiales: ["turba", "fibra de coco", "tierra de hoja", "perlita", "carbón"],
  },
  acuatica: {
    cuidados: "Mantener siempre sumergidas o con la base en agua limpia, renovándola periódicamente. Luz abundante, directa o indirecta según la especie.",
    climaPreferido: "Climas cálidos y húmedos, con acceso constante a agua.",
    adaptacion: "Vigilar la evaporación rápida del agua por el calor seco de Ica y reponerla con frecuencia; proteger de la exposición solar excesiva que puede calentar el agua.",
    materiales: ["grava fina", "arcilla", "carbón activado"],
  },
  cesped: {
    cuidados: "Riego frecuente y ligero, más abundante en épocas de calor. Corte regular para mantener una altura uniforme. Fertilizar cada 1-2 meses en crecimiento activo.",
    climaPreferido: "Varía según la variedad; muchas céspedes toleran climas templados a cálidos con riego constante.",
    adaptacion: "En el clima árido de Ica, regar con mayor frecuencia (idealmente en la madrugada o al atardecer) para evitar que se seque o se queme con el sol fuerte.",
    materiales: ["tierra franca", "arena", "compost"],
  },
  bonsai: {
    cuidados: "Riego frecuente en pequeñas cantidades, dejando que el sustrato drene bien. Podas y alambrado periódicos para mantener la forma. Luz abundante según la especie.",
    climaPreferido: "Depende de la especie base; muchas prefieren climas templados con variación estacional.",
    adaptacion: "Proteger de las horas de sol más intensas en Ica y aumentar la frecuencia de riego, ya que las macetas pequeñas se secan rápido con el calor.",
    materiales: ["akadama", "arena gruesa", "compost"],
  },
  medicinal: {
    cuidados: "Riego moderado, generalmente similar al de hierbas aromáticas. Pleno sol a semisombra. Cosechar hojas o partes según la especie sin dañar la planta.",
    climaPreferido: "Muchas son de climas templados y secos, similares a las aromáticas mediterráneas.",
    adaptacion: "Se adaptan razonablemente bien al clima árido de Ica; regar en horas frescas y vigilar el estrés hídrico en los días de más calor.",
    materiales: ["tierra de hoja", "arena", "compost"],
  },
  otra: {
    cuidados: "Revisa las necesidades específicas de riego, luz y poda según la especie identificada.",
    climaPreferido: "Variable según la especie.",
    adaptacion: "Ajusta el cuidado observando cómo responde la planta al clima árido y seco de Ica.",
    materiales: ["compost", "arena", "sustrato balanceado"],
  },
};

const FAMILY_TO_CATEGORY = {
    Cactaceae: "cactus",
    Agavaceae: "cactus",
    Asparagaceae: "cactus",
    Crassulaceae: "cactus",
    Aizoaceae: "cactus",
    Didiereaceae: "cactus",
    Araceae: "tropical",
    Marantaceae: "tropical",
    Musaceae: "tropical",
    Zingiberaceae: "tropical",
    Bromeliaceae: "tropical",
    Heliconiaceae: "tropical",
    Strelitziaceae: "tropical",
    Orchidaceae: "orquidea",
    Arecaceae: "palmera",
    Pinaceae: "conifera",
    Cupressaceae: "conifera",
    Araucariaceae: "conifera",
    Poaceae: "cesped",
    Pteridaceae: "helecho",
    Polypodiaceae: "helecho",
    Dryopteridaceae: "helecho",
    Amaryllidaceae: "bulbosa",
    Iridaceae: "bulbosa",
    Liliaceae: "bulbosa",
    Rutaceae: "frutal",
    Rosaceae: "frutal",
    Anacardiaceae: "frutal",
    Myrtaceae: "frutal",
    Vitaceae: "frutal",
    Sapindaceae: "frutal",
    Caricaceae: "frutal",
    Passifloraceae: "frutal",
    Solanaceae: "frutal",
    Lamiaceae: "aromatica",
    Apiaceae: "aromatica",
    Verbenaceae: "aromatica",
    Araliaceae: "ornamental",
    Moraceae: "ornamental",
    Begoniaceae: "ornamental",
    Rubiaceae: "ornamental",
    Malvaceae: "ornamental",
    Apocynaceae: "ornamental",
    Piperaceae: "ornamental",
    Asteraceae: "ornamental",
};

function categoryFromFamily(family) {
    return FAMILY_TO_CATEGORY[family] || "otra";
}

const EVENT_TYPES = [
  { id: "fertilizacion", label: "Fertilización", icon: Droplets },
  { id: "riego", label: "Riego", icon: Droplet },
  { id: "cambio_maceta", label: "Cambio de maceta", icon: Home },
  { id: "cambio_sustrato", label: "Cambio de sustrato", icon: Layers },
  { id: "poda", label: "Poda", icon: Scissors },
  { id: "control_plagas", label: "Control de plagas / fumigación", icon: Bug },
  { id: "trasplante", label: "Trasplante", icon: Sprout },
  { id: "otro", label: "Otro", icon: FileText },
];
const eventInfo = (id) => EVENT_TYPES.find((e) => e.id === id) || EVENT_TYPES[EVENT_TYPES.length - 1];

const CLIMATE_KEY = "ica-plant-climate";
const LOCATION_KEY = "ica-plant-location";

const emptyForm = {
  id: null,
  nombre: "",
  variedad: "",
  tipo: "cactus",
  spaceId: "",
  sustrato: BASE_TIPOS[0].sustrato,
  materiales: (CARE_INFO.cactus.materiales || []).join(", "),
  cuidados: "",
  climaPreferido: "",
  adaptacion: "",
  ubicacion: "",
  imagen: "",
  notas: "",
  fechaRecepcion: "",
  viveroOrigen: "",
  provinciaOrigen: "",
  eventos: [],
  aiIdentified: false,
};

const emptyTxForm = {
  tipo: "compra",
  plantId: "",
  monto: "",
  contraparte: "",
  fecha: new Date().toISOString().slice(0, 10),
  nota: "",
};

function pickColor(existingTipos) {
  const used = new Set(existingTipos.map((t) => t.color));
  const avail = EXTRA_COLORS.find((c) => !used.has(c));
  return avail || EXTRA_COLORS[existingTipos.length % EXTRA_COLORS.length];
}

function tipoInfo(tipos, id) {
  return (
    tipos.find((t) => t.id === id || t.slug === id) || tipos[tipos.length - 1] || BASE_TIPOS[BASE_TIPOS.length - 1]
  );
}

function careInfoFor(tipoRow) {
  return CARE_INFO[tipoRow?.slug || tipoRow?.id] || CARE_INFO.otra;
}

function lastEvento(p) {
  if (!p.eventos || !p.eventos.length) return null;
  return [...p.eventos].sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""))[0];
}

function fmtFecha(iso) {
  if (!iso) return "";
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
  } catch (e) {
    return iso;
  }
}

function fileToCompressedDataUrl(file, maxDim = 640, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height >= width && height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function StrataBar({ estratos, colorBase, height = 10 }) {
  return (
    <div style={{ display: "flex", width: "100%", height, borderRadius: 3, overflow: "hidden" }}>
      {estratos.map((pct, i) => (
        <div key={i} style={{ width: `${pct}%`, background: colorBase, opacity: 1 - i * 0.22 }} />
      ))}
    </div>
  );
}

function ArrivalBox({ plant }) {
  if (!plant.fechaRecepcion && !plant.viveroOrigen && !plant.provinciaOrigen) return null;
  const partes = [];
  if (plant.viveroOrigen) partes.push(`de ${plant.viveroOrigen}`);
  if (plant.provinciaOrigen) partes.push(plant.provinciaOrigen);
  return (
    <div style={styles.arrivalBox}>
      <Home size={13} color="#6B4F2A" />
      <div>
        <div style={{ fontWeight: 600, fontSize: 12.5 }}>
          {plant.fechaRecepcion ? `Recibida el ${fmtFecha(plant.fechaRecepcion)}` : "Recepción registrada"}
        </div>
        {partes.length > 0 && <div style={{ fontSize: 12, color: "#5C4A2E" }}>{partes.join(" — ")}</div>}
      </div>
    </div>
  );
}

function LogModal({ plant, onClose, onAdd, onDelete }) {
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [tipo, setTipo] = useState(EVENT_TYPES[0].id);
  const [nota, setNota] = useState("");
  const [insumo, setInsumo] = useState("");
  const [dosis, setDosis] = useState("");
  const [repiteCadaDias, setRepiteCadaDias] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState("");
  const eventos = [...(plant.eventos || [])].sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));

  const submit = (e) => {
    e.preventDefault();
    if (!fecha) return;
    let proximaFechaSugerida = null;
    const dias = parseInt(repiteCadaDias, 10);
    if (dias > 0) {
      const d = new Date(fecha + "T00:00:00");
      d.setDate(d.getDate() + dias);
      proximaFechaSugerida = d.toISOString().slice(0, 10);
    }
    onAdd(plant.id, { fecha, tipo, nota, insumo, dosis, repiteCadaDias: dias > 0 ? dias : null, proximaFechaSugerida });
    setNota("");
    setInsumo("");
    setDosis("");
    setRepiteCadaDias("");
  };

  const fetchSuggestion = async () => {
    setSuggestLoading(true);
    setSuggestError("");
    setSuggestion("");
    try {
      const historial = eventos
        .map((ev) => {
          const info = eventInfo(ev.tipo);
          const detalle = [info.label];
          if (ev.insumo) detalle.push(ev.insumo + (ev.dosis ? ` (${ev.dosis})` : ""));
          if (ev.nota) detalle.push(ev.nota);
          return `${fmtFecha(ev.fecha)} — ${detalle.join(": ")}`;
        })
        .join("\n") || "Sin eventos registrados todavía.";
      const prompt = `Planta: ${plant.nombre}${plant.variedad ? ` (${plant.variedad})` : ""}, en un vivero doméstico de Ica, Perú (clima árido, costero, hemisferio sur).
Cuidados generales conocidos: ${plant.cuidados || "no especificados"}.
Historial reciente de bitácora:
${historial}

Busca si hay plagas o cuidados de temporada relevantes ahora mismo para esta especie en Ica, y da hasta 3 recomendaciones breves y accionables de cuidado para las próximas semanas, considerando el historial. Responde en español, en 2-4 frases, directo y práctico, sin formato JSON.`;
      const response = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 500,
          messages: [{ role: "user", content: prompt }],
          tools: [{ type: "web_search_20250305", name: "web_search" }],
        }),
      });
      const data = await response.json();
      const text = (data.content || []).map((b) => b.text || "").join("\n").trim();
      if (!text) throw new Error("sin respuesta");
      setSuggestion(text);
    } catch (err) {
      setSuggestError("No se pudo obtener una recomendación ahora. Intenta de nuevo.");
    } finally {
      setSuggestLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()} className="scroll-thin">
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Bitácora — {plant.nombre}</h2>
          <button type="button" style={styles.closeBtn} onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
        </div>

        <ArrivalBox plant={plant} />

        <form onSubmit={submit} style={styles.logForm}>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="date" style={{ ...styles.input, flex: 1 }} value={fecha} onChange={(e) => setFecha(e.target.value)} required />
            <select style={{ ...styles.input, flex: 1 }} value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {EVENT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input
              style={{ ...styles.input, flex: 1 }}
              placeholder="Insumo / producto (opcional)"
              value={insumo}
              onChange={(e) => setInsumo(e.target.value)}
            />
            <input
              style={{ ...styles.input, flex: 1 }}
              placeholder="Dosis (opcional)"
              value={dosis}
              onChange={(e) => setDosis(e.target.value)}
            />
          </div>
          <input
            style={{ ...styles.input, marginTop: 8 }}
            placeholder="Detalle (ej. pulgón en hojas nuevas, se abonó con humus…)"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <label style={{ ...styles.label, margin: 0, whiteSpace: "nowrap" }}>Repetir cada</label>
            <input
              type="number"
              min="1"
              style={{ ...styles.input, width: 80 }}
              placeholder="días"
              value={repiteCadaDias}
              onChange={(e) => setRepiteCadaDias(e.target.value)}
            />
            <span style={{ fontSize: 12, color: "#6B4F2A" }}>días (opcional, genera una alerta en el calendario)</span>
          </div>
          <button type="submit" style={{ ...styles.saveBtn, marginTop: 10 }}>Agregar al historial</button>
        </form>

        <div style={{ marginTop: 16 }}>
          <button type="button" style={styles.addBtnGhostSmall} onClick={fetchSuggestion} disabled={suggestLoading}>
            {suggestLoading ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />}
            {suggestLoading ? "Buscando…" : "Sugerencias de cuidado (IA)"}
          </button>
          {suggestError && <p style={{ ...styles.climateError, marginTop: 8 }}>{suggestError}</p>}
          {suggestion && <p style={{ fontSize: 12.5, color: "#3C3120", background: "#F8F1E0", border: "1px solid #E4DAC0", borderRadius: 8, padding: "10px 12px", marginTop: 8 }}>{suggestion}</p>}
        </div>

        <div style={styles.logList}>
          {eventos.length === 0 && <p style={styles.emptyText}>Todavía no hay eventos registrados.</p>}
          {eventos.map((ev) => {
            const info = eventInfo(ev.tipo);
            const Icon = info.icon;
            return (
              <div key={ev.id} style={styles.logItem}>
                <Icon size={14} color="#6B4F2A" style={{ marginTop: 2, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{info.label} · {fmtFecha(ev.fecha)}</div>
                  {ev.insumo && <div style={{ fontSize: 12, color: "#5C4A2E" }}>{ev.insumo}{ev.dosis ? ` — ${ev.dosis}` : ""}</div>}
                  {ev.nota && <div style={{ fontSize: 12, color: "#5C4A2E" }}>{ev.nota}</div>}
                  {ev.proximaFechaSugerida && (
                    <div style={{ fontSize: 11, color: "#A85C32", marginTop: 2 }}>Próxima: {fmtFecha(ev.proximaFechaSugerida)}</div>
                  )}
                </div>
                <button type="button" style={styles.logDelete} onClick={() => onDelete(plant.id, ev.id)} aria-label="Eliminar evento"><Trash2 size={13} /></button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function fromDbPlant(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    variedad: row.variedad || "",
    tipo: row.tipo_id,
    spaceId: row.space_id || "",
    sustrato: row.sustrato || "",
    materiales: row.materiales || "",
    cuidados: row.cuidados || "",
    climaPreferido: row.clima_preferido || "",
    adaptacion: row.adaptacion || "",
    ubicacion: row.ubicacion || "",
    imagen: row.foto_url || "",
    notas: row.notas || "",
    fechaRecepcion: row.fecha_recepcion || "",
    viveroOrigen: row.vivero_origen || "",
    provinciaOrigen: row.provincia_origen || "",
    estado: row.estado,
    valorActual: row.valor_actual,
    aiIdentified: !!row.ai_identified,
    createdAt: row.created_at,
    eventos: [],
  };
}

function monthLabel(d) {
  return d.toLocaleDateString("es-PE", { month: "short" });
}

function endOfMonthIso(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
}

function DashboardView({ plants, tipos, spaces, transacciones }) {
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const defaultFrom = new Date(today.getFullYear(), today.getMonth() - 5, 1);
  const [fromStr, setFromStr] = useState(defaultFrom.toISOString().slice(0, 10));
  const [toStr, setToStr] = useState(todayIso);

  const soldAtByPlant = {};
  transacciones.forEach((t) => {
    if (t.tipo === "venta" && (!soldAtByPlant[t.plant_id] || t.fecha < soldAtByPlant[t.plant_id])) {
      soldAtByPlant[t.plant_id] = t.fecha;
    }
  });

  const activeAsOf = (dateIso) =>
    plants.filter((p) => {
      const created = (p.createdAt || "").slice(0, 10);
      if (!created || created > dateIso) return false;
      const soldAt = soldAtByPlant[p.id];
      if (soldAt && soldAt <= dateIso) return false;
      return true;
    });

  const activeNow = activeAsOf(toStr);

  const altasEnRango = plants.filter((p) => {
    const created = (p.createdAt || "").slice(0, 10);
    return created >= fromStr && created <= toStr;
  }).length;
  const bajasEnRango = new Set(
    transacciones.filter((t) => t.tipo === "venta" && t.fecha >= fromStr && t.fecha <= toStr).map((t) => t.plant_id)
  ).size;
  const variacion = altasEnRango - bajasEnRango;

  const fromDate = new Date(fromStr + "T00:00:00");
  const toDate = new Date(toStr + "T00:00:00");
  const months = [];
  let cursor = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
  const last = new Date(toDate.getFullYear(), toDate.getMonth(), 1);
  while (cursor <= last && months.length < 24) {
    months.push(new Date(cursor));
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  const timeline = months.map((m) => ({ label: monthLabel(m), count: activeAsOf(endOfMonthIso(m)).length }));
  const maxCount = Math.max(1, ...timeline.map((t) => t.count));

  const tipoDist = tipos
    .map((t) => ({ id: t.id, label: t.label, color: t.color, count: activeNow.filter((p) => p.tipo === t.id).length }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count);
  const maxTipo = Math.max(1, ...tipoDist.map((t) => t.count));

  const spaceDist = spaces
    .map((s) => ({ id: s.id, label: s.nombre, count: activeNow.filter((p) => p.spaceId === s.id).length }))
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count);
  const sinEspacio = activeNow.filter((p) => !p.spaceId).length;
  if (sinEspacio > 0) spaceDist.push({ id: "__sin__", label: "Sin espacio asignado", count: sinEspacio });
  const maxSpace = Math.max(1, ...spaceDist.map((s) => s.count));

  const INCIDENT_KEYWORDS = ["plaga", "insecto", "hongo", "enferm", "mancha", "marchit", "pulg", "araña", "arana", "ácaro", "acaro"];
  const alertPlantIds = new Set();
  activeNow.forEach((p) => {
    const notas = (p.notas || "").toLowerCase();
    if (INCIDENT_KEYWORDS.some((k) => notas.includes(k))) alertPlantIds.add(p.id);
    if ((p.eventos || []).some((e) => e.tipo === "control_plagas")) alertPlantIds.add(p.id);
    if ((p.eventos || []).some((e) => e.proximaFechaSugerida && e.proximaFechaSugerida < todayIso)) alertPlantIds.add(p.id);
  });

  return (
    <>
      <div style={styles.toolbar}>
        <label style={{ fontSize: 12, color: "#6B4F2A" }}>Desde</label>
        <input type="date" style={styles.input} value={fromStr} onChange={(e) => setFromStr(e.target.value)} />
        <label style={{ fontSize: 12, color: "#6B4F2A" }}>Hasta</label>
        <input type="date" style={styles.input} value={toStr} onChange={(e) => setToStr(e.target.value)} />
      </div>

      <div style={styles.dashGrid}>
        <div style={styles.statTile}>
          <div style={styles.statTileLabel}>Plantas activas</div>
          <div style={styles.statTileValue}>{activeNow.length}</div>
          <div style={{ ...styles.statTileDelta, color: variacion >= 0 ? "#2F5233" : "#8A3B1D" }}>
            {variacion >= 0 ? "+" : ""}{variacion} en el rango ({altasEnRango} altas, {bajasEnRango} bajas)
          </div>
        </div>
        <div style={styles.statTile}>
          <div style={styles.statTileLabel}>Alertas activas</div>
          <div style={{ ...styles.statTileValue, color: alertPlantIds.size > 0 ? "#8A3B1D" : "#211C14" }}>{alertPlantIds.size}</div>
          <div style={styles.statTileDelta}>{alertPlantIds.size === 1 ? "planta requiere atención" : "plantas requieren atención"}</div>
        </div>
      </div>

      <div style={{ ...styles.climatePanel, maxWidth: 980, margin: "16px auto 0" }}>
        <div style={styles.soilProfileLabel}>Evolución del inventario</div>
        {timeline.length === 0 ? (
          <p style={styles.climateEmpty}>Ajusta el rango de fechas para ver la evolución.</p>
        ) : (
          <div style={styles.timelineChart}>
            {timeline.map((t, i) => (
              <div key={i} style={styles.timelineCol} title={`${t.label}: ${t.count}`}>
                <div style={{ ...styles.timelineBar, height: `${Math.max(4, (t.count / maxCount) * 100)}%` }}>
                  {i === timeline.length - 1 && <span style={styles.timelineBarLabel}>{t.count}</span>}
                </div>
                <div style={styles.timelineColLabel}>{t.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.dashGrid2}>
        <div style={styles.climatePanel}>
          <div style={styles.soilProfileLabel}>Distribución por tipo</div>
          {tipoDist.length === 0 ? (
            <p style={styles.climateEmpty}>Sin plantas activas.</p>
          ) : (
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              {tipoDist.map((t) => (
                <div key={t.id} style={styles.barRow}>
                  <div style={styles.barRowLabel} title={t.label}>{t.label}</div>
                  <div style={styles.barTrack}>
                    <div style={{ ...styles.barFill, width: `${(t.count / maxTipo) * 100}%`, background: t.color }} />
                  </div>
                  <div style={styles.barRowValue}>{t.count}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={styles.climatePanel}>
          <div style={styles.soilProfileLabel}>Distribución por espacio</div>
          {spaceDist.length === 0 ? (
            <p style={styles.climateEmpty}>Sin espacios asignados todavía.</p>
          ) : (
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              {spaceDist.map((s) => (
                <div key={s.id} style={styles.barRow}>
                  <div style={styles.barRowLabel} title={s.label}>{s.label}</div>
                  <div style={styles.barTrack}>
                    <div style={{ ...styles.barFill, width: `${(s.count / maxSpace) * 100}%`, background: "#6B4F2A" }} />
                  </div>
                  <div style={styles.barRowValue}>{s.count}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ConfigView({ ownerId, profile, tipos, setTipos, spaces, setSpaces, onLogout }) {
  const isAdmin = profile?.role === "admin";

  // ---- cambiar contraseña ----
  const [newPassword, setNewPassword] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const changePassword = async (e) => {
    e.preventDefault();
    setPwMsg("");
    setPwError("");
    if (newPassword.length < 6) { setPwError("La clave debe tener al menos 6 caracteres."); return; }
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwSaving(false);
    if (error) setPwError("No se pudo cambiar la clave. Intenta de nuevo.");
    else { setPwMsg("Clave actualizada."); setNewPassword(""); }
  };

  // ---- tipos: editar / eliminar ----
  const [editingTipoId, setEditingTipoId] = useState(null);
  const [editTipoLabel, setEditTipoLabel] = useState("");
  const [tiposError, setTiposError] = useState("");

  const startEditTipo = (t) => { setEditingTipoId(t.id); setEditTipoLabel(t.label); };

  const saveTipoEdit = async (id) => {
    if (!editTipoLabel.trim()) return;
    try {
      const updated = await db.updatePlantType(id, { label: editTipoLabel.trim() });
      setTipos((prev) => prev.map((t) => (t.id === id ? updated : t)));
      setEditingTipoId(null);
    } catch (e) {
      setTiposError("No se pudo actualizar el área.");
    }
  };

  const removeTipo = async (id) => {
    if (!window.confirm("Eliminar esta área. Las plantas que la usan quedarán sin área asignada.")) return;
    try {
      await db.deletePlantType(id);
      setTipos((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      setTiposError("No se pudo eliminar el área.");
    }
  };

  // ---- espacios: editar / eliminar ----
  const [editingSpaceId, setEditingSpaceId] = useState(null);
  const [editSpaceName, setEditSpaceName] = useState("");
  const [spacesError, setSpacesError] = useState("");

  const startEditSpace = (s) => { setEditingSpaceId(s.id); setEditSpaceName(s.nombre); };

  const saveSpaceEdit = async (id) => {
    if (!editSpaceName.trim()) return;
    try {
      const updated = await db.updateSpace(id, { nombre: editSpaceName.trim() });
      setSpaces((prev) => prev.map((s) => (s.id === id ? updated : s)));
      setEditingSpaceId(null);
    } catch (e) {
      setSpacesError("No se pudo actualizar el espacio.");
    }
  };

  const removeSpace = async (id) => {
    if (!window.confirm("Eliminar este espacio. Las plantas que lo usan quedarán sin espacio asignado.")) return;
    try {
      await db.deleteSpace(id);
      setSpaces((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      setSpacesError("No se pudo eliminar el espacio.");
    }
  };

  // ---- migración de datos locales (versión pre-Supabase) ----
  const [hasLocalData, setHasLocalData] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrateMsg, setMigrateMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const oldPlants = await storage.get("ica-plant-inventory");
        const oldTipos = await storage.get("ica-plant-tipos");
        setHasLocalData(!!(oldPlants && oldPlants.value) || !!(oldTipos && oldTipos.value));
      } catch (e) {}
    })();
  }, []);

  const migrateLocalData = async () => {
    setMigrating(true);
    setMigrateMsg("");
    try {
      const oldPlantsRes = await storage.get("ica-plant-inventory");
      const oldTiposRes = await storage.get("ica-plant-tipos");
      const oldPlants = oldPlantsRes && oldPlantsRes.value ? JSON.parse(oldPlantsRes.value) : [];
      const oldTipos = oldTiposRes && oldTiposRes.value ? JSON.parse(oldTiposRes.value) : [];
      const result = await db.migrateLocalInventory(ownerId, { oldPlants, oldTipos, currentTipos: tipos });
      try {
        localStorage.removeItem("vivero:ica-plant-inventory");
        localStorage.removeItem("vivero:ica-plant-tipos");
      } catch (e) {}
      setHasLocalData(false);
      setMigrateMsg(`Se migraron ${result.migratedCount} plantas. Recargando la página…`);
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      setMigrateMsg("Ocurrió un error durante la migración. Intenta de nuevo.");
    } finally {
      setMigrating(false);
    }
  };

  // ---- gestión de usuarios (solo admin) ----
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [newUserFormOpen, setNewUserFormOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ email: "", password: "", nombre: "", viveroNombre: "" });

  const loadUsers = async () => {
    setUsersLoading(true);
    setUsersError("");
    try {
      const res = await fetch("/api/admin-users", { headers: await authHeader() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setUsers(data.users);
    } catch (e) {
      setUsersError("No se pudo cargar la lista de usuarios.");
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadUsers();
  }, [isAdmin]);

  const createUser = async (e) => {
    e.preventDefault();
    setUsersError("");
    try {
      const res = await fetch("/api/admin-users", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify(newUserForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setNewUserForm({ email: "", password: "", nombre: "", viveroNombre: "" });
      setNewUserFormOpen(false);
      loadUsers();
    } catch (e) {
      setUsersError(e.message || "No se pudo crear el usuario.");
    }
  };

  const toggleUserActive = async (u) => {
    setUsersError("");
    try {
      const res = await fetch("/api/admin-users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({ id: u.id, active: !u.active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      loadUsers();
    } catch (e) {
      setUsersError(e.message || "No se pudo actualizar el usuario.");
    }
  };

  return (
    <div style={styles.areas}>
      {isAdmin && (
        <div style={styles.climatePanel}>
          <div style={styles.climateHeaderRow}>
            <div style={styles.soilProfileLabel}>Gestión de usuarios</div>
            <button type="button" style={styles.addBtnGhostSmall} onClick={() => setNewUserFormOpen((v) => !v)}>
              <Plus size={14} /> Nuevo usuario
            </button>
          </div>

          {newUserFormOpen && (
            <form onSubmit={createUser} style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <input type="email" style={styles.input} placeholder="Correo" value={newUserForm.email}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })} required />
              <input type="password" style={styles.input} placeholder="Clave temporal" value={newUserForm.password}
                onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })} required minLength={6} />
              <input style={styles.input} placeholder="Nombre (opcional)" value={newUserForm.nombre}
                onChange={(e) => setNewUserForm({ ...newUserForm, nombre: e.target.value })} />
              <input style={styles.input} placeholder="Nombre del vivero (opcional)" value={newUserForm.viveroNombre}
                onChange={(e) => setNewUserForm({ ...newUserForm, viveroNombre: e.target.value })} />
              <button type="submit" style={styles.saveBtn}>Crear usuario</button>
            </form>
          )}

          {usersError && <p style={{ ...styles.climateError, marginTop: 10 }}>{usersError}</p>}

          <div style={{ ...styles.logList, marginTop: 12 }}>
            {usersLoading && <p style={styles.emptyText}>Cargando usuarios…</p>}
            {!usersLoading && users.map((u) => (
              <div key={u.id} style={styles.logItem}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>
                    {u.email || u.id}{u.role === "admin" ? " · admin" : ""}{!u.active ? " · desactivado" : ""}
                  </div>
                  {(u.nombre || u.vivero_nombre) && (
                    <div style={{ fontSize: 12, color: "#5C4A2E" }}>{[u.nombre, u.vivero_nombre].filter(Boolean).join(" — ")}</div>
                  )}
                </div>
                {u.id !== ownerId && (
                  <button type="button" style={styles.addBtnGhostSmall} onClick={() => toggleUserActive(u)}>
                    {u.active ? "Desactivar" : "Activar"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={styles.climatePanel}>
        <div style={styles.soilProfileLabel}>Áreas (tipos de planta)</div>
        {tiposError && <p style={{ ...styles.climateError, marginTop: 8 }}>{tiposError}</p>}
        <div style={{ ...styles.logList, marginTop: 12 }}>
          {tipos.map((t) => (
            <div key={t.id} style={styles.logItem}>
              <span style={{ ...styles.areaDot, background: t.color, marginTop: 4 }} />
              {editingTipoId === t.id ? (
                <>
                  <input style={{ ...styles.input, flex: 1 }} value={editTipoLabel} onChange={(e) => setEditTipoLabel(e.target.value)} autoFocus />
                  <button type="button" style={styles.addBtnGhostSmall} onClick={() => saveTipoEdit(t.id)}>Guardar</button>
                  <button type="button" style={styles.cancelBtnSmall} onClick={() => setEditingTipoId(null)}>Cancelar</button>
                </>
              ) : (
                <>
                  <div style={{ flex: 1, fontSize: 12.5 }}>{t.label}</div>
                  <button type="button" style={styles.iconBtn} className="icon-btn" onClick={() => startEditTipo(t)} aria-label="Editar área"><Pencil size={14} /></button>
                  <button type="button" style={styles.iconBtn} className="icon-btn" onClick={() => removeTipo(t.id)} aria-label="Eliminar área"><Trash2 size={14} /></button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={styles.climatePanel}>
        <div style={styles.soilProfileLabel}>Espacios</div>
        {spacesError && <p style={{ ...styles.climateError, marginTop: 8 }}>{spacesError}</p>}
        {spaces.length === 0 ? (
          <p style={{ ...styles.climateEmpty, marginTop: 8 }}>Todavía no tienes espacios creados. Puedes agregarlos desde la pestaña Inventario.</p>
        ) : (
          <div style={{ ...styles.logList, marginTop: 12 }}>
            {spaces.map((s) => (
              <div key={s.id} style={styles.logItem}>
                {editingSpaceId === s.id ? (
                  <>
                    <input style={{ ...styles.input, flex: 1 }} value={editSpaceName} onChange={(e) => setEditSpaceName(e.target.value)} autoFocus />
                    <button type="button" style={styles.addBtnGhostSmall} onClick={() => saveSpaceEdit(s.id)}>Guardar</button>
                    <button type="button" style={styles.cancelBtnSmall} onClick={() => setEditingSpaceId(null)}>Cancelar</button>
                  </>
                ) : (
                  <>
                    <div style={{ flex: 1, fontSize: 12.5 }}>{s.nombre}</div>
                    <button type="button" style={styles.iconBtn} className="icon-btn" onClick={() => startEditSpace(s)} aria-label="Editar espacio"><Pencil size={14} /></button>
                    <button type="button" style={styles.iconBtn} className="icon-btn" onClick={() => removeSpace(s.id)} aria-label="Eliminar espacio"><Trash2 size={14} /></button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {hasLocalData && (
        <div style={styles.climatePanel}>
          <div style={styles.soilProfileLabel}>Datos locales pendientes de migrar</div>
          <p style={{ ...styles.climateEmpty, marginTop: 8 }}>
            Encontramos un inventario guardado en este navegador de antes de usar cuentas. Puedes subirlo a tu cuenta
            ahora — se agregará a tu inventario actual sin duplicar tipos existentes.
          </p>
          {migrateMsg && <p style={{ fontSize: 12.5, marginTop: 8 }}>{migrateMsg}</p>}
          <button type="button" style={{ ...styles.addBtn, marginTop: 10 }} onClick={migrateLocalData} disabled={migrating}>
            {migrating ? <Loader2 size={16} className="spin" /> : null}
            {migrating ? "Migrando…" : "Migrar datos locales"}
          </button>
        </div>
      )}

      <div style={styles.climatePanel}>
        <div style={styles.soilProfileLabel}>Cuenta</div>
        <form onSubmit={changePassword} style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-start" }}>
          <input type="password" style={{ ...styles.input, flex: "1 1 220px" }} placeholder="Nueva clave (mínimo 6 caracteres)"
            value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <button type="submit" style={styles.addBtnGhostSmall} disabled={pwSaving}>{pwSaving ? "Guardando…" : "Cambiar clave"}</button>
        </form>
        {pwError && <p style={{ ...styles.climateError, marginTop: 8 }}>{pwError}</p>}
        {pwMsg && <p style={{ fontSize: 12.5, marginTop: 8, color: "#2F5233" }}>{pwMsg}</p>}

        <button type="button" style={{ ...styles.logoutBtn, marginTop: 16 }} onClick={onLogout}>Cerrar sesión</button>
      </div>
    </div>
  );
}

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function CalendarView({ plants, onOpenPlant }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const allTasks = [];
  plants.forEach((p) => {
    (p.eventos || []).forEach((ev) => {
      if (ev.proximaFechaSugerida) allTasks.push({ ...ev, plantId: p.id, plantName: p.nombre });
    });
  });

  const todayIso = new Date().toISOString().slice(0, 10);
  const in7Iso = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  })();

  const tasksByDay = {};
  allTasks.forEach((t) => {
    if (!tasksByDay[t.proximaFechaSugerida]) tasksByDay[t.proximaFechaSugerida] = [];
    tasksByDay[t.proximaFechaSugerida].push(t);
  });

  const overdue = allTasks
    .filter((t) => t.proximaFechaSugerida < todayIso)
    .sort((a, b) => a.proximaFechaSugerida.localeCompare(b.proximaFechaSugerida));
  const upcoming = allTasks
    .filter((t) => t.proximaFechaSugerida >= todayIso && t.proximaFechaSugerida <= in7Iso)
    .sort((a, b) => a.proximaFechaSugerida.localeCompare(b.proximaFechaSugerida));

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = new Date(year, month, 1).getDay();
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthLabel = cursor.toLocaleDateString("es-PE", { month: "long", year: "numeric" });

  const renderTaskRow = (t, color) => {
    const info = eventInfo(t.tipo);
    const Icon = info.icon;
    return (
      <div key={t.id} style={{ ...styles.logItem, cursor: "pointer" }} onClick={() => onOpenPlant(t.plantId)}>
        <Icon size={14} color={color} style={{ marginTop: 2, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>{t.plantName} · {info.label}</div>
          <div style={{ fontSize: 11.5, color }}>{fmtFecha(t.proximaFechaSugerida)}</div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div style={styles.climatePanel}>
        <div style={styles.soilProfileLabel}><ClipboardList size={13} strokeWidth={2.5} /> Tareas vencidas y próximas</div>
        {overdue.length === 0 && upcoming.length === 0 ? (
          <p style={styles.climateEmpty}>
            No hay tareas programadas. Al agregar un cuidado en la bitácora de una planta, indica cada cuántos días se
            repite para que aparezca aquí.
          </p>
        ) : (
          <>
            {overdue.length > 0 && (
              <>
                <p style={{ ...styles.statsColTitle, color: "#8A3B1D", marginTop: 12 }}>Vencidas ({overdue.length})</p>
                <div style={styles.logList}>{overdue.map((t) => renderTaskRow(t, "#8A3B1D"))}</div>
              </>
            )}
            {upcoming.length > 0 && (
              <>
                <p style={{ ...styles.statsColTitle, marginTop: 14 }}>Próximas 7 días ({upcoming.length})</p>
                <div style={styles.logList}>{upcoming.map((t) => renderTaskRow(t, "#6B4F2A"))}</div>
              </>
            )}
          </>
        )}
      </div>

      <div style={{ ...styles.climatePanel, marginTop: 16 }}>
        <div style={styles.climateHeaderRow}>
          <div style={styles.soilProfileLabel}><CloudSun size={13} strokeWidth={2.5} /> {monthLabel}</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" style={styles.cancelBtnSmall} onClick={() => setCursor(new Date(year, month - 1, 1))} aria-label="Mes anterior">←</button>
            <button type="button" style={styles.cancelBtnSmall} onClick={() => setCursor(new Date(year, month + 1, 1))} aria-label="Mes siguiente">→</button>
          </div>
        </div>
        <div style={styles.calendarWeekRow}>
          {WEEKDAYS.map((d) => <div key={d} style={styles.calendarWeekday}>{d}</div>)}
        </div>
        <div style={styles.calendarGrid}>
          {cells.map((d, i) => {
            if (d === null) return <div key={i} style={styles.calendarCellEmpty} />;
            const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const dayTasks = tasksByDay[iso] || [];
            const isToday = iso === todayIso;
            const isOverdue = iso < todayIso;
            return (
              <div key={i} style={{ ...styles.calendarCell, ...(isToday ? styles.calendarCellToday : {}) }}>
                <div style={styles.calendarCellNum}>{d}</div>
                {dayTasks.slice(0, 3).map((t) => (
                  <div
                    key={t.id}
                    style={{ ...styles.calendarTaskChip, ...(isOverdue ? styles.calendarTaskChipOverdue : {}) }}
                    onClick={() => onOpenPlant(t.plantId)}
                    title={`${t.plantName} — ${eventInfo(t.tipo).label}`}
                  >
                    {t.plantName}
                  </div>
                ))}
                {dayTasks.length > 3 && <div style={{ fontSize: 10, color: "#8A7857" }}>+{dayTasks.length - 3} más</div>}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function PlantInventory({ onLogout }) {
  const [ownerId, setOwnerId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [tipos, setTipos] = useState(BASE_TIPOS);
  const [spaces, setSpaces] = useState([]);
  const [plants, setPlants] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [filterTipo, setFilterTipo] = useState("todos");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [identifying, setIdentifying] = useState(false);
  const [identifyError, setIdentifyError] = useState("");
  const [logPlantId, setLogPlantId] = useState(null);
  const [detailPlantId, setDetailPlantId] = useState(null);
  const [climate, setClimate] = useState(null);
  const [climateLoading, setClimateLoading] = useState(false);
  const [climateError, setClimateError] = useState("");
  const [ubicacionClima, setUbicacionClima] = useState("Ica, Perú");
  const [addingTipo, setAddingTipo] = useState(false);
  const [newTipoName, setNewTipoName] = useState("");
  const [addingSpace, setAddingSpace] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [activeTab, setActiveTab] = useState("inventario");
  const [transacciones, setTransacciones] = useState([]);
  const [txFormOpen, setTxFormOpen] = useState(false);
  const [txForm, setTxForm] = useState(emptyTxForm);
  const [txFilterTipo, setTxFilterTipo] = useState("todos");
  const [txFilterPlant, setTxFilterPlant] = useState("todas");
  const [txFilterFrom, setTxFilterFrom] = useState("");
  const [txFilterTo, setTxFilterTo] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData?.user?.id;
        setOwnerId(uid);
        if (!uid) { setLoaded(true); return; }

        const { data: profileRow } = await supabase.from("profiles").select("*").eq("id", uid).single();
        setProfile(profileRow || null);

        let tiposRows = await db.fetchPlantTypes();
        if (tiposRows.length === 0) {
          tiposRows = await db.seedDefaultPlantTypes(uid, BASE_TIPOS);
        }
        setTipos(tiposRows);

        const spacesRows = await db.fetchSpaces();
        setSpaces(spacesRows);

        const [plantsRows, eventosRows] = await Promise.all([db.fetchPlants(), db.fetchEventos()]);
        const eventosByPlant = {};
        eventosRows.forEach((ev) => {
          if (!eventosByPlant[ev.plant_id]) eventosByPlant[ev.plant_id] = [];
          eventosByPlant[ev.plant_id].push({
            id: ev.id,
            fecha: ev.fecha,
            tipo: ev.tipo,
            nota: ev.nota || "",
            insumo: ev.insumo || "",
            dosis: ev.dosis || "",
            repiteCadaDias: ev.repite_cada_dias || null,
            proximaFechaSugerida: ev.proxima_fecha_sugerida || null,
          });
        });
        setPlants(plantsRows.map((row) => ({ ...fromDbPlant(row), eventos: eventosByPlant[row.id] || [] })));

        const txRows = await db.fetchTransacciones();
        setTransacciones(txRows);
      } catch (e) {
        setError("No se pudo cargar tu inventario. Intenta recargar la página.");
      }
      try {
        const resClimate = await storage.get(CLIMATE_KEY);
        if (resClimate && resClimate.value) setClimate(JSON.parse(resClimate.value));
      } catch (e) {}
      try {
        const resLocation = await storage.get(LOCATION_KEY);
        if (resLocation && resLocation.value) setUbicacionClima(resLocation.value);
      } catch (e) {}
      setLoaded(true);
    })();
  }, []);

  const persistUbicacion = async (next) => {
    setUbicacionClima(next);
    try {
      await storage.set(LOCATION_KEY, next);
    } catch (e) {}
  };

  const addCustomTipo = async () => {
    const label = newTipoName.trim();
    if (!label) return;
    try {
      const nuevo = await db.createPlantType(ownerId, {
        label,
        color: pickColor(tipos),
        sustrato: "Sustrato balanceado con buen drenaje; ajustar según la especie.",
        estratos: [50, 50],
      });
      setTipos([...tipos, nuevo]);
      setNewTipoName("");
      setAddingTipo(false);
    } catch (e) {
      setError("No se pudo crear el área. Intenta de nuevo.");
    }
  };

  const addCustomSpace = async () => {
    const nombre = newSpaceName.trim();
    if (!nombre) return;
    try {
      const nuevo = await db.createSpace(ownerId, { nombre });
      setSpaces([...spaces, nuevo]);
      setNewSpaceName("");
      setAddingSpace(false);
    } catch (e) {
      setError("No se pudo crear el espacio. Intenta de nuevo.");
    }
  };

  const openNew = () => {
    const firstTipo = tipos[0];
    const care = careInfoFor(firstTipo);
    setForm({
      ...emptyForm,
      tipo: firstTipo?.id || "",
      sustrato: firstTipo?.sustrato || "",
      climaPreferido: care.climaPreferido,
      adaptacion: care.adaptacion,
      materiales: (care.materiales || []).join(", "),
    });
    setFormOpen(true);
  };

  const openEdit = (plant) => {
    setForm({ ...emptyForm, ...plant });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setForm(emptyForm);
  };

  const handleTipoChange = (tipoId) => {
    const info = tipoInfo(tipos, tipoId);
    const care = careInfoFor(info);
    setForm((f) => {
      const keepCustom = !!f.id || f.aiIdentified;
      return {
        ...f,
        tipo: tipoId,
        sustrato: keepCustom ? f.sustrato : info.sustrato,
        climaPreferido: keepCustom ? f.climaPreferido : care.climaPreferido,
        adaptacion: keepCustom ? f.adaptacion : care.adaptacion,
        materiales: keepCustom ? f.materiales : (care.materiales || []).join(", "),
      };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    try {
      let fotoUrl = form.imagen;
      if (fotoUrl && fotoUrl.startsWith("data:")) {
        fotoUrl = await db.uploadPlantPhoto(ownerId, fotoUrl);
      }
      const payload = {
        nombre: form.nombre.trim(),
        variedad: form.variedad || null,
        tipo_id: form.tipo || null,
        space_id: form.spaceId || null,
        sustrato: form.sustrato || null,
        materiales: form.materiales || null,
        cuidados: form.cuidados || null,
        clima_preferido: form.climaPreferido || null,
        adaptacion: form.adaptacion || null,
        ubicacion: form.ubicacion || null,
        foto_url: fotoUrl || null,
        fecha_recepcion: form.fechaRecepcion || null,
        vivero_origen: form.viveroOrigen || null,
        provincia_origen: form.provinciaOrigen || null,
        notas: form.notas || null,
        ai_identified: !!form.aiIdentified,
      };
      const isEdit = !!form.id;
      const savedRow = isEdit ? await db.updatePlant(form.id, payload) : await db.createPlant(ownerId, payload);
      const prevEventos = isEdit ? plants.find((p) => p.id === form.id)?.eventos || [] : [];
      const savedPlant = { ...fromDbPlant(savedRow), eventos: prevEventos };
      setPlants((prev) => (isEdit ? prev.map((p) => (p.id === savedPlant.id ? savedPlant : p)) : [...prev, savedPlant]));
      closeForm();
      setSuccessMsg(isEdit ? "Planta actualizada." : "Planta agregada al vivero.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError("No se pudo guardar la planta. Intenta de nuevo.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Eliminar esta planta del inventario. Esta accion no se puede deshacer.")) return;
    try {
      await db.deletePlant(id);
      setPlants((prev) => prev.filter((p) => p.id !== id));
      setSuccessMsg("Planta eliminada.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (e) {
      setError("No se pudo eliminar la planta. Intenta de nuevo.");
    }
  };

  const handleLogout = async () => {
    if (onLogout) await onLogout();
  };

  const addEvento = async (plantId, evento) => {
    try {
      const row = await db.createEvento(ownerId, plantId, {
        fecha: evento.fecha,
        tipo: evento.tipo,
        nota: evento.nota || null,
        insumo: evento.insumo || null,
        dosis: evento.dosis || null,
        repite_cada_dias: evento.repiteCadaDias || null,
        proxima_fecha_sugerida: evento.proximaFechaSugerida || null,
      });
      const nuevoEvento = {
        id: row.id,
        fecha: row.fecha,
        tipo: row.tipo,
        nota: row.nota || "",
        insumo: row.insumo || "",
        dosis: row.dosis || "",
        repiteCadaDias: row.repite_cada_dias || null,
        proximaFechaSugerida: row.proxima_fecha_sugerida || null,
      };
      setPlants((prev) =>
        prev.map((p) => (p.id === plantId ? { ...p, eventos: [...(p.eventos || []), nuevoEvento] } : p))
      );
    } catch (e) {
      setError("No se pudo guardar el evento de bitácora.");
    }
  };

  const deleteEvento = async (plantId, eventoId) => {
    try {
      await db.deleteEvento(eventoId);
      setPlants((prev) =>
        prev.map((p) => (p.id === plantId ? { ...p, eventos: (p.eventos || []).filter((ev) => ev.id !== eventoId) } : p))
      );
    } catch (e) {
      setError("No se pudo eliminar el evento de bitácora.");
    }
  };

  const openTxForm = (tipo) => {
    setTxForm({ ...emptyTxForm, tipo, plantId: plants[0]?.id || "" });
    setTxFormOpen(true);
  };

  const closeTxForm = () => {
    setTxFormOpen(false);
    setTxForm(emptyTxForm);
  };

  const handleTxSave = async (e) => {
    e.preventDefault();
    const monto = parseFloat(txForm.monto);
    if (!txForm.plantId || !(monto >= 0)) return;
    try {
      const row = await db.createTransaccion(ownerId, {
        tipo: txForm.tipo,
        plant_id: txForm.plantId,
        monto,
        moneda: "PEN",
        contraparte: txForm.contraparte || null,
        fecha: txForm.fecha,
        nota: txForm.nota || null,
      });
      setTransacciones((prev) => [row, ...prev]);

      const plantPayload = { valor_actual: monto };
      if (txForm.tipo === "venta") plantPayload.estado = "vendida";
      const savedPlantRow = await db.updatePlant(txForm.plantId, plantPayload);
      setPlants((prev) =>
        prev.map((p) => (p.id === txForm.plantId ? { ...p, ...fromDbPlant(savedPlantRow), eventos: p.eventos } : p))
      );

      closeTxForm();
      setSuccessMsg(txForm.tipo === "venta" ? "Venta registrada." : "Compra registrada.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError("No se pudo guardar la transacción. Intenta de nuevo.");
    }
  };

  const triggerUpload = () => {
    setIdentifyError("");
    fileInputRef.current?.click();
  };

    const handleImageSelected = async (e) => {
            const file = e.target.files && e.target.files[0];
            e.target.value = "";
            if (!file) return;
            setIdentifyError("");
            setIdentifying(true);
            try {
                      const compressed = await fileToCompressedDataUrl(file, 640, 0.72);
                      const match = compressed.match(/^data:(.*);base64,(.*)$/);
                      if (!match) throw new Error("bad image");
                      const mediaType = match[1];
                      const b64 = match[2];

                      const response = await fetch("/api/identify", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json", ...(await authHeader()) },
                                  body: JSON.stringify({ mediaType, b64 }),
                      });
                      const data = await response.json();
                      if (!response.ok || !data.scientificName) throw new Error("sin identificacion");

    const categoryId = categoryFromFamily(data.family);
                      const info = tipoInfo(tipos, categoryId);
                      const care = CARE_INFO[categoryId] || CARE_INFO.otra;
                      const nombreComun = (data.commonNames && data.commonNames[0]) || data.scientificName;

                      setForm({
                                  ...emptyForm,
                                  nombre: nombreComun,
                                  variedad: data.scientificName || "",
                                  tipo: info.id,
                                  sustrato: info.sustrato,
                                  materiales: (care.materiales || []).join(", "),
          cuidados: care.cuidados,
                                  climaPreferido: care.climaPreferido,
                                  adaptacion: care.adaptacion,
                                  imagen: compressed,
                                  aiIdentified: true,
                      });
                      setFormOpen(true);
            } catch (err) {
                      setIdentifyError("No se pudo identificar la planta automaticamente. Puedes completarla a mano.");
            } finally {
                      setIdentifying(false);
            }
    };

  const checkClimate = async () => {
    if (plants.length === 0) {
      setClimateError("Agrega al menos una planta para poder evaluar el clima de hoy.");
      return;
    }
    setClimateError("");
    setClimateLoading(true);
    try {
      const todayStr = new Date().toLocaleDateString("es-PE", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      });
      const lugar = ubicacionClima && ubicacionClima.trim() ? ubicacionClima.trim() : "Ica, Perú";
      const listStr = plants
        .map((p) => {
          const t = tipoInfo(tipos, p.tipo);
          const partes = [`id:${p.id} — ${p.nombre}${p.variedad ? " (" + p.variedad + ")" : ""} — área: ${t.label}`];
          if (p.climaPreferido) partes.push(`clima natural: ${p.climaPreferido}`);
          if (p.ubicacion) partes.push(`ubicación actual: ${p.ubicacion}`);
          if (p.adaptacion) partes.push(`medidas de adaptación ya tomadas: ${p.adaptacion}`);
          return partes.join(" — ");
        })
        .join("\n");

      const prompt = `Hoy es ${todayStr}. Ubicación: ${lugar}.
Busca en internet el pronóstico del clima de hoy para esa ubicación: temperatura máxima, mínima y humedad aproximada. Determina también la estación del año actual según el hemisferio correspondiente a esa ubicación.

Luego revisa esta lista de plantas de un vivero doméstico, algunas de las cuales ya podrían estar acondicionadas o ubicadas en un lugar protegido:
${listStr}

Evalúa si el clima de hoy (incluyendo posibles contrastes entre día y noche, o entre la estación esperada y el clima real, por ejemplo frío o calor fuera de lo normal para la temporada) puede afectar a alguna de estas plantas — ten en cuenta su ubicación actual y las medidas de adaptación ya tomadas antes de marcarla en riesgo — y qué debería hacer la persona para protegerlas.

Responde con un objeto JSON válido (puedes explicar tu búsqueda antes si quieres, pero el JSON debe aparecer completo y una sola vez, al final), con este formato exacto:
{
"resumen_clima": "resumen breve del clima de hoy en esa ubicación (máx 2 frases)",
"estacion": "estación actual, ej: invierno",
"alerta_general": "frase breve si hay algo climático notable hoy (contrastes, calor, frío, humedad); cadena vacía si no hay nada relevante",
"plantas_en_riesgo": [
{"id": "el id exacto de la planta tal como aparece en la lista", "nombre": "nombre de la planta", "riesgo": "qué le puede afectar hoy (máx 1-2 frases)", "sugerencia": "qué hacer para protegerla (máx 1-2 frases)"}
]
}
Si ninguna planta corre riesgo hoy, usa "plantas_en_riesgo": [].`;

      const response = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
          tools: [{ type: "web_search_20250305", name: "web_search" }],
        }),
      });
      const data = await response.json();
      const respText = (data.content || []).map((b) => b.text || "").join("\n");
      const firstBrace = respText.indexOf("{");
      const lastBrace = respText.lastIndexOf("}");
      if (firstBrace === -1 || lastBrace === -1) throw new Error("sin JSON");
      const result = JSON.parse(respText.slice(firstBrace, lastBrace + 1));
      const climateObj = { ...result, checkedAt: new Date().toISOString() };
      setClimate(climateObj);
      try {
        await storage.set(CLIMATE_KEY, JSON.stringify(climateObj));
      } catch (e) {}
    } catch (err) {
      setClimateError("No se pudo consultar el clima ahora. Intenta de nuevo en un momento.");
    } finally {
      setClimateLoading(false);
    }
  };

  const activePlants = plants.filter((p) => p.estado !== "vendida");

  const filtered = activePlants.filter((p) => {
    const q = query.toLowerCase();
    const matchesQuery = p.nombre.toLowerCase().includes(q) || (p.variedad || "").toLowerCase().includes(q);
    const matchesTipo = filterTipo === "todos" || p.tipo === filterTipo;
    return matchesQuery && matchesTipo;
  });

  const visibleTipos = tipos.filter((t) => {
    if (filterTipo !== "todos") return t.id === filterTipo;
    const count = filtered.filter((p) => p.tipo === t.id).length;
    return count > 0;
  });

  const riskById = {};
  (climate?.plantas_en_riesgo || []).forEach((a) => {
    if (a.id) riskById[a.id] = a;
  });

  const logPlant = logPlantId ? plants.find((p) => p.id === logPlantId) : null;
  const detailPlant = detailPlantId ? plants.find((p) => p.id === detailPlantId) : null;
  const detailInfo = detailPlant ? tipoInfo(tipos, detailPlant.tipo) : null;
  const detailRisk = detailPlant ? riskById[detailPlant.id] : null;

  const tipoCounts = tipos
    .map((tp) => ({ ...tp, count: activePlants.filter((p) => p.tipo === tp.id).length }))
    .filter((tp) => tp.count > 0);
  const climaCounts = {};
  activePlants.forEach((p) => {
    const c = (p.climaPreferido || "").trim();
    if (c) climaCounts[c] = (climaCounts[c] || 0) + 1;
  });
  const climaList = Object.entries(climaCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const INCIDENT_KEYWORDS = ["plaga", "insecto", "hongo", "enferm", "mancha", "marchit", "pulg", "araña", "arana", "ácaro", "acaro"];
  const incidentPlants = activePlants.filter((p) => {
    const notas = (p.notas || "").toLowerCase();
    const kw = INCIDENT_KEYWORDS.some((k) => notas.includes(k));
    const evt = (p.eventos || []).some((e) => e.tipo === "control_plagas");
    return kw || evt;
  });

  return (
    <div style={styles.page}>
      <Leaf size={300} style={styles.watermarkTL} />
      <Flower2 size={230} style={styles.watermarkBR} />
      <Leaf size={210} style={styles.watermarkMid} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,500&family=Work+Sans:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        input, textarea, select { font-family: 'Work Sans', sans-serif; }
        ::placeholder { color: #9C8B6E; }
        .plant-card { transition: transform 0.18s ease, box-shadow 0.18s ease; }
        .plant-card:hover { transform: translateY(-3px); box-shadow: 0 10px 24px rgba(33,28,20,0.14); }
        .icon-btn { transition: background 0.15s ease, color 0.15s ease; }
        .icon-btn:hover { background: #211C14; color: #F1E9D2; }
        button { font-family: 'Work Sans', sans-serif; cursor: pointer; }
        .scroll-thin::-webkit-scrollbar { width: 6px; }
        .scroll-thin::-webkit-scrollbar-thumb { background: #D8C9A0; border-radius: 3px; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerTop}>
          <div>
            <div style={styles.eyebrow}>
              <MapPin size={13} strokeWidth={2.5} />
              Ica, Perú — clima árido
            </div>
            <h1 style={styles.h1}>Vivero</h1>
            <p style={styles.sub}>
              Sube una foto para identificar cada planta, lleva su historial de cuidados
              y revisa si el clima de hoy le puede hacer daño.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={styles.statBox}>
              <span style={styles.statNum}>{activePlants.length}</span>
              <span style={styles.statLabel}>{activePlants.length === 1 ? "planta" : "plantas"}</span>
            </div>
            <button type="button" style={styles.logoutBtn} onClick={handleLogout}>Cerrar sesión</button>
          </div>
        </div>

        {/* Panorama del vivero */}
        <div style={styles.soilProfile}>
          <div style={styles.soilProfileLabel}>
            <Sun size={13} strokeWidth={2.5} />
            Panorama del vivero
          </div>
          <div style={styles.statsGrid}>
            <div style={styles.statsCol}>
              <div style={styles.statsColTitle}><Leaf size={12} /> Tipos de planta</div>
              {tipoCounts.length === 0 ? (
                <p style={styles.climateEmpty}>Aún no hay plantas registradas.</p>
              ) : (
                <>
                  <div style={styles.statsBigRow}>
                    <span style={styles.statsBigNum}>{tipoCounts.length}</span>
                    <span style={styles.statsBigLabel}>{tipoCounts.length === 1 ? "área activa" : "áreas activas"}</span>
                  </div>
                  <div style={styles.badgeWrap}>
                    {tipoCounts.map((tp) => (
                      <span key={tp.id} style={{ ...styles.typeBadge, borderColor: tp.color }}>
                        <span style={{ ...styles.areaDot, background: tp.color }} /> {tp.label} · {tp.count}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div style={styles.statsCol}>
              <div style={styles.statsColTitle}><CloudSun size={12} /> Clima predominante</div>
              {climaList.length === 0 ? (
                <p style={styles.climateEmpty}>Agrega el clima que prefiere cada planta para ver un resumen aquí.</p>
              ) : (
                <>
                  <div style={styles.statsBigRow}>
                    <span style={styles.statsBigNum}>{climaList.length}</span>
                    <span style={styles.statsBigLabel}>{climaList.length === 1 ? "clima distinto" : "climas distintos"}</span>
                  </div>
                  <div style={styles.badgeWrap}>
                    {climaList.map(([c, n]) => (
                      <span key={c} style={styles.climaBadge}>{c} · {n}</span>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div style={styles.statsCol}>
              <div style={styles.statsColTitle}><Bug size={12} /> Incidentes</div>
              {incidentPlants.length === 0 ? (
                <p style={styles.climateEmpty}>Sin incidentes reportados. Agrega notas o eventos de "control de plagas" en cada planta para verlos aquí.</p>
              ) : (
                <>
                  <div style={styles.statsBigRow}>
                    <span style={{ ...styles.statsBigNum, color: "#8A3B1D" }}>{incidentPlants.length}</span>
                    <span style={styles.statsBigLabel}>{incidentPlants.length === 1 ? "planta afectada" : "plantas afectadas"}</span>
                  </div>
                  <div style={styles.incidentList}>
                    {incidentPlants.map((p) => (
                      <div key={p.id} style={styles.incidentItem}>
                        <AlertTriangle size={12} color="#8A3B1D" />
                        <span>{p.nombre}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
    </div>

        {/* Clima y alertas del día */}
        <div style={styles.climatePanel}>
          <div style={styles.climateHeaderRow}>
            <div style={styles.soilProfileLabel}>
              <CloudSun size={14} strokeWidth={2.5} />
              Clima y alertas de hoy
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <input
            style={styles.locationInput}
            value={ubicacionClima}
            onChange={(e) => setUbicacionClima(e.target.value)}
            onBlur={(e) => persistUbicacion(e.target.value)}
            placeholder="Tu ubicación, ej. Ica, Perú"
            aria-label="Tu ubicación"
          />
          <button style={styles.refreshBtn} onClick={checkClimate} disabled={climateLoading}>
              {climateLoading ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />}
              {climate ? "Actualizar" : "Consultar clima de hoy"}
            </button>
        </div>
          </div>

          {climateError && <p style={styles.climateError}>{climateError}</p>}

          {!climate && !climateLoading && !climateError && (
            <p style={styles.climateEmpty}>
              Consulta el clima real de hoy en {ubicacionClima || "tu ubicación"} y revisa qué plantas de tu inventario podrían
              verse afectadas por contrastes de temperatura o humedad fuera de temporada.
            </p>
          )}

          {climateLoading && <p style={styles.climateEmpty}>Buscando el clima de hoy y revisando tus plantas…</p>}

          {climate && !climateLoading && (
            <div>
              <div style={styles.climateSummaryRow}>
                <span style={styles.seasonBadge}>{climate.estacion || "estación"}</span>
                <p style={styles.climateSummaryText}>{climate.resumen_clima}</p>
              </div>
              {climate.alerta_general && (
                <div style={styles.climateAlertGeneral}>
                  <AlertTriangle size={13} color="#8A3B1D" />
                  <span>{climate.alerta_general}</span>
                </div>
              )}
              {(climate.plantas_en_riesgo || []).length > 0 ? (
                <div style={styles.riskList}>
                  {climate.plantas_en_riesgo.map((r, i) => (
                    <div key={i} style={styles.riskItem}>
                      <div style={{ fontWeight: 600, fontSize: 12.5 }}>{r.nombre}</div>
                      <div style={{ fontSize: 12, color: "#5C4A2E" }}>{r.riesgo}</div>
                      <div style={{ fontSize: 12, color: "#3C3120", marginTop: 3 }}><strong>Qué hacer:</strong> {r.sugerencia}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={styles.climateEmpty}>Ninguna de tus plantas parece estar en riesgo hoy.</p>
              )}
              <p style={styles.climateChecked}>Actualizado: {new Date(climate.checkedAt).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" })}</p>
            </div>
          )}
        </div>
      </header>

      <div style={styles.tabBar}>
        <button type="button" style={{ ...styles.tabBtn, ...(activeTab === "inventario" ? styles.tabBtnActive : {}) }} onClick={() => setActiveTab("inventario")}>Inventario</button>
        <button type="button" style={{ ...styles.tabBtn, ...(activeTab === "calendario" ? styles.tabBtnActive : {}) }} onClick={() => setActiveTab("calendario")}>Calendario</button>
        <button type="button" style={{ ...styles.tabBtn, ...(activeTab === "transacciones" ? styles.tabBtnActive : {}) }} onClick={() => setActiveTab("transacciones")}>Compras y ventas</button>
        <button type="button" style={{ ...styles.tabBtn, ...(activeTab === "dashboard" ? styles.tabBtnActive : {}) }} onClick={() => setActiveTab("dashboard")}>Dashboard</button>
        <button type="button" style={{ ...styles.tabBtn, ...(activeTab === "config" ? styles.tabBtnActive : {}) }} onClick={() => setActiveTab("config")}>Configuración</button>
      </div>

      {activeTab === "dashboard" && (
        <DashboardView plants={plants} tipos={tipos} spaces={spaces} transacciones={transacciones} />
      )}

      {activeTab === "config" && (
        <ConfigView
          ownerId={ownerId}
          profile={profile}
          tipos={tipos}
          setTipos={setTipos}
          spaces={spaces}
          setSpaces={setSpaces}
          onLogout={handleLogout}
        />
      )}

      {activeTab === "inventario" && (
      <>
      {/* Toolbar */}
      <div style={styles.toolbar}>
        <div style={styles.searchWrap}>
          <Search size={16} color="#6B4F2A" />
          <input
            style={styles.searchInput}
            placeholder="Buscar por nombre o variedad…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select style={styles.select} value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)}>
          <option value="todos">Todas las áreas</option>
          {tipos.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
        {!addingTipo ? (
          <button type="button" style={styles.addBtnGhostSmall} onClick={() => setAddingTipo(true)}>
            <Plus size={16} /> Nueva área
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              style={{ ...styles.input, width: 170 }}
              placeholder="Ej. Palmeras"
              value={newTipoName}
              onChange={(e) => setNewTipoName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomTipo(); } }}
              autoFocus
            />
            <button type="button" style={styles.addBtnGhostSmall} onClick={addCustomTipo}>Agregar</button>
            <button type="button" style={styles.cancelBtnSmall} onClick={() => { setAddingTipo(false); setNewTipoName(""); }}>Cancelar</button>
          </div>
        )}
        {!addingSpace ? (
          <button type="button" style={styles.addBtnGhostSmall} onClick={() => setAddingSpace(true)}>
            <Plus size={16} /> Nuevo espacio
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              style={{ ...styles.input, width: 170 }}
              placeholder="Ej. Invernadero A"
              value={newSpaceName}
              onChange={(e) => setNewSpaceName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomSpace(); } }}
              autoFocus
            />
            <button type="button" style={styles.addBtnGhostSmall} onClick={addCustomSpace}>Agregar</button>
            <button type="button" style={styles.cancelBtnSmall} onClick={() => { setAddingSpace(false); setNewSpaceName(""); }}>Cancelar</button>
          </div>
        )}
                <button style={styles.addBtn} onClick={triggerUpload} disabled={identifying}>
          {identifying ? <Loader2 size={16} className="spin" /> : <Camera size={16} />}
          {identifying ? "Identificando…" : "Subir foto"}
        </button>
        <button style={styles.addBtnGhostSmall} onClick={openNew}>
          <Plus size={16} /> Manual
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleImageSelected}
        />
      </div>

      {identifyError && <div style={styles.errorBanner}>{identifyError}</div>}
      {error && <div style={styles.errorBanner}>{error}</div>}
      {successMsg && <div style={styles.successBanner}>{successMsg}</div>}

      {/* Estado vacío global */}
      {loaded && activePlants.length === 0 && (
        <div style={styles.empty}>
          <Sprout size={30} color="#A85C32" strokeWidth={1.5} />
          <p style={styles.emptyTitle}>Tu vivero está vacío</p>
          <p style={styles.emptyText}>Sube una foto para identificar tu primera planta, o agrégala a mano.</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
            <button style={styles.addBtn} onClick={triggerUpload}><Camera size={16} /> Subir foto</button>
            <button style={styles.addBtnGhost} onClick={openNew}><Plus size={16} /> Manual</button>
          </div>
        </div>
      )}

      {/* Sin resultados */}
      {loaded && activePlants.length > 0 && filtered.length === 0 && (
        <div style={styles.empty}>
          <Sprout size={30} color="#A85C32" strokeWidth={1.5} />
          <p style={styles.emptyTitle}>Sin resultados</p>
          <p style={styles.emptyText}>Prueba con otro nombre o quita el filtro de área.</p>
        </div>
      )}

      {/* Áreas */}
      <div style={styles.areas}>
        {loaded && filtered.length > 0 && visibleTipos.map((t) => {
          const tipoPlants = filtered.filter((p) => p.tipo === t.id);
          if (filterTipo === "todos" && tipoPlants.length === 0 && !BASE_IDS.includes(t.id)) return null;
          return (
            <section key={t.id} style={styles.area}>
              <div style={styles.areaHeader}>
                <span style={{ ...styles.areaDot, background: t.color }} />
                <h2 style={styles.areaTitle}>{t.label}</h2>
                <span style={styles.areaCount}>{tipoPlants.length}</span>
              </div>
              {tipoPlants.length === 0 ? (
                <p style={styles.areaEmpty}>Aún no agregaste plantas en esta área.</p>
              ) : (
                <div style={styles.grid}>
                  {tipoPlants.map((p) => {
                    const info = tipoInfo(tipos, p.tipo);
                    const risk = riskById[p.id];
                    const ult = lastEvento(p);
                    return (
                      <div key={p.id} style={{ ...styles.card, ...(risk ? styles.cardAtRisk : {}) }} className="plant-card">
                        <div style={{ ...styles.cardStripe, background: info.color }} />
                        <div style={styles.cardImageWrap} onClick={() => setDetailPlantId(p.id)}>
                          {p.imagen ? (
                            <img src={p.imagen} alt={p.nombre} style={styles.cardImage} />
                          ) : (
                            <div style={{ ...styles.cardImagePlaceholder, background: info.color + "22" }}>
                              <Leaf size={26} color={info.color} strokeWidth={1.5} />
                            </div>
                          )}
                          <div style={styles.cardImageOverlay}>
                            <h3 style={styles.cardNameOnImage}>{p.nombre}</h3>
                            {p.variedad && <p style={styles.cardVarietyOnImage}>{p.variedad}</p>}
                          </div>
                          {p.aiIdentified && <span style={styles.aiTag}><Sparkles size={11} /> IA</span>}
                          {risk && <span style={styles.riskTag}><AlertTriangle size={11} /> Riesgo hoy</span>}
                        </div>
                        <div style={styles.cardBody} onClick={() => setDetailPlantId(p.id)}>
                          {spaces.find((s) => s.id === p.spaceId) && (
                            <p style={styles.cardMeta}><MapPin size={12} /> {spaces.find((s) => s.id === p.spaceId).nombre}</p>
                          )}
                          {p.ubicacion && <p style={styles.cardMeta}><MapPin size={12} /> {p.ubicacion}</p>}

                          {risk && (
                            <div style={styles.riskBox}>
                              <div style={{ fontSize: 11.5, fontWeight: 600, color: "#8A3B1D" }}>{risk.riesgo}</div>
                              <div style={{ fontSize: 11.5, color: "#5C4A2E", marginTop: 2 }}>{risk.sugerencia}</div>
                            </div>
                          )}

                          </div>
                        <div style={styles.cardActions}>
                          <button style={styles.iconBtn} className="icon-btn" onClick={(e) => { e.stopPropagation(); setLogPlantId(p.id); }} aria-label="Ver bitácora"><ClipboardList size={14} /></button>
                          <button style={styles.iconBtn} className="icon-btn" onClick={(e) => { e.stopPropagation(); openEdit(p); }} aria-label="Editar planta"><Pencil size={14} /></button>
                          <button style={styles.iconBtn} className="icon-btn" onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} aria-label="Eliminar planta"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
      </>
      )}

      {activeTab === "calendario" && (
        <div style={styles.areas}>
          <CalendarView plants={plants} onOpenPlant={(plantId) => setLogPlantId(plantId)} />
        </div>
      )}

      {activeTab === "transacciones" && (
        <div style={styles.areas}>
          <div style={styles.toolbar}>
            <button style={styles.addBtn} onClick={() => openTxForm("compra")}><ShoppingCart size={16} /> Registrar compra</button>
            <button style={styles.addBtn} onClick={() => openTxForm("venta")}><Coins size={16} /> Registrar venta</button>
          </div>

          <div style={styles.toolbar}>
            <select style={styles.select} value={txFilterTipo} onChange={(e) => setTxFilterTipo(e.target.value)}>
              <option value="todos">Todos los tipos</option>
              <option value="compra">Compras</option>
              <option value="venta">Ventas</option>
            </select>
            <select style={styles.select} value={txFilterPlant} onChange={(e) => setTxFilterPlant(e.target.value)}>
              <option value="todas">Todas las plantas</option>
              {plants.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
            <input type="date" style={styles.input} value={txFilterFrom} onChange={(e) => setTxFilterFrom(e.target.value)} aria-label="Desde" />
            <input type="date" style={styles.input} value={txFilterTo} onChange={(e) => setTxFilterTo(e.target.value)} aria-label="Hasta" />
          </div>

          {(() => {
            const filteredTx = transacciones.filter((t) => {
              if (txFilterTipo !== "todos" && t.tipo !== txFilterTipo) return false;
              if (txFilterPlant !== "todas" && t.plant_id !== txFilterPlant) return false;
              if (txFilterFrom && t.fecha < txFilterFrom) return false;
              if (txFilterTo && t.fecha > txFilterTo) return false;
              return true;
            });
            if (filteredTx.length === 0) {
              return (
                <div style={styles.empty}>
                  <ShoppingCart size={30} color="#A85C32" strokeWidth={1.5} />
                  <p style={styles.emptyTitle}>Sin transacciones</p>
                  <p style={styles.emptyText}>Registra una compra o venta para verla aquí.</p>
                </div>
              );
            }
            return (
              <div style={styles.logList}>
                {filteredTx.map((t) => {
                  const plant = plants.find((p) => p.id === t.plant_id);
                  const Icon = t.tipo === "venta" ? Coins : ShoppingCart;
                  return (
                    <div key={t.id} style={styles.logItem}>
                      <Icon size={14} color={t.tipo === "venta" ? "#2F5233" : "#A85C32"} style={{ marginTop: 2, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>
                          {t.tipo === "venta" ? "Venta" : "Compra"} · {plant ? plant.nombre : "Planta eliminada"} · S/ {Number(t.monto).toFixed(2)}
                        </div>
                        <div style={{ fontSize: 11.5, color: "#5C4A2E" }}>
                          {fmtFecha(t.fecha)}{t.contraparte ? ` — ${t.contraparte}` : ""}
                        </div>
                        {t.nota && <div style={{ fontSize: 12, color: "#5C4A2E" }}>{t.nota}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {txFormOpen && (
        <div style={styles.overlay} onClick={closeTxForm}>
          <form style={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={handleTxSave} className="scroll-thin">
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{txForm.tipo === "venta" ? "Registrar venta" : "Registrar compra"}</h2>
              <button type="button" style={styles.closeBtn} onClick={closeTxForm} aria-label="Cerrar"><X size={18} /></button>
            </div>

            <label style={styles.label}>Tipo</label>
            <select style={styles.input} value={txForm.tipo} onChange={(e) => setTxForm({ ...txForm, tipo: e.target.value })}>
              <option value="compra">Compra</option>
              <option value="venta">Venta</option>
            </select>

            <label style={styles.label}>Planta</label>
            {plants.length === 0 ? (
              <p style={styles.emptyText}>Todavía no tienes plantas en tu inventario.</p>
            ) : (
              <select style={styles.input} value={txForm.plantId} onChange={(e) => setTxForm({ ...txForm, plantId: e.target.value })} required>
                {plants.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            )}
            <button type="button" style={{ ...styles.addBtnGhostSmall, marginTop: 8 }} onClick={() => { closeTxForm(); openNew(); }}>
              <Plus size={14} /> Nueva planta
            </button>

            <div style={styles.formRow2}>
              <div>
                <label style={styles.label}>Monto (S/)</label>
                <input type="number" step="0.01" min="0" style={styles.input} value={txForm.monto}
                  onChange={(e) => setTxForm({ ...txForm, monto: e.target.value })} required />
              </div>
              <div>
                <label style={styles.label}>Fecha</label>
                <input type="date" style={styles.input} value={txForm.fecha}
                  onChange={(e) => setTxForm({ ...txForm, fecha: e.target.value })} required />
              </div>
            </div>

            <label style={styles.label}>{txForm.tipo === "venta" ? "Comprador" : "Vendedor / proveedor"} (opcional)</label>
            <input style={styles.input} placeholder={txForm.tipo === "venta" ? "Nombre del comprador" : "Nombre del vendedor o proveedor"}
              value={txForm.contraparte} onChange={(e) => setTxForm({ ...txForm, contraparte: e.target.value })} />

            <label style={styles.label}>Nota (opcional)</label>
            <textarea style={{ ...styles.input, minHeight: 50, resize: "vertical" }} value={txForm.nota}
              onChange={(e) => setTxForm({ ...txForm, nota: e.target.value })} />

            <div style={styles.modalActions}>
              <button type="button" style={styles.cancelBtn} onClick={closeTxForm}>Cancelar</button>
              <button type="submit" style={styles.saveBtn}>Guardar</button>
            </div>
          </form>
        </div>
      )}

      {/* Form modal */}
      {formOpen && (
        <div style={styles.overlay} onClick={closeForm}>
          <form style={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSave} className="scroll-thin">
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{form.id ? "Editar planta" : "Nueva planta"}</h2>
              <button type="button" style={styles.closeBtn} onClick={closeForm} aria-label="Cerrar"><X size={18} /></button>
            </div>
            {form.aiIdentified && (
              <div style={styles.aiBanner}><Sparkles size={13} /> Identificado con IA — revisa y ajusta antes de guardar.</div>
            )}

            {form.imagen && (
              <img src={form.imagen} alt="" style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 8, marginTop: 10 }} />
            )}

            <div style={styles.formSection}><Leaf size={12} /> Identidad</div>
            <div style={styles.formRow2}>
              <div>
                <label style={styles.label}>Nombre popular</label>
                <input style={styles.input} placeholder="Ej. Tuna" value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
              </div>
              <div>
                <label style={styles.label}>Nombre científico / variedad</label>
                <input style={styles.input} placeholder="Ej. Opuntia ficus-indica" value={form.variedad}
                  onChange={(e) => setForm({ ...form, variedad: e.target.value })} />
              </div>
            </div>

            <label style={styles.label}>Área / tipo de planta</label>
            <select style={styles.input} value={form.tipo} onChange={(e) => handleTipoChange(e.target.value)}>
              {tipos.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>

            <div style={styles.formSection}><Droplet size={12} /> Sustrato y cuidados</div>
            <label style={styles.label}>Sustrato</label>
            <textarea style={{ ...styles.input, minHeight: 60, resize: "vertical" }} value={form.sustrato}
              onChange={(e) => setForm({ ...form, sustrato: e.target.value })} />

                <label style={styles.label}>Materiales de sustrato sugeridos</label>
                <input style={styles.input} placeholder="Ej. musgo, perlita, corteza de pino" value={form.materiales}
                  onChange={(e) => setForm({ ...form, materiales: e.target.value })} />

            <label style={styles.label}>Cuidados</label>
            <textarea style={{ ...styles.input, minHeight: 50, resize: "vertical" }} placeholder="Riego, luz, poda…"
              value={form.cuidados} onChange={(e) => setForm({ ...form, cuidados: e.target.value })} />

            <label style={styles.label}>Clima que prefiere</label>
            <input style={styles.input} placeholder="Ej. Tropical húmedo" value={form.climaPreferido}
              onChange={(e) => setForm({ ...form, climaPreferido: e.target.value })} />

            <label style={styles.label}>Cómo adaptarla al clima de Ica</label>
            <textarea style={{ ...styles.input, minHeight: 50, resize: "vertical" }} placeholder="Si no es nativa de zonas áridas…"
              value={form.adaptacion} onChange={(e) => setForm({ ...form, adaptacion: e.target.value })} />

            <div style={styles.formSection}><Home size={12} /> Recepción y ubicación</div>
            <div style={styles.formRow2}>
              <div>
                <label style={styles.label}>Fecha de recepción</label>
                <input type="date" style={styles.input} value={form.fechaRecepcion}
                  onChange={(e) => setForm({ ...form, fechaRecepcion: e.target.value })} />
              </div>
              <div>
                <label style={styles.label}>Vivero de origen</label>
                <input style={styles.input} placeholder="Ej. Vivero El Tambo" value={form.viveroOrigen}
                  onChange={(e) => setForm({ ...form, viveroOrigen: e.target.value })} />
              </div>
            </div>

            <label style={styles.label}>Provincia de origen</label>
            <input style={styles.input} placeholder="Ej. Ica" value={form.provinciaOrigen}
              onChange={(e) => setForm({ ...form, provinciaOrigen: e.target.value })} />

            <label style={styles.label}>Espacio</label>
            <select style={styles.input} value={form.spaceId} onChange={(e) => setForm({ ...form, spaceId: e.target.value })}>
              <option value="">Sin espacio asignado</option>
              {spaces.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>

            <label style={styles.label}>Ubicación (opcional)</label>
            <input style={styles.input} placeholder="Ej. Maceta grande, esquina norte" value={form.ubicacion}
              onChange={(e) => setForm({ ...form, ubicacion: e.target.value })} />

            <label style={styles.label}>URL de imagen (opcional, reemplaza la foto)</label>
            <input style={styles.input} placeholder="https://…" value={form.imagen && form.imagen.startsWith("data:") ? "" : form.imagen}
              onChange={(e) => setForm({ ...form, imagen: e.target.value })} />

            <div style={styles.formSection}><FileText size={12} /> Notas</div>
            <label style={styles.label}>Notas (opcional)</label>
            <textarea style={{ ...styles.input, minHeight: 50, resize: "vertical" }} placeholder="Cualquier otro detalle…"
              value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />

            <div style={styles.modalActions}>
              <button type="button" style={styles.cancelBtn} onClick={closeForm}>Cancelar</button>
              <button type="submit" style={styles.saveBtn}>{form.id ? "Guardar cambios" : "Agregar planta"}</button>
            </div>
          </form>
        </div>
      )}

      {logPlant && (
        <LogModal plant={logPlant} onClose={() => setLogPlantId(null)} onAdd={addEvento} onDelete={deleteEvento} />
      )}

      {detailPlant && (
        <DetailModal
          plant={detailPlant}
          info={detailInfo}
          risk={detailRisk}
          spaceName={spaces.find((s) => s.id === detailPlant.spaceId)?.nombre}
          transacciones={transacciones.filter((t) => t.plant_id === detailPlant.id)}
          onClose={() => setDetailPlantId(null)}
          onEdit={() => { setDetailPlantId(null); openEdit(detailPlant); }}
          onLog={() => { setDetailPlantId(null); setLogPlantId(detailPlant.id); }}
        />
      )}
    </div>
  );
}

function DetailModal({ plant, info, risk, spaceName, transacciones, onClose, onEdit, onLog }) {
  const ult = lastEvento(plant);
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()} className="scroll-thin">
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>{plant.nombre}</h2>
          <button type="button" style={styles.closeBtn} onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
        </div>
        {plant.variedad && <p style={styles.cardVariety}>{plant.variedad}</p>}

        {plant.imagen ? (
          <img src={plant.imagen} alt={plant.nombre} style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 8, marginTop: 4 }} />
        ) : (
          <div style={{ width: "100%", height: 180, borderRadius: 8, marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", background: info.color + "22" }}>
            <Leaf size={32} color={info.color} strokeWidth={1.5} />
          </div>
        )}

        {spaceName && <p style={styles.cardMeta}><MapPin size={12} /> {spaceName}</p>}
        {plant.ubicacion && <p style={styles.cardMeta}><MapPin size={12} /> {plant.ubicacion}</p>}

        {risk && (
          <div style={styles.riskBox}>
            <div style={{ fontWeight: 600, color: "#8A3B1D" }}>{risk.riesgo}</div>
            <div style={{ color: "#5C4A2E", marginTop: 2 }}>{risk.sugerencia}</div>
          </div>
        )}

        <ArrivalBox plant={plant} />

        {plant.estado === "vendida" && (
          <div style={{ ...styles.aiBanner, background: "#E8DFC8", color: "#3C3120" }}>Vendida</div>
        )}

        {(plant.valorActual != null || transacciones.length > 0) && (
          <div style={{ marginTop: 10 }}>
            <div style={styles.cardSubstrateLabel}>Transacciones{plant.valorActual != null ? ` — valor actual S/ ${Number(plant.valorActual).toFixed(2)}` : ""}</div>
            {transacciones.length === 0 ? (
              <p style={styles.emptyText}>Sin transacciones registradas.</p>
            ) : (
              <div style={styles.logList}>
                {transacciones.map((t) => (
                  <div key={t.id} style={styles.logItem}>
                    {t.tipo === "venta" ? <Coins size={14} color="#2F5233" style={{ marginTop: 2 }} /> : <ShoppingCart size={14} color="#A85C32" style={{ marginTop: 2 }} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{t.tipo === "venta" ? "Venta" : "Compra"} · S/ {Number(t.monto).toFixed(2)} · {fmtFecha(t.fecha)}</div>
                      {t.contraparte && <div style={{ fontSize: 12, color: "#5C4A2E" }}>{t.contraparte}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={styles.cardSubstrateLabel}>Sustrato</div>
        <StrataBar estratos={info.estratos} colorBase={info.color} height={6} />
        <p style={styles.cardText}>{plant.sustrato}</p>
        {plant.materiales && (
          <div style={styles.materialesRow}>
            {plant.materiales.split(",").map((m) => m.trim()).filter(Boolean).map((m, i) => (
              <span key={i} style={styles.materialChip}>{m}</span>
            ))}
          </div>
        )}

        {plant.cuidados && <p style={styles.cardRow}><Droplet size={12} color="#6B4F2A" /> {plant.cuidados}</p>}
        {plant.climaPreferido && <p style={styles.cardRow}><Sun size={12} color="#6B4F2A" /> {plant.climaPreferido}</p>}
        {plant.adaptacion && <p style={styles.cardRow}><Compass size={12} color="#6B4F2A" /> {plant.adaptacion}</p>}
        {plant.notas && <p style={styles.cardNotes}>{plant.notas}</p>}
        {ult && (
          <p style={styles.cardRow}><Clock size={12} color="#6B4F2A" /> {eventInfo(ult.tipo).label} · {fmtFecha(ult.fecha)}</p>
        )}

        <div style={styles.modalActions}>
          <button type="button" style={styles.cancelBtn} onClick={onLog}>Bitácora</button>
          <button type="button" style={styles.saveBtn} onClick={onEdit}>Editar</button>
        </div>
      </div>
    </div>
  );
}

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoggingIn(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setLoginError("Correo o clave incorrectos.");
      }
    } catch (err) {
      setLoginError("No se pudo conectar. Intenta de nuevo.");
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div style={styles.loginPage}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600&family=Work+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        input { font-family: 'Work Sans', sans-serif; }
      `}</style>
      <form style={styles.loginCard} onSubmit={submit}>
        <div style={styles.loginEyebrow}>Ica, Perú — clima árido</div>
        <h1 style={styles.loginTitle}>Vivero</h1>
        <p style={styles.loginSub}>Ingresa tu correo y clave para ver tu inventario.</p>
        <label style={styles.label}>Correo</label>
        <input style={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus required />
        <label style={styles.label}>Clave</label>
        <input style={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {loginError && <div style={{ ...styles.errorBanner, margin: "14px 0 0", maxWidth: "none" }}>{loginError}</div>}
        <button type="submit" style={{ ...styles.saveBtn, marginTop: 16, width: "100%" }} disabled={loggingIn}>
          {loggingIn ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </div>
  );
}

export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthChecked(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    fetch("/api/bootstrap-admin", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    }).catch(() => {});
  }, [session]);

  if (!authChecked) {
    return <div style={styles.loginPage} />;
  }

  if (!session) {
    return <LoginScreen />;
  }

  return <PlantInventory onLogout={() => supabase.auth.signOut()} />;
}

const styles = {
  page: { minHeight: "100vh", background: "#F1E9D2", color: "#211C14", fontFamily: "'Work Sans', sans-serif", padding: "28px 20px 60px", position: "relative", overflow: "hidden", zIndex: 0 },
  watermarkTL: { position: "absolute", top: -50, right: -50, color: "#2F5233", opacity: 0.07, zIndex: -1, pointerEvents: "none", transform: "rotate(-18deg)" },
  watermarkBR: { position: "absolute", bottom: 10, left: -40, color: "#A85C32", opacity: 0.08, zIndex: -1, pointerEvents: "none", transform: "rotate(12deg)" },
  watermarkMid: { position: "absolute", top: "38%", right: -30, color: "#5C7A4A", opacity: 0.06, zIndex: -1, pointerEvents: "none", transform: "rotate(24deg)" },
  header: { maxWidth: 980, margin: "0 auto 24px" },
  headerTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 },
  eyebrow: { display: "flex", alignItems: "center", gap: 6, fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "#A85C32", marginBottom: 8 },
  h1: { fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: "clamp(36px, 6vw, 56px)", margin: 0, lineHeight: 1 },
  sub: { marginTop: 10, maxWidth: 480, color: "#5C4A2E", fontSize: 14.5, lineHeight: 1.5 },
  statBox: { display: "flex", flexDirection: "column", alignItems: "flex-end", borderLeft: "2px solid #211C14", paddingLeft: 14 },
  statNum: { fontFamily: "'Fraunces', serif", fontSize: 40, fontWeight: 600, lineHeight: 1 },
  statLabel: { fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#6B4F2A", textTransform: "uppercase", letterSpacing: "0.05em" },
  soilProfile: { marginTop: 26, background: "#E8DFC8", border: "1px solid #D8C9A0", borderRadius: 10, padding: "16px 18px" },
  soilProfileLabel: { display: "flex", alignItems: "center", gap: 6, fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#6B4F2A", textTransform: "uppercase", letterSpacing: "0.04em" },
  soilRows: { display: "flex", flexDirection: "column", gap: 8, marginTop: 12 },
  soilRow: { display: "grid", gridTemplateColumns: "150px 1fr", alignItems: "center", gap: 12 },
  soilRowLabel: { fontSize: 12.5, color: "#3C3120" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18, marginTop: 12 },
  statsCol: {},
  statsColTitle: { display: "flex", alignItems: "center", gap: 5, fontFamily: "'Space Mono', monospace", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.04em", color: "#8A7857", marginBottom: 8 },
  statsBigRow: { display: "flex", alignItems: "baseline", gap: 7, marginBottom: 8 },
  statsBigNum: { fontFamily: "'Fraunces', serif", fontSize: 30, fontWeight: 600, color: "#211C14", lineHeight: 1 },
  statsBigLabel: { fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#6B4F2A" },
  badgeWrap: { display: "flex", flexWrap: "wrap", gap: 6 },
  typeBadge: { display: "flex", alignItems: "center", gap: 5, fontSize: 12, background: "#fff", border: "1px solid", borderRadius: 20, padding: "4px 10px", color: "#3C3120" },
  climaBadge: { fontSize: 12, background: "#fff", border: "1px solid #D8C9A0", borderRadius: 20, padding: "4px 10px", color: "#3C3120" },
  incidentList: { display: "flex", flexDirection: "column", gap: 6 },
  incidentItem: { display: "flex", alignItems: "center", gap: 6, background: "#F8ECE0", border: "1px solid #E7C4A5", borderRadius: 8, padding: "6px 10px", fontSize: 12.5, color: "#5C4A2E" },
  cancelBtnSmall: { display: "flex", alignItems: "center", gap: 6, background: "transparent", color: "#6B4F2A", border: "1px solid #D8C9A0", borderRadius: 8, padding: "10px 14px", fontSize: 13 },
  climatePanel: { marginTop: 14, background: "#fff", border: "1px solid #D8C9A0", borderRadius: 10, padding: "16px 18px" },
  climateHeaderRow: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 },
  refreshBtn: { display: "flex", alignItems: "center", gap: 6, background: "#211C14", color: "#F1E9D2", border: "none", borderRadius: 20, padding: "6px 12px", fontSize: 12, fontWeight: 600 },
  locationInput: { border: "1px solid #D8C9A0", borderRadius: 20, padding: "6px 12px", fontSize: 12.5, background: "#fff", color: "#211C14", minWidth: 160 },
  climateEmpty: { fontSize: 12.5, color: "#6B4F2A", marginTop: 10, marginBottom: 0 },
  climateError: { fontSize: 12.5, color: "#8A3B1D", marginTop: 10, marginBottom: 0 },
  climateSummaryRow: { display: "flex", alignItems: "flex-start", gap: 10, marginTop: 10 },
  seasonBadge: { fontFamily: "'Space Mono', monospace", fontSize: 10.5, textTransform: "uppercase", background: "#E8DFC8", color: "#3C3120", padding: "4px 9px", borderRadius: 20, flexShrink: 0 },
  climateSummaryText: { fontSize: 13, color: "#3C3120", margin: 0, lineHeight: 1.45 },
  climateAlertGeneral: { display: "flex", alignItems: "center", gap: 6, background: "#F3D8C8", color: "#8A3B1D", fontSize: 12.5, padding: "8px 10px", borderRadius: 6, marginTop: 10 },
  riskList: { display: "flex", flexDirection: "column", gap: 8, marginTop: 12 },
  riskItem: { background: "#F8F1E0", border: "1px solid #E4DAC0", borderRadius: 8, padding: "8px 10px" },
  climateChecked: { fontSize: 10.5, color: "#8A7857", marginTop: 12, marginBottom: 0 },
  tabBar: { maxWidth: 980, margin: "0 auto 16px", display: "flex", gap: 8 },
  tabBtn: { background: "transparent", border: "1px solid #D8C9A0", color: "#6B4F2A", borderRadius: 20, padding: "7px 16px", fontSize: 13, fontWeight: 600 },
  tabBtnActive: { background: "#211C14", color: "#F1E9D2", border: "1px solid #211C14" },
  dashGrid: { maxWidth: 980, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 },
  dashGrid2: { maxWidth: 980, margin: "16px auto 0", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 },
  statTile: { background: "#fff", border: "1px solid #D8C9A0", borderRadius: 10, padding: "16px 18px" },
  statTileLabel: { fontFamily: "'Space Mono', monospace", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.04em", color: "#8A7857" },
  statTileValue: { fontFamily: "'Fraunces', serif", fontSize: 36, fontWeight: 600, marginTop: 6, lineHeight: 1, color: "#211C14" },
  statTileDelta: { fontSize: 12, color: "#6B4F2A", marginTop: 6 },
  timelineChart: { display: "flex", alignItems: "flex-end", gap: 6, height: 140, marginTop: 14, padding: "18px 4px 0" },
  timelineCol: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" },
  timelineBar: { width: "100%", maxWidth: 24, background: "#2F5233", borderRadius: "4px 4px 0 0", minHeight: 2, position: "relative", display: "flex", justifyContent: "center" },
  timelineBarLabel: { position: "absolute", top: -18, fontSize: 11, fontWeight: 600, color: "#211C14", whiteSpace: "nowrap" },
  timelineColLabel: { fontSize: 10, color: "#8A7857", marginTop: 6, textTransform: "capitalize" },
  barRow: { display: "grid", gridTemplateColumns: "110px 1fr 30px", alignItems: "center", gap: 8 },
  barRowLabel: { fontSize: 12, color: "#3C3120", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  barTrack: { height: 10, background: "#E8DFC8", borderRadius: 5, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: "0 4px 4px 0" },
  barRowValue: { fontSize: 12, fontWeight: 600, color: "#3C3120", textAlign: "right" },
  calendarWeekRow: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginTop: 14 },
  calendarWeekday: { fontFamily: "'Space Mono', monospace", fontSize: 10.5, textTransform: "uppercase", color: "#8A7857", textAlign: "center" },
  calendarGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginTop: 6 },
  calendarCellEmpty: { minHeight: 68, background: "transparent" },
  calendarCell: { minHeight: 68, background: "#F8F1E0", border: "1px solid #E4DAC0", borderRadius: 6, padding: "4px 5px", display: "flex", flexDirection: "column", gap: 2 },
  calendarCellToday: { borderColor: "#A85C32", borderWidth: 2 },
  calendarCellNum: { fontSize: 11, fontWeight: 600, color: "#3C3120" },
  calendarTaskChip: { fontSize: 9.5, background: "#fff", border: "1px solid #D8C9A0", borderRadius: 4, padding: "1px 4px", color: "#3C3120", cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  calendarTaskChipOverdue: { background: "#F3D8C8", borderColor: "#E7C4A5", color: "#8A3B1D" },
  toolbar: { maxWidth: 980, margin: "0 auto 20px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" },
  searchWrap: { display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #D8C9A0", borderRadius: 8, padding: "9px 12px", flex: "1 1 220px" },
  searchInput: { border: "none", outline: "none", fontSize: 14, flex: 1, background: "transparent", color: "#211C14" },
  select: { border: "1px solid #D8C9A0", borderRadius: 8, padding: "9px 12px", fontSize: 14, background: "#fff", color: "#211C14" },
  addBtn: { display: "flex", alignItems: "center", gap: 6, background: "#2F5233", color: "#F1E9D2", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 14, fontWeight: 600 },
  addBtnGhostSmall: { display: "flex", alignItems: "center", gap: 6, background: "transparent", color: "#211C14", border: "1px solid #D8C9A0", borderRadius: 8, padding: "10px 14px", fontSize: 14, fontWeight: 600 },
  addBtnGhost: { display: "flex", alignItems: "center", gap: 6, background: "transparent", color: "#211C14", border: "1px solid #D8C9A0", borderRadius: 8, padding: "10px 16px", fontSize: 14, fontWeight: 600 },
  errorBanner: { maxWidth: 980, margin: "0 auto 16px", background: "#F3D8C8", color: "#6B2E12", padding: "10px 14px", borderRadius: 8, fontSize: 13.5 },
  successBanner: { maxWidth: 980, margin: "0 auto 16px", background: "#DCEAD8", color: "#2F5233", padding: "10px 14px", borderRadius: 8, fontSize: 13.5 },
  logoutBtn: { background: "transparent", border: "1px solid #D8C9A0", borderRadius: 8, padding: "8px 14px", fontSize: 12.5, color: "#211C14", fontWeight: 600, whiteSpace: "nowrap" },
  empty: { maxWidth: 980, margin: "40px auto", textAlign: "center", padding: "40px 20px", border: "1px dashed #D8C9A0", borderRadius: 12 },
  emptyTitle: { fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600, margin: "12px 0 4px" },
  emptyText: { fontSize: 13.5, color: "#6B4F2A", margin: 0 },
  areas: { maxWidth: 980, margin: "0 auto", display: "flex", flexDirection: "column", gap: 30 },
  area: {},
  areaHeader: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 },
  areaDot: { width: 10, height: 10, borderRadius: "50%", flexShrink: 0 },
  areaTitle: { fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 600, margin: 0 },
  areaCount: { fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#8A7857" },
  areaEmpty: { fontSize: 13, color: "#8A7857", fontStyle: "italic", margin: 0 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 18 },
  card: { background: "#fff", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative", boxShadow: "0 1px 4px rgba(33,28,20,0.10)" },
  cardStripe: { height: 4, width: "100%" },
  cardAtRisk: { border: "1px solid #C97B4A", boxShadow: "0 0 0 1px #C97B4A22" },
  cardImageWrap: { position: "relative", height: 170, cursor: "pointer" },
  cardImage: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  cardImagePlaceholder: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" },
  cardImageOverlay: { position: "absolute", left: 0, right: 0, bottom: 0, padding: "30px 14px 12px", background: "linear-gradient(to top, rgba(33,28,20,0.88), rgba(33,28,20,0))" },
  cardNameOnImage: { fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600, margin: 0, color: "#F8F1E0" },
  cardVarietyOnImage: { fontStyle: "italic", fontSize: 11.5, color: "#E8DFC8", margin: "2px 0 0" },
  aiTag: { position: "absolute", top: 10, right: 10, display: "flex", alignItems: "center", gap: 4, background: "#211C14", color: "#F1E9D2", fontSize: 10, fontWeight: 600, padding: "4px 8px", borderRadius: 20, fontFamily: "'Space Mono', monospace" },
  riskTag: { position: "absolute", top: 10, left: 10, display: "flex", alignItems: "center", gap: 4, background: "#8A3B1D", color: "#F8ECE0", fontSize: 10, fontWeight: 600, padding: "4px 8px", borderRadius: 20, fontFamily: "'Space Mono', monospace" },
  riskBox: { background: "#F8ECE0", border: "1px solid #E7C4A5", borderRadius: 6, padding: "7px 9px", margin: "6px 0 10px" },
  cardBody: { padding: "10px 16px 6px", flex: 1, cursor: "pointer" },
  cardName: { fontFamily: "'Fraunces', serif", fontSize: 19, fontWeight: 600, margin: 0 },
  cardVariety: { fontStyle: "italic", fontSize: 12.5, color: "#6B4F2A", margin: "2px 0 8px" },
  cardMeta: { display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "#8A7857", margin: "0 0 10px" },
  cardSubstrateLabel: { fontFamily: "'Space Mono', monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", color: "#8A7857", marginBottom: 4 },
  cardText: { fontSize: 12, lineHeight: 1.45, color: "#3C3120", marginTop: 8 },
  materialesRow: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 },
  materialChip: { fontFamily: "'Space Mono', monospace", fontSize: 10.5, background: "#E8DFC8", color: "#3C3120", padding: "3px 8px", borderRadius: 20 },
  cardRow: { display: "flex", alignItems: "flex-start", gap: 6, fontSize: 11.5, lineHeight: 1.4, color: "#3C3120", marginTop: 6 },
  cardNotes: { fontSize: 11.5, color: "#8A7857", borderTop: "1px dashed #E4DAC0", paddingTop: 8, marginTop: 8 },
  cardActions: { display: "flex", borderTop: "1px solid #EFE8D4" },
  iconBtn: { flex: 1, background: "transparent", border: "none", padding: "9px 0", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B4F2A" },
  overlay: { position: "fixed", inset: 0, background: "rgba(33,28,20,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50 },
  modal: { background: "#F1E9D2", borderRadius: 14, padding: 22, width: "100%", maxWidth: 480, maxHeight: "88vh", overflowY: "auto", display: "flex", flexDirection: "column" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  modalTitle: { fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600, margin: 0 },
  closeBtn: { background: "transparent", border: "none", color: "#211C14" },
  aiBanner: { display: "flex", alignItems: "center", gap: 6, background: "#E8DFC8", color: "#3C3120", fontSize: 12, padding: "7px 10px", borderRadius: 6, marginTop: 6 },
  arrivalBox: { display: "flex", gap: 8, background: "#E8DFC8", borderRadius: 8, padding: "9px 11px", marginTop: 10 },
  label: { fontFamily: "'Space Mono', monospace", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6B4F2A", marginTop: 12, marginBottom: 5 },
  formSection: { display: "flex", alignItems: "center", gap: 6, fontFamily: "'Space Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "#A85C32", marginTop: 20, paddingTop: 14, borderTop: "1px solid #E4DAC0" },
  formRow2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  input: { width: "100%", border: "1px solid #D8C9A0", borderRadius: 8, padding: "9px 11px", fontSize: 13.5, background: "#fff", color: "#211C14", outline: "none" },
  modalActions: { display: "flex", gap: 10, marginTop: 20 },
  cancelBtn: { flex: 1, background: "transparent", border: "1px solid #D8C9A0", borderRadius: 8, padding: "10px 0", fontSize: 13.5, color: "#211C14" },
  saveBtn: { flex: 1, background: "#2F5233", border: "none", borderRadius: 8, padding: "10px 0", fontSize: 13.5, fontWeight: 600, color: "#F1E9D2" },
  logForm: { marginTop: 14, borderTop: "1px solid #E4DAC0", paddingTop: 14 },
  logList: { display: "flex", flexDirection: "column", gap: 8, marginTop: 16 },
  logItem: { display: "flex", gap: 8, background: "#fff", border: "1px solid #E4DAC0", borderRadius: 8, padding: "8px 10px", alignItems: "flex-start" },
  logDelete: { background: "transparent", border: "none", color: "#8A7857", padding: 4 },
  loginPage: { minHeight: "100vh", background: "#F1E9D2", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  loginCard: { background: "#fff", border: "1px solid #D8C9A0", borderRadius: 14, padding: 28, width: "100%", maxWidth: 360, fontFamily: "'Work Sans', sans-serif" },
  loginEyebrow: { fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "#A85C32", marginBottom: 6 },
  loginTitle: { fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 34, margin: 0, color: "#211C14" },
  loginSub: { fontSize: 13.5, color: "#6B4F2A", marginTop: 8, marginBottom: 4 },
};
