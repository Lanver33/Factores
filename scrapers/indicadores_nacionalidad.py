"""
Pipeline de Ingesta y Reconciliación: Indicadores Medidos por Nacionalidad en España.
Extrae estadísticas oficiales del INE remitidas a Eurostat (Padrón/ECP, EPA, ECV, Adquisiciones)
aplicando neutralidad estricta y trazabilidad directa, y genera ./staging/items/indicadores-nacionalidad-espana.json.
"""

import argparse
from datetime import date
import json
import math
import os
from pathlib import Path
import sys
import tempfile
from typing import Any, Optional

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scrapers.eurostat_client import fetch_eurostat_dataset, EurostatDataset


GROUP_CODE_MAP = {
    "TOTAL": "total",
    "NAT": "nationals",
    "FOR": "foreigners",
    "FOR_STLS": "foreigners",
    "EU27_2020_FOR": "euForeigners",
    "NEU27_2020_FOR": "nonEuForeigners",
}


def load_json(path: Path) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def validate_concept_guide(guide: dict) -> None:
    if not guide.get("title") or not isinstance(guide["title"], str):
        raise ValueError("conceptGuide.title must be a non-empty string.")
    categories = {c["id"] for c in guide.get("categories", [])}
    if not categories:
        raise ValueError("conceptGuide.categories must not be empty.")

    terms = guide.get("terms", [])
    if not terms or not isinstance(terms, list):
        raise ValueError("conceptGuide.terms must be a non-empty list.")

    seen_codes = set()
    for term in terms:
        code = term.get("code")
        if not code or code in seen_codes:
            raise ValueError(f"Código de concepto duplicado o inválido en guía: {code}")
        seen_codes.add(code)
        cat_id = term.get("categoryId")
        if cat_id not in categories:
            raise ValueError(f"Categoría inválida '{cat_id}' en término '{code}'")

    for term in terms:
        for rel in term.get("relatedCodes", []):
            if rel not in seen_codes:
                raise ValueError(f"relatedCode '{rel}' en término '{term.get('code')}' no existe en terms.")


