import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FiBell, FiChevronLeft, FiCheck, FiSend, FiX, FiAlertTriangle, FiGift } from "react-icons/fi";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  sendBroadcast,
  type BroadcastRole,
} from "../../lib/notificationsApi";
import { toast } from "sonner";

// ─── Notification type → colour/label ────────────────────────────────────────
const TYPE_STYLE: Record<string, { bg: string; text: string }> = {
  DELIVERY_ASSIGNED:    { bg: "bg-orange-50",  text: "text-orange-700" },
  DELIVERY_APPROVED:    { bg: "bg-green-50",   text: "text-green-700" },
  DELIVERY_BLOCKED:     { bg: "bg-red-50",     text: "text-red-700" },
  DELIVERY_UNBLOCKED:   { bg: "bg-green-50",   text: "text-green-700" },
  DELIVERY_REGISTERED:  { bg: "bg-blue-50",    text: "text-blue-700" },
  KYC_VERIFIED:         { bg: "bg-green-50",   text: "text-green-700" },
  KYC_REJECTED:         { bg: "bg-red-50",     text: "text-red-700" },
  EARNING_CREDITED:     { bg: "bg-emerald-50", text: "text-emerald-700" },
  WALLET_CREDIT:        { bg: "bg-emerald-50", text: "text-emerald-700" },
  WALLET_DEBIT:         { bg: "bg-red-50",     text: "text-red-700" },
  WITHDRAWAL_APPROVED:  { bg: "bg-green-50",   text: "text-green-700" },
  WITHDRAWAL_REJECTED:  { bg: "bg-red-50",     text: "text-red-700" },
  PENALTY_ISSUED:       { bg: "bg-red-50",     text: "text-red-700" },
  WARNING_ISSUED:       { bg: "bg-amber-50",   text: "text-amber-700" },
  INCENTIVE_REWARDED:   { bg: "bg-purple-50",  text: "text-purple-700" },
  ADMIN_ANNOUNCEMENT:   { bg: "bg-blue-50",    text: "text-blue-700" },
  ADMIN_MESSAGE:        { bg: "bg-blue-50",    text: "text-blue-700" },
  SELLER_REGISTERED:    { bg: "bg-blue-50",    text: "text-blue-700" },
  SELLER_APPROVED:      { bg: "bg-green-50",   text: "text-green-700" },
  WELCOME:              { bg: "bg-amber-50",   text: "text-amber-700" },
};

function typeBadge(type?: string) {
  if (!type) return null;
  const s = TYPE_STYLE[type] ?? { bg: "bg-slate-100", text: "text-slate-600" };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${s.bg} ${s.text}`}>
      {type.replace(/_/g, " ")}
    </span>
  );
}

// ─── Broadcast panel ──────────────────────────────────────────────────────────

const ROLES: { value: BroadcastRole; label: string; desc: string }[] = [
  { value: "DELIVERY", label: "Delivery Partners", desc: "All active delivery partners" },
  { value: "SELLER",   label: "Sellers",           desc: "All registered sellers" },
  { value: "CUSTOMER", label: "Customers",         desc: "All app customers" },
  { value: "ADMIN",    label: "Admins",             desc: "Admin team only" },
];

function BroadcastPanel({ onClose }: { onClose: () => void }) {
  const [role, setRole]       = useState<BroadcastRole>("DELIVERY");
  const [title, setTitle]     = useState("");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const mut = useMutation({
    mutationFn: () => sendBroadcast({ targetRole: role, title, message, imageUrl: imageUrl || undefined }),
    onSuccess: () => {
      toast.success("Broadcast sent successfully");
      onClose();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50/60 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FiSend className="text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">Send Broadcast</h3>
        </div>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">
          <FiX className="h-4 w-4" />
        </button>
      </div>

      {/* Role selector */}
      <div className="grid grid-cols-2 gap-2 mb-4 sm:grid-cols-4">
        {ROLES.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => setRole(r.value)}
            className={`rounded-xl border px-3 py-2 text-left transition-all ${
              role === r.value
                ? "border-blue-500 bg-blue-500 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"
            }`}
          >
            <p className="text-xs font-bold">{r.label}</p>
            <p className={`text-[10px] mt-0.5 ${role === r.value ? "text-blue-100" : "text-slate-400"}`}>
              {r.desc}
            </p>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <div>
          <label className="block mb-1 text-xs font-semibold text-slate-700">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Diwali bonus available!"
            maxLength={120}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block mb-1 text-xs font-semibold text-slate-700">Message *</label>
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Notification message body…"
            maxLength={500}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
        <div>
          <label className="block mb-1 text-xs font-semibold text-slate-700">Image URL (optional)</label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://… (shows in push notification)"
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="button"
          disabled={mut.isPending || !title.trim() || !message.trim()}
          onClick={() => mut.mutate()}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          <FiSend className="h-3.5 w-3.5" />
          {mut.isPending ? "Sending…" : `Send to ${ROLES.find((r) => r.value === role)?.label}`}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Notifications() {
  const qc = useQueryClient();
  const [showBroadcast, setShowBroadcast] = useState(false);

  const { data: items = [], isLoading, isError, error } = useQuery({
    queryKey: ["admin", "notifications"],
    queryFn: fetchNotifications,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const markOne = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "notifications"] }),
  });

  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "notifications"] }),
  });

  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/"
          className="w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-colors"
        >
          <FiChevronLeft />
        </Link>
        <div className="flex flex-1 items-center gap-2">
          <FiBell className="text-primary-600" />
          <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
          {unread > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowBroadcast((v) => !v)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
              showBroadcast
                ? "bg-blue-600 text-white"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            <FiSend className="h-3.5 w-3.5" />
            Broadcast
          </button>
          {unread > 0 && (
            <button
              type="button"
              disabled={markAll.isPending}
              onClick={() => markAll.mutate()}
              className="flex items-center gap-1 text-xs text-slate-500 font-medium hover:text-slate-700 disabled:opacity-50"
            >
              <FiCheck /> Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Broadcast panel */}
      {showBroadcast && <BroadcastPanel onClose={() => setShowBroadcast(false)} />}

      {/* Feed */}
      <div className="space-y-2">
        {isLoading && (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-white border border-slate-100" />
          ))
        )}

        {isError && (
          <p className="py-12 text-center text-sm text-red-600">
            {error instanceof Error ? error.message : "Failed to load"}
          </p>
        )}

        {!isLoading && !isError && items.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => { if (!n.read) markOne.mutate(n.id); }}
            className={`w-full text-left rounded-xl border p-4 shadow-sm transition-all hover:shadow-md ${
              !n.read
                ? "border-primary-200 bg-white ring-1 ring-primary-100"
                : "border-slate-100 bg-white"
            }`}
          >
            <div className="flex items-start gap-3">
              {n.imageUrl && (
                <img
                  src={n.imageUrl}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-lg object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <h3 className={`text-sm ${!n.read ? "font-bold" : "font-semibold"} text-slate-900`}>
                    {n.title}
                  </h3>
                  {!n.read && (
                    <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-600">{n.message}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <p className="text-[10px] text-slate-400">{n.time}</p>
                  {typeBadge(n.type)}
                </div>
              </div>
            </div>
          </button>
        ))}

        {!isLoading && !isError && items.length === 0 && (
          <p className="py-16 text-center text-sm text-slate-500">No notifications yet.</p>
        )}
      </div>
    </div>
  );
}
