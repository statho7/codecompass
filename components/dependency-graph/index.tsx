"use client"

import { useState } from "react"
import { Maximize2, Minimize2, AlertTriangle } from "lucide-react"
import { DependencyGraph, type GraphData, type FileNode } from "./dependency-graph"
import { FileDetailsPanel } from "./file-details-panel"
import { GraphLegend } from "./graph-legend"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DependencyGraphContainerProps {
  data: GraphData
  repoUrl: string
}

export function DependencyGraphContainer({ data, repoUrl }: DependencyGraphContainerProps) {
  const [selectedNode, setSelectedNode] = useState<FileNode | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleNavigate = (path: string) => {
    const node = data.nodes.find((n) => n.path === path)
    if (node) {
      setSelectedNode(node)
    }
  }

  if (isFullscreen) {
    return (
      <div
        className="fixed inset-0 z-50 bg-background"
        onKeyDown={(e) => {
          if (e.key === "Escape") setIsFullscreen(false)
        }}
        tabIndex={0}
      >
        <DependencyGraph data={data} onNodeSelect={setSelectedNode} selectedNode={selectedNode} repoUrl={repoUrl} />

        <GraphLegend />

        {selectedNode && (
          <FileDetailsPanel
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            onNavigate={handleNavigate}
            repoUrl={repoUrl}
          />
        )}

        {/* Fullscreen controls */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <div className="bg-card/80 backdrop-blur-sm border border-border rounded-lg px-3 py-2">
            <p className="text-xs text-muted-foreground">
              Hover to pause • Scroll to zoom • Click node for AI insights • Press ESC to exit
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="absolute top-4 right-4 bg-card/80 backdrop-blur-sm"
          onClick={() => setIsFullscreen(false)}
        >
          <Minimize2 className="size-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Display warnings if any */}
      {data.warnings && data.warnings.length > 0 && (
        <Alert variant="default" className="border-yellow-500/50 bg-yellow-500/10">
          <AlertTriangle className="size-4 text-yellow-600 dark:text-yellow-400" />
          <AlertDescription className="ml-2">
            <ul className="space-y-1 text-sm">
              {data.warnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="relative w-full h-[600px] bg-background/50 rounded-lg border border-border overflow-hidden">
        <DependencyGraph data={data} onNodeSelect={setSelectedNode} selectedNode={selectedNode} repoUrl={repoUrl} />

        <GraphLegend />

        {selectedNode && (
          <FileDetailsPanel
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            onNavigate={handleNavigate}
            repoUrl={repoUrl}
          />
        )}

        {/* Instructions */}
        <div className="absolute top-4 left-4 bg-card/80 backdrop-blur-sm border border-border rounded-lg px-3 py-2">
          <p className="text-xs text-muted-foreground">Hover to pause • Scroll to zoom • Click node for AI insights</p>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="absolute top-4 right-4 bg-card/80 backdrop-blur-sm"
          onClick={() => setIsFullscreen(true)}
        >
          <Maximize2 className="size-4" />
        </Button>
      </div>
    </div>
  )
}

export { DependencyGraph }
export type { GraphData, FileNode }
