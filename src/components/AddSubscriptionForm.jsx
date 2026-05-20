import React, { useState, useMemo, useRef } from "react";
import { Plus, Lock, X, User as UserIcon } from "lucide-react";
import {
  Btn,
  Field,
  Input,
  Select,
  SearchBar,
} from "./primitives.jsx";
import { useApp } from "../state/context.js";
import { uid, fmtDate, fmtMoney, todayISO, useDebounce } from "../lib/helpers.js";
import PaymentConfirmModal from "./PaymentConfirmModal.jsx";

export default function AddSubscriptionForm({ onClose, presetMember=null, recordedBy=null, requirePin=false }) {
  const { state, dispatch, toast } = useApp();
  const [memberMode, setMemberMode] = useState(presetMember ? "existing" : "existing");
  const [memberId, setMemberId] = useState(presetMember?.id || "");
  const [search, setSearch] = useState(presetMember?.name || "");
  const [newName, setNewName] = useState("");
  const [phone, setPhone] = useState("");
  const [coachId, setCoachId] = useState(state.coaches[0]?.id || "");
  const [type, setType] = useState("PT");
  const [pkgIdx, setPkgIdx] = useState(0);
  const [totalSessions, setTotalSessions] = useState(8);
  const [startDate, setStartDate] = useState(fmtDate(todayISO()));
  const [days, setDays] = useState(30);
  const [pinModalOpen, setPinModalOpen] = useState(false);

  // Read live packages from state — supports founder edits
  const packagesByType = useMemo(() => {
    const grouped = { PT: [], Class: [], Nutrition: [] };
    state.packages.forEach(p => { if (grouped[p.type]) grouped[p.type].push(p); });
    return grouped;
  }, [state.packages]);

  // Partial payment splits — at least one row
  const [splits, setSplits] = useState([{ method: "Cash", amount: 3200 }]);
  const [discount, setDiscount] = useState(0);
  const [receiptImg, setReceiptImg] = useState(null);
  const fileRef = useRef();

  const dSearch = useDebounce(search, 200);
  const filteredMembers = useMemo(() =>
    state.members.filter(m =>
      !dSearch || m.name.toLowerCase().includes(dSearch.toLowerCase()) || m.phone.includes(dSearch)
    ).slice(0, 6), [state.members, dSearch]);

  const totalAmount = splits.reduce((s, x) => s + Number(x.amount || 0), 0);
  const needsReceipt = splits.some(s => s.method === "Bank Transfer" && Number(s.amount) > 0);

  const onTypeChange = (t) => {
    setType(t); setPkgIdx(0);
    const pkg = packagesByType[t][0];
    if (pkg) {
      setTotalSessions(pkg.sessions); setDays(pkg.days);
      setSplits([{ method: splits[0]?.method || "Cash", amount: pkg.price }]);
    }
  };

  const onPkgChange = (i) => {
    setPkgIdx(i);
    const pkg = packagesByType[type][i];
    if (pkg) {
      setTotalSessions(pkg.sessions); setDays(pkg.days);
      setSplits([{ method: splits[0]?.method || "Cash", amount: pkg.price }]);
    }
  };

  const updateSplit = (i, key, val) => {
    setSplits(splits.map((s, idx) => idx === i ? { ...s, [key]: key === "amount" ? Number(val || 0) : val } : s));
  };
  const addSplit = () => {
    if (splits.length >= 3) return;
    const remaining = Math.max(0, (packagesByType[type][pkgIdx]?.price || 0) - totalAmount);
    setSplits([...splits, { method: "Cash", amount: remaining }]);
  };
  const removeSplit = (i) => { if (splits.length > 1) setSplits(splits.filter((_, idx) => idx !== i)); };

  const onFile = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setReceiptImg(reader.result);
    reader.readAsDataURL(f);
  };

  // Step 1 — validate inputs. If front desk, gate the actual commit behind PIN modal.
  const requestSubmit = () => {
    let mid = memberId;
    if (!presetMember && memberMode === "new") {
      if (!newName.trim() || !phone.trim()) { toast("Name and phone required"); return; }
    } else if (!mid) { toast("Select a member"); return; }
    if (totalAmount <= 0) { toast("Enter payment amount"); return; }
    if (needsReceipt && !receiptImg) { toast("Receipt image required for Bank Transfer"); return; }

    if (requirePin) {
      setPinModalOpen(true);
    } else {
      finalizeSubmit();
    }
  };

  // Step 2 — actually commit after validation/PIN check passed.
  const finalizeSubmit = (verifiedAt = null) => {
    let mid = memberId;
    if (!presetMember && memberMode === "new") {
      mid = "m" + uid();
      dispatch({ type:"ADD_MEMBER", member: { id: mid, name: newName.trim(), phone: phone.trim() } });
    }

    const start = new Date(startDate);
    const end = new Date(start); end.setDate(end.getDate() + Number(days));

    const subId = uid(); const payId = uid(); const now = todayISO();
    const primaryMethod = splits.length === 1 ? splits[0].method : "Split";

    dispatch({
      type:"ADD_PAYMENT",
      payment: {
        id: payId, memberId: mid, subscriptionId: subId,
        amount: totalAmount, type, method: primaryMethod,
        splits: splits.filter(s => Number(s.amount) > 0),
        discount: Number(discount || 0),
        bankTransferImage: needsReceipt ? receiptImg : null,
        datetime: now, recordedBy: recordedBy || null,
        // Verification audit trail
        requiresVerification: !!requirePin,
        verified: requirePin ? true : false,
        verifiedAt: verifiedAt,
        verifiedBy: requirePin ? recordedBy : null,
      },
    });
    dispatch({
      type:"ADD_SUBSCRIPTION",
      subscription: {
        id: subId, memberId: mid, type,
        instructorId: coachId,
        packageName: packagesByType[type][pkgIdx]?.name || `Custom ${type}`,
        totalSessions: Number(totalSessions),
        sessionsRemaining: Number(totalSessions),
        startDate: start.toISOString(), endDate: end.toISOString(),
        paymentId: payId, lastDeductionByCoach: {},
      },
    });
    toast("Subscription created");
    setPinModalOpen(false);
    onClose();
  };

  const handlePinVerified = () => finalizeSubmit(todayISO());

  return (
    <div className="space-y-5">
      {!presetMember && (
        <>
          <div className="flex flex-wrap gap-2">
            <Btn variant={memberMode === "existing" ? "primary" : "ghost"} size="sm" onClick={() => setMemberMode("existing")}>Existing Member</Btn>
            <Btn variant={memberMode === "new" ? "primary" : "ghost"} size="sm" onClick={() => setMemberMode("new")}>New Member</Btn>
          </div>

          {memberMode === "existing" ? (
            <Field label="Search Member" required>
              <SearchBar value={search} onChange={(e) => { setSearch(e.target.value); setMemberId(""); }} placeholder="Name or phone..." />
              {dSearch && !memberId && (
                <div className="border border-[#262626] mt-1 max-h-44 overflow-y-auto">
                  {filteredMembers.map(m => (
                    <button key={m.id} type="button" onClick={() => { setMemberId(m.id); setSearch(m.name); }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#1F1F1F] transition-colors border-b border-[#262626] last:border-0">
                      <div className="font-bold">{m.name}</div>
                      <div className="text-[11px] text-[#9A9A9A] font-mono">{m.phone}</div>
                    </button>
                  ))}
                  {filteredMembers.length === 0 && <div className="px-4 py-3 text-[12px] text-[#9A9A9A]">No matches</div>}
                </div>
              )}
            </Field>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name" required><Input value={newName} onChange={(e) => setNewName(e.target.value)} /></Field>
              <Field label="Phone" required><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-xxxx-xxxx" /></Field>
            </div>
          )}
        </>
      )}

      {presetMember && (
        <div className="bg-[#0F0F0F] border border-[#262626] px-4 py-3 flex items-center gap-3">
          <UserIcon size={14} className="text-[#9A9A9A]" />
          <span className="text-[13px] font-bold">{presetMember.name}</span>
          <span className="text-[11px] text-[#9A9A9A] font-mono">{presetMember.phone}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Instructor / Trainer" required>
          <Select value={coachId} onChange={(e) => setCoachId(e.target.value)}>
            {state.coaches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Package Type" required>
          <Select value={type} onChange={(e) => onTypeChange(e.target.value)}>
            <option value="PT">PT</option>
            <option value="Class">Class</option>
            <option value="Nutrition">Nutrition</option>
          </Select>
        </Field>
      </div>

      <Field label="Package" required>
        <Select value={pkgIdx} onChange={(e) => onPkgChange(Number(e.target.value))}>
          {packagesByType[type].map((p, i) => <option key={p.id} value={i}>{p.name} — {fmtMoney(p.price)}</option>)}
        </Select>
      </Field>

      {/* Fixed: stacked sessions + start date + duration with no overlap */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Total Sessions" required>
          <Input type="number" value={totalSessions} onChange={(e) => setTotalSessions(e.target.value)} min={1} />
        </Field>
        <Field label="Start Date" required>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
        <Field label="Duration (days)" required>
          <Input type="number" value={days} onChange={(e) => setDays(e.target.value)} min={1} />
        </Field>
      </div>

      <div className="border-t border-[#262626] pt-5">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#F5F5F5]">Payment</div>
            <div className="text-[11px] text-[#7A7A7A] font-mono mt-0.5">Split across multiple methods if needed</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#9A9A9A] font-mono">Total</div>
            <div className="text-[18px] font-mono font-bold text-[#F5F5F5]">{fmtMoney(totalAmount)}</div>
          </div>
        </div>

        <div className="space-y-3">
          {splits.map((s, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_1fr_auto] gap-2 sm:gap-3 items-start">
              <Select value={s.method} onChange={(e) => updateSplit(i, "method", e.target.value)} className="min-w-0">
                <option>Cash</option><option>Visa</option><option>Bank Transfer</option>
              </Select>
              <Input type="number" value={s.amount} onChange={(e) => updateSplit(i, "amount", e.target.value)} placeholder="Amount" min={0} className="min-w-0" />
              <Btn variant="ghost" size="sm" onClick={() => removeSplit(i)} disabled={splits.length === 1} title="Remove split"><X size={12} /></Btn>
            </div>
          ))}
        </div>

        <div className="mt-3">
          <Btn variant="ghost" size="sm" onClick={addSplit} disabled={splits.length >= 3}><Plus size={12} />Add Payment Split</Btn>
        </div>

        <div className="mt-4 pt-4 border-t border-[#262626] grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Discount (EGP)" hint="Optional — appears on the invoice">
            <Input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} min={0} placeholder="0" />
          </Field>
        </div>

        {needsReceipt && (
          <div className="mt-4">
            <Field label="Bank Transfer Receipt" required>
              <input type="file" accept="image/*" ref={fileRef} onChange={onFile}
                className="text-[11px] font-mono text-[#9A9A9A] file:bg-[#2A2A2A] file:border-0 file:text-[#F0F0F0] file:px-3 file:py-2 file:mr-3 file:font-bold file:uppercase file:tracking-wider file:text-[10px] file:cursor-pointer w-full" />
              {receiptImg && <img src={receiptImg} alt="receipt" className="mt-2 max-h-32 border border-[#262626]" />}
            </Field>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2 flex-wrap">
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={requestSubmit}>
          {requirePin ? <><Lock size={14} />Verify & Create</> : <><Plus size={14} />Create Subscription</>}
        </Btn>
      </div>

      <PaymentConfirmModal
        open={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        onVerified={handlePinVerified}
        employeeId={recordedBy}
        amount={totalAmount}
      />
    </div>
  );
}
