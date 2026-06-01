import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireSuperAdmin } from "@/lib/api-utils"

const DEFAULT_RATES = {
  "vision-mission": 15,
  "about": 30,
  "principal-speech": 25,
  "program": 15,
  "facility": 10,
  "teacher-bio": 10,
  "extracurricular": 15,
  "event": 10,
  "achievement": 10,
  "alumni": 5,
  "post": 50,
}

export async function GET(req: Request) {
  const { error } = await requireSuperAdmin()
  if (error) return error

  const setting = await db.platformSetting.findUnique({ where: { key: "AI_TOKEN_RATES" } })
  let rates = DEFAULT_RATES
  if (setting && setting.value) {
    try {
      rates = { ...DEFAULT_RATES, ...JSON.parse(setting.value) }
    } catch(e) {}
  }
  
  return NextResponse.json(rates)
}

export async function PUT(req: Request) {
  const { error } = await requireSuperAdmin()
  if (error) return error

  const body = await req.json()
  const newRates = { ...DEFAULT_RATES, ...body }
  
  await db.platformSetting.upsert({
    where: { key: "AI_TOKEN_RATES" },
    update: { value: JSON.stringify(newRates) },
    create: { key: "AI_TOKEN_RATES", value: JSON.stringify(newRates) },
  })
  
  return NextResponse.json({ success: true, data: newRates })
}
