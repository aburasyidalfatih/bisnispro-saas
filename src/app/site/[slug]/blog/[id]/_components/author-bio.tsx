"use client"

import Image from "next/image"
import Link from "next/link"
import { normalizeImageUrl } from "@/lib/utils"

interface AuthorBioProps {
  author: any
  tenantId: string
  basePath: string
}

export function AuthorBio({ author, tenantId, basePath }: AuthorBioProps) {
  if (!author) return null

  // Cari profil GTK yang sesuai dengan tenant saat ini
  const staffProfile = author.staffProfiles?.find((s: any) => s.tenantId === tenantId)

  // Tentukan data yang akan ditampilkan
  const name = staffProfile?.name || author.name || "Tim Redaksi"
  const avatarUrl = staffProfile?.imageUrl || author.avatar
  const bio = staffProfile?.bio || author.bio || "Penulis dan pengelola konten untuk website perusahaan. Berdedikasi untuk memberikan informasi terkini dan bermanfaat bagi seluruh warga perusahaan."

  const avatarSrc = normalizeImageUrl(avatarUrl)

  const AuthorName = () => {
    if (staffProfile) {
      return (
        <Link 
          href={`${basePath}/tim/${staffProfile.id}`}
          className="text-lg font-bold text-foreground hover:text-primary transition-colors inline-block"
        >
          {name}
        </Link>
      )
    }
    
    return (
      <h3 className="text-lg font-bold text-foreground">
        {name}
      </h3>
    )
  }

  return (
    <div className="mt-12 bg-muted/30 border border-border/50 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
      <div className="flex-shrink-0 relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-background shadow-md">
        {avatarSrc ? (
          <Image
            src={avatarSrc}
            alt={name}
            fill
            sizes="112px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      
      <div className="flex-1 text-center sm:text-left">
        <AuthorName />
        <p className="text-sm text-primary font-medium mb-3">
          {staffProfile ? "Tim / Tenaga Kependidikan" : "Admin Website"}
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
          {bio}
        </p>
        
        {staffProfile && (
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            {staffProfile.instagram && (
              <a href={staffProfile.instagram} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-primary transition-colors" title="Instagram">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </a>
            )}
            {staffProfile.facebook && (
              <a href={staffProfile.facebook} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-primary transition-colors" title="Facebook">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
            )}
            {staffProfile.youtube && (
              <a href={staffProfile.youtube} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-primary transition-colors" title="YouTube">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
              </a>
            )}
            {staffProfile.tiktok && (
              <a href={staffProfile.tiktok} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-primary transition-colors" title="TikTok">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
              </a>
            )}
            {staffProfile.linkedin && (
              <a href={staffProfile.linkedin} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-primary transition-colors" title="LinkedIn">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
              </a>
            )}
            {staffProfile.twitter && (
              <a href={staffProfile.twitter} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-primary transition-colors" title="Twitter / X">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
              </a>
            )}
            {staffProfile.pinterest && (
              <a href={staffProfile.pinterest} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-primary transition-colors" title="Pinterest">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 22s-2-5.5-2-9c0-1.6 1.4-3 3-3s3 1.4 3 3c0 2.2-1.7 4-3.5 4-2 0-3.5-1.5-3.5-3.5C9 10 10.5 8 12.5 8 15 8 17 10 17 12.5 17 16 15 19.5 12 22z"/></svg>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
