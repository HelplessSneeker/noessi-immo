import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { DateInput } from '../DateInput';
import { uploadDocument, getTransactions, getCredits } from '../../api/client';
import { type Property, type DocumentCategory } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';

interface DocumentFormProps {
  propertyId?: string;
  properties?: Property[];
  onSuccess?: () => void;
}

export function DocumentForm({ propertyId, properties, onSuccess }: DocumentFormProps) {
  const { t, getDocumentCategoryLabel } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(propertyId || '');
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>('invoice');
  const [selectedTransactionId, setSelectedTransactionId] = useState<string>('');
  const [selectedCreditId, setSelectedCreditId] = useState<string>('');

  // Get effective property ID (prop or state)
  const effectivePropertyId = propertyId || selectedPropertyId;

  // Fetch transactions for the selected property (only when category is 'invoice')
  const { data: transactions } = useQuery({
    queryKey: ['transactions', effectivePropertyId],
    queryFn: () => getTransactions(effectivePropertyId),
    enabled: !!effectivePropertyId && selectedCategory === 'invoice',
  });

  // Fetch credits for the selected property (only when category is 'loan')
  const { data: credits } = useQuery({
    queryKey: ['credits', effectivePropertyId],
    queryFn: () => getCredits(effectivePropertyId),
    enabled: !!effectivePropertyId && selectedCategory === 'loan',
  });

  // Clear transaction/credit fields when category changes
  useEffect(() => {
    if (selectedCategory !== 'invoice') {
      setSelectedTransactionId('');
    }
    if (selectedCategory !== 'loan') {
      setSelectedCreditId('');
    }
  }, [selectedCategory]);

  // Get today's date in ISO format (yyyy-mm-dd) for default document date
  const getTodayISO = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const uploadMutation = useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      setShowForm(false);
      setSelectedPropertyId('');
      setSelectedCategory('invoice');
      setSelectedTransactionId('');
      setSelectedCreditId('');
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error('Upload error:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (!effectivePropertyId) {
      console.error('No property selected');
      return;
    }

    formData.append('property_id', effectivePropertyId);

    // Add transaction_id or credit_id based on category
    if (selectedCategory === 'invoice' && selectedTransactionId) {
      formData.append('transaction_id', selectedTransactionId);
    }
    if (selectedCategory === 'loan' && selectedCreditId) {
      formData.append('credit_id', selectedCreditId);
    }

    uploadMutation.mutate(formData);
  };

  return (
    <div>
      {uploadSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 font-medium">{t('document.uploadSuccess')}</p>
        </div>
      )}

      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('document.upload')}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h3 className="font-medium text-slate-800 mb-4">{t('document.upload')}</h3>
          {uploadMutation.isError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-medium">{t('document.uploadError')}</p>
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
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('document.file')} *</label>
                <input type="file" name="file" required className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              </div>
              {!propertyId && properties && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('property.property')} *</label>
                  <select
                    value={selectedPropertyId}
                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="">{t('document.selectProperty')}</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('document.category')} *</label>
                <select
                  name="category"
                  required
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as DocumentCategory)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  {(['rental_contract', 'invoice', 'tax', 'property_management', 'loan', 'other'] as DocumentCategory[]).map((category) => (
                    <option key={category} value={category}>{getDocumentCategoryLabel(category)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('document.documentDate')}</label>
                <DateInput
                  name="document_date"
                  defaultValue={getTodayISO()}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Conditional Transaction Dropdown */}
              {selectedCategory === 'invoice' && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t('document.linkToTransaction')} ({t('common.optional')})
                  </label>
                  <select
                    value={selectedTransactionId}
                    onChange={(e) => setSelectedTransactionId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="">{t('transaction.selectCredit')}</option>
                    {transactions?.map((tx) => (
                      <option key={tx.id} value={tx.id}>
                        {tx.date} - {tx.description || tx.category} (€{tx.amount})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Conditional Credit Dropdown */}
              {selectedCategory === 'loan' && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t('document.linkToCredit')} ({t('common.optional')})
                  </label>
                  <select
                    value={selectedCreditId}
                    onChange={(e) => setSelectedCreditId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="">{t('transaction.selectCredit')}</option>
                    {credits?.map((credit) => (
                      <option key={credit.id} value={credit.id}>
                        {credit.name} (€{credit.original_amount})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('document.description')}</label>
                <input type="text" name="description" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={uploadMutation.isPending || !effectivePropertyId}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {uploadMutation.isPending ? t('common.saving') : t('common.save')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setSelectedPropertyId('');
                  setSelectedCategory('invoice');
                  setSelectedTransactionId('');
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
