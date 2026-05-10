import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/Modal";
import {
  FiCheck, FiX, FiEye, FiSearch, FiFilter, FiShoppingCart,
  FiMapPin, FiPhone, FiMail, FiCalendar, FiFileText
} from "react-icons/fi";
import { toast } from "sonner";

const BASE = "http://localhost:8080";
function getToken() { return localStorage.getItem("adminToken") ?? ""; }
async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json() as { success: boolean; data: T; message?: string };
  if (!res.ok || !json.success) throw new Error(json.message ?? "Request failed");
  return json.data;
}
const get  = <T,>(path: string) => req<T>("GET", path);
const post = <T,>(path: string, body?: unknown) => req<T>("POST", path, body);

// Inline types
interface Seller {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  storeName: string;
  storeCategory: string;
  description?: string;
  gstNumber?: string;
  panNumber?: string;
  businessRegNumber?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
  logoUrl?: string;
  bannerUrl?: string;
  gstCertificateUrl?: string;
  panCardUrl?: string;
  licenseUrl?: string;
  businessProofUrl?: string;
  idProofUrl?: string;
  storeId?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  createdAt: string;
}

const STATUS_STYLES = {
  PENDING:  "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

type FilterStatus = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

const fetchSellers = () => get<Seller[]>("/api/admin/sellers");
const approveSeller = (id: string) => post<Seller>(`/api/admin/sellers/${id}/approve`, {});
const rejectSellerApi = (id: string, reason: string) =>
  post<Seller>(`/api/admin/sellers/${id}/reject`, { reason });

export default function Sellers() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<FilterStatus>("ALL");
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<Seller | null>(null);
  const [rejectModal, setRejectModal] = useState<Seller | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: sellers = [], isLoading } = useQuery({
    queryKey: ["admin", "sellers"],
    queryFn: fetchSellers,
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => approveSeller(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "sellers"] });
      toast.success("Seller approved — store created automatically");
      setViewing(null);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectSellerApi(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "sellers"] });
      toast.success("Seller rejected");
      setRejectModal(null);
      setViewing(null);
      setRejectReason("");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const filtered = sellers
    .filter(s => filter === "ALL" || s.status === filter)
    .filter(s =>
      !search ||
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.storeName.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="min-h-full">
      <PageHeader
        title="Seller Applications"
        subtitle={`${sellers.length} seller${sellers.length !== 1 ? "s" : ""}`}
      />

      <div className="p-6 space-y-4">
        {/* Filter + Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search sellers..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/30 bg-white"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(["ALL", "PENDING", "APPROVED", "REJECTED"] as FilterStatus[]).map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                  filter === s
                    ? "bg-primary-600 text-white border-primary-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                {s === "ALL" ? `All (${sellers.length})` : `${s} (${sellers.filter(x => x.status === s).length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-white rounded-xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
            <FiShoppingCart className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No sellers found</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="hidden sm:grid grid-cols-[2fr_1.5fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <span>Seller</span>
              <span>Store</span>
              <span>Category</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            <div className="divide-y divide-slate-100">
              {filtered.map(s => (
                <div key={s.id} className="grid grid-cols-1 sm:grid-cols-[2fr_1.5fr_1fr_1fr_auto] gap-3 sm:gap-4 items-center px-5 py-4 hover:bg-slate-50 transition-colors">
                  {/* Seller */}
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{s.fullName}</p>
                    <p className="text-xs text-slate-500">{s.email}</p>
                    <p className="text-xs text-slate-400">{s.phone}</p>
                  </div>
                  {/* Store */}
                  <div>
                    <p className="text-sm font-medium text-slate-800">{s.storeName}</p>
                    <p className="text-xs text-slate-400">{s.city ?? "—"}, {s.state ?? ""}</p>
                  </div>
                  {/* Category */}
                  <div>
                    <span className="text-xs font-semibold capitalize bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {s.storeCategory}
                    </span>
                  </div>
                  {/* Status */}
                  <div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_STYLES[s.status]}`}>
                      {s.status}
                    </span>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setViewing(s)}
                      className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                      title="View details"
                    >
                      <FiEye className="w-4 h-4" />
                    </button>
                    {s.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => approveMut.mutate(s.id)}
                          disabled={approveMut.isPending}
                          className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                          title="Approve"
                        >
                          <FiCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setRejectModal(s); setRejectReason(""); }}
                          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          title="Reject"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* View detail modal */}
      {viewing && (
        <Modal
          title={`${viewing.storeName}`}
          open={!!viewing}
          onClose={() => setViewing(null)}
          size="lg"
          footer={
            viewing.status === "PENDING" ? (
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setRejectModal(viewing); setRejectReason(""); setViewing(null); }}
                  className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50"
                >
                  <FiX className="w-4 h-4" /> Reject
                </button>
                <button
                  onClick={() => approveMut.mutate(viewing.id)}
                  disabled={approveMut.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60"
                >
                  <FiCheck className="w-4 h-4" /> Approve Seller
                </button>
              </div>
            ) : undefined
          }
        >
          <div className="space-y-5 text-sm">
            {/* Status */}
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_STYLES[viewing.status]}`}>
              {viewing.status}
              {viewing.rejectionReason && `: ${viewing.rejectionReason}`}
            </span>

            {/* Basic info */}
            <div className="grid grid-cols-2 gap-3">
              <InfoField icon={FiMail} label="Email" value={viewing.email} />
              <InfoField icon={FiPhone} label="Phone" value={viewing.phone} />
              <InfoField icon={FiShoppingCart} label="Store" value={viewing.storeName} />
              <InfoField icon={FiFilter} label="Category" value={viewing.storeCategory} />
              <InfoField icon={FiCalendar} label="Applied" value={new Date(viewing.createdAt).toLocaleDateString()} />
              <InfoField icon={FiMapPin} label="Location" value={[viewing.addressLine, viewing.city, viewing.state].filter(Boolean).join(", ")} />
            </div>

            {/* Business docs */}
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Business Details</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <span className="text-slate-500">GST</span><span className="font-medium">{viewing.gstNumber ?? "—"}</span>
                <span className="text-slate-500">PAN</span><span className="font-medium">{viewing.panNumber ?? "—"}</span>
                <span className="text-slate-500">Business Reg</span><span className="font-medium">{viewing.businessRegNumber ?? "—"}</span>
              </div>
            </div>

            {/* Documents */}
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Documents</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { label: "GST Certificate", url: viewing.gstCertificateUrl },
                  { label: "PAN Card", url: viewing.panCardUrl },
                  { label: "License", url: viewing.licenseUrl },
                  { label: "Business Proof", url: viewing.businessProofUrl },
                  { label: "ID Proof", url: viewing.idProofUrl },
                ].map(({ label, url }) => (
                  <div key={label} className={`p-2.5 rounded-lg border text-xs ${url ? "border-green-200 bg-green-50" : "border-slate-200 bg-slate-50"}`}>
                    <FiFileText className={`w-4 h-4 mb-1 ${url ? "text-green-600" : "text-slate-400"}`} />
                    <p className={`font-medium ${url ? "text-green-700" : "text-slate-500"}`}>{label}</p>
                    {url ? (
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">View</a>
                    ) : (
                      <span className="text-slate-400">Not uploaded</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Store images */}
            {(viewing.logoUrl || viewing.bannerUrl) && (
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Store Media</p>
                <div className="flex gap-3">
                  {viewing.logoUrl && (
                    <img src={viewing.logoUrl} alt="Logo" className="w-16 h-16 rounded-xl object-cover border border-slate-200" />
                  )}
                  {viewing.bannerUrl && (
                    <img src={viewing.bannerUrl} alt="Banner" className="h-16 rounded-xl object-cover border border-slate-200 flex-1" />
                  )}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Reject reason modal */}
      <Modal
        title="Reject Seller Application"
        open={!!rejectModal}
        onClose={() => setRejectModal(null)}
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setRejectModal(null)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700">Cancel</button>
            <button
              onClick={() => rejectModal && rejectMut.mutate({ id: rejectModal.id, reason: rejectReason })}
              disabled={rejectMut.isPending || !rejectReason.trim()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-red-700"
            >
              Reject
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Please provide a reason for rejecting <strong>{rejectModal?.storeName}</strong>.</p>
          <textarea
            rows={4}
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="e.g. Incomplete documents, invalid GST number..."
            className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 resize-none"
          />
        </div>
      </Modal>
    </div>
  );
}

function InfoField({ icon: Icon, label, value }: { icon: React.FC<{ className?: string }>; label: string; value?: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-800">{value || "—"}</p>
      </div>
    </div>
  );
}
