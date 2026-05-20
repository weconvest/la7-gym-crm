import React, { useState } from "react";
import {
  ShieldCheck,
  Banknote,
  CreditCard,
  Receipt,
  Printer,
} from "lucide-react";
import {
  Btn,
  Modal,
  BankTransferPreview,
  ImageLightbox,
} from "./primitives.jsx";
import { useApp } from "../state/context.js";
import {
  fmtDateTime,
  fmtMoney,
  invoiceNumber,
  paymentTotal,
} from "../lib/helpers.js";

export default function PaymentDetailModal({ payment, onClose, onPrint }) {
  const { state } = useApp();
  const [lightbox, setLightbox] = useState(false);

  if (!payment) return null;

  const member = state.members.find(m => m.id === payment.memberId);
  const sub = state.subscriptions.find(s => s.id === payment.subscriptionId);
  const coach = state.coaches.find(c => c.id === sub?.instructorId);
  const recordedBy = state.staff.find(s => s.id === payment.recordedBy);
  const verifiedBy = state.staff.find(s => s.id === payment.verifiedBy);
  const inv = invoiceNumber(payment, state.payments);
  const splits = (payment.splits && payment.splits.length) ? payment.splits : [{ method: payment.method, amount: payment.amount }];
  const total = paymentTotal(payment);

  return (
    <>
      <Modal open={!!payment} onClose={onClose} title="Payment Details" maxWidth="max-w-2xl">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between flex-wrap gap-4 pb-5 border-b border-[#262626]">
            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-[#9A9A9A] font-mono mb-1">Invoice</div>
              <div className="text-[18px] font-mono font-bold text-[#F5F5F5]">{inv}</div>
              <div className="text-[11px] font-mono text-[#7A7A7A] mt-1">{fmtDateTime(payment.datetime)}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-[0.25em] text-[#9A9A9A] font-mono mb-1">Total Paid</div>
              <div className="text-[24px] font-mono font-bold text-[#F5F5F5]">{fmtMoney(total)}</div>
            </div>
          </div>

          {/* Two-col info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#9A9A9A] font-mono mb-1">Member</div>
                <div className="text-[14px] font-bold">{member?.name || "—"}</div>
                <div className="text-[11px] font-mono text-[#7A7A7A]">{member?.phone}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#9A9A9A] font-mono mb-1">Package</div>
                <div className="text-[13px]">{sub?.packageName || "—"}</div>
                <div className="text-[11px] text-[#7A7A7A] font-mono mt-0.5">Type: {payment.type}</div>
              </div>
              {coach && (
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[#9A9A9A] font-mono mb-1">Instructor</div>
                  <div className="text-[13px]">{coach.name}</div>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#9A9A9A] font-mono mb-1">Recorded By</div>
                <div className="text-[13px]">{recordedBy?.name || "—"}</div>
                <div className="text-[11px] text-[#7A7A7A] font-mono mt-0.5">Front Desk</div>
              </div>
              {payment.verified && verifiedBy && (
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[#9A9A9A] font-mono mb-1 flex items-center gap-1.5"><ShieldCheck size={10} className="text-[#F5F5F5]" />PIN Verified</div>
                  <div className="text-[13px]">{verifiedBy.name}</div>
                  <div className="text-[11px] text-[#7A7A7A] font-mono mt-0.5">{payment.verifiedAt ? fmtDateTime(payment.verifiedAt) : "—"}</div>
                </div>
              )}
            </div>
          </div>

          {/* Payment breakdown */}
          <div className="border-t border-[#262626] pt-5">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#9A9A9A] font-mono mb-3">Payment Breakdown</div>
            <div className="space-y-2">
              {splits.map((s, i) => (
                <div key={i} className="flex items-center justify-between bg-[#0A0A0A] border border-[#262626] px-4 py-3">
                  <div className="flex items-center gap-2">
                    {s.method === "Cash" && <Banknote size={14} className="text-[#9A9A9A]" />}
                    {s.method === "Visa" && <CreditCard size={14} className="text-[#9A9A9A]" />}
                    {s.method === "Bank Transfer" && <Receipt size={14} className="text-[#9A9A9A]" />}
                    <span className="text-[13px] font-bold">{s.method}</span>
                  </div>
                  <span className="font-mono text-[#F5F5F5] font-bold">{fmtMoney(s.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bank transfer receipt */}
          {(splits.some(s => s.method === "Bank Transfer") || payment.bankTransferImage) && (
            <div className="border-t border-[#262626] pt-5">
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#9A9A9A] font-mono mb-3 flex items-center gap-2">
                <Receipt size={11} />Bank Transfer Receipt
              </div>
              <BankTransferPreview src={payment.bankTransferImage} onExpand={() => setLightbox(true)} />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-[#262626] flex-wrap">
            <Btn variant="ghost" onClick={onClose}>Close</Btn>
            {onPrint && <Btn variant="primary" onClick={() => { onClose(); onPrint(payment); }}><Printer size={14} />Print Invoice</Btn>}
          </div>
        </div>
      </Modal>
      {lightbox && <ImageLightbox src={payment.bankTransferImage} onClose={() => setLightbox(false)} caption="Bank Transfer Receipt" />}
    </>
  );
}
