# Agreema Frontend

Frontend Agreema adalah aplikasi web berbasis React, TypeScript, dan Vite untuk mengelola kontrak perusahaan. Aplikasi ini terhubung ke REST API Laravel pada project `backend-agreema`.

Frontend menyediakan antarmuka untuk admin, HRD, manager, user internal, dan pihak eksternal dalam proses pembuatan, review, revisi, approval, tanda tangan, addendum, terminasi, dashboard, dan notifikasi kontrak.

## Fitur Utama

- Login, forgot password, dan reset password.
- Proteksi halaman berdasarkan autentikasi dan permission user.
- Dashboard role-based untuk admin, HRD, manager, dan internal user.
- Manajemen user, role, dan permission.
- Manajemen kategori kontrak.
- Manajemen template kontrak.
- Editor template dan kontrak berbasis TipTap.
- Field dinamis kontrak.
- Preview dokumen kontrak dan PDF.
- Pembuatan kontrak dari template.
- Review manager dengan approval, revision request, reject, catatan, dan tanda tangan.
- Tanda tangan pihak eksternal melalui halaman public.
- Daftar kontrak aktif, arsip kontrak, kontrak mitra, addendum, dan terminasi.
- Notifikasi real-time style melalui notification bell dan toast.
- Grafik/dashboard menggunakan Recharts.
- Upload dan parsing dokumen pendukung sesuai integrasi API.

## Tech Stack

- React `^19.2.0`
- TypeScript `~5.9.3`
- Vite `^7.2.4`
- React Router DOM `^7.12.0`
- Axios
- Tailwind CSS `^4.1.18`
- Radix UI
- Lucide React
- TipTap editor
- React Hook Form
- Zod
- Recharts
- Sonner
- Mammoth untuk pembacaan DOCX di sisi frontend

## Struktur Folder Penting

```text
frontend-agreema/
|-- public/                  # asset public
|-- src/
|   |-- assets/              # gambar dan asset aplikasi
|   |-- components/          # komponen reusable
|   |   |-- dashboard/       # widget dashboard per role
|   |   |-- editor/          # komponen editor kontrak/template
|   |   |-- modal/           # modal kontrak, addendum, terminasi, template
|   |   |-- sidebar/         # navigasi dashboard
|   |   `-- ui/              # komponen UI dasar
|   |-- contexts/            # AuthContext dan PermissionContext
|   |-- hooks/               # custom hooks
|   |-- layouts/             # layout dashboard
|   |-- lib/                 # helper axios, editor, permission, PDF, DOCX
|   |-- middlewares/         # ProtectedRoute dan PermissionGuard
|   |-- pages/               # halaman aplikasi
|   |-- services/            # API service per modul
|   |-- styles/              # styling tambahan editor
|   |-- types/               # TypeScript type definitions
|   |-- App.tsx              # definisi route aplikasi
|   `-- main.tsx             # entry point React
|-- index.html
|-- package.json
|-- vite.config.ts
`-- vercel.json
```

## Prasyarat

Pastikan sudah terpasang:

- Node.js versi modern yang kompatibel dengan Vite 7
- npm
- Backend `backend-agreema` berjalan di `http://localhost:8000`

## Instalasi

Masuk ke folder frontend:

```bash
cd frontend-agreema
```

Install dependency:

```bash
npm install
```

Buat file `.env` jika belum tersedia:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

Jalankan development server:

```bash
npm run dev
```

Secara default aplikasi berjalan di:

```text
http://localhost:5173
```

## Script NPM

```bash
npm run dev
```

Menjalankan Vite development server.

```bash
npm run build
```

Menjalankan TypeScript build check lalu membuat production build ke folder `dist`.

```bash
npm run lint
```

Menjalankan ESLint.

```bash
npm run preview
```

Menjalankan preview hasil build production secara lokal.

## Konfigurasi Environment

Frontend hanya membutuhkan base URL API:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

Untuk production, ganti nilainya ke domain backend production, misalnya:

```env
VITE_API_BASE_URL=https://domain-backend.com/api
```

Konfigurasi Axios berada di:

```text
src/lib/axios.ts
```

Axios akan:

- Menambahkan header `Authorization: Bearer <token>` dari `localStorage` atau `sessionStorage`.
- Membersihkan session dan redirect ke `/login` saat response `401`.
- Redirect ke `/unauthorized` saat response `403`.
- Redirect ke `/server-error` saat response `500`, `502`, atau `503`.

## Route Aplikasi

### Public

| Route | Halaman |
| --- | --- |
| `/` | Login |
| `/login` | Login |
| `/forgot-password` | Forgot Password |
| `/reset-password` | Reset Password |
| `/external/sign` | Review/tanda tangan pihak eksternal |
| `/external/confirm` | Konfirmasi pihak eksternal |
| `/unauthorized` | Halaman akses ditolak |
| `/server-error` | Halaman error server |
| `/404` | Halaman tidak ditemukan |

