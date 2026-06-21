import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    const tenantId = (session?.user as any)?.tenants?.[0]?.id;
    if (!tenantId) return new NextResponse("Unauthorized", { status: 401 });

    const credentials = await db.socialMediaCredential.findMany({
      where: { tenantId }
    });

    return NextResponse.json(credentials);
  } catch (error) {
    console.error("[SOCIAL_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const tenantId = (session?.user as any)?.tenants?.[0]?.id;
    if (!tenantId) return new NextResponse("Unauthorized", { status: 401 });

    const tenant = await db.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return new NextResponse("Tenant not found", { status: 404 });

    // Validate if plan is lite/pro
    if (tenant.plan !== "lite" && tenant.plan !== "pro") {
      return new NextResponse("Fitur ini hanya untuk paket Lite dan Pro", { status: 403 });
    }

    const body = await req.json();
    const { platform, accessToken, refreshToken, externalId, isActive } = body;

    if (!platform || !accessToken) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const credential = await db.socialMediaCredential.upsert({
      where: {
        tenantId_platform: {
          tenantId,
          platform
        }
      },
      update: {
        accessToken,
        refreshToken: refreshToken || null,
        externalId: externalId || null,
        isActive: isActive !== undefined ? isActive : true
      },
      create: {
        tenantId,
        platform,
        accessToken,
        refreshToken: refreshToken || null,
        externalId: externalId || null,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    return NextResponse.json(credential);
  } catch (error) {
    console.error("[SOCIAL_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
