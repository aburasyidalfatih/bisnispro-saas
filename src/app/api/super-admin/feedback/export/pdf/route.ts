import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import PDFDocument from "pdfkit"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data } = await req.json()

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }

    // Create a new PDF document
    const doc = new PDFDocument({ margin: 30, size: 'A4' })
    const buffers: Buffer[] = []

    doc.on("data", buffers.push.bind(buffers))

    // Title
    doc.fontSize(18).font("Helvetica-Bold").text("Laporan Feedback & Bug Sistem", { align: "center" })
    doc.moveDown(1)
    doc.fontSize(10).font("Helvetica").text(`Dicetak pada: ${new Date().toLocaleString("id-ID")}`, { align: "center" })
    doc.moveDown(2)

    // Render each feedback
    data.forEach((item, index) => {
      // Border top
      doc.rect(30, doc.y, 535, 0.5).fill("#ccc")
      doc.moveDown(1)

      const typeColor = item.type === "BUG_REPORT" ? "red" : item.type === "FEATURE_REQUEST" ? "blue" : "green"
      
      doc.fontSize(12).font("Helvetica-Bold").fillColor(typeColor).text(`[${item.type}]`, { continued: true })
      doc.fillColor("black").font("Helvetica").text(` - ${item.status}`)
      
      doc.fontSize(10).fillColor("#555")
      doc.text(`Tanggal: ${item.date}`)
      doc.text(`Pengirim: ${item.senderName} (${item.senderEmail})`)
      doc.text(`Tenant: ${item.tenant}`)
      doc.moveDown(0.5)
      
      doc.fontSize(11).fillColor("black").font("Helvetica")
      doc.text("Pesan:")
      // Remove non-ascii characters (emojis, etc) to prevent pdfkit winansi encoding error
      const safeMessage = item.message.replace(/[^\x00-\x7F]/g, "")
      doc.font("Helvetica-Oblique").text(safeMessage, { width: 535, align: "justify" })
      
      doc.moveDown(1)
    })

    doc.end()

    // Wait for the pdf to be fully generated
    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on("end", () => {
        resolve(Buffer.concat(buffers))
      })
    })

    return new Response(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Feedback_Report_${Date.now()}.pdf"`,
      },
    })
  } catch (error) {
    console.error("PDF generation error:", error)
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 })
  }
}
