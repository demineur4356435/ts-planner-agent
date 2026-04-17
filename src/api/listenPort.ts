/**
 * Resolves the HTTP listen port from `process.env.PORT` (or a custom env object for tests).
 * Empty, invalid, or out-of-range values default to **3000**.
 */
export function parseListenPort(
  env: { PORT?: string } = process.env,
): number {
  const raw = env.PORT;
  if (raw == null || String(raw).trim() === "") {
    return 3000;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0 || n > 65535) {
    return 3000;
  }
  return Math.floor(n);
}
