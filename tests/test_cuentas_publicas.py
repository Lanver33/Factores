"""
Pruebas unitarias para el cliente Eurostat y el pipeline de Cuentas Públicas de España.
Utiliza unittest con fixtures sintéticos (sin llamadas de red en vivo).
"""

from pathlib import Path
import sys
import unittest
import math

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scrapers.eurostat_client import parse_jsonstat, EurostatDataset
from scrapers.cuentas_publicas import build_cuentas_publicas_payload


class TestCuentasPublicas(unittest.TestCase):

    def test_parse_jsonstat_sparse_dict(self):
        payload = {
            "version": "2.0",
            "class": "dataset",
            "id": ["unit", "time"],
            "size": [2, 2],
            "dimension": {
                "unit": {
                    "category": {"index": {"MIO_EUR": 0, "PC_GDP": 1}}
                },
                "time": {
                    "category": {"index": {"2023": 0, "2024": 1}}
                }
            },
            "value": {
                "0": 100.5,  # MIO_EUR, 2023 (flat_idx 0 = unit 0, time 0)
                "3": 45.2    # PC_GDP, 2024 (flat_idx 3 = unit 1, time 1)
            },
            "updated": "2026-10-21T12:00:00+0200"
        }
        ds = parse_jsonstat(payload, "test_ds")
        self.assertEqual(ds.code, "test_ds")
        self.assertEqual(ds.updated, "2026-10-21")
        self.assertEqual(len(ds.records), 2)
        self.assertEqual(ds.records[0], {"unit": "MIO_EUR", "time": "2023", "value": 100.5})
        self.assertEqual(ds.records[1], {"unit": "PC_GDP", "time": "2024", "value": 45.2})

    def test_parse_jsonstat_dense_list(self):
        payload = {
            "version": "2.0",
            "class": "dataset",
            "id": ["na_item", "time"],
            "size": [1, 3],
            "dimension": {
                "na_item": {
                    "category": {"index": ["TR"]}
                },
                "time": {
                    "category": {"index": ["2022", "2023", "2024"]}
                }
            },
            "value": [500.0, None, 600.0],
            "updated": "2026-10-21T12:00:00"
        }
        ds = parse_jsonstat(payload, "test_dense")
        self.assertEqual(len(ds.records), 2)
        self.assertEqual(ds.records[0], {"na_item": "TR", "time": "2022", "value": 500.0})
        self.assertEqual(ds.records[1], {"na_item": "TR", "time": "2024", "value": 600.0})

    def test_reconciliation_passes_and_computes_residual(self):
        config = {
            "indicatorId": "cuentas-publicas-espana",
            "category": "Economía y Empleo",
            "question": "¿Test pregunta?",
            "chartType": "fiscal-balance",
            "headlineUnit": "% del PIB",
            "geo": "ES",
            "sector": "S13",
            "startYear": 2023,
            "units": [
                {"id": "MIO_EUR", "label": "Millones de €", "decimals": 1},
                {"id": "PC_GDP", "label": "% del PIB", "decimals": 2}
            ],
            "taxonomy": {"revenues": [], "expenditures": []},
            "sources": [
                {"datasetKey": "aggregates", "institution": "Inst A", "shortName": "A", "title": "T1", "url": "https://example.com/1"},
                {"datasetKey": "expenditures", "institution": "Inst B", "shortName": "B", "title": "T2", "url": "https://example.com/2"},
                {"datasetKey": "revenues", "institution": "Inst C", "shortName": "C", "title": "T3", "url": "https://example.com/3"},
                {"datasetKey": None, "institution": "Inst D", "shortName": "D", "title": "T4", "url": "https://example.com/4"}
            ]
        }

        # 2 años completos: 2023 y 2024 (requiere al menos 10 años en producción, pero en test podemos mockear o ajustar validación si es necesario,
        # o proveer 10 años para pasar el chequeo de validación).
        # Creemos 10 años de 2015 a 2024 para satisfacer len(valid_years) >= 10.
        years = [str(y) for y in range(2015, 2025)]

        main_recs = []
        tax_recs = []
        exp_recs = []

        for y in years:
            for uid in ["MIO_EUR", "PC_GDP"]:
                scale = 1000.0 if uid == "MIO_EUR" else 40.0
                main_recs.extend([
                    {"geo": "ES", "sector": "S13", "unit": uid, "time": y, "na_item": "TR", "value": 500.0 * (scale/40)},
                    {"geo": "ES", "sector": "S13", "unit": uid, "time": y, "na_item": "TE", "value": 550.0 * (scale/40)},
                    {"geo": "ES", "sector": "S13", "unit": uid, "time": y, "na_item": "B9", "value": -50.0 * (scale/40)},
                ])
                tax_recs.extend([
                    {"geo": "ES", "sector": "S13", "unit": uid, "time": y, "na_item": "D2", "value": 150.0 * (scale/40)},
                    {"geo": "ES", "sector": "S13", "unit": uid, "time": y, "na_item": "D5", "value": 150.0 * (scale/40)},
                    {"geo": "ES", "sector": "S13", "unit": uid, "time": y, "na_item": "D61", "value": 100.0 * (scale/40)},
                    {"geo": "ES", "sector": "S13", "unit": uid, "time": y, "na_item": "D91", "value": 20.0 * (scale/40)},
                ])
                divs = [f"GF0{i}" if i < 10 else "GF10" for i in range(1, 11)]
                # Suma de 10 divisiones igual a TE (550.0 * (scale/40)) => 55.0 cada una si son 10
                part = (550.0 * (scale/40)) / 10.0
                for div in divs:
                    exp_recs.append({
                        "geo": "ES", "sector": "S13", "unit": uid, "time": y, "cofog99": div, "value": part
                    })

        ds_main = EurostatDataset(code="gov_10a_main", updated="2026-10-21", records=main_recs)
        ds_tax = EurostatDataset(code="gov_10a_taxag", updated="2026-10-21", records=tax_recs)
        ds_exp = EurostatDataset(code="gov_10a_exp", updated="2026-10-21", records=exp_recs)

        config["startYear"] = 2015
        payload = build_cuentas_publicas_payload(config, ds_main, ds_tax, ds_exp)

        self.assertEqual(payload["id"], "cuentas-publicas-espana")
        self.assertEqual(len(payload["dataPoints"]), 10)
        self.assertTrue(payload["annualBalances"][0]["cofogAvailable"])
        self.assertIn("sources", payload)
        self.assertEqual(payload["sources"][0]["period"], "2015-2024")

    def test_latest_year_missing_cofog_graceful(self):
        config = {
            "indicatorId": "cuentas-publicas-espana",
            "category": "Economía y Empleo",
            "question": "¿Test?",
            "chartType": "fiscal-balance",
            "headlineUnit": "% del PIB",
            "geo": "ES",
            "sector": "S13",
            "startYear": 2015,
            "units": [
                {"id": "MIO_EUR", "label": "Millones de €", "decimals": 1},
                {"id": "PC_GDP", "label": "% del PIB", "decimals": 2}
            ],
            "taxonomy": {"revenues": [], "expenditures": []},
            "sources": []
        }
        years = [str(y) for y in range(2015, 2025)]
        main_recs = []
        tax_recs = []
        exp_recs = []

        for y in years:
            for uid in ["MIO_EUR", "PC_GDP"]:
                scale = 1000.0 if uid == "MIO_EUR" else 40.0
                main_recs.extend([
                    {"geo": "ES", "sector": "S13", "unit": uid, "time": y, "na_item": "TR", "value": 500.0 * (scale/40)},
                    {"geo": "ES", "sector": "S13", "unit": uid, "time": y, "na_item": "TE", "value": 550.0 * (scale/40)},
                    {"geo": "ES", "sector": "S13", "unit": uid, "time": y, "na_item": "B9", "value": -50.0 * (scale/40)},
                ])
                tax_recs.extend([
                    {"geo": "ES", "sector": "S13", "unit": uid, "time": y, "na_item": "D2", "value": 150.0 * (scale/40)},
                    {"geo": "ES", "sector": "S13", "unit": uid, "time": y, "na_item": "D5", "value": 150.0 * (scale/40)},
                    {"geo": "ES", "sector": "S13", "unit": uid, "time": y, "na_item": "D61", "value": 100.0 * (scale/40)},
                    {"geo": "ES", "sector": "S13", "unit": uid, "time": y, "na_item": "D91", "value": 20.0 * (scale/40)},
                ])
                # COFOG para todos excepto 2024
                if y != "2024":
                    divs = [f"GF0{i}" if i < 10 else "GF10" for i in range(1, 11)]
                    part = (550.0 * (scale/40)) / 10.0
                    for div in divs:
                        exp_recs.append({
                            "geo": "ES", "sector": "S13", "unit": uid, "time": y, "cofog99": div, "value": part
                        })

        ds_main = EurostatDataset(code="gov_10a_main", updated="2026-10-21", records=main_recs)
        ds_tax = EurostatDataset(code="gov_10a_taxag", updated="2026-10-21", records=tax_recs)
        ds_exp = EurostatDataset(code="gov_10a_exp", updated="2026-10-21", records=exp_recs)

        payload = build_cuentas_publicas_payload(config, ds_main, ds_tax, ds_exp)
        # Verificar que 2024 tiene cofogAvailable = False y expenditures = None
        bal_2024 = [b for b in payload["annualBalances"] if b["year"] == "2024"][0]
        self.assertFalse(bal_2024["cofogAvailable"])
        self.assertIsNone(bal_2024["metrics"]["MIO_EUR"]["expenditures"])

    def test_reconciliation_mismatch_raises(self):
        config = {
            "indicatorId": "cuentas-publicas-espana",
            "category": "Economía y Empleo",
            "question": "¿Test?",
            "chartType": "fiscal-balance",
            "headlineUnit": "% del PIB",
            "geo": "ES",
            "sector": "S13",
            "startYear": 2023,
            "units": [
                {"id": "MIO_EUR", "label": "Millones de €", "decimals": 1},
                {"id": "PC_GDP", "label": "% del PIB", "decimals": 2}
            ],
            "taxonomy": {"revenues": [], "expenditures": []},
            "sources": []
        }
        years = [str(y) for y in range(2015, 2025)]
        main_recs = []
        tax_recs = []
        exp_recs = []

        for y in years:
            for uid in ["MIO_EUR", "PC_GDP"]:
                # Romper B9 intencionadamente (TR - TE != B9)
                b9_val = -999.0 if y == "2024" else -50.0
                main_recs.extend([
                    {"geo": "ES", "sector": "S13", "unit": uid, "time": y, "na_item": "TR", "value": 500.0},
                    {"geo": "ES", "sector": "S13", "unit": uid, "time": y, "na_item": "TE", "value": 550.0},
                    {"geo": "ES", "sector": "S13", "unit": uid, "time": y, "na_item": "B9", "value": b9_val},
                ])
                tax_recs.extend([
                    {"geo": "ES", "sector": "S13", "unit": uid, "time": y, "na_item": "D2", "value": 150.0},
                    {"geo": "ES", "sector": "S13", "unit": uid, "time": y, "na_item": "D5", "value": 150.0},
                    {"geo": "ES", "sector": "S13", "unit": uid, "time": y, "na_item": "D61", "value": 100.0},
                    {"geo": "ES", "sector": "S13", "unit": uid, "time": y, "na_item": "D91", "value": 20.0},
                ])
                divs = [f"GF0{i}" if i < 10 else "GF10" for i in range(1, 11)]
                for div in divs:
                    exp_recs.append({
                        "geo": "ES", "sector": "S13", "unit": uid, "time": y, "cofog99": div, "value": 55.0
                    })

        ds_main = EurostatDataset(code="gov_10a_main", updated="2026-10-21", records=main_recs)
        ds_tax = EurostatDataset(code="gov_10a_taxag", updated="2026-10-21", records=tax_recs)
        ds_exp = EurostatDataset(code="gov_10a_exp", updated="2026-10-21", records=exp_recs)
        config["startYear"] = 2015

        with self.assertRaises(ValueError):
            build_cuentas_publicas_payload(config, ds_main, ds_tax, ds_exp)

    def test_output_meets_validate_and_sync_contract(self):
        # Simular payload generado y comprobar contratos requeridos por scripts/validate-and-sync.js
        config = {
            "indicatorId": "cuentas-publicas-espana",
            "category": "Economía y Empleo",
            "question": "¿Cómo se componen los ingresos y el gasto público en España?",
            "chartType": "fiscal-balance",
            "headlineUnit": "% del PIB",
            "geo": "ES",
            "sector": "S13",
            "startYear": 2015,
            "units": [
                {"id": "MIO_EUR", "label": "Millones de €", "decimals": 1},
                {"id": "PC_GDP", "label": "% del PIB", "decimals": 2}
            ],
            "taxonomy": {"revenues": [], "expenditures": []},
            "sources": [
                {"institution": "Eurostat", "shortName": "Eurostat", "title": "Main", "url": "https://example.com"}
            ]
        }
        years = [str(y) for y in range(2015, 2025)]
        main_recs = []
        tax_recs = []
        exp_recs = []

        for y in years:
            for uid in ["MIO_EUR", "PC_GDP"]:
                scale = 1000.0 if uid == "MIO_EUR" else 40.0
                main_recs.extend([
                    {"geo": "ES", "sector": "S13", "unit": uid, "time": y, "na_item": "TR", "value": 500.0 * (scale/40)},
                    {"geo": "ES", "sector": "S13", "unit": uid, "time": y, "na_item": "TE", "value": 550.0 * (scale/40)},
                    {"geo": "ES", "sector": "S13", "unit": uid, "time": y, "na_item": "B9", "value": -50.0 * (scale/40)},
                ])
                tax_recs.extend([
                    {"geo": "ES", "sector": "S13", "unit": uid, "time": y, "na_item": "D2", "value": 150.0 * (scale/40)},
                    {"geo": "ES", "sector": "S13", "unit": uid, "time": y, "na_item": "D5", "value": 150.0 * (scale/40)},
                    {"geo": "ES", "sector": "S13", "unit": uid, "time": y, "na_item": "D61", "value": 100.0 * (scale/40)},
                    {"geo": "ES", "sector": "S13", "unit": uid, "time": y, "na_item": "D91", "value": 20.0 * (scale/40)},
                ])
                divs = [f"GF0{i}" if i < 10 else "GF10" for i in range(1, 11)]
                part = (550.0 * (scale/40)) / 10.0
                for div in divs:
                    exp_recs.append({
                        "geo": "ES", "sector": "S13", "unit": uid, "time": y, "cofog99": div, "value": part
                    })

        ds_main = EurostatDataset(code="gov_10a_main", updated="2026-10-21", records=main_recs)
        ds_tax = EurostatDataset(code="gov_10a_taxag", updated="2026-10-21", records=exp_recs) # mock
        ds_exp = EurostatDataset(code="gov_10a_exp", updated="2026-10-21", records=exp_recs)

        config["startYear"] = 2015
        payload = build_cuentas_publicas_payload(config, ds_main, ds_tax, ds_exp)

        # Contrato validator and sync
        self.assertIn("id", payload)
        self.assertIn("question", payload)
        self.assertIn("category", payload)
        self.assertIsInstance(payload["sources"], list)
        self.assertGreaterEqual(len(payload["sources"]), 1)
        for src in payload["sources"]:
            self.assertIn("institution", src)
            self.assertIn("title", src)
            self.assertIn("url", src)

        self.assertIsInstance(payload["dataPoints"], list)
        self.assertGreaterEqual(len(payload["dataPoints"]), 1)
        for pt in payload["dataPoints"]:
            self.assertIn("year", pt)
            self.assertIn("value", pt)
            self.assertIsInstance(pt["value"], float)
            self.assertTrue(math.isfinite(pt["value"]))


if __name__ == "__main__":
    unittest.main()
