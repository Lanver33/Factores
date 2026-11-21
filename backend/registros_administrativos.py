#!/usr/bin/env python3
"""
Pipeline de Ingesta: Registros Administrativos por Nacionalidad en España (AEAT, TGSS e INE).
- Descubre automáticamente todos los años disponibles en las estadísticas tributarias de la AEAT
  (asalariados y desempleados por nacionalidad; pensionistas en total nacional).
- Consulta la serie completa de afiliados extranjeros de la TGSS (PX-Web).
- Descubre y consulta la Tabla 48951 del INE (Personas según situación en la Seguridad Social
  por nacionalidad) para obtener el número exacto de pensionistas contributivos españoles y extranjeros.
"""

from __future__ import annotations

import csv
from datetime import date, datetime
import io
import math
import re
import sys
import time
import traceback
from typing import Any
from urllib.parse import urljoin

from bs4 import BeautifulSoup
import requests

from utils import publish_dataset

SLUG = "registros-administrativos-nacionalidad"
START_YEAR = 2014

AEAT_MAP_URL_TEMPLATE = (
    "https://sede.agenciatributaria.gob.es/AEAT/Contenidos_Comunes/"
    "La_Agencia_Tributaria/Estadisticas/Publicaciones/sites/mercado/{year}/mapa.html"
)
AEAT_PORTAL_URL = (
    "https://sede.agenciatributaria.gob.es/AEAT/Contenidos_Comunes/"
    "La_Agencia_Tributaria/Estadisticas/Publicaciones/sites/mercado/mercado.html"
)

TGSS_PXWEB_TABLE_URL = (
    "https://w6.seg-social.es/PXWeb/api/v1/es/Afiliados_extranjeros/"
    "Afiliados_extranjeros/Afiliados_extranjeros_ultimo_dia/"
    "Afil_ext_ult_dia_pais_reg_sexo.px"
)
TGSS_FALLBACK_CSV_URL = (
    "https://w6.seg-social.es/PXWeb/sq/"
    "5724c901-f5c9-42d8-9d13-26506ee6a261"
)
TGSS_PORTAL_URL = (
    "https://w6.seg-social.es/PXWeb/pxweb/es/Afiliados_extranjeros/"
    "Afiliados_extranjeros__Afiliados_extranjeros_ultimo_dia/"
)

INE_PENSIONERS_TABLE_ID = "48951"
INE_PENSIONERS_PORTAL_URL = "https://www.ine.es/jaxi/Tabla.htm?tpx=48951&L=0"
INE_PENSIONERS_DATA_URL = "https://www.ine.es/jaxi/Datos.htm?tpx=48951&L=0"

HEADERS = {
    "User-Agent": "Factores-public-data-ingestion/2.6 (+https://factores.es)",
    "Accept": "text/html,text/csv,text/plain,application/json,*/*",
}
TIMEOUT = 45
RETRIES = 3

SEX_ALIASES = {
    "total": "total",
    "ambos sexos": "total",
    "ambos": "total",
    "varón": "male",
    "varon": "male",
    "hombre": "male",
    "hombres": "male",
    "mujer": "female",
    "mujeres": "female",
    "no consta": "unknown",
    "desconocido": "unknown",
}

NATIONALITY_ALIASES = {
    "total": "total",
    "total nacionalidad": "total",
    "española": "spanish",
    "espanola": "spanish",
    "español": "spanish",
    "nacionalidad española": "spanish",
    "extranjera": "foreign",
    "extranjero": "foreign",
    "nacionalidad extranjera": "foreign",
    "unión europea": "eu27",
    "union europea": "eu27",
    "resto de europa": "nonEu",
}

POPULATION_SPECS = {
    "asalariados": {
        "key": "salariedWorkers",
        "measures": ["headcount", "paymentsPerPerson", "totalWagesEur", "averageAnnualWageEur"],
    },
    "desempleados": {
        "key": "unemploymentRecipients",
        "measures": ["recipients", "averageBenefitEur"],
    },
    "desempleo": {
        "key": "unemploymentRecipients",
        "measures": ["recipients", "averageBenefitEur"],
    },
    "pensionistas": {
        "key": "pensionRecipients",
        "measures": ["recipients", "paymentsPerPerson", "averagePensionEur"],
    },
    "pensiones": {
        "key": "pensionRecipients",
        "measures": ["recipients", "paymentsPerPerson", "averagePensionEur"],
    },
}


