"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import TextAlign from "@tiptap/extension-text-align"
import { Color } from "@tiptap/extension-color"
import { TextStyle } from "@tiptap/extension-text-style"
import { Table } from "@tiptap/extension-table"
import { TableRow } from "@tiptap/extension-table-row"
import { TableHeader } from "@tiptap/extension-table-header"
import { TableCell } from "@tiptap/extension-table-cell"
import Youtube from "@tiptap/extension-youtube"
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  List, 
  ListOrdered, 
  Heading2, 
  Heading3, 
  Quote, 
  Undo, 
  Redo,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Image as ImageIcon,
  Loader2,
  Table as TableIcon,
  Trash2,
  Rows3,
  Columns3,
  Video as YoutubeIcon
} from "lucide-react"
import { useTenantBranding } from "@/components/providers/tenant-branding-provider"
import { toast } from "@/hooks/use-toast"
import { useRef, useState, useEffect } from "react"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const { branding } = useTenantBranding()
  const tenantId = branding.id
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const img = document.createElement("img")
      img.src = URL.createObjectURL(file)
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const MAX_SIZE = 1920
        let { width, height } = img
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round(height * (MAX_SIZE / width))
            width = MAX_SIZE
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round(width * (MAX_SIZE / height))
            height = MAX_SIZE
          }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (!ctx) return resolve(file)
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file)
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
              type: "image/webp",
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          },
          "image/webp",
          0.8
        )
      }
      img.onerror = () => resolve(file)
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !tenantId) return
    
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File terlalu besar", description: "Ukuran maksimal 10 MB", variant: "destructive" })
      return
    }

    try {
      setIsUploading(true)
      const compressedFile = await compressImage(file)
      
      const fd = new FormData()
      fd.append("file", compressedFile)
      fd.append("tenantId", tenantId)
      fd.append("subDir", "post_content")
      
      const res = await fetch(`/api/upload`, {
        method: "POST",
        body: fd
      })
      const data = await res.json()
      
      if (res.ok && data.url) {
        editor?.chain().focus().setImage({ src: data.url }).run()
      } else {
        toast({ title: "Gagal upload", description: data.error || "Gagal upload gambar", variant: "destructive" })
      }
    } catch (err) {
      toast({ title: "Error", description: "Terjadi kesalahan upload", variant: "destructive" })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-4',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-4',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Youtube.configure({
        controls: true,
        nocookie: true,
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'w-full border-collapse border border-border my-4',
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: 'border-b border-border',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-border bg-muted px-4 py-2 text-left font-bold',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-border px-4 py-2',
        },
      }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[300px] p-4 bg-background",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Sinkronisasi nilai luar jika berubah (kecuali dari editor itu sendiri)
  // Ini berguna jika data dimuat secara asinkron atau diubah otomatis (misal AI generate)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  if (!editor) {
    return <div className="min-h-[300px] rounded-xl border border-input bg-background/50 animate-pulse" />
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    // cancelled
    if (url === null) {
      return
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const addYoutubeVideo = () => {
    const url = window.prompt('URL Video YouTube (contoh: https://www.youtube.com/watch?v=...)')
    if (url) {
      editor.chain().focus().setYoutubeVideo({ src: url }).run()
    }
  }

  const ToggleButton = ({ 
    isActive, 
    onClick, 
    children, 
    ariaLabel 
  }: { 
    isActive: boolean, 
    onClick: () => void, 
    children: React.ReactNode, 
    ariaLabel: string 
  }) => (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        onClick()
      }}
      aria-label={ariaLabel}
      className={`p-2 rounded-md transition-colors ${
        isActive 
          ? 'bg-primary/10 text-primary hover:bg-primary/20' 
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )

  return (
    <div className="rounded-xl border border-input overflow-hidden bg-background flex flex-col focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-shadow">
      <div className="border-b border-input bg-muted/20 p-1.5 flex flex-wrap gap-1 sticky top-0 z-10">
        <ToggleButton
          isActive={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          ariaLabel="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToggleButton>
        <ToggleButton
          isActive={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          ariaLabel="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </ToggleButton>
        <div className="w-[1px] h-6 bg-border mx-1 self-center" />
        <div className="flex items-center gap-1">
          <input
            type="color"
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            value={editor.getAttributes('textStyle').color || '#000000'}
            className="w-7 h-7 p-0 border-0 rounded cursor-pointer bg-transparent"
            aria-label="Text color"
            title="Warna Teks"
          />
        </div>
        <div className="w-[1px] h-6 bg-border mx-1 self-center" />
        <ToggleButton
          isActive={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          ariaLabel="Toggle bold"
        >
          <Bold className="h-4 w-4" />
        </ToggleButton>
        <ToggleButton
          isActive={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          ariaLabel="Toggle italic"
        >
          <Italic className="h-4 w-4" />
        </ToggleButton>
        <ToggleButton
          isActive={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          ariaLabel="Toggle strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </ToggleButton>
        <ToggleButton
          isActive={editor.isActive('link')}
          onClick={setLink}
          ariaLabel="Add Link"
        >
          <LinkIcon className="h-4 w-4" />
        </ToggleButton>
        
        {/* IMAGE UPLOAD BUTTON */}
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            fileInputRef.current?.click()
          }}
          disabled={isUploading || !tenantId}
          aria-label="Upload Image"
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors disabled:opacity-50 flex items-center justify-center"
          title="Sisipkan Gambar (Upload & Compress)"
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={addYoutubeVideo}
          aria-label="Embed YouTube"
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors flex items-center justify-center"
          title="Sisipkan Video YouTube"
        >
          <YoutubeIcon className="h-4 w-4 text-red-500" />
        </button>

        <div className="w-[1px] h-6 bg-border mx-1 self-center" />
        <ToggleButton
          isActive={editor.isActive({ textAlign: 'left' })}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          ariaLabel="Align left"
        >
          <AlignLeft className="h-4 w-4" />
        </ToggleButton>
        <ToggleButton
          isActive={editor.isActive({ textAlign: 'center' })}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          ariaLabel="Align center"
        >
          <AlignCenter className="h-4 w-4" />
        </ToggleButton>
        <ToggleButton
          isActive={editor.isActive({ textAlign: 'right' })}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          ariaLabel="Align right"
        >
          <AlignRight className="h-4 w-4" />
        </ToggleButton>
        <ToggleButton
          isActive={editor.isActive({ textAlign: 'justify' })}
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          ariaLabel="Justify"
        >
          <AlignJustify className="h-4 w-4" />
        </ToggleButton>
        <div className="w-[1px] h-6 bg-border mx-1 self-center" />
        <ToggleButton
          isActive={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          ariaLabel="Toggle bullet list"
        >
          <List className="h-4 w-4" />
        </ToggleButton>
        <ToggleButton
          isActive={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          ariaLabel="Toggle ordered list"
        >
          <ListOrdered className="h-4 w-4" />
        </ToggleButton>
        <ToggleButton
          isActive={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          ariaLabel="Toggle blockquote"
        >
          <Quote className="h-4 w-4" />
        </ToggleButton>

        <div className="w-[1px] h-6 bg-border mx-1 self-center hidden sm:block" />
        <ToggleButton
          isActive={editor.isActive('table')}
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          ariaLabel="Insert table"
        >
          <TableIcon className="h-4 w-4" />
        </ToggleButton>
        {editor.isActive('table') && (
          <div className="flex items-center bg-muted/50 rounded-md border border-border/50 px-1 ml-1">
            <ToggleButton
              isActive={false}
              onClick={() => editor.chain().focus().addRowAfter().run()}
              ariaLabel="Add row"
            >
              <Rows3 className="h-4 w-4" />
            </ToggleButton>
            <ToggleButton
              isActive={false}
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              ariaLabel="Add column"
            >
              <Columns3 className="h-4 w-4" />
            </ToggleButton>
            <ToggleButton
              isActive={false}
              onClick={() => editor.chain().focus().deleteTable().run()}
              ariaLabel="Delete table"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </ToggleButton>
          </div>
        )}
        <div className="w-[1px] h-6 bg-border mx-1 self-center" />
        <button
          onClick={(e) => {
            e.preventDefault()
            editor.chain().focus().undo().run()
          }}
          disabled={!editor.can().undo()}
          className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors rounded-md hover:bg-muted"
          type="button"
          aria-label="Undo"
        >
          <Undo className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault()
            editor.chain().focus().redo().run()
          }}
          disabled={!editor.can().redo()}
          className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors rounded-md hover:bg-muted"
          type="button"
          aria-label="Redo"
        >
          <Redo className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto max-h-[600px] prose-editor-container">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
