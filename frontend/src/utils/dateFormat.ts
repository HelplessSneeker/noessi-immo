/**
 * Formats a date string or Date object to dd.mm.YYYY format
 * @param date - ISO date string or Date object
 * @returns Formatted date string in dd.mm.YYYY format
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Check if date is valid
  if (isNaN(dateObj.getTime())) return '';

  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();

  return `${day}.${month}.${year}`;
}
