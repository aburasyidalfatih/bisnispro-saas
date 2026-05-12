import { Prisma } from '@prisma/client'
import makeWASocket, { DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import pino from 'pino'
import { usePrismaAuthState } from './auth-store'
import prisma from '../prisma'
import qrcode from 'qrcode'

const logger = pino({ level: 'silent' })

// In-memory store for active connections
export const sessions = new Map<string, any>()

export const startWhatsAppSession = async (tenantId: string) => {
  const { state, saveState } = await usePrismaAuthState(tenantId)
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: state,
    browser: ['SchoolPro WA Gateway', 'Chrome', '1.0.0'],
    syncFullHistory: false,
    markOnlineOnConnect: false,
    generateHighQualityLinkPreviews: false
  })

  sessions.set(tenantId, sock)

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
