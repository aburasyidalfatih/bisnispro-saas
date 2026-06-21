"use client"

import React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
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
  const selectedIcon = ICONS[value as IconName]
  
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm items-center gap-2">
        <div className="flex items-center gap-2 truncate">
          {selectedIcon ? (
            <>
              {React.createElement(selectedIcon, { className: "h-4 w-4 shrink-0" })}
              <span className="truncate">{value}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Pilih Ikon (Opsional)</span>
          )}
        </div>
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        <SelectItem value="none" className="text-muted-foreground italic">
          -- Tanpa Ikon --
        </SelectItem>
        {Object.entries(ICONS).map(([name, Icon]) => (
          <SelectItem key={name} value={name}>
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 shrink-0" />
              <span>{name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
