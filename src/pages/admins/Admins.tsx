import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdmins, createAdmin, deleteAdmin, type AdminAccount } from "../../api/adminApi";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/Modal";
import { statusBadge } from "../../components/Badge";
import { FiPlus, FiTrash2, FiShield } from "react-icons/fi";
import { toast } from "sonner";

const ROLES = ["SUPER_ADMIN", "MANAGER", "OPERATIONS", "SUPPORT"] as const;

const empty = () => ({ email: "", password: "", name: "", role: "MANAGER" as const });

export default function Admins() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(empty());

  const { data: admins = [], isLoading } = useQuery({ queryKey: ["admin","admins"], queryFn: getAdmins });

  const createMut = useMutation({
    mutationFn: createAdmin,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin","admins"] }); setModalOpen(false); setForm(empty()); toast.success("Admin created"); },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteAdmin(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin","admins"] }); toast.success("Admin removed"); },
    onError: (e) => toast.error((e as Error).message),
  });

  const roleColor: Record<string, string> = {
    SUPER_ADMIN: "bg-purple-100 text-purple-700",
    MANAGER: "bg-blue-100 text-blue-700",
    OPERATIONS: "bg-teal-100 text-teal-700",
    SUPPORT: "bg-orange-100 text-orange-700",
  };

  return (
    <div className="min-h-full">
      <PageHeader title="Admin Accounts" subtitle={`${admins.length} admins`}
        action={
          <button onClick={() => { setForm(empty()); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
            <FiPlus className="w-4 h-4" /> Add Admin
          </button>
        }
      />

      <div className="p-6">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Admin</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Created</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td></tr>
              )) : admins.map((a: AdminAccount) => (
                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs">
                        <FiShield className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{a.name}</p>
                        <p className="text-xs text-slate-400">{a.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleColor[a.role] ?? "bg-slate-100 text-slate-600"}`}>
                      {a.role.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">{statusBadge(a.active ? "ACTIVE" : "INACTIVE")}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {a.createdAt ? new Date(a.createdAt).toLocaleDateString("en-IN") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end">
                      <button onClick={() => { if (confirm(`Remove admin ${a.name}?`)) deleteMut.mutate(a.id); }}
                        className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && admins.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">No admin accounts</div>
          )}
        </div>
      </div>

      <Modal title="Create Admin Account" open={modalOpen} onClose={() => setModalOpen(false)}
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700">Cancel</button>
            <button onClick={() => createMut.mutate(form)} disabled={createMut.isPending}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-primary-700">
              {createMut.isPending ? "Creating…" : "Create Admin"}
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-sm">
          {([
            { label: "Full Name", key: "name" },
            { label: "Email", key: "email" },
            { label: "Password", key: "password" },
          ] as const).map(({ label, key }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
              <input
                type={key === "password" ? "password" : "text"}
                value={form[key]}
                onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/30"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Role</label>
            <select value={form.role} onChange={e => setForm(prev => ({ ...prev, role: e.target.value as typeof form.role }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/30">
              {ROLES.map(r => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
