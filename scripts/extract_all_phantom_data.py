"""Extrae somatotipo y valores Z Phantom de los PDFs de resultados.

Las gráficas Phantom del PDF son vectoriales: cada evaluación es una serie de
marcadores de un color (azul = primera evaluación de referencia, rojo = evaluación
actual). Se leen los marcadores por color y se convierten a valor Z usando las
líneas de la cuadrícula (3.00 a -3.00).

Orden de los puntos (igual que en el PDF):
  pliegues:        Subescapular, Tríceps, Pectoral, Suprailiaco, Supraespinal,
                   Abdominal, Muslo, Pierna
  circunferencias: Brazo relajado, Brazo contraído, Cintura, Abdomen, Cadera,
                   Muslo, Pierna

Uso:
  python scripts/extract_all_phantom_data.py                       # actualiza src/data/progress_history.json
  python scripts/extract_all_phantom_data.py --json ruta/backup.json  # actualiza resultsData de un respaldo
"""
import argparse
import json
import os
import sys

import pymupdf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RESULTS_DIR = os.path.join(ROOT, 'files', 'results')
DEFAULT_JSON = os.path.join(ROOT, 'src', 'data', 'progress_history.json')

N_PLIEGUES = 8
N_CIRCUNFERENCIAS = 7

BLUE = (0.29, 0.49, 0.73)
RED = (0.75, 0.29, 0.28)

# Zona de cada gráfica en la página (puntos PDF)
CHARTS = {
    'pliegues': (60, 300),
    'circunferencias': (300, 560),
}
CHART_Y = (500, 650)


def _close(color, ref):
    return bool(color) and all(abs(a - b) < 0.05 for a, b in zip(color, ref))


def _z_scale(page, x0, x1):
    """Devuelve una función y -> Z a partir de las líneas de cuadrícula de la gráfica."""
    ys = set()
    for d in page.get_drawings():
        for it in d['items']:
            if it[0] != 'l':
                continue
            a, b = it[1], it[2]
            if abs(a.y - b.y) < 0.3 and abs(a.x - b.x) > 100 and x0 < min(a.x, b.x) < x1 and CHART_Y[0] < a.y < CHART_Y[1]:
                ys.add(round(a.y, 1))
    # Fusionar líneas casi idénticas (bordes dobles)
    grid = []
    for y in sorted(ys):
        if not grid or y - grid[-1] > 3:
            grid.append(y)
    if len(grid) >= 7:
        grid = grid[-7:]  # 3.00, 2.00, ..., -3.00 de arriba a abajo
        y_top, y_bottom = grid[0], grid[-1]
    else:
        # Respaldo: centro de las etiquetas 3.00 y -3.00
        labels = {}
        for w in page.get_text('words'):
            if x0 < w[0] < x0 + 40 and CHART_Y[0] < w[1] < CHART_Y[1]:
                labels[w[4]] = (w[1] + w[3]) / 2
        y_top, y_bottom = labels['3.00'], labels['-3.00']
    per_unit = (y_bottom - y_top) / 6
    y_zero = y_top + 3 * per_unit
    return lambda y: round((y_zero - y) / per_unit, 2)


def phantom_series(page):
    """{'pliegues': {'blue': [...], 'red': [...]}, 'circunferencias': {...}}"""
    drawings = page.get_drawings()
    out = {}
    for name, (x0, x1) in CHARTS.items():
        to_z = _z_scale(page, x0, x1)
        series = {}
        for d in drawings:
            r = d['rect']
            if d.get('type') != 'fs' or r.width > 8 or r.height > 8:
                continue
            if not (CHART_Y[0] < r.y0 < CHART_Y[1] and x0 < r.x0 < x1):
                continue
            color = d.get('fill') or d.get('color')
            key = 'blue' if _close(color, BLUE) else 'red' if _close(color, RED) else None
            if not key:
                continue
            z = to_z((r.y0 + r.y1) / 2)
            if abs(z) > 3.5:  # marcador de la leyenda, fuera de la escala
                continue
            series.setdefault(key, []).append(((r.x0 + r.x1) / 2, z))
        out[name] = {k: [z for _, z in sorted(v)] for k, v in series.items()}
    return out


def somatotype(page):
    """Lee endo/meso/ecto; la segunda fila (si existe) es la evaluación actual."""
    rows = {}
    for w in page.get_text('words'):
        if 400 < w[0] < 545 and 325 < w[1] < 355:
            try:
                rows.setdefault(round(w[1]), []).append((w[0], float(w[4])))
            except ValueError:
                pass
    if not rows:
        return None
    vals = [v for _, v in sorted(rows[max(rows)])]
    if len(vals) < 3:
        return None
    endo, meso, ecto = vals[:3]
    return {
        'endo': endo,
        'meso': meso,
        'ecto': ecto,
        'x': round(ecto - endo, 2),
        'y': round(2 * meso - (endo + ecto), 2),
    }


def extract(pdf_path):
    page = pymupdf.open(pdf_path)[0]
    s = phantom_series(page)
    result = {}

    def current(name, expected):
        # Rojo = evaluación actual; si solo hay una serie (primera evaluación) es la azul
        values = s[name].get('red') or s[name].get('blue') or []
        if len(values) != expected:
            raise ValueError(f'{os.path.basename(pdf_path)}: {name} tiene {len(values)} puntos, se esperaban {expected}')
        return values

    result['phantom_pliegues'] = current('pliegues', N_PLIEGUES)
    result['phantom_circunferencias'] = current('circunferencias', N_CIRCUNFERENCIAS)
    soma = somatotype(page)
    if soma:
        result['somatotype'] = soma
    return result


def update_history(history, results_dir):
    updated = 0
    for item in history:
        filename = item.get('filename')
        if not filename:
            continue
        path = os.path.join(results_dir, filename)
        if not os.path.exists(path):
            print(f'  · {filename}: PDF no encontrado, se omite', file=sys.stderr)
            continue
        item.update(extract(path))
        updated += 1
    return updated


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--json', default=DEFAULT_JSON, help='progress_history.json o respaldo con resultsData')
    parser.add_argument('--results-dir', default=RESULTS_DIR, help='carpeta con los PDFs RESULTADOS *.pdf')
    args = parser.parse_args()

    with open(args.json, encoding='utf-8') as f:
        data = json.load(f)
    history = data.get('resultsData', []) if isinstance(data, dict) else data

    updated = update_history(history, args.results_dir)

    with open(args.json, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f'✓ {updated} evaluaciones actualizadas en {args.json}')


if __name__ == '__main__':
    main()
