# 🧪 Laporan Arsitektur Testing & Eksekusi Unit Test SchoolPro

**Peran:** Lead QA Automation Engineer & Next.js Testing Expert  
**Proyek:** SchoolPro SaaS (Next.js 14/15, Prisma, NextAuth)

Laporan ini merangkum strategi *testing*, pedoman pengaturan *environment*, dan blok kode *Unit Test* kritis untuk memvalidasi isolasi keamanan antar tenant (*Tenant Guard*) serta stabilitas *Server Actions*.

---

## 1. Executive Setup & Konfigurasi (Fase Inisialisasi)

Untuk ekosistem Next.js App Router dengan Prisma, kita akan menggunakan **Vitest** (karena kecepatannya dan kompatibilitas ES Modules yang jauh lebih baik dari Jest) bersama **React Testing Library**.

### A. Instalasi Paket:
Lakukan instalasi dependensi berikut di *terminal*:
```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/dom jsdom vitest-mock-extended
```

### B. Konfigurasi `vitest.config.ts`:
Buat file `vitest.config.ts` di *root* proyek untuk mengatur lingkungan Next.js dan path alias:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

### C. Mocking Prisma ORM (`__mocks__/prisma.ts`):
Agar tes tidak mengenai database PostgreSQL sungguhan (mempercepat eksekusi dan mencegah kebocoran data test), kita mock instance Prisma.

**File: `vitest.setup.ts`**
```typescript
import { vi } from 'vitest'
// Mock modul Prisma
vi.mock('@/lib/db', () => require('./__mocks__/prisma'))
// Mock NextAuth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn()
}))
```

**File: `__mocks__/prisma.ts`**
```typescript
import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended'

export const db = mockDeep<PrismaClient>()

beforeEach(() => {
  mockReset(db)
})
```

---

## 2. Security & Guard Testing (Prioritas Utama: Kritikal)

Fokus utama adalah fungsi `requireTenantAccess` di file `src/lib/guards/tenant-guard.ts`. Jika ini bocor, satu tenant bisa melihat atau menghapus data tenant lain!

**File: `__tests__/guards/tenant-guard.test.ts`**
```typescript
import { describe, it, expect, vi } from 'vitest'
import { requireTenantAccess } from '@/lib/guards/tenant-guard'
import { auth } from '@/lib/auth'
import { db } from '../../__mocks__/prisma'

describe('requireTenantAccess Guard', () => {
  
  it('TC1: Melempar Error "Unauthorized" jika user belum login', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    await expect(requireTenantAccess('tenant-1')).rejects.toThrow('Unauthorized')
  })

  it('TC2: Lolos otomatis jika user adalah SuperAdmin', async () => {
    const mockUser = { id: 'user-1', isSuperAdmin: true }
    vi.mocked(auth).mockResolvedValue({ user: mockUser } as any)
    
    const result = await requireTenantAccess('tenant-1')
    expect(result).toEqual(mockUser)
    expect(db.tenantUser.findUnique).not.toHaveBeenCalled()
  })

  it('TC3: Melempar Error "Forbidden" jika mengakses tenant bukan miliknya', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1', isSuperAdmin: false } } as any)
    db.tenantUser.findUnique.mockResolvedValue(null) // User tidak terdaftar di tenant ini
    
    await expect(requireTenantAccess('tenant-1')).rejects.toThrow('Forbidden')
  })

  it('TC4: Berhasil mengembalikan user jika role valid (owner/admin/operator)', async () => {
    const mockUser = { id: 'user-1', isSuperAdmin: false }
    vi.mocked(auth).mockResolvedValue({ user: mockUser } as any)
    
    // User terdaftar sebagai 'admin' di tenant ini
    db.tenantUser.findUnique.mockResolvedValue({ role: 'admin' } as any) 
    
    const result = await requireTenantAccess('tenant-1')
    expect(result).toEqual(mockUser)
  })
})
```

---

## 3. Server Actions Testing (Isolasi Mutasi Backend)

Pengujian pada `src/lib/actions/facilities.ts` untuk memastikan validasi Zod dan panggilan sekuritas berjalan.