def build_nationality_indicators_payload(
    config: dict,
    datasets: dict[str, EurostatDataset],
    guide: Optional[dict] = None,
) -> dict:
    """
    Transforma, pivota y valida los datasets de Eurostat para producir el contrato
    canónico de NationalityIndicatorsItem.
    """
    start_year = int(config.get("startYear", 2008))

    ds_pop_ctz = datasets.get("popByCitizenship")
    ds_pop_birth = datasets.get("popByBirth")
    ds_acq = datasets.get("naturalizations")
    ds_emp_ctz = datasets.get("employedByCitizenship")
    ds_emp_birth = datasets.get("employedByBirth")
    ds_act_ctz = datasets.get("activityRateByCitizenship")
    ds_act_birth = datasets.get("activityRateByBirth")
    ds_empr_ctz = datasets.get("employmentRateByCitizenship")
    ds_empr_birth = datasets.get("employmentRateByBirth")
    ds_unemp_ctz = datasets.get("unemploymentRateByCitizenship")
    ds_unemp_birth = datasets.get("unemploymentRateByBirth")
    ds_inc_ctz = datasets.get("incomeByCitizenship")
    ds_inc_tot = datasets.get("incomeTotal")
    ds_pov_ctz = datasets.get("povertyRateByCitizenship")
    ds_pov_tot = datasets.get("povertyRateTotal")

    if not ds_pop_ctz or not ds_pop_birth:
        raise ValueError("Los datasets demográficos básicos (popByCitizenship, popByBirth) son obligatorios.")

    # 1. Indexar población por (time, citizen/c_birth, age)
    # Para citizenship, priorizar FOR si existe, o FOR_STLS si FOR no está
    pop_ctz_lookup: dict[tuple[str, str, str], float] = {}
    for r in ds_pop_ctz.records:
        t = str(r.get("time"))
        c = r.get("citizen")
        a = r.get("age")
        v = r.get("value")
        if t and c and a and v is not None and math.isfinite(v):
            pop_ctz_lookup[(t, c, a)] = float(v)

    pop_birth_lookup: dict[tuple[str, str, str], float] = {}
    for r in ds_pop_birth.records:
        t = str(r.get("time"))
        cb = r.get("c_birth")
        a = r.get("age")
        v = r.get("value")
        if t and cb and a and v is not None and math.isfinite(v):
            pop_birth_lookup[(t, cb, a)] = float(v)

    # 2. Indexar adquisiciones por year
    acq_lookup: dict[str, int] = {}
    if ds_acq:
        for r in ds_acq.records:
            t = str(r.get("time"))
            v = r.get("value")
            if t and v is not None and math.isfinite(v):
                acq_lookup[t] = int(round(float(v)))

    # 3. Indexar mercado laboral (citizenship)
    # emp_ctz: (time, citizen) -> value (thousands)
    emp_ctz_lookup: dict[tuple[str, str], float] = {}
    if ds_emp_ctz:
        for r in ds_emp_ctz.records:
            t = str(r.get("time"))
            c = r.get("citizen")
            v = r.get("value")
            if t and c and v is not None and math.isfinite(v):
                emp_ctz_lookup[(t, c)] = float(v)

    act_ctz_lookup: dict[tuple[str, str], float] = {}
    if ds_act_ctz:
        for r in ds_act_ctz.records:
            t = str(r.get("time"))
            c = r.get("citizen")
            v = r.get("value")
            if t and c and v is not None and math.isfinite(v):
                act_ctz_lookup[(t, c)] = float(v)

    empr_ctz_lookup: dict[tuple[str, str], float] = {}
    if ds_empr_ctz:
        for r in ds_empr_ctz.records:
            t = str(r.get("time"))
            c = r.get("citizen")
            v = r.get("value")
            if t and c and v is not None and math.isfinite(v):
                empr_ctz_lookup[(t, c)] = float(v)

    unemp_ctz_lookup: dict[tuple[str, str], float] = {}
    if ds_unemp_ctz:
        for r in ds_unemp_ctz.records:
            t = str(r.get("time"))
            c = r.get("citizen")
            v = r.get("value")
            if t and c and v is not None and math.isfinite(v):
                unemp_ctz_lookup[(t, c)] = float(v)

    # 4. Indexar mercado laboral (birthplace)
    emp_birth_lookup: dict[tuple[str, str], float] = {}
    if ds_emp_birth:
        for r in ds_emp_birth.records:
            t = str(r.get("time"))
            cb = r.get("c_birth")
            v = r.get("value")
            # If lfsa_pgacws, check wstatus == "EMP" if dimension present
            wstatus = r.get("wstatus")
            if wstatus and wstatus != "EMP":
                continue
            if t and cb and v is not None and math.isfinite(v):
                emp_birth_lookup[(t, cb)] = float(v)

    act_birth_lookup: dict[tuple[str, str], float] = {}
    if ds_act_birth:
        for r in ds_act_birth.records:
            t = str(r.get("time"))
            cb = r.get("c_birth")
            v = r.get("value")
            if t and cb and v is not None and math.isfinite(v):
                act_birth_lookup[(t, cb)] = float(v)

    empr_birth_lookup: dict[tuple[str, str], float] = {}
    if ds_empr_birth:
        for r in ds_empr_birth.records:
            t = str(r.get("time"))
            cb = r.get("c_birth")
            v = r.get("value")
            if t and cb and v is not None and math.isfinite(v):
                empr_birth_lookup[(t, cb)] = float(v)

    unemp_birth_lookup: dict[tuple[str, str], float] = {}
    if ds_unemp_birth:
        for r in ds_unemp_birth.records:
            t = str(r.get("time"))
            cb = r.get("c_birth")
            v = r.get("value")
            if t and cb and v is not None and math.isfinite(v):
                unemp_birth_lookup[(t, cb)] = float(v)

    # 5. Indexar renta y pobreza (ilc_di15, ilc_di03, ilc_li31, ilc_li02)
    # income: (time, citizen/group, metric) -> float
    # metric: "MED" or "MEAN"
    inc_lookup: dict[tuple[str, str, str], float] = {}
    if ds_inc_ctz:
        for r in ds_inc_ctz.records:
            t = str(r.get("time"))
            c = r.get("citizen") or r.get("c_citizen")
            stat = r.get("statinfo") or r.get("indic_il")
            v = r.get("value")
            if t and c and stat and v is not None and math.isfinite(v):
                m_key = "MED" if "MED" in stat else "MEAN"
                inc_lookup[(t, c, m_key)] = float(v)

    if ds_inc_tot:
        for r in ds_inc_tot.records:
            t = str(r.get("time"))
            stat = r.get("statinfo") or r.get("indic_il")
            v = r.get("value")
            if t and stat and v is not None and math.isfinite(v):
                m_key = "MED" if "MED" in stat else "MEAN"
                inc_lookup[(t, "TOTAL", m_key)] = float(v)

    pov_lookup: dict[tuple[str, str], float] = {}
    if ds_pov_ctz:
        for r in ds_pov_ctz.records:
            t = str(r.get("time"))
            c = r.get("citizen") or r.get("c_citizen")
            v = r.get("value")
            if t and c and v is not None and math.isfinite(v):
                pov_lookup[(t, c)] = float(v)

    if ds_pov_tot:
        for r in ds_pov_tot.records:
            t = str(r.get("time"))
            v = r.get("value")
            if t and v is not None and math.isfinite(v):
                pov_lookup[(t, "TOTAL")] = float(v)

    # 6. Determinar años cronológicos válidos
    # Años >= start_year donde existan datos en popByCitizenship para TOTAL y NAT, y (FOR o FOR_STLS)
    all_years = set()
    for (t, c, a), _ in pop_ctz_lookup.items():
        try:
            y_int = int(t)
            if y_int >= start_year and a == "TOTAL":
                all_years.add(t)
        except ValueError:
            continue

    valid_years = []
    for y in sorted(all_years, key=int):
        has_total = (y, "TOTAL", "TOTAL") in pop_ctz_lookup
        has_nat = (y, "NAT", "TOTAL") in pop_ctz_lookup
        has_for = (y, "FOR", "TOTAL") in pop_ctz_lookup or (y, "FOR_STLS", "TOTAL") in pop_ctz_lookup
        if has_total and has_nat and has_for:
            valid_years.append(y)

    if len(valid_years) < 10:
        raise ValueError(f"Se encontraron solo {len(valid_years)} años válidos (mínimo 10 requeridos desde {start_year}).")

    annual_records = []
    top_level_datapoints = []

    def get_pop_stat(lookup: dict, y: str, code: str, age: str) -> Optional[float]:
        if (y, code, age) in lookup:
            return lookup[(y, code, age)]
        if code == "FOR" and (y, "FOR_STLS", age) in lookup:
            return lookup[(y, "FOR_STLS", age)]
        return None

    for y in valid_years:
        def_slices = {}

        for def_key, lookup, map_param in [
            ("citizenship", pop_ctz_lookup, "citizen"),
            ("birthplace", pop_birth_lookup, "c_birth"),
        ]:
            # Demographics
            total_pop = get_pop_stat(lookup, y, "TOTAL", "TOTAL")
            total_working_age = get_pop_stat(lookup, y, "TOTAL", "Y15-64")

            if total_pop is None or total_pop <= 0 or total_working_age is None or total_working_age <= 0:
                demo_block = None
            else:
                demo_block = {}
                target_groups = [
                    ("total", "TOTAL"),
                    ("nationals", "NAT"),
                    ("foreigners", "FOR"),
                    ("euForeigners", "EU27_2020_FOR"),
                    ("nonEuForeigners", "NEU27_2020_FOR"),
                ]

                for gkey, ecode in target_groups:
                    pop = get_pop_stat(lookup, y, ecode, "TOTAL")
                    u15 = get_pop_stat(lookup, y, ecode, "Y_LT15")
                    w15_64 = get_pop_stat(lookup, y, ecode, "Y15-64")
                    s65 = get_pop_stat(lookup, y, ecode, "Y_GE65")

                    if pop is not None and u15 is not None and w15_64 is not None and s65 is not None:
                        share_total = round((pop / total_pop) * 100.0, 2)
                        share_work = round((w15_64 / total_working_age) * 100.0, 2)
                        u15_pct = round((u15 / pop) * 100.0, 2) if pop > 0 else 0.0
                        w15_64_pct = round((w15_64 / pop) * 100.0, 2) if pop > 0 else 0.0
                        s65_pct = round((s65 / pop) * 100.0, 2) if pop > 0 else 0.0
                        dep_ratio = round((s65 / w15_64) * 100.0, 1) if w15_64 > 0 else 0.0

                        demo_block[gkey] = {
                            "population": int(round(pop)),
                            "shareOfTotalPct": share_total,
                            "shareOfWorkingAgePct": share_work,
                            "oldAgeDependencyRatio": dep_ratio,
                            "ageBands": {
                                "under15": int(round(u15)),
                                "workingAge15to64": int(round(w15_64)),
                                "senior65plus": int(round(s65)),
                                "under15Pct": u15_pct,
                                "workingAge15to64Pct": w15_64_pct,
                                "senior65plusPct": s65_pct,
                            },
                        }
                    elif gkey in ("total", "nationals", "foreigners"):
                        # If primary groups are missing, mark demo_block as incomplete
                        demo_block = None
                        break

            # Labor Market
            if def_key == "citizenship":
                emp_lk = emp_ctz_lookup
                act_lk = act_ctz_lookup
                empr_lk = empr_ctz_lookup
                unemp_lk = unemp_ctz_lookup
            else:
                emp_lk = emp_birth_lookup
                act_lk = act_birth_lookup
                empr_lk = empr_birth_lookup
                unemp_lk = unemp_birth_lookup

            total_emp = emp_lk.get((y, "TOTAL"))
            has_any_labor = any(
                (y, code) in lk
                for lk in (emp_lk, act_lk, empr_lk, unemp_lk)
                for code in ("TOTAL", "NAT", "FOR")
            )

            if not has_any_labor:
                labor_block = None
            else:
                labor_block = {}
                target_labor_groups = [
                    ("total", "TOTAL"),
                    ("nationals", "NAT"),
                    ("foreigners", "FOR"),
                    ("euForeigners", "EU27_2020_FOR"),
                    ("nonEuForeigners", "NEU27_2020_FOR"),
                ]
                for gkey, ecode in target_labor_groups:
                    emp_val = emp_lk.get((y, ecode))
                    act_val = act_lk.get((y, ecode))
                    empr_val = empr_lk.get((y, ecode))
                    unemp_val = unemp_lk.get((y, ecode))

                    share_emp = None
                    if emp_val is not None and total_emp is not None and total_emp > 0:
                        share_emp = round((emp_val / total_emp) * 100.0, 2)

                    if any(v is not None for v in (emp_val, act_val, empr_val, unemp_val)):
                        labor_block[gkey] = {
                            "employedThousands": round(emp_val, 1) if emp_val is not None else None,
                            "shareOfEmployedPct": share_emp,
                            "activityRatePct": round(act_val, 1) if act_val is not None else None,
                            "employmentRatePct": round(empr_val, 1) if empr_val is not None else None,
                            "unemploymentRatePct": round(unemp_val, 1) if unemp_val is not None else None,
                        }

            def_slices[def_key] = {
                "demographics": demo_block,
                "laborMarket": labor_block,
            }

        # Living Conditions (citizenship)
        has_any_income = any(
            (y, code, m) in inc_lookup
            for code in ("TOTAL", "NAT", "FOR")
            for m in ("MED", "MEAN")
        ) or any((y, code) in pov_lookup for code in ("TOTAL", "NAT", "FOR"))

        if not has_any_income:
            living_block = None
        else:
            living_block = {}
            target_income_groups = [
                ("total", "TOTAL"),
                ("nationals", "NAT"),
                ("foreigners", "FOR"),
                ("euForeigners", "EU27_2020_FOR"),
                ("nonEuForeigners", "NEU27_2020_FOR"),
            ]
            for gkey, ecode in target_income_groups:
                med_inc = inc_lookup.get((y, ecode, "MED"))
                mean_inc = inc_lookup.get((y, ecode, "MEAN"))
                pov_pct = pov_lookup.get((y, ecode))

                if any(v is not None for v in (med_inc, mean_inc, pov_pct)):
                    living_block[gkey] = {
                        "medianEquivalisedIncomeEur": round(med_inc, 1) if med_inc is not None else None,
                        "meanEquivalisedIncomeEur": round(mean_inc, 1) if mean_inc is not None else None,
                        "atRiskOfPovertyPct": round(pov_pct, 1) if pov_pct is not None else None,
                    }

        # Naturalizations
        nat_val = acq_lookup.get(y)

        annual_records.append({
            "year": y,
            "naturalizations": nat_val,
            "definitions": def_slices,
            "livingConditions": living_block,
        })

        # Top-level dataPoints (foreigners share of total population by citizenship)
        cit_demo = def_slices["citizenship"]["demographics"]
        if cit_demo and "foreigners" in cit_demo:
            top_level_datapoints.append({
                "year": y,
                "value": cit_demo["foreigners"]["shareOfTotalPct"],
            })

    # Assertions de integridad antes de escribir
    if len(top_level_datapoints) < 10:
        raise ValueError(f"Se requieren al menos 10 dataPoints cronológicos (obtenidos {len(top_level_datapoints)}).")

    for rec in annual_records:
        y = rec["year"]
        for dkey in ["citizenship", "birthplace"]:
            demo = rec["definitions"][dkey]["demographics"]
            if demo:
                tot_p = demo["total"]["population"]
                nat_p = demo["nationals"]["population"]
                for_p = demo["foreigners"]["population"]
                # Tolerancia del 1% para apátridas / no clasificables en registros administrativos
                diff_pop = abs((nat_p + for_p) - tot_p) / tot_p
                if diff_pop > 0.01:
                    raise ValueError(f"Fallo en identidad demográfica {dkey} año {y}: (NAT + FOR) != TOTAL ({diff_pop * 100:.2f}% de error)")

                for grp_k in ["total", "nationals", "foreigners"]:
                    if grp_k in demo:
                        bands = demo[grp_k]["ageBands"]
                        sum_pct = bands["under15Pct"] + bands["workingAge15to64Pct"] + bands["senior65plusPct"]
                        if abs(sum_pct - 100.0) > 0.5:
                            raise ValueError(f"Suma de porcentajes etarios inválida ({sum_pct:.2f}%) en {dkey} {grp_k} año {y}")

            labor = rec["definitions"][dkey]["laborMarket"]
            if labor:
                for grp_k, lstats in labor.items():
                    for rate_key in ["activityRatePct", "employmentRatePct", "unemploymentRatePct"]:
                        r_val = lstats.get(rate_key)
                        if r_val is not None:
                            if not math.isfinite(r_val) or r_val < 0.0 or r_val > 100.0:
                                raise ValueError(f"Tasa laboral corrupta o fuera de rango [0, 100]: {rate_key}={r_val} en {dkey} {grp_k} {y}")

        liv = rec["livingConditions"]
        if liv:
            for grp_k, istats in liv.items():
                for inc_key in ["medianEquivalisedIncomeEur", "meanEquivalisedIncomeEur"]:
                    i_val = istats.get(inc_key)
                    if i_val is not None:
                        if not math.isfinite(i_val) or i_val <= 0:
                            raise ValueError(f"Renta corrupta o negativa: {inc_key}={i_val} en {grp_k} {y}")
                p_val = istats.get("atRiskOfPovertyPct")
                if p_val is not None:
                    if not math.isfinite(p_val) or p_val < 0.0 or p_val > 100.0:
                        raise ValueError(f"Tasa de pobreza fuera de rango [0, 100]: {p_val} en {grp_k} {y}")

    # Fuentes dinámicas
    output_sources = []
    all_updated = []
    for s in config.get("sources", []):
        s_keys = s.get("datasetKeys", [])
        updated_dates = [datasets[k].updated for k in s_keys if k in datasets and datasets[k].updated]
        all_updated.extend(updated_dates)
        last_upd = max(updated_dates, default=date.today().isoformat())
        output_sources.append({
            "institution": s["institution"],
            "shortName": s["shortName"],
            "title": s["title"],
            "tableId": s.get("tableId", ""),
            "period": f"{valid_years[0]}–{valid_years[-1]}",
            "lastUpdated": last_upd,
            "url": s["url"],
        })

    latest_global_update = max(all_updated, default=date.today().isoformat())

    payload = {
        "id": config["indicatorId"],
        "category": config["category"],
        "question": config["question"],
        "chartType": config["chartType"],
        "unit": config["headlineUnit"],
        "dataPoints": top_level_datapoints,
        "annualRecords": annual_records,
        "contextNotes": [
            "Todos los indicadores proceden directamente de estadísticas oficiales del INE remitidas a Eurostat (Padrón/ECP, EPA, ECV y Estadística de Adquisiciones de Nacionalidad), sin imputaciones sintéticas ni multiplicadores estimados.",
            "La clasificación por nacionalidad (pasaporte) refleja el estatus legal en cada año; las adquisiciones anuales de nacionalidad española trasladan a residentes nacidos en el extranjero del grupo de población extranjera al de nacionalidad española.",
            "Los indicadores del mercado laboral (tasa de actividad, empleo, paro y ocupados) corresponden a la población de 15 a 64 años conforme a los criterios armonizados de la EPA / LFS.",
            "La renta neta equivalente (ECV / EU-SILC) ajusta los ingresos disponibles del hogar por su tamaño y composición mediante la escala modificada de la OCDE para comparar el poder adquisitivo individual."
        ],
        "sources": output_sources,
        "last_updated": latest_global_update,
    }

    if guide:
        validate_concept_guide(guide)
        payload["conceptGuide"] = guide

    return payload


