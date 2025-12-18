import { FileCode } from "lucide-react"

interface FileTreeProps {
  files: Array<{ path: string; description: string }>
}

export function FileTree({ files }: FileTreeProps) {
  return (
    <div className="space-y-3">
      {files.map((file, idx) => (
        <div key={idx} className="flex gap-3 p-3 rounded-lg bg-muted/50 border border-border">
          <FileCode className="size-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1 min-w-0">
            <p className="font-mono text-sm text-foreground break-all">{file.path}</p>
            <p className="text-sm text-muted-foreground">{file.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
