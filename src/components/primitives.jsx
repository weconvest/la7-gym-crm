import React from "react";
import { X, AlertTriangle, Check, Search, ZoomIn, Receipt } from "lucide-react";

// ============================================================================
// BUTTON
// ============================================================================
export const Btn = ({
  children,
  onClick,
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  type = "button",
  title,
}) => {
  const base =
    "inline-flex items-center justify-center gap-2 font-bold uppercase tracking-wider transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed select-none active:scale-[0.97]";
  const sizes = {
    sm: "px-3.5 py-2 text-[11px]",
    md: "px-5 py-3 text-[13px]",
    lg: "px-7 py-3.5 text-sm",
  };
  const variants = {
    primary:
      "bg-[#E5E5E5] text-black hover:bg-white border border-[#E5E5E5] hover:border-white hover:-translate-y-px shadow-[0_1px_0_rgba(255,255,255,0.05)] hover:shadow-[0_4px_16px_rgba(229,229,229,0.15)]",
    ghost:
      "bg-transparent text-[#F0F0F0] border border-[#3A3A3A] hover:border-[#E5E5E5] hover:text-[#E5E5E5] hover:bg-[#1A1A1A]",
    danger:
      "bg-transparent text-red-400 border border-red-900/60 hover:bg-red-950/40 hover:border-red-500",
    dark:
      "bg-[#2A2A2A] text-[#F0F0F0] border border-[#3A3A3A] hover:bg-[#3A3A3A] hover:border-[#5A5A5A]",
  };
  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

// ============================================================================
// CARD
// ============================================================================
export const Card = ({ children, className = "", interactive = false }) => (
  <div
    className={`bg-[#141414] border border-[#262626] transition-all duration-300 ${
      interactive ? "hover:border-[#3A3A3A] hover:bg-[#181818]" : ""
    } ${className}`}
  >
    {children}
  </div>
);

// ============================================================================
// FORM FIELDS
// ============================================================================
export const Field = ({ label, children, required, hint }) => (
  <div className="flex flex-col gap-2 min-w-0">
    <label className="text-[11px] uppercase tracking-[0.18em] text-[#9A9A9A] font-mono font-medium">
      {label} {required && <span className="text-[#E5E5E5]">*</span>}
    </label>
    {children}
    {hint && <span className="text-[10px] text-[#7A7A7A] font-mono">{hint}</span>}
  </div>
);

export const Input = ({
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  className = "",
  ...rest
}) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    required={required}
    {...rest}
    className={`bg-[#0A0A0A] border border-[#2A2A2A] focus:border-[#E5E5E5] text-[#F0F0F0] px-3.5 py-3 outline-none transition-all duration-200 font-mono text-sm placeholder:text-[#3A3A3A] w-full hover:border-[#3A3A3A] focus:bg-[#0F0F0F] ${className}`}
  />
);

export const Select = ({ value, onChange, children, className = "" }) => (
  <select
    value={value}
    onChange={onChange}
    className={`bg-[#0A0A0A] border border-[#2A2A2A] focus:border-[#E5E5E5] text-[#F0F0F0] px-3.5 py-3 outline-none transition-all duration-200 font-mono text-sm w-full hover:border-[#3A3A3A] cursor-pointer ${className}`}
  >
    {children}
  </select>
);

