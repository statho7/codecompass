import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { trackRepoAnalysis } from "@/lib/cookies/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 })
  }

  try {
    // Fetch GitHub data first
    const githubRes = await fetch(`${request.nextUrl.origin}/api/github?url=${encodeURIComponent(url)}`)

    if (!githubRes.ok) {
      const error = await githubRes.json()
      return NextResponse.json(error, { status: githubRes.status })
    }

    const githubData = await githubRes.json()

    // Create context for AI analysis
    const context = `
Repository: ${githubData.owner}/${githubData.repo}

README Content:
${githubData.readme.slice(0, 5000)}

Package.json:
${githubData.packageJson}

File Structure (partial):
${githubData.tree
  .map((file: any) => file.path)
  .slice(0, 50)
  .join("\n")}
    `.trim()

    // Generate analysis using Claude
    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4.5",
      prompt: `You are a senior software engineer helping new developers onboard to a codebase. Analyze the following GitHub repository and provide a comprehensive onboarding guide.

${context}

Please provide your analysis in the following JSON format:
{
  "summary": "A 2-3 sentence overview of what this project does",
  "techStack": ["Technology 1", "Technology 2", ...],
  "architecture": "A paragraph explaining the overall architecture and project structure",
  "whereToStart": "Specific guidance on which files to read first and in what order",
  "keyConcepts": ["Concept 1 explanation", "Concept 2 explanation", ...],
  "commonTasks": ["Task 1: how to do it", "Task 2: how to do it", ...],
  "importantFiles": [
    {"path": "file/path", "description": "what this file does"},
    ...
  ]
}

Be specific and actionable. Focus on helping a developer understand the codebase quickly.`,
    })

    // Parse the AI response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response")
    }

    const analysis = JSON.parse(jsonMatch[0])

    // Track this repository analysis in cookies
    await trackRepoAnalysis(url)

    return NextResponse.json(analysis)
  } catch (error) {
    console.error("[v0] Analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze repository" }, { status: 500 })
  }
}
