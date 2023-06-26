import { retry } from "../src";

it("should return correct value", async () => {
  const value1 = await retry(async () => {
    return {
      some: "value",
    };
  });

  expect(value1).toEqual({
    some: "value",
  });

  let attempt = 0;
  const value2 = await retry(async () => {
    attempt++;

    if (attempt === 1) {
      throw new Error();
    }

    return "value2";
  });

  expect(attempt).toBe(2);
  expect(value2).toEqual("value2");
});

it("should work with synchronous functions", async () => {
  const value = await retry(() => {
    return {
      some: "value",
    };
  });

  expect(value).toEqual({
    some: "value",
  });
});

it("should return after 1st attempt", async () => {
  let attempt = 0;

  await retry(async () => {
    attempt++;
  });

  expect(attempt).toBe(1);
});

it("should return after 2nd attempt", async () => {
  let attempt = 0;

  await retry(async () => {
    attempt++;

    if (attempt === 1) {
      throw new Error();
    }
  });

  expect(attempt).toBe(2);
});

it("shouldn't retry more than 10 times total", async () => {
  let attempt = 0;

  try {
    await retry(
      async () => {
        attempt++;

        throw new Error(`${attempt} err`);
      },
      {
        minTimeout: 5,
        maxTimeout: 5,
      },
    );
  } catch {}

  expect(attempt).toBe(10);
});

it("shouldn't use jitter", async () => {
  let totalTimeout = 0;

  try {
    await retry(
      async () => {
        throw new Error();
      },
      {
        jitter: false,
        minTimeout: 5,
        maxTimeout: 5,
        onRetry: (attempt, error, timeout) => {
          totalTimeout += timeout;
        },
      },
    );
  } catch {}

  expect(totalTimeout).toBe(45);
});

it("should cancel", async () => {
  let attempt = 0;

  try {
    await retry(
      async (cancel) => {
        attempt++;

        if (attempt === 1) {
          cancel(new Error());
        }
      },
      {
        minTimeout: 5,
        maxTimeout: 5,
      },
    );
  } catch {}

  expect(attempt).toBe(1);
});

it("should retry only 3 times", async () => {
  let attempt = 0;

  try {
    await retry(
      async () => {
        attempt++;

        throw new Error();
      },
      {
        attempts: 3,
        minTimeout: 5,
        maxTimeout: 5,
      },
    );
  } catch {}

  expect(attempt).toBe(3);
});

it("should throw an error if first argument is not a function", async () => {
  try {
    // @ts-expect-error
    await retry("invalid");
  } catch (error) {
    expect(error).toBeInstanceOf(TypeError);
    // @ts-ignore
    expect(error.message).toBe("First argument must be a function");
  }
});

it("should pass correct arguments to onRetry", async () => {
  let attempt1 = 0;
  let error1: any;
  let timeout1: number;

  try {
    await retry(
      async () => {
        attempt1++;

        throw new Error(attempt1.toString());
      },
      {
        minTimeout: 5,
        maxTimeout: 5,
        onRetry: (a, e, t) => {
          attempt1 = a;
          error1 = e;
          timeout1 = t;
        },
      },
    );
  } catch {}

  expect(attempt1).toBe(10);
  expect(error1).toBeInstanceOf(Error);
  expect(error1.message).toBe("9"); // onRetry doesn't run after final attempt
  // @ts-ignore
  expect(timeout1).toBeGreaterThanOrEqual(0);
  // @ts-ignore
  expect(timeout1).toBeLessThanOrEqual(5);

  let attempt2 = 0;
  let error2: any;
  let timeout2: number;

  try {
    await retry(
      async () => {
        attempt2++;

        throw new Error(attempt2.toString());
      },
      {
        minTimeout: 5,
        maxTimeout: 5,
        jitter: false,
        onRetry: (a, e, t) => {
          attempt2 = a;
          error2 = e;
          timeout2 = t;
        },
      },
    );
  } catch {}

  expect(attempt2).toBe(10);
  expect(error2).toBeInstanceOf(Error);
  expect(error2.message).toBe("9"); // onRetry doesn't run after final attempt
  // @ts-ignore
  expect(timeout2).toBe(5);
});

describe("config", () => {
  it("should throw an error if config is invalid", async () => {
    try {
      // @ts-expect-error
      await retry(async () => {}, "invalid");
    } catch (error) {
      expect(error).toBeInstanceOf(TypeError);
      // @ts-ignore
      expect(error.message).toBe("Second argument must be an object");
    }
  });

  it("should throw an error if config.attempts is invalid", async () => {
    try {
      await retry(async () => {}, {
        // @ts-expect-error
        attempts: "invalid",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(TypeError);
      // @ts-ignore
      expect(error.message).toBe(`"config.attempts" must be a number`);
    }

    try {
      await retry(async () => {}, {
        attempts: 0,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(RangeError);
      // @ts-ignore
      expect(error.message).toBe(`"config.attempts" must be greater than 0`);
    }
  });

  it("should throw an error if config.minTimeout is invalid", async () => {
    try {
      await retry(async () => {}, {
        // @ts-expect-error
        minTimeout: "invalid",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(TypeError);
      // @ts-ignore
      expect(error.message).toBe(`"config.minTimeout" must be a number`);
    }

    try {
      await retry(async () => {}, {
        minTimeout: 0,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(RangeError);
      // @ts-ignore
      expect(error.message).toBe(`"config.minTimeout" must be greater than 0`);
    }

    try {
      await retry(async () => {}, {
        minTimeout: 2,
        maxTimeout: 1,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(RangeError);
      // @ts-ignore
      expect(error.message).toBe(`"config.minTimeout" must be less than or equal to "config.maxTimeout"`);
    }
  });

  it("should throw an error if config.maxTimeout is invalid", async () => {
    try {
      await retry(async () => {}, {
        // @ts-expect-error
        maxTimeout: "invalid",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(TypeError);
      // @ts-ignore
      expect(error.message).toBe(`"config.maxTimeout" must be a number`);
    }

    try {
      await retry(async () => {}, {
        maxTimeout: 0,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(RangeError);
      // @ts-ignore
      expect(error.message).toBe(`"config.maxTimeout" must be greater than 0`);
    }
  });

  it("should throw an error if config.jitter is invalid", async () => {
    try {
      await retry(async () => {}, {
        // @ts-expect-error
        jitter: "invalid",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(TypeError);
      // @ts-ignore
      expect(error.message).toBe(`"config.jitter" must be a boolean`);
    }
  });

  it("should throw an error if config.onRetry is invalid", async () => {
    try {
      await retry(async () => {}, {
        // @ts-expect-error
        onRetry: "invalid",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(TypeError);
      // @ts-ignore
      expect(error.message).toBe(`"config.onRetry" must be a function`);
    }
  });
});
