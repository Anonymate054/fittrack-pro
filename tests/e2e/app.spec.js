import { expect, test } from '@playwright/test';

// Las miniaturas de YouTube son externas: se bloquean para que la prueba no dependa de la red
test.beforeEach(async ({ page }) => {
  await page.route(/youtube\.com|ytimg\.com/, (route) => route.abort());
});

function collectErrors(page) {
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

test('carga todas las secciones sin errores de JavaScript', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');

  await expect(page.locator('#planHistorySelector option').first()).toBeAttached();
  for (const tab of ['tab-nutrition', 'tab-workout', 'tab-equivalents', 'tab-progress', 'tab-add-data', 'tab-settings']) {
    await page.locator(`.nav-btn[data-tab="${tab}"]`).click();
    await expect(page.locator(`#${tab}`)).toBeVisible();
  }

  await page.locator('.nav-btn[data-tab="tab-nutrition"]').click();
  await expect(page.locator('#mealsContainer > *').first()).toBeVisible();
  await page.locator('.nav-btn[data-tab="tab-workout"]').click();
  await expect(page.locator('.exercise-card').first()).toBeVisible();

  expect(errors).toEqual([]);
});

test('un respaldo con HTML malicioso se muestra como texto y no se ejecuta', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await expect(page.locator('.exercise-card').first()).toBeAttached();

  const payload = '<img src=x onerror="window.__xss=1">';
  const workoutData = await page.evaluate(() => structuredClone(window.state.workoutData));
  workoutData[0].technique_title = payload;
  workoutData[0].days[0].biseries[0].exercises[0].name = payload;
  const backup = { workoutData, customFoods: [{ name: payload, portion: '1 pza', category: 'FRUTAS' }] };

  page.on('dialog', (dialog) => dialog.accept());
  await page.setInputFiles('#importBackupInput', {
    name: 'respaldo.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup))
  });
  await page.reload();
  await page.locator('.nav-btn[data-tab="tab-workout"]').click();
  await page.locator('.nav-btn[data-tab="tab-equivalents"]').click();

  await expect(page.locator('body')).toContainText('<img src=x onerror=');
  expect(await page.evaluate(() => window.__xss)).toBeUndefined();
  await expect(page.locator('img[src="x"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('funciona sin conexión después de la primera visita', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  await context.setOffline(true);
  await page.reload();
  await page.locator('.nav-btn[data-tab="tab-workout"]').click();
  await expect(page.locator('.exercise-card').first()).toBeVisible();
  await expect(page.locator('#planHistorySelector option').first()).toBeAttached();
});

test('un ejercicio personalizado aparece como día propio sin alterar el plan', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await expect(page.locator('.exercise-card').first()).toBeAttached();
  const firstDayBefore = await page.evaluate(() => JSON.stringify(window.state.workoutData[0].days[0]));

  page.on('dialog', (dialog) => dialog.accept());
  await page.locator('.nav-btn[data-tab="tab-add-data"]').click();
  await page.fill('#addExName', 'Press militar de prueba');
  await page.click('#saveCustomExerciseBtn');

  await page.locator('.nav-btn[data-tab="tab-workout"]').click();
  await page.selectOption('#routineDaySelector', { label: '⭐ Ejercicios personalizados' });
  await expect(page.locator('.exercise-title', { hasText: 'Press militar de prueba' })).toBeVisible();

  // Tras recargar sigue ahí una sola vez, y el día 1 del plan no cambió
  await page.reload();
  await expect(page.locator('#routineDaySelector option', { hasText: 'Ejercicios personalizados' })).toHaveCount(1);
  expect(await page.evaluate(() => JSON.stringify(window.state.workoutData[0].days[0]))).toBe(firstDayBefore);
  expect(errors).toEqual([]);
});
