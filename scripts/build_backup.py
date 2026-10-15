"""Genera el respaldo completo de la app (user_private_backup.json) a partir de una carpeta de PDFs.

Busca PDFs en la carpeta indicada (y sus subcarpetas), detecta el tipo de cada uno por su nombre
o contenido y los procesa:
  RESULTADOS *.pdf              -> resultsData   (composición corporal, somatotipo y Phantom)
  Plan de Alimentación *.pdf    -> nutritionData (scripts/extract_pdf.py)
  PLAN DE ENTRENAMIENTO *.pdf   -> workoutData   (scripts/extract_pdf.py, requiere PyMuPDF)

Si ya existe un respaldo (--base, por defecto el mismo archivo de salida), se conserva y solo se
agregan o reemplazan los registros de los PDFs encontrados (se identifican por nombre de archivo).
Así basta con pasar una carpeta que tenga únicamente los PDFs nuevos.

El JSON resultante se carga en el teléfono con Ajustes -> Importar Respaldo (JSON).

Uso:
  npm run backup                                   # usa la carpeta files/
  python3 scripts/build_backup.py files/
  python3 scripts/build_backup.py ~/Descargas/pdfs_nuevos --out user_private_backup.json
"""
import argparse
import json
import os
import re
import sys

import pdfplumber

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import extract_pdf  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_OUT = os.path.join(ROOT, 'user_private_backup.json')
DEFAULT_FOLDER = os.path.join(ROOT, 'files')

# ---------------------------------------------------------------------------
# Resultados (informe de composición corporal)
# ---------------------------------------------------------------------------

# Colores de relleno de los marcadores Phantom: azul = primera evaluación, rojo = evaluación actual
BLUE = (0.31, 0.506, 0.741)
RED = (0.753, 0.314, 0.302)
# Zona de cada gráfica Phantom en la página (puntos PDF, y medida desde arriba)
PHANTOM_CHARTS = {'pliegues': (60, 300), 'circunferencias': (300, 560)}
PHANTOM_Y = (500, 650)
N_PHANTOM = {'pliegues': 8, 'circunferencias': 7}
# Valores (1° Vez / Subsecuente) de la columna izquierda del informe
BODY_FIELDS = {
    'peso_kg': r'Peso \(Kg\)',
    'masa_magra_kg': r'Masa Magra \(Kg\)',
    'pct_grasa': r'% Grasa',
    'grasa_kg': r'Grasa \(kg\)',
    'pct_musculo': r'% Músculo',
    'masa_muscular_kg': r'Músculo \(Kg\)',
    'masa_osea_kg': r'Masa Ósea \(Kg\)',
    'masa_residual_kg': r'Masa Residual \(Kg\)',
}
ROMAN = [(50, 'L'), (40, 'XL'), (10, 'X'), (9, 'IX'), (5, 'V'), (4, 'IV'), (1, 'I')]


def to_roman(n):
    out = ''
    for value, symbol in ROMAN:
        while n >= value:
            out += symbol
            n -= value
    return out


def _numbers(text):
    return [float(n) for n in re.findall(r'-?\d+(?:\.\d+)?', text)]


def _same_color(color, ref):
    return isinstance(color, (tuple, list)) and len(color) == 3 and all(abs(a - b) < 0.01 for a, b in zip(color, ref))


def _z_scale(page, x0, x1):
    """Función y -> valor Z a partir de las 7 líneas de cuadrícula (3.00 a -3.00) de la gráfica."""
    ys = sorted({
        round(line['top'], 1) for line in page.lines
        if line['width'] > 100 and abs(line['top'] - line['bottom']) < 0.3
        and x0 < line['x0'] < x1 and PHANTOM_Y[0] < line['top'] < PHANTOM_Y[1]
    })
    grid = []
    for y in ys:
        if not grid or y - grid[-1] > 3:  # bordes dobles
            grid.append(y)
    if len(grid) < 7:
        raise ValueError('no se encontró la cuadrícula de la gráfica Phantom')
    y_top, y_bottom = grid[-7], grid[-1]
    per_unit = (y_bottom - y_top) / 6
    y_zero = y_top + 3 * per_unit
    return lambda y: round((y_zero - y) / per_unit, 2)


