"use client"

import Image from "next/image"
import { normalizeImageUrl } from "@/lib/utils"

interface AuthorBioProps {
  author: any
  tenantId?: string
  basePath?: string
}

export function AuthorBio({ author, tenantId, basePath }: AuthorBioProps) {
  if (!author) return null

  // Tentukan data yang akan ditampilkan
  const name = author.name || "Tim Redaksi"
  const avatarUrl = author.image || author.imageUrl || author.avatar
  const bio = author.bio || "Penulis dan pengelola konten untuk website perusahaan. Berdedikasi untuk memberikan informasi terkini dan bermanfaat bagi seluruh warga perusahaan."

  const avatarSrc = normalizeImageUrl(avatarUrl)

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
        <h3 className="text-lg font-bold text-foreground">
          {name}
        </h3>
        <p className="text-sm text-primary font-medium mb-3">
          Admin Website
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
          {bio}
        </p>
      </div>
    </div>
  )
}

