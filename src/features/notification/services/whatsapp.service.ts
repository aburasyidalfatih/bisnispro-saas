import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { enqueueWhatsApp } from "./wa-queue.service"

export interface WaConfig {
  apiUrl: string
  apiKey: string
  deviceId?: string
  provider?: string
  metaPhoneId?: string
  metaToken?: string
  wavioApiKey?: string
  wavioNumberId?: string
  delayMin?: number
  delayMax?: number
  isCustom?: boolean
  gateways?: { apiKey: string; deviceId?: string }[]
}

export interface TemplateData {
  name: string
  language?: string
  variables?: Record<string, string>
  buttonVariables?: string[]
}

export async function getWaConfig(tenantId?: string): Promise<WaConfig> {
  if (tenantId) {
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    })
    const settings = (tenant?.settings as Record<string, any>) || {}
    if (settings.whatsapp?.waApiKey) {
      return {
        apiUrl: settings.whatsapp.waApiUrl || "https://api.starsender.online/api",
        apiKey: settings.whatsapp.waApiKey,
        deviceId: settings.whatsapp.waDeviceId,
        provider: "starsender",
        delayMin: Number(settings.whatsapp.waDelayMin || 0),
        delayMax: Number(settings.whatsapp.waDelayMax || 0),
        isCustom: true,
        gateways: [{
          apiKey: settings.whatsapp.waApiKey,
          deviceId: settings.whatsapp.waDeviceId || "",
        }],
      }
    }
  }
  // Fallback ke platform settings dari database, lalu env var
  const platformSettings = await db.platformSetting.findMany({
    where: { key: { in: ["STARSENDER_API_URL", "STARSENDER_API_KEY", "STARSENDER_DEVICE_ID", "WA_ACTIVE_PROVIDER", "META_WA_PHONE_NUMBER_ID", "META_WA_ACCESS_TOKEN", "WAVIO_API_KEY", "WAVIO_NUMBER_ID", "STARSENDER_DELAY_MIN", "STARSENDER_DELAY_MAX", "STARSENDER_KEYS_JSON"] } },
  })
  const map = Object.fromEntries(
    platformSettings.filter((s) => s.value).map((s) => [s.key, s.value!])
  )
  
  let provider = map.WA_ACTIVE_PROVIDER || "internal";
  
  // Permintaan khusus: Jangan gunakan Wavio untuk Tenant. Hanya untuk Super Admin.
  if (tenantId && provider === "wavio") {
    provider = "starsender";
  }

  // Parse StarSender multiple gateways
  let gateways: { apiKey: string; deviceId?: string }[] = []
  if (map.STARSENDER_KEYS_JSON) {
    try {
      const parsed = JSON.parse(map.STARSENDER_KEYS_JSON)
      if (Array.isArray(parsed)) {
        gateways = parsed
      }
    } catch {
      gateways = []
    }
  }

  // Fallback to single gateway if JSON is empty but single key exists
  if ((!gateways || gateways.length === 0) && (map.WA_API_KEY || map.STARSENDER_API_KEY || process.env.STARSENDER_API_KEY)) {
    gateways = [{
      apiKey: map.WA_API_KEY || map.STARSENDER_API_KEY || process.env.STARSENDER_API_KEY || "",
      deviceId: map.WA_DEVICE_ID || map.STARSENDER_DEVICE_ID || process.env.STARSENDER_DEVICE_ID || "",
    }]
  }

  return {
    provider,
    apiUrl: map.WA_API_URL || map.STARSENDER_API_URL || process.env.STARSENDER_API_URL || "https://api.starsender.online/api",
    apiKey: map.WA_API_KEY || map.STARSENDER_API_KEY || process.env.STARSENDER_API_KEY || "",
    deviceId: map.WA_DEVICE_ID || map.STARSENDER_DEVICE_ID || process.env.STARSENDER_DEVICE_ID,
    metaPhoneId: map.META_WA_PHONE_NUMBER_ID,
    metaToken: map.META_WA_ACCESS_TOKEN,
    wavioApiKey: map.WAVIO_API_KEY,
    wavioNumberId: map.WAVIO_NUMBER_ID,
    delayMin: Math.min(Number(map.WA_DELAY_MIN) || Number(map.STARSENDER_DELAY_MIN) || 1, 60),
    delayMax: Math.min(Number(map.WA_DELAY_MAX) || Number(map.STARSENDER_DELAY_MAX) || 3, 60),
    isCustom: false,
    gateways,
  }
}

export async function sendWhatsApp(
  phone: string,
  message: string,
  tenantId?: string | null,
  templateData?: TemplateData
): Promise<{ success: boolean; error?: string }> {
  return enqueueWhatsApp(phone, message, tenantId, templateData);
}

export async function checkWhatsAppNumber(phone: string): Promise<{ isValid: boolean; formatted?: string }> {
  let p = phone.replace(/\D/g, "");
  if (p.startsWith("0")) p = "62" + p.substring(1);
  if (p.startsWith("8")) p = "62" + p;
  
  if (!p.startsWith("628")) return { isValid: false };
  if (p.length < 10 || p.length > 15) return { isValid: false };

  return { isValid: true, formatted: p };
}

