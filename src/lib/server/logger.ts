type LogFields = Record<string, boolean | number | string | undefined>;

export function logInfo(event: string, fields: LogFields = {}): void {
  console.warn(formatLog('info', event, fields));
}

export function logWarn(event: string, fields: LogFields = {}): void {
  console.warn(formatLog('warn', event, fields));
}

export function logError(event: string, error: unknown, fields: LogFields = {}): void {
  console.error(formatLog('error', event, { ...fields, error: getErrorMessage(error) }));
}

export function getEmailDomain(email: string): string {
  return email.split('@')[1] ?? 'unknown';
}

function formatLog(level: string, event: string, fields: LogFields): string {
  return JSON.stringify({
    level,
    event,
    at: new Date().toISOString(),
    ...fields
  });
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown error';
}
