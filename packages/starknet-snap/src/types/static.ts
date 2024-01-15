export type StaticImplements<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  I extends new (...args: any[]) => any,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  C extends I,
> = InstanceType<I>;
