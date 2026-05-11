"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Printer, Download, UserCircle, QrCode as QrIcon } from "lucide-react"
import QRCode from "react-qr-code"

export function StudentCardGenerator({ students }: { students: any[] }) {
  const [activeStudentId, setActiveStudentId] = useState(students[0]?.id)

  const activeStudent = students.find(s => s.id === activeStudentId)

  const handlePrint = () => {
    window.print()
  }

  if (!students.length) {
    return (
      <Card className="glass border-0">
        <CardContent className="py-12 text-center text-muted-foreground">
          Belum ada data siswa.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Selector Siswa */}
      <div className="flex gap-2 overflow-x-auto pb-2 print:hidden">
        {students.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveStudentId(s.id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeStudentId === s.id 
                ? "bg-slate-800 text-white shadow-lg shadow-slate-800/20" 
                : "bg-white text-muted-foreground hover:bg-slate-50 hover:text-slate-900 border"
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {activeStudent && (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Card Preview Area */}
          <div className="flex-1 flex justify-center bg-slate-100 rounded-[2.5rem] p-8 md:p-14 border-2 border-dashed print:border-0 print:bg-white print:p-0">
            
            {/* The ID Card Design (Premium) */}
            <div className="relative w-[340px] h-[540px] bg-white rounded-3xl shadow-2xl overflow-hidden print:shadow-none print:w-[85.6mm] print:h-[53.98mm] print:rounded-none group">
              
              {/* Premium Background / Watermark */}
              <div className="absolute inset-0 bg-slate-50/50 pointer-events-none" />
              <div className="absolute inset-0 opacity-[0.03] flex items-center justify-center pointer-events-none">
                <QrIcon className="w-64 h-64 rotate-12" />
              </div>

              {/* Decorative Geometric Header */}
              <div className="absolute top-0 w-full h-[180px] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/60" />
                <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
                <div className="absolute -top-20 -right-20 w-48 h-48 bg-white/20 rounded-full blur-2xl" />
                <div className="absolute top-10 -left-10 w-32 h-32 bg-white/20 rounded-full blur-xl" />
                
                {/* SVG Curve at the bottom of header */}
                <svg className="absolute bottom-0 w-full h-12 text-white" preserveAspectRatio="none" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M0,100 C30,40 70,40 100,100 Z" />
                </svg>
              </div>
              
              {/* Header Content */}
              <div className="relative z-10 pt-6 px-6 flex flex-col items-center text-center">
                {activeStudent.tenant?.logo ? (
                  <img src={activeStudent.tenant.logo} alt="Logo" className="w-12 h-12 object-contain drop-shadow-md mb-2 bg-white/20 p-1 rounded-full backdrop-blur-sm border border-white/30" />
                ) : null}
                <p className="text-primary-foreground font-black text-lg tracking-[0.2em] uppercase drop-shadow-sm leading-tight">
                  KARTU PELAJAR
                </p>
                <p className="text-primary-foreground/90 text-[10px] font-bold tracking-widest mt-0.5 uppercase">
                  {activeStudent.tenant?.name || "SchoolPro SaaS"}
                </p>
              </div>

              {/* Profile Photo Area (Premium Overlapping) */}
              <div className="relative z-10 mt-6 flex justify-center">
                <div className="relative">
                  {/* Glowing ring */}
                  <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-primary/40 rounded-2xl blur-sm opacity-80" />
                  {/* Photo container */}
                  <div className="relative w-32 h-32 bg-white p-1.5 rounded-2xl shadow-xl transform rotate-2 transition-transform group-hover:rotate-0">
                    <div className="w-full h-full bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200/60">
                      <UserCircle className="w-20 h-20 text-slate-300" />
                    </div>
                  </div>
                  {/* Badge */}
                  <div className="absolute -bottom-3 -right-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg border-2 border-white transform -rotate-6">
                    {activeStudent.classroom?.name || "SISWA"}
                  </div>
                </div>
              </div>

              {/* Student Details (Modern Typography) */}
              <div className="relative z-10 mt-10 px-8 text-center">
                <h2 className="text-[22px] font-black text-slate-800 leading-tight tracking-tight uppercase">
                  {activeStudent.name}
                </h2>
                
                <div className="mt-5 flex flex-col gap-2">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex justify-between items-center shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">NISN</span>
                    <span className="font-black text-primary tracking-wider">{activeStudent.nisn || activeStudent.nis || "-"}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex justify-between items-center shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TGL LAHIR</span>
                    <span className="font-bold text-slate-700">
                      {activeStudent.birthDate ? new Date(activeStudent.birthDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* QR Code Bottom Footer (Holographic/Premium look) */}
              <div className="absolute bottom-0 w-full h-[100px] bg-slate-900 p-4 flex items-center justify-between overflow-hidden">
                <div className="absolute inset-0 bg-slate-900" />
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-bl from-primary to-transparent rounded-full blur-2xl opacity-60" />
                <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
                
                <div className="relative z-10 pl-2">
                  <p className="text-[9px] text-primary-foreground/90 font-bold uppercase tracking-[0.2em] mb-1.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> E-KANTIN READY
                  </p>
                  <p className="text-[10px] font-medium text-slate-400 leading-tight">
                    Kartu ini sah digunakan<br/>sebagai alat bayar.
                  </p>
                </div>
                <div className="relative z-10 bg-white p-1.5 rounded-xl shadow-lg transform -rotate-2">
                  {/* Generate QR based on student.id (Primary Key) */}
                  <QRCode value={activeStudent.id} size={64} level="H" />
                </div>
              </div>

            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full lg:w-72 space-y-4 print:hidden shrink-0">
            <Card className="glass border-0 shadow-lg">
              <CardContent className="p-5 space-y-4">
                <div className="text-center pb-2 border-b border-border/50">
                  <h3 className="font-bold text-lg">Cetak Kartu Fisik</h3>
                  <p className="text-xs text-muted-foreground mt-1">Unduh atau print langsung kartu E-KTM siswa ini.</p>
                </div>
                
                <Button onClick={handlePrint} className="w-full rounded-xl h-14 text-base font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform">
                  <Printer className="w-5 h-5 mr-2" /> Print / Save as PDF
                </Button>
                
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 leading-relaxed">
                  <p className="font-bold flex items-center gap-1 mb-1">
                    <span className="text-lg">💡</span> Pengaturan Printer:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 mt-1 font-medium">
                    <li>Kertas: PVC ID Card / Art Carton 260g</li>
                    <li>Scale: <strong>Actual Size (100%)</strong></li>
                    <li>Centang: <strong>Background Graphics</strong></li>
                    <li>Hilangkan centang: <strong>Headers & Footers</strong></li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Print Styles injection */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
            background-color: transparent;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:border-0 {
            border: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          /* We want to make the card visible and position it top-left for easy printing */
          div[class*="w-[340px]"] {
            visibility: visible !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            transform: scale(1) !important;
            margin: 0 !important;
            border-radius: 8px !important; /* Keep a slight radius for cutting guide */
            overflow: hidden !important;
          }
          div[class*="w-[340px]"] * {
            visibility: visible !important;
          }
          /* Force backgrounds to print exactly as seen */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: auto;
            margin: 0mm;
          }
        }
      `}} />
    </div>
  )
}
