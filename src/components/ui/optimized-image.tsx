import Image, { ImageProps } from "next/image"
import { cn, normalizeImageUrl } from "@/lib/utils"

interface OptimizedImageProps extends Omit<ImageProps, "alt"> {
  alt?: string
  fallbackAlt?: string
}

/**
 * OptimizedImage Component
 * 
 * - Handles 'Auto ALT' by using fallbackAlt or a default descriptive text if alt is missing.
 * - Leverages next/image for automatic WebP/AVIF conversion and resizing.
 * - Ensures accessibility and SEO consistency.
 * - Automatically normalizes image URLs to ensure compatibility with Cloudflare R2 and local paths.
 */
export function OptimizedImage({ 
  alt, 
  fallbackAlt = "Gambar SchoolPro", 
  src, 
  className, 
  ...props 
}: OptimizedImageProps) {
  
  // Logic for Auto ALT
  // If alt is empty, null, or undefined, use fallbackAlt
  const finalAlt = alt && alt.trim() !== "" ? alt : fallbackAlt

  // Automatically normalize the URL if it is a string
  const finalSrc = typeof src === "string" ? (normalizeImageUrl(src) || src) : src

  return (
    <Image
      src={finalSrc}
      alt={finalAlt}
      className={cn("object-cover", className)}
      // Default to WebP/AVIF via Next.js Image Optimization
      {...props}
    />
  )
}
