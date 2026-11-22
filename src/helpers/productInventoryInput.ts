/**
 * Parse a stock value typed with either decimal separator.
 * Returns null for empty or malformed input so incomplete values stay editable
 * until the user saves the field.
 */
export const parseProductInventoryInput = (input: string): number | null => {
  const normalized = input.trim().replace(",", ".");
  if (!/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return null;

  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
};
