import React from "react";
import {
  Shield,
  TrendingUp,
  Briefcase,
  Users,
  ClipboardList,
  Dumbbell,
  User as UserIcon,
  KeyRound,
} from "lucide-react";
import { useApp } from "../state/context.js";
import { LA7Logo } from "../components/primitives.jsx";

export default function LoginScreen({ onLogin }) {
  const { state } = useApp();
  const roles = [
    { role:"founder",          label:"Founder",          desc:"God mode — full control",            icon:Shield,         user: state.staff.find(s=>s.role==="founder") },
    { role:"general_manager",  label:"General Manager",  desc:"Revenue overview only",              icon:TrendingUp,     user: state.staff.find(s=>s.role==="general_manager") },
    { role:"coaches_manager",  label:"Coaches Manager",  desc:"Coach dashboard + revenue",          icon:Briefcase,      user: state.staff.find(s=>s.role==="coaches_manager") },
    { role:"classes_manager",  label:"Classes Manager",  desc:"Class income + per instructor",      icon:Users,          user: state.staff.find(s=>s.role==="classes_manager") },
    { role:"accountant",       label:"Accountant",       desc:"Payments, invoices, exports",        icon:ClipboardList,  user: state.staff.find(s=>s.role==="accountant") },
    { role:"coach",            label:"Coach",            desc:"My members + my income",             icon:Dumbbell,       user: state.coaches[0] },
    { role:"front_desk",       label:"Front Desk",       desc:"Subscriptions, check-in, revenue",   icon:UserIcon,       user: state.staff.find(s=>s.role==="front_desk") },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F0F0F0] flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-6xl">
          <div className="text-center mb-10 sm:mb-14 animate-fade-in">
            <div className="inline-flex items-center justify-center mb-5">
              <LA7Logo size={48} className="text-[#F5F5F5] sm:hidden" />
              <LA7Logo size={56} className="text-[#F5F5F5] hidden sm:block" />
            </div>
            <p className="text-[#9A9A9A] uppercase text-[10px] sm:text-[11px] tracking-[0.4em] sm:tracking-[0.5em] font-mono">Premium Fitness · Management System</p>
            <div className="w-16 h-px bg-[#3A3A3A] mx-auto mt-5" />
          </div>

          <div className="border border-[#262626] bg-[#141414]">
            <div className="px-5 sm:px-6 py-4 border-b border-[#262626] flex items-center gap-2">
              <KeyRound size={14} className="text-[#E5E5E5]" />
              <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.25em] sm:tracking-[0.3em] font-bold">Demo Role Selector</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              {roles.map((r, i) => (
                <button key={r.role} onClick={() => onLogin(r.role, r.user)}
                  className="group p-5 sm:p-6 text-left transition-all duration-300 hover:bg-[#1F1F1F] border-b last:border-b-0 sm:border-r sm:[&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r lg:[&:nth-child(4n)]:border-r-0 xl:[&:nth-child(4n)]:border-r xl:last:border-r-0 border-[#262626] relative">
                  <r.icon className="text-[#7A7A7A] group-hover:text-[#F5F5F5] group-hover:scale-110 transition-all duration-300 mb-4" size={28} strokeWidth={1.5} />
                  <div className="font-bold uppercase tracking-[0.12em] text-[13px] mb-1.5 group-hover:text-[#F5F5F5] transition-colors">{r.label}</div>
                  <div className="text-[11px] text-[#9A9A9A] font-mono mb-3 leading-relaxed">{r.desc}</div>
                  <div className="text-[10px] text-[#5A5A5A] font-mono uppercase tracking-[0.15em] truncate group-hover:text-[#9A9A9A] transition-colors">{r.user?.name}</div>
                  <div className="absolute bottom-0 left-0 h-px bg-[#F5F5F5] w-0 group-hover:w-full transition-all duration-500" />
                </button>
              ))}
            </div>
          </div>
          <div className="text-center mt-8 sm:mt-10 text-[10px] text-[#5A5A5A] font-mono uppercase tracking-[0.3em]">⟶ Select role to enter</div>
        </div>
      </div>
    </div>
  );
}
