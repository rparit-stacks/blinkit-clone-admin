const BASE     = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const READ_KEY = "notifications-read:admin";

function getToken() {
  return localStorage.getItem("adminToken") ?? "";
}

function authHeaders() {
  const t = getToken();
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
  };
}

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  time: string;
  type?: string;
  relatedEntityKind?: string;
  relatedEntityId?: string;
  imageUrl?: string;
};

// ─── Read state (client-side) ────────────────────────────────────────────────

function getReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>) {
  localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
}

// ─── Feed ────────────────────────────────────────────────────────────────────

export async function fetchNotifications(): Promise<NotificationItem[]> {
  const res  = await fetch(`${BASE}/api/admin/notifications?limit=50`, { headers: authHeaders() });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message ?? `HTTP ${res.status}`);
  const readIds = getReadIds();
  return (json.data?.items ?? []).map((n: NotificationItem) => ({
    ...n,
    read: readIds.has(n.id) || n.read,
  }));
}

export async function markNotificationRead(id: string): Promise<void> {
  const ids = getReadIds();
  ids.add(id);
  saveReadIds(ids);
}

export async function markAllNotificationsRead(): Promise<void> {
  const items = await fetchNotifications();
  saveReadIds(new Set(items.map((n) => n.id)));
}

export function getUnreadCount(items: NotificationItem[]): number {
  return items.filter((n) => !n.read).length;
}

// ─── Admin send APIs ──────────────────────────────────────────────────────────

export type BroadcastRole = "DELIVERY" | "SELLER" | "CUSTOMER" | "ADMIN";

export async function sendBroadcast(params: {
  targetRole: BroadcastRole;
  title: string;
  message: string;
  imageUrl?: string;
}): Promise<void> {
  const res = await fetch(`${BASE}/api/admin/notify/broadcast`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(params),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message ?? `HTTP ${res.status}`);
}

export async function sendDirectMessage(params: {
  partnerId: string;
  title: string;
  message: string;
  imageUrl?: string;
}): Promise<void> {
  const res = await fetch(`${BASE}/api/admin/notify/delivery/${params.partnerId}/message`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ title: params.title, message: params.message, imageUrl: params.imageUrl }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message ?? `HTTP ${res.status}`);
}

export async function issueWarning(partnerId: string, reason: string): Promise<void> {
  const res = await fetch(`${BASE}/api/admin/notify/delivery/${partnerId}/warning`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ reason }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message ?? `HTTP ${res.status}`);
}

export async function issuePenalty(params: { partnerId: string; amountPaise: number; reason?: string }): Promise<void> {
  const res = await fetch(`${BASE}/api/admin/notify/delivery/${params.partnerId}/penalty`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ amountPaise: params.amountPaise, reason: params.reason }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message ?? `HTTP ${res.status}`);
}

export async function issueIncentive(params: { partnerId: string; amountPaise: number; reason?: string }): Promise<void> {
  const res = await fetch(`${BASE}/api/admin/notify/delivery/${params.partnerId}/incentive`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ amountPaise: params.amountPaise, reason: params.reason }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message ?? `HTTP ${res.status}`);
}
