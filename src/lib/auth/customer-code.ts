// Shared by the admin form (client, "Générer" button) and the login action
// (server) — so Web Crypto only, no Node `crypto` import.

// No 0/O, 1/I/L — codes are read out over the phone and typed by hand.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 10;

export function normalizeCustomerCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

/** e.g. "K7MPQ-3XWZA" — 31^10 ≈ 8·10^14 combinations, not guessable behind
 *  the login rate limit. */
export function generateCustomerCode(): string {
  // Rejection sampling keeps every letter equally likely (256 % 31 ≠ 0).
  const limit = 256 - (256 % ALPHABET.length);
  let code = "";
  while (code.length < CODE_LENGTH) {
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(CODE_LENGTH * 2));
    for (const b of bytes) {
      if (b < limit && code.length < CODE_LENGTH) code += ALPHABET[b % ALPHABET.length];
    }
  }
  return `${code.slice(0, 5)}-${code.slice(5)}`;
}

/** Constant-time comparison (case/space-insensitive). */
export function customerCodeMatches(input: string, stored: string | null): boolean {
  if (!stored) return false;
  const a = normalizeCustomerCode(input);
  const b = normalizeCustomerCode(stored);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
