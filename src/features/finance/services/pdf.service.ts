import PDFDocument from 'pdfkit'

export interface InvoicePdfData {
  invoiceNumber: string
  title: string
  amount: number
  date?: string
  dueDate?: string
  status: string
  
  // Penerima Tagihan (Siswa atau Tenant)
  billedToName: string
  billedToDetails?: string[]

  // Info Instansi / Sekolah / Platform
  companyName: string
  companyDetails?: string[]
  
  // Info Pembayaran
  bankName?: string
  bankAccountName?: string
  bankNumber?: string
  notes?: string
}

export async function generateInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 })
      const buffers: Buffer[] = []
      
      doc.on('data', (buffer) => buffers.push(buffer))
      doc.on('end', () => resolve(Buffer.concat(buffers)))

      // --- Header ---
      doc.fontSize(20).font('Helvetica-Bold').text('INVOICE', { align: 'right' })
      doc.moveDown()

      // Company Info (Left) and Invoice Info (Right)
      const currentY = doc.y

      // Left: Company Info
      doc.fontSize(12).font('Helvetica-Bold').text(data.companyName, 50, currentY)
      doc.font('Helvetica').fontSize(10)
      if (data.companyDetails) {
        data.companyDetails.forEach(detail => doc.text(detail, 50))
      }

      // Right: Invoice Details
      doc.fontSize(10).font('Helvetica-Bold').text(`No. Invoice:`, 350, currentY)
      doc.font('Helvetica').text(data.invoiceNumber, 430, currentY)

      if (data.date) {
        doc.font('Helvetica-Bold').text(`Tanggal:`, 350, currentY + 15)
        doc.font('Helvetica').text(data.date, 430, currentY + 15)
      }
      
      if (data.dueDate) {
        doc.font('Helvetica-Bold').text(`Jatuh Tempo:`, 350, currentY + 30)
        doc.font('Helvetica').text(data.dueDate, 430, currentY + 30)
      }

      doc.font('Helvetica-Bold').text(`Status:`, 350, currentY + 45)
      const statusColor = data.status.toUpperCase() === 'PAID' ? 'green' : 'red'
      doc.fillColor(statusColor).text(data.status.toUpperCase(), 430, currentY + 45)
      doc.fillColor('black') // reset

      // --- Billed To ---
      doc.moveDown(4)
      doc.font('Helvetica-Bold').fontSize(11).text('Tagihan Kepada:', 50)
      doc.font('Helvetica').fontSize(10).text(data.billedToName)
      if (data.billedToDetails) {
        data.billedToDetails.forEach(detail => doc.text(detail))
      }

      // --- Line Separator ---
      doc.moveDown(2)
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
      doc.moveDown(1)

      // --- Items Table Header ---
      const tableTop = doc.y
      doc.font('Helvetica-Bold')
      doc.text('Deskripsi', 50, tableTop)
      doc.text('Jumlah', 400, tableTop, { align: 'right', width: 150 })
      
      doc.moveDown(0.5)
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
      doc.moveDown(1)

      // --- Items Table Body ---
      doc.font('Helvetica')
      const itemY = doc.y
      doc.text(data.title, 50, itemY, { width: 330 })
      doc.text(`Rp ${data.amount.toLocaleString('id-ID')}`, 400, itemY, { align: 'right', width: 150 })

      doc.moveDown(2)
      doc.moveTo(350, doc.y).lineTo(550, doc.y).stroke()
      doc.moveDown(1)

      // --- Total ---
      doc.font('Helvetica-Bold').fontSize(12)
      doc.text('Total Pembayaran:', 350, doc.y)
      doc.text(`Rp ${data.amount.toLocaleString('id-ID')}`, 400, doc.y - 14, { align: 'right', width: 150 })

      // --- Payment Info ---
      doc.moveDown(4)
      doc.fontSize(11).font('Helvetica-Bold').text('Informasi Pembayaran:')
      doc.fontSize(10).font('Helvetica')
      if (data.bankName && data.bankNumber) {
        doc.text(`Bank: ${data.bankName}`)
        doc.text(`No. Rekening: ${data.bankNumber}`)
        if (data.bankAccountName) doc.text(`Atas Nama: ${data.bankAccountName}`)
      } else {
        doc.text('Silakan hubungi admin untuk instruksi pembayaran.')
      }

      if (data.notes) {
        doc.moveDown(2)
        doc.font('Helvetica-Oblique').fillColor('gray').text(data.notes, { align: 'center' })
        doc.fillColor('black')
      }

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}
