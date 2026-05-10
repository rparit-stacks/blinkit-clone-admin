import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBanners, createBanner, updateBanner, toggleBanner, deleteBanner,
  getCmsSections, createCmsSection, updateCmsSection, toggleCmsSection, deleteCmsSection,
  type AdminBanner, type CmsSection,
} from "../../api/adminApi";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/Modal";
import {
  FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight,
  FiImage, FiLayers, FiZap, FiStar, FiTrendingUp, FiGrid,
} from "react-icons/fi";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────

const STORE_CATEGORIES = ["FOOD", "BAZAAR", "ELECTRONIC"];
const SECTION_TYPES = ["TRENDING", "FLASH_SALE", "FEATURED", "BANNER_STRIP"] as const;

const SECTION_TYPE_META: Record<string, { icon: React.ElementType; label: string; color: string; desc: string }> = {
  TRENDING:     { icon: FiTrendingUp, label: "Trending",   color: "text-orange-500 bg-orange-50",  desc: "Hot right now" },
  FLASH_SALE:   { icon: FiZap,        label: "Flash Sale",  color: "text-yellow-600 bg-yellow-50", desc: "Limited time offers" },
  FEATURED:     { icon: FiStar,       label: "Featured",    color: "text-purple-600 bg-purple-50", desc: "Staff picks / curated" },
  BANNER_STRIP: { icon: FiImage,      label: "Banner Strip",color: "text-blue-600 bg-blue-50",     desc: "Full-width image slides" },
};

const emptyBanner = (): Partial<AdminBanner> => ({
  storeCategory: "FOOD", title: "", subtitle: "", code: null,
  imageUrl: null, active: true, sortOrder: 0,
});

const emptySection = (): Partial<CmsSection> => ({
  title: "", type: "TRENDING", storeCategory: null, subtitle: null,
  badgeLabel: null, badgeColor: "bg-orange-500", icon: "🔥",
  productIds: [], slides: [], active: true, sortOrder: 0,
});

// ─── Banner Card ──────────────────────────────────────────────────────────────

