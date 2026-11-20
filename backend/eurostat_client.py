"""
Cliente HTTP y decodificador JSON-stat 2.0 para la API de Estadísticas de Eurostat v1.0.
Responsabilidad única (SRP): Transporte HTTP, reintentos con backoff exponencial, barra de progreso y decodificación genérica JSON-stat 2.0.
"""

from dataclasses import dataclass
import json
import math
import time
from typing import Any
import requests
from tqdm import tqdm


@dataclass(frozen=True)
class EurostatDataset:
    code: str
    updated: str | None          # Normalizado YYYY-MM-DD extraído de "updated" en JSON-stat
    records: list[dict[str, Any]] # Diccionarios con claves de dimensión + "value": float


def parse_jsonstat(payload: dict[str, Any], dataset_code: str) -> EurostatDataset:
    """
    Decodifica una respuesta JSON-stat 2.0 a una lista plana de registros numéricos.
    Implementa el algoritmo de decodificación exacto (soporta diccionarios dispersos o listas densas de valores,
    y índices de categorías en diccionario o lista).
    """
    dim_ids = payload.get("id")
    sizes = payload.get("size")
    dimensions = payload.get("dimension")
    raw_values = payload.get("value", {})

    if not dim_ids or not sizes or not dimensions or len(dim_ids) != len(sizes):
        raise ValueError(f"Estructura JSON-stat inválida o incompleta para el dataset {dataset_code}.")

    # 1. Construir lista ordenada de códigos de categoría por dimensión (pos_to_code)
    pos_to_code = []
    for dim_id in dim_ids:
        dim_obj = dimensions.get(dim_id, {})
        cat = dim_obj.get("category", {})
        cat_index = cat.get("index")

        if isinstance(cat_index, dict):
            # Invertir diccionario {code: position} ordenado por posición
            sorted_items = sorted(cat_index.items(), key=lambda kv: kv[1])
            codes = [code for code, _ in sorted_items]
        elif isinstance(cat_index, list):
            codes = cat_index
        else:
            # Fallback a las claves directas del objeto 'category' si no hay 'index'
            cat_ids = cat.get("label", {})
            codes = list(cat_ids.keys()) if isinstance(cat_ids, dict) else []

        if not codes:
            raise ValueError(f"No se pudieron extraer índices de categoría para la dimensión '{dim_id}' en {dataset_code}.")
        pos_to_code.append(codes)

    # 2. Calcular zancadas (strides) en orden row-major
    n_dims = len(sizes)
    strides = [1] * n_dims
    for i in range(n_dims - 2, -1, -1):
        strides[i] = strides[i + 1] * sizes[i + 1]

    # 3. Normalizar valores crudos a iterable de (flat_index, numeric_value)
    items_iter = []
    if isinstance(raw_values, dict):
        for k, v in raw_values.items():
            if v is not None:
                try:
                    fval = float(v)
                    if math.isfinite(fval):
                        items_iter.append((int(k), fval))
                except (ValueError, TypeError):
                    continue
    elif isinstance(raw_values, list):
        for idx, v in enumerate(raw_values):
            if v is not None:
                try:
                    fval = float(v)
                    if math.isfinite(fval):
                        items_iter.append((idx, fval))
                except (ValueError, TypeError):
                    continue

    # 4. Decodificar índices planos a coordenadas multidimensionales
    records = []
    for flat_idx, val in items_iter:
        record = {}
        for i in range(n_dims):
            size_i = sizes[i]
            stride_i = strides[i]
            code_idx = (flat_idx // stride_i) % size_i
            dim_code = dim_ids[i]
            record[dim_code] = pos_to_code[i][code_idx]
        record["value"] = val
        records.append(record)

    # 5. Extraer y normalizar fecha de actualización (updated)
    raw_updated = payload.get("updated")
    updated_str = None
    if isinstance(raw_updated, str) and len(raw_updated) >= 10:
        sub = raw_updated[:10]
        if sub[4] == "-" and sub[7] == "-":
            updated_str = sub

    return EurostatDataset(code=dataset_code, updated=updated_str, records=records)


def fetch_eurostat_dataset(
    base_url: str,
    dataset_code: str,
    params: dict[str, Any],
    since_year: int | None = None,
    timeout: int = 60,
    max_retries: int = 3,
) -> EurostatDataset:
    """
    Realiza una petición HTTP GET streaming a la API de Eurostat con barra de progreso tqdm
    y reintentos exponenciales ante códigos 429, 500, 502, 503, 504 o timeouts.
    """
    url = f"{base_url}/{dataset_code}"
    query_params = {
        "format": "JSON",
        "lang": "EN",
    }
    if since_year is not None:
        query_params["sinceTimePeriod"] = str(since_year)

    for k, v in params.items():
        query_params[k] = v

    print(f"\n🌐 Consultando Eurostat API v1.0 ({dataset_code})...")

    backoff = 2
    response = None
    for attempt in range(1, max_retries + 1):
        try:
            response = requests.get(url, params=query_params, stream=True, timeout=timeout)
            if response.status_code in (429, 500, 502, 503, 504):
                if attempt < max_retries:
                    print(f"      ⚠️ Servidor Eurostat devolvió HTTP {response.status_code}. Reintentando en {backoff}s (intento {attempt}/{max_retries})...")
                    time.sleep(backoff)
                    backoff *= 2
                    continue
            response.raise_for_status()
            break
        except (requests.exceptions.RequestException, TimeoutError) as e:
            if attempt < max_retries:
                print(f"      ⚠️ Error de red o timeout ({e}). Reintentando en {backoff}s (intento {attempt}/{max_retries})...")
                time.sleep(backoff)
                backoff *= 2
                continue
            raise RuntimeError(f"Fallo conectando con la API de Eurostat para {dataset_code} tras {max_retries} intentos: {e}") from e

    if response is None:
        raise RuntimeError(f"No se pudo obtener respuesta para {dataset_code}.")

    total_size = int(response.headers.get("content-length", 0))
    chunk_size = 16384
    chunks = []

    with tqdm(
        total=total_size if total_size > 0 else None,
        unit="B",
        unit_scale=True,
        unit_divisor=1024,
        desc=f"      Descarga {dataset_code}",
        ncols=80,
    ) as pbar:
        for chunk in response.iter_content(chunk_size=chunk_size):
            if chunk:
                chunks.append(chunk)
                pbar.update(len(chunk))

    raw_bytes = b"".join(chunks)
    print("      ⌛ Deserializando JSON-stat 2.0...")
    try:
        payload = json.loads(raw_bytes.decode("utf-8"))
    except json.JSONDecodeError as e:
        raise RuntimeError(
            f"Error deserializando JSON-stat de Eurostat ({dataset_code}). "
            f"Respuesta inválida o truncada ({len(raw_bytes)} bytes). Detalle: {e}"
        ) from e

    dataset = parse_jsonstat(payload, dataset_code)
    print(f"      ✓ Dataset {dataset_code} decodificado: {len(dataset.records)} registros obtenidos (Actualizado: {dataset.updated}).")
    return dataset
