import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProducts, createProduct, updateProduct, deleteProduct, patchProduct,
  approveProduct, rejectProduct, type AdminProduct,
} from "../../api/adminApi";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/Modal";
import Badge from "../../components/Badge";
import { FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiSearch, FiCheck, FiSlash } from "react-icons/fi";
import { toast } from "sonner";

const CATEGORIES = ["food","bazaar","electronic"];

const emptyProduct = (): Partial<AdminProduct> => ({
  name: "", storeCategory: "food", categorySlug: "", storeId: "",
  price: 0, originalPrice: 0, unit: "", available: true, approved: false, image: "", rating: 4.0, sortOrder: 0,
});

function isCatalogApproved(p: AdminProduct) {
  return p.approved !== false;
}

export default function Products() {
  const qc = useQueryClient();
  const [catFilter, setCatFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<AdminProduct> | null>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin","products", catFilter],
    queryFn: () => getProducts(catFilter !== "all" ? { category: catFilter } : undefined),
  });

  const saveMut = useMutation({
    mutationFn: (p: Partial<AdminProduct>) =>
      p.id ? updateProduct(p.id, p) : createProduct(p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin","products"] });
      setModalOpen(false); toast.success("Saved");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, available }: { id: string; available: boolean }) =>
      patchProduct(id, { available }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin","products"] }),
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin","products"] }); toast.success("Deleted"); },
    onError: (e) => toast.error((e as Error).message),
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => approveProduct(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin","products"] }); toast.success("Approved — visible in app catalog"); },
    onError: (e) => toast.error((e as Error).message),
  });

  const rejectMut = useMutation({
    mutationFn: (id: string) => rejectProduct(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin","products"] }); toast.success("Rejected — hidden from catalog"); },
    onError: (e) => toast.error((e as Error).message),
  });

  const filtered = products.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditing(emptyProduct()); setModalOpen(true); };
  const openEdit = (p: AdminProduct) => { setEditing({ ...p }); setModalOpen(true); };

  return (
    <div className="min-h-full">
      <PageHeader title="Products" subtitle={`${products.length} products`}
        action={
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
            <FiPlus className="w-4 h-4" /> Add Product
          </button>
        }
      />

      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…"
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/30 w-60" />
          </div>
          <div className="flex gap-2">
            {["all", ...CATEGORIES].map(c => (
              <button key={c} onClick={() => setCatFilter(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${catFilter === c ? "bg-primary-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Product</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Price</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Rating</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Listing</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Catalog</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td></tr>
                ))
              ) : filtered.map((p: AdminProduct) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-slate-100" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      <div>
                        <p className="font-medium text-slate-900">{p.name}</p>
                        <p className="text-xs text-slate-400">{p.unit} · {p.categorySlug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge label={p.storeCategory} variant="default" /></td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">₹{p.price}</p>
                    {p.originalPrice > p.price && <p className="text-xs text-slate-400 line-through">₹{p.originalPrice}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">⭐ {p.rating}</td>
                  <td className="px-4 py-3">
                    <Badge label={p.available ? "Active" : "Inactive"} variant={p.available ? "success" : "default"} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      label={isCatalogApproved(p) ? "Approved" : "Pending"}
                      variant={isCatalogApproved(p) ? "success" : "warning"}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1 flex-wrap">
                      {!isCatalogApproved(p) ? (
                        <button
                          type="button"
                          title="Approve"
                          onClick={() => approveMut.mutate(p.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100"
                        >
                          <FiCheck className="w-3.5 h-3.5" /> Approve
                        </button>
                      ) : (
                        <button
                          type="button"
                          title="Reject"
                          onClick={() => { if (confirm("Reject this product? It will be hidden from the customer app.")) rejectMut.mutate(p.id); }}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-orange-50 text-orange-700 hover:bg-orange-100"
                        >
                          <FiSlash className="w-3.5 h-3.5" /> Reject
                        </button>
                      )}
                      <button type="button" onClick={() => toggleMut.mutate({ id: p.id, available: !p.available })}
                        className={`p-1.5 rounded-lg transition-colors ${p.available ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                        {p.available ? <FiToggleRight className="w-4 h-4" /> : <FiToggleLeft className="w-4 h-4" />}
                      </button>
                      <button type="button" onClick={() => openEdit(p)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                        <FiEdit2 className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => { if (confirm("Delete product?")) deleteMut.mutate(p.id); }}
                        className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">No products found</div>
          )}
        </div>
      </div>

      {/* Add / Edit modal */}
      <Modal title={editing?.id ? "Edit Product" : "Add Product"} open={modalOpen} onClose={() => setModalOpen(false)} size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
            <button onClick={() => editing && saveMut.mutate(editing)} disabled={saveMut.isPending}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-primary-700">
              {saveMut.isPending ? "Saving…" : "Save Product"}
            </button>
          </div>
        }
      >
        {editing && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              { label: "Name", key: "name", type: "text" },
              { label: "Image URL", key: "image", type: "text" },
              { label: "Price (₹)", key: "price", type: "number" },
              { label: "Original Price (₹)", key: "originalPrice", type: "number" },
              { label: "Unit (e.g. 500g)", key: "unit", type: "text" },
              { label: "Category Slug", key: "categorySlug", type: "text" },
              { label: "Store ID", key: "storeId", type: "text" },
              { label: "Rating", key: "rating", type: "number" },
              { label: "Badge", key: "badge", type: "text" },
              { label: "Sort Order", key: "sortOrder", type: "number" },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                <input type={type} value={(editing as Record<string, unknown>)[key] as string ?? ""}
                  onChange={e => setEditing(prev => ({ ...prev!, [key]: type === "number" ? Number(e.target.value) : e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/30" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Store Category</label>
              <select value={editing.storeCategory ?? "food"} onChange={e => setEditing(prev => ({ ...prev!, storeCategory: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/30">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3 col-span-2 flex-wrap">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editing.available ?? true}
                  onChange={e => setEditing(prev => ({ ...prev!, available: e.target.checked }))}
                  className="w-4 h-4 accent-primary-600" />
                <span className="text-sm text-slate-700">Available (in stock)</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editing.approved !== false}
                  onChange={e => setEditing(prev => ({ ...prev!, approved: e.target.checked }))}
                  className="w-4 h-4 accent-primary-600" />
                <span className="text-sm text-slate-700">Approved for customer catalog</span>
              </label>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
