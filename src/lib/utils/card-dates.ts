const dateInputPattern = /^(\d{4})-(\d{2})-(\d{2})$/;

export function getNextAnnualDate(dateInput: string, today = new Date()): string {
  const [, , month, day] = dateInputPattern.exec(dateInput) ?? [];

  if (!month || !day) {
    return dateInput;
  }

  const currentYear = today.getFullYear();
  const candidate = new Date(currentYear, Number(month) - 1, Number(day));
  const startOfToday = new Date(currentYear, today.getMonth(), today.getDate());
  const certificateDate =
    candidate < startOfToday
      ? new Date(currentYear + 1, Number(month) - 1, Number(day))
      : candidate;

  return toDateInputValue(certificateDate);
}

export function formatDateLabel(dateInput: string): string {
  const [, year, month, day] = dateInputPattern.exec(dateInput) ?? [];

  if (!year || !month || !day) {
    return dateInput;
  }

  const date = new Date(Number(year), Number(month) - 1, Number(day));

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
