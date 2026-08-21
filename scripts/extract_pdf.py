import os
import json
import re
import pypdf
import pdfplumber

def parse_date_sort_key(date_str):
    try:
        parts = date_str.split("/")
        if len(parts) == 3:
            return f"{parts[2]}{parts[1].zfill(2)}{parts[0].zfill(2)}"
    except Exception:
        pass
    return "00000000"

def extract_results(pdf_path):
    data = {
        "file": os.path.basename(pdf_path),
        "metadata": {},
        "composition": {},
        "comments": []
    }
    
    with pdfplumber.open(pdf_path) as pdf:
        text = "\n".join([page.extract_text() or "" for page in pdf.pages])
        
        name_m = re.search(r"LUIS ENRIQUE NOGUERA GIL", text)
        date_m = re.search(r"(\d{2}/\d{2}/\d{4})", text)
        age_m = re.search(r"EDAD\s*([\d.]+)", text)
        
        data["metadata"]["name"] = "LUIS ENRIQUE NOGUERA GIL" if name_m else "Paciente"
        data["metadata"]["date"] = date_m.group(1) if date_m else "06/10/2025"
        data["metadata"]["age"] = float(age_m.group(1)) if age_m else 28.0

        lines = [l.strip() for l in text.split("\n") if l.strip()]
        for line in lines:
            if "Peso (Kg)" in line or "59.7" in line:
                m = re.findall(r"[\d.]+", line)
                if m: data["composition"]["peso_kg"] = float(m[0])
            elif "Masa Magra (Kg)" in line:
                m = re.findall(r"[\d.]+", line)
                if m: data["composition"]["masa_magra_kg"] = float(m[0])
            elif "% Grasa" in line:
                m = re.findall(r"[\d.]+", line)
                if m: data["composition"]["pct_grasa"] = float(m[0])
            elif "Grasa (kg)" in line:
                m = re.findall(r"[\d.]+", line)
                if m: data["composition"]["grasa_kg"] = float(m[0])
            elif "% Músculo" in line:
                m = re.findall(r"[\d.]+", line)
                if m: data["composition"]["pct_musculo"] = float(m[0])
            elif "Músculo (Kg)" in line:
                m = re.findall(r"[\d.]+", line)
                if m: data["composition"]["musculo_kg"] = float(m[0])
            elif "IMC" in line:
                m = re.findall(r"[\d.]+", line)
                if m: data["composition"]["imc"] = float(m[0])

        comm_idx = text.find("Comentarios:")
        if comm_idx != -1:
            comm_text = text[comm_idx:comm_idx+400]
            lines = comm_text.split("\n")[1:]
            comments = [f"• {l.strip()}" for l in lines if l.strip() and not l.startswith("Nota:") and not "PHANTOM" in l]
            data["comments"] = comments

    return data

def unwrap_bullet_text(lines):
    bullets = []
    curr_bullet = []
    
    for l in lines:
        l_clean = l.replace("", "•").replace("\uf0b7", "•").strip()
        if l_clean.startswith("•") or l_clean.startswith("-"):
            if curr_bullet:
                bullets.append(" ".join(curr_bullet))
            curr_bullet = [l_clean.strip("•- ")]
        else:
            curr_bullet.append(l_clean)
            
    if curr_bullet:
        bullets.append(" ".join(curr_bullet))
        
    return "\n".join([f"• {b}" for b in bullets if b.strip()])

def parse_exact_ration_matrix(pdf_obj):
    try:
        t = pdf_obj.pages[0].extract_tables()[1]
        parsed_rows = []
        for row in t[1:]:
            cells = [""] * 9
            for c_idx, val in enumerate(row):
                if val is not None and val.strip() != "":
                    v = val.strip().replace("\n", " ")
                    if c_idx in [0]:
                        cells[0] = v
                    elif c_idx in [1, 2, 3, 4] and any(x in v for x in ["Descremada", "Entera", "Con proteína", "Sin proteína"]):
                        cells[1] = v
                    elif 4 <= c_idx <= 7:
                        cells[2] = v
                    elif 8 <= c_idx <= 10:
                        cells[3] = v
                    elif 11 <= c_idx <= 13:
                        cells[4] = v
                    elif 14 <= c_idx <= 16:
                        cells[5] = v
                    elif 17 <= c_idx <= 19:
                        cells[6] = v
                    elif 20 <= c_idx <= 22:
                        cells[7] = v
                    elif 23 <= c_idx <= 25:
                        cells[8] = v
            parsed_rows.append(cells)
        return parsed_rows
    except Exception as e:
        print("Error parseando matriz:", e)
        return []

