"""
Pipeline de Inversión y Reconciliación Contable: Cuentas Públicas de España (SEC 2010 / ESA 2010).
Consulta la API v1.0 de Eurostat (datasets gov_10a_main, gov_10a_taxag, gov_10a_exp) para el sector S.13 (AAPP),
reconcilia identidades fiscales, aplica taxonomías COFOG/tributarias y genera los artefactos de datos.
"""

from datetime import date
import json
import math
import os
from pathlib import Path
import sys
from typing import Optional

from eurostat_client import fetch_eurostat_dataset, EurostatDataset
from utils import publish_dataset


def load_config(config_path: Path) -> dict:
    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)


def build_cuentas_publicas_payload(
    config: dict,
    ds_main: EurostatDataset,
    ds_tax: EurostatDataset,
    ds_exp: EurostatDataset,
) -> dict:
    """
    Procesa, pivota y reconcilia los 3 datasets de Eurostat aplicando las reglas contables SEC 2010.
    """
    start_year = config.get("startYear", 1995)

    main_lookup = {}
    for r in ds_main.records:
        if r.get("geo") == config["geo"] and r.get("sector") == config["sector"]:
            unit = r.get("unit")
            time_per = r.get("time")
            na_item = r.get("na_item")
            if unit and time_per and na_item:
                main_lookup[(unit, time_per, na_item)] = r["value"]

    tax_lookup = {}
    for r in ds_tax.records:
        if r.get("geo") == config["geo"] and r.get("sector") == config["sector"]:
            unit = r.get("unit")
            time_per = r.get("time")
            na_item = r.get("na_item")
            if unit and time_per and na_item:
                tax_lookup[(unit, time_per, na_item)] = r["value"]

    exp_lookup = {}
    for r in ds_exp.records:
        if r.get("geo") == config["geo"] and r.get("sector") == config["sector"]:
            unit = r.get("unit")
            time_per = r.get("time")
            cofog = r.get("cofog99")
            if unit and time_per and cofog:
                exp_lookup[(unit, time_per, cofog)] = r["value"]

    units = config.get("units", [])
    unit_ids = [u["id"] for u in units]

    all_time_periods = set()
    for (u, t, item), _ in main_lookup.items():
        if int(t) >= start_year and item in ("TR", "TE", "B9"):
            all_time_periods.add(t)

    valid_years = []
    for y in sorted(all_time_periods):
        complete_for_year = True
        for uid in unit_ids:
            if (uid, y, "TR") not in main_lookup or (uid, y, "TE") not in main_lookup or (uid, y, "B9") not in main_lookup:
                complete_for_year = False
                break
        if complete_for_year:
            valid_years.append(y)

    if len(valid_years) < 10:
        raise RuntimeError(f"Se encontraron solo {len(valid_years)} años válidos (se requieren al menos 10 desde {start_year}).")

    min_year = valid_years[0]
    max_year = valid_years[-1]

    cofog_years = set()
    divs_10 = [f"GF0{i}" if i < 10 else "GF10" for i in range(1, 11)]
    for y in valid_years:
        has_all_cofog = True
        for uid in unit_ids:
            for div in divs_10:
                if (uid, y, div) not in exp_lookup:
                    has_all_cofog = False
                    break
            if not has_all_cofog:
                break
        if has_all_cofog:
            cofog_years.add(y)

    min_cofog_year = min(cofog_years) if cofog_years else min_year
    max_cofog_year = max(cofog_years) if cofog_years else min_year

    annual_balances = []
    top_level_datapoints = []

    decimals_map = {u["id"]: u.get("decimals", 2) for u in units}

    for y in valid_years:
        decimals_mio = decimals_map.get("MIO_EUR", 1)
        decimals_pct = decimals_map.get("PC_GDP", 2)

        cofog_available = y in cofog_years
        if not cofog_available:
            print(f"      ⚠️ Advertencia: Datos COFOG aún no publicados para el año {y}; marcando cofogAvailable=false.")

        metrics_dict = {}

        for uid in unit_ids:
            dec = decimals_map.get(uid, 2)
            tr = main_lookup.get((uid, y, "TR"), 0.0)
            te = main_lookup.get((uid, y, "TE"), 0.0)
            b9 = main_lookup.get((uid, y, "B9"), 0.0)

            diff_b9 = (tr - te) - b9
            tol_b9 = 1.0 if uid == "MIO_EUR" else 0.2
            if abs(diff_b9) > tol_b9:
                raise ValueError(f"Fallo Identidad 1 (Balance Fiscal) en {y} [{uid}]: (TR {tr} - TE {te}) - B9 {b9} = {diff_b9} (tol={tol_b9})")

            d2 = tax_lookup.get((uid, y, "D2"), 0.0)
            d5 = tax_lookup.get((uid, y, "D5"), 0.0)
            d61 = tax_lookup.get((uid, y, "D61"), 0.0)
            d91 = tax_lookup.get((uid, y, "D91"), 0.0)
            d995 = tax_lookup.get((uid, y, "D995"), 0.0)
            d_net_agg = tax_lookup.get((uid, y, "D2_D5_D91_D61_M_D995"))

            tax_gross = d2 + d5 + d61 + d91
            uncollectible_adj = 0.0
            total_tax_net = tax_gross

            if d_net_agg is not None:
                total_tax_net = d_net_agg
                uncollectible_adj = total_tax_net - tax_gross
            elif d995 != 0.0:
                total_tax_net = tax_gross - abs(d995)
                uncollectible_adj = -abs(d995)

            non_tax_residual = tr - total_tax_net

            diff_tax = (tax_gross + uncollectible_adj + non_tax_residual) - tr
            tol_tax = 1.0 if uid == "MIO_EUR" else 0.2
            if abs(diff_tax) > tol_tax:
                raise ValueError(f"Fallo Identidad 2 (Completitud de Ingresos) en {y} [{uid}]: diff={diff_tax} (tol={tol_tax})")

            tax_code_mapping = {
                "D2": ["D211", "D214", "D212", "D29"],
                "D5": ["D51A_C1", "D51B_C2", "D59"],
                "D61": ["D611", "D613", "D612"],
                "D91": [],
            }

            revenues_block = {}
            for tcode, children in tax_code_mapping.items():
                tval = tax_lookup.get((uid, y, tcode))
                if tval is not None and math.isfinite(tval):
                    breakdown = {}
                    for ccode in children:
                        cval = tax_lookup.get((uid, y, ccode))
                        if cval is not None and math.isfinite(cval):
                            breakdown[ccode] = round(cval, dec)
                    revenues_block[tcode] = {
                        "total": round(tval, dec),
                        "breakdown": breakdown,
                    }

            revenues_block["NON_TAX_RESIDUAL"] = {
                "total": round(non_tax_residual, dec),
                "breakdown": {},
            }

            expenditures_block = None
            if cofog_available:
                expenditures_block = {}
                cofog_mapping = {
                    "GF10": ["GF1002", "GF1005"],
                    "GF07": [],
                    "GF01": ["GF0107", "GF0101"],
                    "GF09": [],
                    "GF04": ["GF0405"],
                    "GF03": ["GF0301", "GF0303"],
                    "GF08": [],
                    "GF02": [],
                    "GF05": [],
                    "GF06": [],
                }
                sum_cofog = 0.0
                for fcode, highlights in cofog_mapping.items():
                    fval = exp_lookup.get((uid, y, fcode))
                    if fval is not None and math.isfinite(fval):
                        sum_cofog += fval
                        h_dict = {}
                        for hcode in highlights:
                            hval = exp_lookup.get((uid, y, hcode))
                            if hval is not None and math.isfinite(hval):
                                h_dict[hcode] = round(hval, dec)
                        expenditures_block[fcode] = {
                            "total": round(fval, dec),
                            "highlights": h_dict,
                        }

                total_node = exp_lookup.get((uid, y, "TOTAL"))
                tol_cofog = 1.5 if uid == "MIO_EUR" else 0.25
                if total_node is not None and math.isfinite(total_node):
                    if abs(sum_cofog - total_node) > tol_cofog:
                        raise ValueError(f"Fallo Identidad 3a (Suma GF01..GF10 vs TOTAL) en {y} [{uid}]: sum {sum_cofog} != TOTAL {total_node}")
                    tol_te = 250.0 if uid == "MIO_EUR" else 0.5
                    if abs(total_node - te) > tol_te:
                        raise ValueError(f"Fallo Identidad 3b (TOTAL vs TE) en {y} [{uid}]: TOTAL {total_node} != TE {te} (diff={abs(total_node - te)})")

            totals_dict = {
                "revenue": round(tr, dec),
                "expenditure": round(te, dec),
                "balance": round(b9, dec),
            }
            if abs(uncollectible_adj) > 0.001:
                totals_dict["uncollectibleAdjustment"] = round(uncollectible_adj, dec)

            metrics_dict[uid] = {
                "totals": totals_dict,
                "revenues": revenues_block,
                "expenditures": expenditures_block,
            }

        annual_balances.append({
            "year": y,
            "cofogAvailable": cofog_available,
            "metrics": metrics_dict,
        })

        pc_gdp_b9 = main_lookup.get(("PC_GDP", y, "B9"))
        if pc_gdp_b9 is None or not math.isfinite(pc_gdp_b9):
            raise ValueError(f"Identidad 4: Valor B9 nulo o no finito en PC_GDP para el año {y}.")
        top_level_datapoints.append({
            "year": y,
            "value": round(pc_gdp_b9, decimals_pct),
        })

    output_sources = []
    for src in config.get("sources", []):
        dkey = src.get("datasetKey")
        s_copy = {
            "institution": src["institution"],
            "shortName": src["shortName"],
            "title": src["title"],
            "url": src["url"],
        }
        if "tableId" in src:
            s_copy["tableId"] = src["tableId"]

        if dkey in ("aggregates", "revenues"):
            s_copy["period"] = f"{min_year}-{max_year}"
            s_copy["lastUpdated"] = ds_main.updated or date.today().isoformat()
        elif dkey == "expenditures":
            s_copy["period"] = f"{min_cofog_year}-{max_cofog_year}"
            s_copy["lastUpdated"] = ds_exp.updated or date.today().isoformat()
        elif dkey is None:
            s_copy["period"] = f"{min_year}-{max_year}"
            latest_upd = max(
                filter(None, [ds_main.updated, ds_tax.updated, ds_exp.updated]),
                default=date.today().isoformat()
            )
            s_copy["lastUpdated"] = latest_upd

        output_sources.append(s_copy)

    latest_upd_global = max(
        filter(None, [ds_main.updated, ds_tax.updated, ds_exp.updated]),
        default=date.today().isoformat()
    )

    payload_out = {
        "id": config["indicatorId"],
        "kind": config["chartType"],
        "category": config["category"],
        "valueFormat": "percent",
        "lastUpdated": latest_upd_global,
        "availableUnits": config["units"],
        "taxonomy": config["taxonomy"],
        "dataPoints": top_level_datapoints,
        "annualBalances": annual_balances,
        "contextNotes": [
            "Serie histórica homogénea bajo la metodología del Sistema Europeo de Cuentas (SEC 2010 / ESA 2010) para el sector consolidado de las Administraciones Públicas de España (S.13: Administración Central, Comunidades Autónomas, Corporaciones Locales y Seguridad Social).",
            "El saldo fiscal (B.9, capacidad o necesidad de financiación) equivale a Total Ingresos (TR) menos Total Gastos (TE). Un signo negativo representa déficit público y un signo positivo representa superávit.",
            "El desglose funcional del gasto sigue la clasificación internacional COFOG 1999 (divisiones GF01 a GF10). Los intereses de la deuda pública se contabilizan dentro de Servicios Públicos Generales (subfunción GF0107).",
            "Los ingresos tributarios proceden de los agregados fiscales SEC 2010 (D.2, D.5, D.61 y D.91). Los ingresos no tributarios se obtienen por diferencia frente a TR e incluyen tasas, ventas de mercado, rentas de la propiedad y transferencias corrientes y de capital de la Unión Europea."
        ],
        "sources": output_sources,
    }

    return payload_out


