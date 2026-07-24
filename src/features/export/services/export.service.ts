

export interface ExportColumn {
  header: string
  key: string
  width?: number
}

export type ExportResultDTO = {
  success: boolean
  buffer?: Buffer
  error?: string
}

export async function exportToExcel(
  data: Record<string, any>[],
  columns: ExportColumn[],
  sheetName: string = "Data"
): Promise<ExportResultDTO> {
  try {
    if (!data || data.length === 0) {
      return { success: false, error: "Tidak ada data untuk diexport" }
    }

    const ExcelJS = (await import("exceljs")).default
    const workbook = new ExcelJS.Workbook()
    workbook.creator = "BisnisPro"
    workbook.created = new Date()

    const worksheet = workbook.addWorksheet(sheetName)

    worksheet.columns = columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width || 20,
    }))

    // Style header
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE8EAF6" },
    }

    // Add data
    data.forEach((row) => {
      worksheet.addRow(row)
    })

    const buffer = await workbook.xlsx.writeBuffer()
    return { success: true, buffer: Buffer.from(buffer) }
  } catch (error) {
    console.error("Failed to generate excel export:", error)
    return { success: false, error: "Gagal membuat file excel" }
  }
}
