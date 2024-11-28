import type { Json } from '@metamask/snaps-sdk';
import type { Struct } from 'superstruct';

import { logger, validateRequest, validateResponse } from '../../utils';

/**
 * A base class for rpc controllers.
 *
 * @template Request - The expected structure of the request parameters.
 * @template Response - The expected structure of the response.
 * @class RpcController
 */
export abstract class RpcController<
  Request extends Json,
  Response extends Json,
> {
  /**
   * Superstruct for the request.
   */
  protected abstract requestStruct: Struct;

  /**
   * Superstruct for the response.
   */
  protected abstract responseStruct: Struct;

  protected abstract handleRequest(params: Request): Promise<Response>;

  protected async preExecute(params: Request): Promise<void> {
    logger.info(`Request: ${JSON.stringify(params)}`);
    validateRequest(params, this.requestStruct);
  }

  protected async postExecute(response: Response): Promise<void> {
    logger.info(`Response: ${JSON.stringify(response)}`);
    validateResponse(response, this.responseStruct);
  }

  /**
   * A method to execute the rpc method.
   *
   * @param params - An struct contains the require parameter for the request.
   * @returns A promise that resolves to an json.
   */
  async execute(params: Request): Promise<Response> {
    await this.preExecute(params);
    const resp = await this.handleRequest(params);
    await this.postExecute(resp);
    return resp;
  }
}
