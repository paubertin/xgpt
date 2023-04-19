export enum LogLevel {
  NOTSET = 0,
  DEBUG = 10,
  INFO = 20,
  WARNING = 30,
  ERROR = 40,
  CRITICAL = 50
}

export function getLevelName (level: number) {
  if (level === LogLevel.DEBUG) {
    return 'DEBUG';
  }
  else if (level === LogLevel.INFO) {
    return 'INFO';
  }
  else if (level === LogLevel.WARNING) {
    return 'WARNING';
  }
  else if (level === LogLevel.ERROR) {
    return 'ERROR';
  }
  else if (level === LogLevel.CRITICAL) {
    return 'CRITICAL';
  }
  else if (level === LogLevel.NOTSET) {
    return 'NOTSET';
  }
  return null;
}

export function getLevelByName (levelName: string) {
  if (levelName === 'DEBUG') {
    return LogLevel.DEBUG;
  }
  else if (levelName === 'INFO') {
    return LogLevel.INFO;
  }
  else if (levelName === 'WARNING') {
    return LogLevel.WARNING;
  }
  else if (levelName === 'ERROR') {
    return LogLevel.ERROR;
  }
  else if (levelName === 'CRITICAL') {
    return LogLevel.CRITICAL;
  }
  else if (levelName === 'NOTSET') {
    return LogLevel.NOTSET;
  }
  return null;
}