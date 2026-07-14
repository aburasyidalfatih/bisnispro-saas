"use client"
import { useState } from "react"
import { LabelsForm } from "@/app/(dashboard)/admin/website/about/_components/labels-form"

export default function TestPage() {
  const [form, setForm] = useState({ settings: { labels: {} } } as any)
  return (
    <div className="p-8">
      <h1>Test LabelsForm</h1>
      <LabelsForm form={form} setForm={setForm} />
    </div>
  )
}
