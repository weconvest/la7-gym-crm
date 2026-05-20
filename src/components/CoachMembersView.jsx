import React, { useState, useMemo } from "react";
import { ChevronRight, Activity, Clock, Edit2 } from "lucide-react";
import {
  Btn,
  Card,
  Field,
  Select,
  Empty,
  Modal,
  ConfirmModal,
  StatusBadge,
  WarningBanner,
  SearchBar,
  ChipGroup,
} from "./primitives.jsx";
import { useApp } from "../state/context.js";
import {
  fmtDate,
  daysBetween,
  hoursBetween,
  subStatus,
  isExpiringSoon,
  useDebounce,
} from "../lib/helpers.js";
import {
  canDeductSubscription,
  COACH_COOLDOWN_HOURS,
} from "../lib/permissions.js";

export default function CoachMembersView({ coachId, onOpen, allowDeduct, deductedBy, deducterRole=null, viewerId=null, allowReassign }) {
  const { state, dispatch, toast } = useApp();
  const [filter, setFilter] = useState("All");
  const [reassignSub, setReassignSub] = useState(null);
  const [newCoachId, setNewCoachId] = useState("");
  const [confirmDeduct, setConfirmDeduct] = useState(null);
  const [search, setSearch] = useState("");
  const dSearch = useDebounce(search, 200);

  const subs = state.subscriptions.filter(s => s.instructorId === coachId && s.type !== "Nutrition");
  const filtered = subs.filter(s => filter === "All" ? true : (filter === "Active" ? subStatus(s) === "active" : subStatus(s) === "expired"));

  const memberSearched = (mid) => {
    if (!dSearch) return true;
    const m = state.members.find(x => x.id === mid);
    if (!m) return false;
    const q = dSearch.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.phone.includes(dSearch);
  };

  const byMember = {};
  filtered.forEach(s => {
    if (!memberSearched(s.memberId)) return;
    if (!byMember[s.memberId]) byMember[s.memberId] = [];
    byMember[s.memberId].push(s);
  });

  const cooldownInfo = (sub) => {
    if (deducterRole !== "coach") return { blocked: false };
    const last = sub.lastDeductionByCoach?.[viewerId];
    if (!last) return { blocked: false };
    const hrs = hoursBetween(last, new Date());
    if (hrs >= COACH_COOLDOWN_HOURS) return { blocked: false };
    return { blocked: true, hoursLeft: Math.ceil(COACH_COOLDOWN_HOURS - hrs) };
  };

  const canDeduct = (sub) => allowDeduct && canDeductSubscription(deducterRole, sub.type);

  const requestDeduct = (sub) => {
    if (!canDeduct(sub)) { toast("Unauthorized — your role cannot deduct this session type"); return; }
    if (sub.sessionsRemaining <= 0) { toast("No sessions remaining"); return; }
    const cd = cooldownInfo(sub);
    if (cd.blocked) { toast(`Cooldown — try again in ${cd.hoursLeft}h`); return; }
    setConfirmDeduct(sub);
  };

  const performDeduct = (sub) => {
    const cooldownKey = deducterRole === "coach" ? viewerId : null;
    dispatch({ type:"DEDUCT_SESSION", subscriptionId: sub.id, memberId: sub.memberId, deductedBy, cooldownKey });
    toast("Session deducted");
  };

  const doReassign = () => {
    if (!newCoachId) { toast("Pick a coach"); return; }
    dispatch({ type:"REASSIGN_COACH", subscriptionId: reassignSub.id, newCoachId });
    toast("Reassigned");
    setReassignSub(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <ChipGroup options={["All", "Active", "Expired"]} value={filter} onChange={setFilter} />
        <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search members..." />
      </div>

      {Object.keys(byMember).length === 0 && <Empty>No members in this view</Empty>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {Object.entries(byMember).map(([mid, mSubs]) => {
          const m = state.members.find(x => x.id === mid);
          if (!m) return null;
          return (
            <Card key={mid} className="p-5 sm:p-6" interactive>
              <div className="flex items-start justify-between gap-3 mb-3">
                <button onClick={() => onOpen && onOpen(mid)} className="text-left min-w-0 flex-1">
                  <div className="font-bold text-[14px] hover:text-[#F5F5F5] transition-colors truncate">{m.name}</div>
                  <div className="text-[11px] text-[#9A9A9A] font-mono">{m.phone}</div>
                </button>
                <ChevronRight size={16} className="text-[#3A3A3A] shrink-0 mt-1" />
              </div>
              <div className="space-y-3">
                {mSubs.map(sub => {
                  const status = subStatus(sub);
                  const expiring = isExpiringSoon(sub);
                  const daysLeft = daysBetween(new Date(), sub.endDate);
                  const cd = cooldownInfo(sub);
                  return (
                    <div key={sub.id} className="border-t border-[#262626] pt-3">
                      <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                        <div className="min-w-0">
                          <div className="text-[10px] text-[#9A9A9A] uppercase tracking-[0.18em] font-mono">{sub.type}</div>
                          <div className="text-[12px] break-words">{sub.packageName}</div>
                        </div>
                        <StatusBadge status={status} />
                      </div>
                      <div className="flex justify-between text-[11px] font-mono text-[#9A9A9A]">
                        <span>{sub.sessionsRemaining} / {sub.totalSessions} sessions</span>
                        <span>Ends {fmtDate(sub.endDate)}</span>
                      </div>
                      {expiring && (
                        <div className="mt-2"><WarningBanner>
                          {sub.sessionsRemaining <= 3 && `Low: ${sub.sessionsRemaining} sessions`}
                          {sub.sessionsRemaining <= 3 && daysLeft <= 7 && daysLeft > 0 && " · "}
                          {daysLeft <= 7 && daysLeft > 0 && `${daysLeft}d left`}
                        </WarningBanner></div>
                      )}
                      {cd.blocked && (
                        <div className="mt-2 text-[11px] font-mono text-[#7A7A7A] flex items-center gap-2">
                          <Clock size={11} />Cooldown — {cd.hoursLeft}h left
                        </div>
                      )}
                      {(canDeduct(sub) || allowReassign) && status === "active" && (
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {canDeduct(sub) && <Btn variant="primary" size="sm" onClick={() => requestDeduct(sub)} disabled={sub.sessionsRemaining <= 0 || cd.blocked}><Activity size={11} />Deduct</Btn>}
                          {allowReassign && <Btn variant="ghost" size="sm" onClick={() => { setReassignSub(sub); setNewCoachId(""); }}><Edit2 size={11} />Reassign</Btn>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      <ConfirmModal
        open={!!confirmDeduct}
        onClose={() => setConfirmDeduct(null)}
        onConfirm={() => performDeduct(confirmDeduct)}
        title="Confirm Session Deduction"
        message={confirmDeduct ? `Deduct 1 session from ${confirmDeduct.packageName}? After this, ${confirmDeduct.sessionsRemaining - 1} session(s) will remain.` : ""}
        confirmText="Deduct Session"
        danger={false}
      />

      <Modal open={!!reassignSub} onClose={() => setReassignSub(null)} title="Reassign Subscription to Coach" maxWidth="max-w-md">
        <Field label="New Coach" required>
          <Select value={newCoachId} onChange={(e) => setNewCoachId(e.target.value)}>
            <option value="">— Select coach —</option>
            {state.coaches.filter(c => c.id !== reassignSub?.instructorId).map(c => (
              <option key={c.id} value={c.id}>{c.name} — {c.specialization}</option>
            ))}
          </Select>
        </Field>
        <div className="flex justify-end gap-3 mt-6 flex-wrap">
          <Btn variant="ghost" onClick={() => setReassignSub(null)}>Cancel</Btn>
          <Btn variant="primary" onClick={doReassign}>Reassign</Btn>
        </div>
      </Modal>
    </div>
  );
}