export async function sendWhatsAppDirect(
  phone: string,
  message: string,
  tenantId?: string | null,
  templateData?: TemplateData,
  skipDelay?: boolean
): Promise<{ success: boolean; error?: string }> {
  
  try {
    const config = await getWaConfig(tenantId || undefined)

    const safeMin = config.delayMin && config.delayMin > 0 ? config.delayMin : 1;
    const safeMax = config.delayMax && config.delayMax > 0 ? config.delayMax : 3;
    
    const minMs = safeMin * 60000;
    const maxMs = Math.max(minMs, safeMax * 60000);
    
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    if (delay > 0 && !skipDelay) {
      await new Promise(r => setTimeout(r, delay));
    }

    // 0. META OFFICIAL API
    if (config.provider === "meta") {
      if (!config.metaPhoneId || !config.metaToken) {
        return { success: false, error: "Meta API credentials not configured" }
      }
      try {
        let toPhone = phone.replace(/\D/g, "")
        if (toPhone.startsWith("0")) toPhone = "62" + toPhone.slice(1)
        
        const res = await fetch(`https://graph.facebook.com/v18.0/${config.metaPhoneId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.metaToken}`,
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: toPhone,
            type: "text",
            text: { body: message },
          }),
        })

        if (!res.ok) {
          const errText = await res.text()
          logger.error("Meta WA send failed", { phone, status: res.status, body: errText })
          return { success: false, error: `Meta API error: ${res.status}` }
        }
        return { success: true }
      } catch (err: any) {
        logger.error("Meta WA exception", err, { phone })
        return { success: false, error: err.message }
      }
    }

    // 1. WAVIO API
    if (config.provider === "wavio") {
      if (!config.wavioApiKey || !config.wavioNumberId) {
        return { success: false, error: "Wavio API credentials not configured" }
      }
      try {
        let toPhone = phone.replace(/\D/g, "")
        if (toPhone.startsWith("0")) toPhone = "62" + toPhone.slice(1)
        if (!toPhone.startsWith("+")) toPhone = "+" + toPhone
        
        let wavioUrl = `https://api.wavio.web.id/api/v1/public/messages/send`
        let requestBody: any = {
          numberId: config.wavioNumberId,
          to: toPhone,
          text: message,
        }

        if (templateData && templateData.name) {
          wavioUrl = `https://api.wavio.web.id/api/v1/public/messages/send-template`
          
          const components = []
          if (templateData.variables) {
            const varValues = Object.values(templateData.variables)
            if (varValues.length > 0) {
              components.push({
                type: "body",
                parameters: varValues.map((val) => ({
                  type: "text",
                  text: val,
                })),
              })
            }
          }

          if (templateData.buttonVariables && templateData.buttonVariables.length > 0) {
            templateData.buttonVariables.forEach((val, index) => {
              components.push({
                type: "button",
                sub_type: "url",
                index: index.toString(),
                parameters: [
                  {
                    type: "text",
                    text: val,
                  },
                ],
              })
            })
          }

          requestBody = {
            numberId: config.wavioNumberId,
            to: toPhone,
            templateName: templateData.name,
            templateLanguage: templateData.language || "id",
            components,
          }
        }
        
        const res = await fetch(wavioUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": config.wavioApiKey,
          },
          body: JSON.stringify(requestBody),
        })

        const result = await res.json().catch(() => ({}))
        if (!res.ok || !result.success) {
          logger.error("Wavio send failed", { phone, status: res.status, body: result })
          return { success: false, error: `Wavio API error: ${result.message || res.status}` }
        }

        const messageId = result.data?.message_id || result.data?.id || result.message_id || result.id || null
        if (messageId) {
            await (db as any).wavioMessageLog.create({
              data: {
                  messageId: String(messageId),
                  tenantId,
                  phone: toPhone,
                  status: "SENT"
              }
            }).catch((e: any) => logger.error("Failed to save WavioMessageLog", e))
        }

        return { success: true }
      } catch (err: any) {
        logger.error("Wavio WA exception", err, { phone })
        return { success: false, error: err.message }
      }
    }

    // 2. Fallback ke StarSender (Legacy / starsender provider)
    let activeApiKey = config.apiKey
    let activeDeviceId = config.deviceId

    if (config.provider === "starsender" && config.gateways && config.gateways.length > 1) {
      const { getRedisClient } = await import("@/lib/redis")
      try {
        const redis = await getRedisClient()
        const count = config.gateways.length
        const index = await redis.incr("wa:starsender:index")
        const selectedGw = config.gateways[index % count]
        if (selectedGw) {
          activeApiKey = selectedGw.apiKey
          activeDeviceId = selectedGw.deviceId
          logger.info(`StarSender Rotation: Using gateway index ${index % count} (API Key: ...${activeApiKey.slice(-5)})`)
        }
      } catch (err) {
        logger.error("StarSender Rotation: Failed to get index from Redis, using first gateway", err)
        const selectedGw = config.gateways[0]
        if (selectedGw) {
          activeApiKey = selectedGw.apiKey
          activeDeviceId = selectedGw.deviceId
        }
      }
    }

    if (!activeApiKey) {
      return { success: false, error: "WA gateway belum dikonfigurasi" }
    }

    try {
      const body: Record<string, string> = {
        messageType: "text",
        to: phone,
        body: message,
      }
      if (activeDeviceId) body.deviceId = activeDeviceId

      const res = await fetch(`${config.apiUrl}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: activeApiKey,
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errText = await res.text()
        logger.error("WA send failed (StarSender)", { phone, status: res.status, body: errText })
        return { success: false, error: `StarSender error: ${res.status}` }
      }

      return { success: true }
    } catch (err: any) {
      logger.error("WA send exception (StarSender)", err, { phone })
      return { success: false, error: err.message }
    }
  } catch (err: any) {
    logger.error("Fatal queue exception", err)
    return { success: false, error: err.message }
  }
}
