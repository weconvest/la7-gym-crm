import React, { useState, useMemo } from "react";
import { useApp } from "../state/context.js";
import {
  paymentTotal,
  subStatus,
  fmtMoney,
  isSameDay,
  isSameMonth,
  isSameYear,
} from "../lib/helpers.js";
import { StatCard, Card } from "./primitives.jsx";

export default function RevenueDashboard({
  perCoach = false,
  perStaff = false,
  hideNutrition = false,
  classOnly = false,
  coachId = null,
  title = "Revenue",
  subtitle = "Income across packages",
}) {
  const { state } = useApp();
  const [scope, setScope] = useState("Day");

  const filterFn = useMemo(() => {
    const today = new Date();
    if (scope === "Day") return (p) => isSameDay(p.datetime, today);
    if (scope === "Month") return (p) => isSameMonth(p.datetime, today);
    return (p) => isSameYear(p.datetime, today);
  }, [scope]);

  // restrict by coach if needed (coach interface — only PT subs they instruct)
  const subIdsByCoach = useMemo(() => {
    if (!coachId) return null;
    return new Set(
      state.subscriptions.filter((s) => s.instructorId === coachId).map((s) => s.id)
    );
  }, [state.subscriptions, coachId]);

  const all = state.payments.filter(filterFn);
  let filtered = all;
  if (coachId && subIdsByCoach)
    filtered = filtered.filter((p) => subIdsByCoach.has(p.subscriptionId));
  if (hideNutrition) filtered = filtered.filter((p) => p.type !== "Nutrition");
  if (classOnly) filtered = filtered.filter((p) => p.type === "Class");

  const sumType = (t) =>
    filtered.filter((p) => p.type === t).reduce((s, p) => s + paymentTotal(p), 0);
  const pt = sumType("PT");
  const cls = sumType("Class");
  const nu = hideNutrition || classOnly ? 0 : sumType("Nutrition");
  const total = pt + cls + nu;

  return (
    <div className="space-y-7">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-[22px] sm:text-[28px] leading-none font-black uppercase tracking-[0.04em]">
            {title}
          </h2>
          <p className="text-[11px] sm:text-[12px] text-[#9A9A9A] font-mono uppercase tracking-[0.22em] mt-2">
            {subtitle}
          </p>
        </div>
        <div className="flex border border-[#262626]">
          {["Day", "Month", "Year"].map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={`px-4 sm:px-6 py-2.5 text-[11px] sm:text-[12px] uppercase tracking-[0.22em] font-bold transition-all duration-200 ${
                scope === s
                  ? "bg-[#F5F5F5] text-black"
                  : "text-[#9A9A9A] hover:text-white hover:bg-[#1A1A1A]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {classOnly ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <StatCard label="Classes Income" value={fmtMoney(cls)} />
          <StatCard label="Grand Total" value={fmtMoney(cls)} accent />
        </div>
      ) : (
        <div
          className={`grid grid-cols-2 ${
            hideNutrition ? "lg:grid-cols-3" : "lg:grid-cols-4"
          } gap-4 sm:gap-5`}
        >
          <StatCard label="PT Income" value={fmtMoney(pt)} />
          <StatCard label="Classes Income" value={fmtMoney(cls)} />
          {!hideNutrition && <StatCard label="Nutrition Income" value={fmtMoney(nu)} />}
          <StatCard label="Grand Total" value={fmtMoney(total)} accent />
        </div>
      )}

      {perCoach && (
        <Card>
          <div className="px-5 sm:px-6 py-4 border-b border-[#262626]">
            <h3 className="text-[12px] sm:text-[13px] font-bold uppercase tracking-[0.2em]">
              PT Income — Per Coach
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead className="bg-[#0A0A0A]">
                <tr className="text-left text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-[#9A9A9A] font-mono">
                  <th className="px-5 sm:px-6 py-3.5">Coach</th>
                  <th className="px-5 sm:px-6 py-3.5">Specialization</th>
                  <th className="px-5 sm:px-6 py-3.5 text-right">PT Income ({scope})</th>
                </tr>
              </thead>
              <tbody>
                {state.coaches.map((c) => {
                  const subIds = state.subscriptions
                    .filter((s) => s.instructorId === c.id && s.type === "PT")
                    .map((s) => s.id);
                  const income = filtered
                    .filter((p) => p.type === "PT" && subIds.includes(p.subscriptionId))
                    .reduce((s, p) => s + paymentTotal(p), 0);
                  return (
                    <tr key={c.id} className="border-t border-[#262626] hover:bg-[#0A0A0A]">
                      <td className="px-5 sm:px-6 py-3.5 font-bold text-[13px]">{c.name}</td>
                      <td className="px-5 sm:px-6 py-3.5 text-[#9A9A9A] text-[12px]">{c.specialization}</td>
                      <td className="px-5 sm:px-6 py-3.5 text-right font-mono text-[#F5F5F5]">
                        {fmtMoney(income)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {classOnly && (
        <Card>
          <div className="px-5 sm:px-6 py-4 border-b border-[#262626]">
            <h3 className="text-[12px] sm:text-[13px] font-bold uppercase tracking-[0.2em]">
              Class Income — Per Instructor
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead className="bg-[#0A0A0A]">
                <tr className="text-left text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-[#9A9A9A] font-mono">
                  <th className="px-5 sm:px-6 py-3.5">Instructor</th>
                  <th className="px-5 sm:px-6 py-3.5 text-right">Active Class Subs</th>
                  <th className="px-5 sm:px-6 py-3.5 text-right">Income ({scope})</th>
                </tr>
              </thead>
              <tbody>
                {state.coaches.map((c) => {
                  const classSubs = state.subscriptions.filter(
                    (s) => s.instructorId === c.id && s.type === "Class"
                  );
                  const subIds = classSubs.map((s) => s.id);
                  const activeSubs = classSubs.filter(
                    (s) => subStatus(s) === "active"
                  ).length;
                  const income = filtered
                    .filter((p) => p.type === "Class" && subIds.includes(p.subscriptionId))
                    .reduce((s, p) => s + paymentTotal(p), 0);
                  return (
                    <tr key={c.id} className="border-t border-[#262626] hover:bg-[#0A0A0A]">
                      <td className="px-5 sm:px-6 py-3.5 font-bold text-[13px]">{c.name}</td>
                      <td className="px-5 sm:px-6 py-3.5 text-right font-mono text-[#9A9A9A]">
                        {activeSubs}
                      </td>
                      <td className="px-5 sm:px-6 py-3.5 text-right font-mono text-[#F5F5F5]">
                        {fmtMoney(income)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {perStaff && (
        <Card>
          <div className="px-5 sm:px-6 py-4 border-b border-[#262626]">
            <h3 className="text-[12px] sm:text-[13px] font-bold uppercase tracking-[0.2em]">
              Front Desk — Activity ({scope})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[420px]">
              <thead className="bg-[#0A0A0A]">
                <tr className="text-left text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-[#9A9A9A] font-mono">
                  <th className="px-5 sm:px-6 py-3.5">Staff</th>
                  <th className="px-5 sm:px-6 py-3.5 text-right">Check-ins</th>
                  <th className="px-5 sm:px-6 py-3.5 text-right">Subs Created</th>
                </tr>
              </thead>
              <tbody>
                {state.staff
                  .filter((s) => s.role === "front_desk")
                  .map((st) => {
                    const cnt = state.attendance.filter(
                      (a) => a.deductedBy === st.id && filterFn(a)
                    ).length;
                    const subs = state.payments.filter(
                      (p) => p.recordedBy === st.id && filterFn(p)
                    ).length;
                    return (
                      <tr key={st.id} className="border-t border-[#262626] hover:bg-[#0A0A0A]">
                        <td className="px-5 sm:px-6 py-3.5 font-bold text-[13px]">{st.name}</td>
                        <td className="px-5 sm:px-6 py-3.5 text-right font-mono text-[#F5F5F5]">
                          {cnt}
                        </td>
                        <td className="px-5 sm:px-6 py-3.5 text-right font-mono text-[#F5F5F5]">
                          {subs}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
