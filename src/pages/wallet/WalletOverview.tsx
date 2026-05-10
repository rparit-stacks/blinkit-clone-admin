import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPlatformWallet, getAllSellerWallets, getSellerTransactions,
  adminCreditSeller, adminDebitSeller,
  type AdminWallet,
} from "../../api/adminApi";
import { toast } from "sonner";
import clsx from "clsx";
import { FiCreditCard, FiTrendingUp, FiArrowUpRight, FiArrowDownLeft, FiSearch } from "react-icons/fi";

export default function WalletOverview() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedSeller, setSelectedSeller] = useState<AdminWallet | null>(null);
  const [adjustAction, setAdjustAction] = useState<"credit" | "debit" | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustNote, setAdjustNote] = useState("");

  const { data: platform } = useQuery({
    queryKey: ["admin", "wallet", "platform"],
    queryFn: getPlatformWallet,
  });

  const { data: sellerWallets = [], isLoading } = useQuery({
    queryKey: ["admin", "wallet", "sellers"],
    queryFn: getAllSellerWallets,
  });

  const { data: sellerTxs = [] } = useQuery({
    queryKey: ["admin", "wallet", "seller-tx", selectedSeller?.ownerId],
    queryFn: () => getSellerTransactions(selectedSeller!.ownerId),
    enabled: !!selectedSeller,
  });

  const creditMut = useMutation({
    mutationFn: ({ id, amount, note }: { id: string; amount: number; note: string }) =>
      adminCreditSeller(id, amount, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "wallet"] });
      toast.success("Amount credited to seller wallet");
      setAdjustAction(null); setAdjustAmount(""); setAdjustNote("");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const debitMut = useMutation({
    mutationFn: ({ id, amount, note }: { id: string; amount: number; note: string }) =>
      adminDebitSeller(id, amount, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "wallet"] });
      toast.success("Amount debited from seller wallet");
      setAdjustAction(null); setAdjustAmount(""); setAdjustNote("");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const filteredSellers = sellerWallets.filter(w => {
    if (!search) return true;
    return w.ownerId.toLowerCase().includes(search.toLowerCase());
  });

  const handleAdjust = () => {
    const amount = parseFloat(adjustAmount);
    if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }
    if (!selectedSeller) return;
    if (adjustAction === "credit") {
      creditMut.mutate({ id: selectedSeller.ownerId, amount, note: adjustNote || "Manual credit" });
    } else {
      debitMut.mutate({ id: selectedSeller.ownerId, amount, note: adjustNote || "Manual debit" });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Wallet Overview</h1>

      {/* Platform wallet */}
      {platform && (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <FiCreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-white/60 text-xs font-medium uppercase tracking-wide">Platform Wallet</p>
              <p className="text-white font-semibold">Commission & Platform Earnings</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Balance", value: `₹${platform.balanceRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` },
              { label: "Total Earned", value: `₹${platform.lifetimeEarnedRupees.toFixed(2)}` },
              { label: "Withdrawn", value: `₹${platform.lifetimeWithdrawnRupees.toFixed(2)}` },
              { label: "Pending", value: `₹${platform.pendingBalanceRupees.toFixed(2)}` },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-white/50 text-[10px] font-medium uppercase tracking-wide">{label}</p>
                <p className="text-lg font-bold mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seller wallets */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-900 flex-1">Seller Wallets</h2>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by seller ID..."
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-white rounded-xl border border-slate-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">Seller ID</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">Balance</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">Total Earned</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">Withdrawn</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSellers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 text-sm">No seller wallets found</td>
                  </tr>
                ) : filteredSellers.map(w => (
                  <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-mono text-xs text-slate-700">{w.ownerId}</p>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <p className="font-bold text-slate-900">₹{w.balanceRupees.toFixed(2)}</p>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <p className="text-green-700 font-medium">₹{w.lifetimeEarnedRupees.toFixed(2)}</p>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <p className="text-slate-500">₹{w.lifetimeWithdrawnRupees.toFixed(2)}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => { setSelectedSeller(w); setAdjustAction("credit"); }}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-semibold hover:bg-green-100"
                        >
                          <FiArrowDownLeft className="w-3 h-3" /> Credit
                        </button>
                        <button
                          onClick={() => { setSelectedSeller(w); setAdjustAction("debit"); }}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100"
                        >
                          <FiArrowUpRight className="w-3 h-3" /> Debit
                        </button>
                        <button
                          onClick={() => { setSelectedSeller(w); setAdjustAction(null); }}
                          className="px-2.5 py-1.5 text-slate-600 border border-slate-200 rounded-lg text-xs hover:bg-slate-50"
                        >
                          Txns
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: transactions or adjust */}
      {selectedSeller && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between sticky top-0 bg-white pb-2">
              <h2 className="text-lg font-bold text-slate-900">
                {adjustAction
                  ? `${adjustAction === "credit" ? "Credit" : "Debit"} — Seller Wallet`
                  : "Transaction History"}
              </h2>
              <button
                onClick={() => { setSelectedSeller(null); setAdjustAction(null); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500"
              >✕</button>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 text-sm">
              <p className="text-slate-500 text-xs">Seller ID</p>
              <p className="font-mono font-medium">{selectedSeller.ownerId}</p>
              <div className="flex gap-4 mt-2">
                <div>
                  <p className="text-slate-500 text-xs">Balance</p>
                  <p className="font-bold">₹{selectedSeller.balanceRupees.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Total Earned</p>
                  <p className="font-semibold text-green-700">₹{selectedSeller.lifetimeEarnedRupees.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {adjustAction ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Amount (₹)</label>
                  <input
                    type="number" min={1} step={1}
                    value={adjustAmount}
                    onChange={e => setAdjustAmount(e.target.value)}
                    placeholder="Enter amount in rupees"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Note</label>
                  <input
                    value={adjustNote}
                    onChange={e => setAdjustNote(e.target.value)}
                    placeholder={adjustAction === "credit" ? "Reason for credit..." : "Reason for debit..."}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleAdjust}
                  disabled={creditMut.isPending || debitMut.isPending}
                  className={clsx(
                    "w-full font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-60",
                    adjustAction === "credit"
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-red-600 text-white hover:bg-red-700"
                  )}
                >
                  {(creditMut.isPending || debitMut.isPending) ? "Processing…" :
                    `Confirm ${adjustAction === "credit" ? "Credit" : "Debit"}`}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Transactions</p>
                {sellerTxs.length === 0 ? (
                  <div className="py-8 text-center">
                    <FiTrendingUp className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">No transactions yet</p>
                  </div>
                ) : sellerTxs.map(tx => {
                  const isCredit = ["ORDER_EARNING", "REFUND", "MANUAL_CREDIT"].includes(tx.type);
                  return (
                    <div key={tx.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className={clsx("p-2 rounded-lg shrink-0", isCredit ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                        {isCredit ? <FiArrowDownLeft className="w-3.5 h-3.5" /> : <FiArrowUpRight className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-900 truncate">{tx.note || tx.type.replace(/_/g, " ")}</p>
                        <p className="text-[10px] text-slate-500">{new Date(tx.createdAt).toLocaleString()}</p>
                      </div>
                      <p className={clsx("text-sm font-bold shrink-0", isCredit ? "text-green-700" : "text-red-600")}>
                        {isCredit ? "+" : "-"}₹{tx.amountRupees.toFixed(2)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
