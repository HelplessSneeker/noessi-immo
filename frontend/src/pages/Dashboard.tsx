import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Building2, TrendingUp, TrendingDown, FileText, CreditCard } from 'lucide-react';
import { getProperties, getPropertySummary } from '../api/client';
import { useTranslation } from '../hooks/useTranslation';

function Dashboard() {
  const { t } = useTranslation();
  const { data: properties, isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: getProperties,
  });

  if (isLoading) {
    return <div className="text-slate-500">{t('common.loading')}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">{t('dashboard.title')}</h1>

      {!properties?.length ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-slate-700 mb-2">
            {t('property.noProperties')}
          </h2>
          <p className="text-slate-500 mb-4">
            {t('property.noPropertiesDescription')}
          </p>
          <Link
            to="/properties"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Building2 className="w-4 h-4" />
            {t('property.addProperty')}
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {properties.map((property) => (
            <PropertyCard key={property.id} propertyId={property.id} />
          ))}
        </div>
      )}
    </div>
  );
}

function PropertyCard({ propertyId }: { propertyId: string }) {
  const { t } = useTranslation();
  const { data: summary, isLoading } = useQuery({
    queryKey: ['property-summary', propertyId],
    queryFn: () => getPropertySummary(propertyId),
  });

  if (isLoading || !summary) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
      </div>
    );
  }

  const { property, total_income, total_expenses, total_credit_balance, document_count } = summary;

  return (
    <Link
      to={`/properties/${property.id}`}
      className="block bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-medium text-slate-800">{property.name}</h2>
          <p className="text-slate-500 text-sm">{property.address}</p>
        </div>
        <Building2 className="w-5 h-5 text-slate-400" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-600" />
          <div>
            <p className="text-xs text-slate-500">{t('dashboard.income')}</p>
            <p className="font-medium text-green-600">
              € {Number(total_income).toLocaleString('de-AT', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-red-600" />
          <div>
            <p className="text-xs text-slate-500">{t('dashboard.expenses')}</p>
            <p className="font-medium text-red-600">
              € {Number(total_expenses).toLocaleString('de-AT', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-slate-600" />
          <div>
            <p className="text-xs text-slate-500">{t('dashboard.creditBalance')}</p>
            <p className="font-medium text-slate-700">
              € {Number(total_credit_balance).toLocaleString('de-AT', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-600" />
          <div>
            <p className="text-xs text-slate-500">{t('document.documents')}</p>
            <p className="font-medium text-slate-700">{document_count}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default Dashboard;
