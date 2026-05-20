import React, { useState } from "react";
import { LogOut } from "lucide-react";
import { Btn, Tabs, LA7Logo } from "../components/primitives.jsx";

export default function Shell({ user, role, onLogout, children, nav, active, onNav }) {
  const roleLabel = {
    founder:"Founder", general_manager:"General Manager", coaches_manager:"Coaches Manager",
    classes_manager:"Classes Manager", accountant:"Accountant", coach:"Coach", front_desk:"Front Desk",
  }[role] || role;

  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F0F0F0]">
      <header className="border-b border-[#262626] bg-[#0A0A0A]/95 backdrop-blur-md sticky top-0 z-40 print:hidden">
        <div className="px-4 sm:px-7 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <LA7Logo size={26} className="text-[#F5F5F5] shrink-0" />
            <div className="h-5 sm:h-6 w-px bg-[#3A3A3A] hidden sm:block" />
            <span className="text-[11px] text-[#7A7A7A] font-mono uppercase tracking-[0.25em] hidden sm:inline truncate">{roleLabel}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <div className="text-[13px] font-bold tracking-wide truncate max-w-[180px]">{user?.name}</div>
              <div className="text-[10px] text-[#9A9A9A] font-mono uppercase tracking-[0.2em] mt-0.5">{roleLabel}</div>
            </div>
            <Btn variant="ghost" size="sm" onClick={onLogout}><LogOut size={13} /><span className="hidden sm:inline">Exit</span></Btn>
          </div>
        </div>
        {nav && nav.length > 0 && (
          <div className="px-4 sm:px-7 border-t border-[#262626]">
            <Tabs tabs={nav} active={active} onChange={(t) => { onNav(t); setMobileOpen(false); }} />
          </div>
        )}
      </header>
      <main className="px-4 sm:px-7 py-6 sm:py-10 max-w-[1500px] mx-auto animate-fade-in">{children}</main>
    </div>
  );
}
