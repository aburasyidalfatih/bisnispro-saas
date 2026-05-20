import { vi } from 'vitest'
import { db } from './__mocks__/prisma'

// Mock modul Prisma
vi.mock('@/lib/db', () => ({
  db
}))

// Mock NextAuth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn()
}))
