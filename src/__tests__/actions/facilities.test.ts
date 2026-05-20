import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createFacility, updateFacility, deleteFacility, getFacilities } from '@/features/facility/actions/facility.action'
import { db } from '../../../__mocks__/prisma'

// Mock Guard: lolos secara default
vi.mock('@/lib/guards/tenant-guard', () => ({
  requireTenantAccess: vi.fn(),
}))

// Mock revalidatePath Next.js
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Server Actions: Facilities', () => {

  it('TC1: Menolak pembuatan (Zod Error) jika nama fasilitas kosong', async () => {
    const invalidData = { name: '' }

    await expect(createFacility('tenant-1', invalidData)).rejects.toThrow()
    
    const { requireTenantAccess } = await import('@/lib/guards/tenant-guard')
    expect(requireTenantAccess).toHaveBeenCalledWith('tenant-1')
    expect(db.facility.create).not.toHaveBeenCalled()
  })

  it('TC2: Berhasil membuat fasilitas dengan data valid', async () => {
    const validData = { name: 'Laboratorium Komputer', category: 'Lab' }
    const mockReturn = { id: 'fac-1', name: 'Laboratorium Komputer', category: 'Lab', tenantId: 'tenant-1' }

    db.facility.create.mockResolvedValue(mockReturn as any)

    const result = await createFacility('tenant-1', validData)

    expect(db.facility.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Laboratorium Komputer',
        category: 'Lab',
        tenantId: 'tenant-1',
      }),
    })
    expect(result.id).toBe('fac-1')
  })

  it('TC3: Selalu memanggil requireTenantAccess sebelum operasi DB pada getFacilities', async () => {
    db.facility.findMany.mockResolvedValue([])

    await getFacilities('tenant-xyz')

    const { requireTenantAccess } = await import('@/lib/guards/tenant-guard')
    expect(requireTenantAccess).toHaveBeenCalledWith('tenant-xyz')
    expect(db.facility.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-xyz' },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })
  })

  it('TC4: updateFacility memanggil guard + db.update dengan compound where', async () => {
    const data = { name: 'Updated Lab' }
    db.facility.update.mockResolvedValue({} as any)

    await updateFacility('fac-1', 'tenant-1', data)

    const { requireTenantAccess } = await import('@/lib/guards/tenant-guard')
    expect(requireTenantAccess).toHaveBeenCalledWith('tenant-1')
    expect(db.facility.update).toHaveBeenCalledWith({
      where: { id: 'fac-1', tenantId: 'tenant-1' },
      data: expect.objectContaining({ name: 'Updated Lab' }),
    })
  })

  it('TC5: deleteFacility memanggil guard + db.delete dengan compound where', async () => {
    db.facility.delete.mockResolvedValue({} as any)

    await deleteFacility('fac-1', 'tenant-1')

    const { requireTenantAccess } = await import('@/lib/guards/tenant-guard')
    expect(requireTenantAccess).toHaveBeenCalledWith('tenant-1')
    expect(db.facility.delete).toHaveBeenCalledWith({
      where: { id: 'fac-1', tenantId: 'tenant-1' },
    })
  })

  it('TC6: createFacility menerima field optional (description, condition, dll)', async () => {
    const fullData = {
      name: 'Perpustakaan',
      description: 'Perpustakaan digital modern',
      category: 'Akademik',
      condition: 'Baik',
      access: 'Semua siswa',
    }
    db.facility.create.mockResolvedValue({ id: 'fac-2', ...fullData, tenantId: 'tenant-1' } as any)

    const result = await createFacility('tenant-1', fullData)

    expect(db.facility.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Perpustakaan',
        description: 'Perpustakaan digital modern',
        tenantId: 'tenant-1',
      }),
    })
    expect(result.id).toBe('fac-2')
  })
})