def fetch(
    url: str,
    *,
    method: str = "GET",
    json_body: dict[str, Any] | None = None,
    allow_404: bool = False,
) -> requests.Response | None:
    last_error: Exception | None = None
    for attempt in range(RETRIES):
        try:
            if method == "POST":
                response = requests.post(url, json=json_body, headers=HEADERS, timeout=TIMEOUT)
            else:
                response = requests.get(url, headers=HEADERS, timeout=TIMEOUT)

            if allow_404 and response.status_code == 404:
                return None

            if response.status_code in {429, 500, 502, 503, 504} and attempt < RETRIES - 1:
                time.sleep(2 ** attempt)
                continue

            response.raise_for_status()
            return response
        except requests.RequestException as exc:
            last_error = exc
            if attempt < RETRIES - 1:
                time.sleep(2 ** attempt)
            else:
                raise
    raise RuntimeError(f"Error conectando con {url}: {last_error}")


def normalized_label(value: str) -> str:
    return re.sub(r"\s+", " ", value.replace("\xa0", " ")).strip()


def parse_number(value: str) -> int | float | None:
    raw = str(value).strip().replace("\xa0", " ")
    if raw in {"", "-", "—", "…", "..", ":", "n.d.", "nd"}:
        return None
    raw = raw.replace(" ", "")
    if "," in raw and "." in raw:
        if raw.rfind(",") > raw.rfind("."):
            raw = raw.replace(".", "").replace(",", ".")
        else:
            raw = raw.replace(",", "")
    elif "," in raw:
        raw = raw.replace(".", "").replace(",", ".")
    else:
        if re.fullmatch(r"-?\d{1,3}(\.\d{3})+", raw):
            raw = raw.replace(".", "")
    try:
        number = float(raw)
    except ValueError:
        return None
    if not math.isfinite(number):
        return None
    return int(number) if number.is_integer() else round(number, 2)


def decode_text_bytes(content: bytes) -> str:
    for encoding in ("utf-8-sig", "cp1252", "latin-1"):
        try:
            return content.decode(encoding)
        except UnicodeDecodeError:
            continue
    raise ValueError("No se pudo decodificar la respuesta textual de la fuente.")


def discover_aeat_edition_urls(start_year: int = START_YEAR) -> dict[str, list[tuple[str, str]]]:
    current_year = date.today().year
    discovered: dict[str, list[tuple[str, str]]] = {}
    exclude_words = [
        "comunidad",
        "provincia",
        "sector",
        "tramo",
        "pagador",
        "módulo",
        "modulo",
        "entidades",
        "ccaa",
        "centila",
        "decila",
    ]

    for year in range(start_year, current_year + 1):
        map_url = AEAT_MAP_URL_TEMPLATE.format(year=year)
        resp = fetch(map_url, allow_404=True)
        if resp is None:
            continue

        soup = BeautifulSoup(decode_text_bytes(resp.content), "html.parser")
        year_links: list[tuple[str, str]] = []
        seen_urls: set[str] = set()

        for anchor in soup.find_all("a", href=True):
            if anchor["href"].startswith("javascript"):
                continue
            label = normalized_label(anchor.get_text(" ", strip=True))
            label_cf = label.casefold()

            if any(w in label_cf for w in exclude_words):
                continue

            if (
                any(pop in label_cf for pop in ("asalariados", "desempleados", "pensionistas"))
                and "edad" in label_cf
                and "sexo" in label_cf
            ):
                candidate = urljoin(map_url, anchor["href"])
                if candidate not in seen_urls:
                    seen_urls.add(candidate)
                    year_links.append((candidate, label))

        if year_links:
            discovered[str(year)] = year_links

    return discovered


def _match_population_spec(
    soup: BeautifulSoup, link_label: str, table_header_text: str
) -> dict[str, Any] | None:
    title_text = normalized_label(soup.title.get_text(" ", strip=True)) if soup.title else ""
    headings_text = " ".join(
        normalized_label(h.get_text(" ", strip=True))
        for h in soup.find_all(["h1", "h2", "h3", "h4", "caption"])
    )
    candidates = [link_label, title_text, headings_text, table_header_text]
    for candidate in candidates:
        cf = candidate.casefold()
        if "asalariad" in cf:
            return POPULATION_SPECS["asalariados"]
        if "desemplead" in cf or "desempleo" in cf:
            return POPULATION_SPECS["desempleados"]
        if "pensionist" in cf or "pensiones" in cf:
            return POPULATION_SPECS["pensionistas"]
    return None


