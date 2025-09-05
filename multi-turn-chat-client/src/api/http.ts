import { BASE_URL, API_KEY } from '../config';

export async function httpGet<T = any>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) {
    let err: any = {};
    try { err = await res.json(); } catch {}
    throw new Error(err?.message || `${path} 请求失败: ${res.status}`);
  }
  return res.json();
}

export async function httpJson<T = any>(path: string, method: 'POST' | 'PUT' | 'DELETE', body?: any): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let err: any = {};
    try { err = await res.json(); } catch {}
    throw new Error(err?.message || `${path} 请求失败: ${res.status}`);
  }
  if (res.status === 204) return {} as any;
  return res.json();
}