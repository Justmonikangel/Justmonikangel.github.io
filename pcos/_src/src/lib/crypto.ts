const OBFUSCATION_KEY = 'cyster-local-key';

function toBase64(value: string) {
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    return window.btoa(value);
  }

  return Buffer.from(value, 'utf8').toString('base64');
}

function fromBase64(value: string) {
  if (typeof window !== 'undefined' && typeof window.atob === 'function') {
    return window.atob(value);
  }

  return Buffer.from(value, 'base64').toString('utf8');
}

function xor(value: string) {
  return value
    .split('')
    .map((char, index) =>
      String.fromCharCode(char.charCodeAt(0) ^ OBFUSCATION_KEY.charCodeAt(index % OBFUSCATION_KEY.length)),
    )
    .join('');
}

export function obfuscateSecret(value: string) {
  return toBase64(xor(value));
}

export function revealSecret(value: string) {
  return xor(fromBase64(value));
}
