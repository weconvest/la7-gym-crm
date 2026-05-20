import React, { useState, useMemo } from "react";
import {
  Lock,
  Plus,
  Edit2,
  Trash2,
  Check,
  Eye,
} from "lucide-react";
import {
  Btn,
  Card,
  Field,
  Input,
  Select,
  Modal,
  ConfirmModal,
  Tabs,
  StatusBadge,
  SearchBar,
  ChipGroup,
} from "./primitives.jsx";
import { useApp } from "../state/context.js";
import {
  uid,
  fmtDate,
  fmtMoney,
  subStatus,
  useDebounce,
} from "../lib/helpers.js";
import { canEditPackages } from "../lib/permissions.js";

export function PackageManagement() {
  const { state, dispatch, toast, session } = useApp();
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [search, setSearch] = useState("");
  const dSearch = useDebounce(search, 200);
  const isFounder = canEditPackages(session?.role);

  const list = useMemo(() => state.packages.filter(p => {
    if (!dSearch) return true;
    const q = dSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q);
  }), [state.packages, dSearch]);

  const blank = () => ({ id: "", type: "PT", name: "", sessions: 8, days: 30, price: 1000 });

  const save = () => {
    if (!editing.name.trim()) { toast("Package name required"); return; }
    if (Number(editing.price) <= 0) { toast("Price must be greater than 0"); return; }
    if (Number(editing.sessions) <= 0) { toast("Sessions must be greater than 0"); return; }
    if (Number(editing.days) <= 0) { toast("Days must be greater than 0"); return; }
    const pkg = {
      ...editing,
      sessions: Number(editing.sessions),
      days: Number(editing.days),
      price: Number(editing.price),
    };
    if (editing.id) dispatch({ type:"UPDATE_PACKAGE", pkg });
    else dispatch({ type:"ADD_PACKAGE", pkg: { ...pkg, id: "pkg-" + uid() } });
    toast("Package saved");
    setEditing(null);
  };

  const remove = (id) => {
    dispatch({ type:"DELETE_PACKAGE", id });
    toast("Package removed");
  };

  return (
    <div className="space-y-5">
      {!isFounder && (
        <Card className="p-4 flex items-center gap-3 border-[#F59E0B]/30 bg-[#F59E0B]/5">
          <Lock size={14} className="text-[#F59E0B]" />
          <span className="text-[12px] font-mono text-[#F59E0B]">Read-only — only the Founder can edit package prices.</span>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search packages..." />
        {isFounder && <Btn variant="primary" onClick={() => setEditing(blank())}><Plus size={14} />Add Package</Btn>}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-[#0A0A0A]">
              <tr className="text-left text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-[#9A9A9A] font-mono">
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Package Name</th>
                <th className="px-5 py-3.5 text-right">Sessions</th>
                <th className="px-5 py-3.5 text-right">Duration</th>
                <th className="px-5 py-3.5 text-right">Price</th>
                {isFounder && <th className="px-5 py-3.5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && <tr><td colSpan={isFounder ? 6 : 5} className="px-5 py-10 text-center text-[#9A9A9A]">No packages</td></tr>}
              {list.map(p => (
                <tr key={p.id} className="border-t border-[#262626] hover:bg-[#0A0A0A]">
                  <td className="px-5 py-3 text-[12px] uppercase tracking-wider font-bold">{p.type}</td>
                  <td className="px-5 py-3 text-[13px]">{p.name}</td>
                  <td className="px-5 py-3 text-right font-mono text-[12px]">{p.sessions}</td>
                  <td className="px-5 py-3 text-right font-mono text-[12px] text-[#9A9A9A]">{p.days}d</td>
                  <td className="px-5 py-3 text-right font-mono text-[#F5F5F5] font-bold">{fmtMoney(p.price)}</td>
                  {isFounder && (
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <Btn variant="ghost" size="sm" onClick={() => setEditing({ ...p })}><Edit2 size={11} /></Btn>
                        <Btn variant="danger" size="sm" onClick={() => setConfirm(p)}><Trash2 size={11} /></Btn>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit Package" : "Add Package"} maxWidth="max-w-lg">
        {editing && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Type" required>
                <Select value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })}>
                  <option value="PT">PT</option>
                  <option value="Class">Class</option>
                  <option value="Nutrition">Nutrition</option>
                </Select>
              </Field>
              <Field label="Name" required>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. PT Premium (24 sessions)" />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Sessions" required>
                <Input type="number" value={editing.sessions} onChange={(e) => setEditing({ ...editing, sessions: e.target.value })} min={1} />
              </Field>
              <Field label="Duration (days)" required>
                <Input type="number" value={editing.days} onChange={(e) => setEditing({ ...editing, days: e.target.value })} min={1} />
              </Field>
              <Field label="Price (EGP)" required>
                <Input type="number" value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} min={0} />
              </Field>
            </div>
            <div className="flex justify-end gap-3 pt-2 flex-wrap">
              <Btn variant="ghost" onClick={() => setEditing(null)}>Cancel</Btn>
              <Btn variant="primary" onClick={save}><Check size={12} />Save</Btn>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal open={!!confirm} onClose={() => setConfirm(null)} onConfirm={() => remove(confirm.id)}
        title="Remove Package" message={`Remove "${confirm?.name}"? Existing subscriptions are unaffected.`} />
    </div>
  );
}

export function UserManagement() {
  const { state, dispatch, toast } = useApp();
  const [tab, setTab] = useState("Coaches");
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [search, setSearch] = useState("");
  const dSearch = useDebounce(search, 200);

  const blank = (kind) => kind === "Coaches"
    ? { id: "", name: "", specialization: "", phone: "", email: "" }
    : { id: "", name: "", role: "front_desk", phone: "", email: "", paymentPin: "0000" };

  const save = () => {
    if (!editing.name.trim()) { toast("Name required"); return; }
    if (tab === "Coaches") {
      if (editing.id) dispatch({ type:"UPDATE_COACH", coach: editing });
      else dispatch({ type:"ADD_COACH", coach: { ...editing, id: "c" + uid() } });
    } else {
      if (editing.id) dispatch({ type:"UPDATE_STAFF", staff: editing });
      else dispatch({ type:"ADD_STAFF", staff: { ...editing, id: editing.role[0] + uid() } });
    }
    toast("Saved");
    setEditing(null);
  };

  const remove = (id) => {
    if (tab === "Coaches") dispatch({ type:"DELETE_COACH", id });
    else dispatch({ type:"DELETE_STAFF", id });
    toast("Removed");
  };

  const list = (tab === "Coaches" ? state.coaches : state.staff).filter(item => {
    if (!dSearch) return true;
    const q = dSearch.toLowerCase();
    return item.name.toLowerCase().includes(q) || item.email?.toLowerCase().includes(q) || item.phone?.includes(dSearch);
  });

  const roleLabels = {
    front_desk: "Front Desk",
    coaches_manager: "Coaches Manager",
    classes_manager: "Classes Manager",
    general_manager: "General Manager",
    accountant: "Accountant",
    founder: "Founder",
  };

  return (
    <div className="space-y-5">
      <Tabs tabs={["Coaches", "Staff & Managers"]} active={tab} onChange={setTab} />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." />
        <Btn variant="primary" onClick={() => setEditing(blank(tab))}><Plus size={14} />Add {tab === "Coaches" ? "Coach" : "User"}</Btn>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-[#0A0A0A]">
              <tr className="text-left text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-[#9A9A9A] font-mono">
                <th className="px-5 py-3.5">Name</th>
                <th className="px-5 py-3.5">{tab === "Coaches" ? "Specialization" : "Role"}</th>
                <th className="px-5 py-3.5">Phone</th>
                <th className="px-5 py-3.5">Email</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-[#9A9A9A]">No users</td></tr>}
              {list.map(item => (
                <tr key={item.id} className="border-t border-[#262626] hover:bg-[#0A0A0A]">
                  <td className="px-5 py-3 font-bold text-[13px]">{item.name}</td>
                  <td className="px-5 py-3 text-[12px] text-[#9A9A9A]">{tab === "Coaches" ? item.specialization : (roleLabels[item.role] || item.role)}</td>
                  <td className="px-5 py-3 font-mono text-[11px]">{item.phone}</td>
                  <td className="px-5 py-3 font-mono text-[11px]">{item.email}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <Btn variant="ghost" size="sm" onClick={() => setEditing({ ...item })}><Edit2 size={11} /></Btn>
                      <Btn variant="danger" size="sm" onClick={() => setConfirm({ id: item.id, name: item.name })}><Trash2 size={11} /></Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit" : "Add New"} maxWidth="max-w-lg">
        {editing && (
          <div className="space-y-4">
            <Field label="Name" required><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            {tab === "Coaches" ? (
              <Field label="Specialization"><Input value={editing.specialization} onChange={(e) => setEditing({ ...editing, specialization: e.target.value })} /></Field>
            ) : (
              <Field label="Role" required>
                <Select value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })}>
                  <option value="front_desk">Front Desk</option>
                  <option value="coaches_manager">Coaches Manager</option>
                  <option value="classes_manager">Classes Manager</option>
                  <option value="general_manager">General Manager</option>
                  <option value="accountant">Accountant</option>
                  <option value="founder">Founder</option>
                </Select>
              </Field>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Phone"><Input value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></Field>
              <Field label="Email"><Input value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></Field>
            </div>
            {tab !== "Coaches" && editing.role === "front_desk" && (
              <Field label="Payment PIN (4 digits)" hint="Used to confirm subscription payments. Default 0000.">
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={editing.paymentPin || ""}
                  onChange={(e) => setEditing({ ...editing, paymentPin: e.target.value.replace(/[^0-9]/g, "").slice(0,4) })}
                  placeholder="0000"
                />
              </Field>
            )}
            <div className="flex justify-end gap-3 pt-2 flex-wrap">
              <Btn variant="ghost" onClick={() => setEditing(null)}>Cancel</Btn>
              <Btn variant="primary" onClick={save}><Check size={12} />Save</Btn>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal open={!!confirm} onClose={() => setConfirm(null)} onConfirm={() => remove(confirm.id)}
        title="Confirm Removal" message={`Remove ${confirm?.name}? This cannot be undone.`} />
    </div>
  );
}

export function MemberManagement({ onOpen }) {
  const { state, dispatch, toast } = useApp();
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const dSearch = useDebounce(search, 200);

  const list = useMemo(() => state.members.filter(m => {
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
  }), [state.members, state.subscriptions, dSearch, statusFilter]);

  const save = () => {
    if (!editing.name.trim() || !editing.phone.trim()) { toast("Name and phone required"); return; }
    if (editing.id) dispatch({ type:"UPDATE_MEMBER", member: editing });
    else dispatch({ type:"ADD_MEMBER", member: { ...editing, id: "m" + uid() } });
    toast("Saved");
    setEditing(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search members..." />
          <ChipGroup options={["All", "Active", "Expired"]} value={statusFilter} onChange={setStatusFilter} />
        </div>
        <Btn variant="primary" onClick={() => setEditing({ id: "", name: "", phone: "" })}><Plus size={14} />Add Member</Btn>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[680px]">
            <thead className="bg-[#0A0A0A]">
              <tr className="text-left text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-[#9A9A9A] font-mono">
                <th className="px-5 py-3.5">Name</th>
                <th className="px-5 py-3.5">Phone</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Subscriptions</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-[#9A9A9A]">No members</td></tr>}
              {list.map(m => {
                const subs = state.subscriptions.filter(s => s.memberId === m.id);
                const active = subs.filter(s => subStatus(s) === "active").length;
                return (
                  <tr key={m.id} className="border-t border-[#262626] hover:bg-[#0A0A0A]">
                    <td className="px-5 py-3 font-bold text-[13px]">
                      <button onClick={() => onOpen(m.id)} className="hover:text-[#F5F5F5] transition-colors">{m.name}</button>
                    </td>
                    <td className="px-5 py-3 font-mono text-[12px]">{m.phone}</td>
                    <td className="px-5 py-3"><StatusBadge status={active > 0 ? "active" : "expired"} /></td>
                    <td className="px-5 py-3 text-[12px] text-[#9A9A9A] font-mono">{active} active / {subs.length} total</td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <Btn variant="ghost" size="sm" onClick={() => onOpen(m.id)}><Eye size={11} /></Btn>
                        <Btn variant="ghost" size="sm" onClick={() => setEditing({ ...m })}><Edit2 size={11} /></Btn>
                        <Btn variant="danger" size="sm" onClick={() => setConfirm(m)}><Trash2 size={11} /></Btn>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit Member" : "Add Member"} maxWidth="max-w-md">
        {editing && (
          <div className="space-y-4">
            <Field label="Name" required><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            <Field label="Phone" required><Input value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></Field>
            <div className="flex justify-end gap-3 pt-2 flex-wrap">
              <Btn variant="ghost" onClick={() => setEditing(null)}>Cancel</Btn>
              <Btn variant="primary" onClick={save}><Check size={12} />Save</Btn>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal open={!!confirm} onClose={() => setConfirm(null)}
        onConfirm={() => { dispatch({ type:"DELETE_MEMBER", id: confirm.id }); toast("Member removed"); }}
        title="Delete Member" message={`Permanently delete ${confirm?.name}? This removes all subscriptions, payments, and attendance.`} />
    </div>
  );
}

export function SubscriptionManagement() {
  const { state, dispatch, toast } = useApp();
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [search, setSearch] = useState("");
  const dSearch = useDebounce(search, 200);

  const list = useMemo(() => state.subscriptions.filter(s => {
    if (!dSearch) return true;
    const m = state.members.find(x => x.id === s.memberId);
    const q = dSearch.toLowerCase();
    return m?.name.toLowerCase().includes(q) || s.packageName.toLowerCase().includes(q);
  }).sort((a,b) => new Date(b.startDate) - new Date(a.startDate)), [state.subscriptions, state.members, dSearch]);

  const save = () => {
    dispatch({ type:"UPDATE_SUBSCRIPTION", subscription: editing });
    toast("Subscription updated");
    setEditing(null);
  };

  return (
    <div className="space-y-5">
      <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by member or package..." />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-[#0A0A0A]">
              <tr className="text-left text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-[#9A9A9A] font-mono">
                <th className="px-5 py-3.5">Member</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Package</th>
                <th className="px-5 py-3.5">Coach</th>
                <th className="px-5 py-3.5">Sessions</th>
                <th className="px-5 py-3.5">Ends</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map(s => {
                const m = state.members.find(x => x.id === s.memberId);
                const c = state.coaches.find(x => x.id === s.instructorId);
                const status = subStatus(s);
                return (
                  <tr key={s.id} className="border-t border-[#262626] hover:bg-[#0A0A0A]">
                    <td className="px-5 py-3 font-bold text-[13px]">{m?.name || "?"}</td>
                    <td className="px-5 py-3 text-[12px] uppercase tracking-wider">{s.type}</td>
                    <td className="px-5 py-3 text-[12px] text-[#9A9A9A]">{s.packageName}</td>
                    <td className="px-5 py-3 text-[12px]">{c?.name || "?"}</td>
                    <td className="px-5 py-3 font-mono text-[11px]">{s.sessionsRemaining} / {s.totalSessions}</td>
                    <td className="px-5 py-3 font-mono text-[11px]">{fmtDate(s.endDate)}</td>
                    <td className="px-5 py-3"><StatusBadge status={status} /></td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <Btn variant="ghost" size="sm" onClick={() => setEditing({ ...s })}><Edit2 size={11} /></Btn>
                        <Btn variant="danger" size="sm" onClick={() => setConfirm(s)}><Trash2 size={11} /></Btn>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Subscription" maxWidth="max-w-lg">
        {editing && (
          <div className="space-y-4">
            <Field label="Package Name"><Input value={editing.packageName} onChange={(e) => setEditing({ ...editing, packageName: e.target.value })} /></Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Sessions Remaining"><Input type="number" value={editing.sessionsRemaining} onChange={(e) => setEditing({ ...editing, sessionsRemaining: Number(e.target.value) })} /></Field>
              <Field label="Total Sessions"><Input type="number" value={editing.totalSessions} onChange={(e) => setEditing({ ...editing, totalSessions: Number(e.target.value) })} /></Field>
            </div>
            <Field label="End Date"><Input type="date" value={fmtDate(editing.endDate)} onChange={(e) => setEditing({ ...editing, endDate: new Date(e.target.value).toISOString() })} /></Field>
            <Field label="Coach">
              <Select value={editing.instructorId} onChange={(e) => setEditing({ ...editing, instructorId: e.target.value })}>
                {state.coaches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <div className="flex justify-end gap-3 pt-2 flex-wrap">
              <Btn variant="ghost" onClick={() => setEditing(null)}>Cancel</Btn>
              <Btn variant="primary" onClick={save}><Check size={12} />Save</Btn>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal open={!!confirm} onClose={() => setConfirm(null)}
        onConfirm={() => { dispatch({ type:"DELETE_SUBSCRIPTION", id: confirm.id }); toast("Subscription voided"); }}
        title="Void Subscription" message="Void this subscription? This action is permanent." />
    </div>
  );
}
