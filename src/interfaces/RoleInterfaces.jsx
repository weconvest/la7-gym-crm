import React, { useState } from "react";
import {
  UserPlus,
  Search,
  ChevronRight,
} from "lucide-react";
import {
  Btn,
  Card,
  Modal,
  SearchBar,
  Select,
  SectionHeader,
} from "../components/primitives.jsx";
import { useApp } from "../state/context.js";
import { useDebounce } from "../lib/helpers.js";
import Shell from "./Shell.jsx";
import RevenueDashboard from "../components/RevenueDashboard.jsx";
import MemberProfile from "../components/MemberProfile.jsx";
import CheckInPanel from "../components/CheckInPanel.jsx";
import CoachMembersView from "../components/CoachMembersView.jsx";
import AddSubscriptionForm from "../components/AddSubscriptionForm.jsx";
import InvoicePrint from "../components/InvoicePrint.jsx";
import {
  FilterableMembersList,
  FilterablePaymentsList,
} from "../components/FilterableLists.jsx";
import {
  PackageManagement,
  UserManagement,
  MemberManagement,
  SubscriptionManagement,
} from "../components/Management.jsx";

export function FrontDeskInterface({ user, onLogout }) {
  const [active, setActive] = useState("Dashboard");
  const [view, setView] = useState("Main");
  const [memberId, setMemberId] = useState(null);
  const [showAddSub, setShowAddSub] = useState(false);
  const [printPay, setPrintPay] = useState(null);
  const { state } = useApp();

  const openMember = (id) => { setMemberId(id); setView("Member"); };

  if (printPay) {
    const m = state.members.find(x => x.id === printPay.memberId);
    const sub = state.subscriptions.find(s => s.id === printPay.subscriptionId);
    const coach = state.coaches.find(c => c.id === sub?.instructorId);
    const recordedBy = state.staff.find(s => s.id === printPay.recordedBy);
    return <Shell user={user} role="front_desk" onLogout={onLogout} nav={[]} active="" onNav={() => {}}>
      <InvoicePrint payment={printPay} member={m} subscription={sub} coach={coach} recordedBy={recordedBy} allPayments={state.payments} onClose={() => setPrintPay(null)} />
    </Shell>;
  }

  if (view === "Member") {
    return <Shell user={user} role="front_desk" onLogout={onLogout} nav={[]} active="" onNav={() => {}}>
      <MemberProfile memberId={memberId} onBack={() => setView("Main")} allowDeduct deductedBy={user.id} deducterRole="front_desk" allowAddSubscription viewerId={user.id} requirePin />
    </Shell>;
  }

  return (
    <Shell user={user} role="front_desk" onLogout={onLogout}
      nav={["Dashboard", "Members", "Payments", "Revenue"]} active={active} onNav={(t) => { setActive(t); setView("Main"); }}>
      {active === "Dashboard" && (
        <div className="space-y-7">
          <SectionHeader title="Front Desk" sublabel="New subscriptions & member check-in"
            action={<Btn variant="primary" onClick={() => setShowAddSub(true)}><UserPlus size={14} />New Subscription</Btn>} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <CheckInPanel deductedBy={user.id} />
            <Card className="p-5 sm:p-7">
              <h3 className="text-[13px] font-bold uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
                <Search size={14} className="text-[#E5E5E5]" />Quick Member Lookup
              </h3>
              <MemberQuickList onOpen={openMember} />
            </Card>
          </div>
        </div>
      )}
      {active === "Members" && (
        <div className="space-y-6">
          <SectionHeader title="Members" sublabel="Browse, search & filter all members" />
          <FilterableMembersList onOpen={openMember} />
        </div>
      )}
      {active === "Payments" && (
        <div className="space-y-6">
          <SectionHeader title="Payments" sublabel="All recorded payments with full filters" />
          <FilterablePaymentsList exportable onView={setPrintPay} />
        </div>
      )}
      {active === "Revenue" && <RevenueDashboard />}

      <Modal open={showAddSub} onClose={() => setShowAddSub(false)} title="New Subscription">
        <AddSubscriptionForm onClose={() => setShowAddSub(false)} recordedBy={user.id} requirePin />
      </Modal>
    </Shell>
  );
}

export function MemberQuickList({ onOpen }) {
  const { state } = useApp();
  const [search, setSearch] = useState("");
  const dSearch = useDebounce(search, 200);
  const list = state.members.filter(m => !dSearch || m.name.toLowerCase().includes(dSearch.toLowerCase()) || m.phone.includes(dSearch)).slice(0, 8);
  return (
    <div>
      <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or phone..." />
      <div className="mt-3 divide-y divide-[#262626]">
        {list.map(m => (
          <button key={m.id} onClick={() => onOpen(m.id)} className="w-full text-left px-2 py-3 hover:bg-[#1F1F1F] transition-colors flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-bold text-[13px] truncate">{m.name}</div>
              <div className="text-[11px] text-[#9A9A9A] font-mono">{m.phone}</div>
            </div>
            <ChevronRight size={14} className="text-[#3A3A3A] shrink-0" />
          </button>
        ))}
        {list.length === 0 && <div className="text-[12px] text-[#9A9A9A] py-5 text-center font-mono">No members</div>}
      </div>
    </div>
  );
}


