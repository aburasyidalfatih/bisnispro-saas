import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { Redis } from "@upstash/redis"

const redis = process.env.UPSTASH_REDIS_REST_URL ? Redis.fromEnv() : null

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.isSuperAdmin) {
      return new NextResponse("Unauthorized", { status: 403 })
    }

    const { ipAddress, reason } = await req.json()
    if (!ipAddress) {
      return new NextResponse("IP Address is required", { status: 400 })
    }

    // 1. Simpan ke Database
    await db.bannedIp.upsert({
      where: { ipAddress },
      update: { reason: reason || "Diblokir oleh WAF" },
      create: { ipAddress, reason: reason || "Diblokir oleh WAF" },
    })

    // 2. Simpan ke Edge Redis untuk pemblokiran instan
    if (redis) {
      await redis.set(`banned_ip:${ipAddress}`, "true")
    }

    return NextResponse.json({ success: true, message: `IP ${ipAddress} berhasil diblokir secara permanen.` })
  } catch (error) {
    console.error("[BANNED_IPS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.isSuperAdmin) {
      return new NextResponse("Unauthorized", { status: 403 })
    }

    const bannedIps = await db.bannedIp.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(bannedIps)
  } catch (error) {
    console.error("[BANNED_IPS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.isSuperAdmin) {
      return new NextResponse("Unauthorized", { status: 403 })
    }

    const url = new URL(req.url)
    const ipAddress = url.searchParams.get("ip")
    if (!ipAddress) return new NextResponse("IP required", { status: 400 })

    await db.bannedIp.delete({ where: { ipAddress } })

    if (redis) {
      await redis.del(`banned_ip:${ipAddress}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[BANNED_IPS_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
