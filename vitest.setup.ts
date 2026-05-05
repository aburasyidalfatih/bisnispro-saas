import { vi, beforeEach } from 'vitest'
import { mockReset } from 'vitest-mock-extended'
import { db } from './__mocks__/prisma'

beforeEach(() => {
  mockReset(db)
  vi.clearAllMocks()
})

vi.mock('@/lib/db', () => ({
  db: db
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn()
}))
