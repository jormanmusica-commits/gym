
export const parseMetric = (value: string | undefined): number | null => {
    if (value === undefined || value === null || value.trim() === '') return null;
    const num = parseFloat(value.replace(',', '.'));
    return isNaN(num) ? null : num;
};

export const parseTimeToSeconds = (timeStr: string | undefined): number | null => {
    if (!timeStr) return null;
    const parts = timeStr.split(':').map(Number);
    if (parts.some(isNaN)) return null;
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return null;
};

export function parseCustomDate(dateString: string): Date | null {
  if (typeof dateString !== 'string' || !dateString.trim()) return null;
  // Handle both YYYY-MM-DD and potentially other formats if they exist
  if (dateString.includes('-')) {
    const date = new Date(dateString + 'T00:00:00');
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  return null;
}

export const formatDisplayDate = (dateString: string): string => {
  const date = parseCustomDate(dateString);
  if (date) {
    const formatted = date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
    return (formatted.charAt(0).toUpperCase() + formatted.slice(1)).replace(/[,.]/g, '');
  }
  return dateString;
};

export const formatFullDisplayDate = (dateString: string): string => {
  const date = parseCustomDate(dateString);
  if (date) {
    const weekday = date.toLocaleDateString('es-ES', { weekday: 'long' });
    const day = date.getDate();
    const month = date.toLocaleDateString('es-ES', { month: 'long' });
    const year = date.getFullYear();

    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    return `${capitalize(weekday)}, ${day} de ${capitalize(month)} de ${year}`;
  }
  return dateString;
};
