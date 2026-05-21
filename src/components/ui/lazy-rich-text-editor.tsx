import dynamic from "next/dynamic"

export const LazyRichTextEditor = dynamic(
  () => import("./rich-text-editor").then((mod) => mod.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-[200px] w-full bg-muted/30 animate-pulse rounded-md border flex items-center justify-center text-muted-foreground text-sm">
        Memuat Editor...
      </div>
    ),
  }
)
