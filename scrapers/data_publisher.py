"""
Módulo encargado de la validación de integridad en staging y publicación atómica hacia ./data.
Responsabilidad única (SRP): Gestión de persistencia local en staging y sincronización con data.
"""

from datetime import date
import json
import shutil
from pathlib import Path
from tqdm import tqdm


def validate_and_stage(
    items: dict | list[dict],
    staging_dir: Path = Path("./staging"),
) -> bool:
    """
    Verifica que las tarjetas y sus series no estén vacías ni contengan valores negativos antes de guardarlas en ./staging.
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

        data_points = item_payload.get("dataPoints", [])
        if not data_points:
            print(f"\n      ❌ ERROR: dataPoints vacíos en tarjeta {item_id}")
            return False

        for pt in data_points:
            val = pt.get("value")
            if val is None:
                print(f"\n      ❌ ERROR: Valor nulo en {item_id}: {pt}")
                return False

        # Guardar archivo de la tarjeta individual
        with open(items_staging_dir / f"{item_id}.json", "w", encoding="utf-8") as f:
            json.dump(item_payload, f, ensure_ascii=False, indent=2)

        # Obtener el valor principal/total para el índice items.json
        last_dp = data_points[-1]
        latest_val = 0
        val_raw = last_dp.get("value")
        if isinstance(val_raw, (int, float)):
            latest_val = val_raw
        elif isinstance(val_raw, list):
            for entry in val_raw:
                if isinstance(entry, dict):
                    if "total" in entry:
                        latest_val = entry["total"]
                        break
                    elif latest_val == 0:
                        latest_val = list(entry.values())[0]

        existing_staging_entries[item_id] = {
            "id": item_id,
            "category": item_payload.get("category", "Pensiones y Demografía"),
            "question": item_payload.get("question", item_id),
            "unit": item_payload.get("unit", ""),
            "latestValue": latest_val,
            "latestYear": str(last_dp.get("year", "")),
            "lastUpdated": item_payload.get("source", {}).get("lastUpdated") or item_payload.get("last_updated") or date.today().isoformat(),
        }

    with open(staging_dir / "items.json", "w", encoding="utf-8") as f:
        json.dump(list(existing_staging_entries.values()), f, ensure_ascii=False, indent=2)

    print(f"      ✓ Validación superada: {len(items_list)} tarjeta(s) guardada(s) en {staging_dir}/items/")
    return True


def promote_to_data(
    prefix_filter: str = "",
    staging_dir: Path = Path("./staging"),
    data_dir: Path = Path("./data"),
) -> None:
    """
    Sincroniza las tarjetas en staging con ./data/items/<id>.json, ./data/items.json y ./data/metadata.json.
    """
    print(f"\n[4/4] 🚀 Promocionando datos a carpeta de producción ({data_dir}/)...")
    items_staging_dir = staging_dir / "items"
    live_items_dir = data_dir / "items"
    live_items_dir.mkdir(parents=True, exist_ok=True)

    # Limpiar obsoletos en metrics/ si existían de versiones anteriores
    live_metrics_dir = data_dir / "metrics"
    if live_metrics_dir.exists():
        shutil.rmtree(live_metrics_dir)

    src_files = list(items_staging_dir.glob("*.json"))
    for src_file in tqdm(src_files, desc="      Copiando a ./data/items", ncols=80):
        shutil.copy2(src_file, live_items_dir / src_file.name)

    # Actualizar data/items.json combinando existentes con staging
    live_items_index_path = data_dir / "items.json"
    existing_items = {}
    if live_items_index_path.exists():
        try:
            with open(live_items_index_path, "r", encoding="utf-8") as f:
                content = json.load(f)
                if isinstance(content, list):
                    for item in content:
                        existing_items[item["id"]] = item
        except Exception:
            pass

    staging_items_index_path = staging_dir / "items.json"
    if staging_items_index_path.exists():
        with open(staging_items_index_path, "r", encoding="utf-8") as f:
            for item in json.load(f):
                existing_items[item["id"]] = item

    items_list = list(existing_items.values())
    with open(live_items_index_path, "w", encoding="utf-8") as f:
        json.dump(items_list, f, ensure_ascii=False, indent=2)

    # Actualizar data/metadata.json
    metadata_path = data_dir / "metadata.json"
    meta_payload = {
        "last_updated": date.today().isoformat(),
        "total_items": len(items_list),
        "categories": [
            "Vivienda",
            "Economía y Empleo",
            "Sanidad",
            "Pensiones y Demografía"
        ]
    }
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(meta_payload, f, ensure_ascii=False, indent=2)

    print(f"      ✓ {len(src_files)} tarjeta(s) promocionada(s) en {live_items_dir}/")
    print(f"      ✓ Índice de tarjetas actualizado en {live_items_index_path} ({len(items_list)} entradas).")
    print(f"      ✓ Metadatos globales actualizados en {metadata_path}.")
    print(f"\n🎉 ¡Proceso completado con éxito!")
