import { ParentDashboard } from "./_components/parent-dashboard"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"

export default async function OrtuDashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const parentData = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      studentParents: {
        include: {
          student: {
            include: {
              walletAccount: true,
              classroom: true
            }
          }
        }
      }
    }
  })

  const students = parentData?.studentParents?.map(sp => sp.student) || []
  const studentIds = students.map(s => s.id)
  
  const tenantId = session.user.tenants?.[0]?.id

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

  return <ParentDashboard childrenData={students} unpaidInvoices={unpaidInvoices} recentPosts={recentPosts} />
}