def phantom_series(page):
    """Valores Z de la evaluación actual: {'pliegues': [...8], 'circunferencias': [...7]}."""
    out = {}
    for name, (x0, x1) in PHANTOM_CHARTS.items():
        to_z = _z_scale(page, x0, x1)
        series = {}
        for obj in page.rects + page.curves:
            # Marcadores: cuadros rellenos de ~4.7 pt (los tramos de las líneas tienen otro tono)
            if not obj.get('fill') or not (4.5 < obj['width'] < 5.2 and 4.5 < obj['height'] < 5.2):
                continue
            if not (PHANTOM_Y[0] < obj['top'] < PHANTOM_Y[1] and x0 < obj['x0'] < x1):
                continue
            color = obj.get('non_stroking_color')
            key = 'blue' if _same_color(color, BLUE) else 'red' if _same_color(color, RED) else None
            if not key:
                continue
            z = to_z((obj['top'] + obj['bottom']) / 2)
            if abs(z) > 3.5:  # marcador de la leyenda, fuera de la escala
                continue
            series.setdefault(key, {})[round(obj['x0'])] = z  # el relleno y el borde se dibujan por separado
        # Rojo = evaluación actual; en la primera evaluación solo existe la serie azul
        values = series.get('red') or series.get('blue') or {}
        values = [z for _, z in sorted(values.items())]
        if len(values) != N_PHANTOM[name]:
            raise ValueError(f'Phantom {name}: {len(values)} puntos, se esperaban {N_PHANTOM[name]}')
        out[name] = values
    return out


def somatotype(page):
    """Endo/meso/ecto de la tabla de somatotipo; la última fila es la evaluación actual."""
    rows = {}
    for w in page.extract_words():
        if 400 < w['x0'] < 545 and 325 < w['top'] < 355:
            try:
                rows.setdefault(round(w['top']), []).append((w['x0'], float(w['text'])))
            except ValueError:
                pass
    if not rows:
        return None
    vals = [v for _, v in sorted(rows[max(rows)])]
    if len(vals) < 3:
        return None
    endo, meso, ecto = vals[:3]
    return {'endo': endo, 'meso': meso, 'ecto': ecto,
            'x': round(ecto - endo, 2), 'y': round(2 * meso - (endo + ecto), 2)}


def extract_results(pdf_path):
    """Registro de resultsData (sin eval_index/eval_label, que se asignan por fecha)."""
    with pdfplumber.open(pdf_path) as pdf:
        page = pdf.pages[0]
        text = page.extract_text() or ''
        lines = text.split('\n')
        item = {'filename': os.path.basename(pdf_path)}

        date_m = re.search(r'FECHA:\s*(\d{2}/\d{2}/\d{4})', text)
        age_m = re.search(r'EDAD\s*([\d.]+)', text)
        if not date_m:
            raise ValueError('no se encontró la FECHA del informe')
        item['fecha'] = date_m.group(1)
        item['edad'] = float(age_m.group(1)) if age_m else None

        for key, label in BODY_FIELDS.items():
            # Valores justo después de la etiqueta: 1 (primera vez) o 2 columnas; se toma la última
            m = re.search(rf'(?:^|\n){label}\s+((?:\d+(?:\.\d+)?\s*){{1,2}})', text)
            item[key] = _numbers(m.group(1))[-1] if m else None

        # Fila "% Residual": residual, IMC e ICC con 1 o 2 columnas cada uno
        resid = next((ln for ln in lines if ln.startswith('% Residual')), '')
        nums = _numbers(resid)
        cols = len(nums) // 3 if len(nums) in (3, 6) else 0
        item['imc'] = nums[2 * cols - 1] if cols else None
        item['icc'] = nums[3 * cols - 1] if cols else None

        def last_number(pattern):
            m = re.search(pattern + r'\s*((?:\d+(?:\.\d+)?\s*)+)', text)
            return _numbers(m.group(1))[-1] if m else None

        # Objetivos: se toma el valor del % graso deseado más alto (última columna)
        item['disminuir_grasa_kg'] = last_number(r'Disminur grasa \(Kg\)')
        item['aumentar_musculo_kg'] = last_number(r'Aumentar \(Kg\)')
        item['peso_ideal_kg'] = last_number(r'Peso Ideal \(Kg\):')

        soma = somatotype(page)
        if soma:
            item['somatotype'] = soma
        phantom = phantom_series(page)
        item['phantom_circunferencias'] = phantom['circunferencias']
        item['phantom_pliegues'] = phantom['pliegues']

    missing = [k for k, v in item.items() if v is None]
    if missing:
        raise ValueError('no se encontraron: ' + ', '.join(missing))
    return item


def number_results(results):
    """Ordena por fecha y asigna eval_index / eval_label (Evaluación I, II, ...)."""
    results.sort(key=lambda r: extract_pdf.parse_date_sort_key(r.get('fecha', '')))
    numbered = []
    for i, r in enumerate(results, start=1):
        rest = {k: v for k, v in r.items() if k not in ('eval_index', 'eval_label')}
        numbered.append({'eval_index': i, 'eval_label': f'Evaluación {to_roman(i)}', **rest})
    return numbered


# ---------------------------------------------------------------------------
# Detección y armado del respaldo
# ---------------------------------------------------------------------------

