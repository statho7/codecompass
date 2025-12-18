"use client"

import { SectionCard } from "@/components/section-card"
import { TechStackBadges } from "@/components/tech-stack-badges"
import { FileTree } from "@/components/file-tree"
import { CopyButton } from "@/components/copy-button"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Network, Loader2 } from "lucide-react"
import { DependencyGraphContainer, type GraphData } from "@/components/dependency-graph"
import useSWR from "swr"

interface OnboardingData {
  summary: string
  techStack: string[]
  architecture: string
  whereToStart: string
  keyConcepts: string[]
  commonTasks: string[]
  importantFiles: Array<{ path: string; description: string }>
}

interface OnboardingGuideProps {
  data: OnboardingData
  repoUrl: string // Added repoUrl prop for dependency fetching
  onReset: () => void
}

export function OnboardingGuide({ data, repoUrl, onReset }: OnboardingGuideProps) {
  const {
    data: graphData,
    isLoading: graphLoading,
    error: graphError,
  } = useSWR<GraphData>(
    repoUrl ? `/api/dependencies?url=${encodeURIComponent(repoUrl)}` : null,
    async (url: string) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch dependencies")
      return res.json()
    },
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onReset}>
          <ArrowLeft className="mr-2 size-4" />
          Analyze Another Repo
        </Button>
        <CopyButton data={data} />
      </div>

      <div className="space-y-4">
        <SectionCard title="Quick Summary" defaultOpen>
          <p className="text-muted-foreground leading-relaxed">{data.summary}</p>
        </SectionCard>

        <SectionCard title="Tech Stack" defaultOpen>
          <TechStackBadges technologies={data.techStack} />
        </SectionCard>

        <SectionCard title="Where to Start" defaultOpen>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{data.whereToStart}</p>
        </SectionCard>

        <SectionCard title="Architecture Overview">
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{data.architecture}</p>
        </SectionCard>

        <SectionCard title="Key Concepts">
          <ul className="space-y-2">
            {data.keyConcepts.map((concept, idx) => (
              <li key={idx} className="flex gap-3">
                <span className="text-primary mt-1.5">•</span>
                <span className="text-muted-foreground leading-relaxed">{concept}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Common Tasks">
          <ul className="space-y-2">
            {data.commonTasks.map((task, idx) => (
              <li key={idx} className="flex gap-3">
                <span className="text-primary mt-1.5">•</span>
                <span className="text-muted-foreground leading-relaxed">{task}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Important Files">
          <FileTree files={data.importantFiles} />
        </SectionCard>

        <SectionCard title="Dependency Graph" icon={<Network className="size-4" />} defaultOpen>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Interactive 3D visualization of file dependencies. Click on nodes to explore connections.
            </p>
            {graphLoading ? (
              <div className="w-full h-[400px] bg-muted/30 rounded-lg border border-border flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="relative">
                    <div className="size-12 border-2 border-primary/30 rounded-full" />
                    <Loader2 className="size-12 absolute inset-0 text-primary animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Building dependency graph...</p>
                    <p className="text-xs text-muted-foreground">Analyzing file imports and connections</p>
                  </div>
                </div>
              </div>
            ) : graphError ? (
              <div className="w-full h-[200px] bg-destructive/5 rounded-lg border border-destructive/20 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <p className="text-sm text-destructive">Failed to build dependency graph</p>
                  <p className="text-xs text-muted-foreground">
                    The repository may be too large or have restricted access
                  </p>
                </div>
              </div>
            ) : graphData ? (
              <DependencyGraphContainer data={graphData} repoUrl={repoUrl} />
            ) : (
              <div className="w-full h-[200px] bg-muted/50 rounded-lg border border-border flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Unable to load dependency graph</p>
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