**File: `__tests__/actions/facilities.test.ts`**
```typescript
import { describe, it, expect, vi } from 'vitest'
import { createFacility } from '@/lib/actions/facilities'
import { requireTenantAccess } from '@/lib/guards/tenant-guard'
import { db } from '../../__mocks__/prisma'

// Mock fungsi Guard agar lolos
vi.mock('@/lib/guards/tenant-guard', () => ({
  requireTenantAccess: vi.fn()
}))

// Mock revalidatePath bawaan Next.js
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

describe('Server Actions: createFacility', () => {
  
  it('Menolak eksekusi (Zod Error) jika nama fasilitas kosong', async () => {
    const invalidData = { name: "" }
    
    await expect(createFacility('tenant-1', invalidData)).rejects.toThrow()
    // Pastikan Guard tetap terpanggil sebelum Zod error
    expect(requireTenantAccess).toHaveBeenCalledWith('tenant-1')
    // Pastikan DB tidak pernah disentuh
    expect(db.facility.create).not.toHaveBeenCalled()
  })

  it('Berhasil membuat fasilitas dan melakukan revalidatePath', async () => {
    const validData = { name: "Laboratorium Komputer", category: "Lab" }
    const mockReturn = { id: 'fac-1', ...validData, tenantId: 'tenant-1' }
    
    db.facility.create.mockResolvedValue(mockReturn as any)
    
    const result = await createFacility('tenant-1', validData)
    
    expect(requireTenantAccess).toHaveBeenCalledWith('tenant-1')
    expect(db.facility.create).toHaveBeenCalledWith({
      data: { name: "Laboratorium Komputer", category: "Lab", tenantId: 'tenant-1' }
    })
    expect(result.id).toBe('fac-1')
  })
})
```

---

## 4. UI Components & Validation Testing (Integrasi Form)

Menguji **Client Component** (React Component) menggunakan RTL (React Testing Library).

**File: `__tests__/components/NewFacilityForm.test.tsx`**
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import NewFacilityPage from '@/app/(dashboard)/dashboard/website/facilities/new/page'
import { vi } from 'vitest'

// Mock hooks & actions
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/components/providers/tenant-branding-provider', () => ({
  useTenantBranding: () => ({ branding: { id: 'tenant-1' } })
}))
vi.mock('@/lib/actions/facilities', () => ({
  createFacility: vi.fn()
}))

describe('UI: New Facility Form', () => {
  it('Menampilkan error / toast jika form di-submit dalam keadaan kosong', async () => {
    render(<NewFacilityPage />)
    
    // Cari tombol submit menggunakan text
    const submitBtn = screen.getByText('Simpan Perubahan')
    fireEvent.click(submitBtn)
    
    // Proses form kosong, toast warning diharapkan muncul
    // (Dalam setup penuh, kita mock hook useToast juga untuk verifikasi kemunculannya)
  })
})
```

---

## 5. Action Plan & Testing Checklist

Untuk sesi penyempurnaan dan instalasi kode testing secara nyata (bukan hanya laporan/dummy), ini adalah daftar yang akan kita selesaikan:

- [ ] **Setup Framework:** Menjalankan `npm install -D vitest ...` dan menambahkan script `"test": "vitest"` di `package.json`.
- [ ] **Mock Configuration:** Menyelesaikan konfigurasi `__mocks__/prisma.ts`.
- [ ] **Test Coverage: Guards (`src/lib/guards/*`)**
  - `tenant-guard.ts` (100% Coverage Target)
- [ ] **Test Coverage: Server Actions (`src/lib/actions/*`)**
  - `facilities.ts`
  - `staff.ts`
  - `program.ts`
  - `extracurricular.ts`
- [ ] **Test Coverage: API Routes**
  - `/api/internal/domain-lookup` (Kritikal untuk subdomain).
- [ ] **Test Coverage: Middleware**
  - Menguji logika *rewrite* subdomain (Jika memungkinkan diekstrak fungsinya).

Dokumen arsitektur ini siap digunakan! Kapan pun Anda menginstruksikan untuk menjalankan "Eksekusi Instalasi Testing", saya akan mulai menulis *file-file* di atas ke dalam direktori `__tests__` yang sebenarnya di repositori Anda.
