import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createFacility, getFacilities, deleteFacility } from '@/lib/actions/facilities'
import { requireTenantAccess } from '@/lib/guards/tenant-guard'
import { db } from '../../__mocks__/prisma'

// Mock the guard
vi.mock('@/lib/guards/tenant-guard', () => ({
  requireTenantAccess: vi.fn()
}))

// Mock Next.js cache revalidation
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

describe('Server Actions: Facilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createFacility', () => {
    it('TC1: Menolak eksekusi (Zod Error) jika nama fasilitas kosong', async () => {
      const invalidData = { name: "" } // Name is required and min length 1
      
      await expect(createFacility('tenant-1', invalidData)).rejects.toThrow()
      
      // Guard harus dipanggil sebelum Zod error terjadi
      expect(requireTenantAccess).toHaveBeenCalledWith('tenant-1')
      // Database tidak boleh disentuh jika Zod gagal
      expect(db.facility.create).not.toHaveBeenCalled()
    })

    it('TC2: Berhasil membuat fasilitas dan melakukan revalidatePath', async () => {
      const validData = { name: "Perpustakaan Digital", category: "Fasilitas Belajar" }
      const mockReturn = { id: 'fac-1', ...validData, tenantId: 'tenant-1' }
      
      // Prisma create mock
      vi.mocked(db.facility.create).mockResolvedValue(mockReturn as any)
      
      const result = await createFacility('tenant-1', validData)
      
      // Verifikasi flow sukses
      expect(requireTenantAccess).toHaveBeenCalledWith('tenant-1')
      expect(db.facility.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ 
          name: "Perpustakaan Digital", 
          category: "Fasilitas Belajar", 
          tenantId: 'tenant-1' 
        })
      })
      expect(result.id).toBe('fac-1')
      
      // Memastikan cache Next.js dihapus untuk UI refresh
      const { revalidatePath } = await import('next/cache')
      expect(revalidatePath).toHaveBeenCalledWith('/(dashboard)/dashboard/website/facilities', 'page')
    })
  })

  describe('getFacilities', () => {
    it('TC3: Berhasil memanggil getFacilities berdasarkan tenantId', async () => {
      const mockFacilities = [{ id: '1', name: 'Lab' }, { id: '2', name: 'Kantin' }]
      vi.mocked(db.facility.findMany).mockResolvedValue(mockFacilities as any)
      
      const result = await getFacilities('tenant-1')
      
      expect(requireTenantAccess).toHaveBeenCalledWith('tenant-1')
      expect(db.facility.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        orderBy: { createdAt: 'desc' }
      })
      expect(result).toHaveLength(2)
    })
  })

  describe('deleteFacility', () => {
    it('TC4: Berhasil menghapus fasilitas dan melakukan revalidatePath', async () => {
      vi.mocked(db.facility.delete).mockResolvedValue({ id: 'fac-1' } as any)
      
      await deleteFacility('fac-1', 'tenant-1')
      
      expect(requireTenantAccess).toHaveBeenCalledWith('tenant-1')
      expect(db.facility.delete).toHaveBeenCalledWith({
        where: { id: 'fac-1', tenantId: 'tenant-1' }
      })
      
      const { revalidatePath } = await import('next/cache')
      expect(revalidatePath).toHaveBeenCalledWith('/(dashboard)/dashboard/website/facilities', 'page')
    })
  })
})
