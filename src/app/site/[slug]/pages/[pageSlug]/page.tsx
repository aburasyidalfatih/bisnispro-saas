import { permanentRedirect } from "next/navigation"

export default async function RedirectOldPagesRoute({ params }: { params: Promise<{ slug: string; pageSlug: string }> }) {
  const { pageSlug } = await params
  permanentRedirect(`/${pageSlug}`)
}
