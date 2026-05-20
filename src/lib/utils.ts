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

  // Already a proper URL (S3 or external)
  if (url.startsWith("http://") || url.startsWith("https://")) return url

  // Already a proper /api/files/ path
  if (url.startsWith("/api/files/")) return url

  // Already a valid relative URL (starts with /)
  if (url.startsWith("/")) return url

  // Filesystem path: remove leading ./ and "uploads/" prefix, then wrap with /api/files/
  let cleaned = url
    .replace(/\\/g, "/")       // Convert Windows backslashes
    .replace(/^\.\//, "")      // Remove leading ./
  
  // Remove the "uploads/" prefix if present
  if (cleaned.startsWith("uploads/")) {
    cleaned = cleaned.substring("uploads/".length)
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
