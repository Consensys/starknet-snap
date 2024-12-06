import type { Json } from '@metamask/snaps-sdk';
import type { Struct } from 'superstruct';
import { mask } from 'superstruct';

import { logger } from '../utils/logger';

export enum HttpMethod {
  Get = 'GET',
  Post = 'POST',
}

export type HttpHeaders = Record<string, string>;

export type HttpRequest = {
  url: string;
  method: HttpMethod;
  headers: HttpHeaders;
  body?: string;
};

export type HttpResponse = globalThis.Response;

export abstract class ApiClient {
  /**
   * The name of the API Client.
   */
  abstract apiClientName: string;

  /**
   * An internal method called internally by `submitRequest()` to verify and convert the HTTP response to the expected API response.
   *
   * @param response - The HTTP response to verify and convert.
   * @returns A promise that resolves to the API response.
   */
  protected async parseResponse<ApiResponse>(
    response: HttpResponse,
  ): Promise<ApiResponse> {
    try {
      return (await response.json()) as unknown as ApiResponse;
    } catch (error) {
      throw new Error(
        'API response error: response body can not be deserialised.',
      );
    }
  }

  /**
   * An internal method used to build the `HttpRequest` object.
   *
   * @param params - The request parameters.
   * @param params.method - The HTTP method (GET or POST).
   * @param params.headers - The HTTP headers.
   * @param params.url - The request URL.
   * @param [params.body] - The request body (optional).
   * @returns A `HttpRequest` object.
   */
  protected buildHttpRequest({
    method,
    headers = {},
    url,
    body,
  }: {
    method: HttpMethod;
    headers?: HttpHeaders;
    url: string;
    body?: Json;
  }): HttpRequest {
    const request = {
      url,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body:
        method === HttpMethod.Post && body ? JSON.stringify(body) : undefined,
    };

    return request;
  }

  /**
   * An internal method used to send a HTTP request.
   *
   * @param params - The request parameters.
   * @param [params.requestName] - The name of the request (optional).
   * @param params.request - The `HttpRequest` object.
   * @param params.responseStruct - The superstruct used to verify the API response.
   * @returns A promise that resolves to a JSON object.
   */
  protected async sendHttpRequest<ApiResponse>({
    requestName = '',
    request,
    responseStruct,
  }: {
    requestName?: string;
    request: HttpRequest;
    responseStruct: Struct;
  }): Promise<ApiResponse> {
    const logPrefix = `[${this.apiClientName}.${requestName}]`;

    try {
      logger.debug(`${logPrefix} request: ${request.method}`); // Log HTTP method being used.

      const fetchRequest = {
        method: request.method,
        headers: request.headers,
        body: request.body,
      };

      const httpResponse = await fetch(request.url, fetchRequest);

      const jsonResponse = await this.parseResponse<ApiResponse>(httpResponse);

      logger.debug(`${logPrefix} response:`, JSON.stringify(jsonResponse));

      // Safeguard to identify if the response has some unexpected changes from the API client
      mask(jsonResponse, responseStruct, `Unexpected response from API client`);

      return jsonResponse;
    } catch (error) {
      logger.info(
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `${logPrefix} error: ${error.message}`,
      );

      throw error;
    }
  }
}
