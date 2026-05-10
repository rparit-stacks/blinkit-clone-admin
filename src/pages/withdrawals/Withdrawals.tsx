import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWithdrawals, approveWithdrawal, rejectWithdrawal,
  type AdminWithdrawal,
} from "../../api/adminApi";
import { toast } from "sonner";
import clsx from "clsx";
import { FiCheckCircle, FiXCircle, FiSearch, FiFilter } from "react-icons/fi";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  APPROVED: "bg-blue-100 text-blue-800 border-blue-200",
  PROCESSED: "bg-green-100 text-green-800 border-green-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
};

export default function Withdrawals() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminWithdrawal | null>(null);
  const [utrInput, setUtrInput] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  const { data: withdrawals = [], isLoading } = useQuery({
    queryKey: ["admin", "withdrawals", statusFilter],
    queryFn: () => getWithdrawals(statusFilter === "ALL" ? undefined : statusFilter),
  });

  const approveMut = useMutation({
    mutationFn: ({ id, utr }: { id: string; utr: string }) => approveWithdrawal(id, utr),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "withdrawals"] });
      toast.success("Withdrawal approved and marked as processed");
      setSelected(null); setAction(null); setUtrInput("");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectWithdrawal(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "withdrawals"] });
      toast.success("Withdrawal rejected, amount returned to wallet");
      setSelected(null); setAction(null); setRejectReason("");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const filtered = withdrawals.filter(w => {
    if (!search) return true;
    const q = search.toLowerCase();
    return w.ownerId.toLowerCase().includes(q)
      || (w.bankAccountNumber ?? "").toLowerCase().includes(q)
      || (w.upiId ?? "").toLowerCase().includes(q)
      || w.id.toLowerCase().includes(q);
  });

  const pendingCount = withdrawals.filter(w => w.status === "PENDING").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Withdrawal Requests</h1>
          <p className="text-slate-500 text-sm mt-1">
            {pendingCount > 0
              ? <span className="text-orange-600 font-semibold">{pendingCount} pending</span>
              : "All requests processed"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by seller ID, account, UPI..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <FiFilter className="w-4 h-4 text-slate-400" />
          {["ALL", "PENDING", "PROCESSED", "REJECTED"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={clsx(
                "px-3 py-2 rounded-xl text-xs font-semibold border transition-colors",
                statusFilter === s
                  ? "bg-blue-600 text-white border-blue-600"
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
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-xl border border-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">Seller</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">Amount</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">Method</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">Date</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400 text-sm">No withdrawal requests found</td>
                  </tr>
                ) : filtered.map(wd => (
                  <tr key={wd.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-900 font-mono text-xs">{wd.ownerId.slice(0, 12)}…</p>
                      <p className="text-xs text-slate-400">{wd.id.slice(0, 10)}…</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">₹{wd.amountRupees.toFixed(2)}</p>
                    </td>
                    <td className="py-3 px-4">
                      {wd.upiId ? (
                        <div>
                          <p className="text-xs font-medium">UPI</p>
                          <p className="text-xs text-slate-500 truncate max-w-[120px]">{wd.upiId}</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-medium">Bank</p>
                          <p className="text-xs text-slate-500">···{wd.bankAccountNumber?.slice(-4)}</p>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={clsx("text-xs font-bold px-2 py-1 rounded-full border", STATUS_COLORS[wd.status])}>
                        {wd.status}
                      </span>
                      {wd.utrReference && (
                        <p className="text-[10px] text-green-600 mt-0.5">UTR: {wd.utrReference}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-xs text-slate-600">{new Date(wd.createdAt).toLocaleDateString()}</p>
                      {wd.processedAt && (
                        <p className="text-[10px] text-slate-400">Processed: {new Date(wd.processedAt).toLocaleDateString()}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {wd.status === "PENDING" ? (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => { setSelected(wd); setAction("approve"); }}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors"
                          >
                            <FiCheckCircle className="w-3 h-3" /> Approve
                          </button>
                          <button
                            onClick={() => { setSelected(wd); setAction("reject"); }}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors"
                          >
                            <FiXCircle className="w-3 h-3" /> Reject
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelected(wd)}
                          className="px-2.5 py-1.5 text-slate-600 border border-slate-200 rounded-lg text-xs hover:bg-slate-50"
                        >
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {action === "approve" ? "Approve Withdrawal" : action === "reject" ? "Reject Withdrawal" : "Withdrawal Details"}
              </h2>
              <button onClick={() => { setSelected(null); setAction(null); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500">✕</button>
            </div>

            {/* Details */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Amount</span>
                <span className="font-bold text-slate-900">₹{selected.amountRupees.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Seller ID</span>
                <span className="font-mono text-xs">{selected.ownerId}</span>
              </div>
              {selected.upiId && (
                <div className="flex justify-between">
                  <span className="text-slate-500">UPI ID</span>
                  <span>{selected.upiId}</span>
                </div>
              )}
              {selected.bankAccountNumber && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account</span>
                    <span>{selected.bankAccountHolderName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">A/C Number</span>
                    <span className="font-mono">{selected.bankAccountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">IFSC</span>
                    <span className="font-mono">{selected.bankIfsc}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bank</span>
                    <span>{selected.bankName}</span>
                  </div>
                </>
              )}
              {selected.utrReference && (
                <div className="flex justify-between">
                  <span className="text-slate-500">UTR Reference</span>
                  <span className="font-mono text-green-700">{selected.utrReference}</span>
                </div>
              )}
              {selected.adminNote && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Admin Note</span>
                  <span className="text-red-600">{selected.adminNote}</span>
                </div>
              )}
            </div>

            {action === "approve" && (
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  UTR Reference Number <span className="text-slate-400">(optional)</span>
                </label>
                <input
                  value={utrInput}
                  onChange={e => setUtrInput(e.target.value)}
                  placeholder="Transaction reference from bank"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            )}

            {action === "reject" && (
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Rejection Reason</label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection..."
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>
            )}

            {action === "approve" && (
              <button
                onClick={() => approveMut.mutate({ id: selected.id, utr: utrInput })}
                disabled={approveMut.isPending}
                className="w-full bg-green-600 text-white font-semibold py-3 rounded-xl text-sm hover:bg-green-700 transition-colors disabled:opacity-60"
              >
                {approveMut.isPending ? "Processing…" : "Confirm Approval & Mark Processed"}
              </button>
            )}

            {action === "reject" && (
              <button
                onClick={() => rejectMut.mutate({ id: selected.id, reason: rejectReason || "Rejected by admin" })}
                disabled={rejectMut.isPending}
                className="w-full bg-red-600 text-white font-semibold py-3 rounded-xl text-sm hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {rejectMut.isPending ? "Processing…" : "Reject & Return Amount to Wallet"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
