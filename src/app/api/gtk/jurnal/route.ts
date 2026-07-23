import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { requireTenantMembership } from "@/lib/api-utils"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { tenantId, staffId, classroomId, subjectId, date, topic, notes, presences } = body

    if (!tenantId || !staffId || !classroomId || !subjectId || !date || !topic) {
      return new NextResponse("Missing required fields", { status: 400 })
    }
    const { error: accessError } = await requireTenantMembership(tenantId)
    if (accessError) return accessError

    // Ambil timezone sekolah dari settings tenant
    const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { settings: true } })
    const settings = (tenant?.settings as Record<string, any>) || {}
    const tz = settings.timezone || settings.attendance?.timezone || "Asia/Jakarta"

    // Validasi Schedule Aktif
    // Gunakan timezone sekolah untuk menentukan hari dan jam saat ini
    const nowLocal = new Date().toLocaleString("en-US", { timeZone: tz })
    const localDate = new Date(nowLocal)
    const dayOfWeek = localDate.getDay()
    const currentHour = localDate.getHours()
    const currentMinute = localDate.getMinutes()
    const currentTotalMinutes = currentHour * 60 + currentMinute

    const schedule = await db.schedule.findFirst({
      where: {
        tenantId,
        staffId,
        classroomId,
        subjectId,
        dayOfWeek
      }
    })

    if (!schedule) {
      return new NextResponse("Jadwal mengajar tidak ditemukan untuk kelas dan mata pelajaran ini pada hari ini.", { status: 403 })
    }

    // Validasi Waktu menggunakan perbandingan menit total (menghindari overflow)
    const [startHr, startMin] = schedule.startTime.split(':').map(Number)
    const [endHr, endMin] = schedule.endTime.split(':').map(Number)
    const startTotalMinutes = startHr * 60 + startMin
    const endTotalMinutes = (endHr * 60 + endMin) + 60 // Toleransi 60 menit

    if (currentTotalMinutes < startTotalMinutes || currentTotalMinutes > endTotalMinutes) {
      return new NextResponse(
        `Di luar jam mengajar. Jurnal hanya dapat diisi saat jadwal mengajar berlangsung (termasuk toleransi 60 menit). Waktu lokal Anda saat ini: ${String(currentHour).padStart(2,'0')}:${String(currentMinute).padStart(2,'0')}, jadwal: ${schedule.startTime} - ${schedule.endTime}.`,
        { status: 403 }
      )
    }

    // Gunakan transaksi untuk memastikan Jurnal dan Presensi tersimpan semua atau tidak sama sekali
    const result = await db.$transaction(async (tx) => {
      // 1. Upsert Jurnal (jika hari yang sama, kelas sama, mapel sama, staf sama -> update)
      // Prisma UPSERT memerlukan unique constraint. Di schema kita punya @@unique([staffId, classroomId, subjectId, date])
      
      const journalDate = new Date(date)
      
      const journal = await tx.teacherJournal.upsert({
        where: {
          staffId_classroomId_subjectId_date: {
            staffId,
            classroomId,
            subjectId,
            date: journalDate
          }
        },
        update: {
          topic,
          notes,
        },
        create: {
          tenantId,
          staffId,
          classroomId,
          subjectId,
          date: journalDate,
          topic,
          notes,
        }
      })

      // 2. Simpan Presensi Siswa
      if (presences && Array.isArray(presences)) {
        // Hapus presensi lama jika ada
        await tx.journalPresence.deleteMany({
          where: { journalId: journal.id }
        })

        // Masukkan presensi baru
        await tx.journalPresence.createMany({
          data: presences.map((p: any) => ({
            journalId: journal.id,
            studentId: p.studentId,
            status: p.status,
            notes: p.notes || null
          }))
        })
      }

      return journal
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error("[GTK_JURNAL_POST]", error)
    const errorMessage = error instanceof Error ? error.message : "Internal Error"
    return new NextResponse(errorMessage, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get("tenantId")
    const staffId = searchParams.get("staffId")

    if (!tenantId || !staffId) {
      return new NextResponse("Missing parameters", { status: 400 })
    }
    const { error: accessError } = await requireTenantMembership(tenantId)
    if (accessError) return accessError

    const journals = await db.teacherJournal.findMany({
      where: {
        tenantId,
        staffId
      },
      include: {
        classroom: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
        presences: true
      },
      orderBy: {
        date: 'desc'
      },
      take: 20
    })

    return NextResponse.json(journals)

  } catch (error) {
    console.error("[GTK_JURNAL_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