def clean_supplement_text(text):
    t = text.strip("•- ")
    t = re.sub(r"\s+", " ", t)
    t = t.replace("1 cap de", "1 cap de ").replace("1 cap ", "1 cápsula ")
    t = t.replace("Probioticos", "Probióticos").replace("DESAYUNO)", "DESAYUNO)")
    t = t.replace("OPTIMUS NUTRITION", "Optimus Nutrition").replace("GAT sport", "GAT Sport").replace("MUSCLETECH", "MuscleTech")
    t = t.replace("MANTRA NUTRITION", "Mantra Nutrition")
    if not t.endswith("."):
        t += "."
    return t

def extract_meal_plan(pdf_path):
    data = {
        "file": os.path.basename(pdf_path),
        "kcal": None,
        "date": "06/10/2025",
        "sort_key": "20251006",
        "ration_matrix": [],
        "menu_meals": [],
        "supplements": [],
        "general_recommendations": [],
        "additional_notes": [],
        "activity_recommendations": [],
        "hydration_recommendations": []
    }
    
    kcal_m = re.search(r"([\d,]+)\s*Kcal", pdf_path)
    if kcal_m:
        data["kcal"] = int(kcal_m.group(1).replace(",", ""))

    with pdfplumber.open(pdf_path) as pdf:
        data["ration_matrix"] = parse_exact_ration_matrix(pdf)

        p1_text = pdf.pages[0].extract_text() or ""
        date_m = re.search(r"FECHA:\s*([\d\s/]+)", p1_text)
        if date_m:
            data["date"] = date_m.group(1).replace(" ", "")
            data["sort_key"] = parse_date_sort_key(data["date"])

        full_text = "\n".join([p.extract_text() or "" for p in pdf.pages])

        # Extract meals directly from PDF table cells (pages 2-5)
        for page in pdf.pages[1:5]:
            tables = page.extract_tables()
            for t in tables:
                if not t or len(t) < 2: continue
                
                header_row = [str(c or "").strip() for c in t[0] if str(c or "").strip()]
                m_name = ""
                m_time = ""
                for cell in header_row:
                    for k in ["DESAYUNO", "ALMUERZO", "COLACIÓN", "COMIDA", "CENA"]:
                        if k in cell:
                            m_name = k
                    if "Hora:" in cell or "H ora:" in cell:
                        m_time = cell.replace("H ora:", "Hora:").replace("\n", " ").strip()
                
                if not m_name: continue

                eq_summary = []
                for row in t[1:]:
                    for cell in row:
                        if cell and any(k in str(cell) for k in ["AOA", "Cereal", "Fruta", "Verdura", "Lácteo", "Aceite", "Leguminosas"]):
                            lines = [l.strip() for l in str(cell).split("\n") if l.strip()]
                            for l in lines:
                                if any(k in l for k in ["AOA", "Cereal", "Fruta", "Verdura", "Lácteo", "Aceite", "Leguminosas"]) and l not in eq_summary:
                                    eq_summary.append(l)

                raw_cell_chunks = []
                for row in t[1:]:
                    for cell in row:
                        if not cell: continue
                        c_str = str(cell).strip()
                        if "Opción 1" in c_str or "Opción 2" in c_str: continue
                        if any(k in c_str for k in ["AOA", "Cereal", "Fruta", "Verdura", "Lácteo", "Aceite", "Leguminosas"]) and len(c_str) < 40: continue
                        if len(c_str) > 5:
                            raw_cell_chunks.append(c_str)

                full_text_table = "\n".join(raw_cell_chunks)
                raw_lines = [l.strip() for l in full_text_table.split("\n") if l.strip()]
                
                options = []
                curr_title = ""
                curr_lines = []
                
                for line in raw_lines:
                    if (line.endswith(":") or line.startswith("Opción")) and not "NOTA" in line and not "BATIDO" in line and len(line) < 75:
                        if curr_title:
                            options.append({"title": curr_title, "lines": curr_lines})
                        curr_title = line.strip(" :")
                        curr_lines = []
                    else:
                        curr_lines.append(line)
                        
                if curr_title:
                    options.append({"title": curr_title, "lines": curr_lines})
                elif curr_lines:
                    options.append({"title": "Opción Principal", "lines": curr_lines})

                formatted_opts = []
                for idx, opt in enumerate(options):
                    unwrapped_desc = unwrap_bullet_text(opt["lines"])
                    formatted_opts.append({
                        "option_num": idx + 1,
                        "title": opt['title'],
                        "description": unwrapped_desc
                    })

                data["menu_meals"].append({
                    "meal_name": m_name,
                    "target_time": m_time,
                    "eq_summary": eq_summary,
                    "options": formatted_opts
                })

        # Suplementación
        supp_m = re.search(r"SUPLEMENTACIÓN:(.*?)(?:RECOMENDACIONES GENERALES|NOTA:|$)", full_text, re.DOTALL)
        if supp_m:
            lines = [l.strip('•- ') for l in supp_m.group(1).strip().split('\n') if l.strip()]
            cleaned_supp = []
            curr = ''
            for l in lines:
                if l.startswith('Tomar') or l.startswith('OMEGA') or l.startswith('1') or l.startswith('•'):
                    if curr: cleaned_supp.append(clean_supplement_text(curr))
                    curr = l
                else:
                    curr += ' ' + l
            if curr: cleaned_supp.append(clean_supplement_text(curr))
            data["supplements"] = cleaned_supp

        # Extraction for Recommendations & Notes from Page range starting at RECOMENDACIONES GENERALES
        recom_start = full_text.find("RECOMENDACIONES GENERALES")
        if recom_start != -1:
            recom_text = full_text[recom_start:]

            # 1. Recomendaciones Generales
            rg_m = re.search(r"RECOMENDACIONES GENERALES\s*\n(.*?)(?:\nNOTA:|$)", recom_text, re.DOTALL)
            if rg_m:
                lines = [l.strip('•- ') for l in rg_m.group(1).split('\n') if l.strip()]
                cleaned_rg = []
                curr = ''
                for l in lines:
                    if curr and l[0].isupper() and len(curr) > 15:
                        cleaned_rg.append(curr)
                        curr = l
                    else:
                        curr = (curr + " " + l).strip()
                if curr: cleaned_rg.append(curr)
                data["general_recommendations"] = [f"• {s}" for s in cleaned_rg if len(s) > 5]

            # 2. Notas Adicionales
            n_m = re.search(r"\nNOTA:\s*\n(.*?)(?:\nRECOMENDACIONES DE ACTIVIDAD|$)", recom_text, re.DOTALL)
            if n_m:
                lines = [l.strip('•- ') for l in n_m.group(1).split('\n') if l.strip()]
                cleaned_n = []
                curr = ''
                for l in lines:
                    if curr and l[0].isupper() and len(curr) > 15:
                        cleaned_n.append(curr)
                        curr = l
                    else:
                        curr = (curr + " " + l).strip()
                if curr: cleaned_n.append(curr)
                data["additional_notes"] = [f"• {s}" for s in cleaned_n if len(s) > 5]

            # 3. Recomendaciones de Actividad
            act_m = re.search(r"RECOMENDACIONES DE ACTIVIDAD / EJERCICIO FÍSICO:\s*\n(.*?)(?:\nRECOMENDACIONES DE LA HIDRATACIÓN|$)", recom_text, re.DOTALL)
            if act_m:
                lines = [l.strip('•- ') for l in act_m.group(1).split('\n') if l.strip()]
                cleaned_act = []
                curr = ''
                for l in lines:
                    if curr and l[0].isupper() and len(curr) > 15:
                        cleaned_act.append(curr)
                        curr = l
                    else:
                        curr = (curr + " " + l).strip()
                if curr: cleaned_act.append(curr)
                data["activity_recommendations"] = [f"• {s}" for s in cleaned_act if len(s) > 5]

            # 4. Recomendaciones de Hidratación
            hid_m = re.search(r"RECOMENDACIONES DE LA HIDRATACIÓN:\s*\n(.*?)$", recom_text, re.DOTALL)
            if hid_m:
                lines = [l.strip('•- ') for l in hid_m.group(1).split('\n') if l.strip()]
                cleaned_hid = []
                curr = ''
                for l in lines:
                    if curr and l[0].isupper() and len(curr) > 10:
                        cleaned_hid.append(curr)
                        curr = l
                    else:
                        curr = (curr + " " + l).strip()
                if curr: cleaned_hid.append(curr)
                data["hydration_recommendations"] = [f"• {s}" for s in cleaned_hid if len(s) > 3]

    return data

