const fs = require('fs')
const path = require('path')

const schemaPath = path.join(__dirname, 'prisma/schema.prisma')
let schema = fs.readFileSync(schemaPath, 'utf8')

// 1. Add deletedAt to User, Student, Staff for Soft Deletes
const addSoftDelete = (modelName) => {
  const modelRegex = new RegExp(`(model ${modelName} \\{[\\s\\S]*?)(createdAt\\s+DateTime\\s+@default\\(now\\(\\)\\))`, 'g')
  schema = schema.replace(modelRegex, `$1deletedAt DateTime?\n  $2`)
}

addSoftDelete('User')
addSoftDelete('Student')
addSoftDelete('Staff')

// 2. Add Composite Indexes for Performance

// Invoice: @@index([tenantId, status, dueDate])
const invoiceRegex = /model Invoice \{[\s\S]*?@@index\(\[dueDate\]\)[\s\S]*?\}/
if (schema.match(invoiceRegex)) {
  schema = schema.replace(
    /@@index\(\[tenantId\]\)\n\s*@@index\(\[status\]\)\n\s*@@index\(\[dueDate\]\)/,
    '@@index([tenantId, status, dueDate]) // Composite for dashboard filtering\n  @@index([studentId, status]) // Composite for student queries'
  )
}

// AttendanceRecord: @@index([tenantId, date, status])
const attendanceRegex = /@@index\(\[tenantId\]\)\n\s*@@index\(\[date\]\)\n\s*@@index\(\[status\]\)/
if (schema.match(attendanceRegex)) {
  schema = schema.replace(
    attendanceRegex,
    '@@index([tenantId, date, status]) // Composite for fast daily attendance dashboard'
  )
}

// AuditLog: @@index([tenantId, action, createdAt])
const auditRegex = /model AuditLog \{[\s\S]*?@@index\(\[createdAt\]\)\n\}/
if (schema.match(auditRegex)) {
  schema = schema.replace(
    /@@index\(\[tenantId\]\)\n\s*@@index\(\[userId\]\)\n\s*@@index\(\[action\]\)\n\s*@@index\(\[createdAt\]\)/,
    '@@index([tenantId, action, createdAt]) // Fast filtering for audit logs\n  @@index([userId, createdAt])'
  )
}

fs.writeFileSync(schemaPath, schema)
console.log('Schema refactored successfully.')
