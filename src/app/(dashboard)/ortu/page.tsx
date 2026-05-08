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
              WalletAccount: true,
              classroom: true
            }
          }
        }
      }
    }
  })

  const students = parentData?.studentParents?.map(sp => ({
    ...sp.student,
    walletAccount: (sp.student as any).WalletAccount
  })) || []

  return <ParentDashboard childrenData={students} />
}
