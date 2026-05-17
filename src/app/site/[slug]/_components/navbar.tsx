"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Search, ChevronDown, CheckCircle2, Phone, Mail, MessageCircle, Home, Building2, Info, ImageIcon, PhoneCall } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouting } from "@/components/providers/routing-provider"
import Image from "next/image"
import type { PublicTenant } from "../_themes/types"

interface NavbarProps {
  tenant: Pick<PublicTenant, 
    'name' | 'slug' | 'logo' | 'tagline' | 'phone' | 'email' | 'whatsapp' | 
    'facebook' | 'instagram' | 'youtube' | 'tiktok' | 'websiteMenus'
  >
}

export function WebsiteNavbar({ tenant }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [expandedMobile, setExpandedMobile] = useState<string[]>([])
  const pathname = usePathname()
  const { resolveHref } = useRouting()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Format website menus from db or fallback to defaults if empty
  const navLinks = (tenant.websiteMenus && tenant.websiteMenus.length > 0)
    ? tenant.websiteMenus.map((menu: any) => ({
        label: menu.label,
        href: menu.url === "/" ? "" : menu.url,
        icon: Home, // Fallback icon, could map dynamic icon later
        children: menu.children?.length > 0 
          ? menu.children.map((child: any) => ({ label: child.label, href: child.url })) 
          : undefined
      }))
    : [
        { label: "Beranda", href: "", icon: Home },
        {
          label: "Profil Sekolah",
          href: "/profil",
          icon: Building2,
          children: [
            { label: "Profil Lembaga", href: "/profil" },
            { label: "Guru & Staf (GTK)", href: "/gtk" },
            { label: "Fasilitas Sekolah", href: "/fasilitas" },
            { label: "Program Unggulan", href: "/program" },
            { label: "Ekstrakurikuler", href: "/ekstrakurikuler" },
          ],
        },
        {
          label: "Informasi",
          href: "/berita",
          icon: Info,
          children: [
            { label: "Berita & Artikel", href: "/berita" },
            { label: "Agenda & Acara", href: "/agenda" },
            { label: "Pusat Unduhan", href: "/unduhan" },
          ],
        },
        {
          label: "Galeri",
          href: "/gallery",
          icon: ImageIcon,
          children: [
            { label: "Galeri Foto", href: "/gallery" },
            { label: "Prestasi Siswa", href: "/prestasi" },
            { label: "Alumni Success", href: "/alumni" },
          ],
        },
        { label: "Kontak", href: "/contact", icon: PhoneCall },
      ]

  const toggleMobileAccordion = (label: string) => {
    setExpandedMobile(prev => 
      prev.includes(label) ? prev.filter(item => item !== label) : [...prev, label]
    )
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    
    function handleScroll() {
      setScrolled(window.scrollY > 20)
    }

    document.addEventListener("mousedown", handleClick)
    window.addEventListener("scroll", handleScroll)
    
    return () => {
      document.removeEventListener("mousedown", handleClick)
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return (
    <>
      {/* ── TOP BAR (INFO) - Static (Scrolls away) ── */}
      <div className="hidden lg:block relative text-primary-foreground text-xs border-b border-primary-foreground/10">
        {/* Background base */}
        <div className="absolute inset-0 bg-primary"></div>
        {/* Dark overlay for richer/pekat character */}
        <div className="absolute inset-0 bg-black/50 mix-blend-multiply"></div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between">
          {/* KIRI: Kontak (Phone & Email) */}
          <div className="flex items-center gap-6 font-medium opacity-90 tracking-wide">
            {tenant.phone && (
              <div className="flex items-center gap-2 hover:opacity-100 transition-opacity cursor-pointer">
                <Phone className="h-3.5 w-3.5" />
                <span>{tenant.phone}</span>
              </div>
            )}
            {tenant.email && (
              <div className="flex items-center gap-2 hover:opacity-100 transition-opacity cursor-pointer">
                <Mail className="h-3.5 w-3.5" />
                <span>{tenant.email}</span>
              </div>
            )}
          </div>
          
          {/* KANAN: Social Media */}
          <div className="flex items-center gap-6 font-medium opacity-90">
            {tenant.facebook && (
              <a href={tenant.facebook.startsWith('http') ? tenant.facebook : `https://${tenant.facebook}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:opacity-100 transition-opacity">
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
                <span className="hidden sm:inline">Facebook</span>
              </a>
            )}
            {tenant.instagram && (
              <a href={tenant.instagram.startsWith('http') ? tenant.instagram : `https://${tenant.instagram}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:opacity-100 transition-opacity">
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                <span className="hidden sm:inline">Instagram</span>
              </a>
            )}
            {tenant.youtube && (
              <a href={tenant.youtube.startsWith('http') ? tenant.youtube : `https://${tenant.youtube}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:opacity-100 transition-opacity">
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                <span className="hidden sm:inline">YouTube</span>
              </a>
            )}
            {tenant.tiktok && (
              <a href={tenant.tiktok.startsWith('http') ? tenant.tiktok : `https://${tenant.tiktok}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:opacity-100 transition-opacity">
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
                <span className="hidden sm:inline">TikTok</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN NAVBAR - Sticky (Stays at top) ── */}
      <header 
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300 border-b border-border/40",
          scrolled ? "bg-white/85 backdrop-blur-md shadow-md" : "bg-white shadow-sm"
        )} 
        ref={dropdownRef}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-[76px] items-center justify-between gap-4 relative">
            
            {/* Logo */}
            <Link href={resolveHref("/")} className="flex items-center gap-3 shrink-0 group">
              {tenant.logo ? (
                <div className="relative h-12 w-12 overflow-hidden transition-transform duration-300 group-hover:scale-105">
                  <Image src={tenant.logo} alt={tenant.name} fill priority sizes="48px" quality={100} className="object-contain" />
                </div>
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground font-extrabold text-xl shadow-sm transition-transform duration-300 group-hover:scale-105">
                  {tenant.name.charAt(0)}
                </div>
              )}
              <div className="flex flex-col max-w-[140px] sm:max-w-none">
                <span className="block font-extrabold text-sm sm:text-base text-gray-900 leading-tight tracking-tight group-hover:text-primary transition-colors truncate">
                  {tenant.name}
                </span>
                {tenant.tagline && (
                  <span className="block text-[9px] sm:text-[10px] font-semibold text-gray-500 leading-none mt-1 truncate">
                    {tenant.tagline}
                  </span>
                )}
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden xl:flex items-center gap-1 flex-1 justify-center">
              {navLinks.map((link) => {
                const href = resolveHref(link.href)
                const isActive = link.href === "" 
                  ? (pathname === resolveHref("/") || pathname === `/site/${tenant.slug}`) 
                  : pathname.startsWith(href)
                const isOpen = openDropdown === link.label

                return (
                  <div 
                    key={link.label} 
                    className="relative group"
                    onMouseEnter={() => setOpenDropdown(link.label)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    {link.children ? (
                      <Link
                        href={href}
                        className={cn(
                          "flex items-center gap-1 px-4 py-2.5 text-sm font-bold rounded-full transition-all duration-200",
                          isActive || isOpen
                            ? "bg-primary/10 text-primary"
                            : "text-gray-600 hover:text-primary hover:bg-primary/5"
                        )}
                      >
                        {link.label}
                        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-300", isOpen && "rotate-180")} />
                      </Link>
                    ) : (
                      <Link
                        href={href}
                        className={cn(
                          "flex items-center px-4 py-2.5 text-sm font-bold rounded-full transition-all duration-200",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-gray-600 hover:text-primary hover:bg-primary/5"
                        )}
                      >
                        {link.label}
                      </Link>
                    )}

                    {/* Dropdown */}
                    {link.children && isOpen && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 w-56 z-50">
                        <div className="bg-white rounded-2xl shadow-xl border border-border/50 overflow-hidden flex flex-col p-2 animate-in fade-in slide-in-from-top-4 duration-200">
                          {link.children.map((child) => (
                            <Link
                              key={child.label}
                              href={resolveHref(child.href)}
                              onClick={() => setOpenDropdown(null)}
                              className="px-4 py-2.5 text-sm text-gray-600 font-semibold rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </nav>

            {/* Right: Search + CTA */}
            <div className="hidden lg:flex items-center gap-3 shrink-0">
              {/* Secondary CTA: WhatsApp */}
              <a
                href={tenant.whatsapp ? `https://wa.me/${tenant.whatsapp}` : "#"}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-primary bg-white border-2 border-primary hover:bg-primary/5 rounded-full transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
              
              {/* Primary CTA: Login */}
              <Link
                href="/login"
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-primary-foreground bg-primary hover:opacity-90 rounded-full shadow-md hover:shadow-lg transition-all"
              >
                Login
                <ChevronDown className="h-4 w-4 -rotate-90 opacity-70" />
              </Link>
            </div>

            {/* Mobile toggle */}
            <button
              aria-label="Toggle mobile menu"
              className="xl:hidden p-2.5 rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* Mobile nav Drawer */}
            {mobileOpen && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] xl:hidden animate-in fade-in duration-300"
                  onClick={() => setMobileOpen(false)}
                />

                {/* Side Drawer */}
                <div className="fixed top-0 right-0 h-screen w-[85vw] max-w-[360px] bg-white z-[101] shadow-2xl flex flex-col xl:hidden animate-in slide-in-from-right duration-300 ease-out">
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 bg-gray-50/50">
                    <span className="font-extrabold text-lg tracking-tight text-gray-900 truncate pr-4">
                      Menu Navigasi
                    </span>
                    <button
                      aria-label="Close mobile menu"
                      onClick={() => setMobileOpen(false)}
                      className="p-2 -mr-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Drawer Scrollable Content */}
                  <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2 pb-24">
                    {navLinks.map((link) => {
                      const href = resolveHref(link.href)
                      const isActive = link.href === "" 
                        ? (pathname === resolveHref("/") || pathname === `/site/${tenant.slug}`) 
                        : pathname.startsWith(href)
                      const isExpanded = expandedMobile.includes(link.label)
                      const Icon = link.icon
                      
                      return (
                        <div key={link.label} className="flex flex-col">
                          {link.children ? (
                            <button
                              onClick={() => toggleMobileAccordion(link.label)}
                              className={cn(
                                "flex items-center justify-between px-4 py-3.5 text-[15px] font-bold rounded-2xl transition-all duration-200",
                                isActive ? "bg-primary/10 text-primary" : "text-gray-700 hover:bg-gray-50"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-gray-400")} />
                                <span>{link.label}</span>
                              </div>
                              <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform duration-300", isExpanded && "rotate-180")} />
                            </button>
                          ) : (
                            <Link
                              href={href}
                              onClick={() => setMobileOpen(false)}
                              className={cn(
                                "flex items-center gap-3 px-4 py-3.5 text-[15px] font-bold rounded-2xl transition-all duration-200",
                                isActive ? "bg-primary/10 text-primary border-l-4 border-primary pl-3" : "text-gray-700 hover:bg-gray-50"
                              )}
                            >
                              <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-gray-400")} />
                              <span>{link.label}</span>
                            </Link>
                          )}
                          
                          {/* Accordion Children */}
                          {link.children && (
                            <div className={cn(
                              "overflow-hidden transition-all duration-300 ease-in-out",
                              isExpanded ? "max-h-[400px] opacity-100 mt-1" : "max-h-0 opacity-0"
                            )}>
                              <div className="pl-[3.25rem] pr-4 py-1 flex flex-col gap-1">
                                {link.children.map((child) => (
                                  <Link
                                    key={child.label}
                                    href={resolveHref(child.href)}
                                    onClick={() => setMobileOpen(false)}
                                    className="block px-4 py-2.5 text-sm font-semibold text-gray-500 hover:text-primary hover:bg-primary/5 rounded-xl transition-colors relative before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-gray-300 hover:before:bg-primary"
                                  >
                                    {child.label}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Sticky Footer CTA */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] flex flex-col gap-3">
                    <a
                      href={tenant.whatsapp ? `https://wa.me/${tenant.whatsapp}` : "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 w-full px-4 py-3.5 text-sm font-bold text-primary bg-white border-2 border-primary rounded-xl transition-colors hover:bg-primary/5"
                    >
                      <MessageCircle className="h-5 w-5" />
                      Hubungi via WhatsApp
                    </a>
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center gap-2 w-full px-4 py-3.5 text-sm font-bold text-primary-foreground bg-primary rounded-xl shadow-lg shadow-primary/30 hover:opacity-90 transition-opacity"
                    >
                      Login
                      <ChevronDown className="h-4 w-4 -rotate-90 opacity-70" />
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  )
}
