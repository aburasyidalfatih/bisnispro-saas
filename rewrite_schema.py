import re
import os

schema_path = "c:/grafity project/bisnispro/prisma/schema.prisma"
with open(schema_path, "r", encoding="utf-8") as f:
    content = f.read()

blocks = re.findall(r'((?:model|generator|datasource|enum)\s+[^{]+\{.*?\n\})', content, re.DOTALL)

models_to_remove = {
    "Student", "StudentParent", "Classroom", "Subject", "Schedule", "Grade", "TeacherJournal", 
    "JournalPresence", "DisciplineRecord", "AttendanceSession", "AttendanceRecord", "AttendancePermit", 
    "StaffAttendance", "StaffPermit", "Staff", "PeriodePpdb", "PersyaratanBerkas", "PendaftarPpdb", 
    "BerkasPpdb", "TagihanPpdb", "PembayaranPpdb", "BillingType", "Invoice", "InvoicePayment", 
    "Installment", "Rekening", "Cashflow", "WalletAccount", "WalletTransaction", "CanteenMerchant", 
    "CanteenProduct", "CanteenOrder", "CanteenOrderItem", "CanteenWithdrawal", "CbtQuestionBank", 
    "CbtQuestion", "CbtExam", "CbtSession", "CbtAnswer", "LearningObjective", "FormativeScore", 
    "SummativeScore", "ReportCard", "ReportCardSubject", "ReportCardExtracurricular", 
    "ReportCardAchievement", "P5Project", "P5StudentScore", "Extracurricular"
}

new_blocks = []

