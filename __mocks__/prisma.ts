import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset } from 'vitest-mock-extended'
import { beforeEach } from 'vitest'

export const db = mockDeep<PrismaClient>()

beforeEach(() => {
  mockReset(db)
})
