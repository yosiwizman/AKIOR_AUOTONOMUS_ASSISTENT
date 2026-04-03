export type LogLevel = 'info' | 'warn' | 'error';

export function logJson(level: LogLevel, payload: Record<string, unknown>) {
  const line = {
    ts: new Date().toISOString(),
    level,
    ...payload,
  };

  if (level === 'error') {
    console.error(JSON.stringify(line));
  } else if (level === 'warn') {
    console.warn(JSON.stringify(line));
  } else {
    console.log(JSON.stringify(line));
  }
}
