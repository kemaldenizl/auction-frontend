import type { HttpClient } from "@/shared/api";
import { apiHttp } from "@/features/auth/lib/api-http";
import type { Permission, Role } from "@/features/auth/model/auth";

/** Roles carry their permissions inline, so one read fills the whole screen. */
export function createRolesApi(http: HttpClient) {
  return {
    list: (signal?: AbortSignal) => http.get<Role[]>("/api/roles", { signal }),

    get: (id: string, signal?: AbortSignal) =>
      http.get<Role>(`/api/roles/${id}`, { signal }),

    create: (name: string) => http.post<Role>("/api/roles", { name }),

    rename: (id: string, name: string) =>
      http.put<Role>(`/api/roles/${id}`, { name }),

    remove: (id: string) => http.delete<void>(`/api/roles/${id}`),

    addPermission: (roleId: string, permissionId: string) =>
      http.post<void>(`/api/roles/${roleId}/permissions`, { permissionId }),

    removePermission: (roleId: string, permissionId: string) =>
      http.delete<void>(`/api/roles/${roleId}/permissions/${permissionId}`),
  };
}

export function createPermissionsApi(http: HttpClient) {
  return {
    list: (signal?: AbortSignal) =>
      http.get<Permission[]>("/api/permissions", { signal }),

    /**
     * Creating a code does not make it *do* anything — the backend has to bind
     * it to an endpoint. These endpoints exist to hand existing permissions
     * out to roles.
     */
    create: (code: string) => http.post<Permission>("/api/permissions", { code }),

    remove: (id: string) => http.delete<void>(`/api/permissions/${id}`),
  };
}

export function createUserRolesApi(http: HttpClient) {
  return {
    assign: (userId: string, roleId: string) =>
      http.post<void>(`/api/users/${userId}/roles`, { roleId }),

    remove: (userId: string, roleId: string) =>
      http.delete<void>(`/api/users/${userId}/roles/${roleId}`),
  };
}

export const rolesApi = createRolesApi(apiHttp);
export const permissionsApi = createPermissionsApi(apiHttp);
export const userRolesApi = createUserRolesApi(apiHttp);
