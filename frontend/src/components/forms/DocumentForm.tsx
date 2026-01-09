import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { DateInput } from '../DateInput';
import { uploadDocument } from '../../api/client';
import { DOCUMENT_CATEGORY_LABELS } from '../../types';

interface DocumentFormProps {
  propertyId: string;
  onSuccess?: () => void;
}

export function DocumentForm({ propertyId, onSuccess }: DocumentFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      setShowForm(false);
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
    formData.append('property_id', propertyId);
    uploadMutation.mutate(formData);
  };

  return (
    <div>
      {uploadSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 font-medium">Dokument erfolgreich hochgeladen!</p>
        </div>
      )}

      <div className="flex justify-end mb-4">
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          <Plus className="w-4 h-4" />
          Dokument hochladen
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h3 className="font-medium text-slate-800 mb-4">Dokument hochladen</h3>
          {uploadMutation.isError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-medium">Fehler beim Hochladen:</p>
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Datei *</label>
                <input type="file" name="file" required className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kategorie *</label>
                <select name="category" required className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                  {Object.entries(DOCUMENT_CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dokumentdatum</label>
                <DateInput name="document_date" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Beschreibung</label>
                <input type="text" name="description" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={uploadMutation.isPending} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                {uploadMutation.isPending ? 'Hochladen...' : 'Hochladen'}
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
