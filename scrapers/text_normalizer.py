"""
Módulo especializado en la normalización y limpieza de cadenas de texto.
Responsabilidad única (SRP): Procesamiento de texto y conversión a slugs válidos.
"""

import re


def slugify(text: str) -> str:
    """
    Transforma un texto o nombre en un identificador limpio (slug) sin acentos ni caracteres especiales.
    """
    text = text.lower().strip()
    replacements = {
        "á": "a", "é": "e", "í": "i", "ó": "o", "ú": "u",
        "ñ": "n", "ü": "u", "(": "", ")": "", ",": ""
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    return re.sub(r"[^a-z0-9]+", "-", text).strip("-")