def get_technique_description(filename):
    fn = filename.upper()
    if "REST PAUSE" in fn:
        return "REST PAUSE (RP): Realizar las repeticiones objetivo (ej. 12 reps) hasta el fallo técnico, descansar 15s, realizar 5 reps más con el mismo peso, descansar 15s y realizar 3 reps finales para terminar la serie."
    elif "DROP SET" in fn:
        return "DROP SET: Realizar la serie hasta la repetición objetivo con la carga pesada, reducir de inmediato un 20-30% de peso sin descanso y continuar hasta completar las reps de remate."
    elif "CONTRASTE" in fn:
        return "CONTRASTE: Combinar un ejercicio de carga pesada/fuerza con un ejercicio explosivo de la misma zona muscular sin descanso intermedio."
    elif "PROG LINEAL" in fn:
        return "PROGRESIÓN LINEAL: Incrementar la carga de forma progresiva serie a serie manteniendo la técnica impecable."
    else:
        return "BISERIES: Realizar dos ejercicios en circuito sin descanso intermedio. Descansar 60 segundos al finalizar ambos ejercicios."

def get_muscle_group(name_part):
    np = name_part.lower()
    if any(x in np for x in ["hombro", "elevación", "rear delt", "encogimientos", "face pull"]):
        return "Hombro", "(H)"
    elif any(x in np for x in ["espalda", "remo", "jalón", "pull over", "dominadas"]):
        return "Espalda", "(E)"
    elif any(x in np for x in ["sentadilla", "leg extension", "desplantes", "step up", "leg press"]):
        return "Cuádriceps", "(P)"
    elif any(x in np for x in ["gluteo", "abductor", "aductor", "patada", "hip thrust", "extension de cadera"]):
        return "Glúteo / Abductor", "(G)"
    elif any(x in np for x in ["leg curl", "pantorrilla"]):
        return "Isquiotibiales / Pantorrilla", "(I)"
    elif any(x in np for x in ["press de pecho", "aperturas", "peck fly", "crossover"]):
        return "Pecho", "(P)"
    elif any(x in np for x in ["biceps", "curl"]):
        return "Bíceps", "(B)"
    elif any(x in np for x in ["triceps", "copa", "fondos", "press frances", "patada de mula", "extensión de codo"]):
        return "Tríceps", "(T)"
    elif any(x in np for x in ["crunch", "flutter", "cruces", "silla romana", "plancha", "superman"]):
        return "Abdomen", "(A)"
    return "General", ""

