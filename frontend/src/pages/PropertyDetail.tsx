import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Trash2, Download, CreditCard, Receipt, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getPropertySummary,
  getCredits,
  getTransactions,
  getDocuments,
  deleteCredit,
  deleteTransaction,
  deleteDocument,
  getDocumentDownloadUrl
} from '../api/client';
import {
  type DocumentCategory,
  type TransactionCategory
} from '../types';
import { formatDate } from '../utils/dateFormat';
import { getErrorMessage } from '../utils/errorUtils';
import { CreditForm } from '../components/forms/CreditForm';
import { TransactionForm } from '../components/forms/TransactionForm';
import { DocumentForm } from '../components/forms/DocumentForm';
import { useTranslation } from '../hooks/useTranslation';

function PropertyDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'overview' | 'credits' | 'transactions' | 'documents'>('overview');

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
    return <div className="text-slate-500">{t('common.loading')}</div>;
  }

  const { property, total_income, total_expenses, balance, total_credit_balance } = summary;

  const tabs = [
    { key: 'overview', label: t('tabs.overview') },
    { key: 'credits', label: `${t('tabs.credits')} (${credits?.length || 0})` },
    { key: 'transactions', label: `${t('tabs.transactions')} (${transactions?.length || 0})` },
    { key: 'documents', label: `${t('tabs.documents')} (${documents?.length || 0})` },
  ];

  return (
    <div>
      <Link
        to="/properties"
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('common.back')}
      </Link>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h1 className="text-2xl font-semibold text-slate-800 mb-1">{property.name}</h1>
        <p className="text-slate-500">{property.address}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
          <div>
            <p className="text-sm text-slate-500">{t('dashboard.income')}</p>
            <p className="text-xl font-semibold text-green-600">
              € {Number(total_income).toLocaleString('de-AT', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">{t('dashboard.expenses')}</p>
            <p className="text-xl font-semibold text-red-600">
              € {Number(total_expenses).toLocaleString('de-AT', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">{t('dashboard.overview')}</p>
            <p className={`text-xl font-semibold ${Number(balance) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              € {Number(balance).toLocaleString('de-AT', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">{t('dashboard.creditBalance')}</p>
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
            {formatDate(property.purchase_date) || '-'}
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
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['credits', propertyId] });
    queryClient.invalidateQueries({ queryKey: ['property-summary', propertyId] });
  };

  const deleteMutation = useMutation({
    mutationFn: deleteCredit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credits', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property-summary', propertyId] });
      toast.success(t('credit.deleteSuccess'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, t('errors.deleteFailed')));
    },
  });

  return (
    <div>
      <CreditForm propertyId={propertyId} onSuccess={handleSuccess} />

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
                <tr key={credit.id} className="border-b border-slate-100">
                  <td className="px-6 py-4 font-medium text-slate-800">{credit.name}</td>
                  <td className="px-6 py-4 text-right text-slate-600">€ {Number(credit.original_amount).toLocaleString('de-AT', { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 text-right text-slate-600">{Number(credit.interest_rate).toFixed(2)}%</td>
                  <td className="px-6 py-4 text-right text-slate-600">€ {Number(credit.monthly_payment).toLocaleString('de-AT', { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 text-right font-medium text-slate-800">€ {Number(credit.current_balance || credit.original_amount).toLocaleString('de-AT', { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => { if (confirm(t('credit.deleteConfirm'))) deleteMutation.mutate(credit.id); }} className="p-2 text-slate-400 hover:text-red-600">
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
  const { t, getTransactionCategoryLabel } = useTranslation();
  const queryClient = useQueryClient();

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['transactions', propertyId] });
    queryClient.invalidateQueries({ queryKey: ['property-summary', propertyId] });
    queryClient.invalidateQueries({ queryKey: ['credits', propertyId] });
  };

  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property-summary', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['credits', propertyId] });
      toast.success(t('transaction.deleteSuccess'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, t('errors.deleteFailed')));
    },
  });

  return (
    <div>
      <TransactionForm propertyId={propertyId} credits={credits} onSuccess={handleSuccess} />

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
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">{t('transaction.category')}</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">{t('transaction.description')}</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-slate-600">{t('transaction.amount')}</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-slate-100">
                  <td className="px-6 py-4 text-slate-600">{formatDate(tx.date)}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700">
                      {getTransactionCategoryLabel(tx.category as TransactionCategory)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{tx.description || '-'}</td>
                  <td className={`px-6 py-4 text-right font-medium ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'income' ? '+' : '-'}€ {Number(tx.amount).toLocaleString('de-AT', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => { if (confirm(t('transaction.deleteConfirm'))) deleteMutation.mutate(tx.id); }} className="p-2 text-slate-400 hover:text-red-600">
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
  const { t, getDocumentCategoryLabel } = useTranslation();
  const queryClient = useQueryClient();

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['documents', propertyId] });
    queryClient.invalidateQueries({ queryKey: ['property-summary', propertyId] });
  };

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property-summary', propertyId] });
      toast.success(t('document.deleteSuccess'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, t('errors.deleteFailed')));
    },
  });

  return (
    <div>
      <DocumentForm propertyId={propertyId} onSuccess={handleSuccess} />

      {!documents.length ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-500">{t('document.noDocuments')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">{t('document.file')}</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">{t('document.category')}</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">{t('document.description')}</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">{t('document.uploaded')}</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="border-b border-slate-100">
                  <td className="px-6 py-4 font-medium text-slate-800">{doc.filename}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700">
                      {getDocumentCategoryLabel(doc.category as DocumentCategory)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{doc.description || '-'}</td>
                  <td className="px-6 py-4 text-slate-600">{formatDate(doc.upload_date)}</td>
                  <td className="px-6 py-4 text-right flex gap-2 justify-end">
                    <a href={getDocumentDownloadUrl(doc.id)} className="p-2 text-slate-400 hover:text-primary-600">
                      <Download className="w-4 h-4" />
                    </a>
                    <button onClick={() => { if (confirm(t('document.deleteConfirm'))) deleteMutation.mutate(doc.id); }} className="p-2 text-slate-400 hover:text-red-600">
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
