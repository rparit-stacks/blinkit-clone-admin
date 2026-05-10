import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDeliveryPartners, createDeliveryPartner, updateDeliveryPartner,
  approvePartner, blockPartner, deletePartner, type DeliveryPartner
} from "../../api/adminApi";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/Modal";
import { statusBadge } from "../../components/Badge";
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiSlash, FiCheckCircle } from "react-icons/fi";
import { toast } from "sonner";

const empty = (): Partial<DeliveryPartner> => ({ name: "", phone: "", email: "", vehicleType: "BIKE", vehicleNumber: "" });

export default function Delivery() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<DeliveryPartner> | null>(null);

  const { data: partners = [], isLoading } = useQuery({ queryKey: ["admin","delivery"], queryFn: getDeliveryPartners });

  const saveMut = useMutation({
    mutationFn: (d: Partial<DeliveryPartner>) => d.id ? updateDeliveryPartner(d.id, d) : createDeliveryPartner(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin","delivery"] }); setModalOpen(false); toast.success("Saved"); },
    onError: (e) => toast.error((e as Error).message),
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => approvePartner(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin","delivery"] }),
    onError: (e) => toast.error((e as Error).message),
  });

  const blockMut = useMutation({
    mutationFn: ({ id, block }: { id: string; block: boolean }) => blockPartner(id, block),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin","delivery"] }),
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deletePartner(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin","delivery"] }); toast.success("Deleted"); },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="min-h-full">
      <PageHeader title="Delivery Partners" subtitle={`${partners.length} partners`}
        action={
          <button onClick={() => { setEditing(empty()); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
            <FiPlus className="w-4 h-4" /> Add Partner
          </button>
        }
      />

      <div className="p-6">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Partner</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Vehicle</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Online</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Deliveries</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Rating</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td></tr>
              )) : partners.map((p: DeliveryPartner) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-700 font-semibold text-xs">
                        {p.name?.charAt(0)?.toUpperCase() ?? "?"}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{p.name}</p>
                        <p className="text-xs text-slate-400">{p.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <p>{p.vehicleType || "—"}</p>
                    {p.vehicleNumber && <p className="text-xs text-slate-400">{p.vehicleNumber}</p>}
                  </td>
                  <td className="px-4 py-3">{statusBadge(p.status)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${p.online ? "bg-green-500" : "bg-slate-300"}`} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.totalDeliveries}</td>
                  <td className="px-4 py-3 text-slate-600">⭐ {p.rating?.toFixed(1) ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {p.status === "PENDING" && (
                        <button onClick={() => approveMut.mutate(p.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100">
                          <FiCheck className="w-3.5 h-3.5" /> Approve
                        </button>
                      )}
                      {p.status === "BLOCKED" ? (
                        <button onClick={() => blockMut.mutate({ id: p.id, block: false })}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100">
                          <FiCheckCircle className="w-3.5 h-3.5" /> Unblock
                        </button>
                      ) : p.status === "APPROVED" && (
                        <button onClick={() => blockMut.mutate({ id: p.id, block: true })}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-orange-50 text-orange-700 hover:bg-orange-100">
                          <FiSlash className="w-3.5 h-3.5" /> Block
                        </button>
                      )}
                      <button onClick={() => { setEditing({ ...p }); setModalOpen(true); }}
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                        <FiEdit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { if (confirm("Delete partner?")) deleteMut.mutate(p.id); }}
                        className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && partners.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">No delivery partners yet</div>
          )}
        </div>
      </div>

      <Modal title={editing?.id ? "Edit Partner" : "Add Delivery Partner"} open={modalOpen} onClose={() => setModalOpen(false)}
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700">Cancel</button>
            <button onClick={() => editing && saveMut.mutate(editing)} disabled={saveMut.isPending}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-primary-700">
              {saveMut.isPending ? "Saving…" : "Save Partner"}
            </button>
          </div>
        }
      >
        {editing && (
          <div className="space-y-3 text-sm">
            {[
              { label: "Full Name", key: "name" }, { label: "Phone", key: "phone" },
              { label: "Email", key: "email" }, { label: "Vehicle Number", key: "vehicleNumber" },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                <input value={(editing as Record<string, unknown>)[key] as string ?? ""}
                  onChange={e => setEditing(prev => ({ ...prev!, [key]: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/30" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Vehicle Type</label>
              <select value={editing.vehicleType ?? "BIKE"} onChange={e => setEditing(prev => ({ ...prev!, vehicleType: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/30">
                {["BIKE","SCOOTER","CYCLE","CAR"].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
