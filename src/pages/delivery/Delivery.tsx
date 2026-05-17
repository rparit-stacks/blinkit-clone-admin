import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDeliveryPartners, approvePartner, blockPartner, deletePartner,
  type DeliveryPartner
} from "../../api/adminApi";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/Modal";
import { statusBadge } from "../../components/Badge";
import {
  FiCheck, FiSlash, FiCheckCircle, FiEye, FiTrash2, FiSearch,
  FiUser, FiPhone, FiMail, FiFileText, FiAlertCircle
} from "react-icons/fi";
import { toast } from "sonner";

type PartnerDocKey = "profileImage" | "idProofUrl" | "licenseUrl" | "vehicleImageUrl";

const DOC_LIST: { key: PartnerDocKey; label: string; required: boolean }[] = [
  { key: "profileImage", label: "Profile Photo", required: true },
  { key: "idProofUrl", label: "ID Proof", required: true },
  { key: "licenseUrl", label: "Driving License", required: true },
  { key: "vehicleImageUrl", label: "Vehicle Photo", required: false },
];

function partnerDoc(p: DeliveryPartner, key: PartnerDocKey): string | undefined {
  return p[key];
}

function kycStatus(p: DeliveryPartner) {
  const uploaded = DOC_LIST.filter((d) => !!partnerDoc(p, d.key));
  const missingRequired = DOC_LIST.filter((d) => d.required && !partnerDoc(p, d.key));
  return { uploaded: uploaded.length, total: DOC_LIST.length, missingRequired };
}

