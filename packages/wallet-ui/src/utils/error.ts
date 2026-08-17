/**
 * MetaMask rejects `provider.request` with a *plain* JSON-RPC error object
 * (`{ code, message, data }`), not an `Error` instance. When such a value
 * escapes as an unhandled rejection, CRA's react-refresh overlay wraps it with
 * `new Error(reason)`, which stringifies to the useless `"[object Object]"`.
 *
 * `SnapRpcError` re-wraps those payloads in a real `Error` while preserving the
 * `code` / `data` properties that callers rely on (e.g. `err.code === 4100`,
 * `isUserDenyError` reading `err.data.walletRpcError.code`).
 */

type JsonRpcErrorLike = {
  code?: number;
  message?: string;
  data?: any;
};

export class SnapRpcError extends Error {
  readonly code?: number;

  readonly data?: any;

  /** The original value that was thrown, for logging / debugging. */
  readonly cause?: unknown;

  constructor(message: string, original: JsonRpcErrorLike) {
    super(message);
    this.name = 'SnapRpcError';
    this.code = original.code;
    this.data = original.data;
    this.cause = original;
  }
}

/**
 * Builds a human readable message from a JSON-RPC error payload, digging into
 * the nested shapes the Snap produces (`data.cause`, `data.walletRpcError`).
 *
 * @param error - The raw JSON-RPC error object.
 * @returns A readable, single-line message.
 */
function buildMessage(error: JsonRpcErrorLike): string {
  const parts: string[] = [];

  if (error.message) {
    parts.push(error.message);
  }

  const cause = error.data?.cause;
  if (cause?.message && cause.message !== error.message) {
    parts.push(cause.message);
  }

  const walletRpcErrorCode = error.data?.walletRpcError?.code;
  if (walletRpcErrorCode !== undefined) {
    parts.push(`walletRpcError=${walletRpcErrorCode}`);
  }

  if (error.code !== undefined) {
    parts.push(`code=${error.code}`);
  }

  if (parts.length === 0) {
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  return parts.join(' | ');
}

/**
 * Normalises anything thrown by `provider.request` into an `Error` instance so
 * that messages, `console.error` output and the dev overlay stay readable.
 *
 * @param error - The thrown value, of unknown shape.
 * @param context - Optional prefix describing what failed, e.g. the RPC method.
 * @returns An `Error` instance. Existing `Error`s are returned untouched so
 * stacks are preserved.
 */
export function normalizeSnapError(error: unknown, context?: string): Error {
  if (error instanceof Error) {
    return error;
  }

  if (error !== null && typeof error === 'object') {
    const rpcError = error as JsonRpcErrorLike;
    const message = buildMessage(rpcError);
    return new SnapRpcError(
      context ? `${context}: ${message}` : message,
      rpcError,
    );
  }

  return new Error(context ? `${context}: ${String(error)}` : String(error));
}
