import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Download } from 'lucide-react';
import { getDocuments, getProperties, getDocumentDownloadUrl } from '../api/client';
import { DOCUMENT_CATEGORY_LABELS, type DocumentCategory } from '../types';
import { formatDate } from '../utils/dateFormat';
import { DocumentForm } from '../components/forms/DocumentForm';

function Documents() {
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => getDocuments(),
  });

  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: getProperties,
  });

  const propertyMap = new Map(properties?.map(p => [p.id, p.name]) || []);

  const handleDocumentSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['documents'] });
  };

  if (isLoading) {
    return <div className="text-slate-500">Lade...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">Alle Dokumente</h1>

      <DocumentForm
        properties={properties || []}
        onSuccess={handleDocumentSuccess}
      />

      {!documents?.length ? (
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
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Immobilie</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Kategorie</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Beschreibung</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Hochgeladen</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-800">{doc.filename}</td>
                  <td className="px-6 py-4 text-slate-600">
                    {propertyMap.get(doc.property_id) || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700">
                      {DOCUMENT_CATEGORY_LABELS[doc.category as DocumentCategory] || doc.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{doc.description || '-'}</td>
                  <td className="px-6 py-4 text-slate-600">
                    {formatDate(doc.upload_date)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <a 
                      href={getDocumentDownloadUrl(doc.id)} 
                      className="p-2 text-slate-400 hover:text-primary-600 inline-block"
                    >
                      <Download className="w-4 h-4" />
                    </a>
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

export default Documents;
