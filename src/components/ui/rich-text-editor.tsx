"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import TextAlign from "@tiptap/extension-text-align"
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
  AlignJustify
} from "lucide-react"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
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
  // Ini berguna jika data dimuat secara asinkron (misal saat edit artikel)
  // Kita cek if (editor && value !== editor.getHTML()) tapi berhati-hati dengan loop
  // Sebaiknya di-handle dari parent component saat set initial data, tapi untuk jaga-jaga:
  /* useEffect(() => {
       if (editor && value !== editor.getHTML()) {
         editor.commands.setContent(value)
       }
     }, [value, editor]) 
  */

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
