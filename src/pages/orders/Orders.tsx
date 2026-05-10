import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrders, updateOrderStatus, cancelOrder, type AdminOrder } from "../../api/adminApi";
import PageHeader from "../../components/PageHeader";
import { statusBadge } from "../../components/Badge";
import Modal from "../../components/Modal";
import { FiEye, FiRefreshCw, FiX, FiFilter } from "react-icons/fi";
import { toast } from "sonner";

const STATUSES = ["ALL","PENDING","PROCESSING","DISPATCHED","DELIVERED","CANCELLED"];

function formatAddress(snap: string) {
  try { const a = JSON.parse(snap); return a.display || a.line1 || snap; } catch { return snap; }
}

export default function Orders() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [detail, setDetail] = useState<AdminOrder | null>(null);
  const [newStatus, setNewStatus] = useState("");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin","orders", statusFilter],
    queryFn: () => getOrders(statusFilter === "ALL" ? undefined : statusFilter),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateOrderStatus(id, status),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["admin","orders"] });
      setDetail(updated); toast.success("Status updated");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const cancelMut = useMutation({
    mutationFn: (id: string) => cancelOrder(id),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["admin","orders"] });
      setDetail(updated); toast.success("Order cancelled");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="min-h-full">
      <PageHeader title="Orders" subtitle={`${orders.length} orders`} />

      <div className="p-6 space-y-4">
        {/* Status filter tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <FiFilter className="w-4 h-4 text-slate-400" />
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === s ? "bg-primary-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              {s}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Order ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Items</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Total</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Payment</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td></tr>
                ))
              ) : orders.map((order: AdminOrder) => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">#{order.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs font-mono">{order.userId.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-slate-600">{order.items.length} items</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">₹{order.total}</td>
                  <td className="px-4 py-3 text-slate-500 uppercase text-xs">{order.paymentMode}</td>
                  <td className="px-4 py-3">{statusBadge(order.status)}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setDetail(order)}
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                        <FiEye className="w-3.5 h-3.5" />
                      </button>
                      {order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
                        <button onClick={() => { if (confirm("Cancel order?")) cancelMut.mutate(order.id); }}
                          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                          <FiX className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && orders.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">No orders</div>
          )}
        </div>
      </div>

      {/* Order detail modal */}
      <Modal title={`Order #${detail?.id.slice(0, 8) ?? ""}`} open={!!detail} onClose={() => setDetail(null)} size="lg"
        footer={
          detail && (
            <div className="flex items-center gap-3">
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/30">
                <option value="">Select new status…</option>
                {["PENDING","PROCESSING","DISPATCHED","DELIVERED","CANCELLED"].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button
                onClick={() => newStatus && updateMut.mutate({ id: detail.id, status: newStatus })}
                disabled={!newStatus || updateMut.isPending}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                <FiRefreshCw className="w-3.5 h-3.5" /> Update Status
              </button>
            </div>
          )
        }
      >
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">Status</p>
                {statusBadge(detail.status)}
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">Payment</p>
                <p className="font-medium text-slate-900 uppercase">{detail.paymentMode}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">Total</p>
                <p className="font-bold text-slate-900 text-lg">₹{detail.total}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">Date</p>
                <p className="font-medium text-slate-900">{new Date(detail.createdAt).toLocaleString("en-IN")}</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-2">Delivery Address</p>
              <p className="text-sm text-slate-700">{formatAddress(detail.addressSnapshot)}</p>
            </div>

            <div>
              <p className="text-xs text-slate-400 mb-2">Order Items</p>
              <div className="space-y-2">
                {detail.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{item.productName}</p>
                      <p className="text-xs text-slate-400">{item.unit} × {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">₹{item.lineTotal}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200 space-y-1 text-sm">
                <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>₹{detail.subtotal}</span></div>
                <div className="flex justify-between text-slate-500"><span>Delivery</span><span>{detail.deliveryFee === 0 ? "FREE" : `₹${detail.deliveryFee}`}</span></div>
                <div className="flex justify-between text-slate-500"><span>Taxes</span><span>₹{detail.taxes}</span></div>
                {detail.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{detail.discount}</span></div>}
                <div className="flex justify-between font-bold text-slate-900 pt-1"><span>Total</span><span>₹{detail.total}</span></div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
