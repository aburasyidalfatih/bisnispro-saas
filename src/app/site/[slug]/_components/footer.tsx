"use client"

import Link from "next/link"
import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react"
import { useRouting } from "@/components/providers/routing-provider"
import type { PublicTenant } from "../_themes/types"

type FooterWebsiteMenu = {
  id?: string
  label: string
  url: string
  children?: FooterWebsiteMenu[]
}

interface FooterProps {
  tenant: Pick<PublicTenant, 
    'name' | 'slug' | 'tagline' | 'description' | 'phone' | 'email' | 'whatsapp' | 
    'address' | 'instagram' | 'facebook' | 'youtube' | 'tiktok' | 'settings'
  > & { 
    programs?: { name: string }[]
    websiteMenus?: FooterWebsiteMenu[]
  }
}

export function WebsiteFooter({ tenant }: FooterProps) {
  const { resolveHref } = useRouting()
  const year = new Date().getFullYear()

  // Inline SVG social icons (Lucide removed brand icons in v1.0)
  const InstagramIcon = (props: any) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><circle cx="12" cy="12" r="5"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  )
  const FacebookIcon = (props: any) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  )
  const YoutubeIcon = (props: any) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/>
    </svg>
  )
  const TiktokIcon = (props: any) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  )
  const TelegramIcon = (props: any) => (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  )

  const { formatSocialUrl } = require('@/lib/utils')

  const formatUrl = (url: string) => url.startsWith('http') ? url : `https://${url}`

  // Build dynamic social links — only show icons that have data
  const socialLinks = [
    ...(tenant.instagram ? [{ icon: InstagramIcon, href: formatSocialUrl(tenant.instagram, 'instagram'), label: "Instagram" }] : []),
    ...(tenant.facebook ? [{ icon: FacebookIcon, href: formatSocialUrl(tenant.facebook, 'facebook'), label: "Facebook" }] : []),
    ...(tenant.youtube ? [{ icon: YoutubeIcon, href: formatSocialUrl(tenant.youtube, 'youtube'), label: "YouTube" }] : []),
    ...(tenant.tiktok ? [{ icon: TiktokIcon, href: formatSocialUrl(tenant.tiktok, 'tiktok'), label: "TikTok" }] : []),
  ]
  const websiteMenus = Array.isArray(tenant.websiteMenus) ? tenant.websiteMenus : []


  return (
    <footer>
      {/* ── Main footer — dark background ── */}
      <div className="relative overflow-hidden">
        {/* Base theme color */}
        <div className="absolute inset-0 bg-primary"></div>
        {/* Dark overlay for rich dark tint */}
        <div className="absolute inset-0 bg-black/60 mix-blend-multiply"></div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">

            {/* Col 1 — Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-full text-white font-extrabold text-lg border-2"
                  style={{ background: "hsl(var(--primary))", borderColor: "hsl(var(--primary)/0.5)" }}
                >
                  {tenant.name.charAt(0)}
                </div>
                <div>
                  {tenant.tagline && (
                    <p
                      className="text-[9px] font-bold uppercase tracking-[0.15em] leading-none mb-0.5"
                      style={{ color: "hsl(var(--primary))" }}
                    >
                      {tenant.tagline}
                    </p>
                  )}
                  <p className="font-extrabold text-sm text-white leading-tight">{tenant.name}</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>
                {tenant.description || tenant.tagline || `${tenant.name} berkomitmen memberikan layanan terbaik dan profesional untuk memenuhi kebutuhan Anda.`}
              </p>
              {/* Social icons — proper SVG icons */}
              {socialLinks.length > 0 && (
                <div className="flex gap-2">
                  {socialLinks.map((s, i) => (
                    <a
                      key={i}
                      href={s.href}
                      target="_blank"
                      rel="noopener"
                      aria-label={s.label}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:text-white hover:bg-white/15"
                      style={{ background: "rgba(255,255,255,0.08)" }}
                    >
                      <s.icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {websiteMenus.length > 0 && (
              <div>
                <h3 className="font-bold text-white text-sm mb-4">Link Cepat</h3>
                <ul className="space-y-2.5">
                  {websiteMenus.map((menu) => (
                    <li key={menu.id ?? `${menu.label}-${menu.url}`}>
                      <Link
                        href={resolveHref(menu.url)}
                        className="text-xs transition-colors hover:text-white flex items-center gap-1.5"
                        style={{ color: "rgba(255,255,255,0.45)" }}
                      >
                        <span style={{ color: "hsl(var(--primary))" }}>›</span>
                        {menu.label}
                      </Link>
                      {menu.children && menu.children.length > 0 && (
                        <ul className="mt-2 ml-4 space-y-2">
                          {menu.children.map((child) => (
                            <li key={child.id ?? `${child.label}-${child.url}`}>
                              <Link
                                href={resolveHref(child.url)}
                                className="text-[11px] transition-colors hover:text-white flex items-center gap-1.5"
                                style={{ color: "rgba(255,255,255,0.38)" }}
                              >
                                <span style={{ color: "hsl(var(--primary))" }}>-</span>
                                {child.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}


            {/* Col 4 — Kontak Kami */}
            <div>
              <h3 className="font-bold text-white text-sm mb-4">Kontak Kami</h3>
              <ul className="space-y-3 mb-5">
                {tenant.address && (
                  <li className="flex items-start gap-2.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "hsl(var(--primary))" }} />
                    <span className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                      {tenant.address}
                    </span>
                  </li>
                )}
                {tenant.phone && (
                  <li>
                    <a
                      href={`tel:${tenant.phone}`}
                      className="flex items-center gap-2.5 text-xs transition-colors hover:text-white"
                      style={{ color: "rgba(255,255,255,0.45)" }}
                    >
                      <Phone className="h-3.5 w-3.5 shrink-0" style={{ color: "hsl(var(--primary))" }} />
                      {tenant.phone}
                    </a>
                  </li>
                )}
                {tenant.email && (
                  <li>
                    <a
                      href={`mailto:${tenant.email}`}
                      className="flex items-center gap-2.5 text-xs transition-colors hover:text-white"
                      style={{ color: "rgba(255,255,255,0.45)" }}
                    >
                      <Mail className="h-3.5 w-3.5 shrink-0" style={{ color: "hsl(var(--primary))" }} />
                      {tenant.email}
                    </a>
                  </li>
                )}
                <li className="flex items-start gap-2.5">
                  <Clock className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "hsl(var(--primary))" }} />
                  <div className="text-xs whitespace-pre-line" style={{ color: "rgba(255,255,255,0.45)" }}>
                    {((tenant.settings as any)?.operationalHours) || "Senin - Jumat: 07.00 - 16.00\nSabtu: 07.00 - 12.00"}
                  </div>
                </li>
              </ul>

              {/* WhatsApp button */}
              {tenant.whatsapp && (
                <a
                  href={`https://wa.me/${tenant.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-white text-xs font-bold transition-opacity hover:opacity-90"
                  style={{ background: "#25D366" }}
                >
                  <MessageCircle className="h-4 w-4" />
                  Hubungi Kami via WhatsApp
                </a>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="relative overflow-hidden">
        {/* Base theme color */}
        <div className="absolute inset-0 bg-primary"></div>
        {/* Even darker overlay for contrast */}
        <div className="absolute inset-0 bg-black/80 mix-blend-multiply"></div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
              &copy; {year} {tenant.name}. All rights reserved. <span className="ml-2">Powered by <a href="https://schoolpro.id" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">SchoolPro.id</a> v1.0.5 {process.env.NEXT_PUBLIC_APP_VERSION ? `(rev: ${process.env.NEXT_PUBLIC_APP_VERSION.substring(0, 7)})` : ""}</span>
            </p>
            <div className="flex gap-4">
              <Link href={resolveHref("/contact")} className="text-[11px] transition-colors hover:text-white/60" style={{ color: "rgba(255,255,255,0.3)" }}>
                Kebijakan Privasi
              </Link>
              <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
              <Link href={resolveHref("/contact")} className="text-[11px] transition-colors hover:text-white/60" style={{ color: "rgba(255,255,255,0.3)" }}>
                Syarat & Ketentuan
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
