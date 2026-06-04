import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { DonationPublicClient } from "./_components/donation-public-client"
import { headers } from "next/headers"

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: Promise<{ slug: string; campaignId: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug, campaignId } = await params
  const campaign = await db.donationCampaign.findFirst({
    where: { id: campaignId, isActive: true, deletedAt: null },
    include: { tenant: { select: { name: true } } },
  })
  if (!campaign) return { title: "Kampanye Tidak Ditemukan" }
  const headerList = await headers()
  const protocol = headerList.get("x-forwarded-proto") || "https"
  let host = headerList.get("x-forwarded-host") || headerList.get("host") || "schoolpro.id"
  host = host.split(':')[0]
  const domainUrl = `${protocol}://${host}`

  const ogImageBase = (campaign.imageUrl as string) || (campaign.tenant as any).logo || "https://schoolpro.id/default-og.jpg"
  const ogImageUrl = `${domainUrl}/api/og-proxy?url=${encodeURIComponent(ogImageBase)}&ext=.jpg`

  return {
    title: `${campaign.title} | Donasi ${campaign.tenant.name}`,
    description: (campaign.description ? campaign.description.replace(/<[^>]*>?/gm, '') : `Bantu kami mencapai target donasi Rp ${campaign.targetAmount.toLocaleString("id-ID")}`),
    openGraph: { images: [{ url: ogImageUrl, width: 1200, height: 630 }] },
  }
}

export default async function PublicDonationCampaignPage({ params }: Props) {
  const { slug, campaignId } = await params

  const tenant = await db.tenant.findFirst({ where: { slug } })
  if (!tenant) notFound()

  const campaign = await db.donationCampaign.findFirst({
    where: { id: campaignId, tenantId: tenant.id, isPublic: true, isActive: true, deletedAt: null },
    include: {
      tenant: { select: { id: true, name: true, logo: true, slug: true } },
      donations: {
        where: { status: "PAID" },
        orderBy: { paidAt: "desc" },
        take: 10,
        select: {
          id: true, donorName: true, amount: true, message: true,
          isAnonymous: true, paidAt: true,
        },
      },
    },
  })

  if (!campaign) notFound()

  return <DonationPublicClient campaign={campaign} />
}
