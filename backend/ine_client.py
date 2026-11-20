"""
Cliente HTTP dedicado a consultar las tablas de la API oficial del INE.
Responsabilidad única (SRP): Comunicación e integración con la API Tempus JS del INE.
"""

import json
import requests
from tqdm import tqdm

INE_API_BASE_URL = "https://servicios.ine.es/wstempus/js/ES/DATOS_TABLA"


def fetch_ine_table(table_id: str, tip: str = "AM", timeout: int = 60) -> list:
    """
    Consulta la API Tempus del INE para obtener los datos crudos de una tabla determinada,
    mostrando una barra de progreso en tiempo real con tqdm.
    """
    url = f"{INE_API_BASE_URL}/{table_id}?tip={tip}"
    print(f"\n[1/4] 🌐 Descargando datos desde la API del INE (Tabla {table_id})...")

    with requests.get(url, stream=True, timeout=timeout) as response:
        response.raise_for_status()
        total_size = int(response.headers.get("content-length", 0))
        chunk_size = 16384
        chunks = []

        with tqdm(
            total=total_size if total_size > 0 else None,
            unit="B",
            unit_scale=True,
            unit_divisor=1024,
            desc="      Descarga INE",
            ncols=80,
        ) as pbar:
            for chunk in response.iter_content(chunk_size=chunk_size):
                if chunk:
                    chunks.append(chunk)
                    pbar.update(len(chunk))

        raw_bytes = b"".join(chunks)
        print("      ⌛ Deserializando respuesta JSON...")
        try:
            data = json.loads(raw_bytes.decode("utf-8"))
        except json.JSONDecodeError as e:
            raise RuntimeError(
                f"Error deserializando JSON de la tabla INE {table_id}. "
                f"La respuesta fue truncada o es inválida ({len(raw_bytes)} bytes recibidos). "
                f"Detalle: {e}"
            ) from e
        print(f"      ✓ Respuesta recibida: {len(data)} series de datos crudas obtenidas.")
        return data
