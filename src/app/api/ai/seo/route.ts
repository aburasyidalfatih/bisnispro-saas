import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateObject } from "ai"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title } = await req.json()
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const geminiSetting = await db.platformSetting.findMany({
      where: { key: { in: ["GEMINI_API_KEY", "GEMINI_MODEL"] } }
    })
    const apiKey = geminiSetting.find(s => s.key === "GEMINI_API_KEY")?.value || process.env.GEMINI_API_KEY
    const modelName = geminiSetting.find(s => s.key === "GEMINI_MODEL")?.value || "gemini-1.5-flash"

    if (!apiKey) {
       return NextResponse.json({ error: "GEMINI API KEY belum dikonfigurasi di Pengaturan Super Admin." }, { status: 500 })
    }

    const googleProvider = createGoogleGenerativeAI({
      apiKey: apiKey,
    })

    const result = await generateObject({
      model: googleProvider(modelName),
      schema: z.object({
        metaTitle: z.string().describe("SEO Meta Title for the article. Make it catchy, max 60 characters."),
        metaDescription: z.string().describe("SEO Meta Description for the article. Summarize the title into 1-2 sentences, max 160 characters."),
      }),
      prompt: `Generate an SEO meta title and meta description in Indonesian for an article with the following title:\n\n"${title}"\n\nThe meta title should be engaging and under 60 characters. The meta description should summarize what the article might be about in 1-2 sentences, under 160 characters.`,
    })

    return NextResponse.json(result.object)
  } catch (error: any) {
    console.error("[SEO_AI]", error)
    return NextResponse.json({ error: "Failed to generate SEO metadata", details: error.message }, { status: 500 })
  }
}
