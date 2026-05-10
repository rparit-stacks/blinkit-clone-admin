import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCoupons, createCoupon, updateCoupon, toggleCoupon, deleteCoupon, type AdminCoupon } from "../../api/adminApi";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/Modal";
import { statusBadge } from "../../components/Badge";
import { FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight } from "react-icons/fi";
import { toast } from "sonner";

const empty = (): Partial<AdminCoupon> => ({
  code: "", description: "", discountType: "PERCENT", discountValue: 10,
  minOrderValue: 0, maxDiscount: 0, usageLimit: 0, active: true,
  storeCategory: "", storeId: "",
});

export default function Coupons() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<AdminCoupon> | null>(null);

  const { data: coupons = [], isLoading } = useQuery({ queryKey: ["admin","coupons"], queryFn: getCoupons });

  const saveMut = useMutation({
    mutationFn: (c: Partial<AdminCoupon>) => {
      const payload = {
        ...c,
        storeCategory: c.storeCategory?.trim() || null,
        storeId: c.storeId?.trim() || null,
      };
      return c.id ? updateCoupon(c.id, payload) : createCoupon(payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin","coupons"] }); setModalOpen(false); toast.success("Saved"); },
    onError: (e) => toast.error((e as Error).message),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => toggleCoupon(id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin","coupons"] }),
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteCoupon(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin","coupons"] }); toast.success("Deleted"); },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="min-h-full">
      <PageHeader title="Coupons" subtitle={`${coupons.length} coupons`}
        action={
          <button onClick={() => { setEditing(empty()); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
            <FiPlus className="w-4 h-4" /> Create Coupon
          </button>
        }
      />

      <div className="p-6">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Code</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Discount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Min Order</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Usage</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Scope</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Expires</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td></tr>
              )) : coupons.map((c: AdminCoupon) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">{c.code}</span>
                    {c.description && <p className="text-xs text-slate-400 mt-0.5">{c.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {statusBadge(c.discountType)}
                      <span className="font-semibold text-slate-900">
                        {c.discountType === "PERCENT" ? `${c.discountValue}%` : `₹${c.discountValue}`}
                      </span>
                    </div>
                    {c.maxDiscount > 0 && <p className="text-xs text-slate-400">Max ₹{c.maxDiscount}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">₹{c.minOrderValue}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.usedCount}/{c.usageLimit === 0 ? "∞" : c.usageLimit}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {c.storeCategory || "All"}{c.storeId ? ` · ${c.storeId.slice(0,6)}` : ""}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("en-IN") : "Never"}
                  </td>
                  <td className="px-4 py-3">{statusBadge(c.active ? "ACTIVE" : "INACTIVE")}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => toggleMut.mutate({ id: c.id, active: !c.active })}
                        className={`p-1.5 rounded-lg transition-colors ${c.active ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                        {c.active ? <FiToggleRight className="w-4 h-4" /> : <FiToggleLeft className="w-4 h-4" />}
                      </button>
                      <button onClick={() => { setEditing({ ...c, storeCategory: c.storeCategory ?? "", storeId: c.storeId ?? "" }); setModalOpen(true); }}
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                        <FiEdit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { if (confirm("Delete coupon?")) deleteMut.mutate(c.id); }}
                        className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && coupons.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">No coupons yet</div>
          )}
        </div>
      </div>

      <Modal title={editing?.id ? "Edit Coupon" : "Create Coupon"} open={modalOpen} onClose={() => setModalOpen(false)}
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700">Cancel</button>
            <button onClick={() => editing && saveMut.mutate(editing)} disabled={saveMut.isPending}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-primary-700">
              {saveMut.isPending ? "Saving…" : "Save Coupon"}
            </button>
          </div>
        }
      >
        {editing && (
          <div className="space-y-3 text-sm">
            {[
              { label: "Code (uppercase)", key: "code" },
              { label: "Description", key: "description" },
              { label: "Discount Value", key: "discountValue", type: "number" },
              { label: "Min Order Value (₹)", key: "minOrderValue", type: "number" },
              { label: "Max Discount Cap (₹, 0=none)", key: "maxDiscount", type: "number" },
              { label: "Usage Limit (0=unlimited)", key: "usageLimit", type: "number" },
              { label: "Store Category (leave empty=all)", key: "storeCategory" },
              { label: "Store ID (leave empty=all stores in category)", key: "storeId" },
              { label: "Expires At (ISO date, leave empty=never)", key: "expiresAt" },
            ].map(({ label, key, type = "text" }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                <input type={type} value={(editing as Record<string, unknown>)[key] as string ?? ""}
                  onChange={e => setEditing(prev => ({ ...prev!, [key]: type === "number" ? Number(e.target.value) : e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/30" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Discount Type</label>
              <select value={editing.discountType ?? "PERCENT"} onChange={e => setEditing(prev => ({ ...prev!, discountType: e.target.value as "PERCENT" | "FLAT" }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/30">
                <option value="PERCENT">Percentage (%)</option>
                <option value="FLAT">Flat Amount (₹)</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="couponActive" checked={editing.active ?? true}
                onChange={e => setEditing(prev => ({ ...prev!, active: e.target.checked }))} className="w-4 h-4 accent-primary-600" />
              <label htmlFor="couponActive" className="text-sm text-slate-700">Active</label>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
