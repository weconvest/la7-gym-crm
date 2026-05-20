import React, { useState, useReducer, useRef, useCallback, useMemo } from "react";
import { AppCtx } from "./state/context.js";
import { reducer } from "./state/reducer.js";
import { initialState } from "./state/seed.js";
import { AuthorizationError } from "./lib/permissions.js";
import { Toast } from "./components/primitives.jsx";
import LoginScreen from "./interfaces/LoginScreen.jsx";
import {
  FrontDeskInterface,
  CoachInterface,
  GeneralManagerInterface,
  CoachesManagerInterface,
  ClassesManagerInterface,
  AccountantInterface,
  FounderInterface,
} from "./interfaces/RoleInterfaces.jsx";

// ============================================================================
// ROOT APP — wires state, dispatch, session, and toast into one Provider.
//
// `dispatch` is wrapped to:
//   1. auto-inject `actorRole` from session (mirroring backend auth middleware)
//   2. catch AuthorizationError and surface as a toast
// ============================================================================
export default function App() {
  const [state, rawDispatch] = useReducer(reducer, initialState);
  const [session, setSession] = useState(null);
  const [toastMsg, setToastMsg] = useState("");
  const toastTimer = useRef(null);

  const toast = useCallback((msg) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(""), 2800);
  }, []);

  const dispatch = useCallback(
    (action) => {
      try {
        rawDispatch({ ...action, actorRole: action.actorRole ?? session?.role });
      } catch (err) {
        if (err instanceof AuthorizationError) {
          toast("Unauthorized — your role does not permit this action");
          console.warn(err.message);
          return;
        }
        throw err;
      }
    },
    [session, toast]
  );

  const ctx = useMemo(
    () => ({ state, dispatch, toast, session }),
    [state, dispatch, toast, session]
  );

  return (
    <AppCtx.Provider value={ctx}>
      {!session && <LoginScreen onLogin={(role, user) => setSession({ role, user })} />}
      {session?.role === "front_desk" && (
        <FrontDeskInterface user={session.user} onLogout={() => setSession(null)} />
      )}
      {session?.role === "coach" && (
        <CoachInterface user={session.user} onLogout={() => setSession(null)} />
      )}
      {session?.role === "general_manager" && (
        <GeneralManagerInterface user={session.user} onLogout={() => setSession(null)} />
      )}
      {session?.role === "coaches_manager" && (
        <CoachesManagerInterface user={session.user} onLogout={() => setSession(null)} />
      )}
      {session?.role === "classes_manager" && (
        <ClassesManagerInterface user={session.user} onLogout={() => setSession(null)} />
      )}
      {session?.role === "accountant" && (
        <AccountantInterface user={session.user} onLogout={() => setSession(null)} />
      )}
      {session?.role === "founder" && (
        <FounderInterface user={session.user} onLogout={() => setSession(null)} />
      )}
      <Toast msg={toastMsg} onClose={() => setToastMsg("")} />
    </AppCtx.Provider>
  );
}
