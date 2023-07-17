export const toJson = (obj: object | string, indent: number | undefined = undefined) =>
  JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? v.toString() : v), indent);
