import { type RpcMessage } from 'get-starknet-core';

export type StaticImplements<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  I extends new (...args: any[]) => any,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  C extends I,
> = InstanceType<I>;

export interface RPCHandler {
  execute<T extends RpcMessage>(param?: T['params']): Promise<T['result']>;
  handleRequest<T extends RpcMessage>(param?: T['params']): Promise<T['result']>;
}
