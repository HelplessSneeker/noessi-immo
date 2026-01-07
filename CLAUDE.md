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

- **Backend:** Python 3.11, FastAPI, SQLAlchemy, PostgreSQL
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, TanStack Query
- **Infrastruktur:** Docker Compose

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
```

## Kategorien

**TransactionCategory:** miete, betriebskosten, reparatur, kreditrate, steuer, sonstiges

**DocumentCategory:** betriebskosten, mietvertrag, rechnung, steuer, hausverwaltung, sonstiges

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

## Implementierungshinweise

- **Datumsformate:** Einheitlich `mm.dd.yy` via DateInput-Komponente
- **Fehlerbehandlung:** API-Client fängt Fehler ab und zeigt Meldungen
- **Upload:** Dokumente werden mit Fehlervalidierung hochgeladen

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
