"""
Pruebas unitarias para el pipeline de Indicadores de Nacionalidad y Origen (Factor.es).
Ejecución offline con fixtures sintéticos sin llamadas de red.
"""

import json
from pathlib import Path
import sys
import unittest

from eurostat_client import EurostatDataset
from indicadores_nacionalidad import (
    build_nationality_indicators_payload,
    validate_concept_guide,
)


def make_mock_datasets(years: list[str], corrupt_unemp: bool = False, corrupt_income: bool = False, omit_latest_lag: bool = False) -> dict[str, EurostatDataset]:
    pop_ctz_recs = []
    pop_birth_recs = []
    emp_ctz_recs = []
    emp_birth_recs = []
    act_ctz_recs = []
    act_birth_recs = []
    empr_ctz_recs = []
    empr_birth_recs = []
    unemp_ctz_recs = []
    unemp_birth_recs = []
    acq_recs = []
    inc_ctz_recs = []
    inc_tot_recs = []
    pov_ctz_recs = []
    pov_tot_recs = []

    for idx, y in enumerate(years):
        for group in ["TOTAL", "NAT", "FOR"]:
            if group == "TOTAL":
                tot, u15, w64, s65 = 40000000.0, 6000000.0, 25800000.0, 8200000.0
            elif group == "NAT":
                tot, u15, w64, s65 = 35000000.0, 5000000.0, 22000000.0, 8000000.0
            else:
                tot, u15, w64, s65 = 5000000.0, 1000000.0, 3800000.0, 200000.0

            pop_ctz_recs.extend([
                {"time": y, "citizen": group, "age": "TOTAL", "value": tot},
                {"time": y, "citizen": group, "age": "Y_LT15", "value": u15},
                {"time": y, "citizen": group, "age": "Y15-64", "value": w64},
                {"time": y, "citizen": group, "age": "Y_GE65", "value": s65},
            ])
            pop_birth_recs.extend([
                {"time": y, "c_birth": group, "age": "TOTAL", "value": tot},
                {"time": y, "c_birth": group, "age": "Y_LT15", "value": u15},
                {"time": y, "c_birth": group, "age": "Y15-64", "value": w64},
                {"time": y, "c_birth": group, "age": "Y_GE65", "value": s65},
            ])

        emp_ctz_recs.extend([
            {"time": y, "citizen": "TOTAL", "value": 20000.0},
            {"time": y, "citizen": "NAT", "value": 17500.0},
            {"time": y, "citizen": "FOR", "value": 2500.0},
        ])
        emp_birth_recs.extend([
            {"time": y, "c_birth": "TOTAL", "wstatus": "EMP", "value": 20000.0},
            {"time": y, "c_birth": "NAT", "wstatus": "EMP", "value": 17500.0},
            {"time": y, "c_birth": "FOR", "wstatus": "EMP", "value": 2500.0},
        ])

        act_ctz_recs.extend([
            {"time": y, "citizen": "TOTAL", "value": 75.0},
            {"time": y, "citizen": "NAT", "value": 74.0},
            {"time": y, "citizen": "FOR", "value": 78.0},
        ])
        act_birth_recs.extend([
            {"time": y, "c_birth": "TOTAL", "value": 75.0},
            {"time": y, "c_birth": "NAT", "value": 74.0},
            {"time": y, "c_birth": "FOR", "value": 78.0},
        ])

        empr_ctz_recs.extend([
            {"time": y, "citizen": "TOTAL", "value": 65.0},
            {"time": y, "citizen": "NAT", "value": 66.0},
            {"time": y, "citizen": "FOR", "value": 62.0},
        ])
        empr_birth_recs.extend([
            {"time": y, "c_birth": "TOTAL", "value": 65.0},
            {"time": y, "c_birth": "NAT", "value": 66.0},
            {"time": y, "c_birth": "FOR", "value": 62.0},
        ])

        unemp_val_for = 150.0 if (corrupt_unemp and idx == len(years) - 1) else 15.0
        unemp_ctz_recs.extend([
            {"time": y, "citizen": "TOTAL", "value": 12.0},
            {"time": y, "citizen": "NAT", "value": 10.0},
            {"time": y, "citizen": "FOR", "value": unemp_val_for},
        ])
        unemp_birth_recs.extend([
            {"time": y, "c_birth": "TOTAL", "value": 12.0},
            {"time": y, "c_birth": "NAT", "value": 10.0},
            {"time": y, "c_birth": "FOR", "value": unemp_val_for},
        ])

        acq_recs.append({"time": y, "value": 180000.0})

        if not (omit_latest_lag and idx == len(years) - 1):
            inc_val_for = -500.0 if (corrupt_income and idx == len(years) - 2) else 14000.0
            inc_ctz_recs.extend([
                {"time": y, "citizen": "NAT", "statinfo": "MED", "value": 20000.0},
                {"time": y, "citizen": "NAT", "statinfo": "MEAN", "value": 23000.0},
                {"time": y, "citizen": "FOR", "statinfo": "MED", "value": inc_val_for},
                {"time": y, "citizen": "FOR", "statinfo": "MEAN", "value": 16000.0},
            ])
            inc_tot_recs.extend([
                {"time": y, "statinfo": "MED", "value": 19500.0},
                {"time": y, "statinfo": "MEAN", "value": 22000.0},
            ])
            pov_ctz_recs.extend([
                {"time": y, "citizen": "NAT", "value": 18.0},
                {"time": y, "citizen": "FOR", "value": 35.0},
            ])
            pov_tot_recs.extend([
                {"time": y, "value": 20.0},
            ])

    return {
        "popByCitizenship": EurostatDataset("migr_pop1ctz", "2026-11-15", pop_ctz_recs),
        "popByBirth": EurostatDataset("migr_pop3ctb", "2026-11-15", pop_birth_recs),
        "naturalizations": EurostatDataset("migr_acq", "2026-11-13", acq_recs),
        "employedByCitizenship": EurostatDataset("lfsa_egan", "2026-10-30", emp_ctz_recs),
        "employedByBirth": EurostatDataset("lfsa_pgacws", "2026-10-30", emp_birth_recs),
        "activityRateByCitizenship": EurostatDataset("lfsa_argan", "2026-10-30", act_ctz_recs),
        "activityRateByBirth": EurostatDataset("lfsa_argan", "2026-10-30", act_birth_recs),
        "employmentRateByCitizenship": EurostatDataset("lfsa_ergan", "2026-10-30", empr_ctz_recs),
        "employmentRateByBirth": EurostatDataset("lfsa_ergan", "2026-10-30", empr_birth_recs),
        "unemploymentRateByCitizenship": EurostatDataset("lfsa_urgan", "2026-10-30", unemp_ctz_recs),
        "unemploymentRateByBirth": EurostatDataset("lfsa_urgan", "2026-10-30", unemp_birth_recs),
        "incomeByCitizenship": EurostatDataset("ilc_di15", "2026-11-01", inc_ctz_recs),
        "incomeTotal": EurostatDataset("ilc_di03", "2026-11-01", inc_tot_recs),
        "povertyRateByCitizenship": EurostatDataset("ilc_li31", "2026-11-01", pov_ctz_recs),
        "povertyRateTotal": EurostatDataset("ilc_li02", "2026-11-01", pov_tot_recs),
    }


