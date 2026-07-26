import React, { useState, useEffect, useRef } from "react";
import {
  Search, Plus, X, Pencil, Trash2, Leaf, Sprout, MapPin, Sun,
  Camera, Loader2, Sparkles, Droplet, Compass, ClipboardList,
  Home, Bug, Scissors, Layers, Droplets, FileText, Clock,
  CloudSun, RefreshCw, AlertTriangle,
} from "lucide-react";
import { storage } from "./storage.js";

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
  { id: "llegada", label: "Llegada", icon: Home },
  { id: "plaga", label: "Plaga", icon: Bug },
  { id: "poda", label: "Poda", icon: Scissors },
  { id: "sustrato", label: "Cambio de sustrato", icon: Layers },
  { id: "fumigacion", label: "Fumigación / Abono", icon: Droplets },
  { id: "otro", label: "Otro", icon: FileText },
];
const eventInfo = (id) => EVENT_TYPES.find((e) => e.id === id) || EVENT_TYPES[EVENT_TYPES.length - 1];

const PLANTS_KEY = "ica-plant-inventory";
const TIPOS_KEY = "ica-plant-tipos";
const CLIMATE_KEY = "ica-plant-climate";
const LOCATION_KEY = "ica-plant-location";

const emptyForm = {
  id: null,
  nombre: "",
  variedad: "",
  tipo: "cactus",
  sustrato: BASE_TIPOS[0].sustrato,
  materiales: (CARE_INFO.cactus.materiales || []).join(", "),
  cuidados: "",
  climaPreferido: "",
  adaptacion: "",
  ubicacion: "",
  imagen: "",
  notas: "",
  fechaLlegada: "",
  situacionLlegada: "",
  eventos: [],
  aiIdentified: false,
};

