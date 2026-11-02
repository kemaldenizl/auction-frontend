"use client";

import { useMemo, useSyncExternalStore } from "react";

import {
  hasAnyPermission,
  hasPermission,
  type PermissionCode,
} from "../model/permissions";
import {
  getSessionServerSnapshot,
  getSessionSnapshot,
  subscribeToSession,
  type SessionState,
} from "../model/session-store";

const NO_PERMISSIONS: string[] = [];

export interface SessionHandle extends SessionState {
  permissions: readonly string[];
  isAuthenticated: boolean;
  /** Still restoring from storage — render a skeleton, not a login prompt. */
  isLoading: boolean;
  can: (permission: PermissionCode) => boolean;
  canAny: (permissions: readonly PermissionCode[]) => boolean;
}

export function useSession(): SessionHandle {
  const state = useSyncExternalStore(
    subscribeToSession,
    getSessionSnapshot,
    getSessionServerSnapshot,
  );

  return useMemo(() => {
    const permissions = state.identity?.permissions ?? NO_PERMISSIONS;

    return {
      ...state,
      permissions,
      isAuthenticated: state.status === "authenticated",
      isLoading: state.status === "loading",
      can: (permission) => hasPermission(permissions, permission),
      canAny: (required) => hasAnyPermission(permissions, required),
    };
  }, [state]);
}
