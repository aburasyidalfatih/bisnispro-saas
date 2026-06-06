/**
 * Custom Theme Renderer Utility
 * 
 * Shared helper for rendering Handlebars-based custom themes
 * across all public site pages.
 */
import Handlebars from "handlebars"
import parse from "html-react-parser"

// ─── Register custom Handlebars helpers (idempotent) ───
let helpersRegistered = false

function registerHelpers() {
  if (helpersRegistered) return
  helpersRegistered = true

  // --- Utility & JSON ---
  Handlebars.registerHelper("json", function (context: any) {
    return JSON.stringify(context, null, 2)
  })

  // --- String Helpers ---
  Handlebars.registerHelper("truncate", function (str: string, len: number) {
    if (!str) return ""
    if (str.length <= len) return str
    return str.substring(0, len) + "..."
  })
  Handlebars.registerHelper("uppercase", (str: string) => (typeof str === "string" ? str.toUpperCase() : str))
  Handlebars.registerHelper("lowercase", (str: string) => (typeof str === "string" ? str.toLowerCase() : str))
  Handlebars.registerHelper("capitalize", (str: string) => {
    if (typeof str !== "string" || !str) return ""
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  })
  Handlebars.registerHelper("slugify", (str: string) => {
    if (typeof str !== "string") return ""
    return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
  })
  Handlebars.registerHelper("replace", (str: string, search: string, replace: string) => {
    if (typeof str !== "string") return str
    return str.split(search).join(replace)
  })
  Handlebars.registerHelper("default", (value: any, defaultValue: any) => {
    return value ? value : defaultValue
  })

  Handlebars.registerHelper("dateFormat", function (dateStr: string) {
    if (!dateStr) return ""
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" })
    } catch { return dateStr }
  })
  Handlebars.registerHelper("currencyFormat", (value: number) => {
    if (isNaN(value)) return value
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value)
  })

  // --- Array Helpers ---
  Handlebars.registerHelper("length", (arr: any) => (Array.isArray(arr) ? arr.length : 0))
  Handlebars.registerHelper("limit", (arr: any, limit: number) => {
    if (!Array.isArray(arr)) return []
    return arr.slice(0, limit)
  })
  Handlebars.registerHelper("join", (arr: any, separator: string) => {
    if (!Array.isArray(arr)) return arr
    return arr.join(separator)
  })

  // --- Logic Helpers ---
  Handlebars.registerHelper("ifEqual", function (this: any, a: any, b: any, options: any) {
    return a === b ? options.fn(this) : options.inverse(this)
  })
  Handlebars.registerHelper("eq", (a: any, b: any) => a === b)
  Handlebars.registerHelper("neq", (a: any, b: any) => a !== b)
  Handlebars.registerHelper("lt", (a: number, b: number) => a < b)
  Handlebars.registerHelper("gt", (a: number, b: number) => a > b)
  Handlebars.registerHelper("lte", (a: number, b: number) => a <= b)
  Handlebars.registerHelper("gte", (a: number, b: number) => a >= b)
  Handlebars.registerHelper("and", (...args: any[]) => {
    // Last argument is the Handlebars options object, ignore it
    const conditions = args.slice(0, -1)
    return conditions.every(Boolean)
  })
  Handlebars.registerHelper("or", (...args: any[]) => {
    const conditions = args.slice(0, -1)
    return conditions.some(Boolean)
  })
  Handlebars.registerHelper("not", (a: any) => !a)

  // --- Math Helpers ---
  Handlebars.registerHelper("add", (a: number, b: number) => Number(a) + Number(b))
  Handlebars.registerHelper("subtract", (a: number, b: number) => Number(a) - Number(b))
  Handlebars.registerHelper("multiply", (a: number, b: number) => Number(a) * Number(b))
  Handlebars.registerHelper("divide", (a: number, b: number) => Number(a) / Number(b))
}

interface RenderCustomThemeOptions {
  templateHtml: string
  layoutHtml: string
  customCss: string
  customJs: string
  context: Record<string, any>
}

/**
 * Renders a custom Handlebars theme and returns a React element.
 * Returns null if rendering fails (so callers can fallback to built-in theme).
 */
export function renderCustomTheme(opts: RenderCustomThemeOptions): React.ReactElement | null {
  registerHelpers()

  try {
    const template = Handlebars.compile(opts.templateHtml)
    const layoutTemplate = Handlebars.compile(opts.layoutHtml)

    const pageHtml = template(opts.context)
    const finalHtml = layoutTemplate({ ...opts.context, body: new Handlebars.SafeString(pageHtml) })

    // Sandboxing custom JS execution using IIFE and try-catch
    const sandboxedJs = opts.customJs ? `
      (function() {
        try {
          ${opts.customJs}
        } catch(error) {
          console.error("[CustomTheme JS Error]:", error);
        }
      })();
    ` : ""

    return (
      <div className="custom-theme-wrapper">
        <style dangerouslySetInnerHTML={{ __html: opts.customCss }} />
        {parse(finalHtml)}
        {sandboxedJs && (
          <script dangerouslySetInnerHTML={{ __html: sandboxedJs }} />
        )}
      </div>
    ) as React.ReactElement
  } catch (e: any) {
    console.error("[CustomTheme] Render error:", e.message)
    return null
  }
}