def parse_exercise_line(line_str, video_url):
    nums_m = re.findall(r"([\d,]+)\s+(\d+)\s+(\d+)", line_str)
    if not nums_m:
        nums_simple = re.findall(r"(\d+)\s+(\d+)", line_str)
        if nums_simple:
            nums_m = [("2,1,2", n[0], n[1]) for n in nums_simple]

    if not nums_m:
        return None

    name_part = re.split(r"\d", line_str)[0].strip()
    name_part = re.sub(r"^\([^)]+\)\s*", "", name_part).strip()

    weeks_data = []
    for w_idx, n in enumerate(nums_m[:4]):
        weeks_data.append({
            "week": w_idx + 1,
            "tempo": n[0] if len(n) > 2 else "2,1,2",
            "sets": int(n[1] if len(n) > 2 else n[0]),
            "reps": int(n[2] if len(n) > 2 else n[1])
        })

    while len(weeks_data) < 4:
        last = weeks_data[-1] if weeks_data else {"week": 1, "tempo": "2,1,2", "sets": 3, "reps": 12}
        weeks_data.append({
            "week": len(weeks_data) + 1,
            "tempo": last["tempo"],
            "sets": last["sets"],
            "reps": last["reps"]
        })

    muscle, prefix = get_muscle_group(name_part)
    clean_name = f"{prefix} {name_part}".strip() if prefix else name_part

    return {
        "name": clean_name,
        "muscle_group": muscle,
        "video_url": video_url,
        "weeks": weeks_data
    }

