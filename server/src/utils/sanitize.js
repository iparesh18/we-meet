// Character-code based cleaning so the source never has to embed raw control chars.
function stripUnsafe(str, { keepNewlines = false } = {}) {
  const withoutTags = str.replace(/<[^>]*>/g, ''); // remove HTML-ish tags
  let out = '';
  for (const ch of withoutTags) {
    const code = ch.codePointAt(0);
    if (code === 0x3c || code === 0x3e) continue; // drop stray < >
    if (code === 0x0a) {
      if (keepNewlines) out += '\n';
      continue;
    }
    if (code < 0x20 || code === 0x7f) continue; // drop control chars
    out += ch;
  }
  return out;
}

/** Names: strip tags & control characters, collapse whitespace, clamp length. */
export function sanitizeName(input) {
  if (typeof input !== 'string') return '';
  let name = stripUnsafe(input).replace(/\s+/g, ' ').trim();
  if (name.length > 60) name = name.slice(0, 60);
  return name;
}

/** Class codes are uppercase alphanumeric only. */
export function sanitizeCode(input) {
  if (typeof input !== 'string') return '';
  return input.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 12);
}

/** General free text (announcements, titles): strip tags & control chars, keep newlines. */
export function sanitizeText(input, max = 500) {
  if (typeof input !== 'string') return '';
  let text = stripUnsafe(input, { keepNewlines: true }).trim();
  if (text.length > max) text = text.slice(0, max);
  return text;
}
