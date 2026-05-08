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
    db.tenantUser.findUnique.mockResolvedValue(null as any) // User tidak terdaftar di tenant ini
    
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
