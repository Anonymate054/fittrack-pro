// LOGICA PRINCIPAL DE LA APLICACIÓN FITNESS & NUTRICIÓN (FITTRACK PRO v10)

import { renderMuscleSVG } from './components/svg_muscles.js';
import { mealPlansData } from './data/meal_plans.js';
import { trainingPlansData } from './data/training_plans.js';
import { equivalentsData } from './data/equivalents.js';
import { progressHistoryData } from './data/progress_history.js';

// ESTADO GLOBAL DE LA APP
const state = {
  theme: localStorage.getItem('fitapp_theme') || 'dark',
  currentTab: 'tab-nutrition',
  isWorkoutDay: true,
  currentWeek: 1,
  selectedPlanIndex: 0, // 0 es siempre el plan MÁS RECIENTE (REST PAUSE)
  selectedRoutineIndex: 0,
  selectedMealPlanIndex: 0, // 0 es siempre el plan MÁS RECIENTE
  nutritionData: mealPlansData || [],
  workoutData: trainingPlansData || [],
  equivalentsData: equivalentsData || {},
  resultsData: progressHistoryData || [],
  customFoods: (() => {
    try {
      return JSON.parse(localStorage.getItem('fitapp_custom_foods') || '[]');
    } catch(e) {
      return [];
    }
  })(),
  customExercises: (() => {
    try {
      return JSON.parse(localStorage.getItem('fitapp_custom_exercises') || '[]');
    } catch(e) {
      return [];
    }
  })(),
  userLogs: (() => {
    try {
      return JSON.parse(localStorage.getItem('fitapp_user_logs') || '{}');
    } catch(e) {
      return {};
    }
  })()
};

window.state = state;

// EXTRAER ID DE YOUTUBE PARA MINIATURAS HD
function getYouTubeVideoId(url) {
  if (!url) return null;
  const match = url.match(/(?:watch\?v=|shorts\/|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// INICIALIZACIÓN ROBUSTA
async function initApp() {
  initTheme();
  initTabs();
  initToggle();
  await loadAppData();
  detectTodayWorkout();
  renderAllViews();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// 1. TEMA CLARO / OSCURO
function initTheme() {
  const btn = document.getElementById('themeToggleBtn');
  applyTheme(state.theme);

  btn.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('fitapp_theme', state.theme);
    applyTheme(state.theme);
  });
}

function applyTheme(theme) {
  const btn = document.getElementById('themeToggleBtn');
  if (theme === 'light') {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
    btn.innerHTML = '🌙 Modo Oscuro';
  } else {
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
    btn.innerHTML = '☀️ Modo Claro';
  }
}

// 2. AUTO-DETECCIÓN DEL DÍA DE LA SEMANA
function detectTodayWorkout() {
  const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const today = new Date();
  const dayName = daysOfWeek[today.getDay()];

  const bannerText = document.getElementById('todayDayText');
  if (dayName === 'Lunes' || dayName === 'Jueves') {
    bannerText.innerHTML = `${dayName} &bull; Sugerencia: <strong>FUERZA DÍA 1 (ESPALDA Y HOMBRO) + CARDIO</strong>`;
  } else if (dayName === 'Martes' || dayName === 'Viernes') {
    bannerText.innerHTML = `${dayName} &bull; Sugerencia: <strong>FUERZA DÍA 2 (PIERNA Y GLÚTEO) + CARDIO + ABDOMEN</strong>`;
  } else if (dayName === 'Miércoles') {
    bannerText.innerHTML = `${dayName} &bull; Sugerencia: <strong>FUERZA DÍA 3 (PECHO Y BÍCEPS) + ABDOMEN</strong>`;
  } else {
    bannerText.innerHTML = `${dayName} &bull; Día de Descanso Activo / Estiramientos`;
  }
}

// 3. NAVEGACIÓN POR PESTAÑAS
function initTabs() {
  const navBtns = document.querySelectorAll('.nav-btn');
  const panels = document.querySelectorAll('.tab-panel');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      navBtns.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(target).classList.add('active');
      state.currentTab = target;
    });
  });

  const tableBtn = document.getElementById('subtabTableBtn');
  const calcBtn = document.getElementById('subtabCalcBtn');
  const tableView = document.getElementById('tableView');
  const calcView = document.getElementById('calcView');

  tableBtn.addEventListener('click', () => {
    tableBtn.classList.remove('btn-secondary');
    calcBtn.classList.add('btn-secondary');
    tableView.style.display = 'block';
    calcView.style.display = 'none';
  });

  calcBtn.addEventListener('click', () => {
    calcBtn.classList.remove('btn-secondary');
    tableBtn.classList.add('btn-secondary');
    calcView.style.display = 'block';
    tableView.style.display = 'none';
  });

  const closeModalBtn = document.getElementById('closeModalBtn');
  const modal = document.getElementById('exerciseModal');
  closeModalBtn.onclick = () => modal.style.display = 'none';
  window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
}

// 4. TOGGLE DÍA DE ENTRENO / DESCANSO
function initToggle() {
  const toggleOptions = document.querySelectorAll('#workoutDayToggle .toggle-option');
  toggleOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      toggleOptions.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      state.isWorkoutDay = opt.getAttribute('data-workout') === 'true';
      renderNutritionView();
    });
  });
}

// 5. CARGA DE DATOS LOCALES CON FALLBACK GARANTIZADO
async function loadAppData() {
  try {
    const ts = Date.now();
    const [nutRes, workRes, eqRes, resRes] = await Promise.all([
      fetch('./src/data/meal_plans.json?v=' + ts).catch(() => null),
      fetch('./src/data/training_plans.json?v=' + ts).catch(() => null),
      fetch('./src/data/equivalents.json?v=' + ts).catch(() => null),
      fetch('./src/data/progress_history.json?v=' + ts).catch(() => null)
    ]);

    if (nutRes && nutRes.ok) state.nutritionData = await nutRes.json();
    if (workRes && workRes.ok) state.workoutData = await workRes.json();
    if (eqRes && eqRes.ok) state.equivalentsData = await eqRes.json();
    if (resRes && resRes.ok) state.resultsData = await resRes.json();

  } catch (err) {
    console.warn('Usando respaldo estático de datos importados:', err);
  }

  // Cargar datos privados personalizados de localStorage o respaldo local ignórado en git
  try {
    const backupRes = await fetch('./user_private_backup.json').catch(() => null);
    if (backupRes && backupRes.ok) {
      const privateBackup = await backupRes.json();
      if (privateBackup.nutritionData) state.nutritionData = privateBackup.nutritionData;
      if (privateBackup.workoutData) state.workoutData = privateBackup.workoutData;
      if (privateBackup.resultsData) state.resultsData = privateBackup.resultsData;
    }

    const savedNut = localStorage.getItem('fitapp_custom_nutrition');
    const savedWork = localStorage.getItem('fitapp_custom_workout');
    const savedProg = localStorage.getItem('fitapp_custom_progress');

    if (savedNut) state.nutritionData = JSON.parse(savedNut);
    if (savedWork) state.workoutData = JSON.parse(savedWork);
    if (savedProg) state.resultsData = JSON.parse(savedProg);
  } catch(e) {}

  // Fallbacks incondicionales
  if (!state.nutritionData || state.nutritionData.length === 0) state.nutritionData = mealPlansData;
  if (!state.workoutData || state.workoutData.length === 0) state.workoutData = trainingPlansData;
  if (!state.equivalentsData || Object.keys(state.equivalentsData).length === 0) state.equivalentsData = equivalentsData;
  if (!state.resultsData || state.resultsData.length === 0) state.resultsData = progressHistoryData;

  // Combinar insumos personalizados
  (state.customFoods || []).forEach(cf => {
    const cat = cf.category || 'LIBRES DE ENERGÍA';
    if (!state.equivalentsData[cat]) state.equivalentsData[cat] = [];
    const exists = state.equivalentsData[cat].some(item => item.name.includes(cf.name));
    if (!exists) {
      state.equivalentsData[cat].unshift({ name: `⭐ [PERSONALIZADO] ${cf.name}`, portion: cf.portion });
    }
  });

  // Combinar ejercicios personalizados en la primera rutina activa
  (state.customExercises || []).forEach(ce => {
    if (state.workoutData && state.workoutData[0] && state.workoutData[0].days && state.workoutData[0].days[0]) {
      const biseries = state.workoutData[0].days[0].biseries || [];
      if (biseries[0] && biseries[0].exercises) {
        const exists = biseries[0].exercises.some(e => e.name === ce.name);
        if (!exists) {
          biseries[0].exercises.push(ce);
        }
      }
    }
  });
}

// 6. RENDERIZADO DE VISTAS
function renderAllViews() {
  renderNutritionView();
  renderWorkoutView();
  renderEquivalentsView();
  renderProgressView();
  initAddDataView();
  initSettings();
}

