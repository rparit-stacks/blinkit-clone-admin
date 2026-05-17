import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/Modal";
import {
  FiCheck, FiX, FiEye, FiSearch, FiShoppingCart,
  FiMapPin, FiPhone, FiMail, FiCalendar, FiFileText, FiAlertCircle, FiCheckCircle
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

interface Seller {
  id: string; fullName: string; email: string; phone: string;
  storeName: string; storeCategory: string; description?: string;
  gstNumber?: string; panNumber?: string; businessRegNumber?: string;
  addressLine?: string; city?: string; state?: string; pincode?: string;
  bankAccountHolderName?: string; bankAccountNumber?: string; bankIfsc?: string; bankName?: string;
  logoUrl?: string; bannerUrl?: string;
  gstCertificateUrl?: string; panCardUrl?: string; licenseUrl?: string;
  businessProofUrl?: string; idProofUrl?: string;
  storeId?: string; status: "PENDING" | "APPROVED" | "REJECTED"; rejectionReason?: string;
  createdAt: string;
}

type SellerDocKey =
  | "idProofUrl"
  | "panCardUrl"
  | "logoUrl"
  | "gstCertificateUrl"
  | "businessProofUrl"
  | "licenseUrl";

const DOC_LIST: { key: SellerDocKey; label: string; required: boolean }[] = [
  { key: "idProofUrl", label: "ID Proof", required: true },
  { key: "panCardUrl", label: "PAN Card", required: true },
  { key: "logoUrl", label: "Store Photo / Logo", required: true },
  { key: "gstCertificateUrl", label: "GST Certificate", required: false },
  { key: "businessProofUrl", label: "Business Proof", required: false },
  { key: "licenseUrl", label: "Trade License", required: false },
];

function sellerDoc(s: Seller, key: SellerDocKey): string | undefined {
  return s[key];
}

function kycStatus(s: Seller) {
  const uploaded = DOC_LIST.filter((d) => !!sellerDoc(s, d.key));
  const missingRequired = DOC_LIST.filter((d) => d.required && !sellerDoc(s, d.key));
  return { uploaded: uploaded.length, total: DOC_LIST.length, missingRequired };
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
      setRejectModal(null); setViewing(null); setRejectReason("");
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

  const handleApprove = (s: Seller) => {
    const { missingRequired } = kycStatus(s);
    if (missingRequired.length > 0) {
      toast.error(`Cannot approve: missing required documents — ${missingRequired.map(d => d.label).join(", ")}`);
      return;
    }
    approveMut.mutate(s.id);
  };

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
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sellers..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/30 bg-white" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(["ALL", "PENDING", "APPROVED", "REJECTED"] as FilterStatus[]).map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                  filter === s ? "bg-primary-600 text-white border-primary-600" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}>
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
            <div className="hidden sm:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <span>Seller</span><span>Store</span><span>Category</span><span>Status</span><span>KYC</span><span>Actions</span>
            </div>
            <div className="divide-y divide-slate-100">
              {filtered.map(s => {
                const kyc = kycStatus(s);
                const kycOk = kyc.missingRequired.length === 0;
                return (
                  <div key={s.id} className="grid grid-cols-1 sm:grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-3 sm:gap-4 items-center px-5 py-4 hover:bg-slate-50 transition-colors">
                    {/* Seller */}
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{s.fullName}</p>
                      <p className="text-xs text-slate-500">{s.email}</p>
                      <p className="text-xs text-slate-400">{s.phone}</p>
                    </div>
                    {/* Store */}
                    <div>
                      <p className="text-sm font-medium text-slate-800">{s.storeName}</p>
                      <p className="text-xs text-slate-400">{s.city ?? "—"}{s.state ? `, ${s.state}` : ""}</p>
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
                        {s.status === "PENDING" ? "Under Review" : s.status}
                      </span>
                    </div>
                    {/* KYC */}
                    <div className="flex items-center gap-1.5">
                      {kycOk ? (
                        <FiCheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <FiAlertCircle className="w-4 h-4 text-amber-500" />
                      )}
                      <span className={`text-xs font-medium ${kycOk ? "text-green-600" : "text-amber-600"}`}>
                        {kyc.uploaded}/{kyc.total}
                      </span>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setViewing(s)}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors" title="View details">
                        <FiEye className="w-4 h-4" />
                      </button>
                      {s.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleApprove(s)}
                            disabled={approveMut.isPending}
                            title={kycOk ? "Approve" : "Missing required KYC documents"}
                            className={`p-1.5 rounded-lg transition-colors ${
                              kycOk
                                ? "bg-green-50 text-green-600 hover:bg-green-100"
                                : "bg-slate-100 text-slate-400 cursor-not-allowed"
                            }`}>
                            <FiCheck className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setRejectModal(s); setRejectReason(""); }}
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors" title="Reject">
                            <FiX className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* View detail modal */}
      {viewing && (() => {
        const kyc = kycStatus(viewing);
        const kycOk = kyc.missingRequired.length === 0;
        return (
          <Modal title={viewing.storeName} open={!!viewing} onClose={() => setViewing(null)} size="lg"
            footer={
              viewing.status === "PENDING" ? (
                <div className="flex gap-3 justify-end">
                  <button onClick={() => { setRejectModal(viewing); setRejectReason(""); setViewing(null); }}
                    className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50">
                    <FiX className="w-4 h-4" /> Reject
                  </button>
                  <button
                    onClick={() => handleApprove(viewing)}
                    disabled={approveMut.isPending || !kycOk}
                    title={kycOk ? "Approve seller" : `Cannot approve: missing ${kyc.missingRequired.map(d => d.label).join(", ")}`}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60">
                    <FiCheck className="w-4 h-4" />
                    {kycOk ? "Approve Seller" : "Missing KYC Documents"}
                  </button>
                </div>
              ) : undefined
            }
          >
            <div className="space-y-5 text-sm">
              {/* Status */}
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_STYLES[viewing.status]}`}>
                  {viewing.status === "PENDING" ? "Under Review" : viewing.status}
                  {viewing.rejectionReason && `: ${viewing.rejectionReason}`}
                </span>
              </div>

              {/* KYC alert */}
              {!kycOk && viewing.status === "PENDING" && (
                <div className="flex items-start gap-2 p-3 rounded-xl border border-amber-300 bg-amber-50">
                  <FiAlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-800">Cannot approve yet</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Missing required documents: <strong>{kyc.missingRequired.map(d => d.label).join(", ")}</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* Basic info */}
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Contact & Store</p>
                <div className="grid grid-cols-2 gap-3">
                  <InfoField icon={FiMail} label="Email" value={viewing.email} />
                  <InfoField icon={FiPhone} label="Phone" value={viewing.phone} />
                  <InfoField icon={FiShoppingCart} label="Store" value={viewing.storeName} />
                  <InfoField icon={FiCalendar} label="Applied" value={new Date(viewing.createdAt).toLocaleDateString("en-IN")} />
                  <InfoField icon={FiMapPin} label="Location" value={[viewing.addressLine, viewing.city, viewing.state].filter(Boolean).join(", ")} />
                  <InfoField icon={FiFileText} label="Description" value={viewing.description || "—"} />
                </div>
              </div>

              {/* Business docs */}
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Business Details</p>
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 rounded-xl p-3">
                  <span className="text-slate-500">GST Number</span><span className="font-medium">{viewing.gstNumber ?? "—"}</span>
                  <span className="text-slate-500">PAN Number</span><span className="font-medium">{viewing.panNumber ?? "—"}</span>
                  <span className="text-slate-500">Business Reg</span><span className="font-medium">{viewing.businessRegNumber ?? "—"}</span>
                  <span className="text-slate-500">Bank</span><span className="font-medium">{viewing.bankName ?? "—"}</span>
                  <span className="text-slate-500">IFSC</span><span className="font-medium">{viewing.bankIfsc ?? "—"}</span>
                  <span className="text-slate-500">Account</span>
                  <span className="font-medium">{viewing.bankAccountNumber ? `••••${viewing.bankAccountNumber.slice(-4)}` : "—"}</span>
                </div>
              </div>

              {/* Documents */}
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">KYC Documents ({kyc.uploaded}/{kyc.total})</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DOC_LIST.map(({ key, label, required }) => {
                    const url = sellerDoc(viewing, key);
                    return (
                      <div key={key} className={`p-2.5 rounded-lg border text-xs ${url ? "border-green-200 bg-green-50" : required ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"}`}>
                        <FiFileText className={`w-4 h-4 mb-1 ${url ? "text-green-600" : required ? "text-amber-500" : "text-slate-400"}`} />
                        <p className={`font-medium ${url ? "text-green-700" : required ? "text-amber-700" : "text-slate-500"}`}>{label}</p>
                        {required && !url && <p className="text-[10px] text-red-500 font-bold mt-0.5">Required</p>}
                        {url ? (
                          <a href={`http://localhost:8080${url}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">View</a>
                        ) : (
                          <span className="text-slate-400">Not uploaded</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Store images */}
              {(viewing.logoUrl || viewing.bannerUrl) && (
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Store Media</p>
                  <div className="flex gap-3 flex-wrap">
                    {viewing.logoUrl && (
                      <div className="text-center">
                        <img src={`http://localhost:8080${viewing.logoUrl}`} alt="Logo" className="w-20 h-20 rounded-xl object-cover border border-slate-200" />
                        <p className="text-xs text-slate-500 mt-1">Logo</p>
                      </div>
                    )}
                    {viewing.bannerUrl && (
                      <div className="text-center flex-1">
                        <img src={`http://localhost:8080${viewing.bannerUrl}`} alt="Banner" className="h-20 w-full rounded-xl object-cover border border-slate-200" />
                        <p className="text-xs text-slate-500 mt-1">Banner</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Modal>
        );
      })()}

      {/* Reject reason modal */}
      <Modal title="Reject Seller Application" open={!!rejectModal} onClose={() => setRejectModal(null)} size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setRejectModal(null)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700">Cancel</button>
            <button
              onClick={() => rejectModal && rejectMut.mutate({ id: rejectModal.id, reason: rejectReason })}
              disabled={rejectMut.isPending || !rejectReason.trim()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-red-700">
              Reject
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Please provide a reason for rejecting <strong>{rejectModal?.storeName}</strong>.</p>
          <textarea rows={4} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
            placeholder="e.g. Incomplete documents, invalid GST number..."
            className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 resize-none" />
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