function slugify(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function pickColor(existingTipos) {
  const used = new Set(existingTipos.map((t) => t.color));
  const avail = EXTRA_COLORS.find((c) => !used.has(c));
  return avail || EXTRA_COLORS[existingTipos.length % EXTRA_COLORS.length];
}

function tipoInfo(tipos, id) {
  return tipos.find((t) => t.id === id) || tipos[tipos.length - 1] || BASE_TIPOS[BASE_TIPOS.length - 1];
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

function LogModal({ plant, onClose, onAdd, onDelete }) {
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [tipo, setTipo] = useState("plaga");
  const [nota, setNota] = useState("");
  const eventos = [...(plant.eventos || [])].sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));

  const submit = (e) => {
    e.preventDefault();
    if (!fecha) return;
    onAdd(plant.id, { fecha, tipo, nota });
    setNota("");
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()} className="scroll-thin">
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Bitácora — {plant.nombre}</h2>
          <button type="button" style={styles.closeBtn} onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
        </div>

        {(plant.fechaLlegada || plant.situacionLlegada) && (
          <div style={styles.arrivalBox}>
            <Home size={13} color="#6B4F2A" />
            <div>
              <div style={{ fontWeight: 600, fontSize: 12.5 }}>
                {plant.fechaLlegada ? `Llegó el ${fmtFecha(plant.fechaLlegada)}` : "Llegada registrada"}
              </div>
              {plant.situacionLlegada && <div style={{ fontSize: 12, color: "#5C4A2E" }}>{plant.situacionLlegada}</div>}
            </div>
          </div>
        )}

        <form onSubmit={submit} style={styles.logForm}>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="date" style={{ ...styles.input, flex: 1 }} value={fecha} onChange={(e) => setFecha(e.target.value)} required />
            <select style={{ ...styles.input, flex: 1 }} value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {EVENT_TYPES.filter((t) => t.id !== "llegada").map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
          <input
            style={{ ...styles.input, marginTop: 8 }}
            placeholder="Detalle (ej. pulgón en hojas nuevas, se abonó con humus…)"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
          />
          <button type="submit" style={{ ...styles.saveBtn, marginTop: 10 }}>Agregar al historial</button>
        </form>

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
                  {ev.nota && <div style={{ fontSize: 12, color: "#5C4A2E" }}>{ev.nota}</div>}
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

function PlantInventory({ onLogout }) {
  const [tipos, setTipos] = useState(BASE_TIPOS);
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
  const fileInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const resPlants = await storage.get(PLANTS_KEY);
        if (resPlants && resPlants.value) {
          const parsedPlants = JSON.parse(resPlants.value);
          let migrated = false;
          const withDefaults = parsedPlants.map((p) => {
            const care = CARE_INFO[p.tipo] || CARE_INFO.otra;
            const next = { ...p };
            if (!next.materiales) { next.materiales = (care.materiales || []).join(", "); migrated = true; }
            if (!next.climaPreferido) { next.climaPreferido = care.climaPreferido; migrated = true; }
            if (!next.adaptacion) { next.adaptacion = care.adaptacion; migrated = true; }
            return next;
          });
          setPlants(withDefaults);
          if (migrated) {
            storage.set(PLANTS_KEY, JSON.stringify(withDefaults)).catch(() => {});
          }
        }
      } catch (e) {}
      try {
        const resTipos = await storage.get(TIPOS_KEY);
        if (resTipos && resTipos.value) setTipos(JSON.parse(resTipos.value));
      } catch (e) {}
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

  const persistPlants = async (next) => {
    setPlants(next);
    try {
      await storage.set(PLANTS_KEY, JSON.stringify(next));
    } catch (e) {
      setError("No se pudo guardar el cambio. Intenta de nuevo.");
    }
  };

  const persistTipos = async (next) => {
    setTipos(next);
    try {
      await storage.set(TIPOS_KEY, JSON.stringify(next));
    } catch (e) {
      setError("No se pudo guardar la nueva área. Intenta de nuevo.");
    }
  };

  const persistUbicacion = async (next) => {
    setUbicacionClima(next);
    try {
      await storage.set(LOCATION_KEY, next);
    } catch (e) {}
  };

  const addCustomTipo = () => {
    const label = newTipoName.trim();
    if (!label) return;
    let id = slugify(label);
    if (!id) id = "area-" + Date.now();
    if (tipos.some((tp) => tp.id === id)) id = id + "-" + Date.now().toString().slice(-4);
    const nuevo = {
      id,
      label,
      color: pickColor(tipos),
      sustrato: "Sustrato balanceado con buen drenaje; ajustar según la especie.",
      estratos: [50, 50],
    };
    persistTipos([...tipos, nuevo]);
    setNewTipoName("");
    setAddingTipo(false);
  };

  const openNew = () => {
    const firstTipo = tipos[0]?.id || "otra";
    const care = CARE_INFO[firstTipo] || CARE_INFO.otra;
    setForm({
      ...emptyForm,
      tipo: firstTipo,
      sustrato: tipos[0]?.sustrato || "",
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
    const care = CARE_INFO[tipoId] || CARE_INFO.otra;
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

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    const clean = { ...form };
    const isEdit = !!clean.id;
    let next;
    if (clean.id) {
      next = plants.map((p) => (p.id === clean.id ? clean : p));
    } else {
      next = [...plants, { ...clean, id: Date.now().toString() }];
    }
    persistPlants(next);
    closeForm();
    setSuccessMsg(isEdit ? "Planta actualizada." : "Planta agregada al vivero.");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleDelete = (id) => { if (!window.confirm("Eliminar esta planta del inventario. Esta accion no se puede deshacer.")) return;
    persistPlants(plants.filter((p) => p.id !== id));
    setSuccessMsg("Planta eliminada.");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (e) {}
    if (onLogout) onLogout();
  };

  const addEvento = (plantId, evento) => {
    const next = plants.map((p) =>
      p.id === plantId ? { ...p, eventos: [...(p.eventos || []), { ...evento, id: Date.now().toString() }] } : p
    );
    persistPlants(next);
  };

  const deleteEvento = (plantId, eventoId) => {
    const next = plants.map((p) =>
      p.id === plantId ? { ...p, eventos: (p.eventos || []).filter((ev) => ev.id !== eventoId) } : p
    );
    persistPlants(next);
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
                                  headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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

  const filtered = plants.filter((p) => {
    const q = query.toLowerCase();
    const matchesQuery = p.nombre.toLowerCase().includes(q) || (p.variedad || "").toLowerCase().includes(q);
    const matchesTipo = filterTipo === "todos" || p.tipo === filterTipo;
    return matchesQuery && matchesTipo;
  });

  const visibleTipos = tipos.filter((t) => {
    if (filterTipo !== "todos" && t.id !== filterTipo) return false;
    const count = filtered.filter((p) => p.tipo === t.id).length;
    return count > 0 || BASE_IDS.includes(t.id);
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
    .map((tp) => ({ ...tp, count: plants.filter((p) => p.tipo === tp.id).length }))
    .filter((tp) => tp.count > 0);
  const climaCounts = {};
  plants.forEach((p) => {
    const c = (p.climaPreferido || "").trim();
    if (c) climaCounts[c] = (climaCounts[c] || 0) + 1;
  });
  const climaList = Object.entries(climaCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const INCIDENT_KEYWORDS = ["plaga", "insecto", "hongo", "enferm", "mancha", "marchit", "pulg", "araña", "arana", "ácaro", "acaro"];
  const incidentPlants = plants.filter((p) => {
    const notas = (p.notas || "").toLowerCase();
    const kw = INCIDENT_KEYWORDS.some((k) => notas.includes(k));
    const evt = (p.eventos || []).some((e) => e.tipo === "plaga");
    return kw || evt;
  });

  return (
    <div style={styles.page}>
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
              <span style={styles.statNum}>{plants.length}</span>
              <span style={styles.statLabel}>{plants.length === 1 ? "planta" : "plantas"}</span>
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
              <div style={styles.statsColTitle}>Tipos de planta</div>
              {tipoCounts.length === 0 ? (
                <p style={styles.climateEmpty}>Aún no hay plantas registradas.</p>
              ) : (
                <div style={styles.badgeWrap}>
                  {tipoCounts.map((tp) => (
                    <span key={tp.id} style={{ ...styles.typeBadge, borderColor: tp.color }}>
                      <span style={{ ...styles.areaDot, background: tp.color }} /> {tp.label} · {tp.count}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div style={styles.statsCol}>
              <div style={styles.statsColTitle}>Clima predominante</div>
              {climaList.length === 0 ? (
                <p style={styles.climateEmpty}>Agrega el clima que prefiere cada planta para ver un resumen aquí.</p>
              ) : (
                <div style={styles.badgeWrap}>
                  {climaList.map(([c, n]) => (
                    <span key={c} style={styles.climaBadge}>{c} · {n}</span>
                  ))}
                </div>
              )}
            </div>
            <div style={styles.statsCol}>
              <div style={styles.statsColTitle}><Bug size={12} /> Incidentes</div>
              {incidentPlants.length === 0 ? (
                <p style={styles.climateEmpty}>Sin incidentes reportados. Agrega notas o eventos de "plaga" en cada planta para verlos aquí.</p>
              ) : (
                <div style={styles.incidentList}>
                  {incidentPlants.map((p) => (
                    <div key={p.id} style={styles.incidentItem}>
                      <AlertTriangle size={12} color="#8A3B1D" />
                      <span>{p.nombre}</span>
                    </div>
                  ))}
                </div>
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
      {loaded && plants.length === 0 && (
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
      {loaded && plants.length > 0 && filtered.length === 0 && (
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

            <label style={styles.label}>Nombre popular</label>
            <input style={styles.input} placeholder="Ej. Tuna" value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />

            <label style={styles.label}>Nombre científico / variedad</label>
            <input style={styles.input} placeholder="Ej. Opuntia ficus-indica" value={form.variedad}
              onChange={(e) => setForm({ ...form, variedad: e.target.value })} />

            <label style={styles.label}>Área / tipo de planta</label>
            <select style={styles.input} value={form.tipo} onChange={(e) => handleTipoChange(e.target.value)}>
              {tipos.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>

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

            <label style={styles.label}>Fecha de llegada</label>
            <input type="date" style={styles.input} value={form.fechaLlegada}
              onChange={(e) => setForm({ ...form, fechaLlegada: e.target.value })} />

            <label style={styles.label}>¿En qué situación llegó?</label>
            <textarea style={{ ...styles.input, minHeight: 45, resize: "vertical" }} placeholder="Ej. llegó con hojas amarillas y raíz débil…"
              value={form.situacionLlegada} onChange={(e) => setForm({ ...form, situacionLlegada: e.target.value })} />

            <label style={styles.label}>Ubicación (opcional)</label>
            <input style={styles.input} placeholder="Ej. Patio, maceta grande" value={form.ubicacion}
              onChange={(e) => setForm({ ...form, ubicacion: e.target.value })} />

            <label style={styles.label}>URL de imagen (opcional, reemplaza la foto)</label>
            <input style={styles.input} placeholder="https://…" value={form.imagen && form.imagen.startsWith("data:") ? "" : form.imagen}
              onChange={(e) => setForm({ ...form, imagen: e.target.value })} />

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
          onClose={() => setDetailPlantId(null)}
          onEdit={() => { setDetailPlantId(null); openEdit(detailPlant); }}
          onLog={() => { setDetailPlantId(null); setLogPlantId(detailPlant.id); }}
        />
      )}
    </div>
  );
}

function DetailModal({ plant, info, risk, onClose, onEdit, onLog }) {
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

        {plant.ubicacion && <p style={styles.cardMeta}><MapPin size={12} /> {plant.ubicacion}</p>}

        {risk && (
          <div style={styles.riskBox}>
            <div style={{ fontWeight: 600, color: "#8A3B1D" }}>{risk.riesgo}</div>
            <div style={{ color: "#5C4A2E", marginTop: 2 }}>{risk.sugerencia}</div>
          </div>
        )}

        {(plant.fechaLlegada || plant.situacionLlegada) && (
          <div style={styles.arrivalBox}>
            <Home size={13} color="#6B4F2A" />
            <div>
              <div style={{ fontWeight: 600, fontSize: 12.5 }}>
                {plant.fechaLlegada ? `Llegó el ${fmtFecha(plant.fechaLlegada)}` : "Llegada registrada"}
              </div>
              {plant.situacionLlegada && <div style={{ fontSize: 12, color: "#5C4A2E" }}>{plant.situacionLlegada}</div>}
            </div>
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

function LoginScreen({ onSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoggingIn(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        onSuccess();
      } else {
        setLoginError("Usuario o clave incorrectos.");
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
        <p style={styles.loginSub}>Ingresa tu usuario y clave para ver el inventario.</p>
        <label style={styles.label}>Usuario</label>
        <input style={styles.input} value={username} onChange={(e) => setUsername(e.target.value)} autoFocus required />
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
  const [authOk, setAuthOk] = useState(false);

  useEffect(() => {
    fetch("/api/session")
      .then((res) => res.json())
      .then((data) => setAuthOk(!!data.ok))
      .catch(() => setAuthOk(false))
      .finally(() => setAuthChecked(true));
  }, []);

  if (!authChecked) {
    return <div style={styles.loginPage} />;
  }

  if (!authOk) {
    return <LoginScreen onSuccess={() => setAuthOk(true)} />;
  }

  return <PlantInventory onLogout={() => setAuthOk(false)} />;
}

const styles = {
  page: { minHeight: "100vh", background: "#F1E9D2", color: "#211C14", fontFamily: "'Work Sans', sans-serif", padding: "28px 20px 60px" },
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
  toolbar: { maxWidth: 980, margin: "0 auto 20px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" },
  searchWrap: { display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #D8C9A0", borderRadius: 8, padding: "9px 12px", flex: "1 1 220px" },
  searchInput: { border: "none", outline: "none", fontSize: 14, flex: 1, background: "transparent", color: "#211C14" },
  select: { border: "1px solid #D8C9A0", borderRadius: 8, padding: "9px 12px", fontSize: 14, background: "#fff", color: "#211C14" },
  addBtn: { display: "flex", alignItems: "center", gap: 6, background: "#2F5233", color: "#F1E9D2", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 14, fontWeight: 600 },
  addBtnGhostSmall: { display: "flex", alignItems: "center", gap: 6, background: "transparent", color: "#211C14", border: "1px solid #D8C9A0", borderRadius: 8, padding: "10px 14px", fontSize: 14, fontWeight: 600 },
  addBtnGhost: { display: "flex", alignItems: "center", gap: 6, background: "#211C14", color: "#F1E9D2", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 14, fontWeight: 600 },
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
  modal: { background: "#F1E9D2", borderRadius: 14, padding: 22, width: "100%", maxWidth: 420, maxHeight: "88vh", overflowY: "auto", display: "flex", flexDirection: "column" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  modalTitle: { fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600, margin: 0 },
  closeBtn: { background: "transparent", border: "none", color: "#211C14" },
  aiBanner: { display: "flex", alignItems: "center", gap: 6, background: "#E8DFC8", color: "#3C3120", fontSize: 12, padding: "7px 10px", borderRadius: 6, marginTop: 6 },
  arrivalBox: { display: "flex", gap: 8, background: "#E8DFC8", borderRadius: 8, padding: "9px 11px", marginTop: 10 },
  label: { fontFamily: "'Space Mono', monospace", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6B4F2A", marginTop: 12, marginBottom: 5 },
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
