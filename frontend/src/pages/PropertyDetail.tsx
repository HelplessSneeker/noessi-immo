import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, Download, CreditCard, Receipt, FileText } from 'lucide-react';
import { 
  getPropertySummary, 
  getCredits, 
  getTransactions, 
  getDocuments,
  createCredit,
  createTransaction,
  uploadDocument,
  deleteCredit,
  deleteTransaction,
  deleteDocument,
  getDocumentDownloadUrl
} from '../api/client';
import { 
  TRANSACTION_CATEGORY_LABELS, 
  DOCUMENT_CATEGORY_LABELS,
  type CreditCreate,
  type TransactionCreate,
  type DocumentCategory,
  type TransactionCategory,
  type TransactionType
} from '../types';

function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'overview' | 'credits' | 'transactions' | 'documents'>('overview');
  const queryClient = useQueryClient();

  const { data: summary, isLoading } = useQuery({
    queryKey: ['property-summary', id],
    queryFn: () => getPropertySummary(id!),
    enabled: !!id,
  });

  const { data: credits } = useQuery({
    queryKey: ['credits', id],
    queryFn: () => getCredits(id),
    enabled: !!id,
  });

  const { data: transactions } = useQuery({
    queryKey: ['transactions', id],
    queryFn: () => getTransactions(id),
    enabled: !!id,
  });

  const { data: documents } = useQuery({
    queryKey: ['documents', id],
    queryFn: () => getDocuments(id),
    enabled: !!id,
  });

  if (isLoading || !summary) {
    return <div className="text-slate-500">Lade...</div>;
  }

  const { property, total_income, total_expenses, balance, total_credit_balance, document_count } = summary;

  const tabs = [
    { key: 'overview', label: 'Übersicht' },
    { key: 'credits', label: `Kredite (${credits?.length || 0})` },
    { key: 'transactions', label: `Buchungen (${transactions?.length || 0})` },
    { key: 'documents', label: `Dokumente (${documents?.length || 0})` },
  ];

  return (
    <div>
      <Link 
        to="/properties" 
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Zurück
      </Link>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h1 className="text-2xl font-semibold text-slate-800 mb-1">{property.name}</h1>
        <p className="text-slate-500">{property.address}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
          <div>
            <p className="text-sm text-slate-500">Einnahmen</p>
            <p className="text-xl font-semibold text-green-600">
              € {Number(total_income).toLocaleString('de-AT', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Ausgaben</p>
            <p className="text-xl font-semibold text-red-600">
              € {Number(total_expenses).toLocaleString('de-AT', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Bilanz</p>
            <p className={`text-xl font-semibold ${Number(balance) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              € {Number(balance).toLocaleString('de-AT', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Kredit offen</p>
            <p className="text-xl font-semibold text-slate-700">
              € {Number(total_credit_balance).toLocaleString('de-AT', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab property={property} />
      )}
      {activeTab === 'credits' && (
        <CreditsTab propertyId={id!} credits={credits || []} />
      )}
      {activeTab === 'transactions' && (
        <TransactionsTab propertyId={id!} transactions={transactions || []} credits={credits || []} />
      )}
      {activeTab === 'documents' && (
        <DocumentsTab propertyId={id!} documents={documents || []} />
      )}
    </div>
  );
}

function OverviewTab({ property }: { property: any }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-lg font-medium text-slate-800 mb-4">Details</h2>
      <dl className="grid grid-cols-2 gap-4">
        <div>
          <dt className="text-sm text-slate-500">Kaufdatum</dt>
          <dd className="text-slate-800">
            {property.purchase_date 
              ? new Date(property.purchase_date).toLocaleDateString('de-AT')
              : '-'}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">Kaufpreis</dt>
          <dd className="text-slate-800">
            {property.purchase_price
              ? `€ ${Number(property.purchase_price).toLocaleString('de-AT', { minimumFractionDigits: 2 })}`
              : '-'}
          </dd>
        </div>
        {property.notes && (
          <div className="col-span-2">
            <dt className="text-sm text-slate-500">Notizen</dt>
            <dd className="text-slate-800">{property.notes}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

function CreditsTab({ propertyId, credits }: { propertyId: string; credits: any[] }) {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createCredit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credits', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property-summary', propertyId] });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCredit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credits', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property-summary', propertyId] });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: CreditCreate = {
      property_id: propertyId,
      name: formData.get('name') as string,
      original_amount: Number(formData.get('original_amount')),
      interest_rate: Number(formData.get('interest_rate')),
      monthly_payment: Number(formData.get('monthly_payment')),
      start_date: formData.get('start_date') as string,
      end_date: formData.get('end_date') as string || undefined,
    };
    createMutation.mutate(data);
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Neuer Kredit
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h3 className="font-medium text-slate-800 mb-4">Neuen Kredit anlegen</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input type="text" name="name" required className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="z.B. Wohnbaukredit" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kreditsumme (€) *</label>
                <input type="number" name="original_amount" step="0.01" required className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Zinssatz (%) *</label>
                <input type="number" name="interest_rate" step="0.01" required className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Monatliche Rate (€) *</label>
                <input type="number" name="monthly_payment" step="0.01" required className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Startdatum *</label>
                <input type="date" name="start_date" required className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Enddatum</label>
                <input type="date" name="end_date" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                {createMutation.isPending ? 'Speichern...' : 'Speichern'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      )}

      {!credits.length ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <CreditCard className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-500">Keine Kredite vorhanden.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Name</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-slate-600">Kreditsumme</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-slate-600">Zinssatz</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-slate-600">Monatl. Rate</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-slate-600">Restschuld</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {credits.map((credit) => (
                <tr key={credit.id} className="border-b border-slate-100">
                  <td className="px-6 py-4 font-medium text-slate-800">{credit.name}</td>
                  <td className="px-6 py-4 text-right text-slate-600">€ {Number(credit.original_amount).toLocaleString('de-AT', { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 text-right text-slate-600">{Number(credit.interest_rate).toFixed(2)}%</td>
                  <td className="px-6 py-4 text-right text-slate-600">€ {Number(credit.monthly_payment).toLocaleString('de-AT', { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 text-right font-medium text-slate-800">€ {Number(credit.current_balance || credit.original_amount).toLocaleString('de-AT', { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => { if (confirm('Kredit löschen?')) deleteMutation.mutate(credit.id); }} className="p-2 text-slate-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TransactionsTab({ propertyId, transactions, credits }: { propertyId: string; transactions: any[]; credits: any[] }) {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property-summary', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['credits', propertyId] });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property-summary', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['credits', propertyId] });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: TransactionCreate = {
      property_id: propertyId,
      date: formData.get('date') as string,
      type: formData.get('type') as TransactionType,
      category: formData.get('category') as TransactionCategory,
      amount: Number(formData.get('amount')),
      description: formData.get('description') as string || undefined,
      credit_id: formData.get('credit_id') as string || undefined,
    };
    createMutation.mutate(data);
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          <Plus className="w-4 h-4" />
          Neue Buchung
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h3 className="font-medium text-slate-800 mb-4">Neue Buchung</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Datum *</label>
                <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Typ *</label>
                <select name="type" required className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                  <option value="income">Einnahme</option>
                  <option value="expense">Ausgabe</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kategorie *</label>
                <select name="category" required className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                  {Object.entries(TRANSACTION_CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Betrag (€) *</label>
                <input type="number" name="amount" step="0.01" required className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              </div>
              {credits.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kredit (optional)</label>
                  <select name="credit_id" className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                    <option value="">-- Kein Kredit --</option>
                    {credits.map((credit) => (
                      <option key={credit.id} value={credit.id}>{credit.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Beschreibung</label>
                <input type="text" name="description" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                {createMutation.isPending ? 'Speichern...' : 'Speichern'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      )}

      {!transactions.length ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <Receipt className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-500">Keine Buchungen vorhanden.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Datum</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Kategorie</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Beschreibung</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-slate-600">Betrag</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-slate-100">
                  <td className="px-6 py-4 text-slate-600">{new Date(tx.date).toLocaleDateString('de-AT')}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700">
                      {TRANSACTION_CATEGORY_LABELS[tx.category as TransactionCategory] || tx.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{tx.description || '-'}</td>
                  <td className={`px-6 py-4 text-right font-medium ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'income' ? '+' : '-'}€ {Number(tx.amount).toLocaleString('de-AT', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => { if (confirm('Buchung löschen?')) deleteMutation.mutate(tx.id); }} className="p-2 text-slate-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DocumentsTab({ propertyId, documents }: { propertyId: string; documents: any[] }) {
  const [showForm, setShowForm] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property-summary', propertyId] });
      setShowForm(false);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    },
    onError: (error: any) => {
      console.error('Upload error:', error);
      // Error is displayed inline in the form
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property-summary', propertyId] });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('property_id', propertyId);
    uploadMutation.mutate(formData);
  };

  return (
    <div>
      {uploadSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 font-medium">Dokument erfolgreich hochgeladen!</p>
        </div>
      )}

      <div className="flex justify-end mb-4">
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          <Plus className="w-4 h-4" />
          Dokument hochladen
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h3 className="font-medium text-slate-800 mb-4">Dokument hochladen</h3>
          {uploadMutation.isError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-medium">Fehler beim Hochladen:</p>
              <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                {(() => {
                  const errorMessage = (uploadMutation.error as any)?.response?.data?.detail;
                  if (Array.isArray(errorMessage)) {
                    return errorMessage.map((msg: string, idx: number) => <li key={idx}>{msg}</li>);
                  } else if (typeof errorMessage === 'string') {
                    return <li>{errorMessage}</li>;
                  }
                  return <li>Ein unbekannter Fehler ist aufgetreten</li>;
                })()}
              </ul>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Datei *</label>
                <input type="file" name="file" required className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kategorie *</label>
                <select name="category" required className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                  {Object.entries(DOCUMENT_CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dokumentdatum</label>
                <input type="date" name="document_date" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Beschreibung</label>
                <input type="text" name="description" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={uploadMutation.isPending} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                {uploadMutation.isPending ? 'Hochladen...' : 'Hochladen'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      )}

      {!documents.length ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-500">Keine Dokumente vorhanden.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Datei</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Kategorie</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Beschreibung</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Hochgeladen</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="border-b border-slate-100">
                  <td className="px-6 py-4 font-medium text-slate-800">{doc.filename}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700">
                      {DOCUMENT_CATEGORY_LABELS[doc.category as DocumentCategory] || doc.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{doc.description || '-'}</td>
                  <td className="px-6 py-4 text-slate-600">{new Date(doc.upload_date).toLocaleDateString('de-AT')}</td>
                  <td className="px-6 py-4 text-right flex gap-2 justify-end">
                    <a href={getDocumentDownloadUrl(doc.id)} className="p-2 text-slate-400 hover:text-primary-600">
                      <Download className="w-4 h-4" />
                    </a>
                    <button onClick={() => { if (confirm('Dokument löschen?')) deleteMutation.mutate(doc.id); }} className="p-2 text-slate-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PropertyDetail;
