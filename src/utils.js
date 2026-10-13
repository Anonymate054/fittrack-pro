// FUNCIONES PURAS COMPARTIDAS (sin DOM ni localStorage) — cubiertas por tests/utils.test.js

// Escapar texto antes de interpolarlo en innerHTML (evita XSS desde datos importados o capturados)
export function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Validación estructural de datos importados
export function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isArrayOfObjects(value) {
  return Array.isArray(value) && value.every(isPlainObject);
}

// Extraer ID de YouTube para miniaturas y enlaces
export function getYouTubeVideoId(url) {
  if (typeof url !== 'string' || !url) return null;
  const match = url.match(/(?:watch\?v=|shorts\/|youtu\.be\/|embed\/)([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// Normaliza un respaldo JSON importado. Devuelve solo las secciones con estructura válida;
// las secciones ausentes o inválidas quedan en null.
// Acepta el formato de exportación de la app, user_private_backup.json y arreglos sueltos.
export function extractBackupSections(imported) {
  const sections = {
    userLogs: null,
    nutritionData: null,
    workoutData: null,
    resultsData: null,
    customFoods: null,
    customExercises: null
  };
  if (!isPlainObject(imported) && !Array.isArray(imported)) return sections;

  const looseArray = Array.isArray(imported) ? imported : null;
  const first = looseArray && isPlainObject(looseArray[0]) ? looseArray[0] : {};
  const source = isPlainObject(imported) ? imported : {};

  if (isPlainObject(source.userLogs) && Object.keys(source.userLogs).length > 0) {
    sections.userLogs = source.userLogs;
  }

  const candidates = {
    nutritionData: source.nutritionData || source.mealPlans || ('ration_matrix' in first ? looseArray : null),
    workoutData: source.workoutData || source.workoutPlans || ('days' in first ? looseArray : null),
    resultsData: source.resultsData || source.progressData || source.results || ('eval_index' in first ? looseArray : null),
    customFoods: source.customFoods,
    customExercises: source.customExercises
  };
  for (const [key, value] of Object.entries(candidates)) {
    if (isArrayOfObjects(value) && value.length > 0) sections[key] = value;
  }
  return sections;
}

/**
 * Normaliza una serie Phantom al número de mediciones esperado.
 * Respaldos antiguos guardaban los pliegues intercalados con valores de relleno
 * (15 valores para 8 pliegues); en ese caso se toman las posiciones pares.
 */
export function normalizePhantomSeries(values, expected) {
  if (!Array.isArray(values)) return [];
  const nums = values.filter(v => typeof v === 'number' && Number.isFinite(v));
  if (nums.length === expected * 2 - 1) return nums.filter((_, i) => i % 2 === 0);
  return nums.slice(0, expected);
}
