import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Building2, Trash2 } from 'lucide-react';
import { getProperties, createProperty, deleteProperty } from '../api/client';
import type { PropertyCreate } from '../types';
import { formatDate } from '../utils/dateFormat';
import { DateInput } from '../components/DateInput';

function Properties() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: properties, isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: getProperties,
  });

  const createMutation = useMutation({
    mutationFn: createProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: PropertyCreate = {
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      purchase_date: formData.get('purchase_date') as string || undefined,
      purchase_price: formData.get('purchase_price') 
        ? Number(formData.get('purchase_price')) 
        : undefined,
      notes: formData.get('notes') as string || undefined,
    };
    createMutation.mutate(data);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Immobilien</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Neue Immobilie
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-medium text-slate-800 mb-4">Neue Immobilie anlegen</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="z.B. ETW Klagenfurt"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Adresse *
                </label>
                <input
                  type="text"
                  name="address"
                  required
                  placeholder="Straße Nr, PLZ Ort"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Kaufdatum
                </label>
                <DateInput
                  name="purchase_date"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Kaufpreis (€)
                </label>
                <input
                  type="number"
                  name="purchase_price"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Notizen
              </label>
              <textarea
                name="notes"
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {createMutation.isPending ? 'Speichern...' : 'Speichern'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-slate-500">Lade...</div>
      ) : !properties?.length ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-500">Noch keine Immobilien vorhanden.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Name</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Adresse</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Kaufdatum</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-slate-600">Kaufpreis</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {properties.map((property) => (
                <tr key={property.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <Link 
                      to={`/properties/${property.id}`}
                      className="font-medium text-primary-600 hover:text-primary-700"
                    >
                      {property.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{property.address}</td>
                  <td className="px-6 py-4 text-slate-600">
                    {formatDate(property.purchase_date) || '-'}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-600">
                    {property.purchase_price
                      ? `€ ${Number(property.purchase_price).toLocaleString('de-AT', { minimumFractionDigits: 2 })}`
                      : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        if (confirm('Immobilie wirklich löschen?')) {
                          deleteMutation.mutate(property.id);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 transition-colors"
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

export default Properties;
