export const hexToString = (hexStr) => {
  let str = '';
  for (let i = 0; i < hexStr.length; i += 2) {
    const hexValue = hexStr.substr(i, 2);
    const decimalValue = parseInt(hexValue, 16);
    str += String.fromCharCode(decimalValue);
  }
  return str;
};

/**
 * Maps deprecated parameters to their new equivalents in the requestParams object
 * and removes the deprecated parameters afterward.
 *
 * @param requestParams - The object containing the API request parameters.
 * @param mappings - A record of key-value pairs where the key is the old parameter
 * and the value is the new parameter.
 * @example
 * const paramMappings = {
 *   signerAddress: 'address',
 *   senderAddress: 'address',
 *   txnInvocation: 'calls',
 *   invocationsDetails: 'details',
 *   transaction: 'details'
 * };
 * mapDeprecatedParams(apiParams.requestParams, paramMappings);
 */
export const mapDeprecatedParams = <Params>(
  requestParams: Params,
  mappings: Record<string, string>,
) => {
  Object.keys(mappings).forEach((oldParam) => {
    const newParam = mappings[oldParam] as unknown as keyof Params;
    if (Object.prototype.hasOwnProperty.call(requestParams, oldParam)) {
      requestParams[newParam] = requestParams[oldParam];
      delete requestParams[oldParam]; // Remove old param after mapping
    }
  });
};
