import { supabase } from './supabase.js';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public detail?: unknown,
  ) {
    super(message);
  }
}

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function safeFetch(path: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(path, init);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'network_error';
    throw new ApiError(0, 'api_unreachable', { detail: msg, hint: 'Is the API running on :8787?' });
  }
}

export async function api<T>(
  path: string,
  init: { method?: string; body?: unknown; headers?: Record<string, string> } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(await authHeader()),
    ...(init.headers ?? {}),
  };
  const res = await safeFetch(path, {
    method: init.method ?? 'GET',
    headers,
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new ApiError(res.status, json?.error ?? `http_${res.status}`, json);
  }
  return json as T;
}

export async function apiUpload<T>(path: string, file: File): Promise<T> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await safeFetch(path, {
    method: 'POST',
    headers: await authHeader(),
    body: fd,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new ApiError(res.status, json?.error ?? `http_${res.status}`, json);
  }
  return json as T;
}
