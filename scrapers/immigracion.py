"""
Scraper para la Estadística de Migraciones y Cambios de Residencia (EMCR) del INE.
Combina la serie histórica 2008-2020 (Tabla 24295) y la serie actual 2021-2024 (Tabla 69690).
Mantiene absolutamente todos los países individuales procedentes de las fuentes oficiales sin agrupaciones de tipo 'Resto de...'.
"""

from datetime import date
from pathlib import Path
import sys
import re

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scrapers.ine_client import fetch_ine_table
from scrapers.data_publisher import validate_and_stage, promote_to_data

INE_LEGACY_TABLE_ID = "24295"
INE_MODERN_TABLE_ID = "69690"

COUNTRY_BLOCK_MAP = {
    # América Hispanohablante
    "Colombia": "america-hispanohablante",
    "Venezuela": "america-hispanohablante",
    "Perú": "america-hispanohablante",
    "Argentina": "america-hispanohablante",
    "Honduras": "america-hispanohablante",
    "Ecuador": "america-hispanohablante",
    "Cuba": "america-hispanohablante",
    "Paraguay": "america-hispanohablante",
    "República Dominicana": "america-hispanohablante",
    "Bolivia": "america-hispanohablante",
    "Chile": "america-hispanohablante",
    "México": "america-hispanohablante",
    "Nicaragua": "america-hispanohablante",
    "Uruguay": "america-hispanohablante",

    # América No Hispanohablante
    "Brasil": "america-no-hispanohablante",
    "Estados Unidos de América": "america-no-hispanohablante",
    "Canadá": "america-no-hispanohablante",

    # Europa
    "Alemania": "europa",
    "Rumanía": "europa",
    "Reino Unido": "europa",
    "Italia": "europa",
    "Ucrania": "europa",
    "Francia": "europa",
    "Rusia": "europa",
    "Portugal": "europa",
    "Bulgaria": "europa",
    "Bélgica": "europa",
    "Dinamarca": "europa",
    "Finlandia": "europa",
    "Irlanda": "europa",
    "Lituania": "europa",
    "Moldavia": "europa",
    "Noruega": "europa",
    "Países Bajos": "europa",
    "Polonia": "europa",
    "Suecia": "europa",
    "Suiza": "europa",

    # África
    "Marruecos": "africa",
    "Argelia": "africa",
    "Senegal": "africa",
    "Mali": "africa",
    "Nigeria": "africa",
    "Gambia": "africa",
    "Guinea Ecuatorial": "africa",
    "Ghana": "africa",
    "Guinea": "africa",
    "Mauritania": "africa",

    # Asia
    "China": "asia",
    "Pakistán": "asia",
    "India": "asia",
    "Filipinas": "asia",
    "Bangladesh": "asia",
}

BLOCK_COLORS = {
    "america-hispanohablante": "#2563EB",
    "america-no-hispanohablante": "#7C3AED",
    "europa": "#0891B2",
    "africa": "#059669",
    "asia": "#D97706",
    "oceania": "#64748B",
}

BLOCK_NAMES = {
    "america-hispanohablante": "América (Hispanohablante)",
    "america-no-hispanohablante": "América (No Hispanohablante)",
    "europa": "Europa",
    "africa": "África",
    "asia": "Asia",
    "oceania": "Oceanía",
}

def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[áàäâ]', 'a', text)
    text = re.sub(r'[éèëê]', 'e', text)
    text = re.sub(r'[íìïî]', 'i', text)
    text = re.sub(r'[óòöô]', 'o', text)
    text = re.sub(r'[úùüû]', 'u', text)
    text = re.sub(r'ñ', 'n', text)
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

def parse_legacy_ine(raw_data: list) -> dict:
    data = {}
    for serie in raw_data:
        nombre = serie.get("Nombre", "")
        if "Flujo de inmigraciones" in nombre and "Total Nacional" in nombre and not "Español" in nombre and not "Extranjero" in nombre:
            parts = [p.strip() for p in nombre.split(".")]
            c = parts[-1] if parts[-1] else parts[-2]
            if c:
                if c not in data:
                    data[c] = {}
                for d in serie.get("Data", []):
                    if d.get("Valor") is not None:
                        y = str(d["Anyo"])
                        if int(y) <= 2020:
                            data[c][y] = int(round(float(d["Valor"])))
    return data

def parse_modern_ine(raw_data: list) -> dict:
    data = {}
    for serie in raw_data:
        meta = serie.get("MetaData", [])
        es_ambos = any(m.get("Nombre") == "Ambos sexos" for m in meta)
        es_nac_tot = any(m.get("T3_Variable") == "Nacionalidad" and m.get("Nombre") == "Total" for m in meta)
        if es_ambos and es_nac_tot:
            geo_name = None
            for m in meta:
                if m.get("T3_Variable") in ("Total Nacional", "Países y Continentes", "País de procedencia", "País de nacimiento"):
                    geo_name = m.get("Nombre", "").strip()
                    break
            if geo_name:
                if geo_name not in data:
                    data[geo_name] = {}
                for d in serie.get("Data", []):
                    if d.get("Valor") is not None:
                        y = str(d["Anyo"])
                        if int(y) >= 2021:
                            data[geo_name][y] = int(round(float(d["Valor"])))
    return data

