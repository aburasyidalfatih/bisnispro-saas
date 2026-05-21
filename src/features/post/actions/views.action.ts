"use server"

import { incrementPostView, incrementEventView } from "../services/views.service"

export async function trackPostView(postId: string) {
  try {
    await incrementPostView(postId)
    return { success: true }
  } catch (error) {
    return { success: false }
  }
}

export async function trackEventView(eventId: string) {
  try {
    await incrementEventView(eventId)
    return { success: true }
  } catch (error) {
    return { success: false }
  }
}
