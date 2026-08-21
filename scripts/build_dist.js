const fs = require('fs');
const path = require('path');

const srcDir = '/home/lenovo/Documents/projects/fitness';
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

// Inyectar versión dinámica de timestamp en dist/index.html
const distHtmlPath = path.join(distDir, 'index.html');
if (fs.existsSync(distHtmlPath)) {
  let htmlContent = fs.readFileSync(distHtmlPath, 'utf8');
  htmlContent = htmlContent.replace(/app\.js\?v=\d+/g, `app.js?v=${Date.now()}`);
  fs.writeFileSync(distHtmlPath, htmlContent, 'utf8');
}

console.log('✓ Build a dist/ completado.');
