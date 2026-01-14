# Immo Manager

Immobilienverwaltungs-Software für österreichische Eigentumswohnungen.

## Projektstruktur

```
immo-manager/
├── backend/          # Python FastAPI Backend
├── frontend/         # React TypeScript Frontend
└── docker-compose.yml
```

## Tech Stack

- **Backend:** Python 3.11, FastAPI, SQLAlchemy, PostgreSQL, Alembic
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, react-i18next
- **Infrastruktur:** Docker Compose
- **i18n:** Deutsch (Standard), English
- **Migrations:** Alembic (automatic on container start)

## Datenmodell

```
Property (Immobilie)
├── id, name, address, purchase_date, purchase_price, notes
│
├── Credits (Kredite) [1:n]
│   └── id, name, original_amount, interest_rate, monthly_payment, start_date, end_date
│   └── current_balance wird berechnet aus: original_amount - SUM(verknüpfte Transactions)
│
├── Transactions (Buchungen) [1:n]
│   └── id, date, type (income/expense), category, amount, description, recurring
│   └── credit_id (optional) → verknüpft Zahlung mit Kredit
│
└── Documents (Dokumente) [1:n]
    └── id, filename, filepath, document_date, category, description
    └── transaction_id (optional) → verknüpft Dokument mit Buchung
    └── credit_id (optional) → verknüpft Dokument mit Kredit
```

## Kategorien

**TransactionCategory:** miete, betriebskosten, reparatur, kreditrate, steuer, sonstiges

**DocumentCategory:** mietvertrag, rechnung, steuer, hausverwaltung, kredit, sonstiges

## API-Konventionen

- Alle Endpoints unter `/api/`
- REST-Konform: GET (list/detail), POST (create), PUT (update), DELETE
- UUIDs als Primary Keys
- Decimal für Geldbeträge
- Deutsche Enum-Werte für Kategorien

## Lokale Entwicklung

```bash
# Alles starten
docker compose up --build

# Nur Backend
cd backend && uvicorn app.main:app --reload

# Nur Frontend (benötigt .env - siehe frontend/.env.example)
cd frontend && npm run dev
```

## Datenbank-Migrationen

Migrations laufen automatisch beim Backend-Start. Details siehe `backend/MIGRATIONS.md`.

```bash
# Neue Migration erstellen (nach Model-Änderungen)
cd backend && ./migrate.sh create "beschreibung"

# Migration-Status prüfen
./migrate.sh status

# Manuelle Anwendung (falls nötig)
./migrate.sh up
```

## Internationalisierung (i18n)

- **Sprachen:** Deutsch (Standard), English
- **Frontend:** react-i18next mit `useTranslation()` Hook
- **Backend:** Eigene Translator-Klasse für API-Responses
- **Locale-Dateien:** `frontend/src/i18n/locales/{de,en}.json`
- Standardsprache: Deutsch (kann via Browser-Einstellungen erkannt werden)

## Implementierungshinweise

- **Datumsformate:** Einheitlich `mm.dd.yy` via DateInput-Komponente
- **Fehlerbehandlung:** Umfassende Backend-Validierung mit i18n-Support, Request-ID-Tracking und strukturiertem Logging
- **Upload:** Dokumente mit Typ-, Größen- und Fehlervalidierung (max 50MB, erlaubte Typen: pdf, jpg, png, doc, xls, txt)
- **Übersetzungen:** Alle UI-Texte via `t()` Funktion aus useTranslation Hook

## Ports

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs
- PostgreSQL: localhost:5432

## Geplante Features

- [ ] E-Mail-Import (IMAP)
- [ ] PDF-Texterkennung (OCR)
- [ ] KI-gestützte Kategorisierung
- [ ] Wiederkehrende Buchungen automatisieren
- [ ] Export für Steuererklärung (E1a)
- [ ] Volltextsuche in Dokumenten
