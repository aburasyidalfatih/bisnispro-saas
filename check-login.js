const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function main() {
  const auditLogs = await db.auditLog.findMany({
    where: { action: 'LOGIN' },
    take: 5
  })
  console.log('Logins in AuditLog:', auditLogs)

  const sessions = await db.session.findMany({
    take: 5
  })
  console.log('Sessions:', sessions.map(s => ({ id: s.id, userId: s.userId, expires: s.expires })))
}
main().finally(() => db.$disconnect())
