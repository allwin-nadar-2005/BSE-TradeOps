const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:4000';

export async function startPull(): Promise<{ id: string; status: string }> {
  const res = await fetch(`${API_BASE_URL}/api/pull/start`, { method: 'POST' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to start pull (${res.status})`);
  }
  return res.json();
}
