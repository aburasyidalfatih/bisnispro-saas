import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.substring(0, length) + "..." : str
}

export function getRootDomain(hostname?: string): string {
  let host = hostname || ""
  if (typeof window !== "undefined" && !host) {
    host = window.location.hostname
  }
  
  if (host.endsWith("schoolpro.my.id") || host === "schoolpro.my.id") {
    return "schoolpro.my.id"
  } else if (host.endsWith("schoolpro.id") || host === "schoolpro.id") {
    return "schoolpro.id"
  }
  
  return process.env.NEXT_PUBLIC_ROOT_DOMAIN || "schoolpro.id"
}

/**
 * Normalize image URL to ensure it can be displayed correctly.
 * Handles:
 * - S3/external URLs (https://...) — returned as-is
 * - /api/files/... URLs — returned as-is
 * - Filesystem paths (uploads/..., ./uploads/...) — converted to /api/files/...
 * - null/undefined/empty — returns null
 */
export function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url || url.trim() === "") return null

  let cleaned = url.trim()

  // Already a proper URL (S3 or external)
  if (cleaned.startsWith("http://") || cleaned.startsWith("https://") || cleaned.startsWith("data:")) return cleaned

  // Already a proper /api/files/ path
  if (cleaned.startsWith("/api/files/")) return cleaned

  // Explicit local paths
  if (cleaned.startsWith("/uploads/")) {
    return `/api/files/${cleaned.substring(9)}`
  }
  if (cleaned.startsWith("uploads/")) {
    return `/api/files/${cleaned.substring(8)}`
  }
  
  // If it's a valid absolute path for other assets
  if (cleaned.startsWith("/")) return cleaned

  // Check if it's a domain missing https:// (e.g., pub-xxxx.r2.dev/file.jpg)
  // Heuristic: has a slash, and has a dot BEFORE the first slash
  const firstSlashIdx = cleaned.indexOf("/")
  const firstDotIdx = cleaned.indexOf(".")
  if (firstSlashIdx > 0 && firstDotIdx > 0 && firstDotIdx < firstSlashIdx) {
    return `https://${cleaned}`
  }

  // Filesystem path: remove leading ./ and "uploads/" prefix, then wrap with /api/files/
  cleaned = cleaned.replace(/\\/g, "/").replace(/^\.\//, "")
  if (cleaned.startsWith("uploads/")) {
    cleaned = cleaned.substring(8)
  }

  return `/api/files/${cleaned}`
}

export function checkIsMainDomain(hostname?: string): boolean {
  let host = hostname || ""
  if (typeof window !== "undefined" && !host) {
    host = window.location.hostname
  }
  
  const root = getRootDomain(host)
  return host === root || host === `www.${root}` || host === "localhost" || host === "127.0.0.1" || host.startsWith("localhost:")
}
