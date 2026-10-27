/** Obtains and caches a signed admin session per workplace (kept in memory only). */
const tokens = new Map<string, string>();

export async function adminAuthHeaders(workplaceId: string): Promise<Record<string, string>> {
  let token = tokens.get(workplaceId);
  if (!token) {
    const res = await fetch('/api/session/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workplaceId }),
    });
    if (!res.ok) throw new Error('SESSION_REQUEST_FAILED');
    token = ((await res.json()) as { token: string }).token;
    tokens.set(workplaceId, token);
  }
  return { Authorization: `Bearer ${token}` };
}
