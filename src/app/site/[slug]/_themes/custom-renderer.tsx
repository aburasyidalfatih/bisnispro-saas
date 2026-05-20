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

  Handlebars.registerHelper("truncate", function (str: string, len: number) {
    if (!str) return ""
    if (str.length <= len) return str
    return str.substring(0, len) + "..."
  })

  Handlebars.registerHelper("dateFormat", function (dateStr: string) {
    if (!dateStr) return ""
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    } catch { return dateStr }
  })

  Handlebars.registerHelper("ifEqual", function (this: any, a: any, b: any, options: any) {
    return a === b ? options.fn(this) : options.inverse(this)
  })

  Handlebars.registerHelper("json", function (context: any) {
    return JSON.stringify(context, null, 2)
  })
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

    return (
      <div className="custom-theme-wrapper">
        <style dangerouslySetInnerHTML={{ __html: opts.customCss }} />
        {parse(finalHtml)}
        {opts.customJs && (
          <script dangerouslySetInnerHTML={{ __html: opts.customJs }} />
        )}
      </div>
    ) as React.ReactElement
  } catch (e: any) {
    console.error("[CustomTheme] Render error:", e.message)
    return null
  }
}
