import { ParentDashboard } from "./_components/parent-dashboard"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"

export default async function OrtuDashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const role = session.user.tenants?.[0]?.role || "orangtua"
  const tenantId = session.user.tenants?.[0]?.id

  let students: any[] = []

  if (role === "siswa") {
    // Siswa: ambil data siswa langsung via userId
    const directStudents = await db.student.findMany({
      where: { userId: session.user.id },
      include: {
        walletAccount: true,
        classroom: true,
        attendanceRecords: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })
    students = directStudents
  } else {
    // Orang tua: ambil data siswa via relasi studentParents
    const parentData = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        studentParents: {
          include: {
            student: {
              include: {
                walletAccount: true,
                classroom: true,
                attendanceRecords: {
                  orderBy: { createdAt: 'desc' },
                  take: 1
                }
              }
            }
          }
        }
      }
    })
    students = parentData?.studentParents?.map(sp => sp.student) || []
  }

  const studentIds = students.map(s => s.id)

  // Fetch tagihan yang belum lunas
  const unpaidInvoices = studentIds.length > 0 ? await db.invoice.findMany({
    where: {
      studentId: { in: studentIds },
      status: { in: ["UNPAID", "PARTIAL", "OVERDUE"] },
      deletedAt: null
    },
    include: { student: { select: { name: true } } },
    orderBy: { dueDate: 'asc' },
    take: 3
  }) : []

  // Fetch pengumuman terbaru
  const recentPosts = tenantId ? await db.post.findMany({
    where: {
      tenantId,
      status: "PUBLISHED",
      type: { in: ["PENGUMUMAN", "BERITA_SEKOLAH", "BLOG_GURU"] }
    },
    orderBy: { createdAt: 'desc' },
    take: 3
  }) : []

  return <ParentDashboard childrenData={students} unpaidInvoices={unpaidInvoices} recentPosts={recentPosts} userRole={role} />
}

