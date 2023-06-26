export const sleep = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const checkIfConfigIsValid = (config: Optional<Required<RetryConfig>, "onRetry">) => {
  if (typeof config.attempts !== "number") {
    throw new TypeError(`"config.attempts" must be a number`);
  }

  if (config.attempts < 1) {
    throw new RangeError(`"config.attempts" must be greater than 0`);
  }

  if (typeof config.minTimeout !== "number") {
    throw new TypeError(`"config.minTimeout" must be a number`);
  }

  if (config.minTimeout < 1) {
    throw new RangeError(`"config.minTimeout" must be greater than 0`);
  }

  if (typeof config.maxTimeout !== "number") {
    throw new TypeError(`"config.maxTimeout" must be a number`);
  }

  if (config.maxTimeout < 1) {
    throw new RangeError(`"config.maxTimeout" must be greater than 0`);
  }

  if (config.minTimeout > config.maxTimeout) {
    throw new RangeError(`"config.minTimeout" must be less than or equal to "config.maxTimeout"`);
  }

  if (typeof config.jitter !== "boolean") {
    throw new TypeError(`"config.jitter" must be a boolean`);
  }

  if (config.onRetry !== undefined && typeof config.onRetry !== "function") {
    throw new TypeError(`"config.onRetry" must be a function`);
  }
};

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export type RetryConfig = {
  /**
   * Maximum amount of times to retry the operation.
   *
   * Initial attempt counts towards this value.
   *
   * @default 10
   */
  attempts?: number;

  /**
   * Minimum amount of milliseconds to wait before retrying the operation.
   *
   * @default 1000
   */
  minTimeout?: number;

  /**
   * Maximum amount of milliseconds to wait before retrying the operation.
   *
   * @default 5000
   */
  maxTimeout?: number;

  /**
   * Should full jitter be used?
   *
   * @see https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
   *
   * @default true
   */
  jitter?: boolean;

  /**
   * Optional callback to execute before each retry.
   *
   * @param attempt Current attempt
   * @param error Value thrown by previous attempt
   * @param timeout Number of milliseconds until next retry
   */
  onRetry?: (attempt: number, error: any, timeout: number) => Promise<void> | void;
};
