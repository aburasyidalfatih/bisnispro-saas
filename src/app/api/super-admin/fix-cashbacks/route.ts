import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const payments = await db.payment.findMany({
    where: { 
      status: "paid", 
      discountCodeId: { not: null } 
    },
    include: { 
      tenant: true,
      discountCode: true
    }
  })

  let fixed = 0;

  for (const payment of payments) {
    const discountCode = payment.discountCode;
    if (discountCode && discountCode.type === "CASHBACK") {
      const affiliateId = discountCode.affiliateId || payment.tenant.affiliateId;
      
      if (affiliateId) {
        // Cek apakah komisi cashback sudah diberikan
        const existingComm = await db.affiliateCommission.findFirst({
          where: {
            paymentId: payment.id,
            affiliateId: affiliateId,
          }
        });

        if (!existingComm) {
          let cashbackAmount = 0;
          if (discountCode.cashbackAmount > 0) {
            cashbackAmount = discountCode.cashbackAmount;
          } else if (discountCode.percentage > 0) {
            cashbackAmount = Math.round(payment.amount * (discountCode.percentage / 100));
          }

          if (cashbackAmount > 0) {
            await db.affiliateCommission.create({
              data: {
                affiliateId: affiliateId,
                tenantId: payment.tenantId,
                paymentId: payment.id,
                amount: cashbackAmount,
                status: "PAID"
              }
            });
            
            await db.affiliateProfile.update({
              where: { id: affiliateId },
              data: {
                balance: { increment: cashbackAmount },
                totalEarnings: { increment: cashbackAmount }
              }
            });
            fixed++;
          }
        }
      }
      
      if (!discountCode.linkedTenantId) {
        await db.discountCode.update({
          where: { id: discountCode.id },
          data: { linkedTenantId: payment.tenantId }
        });
      }
    }
  }

  return NextResponse.json({ success: true, fixed, message: "Sinkronisasi selesai. " + fixed + " komisi cashback berhasil diperbaiki." })
}
