const API_BASE = '/api';

function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('admin_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function apiGet(path, params = {}) {
  const url = new URL(API_BASE + path, window.location.origin);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  });
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function apiPost(path, body) {
  const res = await fetch(API_BASE + path, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function apiPatch(path, body) {
  const res = await fetch(API_BASE + path, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