def parse_aeat_page(
    url: str, html: str, link_label: str = ""
) -> tuple[list[dict[str, Any]], list[tuple[str, str]]]:
    soup = BeautifulSoup(html, "html.parser")
    page_text = normalized_label(soup.get_text(" ", strip=True))

    sibling_links: list[tuple[str, str]] = []
    for a in soup.find_all("a", href=True):
        a_text = normalized_label(a.get_text(" ", strip=True))
        a_cf = a_text.casefold()
        if a_cf in {"española", "extranjera", "nacionalidad española", "nacionalidad extranjera"}:
            cand = urljoin(url, a["href"])
            if cand != url and not a["href"].startswith("javascript"):
                sibling_links.append((cand, f"{link_label} Nacionalidad: {a_text}"))

    year_match = re.search(r"Ejercicio\s+(20\d{2})", page_text, re.I) or re.search(r"/(20\d{2})/", url)
    if not year_match:
        return [], sibling_links
    year = year_match.group(1)

    page_nat_key: str | None = None
    lbl_cf = link_label.casefold()
    if "nacionalidad: española" in lbl_cf or "nacionalidad: espanola" in lbl_cf:
        page_nat_key = "spanish"
    elif "nacionalidad: extranjera" in lbl_cf:
        page_nat_key = "foreign"
    elif "nacionalidad: total" in lbl_cf:
        page_nat_key = "total"

    if not page_nat_key:
        heading = soup.find(
            lambda tag: tag.name in ["h2", "h3", "h4", "div", "p"]
            and "nacionalidad" in tag.get_text().lower()
        )
        if heading:
            txt = normalized_label(heading.get_text(" ", strip=True)).casefold()
            m = re.search(r"nacionalidad\s*:?\s*(total|española|espanola|extranjera)", txt)
            if m:
                page_nat_key = NATIONALITY_ALIASES.get(m.group(1))

    page_nat_key = page_nat_key or "total"

    extracted_blocks: list[dict[str, Any]] = []

    for table in soup.find_all("table"):
        parsed_rows: list[list[str]] = []
        for tr in table.find_all("tr"):
            cells = [normalized_label(c.get_text(" ", strip=True)) for c in tr.find_all(["th", "td"])]
            if cells:
                parsed_rows.append(cells)

        if len(parsed_rows) < 2:
            continue

        table_header_text = " ".join(" ".join(r) for r in parsed_rows[:5])
        matched_spec = _match_population_spec(soup, link_label, table_header_text)
        if not matched_spec:
            continue

        measure_names = matched_spec["measures"]
        n_meas = len(measure_names)
        pop_k = matched_spec["key"]

        sex_sections: dict[str, dict[str, dict[str, int | float]]] = {
            "total": {},
            "male": {},
            "female": {},
        }

        for row in parsed_rows:
            first_cell_cf = row[0].casefold()
            numeric_tail = [parse_number(v) for v in row[1:]]
            if all(v is None for v in numeric_tail):
                continue

            age_label = (
                "Total"
                if first_cell_cf == "esquina" or first_cell_cf.startswith("total")
                else row[0]
            )

            if len(row) >= 1 + 3 * n_meas:
                vals = [parse_number(v) for v in row[1 : 1 + 3 * n_meas]]
                if all(v is not None for v in vals):
                    for idx_sex, sex_code in enumerate(("total", "male", "female")):
                        chunk = vals[idx_sex * n_meas : (idx_sex + 1) * n_meas]
                        row_dict: dict[str, int | float | None] = {
                            m_name: chunk[i]
                            for i, m_name in enumerate(measure_names)
                        }
                        if pop_k == "unemploymentRecipients":
                            row_dict["totalBenefitsEur"] = round(row_dict["recipients"] * row_dict["averageBenefitEur"])  # type: ignore[operator]
                        elif pop_k == "pensionRecipients":
                            row_dict["totalPensionsEur"] = round(row_dict["recipients"] * row_dict["averagePensionEur"])  # type: ignore[operator]
                        sex_sections[sex_code][age_label] = row_dict  # type: ignore[assignment]
                    continue

            if len(row) >= 1 + n_meas:
                vals = [parse_number(v) for v in row[1 : 1 + n_meas]]
                if all(v is not None for v in vals):
                    row_dict = {
                        m_name: vals[i]
                        for i, m_name in enumerate(measure_names)
                    }
                    if pop_k == "unemploymentRecipients":
                        row_dict["totalBenefitsEur"] = round(row_dict["recipients"] * row_dict["averageBenefitEur"])  # type: ignore[operator]
                    elif pop_k == "pensionRecipients":
                        row_dict["totalPensionsEur"] = round(row_dict["recipients"] * row_dict["averagePensionEur"])  # type: ignore[operator]
                    sex_sections["total"][age_label] = row_dict  # type: ignore[assignment]

        for sex_code, age_bands in sex_sections.items():
            if "Total" in age_bands:
                extracted_blocks.append({
                    "year": year,
                    "populationKey": pop_k,
                    "nationalityKey": page_nat_key,
                    "sexKey": sex_code,
                    "ageBands": age_bands,
                    "url": url,
                })

        if extracted_blocks:
            break

    return extracted_blocks, sibling_links


