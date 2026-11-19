"""
Pruebas unitarias para el pipeline de Indicadores de Nacionalidad y Origen (Factor.es).
Ejecución offline con fixtures sintéticos sin llamadas de red.
"""

import json
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scrapers.eurostat_client import EurostatDataset
from scrapers.indicadores_nacionalidad import (
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
        # 40M total, 35M nat, 5M for
        # under15: 5M nat, 1M for
        # 15-64: 22M nat, 3.8M for
        # 65+: 8M nat, 0.2M for
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

        # Labor
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

        is_latest_year = (idx == len(years) - 1)
        if not (omit_latest_lag and is_latest_year):
            acq_recs.append({"time": y, "value": 100000.0})

            med_inc = -500.0 if (corrupt_income and is_latest_year) else 14000.0
            inc_ctz_recs.extend([
                {"time": y, "citizen": "NAT", "statinfo": "MED_EI", "value": 20000.0},
                {"time": y, "citizen": "NAT", "statinfo": "MEAN_EI", "value": 22000.0},
                {"time": y, "citizen": "FOR", "statinfo": "MED_EI", "value": med_inc},
                {"time": y, "citizen": "FOR", "statinfo": "MEAN_EI", "value": 16000.0},
            ])
            inc_tot_recs.extend([
                {"time": y, "statinfo": "MED_EI", "value": 19000.0},
                {"time": y, "statinfo": "MEAN_EI", "value": 21000.0},
            ])
            pov_ctz_recs.extend([
                {"time": y, "citizen": "NAT", "value": 15.0},
                {"time": y, "citizen": "FOR", "value": 30.0},
            ])
            pov_tot_recs.append({"time": y, "value": 18.0})

    return {
        "popByCitizenship": EurostatDataset(code="migr_pop1ctz", updated="2026-11-15", records=pop_ctz_recs),
        "popByBirth": EurostatDataset(code="migr_pop3ctb", updated="2026-11-15", records=pop_birth_recs),
        "naturalizations": EurostatDataset(code="migr_acq", updated="2026-11-13", records=acq_recs),
        "employedByCitizenship": EurostatDataset(code="lfsa_egan", updated="2026-10-30", records=emp_ctz_recs),
        "employedByBirth": EurostatDataset(code="lfsa_pgacws", updated="2026-10-30", records=emp_birth_recs),
        "activityRateByCitizenship": EurostatDataset(code="lfsa_argan", updated="2026-10-30", records=act_ctz_recs),
        "activityRateByBirth": EurostatDataset(code="lfsa_argacob", updated="2026-10-30", records=act_birth_recs),
        "employmentRateByCitizenship": EurostatDataset(code="lfsa_ergan", updated="2026-10-30", records=empr_ctz_recs),
        "employmentRateByBirth": EurostatDataset(code="lfsa_ergacob", updated="2026-10-30", records=empr_birth_recs),
        "unemploymentRateByCitizenship": EurostatDataset(code="lfsa_urgan", updated="2026-10-30", records=unemp_ctz_recs),
        "unemploymentRateByBirth": EurostatDataset(code="lfsa_urgacob", updated="2026-10-30", records=unemp_birth_recs),
        "incomeByCitizenship": EurostatDataset(code="ilc_di15", updated="2026-10-26", records=inc_ctz_recs),
        "incomeTotal": EurostatDataset(code="ilc_di03", updated="2026-10-20", records=inc_tot_recs),
        "povertyRateByCitizenship": EurostatDataset(code="ilc_li31", updated="2026-10-20", records=pov_ctz_recs),
        "povertyRateTotal": EurostatDataset(code="ilc_li02", updated="2026-10-20", records=pov_tot_recs),
    }


class TestIndicadoresNacionalidad(unittest.TestCase):
    def setUp(self):
        self.config = {
            "indicatorId": "indicadores-nacionalidad-espana",
            "category": "Economía y Empleo",
            "question": "¿Cómo se comparan la demografía, el empleo y la renta entre población española y extranjera en España?",
            "chartType": "nationality-indicators",
            "headlineUnit": "% población extranjera",
            "geo": "ES",
            "startYear": 2010,
            "sources": [
                {
                    "datasetKeys": ["popByCitizenship", "popByBirth"],
                    "institution": "INE / Eurostat",
                    "shortName": "Eurostat Demografía",
                    "title": "Población por nacionalidad",
                    "tableId": "migr_pop1ctz",
                    "url": "https://example.com/demo"
                }
            ]
        }
        self.years = [str(y) for y in range(2010, 2021)]  # 11 años

    def test_age_band_share_and_dependency_math(self):
        ds_map = make_mock_datasets(self.years)
        payload = build_nationality_indicators_payload(self.config, ds_map)
        self.assertIn("annualRecords", payload)
        self.assertEqual(len(payload["annualRecords"]), len(self.years))

        rec_latest = payload["annualRecords"][-1]
        demo_for = rec_latest["definitions"]["citizenship"]["demographics"]["foreigners"]

        bands = demo_for["ageBands"]
        sum_pct = bands["under15Pct"] + bands["workingAge15to64Pct"] + bands["senior65plusPct"]
        self.assertAlmostEqual(sum_pct, 100.0, delta=0.5)

        # 200,000 / 3,800,000 * 100 = 5.263 -> round to 1 decimal = 5.3
        self.assertEqual(demo_for["oldAgeDependencyRatio"], 5.3)

        demo_nat = rec_latest["definitions"]["citizenship"]["demographics"]["nationals"]
        # 8,000,000 / 22,000,000 * 100 = 36.36 -> 36.4
        self.assertEqual(demo_nat["oldAgeDependencyRatio"], 36.4)

    def test_representation_shares(self):
        ds_map = make_mock_datasets(self.years)
        payload = build_nationality_indicators_payload(self.config, ds_map)
        rec = payload["annualRecords"][-1]

        demo = rec["definitions"]["citizenship"]["demographics"]
        labor = rec["definitions"]["citizenship"]["laborMarket"]

        # Share of total pop: 5M / 40M * 100 = 12.5%
        self.assertEqual(demo["foreigners"]["shareOfTotalPct"], 12.5)

        # Share of working age pop: 3.8M / 25.8M * 100 = 14.73%
        self.assertEqual(demo["foreigners"]["shareOfWorkingAgePct"], 14.73)

        # Share of employed: 2.5M / 20.0M * 100 = 12.5%
        self.assertEqual(labor["foreigners"]["shareOfEmployedPct"], 12.5)

    def test_partial_latest_year_lag_graceful(self):
        ds_map = make_mock_datasets(self.years, omit_latest_lag=True)
        payload = build_nationality_indicators_payload(self.config, ds_map)

        latest_rec = payload["annualRecords"][-1]
        self.assertIsNone(latest_rec["naturalizations"])
        self.assertIsNone(latest_rec["livingConditions"])

        # Los años previos siguen teniendo datos completos
        prev_rec = payload["annualRecords"][-2]
        self.assertEqual(prev_rec["naturalizations"], 100000)
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
        guide_path = Path("scrapers/config/indicadores_nacionalidad_guide.json")
        self.assertTrue(guide_path.exists())
        with open(guide_path, "r", encoding="utf-8") as f:
            guide = json.load(f)

        validate_concept_guide(guide)

        # Verificar que categorías requeridas estén presentes
        cat_ids = {c["id"] for c in guide["categories"]}
        self.assertIn("demographics", cat_ids)
        self.assertIn("labor", cat_ids)
        self.assertIn("income", cat_ids)

        # Verificar términos clave exigidos en la especificación
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
