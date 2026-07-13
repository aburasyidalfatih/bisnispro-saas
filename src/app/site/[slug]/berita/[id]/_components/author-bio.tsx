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
  const bio = staffProfile?.bio || "Penulis dan pengelola konten untuk website sekolah. Berdedikasi untuk memberikan informasi terkini dan bermanfaat bagi seluruh warga sekolah."

  const avatarSrc = normalizeImageUrl(avatarUrl)

  const AuthorName = () => {
    if (staffProfile) {
      return (
        <Link 
          href={`${basePath}/gtk/${staffProfile.id}`}
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
          {staffProfile ? "Guru / Tenaga Kependidikan" : "Admin Website"}
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {bio}
        </p>
      </div>
    </div>
  )
}
