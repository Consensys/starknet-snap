export const toJson = (
  obj: object | string,
  indent: number | undefined = undefined,
) =>
  JSON.stringify(
    obj,
    (_, val) => (typeof val === 'bigint' ? val.toString() : val),
    indent,
  );
