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

        # Database errors
        "Internal server error": "Interner Serverfehler",
        "Database operation failed": "Datenbankoperation fehlgeschlagen",
        "Referenced resource does not exist": "Referenzierte Ressource existiert nicht",
        "Resource with this identifier already exists": "Ressource mit dieser Kennung existiert bereits",
        "Required field is missing": "Pflichtfeld fehlt",
        "Database constraint violation": "Datenbank-Constraint verletzt",

        # Property errors
        "Cannot delete property with existing credits, transactions, or documents": "Immobilie mit vorhandenen Krediten, Transaktionen oder Dokumenten kann nicht gelöscht werden",
        "Purchase price cannot be negative": "Kaufpreis kann nicht negativ sein",

        # Credit errors
        "Original amount must be positive": "Ursprungsbetrag muss positiv sein",
        "Interest rate must be between 0 and 100": "Zinssatz muss zwischen 0 und 100 liegen",
        "Monthly payment must be positive": "Monatliche Rate muss positiv sein",
        "Monthly payment cannot exceed original amount": "Monatliche Rate kann Ursprungsbetrag nicht überschreiten",
        "End date must be after start date": "Enddatum muss nach Startdatum liegen",
        "Start date cannot be in the future": "Startdatum kann nicht in der Zukunft liegen",
        "Cannot delete credit with linked transactions": "Kredit mit verknüpften Transaktionen kann nicht gelöscht werden",

        # Transaction errors
        "Amount must be positive": "Betrag muss positiv sein",
        "Credit must belong to the same property": "Kredit muss zur selben Immobilie gehören",
        "Transaction linked to credit should use 'loan_payment' category": "Mit Kredit verknüpfte Transaktion sollte Kategorie 'Kreditrate' verwenden",
        "Category incompatible with income type": "Kategorie nicht kompatibel mit Einnahmen-Typ",
        "Transaction date cannot be more than 1 year in the future": "Transaktionsdatum darf nicht mehr als 1 Jahr in der Zukunft liegen",

        # Document errors
        "File type not allowed": "Dateityp nicht erlaubt",
        "Failed to read uploaded file": "Hochgeladene Datei konnte nicht gelesen werden",
        "File size exceeds maximum allowed size": "Dateigröße überschreitet maximale Größe",
        "Failed to save file to disk": "Datei konnte nicht auf Festplatte gespeichert werden",
        "Transaction must belong to the same property": "Transaktion muss zur selben Immobilie gehören",

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

        # Database errors
        "Internal server error": "Internal server error",
        "Database operation failed": "Database operation failed",
        "Referenced resource does not exist": "Referenced resource does not exist",
        "Resource with this identifier already exists": "Resource with this identifier already exists",
        "Required field is missing": "Required field is missing",
        "Database constraint violation": "Database constraint violation",

        # Property errors
        "Cannot delete property with existing credits, transactions, or documents": "Cannot delete property with existing credits, transactions, or documents",
        "Purchase price cannot be negative": "Purchase price cannot be negative",

        # Credit errors
        "Original amount must be positive": "Original amount must be positive",
        "Interest rate must be between 0 and 100": "Interest rate must be between 0 and 100",
        "Monthly payment must be positive": "Monthly payment must be positive",
        "Monthly payment cannot exceed original amount": "Monthly payment cannot exceed original amount",
        "End date must be after start date": "End date must be after start date",
        "Start date cannot be in the future": "Start date cannot be in the future",
        "Cannot delete credit with linked transactions": "Cannot delete credit with linked transactions",

        # Transaction errors
        "Amount must be positive": "Amount must be positive",
        "Credit must belong to the same property": "Credit must belong to the same property",
        "Transaction linked to credit should use 'loan_payment' category": "Transaction linked to credit should use 'loan_payment' category",
        "Category incompatible with income type": "Category incompatible with income type",
        "Transaction date cannot be more than 1 year in the future": "Transaction date cannot be more than 1 year in the future",

        # Document errors
        "File type not allowed": "File type not allowed",
        "Failed to read uploaded file": "Failed to read uploaded file",
        "File size exceeds maximum allowed size": "File size exceeds maximum allowed size",
        "Failed to save file to disk": "Failed to save file to disk",
        "Transaction must belong to the same property": "Transaction must belong to the same property",

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