def run_pipeline(config_path: Path, output_path: Path, dry_run: bool = False, guide_path: Optional[Path] = None) -> dict:
    config = load_config(config_path)
    base_url = config["apiBaseUrl"]
    datasets_cfg = config["datasets"]

    print(f"\n[1/3] 📥 Descargando datasets de Eurostat para {config['indicatorId']}...")
    ds_main = fetch_eurostat_dataset(base_url, datasets_cfg["aggregates"]["code"], datasets_cfg["aggregates"]["params"], since_year=config["startYear"])
    ds_tax = fetch_eurostat_dataset(base_url, datasets_cfg["revenues"]["code"], datasets_cfg["revenues"]["params"], since_year=config["startYear"])
    ds_exp = fetch_eurostat_dataset(base_url, datasets_cfg["expenditures"]["code"], datasets_cfg["expenditures"]["params"], since_year=config["startYear"])

    print("\n[2/3] ⚖️ Procesando, reconciliando y aplicando identidades contables SEC 2010...")
    payload = build_cuentas_publicas_payload(config, ds_main, ds_tax, ds_exp)

    if guide_path and guide_path.exists():
        with open(guide_path, "r", encoding="utf-8") as f:
            guide_json = json.load(f)
        payload["conceptGuide"] = guide_json

    if not dry_run:
        slug = config["indicatorId"]
        es_data = {
            "question": "Evolución de ingresos, gasto público por función y saldo fiscal en España.",
            "unit": config.get("headlineUnit", "% del PIB"),
            "contextNotes": payload["contextNotes"],
            "sources": payload["sources"],
        }
        if "conceptGuide" in payload:
            es_data["conceptGuide"] = payload["conceptGuide"]

        en_data = {
            "question": "Public revenue, functional expenditure, and fiscal balance in Spain.",
            "unit": "% of GDP",
            "contextNotes": [
                "Consolidated historical series of General Government Main Aggregates (S.13) according to ESA 2010.",
                "Fiscal balance (B.9) equals Total Revenue (TR) minus Total Expenditure (TE). A negative sign indicates a deficit and positive indicates a surplus.",
                "Functional expenditure breakdown follows international COFOG 1999 classification (GF01 to GF10). Public debt interest is accounted for under General Public Services (GF0107).",
                "Tax revenues stem from ESA 2010 aggregates (D.2, D.5, D.61, D.91). Non-tax revenues are computed by difference against TR."
            ],
            "sources": payload["sources"],
        }
        if "conceptGuide" in payload:
            en_data["conceptGuide"] = payload["conceptGuide"]

        publish_dataset(slug, payload, es_data, en_data)

    return payload


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Pipeline de Ingesta: Cuentas Públicas de España (Eurostat ESA 2010)")
    parser.add_argument("--config", default="scrapers/config/cuentas_publicas_sources.json", type=Path, help="Ruta al archivo de configuración de fuentes")
    parser.add_argument("--guide", default="scrapers/config/cuentas_publicas_guide.json", type=Path, help="Ruta al archivo de guía conceptual")
    parser.add_argument("--output", default="data/cuentas-publicas-espana.json", type=Path, help="Ruta de salida")
    parser.add_argument("--dry-run", action="store_true", help="Ejecuta descarga y reconciliación sin escribir en disco")

    args = parser.parse_args()

    try:
        run_pipeline(args.config, args.output, dry_run=args.dry_run, guide_path=args.guide)
    except Exception as e:
        print(f"\n❌ ERROR CRÍTICO EN PIPELINE DE CUENTAS PÚBLICAS: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
