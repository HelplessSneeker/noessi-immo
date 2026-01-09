# Immo Manager

Eine Web-Applikation zur Verwaltung von Eigentumswohnungen in Österreich.

## Features

- **Immobilienverwaltung** — Mehrere Wohnungen verwalten mit allen wichtigen Details
- **Kreditverwaltung** — Kredite pro Immobilie tracken mit automatischer Restschuld-Berechnung
- **Buchungen** — Einnahmen und Ausgaben erfassen, kategorisieren und mit Krediten verknüpfen
- **Dokumentenverwaltung** — Dokumente hochladen und nach Kategorie organisieren
- **Dashboard** — Übersicht über alle Immobilien mit Finanzkennzahlen

## Tech Stack

- **Backend:** Python 3.11, FastAPI, SQLAlchemy, PostgreSQL
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, TanStack Query
- **Infrastruktur:** Docker Compose

## Schnellstart

### Voraussetzungen

- Docker und Docker Compose installiert

### Starten

```bash
# Repository klonen und ins Verzeichnis wechseln
cd immo-manager

# Container bauen und starten
docker compose up --build
```

Die Applikation ist dann erreichbar unter:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Dokumentation:** http://localhost:8000/docs

### Entwicklung

Für die lokale Entwicklung ohne Docker:

**Datenbank (erforderlich):**
```bash
# Nur die PostgreSQL-Datenbank starten
docker compose up db
```

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Datenbank muss laufen (siehe oben)
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Hinweis:** Das Backend benötigt eine laufende PostgreSQL-Datenbank. Starte zuerst die Datenbank mit `docker compose up db`, bevor du das Backend startest.

## Datenmodell

```
Property (Immobilie)
├── Credits (Kredite)
├── Transactions (Buchungen) ── optional verknüpft mit Credit
└── Documents (Dokumente) ── optional verknüpft mit Transaction oder Credit
```

## Kategorien

**Buchungen:**
- Miete, Betriebskosten, Reparatur, Kreditrate, Steuer, Sonstiges

**Dokumente:**
- Mietvertrag, Rechnung, Steuer, Hausverwaltung, Kredit, Sonstiges

## Nächste Schritte (TODO)

- [ ] Suchfunktion für Dokumente
- [ ] E-Mail-Import (IMAP)
- [ ] PDF-Texterkennung (OCR)
- [ ] KI-gestützte Kategorisierung
- [ ] Export für Steuererklärung (E1a)
- [ ] Wiederkehrende Buchungen automatisieren

## Lizenz

MIT
