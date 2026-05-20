import { uid, todayISO } from "../lib/helpers.js";
import {
  canDeductSubscription,
  canEditPackages,
  AuthorizationError,
} from "../lib/permissions.js";

// ============================================================================
// REDUCER — single state machine for the entire app
//
// All actions flow through here. The reducer also acts as a
// backend-style guard, throwing AuthorizationError when a role attempts
// an action they don't have permission for.
// ============================================================================
export function reducer(state, action) {
  // ─── BACKEND-LEVEL PERMISSION ENFORCEMENT ───
  // Even if frontend hides a button, dispatch validates role too.
  // Simulates a server-side guard. Throws AuthorizationError on violation.
  if (action.type === "DEDUCT_SESSION") {
    const sub = state.subscriptions.find((s) => s.id === action.subscriptionId);
    if (!sub) return state;
    if (!canDeductSubscription(action.actorRole, sub.type)) {
      throw new AuthorizationError(`DEDUCT_${sub.type}_SESSION`);
    }
  }
  if (
    action.type === "UPDATE_PACKAGE" ||
    action.type === "ADD_PACKAGE" ||
    action.type === "DELETE_PACKAGE"
  ) {
    if (!canEditPackages(action.actorRole)) {
      throw new AuthorizationError("EDIT_PACKAGE");
    }
  }
  // Payment confirmation requires verified PIN flag
  if (
    action.type === "ADD_PAYMENT" &&
    action.payment?.requiresVerification &&
    !action.payment?.verified
  ) {
    throw new AuthorizationError("UNVERIFIED_PAYMENT");
  }

  switch (action.type) {
    case "ADD_MEMBER":
      return { ...state, members: [...state.members, action.member] };
    case "UPDATE_MEMBER":
      return {
        ...state,
        members: state.members.map((m) =>
          m.id === action.member.id ? action.member : m
        ),
      };
    case "DELETE_MEMBER":
      return {
        ...state,
        members: state.members.filter((m) => m.id !== action.id),
        subscriptions: state.subscriptions.filter((s) => s.memberId !== action.id),
        payments: state.payments.filter((p) => p.memberId !== action.id),
        attendance: state.attendance.filter((a) => a.memberId !== action.id),
      };
    case "ADD_SUBSCRIPTION":
      return {
        ...state,
        subscriptions: [...state.subscriptions, action.subscription],
      };
    case "UPDATE_SUBSCRIPTION":
      return {
        ...state,
        subscriptions: state.subscriptions.map((s) =>
          s.id === action.subscription.id ? action.subscription : s
        ),
      };
    case "DELETE_SUBSCRIPTION":
      return {
        ...state,
        subscriptions: state.subscriptions.filter((s) => s.id !== action.id),
      };
    case "ADD_PAYMENT":
      return { ...state, payments: [...state.payments, action.payment] };
    case "UPDATE_PAYMENT":
      return {
        ...state,
        payments: state.payments.map((p) =>
          p.id === action.payment.id ? action.payment : p
        ),
      };
    case "DELETE_PAYMENT":
      return {
        ...state,
        payments: state.payments.filter((p) => p.id !== action.id),
      };
    case "ADD_ATTENDANCE":
      return { ...state, attendance: [...state.attendance, action.attendance] };
    case "DEDUCT_SESSION": {
      const subs = state.subscriptions.map((s) => {
        if (s.id !== action.subscriptionId) return s;
        const next = { ...s, sessionsRemaining: Math.max(0, s.sessionsRemaining - 1) };
        if (action.cooldownKey) {
          next.lastDeductionByCoach = {
            ...(s.lastDeductionByCoach || {}),
            [action.cooldownKey]: todayISO(),
          };
        }
        return next;
      });
      const att = {
        id: uid(),
        memberId: action.memberId,
        subscriptionId: action.subscriptionId,
        datetime: todayISO(),
        deductedBy: action.deductedBy,
      };
      return { ...state, subscriptions: subs, attendance: [...state.attendance, att] };
    }
    case "REASSIGN_COACH":
      return {
        ...state,
        subscriptions: state.subscriptions.map((s) =>
          s.id === action.subscriptionId
            ? { ...s, instructorId: action.newCoachId }
            : s
        ),
      };
    case "ADD_COACH":
      return { ...state, coaches: [...state.coaches, action.coach] };
    case "UPDATE_COACH":
      return {
        ...state,
        coaches: state.coaches.map((c) =>
          c.id === action.coach.id ? action.coach : c
        ),
      };
    case "DELETE_COACH":
      return {
        ...state,
        coaches: state.coaches.filter((c) => c.id !== action.id),
      };
    case "ADD_STAFF":
      return { ...state, staff: [...state.staff, action.staff] };
    case "UPDATE_STAFF":
      return {
        ...state,
        staff: state.staff.map((s) => (s.id === action.staff.id ? action.staff : s)),
      };
    case "DELETE_STAFF":
      return {
        ...state,
        staff: state.staff.filter((s) => s.id !== action.id),
      };
    case "ADD_PACKAGE":
      return { ...state, packages: [...state.packages, action.pkg] };
    case "UPDATE_PACKAGE":
      return {
        ...state,
        packages: state.packages.map((p) => (p.id === action.pkg.id ? action.pkg : p)),
      };
    case "DELETE_PACKAGE":
      return {
        ...state,
        packages: state.packages.filter((p) => p.id !== action.id),
      };
    default:
      return state;
  }
}
