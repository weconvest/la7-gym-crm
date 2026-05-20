import React, { useState, useMemo } from "react";
import { Eye, Printer, Receipt, Download, X } from "lucide-react";
import {
  Btn,
  Card,
  StatusBadge,
  SearchBar,
  ChipGroup,
  Select,
  Input,
} from "./primitives.jsx";
import { useApp } from "../state/context.js";
import {
  fmtDate,
  fmtDateTime,
  fmtMoney,
  subStatus,
  invoiceNumber,
  paymentMethodLabel,
  paymentTotal,
  downloadCSV,
  todayISO,
  useDebounce,
} from "../lib/helpers.js";
import PaymentDetailModal from "./PaymentDetailModal.jsx";

export function FilterableMembersList({ onOpen }) {
  const { state } = useApp();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const dSearch = useDebounce(search, 200);

  const list = useMemo(() => {
    return state.members.filter(m => {
      if (dSearch) {
        const q = dSearch.toLowerCase();
        if (!m.name.toLowerCase().includes(q) && !m.phone.includes(dSearch)) return false;
      }
      if (statusFilter !== "All") {
        const subs = state.subscriptions.filter(s => s.memberId === m.id);
        const hasActive = subs.some(s => subStatus(s) === "active");
        if (statusFilter === "Active" && !hasActive) return false;
        if (statusFilter === "Expired" && hasActive) return false;
      }
      return true;
    });
  }, [state.members, state.subscriptions, dSearch, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or phone..." />
        <ChipGroup options={["All", "Active", "Expired"]} value={statusFilter} onChange={setStatusFilter} />
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead className="bg-[#0A0A0A]">
              <tr className="text-left text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-[#9A9A9A] font-mono">
                <th className="px-5 py-3.5">Name</th>
                <th className="px-5 py-3.5">Phone</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Subscriptions</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && <tr><td colSpan={4} className="px-5 py-10 text-center text-[#9A9A9A]">No members</td></tr>}
              {list.map(m => {
                const subs = state.subscriptions.filter(s => s.memberId === m.id);
                const active = subs.filter(s => subStatus(s) === "active").length;
                return (
                  <tr key={m.id} className="border-t border-[#262626] hover:bg-[#0A0A0A] cursor-pointer" onClick={() => onOpen(m.id)}>
                    <td className="px-5 py-3 font-bold text-[13px]">{m.name}</td>
                    <td className="px-5 py-3 font-mono text-[12px]">{m.phone}</td>
                    <td className="px-5 py-3"><StatusBadge status={active > 0 ? "active" : "expired"} /></td>
                    <td className="px-5 py-3 text-right text-[12px] text-[#9A9A9A] font-mono">{active} active / {subs.length} total</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export function FilterablePaymentsList({ exportable=false, scope=null, onView=null }) {
  const { state } = useApp();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [coachFilter, setCoachFilter] = useState("all");
  const [packageFilter, setPackageFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [methodFilter, setMethodFilter] = useState("All");
  const [detailPayment, setDetailPayment] = useState(null);
  const dSearch = useDebounce(search, 200);

  const allPackages = useMemo(() => {
    const set = new Set();
    state.subscriptions.forEach(s => set.add(s.packageName));
    return [...set].sort();
  }, [state.subscriptions]);

  const filtered = useMemo(() => {
    return state.payments.filter(p => {
      if (typeFilter !== "All" && p.type !== typeFilter) return false;
      if (methodFilter !== "All" && paymentMethodLabel(p) !== methodFilter) return false;

      const sub = state.subscriptions.find(s => s.id === p.subscriptionId);
      if (coachFilter !== "all" && sub?.instructorId !== coachFilter) return false;
      if (packageFilter !== "all" && sub?.packageName !== packageFilter) return false;

      if (dateFrom) {
        if (new Date(p.datetime) < new Date(dateFrom)) return false;
      }
      if (dateTo) {
        const t = new Date(dateTo); t.setHours(23,59,59,999);
        if (new Date(p.datetime) > t) return false;
      }
      if (dSearch) {
        const m = state.members.find(x => x.id === p.memberId);
        const q = dSearch.toLowerCase();
        const inv = invoiceNumber(p, state.payments).toLowerCase();
        if (!m?.name.toLowerCase().includes(q) && !m?.phone.includes(dSearch) && !inv.includes(q)) return false;
      }
      if (scope) return scope(p);
      return true;
    }).sort((a,b) => new Date(b.datetime) - new Date(a.datetime));
  }, [state.payments, state.subscriptions, state.members, typeFilter, methodFilter, coachFilter, packageFilter, dateFrom, dateTo, dSearch, scope]);

  const total = filtered.reduce((s,p) => s + paymentTotal(p), 0);

  const exportCsv = () => {
    const rows = filtered.map(p => {
      const m = state.members.find(x => x.id === p.memberId);
      const sub = state.subscriptions.find(s => s.id === p.subscriptionId);
      const coach = state.coaches.find(c => c.id === sub?.instructorId);
      const recordedBy = state.staff.find(s => s.id === p.recordedBy);
      return {
        invoice: invoiceNumber(p, state.payments),
        datetime: fmtDateTime(p.datetime),
        member_name: m?.name || "",
        member_phone: m?.phone || "",
        type: p.type,
        package: sub?.packageName || "",
        coach: coach?.name || "",
        method: paymentMethodLabel(p),
        amount: paymentTotal(p),
        recorded_by: recordedBy?.name || "",
      };
    });
    if (rows.length === 0) return;
    downloadCSV(`la7-payments-${fmtDate(todayISO())}.csv`, rows);
  };

  const clearFilters = () => {
    setSearch(""); setTypeFilter("All"); setCoachFilter("all"); setPackageFilter("all");
    setDateFrom(""); setDateTo(""); setMethodFilter("All");
  };

  return (
    <div className="space-y-5">
      <Card className="p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoice, member, phone..." />
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option>All</option><option>PT</option><option>Class</option><option>Nutrition</option>
          </Select>
          <Select value={coachFilter} onChange={(e) => setCoachFilter(e.target.value)}>
            <option value="all">All Coaches</option>
            {state.coaches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select value={packageFilter} onChange={(e) => setPackageFilter(e.target.value)}>
            <option value="all">All Packages</option>
            {allPackages.map(p => <option key={p} value={p}>{p}</option>)}
          </Select>
          <Select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}>
            <option>All</option><option>Cash</option><option>Visa</option><option>Bank Transfer</option><option>Split</option>
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="From" />
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="To" />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-[#262626]">
          <div className="text-[12px] font-mono text-[#9A9A9A]">
            <span className="text-[#F5F5F5] font-bold">{filtered.length}</span> records · Total <span className="text-[#F5F5F5] font-bold">{fmtMoney(total)}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Btn variant="ghost" size="sm" onClick={clearFilters}><X size={11} />Clear Filters</Btn>
            {exportable && <Btn variant="primary" size="sm" onClick={exportCsv}><Download size={12} />Export CSV</Btn>}
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-[#0A0A0A]">
              <tr className="text-left text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-[#9A9A9A] font-mono">
                <th className="px-5 py-3.5">Invoice #</th>
                <th className="px-5 py-3.5">Date / Time</th>
                <th className="px-5 py-3.5">Member</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Method</th>
                <th className="px-5 py-3.5">Recorded By</th>
                <th className="px-5 py-3.5 text-right">Amount</th>
                <th className="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={8} className="px-5 py-10 text-center text-[#9A9A9A]">No payments match filters</td></tr>}
              {filtered.map(p => {
                const m = state.members.find(x => x.id === p.memberId);
                const recordedBy = state.staff.find(s => s.id === p.recordedBy);
                const hasReceipt = !!p.bankTransferImage;
                return (
                  <tr key={p.id} className="border-t border-[#262626] hover:bg-[#0A0A0A]">
                    <td className="px-5 py-3 font-mono text-[11px] text-[#E5E5E5]">{invoiceNumber(p, state.payments)}</td>
                    <td className="px-5 py-3 font-mono text-[11px]">{fmtDateTime(p.datetime)}</td>
                    <td className="px-5 py-3 font-bold text-[12px]">{m?.name || "?"}</td>
                    <td className="px-5 py-3 text-[12px]">{p.type}</td>
                    <td className="px-5 py-3 text-[12px]">
                      <div className="flex items-center gap-2">
                        <span>{paymentMethodLabel(p)}</span>
                        {hasReceipt && <span title="Bank transfer receipt attached"><Receipt size={11} className="text-[#F5F5F5]" /></span>}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[12px] text-[#9A9A9A]">{recordedBy?.name || "—"}</td>
                    <td className="px-5 py-3 text-right font-mono text-[#F5F5F5]">{fmtMoney(paymentTotal(p))}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <Btn variant="ghost" size="sm" onClick={() => setDetailPayment(p)} title="View details"><Eye size={11} /></Btn>
                        {onView && <Btn variant="ghost" size="sm" onClick={() => onView(p)} title="Print invoice"><Printer size={11} /></Btn>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <PaymentDetailModal payment={detailPayment} onClose={() => setDetailPayment(null)} onPrint={onView} />
    </div>
  );
}
