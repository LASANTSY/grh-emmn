export interface ApiErrorBody {
  code?: string;
  message?: string;
  statusCode?: number;
}

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(status: number, details: ApiErrorBody) {
    super(details.message ?? `Erreur ${status}`);
    this.name = 'ApiError';
    this.code = details.code ?? 'HTTP_' + status;
    this.status = status;
  }
}

export const BASE = '/api';

export interface HttpOptions {
  method?: string;
  body?: unknown;
  formData?: FormData;
  query?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
}

export async function http<T = unknown>(path: string, options: HttpOptions = {}): Promise<T> {
  const { method = 'GET', body, formData, query, headers } = options;

  let url = BASE + path;
  if (query) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
    }
    const qs = params.toString();
    if (qs) url += '?' + qs;
  }

  const init: RequestInit = {
    method,
    credentials: 'include',
    headers: { ...headers },
  };

  if (formData) {
    init.body = formData;
  } else if (body !== undefined) {
    init.body = JSON.stringify(body);
    (init.headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, init).catch(() => {
    throw new ApiError(0, { code: 'RESEAU', message: 'Impossible de joindre le serveur.' });
  });

  if (!res.ok) {
    let details: ApiErrorBody = {};
    try {
      details = (await res.json()) as ApiErrorBody;
    } catch {
      details = { message: res.statusText };
    }
    throw new ApiError(res.status, details);
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return (await res.json()) as T;
  }
  return (await res.text()) as unknown as T;
}

export async function telecharger(path: string, nomFichier: string, query?: Record<string, string | number | boolean | undefined | null>): Promise<void> {
  let url = BASE + path;
  if (query) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
    }
    const qs = params.toString();
    if (qs) url += '?' + qs;
  }
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    let details: ApiErrorBody = {};
    try { details = (await res.json()) as ApiErrorBody; } catch { /* ignore */ }
    throw new ApiError(res.status, details);
  }
  const blob = await res.blob();
  const lien = document.createElement('a');
  lien.href = URL.createObjectURL(blob);
  lien.download = nomFichier;
  document.body.appendChild(lien);
  lien.click();
  URL.revokeObjectURL(lien.href);
  lien.remove();
}