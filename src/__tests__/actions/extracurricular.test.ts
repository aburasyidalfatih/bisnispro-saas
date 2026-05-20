import { describe, it, expect, vi } from 'vitest'
import { createExtracurricular, getExtracurriculars, updateExtracurricular, deleteExtracurricular } from '@/features/extracurricular/actions/extracurricular.action'
import { db } from '../../../__mocks__/prisma'

vi.mock('@/lib/guards/tenant-guard', () => ({
  requireTenantAccess: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Server Actions: Extracurricular', () => {

  it('TC1: Menolak jika nama ekskul kosong (Zod validation)', async () => {
    await expect(createExtracurricular('tenant-1', { name: '' })).rejects.toThrow()
    expect(db.extracurricular.create).not.toHaveBeenCalled()
  })

  it('TC2: Berhasil membuat ekskul dengan data lengkap', async () => {
    const data = {
      name: 'Pramuka',
      description: 'Kegiatan kepramukaan',
      schedule: 'Sabtu 08:00-12:00',
      contactPerson: 'Pak Budi',
    }
    db.extracurricular.create.mockResolvedValue({ id: 'ex-1', ...data, tenantId: 'tenant-1' } as any)

    const result = await createExtracurricular('tenant-1', data)

    expect(db.extracurricular.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ name: 'Pramuka', tenantId: 'tenant-1' }),
    })
    expect(result.id).toBe('ex-1')
  })

  it('TC3: getExtracurriculars memfilter berdasarkan tenantId', async () => {
    db.extracurricular.findMany.mockResolvedValue([])
    await getExtracurriculars('tenant-xyz')

    expect(db.extracurricular.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-xyz' },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })
  })

  it('TC4: updateExtracurricular menggunakan compound where', async () => {
    db.extracurricular.update.mockResolvedValue({} as any)
    await updateExtracurricular('ex-1', 'tenant-1', { name: 'Pramuka Updated' })

    expect(db.extracurricular.update).toHaveBeenCalledWith({
      where: { id: 'ex-1', tenantId: 'tenant-1' },
      data: expect.objectContaining({ name: 'Pramuka Updated' }),
    })
  })

  it('TC5: deleteExtracurricular menggunakan compound where', async () => {
    db.extracurricular.delete.mockResolvedValue({} as any)
    await deleteExtracurricular('ex-1', 'tenant-1')

    expect(db.extracurricular.delete).toHaveBeenCalledWith({
      where: { id: 'ex-1', tenantId: 'tenant-1' },
    })
  })
})
