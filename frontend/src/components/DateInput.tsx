import { useState, useEffect, useRef } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { de } from 'date-fns/locale';
import { Calendar } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';

// Register German locale for datepicker
registerLocale('de', de);

interface DateInputProps {
  name: string;
  required?: boolean;
  defaultValue?: string; // ISO format (yyyy-mm-dd)
  className?: string;
}

/**
 * Custom date input component with datepicker that displays dates in dd.mm.yyyy format
 * - Can be typed manually in dd.mm.yyyy format
 * - Has a calendar icon that opens a datepicker
 * - Submits dates in ISO format (yyyy-mm-dd) for backend compatibility
 */
export function DateInput({ name, required = false, defaultValue = '', className = '' }: DateInputProps) {
  const datePickerRef = useRef<DatePicker>(null);

  // Convert ISO format (yyyy-mm-dd) to Date object
  const parseISODate = (isoDate: string): Date | null => {
    if (!isoDate) return null;
    const date = new Date(isoDate);
    return isNaN(date.getTime()) ? null : date;
  };

  // Convert Date object to ISO format (yyyy-mm-dd)
  const formatToISO = (date: Date | null): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<Date | null>(parseISODate(defaultValue));
  const [isoValue, setIsoValue] = useState(defaultValue);

  useEffect(() => {
    setSelectedDate(parseISODate(defaultValue));
    setIsoValue(defaultValue);
  }, [defaultValue]);

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    setIsoValue(formatToISO(date));
  };

  const handleCalendarClick = () => {
    if (datePickerRef.current) {
      datePickerRef.current.setFocus();
    }
  };

  return (
    <div className="relative">
      <DatePicker
        ref={datePickerRef}
        selected={selectedDate}
        onChange={handleDateChange}
        dateFormat="dd.MM.yyyy"
        className={className}
        placeholderText="dd.mm.yyyy"
        required={required}
        showYearDropdown
        showMonthDropdown
        dropdownMode="select"
        locale="de"
      />
      <button
        type="button"
        onClick={handleCalendarClick}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        tabIndex={-1}
      >
        <Calendar className="w-4 h-4" />
      </button>
      <input
        type="hidden"
        name={name}
        value={isoValue}
      />
    </div>
  );
}