export default function Delivery() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [viewing, setViewing] = useState<DeliveryPartner | null>(null);

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ["admin", "delivery"],
    queryFn: getDeliveryPartners,
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => approvePartner(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "delivery"] });
      toast.success("Partner approved");
      setViewing(null);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const blockMut = useMutation({
    mutationFn: ({ id, block }: { id: string; block: boolean }) => blockPartner(id, block),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "delivery"] }),
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deletePartner(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "delivery"] });
      toast.success("Deleted");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const handleApprove = (p: DeliveryPartner) => {
    const { missingRequired } = kycStatus(p);
    if (missingRequired.length > 0) {
      toast.error(`Cannot approve: missing — ${missingRequired.map(d => d.label).join(", ")}`);
      return;
    }
    approveMut.mutate(p.id);
  };

  const filtered = partners
    .filter(p => filterStatus === "ALL" || p.status === filterStatus)
    .filter(p =>
      !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.includes(search) ||
      p.email?.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="min-h-full">
      <PageHeader title="Delivery Partners" subtitle={`${partners.length} partners`} />

      <div className="p-6 space-y-4">
        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, email..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/30 bg-white" />
          </div>
          <div className="flex gap-1.5">
            {["ALL", "PENDING", "APPROVED", "BLOCKED"].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                  filterStatus === s ? "bg-primary-600 text-white border-primary-600" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}>
                {s === "ALL" ? `All (${partners.length})` : `${s} (${partners.filter(p => p.status === s).length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Partner</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Vehicle</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">KYC</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Deliveries</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td></tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400 text-sm">No delivery partners found</td></tr>
              ) : filtered.map((p: DeliveryPartner) => {
                const kyc = kycStatus(p);
                const kycOk = kyc.missingRequired.length === 0;
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.profileImage ? (
                          <img src={`http://localhost:8080${p.profileImage}`}
                            alt={p.name} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-semibold text-xs">
                            {p.name?.charAt(0)?.toUpperCase() ?? "?"}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-900">{p.name}</p>
                          <p className="text-xs text-slate-400">{p.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <p className="font-medium">{p.vehicleType || "—"}</p>
                      {p.vehicleNumber && <p className="text-xs text-slate-400">{p.vehicleNumber}</p>}
                    </td>
                    <td className="px-4 py-3">{statusBadge(p.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {kycOk
                          ? <FiCheckCircle className="w-4 h-4 text-green-500" />
                          : <FiAlertCircle className="w-4 h-4 text-amber-500" />
                        }
                        <span className={`text-xs font-medium ${kycOk ? "text-green-600" : "text-amber-600"}`}>
                          {kyc.uploaded}/{kyc.total}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.totalDeliveries}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => setViewing(p)}
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200" title="View details">
                          <FiEye className="w-3.5 h-3.5" />
                        </button>
                        {p.status === "PENDING" && (
                          <button onClick={() => handleApprove(p)} disabled={approveMut.isPending}
                            title={kycOk ? "Approve" : "Missing required KYC"}
                            className={`p-1.5 rounded-lg transition-colors ${kycOk ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}>
                            <FiCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {p.status === "BLOCKED" ? (
                          <button onClick={() => blockMut.mutate({ id: p.id, block: false })}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100">
                            <FiCheckCircle className="w-3.5 h-3.5" /> Unblock
                          </button>
                        ) : p.status === "APPROVED" && (
                          <button onClick={() => blockMut.mutate({ id: p.id, block: true })}
                            className="p-1.5 rounded-lg text-xs font-medium bg-orange-50 text-orange-700 hover:bg-orange-100">
                            <FiSlash className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => { if (confirm("Delete this partner?")) deleteMut.mutate(p.id); }}
                          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* View modal */}
      {viewing && (() => {
        const kyc = kycStatus(viewing);
        const kycOk = kyc.missingRequired.length === 0;
        return (
          <Modal title={viewing.name} open={!!viewing} onClose={() => setViewing(null)} size="lg"
            footer={
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {viewing.status === "APPROVED" && (
                    <button onClick={() => blockMut.mutate({ id: viewing.id, block: true })}
                      className="flex items-center gap-2 px-4 py-2 border border-orange-300 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-50">
                      <FiSlash className="w-4 h-4" /> Block
                    </button>
                  )}
                  {viewing.status === "BLOCKED" && (
                    <button onClick={() => blockMut.mutate({ id: viewing.id, block: false })}
                      className="flex items-center gap-2 px-4 py-2 border border-blue-300 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50">
                      <FiCheckCircle className="w-4 h-4" /> Unblock
                    </button>
                  )}
                </div>
                {viewing.status === "PENDING" && (
                  <button onClick={() => handleApprove(viewing)} disabled={approveMut.isPending || !kycOk}
                    title={kycOk ? "Approve partner" : `Missing: ${kyc.missingRequired.map(d => d.label).join(", ")}`}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60">
                    <FiCheck className="w-4 h-4" />
                    {kycOk ? "Approve Partner" : "Missing KYC Documents"}
                  </button>
                )}
              </div>
            }
          >
            <div className="space-y-5 text-sm">
              {/* Status */}
              <div className="flex items-center gap-3">
                {statusBadge(viewing.status)}
                <span className="text-xs text-slate-400">{viewing.totalDeliveries ?? 0} deliveries · ⭐ {(viewing.rating ?? 0).toFixed(1)}</span>
                {viewing.online && <span className="flex items-center gap-1 text-xs font-medium text-green-600"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />Online</span>}
              </div>

              {/* KYC alert */}
              {!kycOk && viewing.status === "PENDING" && (
                <div className="flex items-start gap-2 p-3 rounded-xl border border-amber-300 bg-amber-50">
                  <FiAlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-800">Cannot approve yet</p>
                    <p className="text-xs text-amber-700 mt-0.5">Missing: <strong>{kyc.missingRequired.map(d => d.label).join(", ")}</strong></p>
                  </div>
                </div>
              )}

              {/* Profile image */}
              {viewing.profileImage && (
                <div className="flex items-center gap-4">
                  <img src={`http://localhost:8080${viewing.profileImage}`} alt={viewing.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-200" />
                  <div>
                    <p className="font-bold text-slate-900 text-base">{viewing.name}</p>
                    <p className="text-slate-500 text-sm">{viewing.phone}</p>
                    {viewing.email && <p className="text-slate-400 text-xs">{viewing.email}</p>}
                  </div>
                </div>
              )}

              {/* Contact details */}
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Contact & Vehicle</p>
                <div className="grid grid-cols-2 gap-3">
                  <InfoField icon={FiUser} label="Full Name" value={viewing.name} />
                  <InfoField icon={FiPhone} label="Phone" value={viewing.phone} />
                  {viewing.email && <InfoField icon={FiMail} label="Email" value={viewing.email} />}
                  <InfoField icon={FiFileText} label="Vehicle" value={`${viewing.vehicleType ?? "—"} ${viewing.vehicleNumber ? `· ${viewing.vehicleNumber}` : ""}`} />
                </div>
              </div>

              {/* Bank */}
              {(viewing.bankName || viewing.bankAccountNumber) && (
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Bank Details</p>
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 rounded-xl p-3">
                    <span className="text-slate-500">Bank</span><span className="font-medium">{viewing.bankName ?? "—"}</span>
                    <span className="text-slate-500">IFSC</span><span className="font-medium">{viewing.bankIfsc ?? "—"}</span>
                    <span className="text-slate-500">Account</span>
                    <span className="font-medium">{viewing.bankAccountNumber ? `••••${viewing.bankAccountNumber.slice(-4)}` : "—"}</span>
                    {viewing.upiId && <><span className="text-slate-500">UPI</span><span className="font-medium">{viewing.upiId}</span></>}
                  </div>
                </div>
              )}

              {/* Documents */}
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">KYC Documents ({kyc.uploaded}/{kyc.total})</p>
                <div className="grid grid-cols-2 gap-2">
                  {DOC_LIST.map(({ key, label, required }) => {
                    const url = partnerDoc(viewing, key);
                    return (
                      <div key={key} className={`p-2.5 rounded-lg border text-xs ${url ? "border-green-200 bg-green-50" : required ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"}`}>
                        <FiFileText className={`w-4 h-4 mb-1 ${url ? "text-green-600" : required ? "text-amber-500" : "text-slate-400"}`} />
                        <p className={`font-medium ${url ? "text-green-700" : required ? "text-amber-700" : "text-slate-500"}`}>{label}</p>
                        {required && !url && <p className="text-[10px] text-red-500 font-bold">Required</p>}
                        {url ? (
                          <a href={`http://localhost:8080${url}`} target="_blank" rel="noopener noreferrer"
                            className="text-green-600 hover:underline">View</a>
                        ) : (
                          <span className="text-slate-400">Not uploaded</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Modal>
        );
      })()}
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
