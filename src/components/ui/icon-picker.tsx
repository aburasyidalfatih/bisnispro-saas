"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Home, Building, ImageIcon, Info, Users, BookOpen, Star, FileText, 
  Phone, Mail, MessageCircle, MapPin, GraduationCap, Layout,
  Trophy, Calendar, Search, Menu, Settings, Link as LinkIcon,
  Globe, Briefcase, Camera, Video, Music, Monitor, Smartphone,
  Book, PenTool, Hash, Shield, Heart, Plus, File, Folder,
  MessageSquare, CircleUser, Library, Compass
} from "lucide-react"

export const ICONS = {
  Home, Building, ImageIcon, Info, Users, BookOpen, Star, FileText,
  Phone, Mail, MessageCircle, MapPin, GraduationCap, Layout,
  Trophy, Calendar, Search, Menu, Settings, LinkIcon,
  Globe, Briefcase, Camera, Video, Music, Monitor, Smartphone,
  Book, PenTool, Hash, Shield, Heart, Plus, File, Folder,
  MessageSquare, CircleUser, Library, Compass
} as const

export type IconName = keyof typeof ICONS

export function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name as IconName] || FileText
  return <Icon className={className} />
}

interface IconPickerProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function IconPicker({ value, onChange, disabled }: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const selectedIcon = ICONS[value as IconName]
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled} className="w-full justify-start text-left font-normal bg-background">
          {selectedIcon ? (
            <>
              {React.createElement(selectedIcon, { className: "h-4 w-4 mr-2 shrink-0" })}
              <span className="truncate">{value}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Pilih Ikon (Opsional)</span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Pilih Ikon Menu</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[300px] w-full rounded-md border p-4">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            <Button 
              variant={value === "none" || !value ? "default" : "outline"}
              className="col-span-full justify-start mb-2"
              onClick={() => { onChange("none"); setOpen(false); }}
            >
              -- Tanpa Ikon --
            </Button>
            {Object.entries(ICONS).map(([name, Icon]) => (
              <Button
                key={name}
                variant={value === name ? "default" : "outline"}
                className="h-12 w-12 p-0 flex items-center justify-center flex-col gap-1 hover:bg-primary/10 hover:text-primary"
                onClick={() => { onChange(name); setOpen(false); }}
                title={name}
              >
                <Icon className="h-5 w-5" />
              </Button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
