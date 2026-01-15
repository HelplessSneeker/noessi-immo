import { AlertCircle } from 'lucide-react';
import { getValidationErrors } from '../utils/errorUtils';

interface FormErrorAlertProps {
  error: unknown;
  title: string;
}

export function FormErrorAlert({ error, title }: FormErrorAlertProps) {
  if (!error) return null;

  const messages = getValidationErrors(error);
  if (messages.length === 0) return null;

  return (
    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-red-800 font-medium">{title}</p>
          <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
            {messages.map((msg, idx) => (
              <li key={idx}>{msg}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
