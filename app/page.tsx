"use client"

import { useState } from "react"
import { RepoInput } from "@/components/repo-input"
import { AnalysisLoader } from "@/components/analysis-loader"
import { OnboardingGuide } from "@/components/onboarding-guide"
import { StatsDashboard } from "@/components/stats-dashboard"
import { RecentRepos } from "@/components/recent-repos"
import { Github } from "lucide-react"
import useSWR from "swr"

export default function HomePage() {
  const [repoUrl, setRepoUrl] = useState<string>("")
  const [submittedUrl, setSubmittedUrl] = useState<string>("")

  const { data, error, isLoading } = useSWR(
    submittedUrl ? `/api/analyze?url=${encodeURIComponent(submittedUrl)}` : null,
    async (url: string) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to analyze repository")
      return res.json()
    },
  )

  const handleAnalyze = (url: string) => {
    setSubmittedUrl(url)
  }

  const handleRecentRepoSelect = (url: string) => {
    setRepoUrl(url)
    setSubmittedUrl(url)
  }

  const getGithubUrl = () => {
    if (!submittedUrl) return null
    return submittedUrl
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-mono font-bold text-sm">CC</span>
            </div>
            <h1 className="text-xl font-semibold">CodeCompass</h1>
          </div>
          {getGithubUrl() && (
            <a
              href={getGithubUrl()!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="size-4" />
              View on GitHub
            </a>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {!submittedUrl ? (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold tracking-tight">Onboard to any codebase in minutes</h2>
              <p className="text-lg text-muted-foreground">
                Paste a GitHub repository URL and get an AI-powered guide to understanding the codebase architecture,
                tech stack, and where to start.
              </p>
            </div>
            <RepoInput onAnalyze={handleAnalyze} />

            {/* Statistics and Recent Repos */}
            <div className="grid grid-cols-1 gap-6 mt-8">
              <StatsDashboard />
              <RecentRepos onSelect={handleRecentRepoSelect} />
            </div>
          </div>
        ) : isLoading ? (
          <AnalysisLoader />
        ) : error ? (
          <div className="max-w-4xl mx-auto">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
              <p className="text-destructive font-medium">Failed to analyze repository</p>
              <p className="text-sm text-muted-foreground mt-2">
                {error.message || "Please check the URL and try again."}
              </p>
              <button onClick={() => setSubmittedUrl("")} className="mt-4 text-sm underline hover:no-underline">
                Try another repository
              </button>
            </div>
          </div>
        ) : data ? (
          <OnboardingGuide data={data} repoUrl={submittedUrl} onReset={() => setSubmittedUrl("")} />
        ) : null}
      </main>
    </div>
  )
}
