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

Este repositorio es **100% agnóstico y libre de datos personales confidenciales**. 

* Si deseas cargar tu propio historial antropométrico en la app, puedes copiar la plantilla genérica:
```bash
cp src/data/progress_history.template.json src/data/progress_history.json
```
El archivo `src/data/progress_history.json` está protegido en `.gitignore` para garantizar que tus datos reales nunca se suban a repositorios públicos.

---

## 📜 Licencia
Licencia MIT &bull; Libre para uso personal y modificaciones.
