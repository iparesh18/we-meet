import crypto from 'crypto';

// No ambiguous characters (0/O, 1/I/L) so codes are easy to read & type.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateClassCode(length = 6) {
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
}

export function generateHostKey() {
  return crypto.randomBytes(24).toString('base64url');
}

export function generateId() {
  return crypto.randomUUID();
}
