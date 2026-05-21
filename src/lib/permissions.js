// ============================================================================
// PERMISSIONS — single source of truth for both UI and dispatch validation
// ============================================================================
// PT sessions can ONLY be deducted by coach or coaches_manager.
// Founder retains override (data integrity / corrections).
// Front Desk and everyone else are explicitly blocked.
export const canDeductPT = (role) =>
  role === "coach" || role === "coaches_manager" || role === "founder";

// Class sessions — Front Desk can check-in (per existing flow); also coach/coaches_manager/founder.
export const canDeductClass = (role) =>
  role === "front_desk" ||
  role === "coach" ||
  role === "coaches_manager" ||
  role === "founder";

// Generic deduct check — depends on subscription type
export const canDeductSubscription = (role, subType) =>
  subType === "PT" ? canDeductPT(role) : canDeductClass(role);

// Only Founder can edit package prices
export const canEditPackages = (role) => role === "founder";

// Centralized authorization error class — same shape backend would return
export class AuthorizationError extends Error {
  constructor(action) {
    super(`UNAUTHORIZED: role not permitted for action "${action}"`);
    this.code = 403;
    this.name = "AuthorizationError";
  }
}

// Cooldown — coaches can deduct once every 12 hours per subscription
export const COACH_COOLDOWN_HOURS = 12;
