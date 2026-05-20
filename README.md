# LA7 — Premium Fitness CRM

> Gym management system for **LA7 Premium Fitness**, Cairo. Built as a single-page React application with role-based access control, partial-payment support, PIN-verified front-desk operations, and printable A4 invoices.

This is a **prototype / proof-of-concept**. All data is held in memory and resets on page refresh. The codebase is structured to be migrated to a real backend without rewriting the UI.

---

## ✨ Features

### Role-based access control (7 roles)
| Role | Can do |
|------|--------|
| **Founder** | Full god mode — revenue, members, subs, payments, coach views, **package pricing**, user management |
| **General Manager** | Revenue overview only |
| **Coaches Manager** | Revenue per coach, deduct sessions for any coach, reassign coaches |
| **Classes Manager** | Class income + per-instructor breakdown |
| **Accountant** | Payments, invoices, full filters & CSV export |
| **Coach** | Their own members + their own income; 12h cooldown per session deduction |
| **Front Desk** | New subscriptions, class check-ins, browse members, view revenue. **Cannot deduct PT sessions.** |

### Payment & accountability
- **4-digit PIN verification** for every payment a Front Desk employee records (demo PIN: `0000`)
- **Partial payments** — split any payment across Cash, Visa, and Bank Transfer (up to 3 splits)
- **Bank Transfer receipts** — image upload required when method is Bank Transfer; click-to-expand viewer
- **Discount support** — per-payment discount that appears on the invoice
- **Audit trail** on every payment: `recordedBy`, `verifiedBy`, `verifiedAt`

### Invoices
- Auto-numbered `INV-YYYYMM-NNNN` based on monthly sequence
- A4-formatted printable layout matching real-world Egyptian gym invoices (VAT 14%, EGP currency)
- Print-ready CSS — `Ctrl+P` produces a clean single-page PDF
- Bank Transfer receipt thumbnail embedded for accounting verification

### Membership operations
- Sessions decrement on check-in (Front Desk for classes) or coach deduction (PT)
- 12-hour cooldown per coach prevents double-deduction; Coaches Manager and Founder bypass
- Subscription expiry warnings (≤3 sessions or ≤7 days)
- Reassign subscription to different coach

### Search & filters
- Debounced 200ms global search across members, payments, invoices
- Multi-dimensional filters: type, coach, package, method, date range
- CSV export for all payment data

### Permission enforcement (front-end and "back-end")
Permission checks live in `src/lib/permissions.js` and are enforced in two layers:

1. **UI layer** — buttons are hidden / disabled for unauthorized roles
2. **Reducer layer** — every `dispatch` is guarded by `actorRole` injection; the reducer throws `AuthorizationError` for forbidden actions, which gets caught and surfaced as a toast

This mirrors how a real backend middleware would validate every request, regardless of what the UI sent.

---

## 🚀 Quick start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The dev server opens automatically at `http://localhost:5173`.

---

## 🔑 Demo credentials

The login screen shows **all 7 roles** as buttons — click any to enter as that role. No password needed at login (the login flow is illustrative; real auth comes with the backend).

The **payment PIN** (used when Front Desk records a payment) is `0000` for every employee in the demo seed. The Founder can change it per-employee under **User Mgmt → Staff & Managers → Edit**.

---

## 🛠 Tech stack

- **React 18** with hooks and a single `useReducer` for app-wide state
- **Vite** for dev server and builds
- **Tailwind CSS** for styling (utility-first; no global stylesheet beyond animations and print rules)
- **lucide-react** for iconography
- **No backend** — all state is in-memory, derived from a synthetic seed

---

## 📁 Project structure