export function GeneralManagerInterface({ user, onLogout }) {
  return (
    <Shell user={user} role="general_manager" onLogout={onLogout} nav={[]} active="" onNav={() => {}}>
      <RevenueDashboard />
    </Shell>
  );
}


export function CoachesManagerInterface({ user, onLogout }) {
  const { state } = useApp();
  const [active, setActive] = useState("Revenue");
  const [view, setView] = useState("List");
  const [memberId, setMemberId] = useState(null);
  const [coachFilter, setCoachFilter] = useState("all");

  const renderCoachView = () => {
    if (view === "Member") {
      return <MemberProfile memberId={memberId} onBack={() => setView("List")} allowDeduct deductedBy={user.id} deducterRole="coaches_manager" hideNutrition viewerId={user.id} />;
    }
    const coaches = coachFilter === "all" ? state.coaches : state.coaches.filter(c => c.id === coachFilter);
    return (
      <div className="space-y-7">
        <SectionHeader title="Coach Members" sublabel="View & manage all coach subscriptions"
          action={
            <Select value={coachFilter} onChange={(e) => setCoachFilter(e.target.value)} className="max-w-xs">
              <option value="all">All Coaches</option>
              {state.coaches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          } />
        {coaches.map(c => (
          <div key={c.id} className="space-y-4">
            <div className="flex items-center gap-3 pt-3 pb-2 border-b border-[#262626]">
              <div className="w-1 h-5 bg-[#F5F5F5]" />
              <h3 className="text-[16px] sm:text-[18px] font-black uppercase tracking-[0.1em]">{c.name}</h3>
              <span className="text-[11px] sm:text-[12px] text-[#9A9A9A] font-mono">— {c.specialization}</span>
            </div>
            <CoachMembersView coachId={c.id} onOpen={(id) => { setMemberId(id); setView("Member"); }}
              allowDeduct deductedBy={user.id} deducterRole="coaches_manager" allowReassign />
          </div>
        ))}
      </div>
    );
  };

  return (
    <Shell user={user} role="coaches_manager" onLogout={onLogout} nav={["Revenue", "Coaches"]} active={active} onNav={(t) => { setActive(t); setView("List"); }}>
      {active === "Revenue" && <RevenueDashboard perCoach hideNutrition />}
      {active === "Coaches" && renderCoachView()}
    </Shell>
  );
}


export function ClassesManagerInterface({ user, onLogout }) {
  return (
    <Shell user={user} role="classes_manager" onLogout={onLogout} nav={[]} active="" onNav={() => {}}>
      <RevenueDashboard classOnly title="Classes Revenue" subtitle="Class income overview & per-instructor breakdown" />
    </Shell>
  );
}


export function CoachInterface({ user, onLogout }) {
  const [active, setActive] = useState("My Members");
  const [view, setView] = useState("List");
  const [memberId, setMemberId] = useState(null);

  return (
    <Shell user={user} role="coach" onLogout={onLogout} nav={["My Members", "My Income"]} active={active} onNav={(t) => { setActive(t); setView("List"); }}>
      {view === "Member" ? (
        <MemberProfile memberId={memberId} onBack={() => setView("List")} allowDeduct deductedBy={user.id} deducterRole="coach" hideNutrition viewerId={user.id} />
      ) : (
        <>
          {active === "My Members" && (
            <div className="space-y-7">
              <SectionHeader title="My Members" sublabel="Manage your assigned subscriptions · Cooldown: 1 deduction / 12h" />
              <CoachMembersView coachId={user.id} onOpen={(id) => { setMemberId(id); setView("Member"); }} allowDeduct deductedBy={user.id} deducterRole="coach" viewerId={user.id} />
            </div>
          )}
          {active === "My Income" && <RevenueDashboard coachId={user.id} hideNutrition title="My Income" subtitle="Income from PT subscriptions you instruct" />}
        </>
      )}
    </Shell>
  );
}


export function AccountantInterface({ user, onLogout }) {
  const [active, setActive] = useState("Payments");
  const [printPay, setPrintPay] = useState(null);
  const { state } = useApp();

  if (printPay) {
    const m = state.members.find(x => x.id === printPay.memberId);
    const sub = state.subscriptions.find(s => s.id === printPay.subscriptionId);
    const coach = state.coaches.find(c => c.id === sub?.instructorId);
    const recordedBy = state.staff.find(s => s.id === printPay.recordedBy);
    return <Shell user={user} role="accountant" onLogout={onLogout} nav={[]} active="" onNav={() => {}}>
      <InvoicePrint payment={printPay} member={m} subscription={sub} coach={coach} recordedBy={recordedBy} allPayments={state.payments} onClose={() => setPrintPay(null)} />
    </Shell>;
  }

  return (
    <Shell user={user} role="accountant" onLogout={onLogout} nav={["Payments", "Invoices", "Revenue"]} active={active} onNav={setActive}>
      {active === "Payments" && (
        <div className="space-y-6">
          <SectionHeader title="Payments Ledger" sublabel="All payments with full filters & CSV export" />
          <FilterablePaymentsList exportable onView={setPrintPay} />
        </div>
      )}
      {active === "Invoices" && (
        <div className="space-y-6">
          <SectionHeader title="Invoices" sublabel="Browse, view & print any invoice" />
          <FilterablePaymentsList exportable onView={setPrintPay} />
        </div>
      )}
      {active === "Revenue" && <RevenueDashboard perCoach />}
    </Shell>
  );
}


export function FounderInterface({ user, onLogout }) {
  const [active, setActive] = useState("Revenue");
  const [view, setView] = useState("Main");
  const [memberId, setMemberId] = useState(null);
  const [coachFilter, setCoachFilter] = useState("all");
  const [printPay, setPrintPay] = useState(null);
  const { state } = useApp();

  const openMember = (id) => { setMemberId(id); setView("Member"); };

  if (printPay) {
    const m = state.members.find(x => x.id === printPay.memberId);
    const sub = state.subscriptions.find(s => s.id === printPay.subscriptionId);
    const coach = state.coaches.find(c => c.id === sub?.instructorId);
    const recordedBy = state.staff.find(s => s.id === printPay.recordedBy);
    return <Shell user={user} role="founder" onLogout={onLogout} nav={[]} active="" onNav={() => {}}>
      <InvoicePrint payment={printPay} member={m} subscription={sub} coach={coach} recordedBy={recordedBy} allPayments={state.payments} onClose={() => setPrintPay(null)} />
    </Shell>;
  }

  const renderCoachesTab = () => {
    if (view === "Member") return <MemberProfile memberId={memberId} onBack={() => setView("Main")} allowDeduct deductedBy={user.id} deducterRole="founder" allowAddSubscription viewerId={user.id} />;
    const coaches = coachFilter === "all" ? state.coaches : state.coaches.filter(c => c.id === coachFilter);
    return (
      <div className="space-y-7">
        <SectionHeader title="All Coach Views"
          action={
            <Select value={coachFilter} onChange={(e) => setCoachFilter(e.target.value)} className="max-w-xs">
              <option value="all">All Coaches</option>
              {state.coaches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          } />
        {coaches.map(c => (
          <div key={c.id} className="space-y-4">
            <div className="flex items-center gap-3 pt-3 pb-2 border-b border-[#262626]">
              <div className="w-1 h-5 bg-[#F5F5F5]" />
              <h3 className="text-[16px] sm:text-[18px] font-black uppercase tracking-[0.1em]">{c.name}</h3>
              <span className="text-[11px] sm:text-[12px] text-[#9A9A9A] font-mono">— {c.specialization}</span>
            </div>
            <CoachMembersView coachId={c.id} onOpen={openMember} allowDeduct deductedBy={user.id} deducterRole="founder" allowReassign />
          </div>
        ))}
      </div>
    );
  };

  return (
    <Shell user={user} role="founder" onLogout={onLogout}
      nav={["Revenue", "Members", "Subscriptions", "Payments", "Coach Views", "Packages", "User Mgmt"]}
      active={active} onNav={(t) => { setActive(t); setView("Main"); }}>
      {view === "Member" && active !== "Coach Views" ? (
        <MemberProfile memberId={memberId} onBack={() => setView("Main")} allowDeduct deductedBy={user.id} deducterRole="founder" allowAddSubscription viewerId={user.id} />
      ) : (
        <>
          {active === "Revenue" && <RevenueDashboard perCoach perStaff />}
          {active === "Members" && <MemberManagement onOpen={openMember} />}
          {active === "Subscriptions" && <SubscriptionManagement />}
          {active === "Payments" && (
            <div className="space-y-6">
              <SectionHeader title="Payment Records" sublabel="All payments · filterable & exportable" />
              <FilterablePaymentsList exportable onView={setPrintPay} />
            </div>
          )}
          {active === "Coach Views" && renderCoachesTab()}
          {active === "Packages" && (
            <div className="space-y-6">
              <SectionHeader title="Packages & Pricing" sublabel="Manage all package types, sessions, durations & prices" />
              <PackageManagement />
            </div>
          )}
          {active === "User Mgmt" && <UserManagement />}
        </>
      )}
    </Shell>
  );
}
