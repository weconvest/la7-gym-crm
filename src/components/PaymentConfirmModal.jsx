import React, { useState, useRef, useEffect } from "react";
import { X, Check, ShieldCheck } from "lucide-react";
import { Btn } from "./primitives.jsx";
import { useApp } from "../state/context.js";
import { fmtMoney } from "../lib/helpers.js";

export default function PaymentConfirmModal({ open, onClose, onVerified, employeeId, amount }) {
  const { state, toast } = useApp();
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const inputs = useRef([]);

  useEffect(() => {
    if (open) {
      setDigits(["", "", "", ""]);
      setError("");
      setTimeout(() => inputs.current[0]?.focus(), 150);
    }
  }, [open]);

  const employee = state.staff.find(s => s.id === employeeId);

  const handleChange = (i, val) => {
    const v = val.replace(/[^0-9]/g, "").slice(0, 1);
    const next = [...digits]; next[i] = v; setDigits(next);
    setError("");
    if (v && i < 3) inputs.current[i+1]?.focus();
    if (i === 3 && v) setTimeout(() => verify(next), 80);
  };

  const handleKey = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputs.current[i-1]?.focus();
    if (e.key === "Enter") verify(digits);
  };

  const handlePaste = (e) => {
    const txt = (e.clipboardData.getData("text") || "").replace(/[^0-9]/g, "").slice(0, 4);
    if (txt.length === 4) {
      e.preventDefault();
      const next = txt.split("");
      setDigits(next);
      setTimeout(() => verify(next), 80);
    }
  };

  const verify = (current) => {
    const entered = current.join("");
    if (entered.length < 4) { setError("Enter all 4 digits"); return; }
    const expected = employee?.paymentPin || "0000";
    if (entered !== expected) {
      setError("Incorrect PIN");
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setDigits(["", "", "", ""]);
      inputs.current[0]?.focus();
      return;
    }
    onVerified();
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[55] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className={`bg-[#141414] border border-[#3A3A3A] w-full max-w-md animate-scale-in shadow-2xl ${shake ? "animate-shake" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-[#262626] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck size={18} className="text-[#F5F5F5]" />
            <h3 className="font-bold uppercase tracking-[0.18em] text-[13px]">Payment Verification</h3>
          </div>
          <button onClick={onClose} className="text-[#9A9A9A] hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <div className="p-7">
          <div className="text-center mb-7">
            <div className="text-[10px] uppercase tracking-[0.25em] text-[#9A9A9A] font-mono mb-2">Confirming Employee</div>
            <div className="text-[15px] font-bold">{employee?.name || "—"}</div>
            <div className="text-[10px] text-[#7A7A7A] font-mono uppercase tracking-[0.2em] mt-1">Front Desk</div>
            <div className="mt-5 pt-5 border-t border-[#262626]">
              <div className="text-[10px] uppercase tracking-[0.25em] text-[#9A9A9A] font-mono mb-1">Total Amount</div>
              <div className="text-[24px] font-mono font-bold text-[#F5F5F5]">{fmtMoney(amount)}</div>
            </div>
          </div>

          <div className="text-[11px] text-[#9A9A9A] uppercase tracking-[0.2em] font-mono text-center mb-4">Enter 4-digit Payment PIN</div>

          <div className="flex justify-center gap-3 mb-3" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={el => inputs.current[i] = el}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKey(i, e)}
                className={`w-14 h-16 text-center text-2xl font-mono font-bold bg-[#0A0A0A] border-2 ${error ? "border-red-500" : (d ? "border-[#F5F5F5]" : "border-[#2A2A2A]")} text-[#F5F5F5] outline-none transition-all duration-150 focus:border-[#F5F5F5]`}
                autoComplete="off"
              />
            ))}
          </div>

          {error && <div className="text-center text-[12px] text-red-400 font-mono mb-3">{error}</div>}

          <div className="text-center text-[10px] text-[#5A5A5A] font-mono uppercase tracking-[0.2em] mt-6">
            Demo PIN: 0000
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-[#262626] flex-wrap">
            <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
            <Btn variant="primary" onClick={() => verify(digits)}><Check size={14} />Confirm Payment</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
