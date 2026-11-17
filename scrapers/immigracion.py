"""
Scraper para la Estadística de Migraciones y Cambios de Residencia (EMCR) del INE.
Tabla 60120: Inmigraciones procedentes del extranjero por país de nacimiento, sexo y año.
"""

from datetime import date
from pathlib import Path
import sys
from tqdm import tqdm

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scrapers.text_normalizer import slugify
from scrapers.ine_client import fetch_ine_table
from scrapers.data_publisher import validate_and_stage, promote_to_data

INE_TABLE_ID = "60120"
SOURCE_PAGE_URL = f"https://www.ine.es/jaxiT3/Tabla.htm?t={INE_TABLE_ID}"

MAX_TOP_COUNTRIES = 15
TARGET_COVERAGE_RATIO = 0.90

NON_COUNTRY_LABELS = {
    "Total", "Total Extranjero", "España", "Unión Europea", "Resto de Europa",
    "África", "América del Norte", "Centro América y Caribe", "Sudamérica",
    "Asia", "Oceanía", "Apátridas", "No consta",
}


def extract_all_countries(raw_data: list) -> tuple[dict, dict]:
    print("\n[2/4] 📊 Procesando y filtrando series por país...")
    total_by_year = {}
    countries_by_year = {}

    for serie in tqdm(raw_data, desc="      Procesando", ncols=80):
        nombre_serie = serie.get("Nombre", "")
        meta = serie.get("MetaData", [])

        es_ambos_sexos = any(m.get("Nombre") == "Ambos sexos" for m in meta)
        es_dato_base = "Dato base" in nombre_serie or any(
            m.get("Nombre") == "Dato base" for m in meta
        )
        if not (es_ambos_sexos and es_dato_base):
            continue

        geo_name = None
        for m in meta:
            t_nombre = m.get("T3_Variable", "")
            nombre_meta = m.get("Nombre", "").strip()
            if "País" in t_nombre or "Lugar" in t_nombre or nombre_meta == "Total":
                geo_name = nombre_meta
                break

        if not geo_name:
            for m in meta:
                cand = m.get("Nombre", "").strip()
                if cand not in ("Ambos sexos", "Hombres", "Mujeres", "Dato base"):
                    geo_name = cand
                    break

        if not geo_name:
            continue

        year_map = {}
        for d in serie.get("Data", []):
            valor = d.get("Valor")
            anyo = d.get("Anyo")
            if valor is not None and anyo is not None:
                year_map[str(anyo)] = int(round(float(valor)))

        if not year_map:
            continue

        if geo_name == "Total":
            total_by_year = year_map
        elif geo_name not in NON_COUNTRY_LABELS and not geo_name.startswith("Total "):
            countries_by_year[geo_name] = year_map

    print(f"      ✓ Serie total recuperada: {len(total_by_year)} años ({min(total_by_year.keys())}-{max(total_by_year.keys())}).")
    print(f"      ✓ Países individuales identificados: {len(countries_by_year)} países.")
    return total_by_year, countries_by_year


def build_pareto_metrics(total_by_year: dict, countries_by_year: dict) -> dict:
    if not total_by_year or not countries_by_year:
        raise ValueError("No se pudieron extraer datos válidos del INE.")

    all_years = sorted(total_by_year.keys())
    grand_total = sum(total_by_year.values())

    ranked_countries = sorted(
        countries_by_year.items(),
        key=lambda item: sum(item[1].values()),
        reverse=True,
    )

    selected_countries = []
    cumulative_sum = 0

    for country_name, year_map in ranked_countries:
        if len(selected_countries) >= MAX_TOP_COUNTRIES:
            break
        selected_countries.append((country_name, year_map))
        cumulative_sum += sum(year_map.values())

        if grand_total > 0 and (cumulative_sum / grand_total) >= TARGET_COVERAGE_RATIO:
            break

    coverage_pct = (cumulative_sum / grand_total * 100) if grand_total else 0
    print(
        f"      ✓ Agregación de Pareto: Seleccionados {len(selected_countries)} países principales "
        f"que cubren el {coverage_pct:.1f}% del flujo acumulado total."
    )

    today_str = date.today().isoformat()
    metrics = {}

    def make_metric_obj(metric_id: str, title: str, notes: str, year_dict: dict) -> dict:
        return {
            "id": metric_id,
            "name": title,
            "category": "Demografía",
            "unit": "personas",
            "frequency": "yearly",
            "last_updated": today_str,
            "source": {
                "institution": "INE (Estadística de Migraciones y Cambios de Residencia)",
                "url": SOURCE_PAGE_URL,
            },
            "notes": notes,
            "series": [
                {"date": f"{y}-01", "value": year_dict.get(y, 0)}
                for y in all_years
            ],
        }

    metrics["inmigracion-total"] = make_metric_obj(
        "inmigracion-total",
        "Inmigración total procedente del extranjero",
        "Flujo anual total de inmigraciones procedentes del extranjero (ambos sexos).",
        total_by_year,
    )

    selected_names = []
    for country_name, year_map in selected_countries:
        selected_names.append(country_name)
        metric_id = f"inmigracion-{slugify(country_name)}"
        metrics[metric_id] = make_metric_obj(
            metric_id,
            f"Inmigración procedente de {country_name}",
            f"Flujo anual de inmigraciones procedentes del extranjero por país de nacimiento: {country_name}.",
            year_map,
        )

    others_by_year = {}
    for y in all_years:
        top_sum_y = sum(ym.get(y, 0) for _, ym in selected_countries)
        others_by_year[y] = max(0, total_by_year.get(y, 0) - top_sum_y)

    metrics["inmigracion-otros"] = make_metric_obj(
        "inmigracion-otros",
        "Inmigración procedente de otros países",
        (
            f"Resto de países no incluidos en el Top {len(selected_countries)} "
            f"({', '.join(selected_names)}). Representa el {100 - coverage_pct:.1f}% restante."
        ),
        others_by_year,
    )

    return metrics


if __name__ == "__main__":
    raw = fetch_ine_table(INE_TABLE_ID)
    total_series, country_series = extract_all_countries(raw)
    metrics = build_pareto_metrics(total_series, country_series)
    if validate_and_stage(metrics):
        promote_to_data(prefix_filter="inmigracion-")
