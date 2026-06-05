"use server"

import { incrementPostView, incrementEventView } from "../services/views.service"
import { headers } from "next/headers"

export async function trackPostView(postId: string) {
  try {
    const headersList = await headers()
    let ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown"
    if (ip.includes(",")) ip = ip.split(",")[0].trim()

    await incrementPostView(postId, ip)
    return { success: true }
  } catch (error) {
    return { success: false }
  }
}

export async function trackEventView(eventId: string) {
  try {
    const headersList = await headers()
    let ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown"
    if (ip.includes(",")) ip = ip.split(",")[0].trim()

    await incrementEventView(eventId, ip)
    return { success: true }
  } catch (error) {
    return { success: false }
  }
}
