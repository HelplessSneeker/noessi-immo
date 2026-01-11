import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { DateInput } from '../DateInput';
import { createTransaction } from '../../api/client';
import { type TransactionCreate, type TransactionType, type TransactionCategory, type Credit, type Property } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';

interface GlobalTransactionFormProps {
  properties: Property[];
  credits: Credit[];
  onSuccess?: () => void;
}

export function GlobalTransactionForm({ properties, credits, onSuccess }: GlobalTransactionFormProps) {
  const { t, getTransactionCategoryLabel } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [selectedCreditId, setSelectedCreditId] = useState<string>('');
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      setShowForm(false);
      setSelectedPropertyId('');
      setSelectedCreditId('');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['property-summary'] });
      queryClient.invalidateQueries({ queryKey: ['credits'] });
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: TransactionCreate = {
      property_id: formData.get('property_id') as string,
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

  // Filter credits to show only those belonging to the selected property
  const filteredCredits = selectedPropertyId
    ? credits.filter(c => c.property_id === selectedPropertyId)
    : [];

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (!showForm) {
              setSelectedPropertyId('');
              setSelectedCreditId('');
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('transaction.newTransaction')}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h3 className="font-medium text-slate-800 mb-4">{t('transaction.newTransaction')}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('property.property')} *</label>
                <select
                  name="property_id"
                  required
                  value={selectedPropertyId}
                  onChange={(e) => {
                    setSelectedPropertyId(e.target.value);
                    setSelectedCreditId(''); // Reset credit selection when property changes
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="">{t('document.selectProperty')}</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('transaction.date')} *</label>
                <DateInput name="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('transaction.type')} *</label>
                <select
                  name="type"
                  required
                  value={isCreditSelected ? 'expense' : undefined}
                  disabled={isCreditSelected}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100 disabled:text-slate-500"
                >
                  <option value="income">{t('transaction.income')}</option>
                  <option value="expense">{t('transaction.expense')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('transaction.category')} *</label>
                <select
                  name="category"
                  required
                  value={isCreditSelected ? 'loan_payment' : undefined}
                  disabled={isCreditSelected}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100 disabled:text-slate-500"
                >
                  {(['rent', 'operating_costs', 'repair', 'loan_payment', 'tax', 'other'] as TransactionCategory[]).map((category) => (
                    <option key={category} value={category}>{getTransactionCategoryLabel(category)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('transaction.amount')} (€) *</label>
                <input type="number" name="amount" step="0.01" required placeholder={t('transaction.amountPlaceholder')} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              </div>
              {selectedPropertyId && filteredCredits.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('transaction.linkToCredit')} {t('transaction.optional')}</label>
                  <select
                    name="credit_id"
                    value={selectedCreditId}
                    onChange={(e) => setSelectedCreditId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="">{t('transaction.selectCredit')}</option>
                    {filteredCredits.map((credit) => (
                      <option key={credit.id} value={credit.id}>{credit.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('transaction.description')}</label>
                <input type="text" name="description" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                {createMutation.isPending ? t('common.saving') : t('common.save')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setSelectedPropertyId('');
                  setSelectedCreditId('');
                }}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