function BannerCard({ b, onEdit, onToggle, onDelete }: {
  b: AdminBanner;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const catColor: Record<string, string> = {
    FOOD: "bg-orange-100 text-orange-700",
    BAZAAR: "bg-green-100 text-green-700",
    ELECTRONIC: "bg-blue-100 text-blue-700",
  };
  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-md ${b.active ? "border-slate-200" : "border-slate-100 opacity-60"}`}>
      {/* Preview */}
      <div className="relative h-28 bg-gradient-to-br from-violet-600 to-purple-700 overflow-hidden">
        {b.imageUrl
          ? <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
          : (
            <div className="absolute inset-0 flex flex-col justify-center px-4">
              <p className="text-white font-bold text-sm leading-tight truncate">{b.title || "No title"}</p>
              <p className="text-white/70 text-xs mt-0.5 truncate">{b.subtitle || "No subtitle"}</p>
              {b.code && (
                <span className="mt-1.5 inline-block self-start px-2 py-0.5 bg-black/25 text-white text-[10px] font-bold rounded-full border border-white/20">
                  {b.code}
                </span>
              )}
            </div>
          )
        }
        <span className={`absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${catColor[b.storeCategory] ?? "bg-slate-100 text-slate-600"}`}>
          {b.storeCategory}
        </span>
      </div>
      {/* Info */}
      <div className="px-4 py-3">
        <p className="text-sm font-semibold text-slate-900 truncate">{b.title || "—"}</p>
        <p className="text-xs text-slate-400 truncate mt-0.5">{b.subtitle || "No subtitle"}</p>
        <div className="flex items-center gap-2 mt-3">
          <button onClick={onToggle} className={`p-1.5 rounded-lg transition-colors ${b.active ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
            {b.active ? <FiToggleRight className="w-4 h-4" /> : <FiToggleLeft className="w-4 h-4" />}
          </button>
          <button onClick={onEdit} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
            <FiEdit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
            <FiTrash2 className="w-3.5 h-3.5" />
          </button>
          <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full ${b.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
            {b.active ? "Live" : "Off"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({ s, onEdit, onToggle, onDelete }: {
  s: CmsSection;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const meta = SECTION_TYPE_META[s.type] ?? SECTION_TYPE_META.TRENDING;
  const Icon = meta.icon;
  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-md ${s.active ? "border-slate-200" : "border-slate-100 opacity-60"}`}>
      <div className="px-4 py-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${meta.color.split(" ")[1]} shrink-0`}>
            {s.icon ? <span>{s.icon}</span> : <Icon className={`w-5 h-5 ${meta.color.split(" ")[0]}`} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900 truncate">{s.title}</h3>
              {s.badgeLabel && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white ${s.badgeColor ?? "bg-orange-500"}`}>
                  {s.badgeLabel}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${meta.color}`}>
                {meta.label}
              </span>
              {s.storeCategory && (
                <span className="text-[10px] text-slate-500">{s.storeCategory}</span>
              )}
            </div>
            {s.subtitle && <p className="text-xs text-slate-400 mt-1 truncate">{s.subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
          {s.type !== "BANNER_STRIP" && (
            <span><span className="font-semibold text-slate-700">{s.productIds?.length ?? 0}</span> products</span>
          )}
          {s.type === "BANNER_STRIP" && (
            <span><span className="font-semibold text-slate-700">{s.slides?.length ?? 0}</span> slides</span>
          )}
          <span className="text-slate-300">·</span>
          <span>Order #{s.sortOrder}</span>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <button onClick={onToggle} className={`p-1.5 rounded-lg transition-colors ${s.active ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
            {s.active ? <FiToggleRight className="w-4 h-4" /> : <FiToggleLeft className="w-4 h-4" />}
          </button>
          <button onClick={onEdit} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
            <FiEdit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
            <FiTrash2 className="w-3.5 h-3.5" />
          </button>
          <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
            {s.active ? "Live" : "Off"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main CMS Page ────────────────────────────────────────────────────────────

export default function CMS() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"banners" | "sections">("banners");

  // Banner state
  const [bannerModal, setBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Partial<AdminBanner> | null>(null);

  // Section state
  const [sectionModal, setSectionModal] = useState(false);
  const [editingSection, setEditingSection] = useState<Partial<CmsSection> | null>(null);
  const [productIdsText, setProductIdsText] = useState("");

  // Queries
  const { data: banners = [], isLoading: bannersLoading } = useQuery({ queryKey: ["admin","banners"], queryFn: getBanners });
  const { data: sections = [], isLoading: sectionsLoading } = useQuery({ queryKey: ["admin","cms","sections"], queryFn: getCmsSections });

  // Banner mutations
  const saveBannerMut = useMutation({
    mutationFn: (b: Partial<AdminBanner>) => b.id ? updateBanner(b.id, b) : createBanner(b),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin","banners"] }); setBannerModal(false); toast.success("Saved"); },
    onError: (e) => toast.error((e as Error).message),
  });
  const toggleBannerMut = useMutation({
    mutationFn: (id: string) => toggleBanner(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin","banners"] }),
  });
  const deleteBannerMut = useMutation({
    mutationFn: (id: string) => deleteBanner(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin","banners"] }); toast.success("Deleted"); },
  });

  // Section mutations
  const saveSectionMut = useMutation({
    mutationFn: (s: Partial<CmsSection>) => s.id ? updateCmsSection(s.id, s) : createCmsSection(s),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin","cms","sections"] }); setSectionModal(false); toast.success("Saved"); },
    onError: (e) => toast.error((e as Error).message),
  });
  const toggleSectionMut = useMutation({
    mutationFn: (id: string) => toggleCmsSection(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin","cms","sections"] }),
  });
  const deleteSectionMut = useMutation({
    mutationFn: (id: string) => deleteCmsSection(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin","cms","sections"] }); toast.success("Deleted"); },
  });

  const openSectionEdit = (s: CmsSection) => {
    setEditingSection({ ...s });
    setProductIdsText(s.productIds?.join("\n") ?? "");
    setSectionModal(true);
  };

  const openSectionAdd = () => {
    setEditingSection(emptySection());
    setProductIdsText("");
    setSectionModal(true);
  };

  const handleSaveSection = () => {
    if (!editingSection) return;
    const ids = productIdsText.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    saveSectionMut.mutate({ ...editingSection, productIds: ids });
  };

  return (
    <div className="min-h-full">
      <PageHeader
        title="Content Management"
        subtitle="Banners & homepage sections"
        action={
          <button
            onClick={() => tab === "banners" ? (setEditingBanner(emptyBanner()), setBannerModal(true)) : openSectionAdd()}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            {tab === "banners" ? "Add Banner" : "Add Section"}
          </button>
        }
      />

      <div className="p-6 space-y-5">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
          {([
            { key: "banners",  icon: FiImage,  label: "Banners" },
            { key: "sections", icon: FiLayers, label: "Sections" },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* ─── BANNERS TAB ─────────────────────────────────────── */}
        {tab === "banners" && (
          <>
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5">
              <FiImage className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              Banners appear in the hero carousel on each store homepage. Create per-category banners with optional coupon codes.
            </div>
            {bannersLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-48 bg-white rounded-2xl border border-slate-200 animate-pulse" />)}
              </div>
            ) : banners.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
                <FiImage className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No banners yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {banners.map((b: AdminBanner) => (
                  <BannerCard
                    key={b.id}
                    b={b}
                    onEdit={() => { setEditingBanner({ ...b }); setBannerModal(true); }}
                    onToggle={() => b.id && toggleBannerMut.mutate(b.id)}
                    onDelete={() => { if (confirm("Delete banner?")) b.id && deleteBannerMut.mutate(b.id); }}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ─── SECTIONS TAB ────────────────────────────────────── */}
        {tab === "sections" && (
          <>
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-purple-50 border border-purple-100 rounded-xl px-4 py-2.5">
              <FiGrid className="w-3.5 h-3.5 text-purple-500 shrink-0" />
              Sections appear as horizontal scrollable rows on the homepage. Pin product IDs to Trending, Flash Sale, or Featured sections.
            </div>
            {sectionsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-36 bg-white rounded-2xl border border-slate-200 animate-pulse" />)}
              </div>
            ) : sections.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
                <FiLayers className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No sections yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {sections.map((s: CmsSection) => (
                  <SectionCard
                    key={s.id}
                    s={s}
                    onEdit={() => openSectionEdit(s)}
                    onToggle={() => s.id && toggleSectionMut.mutate(s.id)}
                    onDelete={() => { if (confirm("Delete section?")) s.id && deleteSectionMut.mutate(s.id); }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── BANNER MODAL ─────────────────────────────────────── */}
      <Modal
        title={editingBanner?.id ? "Edit Banner" : "Add Banner"}
        open={bannerModal}
        onClose={() => setBannerModal(false)}
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setBannerModal(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700">Cancel</button>
            <button onClick={() => editingBanner && saveBannerMut.mutate(editingBanner)} disabled={saveBannerMut.isPending}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-primary-700">
              {saveBannerMut.isPending ? "Saving…" : "Save Banner"}
            </button>
          </div>
        }
      >
        {editingBanner && (
          <div className="space-y-4 text-sm">
            {/* Live preview */}
            <div className={`relative h-24 rounded-xl overflow-hidden bg-gradient-to-br from-violet-600 to-purple-700`}>
              {editingBanner.imageUrl
                ? <img src={editingBanner.imageUrl} alt="preview" className="w-full h-full object-cover" />
                : (
                  <div className="absolute inset-0 flex flex-col justify-center px-4">
                    <p className="text-white font-bold text-sm">{editingBanner.title || "Banner title…"}</p>
                    <p className="text-white/70 text-xs">{editingBanner.subtitle || "Subtitle…"}</p>
                    {editingBanner.code && (
                      <span className="mt-1 inline-block self-start px-2 py-0.5 bg-black/25 text-white text-[10px] font-bold rounded-full border border-white/20">
                        {editingBanner.code}
                      </span>
                    )}
                  </div>
                )
              }
              <span className="absolute top-2 left-2 text-[9px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">Preview</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
              <select value={editingBanner.storeCategory ?? "FOOD"} onChange={e => setEditingBanner(p => ({ ...p!, storeCategory: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/30">
                {STORE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {[
              { label: "Title", key: "title", ph: "50% OFF on First Order!" },
              { label: "Subtitle", key: "subtitle", ph: "Use code: NANI50" },
              { label: "Coupon Code (optional)", key: "code", ph: "NANI50" },
              { label: "Image URL (optional)", key: "imageUrl", ph: "https://…" },
            ].map(({ label, key, ph }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                <input
                  value={(editingBanner as Record<string, unknown>)[key] as string ?? ""}
                  onChange={e => setEditingBanner(p => ({ ...p!, [key]: e.target.value || null }))}
                  placeholder={ph}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/30"
                />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Sort Order</label>
                <input type="number" value={editingBanner.sortOrder ?? 0}
                  onChange={e => setEditingBanner(p => ({ ...p!, sortOrder: Number(e.target.value) }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/30" />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editingBanner.active ?? true}
                    onChange={e => setEditingBanner(p => ({ ...p!, active: e.target.checked }))}
                    className="w-4 h-4 accent-primary-600" />
                  <span className="text-sm text-slate-700">Active</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── SECTION MODAL ────────────────────────────────────── */}
      <Modal
        title={editingSection?.id ? "Edit Section" : "Add Section"}
        open={sectionModal}
        onClose={() => setSectionModal(false)}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setSectionModal(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700">Cancel</button>
            <button onClick={handleSaveSection} disabled={saveSectionMut.isPending}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-primary-700">
              {saveSectionMut.isPending ? "Saving…" : "Save Section"}
            </button>
          </div>
        }
      >
        {editingSection && (
          <div className="space-y-4 text-sm">
            {/* Type selector */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">Section Type</label>
              <div className="grid grid-cols-2 gap-2">
                {SECTION_TYPES.map(type => {
                  const meta = SECTION_TYPE_META[type];
                  const Icon = meta.icon;
                  const active = editingSection.type === type;
                  return (
                    <button key={type} type="button" onClick={() => setEditingSection(p => ({ ...p!, type }))}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border-2 transition-colors text-left ${active ? "border-primary-600 bg-primary-50" : "border-slate-200 hover:border-slate-300"}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${meta.color.split(" ")[1]}`}>
                        <Icon className={`w-4 h-4 ${meta.color.split(" ")[0]}`} />
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${active ? "text-primary-700" : "text-slate-700"}`}>{meta.label}</p>
                        <p className="text-[10px] text-slate-400">{meta.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Basic info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Title *</label>
                <input value={editingSection.title ?? ""} onChange={e => setEditingSection(p => ({ ...p!, title: e.target.value }))}
                  placeholder="Trending Now" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/30" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Icon (emoji)</label>
                <input value={editingSection.icon ?? ""} onChange={e => setEditingSection(p => ({ ...p!, icon: e.target.value }))}
                  placeholder="🔥" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/30" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Subtitle</label>
                <input value={editingSection.subtitle ?? ""} onChange={e => setEditingSection(p => ({ ...p!, subtitle: e.target.value || null }))}
                  placeholder="Hot picks this week" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/30" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Badge Label</label>
                <input value={editingSection.badgeLabel ?? ""} onChange={e => setEditingSection(p => ({ ...p!, badgeLabel: e.target.value || null }))}
                  placeholder="HOT" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/30" />
              </div>
            </div>

            {/* Badge color + category + sort */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Badge Color</label>
                <select value={editingSection.badgeColor ?? "bg-orange-500"} onChange={e => setEditingSection(p => ({ ...p!, badgeColor: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/30">
                  {["bg-orange-500","bg-red-500","bg-green-500","bg-blue-500","bg-purple-600","bg-pink-500"].map(c => (
                    <option key={c} value={c}>{c.replace("bg-","").replace("-500","").replace("-600","")}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
                <select value={editingSection.storeCategory ?? ""} onChange={e => setEditingSection(p => ({ ...p!, storeCategory: e.target.value || null }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/30">
                  <option value="">All</option>
                  {STORE_CATEGORIES.map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Sort Order</label>
                <input type="number" value={editingSection.sortOrder ?? 0} onChange={e => setEditingSection(p => ({ ...p!, sortOrder: Number(e.target.value) }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/30" />
              </div>
            </div>

            {/* Product IDs (for non-banner-strip) */}
            {editingSection.type !== "BANNER_STRIP" && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Product IDs <span className="text-slate-400 font-normal">(one per line or comma-separated)</span>
                </label>
                <textarea rows={5} value={productIdsText}
                  onChange={e => setProductIdsText(e.target.value)}
                  placeholder={"6840abc123...\n6840def456...\n6840ghi789..."}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary-600/30"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  {productIdsText.split(/[\n,]+/).filter(s => s.trim()).length} products entered
                </p>
              </div>
            )}

            {/* Active */}
            <div className="flex items-center gap-3">
              <input type="checkbox" id="sectionActive" checked={editingSection.active ?? true}
                onChange={e => setEditingSection(p => ({ ...p!, active: e.target.checked }))} className="w-4 h-4 accent-primary-600" />
              <label htmlFor="sectionActive" className="text-sm text-slate-700">Active (visible on homepage)</label>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
