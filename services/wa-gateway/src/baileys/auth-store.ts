import { AuthenticationCreds, SignalDataTypeMap, initAuthCreds, BufferJSON } from '@whiskeysockets/baileys'
import prisma from '../prisma'

export const getPrismaAuthState = async (tenantId: string) => {
  // Try to find existing session
  let session = await prisma.waSession.findUnique({
    where: { tenantId }
  })

  let creds: AuthenticationCreds
  let keys: any = {}

  if (session && session.creds) {
    const parsed = JSON.parse(JSON.stringify(session.creds), BufferJSON.reviver)
    creds = parsed.creds
    keys = parsed.keys || {}
  } else {
    creds = initAuthCreds()
    keys = {}
  }

  const saveState = async () => {
    const data = JSON.parse(JSON.stringify({ creds, keys }, BufferJSON.replacer))
    await prisma.waSession.upsert({
      where: { tenantId },
      update: { creds: data },
      create: { tenantId, creds: data }
    })
  }

  return {
    state: {
      creds,
      keys: {
        get: (type: keyof SignalDataTypeMap, ids: string[]) => {
          const data: { [key: string]: any } = {}
          ids.forEach(id => {
            let value = keys[`${type}-${id}`]
            if (type === 'app-state-sync-key' && value) {
              value = importSyncKey(value)
            }
            data[id] = value
          })
          return data
        },
        set: (data: any) => {
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id]
              const key = `${category}-${id}`
              if (value) {
                keys[key] = value
              } else {
                delete keys[key]
              }
            }
          }
          saveState()
        }
      }
    },
    saveState
  }
}

// Helper to convert AppStateSyncKey to buffer if necessary
function importSyncKey(data: any) {
  return data
}
