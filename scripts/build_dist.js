// Construye dist/ (GitHub Pages y assets del APK). Solo escribe en dist/: nunca modifica archivos fuente.
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const appVersion = `v${pkg.version}`;

// Archivos con datos personales: nunca deben llegar a dist/ (GitHub Pages) ni al APK.
// Los datos privados del usuario entran solo con "Importar respaldo" dentro de la app.
const PRIVATE_FILE_PATTERNS = [
  /^user_private_backup\.json$/,
  /^progress_history\.json$/,
  /^user_logs\.json$/,
  /^results\.json$/,
  /^private_/,
  /\.private\.json$/,
  /\.pdf$/i
];

const isPrivateFile = (name) => PRIVATE_FILE_PATTERNS.some((re) => re.test(name));

function copyRecursiveSync(src, dest) {
  if (fs.statSync(src).isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      if (isPrivateFile(child)) {
        console.log(`⚠ Omitido del build por contener datos privados: ${child}`);
        continue;
      }
      copyRecursiveSync(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Reemplaza __APP_VERSION__ (versión de package.json) en un archivo de dist/
function injectVersion(relativePath) {
  const filePath = path.join(distDir, relativePath);
  const content = fs.readFileSync(filePath, 'utf8');
  fs.writeFileSync(filePath, content.replace(/__APP_VERSION__/g, appVersion), 'utf8');
}

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

for (const item of ['index.html', 'manifest.json', 'sw.js', 'icons', 'src']) {
  const itemPath = path.join(rootDir, item);
  if (fs.existsSync(itemPath)) copyRecursiveSync(itemPath, path.join(distDir, item));
}

for (const file of ['index.html', 'sw.js', 'src/app.js']) injectVersion(file);

console.log(`✓ Build a dist/ (${appVersion}) completado.`);