// ============================================================================
// MODALS
// ============================================================================
export const Modal = ({ open, onClose, children, title, maxWidth = "max-w-2xl" }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-start justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`bg-[#141414] border border-[#3A3A3A] w-full ${maxWidth} my-4 sm:my-8 animate-scale-in shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 sm:py-5 border-b border-[#262626] sticky top-0 bg-[#141414] z-10">
          <h3 className="font-bold uppercase tracking-[0.18em] text-[13px] sm:text-[14px] truncate">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-[#9A9A9A] hover:text-white transition-all duration-150 hover:rotate-90 transform shrink-0 ml-3"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 sm:p-7">{children}</div>
      </div>
    </div>
  );
};

export const ConfirmModal = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  danger = true,
}) => (
  <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-md">
    <p className="text-[14px] text-[#C0C0C0] mb-7 leading-relaxed">{message}</p>
    <div className="flex justify-end gap-3 flex-wrap">
      <Btn variant="ghost" onClick={onClose}>
        Cancel
      </Btn>
      <Btn
        variant={danger ? "danger" : "primary"}
        onClick={() => {
          onConfirm();
          onClose();
        }}
      >
        {confirmText}
      </Btn>
    </div>
  </Modal>
);

// ============================================================================
// STAT CARD (clean — no background icons)
// ============================================================================
export const StatCard = ({ label, value, accent, sublabel }) => (
  <div className="bg-[#141414] border border-[#262626] p-5 sm:p-6 hover:border-[#3A3A3A] hover:bg-[#181818] transition-all duration-300">
    <div className="text-[11px] uppercase tracking-[0.22em] text-[#9A9A9A] font-mono font-medium mb-3">
      {label}
    </div>
    <div
      className={`text-[26px] sm:text-[30px] leading-none font-bold font-mono tracking-tight break-all ${
        accent ? "text-[#F5F5F5]" : "text-[#F0F0F0]"
      }`}
    >
      {value}
    </div>
    {sublabel && <div className="text-[11px] text-[#7A7A7A] font-mono mt-2">{sublabel}</div>}
  </div>
);

// ============================================================================
// NAVIGATION TABS
// ============================================================================
export const Tabs = ({ tabs, active, onChange }) => (
  <div className="flex border-b border-[#262626] overflow-x-auto no-scrollbar">
    {tabs.map((t) => (
      <button
        key={t}
        onClick={() => onChange(t)}
        className={`px-4 sm:px-6 py-3 sm:py-4 text-[11px] sm:text-[12px] uppercase tracking-[0.18em] sm:tracking-[0.22em] font-bold transition-all duration-200 whitespace-nowrap relative ${
          active === t ? "text-[#F5F5F5]" : "text-[#7A7A7A] hover:text-[#E5E5E5]"
        }`}
      >
        {t}
        {active === t && (
          <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#F5F5F5]" />
        )}
      </button>
    ))}
  </div>
);

// ============================================================================
// STATUS / WARNING / TOAST
// ============================================================================
export const StatusBadge = ({ status }) => {
  const cls =
    status === "active"
      ? "bg-[#F5F5F5] text-black border border-[#F5F5F5]"
      : "bg-[#3F1515] text-[#FCA5A5] border border-[#7F1D1D]";
  return (
    <span className={`text-[10px] font-bold uppercase tracking-[0.18em] px-2.5 py-1 ${cls}`}>
      {status}
    </span>
  );
};

export const WarningBanner = ({ children }) => (
  <div className="flex items-start gap-2 px-3 py-2 bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B] text-[12px] font-mono">
    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
    <span className="break-words">{children}</span>
  </div>
);

export const Toast = ({ msg, onClose }) => {
  if (!msg) return null;
  return (
    <div className="fixed bottom-5 right-5 left-5 sm:left-auto sm:bottom-7 sm:right-7 z-[60] bg-[#141414] border border-[#F5F5F5] px-5 py-3.5 flex items-center gap-3 animate-slide-up shadow-2xl">
      <Check size={16} className="text-[#F5F5F5] shrink-0" />
      <span className="text-[13px] font-mono text-[#F0F0F0] flex-1">{msg}</span>
      <button
        onClick={onClose}
        className="text-[#9A9A9A] hover:text-white transition-colors shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
};

// ============================================================================
// SEARCH + FILTER PRIMITIVES
// ============================================================================
export const SearchBar = ({ value, onChange, placeholder = "Search..." }) => (
  <div className="relative w-full sm:max-w-md">
    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A7A7A] pointer-events-none" />
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="bg-[#0A0A0A] border border-[#2A2A2A] focus:border-[#E5E5E5] text-[#F0F0F0] pl-10 pr-3.5 py-3 outline-none transition-all duration-200 font-mono text-sm placeholder:text-[#3A3A3A] w-full hover:border-[#3A3A3A] focus:bg-[#0F0F0F]"
    />
  </div>
);

export const ChipGroup = ({ options, value, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => {
      const v = typeof opt === "string" ? opt : opt.value;
      const lab = typeof opt === "string" ? opt : opt.label;
      const sel = value === v;
      return (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`px-3.5 py-1.5 text-[11px] uppercase tracking-[0.18em] font-bold transition-all duration-200 border ${
            sel
              ? "bg-[#F5F5F5] text-black border-[#F5F5F5]"
              : "bg-transparent text-[#9A9A9A] border-[#2A2A2A] hover:border-[#5A5A5A] hover:text-white"
          }`}
        >
          {lab}
        </button>
      );
    })}
  </div>
);

// ============================================================================
// LAYOUT HEADERS / EMPTY STATE
// ============================================================================
export const SectionHeader = ({ title, sublabel, action }) => (
  <div className="flex items-end justify-between flex-wrap gap-3 mb-1">
    <div>
      <h2 className="text-[22px] sm:text-[28px] leading-none font-black uppercase tracking-[0.04em]">
        {title}
      </h2>
      {sublabel && (
        <p className="text-[11px] sm:text-[12px] text-[#9A9A9A] font-mono uppercase tracking-[0.22em] mt-2">
          {sublabel}
        </p>
      )}
    </div>
    {action}
  </div>
);

export const Empty = ({ children }) => (
  <Card className="p-10 text-center text-[#9A9A9A] text-[13px] font-mono">{children}</Card>
);

// ============================================================================
// LA7 LOGO
// ============================================================================
export const LA7Logo = ({ size = 28, className = "" }) => (
  <svg
    viewBox="0 0 120 60"
    width={size * 2}
    height={size}
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M 8 8 L 8 50 L 30 50 L 30 44 L 14 44 L 14 8 Z" fill="currentColor" />
    <path d="M 14 8 L 18 12 L 18 44 L 14 44 Z" fill="currentColor" opacity="0.4" />
    <path
      d="M 38 50 L 48 8 L 56 8 L 66 50 L 60 50 L 58 42 L 46 42 L 44 50 Z M 47.5 36 L 56.5 36 L 52 16 Z"
      fill="currentColor"
    />
    <path
      d="M 74 8 L 102 8 L 102 14 L 88 50 L 80 50 L 94 14 L 74 14 Z"
      fill="currentColor"
    />
    <path d="M 88 50 L 80 50 L 84 38 L 90 38 Z" fill="currentColor" opacity="0.4" />
    <text x="106" y="14" fontSize="6" fill="currentColor" fontFamily="monospace" opacity="0.7">
      TM
    </text>
  </svg>
);

// ============================================================================
// IMAGE LIGHTBOX + BANK TRANSFER PREVIEW
// ============================================================================
export const ImageLightbox = ({ src, onClose, caption }) => {
  if (!src) return null;
  return (
    <div
      className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8 animate-fade-in"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-[#9A9A9A] hover:text-white p-2 transition-all hover:rotate-90 transform z-10 bg-[#141414]/70 border border-[#3A3A3A]"
        aria-label="Close"
      >
        <X size={20} />
      </button>
      {caption && (
        <div className="text-[10px] uppercase tracking-[0.3em] text-[#9A9A9A] font-mono mb-4">
          {caption}
        </div>
      )}
      <img
        src={src}
        alt={caption || "Receipt"}
        className="max-w-full max-h-[85vh] object-contain border border-[#3A3A3A] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
      <div className="text-[10px] text-[#5A5A5A] font-mono uppercase tracking-[0.25em] mt-4">
        Click anywhere to close
      </div>
    </div>
  );
};

export const BankTransferPreview = ({ src, onExpand }) => {
  if (!src) {
    return (
      <div className="bg-[#0A0A0A] border border-dashed border-[#2A2A2A] p-4 text-center text-[11px] text-[#5A5A5A] font-mono uppercase tracking-[0.2em]">
        No receipt attached
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onExpand}
      className="group relative bg-[#0A0A0A] border border-[#2A2A2A] hover:border-[#F5F5F5] transition-all duration-200 overflow-hidden block w-full"
    >
      <img src={src} alt="Bank transfer receipt" className="w-full h-32 sm:h-40 object-cover" />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-[#141414] border border-[#F5F5F5] px-3 py-1.5">
          <ZoomIn size={14} className="text-[#F5F5F5]" />
          <span className="text-[11px] uppercase tracking-[0.2em] font-bold">Expand</span>
        </div>
      </div>
      <div className="absolute top-2 left-2 bg-[#141414]/90 px-2 py-1 text-[9px] uppercase tracking-[0.2em] font-bold text-[#F5F5F5] flex items-center gap-1.5 border border-[#3A3A3A]">
        <Receipt size={10} />
        Bank Transfer
      </div>
    </button>
  );
};
