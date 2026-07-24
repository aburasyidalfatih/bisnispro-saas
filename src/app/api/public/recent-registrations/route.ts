import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const revalidate = 60; // cache for 1 minute

export async function GET() {
  try {
    const apps = await db.tenantApplication.findMany({
      where: {
        status: {
          not: "REJECTED"
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        businessName: true,
        regency: true,
        logo: true,
        createdAt: true,
      }
    });
    
    return NextResponse.json(apps);
  } catch (error) {
    console.error("Failed to fetch recent registrations", error);
    return NextResponse.json([], { status: 500 });
  }
}