for block in blocks:
    is_model = block.startswith("model ")
    if not is_model:
        new_blocks.append(block)
        continue
    
    model_name = re.search(r'model\s+(\w+)', block).group(1)
    
    if model_name in models_to_remove and model_name != "Staff":
        continue

    if model_name == "Program":
        new_blocks.append("""model Service {
  id          String   @id @default(cuid())
  tenantId    String
  name        String
  slug        String
  description String?
  imageUrl    String?
  category    String?
  pricing     String?
  icon        String?
  features    Json?
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, slug])
  @@index([tenantId])
  @@index([createdAt])
  @@index([tenantId, sortOrder])
  @@index([tenantId, createdAt(sort: Desc)])
  @@map("services")
}""")
    elif model_name == "Achievement":
        new_blocks.append("""model Portfolio {
  id          String   @id @default(cuid())
  tenantId    String
  title       String
  slug        String
  description String?
  completedAt DateTime
  clientName  String   @default("LOKAL")
  category    String   @default("SISWA")
  imageUrl    String?
  projectUrl  String?
  technologies Json?
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, slug])
  @@index([tenantId])
  @@index([category])
  @@index([createdAt])
  @@index([tenantId, createdAt(sort: Desc)])
  @@map("portfolios")
}""")
    elif model_name == "Alumni":
        new_blocks.append("""model Testimonial {
  id              String   @id @default(cuid())
  tenantId        String
  name            String
  role            String   @default("KULIAH")
  company         String?
  testimonial     String?
  imageUrl        String?
  linkedin        String?
  rating          Int      @default(5)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  tenant          Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([createdAt])
  @@index([tenantId, createdAt(sort: Desc)])
  @@map("testimonials")
}""")
    elif model_name == "Staff":
        new_blocks.append("""model TeamMember {
  id              String             @id @default(cuid())
  tenantId        String
  name            String
  position        String
  department      String?
  imageUrl        String?
  bio             String?
  sortOrder       Int                @default(0)
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
  email           String?
  phone           String?
  instagram       String?
  facebook        String?
  linkedin        String?
  twitter         String?
  tenant          Tenant             @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([createdAt])
  @@index([tenantId, sortOrder])
  @@index([tenantId, createdAt(sort: Desc)])
  @@map("team_members")
}""")
    elif model_name == "Facility":
        new_blocks.append("""model Office {
  id             String   @id @default(cuid())
  tenantId       String
  name           String
  slug           String
  description    String?
  imageUrl       String?
  category       String?
  type           String?
  access         String?
  operatingHours String?
  mapUrl         String?
  sortOrder      Int      @default(0)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  tenant         Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, slug])
  @@index([tenantId])
  @@index([createdAt])
  @@index([tenantId, sortOrder])
  @@index([tenantId, createdAt(sort: Desc)])
  @@map("offices")
}""")
    elif model_name == "Tenant":
        lines = block.split("\n")
        new_lines = []
        for line in lines:
            if "studentQuota" in line:
                new_lines.append('  employeeCount          Int                     @default(0)')
                new_lines.append('  businessType           String                  @default("UMKM")')
                new_lines.append('  nib                    String?')
                new_lines.append('  operatingHours         Json?')
                new_lines.append('  foundedYear            Int?')
                new_lines.append('  mapLatitude            Float?')
                new_lines.append('  mapLongitude           Float?')
                continue
            
            if "programs" in line and "Program[]" in line:
                new_lines.append('  services               Service[]')
                continue
            if "achievements" in line and "Achievement[]" in line:
                new_lines.append('  portfolios             Portfolio[]')
                continue
            if "alumni" in line and "Alumni[]" in line:
                new_lines.append('  testimonials           Testimonial[]')
                continue
            if "staff" in line and "Staff[]" in line:
                new_lines.append('  teamMembers            TeamMember[]')
                continue
            if "facilities" in line and "Facility[]" in line:
                new_lines.append('  offices                Office[]')
                continue
            
            removed_fields = [
                "extracurriculars", "attendancePermits", "attendanceRecords", "attendanceSessions",
                "billingTypes", "canteenMerchants", "canteenOrders", "canteenProducts", "canteenWithdrawals",
                "cashflows", "cbtExams", "cbtQuestionBanks", "classrooms", "disciplineRecords", "grades",
                "installments", "invoicePayments", "invoices", "pendaftarPpdb", "periodePpdb", "rekening",
                "schedules", "staffAttendances", "students", "subjects", "teacherJournals", "walletAccounts",
                "walletTransactions", "formativeScores", "summativeScores", "reportCards", "p5Projects",
                "learningObjectives", "staffPermits"
            ]
            
            skip = False
            for field in removed_fields:
                if re.search(rf'\b{field}\b', line):
                    skip = True
                    break
            
            if skip:
                continue
                
            new_lines.append(line)
        new_blocks.append("\n".join(new_lines))
        
    elif model_name == "User":
        lines = block.split("\n")
        new_lines = []
        for line in lines:
            removed_fields = ["studentParents", "students", "staffProfiles", "pendaftarPpdb", "canteenMerchant", "alumniProfiles"]
            skip = False
            for field in removed_fields:
                if re.search(rf'\b{field}\b', line):
                    skip = True
                    break
            if skip:
                continue
            new_lines.append(line)
        new_blocks.append("\n".join(new_lines))
        
    elif model_name == "SubscriptionPlan":
        block = re.sub(r'maxStudents', 'maxTeamMembers', block)
        new_blocks.append(block)
        
    elif model_name == "CustomTheme":
        block = re.sub(r'ppdbHtml', 'serviceHtml', block)
        block = re.sub(r'alumniHtml', 'portfolioHtml', block)
        block = re.sub(r'extracurricularHtml', 'testimonialHtml', block)
        block = re.sub(r'staffDetailHtml', 'teamDetailHtml', block)
        block = re.sub(r'staffHtml', 'teamHtml', block)
        new_blocks.append(block)
        
    elif model_name == "TenantApplication":
        lines = block.split("\n")
        new_lines = []
        for line in lines:
            if "schoolName" in line:
                new_lines.append(re.sub(r'schoolName', 'businessName', line))
            elif "schoolSlug" in line:
                new_lines.append(re.sub(r'schoolSlug', 'businessSlug', line))
            elif "npsn" in line:
                continue
            elif "schoolStatus" in line:
                new_lines.append('  businessType   String?           @default("UMKM")')
            elif "studentCount" in line:
                new_lines.append(re.sub(r'studentCount', 'employeeCount', line))
            else:
                new_lines.append(line)
        new_blocks.append("\n".join(new_lines))
        
    else:
        new_blocks.append(block)

final_schema = "\n\n".join(new_blocks)

with open(schema_path, "w", encoding="utf-8") as f:
    f.write(final_schema)
print("Done")
