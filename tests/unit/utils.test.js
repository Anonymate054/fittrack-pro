import { describe, expect, it } from 'vitest';
import { esc, extractBackupSections, getYouTubeVideoId, isArrayOfObjects, isPlainObject } from '../../src/utils.js';

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