### Protected

| Route | Permission | Keterangan |
| --- | --- | --- |
| `/dashboard` | login | Dashboard sesuai role |
| `/users` | `read.all.users` | Manajemen user dan role |
| `/contracts` | `read.contracts` | Daftar kontrak |
| `/contracts/partners` | `read.contracts` | Daftar kontrak mitra |
| `/contracts/archive` | `read.contracts` | Arsip kontrak |
| `/contracts/active` | `read.contracts` | Kontrak aktif |
| `/contracts/create` | `create.contract` | Buat kontrak |
| `/contracts/:id/edit` | `update.contract` | Edit kontrak |
| `/contracts/:id/view` | `read.contracts` | Detail/preview kontrak |
| `/categories` | `read.contract_category` | Kategori kontrak |
| `/contracts-templates` | `read.template` | Daftar template |
| `/contracts-templates/new` | `create.template` | Buat template |
| `/contracts-templates/:id/edit` | `update.template` | Edit template |
| `/approvals` | `read.contracts` | Daftar approval manager |
| `/approvals/:id` | `read.contracts` | Detail review manager |
| `/approvals/:id/sign` | `read.contracts` | Tanda tangan manager |

## Modul dan Service API

Service API berada di `src/services`.

| File | Modul |
| --- | --- |
| `auth.service.ts` | Login, logout, user session, reset password |
| `dashboard.service.ts` | Data dashboard |
| `user.service.ts` | User management |
| `roles.service.ts` | Role dan permission |
| `category.service.ts` | Kategori kontrak |
| `template.service.ts` | Template kontrak |
| `field.service.ts` | Field dinamis |
| `contract.service.ts` | Kontrak HRD |
| `manager.service.ts` | Review dan approval manager |
| `external.service.ts` | Review dan tanda tangan eksternal |
| `addendum.service.ts` | Addendum kontrak |
| `termination.service.ts` | Terminasi kontrak |
| `notification.service.ts` | Notifikasi |
| `download.service.ts` | Download dokumen |

## Editor Kontrak

Editor kontrak dibangun dengan TipTap dan helper di folder `src/lib`.

Kemampuan utama:

- Format teks dasar, heading, font size, font family, color, highlight, alignment, line spacing.
- Tabel dengan pengaturan ukuran dan border cell.
- Upload dan resize gambar.
- Page break.
- Paper size A4/F4.
- Margin dokumen.
- Field kontrak dinamis.
- Preview HTML dan PDF.
- Watermark.
- Undo/redo.

Komponen utama editor:

```text
src/components/editor/
src/components/editor/contract/
src/pages/contracts/ContractEditorPage.tsx
src/pages/contracts/template/TemplateEditorPage.tsx
```

## Alur Penggunaan

### Admin

1. Login sebagai admin.
2. Kelola user, role, permission, kategori kontrak, dan template.
3. Pantau statistik kontrak melalui dashboard.

### HRD

1. Login sebagai HRD.
2. Membuat kontrak dari template atau editor.
3. Mengisi field kontrak dan penandatangan.
4. Menyimpan draft atau submit kontrak ke manager.
5. Memperbaiki kontrak jika status menjadi `revision`.
6. Mengelola addendum atau terminasi untuk kontrak berstatus `active`.

### Manager

1. Login sebagai manager.
2. Membuka daftar approval.
3. Mereview isi kontrak.
4. Memberikan keputusan approve, reject, atau request revision dengan catatan.
5. Menandatangani kontrak jika sudah disetujui.

### Pihak Eksternal

1. Membuka link public dari email/token.
2. Melihat preview kontrak.
3. Memberikan review atau tanda tangan.
4. Mengunduh dokumen bila diperlukan.

## Integrasi Backend

Pastikan backend berjalan lebih dulu:

```bash
cd ../backend-agreema
php artisan serve
```

Kemudian jalankan frontend:

```bash
cd ../frontend-agreema
npm run dev
```

Akun development default dari backend:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@agreema.com` | `password123` |
| Manager | `manager@agreema.com` | `password123` |
| HRD | `hrd@agreema.com` | `password123` |

## Build Production

Jalankan:

```bash
npm run build
```

Output production berada di:

```text
dist/
```

Preview hasil build:

```bash
npm run preview
```

## Deployment

Project memiliki `vercel.json` untuk mendukung deployment SPA di Vercel:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Pastikan environment variable `VITE_API_BASE_URL` sudah diset pada dashboard deployment.

## Catatan Development

- Token autentikasi disimpan di `localStorage` atau `sessionStorage`.
- Permission halaman dikelola oleh `ProtectedRoute` dan `PermissionGuard`.
- Type data API didefinisikan di `src/types`.
- API service dipisahkan per modul agar halaman tidak langsung memanggil Axios.
- Jika backend mengubah struktur response, update type dan service terkait.
- Jalankan `npm run build` sebelum deployment untuk menangkap error TypeScript.