class TestIndicadoresNacionalidad(unittest.TestCase):

    def setUp(self):
        self.years = [str(y) for y in range(2008, 2026)]
        self.config = {
            "indicatorId": "indicadores-nacionalidad-espana",
            "category": "economy-employment",
            "question": "¿Test?",
            "chartType": "nationality-indicators",
            "headlineUnit": "% población extranjera",
            "geo": "ES",
            "startYear": 2008,
            "sources": [
                {
                    "datasetKeys": ["popByCitizenship", "popByBirth"],
                    "institution": "Inst Eurostat",
                    "shortName": "Eurostat",
                    "title": "Demografía",
                    "url": "https://example.com/1"
                }
            ]
        }

    def test_build_payload_success_and_invariants(self):
        ds_map = make_mock_datasets(self.years)
        payload = build_nationality_indicators_payload(self.config, ds_map)

        self.assertEqual(payload["id"], "indicadores-nacionalidad-espana")
        self.assertEqual(len(payload["annualRecords"]), 18)
        self.assertEqual(len(payload["dataPoints"]), 18)

        latest_rec = payload["annualRecords"][-1]
        self.assertEqual(latest_rec["year"], "2025")
        cit_demo = latest_rec["definitions"]["citizenship"]["demographics"]
        self.assertIsNotNone(cit_demo)
        self.assertEqual(cit_demo["total"]["population"], 40000000)
        self.assertEqual(cit_demo["nationals"]["population"], 35000000)
        self.assertEqual(cit_demo["foreigners"]["population"], 5000000)
        self.assertEqual(cit_demo["foreigners"]["shareOfTotalPct"], 12.5)

    def test_missing_income_lag_year_returns_null_without_crashing(self):
        ds_map = make_mock_datasets(self.years, omit_latest_lag=True)
        payload = build_nationality_indicators_payload(self.config, ds_map)

        latest_rec = payload["annualRecords"][-1]
        self.assertIsNone(latest_rec["livingConditions"])

        prev_rec = payload["annualRecords"][-2]
        self.assertIsNotNone(prev_rec["livingConditions"])

    def test_corrupted_rate_raises(self):
        ds_corrupt_labor = make_mock_datasets(self.years, corrupt_unemp=True)
        with self.assertRaises(ValueError) as ctx:
            build_nationality_indicators_payload(self.config, ds_corrupt_labor)
        self.assertIn("fuera de rango", str(ctx.exception))

        ds_corrupt_inc = make_mock_datasets(self.years, corrupt_income=True)
        with self.assertRaises(ValueError) as ctx_inc:
            build_nationality_indicators_payload(self.config, ds_corrupt_inc)
        self.assertIn("Renta corrupta o negativa", str(ctx_inc.exception))

    def test_concept_guide_code_integrity(self):
        locales_file = Path(__file__).resolve().parent.parent / "frontend" / "data" / "locales" / "es" / "indicadores-nacionalidad-espana.json"
        if not locales_file.exists():
            locales_file = Path(__file__).resolve().parent.parent / "data" / "es" / "indicadores-nacionalidad-espana.json"
        self.assertTrue(locales_file.exists())
        with open(locales_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        guide = data.get("conceptGuide")
        self.assertIsNotNone(guide)
        validate_concept_guide(guide)

        cat_ids = {c["id"] for c in guide["categories"]}
        self.assertIn("demographics", cat_ids)
        self.assertIn("labor", cat_ids)
        self.assertIn("income", cat_ids)

        term_codes = {t["code"] for t in guide["terms"]}
        for req in [
            "CITIZENSHIP", "BIRTHPLACE", "NATURALIZATION",
            "DEPENDENCY_RATIO", "WORKING_AGE", "ACTIVITY_RATE",
            "EMPLOYMENT_RATE", "UNEMPLOYMENT_RATE", "EQUIVALISED_INCOME",
            "AROP_RATE", "EU_VS_NEU"
        ]:
            self.assertIn(req, term_codes)


if __name__ == "__main__":
    unittest.main()
