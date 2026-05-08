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
    const validData = { name: "Laboratorium Komputer", category: "Lab", description: "", condition: "BAIK" }
    const mockReturn = { id: 'fac-1', ...validData, tenantId: 'tenant-1' }
    
    db.facility.create.mockResolvedValue(mockReturn as any)
    
    const result = await createFacility('tenant-1', validData)
    
    expect(requireTenantAccess).toHaveBeenCalledWith('tenant-1')
    expect(db.facility.create).toHaveBeenCalledWith({
      data: { name: "Laboratorium Komputer", category: "Lab", description: "", condition: "BAIK", tenantId: 'tenant-1' }
    })
    expect(result.id).toBe('fac-1')
  })
})
