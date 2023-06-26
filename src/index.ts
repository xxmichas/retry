import { checkIfConfigIsValid, RetryConfig, sleep } from "./utils";

export { RetryConfig } from "./utils";

/**
 * Retries a function until it resolves or the maximum amount of attempts is reached.
 */
export const retry = async <T>(
  fn: (cancel: (value: any) => void) => Promise<T> | T,
  config?: RetryConfig,
): Promise<T> => {
  if (typeof fn !== "function") {
    throw new TypeError(`First argument must be a function`);
  }

  if (config !== undefined && typeof config !== "object") {
    throw new TypeError(`Second argument must be an object`);
  }

  const options = {
    attempts: config?.attempts ?? 10,
    jitter: config?.jitter ?? true,
    minTimeout: config?.minTimeout ?? 1000,
    maxTimeout: config?.maxTimeout ?? 5000,
    onRetry: config?.onRetry,
  } satisfies RetryConfig;

  checkIfConfigIsValid(options);

  const getTimeout = (attempt: number) => {
    const backoff = Math.min(options.maxTimeout, options.minTimeout * Math.pow(2, attempt - 1));

    if (options.jitter) {
      return Math.random() * backoff;
    }

    return backoff;
  };

  let attempt = 0;
  let isCancelled = false;
  let lastError: any;

  const cancel = (value: any) => {
    isCancelled = true;

    throw value;
  };

  while (attempt < options.attempts) {
    try {
      return await fn(cancel);
    } catch (error) {
      if (isCancelled) {
        throw error;
      }

      attempt++;
      lastError = error;

      if (attempt >= options.attempts) {
        // Last attempt failed
        break;
      }

      const timeout = getTimeout(attempt);

      if (options.onRetry) {
        options.onRetry(attempt, error, timeout);
      }

      await sleep(timeout);
    }
  }

  throw lastError;
};
