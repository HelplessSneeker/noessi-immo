# Frontend — React TypeScript

React-Dashboard für die Immo Manager Applikation.

## Struktur

```
frontend/
├── src/
│   ├── main.tsx          # Entry Point, QueryClient, Router
│   ├── App.tsx           # Layout, Sidebar, Route-Definitionen
│   ├── index.css         # Tailwind Imports, globale Styles
│   ├── api/
│   │   └── client.ts     # Axios Client, alle API-Funktionen
│   ├── types/
│   │   └── index.ts      # TypeScript Interfaces, Enums, Labels
│   └── pages/
│       ├── Dashboard.tsx
│       ├── Properties.tsx
│       ├── PropertyDetail.tsx
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
const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: createResource,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['resource-name'] });
  },
});

// Aufruf
mutation.mutate(data);
```

## Styling mit Tailwind

- Utility-First: Klassen direkt im JSX
- Custom Colors definiert in `tailwind.config.js` (primary-50 bis primary-900)
- Konsistente Abstände: `p-4`, `p-6`, `gap-4`, `gap-6`
- Karten: `bg-white rounded-xl border border-slate-200 p-6`
- Buttons: `px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700`

## Wichtige Patterns

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

### Deutsche Formatierung
```tsx
// Datum
new Date(dateString).toLocaleDateString('de-AT')

// Währung
Number(amount).toLocaleString('de-AT', { minimumFractionDigits: 2 })
```

## Deutsche Labels

Kategorien werden über Lookup-Objekte übersetzt:
```tsx
import { TRANSACTION_CATEGORY_LABELS } from '../types';
// ...
{TRANSACTION_CATEGORY_LABELS[tx.category]}
```

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
