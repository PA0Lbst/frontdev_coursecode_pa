export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function isValidUsername(value: string) {
  return /^[a-z0-9_]{3,20}$/.test(normalizeUsername(value));
}
