import { Prisma } from '@prisma/client'
import express from 'express'
import dotenv from 'dotenv'
import { startWhatsAppSession, getSession, initAllSessions, sessions, updateActivity } from './baileys/connection'
import prisma from './prisma'

dotenv.config({ path: '../../.env' }) // Load the root env

const app = express()
app.use(express.json())

// Basic security middleware: check internal API secret
app.use((req, res, next) => {
  const secret = req.headers['x-internal-secret']
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  next()
})

const PORT = process.env.WA_GATEWAY_PORT || 4000

// Initialize all previous active sessions on startup
initAllSessions()

// --- ROUTES ---

// 1. Generate / Start Session
app.post('/api/wa/session/start', async (req, res) => {
  const { tenantId } = req.body
  if (!tenantId) return res.status(400).json({ error: 'tenantId is required' })

  try {
    let session = getSession(tenantId)
    if (!session) {
      // Ensure record exists
      await prisma.waSession.upsert({
        where: { tenantId },
        update: { status: 'CONNECTING', qrCode: null },
        create: { tenantId, status: 'CONNECTING' }
      })
      await startWhatsAppSession(tenantId)
    }
    res.json({ message: 'Session started/connecting' })
  } catch (error: any) {
    console.error("[startWaSession Error]:", error)
    res.status(500).json({ error: error.message })
  }
})

// 2. Get Status & QR
app.get('/api/wa/session/:tenantId', async (req, res) => {
  const { tenantId } = req.params
  const session = await prisma.waSession.findUnique({ where: { tenantId } })
  if (!session) return res.status(404).json({ error: 'Session not found' })
  
  res.json({
    status: session.status,
    qrCode: session.qrCode
  })
})

// 3. Logout / Disconnect
app.post('/api/wa/session/logout', async (req, res) => {
  const { tenantId } = req.body
  const sock = getSession(tenantId)
  
  if (sock) {
    sock.logout() // This will trigger the connection.update close event and cleanup
  } else {
    // If socket isn't in memory, just cleanup DB
    await prisma.waSession.update({
      where: { tenantId },
      data: { status: 'DISCONNECTED', qrCode: null, creds: Prisma.DbNull }
    }).catch(() => {})
  }
  res.json({ message: 'Logged out' })
})

// 4. Send Message (Sistem Antrean / Queued)
app.post('/api/wa/send', async (req, res) => {
  const { tenantId, to, text } = req.body
  
  try {
    let jid = to.replace(/[^0-9]/g, '')
    if (jid.startsWith('0')) jid = '62' + jid.substring(1)
    if (!jid.includes('@s.whatsapp.net')) jid = jid + '@s.whatsapp.net'

    // Simpan ke DB dengan status PENDING agar diproses oleh Worker
    await prisma.waMessage.create({
      data: { tenantId, to: jid, content: text, status: 'PENDING' }
    })

    res.json({ message: 'Message queued successfully' })
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to queue message', details: error.message })
  }
})

// --- BACKGROUND WORKER: MESSAGE QUEUE PROCESSOR ---
const processingTenants = new Set<string>()
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function processQueue() {
  try {
    // Ambil semua pesan yang masih PENDING (maks 100 antrean di memori)
    const pendingMessages = await prisma.waMessage.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      take: 100
    })

    if (pendingMessages.length === 0) return

    // Kelompokkan pesan berdasarkan tenantId
    const grouped = pendingMessages.reduce((acc, msg) => {
      if (!acc[msg.tenantId]) acc[msg.tenantId] = []
      acc[msg.tenantId].push(msg)
      return acc
    }, {} as Record<string, typeof pendingMessages>)

    // Eksekusi antrean masing-masing tenant secara paralel (tidak saling tunggu antar sekolah)
    for (const tenantId of Object.keys(grouped)) {
      if (processingTenants.has(tenantId)) continue // Tenant ini masih sibuk mengirim antrean sebelumnya
      
      let sock = getSession(tenantId)
      if (!sock) {
        // LAZY CONNECTION: Bangunkan sesi yang sedang tertidur!
        console.log(`[Tenant ${tenantId}] Waking up from sleep to process queue...`)
        sock = await startWhatsAppSession(tenantId)
        await wait(5000) // Tunggu sebentar agar koneksi stabil
      }
      
      processingTenants.add(tenantId)
      
      // Proses pesan tenant secara sekuensial (berurutan)
      ;(async () => {
        try {
          const session = await prisma.waSession.findUnique({
            where: { tenantId },
            select: { delayMin: true, delayMax: true }
          })
          
          // Default delay 5 - 15 detik jika belum diatur
          const minSec = session?.delayMin ?? 5
          const maxSec = session?.delayMax ?? 15

          for (const msg of grouped[tenantId]) {
            try {
              // Kirim Pesan
              await sock.sendMessage(msg.to, { text: msg.content })
              
              // Perbarui waktu aktivitas terakhir agar tidak terputus (Auto-Disconnect di reset)
              updateActivity(tenantId)
              
              // Update status
              await prisma.waMessage.update({
                where: { id: msg.id },
                data: { status: 'SENT', processedAt: new Date() }
              })
            } catch (err: any) {
              console.error(`Failed to send message ${msg.id}:`, err)
              await prisma.waMessage.update({
                where: { id: msg.id },
                data: { status: 'FAILED', processedAt: new Date() } // Kolom error dicatat jika ada schema support, jika tidak biarkan
              })
            }

            // JEDA MANUSIAWI (Human-like delay)
            // Hanya delay jika masih ada sisa pesan, agar memori cepat lega jika sudah habis
            if (grouped[tenantId].length > 1) {
              const delayMs = Math.floor(Math.random() * (maxSec - minSec + 1) + minSec) * 1000
              console.log(`[Tenant ${tenantId}] Waiting ${delayMs/1000}s before next message...`)
              await wait(delayMs)
            }
          }
        } finally {
          processingTenants.delete(tenantId) // Lepaskan kunci agar worker selanjutnya bisa memproses tenant ini
        }
      })()
    }
  } catch (error) {
    console.error("Queue Processor Error:", error)
  }
}

// Jalankan sistem antrean setiap 5 detik
setInterval(processQueue, 5000)


app.listen(PORT, () => {
  console.log(`WA Gateway running on port ${PORT}`)
})
