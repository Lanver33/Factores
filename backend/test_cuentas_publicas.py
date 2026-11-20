"""
Pruebas unitarias para el cliente Eurostat y el pipeline de Cuentas Públicas de España.
Utiliza unittest con fixtures sintéticos (sin llamadas de red en vivo).
"""

from pathlib import Path
import sys
import unittest

from eurostat_client import parse_jsonstat, EurostatDataset
from cuentas_publicas import build_cuentas_publicas_payload


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
                "0": 100.5,
                "3": 45.2
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
            "category": "economy-employment",
            "question": "¿Test pregunta?",
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
                {"datasetKey": "aggregates", "institution": "Inst A", "shortName": "A", "title": "T1", "url": "https://example.com/1"},
                {"datasetKey": "expenditures", "institution": "Inst B", "shortName": "B", "title": "T2", "url": "https://example.com/2"},
                {"datasetKey": "revenues", "institution": "Inst C", "shortName": "C", "title": "T3", "url": "https://example.com/3"},
                {"datasetKey": None, "institution": "Inst D", "shortName": "D", "title": "T4", "url": "https://example.com/4"}
            ]
        }

        years = [str(y) for y in range(2015, 2025)]

        main_recs = []
        tax_recs = []
        exp_recs = []

        for y in years:
            main_recs.extend([
                {"geo": "ES", "sector": "S13", "unit": "MIO_EUR", "time": y, "na_item": "TR", "value": 500000.0},
                {"geo": "ES", "sector": "S13", "unit": "MIO_EUR", "time": y, "na_item": "TE", "value": 550000.0},
                {"geo": "ES", "sector": "S13", "unit": "MIO_EUR", "time": y, "na_item": "B9", "value": -50000.0},
                {"geo": "ES", "sector": "S13", "unit": "PC_GDP", "time": y, "na_item": "TR", "value": 40.0},
                {"geo": "ES", "sector": "S13", "unit": "PC_GDP", "time": y, "na_item": "TE", "value": 44.0},
                {"geo": "ES", "sector": "S13", "unit": "PC_GDP", "time": y, "na_item": "B9", "value": -4.0},
            ])
            tax_recs.extend([
                {"geo": "ES", "sector": "S13", "unit": "MIO_EUR", "time": y, "na_item": "D2", "value": 150000.0},
                {"geo": "ES", "sector": "S13", "unit": "MIO_EUR", "time": y, "na_item": "D5", "value": 120000.0},
                {"geo": "ES", "sector": "S13", "unit": "MIO_EUR", "time": y, "na_item": "D61", "value": 180000.0},
                {"geo": "ES", "sector": "S13", "unit": "MIO_EUR", "time": y, "na_item": "D91", "value": 5000.0},
                {"geo": "ES", "sector": "S13", "unit": "PC_GDP", "time": y, "na_item": "D2", "value": 12.0},
                {"geo": "ES", "sector": "S13", "unit": "PC_GDP", "time": y, "na_item": "D5", "value": 9.6},
                {"geo": "ES", "sector": "S13", "unit": "PC_GDP", "time": y, "na_item": "D61", "value": 14.4},
                {"geo": "ES", "sector": "S13", "unit": "PC_GDP", "time": y, "na_item": "D91", "value": 0.4},
            ])
            for i in range(1, 11):
                fcode = f"GF0{i}" if i < 10 else "GF10"
                exp_recs.extend([
                    {"geo": "ES", "sector": "S13", "unit": "MIO_EUR", "time": y, "cofog99": fcode, "value": 55000.0},
                    {"geo": "ES", "sector": "S13", "unit": "PC_GDP", "time": y, "cofog99": fcode, "value": 4.4},
                ])
            exp_recs.extend([
                {"geo": "ES", "sector": "S13", "unit": "MIO_EUR", "time": y, "cofog99": "TOTAL", "value": 550000.0},
                {"geo": "ES", "sector": "S13", "unit": "PC_GDP", "time": y, "cofog99": "TOTAL", "value": 44.0},
            ])

        ds_main = EurostatDataset(code="gov_10a_main", updated="2026-10-21", records=main_recs)
        ds_tax = EurostatDataset(code="gov_10a_taxag", updated="2026-10-21", records=tax_recs)
        ds_exp = EurostatDataset(code="gov_10a_exp", updated="2026-10-21", records=exp_recs)

        payload = build_cuentas_publicas_payload(config, ds_main, ds_tax, ds_exp)

        self.assertEqual(len(payload["annualBalances"]), 10)
        self.assertEqual(len(payload["dataPoints"]), 10)
        b2024 = payload["annualBalances"][-1]
        self.assertEqual(b2024["year"], "2024")
        self.assertEqual(b2024["metrics"]["MIO_EUR"]["totals"]["balance"], -50000.0)
        self.assertEqual(b2024["metrics"]["MIO_EUR"]["revenues"]["NON_TAX_RESIDUAL"]["total"], 45000.0)


if __name__ == "__main__":
    unittest.main()
