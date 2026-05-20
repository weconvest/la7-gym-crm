import React, { useState } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { Btn, ImageLightbox } from "./primitives.jsx";
import { useApp } from "../state/context.js";
import { invoiceNumber, paymentTotal, daysBetween } from "../lib/helpers.js";

export default function InvoicePrint({ payment, member, subscription, coach, recordedBy, allPayments, onClose }) {
  const { state } = useApp();
  const [lightbox, setLightbox] = useState(false);
  const invoiceNo = invoiceNumber(payment, allPayments);
  const total = paymentTotal(payment);
  const splits = (payment.splits && payment.splits.length) ? payment.splits : [{ method: payment.method, amount: payment.amount }];
  const discount = Number(payment.discount || 0);
  // VAT 14% — back-calculated so total = subtotal + VAT
  const VAT_RATE = 0.14;
  const subtotal = Math.round((total / (1 + VAT_RATE)) * 100) / 100;
  const vat = Math.round((total - subtotal) * 100) / 100;

  // Membership ID — derived stable identifier from member id
  const membershipId = member ? `D5-${String(member.id).replace(/[^a-z0-9]/gi, "").slice(-4).toUpperCase().padStart(4, "0")}` : "—";

  const d = new Date(payment.datetime);
  const datePart = `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
  const timePart = `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;

  const startDate = subscription ? new Date(subscription.startDate) : d;
  const endDate = subscription ? new Date(subscription.endDate) : d;
  const fmtDMY = (dt) => `${dt.getDate()}/${dt.getMonth()+1}/${dt.getFullYear()}`;

  // Reference uses Bank Transfer label for the paid amount line
  const bankTransferAmount = splits.find(s => s.method === "Bank Transfer")?.amount || 0;
  const cashAmount = splits.find(s => s.method === "Cash")?.amount || 0;
  const visaAmount = splits.find(s => s.method === "Visa")?.amount || 0;

  const handlePrint = () => window.print();

  return (
    <div className="print-area">
      {/* Toolbar (hidden on print) */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-5 print:hidden">
        <Btn variant="ghost" size="sm" onClick={onClose}><ArrowLeft size={14} />Back</Btn>
        <div className="flex gap-2">
          <Btn variant="primary" onClick={handlePrint}><Printer size={14} />Print Invoice</Btn>
        </div>
      </div>

      {/* A4 sheet — replicating the reference design */}
      <div
        className="invoice-sheet mx-auto bg-white shadow-2xl print:shadow-none"
        style={{
          width: "100%",
          maxWidth: "210mm",
          minHeight: "297mm",
          color: "#222",
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          padding: "32px 36px",
          position: "relative",
          fontSize: 13,
          lineHeight: 1.5,
        }}
      >
        {/* ====== TOP HEADER ROW ====== */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          {/* Left: Invoice / # / Date / PAID stamp */}
          <div style={{ flex: 1, position: "relative" }}>
            <h1 style={{ fontSize: 28, fontWeight: 400, color: "#222", margin: 0, marginBottom: 6, letterSpacing: "-0.5px" }}>
              Invoice
            </h1>
            <div style={{ fontSize: 14, color: "#c0392b", fontWeight: 500, marginBottom: 4 }}>
              #{invoiceNo}
            </div>
            <div style={{ fontSize: 12, color: "#555" }}>
              Date :{datePart} {timePart}
            </div>

            {/* PAID stamp — tilted green */}
            <div
              style={{
                position: "absolute",
                top: 18,
                left: 200,
                transform: "rotate(-12deg)",
                border: "3px solid #2e7d32",
                color: "#2e7d32",
                padding: "6px 22px",
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: "2px",
                fontFamily: "'Helvetica Neue', Arial, sans-serif",
                opacity: 0.92,
              }}
            >
              PAID
            </div>
          </div>

          {/* Right: branch info */}
          <div style={{ textAlign: "right", minWidth: 200 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#222", marginBottom: 4 }}>LA7-DISTRICT 5</div>
            <div style={{ fontSize: 11, color: "#888", letterSpacing: "0.5px", marginBottom: 2 }}>BRANCH</div>
            <div style={{ fontSize: 13, color: "#444", marginTop: 6 }}>New Cairo</div>
          </div>
        </div>

        {/* Thin divider */}
        <div style={{ height: 1, background: "#e5e5e5", margin: "18px 0 24px" }} />

        {/* ====== INVOICE TO + PAYMENT SUMMARY ====== */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 28 }}>
          {/* Left column: Invoice To */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#222", marginBottom: 10 }}>Invoice To</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#222", marginBottom: 14 }}>
              {member?.name || "—"}
            </div>
            <table style={{ borderCollapse: "collapse" }}>
              <tbody>
                {coach && (
                  <tr>
                    <td style={{ padding: "3px 0", fontSize: 13, color: "#555", paddingRight: 12, verticalAlign: "top" }}>Assigned for:</td>
                    <td style={{ padding: "3px 0", fontSize: 13, color: "#222", fontWeight: 500 }}>{coach.name}</td>
                  </tr>
                )}
                <tr>
                  <td style={{ padding: "3px 0", fontSize: 13, color: "#555", paddingRight: 12 }}>Invoice Date:</td>
                  <td style={{ padding: "3px 0", fontSize: 13, color: "#222" }}>{fmtDMY(d)}</td>
                </tr>
                <tr>
                  <td style={{ padding: "3px 0", fontSize: 13, color: "#555", paddingRight: 12 }}>Start Date:</td>
                  <td style={{ padding: "3px 0", fontSize: 13, color: "#222" }}>{fmtDMY(startDate)}</td>
                </tr>
                <tr>
                  <td style={{ padding: "3px 0", fontSize: 13, color: "#555", paddingRight: 12 }}>End Date:</td>
                  <td style={{ padding: "3px 0", fontSize: 13, color: "#222" }}>{fmtDMY(endDate)}</td>
                </tr>
                <tr>
                  <td style={{ padding: "3px 0", fontSize: 13, color: "#555", paddingRight: 12 }}>Membership ID :</td>
                  <td style={{ padding: "3px 0", fontSize: 13, color: "#222", fontWeight: 500 }}>{membershipId}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Right column: Payments / Discount / Methods / Balance */}
          <div>
            <table style={{ borderCollapse: "collapse", width: "100%" }}>
              <tbody>
                <tr>
                  <td style={{ padding: "3px 0", fontSize: 13, color: "#555", paddingRight: 12 }}>Payments:</td>
                  <td style={{ padding: "3px 0", fontSize: 13, color: "#222", textAlign: "right", fontWeight: 500 }}>
                    {(total + discount).toFixed(3)} EGP
                  </td>
                </tr>
                {discount > 0 && (
                  <tr>
                    <td style={{ padding: "3px 0", fontSize: 13, color: "#555", paddingRight: 12 }}>Discount:</td>
                    <td style={{ padding: "3px 0", fontSize: 13, color: "#222", textAlign: "right" }}>
                      {discount.toLocaleString()} EGP
                    </td>
                  </tr>
                )}
                {bankTransferAmount > 0 && (
                  <tr>
                    <td style={{ padding: "3px 0", fontSize: 13, color: "#555", paddingRight: 12 }}>Bank Transfer:</td>
                    <td style={{ padding: "3px 0", fontSize: 13, color: "#222", textAlign: "right" }}>
                      {bankTransferAmount.toFixed(3)} EGP
                    </td>
                  </tr>
                )}
                {cashAmount > 0 && (
                  <tr>
                    <td style={{ padding: "3px 0", fontSize: 13, color: "#555", paddingRight: 12 }}>Cash:</td>
                    <td style={{ padding: "3px 0", fontSize: 13, color: "#222", textAlign: "right" }}>
                      {cashAmount.toFixed(3)} EGP
                    </td>
                  </tr>
                )}
                {visaAmount > 0 && (
                  <tr>
                    <td style={{ padding: "3px 0", fontSize: 13, color: "#555", paddingRight: 12 }}>Visa:</td>
                    <td style={{ padding: "3px 0", fontSize: 13, color: "#222", textAlign: "right" }}>
                      {visaAmount.toFixed(3)} EGP
                    </td>
                  </tr>
                )}
                <tr>
                  <td style={{ padding: "3px 0", fontSize: 13, color: "#555", paddingRight: 12 }}>Balance Due:</td>
                  <td style={{ padding: "3px 0", fontSize: 13, color: "#222", textAlign: "right", fontWeight: 500 }}>
                    {total.toLocaleString()} EGP
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ====== LINE ITEMS TABLE ====== */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
          <thead>
            <tr style={{ borderTop: "1px solid #d5d5d5", borderBottom: "1px solid #d5d5d5" }}>
              <th style={{ padding: "10px 8px", textAlign: "left", fontSize: 12, color: "#555", fontWeight: 600 }}>Description</th>
              <th style={{ padding: "10px 8px", textAlign: "center", fontSize: 12, color: "#555", fontWeight: 600, width: 60 }}>QTY</th>
              <th style={{ padding: "10px 8px", textAlign: "center", fontSize: 12, color: "#555", fontWeight: 600, width: 80 }}>Unit</th>
              <th style={{ padding: "10px 8px", textAlign: "right", fontSize: 12, color: "#555", fontWeight: 600, width: 110 }}>Rate</th>
              <th style={{ padding: "10px 8px", textAlign: "right", fontSize: 12, color: "#555", fontWeight: 600, width: 110 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid #e5e5e5" }}>
              <td style={{ padding: "14px 8px", fontSize: 13, color: "#222" }}>
                {subscription?.packageName || "Service"} - {payment.type} Membership - {subscription ? Math.max(1, daysBetween(subscription.startDate, subscription.endDate)) : "—"} Days
              </td>
              <td style={{ padding: "14px 8px", textAlign: "center", fontSize: 13, color: "#222" }}>1</td>
              <td style={{ padding: "14px 8px", textAlign: "center", fontSize: 13, color: "#222" }}>Each</td>
              <td style={{ padding: "14px 8px", textAlign: "right", fontSize: 13, color: "#222" }}>
                {(total + discount).toFixed(3)}
              </td>
              <td style={{ padding: "14px 8px", textAlign: "right", fontSize: 13, color: "#222" }}>
                {(total + discount).toFixed(3)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ====== TOTALS BLOCK (right-aligned) ====== */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 32 }}>
          <table style={{ borderCollapse: "collapse", minWidth: 280 }}>
            <tbody>
              <tr>
                <td style={{ padding: "6px 12px 6px 0", fontSize: 13, color: "#555", textAlign: "right" }}>Subtotal:</td>
                <td style={{ padding: "6px 0", fontSize: 13, color: "#222", textAlign: "right", minWidth: 110 }}>
                  {subtotal.toFixed(2)} EGP
                </td>
              </tr>
              <tr>
                <td style={{ padding: "6px 12px 6px 0", fontSize: 13, color: "#555", textAlign: "right" }}>VAT (14.00%):</td>
                <td style={{ padding: "6px 0", fontSize: 13, color: "#222", textAlign: "right" }}>
                  {vat.toFixed(2)} EGP
                </td>
              </tr>
              <tr style={{ borderTop: "1px solid #d5d5d5" }}>
                <td style={{ padding: "10px 12px 6px 0", fontSize: 14, color: "#222", textAlign: "right", fontWeight: 600 }}>Invoice Total :</td>
                <td style={{ padding: "10px 0 6px", fontSize: 14, color: "#222", textAlign: "right", fontWeight: 600 }}>
                  {total.toLocaleString()} EGP
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bank transfer receipt — only on screen, optional on print */}
        {payment.bankTransferImage && (
          <div className="print:hidden" style={{ marginTop: 36, paddingTop: 18, borderTop: "1px solid #e5e5e5" }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 8, letterSpacing: "0.5px", textTransform: "uppercase" }}>Bank Transfer Receipt</div>
            <button type="button" onClick={() => setLightbox(true)} style={{ display: "inline-block", padding: 0, border: "1px solid #d5d5d5", background: "#fafafa", cursor: "pointer", maxWidth: 220 }}>
              <img src={payment.bankTransferImage} alt="Receipt" style={{ display: "block", width: "100%", height: 140, objectFit: "cover" }} />
            </button>
          </div>
        )}

        {/* Footer URL — matches reference */}
        <div style={{ position: "absolute", bottom: 18, left: 36, right: 36, display: "flex", justifyContent: "space-between", fontSize: 10, color: "#999" }}>
          <span>https://la7.gym/dashboard/lead?search={member?.name?.split(" ")[0] || ""}</span>
          <span>{datePart}, {d.getHours() >= 12 ? `${((d.getHours()-1)%12)+1}:${String(d.getMinutes()).padStart(2,"0")} PM` : `${d.getHours() || 12}:${String(d.getMinutes()).padStart(2,"0")} AM`}</span>
        </div>
        <div style={{ position: "absolute", bottom: 6, right: 36, fontSize: 10, color: "#999" }}>Page 1 of 1</div>
      </div>

      {lightbox && <ImageLightbox src={payment.bankTransferImage} onClose={() => setLightbox(false)} caption="Bank Transfer Receipt" />}
    </div>
  );
}
