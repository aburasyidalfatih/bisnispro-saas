import { PrismaClient } from '@prisma/client'

// Use the existing database from the parent .env
const prisma = new PrismaClient()

export default prisma
