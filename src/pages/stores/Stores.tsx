import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStores, createStore, updateStore, toggleStore, deleteStore, type AdminStore } from "../../api/adminApi";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/Modal";
import Badge from "../../components/Badge";
import { FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight } from "react-icons/fi";
import { toast } from "sonner";

const CATEGORIES = ["food","bazaar","electronic"];
const empty = (): Partial<AdminStore> => ({ name: "", storeCategory: "food", image: "", active: true, sortOrder: 0 });

export default function Stores() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<AdminStore> | null>(null);

  const { data: stores = [], isLoading } = useQuery({ queryKey: ["admin","stores"], queryFn: getStores });

  const saveMut = useMutation({
    mutationFn: (s: Partial<AdminStore>) => s.id ? updateStore(s.id, s) : createStore(s),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin","stores"] }); setModalOpen(false); toast.success("Saved"); },
    onError: (e) => toast.error((e as Error).message),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => toggleStore(id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin","stores"] }),
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteStore(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin","stores"] }); toast.success("Deleted"); },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="min-h-full">
      <PageHeader title="Stores" subtitle={`${stores.length} stores`}
        action={
          <button onClick={() => { setEditing(empty()); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
            <FiPlus className="w-4 h-4" /> Add Store
          </button>
        }
      />

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {isLoading ? Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 bg-white rounded-xl border border-slate-200 animate-pulse" />
          )) : stores.map((s: AdminStore) => (
            <div key={s.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-28 bg-slate-100 relative overflow-hidden">
                {s.image && <img src={s.image} alt={s.name} className="w-full h-full object-cover" />}
                <div className="absolute top-2 right-2 flex gap-1">
                  <Badge label={s.storeCategory} variant="default" />
                  <Badge label={s.active ? "Active" : "Off"} variant={s.active ? "success" : "danger"} />
                </div>
              </div>
              <div className="p-4">
                <p className="font-semibold text-slate-900 truncate">{s.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.cuisineTypes || s.address || "—"}</p>
                {s.eta && <p className="text-xs text-slate-500 mt-0.5">⏱ {s.eta}</p>}
                {s.rating && <p className="text-xs text-slate-500">⭐ {s.rating}</p>}
                <div className="flex items-center gap-2 mt-3">
                  <button onClick={() => toggleMut.mutate({ id: s.id, active: !s.active })}
                    className={`p-1.5 rounded-lg transition-colors ${s.active ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                    {s.active ? <FiToggleRight className="w-4 h-4" /> : <FiToggleLeft className="w-4 h-4" />}
                  </button>
                  <button onClick={() => { setEditing({ ...s }); setModalOpen(true); }}
                    className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                    <FiEdit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { if (confirm("Delete store?")) deleteMut.mutate(s.id); }}
                    className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal title={editing?.id ? "Edit Store" : "Add Store"} open={modalOpen} onClose={() => setModalOpen(false)} size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
            <button onClick={() => editing && saveMut.mutate(editing)} disabled={saveMut.isPending}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-primary-700">
              {saveMut.isPending ? "Saving…" : "Save Store"}
            </button>
          </div>
        }
      >
        {editing && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              { label: "Store Name", key: "name" }, { label: "Image URL", key: "image" },
              { label: "Cover Image URL", key: "coverImage" }, { label: "Description", key: "description" },
              { label: "Cuisine Types", key: "cuisineTypes" }, { label: "ETA (e.g. 30-40 mins)", key: "eta" },
              { label: "Rating", key: "rating" }, { label: "Offer Text", key: "offer" },
              { label: "Address", key: "address" }, { label: "Phone", key: "phone" },
              { label: "Sort Order", key: "sortOrder" },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                <input value={(editing as Record<string, unknown>)[key] as string ?? ""}
                  onChange={e => setEditing(prev => ({ ...prev!, [key]: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/30" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
              <select value={editing.storeCategory ?? "food"} onChange={e => setEditing(prev => ({ ...prev!, storeCategory: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/30">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="storeActive" checked={editing.active ?? true}
                onChange={e => setEditing(prev => ({ ...prev!, active: e.target.checked }))}
                className="w-4 h-4 accent-primary-600" />
              <label htmlFor="storeActive" className="text-sm text-slate-700">Active / Visible</label>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
