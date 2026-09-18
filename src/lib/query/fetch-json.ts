export async function fetchJson<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, init);
  const text = await res.text();

  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!res.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      typeof (payload as { error?: unknown }).error === "string"
        ? (payload as { error: string }).error
        : `Request failed (${res.status})`;
    throw new Error(message);
  }

  return payload as T;
}
