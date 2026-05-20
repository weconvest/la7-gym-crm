import React, { useState } from "react";
import {
  ArrowLeft,
  Phone,
  Plus,
  Activity,
  Clock,
  Eye,
  Printer,
  Receipt,
} from "lucide-react";
import {
  Btn,
  Card,
  Empty,
  Modal,
  ConfirmModal,
  Tabs,
  StatusBadge,
  WarningBanner,
} from "./primitives.jsx";
import { useApp } from "../state/context.js";
import {
  fmtDate,
  fmtDateTime,
  fmtMoney,
  daysBetween,
  hoursBetween,
  subStatus,
  isExpiringSoon,
  invoiceNumber,
  paymentMethodLabel,
  paymentTotal,
} from "../lib/helpers.js";
import {
  canDeductSubscription,
  COACH_COOLDOWN_HOURS,
} from "../lib/permissions.js";
import AddSubscriptionForm from "./AddSubscriptionForm.jsx";
import InvoicePrint from "./InvoicePrint.jsx";
import PaymentDetailModal from "./PaymentDetailModal.jsx";

export default function MemberProfile({ memberId, onBack, allowDeduct=false, deductedBy, deducterRole=null, hideNutrition=false, allowAddSubscription=false, viewerRole=null, viewerId=null, requirePin=false }) {
  const { state, dispatch, toast } = useApp();
  const [tab, setTab] = useState("Overview");
  const [confirmDeduct, setConfirmDeduct] = useState(null);
  const [showAddSub, setShowAddSub] = useState(false);
  const [printPay, setPrintPay] = useState(null);
  const [detailPayment, setDetailPayment] = useState(null);

  const member = state.members.find(m => m.id === memberId);
  if (!member) return <Empty>Member not found</Empty>;

  const allSubs = state.subscriptions.filter(s => s.memberId === memberId);
  const subs = hideNutrition ? allSubs.filter(s => s.type !== "Nutrition") : allSubs;
  const subIdsVisible = new Set(subs.map(s => s.id));
  const allPays = state.payments.filter(p => p.memberId === memberId);
  const pays = (hideNutrition ? allPays.filter(p => p.type !== "Nutrition") : allPays)
    .sort((a,b) => new Date(b.datetime) - new Date(a.datetime));
  const allAtts = state.attendance.filter(a => a.memberId === memberId);
  const atts = (hideNutrition ? allAtts.filter(a => subIdsVisible.has(a.subscriptionId)) : allAtts)
    .sort((a,b) => new Date(b.datetime) - new Date(a.datetime));

  const activeSubs = subs.filter(s => subStatus(s) === "active");
  const expiringSubs = activeSubs.filter(isExpiringSoon);

  // Cooldown check — only normal coaches are restricted
  const cooldownInfo = (sub) => {
    if (deducterRole !== "coach") return { blocked: false };
    const last = sub.lastDeductionByCoach?.[viewerId];
    if (!last) return { blocked: false };
    const hrs = hoursBetween(last, new Date());
    if (hrs >= COACH_COOLDOWN_HOURS) return { blocked: false };
    return { blocked: true, hoursLeft: Math.ceil(COACH_COOLDOWN_HOURS - hrs), lastAt: last };
  };

  // Centralized permission check — frontend mirrors reducer enforcement
  const canDeduct = (sub) => allowDeduct && canDeductSubscription(deducterRole, sub.type);

  const requestDeduct = (sub) => {
    if (!canDeduct(sub)) { toast("Unauthorized — your role cannot deduct this session type"); return; }
    if (sub.sessionsRemaining <= 0) { toast("Cannot deduct — no sessions remaining"); return; }
    const cd = cooldownInfo(sub);
    if (cd.blocked) { toast(`Cooldown — try again in ${cd.hoursLeft}h`); return; }
    setConfirmDeduct(sub);
  };

  const performDeduct = (sub) => {
    const cooldownKey = deducterRole === "coach" ? viewerId : null;
    dispatch({ type:"DEDUCT_SESSION", subscriptionId: sub.id, memberId, deductedBy, cooldownKey });
    toast(`Session deducted for ${member.name}`);
  };

  const coachName = (id) => state.coaches.find(c => c.id === id)?.name || "—";
  const staffName = (id) => state.staff.find(s => s.id === id)?.name || state.coaches.find(c => c.id === id)?.name || "—";

  if (printPay) {
    const sub = state.subscriptions.find(s => s.id === printPay.subscriptionId);
    const coach = state.coaches.find(c => c.id === sub?.instructorId);
    const recordedBy = state.staff.find(s => s.id === printPay.recordedBy);
    return <InvoicePrint payment={printPay} member={member} subscription={sub} coach={coach} recordedBy={recordedBy} allPayments={state.payments} onClose={() => setPrintPay(null)} />;
  }

  return (
    <div className="space-y-7">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
          {onBack && <Btn variant="ghost" size="sm" onClick={onBack}><ArrowLeft size={14} /><span className="hidden sm:inline">Back</span></Btn>}
          <div className="flex-1 min-w-0">
            <h2 className="text-[22px] sm:text-[28px] leading-tight font-black uppercase tracking-[0.04em] break-words">{member.name}</h2>
            <p className="text-[12px] text-[#9A9A9A] font-mono mt-2 flex items-center gap-2">
              <Phone size={12} /> {member.phone}
            </p>
          </div>
        </div>
        {allowAddSubscription && (
          <Btn variant="primary" size="sm" onClick={() => setShowAddSub(true)}><Plus size={14} />New Subscription</Btn>
        )}
      </div>

      {expiringSubs.length > 0 && (
        <WarningBanner>
          {expiringSubs.length} subscription{expiringSubs.length > 1 ? "s" : ""} expiring soon (≤3 sessions or ≤7 days)
        </WarningBanner>
      )}

      <Tabs tabs={["Overview", "Payment History", "Attendance History"]} active={tab} onChange={setTab} />

      {tab === "Overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {subs.length === 0 && <Empty>No subscriptions</Empty>}
          {subs.map(sub => {
            const status = subStatus(sub);
            const expiring = isExpiringSoon(sub);
            const daysLeft = daysBetween(new Date(), sub.endDate);
            const cd = cooldownInfo(sub);
            return (
              <Card key={sub.id} className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <div className="text-[10px] text-[#9A9A9A] uppercase tracking-[0.18em] font-mono mb-1.5">{sub.type}</div>
                    <div className="font-bold text-[14px] sm:text-[15px] break-words">{sub.packageName}</div>
                    <div className="text-[12px] text-[#9A9A9A] mt-1 font-mono">Coach: {coachName(sub.instructorId)}</div>
                  </div>
                  <StatusBadge status={status} />
                </div>
                <div className="grid grid-cols-2 gap-3 my-4 pt-4 border-t border-[#262626]">
                  <div>
                    <div className="text-[10px] text-[#9A9A9A] uppercase tracking-[0.18em] font-mono mb-1">Sessions</div>
                    <div className="font-mono text-[18px]"><span className="text-[#F5F5F5]">{sub.sessionsRemaining}</span> <span className="text-[#5A5A5A]">/ {sub.totalSessions}</span></div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#9A9A9A] uppercase tracking-[0.18em] font-mono mb-1">Expires</div>
                    <div className="font-mono text-[14px]">{fmtDate(sub.endDate)}</div>
                    <div className="text-[11px] text-[#7A7A7A] font-mono">{daysLeft > 0 ? `${daysLeft}d left` : "expired"}</div>
                  </div>
                </div>
                {expiring && status === "active" && (
                  <WarningBanner>
                    {sub.sessionsRemaining <= 3 && `Only ${sub.sessionsRemaining} sessions left.`}
                    {daysLeft <= 7 && daysLeft > 0 && ` Ends in ${daysLeft} days.`}
                  </WarningBanner>
                )}
                {cd.blocked && (
                  <div className="mt-3 text-[11px] font-mono text-[#7A7A7A] flex items-center gap-2">
                    <Clock size={12} />Cooldown active — {cd.hoursLeft}h remaining
                  </div>
                )}
                {allowDeduct && canDeduct(sub) && status === "active" && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Btn variant="primary" size="sm" onClick={() => requestDeduct(sub)} disabled={sub.sessionsRemaining <= 0 || cd.blocked}>
                      <Activity size={12} />Deduct Session
                    </Btn>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {tab === "Payment History" && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[680px]">
              <thead className="bg-[#0A0A0A]">
                <tr className="text-left text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-[#9A9A9A] font-mono">
                  <th className="px-5 py-3.5">Invoice #</th>
                  <th className="px-5 py-3.5">Date / Time</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Method</th>
                  <th className="px-5 py-3.5">Recorded By</th>
                  <th className="px-5 py-3.5 text-right">Amount</th>
                  <th className="px-5 py-3.5"></th>
                </tr>
              </thead>
              <tbody>
                {pays.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-[#9A9A9A]">No payments</td></tr>}
                {pays.map(p => (
                  <tr key={p.id} className="border-t border-[#262626] hover:bg-[#0A0A0A]">
                    <td className="px-5 py-3 font-mono text-[11px] text-[#E5E5E5]">{invoiceNumber(p, state.payments)}</td>
                    <td className="px-5 py-3 font-mono text-[11px]">{fmtDateTime(p.datetime)}</td>
                    <td className="px-5 py-3 text-[12px]">{p.type}</td>
                    <td className="px-5 py-3 text-[12px]">
                      <div className="flex items-center gap-2">
                        <span>{paymentMethodLabel(p)}</span>
                        {p.bankTransferImage && <span title="Bank transfer receipt"><Receipt size={11} className="text-[#F5F5F5]" /></span>}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[12px] text-[#9A9A9A]">{staffName(p.recordedBy)}</td>
                    <td className="px-5 py-3 text-right font-mono text-[#F5F5F5]">{fmtMoney(paymentTotal(p))}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <Btn variant="ghost" size="sm" onClick={() => setDetailPayment(p)} title="View details"><Eye size={12} /></Btn>
                        <Btn variant="ghost" size="sm" onClick={() => setPrintPay(p)} title="Print invoice"><Printer size={12} /></Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "Attendance History" && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead className="bg-[#0A0A0A]">
                <tr className="text-left text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-[#9A9A9A] font-mono">
                  <th className="px-5 py-3.5">Date / Time</th>
                  <th className="px-5 py-3.5">Subscription</th>
                  <th className="px-5 py-3.5">Logged By</th>
                </tr>
              </thead>
              <tbody>
                {atts.length === 0 && <tr><td colSpan={3} className="px-5 py-8 text-center text-[#9A9A9A]">No check-ins</td></tr>}
                {atts.map(a => {
                  const sub = subs.find(s => s.id === a.subscriptionId);
                  return (
                    <tr key={a.id} className="border-t border-[#262626] hover:bg-[#0A0A0A]">
                      <td className="px-5 py-3 font-mono text-[11px]">{fmtDateTime(a.datetime)}</td>
                      <td className="px-5 py-3 text-[12px]">{sub?.packageName || "—"}</td>
                      <td className="px-5 py-3 text-[12px] text-[#9A9A9A]">{staffName(a.deductedBy)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ConfirmModal
        open={!!confirmDeduct}
        onClose={() => setConfirmDeduct(null)}
        onConfirm={() => performDeduct(confirmDeduct)}
        title="Confirm Session Deduction"
        message={confirmDeduct ? `Deduct 1 session from ${confirmDeduct.packageName}? After this, ${confirmDeduct.sessionsRemaining - 1} session(s) will remain.` : ""}
        confirmText="Deduct Session"
        danger={false}
      />

      <Modal open={showAddSub} onClose={() => setShowAddSub(false)} title="New Subscription">
        <AddSubscriptionForm
          presetMember={member}
          onClose={() => setShowAddSub(false)}
          recordedBy={deductedBy}
          requirePin={requirePin}
        />
      </Modal>

      <PaymentDetailModal payment={detailPayment} onClose={() => setDetailPayment(null)} onPrint={(p) => setPrintPay(p)} />
    </div>
  );
}
