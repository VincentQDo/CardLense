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

export function getDaysUntilDate(dateInput: string, today = new Date()): number | undefined {
  const [, year, month, day] = dateInputPattern.exec(dateInput) ?? [];

  if (!year || !month || !day) {
    return undefined;
  }

  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.ceil((date.getTime() - startOfToday.getTime()) / millisecondsPerDay);
}

export function formatDaysUntilDate(dateInput: string): string {
  const daysUntilDate = getDaysUntilDate(dateInput);

  if (daysUntilDate === undefined) {
    return 'Date unavailable';
  }

  if (daysUntilDate < 0) {
    const daysAgo = Math.abs(daysUntilDate);

    return daysAgo === 1 ? 'Expired yesterday' : `Expired ${daysAgo} days ago`;
  }

  if (daysUntilDate === 0) {
    return 'Expires today';
  }

  return daysUntilDate === 1 ? 'Expires tomorrow' : `Expires in ${daysUntilDate} days`;
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