```
src/
├── App.jsx                       # Root component — provider + role-based interface routing
├── main.jsx                      # Vite entry
├── index.css                     # Global styles, animations, print CSS
│
├── lib/                          # Pure logic — no React
│   ├── helpers.js                # Date, money, invoice helpers + useDebounce hook
│   ├── permissions.js            # canDeductPT, canEditPackages, AuthorizationError
│   └── constants.js              # Initial package catalog
│
├── state/                        # State management
│   ├── context.js                # AppCtx + useApp() hook
│   ├── reducer.js                # Single reducer for all CRUD + permission enforcement
│   └── seed.js                   # generateSeed() + initialState
│
├── components/                   # Reusable building blocks
│   ├── primitives.jsx            # Btn, Card, Modal, Input, Tabs, StatusBadge, etc.
│   ├── RevenueDashboard.jsx      # Day/Month/Year toggle + breakdowns
│   ├── InvoicePrint.jsx          # A4 printable invoice
│   ├── PaymentConfirmModal.jsx   # 4-digit PIN entry
│   ├── PaymentDetailModal.jsx    # Payment detail view with receipt lightbox
│   ├── MemberProfile.jsx         # Subscriptions + payment history + attendance
│   ├── AddSubscriptionForm.jsx   # Multi-method payment, splits, discount, PIN gate
│   ├── CheckInPanel.jsx          # Front-desk class check-in
│   ├── CoachMembersView.jsx      # Coach's member list with deduct + reassign
│   ├── FilterableLists.jsx       # FilterableMembersList + FilterablePaymentsList
│   └── Management.jsx            # Package, User, Member, Subscription CRUD
│
└── interfaces/                   # Top-level role screens
    ├── Shell.jsx                 # Sticky header + tabs + role label
    ├── LoginScreen.jsx           # 7-role selector
    └── RoleInterfaces.jsx        # One component per role
```

---

## 🗄 Data model

All state lives in a single reducer in `src/state/reducer.js`. The shape is:

```js
{
  coaches:       [{ id, name, specialization, phone, email }],
  staff:         [{ id, name, role, phone, email, paymentPin }],
  members:       [{ id, name, phone }],
  subscriptions: [{
    id, memberId, type: "PT" | "Class" | "Nutrition",
    instructorId, packageName,
    totalSessions, sessionsRemaining,
    startDate, endDate, paymentId,
    lastDeductionByCoach: { [coachId]: ISO_timestamp }  // for 12h cooldown
  }],
  payments: [{
    id, memberId, subscriptionId, type, amount, method,
    splits: [{ method, amount }],   // partial payments
    discount,                       // EGP
    bankTransferImage,              // base64 / null
    datetime, recordedBy,
    // PIN audit trail
    requiresVerification, verified, verifiedBy, verifiedAt
  }],
  attendance: [{ id, memberId, subscriptionId, datetime, deductedBy }],
  packages:   [{ id, type, name, sessions, days, price }]  // editable by Founder
}
```

Invoices are **derived** from payments — there is no separate invoices table. The invoice number is calculated on-the-fly from each payment's position in its month.

---

## 🚧 Roadmap to production

This is a frontend-only prototype. To deploy in a real gym, the following layers need to be added:

1. **Backend** — Node/Express or Next.js API with PostgreSQL (recommended: Supabase or Neon for managed)
2. **Authentication** — Real login with JWT/session cookies; **PINs hashed with bcrypt**, never stored plaintext
3. **Storage** — S3 / Supabase Storage for bank transfer receipt images
4. **Permission middleware** — Mirror `src/lib/permissions.js` server-side; the reducer guards are illustrative only
5. **Multi-branch support** — Branch model + branch-aware filtering on subscriptions, payments, staff
6. **Audit log** — Append-only log of every state-mutating action with actor, timestamp, IP

The current architecture is intentionally compatible with this migration path. State actions in the reducer map cleanly onto REST endpoints; the `actorRole` injection in `App.jsx` mirrors how auth middleware would attach the user to a request.

---

## 📝 License

MIT — see [LICENSE](./LICENSE).

---

## 🙏 Acknowledgements

Built for **LA7 Premium Fitness**, New Cairo, Egypt.
Invoice layout inspired by Shelter Technology's gym CRM invoice format.
