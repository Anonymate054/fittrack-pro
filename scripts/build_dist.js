const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '..');
const distDir = path.join(srcDir, 'dist');

// Limpiar y crear dist
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

function copyRecursiveSync(src, dest) {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((childItemName) => {
      if (childItemName === 'node_modules' || childItemName === 'dist' || childItemName === '.venv' || childItemName === '.git' || childItemName === 'android') {
        return;
      }
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Copiar archivos raíz clave y src
const filesToCopy = ['index.html', 'manifest.json', 'sw.js', 'src'];
filesToCopy.forEach(item => {
  const itemPath = path.join(srcDir, item);
  if (fs.existsSync(itemPath)) {
    copyRecursiveSync(itemPath, path.join(distDir, item));
  }
});

// Leer versión desde package.json
const pkgPath = path.join(srcDir, 'package.json');
const pkgVersion = fs.existsSync(pkgPath) ? `v${JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version}` : 'v2.0.3';

// Inyectar versión dinámica y cache-busting timestamp en dist/index.html
const distHtmlPath = path.join(distDir, 'index.html');
if (fs.existsSync(distHtmlPath)) {
  let htmlContent = fs.readFileSync(distHtmlPath, 'utf8');
  htmlContent = htmlContent.replace(/app\.js\?v=\d+/g, `app.js?v=${Date.now()}`);
  htmlContent = htmlContent.replace(/v\d+\.\d+\.\d+/g, pkgVersion);
  fs.writeFileSync(distHtmlPath, htmlContent, 'utf8');
}

// Inyectar versión en root y dist
const rootHtmlPath = path.join(srcDir, 'index.html');
if (fs.existsSync(rootHtmlPath)) {
  let rHtml = fs.readFileSync(rootHtmlPath, 'utf8');
  rHtml = rHtml.replace(/v\d+\.\d+\.\d+/g, pkgVersion);
  rHtml = rHtml.replace(/app\.js\?v=\d+/g, `app.js?v=${Date.now()}`);
  fs.writeFileSync(rootHtmlPath, rHtml, 'utf8');
}

const rootAppJsPath = path.join(srcDir, 'src', 'app.js');
if (fs.existsSync(rootAppJsPath)) {
  let rAppJs = fs.readFileSync(rootAppJsPath, 'utf8');
  rAppJs = rAppJs.replace(/v\d+\.\d+\.\d+/g, pkgVersion);
  fs.writeFileSync(rootAppJsPath, rAppJs, 'utf8');
}

console.log(`✓ Build a dist/ (${pkgVersion}) completado.`);
