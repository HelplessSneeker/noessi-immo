import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Receipt, CreditCard, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getTransactions, getProperties, getDocuments, getCredits, deleteCredit } from '../api/client';
import { type TransactionCategory, type Credit, type Transaction, type Property } from '../types';
import { formatDate } from '../utils/dateFormat';
import { getErrorMessage } from '../utils/errorUtils';
import { GlobalCreditForm } from '../components/forms/GlobalCreditForm';
import { GlobalTransactionForm } from '../components/forms/GlobalTransactionForm';
import { useTranslation } from '../hooks/useTranslation';

function Finances() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'transactions' | 'credits'>('transactions');

  // Fetch all data (no property filter)
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => getTransactions(),
  });

  const { data: credits } = useQuery({
    queryKey: ['credits'],
    queryFn: () => getCredits(),
  });

  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: getProperties,
  });

  const { data: documents } = useQuery({
    queryKey: ['documents'],
    queryFn: () => getDocuments(),
  });

  // Create lookup maps
  const propertyMap = new Map(properties?.map(p => [p.id, p.name]) || []);
  const documentMap = new Map(
    documents
      ?.filter(doc => doc.transaction_id)
      ?.map(doc => [doc.transaction_id!, doc.filename]) || []
  );

  const tabs = [
    { key: 'transactions' as const, label: `${t('tabs.transactions')} (${transactions?.length || 0})` },
    { key: 'credits' as const, label: `${t('tabs.credits')} (${credits?.length || 0})` },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">{t('finances.title')}</h1>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 mb-6">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
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
      {activeTab === 'transactions' && (
        <TransactionsTab
          transactions={transactions || []}
          isLoading={transactionsLoading}
          properties={properties || []}
          credits={credits || []}
          propertyMap={propertyMap}
          documentMap={documentMap}
        />
      )}

      {activeTab === 'credits' && (
        <CreditsTab
          credits={credits || []}
          properties={properties || []}
          propertyMap={propertyMap}
        />
      )}
    </div>
  );
}

function TransactionsTab({
  transactions,
  isLoading,
  properties,
  credits,
  propertyMap,
  documentMap,
}: {
  transactions: Transaction[];
  isLoading: boolean;
  properties: Property[];
  credits: Credit[];
  propertyMap: Map<string, string>;
  documentMap: Map<string, string>;
}) {
  const { t, getTransactionCategoryLabel } = useTranslation();

  if (isLoading) {
    return <div className="text-slate-500">{t('common.loading')}</div>;
  }

  return (
    <div>
      <GlobalTransactionForm properties={properties} credits={credits} />
      {!transactions.length ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <Receipt className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-500">{t('transaction.noTransactions')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">{t('transaction.date')}</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">{t('property.property')}</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">{t('transaction.category')}</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">{t('transaction.description')}</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">{t('document.document')}</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-slate-600">{t('transaction.amount')}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 text-slate-600">
                    {formatDate(tx.date)}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {propertyMap.get(tx.property_id) || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700">
                      {getTransactionCategoryLabel(tx.category as TransactionCategory)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{tx.description || '-'}</td>
                  <td className="px-6 py-4 text-slate-600">{documentMap.get(tx.id) || '-'}</td>
                  <td className={`px-6 py-4 text-right font-medium ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'income' ? '+' : '-'}€ {Number(tx.amount).toLocaleString('de-AT', { minimumFractionDigits: 2 })}
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

function CreditsTab({
  credits,
  properties,
  propertyMap,
}: {
  credits: Credit[];
  properties: Property[];
  propertyMap: Map<string, string>;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteCredit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credits'] });
      queryClient.invalidateQueries({ queryKey: ['property-summary'] });
      toast.success(t('credit.deleteSuccess'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, t('errors.deleteFailed')));
    },
  });

  return (
    <div>
      <GlobalCreditForm properties={properties} />

      {!credits.length ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <CreditCard className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-500">{t('credit.noCredits')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">{t('property.property')}</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">{t('credit.name')}</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-slate-600">{t('credit.originalAmount')}</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-slate-600">{t('credit.interestRate')}</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-slate-600">{t('credit.monthlyPayment')}</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-slate-600">{t('credit.currentBalance')}</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {credits.map((credit) => (
                <tr key={credit.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 text-slate-600">
                    {propertyMap.get(credit.property_id) || '-'}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800">{credit.name}</td>
                  <td className="px-6 py-4 text-right text-slate-600">
                    € {Number(credit.original_amount).toLocaleString('de-AT', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-600">
                    {Number(credit.interest_rate).toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 text-right text-slate-600">
                    € {Number(credit.monthly_payment).toLocaleString('de-AT', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-slate-800">
                    € {Number(credit.current_balance || credit.original_amount).toLocaleString('de-AT', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => { if (confirm(t('credit.deleteConfirm'))) deleteMutation.mutate(credit.id); }}
                      className="p-2 text-slate-400 hover:text-red-600"
                    >
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

export default Finances;
