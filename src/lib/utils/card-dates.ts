import type { CreditCadence } from '$lib/types/cards';

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

export interface CreditPeriod {
  start: string;
  end: string;
  label: string;
}

export function getCreditPeriod(cadence: CreditCadence, today = new Date()): CreditPeriod {
  const year = today.getFullYear();
  const monthIndex = today.getMonth();

  if (cadence === 'monthly') {
    return makePeriod(new Date(year, monthIndex, 1), new Date(year, monthIndex + 1, 0), 'monthly');
  }

  if (cadence === 'quarterly') {
    const quarterStartMonth = Math.floor(monthIndex / 3) * 3;
    const quarter = quarterStartMonth / 3 + 1;

    return makePeriod(
      new Date(year, quarterStartMonth, 1),
      new Date(year, quarterStartMonth + 3, 0),
      `Q${quarter} ${year}`
    );
  }

  if (cadence === 'semi_annual') {
    const firstHalf = monthIndex < 6;
    const halfStartMonth = firstHalf ? 0 : 6;
    const halfLabel = firstHalf ? 'H1' : 'H2';

    return makePeriod(
      new Date(year, halfStartMonth, 1),
      new Date(year, halfStartMonth + 6, 0),
      `${halfLabel} ${year}`
    );
  }

  if (cadence === 'four_year') {
    const periodStartYear = year - (year % 4);

    return makePeriod(
      new Date(periodStartYear, 0, 1),
      new Date(periodStartYear + 4, 0, 0),
      `${periodStartYear}-${periodStartYear + 3}`
    );
  }

  return makePeriod(new Date(year, 0, 1), new Date(year, 11, 31), `${year}`);
}

export function getCreditCadenceLabel(cadence: CreditCadence): string {
  if (cadence === 'monthly') {
    return 'Monthly';
  }

  if (cadence === 'quarterly') {
    return 'Quarterly';
  }

  if (cadence === 'semi_annual') {
    return 'Semiannual';
  }

  if (cadence === 'four_year') {
    return 'Every 4 years';
  }

  return 'Annual';
}

export function getAnnualizedCreditValue(cadence: CreditCadence, value: number): number {
  if (cadence === 'monthly') {
    return value * 12;
  }

  if (cadence === 'quarterly') {
    return value * 4;
  }

  if (cadence === 'semi_annual') {
    return value * 2;
  }

  if (cadence === 'four_year') {
    return value / 4;
  }

  return value;
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function makePeriod(start: Date, end: Date, label: string): CreditPeriod {
  const periodLabel = label === 'monthly' ? formatMonthYearLabel(start) : label;

  return {
    start: toDateInputValue(start),
    end: toDateInputValue(end),
    label: periodLabel
  };
}

function formatMonthYearLabel(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric'
  }).format(date);
}
