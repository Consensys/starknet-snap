/**
 * Check if a string is an ASCII string.
 *
 * @param str - The string to check.
 */
export function isAsciiString(str: string) {
  return /^[ -~]+$/u.test(str);
}

/**
 * Check if a string is a valid ASCII string field.
 *
 * @param value - The string to check.
 * @param maxLength - The maximum length of the string.
 */
export function isValidAsciiStrField(value: string, maxLength: number) {
  return (
    isAsciiString(value) && value.trim().length > 0 && value.length <= maxLength
  );
}
