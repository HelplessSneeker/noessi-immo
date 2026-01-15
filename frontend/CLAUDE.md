# Frontend — React TypeScript

React-Dashboard für die Immo Manager Applikation.

## Struktur

```
frontend/
├── src/
│   ├── main.tsx          # Entry Point, QueryClient, Router, ErrorBoundary
│   ├── App.tsx           # Layout, Sidebar, Route-Definitionen
│   ├── index.css         # Tailwind Imports, globale Styles
│   ├── api/
│   │   └── client.ts     # Axios Client, Interceptors, API-Funktionen
│   ├── components/
│   │   ├── DateInput.tsx      # Custom Date Picker (mm.dd.yy Format)
│   │   ├── ErrorBoundary.tsx  # React Error Boundary
│   │   ├── FormErrorAlert.tsx # Inline Form Errors
│   │   ├── ToastProvider.tsx  # Toast Notifications (react-hot-toast)
│   │   └── forms/
│   │       ├── CreditForm.tsx
│   │       ├── DocumentForm.tsx
│   │       ├── TransactionForm.tsx
│   │       ├── GlobalCreditForm.tsx
│   │       └── GlobalTransactionForm.tsx
│   ├── i18n/
│   │   ├── index.ts      # i18n Konfiguration (react-i18next)
│   │   └── locales/
│   │       ├── de.json   # Deutsche Übersetzungen
│   │       └── en.json   # Englische Übersetzungen
│   ├── hooks/
│   │   └── useTranslation.ts  # Translation Hook
│   ├── types/
│   │   ├── index.ts      # TypeScript Interfaces, Enums
│   │   └── errors.ts     # Error Response Types
│   ├── utils/
│   │   ├── dateFormat.ts # Datumsformatierung
│   │   └── errorUtils.ts # Error Handling Utilities
│   └── pages/
│       ├── Dashboard.tsx
│       ├── Properties.tsx
│       ├── PropertyDetail.tsx
│       ├── Finances.tsx  # Globale Finanzübersicht
│       ├── Transactions.tsx
│       └── Documents.tsx
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Konventionen

### Neue Page erstellen

1. Datei in `src/pages/` anlegen:
   ```tsx
   function NeuePage() {
     return <div>...</div>;
   }
   export default NeuePage;
   ```

2. Route in `App.tsx` hinzufügen:
   ```tsx
   import NeuePage from './pages/NeuePage';
   // ...
   <Route path="/neue-route" element={<NeuePage />} />
   ```

3. Optional: Navigation in Sidebar ergänzen (navItems Array in App.tsx)

### API-Funktion hinzufügen

In `src/api/client.ts`:
```typescript
export const getNeueResource = async (): Promise<NeueResource[]> => {
  const { data } = await api.get('/neue-resource/');
  return data;
};
```

### Neuen Type definieren

In `src/types/index.ts`:
```typescript
export interface NeueResource {
  id: string;
  name: string;
  // ...
}

export interface NeueResourceCreate {
  name: string;
}
```

## Data Fetching mit TanStack Query

### Daten laden
```tsx
const { data, isLoading } = useQuery({
  queryKey: ['resource-name', id],
  queryFn: () => getResource(id),
  enabled: !!id,  // Optional: nur laden wenn id existiert
});
```

### Mutation (Create/Update/Delete)
```tsx
import toast from 'react-hot-toast';
import { getErrorMessage } from '../utils/errorUtils';

const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: createResource,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['resource-name'] });
    toast.success(t('resource.createSuccess'));
  },
  onError: (error) => {
    toast.error(getErrorMessage(error, t('errors.createFailed')));
  },
});

// Aufruf
mutation.mutate(data);
```

## Fehlerbehandlung

### Architektur

- **Axios Interceptors** (`api/client.ts`): Setzt Accept-Language Header, zeigt Toasts für Netzwerk-/Server-Fehler
- **FormErrorAlert**: Inline-Fehleranzeige in Formularen (für 400/422 Validierungsfehler)
- **Toast Notifications**: Erfolgs-/Fehlermeldungen für Aktionen (react-hot-toast)
- **ErrorBoundary**: Fängt React-Render-Fehler ab

### Inline Form Errors
```tsx
import { FormErrorAlert } from '../components/FormErrorAlert';

// In der Form-Komponente nach dem Titel:
{mutation.isError && (
  <FormErrorAlert error={mutation.error} title={t('errors.createFailed')} />
)}
```

### Toast für Delete-Operationen
```tsx
import toast from 'react-hot-toast';
import { getErrorMessage } from '../utils/errorUtils';

