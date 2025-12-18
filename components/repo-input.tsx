"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowRight, Github } from "lucide-react"

interface RepoInputProps {
  onAnalyze: (url: string) => void
}

export function RepoInput({ onAnalyze }: RepoInputProps) {
  const [url, setUrl] = useState("")
  const [error, setError] = useState("")

  const validateGithubUrl = (url: string): boolean => {
    const githubPattern = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/
    return githubPattern.test(url)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!url.trim()) {
      setError("Please enter a GitHub repository URL")
      return
    }

    if (!validateGithubUrl(url.trim())) {
      setError("Please enter a valid GitHub repository URL (e.g., https://github.com/vercel/next.js)")
      return
    }

    onAnalyze(url.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <div className="relative">
          <Github className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
          <Input
            type="url"
            placeholder="https://github.com/vercel/next.js"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="pl-11 h-12 text-base"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <Button type="submit" size="lg" className="w-full">
        Analyze Repository
        <ArrowRight className="ml-2 size-4" />
      </Button>
    </form>
  )
}
