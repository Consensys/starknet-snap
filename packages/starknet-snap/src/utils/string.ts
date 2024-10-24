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

/**
 * Replaces the middle characters of a string with a given string.
 *
 * @param str - The string to replace.
 * @param headLength - The length of the head of the string that should not be replaced.
 * @param tailLength - The length of the tail of the string that should not be replaced.
 * @param replaceStr - The string to replace the middle characters with. Default is '...'.
 * @returns The formatted string.
 * @throws An error if the given headLength and tailLength cannot be replaced.
 */
export function replaceMiddleChar(
  str: string,
  headLength: number,
  tailLength: number,
  replaceStr = '...',
) {
  if (!str) {
    return str;
  }
  // Enforces indexes to be positive to avoid parameter swapping in `.substring`
  if (headLength < 0 || tailLength < 0) {
    throw new Error('Indexes must be positives');
  }
  // Check upper bound (using + is safe here, since we know that both lengths are positives)
  if (headLength + tailLength > str.length) {
    throw new Error('Indexes out of bounds');
  }
  return `${str.substring(0, headLength)}${replaceStr}${str.substring(
    str.length - tailLength,
  )}`;
}

/**
 * Format the address in shorten string.
 *
 * @param address - The address to format.
 * @returns The formatted address.
 */
export function shortenAddress(address: string) {
  return replaceMiddleChar(address, 5, 4);
}
