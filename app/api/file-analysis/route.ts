import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { repoUrl, filePath } = body

    if (!repoUrl || !filePath) {
      return NextResponse.json({ error: "Missing repoUrl or filePath" }, { status: 400 })
    }

    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (!match) {
      return NextResponse.json({ error: "Invalid GitHub URL" }, { status: 400 })
    }

    const [, owner, repo] = match
    const cleanRepo = repo.replace(/\.git$/, "")

    const headers: HeadersInit = {
      Accept: "application/vnd.github.v3+json",
    }

    if (process.env.GITHUB_TOKEN) {
      headers["Authorization"] = `token ${process.env.GITHUB_TOKEN}`
    }

    const githubUrl = `https://api.github.com/repos/${owner}/${cleanRepo}/contents/${filePath}`
    const contentRes = await fetch(githubUrl, { headers })

    if (!contentRes.ok) {
      return NextResponse.json(
        { error: `Failed to fetch file: ${contentRes.status} ${contentRes.statusText}` },
        { status: contentRes.status },
      )
    }

    const data = await contentRes.json()

    if (data.size > 100000) {
      return NextResponse.json({ error: "File too large to analyze (>100KB)" }, { status: 400 })
    }

    const fileContent = Buffer.from(data.content, "base64").toString("utf-8")

    const { text } = await generateText({
      model: "anthropic/claude-haiku-4.5",
      maxOutputTokens: 2000,
      prompt: `You are helping a developer who just joined a team and needs to understand this file quickly.

File: ${filePath}

\`\`\`
${fileContent.slice(0, 4000)}
\`\`\`

Provide ACTIONABLE insights that help them work with this file. Focus on:
1. What they need to know BEFORE touching this file
2. How to actually USE this file (real import/usage examples)
3. What could go WRONG if they change it carelessly
4. Where this fits in the bigger picture

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "oneLiner": "Complete this sentence in 8 words or less: 'This file...'",
  "howToUse": {
    "import": "The exact import statement to use this file, e.g. import { X } from './path'",
    "example": "A 1-2 line code example showing typical usage"
  },
  "beforeYouEdit": [
    "Critical thing #1 to know before editing",
    "Critical thing #2 (if applicable)"
  ],
  "dangerZones": [
    "What could break if changed carelessly (be specific)"
  ],
  "architectureRole": "One sentence: where does this fit in the app architecture? What depends on it?"
}

Be specific and practical. Avoid generic statements like "handles data" or "manages state". Give real, actionable guidance.`,
    })

    let analysis
    try {
      analysis = JSON.parse(text)
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 })
      }
      try {
        analysis = JSON.parse(jsonMatch[0])
      } catch {
        return NextResponse.json({ error: "Failed to parse AI response JSON" }, { status: 500 })
      }
    }

    return NextResponse.json({
      analysis,
      fileContent: fileContent.slice(0, 2000),
    })
  } catch (error) {
    console.error("[v0] File analysis error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json({ error: `Analysis failed: ${errorMessage}` }, { status: 500 })
  }
}
