// DIAGRAMAS ANATÓMICOS VECTORIALES SVG REUTILIZABLES (ESTILO NOTION WORKOUT TRACKER)

export function renderMuscleSVG(muscleGroup) {
  // Normalizar acentos para que "BÍCEPS" o "Glúteo" coincidan igual que "biceps" o "gluteo"
  const group = String(muscleGroup || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const has = (...words) => words.some((w) => group.includes(w));

  const base = "#3b82f6";
  const highlight = "#00e676"; // Color verde brillante para músculo activo

  const pechoColor = has("pecho", "pectoral") ? highlight : base;
  const espaldaColor = has("espalda", "dorsal", "remo", "jalon") ? highlight : base;
  const hombroColor = has("hombro", "deltoid") ? highlight : base;
  const brazoColor = has("biceps", "triceps", "brazo") ? highlight : base;
  const absColor = has("abs", "abdomen", "core") ? highlight : base;
  const piernasColor = has("pierna", "cuadriceps", "gluteo", "pantorrilla", "femoral", "sentadilla") ? highlight : base;

  return `
    <svg width="70" height="90" viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg">
      <!-- Cabeza -->
      <circle cx="50" cy="18" r="10" fill="#64748b" />
      
      <!-- Cuello -->
      <rect x="47" y="28" width="6" height="6" fill="#64748b" />
      
      <!-- Hombros -->
      <path d="M28,34 Q50,30 72,34 Q76,42 70,45 Q50,38 30,45 Q24,42 28,34 Z" fill="${hombroColor}" opacity="0.9"/>
      
      <!-- Espalda (dorsales, visibles a los lados del torso) -->
      <path d="M30,45 L33,43 Q35,56 39,62 L35,63 Q29,56 30,45 Z" fill="${espaldaColor}" opacity="0.9"/>
      <path d="M70,45 L67,43 Q65,56 61,62 L65,63 Q71,56 70,45 Z" fill="${espaldaColor}" opacity="0.9"/>

      <!-- Pecho (Pectorales) -->
      <path d="M33,42 Q50,40 67,42 Q65,58 50,60 Q35,58 33,42 Z" fill="${pechoColor}" opacity="0.9"/>
      
      <!-- Abdomen -->
      <rect x="38" y="62" width="24" height="22" rx="4" fill="${absColor}" opacity="0.8"/>
      
      <!-- Brazos (bíceps / tríceps) -->
      <rect x="20" y="44" width="9" height="20" rx="4" fill="${brazoColor}" opacity="0.9"/>
      <rect x="71" y="44" width="9" height="20" rx="4" fill="${brazoColor}" opacity="0.9"/>
      
      <!-- Antebrazos -->
      <rect x="18" y="66" width="8" height="18" rx="3" fill="#64748b"/>
      <rect x="74" y="66" width="8" height="18" rx="3" fill="#64748b"/>
      
      <!-- Piernas (Cuádriceps / Muslos) -->
      <path d="M36,86 L48,86 L46,112 L34,112 Z" fill="${piernasColor}" opacity="0.9"/>
      <path d="M52,86 L64,86 L66,112 L54,112 Z" fill="${piernasColor}" opacity="0.9"/>
      
      <!-- Pantorrillas -->
      <path d="M35,114 L45,114 L43,128 L37,128 Z" fill="${piernasColor}" opacity="0.8"/>
      <path d="M55,114 L65,114 L63,128 L57,128 Z" fill="${piernasColor}" opacity="0.8"/>
    </svg>
  `;
}
