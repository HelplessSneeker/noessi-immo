"""
Simple translation system for backend error messages and API responses.
Detects language from Accept-Language header and returns appropriate translation.
"""

from fastapi import Request
from typing import Dict, Callable


# Translation dictionaries
TRANSLATIONS: Dict[str, Dict[str, str]] = {
    "de": {
        # Error messages
        "No file selected": "Keine Datei ausgewählt",
        "Document cannot be linked to both transaction and credit": "Dokument kann nicht gleichzeitig mit Transaktion und Kredit verknüpft werden",
        "Document not found": "Dokument nicht gefunden",
        "Property not found": "Immobilie nicht gefunden",
        "Credit not found": "Kredit nicht gefunden",
        "Transaction not found": "Transaktion nicht gefunden",
        "File not found on disk": "Datei nicht auf Festplatte gefunden",
        "Validation error": "Validierungsfehler",
        "{} is required": "{} ist erforderlich",
        "{} has an invalid value": "{} hat einen ungültigen Wert",

        # Category translations for display
        "rent": "Miete",
        "operating_costs": "Betriebskosten",
        "repair": "Reparatur",
        "loan_payment": "Kreditrate",
        "tax": "Steuer",
        "other": "Sonstiges",
        "rental_contract": "Mietvertrag",
        "invoice": "Rechnung",
        "property_management": "Hausverwaltung",
        "loan": "Kredit",

        # Field names
        "file": "Datei",
        "property_id": "Immobilien-ID",
        "category": "Kategorie",
        "transaction_id": "Transaktions-ID",
        "document_date": "Dokumentdatum",
        "description": "Beschreibung",
        "amount": "Betrag",
        "date": "Datum",
        "name": "Name",
    },
    "en": {
        # English translations (identity mapping for most)
        "No file selected": "No file selected",
        "Document cannot be linked to both transaction and credit": "Document cannot be linked to both transaction and credit",
        "Document not found": "Document not found",
        "Property not found": "Property not found",
        "Credit not found": "Credit not found",
        "Transaction not found": "Transaction not found",
        "File not found on disk": "File not found on disk",
        "Validation error": "Validation error",
        "{} is required": "{} is required",
        "{} has an invalid value": "{} has an invalid value",

        # Categories in English
        "rent": "Rent",
        "operating_costs": "Operating Costs",
        "repair": "Repair",
        "loan_payment": "Loan Payment",
        "tax": "Tax",
        "other": "Other",
        "rental_contract": "Rental Contract",
        "invoice": "Invoice",
        "property_management": "Property Management",
        "loan": "Loan",

        # Field names
        "file": "File",
        "property_id": "Property ID",
        "category": "Category",
        "transaction_id": "Transaction ID",
        "document_date": "Document Date",
        "description": "Description",
        "amount": "Amount",
        "date": "Date",
        "name": "Name",
    }
}


class Translator:
    """Simple translator for backend i18n support"""

    def __init__(self, default_locale: str = "de"):
        self.default_locale = default_locale

    def get_locale(self, request: Request) -> str:
        """
        Extract locale from Accept-Language header.
        Returns 'de' for German, 'en' for English, defaults to German.
        """
        accept_lang = request.headers.get("Accept-Language", "")

        # Simple language detection
        if "en" in accept_lang.lower():
            return "en"

        # Default to German
        return "de"

    def translate(self, message: str, request: Request, **kwargs) -> str:
        """
        Translate message based on request locale.
        Supports placeholder formatting with **kwargs.

        Example:
            translate("{} is required", request, field="name")
        """
        locale = self.get_locale(request)
        translations = TRANSLATIONS.get(locale, TRANSLATIONS[self.default_locale])

        # Get translation or return original message
        translated = translations.get(message, message)

        # Format with kwargs if provided
        if kwargs:
            try:
                translated = translated.format(**kwargs)
            except (KeyError, IndexError):
                pass

        return translated


# Global translator instance
translator = Translator()


def get_translator(request: Request) -> Callable[[str], str]:
    """
    FastAPI dependency that returns a translation function for the current request.

    Usage in routes:
        @router.get("/")
        def endpoint(t: Callable = Depends(get_translator)):
            raise HTTPException(status_code=404, detail=t("Document not found"))
    """
    return lambda msg, **kwargs: translator.translate(msg, request, **kwargs)
