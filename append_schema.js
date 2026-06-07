const fs = require('fs');

const newModels = `

model Course {
  id          String    @id @default(cuid())
  title       String
  slug        String    @unique
  description String?   @db.Text
  thumbnail   String?
  price       Int       @default(0)
  isPublished Boolean   @default(false)
  authorId    String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  modules     CourseModule[]
  enrollments CourseEnrollment[]
  payments    Payment[]

  author      User      @relation("CourseAuthor", fields: [authorId], references: [id])
  @@map("courses")
}

model CourseModule {
  id          String    @id @default(cuid())
  courseId    String
  title       String
  sortOrder   Int       @default(0)
  
  lessons     CourseLesson[]
  course      Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)
  @@map("course_modules")
}

model CourseLesson {
  id          String    @id @default(cuid())
  moduleId    String
  title       String
  content     String?   @db.Text
  videoUrl    String?
  duration    Int       @default(0)
  isPreview   Boolean   @default(false)
  sortOrder   Int       @default(0)

  progress    LessonProgress[]
  module      CourseModule @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  @@map("course_lessons")
}

model CourseEnrollment {
  id          String    @id @default(cuid())
  userId      String
  tenantId    String?
  courseId    String
  status      String    @default("ACTIVE")
  progress    Float     @default(0)
  enrolledAt  DateTime  @default(now())
  
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  course      Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)
  tenant      Tenant?   @relation(fields: [tenantId], references: [id], onDelete: SetNull)
  lessonProgs LessonProgress[]

  @@unique([userId, courseId])
  @@map("course_enrollments")
}

model LessonProgress {
  id           String    @id @default(cuid())
  enrollmentId String
  lessonId     String
  isCompleted  Boolean   @default(false)
  completedAt  DateTime?

  enrollment   CourseEnrollment @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
  lesson       CourseLesson     @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@unique([enrollmentId, lessonId])
  @@map("lesson_progress")
}
`;

fs.appendFileSync('prisma/schema.prisma', newModels);
console.log('Appended to schema.prisma');
