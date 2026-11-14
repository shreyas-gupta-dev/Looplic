"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User,
  UserCheck,
  UserCog,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "sonner";

type ManagedUser = {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  role: "admin" | "operation" | "technician" | "user";
  emailConfirmed: boolean;
  lastSignInAt: string | null;
  createdAt: string | null;
  address?: string;
  city?: string;
};

const ROLE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: any }
> = {
  admin: {
    label: "Admin",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    icon: ShieldAlert,
  },
  operation: {
    label: "Operator",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    icon: Shield,
  },
  technician: {
    label: "Technician",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    icon: Wrench,
  },
  user: {
    label: "Customer",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    icon: User,
  },
};

export default function UsersTab() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [passwordModalUser, setPasswordModalUser] = useState<ManagedUser | null>(null);
  const [deleteModalUser, setDeleteModalUser] = useState<ManagedUser | null>(null);

  // Form states
  const [addForm, setAddForm] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    role: "user",
  });
  const [addLoading, setAddLoading] = useState(false);

  const [roleFormRole, setRoleFormRole] = useState<string>("user");
  const [roleLoading, setRoleLoading] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load users");
      setUsers(data.users || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load user list");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.email || !addForm.password) return;

    setAddLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create user");

      toast.success("User created successfully!");
      setShowAddModal(false);
      setAddForm({ email: "", password: "", fullName: "", phone: "", role: "user" });
      await fetchUsers(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to create user");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleUpdateRole(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;

    setRoleLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: editingUser.id, role: roleFormRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update role");

      toast.success(`Role updated to ${roleFormRole}!`);
      setEditingUser(null);
      await fetchUsers(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to update role");
    } finally {
      setRoleLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordModalUser || !newPassword.trim()) return;

    setPasswordLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: passwordModalUser.id, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");

      toast.success("Password updated successfully!");
      setPasswordModalUser(null);
      setNewPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password");
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleDeleteUser() {
    if (!deleteModalUser) return;

    setDeleteLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: deleteModalUser.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user");

      toast.success("User deleted successfully!");
      setDeleteModalUser(null);
      await fetchUsers(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    } finally {
      setDeleteLoading(false);
    }
  }

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesRole = selectedRole === "all" || u.role === selectedRole;
    const query = search.toLowerCase().trim();
    const matchesSearch =
      !query ||
      u.email.toLowerCase().includes(query) ||
      u.fullName.toLowerCase().includes(query) ||
      u.phone.toLowerCase().includes(query);
    return matchesRole && matchesSearch;
  });

  // Role stats
  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const techCount = users.filter((u) => u.role === "technician").length;
  const opCount = users.filter((u) => u.role === "operation").length;
  const customerCount = users.filter((u) => u.role === "user").length;

  return (
    <div className="space-y-6">
      {/* Header and Stats */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Users &amp; Staff Management</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage all customer accounts, assign operator &amp; technician staff roles, and reset credentials.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchUsers(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="size-3.5" />
            Add User / Staff
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-2xl border border-border bg-card p-3.5">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Accounts</div>
          <div className="mt-1 text-2xl font-black text-foreground">{totalUsers}</div>
        </div>
        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.04] p-3.5">
          <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1">
            <ShieldAlert className="size-3" /> Admins
          </div>
          <div className="mt-1 text-2xl font-black text-foreground">{adminCount}</div>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-3.5">
          <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <Shield className="size-3" /> Operators
          </div>
          <div className="mt-1 text-2xl font-black text-foreground">{opCount}</div>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-3.5">
          <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <Wrench className="size-3" /> Technicians
          </div>
          <div className="mt-1 text-2xl font-black text-foreground">{techCount}</div>
        </div>
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] p-3.5 col-span-2 sm:col-span-1">
          <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
            <User className="size-3" /> Customers
          </div>
          <div className="mt-1 text-2xl font-black text-foreground">{customerCount}</div>
        </div>
      </div>

      {/* Controls: Search & Role Filter Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-card py-2 pl-9 pr-3 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: `All (${totalUsers})` },
            { id: "admin", label: `Admins (${adminCount})` },
            { id: "operation", label: `Operators (${opCount})` },
            { id: "technician", label: `Technicians (${techCount})` },
            { id: "user", label: `Customers (${customerCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedRole(tab.id)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                selectedRole === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {loading ? (
          <div className="flex h-60 items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary" />
            Loading accounts...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex h-52 flex-col items-center justify-center p-6 text-center">
            <Users className="size-8 text-muted-foreground/50" />
            <p className="mt-2 text-sm font-semibold text-foreground">No accounts found</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {search ? "Try clearing your search query." : "No accounts under this role category."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 hidden md:table-cell">Created</th>
                  <th className="py-3 px-4 hidden lg:table-cell">Last Sign In</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((u) => {
                  const roleBadge = ROLE_CONFIG[u.role] || ROLE_CONFIG.user;
                  const RoleIcon = roleBadge.icon;

                  return (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {(u.fullName || u.email || "U").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-foreground">
                              {u.fullName || "—"}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-mono">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-muted-foreground">
                          {u.phone ? (
                            <span className="font-mono text-foreground">{u.phone}</span>
                          ) : (
                            "—"
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${roleBadge.bg} ${roleBadge.color} border ${roleBadge.border}`}
                        >
                          <RoleIcon className="size-3" />
                          {roleBadge.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-muted-foreground hidden md:table-cell">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                      </td>

                      <td className="py-3.5 px-4 text-muted-foreground hidden lg:table-cell">
                        {u.lastSignInAt ? new Date(u.lastSignInAt).toLocaleString() : "Never"}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Change Role Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUser(u);
                              setRoleFormRole(u.role);
                            }}
                            title="Change Role"
                            className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          >
                            <UserCog className="size-3.5" />
                          </button>

                          {/* Reset Password Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setPasswordModalUser(u);
                              setNewPassword("");
                            }}
                            title="Reset Password"
                            className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          >
                            <KeyRound className="size-3.5" />
                          </button>

                          {/* Delete User Button */}
                          <button
                            type="button"
                            onClick={() => setDeleteModalUser(u)}
                            title="Delete Account"
                            className="rounded-lg border border-border p-1.5 text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-colors"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── MODAL 1: ADD USER / STAFF ────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <UserCheck className="size-4 text-primary" />
                Add User or Staff Account
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={addForm.fullName}
                  onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background py-2 px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="user@looplic.com"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background py-2 px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background py-2 px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background py-2 px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Assigned Role</label>
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background py-2 px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="user">Customer (Normal User)</option>
                  <option value="technician">Technician (Service App Access)</option>
                  <option value="operation">Operator (Operations Desk Access)</option>
                  <option value="admin">Admin (Full System Access)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
                >
                  {addLoading ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: CHANGE ROLE ─────────────────────────────────────────── */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <UserCog className="size-4 text-primary" />
                Change Role
              </h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-3 text-xs text-muted-foreground">
              User: <span className="font-bold text-foreground">{editingUser.fullName || editingUser.email}</span>
            </div>

            <form onSubmit={handleUpdateRole} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Select New Role</label>
                <div className="mt-2 space-y-2">
                  {[
                    { id: "user", label: "Customer", desc: "Browse store, book repairs, track orders." },
                    { id: "technician", label: "Technician", desc: "Access technician portal & inspect assigned orders." },
                    { id: "operation", label: "Operator", desc: "Manage bookings, assign riders, dispatch jobs." },
                    { id: "admin", label: "Admin", desc: "Full administrative permissions across all apps." },
                  ].map((r) => (
                    <label
                      key={r.id}
                      className={`flex items-start gap-2.5 rounded-xl border p-2.5 text-xs cursor-pointer transition-colors ${
                        roleFormRole === r.id
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border bg-background text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <input
                        type="radio"
                        name="roleSelect"
                        value={r.id}
                        checked={roleFormRole === r.id}
                        onChange={(e) => setRoleFormRole(e.target.value)}
                        className="mt-0.5 text-primary"
                      />
                      <div>
                        <div className="font-bold text-foreground">{r.label}</div>
                        <div className="text-[11px] text-muted-foreground">{r.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={roleLoading}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
                >
                  {roleLoading ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  Update Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: RESET PASSWORD ──────────────────────────────────────── */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <KeyRound className="size-4 text-primary" />
                Reset Password
              </h3>
              <button
                type="button"
                onClick={() => setPasswordModalUser(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Set a new password for <span className="font-bold text-foreground">{passwordModalUser.email}</span>:
            </p>

            <form onSubmit={handleResetPassword} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Enter at least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background py-2 px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setPasswordModalUser(null)}
                  className="rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading || newPassword.length < 6}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
                >
                  {passwordLoading ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: DELETE CONFIRMATION ──────────────────────────────────── */}
      {deleteModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-destructive/10 p-2 text-destructive">
                <AlertCircle className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-sm">Delete Account?</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Are you sure you want to permanently delete{" "}
                  <span className="font-semibold text-foreground">{deleteModalUser.email}</span>? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteModalUser(null)}
                className="rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDeleteUser}
                className="inline-flex items-center gap-1.5 rounded-xl bg-destructive px-4 py-2 text-xs font-bold text-destructive-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
              >
                {deleteLoading ? <Loader2 className="size-3.5 animate-spin" /> : null}
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
