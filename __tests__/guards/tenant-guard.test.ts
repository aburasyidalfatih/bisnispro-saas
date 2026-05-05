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
    vi.mocked(db.tenantUser.findUnique).mockResolvedValue(null)
    
    await expect(requireTenantAccess('tenant-1')).rejects.toThrow('Forbidden: Insufficient privileges for this tenant')
  })

  it('TC4: Berhasil mengembalikan user jika role valid (admin)', async () => {
    const mockUser = { id: 'user-1', isSuperAdmin: false }
    vi.mocked(auth).mockResolvedValue({ user: mockUser } as any)
    
    vi.mocked(db.tenantUser.findUnique).mockResolvedValue({ role: 'admin' } as any) 
    
    const result = await requireTenantAccess('tenant-1')
    expect(result).toEqual(mockUser)
  })

  it('TC5: Melempar Error jika role user tidak diizinkan', async () => {
    const mockUser = { id: 'user-1', isSuperAdmin: false }
    vi.mocked(auth).mockResolvedValue({ user: mockUser } as any)
    
    // Default allowedRoles = ["owner", "admin", "operator"]
    vi.mocked(db.tenantUser.findUnique).mockResolvedValue({ role: 'student' } as any) 
    
    await expect(requireTenantAccess('tenant-1')).rejects.toThrow('Forbidden')
  })
})