def run_pipeline(
    config_path: Path,
    guide_path: Optional[Path],
    output_path: Path,
    dry_run: bool = False,
) -> dict:
    config = load_json(config_path)
    guide = load_json(guide_path) if guide_path and guide_path.exists() else None

    base_url = config["apiBaseUrl"]
    datasets_cfg = config["datasets"]

    print(f"\n[1/3] 📥 Descargando datasets oficiales de Eurostat para {config['indicatorId']}...")
    datasets: dict[str, EurostatDataset] = {}

    for dkey, dinfo in datasets_cfg.items():
        code = dinfo["code"]
        params = dict(dinfo.get("params", {}))
        fallback_code = dinfo.get("fallbackCode")

        try:
            ds = fetch_eurostat_dataset(base_url, code, params, since_year=config.get("startYear", 2008))
            datasets[dkey] = ds
        except Exception as e:
            if fallback_code:
                print(f"      ⚠️ Query {code} falló ({e}). Intentando fallback {fallback_code}...")
                try:
                    ds = fetch_eurostat_dataset(base_url, fallback_code, params, since_year=config.get("startYear", 2008))
                    datasets[dkey] = ds
                    continue
                except Exception as e_fb:
                    print(f"      ❌ Fallback {fallback_code} también falló: {e_fb}")
            print(f"      ⚠️ Advertencia en dataset '{dkey}' ({code}): {e}")

    print("\n[2/3] ⚖️ Procesando, reconciliando y aplicando identidades estadísticas...")
    payload = build_nationality_indicators_payload(config, datasets, guide)

    years_count = len(payload["annualRecords"])
    first_y = payload["annualRecords"][0]["year"]
    last_y = payload["annualRecords"][-1]["year"]
    print(f"      ✓ Reconciliación exitosa para {years_count} años ({first_y}–{last_y}).")
    latest_pt = payload["dataPoints"][-1]
    print(f"      ✓ Último dato ({latest_pt['year']}): Población extranjera = {latest_pt['value']}% del total.")

    if dry_run:
        print("\n[3/3] 🔍 Modo --dry-run activado. Omitiendo escritura en disco.")
        print(f"      Muestra de registro {last_y}:")
        sample = payload["annualRecords"][-1]
        print(json.dumps({
            "year": sample["year"],
            "naturalizations": sample["naturalizations"],
            "citizenship_demo_foreigners": sample["definitions"]["citizenship"]["demographics"]["foreigners"],
            "citizenship_labor_foreigners": sample["definitions"]["citizenship"]["laborMarket"]["foreigners"] if sample["definitions"]["citizenship"]["laborMarket"] else None,
            "livingConditions_foreigners": sample["livingConditions"]["foreigners"] if sample["livingConditions"] else None,
        }, indent=2, ensure_ascii=False))
        return payload

    print(f"\n[3/3] 💾 Escribiendo payload atómico en {output_path}...")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    temp_fd, temp_file_path = tempfile.mkstemp(dir=str(output_path.parent), prefix="tmp_ind_nac_", suffix=".json")
    with os.fdopen(temp_fd, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    os.replace(temp_file_path, output_path)
    print(f"      ✓ Archivo generado correctamente: {output_path} ({os.path.getsize(output_path):,} bytes)")

    return payload


def main() -> None:
    parser = argparse.ArgumentParser(description="Pipeline de indicadores por nacionalidad (Factor.es)")
    parser.add_argument(
        "--config",
        type=Path,
        default=Path("scrapers/config/indicadores_nacionalidad_sources.json"),
        help="Ruta al archivo de fuentes Eurostat",
    )
    parser.add_argument(
        "--guide",
        type=Path,
        default=Path("scrapers/config/indicadores_nacionalidad_guide.json"),
        help="Ruta a la guía conceptual",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("staging/items/indicadores-nacionalidad-espana.json"),
        help="Ruta de salida JSON en staging",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Ejecuta la descarga y reconciliación sin escribir en disco",
    )

    args = parser.parse_args()
    try:
        run_pipeline(args.config, args.guide, args.output, dry_run=args.dry_run)
    except Exception as e:
        print(f"\n❌ ERROR FATAL en pipeline de indicadores por nacionalidad: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
