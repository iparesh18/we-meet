import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const LOG_DIR = path.resolve(__dirname, '../../logs');

fs.mkdirSync(LOG_DIR, { recursive: true });

// HTTP access log (written by morgan) and general application log.
export const accessLogStream = fs.createWriteStream(path.join(LOG_DIR, 'access.log'), { flags: 'a' });
const appLogStream = fs.createWriteStream(path.join(LOG_DIR, 'app.log'), { flags: 'a' });

function ts() {
  return new Date().toISOString();
}

function stringify(value) {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.stack || value.message;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function write(level, args) {
  const line = `[${ts()}] [${level}] ${args.map(stringify).join(' ')}`;
  appLogStream.write(line + '\n');
  const out = level === 'ERROR' ? console.error : level === 'WARN' ? console.warn : console.log;
  out(line);
}

export const logger = {
  info: (...args) => write('INFO', args),
  warn: (...args) => write('WARN', args),
  error: (...args) => write('ERROR', args),
};
