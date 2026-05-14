import { describe, it, expect, vi, beforeEach } from 'vitest'
import { requireTenantAccess } from '@/lib/guards/tenant-guard'
import { auth } from '@/lib/auth'
import { db } from '../../../__mocks__/prisma'

describe('requireTenantAccess Guard', () => {

  it('TC1: Melempar Error "Unauthorized" jika user belum login', async () => {
    vi.mocked(auth).mockResolvedValue(null as any)
    await expect(requireTenantAccess('tenant-1')).rejects.toThrow('Unauthorized')
  })

  it('TC2: Lolos otomatis jika user adalah SuperAdmin (tanpa query DB)', async () => {
    const mockUser = { id: 'user-sa', isSuperAdmin: true }
    vi.mocked(auth).mockResolvedValue({ user: mockUser } as any)

    const result = await requireTenantAccess('tenant-1')
    expect(result).toEqual(mockUser)
    expect(db.tenantUser.findUnique).not.toHaveBeenCalled()
  })

  it('TC3: Melempar Error "Forbidden" jika user bukan anggota tenant', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1', isSuperAdmin: false } } as any)
    db.tenantUser.findUnique.mockResolvedValue(null)

    await expect(requireTenantAccess('tenant-other')).rejects.toThrow('Forbidden')
  })

  it('TC4: Melempar Error "Forbidden" jika role tidak termasuk allowedRoles', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1', isSuperAdmin: false } } as any)
    db.tenantUser.findUnique.mockResolvedValue({ role: 'orangtua' } as any)

    // Default allowedRoles = ["owner", "admin", "operator"]
    await expect(requireTenantAccess('tenant-1')).rejects.toThrow('Forbidden')
  })

  it('TC5: Berhasil mengembalikan user jika role "owner"', async () => {
    const mockUser = { id: 'user-1', isSuperAdmin: false }
    vi.mocked(auth).mockResolvedValue({ user: mockUser } as any)
    db.tenantUser.findUnique.mockResolvedValue({ role: 'owner' } as any)

    const result = await requireTenantAccess('tenant-1')
    expect(result).toEqual(mockUser)
  })

  it('TC6: Berhasil mengembalikan user jika role "admin"', async () => {
    const mockUser = { id: 'user-2', isSuperAdmin: false }
    vi.mocked(auth).mockResolvedValue({ user: mockUser } as any)
    db.tenantUser.findUnique.mockResolvedValue({ role: 'admin' } as any)

    const result = await requireTenantAccess('tenant-1')
    expect(result).toEqual(mockUser)
  })

  it('TC7: Berhasil mengembalikan user jika role "operator"', async () => {
    const mockUser = { id: 'user-3', isSuperAdmin: false }
    vi.mocked(auth).mockResolvedValue({ user: mockUser } as any)
    db.tenantUser.findUnique.mockResolvedValue({ role: 'operator' } as any)

    const result = await requireTenantAccess('tenant-1')
    expect(result).toEqual(mockUser)
  })

  it('TC8: Menerima custom allowedRoles', async () => {
    const mockUser = { id: 'user-guru', isSuperAdmin: false }
    vi.mocked(auth).mockResolvedValue({ user: mockUser } as any)
    db.tenantUser.findUnique.mockResolvedValue({ role: 'guru' } as any)

    // role "guru" BUKAN di default allowedRoles → harus gagal
    await expect(requireTenantAccess('tenant-1')).rejects.toThrow('Forbidden')

    // Tapi jika kita berikan custom allowedRoles yang mengandung "guru"
    const result = await requireTenantAccess('tenant-1', ['owner', 'admin', 'guru'])
    expect(result).toEqual(mockUser)
  })

  it('TC9: Melakukan query tenantUser dengan composite key yang benar', async () => {
    const mockUser = { id: 'user-check', isSuperAdmin: false }
    vi.mocked(auth).mockResolvedValue({ user: mockUser } as any)
    db.tenantUser.findUnique.mockResolvedValue({ role: 'owner' } as any)

    await requireTenantAccess('tenant-abc')

    expect(db.tenantUser.findUnique).toHaveBeenCalledWith({
      where: {
        tenantId_userId: {
          tenantId: 'tenant-abc',
          userId: 'user-check',
        },
      },
    })
  })
})
