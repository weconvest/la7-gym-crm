import React, { useState, useMemo } from "react";
import { Activity, Check } from "lucide-react";
import {
  Btn,
  Card,
  Field,
  SearchBar,
  WarningBanner,
  ConfirmModal,
} from "./primitives.jsx";
import { useApp } from "../state/context.js";
import {
  fmtDate,
  daysBetween,
  subStatus,
  isExpiringSoon,
  useDebounce,
} from "../lib/helpers.js";

export default function CheckInPanel({ deductedBy }) {
  const { state, dispatch, toast } = useApp();
  const [search, setSearch] = useState("");
  const [pickedId, setPickedId] = useState(null);
  const [confirmSub, setConfirmSub] = useState(null);
  const dSearch = useDebounce(search, 200);

  const matches = useMemo(() => state.members.filter(m =>
    dSearch && (m.name.toLowerCase().includes(dSearch.toLowerCase()) || m.phone.includes(dSearch))
  ).slice(0, 6), [state.members, dSearch]);

  const member = pickedId ? state.members.find(m => m.id === pickedId) : null;
  const classSubs = member ? state.subscriptions.filter(s => s.memberId === member.id && s.type === "Class" && subStatus(s) === "active") : [];

  const performCheckIn = (sub) => {
    if (sub.sessionsRemaining <= 0) { toast("No sessions remaining"); return; }
    dispatch({ type:"DEDUCT_SESSION", subscriptionId: sub.id, memberId: member.id, deductedBy });
    toast(`Checked in ${member.name}`);
  };

  return (
    <Card className="p-5 sm:p-7">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[13px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
          <Activity size={14} className="text-[#E5E5E5]" />Member Check-In (Class)
        </h3>
      </div>
      <Field label="Search by Name or Phone">
        <SearchBar value={search} onChange={(e) => { setSearch(e.target.value); setPickedId(null); }} placeholder="Type to search..." />
      </Field>
      {dSearch && !pickedId && (
        <div className="border border-[#262626] mt-3 max-h-56 overflow-y-auto">
          {matches.length === 0 && <div className="px-4 py-3 text-[12px] text-[#9A9A9A]">No members found</div>}
          {matches.map(m => (
            <button key={m.id} type="button" onClick={() => { setPickedId(m.id); setSearch(m.name); }}
              className="w-full text-left px-4 py-3 hover:bg-[#1F1F1F] transition-colors border-b border-[#262626] last:border-0">
              <div className="font-bold text-[13px]">{m.name}</div>
              <div className="text-[11px] text-[#9A9A9A] font-mono">{m.phone}</div>
            </button>
          ))}
        </div>
      )}
      {member && (
        <div className="mt-5 space-y-3">
          <div className="text-[10px] text-[#9A9A9A] uppercase tracking-[0.2em] font-mono">Active Class Subscriptions</div>
          {classSubs.length === 0 && (
            <div className="border border-[#262626] p-4 text-[13px] text-[#9A9A9A] font-mono">No active class subscription for this member.</div>
          )}
          {classSubs.map(sub => {
            const expiring = isExpiringSoon(sub);
            const daysLeft = daysBetween(new Date(), sub.endDate);
            return (
              <div key={sub.id} className="border border-[#262626] p-4 hover:border-[#3A3A3A] transition-colors">
                <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                  <div className="min-w-0">
                    <div className="font-bold text-[13px]">{sub.packageName}</div>
                    <div className="text-[11px] text-[#9A9A9A] font-mono mt-1">Sessions: <span className="text-[#F5F5F5]">{sub.sessionsRemaining}</span> / {sub.totalSessions} · Ends {fmtDate(sub.endDate)}</div>
                  </div>
                  <Btn variant="primary" size="sm" onClick={() => setConfirmSub(sub)} disabled={sub.sessionsRemaining <= 0}>
                    <Check size={12} />Check In
                  </Btn>
                </div>
                {expiring && (
                  <WarningBanner>
                    {sub.sessionsRemaining <= 3 && `Only ${sub.sessionsRemaining} sessions left. `}
                    {daysLeft <= 7 && daysLeft > 0 && `Ends in ${daysLeft} days.`}
                  </WarningBanner>
                )}
              </div>
            );
          })}
        </div>
      )}
      <ConfirmModal
        open={!!confirmSub}
        onClose={() => setConfirmSub(null)}
        onConfirm={() => performCheckIn(confirmSub)}
        title="Confirm Check-In"
        message={confirmSub && member ? `Check in ${member.name} for ${confirmSub.packageName}? This will deduct 1 session.` : ""}
        confirmText="Check In"
        danger={false}
      />
    </Card>
  );
}
