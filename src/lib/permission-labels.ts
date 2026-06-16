/**
 * Permission Label Mapping
 * Mengubah permission code menjadi label yang user-friendly
 * Format: "action.resource" → "Aksi Resource"
 */

const PERMISSION_LABELS: Record<string, string> = {
  // Role permissions
  "read.all.roles": "Lihat Semua Role",
  "create.role": "Membuat Role",
  "read.role": "Lihat Role",
  "update.role": "Update Role",
  "delete.role": "Hapus Role",

  // User permissions
  "read.all.users": "Lihat Semua User",
  "create.user": "Membuat User",
  "read.user": "Lihat User",
  "update.user": "Update User",
  "delete.user": "Hapus User",
  "update.user.roles": "Update Role User",
  "update.user.status": "Update Status User",
  "read.permission": "Lihat Permission",

  // Contract Category permissions
  "read.contract_category": "Lihat Kategori Kontrak",
  "create.contract_category": "Membuat Kategori Kontrak",
  "update.contract_category": "Update Kategori Kontrak",
  "delete.contract_category": "Hapus Kategori Kontrak",

  // Contract permissions
  "read.contracts": "Lihat Kontrak",
  "create.contract": "Membuat Kontrak",
  "update.contract": "Update Kontrak",
  "delete.contract": "Hapus Kontrak",
  "terminate.contract": "Terminasi Kontrak",
  "download.contract": "Download Kontrak",
  "create.contract_addendum": "Membuat Addendum Kontrak",

  // Template permissions
  "read.template": "Lihat Template",
  "create.template": "Membuat Template",
  "update.template": "Update Template",
  "delete.template": "Hapus Template",
  "download.template": "Download Template",
};

/**
 * Mengubah permission code menjadi label user-friendly
 * Jika tidak ada mapping, fallback ke format readable otomatis
 */
export function getPermissionLabel(permissionCode: string): string {
  if (PERMISSION_LABELS[permissionCode]) {
    return PERMISSION_LABELS[permissionCode];
  }

  // Fallback: generate readable label from code
  // Misal: "read.contracts" → "Read Contracts"
  return permissionCode
    .split(".")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Export mapping untuk reference atau testing
 */
export { PERMISSION_LABELS };
