import { createContext, useContext } from "react";

// Global application context — provides state, dispatch, toast, and session.
// Consumed via the useApp() hook by every component that needs them.
export const AppCtx = createContext(null);

export const useApp = () => useContext(AppCtx);
