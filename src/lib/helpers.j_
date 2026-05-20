import { useState, useEffect } from "react";

// ============================================================================
// ID + DATE HELPERS
// ============================================================================
export const uid = () => Math.random().toString(36).slice(2, 10);

export const fmtDateTime = (iso) => {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(
    d.getHours()
  )}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

export const fmtDate = (iso) => {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export const todayISO = () => new Date().toISOString();

export const daysBetween = (a, b) =>
  Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86400000);

export const hoursBetween = (a, b) =>
  (new Date(b).getTime() - new Date(a).getTime()) / 3600000;

export const isSameDay = (a, b) => {
  const da = new Date(a),
    db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
};

export const isSameMonth = (a, b) => {
  const da = new Date(a),
    db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth();
};

export const isSameYear = (a, b) =>
  new Date(a).getFullYear() === new Date(b).getFullYear();

// ============================================================================
// SUBSCRIPTION STATUS
// ============================================================================
export const subStatus = (sub) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(sub.endDate);
  end.setHours(23, 59, 59, 999);
  return sub.sessionsRemaining > 0 && end >= today ? "active" : "expired";
};

export const isExpiringSoon = (sub) => {
  if (subStatus(sub) !== "active") return false;
  return sub.sessionsRemaining <= 3 || daysBetween(new Date(), sub.endDate) <= 7;
};

// ============================================================================
// MONEY + INVOICE
// ============================================================================
export const fmtMoney = (n) => `EGP ${Number(n || 0).toLocaleString()}`;

// Invoice numbering: INV-YYYYMM-{4digit seq}
export const invoiceNumber = (payment, allPayments) => {
  const d = new Date(payment.datetime);
  const yymm = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
  const sameMonth = allPayments
    .filter((p) => isSameMonth(p.datetime, payment.datetime))
    .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
  const idx = sameMonth.findIndex((p) => p.id === payment.id);
  return `INV-${yymm}-${String(idx + 1).padStart(4, "0")}`;
};

// Payment method label (handles split payments)
export const paymentMethodLabel = (p) => {
  if (p.splits && p.splits.length > 1) return "Split";
  return p.method || p.splits?.[0]?.method || "—";
};

export const paymentTotal = (p) => {
  if (p.splits && p.splits.length)
    return p.splits.reduce((s, x) => s + Number(x.amount || 0), 0);
  return Number(p.amount || 0);
};

// ============================================================================
// HOOKS
// ============================================================================
// Debounce hook for search
export const useDebounce = (value, delay = 250) => {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
};

// ============================================================================
// CSV EXPORT
// ============================================================================
export const downloadCSV = (filename, rows) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
