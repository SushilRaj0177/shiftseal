/** Small typed fetch wrapper. Every request carries the signed-in user's Firebase ID token. */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string
  ) {
    super(message);
  }
}

type TokenGetter = () => Promise<string | null>;
let getToken: TokenGetter = async () => null;

export function setTokenGetter(fn: TokenGetter): void {
  getToken = fn;
}

export async function api<T>(
  path: string,
  init: { method?: string; body?: unknown } = {}
): Promise<T> {
  const token = await getToken();
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: init.method ?? (init.body === undefined ? 'GET' : 'POST'),
      headers: {
        ...(init.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new ApiError(0, 'OFFLINE', 'No internet connection.');
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
  if (!res.ok) {
    throw new ApiError(res.status, data.error ?? 'ERROR', data.message ?? 'Something went wrong.');
  }
  return data as T;
}

/** Fetches a protected image and returns an object URL for an <img>. */
export async function apiImage(path: string): Promise<string> {
  const token = await getToken();
  const res = await fetch(`/api${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new ApiError(res.status, 'IMAGE', 'Could not load the photo.');
  return URL.createObjectURL(await res.blob());
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong.';
}