const deleteMutation = useMutation({
  mutationFn: deleteResource,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['resources'] });
    toast.success(t('resource.deleteSuccess'));
  },
  onError: (error) => {
    toast.error(getErrorMessage(error, t('errors.deleteFailed')));
  },
});
```

### Error Utilities
```tsx
import { getErrorMessage, getValidationErrors, isNetworkError } from '../utils/errorUtils';

// Einzelne Fehlermeldung extrahieren
getErrorMessage(error, 'Fallback message')

// Alle Validierungsfehler als Array
getValidationErrors(error)  // ['Field is required', 'Invalid value']

// Prüfen ob Netzwerkfehler (für Retry-Logik)
isNetworkError(error)
```

## Styling mit Tailwind

- Utility-First: Klassen direkt im JSX
- Custom Colors definiert in `tailwind.config.js` (primary-50 bis primary-900)
- Konsistente Abstände: `p-4`, `p-6`, `gap-4`, `gap-6`
- Karten: `bg-white rounded-xl border border-slate-200 p-6`
- Buttons: `px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700`

## Wichtige Patterns

### Wiederverwendbare Form Components

Formulare für Credits, Transactions und Documents sind als separate Komponenten in `src/components/forms/` implementiert:

```tsx
// Property-spezifische Forms
import CreditForm from '../components/forms/CreditForm';
import TransactionForm from '../components/forms/TransactionForm';
import DocumentForm from '../components/forms/DocumentForm';

// Globale Forms (property-übergreifend)
import GlobalCreditForm from '../components/forms/GlobalCreditForm';
import GlobalTransactionForm from '../components/forms/GlobalTransactionForm';

// Verwendung property-spezifisch (Props: propertyId, onSuccess, initialData optional)
<CreditForm propertyId={propertyId} onSuccess={() => handleSuccess()} />

// Verwendung global (Property-Auswahl im Formular)
<GlobalTransactionForm onSuccess={() => handleSuccess()} />

<DocumentForm
  propertyId={propertyId}
  onSuccess={() => handleSuccess()}
  transactionId={txId}  // optional
  creditId={creditId}    // optional
/>
```

### Formular mit State
```tsx
const [showForm, setShowForm] = useState(false);

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  const data = {
    name: formData.get('name') as string,
    // ...
  };
  mutation.mutate(data);
};
```

### Lösch-Bestätigung
```tsx
onClick={() => {
  if (confirm('Wirklich löschen?')) {
    deleteMutation.mutate(id);
  }
}}
```

### Datumsformatierung

**Custom DateInput Komponente** (`src/components/DateInput.tsx`):
```tsx
import DateInput from '../components/DateInput';
<DateInput value={date} onChange={(val) => setDate(val)} />
```

**Format-Utilities** (`src/utils/dateFormat.ts`):
```tsx
import { formatDateForDisplay, formatDateForInput } from '../utils/dateFormat';

// Anzeige: mm.dd.yy
formatDateForDisplay('2024-01-15') // "01.15.24"

// Input: yyyy-mm-dd
formatDateForInput('01.15.24') // "2024-01-15"
```

**Währung:**
```tsx
Number(amount).toLocaleString('de-AT', { minimumFractionDigits: 2 })
```

## Internationalisierung (i18n)

Applikation unterstützt Deutsch (Standard) und English via react-i18next:
```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <h1>{t('dashboard.title')}</h1>
    <button>{t('common.save')}</button>
  );
}
```

**Übersetzungen hinzufügen:**
- Schlüssel in `src/i18n/locales/de.json` und `en.json` eintragen
- Nested Objects für Organisation (z.B. `categories.transaction.rent`)
- Standardsprache: Deutsch (erkannt via Browser-Einstellungen)

**Error Keys:** `errors.networkError`, `errors.serverError`, `errors.createFailed`, `errors.deleteFailed`
**Success Keys:** `{resource}.deleteSuccess` (z.B. `credit.deleteSuccess`)

## Commands

```bash
# Dev Server starten
npm run dev

# Production Build
npm run build

# Type Check
npx tsc --noEmit

# Neues Package
npm install <package>
```

## Icons

Lucide React wird verwendet:
```tsx
import { Home, Building2, FileText } from 'lucide-react';
<Home className="w-5 h-5" />
```

Verfügbare Icons: https://lucide.dev/icons