def fetch_all_aeat_data() -> tuple[dict[str, dict[str, Any]], list[str]]:
    print("\n[1/4] 🌐 Descubriendo y descargando ediciones anuales de la AEAT...")
    edition_links = discover_aeat_edition_urls(START_YEAR)
    if not edition_links:
        raise RuntimeError("No se encontraron ediciones anuales en el portal de la AEAT.")

    raw_by_year: dict[str, dict[str, Any]] = {}
    urls_by_year: dict[str, list[str]] = {}

    for year in sorted(edition_links.keys(), key=int):
        year_bucket: dict[str, Any] = {}
        year_urls_used: list[str] = []
        queue = list(edition_links[year])
        visited: set[str] = set()

        while queue:
            url, link_label = queue.pop(0)
            if url in visited:
                continue
            visited.add(url)

            resp = fetch(url, allow_404=True)
            if resp is None:
                continue

            blocks, siblings = parse_aeat_page(url, decode_text_bytes(resp.content), link_label=link_label)
            for sib_url, sib_label in siblings:
                if sib_url not in visited:
                    queue.append((sib_url, sib_label))

            for parsed in blocks:
                pop_k = parsed["populationKey"]
                nat_k = parsed["nationalityKey"]
                sex_k = parsed["sexKey"]
                existing = year_bucket.setdefault(pop_k, {}).setdefault(nat_k, {}).get(sex_k, {})
                if len(parsed["ageBands"]) >= len(existing):
                    year_bucket[pop_k][nat_k][sex_k] = parsed["ageBands"]
                if url not in year_urls_used:
                    year_urls_used.append(url)

        # La AEAT no publica desglose por nacionalidad para pensionistas,
        # por lo que se conserva únicamente la clave 'total' sin duplicar importes.

        if year_bucket:
            raw_by_year[year] = year_bucket
            urls_by_year[year] = year_urls_used
            pops_found = ", ".join(sorted(year_bucket.keys()))
            nats_found = sorted({n for p in year_bucket.values() for n in p.keys()})
            print(f"      ✓ AEAT {year}: {len(year_urls_used)} páginas ({pops_found} | nacionalidades: {nats_found}).")
        else:
            print(f"      ⚠️ AEAT {year}: ninguna tabla coincidió con el esquema esperado.")

    if not raw_by_year:
        raise RuntimeError("Ningún año de la AEAT pudo ser extraído.")

    valid_pops_per_year: dict[str, set[str]] = {}
    for year, bucket in raw_by_year.items():
        valid_pops = {
            pop_k
            for pop_k, nat_map in bucket.items()
            if (
                "spanish" in nat_map
                and "foreign" in nat_map
                and "total" in nat_map["spanish"]
                and "total" in nat_map["foreign"]
            )
            or (
                pop_k == "pensionRecipients"
                and "total" in nat_map
                and "total" in nat_map["total"]
            )
        }
        if valid_pops:
            valid_pops_per_year[year] = valid_pops

    if not valid_pops_per_year:
        raise RuntimeError("Ningún año de la AEAT contiene desglose válido por nacionalidad.")

    common_populations = set.intersection(*valid_pops_per_year.values())
    if not common_populations:
        all_pops = {p for pops in valid_pops_per_year.values() for p in pops}
        common_populations = {
            p for p in all_pops
            if sum(1 for pops in valid_pops_per_year.values() if p in pops) >= max(2, len(valid_pops_per_year) // 2)
        }

    by_year: dict[str, dict[str, Any]] = {}
    used_urls: list[str] = []
    for year in sorted(valid_pops_per_year.keys(), key=int):
        if common_populations.issubset(valid_pops_per_year[year]):
            by_year[year] = {
                pop_k: raw_by_year[year][pop_k]
                for pop_k in sorted(common_populations)
            }
            used_urls.extend(urls_by_year[year])
        else:
            print(f"      ⚠️ AEAT {year}: omitido por no incluir todas las poblaciones comunes ({sorted(common_populations)}).")

    if not by_year:
        raise RuntimeError("Ningún año de la AEAT cumplió con la estructura común esperada.")

    return by_year, used_urls


def parse_ine_pensioners_csv(text: str) -> dict[str, dict[str, int]]:
    """
    Analiza el CSV semicolon-delimited de la Tabla 48951 del INE:
    'Personas según situación en la Seguridad Social por nacionalidad' (en miles).
    Suma las categorías con pensión contributiva:
      - 'Pensión contributiva de la Seguridad Social'
      - 'Alta laboral y pensión contributiva de la Seguridad Social'
    para el total poblacional ('Personas con y sin discapacidad' == 'Total').
    """
    rows = list(csv.reader(io.StringIO(text), delimiter=";", quotechar='"'))
    if len(rows) < 2:
        raise ValueError("CSV de Tabla 48951 del INE vacío o demasiado corto.")

    headers = [normalized_label(c).casefold() for c in rows[0]]
    try:
        idx_nat = next(i for i, h in enumerate(headers) if "nacionalidad" in h)
        idx_sit = next(i for i, h in enumerate(headers) if "situaci" in h)
        idx_dis = next((i for i, h in enumerate(headers) if "discapacidad" in h), None)
        idx_per = next(i for i, h in enumerate(headers) if "periodo" in h or "año" in h)
        idx_val = next(i for i, h in enumerate(headers) if "total" in h or "valor" in h)
    except StopIteration as exc:
        raise ValueError(f"Columnas inesperadas en Tabla 48951 del INE: {rows[0]}") from exc

    accum: dict[str, dict[str, float]] = {}

    for row in rows[1:]:
        if len(row) <= max(idx_nat, idx_sit, idx_per, idx_val):
            continue

        if idx_dis is not None:
            dis_label = normalized_label(row[idx_dis]).casefold()
            if dis_label != "total":
                continue

        sit_label = normalized_label(row[idx_sit]).casefold()
        if "pensión contributiva" not in sit_label and "pension contributiva" not in sit_label:
            continue

        nat_label = normalized_label(row[idx_nat]).casefold()
        nat_key = NATIONALITY_ALIASES.get(nat_label)
        if nat_key not in {"total", "spanish", "foreign"}:
            continue

        period = normalized_label(row[idx_per])
        if not re.fullmatch(r"20\d{2}", period) or int(period) < START_YEAR:
            continue

        val_thousands = parse_number(row[idx_val])
        if val_thousands is None:
            continue

        accum.setdefault(period, {})
        accum[period][nat_key] = accum[period].get(nat_key, 0.0) + float(val_thousands)

    result: dict[str, dict[str, int]] = {}
    for year, nat_vals in sorted(accum.items(), key=lambda kv: int(kv[0])):
        if {"total", "spanish", "foreign"}.issubset(nat_vals.keys()):
            result[year] = {
                nat_k: int(round(v_thousands * 1000))
                for nat_k, v_thousands in nat_vals.items()
            }

    return result


INE_PENSIONERS_CSV_URLS = (
    "https://www.ine.es/jaxi/files/tpx/es/csv_bdsc/48951.csv",
    "https://www.ine.es/jaxi/files/tpx/csv_bdsc/48951.csv",
)


def fetch_ine_pensioner_headcounts() -> dict[str, dict[str, int]]:
    """
    Descarga directamente el CSV semicolon-delimited de la Tabla 48951 del INE
    y extrae el número de pensionistas contributivos por nacionalidad (española vs. extranjera).
    """
    print("\n[2/4] 🌐 Descargando pensionistas contributivos por nacionalidad (INE Tabla 48951)...")

    for csv_url in INE_PENSIONERS_CSV_URLS:
        try:
            csv_resp = fetch(csv_url, allow_404=True)
            if csv_resp is None:
                continue
            parsed = parse_ine_pensioners_csv(decode_text_bytes(csv_resp.content))
            if parsed:
                print(
                    f"      ✓ INE Tabla 48951 decodificada: {len(parsed)} años obtenidos "
                    f"({min(parsed)}–{max(parsed)})."
                )
                return parsed
        except Exception as exc:
            print(f"      ⚠️ Error leyendo CSV ({csv_url}): {exc}")

    print("      ⚠️ Advertencia: No se pudo extraer la Tabla 48951 del INE; continuando sin recuento de pensionistas por nacionalidad.")
    return {}
def parse_tgss_csv_text(text: str) -> dict[str, dict[str, Any]]:
    rows = list(csv.reader(io.StringIO(text), delimiter=";", quotechar='"'))
    if len(rows) < 3:
        raise ValueError(f"CSV de la TGSS demasiado corto ({len(rows)} filas).")

    header_index = None
    for idx, row in enumerate(rows[:10]):
        labels = [normalized_label(c).casefold() for c in row]
        if len(labels) >= 3 and labels[0] in {"período", "periodo"} and labels[1] in {"país", "pais"}:
            header_index = idx
            break

    if header_index is None:
        raise ValueError("No se encontró la fila de cabecera (Período;País;...) en el CSV de la TGSS.")

    headers = [normalized_label(c) for c in rows[header_index]]
    regime_columns = headers[2:]
    if not any("regimen" in h.casefold() or "régimen" in h.casefold() for h in regime_columns):
        raise ValueError(f"Columnas de régimen inesperadas en TGSS: {regime_columns}")

    periods_by_year: dict[str, dict[str, dict[str, dict[str, int | float]]]] = {}

    for line_num, row in enumerate(rows[header_index + 1 :], start=header_index + 2):
        if not row or not any(c.strip() for c in row):
            continue
        if len(row) != len(headers):
            raise ValueError(f"Fila {line_num} de TGSS tiene {len(row)} columnas (esperadas {len(headers)}).")

        raw_period = normalized_label(row[0])
        raw_country = normalized_label(row[1])
        if not raw_period or not raw_country:
            continue

        if re.fullmatch(r"\d{8}", raw_period):
            period_iso = datetime.strptime(raw_period, "%Y%m%d").date().isoformat()
            year = period_iso[:4]
        elif re.fullmatch(r"20\d{2}", raw_period):
            period_iso = raw_period
            year = raw_period
        else:
            continue

        if int(year) < START_YEAR:
            continue

        country_dict: dict[str, int | float] = {}
        for regime_label, raw_val in zip(regime_columns, row[2:]):
            val = parse_number(raw_val)
            if val is not None:
                clean_regime = re.sub(r"\s+TOTAL\s+SEXO$", "", regime_label, flags=re.I).strip()
                country_dict[clean_regime] = val

        if country_dict:
            periods_by_year.setdefault(year, {}).setdefault(period_iso, {})[raw_country] = country_dict

    if not periods_by_year:
        raise ValueError("El CSV de la TGSS no produjo registros numéricos válidos.")

    result_by_year: dict[str, dict[str, Any]] = {}
    for year, p_map in sorted(periods_by_year.items(), key=lambda kv: int(kv[0])):
        latest_period = max(p_map.keys())
        result_by_year[year] = {
            "referencePeriod": latest_period,
            "periodsAvailable": sorted(p_map.keys()),
            "affiliatesByCountryAndRegime": p_map[latest_period],
        }

    return result_by_year


def fetch_all_tgss_data() -> tuple[dict[str, dict[str, Any]], str]:
    print("\n[3/4] 🌐 Descargando serie histórica de afiliados extranjeros de la TGSS...")

    try:
        meta_resp = fetch(TGSS_PXWEB_TABLE_URL)
        if meta_resp is not None:
            meta = meta_resp.json()
            variables = meta.get("variables", [])
            if variables:
                query_items = []
                for var in variables:
                    code = var["code"]
                    values = var.get("values", [])
                    if "sexo" in code.casefold():
                        total_vals = [
                            v for v, t in zip(values, var.get("valueTexts", []))
                            if "total" in t.casefold()
                        ]
                        selected = total_vals if total_vals else values
                    else:
                        selected = values
                    query_items.append({
                        "code": code,
                        "selection": {"filter": "item", "values": selected},
                    })

                px_payload = {
                    "query": query_items,
                    "response": {"format": "csv"},
                }
                csv_resp = fetch(TGSS_PXWEB_TABLE_URL, method="POST", json_body=px_payload)
                if csv_resp is not None:
                    parsed = parse_tgss_csv_text(decode_text_bytes(csv_resp.content))
                    print(f"      ✓ TGSS PX-Web API decodificada: {len(parsed)} años obtenidos.")
                    return parsed, TGSS_PORTAL_URL
    except Exception as exc:
        print(f"      ⚠️ Consulta PX-Web API directa no disponible ({exc}); usando enlace oficial de consulta...")

    fallback_resp = fetch(TGSS_FALLBACK_CSV_URL)
    if fallback_resp is None:
        raise RuntimeError("No se pudo descargar el CSV oficial de la TGSS.")
    parsed = parse_tgss_csv_text(decode_text_bytes(fallback_resp.content))
    print(f"      ✓ TGSS CSV oficial decodificado: {len(parsed)} años obtenidos.")
    return parsed, TGSS_FALLBACK_CSV_URL


def build_payload(
    aeat_by_year: dict[str, dict[str, Any]],
    tgss_by_year: dict[str, dict[str, Any]],
    ine_pensioners_by_year: dict[str, dict[str, int]],
    tgss_source_url: str,
) -> dict[str, Any]:
    print("\n[4/4] ⚖️ Consolidando y validando registros administrativos...")
    all_years = sorted(
        set(aeat_by_year.keys()) | set(tgss_by_year.keys()) | set(ine_pensioners_by_year.keys()),
        key=int,
    )
    if not all_years:
        raise ValueError("No hay años disponibles para consolidar.")

    annual_records: list[dict[str, Any]] = []
    data_points: list[dict[str, Any]] = []

    for year in all_years:
        aeat_rec = aeat_by_year.get(year)
        tgss_rec = tgss_by_year.get(year)
        ine_pen_rec = ine_pensioners_by_year.get(year)

        if aeat_rec:
            for pop_key, nat_map in aeat_rec.items():
                for nat_key, sex_map in nat_map.items():
                    for sex_key, age_map in sex_map.items():
                        for age_label, metrics in age_map.items():
                            for m_name, m_val in metrics.items():
                                if m_val is None:
                                    continue
                                if not isinstance(m_val, (int, float)) or not math.isfinite(m_val) or m_val < 0:
                                    raise ValueError(
                                        f"Valor corrupto o negativo en AEAT {year} {pop_key}/{nat_key}/{sex_key}/{age_label}: {m_name}={m_val}"
                                    )

            # Inyectar el número oficial de pensionistas por nacionalidad (INE Tabla 48951)
            # dejando los importes en None ya que la AEAT no desglosa cuantías por nacionalidad.
            if ine_pen_rec and "pensionRecipients" in aeat_rec:
                pen_map = aeat_rec["pensionRecipients"]
                for nat_k in ("spanish", "foreign"):
                    if nat_k in ine_pen_rec:
                        pen_map.setdefault(nat_k, {})["total"] = {
                            "Total": {
                                "recipients": ine_pen_rec[nat_k],
                                "paymentsPerPerson": None,
                                "averagePensionEur": None,
                                "totalPensionsEur": None,
                            }
                        }

        headline_foreign_affiliates: int | float | None = None
        if tgss_rec:
            aff_map = tgss_rec["affiliatesByCountryAndRegime"]
            for country, regimes in aff_map.items():
                for regime, count in regimes.items():
                    if not isinstance(count, (int, float)) or not math.isfinite(count) or count < 0:
                        raise ValueError(
                            f"Valor corrupto o negativo en TGSS {year} {country}/{regime}: {count}"
                        )

            total_country = aff_map.get("TOTAL") or aff_map.get("Total")
            if total_country:
                for reg_name, val in total_country.items():
                    if "total" in reg_name.casefold():
                        headline_foreign_affiliates = val
                        break
                if headline_foreign_affiliates is None:
                    headline_foreign_affiliates = next(iter(total_country.values()), None)

        annual_records.append({
            "year": year,
            "aeat": aeat_rec,
            "tgss": tgss_rec,
            "ine": {
                "contributoryPensionersByNationality": ine_pen_rec,
            } if ine_pen_rec else None,
        })

        if headline_foreign_affiliates is not None:
            data_points.append({
                "year": year,
                "value": headline_foreign_affiliates,
            })

    if not data_points:
        raise ValueError("No se pudieron construir dataPoints cronológicos principales.")

    today_str = date.today().isoformat()
    aeat_years = sorted(aeat_by_year.keys(), key=int)
    tgss_years = sorted(tgss_by_year.keys(), key=int)
    ine_years = sorted(ine_pensioners_by_year.keys(), key=int)

    sources = [
        {
            "institution": "Agencia Estatal de Administración Tributaria (AEAT)",
            "shortName": "AEAT",
            "title": "Mercado de trabajo y pensiones en las fuentes tributarias (Nacionalidad y Sexo)",
            "period": f"{aeat_years[0]}–{aeat_years[-1]}",
            "lastUpdated": today_str,
            "url": AEAT_PORTAL_URL,
        },
        {
            "institution": "Tesorería General de la Seguridad Social (TGSS)",
            "shortName": "TGSS",
            "title": "Afiliados extranjeros a la Seguridad Social (último día del período por país y régimen)",
            "period": f"{tgss_years[0]}–{tgss_years[-1]}",
            "lastUpdated": today_str,
            "url": tgss_source_url,
        },
    ]

    if ine_years:
        sources.append({
            "institution": "Instituto Nacional de Estadística (INE)",
            "shortName": "INE",
            "title": "Personas según situación en la Seguridad Social por nacionalidad (Pensión contributiva)",
            "tableId": INE_PENSIONERS_TABLE_ID,
            "period": f"{ine_years[0]}–{ine_years[-1]}",
            "lastUpdated": today_str,
            "url": INE_PENSIONERS_PORTAL_URL,
        })

    context_notes_es = [
        "Datos procedentes directamente de registros administrativos oficiales: declaraciones tributarias (Modelo 190 de la AEAT), ficheros de afiliación de la TGSS y cruce con la Seguridad Social del INE (Tabla 48951), sin imputaciones sintéticas.",
        "Las magnitudes de asalariados y perceptores de prestaciones por desempleo de la AEAT incluyen número de perceptores y retribuciones/prestaciones brutas anuales por nacionalidad.",
        "Dado que la AEAT no desglosa el importe económico de las pensiones por nacionalidad, el número total de pensionistas contributivos por nacionalidad (española vs. extranjera) se obtiene de la Tabla 48951 del INE (en miles redondeados a personas).",
        "Los datos de la TGSS corresponden al número de afiliados extranjeros en alta laboral el último día del período de referencia disponible para cada año.",
    ]

    return {
        "id": SLUG,
        "kind": "admin-registers-nationality",
        "category": "economy-employment",
        "valueFormat": "number",
        "lastUpdated": today_str,
        "dataPoints": data_points,
        "annualRecords": annual_records,
        "contextNotes": context_notes_es,
        "sources": sources,
    }


def run_pipeline() -> dict[str, Any]:
    aeat_by_year, _ = fetch_all_aeat_data()
    ine_pensioners_by_year = fetch_ine_pensioner_headcounts()
    tgss_by_year, tgss_url = fetch_all_tgss_data()
    payload = build_payload(aeat_by_year, tgss_by_year, ine_pensioners_by_year, tgss_url)

    es_data = {
        "question": "Registros oficiales de empleo, salarios, desempleo y pensiones por nacionalidad.",
        "unit": "afiliados extranjeros",
        "contextNotes": payload["contextNotes"],
        "sources": payload["sources"],
    }

    en_data = {
        "question": "Official administrative registers of employment, wages, unemployment, and pensions by nationality.",
        "unit": "foreign affiliates",
        "contextNotes": [
            "Data sourced directly from official Spanish administrative registers: tax withholding filings (AEAT Form 190), Social Security affiliation records (TGSS), and INE Social Security status cross-tabulations (Table 48951), without synthetic imputations.",
            "AEAT figures for salaried workers and unemployment benefit recipients report both headcounts and gross annual amounts by nationality.",
            "Because AEAT does not publish euro pension expenditure by nationality, contributory pensioner headcounts split by Spanish vs. foreign nationality are sourced from INE Table 48951.",
            "TGSS figures reflect foreign nationals actively registered with Social Security on the last day of the latest available reference period for each year.",
        ],
        "sources": payload["sources"],
    }

    publish_dataset(SLUG, payload, es_data, en_data)
    return payload


if __name__ == "__main__":
    try:
        run_pipeline()
    except Exception as exc:
        print(f"\n❌ ERROR CRÍTICO EN PIPELINE DE REGISTROS ADMINISTRATIVOS: {exc}", file=sys.stderr)
        traceback.print_exc()
        sys.exit(1)
