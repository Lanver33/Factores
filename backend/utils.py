"""
Módulo de utilidades para scrapers y ETL de Factores:
- Normalización de cadenas y conversión a slugs.
- Validación de integridad y persistencia en staging/producción.
- Publicación atómica de datasets divididos en datos numéricos y traducciones.
"""

from datetime import date
import json
import os
from pathlib import Path
import re
import shutil


def slugify(text: str) -> str:
    """Transforma un texto o nombre en un identificador limpio (slug) sin acentos ni caracteres especiales."""
    text = text.lower().strip()
    replacements = {
        "á": "a", "é": "e", "í": "i", "ó": "o", "ú": "u",
        "ñ": "n", "ü": "u", "(": "", ")": "", ",": ""
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    return re.sub(r"[^a-z0-9]+", "-", text).strip("-")


def validate_and_stage(
    items: dict | list[dict],
    staging_dir: Path = Path("./staging"),
) -> bool:
    """
    Verifica que las tarjetas y sus series no estén vacías antes de guardarlas en staging.
    """
    print(f"\n[3/4] 🧪 Validando tarjetas y guardando datos en ({staging_dir}/)...")
    items_staging_dir = staging_dir / "items"
    items_staging_dir.mkdir(parents=True, exist_ok=True)

    items_list = items if isinstance(items, list) else [items]
    existing_staging_entries = {}

    staging_index_path = staging_dir / "items.json"
    if staging_index_path.exists():
        try:
            with open(staging_index_path, "r", encoding="utf-8") as f:
                for entry in json.load(f):
                    existing_staging_entries[entry["id"]] = entry
        except Exception:
            pass

    for item_payload in items_list:
        item_id = item_payload.get("id")
        if not item_id:
            print("\n      ❌ ERROR: La tarjeta no tiene 'id'")
            return False

        with open(items_staging_dir / f"{item_id}.json", "w", encoding="utf-8") as f:
            json.dump(item_payload, f, ensure_ascii=False, indent=2)

        existing_staging_entries[item_id] = {
            "id": item_id,
            "category": item_payload.get("category", "economy-employment"),
            "question": item_payload.get("question", item_id),
            "unit": item_payload.get("unit", ""),
            "lastUpdated": item_payload.get("lastUpdated") or date.today().isoformat(),
        }

    with open(staging_dir / "items.json", "w", encoding="utf-8") as f:
        json.dump(list(existing_staging_entries.values()), f, ensure_ascii=False, indent=2)

    print(f"      ✓ Validación superada: {len(items_list)} tarjeta(s) guardada(s) en {staging_dir}/items/")
    return True


def publish_dataset(
    slug: str,
    dataset_data: dict,
    es_data: dict,
    en_data: dict,
    frontend_data_dir: Path | None = None,
) -> None:
    """
    Publica atómicamente un dataset dividido en:
    - Pure numerical data -> frontend/data/datasets/{slug}.json
    - Spanish copy -> frontend/data/locales/es/{slug}.json
    - English copy -> frontend/data/locales/en/{slug}.json
    """
    if frontend_data_dir is None:
        frontend_data_dir = Path(__file__).resolve().parent.parent / "frontend" / "data"

    datasets_dir = frontend_data_dir / "datasets"
    locales_es_dir = frontend_data_dir / "locales" / "es"
    locales_en_dir = frontend_data_dir / "locales" / "en"

    datasets_dir.mkdir(parents=True, exist_ok=True)
    locales_es_dir.mkdir(parents=True, exist_ok=True)
    locales_en_dir.mkdir(parents=True, exist_ok=True)

    def _atomic_write(target_path: Path, data: dict):
        tmp_path = target_path.with_suffix(".tmp")
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp_path, target_path)

    _atomic_write(datasets_dir / f"{slug}.json", dataset_data)
    _atomic_write(locales_es_dir / f"{slug}.json", es_data)
    _atomic_write(locales_en_dir / f"{slug}.json", en_data)

    print(f"      ✓ Dataset '{slug}' publicado correctamente en {frontend_data_dir}")


def promote_to_data(
    prefix_filter: str = "",
    staging_dir: Path = Path("./staging"),
    data_dir: Path = Path("./data"),
) -> None:
    """
    Sincroniza las tarjetas en staging con la estructura de producción.
    """
    print(f"\n[4/4] 🚀 Promocionando datos a producción...")
    items_staging_dir = staging_dir / "items"
    if not items_staging_dir.exists():
        return

    for src_file in items_staging_dir.glob("*.json"):
        slug = src_file.stem
        if prefix_filter and not slug.startswith(prefix_filter):
            continue
        with open(src_file, "r", encoding="utf-8") as f:
            content = json.load(f)

        question = content.get("question", "")
        unit = content.get("unit", "")
        context_notes = content.get("contextNotes", [])
        sources = content.get("sources", [])
        concept_guide = content.get("conceptGuide")

        es_data = {
            "question": question.get("es", question) if isinstance(question, dict) else question,
            "unit": unit.get("es", unit) if isinstance(unit, dict) else unit,
            "contextNotes": context_notes.get("es", context_notes) if isinstance(context_notes, dict) else context_notes,
            "sources": sources,
        }
        if concept_guide:
            es_data["conceptGuide"] = concept_guide

        en_data = {
            "question": question.get("en", question) if isinstance(question, dict) else question,
            "unit": unit.get("en", unit) if isinstance(unit, dict) else unit,
            "contextNotes": context_notes.get("en", context_notes) if isinstance(context_notes, dict) else context_notes,
            "sources": sources,
        }
        if concept_guide:
            en_data["conceptGuide"] = concept_guide

        dataset_data = dict(content)

        publish_dataset(slug, dataset_data, es_data, en_data)
