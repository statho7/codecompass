"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, Copy } from "lucide-react"

interface CopyButtonProps {
  data: any
}

export function CopyButton({ data }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const generateMarkdown = () => {
    return `# Codebase Onboarding Guide

## Quick Summary
${data.summary}

## Tech Stack
${data.techStack.map((tech: string) => `- ${tech}`).join("\n")}

## Architecture Overview
${data.architecture}

## Where to Start
${data.whereToStart}

## Key Concepts
${data.keyConcepts.map((concept: string) => `- ${concept}`).join("\n")}

## Common Tasks
${data.commonTasks.map((task: string) => `- ${task}`).join("\n")}

## Important Files
${data.importantFiles.map((file: any) => `- **${file.path}**: ${file.description}`).join("\n")}
`
  }

  const handleCopy = async () => {
    const markdown = generateMarkdown()
    await navigator.clipboard.writeText(markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="outline" onClick={handleCopy}>
      {copied ? (
        <>
          <Check className="mr-2 size-4" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="mr-2 size-4" />
          Copy as Markdown
        </>
      )}
    </Button>
  )
}