// A. NUTRICIÓN
function renderNutritionView() {
  const planSelector = document.getElementById('planHistorySelector');
  const kcalSummary = document.getElementById('kcalSummary');
  const matrixTableBody = document.querySelector('#rationMatrixTable tbody');
  const mealsContainer = document.getElementById('mealsContainer');
  const suppContainer = document.getElementById('supplementsContainer');

  if (!state.nutritionData || state.nutritionData.length === 0) return;

  planSelector.innerHTML = state.nutritionData.map((p, idx) => {
    const isRecent = idx === 0 ? '⭐ [RECIENTE] ' : '';
    const kcalStr = p.kcal ? `${p.kcal} Kcal` : '2100 Kcal';
    const dateStr = p.date ? ` (${p.date.trim()})` : '';
    let fileName = (p.file || '').replace(/\.pdf$/i, '').trim();
    if (fileName.toLowerCase().includes('plan de alimentación')) {
      fileName = fileName.replace(/plan de alimentación/i, '').replace(/[\(\)]/g, '').trim();
    }
    const labelText = fileName ? `${kcalStr} • ${fileName}` : `${kcalStr}`;
    return `<option value="${idx}">${isRecent}${labelText}${dateStr}</option>`;
  }).join('');

  planSelector.value = state.selectedMealPlanIndex;
  planSelector.onchange = (e) => {
    state.selectedMealPlanIndex = parseInt(e.target.value);
    renderNutritionView();
  };

  const activePlan = state.nutritionData[state.selectedMealPlanIndex] || state.nutritionData[0];
  kcalSummary.innerHTML = `Plan Seleccionado: <strong>${activePlan.kcal || 2100} Kcal HP</strong> &bull; Fecha: ${activePlan.date || '06/10/2025'}`;

  // Tabla Resumen de Raciones (Estructura Fiel al PDF con Subgrupos Combinados)
  if (activePlan.ration_matrix && activePlan.ration_matrix.length > 0) {
    let rowsHtml = '';
    const matrix = activePlan.ration_matrix;

    let r = 0;
    while (r < matrix.length) {
      const row = matrix[r];
      const mainGroup = row[0];
      const subGroup = row[1];

      // Contar cuántas subfilas secundarias sin mainGroup pertenecen a este bloque
      let subRowCount = 1;
      let checkIdx = r + 1;
      while (checkIdx < matrix.length && (!matrix[checkIdx][0] || matrix[checkIdx][0] === mainGroup)) {
        subRowCount++;
        checkIdx++;
      }

      if (subRowCount > 1) {
        // Primera subfila con rowspan dinámico exacto
        const rowCells = row.slice(2).map(c => `<td>${c || ''}</td>`).join('');
        rowsHtml += `
          <tr>
            <td rowspan="${subRowCount}" style="font-weight: 700; vertical-align: middle;">${mainGroup}</td>
            <td style="font-style: italic; color: var(--text-muted);">${subGroup || ''}</td>
            ${rowCells}
          </tr>
        `;
        r++;
        // Subfilas secundarias
        for (let s = 1; s < subRowCount; s++) {
          const subRow = matrix[r];
          const subRowCells = subRow.slice(2).map(c => `<td>${c || ''}</td>`).join('');
          rowsHtml += `
            <tr>
              <td style="font-style: italic; color: var(--text-muted);">${subRow[1] || ''}</td>
              ${subRowCells}
            </tr>
          `;
          r++;
        }
      } else {
        // Grupo único de 1 fila
        const rowCells = row.slice(2).map(c => `<td>${c || ''}</td>`).join('');
        if (subGroup) {
          rowsHtml += `
            <tr>
              <td style="font-weight: 700;">${mainGroup}</td>
              <td style="font-style: italic; color: var(--text-muted);">${subGroup}</td>
              ${rowCells}
            </tr>
          `;
        } else {
          rowsHtml += `
            <tr>
              <td colspan="2" style="font-weight: 700;">${mainGroup}</td>
              ${rowCells}
            </tr>
          `;
        }
        r++;
      }
    }
    matrixTableBody.innerHTML = rowsHtml;
  }

  // Comidas con formato de Tarjeta Adaptable (Mobile & Titan 2 Elite Ready)
  if (activePlan.menu_meals && activePlan.menu_meals.length > 0) {
    mealsContainer.innerHTML = activePlan.menu_meals.map(meal => {
      const eqPillsHtml = (meal.eq_summary && meal.eq_summary.length > 0)
        ? meal.eq_summary.map(eq => `<span class="eq-pill">${eq}</span>`).join('')
        : '<span style="font-size: 0.8rem; color: var(--text-muted);">Sin equivalentes especificados</span>';

      let restDayBannerHtml = '';
      if (meal.meal_name.includes('DESAYUNO')) {
        if (!state.isWorkoutDay) {
          restDayBannerHtml = `
            <div class="meal-rest-banner active">
              <div class="meal-rest-title">🥗 DÍA DE DESCANSO / NO ENTRENAR HABILITADO</div>
              <div class="meal-rest-desc">
                <strong>NOTA: LOS DÍAS QUE NO REALIZAS EJERCICIO NO CONSUMIR ESTE DESAYUNO O CAMBIARLO POR: BATIDO VERDE:</strong> 250 – 300 ml de agua natural con 1 pza de manzana gala chica picada, 2 ramitas de perejil, 1 pza nopal chico (cambray), 2-3 hojas espinacas desinfectadas, ¼ pza pepino mediano y 1 rama apio picado.
              </div>
            </div>
          `;
        } else {
          restDayBannerHtml = `
            <div class="meal-rest-banner hint">
              💡 <em>📌 NOTA: LOS DÍAS QUE NO REALIZAS EJERCICIO NO CONSUMIR ESTE DESAYUNO O CAMBIARLO POR: BATIDO VERDE</em> (Activa la opción "Día de Descanso" arriba para aplicarlo).
            </div>
          `;
        }
      }

      const optionsHtml = meal.options.map((opt, idx) => `
        <div class="meal-option-row">
          <div class="meal-option-badge">
            Opción ${opt.option_num || opt.option_number || idx + 1}
          </div>
          <div class="meal-option-body">
            ${opt.title ? `<div class="meal-option-title">${opt.title}</div>` : ''}
            <div class="meal-option-desc">${opt.description || ''}</div>
          </div>
        </div>
      `).join('');

      return `
        <div class="meal-card">
          <!-- Encabezado de Comida -->
          <div class="meal-header">
            <div class="meal-title-group">
              <div class="meal-name">${meal.meal_name}</div>
              ${meal.target_time ? `<div class="meal-time">🕒 ${meal.target_time}</div>` : ''}
            </div>
          </div>

          <!-- Barra Resumen de Raciones / Equivalentes -->
          <div class="meal-eq-summary-bar">
            <div class="meal-eq-label">📋 Raciones (Equivalentes):</div>
            <div class="meal-eq-pills">${eqPillsHtml}</div>
          </div>

          ${restDayBannerHtml}

          <!-- Lista de Opciones Adaptables -->
          <div class="meal-options-container">
            ${optionsHtml}
          </div>

          <!-- Pie de página de la Comida -->
          <div class="meal-footer">
            📌 Elige 1 de las opciones disponibles &bull; NOTA: El pesaje (gr) de la proteína se realiza en cocinado (asado).
          </div>
        </div>
      `;
    }).join('');
  }

  // Suplementos
  if (activePlan.supplements) {
    suppContainer.innerHTML = activePlan.supplements.map(supp => `
      <div style="display: flex; align-items: flex-start; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--card-border);">
        <input type="checkbox" style="width: auto; margin-top: 4px;">
        <span style="font-size: 0.9rem; line-height: 1.5; color: var(--text-color);">${supp}</span>
      </div>
    `).join('');
  }

  // Recomendaciones Generales, Notas, Actividad Física e Hidratación (Desplegables / Acordeón)
  const recomContainer = document.getElementById('recommendationsContainer');
  if (recomContainer) {
    let sectionsHtml = '';

    const ensureBullet = (text) => {
      if (!text) return '';
      const clean = text.replace(/^[•\-]\s*/, '').trim();
      return `• ${clean}`;
    };

    if (activePlan.general_recommendations && activePlan.general_recommendations.length > 0) {
      sectionsHtml += `
        <details class="card" style="margin-bottom: 14px; background: var(--input-bg); border: 1px solid var(--card-border); border-radius: 8px; overflow: hidden;">
          <summary style="font-weight: 700; font-size: 0.95rem; color: #10b981; padding: 14px 16px; cursor: pointer; user-select: none; display: flex; align-items: center; justify-content: space-between;">
            <span>📋 RECOMENDACIONES GENERALES</span>
            <span style="font-size: 0.8rem; color: var(--text-muted);">▼</span>
          </summary>
          <div style="padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; font-size: 0.88rem; line-height: 1.6; border-top: 1px solid var(--card-border);">
            ${activePlan.general_recommendations.map(r => `<div>${ensureBullet(r)}</div>`).join('')}
          </div>
        </details>
      `;
    }

    if (activePlan.additional_notes && activePlan.additional_notes.length > 0) {
      sectionsHtml += `
        <details class="card" style="margin-bottom: 14px; background: var(--input-bg); border: 1px solid var(--card-border); border-radius: 8px; overflow: hidden;">
          <summary style="font-weight: 700; font-size: 0.95rem; color: #f59e0b; padding: 14px 16px; cursor: pointer; user-select: none; display: flex; align-items: center; justify-content: space-between;">
            <span>📌 NOTAS ADICIONALES</span>
            <span style="font-size: 0.8rem; color: var(--text-muted);">▼</span>
          </summary>
          <div style="padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; font-size: 0.88rem; line-height: 1.6; border-top: 1px solid var(--card-border);">
            ${activePlan.additional_notes.map(n => `<div>${ensureBullet(n)}</div>`).join('')}
          </div>
        </details>
      `;
    }

    if (activePlan.hydration_recommendations && activePlan.hydration_recommendations.length > 0) {
      sectionsHtml += `
        <details class="card" style="margin-bottom: 14px; background: var(--input-bg); border: 1px solid var(--card-border); border-radius: 8px; overflow: hidden;">
          <summary style="font-weight: 700; font-size: 0.95rem; color: #06b6d4; padding: 14px 16px; cursor: pointer; user-select: none; display: flex; align-items: center; justify-content: space-between;">
            <span>💧 RECOMENDACIONES DE LA HIDRATACIÓN</span>
            <span style="font-size: 0.8rem; color: var(--text-muted);">▼</span>
          </summary>
          <div style="padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; font-size: 0.88rem; line-height: 1.6; border-top: 1px solid var(--card-border);">
            ${activePlan.hydration_recommendations.map(h => `<div>${ensureBullet(h)}</div>`).join('')}
          </div>
        </details>
      `;
    }

    recomContainer.innerHTML = sectionsHtml;
  }
}