def extract_training_plan(pdf_path):
    filename = os.path.basename(pdf_path)
    data = {
        "file": filename,
        "technique_title": filename.replace(".pdf", "").replace("PLAN DE ENTRENAMIENTO ", ""),
        "technique_description": get_technique_description(filename),
        "days": [],
        "cardio_schedule": "CARDIOVASCULAR (Intervalos de 2 min): 10 min en Corredora o Elíptica alternando 2 min al 60-70% FC y 2 min al 70-80% FC.",
        "abdomen_table": []
    }
    
    with pdfplumber.open(pdf_path) as pdf:
        p1_text = pdf.pages[0].extract_text()
        p2_text = pdf.pages[1].extract_text()

        p1_urls = []
        for line in p1_text.split('\n'):
            m = re.search(r'(https?://[^\s]+)', line)
            if m: p1_urls.append(m.group(1))

        p2_ids = re.findall(r'v=\s*([a-zA-Z0-9_-]{8,15})', p2_text.replace(' ', '')) + re.findall(r'shorts/\s*([a-zA-Z0-9_-]{8,15})', p2_text.replace(' ', ''))
        p2_urls = [f'https://www.youtube.com/watch?v={vid}' for vid in p2_ids]

        p1_lines = [l.strip() for l in p1_text.split("\n") if l.strip()]
        p1_ex = []
        url_idx = 0
        for line in p1_lines:
            if any(k in line for k in ["CALENTAMIENTO", "MARTES", "DOMINGO", "EJERCICIO", "% INTESIDAD", "RP (REST", "DROP", "CONTRASTE", "PROG", "CIRCUITO", "MEDIO", "HIPERVINCULO"]):
                continue
            v_url = p1_urls[url_idx] if url_idx < len(p1_urls) else ""
            parsed = parse_exercise_line(line, v_url)
            if parsed and len(parsed["name"]) > 3:
                p1_ex.append(parsed)
                url_idx += 1

        p2_lines = [l.strip() for l in p2_text.split("\n") if l.strip()]
        p2_ex = []
        abd_ex = []
        url_idx = 0
        for line in p2_lines:
            if any(k in line for k in ["CALENTAMIENTO", "MARTES", "DOMINGO", "EJERCICIO", "% INTESIDAD", "RP (REST", "CARDIOVASCULAR", "CIRCUITO", "MEDIO", "HIPERVINCULO"]):
                continue
            v_url = p2_urls[url_idx] if url_idx < len(p2_urls) else ""
            parsed = parse_exercise_line(line, v_url)
            if parsed and len(parsed["name"]) > 3:
                url_idx += 1
                if any(a in parsed["name"].lower() for a in ["silla romana", "elevación de piernas", "plancha", "crunch", "flutter", "cruces", "superman"]):
                    abd_ex.append(parsed)
                else:
                    p2_ex.append(parsed)

    day1_exercises = p1_ex[:8]
    day2_exercises = p1_ex[8:16]
    day3_exercises = p2_ex

    def build_biseries(ex_list):
        blocks = []
        for i in range(0, len(ex_list), 2):
            pair = ex_list[i:i+2]
            blocks.append({
                "biserie_id": (i // 2) + 1,
                "exercises": pair,
                "note": data["technique_description"]
            })
        return blocks

    data["days"] = [
        {"day_name": "FUERZA DÍA 1 (ESPALDA Y HOMBRO)", "biseries": build_biseries(day1_exercises)},
        {"day_name": "FUERZA DÍA 2 (PIERNA Y GLÚTEO)", "biseries": build_biseries(day2_exercises)},
        {"day_name": "FUERZA DÍA 3 (PECHO Y BÍCEPS)", "biseries": build_biseries(day3_exercises)}
    ]

    data["abdomen_table"] = abd_ex

    return data

def extract_equivalents(pdf_path):
    categories_dict = {}
    current_category = "FRUTAS"
    
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            words = page.extract_words()
            lines_dict = {}
            for w in words:
                top_round = round(w['top'] / 8) * 8
                if top_round not in lines_dict:
                    lines_dict[top_round] = []
                lines_dict[top_round].append(w)
            
            for top_val in sorted(lines_dict.keys()):
                line_words = sorted(lines_dict[top_val], key=lambda x: x['x0'])
                line_text = " ".join([w['text'] for w in line_words])
                
                for cat in ["FRUTAS", "VERDURAS", "CEREALES", "LEGUMINOSAS", "AOA", "LÁCTEOS", "ACEITES Y GRASAS", "AZÚCAR", "LIBRES DE ENERGÍA"]:
                    if cat in line_text:
                        current_category = cat
                        if current_category not in categories_dict:
                            categories_dict[current_category] = []

                if len(line_words) >= 2:
                    text_full = " ".join([w['text'] for w in line_words])
                    qty_match = re.search(r"(\d+(?:\/\d+)?(?:\s*1\/\d+)?\s*(?:tza|tzas|g|pza|pzas|cdas|cdita|cditas|reb|rebs|lata|sobre|bolsa|disparos)?)\b", text_full, re.IGNORECASE)
                    if qty_match:
                        qty = qty_match.group(1).strip()
                        food_name = text_full.replace(qty, "").strip()
                        if food_name and food_name not in ["Alimento", "Cantidad", "No. Eq.", "CEREALES CON GRASA"]:
                            if current_category not in categories_dict:
                                categories_dict[current_category] = []
                            categories_dict[current_category].append({
                                "name": food_name,
                                "portion": qty
                            })

    return categories_dict

def main():
    files_dir = "/home/lenovo/Documents/projects/fitness/files"
    output_dir = "/home/lenovo/Documents/projects/fitness/src/data"
    os.makedirs(output_dir, exist_ok=True)

    print("Pipeline de extracción v20 en ejecución (Parser directo de celdas PDF)...")

    results_dir = os.path.join(files_dir, "results")
    if os.path.exists(results_dir):
        all_results = []
        for f in sorted(os.listdir(results_dir)):
            if f.endswith(".pdf"):
                all_results.append(extract_results(os.path.join(results_dir, f)))
        all_results.sort(key=lambda x: parse_date_sort_key(x["metadata"].get("date", "")), reverse=True)
        with open(os.path.join(output_dir, "results.json"), "w", encoding="utf-8") as f:
            json.dump(all_results, f, ensure_ascii=False, indent=2)

    meal_dir = os.path.join(files_dir, "meal_plan")
    if os.path.exists(meal_dir):
        meal_plans = []
        for f in sorted(os.listdir(meal_dir)):
            if f.endswith(".pdf"):
                meal_plans.append(extract_meal_plan(os.path.join(meal_dir, f)))
        meal_plans.sort(key=lambda x: x.get("sort_key", "00000000"), reverse=True)
        with open(os.path.join(output_dir, "meal_plans.json"), "w", encoding="utf-8") as f:
            json.dump(meal_plans, f, ensure_ascii=False, indent=2)

    training_dir = os.path.join(files_dir, "training")
    if os.path.exists(training_dir):
        training_plans = []
        for f in sorted(os.listdir(training_dir)):
            if f.endswith(".pdf"):
                training_plans.append(extract_training_plan(os.path.join(training_dir, f)))
        
        training_plans.sort(key=lambda x: 0 if "REST PAUSE" in x["file"].upper() else 1)

        with open(os.path.join(output_dir, "training_plans.json"), "w", encoding="utf-8") as f:
            json.dump(training_plans, f, ensure_ascii=False, indent=2)

    ref_dir = os.path.join(files_dir, "reference")
    if os.path.exists(ref_dir):
        for f in sorted(os.listdir(ref_dir)):
            if f.endswith(".pdf"):
                eq_dict = extract_equivalents(os.path.join(ref_dir, f))
                with open(os.path.join(output_dir, "equivalents.json"), "w", encoding="utf-8") as f:
                    json.dump(eq_dict, f, ensure_ascii=False, indent=2)

    print("✓ Dataset JSON v20 actualizado con parser directo de celdas.")

if __name__ == "__main__":
    main()
