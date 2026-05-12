import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    
    // Update emailOpenedAt jika masih kosong
    await db.tenantApplication.updateMany({
      where: { 
        id, 
        emailOpenedAt: null 
      },
      data: { 
        emailOpenedAt: new Date() 
      }
    });
    
    // Transparent 1x1 pixel PNG
    const pixel = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==",
      "base64"
    );
    
    return new NextResponse(pixel, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    // Fail silently
    return new NextResponse(null, { status: 204 });
  }
}
