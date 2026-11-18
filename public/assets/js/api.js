// Wrapper fetch ke backend PHP. Path relatif ("api/...") supaya tetap jalan
// walau app ditaruh di subfolder (mis. http://localhost/doto/public/).

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(method, path, body, extraHeaders = {}) {
  const res = await fetch(`api${path}`, {
    method,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-Client-Channel': 'web', ...extraHeaders },
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

export function apiWithHeaders(extraHeaders) {
  return {
    get: (path) => request('GET', path, undefined, extraHeaders),
    post: (path, body) => request('POST', path, body ?? {}, extraHeaders),
    patch: (path, body) => request('PATCH', path, body, extraHeaders),
    del: (path) => request('DELETE', path, undefined, extraHeaders),
  };
}

export const api = {
  get: (path, extraHeaders) => request('GET', path, undefined, extraHeaders),
  post: (path, body, extraHeaders) => request('POST', path, body ?? {}, extraHeaders),
  patch: (path, body, extraHeaders) => request('PATCH', path, body, extraHeaders),
  del: (path, extraHeaders) => request('DELETE', path, undefined, extraHeaders),
};
