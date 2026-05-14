import { describe, it, expect, vi } from 'vitest'
import { requireAuth, requireSuperAdmin, requireTenantMembership } from '@/lib/api-utils'
import { auth } from '@/lib/auth'
import { db } from '../../../__mocks__/prisma'

describe('API Utils: requireTenantMembership', () => {

  it('TC1: Mengembalikan error 401 jika user belum login', async () => {
    vi.mocked(auth).mockResolvedValue(null as any)

    const { session, error } = await requireTenantMembership('tenant-1')
    expect(session).toBeNull()
    expect(error).toBeDefined()

    const body = await error!.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('TC2: SuperAdmin melewati membership check tanpa query DB', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'sa-1', isSuperAdmin: true },
    } as any)

    const { session, error } = await requireTenantMembership('tenant-any')
    expect(error).toBeNull()
    expect(session!.user.id).toBe('sa-1')
    expect(db.tenantUser.findUnique).not.toHaveBeenCalled()
  })

  it('TC3: Mengembalikan error 403 jika user bukan anggota tenant', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1', isSuperAdmin: false },
    } as any)
    db.tenantUser.findUnique.mockResolvedValue(null)

    const { session, error } = await requireTenantMembership('tenant-other')
    expect(session).toBeNull()
    expect(error).toBeDefined()

    const body = await error!.json()
    expect(body.error).toContain('Forbidden')
  })

  it('TC4: Berhasil jika user adalah anggota tenant (role apapun)', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1', isSuperAdmin: false },
    } as any)
    db.tenantUser.findUnique.mockResolvedValue({ role: 'orangtua' } as any)

    const { session, error } = await requireTenantMembership('tenant-1')
    expect(error).toBeNull()
    expect(session!.user.id).toBe('user-1')
  })
})

describe('API Utils: requireAuth', () => {

  it('Mengembalikan session jika user login', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1', isSuperAdmin: false },
    } as any)

    const { session, error } = await requireAuth()
    expect(error).toBeNull()
    expect(session!.user.id).toBe('user-1')
  })

  it('Mengembalikan error jika tidak ada session', async () => {
    vi.mocked(auth).mockResolvedValue(null as any)

    const { session, error } = await requireAuth()
    expect(session).toBeNull()
    expect(error).toBeDefined()
  })
})

describe('API Utils: requireSuperAdmin', () => {

  it('Mengembalikan session jika user adalah SuperAdmin', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'sa-1', isSuperAdmin: true },
    } as any)

    const { session, error } = await requireSuperAdmin()
    expect(error).toBeNull()
    expect(session!.user.isSuperAdmin).toBe(true)
  })

  it('Mengembalikan error 403 jika user bukan SuperAdmin', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1', isSuperAdmin: false },
    } as any)

    const { session, error } = await requireSuperAdmin()
    expect(session).toBeNull()
    expect(error).toBeDefined()
  })
})
