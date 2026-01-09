import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { DateInput } from '../DateInput';
import { createTransaction } from '../../api/client';
import { TRANSACTION_CATEGORY_LABELS, type TransactionCreate, type TransactionType, type TransactionCategory, type Credit } from '../../types';

interface TransactionFormProps {
  propertyId: string;
  credits?: Credit[];
  onSuccess?: () => void;
}

export function TransactionForm({ propertyId, credits, onSuccess }: TransactionFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedCreditId, setSelectedCreditId] = useState<string>('');

  const createMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      setShowForm(false);
      setSelectedCreditId('');
      onSuccess?.();
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

  const isCreditSelected = selectedCreditId !== '';

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (!showForm) {
              setSelectedCreditId('');
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
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
                <DateInput name="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Typ *</label>
                <select
                  name="type"
                  required
                  value={isCreditSelected ? 'expense' : undefined}
                  disabled={isCreditSelected}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100 disabled:text-slate-500"
                >
                  <option value="income">Einnahme</option>
                  <option value="expense">Ausgabe</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kategorie *</label>
                <select
                  name="category"
                  required
                  value={isCreditSelected ? 'kreditrate' : undefined}
                  disabled={isCreditSelected}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100 disabled:text-slate-500"
                >
                  {Object.entries(TRANSACTION_CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Betrag (€) *</label>
                <input type="number" name="amount" step="0.01" required className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              </div>
              {credits && credits.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kredit (optional)</label>
                  <select
                    name="credit_id"
                    value={selectedCreditId}
                    onChange={(e) => setSelectedCreditId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
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
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setSelectedCreditId('');
                }}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
