import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings2, Save } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SettingsForm } from "../constants"

interface AiTabProps {
  form: SettingsForm;
  setForm: React.Dispatch<React.SetStateAction<SettingsForm>>;
  handleSaveBatch: (fields: string[], overrides?: Record<string, string>) => Promise<void>;
  saving: boolean;
}

export function AiTab({ form, setForm, handleSaveBatch, saving }: AiTabProps) {
  return (
    <div className="grid gap-6 outline-none">
      <Card className="glass border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"><Settings2 className="h-4 w-4 text-primary" /></div>
              <CardTitle className="text-lg">Konfigurasi Kecerdasan Buatan</CardTitle>
            </div>
            <Button onClick={() => handleSaveBatch(["AI_PROVIDER", "OPENAI_API_KEY", "OPENAI_MODEL", "GEMINI_API_KEY", "GEMINI_MODEL", "OPENROUTER_API_KEY", "OPENROUTER_MODEL", "AI_AGENT_PROVIDER", "AI_AGENT_MODEL"])} disabled={saving} className="rounded-xl shadow-lg shadow-primary/20">
              <Save className="mr-2 h-4 w-4" /> Simpan Pengaturan
            </Button>
          </div>
          <CardDescription>Atur Provider LLM dan API Key yang akan digunakan secara default oleh sistem (untuk tenant yang tidak menggunakan API Key sendiri).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 max-w-2xl">
            <div className="space-y-2">
              <Label>Provider AI Utama</Label>
              <Select value={form.AI_PROVIDER} onValueChange={v => setForm({ ...form, AI_PROVIDER: v })}>
                <SelectTrigger className="w-full rounded-xl">
                  <SelectValue placeholder="Pilih Provider" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="gemini">Google Gemini</SelectItem>
                  <SelectItem value="openrouter">OpenRouter</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Pilih mesin LLM yang akan digunakan oleh platform ini.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={cn("space-y-4 border p-4 rounded-xl transition-all", form.AI_PROVIDER === 'openai' ? 'bg-primary/5 border-primary/30' : 'bg-muted/20 opacity-60 grayscale-[50%]')}>
                <div className="font-semibold text-sm flex items-center justify-between">
                  OpenAI
                  {form.AI_PROVIDER === 'openai' && <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
                </div>
                <div className="space-y-2">
                  <Label>Master API Key</Label>
                  <Input 
                    type="password"
                    placeholder="sk-proj-..." 
                    value={form.OPENAI_API_KEY} 
                    onChange={e => setForm({ ...form, OPENAI_API_KEY: e.target.value })} 
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Model Default</Label>
                  <Input 
                    placeholder="gpt-4o-mini" 
                    value={form.OPENAI_MODEL} 
                    onChange={e => setForm({ ...form, OPENAI_MODEL: e.target.value })} 
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className={cn("space-y-4 border p-4 rounded-xl transition-all", form.AI_PROVIDER === 'gemini' ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-muted/20 opacity-60 grayscale-[50%]')}>
                <div className="font-semibold text-sm flex items-center justify-between">
                  Google Gemini
                  {form.AI_PROVIDER === 'gemini' && <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
                </div>
                <div className="space-y-2">
                  <Label>Master API Key</Label>
                  <Input 
                    type="password"
                    placeholder="AIzaSy..." 
                    value={form.GEMINI_API_KEY} 
                    onChange={e => setForm({ ...form, GEMINI_API_KEY: e.target.value })} 
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Model Default</Label>
                  <Input 
                    placeholder="gemini-1.5-flash" 
                    value={form.GEMINI_MODEL} 
                    onChange={e => setForm({ ...form, GEMINI_MODEL: e.target.value })} 
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className={cn("space-y-4 border p-4 rounded-xl transition-all", form.AI_PROVIDER === 'openrouter' ? 'bg-indigo-500/5 border-indigo-500/30' : 'bg-muted/20 opacity-60 grayscale-[50%]')}>
                <div className="font-semibold text-sm flex items-center justify-between">
                  OpenRouter
                  {form.AI_PROVIDER === 'openrouter' && <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />}
                </div>
                <div className="space-y-2">
                  <Label>Master API Key</Label>
                  <Input 
                    type="password"
                    placeholder="sk-or-v1-..." 
                    value={form.OPENROUTER_API_KEY} 
                    onChange={e => setForm({ ...form, OPENROUTER_API_KEY: e.target.value })} 
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Model Default</Label>
                  <Input 
                    placeholder="meta-llama/llama-3-8b-instruct" 
                    value={form.OPENROUTER_MODEL} 
                    onChange={e => setForm({ ...form, OPENROUTER_MODEL: e.target.value })} 
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-blue-500/10 p-4 border border-blue-500/20">
              <p className="text-xs text-blue-700 dark:text-blue-400">
                Kunci akan disimpan di database <code>platform_settings</code>. Jika Provider diset ke <strong>OpenAI</strong>, maka API Key OpenAI dan model OpenAI yang akan digunakan. Begitu juga sebaliknya untuk Gemini.
              </p>
            </div>

            <div className="pt-6 border-t mt-6">
              <h3 className="text-base font-semibold mb-4 text-foreground flex items-center gap-2">
                <Settings2 className="h-4 w-4" /> Konfigurasi AI Agent Copilot
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Pilih model LLM canggih (seperti gpt-4o atau gemini-1.5-pro) yang akan digunakan khusus untuk Super Admin Data Analyst (Text-to-SQL).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Provider AI Agent</Label>
                  <Select value={form.AI_AGENT_PROVIDER || "openai"} onValueChange={v => setForm({ ...form, AI_AGENT_PROVIDER: v })}>
                    <SelectTrigger className="w-full rounded-xl bg-muted/50">
                      <SelectValue placeholder="Pilih Provider" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="gemini">Google Gemini</SelectItem>
                      <SelectItem value="openrouter">OpenRouter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Model AI Agent</Label>
                  <Input 
                    placeholder="Contoh: gpt-4o" 
                    value={form.AI_AGENT_MODEL || ""} 
                    onChange={e => setForm({ ...form, AI_AGENT_MODEL: e.target.value })} 
                    className="rounded-xl bg-muted/50"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
