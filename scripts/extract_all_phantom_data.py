import pymupdf, json, re, os

eval_map = [
    (1, 'Evaluación I', 'files/results/RESULTADOS I.pdf'),
    (2, 'Evaluación II', 'files/results/RESULTADOS II.pdf'),
    (3, 'Evaluación III', 'files/results/RESULTADOS III.pdf'),
    (4, 'Evaluación IV', 'files/results/RESULTADOS IV.pdf'),
    (5, 'Evaluación V', 'files/results/RESULTADOS V.pdf'),
    (6, 'Evaluación VI', 'files/results/RESULTADOS VI-1.pdf'),
    (7, 'Evaluación VII', 'files/results/RESULTADOS VII.pdf'),
    (8, 'Evaluación VIII', 'files/results/RESULTADOS VIII.pdf'),
    (9, 'Evaluación IX', 'files/results/RESULTADOS IX.pdf'),
    (10, 'Evaluación X', 'files/results/RESULTADOS X.pdf'),
    (11, 'Evaluación XI', 'files/results/RESULTADOS XI.pdf')
]

json_path = 'src/data/progress_history.json'
js_path = 'src/data/progress_history.js'

with open(json_path, 'r', encoding='utf-8') as f:
    history = json.load(f)

for item in history:
    idx = item['eval_index']
    match_file = [f for i, l, f in eval_map if i == idx]
    if not match_file or not os.path.exists(match_file[0]):
        continue
    
    filepath = match_file[0]
    doc = pymupdf.open(filepath)
    page = doc[0]
    words = page.get_text('words')
    drawings = page.get_drawings()
    
    # 1. Parse Somatotype
    soma_v1_words = [w for w in words if 330 < w[1] < 342 and 410 < w[0] < 540]
    soma_v2_words = [w for w in words if 342 < w[1] < 355 and 410 < w[0] < 540]
    
    def parse_soma_vals(w_list):
        vals = []
        for w in w_list:
            try:
                vals.append(float(w[4]))
            except:
                pass
        return vals

    v1_vals = parse_soma_vals(soma_v1_words)
    v2_vals = parse_soma_vals(soma_v2_words)

    soma_active = v2_vals if len(v2_vals) >= 3 else (v1_vals if len(v1_vals) >= 3 else [4.3, 2.6, 4.2])
    endo, meso, ecto = soma_active[0], soma_active[1], soma_active[2]
    x_soma = round(ecto - endo, 2)
    y_soma = round(2 * meso - (endo + ecto), 2)

    item['somatotype'] = {
        'endo': endo,
        'meso': meso,
        'ecto': ecto,
        'x': x_soma,
        'y': y_soma
    }

    # 2. Extract Phantom Z-Scores
    z_zero_words1 = [w for w in words if w[4] == '0.00' and w[0] < 200]
    z_zero_words2 = [w for w in words if w[4] == '0.00' and w[0] > 200]
    
    y0_p = z_zero_words1[0][1] + 4.0 if z_zero_words1 else 577.9
    y0_c = z_zero_words2[0][1] + 4.0 if z_zero_words2 else 579.0

    def extract_vector_z(rect, y_zero, px_per_unit):
        pts = []
        for d in drawings:
            if rect.intersects(d['rect']):
                for it in d['items']:
                    if it[0] in ['c', 'l']:
                        for p in it[1:]:
                            if isinstance(p, pymupdf.Point) and rect.contains(p):
                                pts.append(p)
        clusters = {}
        for p in pts:
            xr = round(p.x, 1)
            found = False
            for k in clusters:
                if abs(k - xr) < 4.0:
                    clusters[k].append(p.y)
                    found = True
                    break
            if not found:
                clusters[xr] = [p.y]
        
        scores = []
        for x_val in sorted(clusters.keys()):
            avg_y = sum(clusters[x_val]) / len(clusters[x_val])
            z = round((y_zero - avg_y) / px_per_unit, 2)
            scores.append(z)
        return scores

    pts_p = extract_vector_z(pymupdf.Rect(85, 510, 290, 640), y0_p, 19.1)
    pts_c = extract_vector_z(pymupdf.Rect(325, 510, 530, 640), y0_c, 19.0)

    if len(pts_c) == 14:
        item['phantom_circunferencias'] = pts_c[1::2]
    else:
        item['phantom_circunferencias'] = pts_c[:7]

    item['phantom_pliegues'] = pts_p[-15:] if len(pts_p) >= 15 else pts_p

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(history, f, ensure_ascii=False, indent=2)

with open(js_path, 'w', encoding='utf-8') as f:
    f.write('export const progressHistoryData = ' + json.dumps(history, ensure_ascii=False, indent=2) + ';\nexport default progressHistoryData;\n')

print('✓ Extraction complete!')
