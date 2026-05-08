import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { DonationPublicClient } from "./_components/donation-public-client"

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
  return {
    title: `${campaign.title} | Donasi ${campaign.tenant.name}`,
    description: campaign.description || `Bantu kami mencapai target donasi Rp ${campaign.targetAmount.toLocaleString("id-ID")}`,
    openGraph: { images: campaign.imageUrl ? [campaign.imageUrl] : [] },
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
