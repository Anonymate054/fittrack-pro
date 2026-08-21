// DIAGRAMAS ANATÓMICOS VECTORIALES SVG REUTILIZABLES (ESTILO NOTION WORKOUT TRACKER)

export function renderMuscleSVG(muscleGroup) {
  const groupLower = (muscleGroup || "").toLowerCase();
  
  let pechoColor = "#3b82f6";
  let espaldaColor = "#3b82f6";
  let hombroColor = "#3b82f6";
  let bicepsColor = "#3b82f6";
  let tricepsColor = "#3b82f6";
  let absColor = "#3b82f6";
  let piernasColor = "#3b82f6";

  const highlight = "#00e676"; // Color verde brillante para músculo activo

  if (groupLower.includes("pecho") || groupLower.includes("pectoral")) pechoColor = highlight;
  if (groupLower.includes("espalda") || groupLower.includes("dorsal") || groupLower.includes("remo") || groupLower.includes("jalón")) espaldaColor = highlight;
  if (groupLower.includes("hombro") || groupLower.includes("deltoid")) hombroColor = highlight;
  if (groupLower.includes("biceps")) bicepsColor = highlight;
  if (groupLower.includes("triceps")) tricepsColor = highlight;
  if (groupLower.includes("abs") || groupLower.includes("abdomen") || groupLower.includes("core")) absColor = highlight;
  if (groupLower.includes("pierna") || groupLower.includes("cuadriceps") || groupLower.includes("glúteo") || groupLower.includes("pantorrilla")) piernasColor = highlight;

  return `
    <svg width="70" height="90" viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg">
      <!-- Cabeza -->
      <circle cx="50" cy="18" r="10" fill="#64748b" />
      
      <!-- Cuello -->
      <rect x="47" y="28" width="6" height="6" fill="#64748b" />
      
      <!-- Hombros -->
      <path d="M28,34 Q50,30 72,34 Q76,42 70,45 Q50,38 30,45 Q24,42 28,34 Z" fill="${hombroColor}" opacity="0.9"/>
      
      <!-- Pecho (Pectorales) -->
      <path d="M33,42 Q50,40 67,42 Q65,58 50,60 Q35,58 33,42 Z" fill="${pechoColor}" opacity="0.9"/>
      
      <!-- Abdomen -->
      <rect x="38" y="62" width="24" height="22" rx="4" fill="${absColor}" opacity="0.8"/>
      
      <!-- Biceps / Brazos -->
      <rect x="20" y="44" width="9" height="20" rx="4" fill="${bicepsColor}" opacity="0.9"/>
      <rect x="71" y="44" width="9" height="20" rx="4" fill="${bicepsColor}" opacity="0.9"/>
      
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