def detect_kind(pdf_path):
    name = os.path.basename(pdf_path).upper()
    if 'RESULTADOS' in name:
        return 'results'
    if 'ALIMENTACI' in name:
        return 'meal'
    if 'ENTRENAMIENTO' in name:
        return 'training'
    if 'EQUIVALENTES' in name:
        return None
    with pdfplumber.open(pdf_path) as pdf:
        text = (pdf.pages[0].extract_text() or '').upper() if pdf.pages else ''
    if 'COMPOSICIÓN CORPORAL' in text:
        return 'results'
    if 'KCAL' in text and 'FECHA' in text:
        return 'meal'
    if 'EJERCICIO' in text and 'SEMANA' in text:
        return 'training'
    return None


def pdf_created(pdf_path):
    """Fecha de creación del PDF como AAAAMMDD (metadato CreationDate), o '' si no existe."""
    with pdfplumber.open(pdf_path) as pdf:
        m = re.match(r'(?:D:)?(\d{8})', str(pdf.metadata.get('CreationDate') or ''))
    return m.group(1) if m else ''


def find_pdfs(folder):
    for dirpath, _, filenames in os.walk(folder):
        for f in sorted(filenames):
            if f.lower().endswith('.pdf'):
                yield os.path.join(dirpath, f)


def merge(existing, new_items, key):
    """Reemplaza por nombre de archivo los registros existentes y agrega los nuevos."""
    by_name = {item.get(key): item for item in existing}
    for item in new_items:
        by_name[item[key]] = item
    return list(by_name.values())


def build_backup(folder, base=None, log=print):
    base = base or {}
    found = {'results': [], 'meal': [], 'training': []}
    errors = []
    for path in find_pdfs(folder):
        name = os.path.basename(path)
        try:
            kind = detect_kind(path)
            if kind is None:
                log(f'  · {name}: no es un informe, plan de alimentación ni rutina; se omite')
                continue
            if kind == 'results':
                item = extract_results(path)
                previous = next((r for r in base.get('resultsData', []) if r.get('filename') == name), {})
                # La masa de piel no viene en el PDF: se conserva la del respaldo anterior si existe
                if 'masa_piel_kg' in previous:
                    item['masa_piel_kg'] = previous['masa_piel_kg']
            elif kind == 'meal':
                item = extract_pdf.extract_meal_plan(path)
            else:
                item = extract_pdf.extract_training_plan(path)
                # Las rutinas no traen fecha impresa: se usa la fecha de creación del PDF para ordenarlas
                item['created'] = pdf_created(path)
            found[kind].append(item)
            log(f'  ✓ {name}')
        except Exception as err:  # un PDF dañado no debe detener los demás
            errors.append(name)
            log(f'  ✗ {name}: {err}')

    backup = {k: v for k, v in base.items()}
    backup['resultsData'] = number_results(merge(base.get('resultsData', []), found['results'], 'filename'))
    meals = merge(base.get('nutritionData', []), found['meal'], 'file')
    backup['nutritionData'] = sorted(meals, key=lambda x: x.get('sort_key', '00000000'), reverse=True)
    workouts = merge(base.get('workoutData', []), found['training'], 'file')
    # La más reciente primero (la app muestra la primera como [RECIENTE]); sin fecha, al final
    backup['workoutData'] = sorted(workouts, key=lambda x: x.get('created') or '', reverse=True)
    counts = {k: len(v) for k, v in found.items()}
    return backup, counts, errors


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('folder', nargs='?', default=DEFAULT_FOLDER,
                        help='carpeta con los PDFs, incluidas sus subcarpetas (default: files/)')
    parser.add_argument('--out', default=DEFAULT_OUT, help='archivo de respaldo a escribir (default: user_private_backup.json)')
    parser.add_argument('--base', help='respaldo a actualizar (default: el archivo de --out si existe)')
    args = parser.parse_args()

    if not os.path.isdir(args.folder):
        sys.exit(f'No existe la carpeta: {args.folder}')
    base_path = args.base or (args.out if os.path.exists(args.out) else None)
    base = {}
    if base_path:
        with open(base_path, encoding='utf-8') as f:
            base = json.load(f)
        print(f'Actualizando {base_path}')

    print(f'Procesando PDFs de {args.folder}:')
    backup, counts, errors = build_backup(args.folder, base)

    with open(args.out, 'w', encoding='utf-8') as f:
        json.dump(backup, f, ensure_ascii=False, indent=2)
    print(f"✓ {args.out}: {len(backup['resultsData'])} evaluaciones, "
          f"{len(backup['nutritionData'])} planes de alimentación, {len(backup['workoutData'])} rutinas "
          f"(procesados ahora: {counts['results']} + {counts['meal']} + {counts['training']})")
    if errors:
        sys.exit(f'⚠ {len(errors)} PDF(s) con error: ' + ', '.join(errors))


if __name__ == '__main__':
    main()
