import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { DateInput } from '../DateInput';
import { createCredit } from '../../api/client';
import type { CreditCreate, Property } from '../../types';

interface GlobalCreditFormProps {
  properties: Property[];
  onSuccess?: () => void;
}

export function GlobalCreditForm({ properties, onSuccess }: GlobalCreditFormProps) {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createCredit,
    onSuccess: () => {
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['credits'] });
      queryClient.invalidateQueries({ queryKey: ['property-summary'] });
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: CreditCreate = {
      property_id: formData.get('property_id') as string,
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
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Immobilie *</label>
                <select
                  name="property_id"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="">Bitte wählen...</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
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
                <DateInput name="start_date" required className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Enddatum</label>
                <DateInput name="end_date" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
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
    </div>
  );
}
