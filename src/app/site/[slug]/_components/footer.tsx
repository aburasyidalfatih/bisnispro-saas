"use client"

import Link from "next/link"
import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react"
import { useRouting } from "@/components/providers/routing-provider"
import type { PublicTenant } from "../_themes/types"

interface FooterProps {
  tenant: Pick<PublicTenant, 
    'name' | 'slug' | 'tagline' | 'description' | 'phone' | 'email' | 'whatsapp' | 
    'address' | 'instagram' | 'facebook' | 'youtube' | 'settings'
  > & { 
    programs?: { name: string }[]
    websiteMenus?: { label: string; url: string }[] 
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

  // Build dynamic social links — only show icons that have data
  const socialLinks = [
    ...(tenant.instagram ? [{ icon: InstagramIcon, href: `https://instagram.com/${tenant.instagram}`, label: "Instagram" }] : []),
    ...(tenant.facebook ? [{ icon: FacebookIcon, href: `https://facebook.com/${tenant.facebook}`, label: "Facebook" }] : []),
    ...(tenant.youtube ? [{ icon: YoutubeIcon, href: `https://youtube.com/${tenant.youtube}`, label: "YouTube" }] : []),
  ]

  // Build dynamic program/service list from tenant data or fallback
  const tenantPrograms = (tenant as any)?.programs
  const programItems = (tenantPrograms && Array.isArray(tenantPrograms) && tenantPrograms.length > 0)
    ? tenantPrograms.slice(0, 6).map((p: any) => ({ 
        label: p.name || p.title || "Program", 
        href: p.id ? `/program/${p.id}` : "/program" 
      }))
    : [
        { label: "Program Unggulan", href: "/program" },
        { label: "Kegiatan Belajar", href: "/program" },
        { label: "Pengembangan Siswa", href: "/program" },
        { label: "Ekstrakurikuler", href: "/program" },
        { label: "Bimbingan Konseling", href: "/program" },
        { label: "Layanan Informasi", href: "/program" }
      ]

  return (
    <footer>
      {/* ── Main footer — dark background ── */}
      <div className="relative overflow-hidden">
        {/* Base theme color */}
        <div className="absolute inset-0 bg-primary"></div>
        {/* Dark overlay for rich dark tint */}
        <div className="absolute inset-0 bg-black/60 mix-blend-multiply"></div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">

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

            {/* Col 2 — Link Cepat */}
            <div>
              <h3 className="font-bold text-white text-sm mb-4">Link Cepat</h3>
              <ul className="space-y-2.5">
                {(() => {
                  const menuLinks = (tenant as any)?.websiteMenus && Array.isArray((tenant as any).websiteMenus) && (tenant as any).websiteMenus.length > 0
                    ? (tenant as any).websiteMenus.slice(0, 7).map((m: any) => ({ label: m.label, href: m.url === "/" ? "" : m.url }))
                    : [
                        { label: "Beranda", href: "" },
                        { label: "Profil Lembaga", href: "/profil" },
                        { label: "Guru & Staf", href: "/gtk" },
                        { label: "Berita & Artikel", href: "/berita" },
                        { label: "Galeri Foto", href: "/gallery" },
                        { label: "Prestasi", href: "/prestasi" },
                        { label: "Kontak", href: "/contact" },
                      ];
                  return menuLinks.map((link: any) => (
                    <li key={link.label}>
                      <Link
                        href={resolveHref(link.href)}
                        className="text-xs transition-colors hover:text-white flex items-center gap-1.5"
                        style={{ color: "rgba(255,255,255,0.45)" }}
                      >
                        <span style={{ color: "hsl(var(--primary))" }}>›</span>
                        {link.label}
                      </Link>
                    </li>
                  ));
                })()}
              </ul>
            </div>

            {/* Col 3 — Program Kami (Dynamic) */}
            <div>
              <h3 className="font-bold text-white text-sm mb-4">Program Kami</h3>
              <ul className="space-y-2.5">
                {programItems.map((item: any, i: number) => (
                  <li key={item.label + i}>
                    <Link
                      href={resolveHref(item.href)}
                      className="text-xs transition-colors hover:text-white flex items-center gap-1.5"
                      style={{ color: "rgba(255,255,255,0.45)" }}
                    >
                      <span style={{ color: "hsl(var(--primary))" }}>›</span>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

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
              &copy; {year} {tenant.name}. All rights reserved. <span className="ml-2">Powered by <a href="https://schoolpro.id" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">SchoolPro.id</a> v1.0.5 {process.env.NEXT_PUBLIC_APP_VERSION ? `(rev: ${process.env.NEXT_PUBLIC_APP_VERSION.substring(0, 7)})` : "(dev)"}</span>
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
