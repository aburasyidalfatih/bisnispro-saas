import { Prisma } from '@prisma/client'
import makeWASocket, { DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import pino from 'pino'
import { getPrismaAuthState } from './auth-store'
import prisma from '../prisma'
import qrcode from 'qrcode'

const logger = pino({ level: 'error' })

// In-memory store for active connections
export const sessions = new Map<string, any>()
export const lastActivity = new Map<string, number>()

export const updateActivity = (tenantId: string) => {
  lastActivity.set(tenantId, Date.now())
}

// Garbage collection for idle sessions (Lazy Connection)
setInterval(() => {
  const now = Date.now()
  const IDLE_TIMEOUT = 60 * 60 * 1000 // 1 hour
  
  for (const [tenantId, sock] of sessions.entries()) {
    const lastActive = lastActivity.get(tenantId) || now
    if (now - lastActive > IDLE_TIMEOUT) {
      console.log(`[Tenant ${tenantId}] Idle for 1 hour. Disconnecting to save memory...`)
      sock.end(undefined) // Disconnect silently without logging out
      sessions.delete(tenantId)
      lastActivity.delete(tenantId)
    }
  }
}, 5 * 60 * 1000) // Check every 5 minutes

export const startWhatsAppSession = async (tenantId: string) => {
  const { state, saveState } = await getPrismaAuthState(tenantId)
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: state,
    browser: ['Windows', 'Chrome', '122.0.0.0'],
    markOnlineOnConnect: false,
    generateHighQualityLinkPreviews: false
  })

  sessions.set(tenantId, sock)
  updateActivity(tenantId) // Initialize activity

  sock.ev.on('creds.update', saveState)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      // Convert QR to Base64 and save to DB for frontend to pull
      const qrBase64 = await qrcode.toDataURL(qr)
      await prisma.waSession.update({
        where: { tenantId },
        data: { qrCode: qrBase64, status: 'CONNECTING' }
      }).catch(console.error)
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
      
      console.log(`[Tenant ${tenantId}] Connection closed. Reconnecting:`, shouldReconnect)
      
      if (shouldReconnect) {
        setTimeout(() => startWhatsAppSession(tenantId), 5000)
      } else {
        // Logged out
        await prisma.waSession.update({
          where: { tenantId },
          data: { status: 'DISCONNECTED', qrCode: null, creds: Prisma.DbNull }
        }).catch(console.error)
        sessions.delete(tenantId)
      }
    } else if (connection === 'open') {
      console.log(`[Tenant ${tenantId}] Connection opened!`)
      await prisma.waSession.update({
        where: { tenantId },
        data: { status: 'CONNECTED', qrCode: null }
      }).catch(console.error)
    }
  })

  // Optional: handle incoming messages (e.g., Auto-reply)
  sock.ev.on('messages.upsert', async (m) => {
    // const msg = m.messages[0]
    // if (!msg.key.fromMe && m.type === 'notify') {
    //   console.log(`New message for tenant ${tenantId}`, msg)
    // }
  })

  return sock
}

export const getSession = (tenantId: string) => {
  return sessions.get(tenantId)
}

export const initAllSessions = async () => {
  const activeSessions = await prisma.waSession.findMany({
    where: { status: 'CONNECTED' }
  })
  
  for (const session of activeSessions) {
    console.log(`Restoring session for tenant: ${session.tenantId}`)
    await startWhatsAppSession(session.tenantId)
  }
}
