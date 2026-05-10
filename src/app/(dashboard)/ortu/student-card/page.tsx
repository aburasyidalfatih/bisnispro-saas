import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { StudentCardGenerator } from "./_components/card-generator"

export default async function StudentCardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const parentData = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      studentParents: {
        include: {
          student: {
            include: {
              classroom: true,
              tenant: true, // We need tenant/school details for the card
            }
          }
        }
      }
    }
  })

  const students = parentData?.studentParents?.map(sp => sp.student) || []

  return (
    <div className="pb-12">
      <div className="bg-primary rounded-b-[2.5rem] pt-8 pb-16 px-6 relative overflow-hidden print:hidden">
        <h1 className="text-primary-foreground font-bold text-2xl relative z-10">Kartu Pelajar (E-KTM)</h1>
        <p className="text-primary-foreground/70 text-sm relative z-10 mt-1">
          Cetak atau unduh kartu pelajar anak Anda. Kartu ini digunakan untuk Absensi dan E-Kantin.
        </p>
      </div>

      <div className="px-5 -mt-8 relative z-10">
        <StudentCardGenerator students={students} />
      </div>
    </div>
  )
}
