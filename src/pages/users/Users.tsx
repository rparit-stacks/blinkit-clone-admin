import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUsers, createUser, updateUser, blockUser, deleteUser, type AdminUser,
} from "../../api/adminApi";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/Modal";
import { statusBadge } from "../../components/Badge";
import { FiSearch, FiSlash, FiCheckCircle, FiTrash2, FiPlus, FiEdit2 } from "react-icons/fi";
import { toast } from "sonner";

type UserForm = { email: string; name: string; phone: string };

const emptyForm = (): UserForm => ({ email: "", name: "", phone: "" });

export default function Users() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);

  const { data: users = [], isLoading } = useQuery({ queryKey: ["admin", "users"], queryFn: getUsers });

  const saveMut = useMutation({
    mutationFn: () =>
      editingId ? updateUser(editingId, form) : createUser(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      setModalOpen(false);
      setEditingId(null);
      setForm(emptyForm());
      toast.success(editingId ? "User updated" : "User created");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const blockMut = useMutation({
    mutationFn: ({ id, block }: { id: string; block: boolean }) => blockUser(id, block),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "users"] }); toast.success("Updated"); },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "users"] }); toast.success("Deleted"); },
    onError: (e) => toast.error((e as Error).message),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (u: AdminUser) => {
    setEditingId(u.id);
    setForm({ email: u.email ?? "", name: u.name ?? "", phone: u.phone ?? "" });
    setModalOpen(true);
  };

  const filtered = users.filter(u =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const canSubmit = form.email.trim().length > 0;

  return (
    <div className="min-h-full">
      <PageHeader
        title="Users"
        subtitle={`${users.length} total users`}
        action={
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <FiPlus className="w-4 h-4" /> Add User
          </button>
        }
      />

      <div className="p-6 space-y-4">
        <div className="relative w-72">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/30" />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Joined</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td></tr>
                ))
              ) : filtered.map((user: AdminUser) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs shrink-0">
                        {user.name?.charAt(0)?.toUpperCase() ?? "?"}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{user.name || "—"}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{user.phone || "—"}</td>
                  <td className="px-4 py-3">{statusBadge(user.role)}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => openEdit(user)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        <FiEdit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      {user.role === "BLOCKED" ? (
                        <button type="button" onClick={() => blockMut.mutate({ id: user.id, block: false })}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                          <FiCheckCircle className="w-3.5 h-3.5" /> Unblock
                        </button>
                      ) : (
                        <button type="button" onClick={() => blockMut.mutate({ id: user.id, block: true })}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors">
                          <FiSlash className="w-3.5 h-3.5" /> Block
                        </button>
                      )}
                      <button type="button" onClick={() => { if (confirm("Delete user?")) deleteMut.mutate(user.id); }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors">
                        <FiTrash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">No users found</div>
          )}
        </div>
      </div>

      <Modal
        title={editingId ? "Edit user" : "Add user"}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingId(null); setForm(emptyForm()); }}
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => { setModalOpen(false); setEditingId(null); setForm(emptyForm()); }}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => saveMut.mutate()}
              disabled={!canSubmit || saveMut.isPending}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-primary-700"
            >
              {saveMut.isPending ? "Saving…" : editingId ? "Save changes" : "Create user"}
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-sm">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/30"
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/30"
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
            <input
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/30"
              placeholder="+91…"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
