# 🏋️ FitTrack Pro — Fitness, Nutrición & Progresión Antropométrica (Offline-First)

**FitTrack Pro** es una plataforma web y móvil independiente (*PWA y APK Nativa Android*) diseñada para el seguimiento integral de entrenamiento en gimnasio, planes de nutrición con calculadora de equivalentes y análisis de progresión física antropométrica (*Somatocarta 3-Ejes y Diagramas Phantom Z-Score*).

---

## 🌟 Características Principales

* 🥗 **Plan de Alimentación & Raciones**: Vistas por tiempo de comida, notas para días de descanso, suplementación diaria y calculadora de sustitución rápida por grupo de origen (Frutas, Verduras, Cereales, AOA, Lácteos, Grasas).
* 🏋️ **Rutinas de Gimnasio & Registro de Cargas**: Sub-bloques de biseries, tempos, reps objetivo, miniaturas de video demostrativo y guardado directo de peso levantado.
* 🔺 **Somatocarta Triangulada 3-Ejes**: Gráfica de Radar para somatotipo (Mesomorfia, Endomorfia, Ectomorfia) con comparación superpuesta por evaluación.
* 📏 **Diagramas Phantom (Z-Scores)**: Trazados vectoriales de pliegues cutáneos y circunferencias corporales con patrones de líneas sólidos y punteados para evitar solapamientos.
* ➕ **Módulo "Agregar Datos"**: Interfaz gráfica para registrar nuevos ejercicios de gimnasio e insumos personalizados.
* 🔒 **100% Privado & Offline**: No requiere servidores externos ni internet. Tus datos viven de forma privada en tu dispositivo con opción de **Exportar/Importar Respaldos JSON**.

---

## 🚀 Instalación y Uso Local

### 1. Requisitos
* Node.js 20 o superior (CI usa Node 22)
* Python 3 (servidor de desarrollo y scripts de extracción de PDFs)
* Para compilar el APK en tu equipo: JDK 21 y Android SDK

### 2. Clonar e instalar
```bash
git clone https://github.com/Anonymate054/fittrack-pro.git
cd fittrack-pro
npm ci
```

### 3. Desarrollo
```bash
npm run dev     # sirve la raíz en http://localhost:8080 sin caché
```

### 4. Calidad
```bash
npm run lint            # ESLint
npm run validate:data   # valida la estructura de src/data/*.json
npm test                # tests unitarios (Vitest)
npm run test:e2e        # tests de la app en Chromium (Playwright)
npm run check           # lint + datos + tests unitarios
```

### 5. Scripts de extracción de PDFs (opcional)
```bash
pip install -r scripts/requirements.txt
python3 scripts/extract_pdf.py   # lee files/ y escribe en src/data/ y private_data/
```

---

## 📦 Build, despliegue y APK

* `npm run build` genera `dist/` e inyecta la versión de `package.json` (la única fuente de versión; Gradle también la lee de ahí). No modifica archivos fuente.
* **GitHub Actions** (`.github/workflows/ci.yml`) corre lint, validación de datos y tests en cada PR y push. En `main` además despliega `dist/` a GitHub Pages.
* **APK:** el mismo workflow compila el APK y lo publica como artefacto `FitTrackPro-apk` de cada ejecución (pestaña *Actions*). Antes de subirlo verifica que no contenga datos privados.
  * Sin secretos configurados se genera un APK de debug.
  * Para un APK de release firmado, crea un keystore y agrega en *Settings → Secrets and variables → Actions*: `ANDROID_KEYSTORE_BASE64` (el keystore en base64), `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` y `ANDROID_KEY_PASSWORD`.
* APK local: `npm run android:debug` (resultado en `android/app/build/outputs/apk/debug/`).

---

## 🛡️ Privacidad de Datos y Plantillas

* **Datos de progreso:** la app muestra `src/data/progress_history.demo.json` (datos ficticios). Para usar tu historial real en local, copia la plantilla:
```bash
cp src/data/progress_history.template.json src/data/progress_history.json
```
  `src/data/progress_history.json` está en `.gitignore`.
* **El build nunca incluye datos privados:** `scripts/build_dist.js` omite `user_private_backup.json`, `progress_history.json`, `results.json`, `user_logs.json`, `private_*`, `*.private.json` y cualquier PDF, así que no llegan ni a GitHub Pages ni al APK.
* **En el teléfono:** tus datos entran solo con *Importar respaldo* y se guardan en el almacenamiento local de la app. El APK tiene desactivado el respaldo automático de Android para que esas mediciones no salgan del dispositivo.
* `user_private_backup.json` en la raíz solo se carga automáticamente al trabajar en `localhost`.
* `scripts/extract_pdf.py` guarda tus resultados y planes de alimentación en `private_data/` (ignorada en git). Los planes de `src/data/meal_plans.json` son datos demo; para ver los tuyos, impórtalos desde *Agregar Datos → Cargar PDF / Plan Nutricional* (archivo `private_data/meal_plans.json`).

---

## 📜 Licencia
[MIT](LICENSE)
