import { describe, expect, it } from 'vitest';
import { esc, extractBackupSections, formatReps, getYouTubeVideoId, isArrayOfObjects, isPlainObject, normalizePhantomSeries, sortByDocumentDate } from '../../src/utils.js';

describe('esc', () => {
  it('escapa los caracteres especiales de HTML', () => {
    expect(esc('<img src=x onerror="alert(1)">')).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
    expect(esc("Tom & Jerry's")).toBe('Tom &amp; Jerry&#39;s');
  });

  it('convierte null/undefined en cadena vacía y números en texto', () => {
    expect(esc(null)).toBe('');
    expect(esc(undefined)).toBe('');
    expect(esc(72.5)).toBe('72.5');
    expect(esc(0)).toBe('0');
  });
});

describe('isPlainObject / isArrayOfObjects', () => {
  it('distingue objetos de arreglos y null', () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject('x')).toBe(false);
  });

  it('exige que todos los elementos sean objetos', () => {
    expect(isArrayOfObjects([{ a: 1 }, {}])).toBe(true);
    expect(isArrayOfObjects([{ a: 1 }, 'x'])).toBe(false);
    expect(isArrayOfObjects({})).toBe(false);
  });
});

describe('getYouTubeVideoId', () => {
  it.each([
    ['https://www.youtube.com/watch?v=o8DLNpjv9sY&list=PL', 'o8DLNpjv9sY'],
    ['https://youtu.be/trIBa_tguS8', 'trIBa_tguS8'],
    ['https://www.youtube.com/shorts/abc-123_X', 'abc-123_X'],
    ['https://www.youtube.com/embed/xyz987', 'xyz987']
  ])('extrae el ID de %s', (url, id) => {
    expect(getYouTubeVideoId(url)).toBe(id);
  });

  it('devuelve null para URLs no reconocidas o valores vacíos', () => {
    expect(getYouTubeVideoId('https://vimeo.com/123')).toBeNull();
    expect(getYouTubeVideoId('')).toBeNull();
    expect(getYouTubeVideoId(undefined)).toBeNull();
  });
});

describe('extractBackupSections', () => {
  it('lee el formato de exportación de la app', () => {
    const backup = {
      userLogs: { 'Sentadilla_w1': { weight: 60, reps: 10 } },
      nutritionData: [{ kcal: 2100, ration_matrix: [] }],
      workoutData: [{ days: [] }],
      resultsData: [{ eval_index: 1 }],
      customFoods: [{ name: 'Avena', portion: '1/2 tza' }],
      customExercises: [{ name: 'Plancha' }]
    };
    const sections = extractBackupSections(backup);
    expect(sections).toEqual(backup);
  });

  it('acepta los alias mealPlans / workoutPlans / progressData', () => {
    const sections = extractBackupSections({
      mealPlans: [{ kcal: 1 }],
      workoutPlans: [{ days: [] }],
      progressData: [{ eval_index: 1 }]
    });
    expect(sections.nutritionData).toHaveLength(1);
    expect(sections.workoutData).toHaveLength(1);
    expect(sections.resultsData).toHaveLength(1);
  });

  it('reconoce arreglos sueltos según su forma', () => {
    expect(extractBackupSections([{ ration_matrix: [] }]).nutritionData).toHaveLength(1);
    expect(extractBackupSections([{ days: [] }]).workoutData).toHaveLength(1);
    expect(extractBackupSections([{ eval_index: 2 }]).resultsData).toHaveLength(1);
  });

  it('descarta secciones vacías o con estructura inválida', () => {
    const sections = extractBackupSections({
      userLogs: [],
      nutritionData: 'no es una lista',
      workoutData: [],
      resultsData: [1, 2, 3],
      customFoods: [{ name: 'ok' }, null]
    });
    expect(Object.values(sections).every((v) => v === null)).toBe(true);
  });

  it('no falla con entradas que no son objetos', () => {
    for (const input of [null, 42, 'texto', true]) {
      expect(Object.values(extractBackupSections(input)).every((v) => v === null)).toBe(true);
    }
  });
});

describe('normalizePhantomSeries', () => {
  it('conserva una serie con el número esperado de valores', () => {
    const folds = [-0.5, -1.04, -0.15, -0.4, -0.59, -0.91, -1.42, -1.74];
    expect(normalizePhantomSeries(folds, 8)).toEqual(folds);
  });

  it('descarta los valores de relleno intercalados de respaldos antiguos', () => {
    const legacy = [-0.28, 0.06, -0.79, 0.06, 0.33, 0.06, -0.25, 0.06, -0.12, 0.06, -0.47, 0.06, -1.32, 0.06, -1.48];
    expect(normalizePhantomSeries(legacy, 8)).toEqual([-0.28, -0.79, 0.33, -0.25, -0.12, -0.47, -1.32, -1.48]);
  });

  it('recorta series largas e ignora valores no numéricos', () => {
    expect(normalizePhantomSeries([1, 2, 'x', 3, 4], 3)).toEqual([1, 2, 3]);
    expect(normalizePhantomSeries(undefined, 7)).toEqual([]);
  });
});

describe('sortByDocumentDate', () => {
  it('pone primero el documento con la fecha más reciente', () => {
    const plans = [
      { file: 'a', sort_key: '20251007' },
      { file: 'b', date: '20/06/2026' },
      { file: 'c' },
      { file: 'd', sort_key: '20260412' }
    ];
    expect(sortByDocumentDate(plans).map(p => p.file)).toEqual(['b', 'd', 'a', 'c']);
  });

  it('ordena las rutinas al importar un respaldo', () => {
    const sections = extractBackupSections({
      workoutData: [{ days: [], sort_key: '20251007' }, { days: [], sort_key: '20260620' }]
    });
    expect(sections.workoutData.map(p => p.sort_key)).toEqual(['20260620', '20251007']);
  });
});

describe('formatReps', () => {
  it('agrega "reps" solo cuando el PDF no trae la unidad', () => {
    expect(formatReps(12)).toBe('12 reps');
    expect(formatReps('15,12,12DP')).toBe('15,12,12DP reps');
    expect(formatReps('40 seg')).toBe('40 seg');
    expect(formatReps('15,12,20 reps')).toBe('15,12,20 reps');
    expect(formatReps('')).toBe('--');
  });
});
