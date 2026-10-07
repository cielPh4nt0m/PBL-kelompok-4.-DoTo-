// Wrapper fetch ke backend PHP. Path relatif ("api/...") supaya tetap jalan
// walau app ditaruh di subfolder (mis. http://localhost/doto/public/).

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(method, path, body) {
  const res = await fetch(`api${path}`, {
    method,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-Client-Channel': 'web' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 204) return undefined;

  let data = null;
  try { data = await res.json(); } catch { /* body bukan JSON */ }

  if (!res.ok) {
    throw new ApiError(res.status, data?.error ?? `Request failed (${res.status})`, data?.details);
  }
  return data;
}

// Ubah error API jadi kalimat yang enak dibaca, termasuk detail validasi per field.
export function errorText(err) {
  if (err instanceof ApiError && err.details && typeof err.details === 'object') {
    return Object.entries(err.details).map(([field, msg]) => `${field} ${msg}`).join('; ');
  }
  return err?.message ?? 'Something went wrong.';
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body ?? {}),
  patch: (path, body) => request('PATCH', path, body),
  del: (path) => request('DELETE', path),
};
