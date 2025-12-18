"use client"

import { useState, useEffect } from "react"
import {
  X,
  FileCode,
  ArrowDownToLine,
  ArrowUpFromLine,
  Sparkles,
  Loader2,
  AlertTriangle,
  Code2,
  Compass,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { FileNode } from "./dependency-graph"

interface FileAnalysis {
  oneLiner: string
  howToUse: {
    import: string
    example: string
  }
  beforeYouEdit: string[]
  dangerZones: string[]
  architectureRole: string
}

interface FileDetailsPanelProps {
  node: FileNode
  onClose: () => void
  onNavigate: (path: string) => void
  repoUrl: string
}

const TYPE_LABELS: Record<FileNode["type"], string> = {
  component: "Component",
  util: "Utility",
  api: "API Route",
  page: "Page",
  config: "Config",
  style: "Stylesheet",
  other: "File",
}

const TYPE_COLORS: Record<FileNode["type"], string> = {
  component: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  util: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  api: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  page: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  config: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  style: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  other: "bg-gray-500/20 text-gray-400 border-gray-500/30",
}

function CopyableCode({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="relative group">
        <pre className="text-xs bg-black/40 border border-border rounded-md px-3 py-2 overflow-x-auto font-mono text-emerald-400">
          {code}
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-1.5 right-1.5 p-1 rounded bg-muted/80 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? <Check className="size-3 text-green-400" /> : <Copy className="size-3 text-muted-foreground" />}
        </button>
      </div>
    </div>
  )
}

export function FileDetailsPanel({ node, onClose, onNavigate, repoUrl }: FileDetailsPanelProps) {
  const [analysis, setAnalysis] = useState<FileAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileName = node.path.split("/").pop() || node.path
  const directory = node.path.split("/").slice(0, -1).join("/") || "/"

  const getGitHubFileUrl = () => {
    // repoUrl is like "https://github.com/owner/repo"
    // We need to construct: "https://github.com/owner/repo/blob/main/{filepath}"
    const baseUrl = repoUrl.replace(/\/$/, "") // Remove trailing slash if any
    return `${baseUrl}/blob/main/${node.path}`
  }

  useEffect(() => {
    async function fetchAnalysis() {
      setIsLoading(true)
      setError(null)
      setAnalysis(null)

      try {
        const res = await fetch("/api/file-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repoUrl, filePath: node.path }),
        })

        const contentType = res.headers.get("content-type")
        const responseText = await res.text()

        if (!contentType || !contentType.includes("application/json")) {
          throw new Error(responseText || "Server returned non-JSON response")
        }

        let data
        try {
          data = JSON.parse(responseText)
        } catch {
          throw new Error(`Invalid JSON response: ${responseText.slice(0, 100)}`)
        }

        if (!res.ok) {
          throw new Error(data.error || "Failed to analyze file")
        }

        setAnalysis(data.analysis)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to analyze file"
        setError(errorMsg)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalysis()
  }, [node.path, repoUrl])

  return (
    <div className="absolute top-4 right-4 w-[420px] max-h-[calc(100%-2rem)] bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-xl overflow-hidden flex flex-col z-50">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 p-4 border-b border-border flex-shrink-0">
        <div className="flex items-start gap-3 min-w-0">
          <div className="size-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <FileCode className="size-6 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-2xl truncate leading-tight" title={fileName}>
              {fileName}
            </h3>
            <p className="text-sm text-muted-foreground truncate" title={directory}>
              {directory}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => window.open(getGitHubFileUrl(), "_blank")}
            title="View on GitHub"
          >
            <ExternalLink className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="overflow-y-auto flex-1">
        {/* Type Badge & One-liner */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded text-sm font-medium border ${TYPE_COLORS[node.type]}`}
            >
              {TYPE_LABELS[node.type]}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5 bg-transparent"
              onClick={() => window.open(getGitHubFileUrl(), "_blank")}
            >
              <ExternalLink className="size-3" />
              View on GitHub
            </Button>
          </div>
          {analysis && <p className="mt-2 text-sm text-foreground font-medium">{analysis.oneLiner}</p>}
        </div>

        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 text-sm font-medium mb-3">
            <Sparkles className="size-4 text-blue-400" />
            <span>Quick Start Guide</span>
          </div>

          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="size-4 animate-spin" />
              <span>Analyzing file...</span>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          {analysis && (
            <div className="space-y-4">
              {/* How to Use - with copyable code */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Code2 className="size-3.5" />
                  How to Use
                </div>
                <CopyableCode code={analysis.howToUse.import} label="Import" />
                {analysis.howToUse.example && <CopyableCode code={analysis.howToUse.example} label="Example" />}
              </div>

              {/* Before You Edit */}
              {analysis.beforeYouEdit.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
                    <AlertTriangle className="size-3.5 text-amber-400" />
                    Before You Edit
                  </div>
                  <ul className="space-y-1.5">
                    {analysis.beforeYouEdit.map((item, i) => (
                      <li
                        key={i}
                        className="text-xs text-amber-200/80 bg-amber-500/10 border border-amber-500/20 rounded px-2.5 py-1.5"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Danger Zones */}
              {analysis.dangerZones.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-red-400 mb-2">
                    <AlertTriangle className="size-3.5" />
                    Danger Zones
                  </div>
                  <ul className="space-y-1.5">
                    {analysis.dangerZones.map((item, i) => (
                      <li
                        key={i}
                        className="text-xs text-red-300/80 bg-red-500/10 border border-red-500/20 rounded px-2.5 py-1.5"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Architecture Role */}
              {analysis.architectureRole && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-md px-3 py-2">
                  <div className="flex items-start gap-2">
                    <Compass className="size-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-medium text-blue-300 block mb-0.5">Architecture Role</span>
                      <p className="text-xs text-blue-200/80">{analysis.architectureRole}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Connections */}
        <div className="p-4 space-y-4">
          {/* Imports */}
          <div>
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <ArrowDownToLine className="size-4 text-muted-foreground" />
              <span>Imports ({node.imports.length})</span>
            </div>
            {node.imports.length > 0 ? (
              <ul className="space-y-1 max-h-28 overflow-y-auto">
                {node.imports.map((importPath) => (
                  <li key={importPath}>
                    <button
                      onClick={() => onNavigate(importPath)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors truncate block w-full text-left font-mono hover:bg-muted/50 px-2 py-1 rounded"
                    >
                      {importPath.split("/").pop()}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground italic">No imports</p>
            )}
          </div>

          {/* Imported By */}
          <div>
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <ArrowUpFromLine className="size-4 text-muted-foreground" />
              <span>Imported by ({node.importedBy.length})</span>
            </div>
            {node.importedBy.length > 0 ? (
              <ul className="space-y-1 max-h-28 overflow-y-auto">
                {node.importedBy.map((path) => (
                  <li key={path}>
                    <button
                      onClick={() => onNavigate(path)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors truncate block w-full text-left font-mono hover:bg-muted/50 px-2 py-1 rounded"
                    >
                      {path.split("/").pop()}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground italic">Not imported anywhere</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Footer */}
      <div className="px-4 py-3 bg-muted/50 border-t border-border flex-shrink-0">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Total connections</span>
          <span className="font-medium text-foreground">{node.imports.length + node.importedBy.length}</span>
        </div>
      </div>
    </div>
  )
}
