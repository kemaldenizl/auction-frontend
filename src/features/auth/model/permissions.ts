/**
 * Permission codes the backend enforces.
 *
 * Checking these in the UI is a *presentation* decision — it keeps a button
 * the user cannot use off the screen. The server is what actually enforces
 * them, and it answers `403` regardless of what the UI shows.
 */
export const PERMISSION = {
  productsManage: "products.manage",
  auctionsManage: "auctions.manage",
  usersRead: "users.read",
  usersManage: "users.manage",
  rolesRead: "roles.read",
  rolesManage: "roles.manage",
  permissionsRead: "permissions.read",
  permissionsManage: "permissions.manage",
  sessionsRead: "sessions.read",
  sessionsManage: "sessions.manage",
} as const;

export type PermissionCode = (typeof PERMISSION)[keyof typeof PERMISSION];

/** What a permission lets you do, in words a user understands. */
export const PERMISSION_LABELS: Record<PermissionCode, string> = {
  "products.manage": "Ürün yönetimi",
  "auctions.manage": "Açık artırma yönetimi",
  "users.read": "Kullanıcıları görüntüleme",
  "users.manage": "Kullanıcı rollerini yönetme",
  "roles.read": "Rolleri görüntüleme",
  "roles.manage": "Rol yönetimi",
  "permissions.read": "Yetkileri görüntüleme",
  "permissions.manage": "Yetki yönetimi",
  "sessions.read": "Oturumları görüntüleme",
  "sessions.manage": "Oturum yönetimi",
};

/** Falls back to the raw code for permissions this build does not know yet. */
export function permissionLabel(code: string): string {
  return PERMISSION_LABELS[code as PermissionCode] ?? code;
}

/** Any of these means the admin section is worth showing at all. */
export const ADMIN_PERMISSIONS: readonly PermissionCode[] = [
  PERMISSION.usersRead,
  PERMISSION.usersManage,
  PERMISSION.rolesRead,
  PERMISSION.rolesManage,
  PERMISSION.permissionsRead,
  PERMISSION.permissionsManage,
];

export function hasPermission(
  granted: readonly string[],
  required: PermissionCode,
): boolean {
  return granted.includes(required);
}

export function hasAnyPermission(
  granted: readonly string[],
  required: readonly PermissionCode[],
): boolean {
  return required.some((code) => granted.includes(code));
}