// B. ENTRENAMIENTO / RUTINAS
function renderWorkoutView() {
  const planSelector = document.getElementById('routinePlanSelector');
  const daySelector = document.getElementById('routineDaySelector');
  const weekSelector = document.getElementById('weekSelector');
  const techniqueBox = document.getElementById('techniqueBox');

  if (!state.workoutData || state.workoutData.length === 0) return;

  if (planSelector.children.length === 0) {
    planSelector.innerHTML = state.workoutData.map((plan, idx) => `
      <option value="${idx}">${idx === 0 ? '⭐ [MÁS RECIENTE] ' : ''}${plan.technique_title || 'Plan ' + (idx + 1)}</option>
    `).join('');

    planSelector.value = state.selectedPlanIndex;
    planSelector.onchange = (e) => {
      state.selectedPlanIndex = parseInt(e.target.value);
      state.selectedRoutineIndex = 0;
      renderWorkoutView();
    };
  }

  const activePlan = state.workoutData[state.selectedPlanIndex] || state.workoutData[0];

  techniqueBox.innerHTML = `
    <div style="font-weight: 700; color: var(--accent-color); margin-bottom: 4px;">
      💡 Técnica Activa: ${activePlan.technique_title || 'BISERIES'}
    </div>
    <div style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.5;">
      ${activePlan.technique_description || 'Ejecutar repeticiones con tempo controlado respetando pausas de descanso.'}
    </div>
  `;

  if (weekSelector) {
    weekSelector.value = state.currentWeek;
    weekSelector.onchange = (e) => {
      state.currentWeek = parseInt(e.target.value);
      renderWorkoutView();
    };
  }

  const daysList = activePlan.days || [];
  daySelector.innerHTML = daysList.map((d, idx) => `
    <option value="${idx}">${d.day_name}</option>
  `).join('');

  daySelector.value = state.selectedRoutineIndex;

  daySelector.onchange = (e) => {
    state.selectedRoutineIndex = parseInt(e.target.value);
    renderSubblocks(daysList[state.selectedRoutineIndex]?.biseries || [], activePlan.technique_title);
  };
  
  renderCardioBlock(activePlan.cardio_schedule);
  renderAbdomenTable(activePlan.abdomen_table || []);
  renderSubblocks(daysList[state.selectedRoutineIndex]?.biseries || [], activePlan.technique_title);
}

function renderCardioBlock(cardioSchedule) {
  const container = document.getElementById('cardioContainer');
  if (!container) return;
  if (!cardioSchedule) {
    container.innerHTML = '';
    return;
  }
  container.innerHTML = `
    <div style="background: var(--input-bg); border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 8px; margin-top: 14px;">
      <div style="font-weight: 700; color: #f59e0b; margin-bottom: 4px;">🏃 BLOQUE CARDIOVASCULAR (L - M - X - J - V)</div>
      <div style="font-size: 0.88rem; line-height: 1.5;">${cardioSchedule}</div>
    </div>
  `;
}

function renderAbdomenTable(abdList) {
  const container = document.getElementById('abdomenContainer');
  if (!container) return;
  if (!abdList || abdList.length === 0) {
    container.innerHTML = '';
    return;
  }

  const abdomenTableRows = abdList.map(ex => {
    const wData = ex.weeks ? (ex.weeks.find(w => w.week === state.currentWeek) || ex.weeks[0]) : { reps: 10 };
    const ytId = getYouTubeVideoId(ex.video_url);

    return `
      <tr>
        <td><strong>${ex.name}</strong></td>
        <td>${wData.tempo || '2,1,2'}</td>
        <td>${wData.sets || 3}</td>
        <td>${wData.reps} reps</td>
        <td>
          ${ytId ? `
            <a href="${ex.video_url}" target="_blank" style="display: inline-flex; align-items: center; gap: 6px; text-decoration: none; color: var(--accent-color); font-weight: 600;" title="Ver video">
              <img src="https://img.youtube.com/vi/${ytId}/mqdefault.jpg" style="width: 50px; height: 32px; border-radius: 4px; object-fit: cover;">
            </a>
          ` : '--'}
        </td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div class="card" style="background: var(--input-bg); border: 1px solid var(--card-border);">
      <div class="card-title" style="font-size: 0.95rem; color: #ec4899;">
        🧘 TABLA ESTRUCTURADA DE ABDOMEN (Semana ${state.currentWeek})
      </div>
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Ejercicio</th>
              <th>Tempo</th>
              <th>Sets</th>
              <th>Objetivo Reps</th>
              <th>Video Demostración</th>
            </tr>
          </thead>
          <tbody>
            ${abdomenTableRows}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderSubblocks(biseriesList, techniqueTitle) {
  const container = document.getElementById('exercisesContainer');
  if (!biseriesList || biseriesList.length === 0) return;

  container.innerHTML = biseriesList.map((block, bIdx) => {
    const isEven = bIdx % 2 === 0;
    const blockBg = isEven ? 'rgba(0, 230, 118, 0.04)' : 'rgba(147, 51, 234, 0.04)';
    const blockBorder = isEven ? 'rgba(0, 230, 118, 0.3)' : 'rgba(147, 51, 234, 0.3)';

    const exCardsHtml = block.exercises.map(ex => {
      const weekData = ex.weeks.find(w => w.week === state.currentWeek) || ex.weeks[0] || { sets: 3, reps: 12, tempo: '2,1,2' };
      const svgHtml = renderMuscleSVG(ex.muscle_group || ex.name);
      const ytId = getYouTubeVideoId(ex.video_url);

      const logKey = `${ex.name}_w${state.currentWeek}`;
      const savedLog = state.userLogs[logKey] || {};
      const savedWeight = savedLog.weight || '';
      const inputId = `w_input_${bIdx}_${ex.name.replace(/[^a-zA-Z0-9]/g, '_')}_w${state.currentWeek}`;

      const sessionInputHtml = `
        <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 4px;">
            <span style="font-size: 0.82rem; font-weight: 600; color: var(--accent-color);">⚖️ Carga Realizada:</span>
            <input type="number" step="0.5" min="0" placeholder="0" value="${savedWeight}" id="${inputId}" data-key="${logKey}" class="weight-input" style="width: 65px; padding: 4px 6px; border-radius: 6px; border: 1px solid var(--card-border); background: var(--input-bg); color: var(--text-color); font-weight: 700; text-align: center;">
            <span style="font-size: 0.82rem; font-weight: 600;">kg</span>
          </div>
          <button class="btn save-weight-btn" data-key="${logKey}" data-input-id="${inputId}" data-reps="${weekData.reps}" style="padding: 4px 10px; font-size: 0.78rem; background: ${savedWeight ? '#10b981' : 'var(--accent-color)'}; color: ${savedWeight ? '#ffffff' : '#000000'}; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px;">
            ${savedWeight ? `✓ Registrado (${savedWeight} kg)` : '💾 Registrar Peso'}
          </button>
        </div>
      `;

      const videoThumbHtml = ytId ? `
        <a href="${ex.video_url}" target="_blank" class="video-thumbnail-box" title="Ver video">
          <img src="https://img.youtube.com/vi/${ytId}/hqdefault.jpg" alt="${ex.name}">
        </a>
      ` : `<div class="video-thumbnail-box">${svgHtml}</div>`;

      return `
        <div class="exercise-card" data-exname="${ex.name}">
          <div class="exercise-svg-container">
            ${svgHtml}
          </div>
          <div class="exercise-info">
            <div class="exercise-title">${ex.name}</div>
            <div class="exercise-meta">
              <span>⏱ Tempo: ${weekData.tempo}</span>
              <span>🎯 Repeticiones Fijadas (Semana ${state.currentWeek}): <strong>${weekData.sets} series × ${weekData.reps} reps</strong></span>
            </div>
            ${sessionInputHtml}
          </div>
          ${videoThumbHtml}
        </div>
      `;
    }).join('');

    const titleText = techniqueTitle ? `⚡ ${techniqueTitle.toUpperCase()} &bull; BISERIE #${block.biserie_id || (bIdx + 1)}` : `⚡ SUB-BLOQUE DE BISERIE #${block.biserie_id || (bIdx + 1)}`;

    return `
      <div class="biseries-block" style="background: ${blockBg}; border: 1px solid ${blockBorder}; margin-bottom: 16px; padding: 14px; border-radius: 8px;">
        <div class="biseries-header" style="font-weight: 700; color: var(--accent-color); margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
          <span>${titleText}</span>
          <span style="font-size: 0.8rem; opacity: 0.8; font-weight: normal;">Circuito Continuo (${block.exercises.length} Ejercicios)</span>
        </div>
        ${exCardsHtml}
        ${(block.note || block.rest_instructions) ? `
          <div style="font-size: 0.82rem; color: var(--text-muted); background: var(--card-bg); padding: 8px 12px; border-radius: 6px; margin-top: 10px;">
            💡 ${block.note || block.rest_instructions}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  // Event Listeners para el botón Guardar Peso y el input de Peso
  document.querySelectorAll('.save-weight-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const button = e.currentTarget;
      const key = button.getAttribute('data-key');
      const inputId = button.getAttribute('data-input-id');
      const fixedReps = button.getAttribute('data-reps');
      const input = document.getElementById(inputId);
      
      if (input) {
        const val = input.value.trim();
        if (val === '') return;
        if (!state.userLogs[key]) state.userLogs[key] = {};
        state.userLogs[key].weight = val;
        state.userLogs[key].reps = fixedReps;
        state.userLogs[key].timestamp = new Date().toISOString();
        localStorage.setItem('fitapp_user_logs', JSON.stringify(state.userLogs));
        
        button.style.background = '#10b981';
        button.style.color = '#ffffff';
        button.innerHTML = `✓ Registrado (${val} kg)`;

        if (typeof renderProgressView === 'function') {
          renderProgressView();
        }
      }
    });
  });

  document.querySelectorAll('.weight-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const key = e.target.getAttribute('data-key');
      const val = e.target.value.trim();
      const btn = document.querySelector(`.save-weight-btn[data-key="${key}"]`);
      if (val !== '') {
        if (!state.userLogs[key]) state.userLogs[key] = {};
        state.userLogs[key].weight = val;
        localStorage.setItem('fitapp_user_logs', JSON.stringify(state.userLogs));
        if (btn) {
          btn.style.background = '#10b981';
          btn.style.color = '#ffffff';
          btn.innerHTML = `✓ Registrado (${val} kg)`;
        }
      }
    });
  });
}

