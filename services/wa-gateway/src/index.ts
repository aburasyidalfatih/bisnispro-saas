import express from 'express'
import dotenv from 'dotenv'
import { startWhatsAppSession, getSession, initAllSessions, sessions } from './baileys/connection'
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
      data: { status: 'DISCONNECTED', qrCode: null, creds: null }
    }).catch(() => {})
  }
  res.json({ message: 'Logged out' })
})

// 4. Send Message (Directly - Not via Queue yet)
app.post('/api/wa/send', async (req, res) => {
  const { tenantId, to, text } = req.body
  
  const sock = getSession(tenantId)
  if (!sock) return res.status(400).json({ error: 'WhatsApp not connected for this tenant' })

  try {
    // Format number to 628xxx@s.whatsapp.net
    let jid = to.replace(/[^0-9]/g, '')
    if (jid.startsWith('0')) jid = '62' + jid.substring(1)
    if (!jid.includes('@s.whatsapp.net')) jid = jid + '@s.whatsapp.net'

    const result = await sock.sendMessage(jid, { text })
    
    // Log to DB
    await prisma.waMessage.create({
      data: { tenantId, to: jid, content: text, status: 'SENT' }
    })

    res.json({ message: 'Sent', result })
  } catch (error: any) {
    await prisma.waMessage.create({
      data: { tenantId, to, content: text, status: 'FAILED', error: error.message }
    })
    res.status(500).json({ error: 'Failed to send message', details: error.message })
  }
})

app.listen(PORT, () => {
  console.log(`WA Gateway running on port ${PORT}`)
})
