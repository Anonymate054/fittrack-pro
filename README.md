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

### 1. Requisitos Previos
* Node.js (v16+)
* npm

### 2. Clonar e Inicializar
```bash
git clone https://github.com/TU_USUARIO/fittrack-pro.git
cd fittrack-pro
npm install
```

### 3. Ejecutar en Modo Desarrollo Web
```bash
python3 scripts/server.py
# O usando tu servidor estático preferido en la carpeta raíz
```
Abre tu navegador en `http://localhost:8080`.

---

## 📦 Compilación Web y APK Android

### 1. Reconstruir la distribución Web (`dist/`)
```bash
node scripts/build_dist.js
```

### 2. Sincronizar y Compilar APK Android
```bash
npx cap copy android
cd android
./gradlew assembleDebug
# El APK se genera en: android/app/build/outputs/apk/debug/app-debug.apk
```

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
Licencia MIT &bull; Libre para uso personal y modificaciones.