function openExerciseModal(ex) {
  const modal = document.getElementById('exerciseModal');
  const title = document.getElementById('modalExerciseTitle');
  const body = document.getElementById('modalExerciseBody');
  title.innerText = ex.name;
  const weekData = ex.weeks.find(w => w.week === state.currentWeek) || ex.weeks[0];
  const ytId = getYouTubeVideoId(ex.video_url);

  body.innerHTML = `
    <div style="font-size: 0.9rem; margin-bottom: 12px;">
      <div><strong>Tempo:</strong> ${weekData.tempo}</div>
      <div><strong>Series:</strong> ${weekData.sets}</div>
      <div><strong>Repeticiones:</strong> ${weekData.reps}</div>
    </div>
    ${ytId ? `<div style="text-align:center;"><iframe width="100%" height="200" src="https://www.youtube.com/embed/${ytId}" frameborder="0" allowfullscreen></iframe></div>` : ''}
  `;
  modal.style.display = 'flex';
}

// C. EQUIVALENTES
function renderEquivalentsView() {
  const categoryContainer = document.getElementById('categoryTablesContainer');
  const searchInput = document.getElementById('foodSearchInput');
  const calcResults = document.getElementById('calcResults');

  if (state.equivalentsData && Object.keys(state.equivalentsData).length > 0) {
    const categories = Object.keys(state.equivalentsData);

    const categoryIcons = {
      'FRUTAS': '🍎',
      'VERDURAS': '🥦',
      'CEREALES SIN GRASA': '🌾',
      'CEREALES CON GRASA': '🥐',
      'LEGUMINOSAS': '🫘',
      'ALIMENTOS DE ORIGEN ANIMAL (AOA)': '🥩',
      'LÁCTEOS': '🥛',
      'ACEITES Y GRASAS': '🥑',
      'AZÚCAR SIN GRASA': '🍬',
      'AZÚCAR CON GRASA': '🍩',
      'LIBRES DE ENERGÍA': '💧'
    };

    categoryContainer.innerHTML = `
      <div class="equivalents-grid" style="display: flex; flex-direction: column; gap: 12px;">
        ${categories.map(cat => {
          const items = state.equivalentsData[cat] || [];
          const icon = categoryIcons[cat] || '🥗';

          return `
            <details class="card eq-category-card" style="margin-bottom: 0;">
              <summary class="card-title eq-category-title" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; margin: -16px; background: var(--input-bg); border-radius: 8px;">
                <span style="font-weight: 700; color: var(--accent-color); font-size: 1rem;">${icon} ${cat}</span>
                <span style="font-size: 0.8rem; background: var(--card-border); padding: 2px 10px; border-radius: 12px; color: var(--text-color);">${items.length} alimentos</span>
              </summary>
              <div class="table-responsive" style="margin-top: 20px;">
                <table>
                  <thead>
                    <tr>
                      <th>Alimento</th>
                      <th style="width: 140px; text-align: right;">Cantidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${items.map(i => `
                      <tr>
                        <td><strong>${i.name}</strong></td>
                        <td style="text-align: right; color: var(--accent-color); font-weight: 600;">${i.portion}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </details>
          `;
        }).join('')}
      </div>
    `;
  }

  // Calculadora de Intercambio
  const allItems = [];
  Object.keys(state.equivalentsData).forEach(cat => {
    (state.equivalentsData[cat] || []).forEach(item => {
      allItems.push({ ...item, category: cat });
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      if (!query) {
        calcResults.innerHTML = '<p style="font-size: 0.85rem; color: var(--text-muted);">Escribe un alimento para ver sus alternativas equivalentes.</p>';
        return;
      }

      const matches = allItems.filter(i => i.name.toLowerCase().includes(query));
      if (matches.length === 0) {
        calcResults.innerHTML = '<p style="font-size: 0.85rem; color: var(--text-muted);">No se encontraron alimentos con ese nombre.</p>';
        return;
      }

      const targetCategory = matches[0].category;
      const sameCategoryItems = allItems.filter(i => i.category === targetCategory);

      calcResults.innerHTML = `
        <div style="margin-bottom: 12px; font-weight: 700; color: var(--accent-color);">
          Alternativas Equivalentes (Categoría: ${targetCategory}):
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px;">
          ${sameCategoryItems.slice(0, 15).map(item => `
            <div style="background: var(--input-bg); padding: 10px; border-radius: 8px; border: 1px solid var(--card-border);">
              <div style="font-weight: 600; font-size: 0.88rem;">${item.name}</div>
              <div style="font-size: 0.8rem; color: var(--accent-color);">Porción Eq: ${item.portion}</div>
            </div>
          `).join('')}
        </div>
      `;
    });
  }

  // Guardado de Insumos Personalizados
  const addBtn = document.getElementById('addCustomFoodBtn');
  const nameInput = document.getElementById('customFoodName');
  const catInput = document.getElementById('customFoodCategory');
  const portionInput = document.getElementById('customFoodPortion');

  if (addBtn) {
    addBtn.onclick = () => {
      const name = nameInput ? nameInput.value.trim() : '';
      const cat = catInput ? catInput.value : 'LIBRES DE ENERGÍA';
      const portion = portionInput ? portionInput.value.trim() : '';

      if (!name || !portion) {
        alert('Por favor escribe el nombre del alimento y su porción.');
        return;
      }

      const newFood = { name, portion, category: cat };
      state.customFoods.push(newFood);
      localStorage.setItem('fitapp_custom_foods', JSON.stringify(state.customFoods));

      if (!state.equivalentsData[cat]) state.equivalentsData[cat] = [];
      const formattedName = `⭐ [PERSONALIZADO] ${name}`;
      const exists = state.equivalentsData[cat].some(i => i.name === formattedName);
      if (!exists) {
        state.equivalentsData[cat].unshift({ name: formattedName, portion });
      }

      alert(`✅ Insumo "${name}" agregado correctamente a tu lista.`);
      if (nameInput) nameInput.value = '';
      if (portionInput) portionInput.value = '';

      renderEquivalentsView();
    };
  }
}

// PALETA DE COLORES POR EVALUACIÓN
const EVAL_COLORS = [
  '#ef4444', // Eval I: Rojo
  '#f97316', // Eval II: Naranja
  '#f59e0b', // Eval III: Ámbar
  '#84cc16', // Eval IV: Lima
  '#10b981', // Eval V: Esmeralda
  '#06b6d4', // Eval VI: Cian
  '#0284c7', // Eval VII: Azul Cielo
  '#3b82f6', // Eval VIII: Azul
  '#6366f1', // Eval IX: Índigo
  '#8b5cf6', // Eval X: Púrpura
  '#ec4899'  // Eval XI: Rosa (Más reciente)
];

// Estado local de sesiones seleccionadas para el comparador dinámico
let selectedEvalIndices = null; // Por defecto: Últimas 2 sesiones
let currentYearFilter = 'ALL';

// D. PROGRESIÓN FÍSICA Y FUERZA
function renderProgressView() {
  const container = document.getElementById('progressSummary');
  const strengthSelector = document.getElementById('strengthExerciseSelector');
  const strengthContainer = document.getElementById('strengthProgressContainer');
  const sessionSelector = document.getElementById('phantomSessionSelectorContainer');

  if (!state.resultsData || state.resultsData.length === 0) return;

  const list = state.resultsData;
  const latest = list[list.length - 1];

  // Si no se han seleccionado evaluaciones localmente, seleccionar por defecto Primera vs Última (1 y list.length)
  if (!selectedEvalIndices) {
    selectedEvalIndices = list.length >= 2 ? [1, list.length] : list.map(r => r.eval_index);
  }

  // 1. Filtrado por año para la tabla de composición corporal
  let filteredList = [...list];
  if (currentYearFilter === '2026') {
    filteredList = list.filter(r => r.fecha.endsWith('/2026'));
  } else if (currentYearFilter === '2025') {
    filteredList = list.filter(r => r.fecha.endsWith('/2025'));
  }
  const reversedFilteredList = [...filteredList].reverse();

  // Renderizar tarjetas resumen y tabla con filtros
  container.innerHTML = `
    <!-- Tarjetas Métricas Clave (Última Evaluación) -->
    <div style="margin-bottom: 20px;">
      <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px;">
        📊 Estado Actual &mdash; <strong>${latest.eval_label} (${latest.fecha})</strong>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px;">
        <div style="background: var(--input-bg); padding: 12px; border-radius: 8px; border: 1px solid var(--card-border); text-align: center;">
          <div style="font-size: 0.78rem; color: var(--text-muted);">PESO ACTUAL</div>
          <div style="font-size: 1.25rem; font-weight: 700; color: var(--accent-color);">${latest.peso_kg} kg</div>
        </div>
        <div style="background: var(--input-bg); padding: 12px; border-radius: 8px; border: 1px solid var(--card-border); text-align: center;">
          <div style="font-size: 0.78rem; color: var(--text-muted);">MASA MAGRA</div>
          <div style="font-size: 1.25rem; font-weight: 700; color: #10b981;">${latest.masa_magra_kg} kg</div>
        </div>
        <div style="background: var(--input-bg); padding: 12px; border-radius: 8px; border: 1px solid var(--card-border); text-align: center;">
          <div style="font-size: 0.78rem; color: var(--text-muted);">% GRASA</div>
          <div style="font-size: 1.25rem; font-weight: 700; color: #f59e0b;">${latest.pct_grasa}% (${latest.grasa_kg}kg)</div>
        </div>
        <div style="background: var(--input-bg); padding: 12px; border-radius: 8px; border: 1px solid var(--card-border); text-align: center;">
          <div style="font-size: 0.78rem; color: var(--text-muted);">% MÚSCULO</div>
          <div style="font-size: 1.25rem; font-weight: 700; color: #ec4899;">${latest.pct_musculo}% (${latest.masa_muscular_kg}kg)</div>
        </div>
        <div style="background: var(--input-bg); padding: 12px; border-radius: 8px; border: 1px solid var(--card-border); text-align: center;">
          <div style="font-size: 0.78rem; color: var(--text-muted);">IMC</div>
          <div style="font-size: 1.25rem; font-weight: 700; color: #3b82f6;">${latest.imc}</div>
        </div>
        <div style="background: var(--input-bg); padding: 12px; border-radius: 8px; border: 1px solid var(--card-border); text-align: center;">
          <div style="font-size: 0.78rem; color: var(--text-muted);">ICC</div>
          <div style="font-size: 1.25rem; font-weight: 700; color: #8b5cf6;">${latest.icc}</div>
        </div>
      </div>
    </div>

    <!-- Tabla Comparativa Completa de Evaluaciones -->
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 10px;">
      <div class="card-title" style="font-size: 0.95rem; margin-bottom: 0;">
        📈 Histórico de Mediciones (${filteredList.length} de ${list.length} Evaluaciones &bull; Más Reciente Arriba)
      </div>
    </div>
    <div class="table-responsive" style="margin-bottom: 20px;">
      <table>
        <thead>
          <tr>
            <th>Evaluación</th>
            <th>Fecha</th>
            <th>Peso (kg)</th>
            <th>Masa Magra</th>
            <th>Grasa (kg)</th>
            <th>% Grasa</th>
            <th>Masa Músculo</th>
            <th>% Músculo</th>
            <th>IMC</th>
            <th>ICC</th>
          </tr>
        </thead>
        <tbody>
          ${reversedFilteredList.map(r => `
            <tr style="${r.eval_index === list.length ? 'background: rgba(0, 230, 118, 0.08); font-weight: 600;' : ''}">
              <td>
                <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${EVAL_COLORS[(r.eval_index - 1) % EVAL_COLORS.length]}; margin-right: 6px;"></span>
                <strong>${r.eval_label} ${r.eval_index === list.length ? '⭐ (Más reciente)' : ''}</strong>
              </td>
              <td>${r.fecha}</td>
              <td><strong>${r.peso_kg} kg</strong></td>
              <td style="color: #10b981;">${r.masa_magra_kg} kg</td>
              <td>${r.grasa_kg} kg</td>
              <td style="color: #f59e0b;">${r.pct_grasa}%</td>
              <td>${r.masa_muscular_kg} kg</td>
              <td style="color: #ec4899;">${r.pct_musculo}%</td>
              <td>${r.imc}</td>
              <td>${r.icc}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Selector para Inspeccionar Reporte Médico Individual -->
    <details class="card" style="background: var(--input-bg); border: 1px solid var(--card-border); margin-top: 14px;">
      <summary class="card-title" style="cursor: pointer;">
        🔍 Inspeccionar Desglose Médico Detallado por Evaluación
      </summary>
      <div style="margin-top: 14px;">
        <label style="font-size: 0.85rem; color: var(--text-muted); display: block; margin-bottom: 6px;">Seleccionar Reporte:</label>
        <select id="evalReportSelector" style="margin-bottom: 14px;">
          ${reversedFilteredList.map(r => `<option value="${r.eval_index - 1}">${r.eval_label} (${r.fecha})</option>`).join('')}
        </select>
        <div id="evalDetailContent"></div>
      </div>
    </details>
  `;

  // Configurar botones de filtro por año
  document.querySelectorAll('.filter-year-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.filter-year-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentYearFilter = btn.getAttribute('data-year');
      renderProgressView();
    };
  });

  const reportSelector = document.getElementById('evalReportSelector');
  const detailContent = document.getElementById('evalDetailContent');
  if (reportSelector && detailContent) {
    const renderDetail = (idx) => {
      const item = list[idx];
      detailContent.innerHTML = `
        <div style="background: var(--card-bg); padding: 14px; border-radius: 8px; border: 1px solid var(--card-border);">
          <div style="font-weight: 700; color: var(--accent-color); margin-bottom: 10px;">
            📋 Reporte de Composición Corporal &bull; ${item.eval_label} (${item.fecha}) &bull; Edad: ${item.edad} años
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; font-size: 0.88rem;">
            <div>🔹 Masa Ósea: <strong>${item.masa_osea_kg} kg</strong></div>
            <div>🔹 Masa Residual: <strong>${item.masa_residual_kg} kg</strong></div>
            <div>🔹 Masa Piel: <strong>${item.masa_piel_kg} kg</strong></div>
            <div>🔹 Disminuir Grasa (Obj): <strong>${item.disminuir_grasa_kg} kg</strong></div>
            <div>🔹 Aumentar Músculo (Obj): <strong>${item.aumentar_musculo_kg} kg</strong></div>
            <div>🔹 Peso Ideal Estimado: <strong>${item.peso_ideal_kg} kg</strong></div>
            ${item.somatotype ? `<div>🔹 Somatotipo: <strong>Endo ${item.somatotype.endo} &bull; Meso ${item.somatotype.meso} &bull; Ecto ${item.somatotype.ecto}</strong></div>` : ''}
          </div>
        </div>
      `;
    };
    reportSelector.onchange = (e) => renderDetail(parseInt(e.target.value));
    renderDetail(list.length - 1);
  }

  // 2. Renderizar selector dinámico de sesiones para gráficas Phantom y Somatocarta
  if (sessionSelector) {
    sessionSelector.innerHTML = list.map(item => {
      const isChecked = selectedEvalIndices.includes(item.eval_index);
      const color = EVAL_COLORS[(item.eval_index - 1) % EVAL_COLORS.length];
      return `
        <label style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; background: var(--card-bg); border-radius: 20px; border: 1.5px solid ${isChecked ? color : 'var(--card-border)'}; font-size: 0.82rem; cursor: pointer; user-select: none;">
          <input type="checkbox" class="session-eval-checkbox" data-idx="${item.eval_index}" ${isChecked ? 'checked' : ''} style="accent-color: ${color};">
          <span style="width: 10px; height: 10px; border-radius: 50%; background: ${color}; display: inline-block;"></span>
          <strong>${item.eval_label}</strong> (${item.fecha.slice(0, 5)})
        </label>
      `;
    }).join('');

    document.querySelectorAll('.session-eval-checkbox').forEach(chk => {
      chk.onchange = () => {
        const idx = parseInt(chk.getAttribute('data-idx'));
        if (chk.checked) {
          if (!selectedEvalIndices.includes(idx)) selectedEvalIndices.push(idx);
        } else {
          selectedEvalIndices = selectedEvalIndices.filter(i => i !== idx);
        }
        selectedEvalIndices.sort((a, b) => a - b);
        updateAllPhantomCharts();
      };
    });

    // Preset buttons
    const btnLatest2 = document.getElementById('presetCompareLatest2');
    const btnLatestVsFirst = document.getElementById('presetCompareLatestVsFirst');
    const btn2026 = document.getElementById('presetCompare2026');
    const btnSelectAll = document.getElementById('presetSelectAll');
    const btnClearAll = document.getElementById('presetClearAll');

    if (btnLatest2) btnLatest2.onclick = () => { selectedEvalIndices = list.length >= 2 ? [list.length - 1, list.length] : list.map(r => r.eval_index); renderProgressView(); updateAllPhantomCharts(); };
    if (btnLatestVsFirst) btnLatestVsFirst.onclick = () => { selectedEvalIndices = [1, list.length]; renderProgressView(); updateAllPhantomCharts(); };
    if (btn2026) btn2026.onclick = () => { selectedEvalIndices = list.filter(r => r.fecha.endsWith('/2026')).map(r => r.eval_index); renderProgressView(); updateAllPhantomCharts(); };
    if (btnSelectAll) btnSelectAll.onclick = () => { selectedEvalIndices = list.map(r => r.eval_index); renderProgressView(); updateAllPhantomCharts(); };
    if (btnClearAll) btnClearAll.onclick = () => { selectedEvalIndices = []; renderProgressView(); updateAllPhantomCharts(); };
  }

  // 3. Renderizar las tres gráficas interactivas
  updateAllPhantomCharts();

  // 4. Cargar todos los ejercicios disponibles de todas las rutinas registradas
  const allExerciseNames = new Set();
  if (state.workoutData && Array.isArray(state.workoutData)) {
    state.workoutData.forEach(plan => {
      (plan.days || []).forEach(day => {
        (day.biseries || []).forEach(block => {
          (block.exercises || []).forEach(ex => {
            if (ex && ex.name && ex.name.trim().length > 0) {
              allExerciseNames.add(ex.name.trim());
            }
          });
        });
      });
    });
  }

  const exerciseList = Array.from(allExerciseNames).sort((a, b) => a.localeCompare(b, 'es'));

  if (exerciseList.length > 0 && strengthSelector && strengthContainer) {
    strengthSelector.innerHTML = `
      <option value="">-- Seleccionar Ejercicio (${exerciseList.length} disponibles) --</option>
      ${exerciseList.map(name => `<option value="${name.replace(/"/g, '&quot;')}">${name}</option>`).join('')}
    `;

    const renderStrengthHistory = (exName) => {
      if (!exName) {
        strengthContainer.innerHTML = '<p style="font-size: 0.85rem; color: var(--text-muted);">Selecciona un ejercicio para ver el historial de cargas por semana.</p>';
        return;
      }

      let hasLogs = false;
      const weeksHtml = [1, 2, 3, 4].map(w => {
        const logKey = `${exName}_w${w}`;
        const log = state.userLogs[logKey];
        if (log && log.weight) hasLogs = true;
        
        return `
          <tr>
            <td><strong>Semana ${w}</strong></td>
            <td>${log && log.reps ? log.reps + ' reps' : 'Según plan'}</td>
            <td style="color: ${log && log.weight ? '#10b981' : 'var(--text-muted)'}; font-weight: 700;">
              ${log && log.weight ? log.weight + ' kg' : '--'}
            </td>
            <td>
              ${log && log.weight ? '<span style="color: #10b981; font-weight: 600;">✓ Registrado</span>' : '<span style="color: var(--text-muted);">Pendiente</span>'}
            </td>
          </tr>
        `;
      }).join('');

      strengthContainer.innerHTML = `
        <div style="background: var(--input-bg); padding: 16px; border-radius: 8px; border: 1px solid var(--card-border);">
          <div style="font-weight: 700; color: var(--accent-color); margin-bottom: 12px; font-size: 0.95rem;">
            🏋️ Desglose de Cargas por Semana &bull; ${exName}
          </div>
          <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Semana</th>
                  <th>Repeticiones Fijadas</th>
                  <th>Carga Registrada</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                ${weeksHtml}
              </tbody>
            </table>
          </div>
          ${!hasLogs ? `
            <div style="margin-top: 10px; font-size: 0.82rem; color: var(--text-muted); text-align: center;">
              💡 No has registrado peso para este ejercicio aún. Puedes escribir tu carga en la pestaña de <strong>Gimnasio</strong>.
            </div>
          ` : ''}
        </div>
      `;
    };

    strengthSelector.onchange = (e) => renderStrengthHistory(e.target.value);
    if (exerciseList.length > 0) {
      strengthSelector.value = exerciseList[0];
      renderStrengthHistory(exerciseList[0]);
    }
  }
}

function updateAllPhantomCharts() {
  const selectedItems = (state.resultsData || []).filter(item => selectedEvalIndices.includes(item.eval_index));
  renderSomatocartaSVG(selectedItems);
  renderPhantomGirthsSVG(selectedItems);
  renderPhantomSkinfoldsSVG(selectedItems);
}

const STROKE_PATTERNS = ['none', '7,4', '2,4', '10,3,2,3', '14,4', '4,2,2,2'];

function renderChartLegendHTML(selectedItems) {
  if (!selectedItems || selectedItems.length === 0) return '';
  return `
    <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-bottom: 12px; font-size: 0.8rem;">
      ${selectedItems.map((item, selIdx) => {
        const color = EVAL_COLORS[(item.eval_index - 1) % EVAL_COLORS.length];
        const dashPattern = STROKE_PATTERNS[selIdx % STROKE_PATTERNS.length];
        const strokeStyle = dashPattern === 'none' ? 'solid' : 'dashed';
        return `
          <span style="display: inline-flex; align-items: center; gap: 6px; background: var(--input-bg); padding: 4px 10px; border-radius: 16px; border: 1.5px solid ${color}; font-weight: 600; color: var(--text-main);">
            <span style="width: 16px; height: 0; border-top: 3px ${strokeStyle} ${color}; display: inline-block;"></span>
            <span style="width: 8px; height: 8px; border-radius: 50%; background: ${color}; display: inline-block;"></span>
            ${item.eval_label} (${item.fecha})
          </span>
        `;
      }).join('')}
    </div>
  `;
}

// RENDERIZADOR SVG: DIAGRAMA TRIANGULADO DE SOMATOTIPO (3 EJES: MESO, ENDO, ECTO)
function renderSomatocartaSVG(selectedItems) {
  const container = document.getElementById('somatocartaChartContainer');
  if (!container) return;

  if (!selectedItems || selectedItems.length === 0) {
    container.innerHTML = '<p style="font-size: 0.85rem; color: var(--text-muted); padding: 16px; text-align: center;">Selecciona al menos una evaluación arriba para ver el gráfico de Somatotipo.</p>';
    return;
  }

  const w = 520, h = 460;
  const cx = 260, cy = 220;
  const maxVal = 5.0;
  const rMax = 160; // radio para valor 5.0
  const pxPerUnit = rMax / maxVal; // 32 px per unit

  // Ángulos para los 3 ejes (Mesomorfia arriba, Endomorfia abajo-izq, Ectomorfia abajo-der)
  // Meso: -90 deg, Endo: 150 deg, Ecto: 30 deg (en coordenadas matemáticas donde Y sube)
  // En SVG (donde Y baja):
  // Meso (arriba): (cx, cy - r)
  // Endo (abajo-izq): (cx - r * cos(30°), cy + r * sin(30°))
  // Ecto (abajo-der): (cx + r * cos(30°), cy + r * sin(30°))
  const cos30 = 0.8660254;
  const sin30 = 0.5;

  const getMesoPt = (v) => ({ x: cx, y: cy - v * pxPerUnit });
  const getEndoPt = (v) => ({ x: cx - (v * pxPerUnit) * cos30, y: cy + (v * pxPerUnit) * sin30 });
  const getEctoPt = (v) => ({ x: cx + (v * pxPerUnit) * cos30, y: cy + (v * pxPerUnit) * sin30 });

  // Triángulos concéntricos de la cuadrícula (Niveles 1.0 a 5.0)
  const gridLevels = [1.0, 2.0, 3.0, 4.0, 5.0];

  container.innerHTML = `
    ${renderChartLegendHTML(selectedItems)}
    <div style="overflow-x: auto; text-align: center;">
      <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="background: var(--input-bg); border-radius: 8px; border: 1px solid var(--card-border); max-width: 100%;">
        
        <!-- Cuadrícula Triangular Concéntrica (Niveles 1 a 5) -->
        ${gridLevels.map(lvl => {
          const m = getMesoPt(lvl);
          const en = getEndoPt(lvl);
          const ec = getEctoPt(lvl);
          return `
            <polygon points="${m.x},${m.y} ${en.x},${en.y} ${ec.x},${ec.y}" fill="none" stroke="var(--card-border)" stroke-width="1.2" stroke-dasharray="3,3" opacity="0.6"/>
            <text x="${m.x - 14}" y="${m.y + 4}" fill="var(--text-muted)" font-size="10" font-weight="600" text-anchor="end">${lvl.toFixed(1)}</text>
          `;
        }).join('')}

        <!-- Ejes Principales desde el Centro (0.0) -->
        ${(() => {
          const mMax = getMesoPt(maxVal);
          const enMax = getEndoPt(maxVal);
          const ecMax = getEctoPt(maxVal);
          return `
            <line x1="${cx}" y1="${cy}" x2="${mMax.x}" y2="${mMax.y}" stroke="var(--card-border)" stroke-width="1.5"/>
            <line x1="${cx}" y1="${cy}" x2="${enMax.x}" y2="${enMax.y}" stroke="var(--card-border)" stroke-width="1.5"/>
            <line x1="${cx}" y1="${cy}" x2="${ecMax.x}" y2="${ecMax.y}" stroke="var(--card-border)" stroke-width="1.5"/>
          `;
        })()}

        <!-- Valor Central 0.0 -->
        <text x="${cx - 14}" y="${cy + 4}" fill="var(--text-muted)" font-size="10" font-weight="600" text-anchor="end">0.0</text>

        <!-- Titulares y Etiquetas de los 3 Ejes -->
        <text x="${cx}" y="${cy - rMax - 18}" fill="#ec4899" font-size="13" font-weight="800" text-anchor="middle">MESOMORFIA (Músculo)</text>
        <text x="${cx - (rMax * cos30) - 20}" y="${cy + (rMax * sin30) + 24}" fill="#f59e0b" font-size="13" font-weight="800" text-anchor="middle">ENDOMORFIA (Grasa)</text>
        <text x="${cx + (rMax * cos30) + 20}" y="${cy + (rMax * sin30) + 24}" fill="#3b82f6" font-size="13" font-weight="800" text-anchor="middle">ECTOMORFIA (Lineal)</text>

        <!-- Polígonos Triangulares de las Evaluaciones Seleccionadas -->
        ${selectedItems.map((item, selIdx) => {
          const s = item.somatotype || { endo: 0, meso: 0, ecto: 0 };
          const color = EVAL_COLORS[(item.eval_index - 1) % EVAL_COLORS.length];
          const dashPattern = STROKE_PATTERNS[selIdx % STROKE_PATTERNS.length];
          const dashAttr = dashPattern !== 'none' ? `stroke-dasharray="${dashPattern}"` : '';

          const mPt = getMesoPt(s.meso);
          const enPt = getEndoPt(s.endo);
          const ecPt = getEctoPt(s.ecto);

          const polyPoints = `${mPt.x},${mPt.y} ${enPt.x},${enPt.y} ${ecPt.x},${ecPt.y}`;

          return `
            <g class="somato-tri-group" style="cursor: pointer;">
              <!-- Área Coloreada con Transparencia -->
              <polygon points="${polyPoints}" fill="${color}" fill-opacity="0.15" stroke="${color}" stroke-width="3" ${dashAttr} stroke-linejoin="round"/>
              
              <!-- Puntos de Vértice en Cada Eje -->
              <!-- Mesomorfia -->
              <circle cx="${mPt.x}" cy="${mPt.y}" r="5.5" fill="${color}" stroke="#ffffff" stroke-width="2">
                <title>${item.eval_label} (${item.fecha})\nMesomorfia: ${s.meso}</title>
              </circle>
              <!-- Endomorfia -->
              <circle cx="${enPt.x}" cy="${enPt.y}" r="5.5" fill="${color}" stroke="#ffffff" stroke-width="2">
                <title>${item.eval_label} (${item.fecha})\nEndomorfia: ${s.endo}</title>
              </circle>
              <!-- Ectomorfia -->
              <circle cx="${ecPt.x}" cy="${ecPt.y}" r="5.5" fill="${color}" stroke="#ffffff" stroke-width="2">
                <title>${item.eval_label} (${item.fecha})\nEctomorfia: ${s.ecto}</title>
              </circle>
            </g>
          `;
        }).join('')}

      </svg>
    </div>
    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 8px; text-align: center;">
      📍 Triángulo de Somatotipo formado por la escala (0.0 a 5.0) en los ejes <strong>Mesomorfia</strong>, <strong>Endomorfia</strong> y <strong>Ectomorfia</strong>.
    </div>
  `;
}

// RENDERIZADOR SVG: PHANTOM CIRCUNFERENCIAS
function renderPhantomGirthsSVG(selectedItems) {
  const container = document.getElementById('phantomGirthsChartContainer');
  if (!container) return;

  if (!selectedItems || selectedItems.length === 0) {
    container.innerHTML = '<p style="font-size: 0.85rem; color: var(--text-muted); padding: 16px; text-align: center;">Selecciona evaluaciones arriba para ver el gráfico Phantom de circunferencias.</p>';
    return;
  }

  const girthLabels = ['Cabeza', 'Brazo Rel.', 'Brazo Flex.', 'Antebrazo', 'Tórax', 'Cintura', 'Cadera'];
  const w = 560, h = 320;
  const paddingL = 90, paddingR = 30, paddingT = 40, paddingB = 50;

  const chartW = w - paddingL - paddingR;
  const chartH = h - paddingT - paddingB;

  // Escala Z de -3.0 a +3.0
  const zToY = (z) => paddingT + chartH / 2 - (z * (chartH / 6));

  container.innerHTML = `
    ${renderChartLegendHTML(selectedItems)}
    <div style="overflow-x: auto; text-align: center;">
      <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="background: var(--input-bg); border-radius: 8px; border: 1px solid var(--card-border); max-width: 100%;">
        <!-- Líneas Guía Z (-3 a +3) -->
        ${[-3, -2, -1, 0, 1, 2, 3].map(z => {
          const y = zToY(z);
          const isZero = z === 0;
          return `
            <line x1="${paddingL}" y1="${y}" x2="${w - paddingR}" y2="${y}" stroke="${isZero ? '#10b981' : 'var(--card-border)'}" stroke-width="${isZero ? '2' : '1'}" stroke-dasharray="${isZero ? 'none' : '3,3'}"/>
            <text x="${paddingL - 8}" y="${y + 4}" fill="${isZero ? '#10b981' : 'var(--text-muted)'}" font-size="10" font-weight="${isZero ? '700' : '400'}" text-anchor="end">${z > 0 ? '+' + z.toFixed(1) : z.toFixed(1)} Z</text>
          `;
        }).join('')}

        <!-- Columnas / Categorías de Circunferencias -->
        ${girthLabels.map((lbl, i) => {
          const x = paddingL + (i * (chartW / (girthLabels.length - 1)));
          return `
            <line x1="${x}" y1="${paddingT}" x2="${x}" y2="${h - paddingB}" stroke="var(--card-border)" stroke-width="1" opacity="0.4"/>
            <text x="${x}" y="${h - paddingB + 18}" fill="var(--text-main)" font-size="10" font-weight="600" text-anchor="middle">${lbl}</text>
          `;
        }).join('')}

        <!-- Trazado de Sesiones Seleccionadas -->
        ${selectedItems.map((item, selIdx) => {
          const color = EVAL_COLORS[(item.eval_index - 1) % EVAL_COLORS.length];
          const zScores = item.phantom_circunferencias || [];
          const dashPattern = STROKE_PATTERNS[selIdx % STROKE_PATTERNS.length];
          const dashAttr = dashPattern !== 'none' ? `stroke-dasharray="${dashPattern}"` : '';
          
          const pts = girthLabels.map((_, i) => {
            const x = paddingL + (i * (chartW / (girthLabels.length - 1)));
            const z = zScores[i] !== undefined ? zScores[i] : 0;
            return { x, y: zToY(z), z };
          });

          const pathD = pts.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');

          return `
            <g class="phantom-line-group" style="cursor: pointer;">
              <path d="${pathD}" fill="none" stroke="${color}" stroke-width="3.2" ${dashAttr} stroke-linecap="round" stroke-linejoin="round" opacity="1.0">
                <title>${item.eval_label} (${item.fecha})</title>
              </path>
              ${pts.map((p, i) => `
                <circle cx="${p.x}" cy="${p.y}" r="5.5" fill="${color}" stroke="#ffffff" stroke-width="2">
                  <title>${item.eval_label} (${item.fecha})\n${girthLabels[i]}: ${p.z > 0 ? '+' : ''}${p.z} Z</title>
                </circle>
              `).join('')}
            </g>
          `;
        }).join('')}
      </svg>
    </div>
  `;
}

// RENDERIZADOR SVG: PHANTOM PLIEGUES CUTÁNEOS
function renderPhantomSkinfoldsSVG(selectedItems) {
  const container = document.getElementById('phantomSkinfoldsChartContainer');
  if (!container) return;

  if (!selectedItems || selectedItems.length === 0) {
    container.innerHTML = '<p style="font-size: 0.85rem; color: var(--text-muted); padding: 16px; text-align: center;">Selecciona evaluaciones arriba para ver el gráfico Phantom de pliegues cutáneos.</p>';
    return;
  }

  const foldLabels = ['Tríceps', 'Subescapular', 'Bíceps', 'Cresta Ilíaca', 'Supraespinal', 'Abdominal', 'Muslo', 'Pantorrilla'];
  const w = 560, h = 320;
  const paddingL = 90, paddingR = 30, paddingT = 40, paddingB = 50;

  const chartW = w - paddingL - paddingR;
  const chartH = h - paddingT - paddingB;

  const zToY = (z) => paddingT + chartH / 2 - (z * (chartH / 6));

  container.innerHTML = `
    ${renderChartLegendHTML(selectedItems)}
    <div style="overflow-x: auto; text-align: center;">
      <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="background: var(--input-bg); border-radius: 8px; border: 1px solid var(--card-border); max-width: 100%;">
        <!-- Líneas Guía Z (-3 a +3) -->
        ${[-3, -2, -1, 0, 1, 2, 3].map(z => {
          const y = zToY(z);
          const isZero = z === 0;
          return `
            <line x1="${paddingL}" y1="${y}" x2="${w - paddingR}" y2="${y}" stroke="${isZero ? '#f59e0b' : 'var(--card-border)'}" stroke-width="${isZero ? '2' : '1'}" stroke-dasharray="${isZero ? 'none' : '3,3'}"/>
            <text x="${paddingL - 8}" y="${y + 4}" fill="${isZero ? '#f59e0b' : 'var(--text-muted)'}" font-size="10" font-weight="${isZero ? '700' : '400'}" text-anchor="end">${z > 0 ? '+' + z.toFixed(1) : z.toFixed(1)} Z</text>
          `;
        }).join('')}

        <!-- Columnas de Pliegues Cutáneos -->
        ${foldLabels.map((lbl, i) => {
          const x = paddingL + (i * (chartW / (foldLabels.length - 1)));
          return `
            <line x1="${x}" y1="${paddingT}" x2="${x}" y2="${h - paddingB}" stroke="var(--card-border)" stroke-width="1" opacity="0.4"/>
            <text x="${x}" y="${h - paddingB + 18}" fill="var(--text-main)" font-size="10" font-weight="600" text-anchor="middle">${lbl}</text>
          `;
        }).join('')}

        <!-- Trazado de Sesiones Seleccionadas -->
        ${selectedItems.map((item, selIdx) => {
          const color = EVAL_COLORS[(item.eval_index - 1) % EVAL_COLORS.length];
          const zScores = item.phantom_pliegues || [];
          const dashPattern = STROKE_PATTERNS[selIdx % STROKE_PATTERNS.length];
          const dashAttr = dashPattern !== 'none' ? `stroke-dasharray="${dashPattern}"` : '';
          
          const pts = foldLabels.map((_, i) => {
            const x = paddingL + (i * (chartW / (foldLabels.length - 1)));
            const z = zScores[i * 2] !== undefined ? zScores[i * 2] : (zScores[i] !== undefined ? zScores[i] : 0);
            return { x, y: zToY(z), z };
          });

          const pathD = pts.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');

          return `
            <g class="phantom-line-group" style="cursor: pointer;">
              <path d="${pathD}" fill="none" stroke="${color}" stroke-width="3.2" ${dashAttr} stroke-linecap="round" stroke-linejoin="round" opacity="1.0">
                <title>${item.eval_label} (${item.fecha})</title>
              </path>
              ${pts.map((p, i) => `
                <circle cx="${p.x}" cy="${p.y}" r="5.5" fill="${color}" stroke="#ffffff" stroke-width="2">
                  <title>${item.eval_label} (${item.fecha})\n${foldLabels[i]}: ${p.z > 0 ? '+' : ''}${p.z} Z</title>
                </circle>
              `).join('')}
            </g>
          `;
        }).join('')}
      </svg>
    </div>
  `;
}

// E. SECCIÓN AGREGAR DATOS (EJERCICIOS E INSUMOS)
function initAddDataView() {
  const saveExBtn = document.getElementById('saveCustomExerciseBtn');
  const saveDataFoodBtn = document.getElementById('saveDataFoodBtn');

  if (saveExBtn) {
    saveExBtn.onclick = () => {
      const name = document.getElementById('addExName')?.value.trim();
      const muscle = document.getElementById('addExMuscle')?.value || 'Hombro';
      const technique = document.getElementById('addExTechnique')?.value || 'Rest Pause';
      const sets = parseInt(document.getElementById('addExSets')?.value) || 4;
      const reps = document.getElementById('addExReps')?.value.trim() || '10-12';
      const tempo = document.getElementById('addExTempo')?.value.trim() || '2,1,2';
      const video = document.getElementById('addExVideo')?.value.trim() || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

      if (!name) {
        alert('Por favor escribe el nombre del ejercicio.');
        return;
      }

      const newEx = {
        name: name,
        muscle_group: muscle,
        technique: technique,
        video_url: video,
        weeks: Array.from({length: 4}, (_, i) => ({
          week: i + 1,
          sets: sets,
          reps: reps,
          tempo: tempo
        }))
      };

      state.customExercises.push(newEx);
      localStorage.setItem('fitapp_custom_exercises', JSON.stringify(state.customExercises));

      // Agregar al plan de gimnasio activo de forma segura
      if (state.workoutData && state.workoutData[0]) {
        const plan = state.workoutData[0];
        if (!plan.days) plan.days = [{ day_name: 'Día 1: Personalizados', biseries: [{ biserie_id: 1, exercises: [] }] }];
        const day = plan.days[0];
        if (!day.biseries) day.biseries = [{ biserie_id: 1, exercises: [] }];
        if (!day.biseries[0].exercises) day.biseries[0].exercises = [];

        const exists = day.biseries[0].exercises.some(e => e.name === name);
        if (!exists) {
          day.biseries[0].exercises.push(newEx);
        }
      }

      alert(`✅ Ejercicio "${name}" registrado correctamente en el gimnasio.`);
      document.getElementById('addExName').value = '';

      renderAllViews();
    };
  }

  if (saveDataFoodBtn) {
    saveDataFoodBtn.onclick = () => {
      const name = document.getElementById('addDataFoodName')?.value.trim();
      const cat = document.getElementById('addDataFoodCategory')?.value || 'LIBRES DE ENERGÍA';
      const portion = document.getElementById('addDataFoodPortion')?.value.trim();

      if (!name || !portion) {
        alert('Por favor escribe el nombre del insumo y su porción.');
        return;
      }

      const newFood = { name, portion, category: cat };
      state.customFoods.push(newFood);
      localStorage.setItem('fitapp_custom_foods', JSON.stringify(state.customFoods));

      if (!state.equivalentsData[cat]) state.equivalentsData[cat] = [];
      const formattedName = `⭐ [PERSONALIZADO] ${name}`;
      const exists = state.equivalentsData[cat].some(i => i.name === formattedName);
      if (!exists) {
        state.equivalentsData[cat].unshift({ name: formattedName, portion });
      }

      alert(`✅ Insumo "${name}" agregado correctamente a la tabla de equivalentes.`);
      document.getElementById('addDataFoodName').value = '';
      document.getElementById('addDataFoodPortion').value = '';

      renderAllViews();
    };
  }

  // Cargar Documentos PDF y Datos Privados directamente desde el Teléfono/Dispositivo
  const nutPdfInput = document.getElementById('importNutritionPdfInput');
  const workPdfInput = document.getElementById('importWorkoutPdfInput');
  const progPdfInput = document.getElementById('importProgressPdfInput');
  const pdfStatus = document.getElementById('pdfUploadStatus');

  const handleDocumentImport = (inputEl, typeLabel, stateKey, storageKey) => {
    if (!inputEl) return;
    inputEl.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (pdfStatus) {
        pdfStatus.style.display = 'block';
        pdfStatus.style.color = 'var(--accent-color)';
        pdfStatus.innerHTML = `⏳ Cargando ${file.name}...`;
      }

      const reader = new FileReader();

      if (file.name.endsWith('.json')) {
        reader.onload = (event) => {
          try {
            const parsed = JSON.parse(event.target.result);
            state[stateKey] = Array.isArray(parsed) ? parsed : [parsed];
            localStorage.setItem(storageKey, JSON.stringify(state[stateKey]));

            if (pdfStatus) {
              pdfStatus.innerHTML = `✅ ${typeLabel} "${file.name}" cargado de forma privada en tu dispositivo.`;
            }
            alert(`✅ ${typeLabel} cargado correctamente.`);
            renderAllViews();
          } catch(err) {
            alert('Error al procesar el archivo JSON: ' + err.message);
          }
        };
        reader.readAsText(file);
      } else {
        // Archivo PDF
        reader.onload = (event) => {
          try {
            const pdfDoc = {
              name: file.name,
              size: file.size,
              date: new Date().toLocaleDateString(),
              dataUrl: event.target.result
            };
            const storedPdfs = JSON.parse(localStorage.getItem('fitapp_user_pdfs') || '[]');
            storedPdfs.unshift(pdfDoc);
            localStorage.setItem('fitapp_user_pdfs', JSON.stringify(storedPdfs));

            if (pdfStatus) {
              pdfStatus.innerHTML = `✅ Documento PDF "${file.name}" almacenado de forma 100% privada en la memoria de tu teléfono.`;
            }
            alert(`✅ Documento PDF "${file.name}" vinculado de forma privada en tu dispositivo.`);
            renderAllViews();
          } catch(err) {
            alert('Error al guardar el archivo PDF localmente.');
          }
        };
        reader.readAsDataURL(file);
      }
    };
  };

  handleDocumentImport(nutPdfInput, 'Plan Nutricional', 'nutritionData', 'fitapp_custom_nutrition');
  handleDocumentImport(workPdfInput, 'Rutina de Entrenamientos', 'workoutData', 'fitapp_custom_workout');
  handleDocumentImport(progPdfInput, 'Reporte de Progresión', 'resultsData', 'fitapp_custom_progress');
}

// F. GESTIÓN Y BACKUP
function initSettings() {
  const reloadBtn = document.getElementById('reloadAppReportsBtn');
  const exportBtn = document.getElementById('exportBackupBtn');
  const importInput = document.getElementById('importBackupInput');
  const resetBtn = document.getElementById('resetUserLogsBtn');
  const statusInfo = document.getElementById('backupStatusInfo');
  const notionTokenInput = document.getElementById('notionTokenInput');
  const notionDbInput = document.getElementById('notionDbInput');
  const saveNotionBtn = document.getElementById('saveNotionSettingsBtn');

  const updateStatusInfo = () => {
    if (!statusInfo) return;
    const logsCount = Object.keys(state.userLogs || {}).length;
    const evalCount = (state.resultsData || []).length;
    statusInfo.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <span>🏷️ Versión Instalada: <strong>v1.3.2</strong></span>
        <span>🏋️ Cargas Registradas: <strong>${logsCount} ejercicios</strong></span>
        <span>📊 Evaluaciones: <strong>${evalCount} reportes</strong></span>
      </div>
    `;
  };

  updateStatusInfo();

  if (reloadBtn) {
    reloadBtn.onclick = async () => {
      reloadBtn.disabled = true;
      reloadBtn.innerHTML = '⏳ Actualizando reportes de datos...';
      try {
        await loadAppData();
        renderAllViews();
        alert('✅ Reportes de alimentos, entrenamientos y seguimiento actualizados correctamente.');
      } catch (err) {
        alert('⚠️ Error al actualizar los reportes: ' + err.message);
      } finally {
        reloadBtn.disabled = false;
        reloadBtn.innerHTML = '🔄 Actualizar Reportes de Datos (Alimentos & Seguimiento)';
        updateStatusInfo();
      }
    };
  }

  if (exportBtn) {
    exportBtn.onclick = () => {
      const backupData = {
        app: 'FitTrack Pro',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        userLogs: state.userLogs,
        theme: state.theme
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fittrack_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
    };
  }

  if (importInput) {
    importInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          if (imported.userLogs) {
            state.userLogs = imported.userLogs;
            localStorage.setItem('fitapp_user_logs', JSON.stringify(state.userLogs));
            alert('✓ Respaldo importado correctamente.');
            renderAllViews();
            updateStatusInfo();
          } else {
            alert('El archivo JSON no contiene una estructura de respaldo válida.');
          }
        } catch (err) {
          alert('Error al leer el archivo de respaldo JSON.');
        }
      };
      reader.readAsText(file);
    };
  }

  if (resetBtn) {
    resetBtn.onclick = () => {
      if (confirm('⚠️ ¿Estás seguro de que deseas borrar todos los pesos y repeticiones registrados en la pestaña Gimnasio? Esta acción no se puede deshacer.')) {
        state.userLogs = {};
        localStorage.removeItem('fitapp_user_logs');
        alert('✓ Cargas de gimnasio restablecidas.');
        renderAllViews();
        updateStatusInfo();
      }
    };
  }

  if (saveNotionBtn) {
    if (notionTokenInput) notionTokenInput.value = localStorage.getItem('fitapp_notion_token') || '';
    if (notionDbInput) notionDbInput.value = localStorage.getItem('fitapp_notion_db') || '';

    saveNotionBtn.onclick = () => {
      if (notionTokenInput) localStorage.setItem('fitapp_notion_token', notionTokenInput.value.trim());
      if (notionDbInput) localStorage.setItem('fitapp_notion_db', notionDbInput.value.trim());
      alert('✓ Configuración de Notion guardada localmente.');
    };
  }
}
