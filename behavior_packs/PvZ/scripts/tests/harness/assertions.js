export function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message} Expected ${expected}, got ${actual}.`);
  }
}

export function assertIncludes(values, expected, message) {
  if (!values.includes(expected)) {
    throw new Error(`${message} Missing ${expected}.`);
  }
}

export function assertLocationClose(actual, expected, tolerance, message) {
  assert(actual, `${message} Missing location.`);

  const dx = Math.abs(actual.x - expected.x);
  const dy = Math.abs(actual.y - expected.y);
  const dz = Math.abs(actual.z - expected.z);
  if (dx > tolerance || dy > tolerance || dz > tolerance) {
    throw new Error(
      `${message} Expected (${expected.x}, ${expected.y}, ${expected.z}), got (${actual.x}, ${actual.y}, ${actual.z}).`,
    );
  }
}

export function formatError(error) {
  if (!error) {
    return "Unknown error";
  }
  const name = error.name ?? "Error";
  const message = error.message ? `${name}: ${error.message}` : "";
  if (error.stack && message && !error.stack.includes(error.message)) {
    return `${message}\n${error.stack}`;
  }
  return error.stack ?? message ?? String(error);
}
