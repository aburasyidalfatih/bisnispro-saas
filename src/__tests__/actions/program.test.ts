import { describe, it, expect, vi } from 'vitest'
import { createProgram, getPrograms, updateProgram, deleteProgram } from '@/features/program/actions/program.action'
import { db } from '../../../__mocks__/prisma'

vi.mock('@/lib/guards/tenant-guard', () => ({
  requireTenantAccess: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Server Actions: Program', () => {

  it('TC1: Menolak jika nama program kosong (Zod validation)', async () => {
    await expect(createProgram('tenant-1', { name: '' })).rejects.toThrow()
    expect(db.program.create).not.toHaveBeenCalled()
  })

  it('TC2: Berhasil membuat program dengan data valid', async () => {
    const data = { name: 'Teknik Komputer Jaringan', focus: 'IT Networking' }
    db.program.create.mockResolvedValue({ id: 'prog-1', ...data, tenantId: 'tenant-1' } as any)

    const result = await createProgram('tenant-1', data)

    expect(db.program.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ name: 'Teknik Komputer Jaringan', tenantId: 'tenant-1' }),
    })
    expect(result.id).toBe('prog-1')
  })

  it('TC3: getPrograms memfilter berdasarkan tenantId', async () => {
    db.program.findMany.mockResolvedValue([])
    await getPrograms('tenant-abc')

    expect(db.program.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-abc' },
      orderBy: { createdAt: 'desc' },
    })
  })

  it('TC4: updateProgram menggunakan compound where (id + tenantId)', async () => {
    db.program.update.mockResolvedValue({} as any)
    await updateProgram('prog-1', 'tenant-1', { name: 'Updated Program' })

    expect(db.program.update).toHaveBeenCalledWith({
      where: { id: 'prog-1', tenantId: 'tenant-1' },
      data: expect.objectContaining({ name: 'Updated Program' }),
    })
  })

  it('TC5: deleteProgram menggunakan compound where', async () => {
    db.program.delete.mockResolvedValue({} as any)
    await deleteProgram('prog-1', 'tenant-1')

    expect(db.program.delete).toHaveBeenCalledWith({
      where: { id: 'prog-1', tenantId: 'tenant-1' },
    })
  })
})
