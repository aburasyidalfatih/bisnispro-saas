import { describe, it, expect, vi } from 'vitest'
import { createStaff, getStaff, deleteStaff } from '@/features/staff/actions/staff.action'
import { db } from '../../../__mocks__/prisma'

vi.mock('@/lib/guards/tenant-guard', () => ({
  requireTenantAccess: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock dynamic imports used in staff.ts
vi.mock('@/features/tenant/services/tenant-public.service', () => ({
  invalidatePublicTenantCache: vi.fn(),
}))

describe('Server Actions: Staff', () => {

  it('TC1: Menolak jika nama staff kosong (Zod validation)', async () => {
    const result = await createStaff('tenant-1', { name: '', role: '' })
    expect(result.error).toBeDefined()
    expect(db.staff.create).not.toHaveBeenCalled()
  })

  it('TC2: Berhasil membuat staff tanpa email (tanpa pembuatan user)', async () => {
    const data = { name: 'Pak Ahmad', role: 'Guru Matematika' }

    db.staff.create.mockResolvedValue({ id: 'staff-1', ...data, tenantId: 'tenant-1' } as any)
    db.tenant.findUnique.mockResolvedValue({ slug: 'sma-nusantara' } as any)

    const result = await createStaff('tenant-1', data)

    expect(db.staff.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Pak Ahmad',
        role: 'Guru Matematika',
        tenantId: 'tenant-1',
      }),
    })
    expect(result.success).toBe(true)
    expect(result.data?.id).toBe('staff-1')
    // Pastikan TIDAK membuat user karena email kosong
    expect(db.user.findUnique).not.toHaveBeenCalled()
  })

  it('TC3: getStaff memfilter berdasarkan tenantId', async () => {
    db.staff.findMany.mockResolvedValue([])
    await getStaff('tenant-abc')

    const { requireTenantAccess } = await import('@/lib/guards/tenant-guard')
    expect(requireTenantAccess).toHaveBeenCalledWith('tenant-abc')
    expect(db.staff.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-abc' },
      orderBy: { sortOrder: 'asc' },
    })
  })

  it('TC4: deleteStaff menggunakan compound where (id + tenantId)', async () => {
    db.staff.findUnique.mockResolvedValue({ role: 'Guru' } as any)
    db.staff.delete.mockResolvedValue({} as any)
    db.tenant.findUnique.mockResolvedValue({ slug: 'sma-test' } as any)

    await deleteStaff('staff-1', 'tenant-1')

    const { requireTenantAccess } = await import('@/lib/guards/tenant-guard')
    expect(requireTenantAccess).toHaveBeenCalledWith('tenant-1')
    expect(db.staff.delete).toHaveBeenCalledWith({
      where: { id: 'staff-1', tenantId: 'tenant-1' },
    })
  })

  it('TC5: createStaff dengan email memicu pembuatan user + tenantUser', async () => {
    const data = {
      name: 'Bu Sari',
      role: 'Guru Bahasa Inggris',
      email: 'sari@school.com',
      password: 'SecureP@ss123',
    }

    // User belum ada
    db.user.findUnique.mockResolvedValue(null)

    // Mock bcrypt import
    const mockHash = vi.fn().mockResolvedValue('hashed_password')
    vi.doMock('bcryptjs', () => ({ default: { hash: mockHash }, hash: mockHash }))

    db.user.create.mockResolvedValue({ id: 'user-sari', name: 'Bu Sari', email: 'sari@school.com' } as any)
    db.tenantUser.findUnique.mockResolvedValue(null)
    db.tenantUser.create.mockResolvedValue({} as any)
    db.staff.create.mockResolvedValue({ id: 'staff-2', ...data, tenantId: 'tenant-1' } as any)
    db.tenant.findUnique.mockResolvedValue({ slug: 'sma-test' } as any)

    const result = await createStaff('tenant-1', data)

    expect(db.user.findUnique).toHaveBeenCalledWith({ where: { email: 'sari@school.com' } })
    expect(result.success).toBe(true)
    expect(result.data?.id).toBe('staff-2')
  })
})
