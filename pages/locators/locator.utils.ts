/** Escape a literal string for safe interpolation into a RegExp. */
export const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
