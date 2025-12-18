import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 })
  }

  try {
    // Extract owner and repo from GitHub URL
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (!match) {
      return NextResponse.json({ error: "Invalid GitHub URL" }, { status: 400 })
    }

    const [, owner, repo] = match
    const cleanRepo = repo.replace(/\.git$/, "")

    // Fetch repository data
    const headers: HeadersInit = {
      Accept: "application/vnd.github.v3+json",
    }

    // Add token if available
    if (process.env.GITHUB_TOKEN) {
      headers["Authorization"] = `token ${process.env.GITHUB_TOKEN}`
    }

    // Fetch README
    const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/readme`, { headers })
    const readme = readmeRes.ok ? await readmeRes.json() : null
    const readmeContent = readme ? Buffer.from(readme.content, "base64").toString("utf-8") : ""

    // Fetch package.json
    const packageRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/contents/package.json`, {
      headers,
    })
    const packageJson = packageRes.ok ? await packageRes.json() : null
    const packageContent = packageJson ? Buffer.from(packageJson.content, "base64").toString("utf-8") : ""

    // Fetch directory tree
    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/git/trees/main?recursive=1`, {
      headers,
    })
    let tree = []
    if (treeRes.ok) {
      const treeData = await treeRes.json()
      tree = treeData.tree || []
    } else {
      // Try master branch if main doesn't exist
      const masterTreeRes = await fetch(
        `https://api.github.com/repos/${owner}/${cleanRepo}/git/trees/master?recursive=1`,
        { headers },
      )
      if (masterTreeRes.ok) {
        const treeData = await masterTreeRes.json()
        tree = treeData.tree || []
      }
    }

    return NextResponse.json({
      readme: readmeContent,
      packageJson: packageContent,
      tree: tree.slice(0, 100), // Limit tree size
      owner,
      repo: cleanRepo,
    })
  } catch (error) {
    console.error("[v0] GitHub API error:", error)
    return NextResponse.json({ error: "Failed to fetch repository data" }, { status: 500 })
  }
}
