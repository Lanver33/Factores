"""
Módulo encargado de la validación de integridad en staging y publicación atómica hacia ./data.
Responsabilidad única (SRP): Gestión de persistencia local en staging y sincronización con data.
"""

import json
import shutil
from pathlib import Path
from tqdm import tqdm


def validate_and_stage(
    metrics: dict,
    staging_dir: Path = Path("./staging"),
    metrics_staging_dir: Path = Path("./staging/metrics"),
) -> bool:
    """
    Verifica que las series no estén vacías ni contengan valores negativos antes de guardarlas en ./staging.
    """
    print(f"\n[3/4] 🧪 Validando esquemas y guardando datos en ({staging_dir}/)...")
    if staging_dir.exists():
        shutil.rmtree(staging_dir)
    metrics_staging_dir.mkdir(parents=True, exist_ok=True)

    catalog_entries = []
    for metric_id, payload in tqdm(metrics.items(), desc="      Guardando JSON", ncols=80):
        series = payload.get("series", [])
        if not series:
            print(f"\n      ❌ ERROR: Serie vacía en {metric_id}")
            return False

        for pt in series:
            if pt.get("value") is None or pt.get("value") < 0:
                print(f"\n      ❌ ERROR: Valor inválido en {metric_id}: {pt}")
                return False

        with open(metrics_staging_dir / f"{metric_id}.json", "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)

        catalog_entries.append({
            "id": payload["id"],
            "name": payload["name"],
            "category": payload["category"],
            "unit": payload["unit"],
            "minDate": series[0]["date"],
            "maxDate": series[-1]["date"],
        })

    with open(staging_dir / "catalog.json", "w", encoding="utf-8") as f:
        json.dump(catalog_entries, f, ensure_ascii=False, indent=2)

    print(f"      ✓ Validación superada: {len(metrics)} métricas guardadas en {staging_dir}/metrics/")
    print(f"      ✓ Catálogo preliminar guardado en {staging_dir}/catalog.json")
    return True


def promote_to_data(
    prefix_filter: str = "inmigracion-",
    staging_dir: Path = Path("./staging"),
    data_dir: Path = Path("./data"),
) -> None:
    """
    Sincroniza los archivos validados de staging con la carpeta definitiva ./data y actualiza catalog.json.
    """
    print(f"\n[4/4] 🚀 Promocionando datos a carpeta de producción ({data_dir}/)...")
    metrics_staging_dir = staging_dir / "metrics"
    live_metrics_dir = data_dir / "metrics"
    live_metrics_dir.mkdir(parents=True, exist_ok=True)

    new_filenames = {f.name for f in metrics_staging_dir.glob("*.json")}
    removed_count = 0
    for old_file in live_metrics_dir.glob(f"{prefix_filter}*.json"):
        if old_file.name not in new_filenames:
            old_file.unlink()
            removed_count += 1

    if removed_count > 0:
        print(f"      ℹ️ Eliminados {removed_count} archivos obsoletos en {live_metrics_dir}/")

    src_files = list(metrics_staging_dir.glob("*.json"))
    for src_file in tqdm(src_files, desc="      Copiando a ./data", ncols=80):
        shutil.copy2(src_file, live_metrics_dir / src_file.name)

    live_catalog_path = data_dir / "catalog.json"
    existing_catalog = {}
    if live_catalog_path.exists():
        with open(live_catalog_path, "r", encoding="utf-8") as f:
            for item in json.load(f):
                if not item["id"].startswith(prefix_filter):
                    existing_catalog[item["id"]] = item

    staging_catalog_path = staging_dir / "catalog.json"
    if staging_catalog_path.exists():
        with open(staging_catalog_path, "r", encoding="utf-8") as f:
            for item in json.load(f):
                existing_catalog[item["id"]] = item

    with open(live_catalog_path, "w", encoding="utf-8") as f:
        json.dump(list(existing_catalog.values()), f, ensure_ascii=False, indent=2)

    print(f"      ✓ {len(src_files)} métricas promocionadas en {live_metrics_dir}/")
    print(f"      ✓ Catálogo global actualizado en {live_catalog_path} ({len(existing_catalog)} entradas totales).")
    print(f"\n🎉 ¡Proceso completado con éxito!")
