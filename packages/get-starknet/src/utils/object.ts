/**
 * Verify if the given property is exist in the object or not.
 *
 * @param obj - The object to look up.
 * @param property - The object property as the searching key, it allow nested search (e.g) "propertyLv1.propertyLv2".
 * @returns boolean result to indicate the property exist in the object or not
 */
export function isset(obj: object, property: string): boolean {
  let search = obj;
  const properties = property.split('.');

  for (const prop of properties) {
    if (Object.prototype.hasOwnProperty.call(search, prop)) {
      search = search[prop];
    } else {
      return false;
    }
  }
  return true;
}
