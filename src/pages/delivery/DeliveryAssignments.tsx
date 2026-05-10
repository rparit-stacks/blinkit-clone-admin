import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDeliveryAssignments, assignDelivery, adminUpdateAssignmentStatus,
  getDeliveryPartners, type DeliveryAssignment,
} from "../../api/adminApi";
import { toast } from "sonner";
import clsx from "clsx";
import { FiTruck, FiCheckCircle, FiSearch, FiNavigation } from "react-icons/fi";

const STATUS_COLORS: Record<string, string> = {
  ASSIGNED: "bg-blue-100 text-blue-800",
  ACCEPTED: "bg-indigo-100 text-indigo-800",
  PICKED_UP: "bg-purple-100 text-purple-800",
  ON_THE_WAY: "bg-orange-100 text-orange-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REJECTED: "bg-red-100 text-red-800",
};

export default function DeliveryAssignments() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected] = useState<DeliveryAssignment | null>(null);
  const [assignModal, setAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ subOrderId: "", deliveryPartnerId: "", deliveryFee: "" });

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["admin", "delivery-assignments", statusFilter],
    queryFn: () => getDeliveryAssignments(statusFilter === "ALL" ? undefined : statusFilter),
  });

  const { data: partners = [] } = useQuery({
    queryKey: ["admin", "delivery"],
    queryFn: getDeliveryPartners,
  });

  const approvedPartners = partners.filter(p => p.status === "APPROVED");

  const assignMut = useMutation({
    mutationFn: () => assignDelivery(
      assignForm.subOrderId,
      assignForm.deliveryPartnerId,
      parseInt(assignForm.deliveryFee) * 100
    ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "delivery-assignments"] });
      toast.success("Order assigned to delivery partner");
      setAssignModal(false);
      setAssignForm({ subOrderId: "", deliveryPartnerId: "", deliveryFee: "" });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminUpdateAssignmentStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "delivery-assignments"] });
      toast.success("Status updated");
      setSelected(null);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const filtered = assignments.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return a.displayId.toLowerCase().includes(q)
      || a.deliveryPartnerId.toLowerCase().includes(q)
      || (a.customerName ?? "").toLowerCase().includes(q)
      || (a.sellerStoreName ?? "").toLowerCase().includes(q);
  });

  const activeCount = assignments.filter(a => ["ASSIGNED", "ACCEPTED", "PICKED_UP", "ON_THE_WAY"].includes(a.status)).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Delivery Assignments</h1>
          <p className="text-slate-500 text-sm mt-1">
            {activeCount > 0
              ? <span className="text-orange-600 font-semibold">{activeCount} active</span>
              : "No active deliveries"}
          </p>
        </div>
        <button
          onClick={() => setAssignModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors"
        >
          <FiTruck className="w-4 h-4" /> Assign Order
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by ID, partner, customer, store..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {["ALL", "ASSIGNED", "PICKED_UP", "ON_THE_WAY", "DELIVERED", "CANCELLED"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={clsx(
                "px-3 py-2 rounded-xl text-xs font-semibold border whitespace-nowrap transition-colors",
                statusFilter === s
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-xl border border-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">Order</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">Partner</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">Route</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">Fee</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400 text-sm">
                      No delivery assignments found
                    </td>
                  </tr>
                ) : filtered.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 font-mono text-xs">{a.displayId}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{a.orderSummary}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-xs font-medium text-slate-700 font-mono">{a.deliveryPartnerId.slice(0, 10)}…</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <p className="text-xs text-slate-600 truncate max-w-[140px]">
                          📦 {a.sellerStoreName || "Seller"}
                        </p>
                        <p className="text-xs text-slate-600 truncate max-w-[140px]">
                          📍 {a.customerName || "Customer"}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={clsx("text-[10px] font-bold px-2 py-1 rounded-full", STATUS_COLORS[a.status])}>
                        {a.status.replace("_", " ")}
                      </span>
                      {a.deliveredAt && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(a.deliveredAt).toLocaleDateString()}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">₹{(a.deliveryFee / 100).toFixed(0)}</p>
                      <p className="text-[10px] text-slate-400">{a.paymentMode?.toUpperCase()} {a.paid ? "✓" : ""}</p>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setSelected(a)}
                        className="px-2.5 py-1.5 text-slate-600 border border-slate-200 rounded-lg text-xs hover:bg-slate-50"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assign modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Assign Delivery</h2>
              <button onClick={() => setAssignModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500">✕</button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Sub-Order ID</label>
              <input
                type="text"
                value={assignForm.subOrderId}
                onChange={e => setAssignForm(f => ({ ...f, subOrderId: e.target.value }))}
                placeholder="Sub-order MongoDB ID"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Delivery Partner</label>
              <select
                value={assignForm.deliveryPartnerId}
                onChange={e => setAssignForm(f => ({ ...f, deliveryPartnerId: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select a partner...</option>
                {approvedPartners.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.phone} ({p.vehicleType}) {p.online ? "🟢" : "⚫"}
                  </option>
                ))}
              </select>
              {approvedPartners.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">No approved delivery partners available</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Delivery Fee (₹)</label>
              <input
                type="number"
                min={0}
                value={assignForm.deliveryFee}
                onChange={e => setAssignForm(f => ({ ...f, deliveryFee: e.target.value }))}
                placeholder="e.g. 30"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <button
              onClick={() => assignMut.mutate()}
              disabled={assignMut.isPending || !assignForm.subOrderId || !assignForm.deliveryPartnerId}
              className="w-full bg-orange-500 text-white font-semibold py-3 rounded-xl text-sm hover:bg-orange-600 disabled:opacity-60 transition-colors"
            >
              {assignMut.isPending ? "Assigning…" : "Assign Delivery Partner"}
            </button>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{selected.displayId}</h2>
              <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500">✕</button>
            </div>

            <div className={clsx("text-xs font-bold px-3 py-1.5 rounded-full inline-block", STATUS_COLORS[selected.status])}>
              {selected.status.replace("_", " ")}
            </div>

            <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
              {[
                ["Order", selected.orderSummary],
                ["Store", selected.sellerStoreName],
                ["Customer", selected.customerName || "—"],
                ["Payment", `${selected.paymentMode?.toUpperCase()} ${selected.paid ? "(Paid)" : "(Collect)"}`],
                ["Order Total", `₹${(selected.orderTotal / 100).toFixed(0)}`],
                ["Delivery Fee", `₹${(selected.deliveryFee / 100).toFixed(0)}`],
                ["Assigned", selected.assignedAt ? new Date(selected.assignedAt).toLocaleString() : "—"],
                ["Picked Up", selected.pickedUpAt ? new Date(selected.pickedUpAt).toLocaleString() : "—"],
                ["Delivered", selected.deliveredAt ? new Date(selected.deliveredAt).toLocaleString() : "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <span className="text-slate-500 shrink-0">{k}</span>
                  <span className="text-slate-900 font-medium text-right">{v}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-700">Pickup Address</p>
              <p className="text-sm text-slate-600 bg-green-50 rounded-xl p-3">{selected.pickupAddress || "—"}</p>
              <button
                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.pickupAddress || "")}`, "_blank")}
                className="flex items-center gap-1.5 text-xs text-green-700 font-medium"
              >
                <FiNavigation className="w-3 h-3" /> Open in Maps
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-700">Delivery Address</p>
              <p className="text-sm text-slate-600 bg-orange-50 rounded-xl p-3">{selected.deliveryAddress || "—"}</p>
            </div>

            {/* Admin status override */}
            {!["DELIVERED", "CANCELLED"].includes(selected.status) && (
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Override Status</p>
                <div className="flex flex-wrap gap-2">
                  {["PICKED_UP", "ON_THE_WAY", "DELIVERED", "CANCELLED"].map(s => (
                    <button
                      key={s}
                      onClick={() => statusMut.mutate({ id: selected.id, status: s })}
                      disabled={statusMut.isPending || s === selected.status}
                      className={clsx(
                        "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors disabled:opacity-40",
                        s === "DELIVERED" ? "bg-green-600 text-white border-green-600 hover:bg-green-700" :
                        s === "CANCELLED" ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100" :
                        "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                      )}
                    >
                      {statusMut.isPending ? "…" : s.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selected.status === "DELIVERED" && (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-xl p-3">
                <FiCheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Delivery completed successfully</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
