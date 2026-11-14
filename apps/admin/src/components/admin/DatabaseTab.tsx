"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Edit2,
  ExternalLink,
  Layers,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  TableProperties,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

type TableMeta = {
  key: string;
  label: string;
  category: string;
  primaryKey: string;
  rowCount: number;
};

type DbStats = {
  host: string;
  region: string;
  ssl: boolean;
  status: string;
  pingMs: number;
  totalTables: number;
  totalRows: number;
};

export default function DatabaseTab() {
  const [stats, setStats] = useState<DbStats | null>(null);
  const [tables, setTables] = useState<TableMeta[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("products");
  const [tableSearch, setTableSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Table rows state
  const [rows, setRows] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);
  const [searchRowQuery, setSearchRowQuery] = useState("");

  // Edit / Insert / Delete modals
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [showInsertModal, setShowInsertModal] = useState(false);
  const [rowFormData, setRowFormData] = useState<string>("{}");
  const [savingRow, setSavingRow] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Cell detail viewer modal
  const [viewingCell, setViewingCell] = useState<{ col: string; val: any } | null>(null);

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      setPage(1);
      fetchTableRows(selectedTable, 1);
    }
  }, [selectedTable]);

  async function fetchOverview() {
    setLoadingOverview(true);
    try {
      const res = await fetch("/api/admin/database?action=overview");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load database overview");

      setStats(data.stats);
      setTables(data.tables || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to connect to database");
    } finally {
      setLoadingOverview(false);
    }
  }

  async function fetchTableRows(tableKey: string, pageNum = 1) {
    setLoadingRows(true);
    try {
      const res = await fetch(`/api/admin/database?table=${encodeURIComponent(tableKey)}&page=${pageNum}&limit=50`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load table rows");

      setRows(data.rows || []);
      setColumns(data.columns || []);
      setTotalRows(data.total || 0);
      setPage(data.page || 1);
    } catch (err: any) {
      toast.error(err.message || "Failed to query table");
    } finally {
      setLoadingRows(false);
    }
  }

  async function handleSaveRow(isInsert: boolean) {
    let parsed: any;
    try {
      parsed = JSON.parse(rowFormData);
    } catch {
      toast.error("Invalid JSON syntax. Please verify the JSON format.");
      return;
    }

    setSavingRow(true);
    try {
      const activeMeta = tables.find((t) => t.key === selectedTable);
      const pk = activeMeta?.primaryKey || "id";

      let res: Response;
      if (isInsert) {
        res = await fetch(`/api/admin/database?table=${encodeURIComponent(selectedTable)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: parsed }),
        });
      } else {
        const idVal = editingRow[pk];
        res = await fetch(
          `/api/admin/database?table=${encodeURIComponent(selectedTable)}&id=${encodeURIComponent(idVal)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: parsed }),
          },
        );
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save row");

      toast.success(isInsert ? "Record inserted successfully" : "Record updated successfully");
      setShowInsertModal(false);
      setEditingRow(null);
      await fetchTableRows(selectedTable, page);
      await fetchOverview();
    } catch (err: any) {
      toast.error(err.message || "Failed to save record");
    } finally {
      setSavingRow(false);
    }
  }

  async function handleDeleteRow() {
    if (!deletingId) return;

    setDeleteLoading(true);
    try {
      const res = await fetch(
        `/api/admin/database?table=${encodeURIComponent(selectedTable)}&id=${encodeURIComponent(deletingId)}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete row");

      toast.success("Record deleted successfully");
      setDeletingId(null);
      await fetchTableRows(selectedTable, page);
      await fetchOverview();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete record");
    } finally {
      setDeleteLoading(false);
    }
  }

  const activeMeta = tables.find((t) => t.key === selectedTable);

  const categories = ["All", ...Array.from(new Set(tables.map((t) => t.category)))];

  const filteredTables = tables.filter((t) => {
    const matchesCat = selectedCategory === "All" || t.category === selectedCategory;
    const matchesSearch =
      !tableSearch ||
      t.key.toLowerCase().includes(tableSearch.toLowerCase()) ||
      t.label.toLowerCase().includes(tableSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const filteredRows = rows.filter((r) => {
    if (!searchRowQuery.trim()) return true;
    const q = searchRowQuery.toLowerCase().trim();
    return Object.values(r).some((val) => {
      if (val === null || val === undefined) return false;
      return String(val).toLowerCase().includes(q);
    });
  });

  return (
    <div className="space-y-6">
      {/* ─── 1. Header & Live Connection Status ──────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Database className="size-5 text-primary" />
            Database Explorer
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Direct web interface to inspect, query, and modify all Supabase PostgreSQL tables.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              fetchOverview();
              if (selectedTable) fetchTableRows(selectedTable, page);
            }}
            disabled={loadingOverview}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 ${loadingOverview ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ─── 2. Database Connection Card ─────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Server className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">
                  {stats?.host || "aws-1-ap-south-1.pooler.supabase.com (Supabase PostgreSQL)"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="size-2.5" /> Connected
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Engine: PostgreSQL 16 &bull; Region: {stats?.region || "ap-south-1 (Mumbai)"} &bull; SSL: Encrypted &bull; Ping: {stats?.pingMs ?? "~12"}ms
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Tables</div>
              <div className="font-black text-foreground text-sm">{stats?.totalTables ?? tables.length}</div>
            </div>
            <div className="border-l border-border pl-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Indexed Rows</div>
              <div className="font-black text-foreground text-sm">{stats?.totalRows?.toLocaleString() ?? "—"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. Main Explorer Layout (Sidebar + Data Grid) ───────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        {/* Left Column: Tables Sidebar */}
        <div className="rounded-2xl border border-border bg-card p-3 space-y-3 h-fit">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter tables..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-background py-1.5 pl-8 pr-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-1">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedCategory(c)}
                className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors ${
                  selectedCategory === c
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Table List */}
          <div className="space-y-0.5 max-h-[520px] overflow-y-auto pr-1">
            {filteredTables.map((t) => {
              const isActive = selectedTable === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setSelectedTable(t.key)}
                  className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                  }`}
                >
                  <span className="truncate">{t.label}</span>
                  <span
                    className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-mono ${
                      isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {t.rowCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Table Records */}
        <div className="space-y-4">
          {/* Active Table Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border bg-card p-3.5">
            <div>
              <div className="flex items-center gap-2">
                <TableProperties className="size-4 text-primary" />
                <h3 className="font-bold text-foreground text-sm font-mono">{selectedTable}</h3>
                <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  PK: {activeMeta?.primaryKey || "id"}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Showing {filteredRows.length} of {totalRows} records &bull; Page {page}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter rows..."
                  value={searchRowQuery}
                  onChange={(e) => setSearchRowQuery(e.target.value)}
                  className="rounded-xl border border-border bg-background py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setRowFormData("{\n  \n}");
                  setShowInsertModal(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90"
              >
                <Plus className="size-3.5" />
                Insert Row
              </button>
            </div>
          </div>

          {/* Rows Data Table */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {loadingRows ? (
              <div className="flex h-64 items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-primary" />
                Querying table {selectedTable}...
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="flex h-56 flex-col items-center justify-center p-6 text-center">
                <Layers className="size-8 text-muted-foreground/40" />
                <p className="mt-2 text-sm font-semibold text-foreground">No records found</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  This table is currently empty or matching no search filter.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[580px]">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="sticky top-0 z-10 border-b border-border bg-muted/80 backdrop-blur-sm text-[11px] font-bold uppercase text-muted-foreground">
                    <tr>
                      <th className="py-2.5 px-3 w-16 text-center">Action</th>
                      {columns.map((col) => (
                        <th key={col} className="py-2.5 px-3 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredRows.map((row, idx) => {
                      const pk = activeMeta?.primaryKey || "id";
                      const rowId = row[pk];

                      return (
                        <tr key={rowId || idx} className="hover:bg-muted/30 transition-colors">
                          <td className="py-2 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingRow(row);
                                  setRowFormData(JSON.stringify(row, null, 2));
                                }}
                                title="Edit Row"
                                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                              >
                                <Edit2 className="size-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingId(rowId)}
                                title="Delete Row"
                                className="rounded p-1 text-destructive/70 hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="size-3" />
                              </button>
                            </div>
                          </td>

                          {columns.map((col) => {
                            const val = row[col];
                            const isObj = val !== null && typeof val === "object";
                            const displayVal = isObj
                              ? JSON.stringify(val)
                              : val === null || val === undefined
                              ? "null"
                              : String(val);

                            return (
                              <td
                                key={col}
                                onClick={() => isObj || displayVal.length > 25 ? setViewingCell({ col, val }) : null}
                                className={`py-2 px-3 whitespace-nowrap max-w-xs truncate ${
                                  val === null ? "text-muted-foreground/40 italic" : "text-foreground"
                                } ${isObj || displayVal.length > 25 ? "cursor-pointer hover:underline text-primary" : ""}`}
                              >
                                {displayVal}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── MODAL 1: INSERT / EDIT ROW (JSON FORM) ───────────────────────── */}
      {(showInsertModal || editingRow) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <TableProperties className="size-4 text-primary" />
                {showInsertModal ? `Insert Row into ${selectedTable}` : `Edit Row in ${selectedTable}`}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowInsertModal(false);
                  setEditingRow(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Provide the record fields in JSON format:
            </p>

            <div className="mt-3">
              <textarea
                rows={12}
                value={rowFormData}
                onChange={(e) => setRowFormData(e.target.value)}
                className="w-full rounded-xl border border-border bg-background p-3 font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-3">
              <button
                type="button"
                onClick={() => {
                  setShowInsertModal(false);
                  setEditingRow(null);
                }}
                className="rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingRow}
                onClick={() => handleSaveRow(showInsertModal)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
              >
                {savingRow ? <Loader2 className="size-3.5 animate-spin" /> : null}
                {showInsertModal ? "Insert Record" : "Update Record"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: CELL VALUE INSPECTOR ────────────────────────────────── */}
      {viewingCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-foreground text-sm font-mono">
                Column: {viewingCell.col}
              </h3>
              <button
                type="button"
                onClick={() => setViewingCell(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-3 max-h-96 overflow-auto rounded-xl border border-border bg-background p-3 font-mono text-xs text-foreground">
              <pre className="whitespace-pre-wrap">
                {typeof viewingCell.val === "object"
                  ? JSON.stringify(viewingCell.val, null, 2)
                  : String(viewingCell.val)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: DELETE CONFIRMATION ──────────────────────────────────── */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-destructive/10 p-2 text-destructive">
                <AlertCircle className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-sm">Delete Record?</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Are you sure you want to permanently delete record{" "}
                  <span className="font-mono font-semibold text-foreground">{deletingId}</span> from table{" "}
                  <span className="font-mono font-semibold text-foreground">{selectedTable}</span>?
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDeleteRow}
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
