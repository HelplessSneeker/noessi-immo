import { useQuery } from '@tanstack/react-query';
import { Receipt } from 'lucide-react';
import { getTransactions, getProperties } from '../api/client';
import { TRANSACTION_CATEGORY_LABELS, type TransactionCategory } from '../types';

function Transactions() {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => getTransactions(),
  });

  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: getProperties,
  });

  const propertyMap = new Map(properties?.map(p => [p.id, p.name]) || []);

  if (isLoading) {
    return <div className="text-slate-500">Lade...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">Alle Buchungen</h1>

      {!transactions?.length ? (
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
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Immobilie</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Kategorie</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Beschreibung</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-slate-600">Betrag</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 text-slate-600">
                    {new Date(tx.date).toLocaleDateString('de-AT')}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {propertyMap.get(tx.property_id) || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700">
                      {TRANSACTION_CATEGORY_LABELS[tx.category as TransactionCategory] || tx.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{tx.description || '-'}</td>
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

export default Transactions;
