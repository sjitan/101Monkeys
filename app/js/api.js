export function withIdempotency(headers = {}) {
  const key = crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random();
  return { ...headers, 'x-idempotency-key': key };
}