def build_consolidated_dataset(raw_legacy: list, raw_modern: list) -> dict:
    print("\n[2/4] 📊 Procesando y reconciliando datos por país individual (2008-2024)...")
    d_leg = parse_legacy_ine(raw_legacy)
    d_mod = parse_modern_ine(raw_modern)

    all_years = [str(y) for y in range(2008, 2025)]

    data_points = []
    continents_points = []
    annual_blocks = []

    # Build blocks definition dynamically
    blocks_dict = {
        "america-hispanohablante": {"id": "america-hispanohablante", "name": BLOCK_NAMES["america-hispanohablante"], "color": BLOCK_COLORS["america-hispanohablante"], "countries": []},
        "america-no-hispanohablante": {"id": "america-no-hispanohablante", "name": BLOCK_NAMES["america-no-hispanohablante"], "color": BLOCK_COLORS["america-no-hispanohablante"], "countries": []},
        "europa": {"id": "europa", "name": BLOCK_NAMES["europa"], "color": BLOCK_COLORS["europa"], "countries": []},
        "africa": {"id": "africa", "name": BLOCK_NAMES["africa"], "color": BLOCK_COLORS["africa"], "countries": []},
        "asia": {"id": "asia", "name": BLOCK_NAMES["asia"], "color": BLOCK_COLORS["asia"], "countries": []},
        "oceania": {"id": "oceania", "name": BLOCK_NAMES["oceania"], "color": BLOCK_COLORS["oceania"], "countries": []},
    }

    # Populate countries in blocks
    seen_countries = set()
    for country_name, block_id in COUNTRY_BLOCK_MAP.items():
        c_id = slugify(country_name)
        if c_id not in seen_countries:
            seen_countries.add(c_id)
            blocks_dict[block_id]["countries"].append({"id": c_id, "name": country_name})

    blocks_def = list(blocks_dict.values())

    for y in all_years:
        d = d_leg if int(y) <= 2020 else d_mod
        tot_global = d.get("Total", {}).get(y, 0)

        block_values = {}
        continent_totals = {b_id: 0 for b_id in blocks_dict.keys()}
        country_values_flat = [{"total": tot_global}]

        for b_id, b_info in blocks_dict.items():
            b_countries_dict = {}
            b_sum = 0
            for c_info in b_info["countries"]:
                c_name = c_info["name"]
                c_id = c_info["id"]
                val = d.get(c_name, {}).get(y, 0)
                b_countries_dict[c_id] = val
                b_sum += val
                country_values_flat.append({c_id: val})

            continent_totals[b_id] = b_sum
            block_values[b_id] = {
                "total": b_sum,
                "countries": b_countries_dict
            }

        calculated_global = sum(continent_totals.values())
        if tot_global == 0 and calculated_global > 0:
            tot_global = calculated_global
            country_values_flat[0] = {"total": tot_global}

        annual_blocks.append({
            "year": y,
            "total": tot_global,
            "blocks": block_values,
        })

        continents_points.append({
            "year": y,
            "value": [{"total": tot_global}] + [{b_id: continent_totals[b_id]} for b_id in blocks_dict.keys()]
        })

        data_points.append({"year": y, "value": country_values_flat})

    today_str = date.today().isoformat()

    return {
        "id": "inmigracion-procedencia",
        "category": "Pensiones y Demografía",
        "question": "¿Cuál es la evolución de la inmigración procedente del extranjero en España?",
        "chartType": "bar",
        "unit": "personas",
        "blocks": blocks_def,
        "annualBlocks": annual_blocks,
        "dataPoints": data_points,
        "continentsDataPoints": continents_points,
        "contextNotes": [
            "Flujo anual total de inmigraciones procedentes del extranjero (ambos sexos) desde 2008 hasta 2024, enlazando la Estadística de Migraciones (2008-2020) y la EMCR (2021-2024) del INE.",
            "Agrupación en bloques continentales/lingüísticos con desglose de todos los países individuales procedentes de fuentes oficiales, sin agrupaciones artificiales en 'Resto de...'.",
        ],
        "sources": [
            {
                "institution": "Instituto Nacional de Estadística (INE)",
                "title": "Estadística de Migraciones y Cambios de Residencia (EMCR)",
                "tableId": "69690",
                "period": "2021-2024",
                "lastUpdated": "2024-12-01",
                "url": "https://www.ine.es/jaxiT3/Tabla.htm?t=69690",
            },
            {
                "institution": "Instituto Nacional de Estadística (INE)",
                "title": "Estadística de Migraciones (Serie histórica)",
                "tableId": "24295",
                "period": "2008-2020",
                "lastUpdated": "2021-12-01",
                "url": "https://www.ine.es/jaxiT3/Tabla.htm?t=24295",
            },
        ],
        "last_updated": today_str,
    }


if __name__ == "__main__":
    raw_legacy = fetch_ine_table(INE_LEGACY_TABLE_ID, tip="A")
    raw_modern = fetch_ine_table(INE_MODERN_TABLE_ID, tip="AM")

    card = build_consolidated_dataset(raw_legacy, raw_modern)

    success = validate_and_stage(card)
    if success:
        promote_to_data(prefix_filter="inmigracion-procedencia")
        print("\n✨ ¡Proceso completado con éxito para inmigracion-procedencia sin agrupar en 'Resto de...'!")
