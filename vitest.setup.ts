import { vi } from 'vitest'
import { mockDeep } from 'vitest-mock-extended'

// Mock modul Prisma
vi.mock('@/lib/db', () => ({
  db: mockDeep()
}))

// Mock NextAuth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn()
}))
